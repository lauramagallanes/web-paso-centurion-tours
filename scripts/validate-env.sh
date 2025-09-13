#!/bin/bash

# Script para validar configuración de variables de entorno
# Usar: ./scripts/validate-env.sh

set -e  # Exit on error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 VALIDACIÓN DE CONFIGURACIÓN - Tinambu Tours${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Contadores para el reporte final
ERRORS=0
WARNINGS=0
SUCCESS=0

# Función para mostrar error
show_error() {
    echo -e "${RED}❌ ERROR: $1${NC}"
    ((ERRORS++))
}

# Función para mostrar warning
show_warning() {
    echo -e "${YELLOW}⚠️  WARNING: $1${NC}"
    ((WARNINGS++))
}

# Función para mostrar éxito
show_success() {
    echo -e "${GREEN}✅ $1${NC}"
    ((SUCCESS++))
}

# Función para validar que una variable no sea un placeholder
is_placeholder() {
    local value="$1"
    if [[ "$value" == *"your-"* ]] || [[ "$value" == *"[API_GATEWAY_ID]"* ]] || [[ "$value" == *"example.com"* ]]; then
        return 0  # Es un placeholder
    fi
    return 1  # No es un placeholder
}

echo -e "${YELLOW}📋 1. Verificando archivos de configuración...${NC}"

# Verificar que existe .env
if [ -f ".env" ]; then
    show_success "Archivo .env encontrado"
    # Cargar variables del .env
    export $(grep -v '^#' .env | grep -v '^$' | xargs) 2>/dev/null || true
else
    show_error "Archivo .env no encontrado"
    echo -e "${YELLOW}   💡 Ejecuta: cp ENV-TEMPLATE.txt .env${NC}"
    echo -e "${YELLOW}   💡 Luego edita .env con tus valores reales${NC}"
    ((ERRORS++))
fi

echo ""
echo -e "${YELLOW}📋 2. Validando variables requeridas...${NC}"

# Lista de variables requeridas
REQUIRED_VARS=(
    "VITE_API_BASE_URL"
    "AWS_PROFILE" 
    "AWS_REGION"
    "FRONTEND_BUCKET"
    "ASSETS_BUCKET"
    "LAMBDA_FUNCTION_NAME"
    "API_GATEWAY_ID"
    "INTEGRATION_ID"
)

# Validar cada variable requerida
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        show_error "Variable $var no está definida"
    elif is_placeholder "${!var}"; then
        show_error "Variable $var contiene placeholder '${!var}' - necesita valor real"
    else
        show_success "Variable $var configurada: ${!var}"
    fi
done

echo ""
echo -e "${YELLOW}📋 3. Validando formatos de variables...${NC}"

# Validar formato de API Gateway ID
if [ ! -z "$API_GATEWAY_ID" ] && ! is_placeholder "$API_GATEWAY_ID"; then
    if [[ "$API_GATEWAY_ID" =~ ^[a-z0-9]{10}$ ]]; then
        show_success "API_GATEWAY_ID tiene formato válido"
    else
        show_error "API_GATEWAY_ID formato inválido. Debe ser 10 caracteres alfanuméricos"
    fi
fi

# Validar formato de URL de API
if [ ! -z "$VITE_API_BASE_URL" ] && ! is_placeholder "$VITE_API_BASE_URL"; then
    if [[ "$VITE_API_BASE_URL" =~ ^https://.*\.execute-api\..*\.amazonaws\.com$ ]]; then
        show_success "VITE_API_BASE_URL tiene formato válido"
    else
        show_error "VITE_API_BASE_URL formato inválido. Debe ser URL de API Gateway"
    fi
fi

# Validar formato de buckets S3
if [ ! -z "$FRONTEND_BUCKET" ] && ! is_placeholder "$FRONTEND_BUCKET"; then
    if [[ "$FRONTEND_BUCKET" =~ ^[a-z0-9][a-z0-9-]*[a-z0-9]$ ]]; then
        show_success "FRONTEND_BUCKET tiene formato válido"
    else
        show_warning "FRONTEND_BUCKET podría tener formato inválido para S3"
    fi
fi

echo ""
echo -e "${YELLOW}📋 4. Verificando configuración de AWS CLI...${NC}"

# Verificar que AWS CLI está instalado
if command -v aws &> /dev/null; then
    show_success "AWS CLI está instalado"
    
    # Verificar que el profile existe
    if [ ! -z "$AWS_PROFILE" ]; then
        if aws configure list-profiles 2>/dev/null | grep -q "^$AWS_PROFILE$"; then
            show_success "AWS Profile '$AWS_PROFILE' encontrado"
            
            # Verificar que el profile funciona
            if aws sts get-caller-identity --profile $AWS_PROFILE &>/dev/null; then
                show_success "AWS Profile '$AWS_PROFILE' funciona correctamente"
            else
                show_error "AWS Profile '$AWS_PROFILE' no puede autenticar"
            fi
        else
            show_error "AWS Profile '$AWS_PROFILE' no encontrado"
            echo -e "${YELLOW}   💡 Ejecuta: aws configure --profile $AWS_PROFILE${NC}"
        fi
    fi
else
    show_error "AWS CLI no está instalado"
    echo -e "${YELLOW}   💡 Instala AWS CLI desde: https://aws.amazon.com/cli/${NC}"
fi

echo ""
echo -e "${YELLOW}📋 5. Verificando configuración del frontend...${NC}"

# Verificar que Node.js está instalado
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    show_success "Node.js instalado: $NODE_VERSION"
else
    show_error "Node.js no está instalado"
fi

# Verificar que npm está instalado
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    show_success "npm instalado: $NPM_VERSION"
else
    show_error "npm no está instalado"
fi

# Verificar configuración del frontend
if [ -f "frontend/package.json" ]; then
    show_success "Proyecto frontend encontrado"
    
    # Verificar .env.local del frontend
    if [ -f "frontend/.env.local" ]; then
        show_success "Frontend .env.local existe"
        
        # Verificar que contiene VITE_API_BASE_URL
        if grep -q "VITE_API_BASE_URL" frontend/.env.local; then
            show_success "VITE_API_BASE_URL configurada en frontend"
        else
            show_warning "VITE_API_BASE_URL no encontrada en frontend/.env.local"
            echo -e "${YELLOW}   💡 Ejecuta: ./scripts/setup-frontend-env.sh${NC}"
        fi
    else
        show_warning "frontend/.env.local no existe"
        echo -e "${YELLOW}   💡 Ejecuta: ./scripts/setup-frontend-env.sh${NC}"
    fi
else
    show_error "Proyecto frontend no encontrado en ./frontend/"
fi

echo ""
echo -e "${YELLOW}📋 6. Verificando backend...${NC}"

# Verificar que Java está instalado
if command -v java &> /dev/null; then
    JAVA_VERSION=$(java -version 2>&1 | head -n 1 | cut -d '"' -f 2)
    show_success "Java instalado: $JAVA_VERSION"
else
    show_error "Java no está instalado"
fi

# Verificar que Maven está instalado
if command -v mvn &> /dev/null; then
    MVN_VERSION=$(mvn --version | head -n 1 | cut -d ' ' -f 3)
    show_success "Maven instalado: $MVN_VERSION"
else
    show_error "Maven no está instalado"
fi

# Verificar proyecto backend
if [ -f "backend/pom.xml" ]; then
    show_success "Proyecto backend encontrado"
else
    show_error "Proyecto backend no encontrado en ./backend/"
fi

echo ""
echo -e "${YELLOW}📋 7. Probando conectividad...${NC}"

# Probar conectividad a API Gateway (si está configurado)
if [ ! -z "$VITE_API_BASE_URL" ] && ! is_placeholder "$VITE_API_BASE_URL"; then
    echo -e "${BLUE}   🌐 Probando conectividad a API...${NC}"
    if curl -s --max-time 10 "$VITE_API_BASE_URL/basic" > /dev/null; then
        show_success "API Gateway responde correctamente"
    else
        show_warning "API Gateway no responde (puede estar normal si backend no está deployado)"
    fi
fi

echo ""
echo -e "${BLUE}📊 REPORTE FINAL${NC}"
echo -e "${BLUE}===============${NC}"
echo -e "${GREEN}✅ Éxitos: $SUCCESS${NC}"
echo -e "${YELLOW}⚠️  Warnings: $WARNINGS${NC}"
echo -e "${RED}❌ Errores: $ERRORS${NC}"

echo ""
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}🎉 ¡CONFIGURACIÓN VÁLIDA!${NC}"
    echo -e "${GREEN}Puedes proceder con el development y deployment.${NC}"
    echo ""
    echo -e "${BLUE}🚀 Comandos disponibles:${NC}"
    echo -e "   ./scripts/deploy-all.sh      # Deploy completo"
    echo -e "   ./scripts/deploy-frontend.sh # Solo frontend"
    echo -e "   ./scripts/deploy-backend.sh  # Solo backend"
else
    echo -e "${RED}🚨 CONFIGURACIÓN INCOMPLETA${NC}"
    echo -e "${YELLOW}Por favor corrige los errores antes de continuar.${NC}"
    echo ""
    echo -e "${BLUE}💡 Guías de ayuda:${NC}"
    echo -e "   SETUP-DEVELOPMENT.md    # Guía de setup completo"
    echo -e "   SECURITY-GUIDELINES.md  # Mejores prácticas"
    echo -e "   ENV-TEMPLATE.txt        # Template de variables"
fi

echo ""
exit $ERRORS
