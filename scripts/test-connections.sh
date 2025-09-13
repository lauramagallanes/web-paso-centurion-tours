#!/bin/bash

# Script para probar todas las conexiones del sistema
# Usar: ./scripts/test-connections.sh

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🌐 PRUEBA DE CONEXIONES - Tinambu Tours${NC}"
echo -e "${BLUE}======================================${NC}"
echo ""

# Cargar variables de entorno
if [ -f ".env" ]; then
    export $(grep -v '^#' .env | grep -v '^$' | xargs) 2>/dev/null || true
else
    echo -e "${RED}❌ Archivo .env no encontrado${NC}"
    exit 1
fi

# Función para probar endpoint
test_endpoint() {
    local url="$1"
    local description="$2"
    local expected_status="$3"
    
    echo -n "🔗 $description... "
    
    local response=$(curl -s -w "%{http_code}" --max-time 10 "$url" -o /dev/null 2>/dev/null || echo "000")
    
    if [ "$response" = "$expected_status" ]; then
        echo -e "${GREEN}✅ OK (HTTP $response)${NC}"
        return 0
    elif [ "$response" = "000" ]; then
        echo -e "${RED}❌ Sin conexión${NC}"
        return 1
    else
        echo -e "${YELLOW}⚠️  HTTP $response (esperado $expected_status)${NC}"
        return 1
    fi
}

# Función para probar endpoint con contenido
test_endpoint_content() {
    local url="$1"
    local description="$2"
    local expected_content="$3"
    
    echo -n "🔗 $description... "
    
    local response=$(curl -s --max-time 10 "$url" 2>/dev/null || echo "ERROR")
    
    if [[ "$response" == *"$expected_content"* ]]; then
        echo -e "${GREEN}✅ OK (contenido válido)${NC}"
        return 0
    elif [ "$response" = "ERROR" ]; then
        echo -e "${RED}❌ Sin conexión${NC}"
        return 1
    else
        echo -e "${YELLOW}⚠️  Respuesta inesperada${NC}"
        return 1
    fi
}

echo -e "${YELLOW}📋 1. Probando AWS CLI...${NC}"

# Probar AWS CLI
if aws sts get-caller-identity --profile $AWS_PROFILE &>/dev/null; then
    ACCOUNT_ID=$(aws sts get-caller-identity --profile $AWS_PROFILE --query Account --output text)
    echo -e "${GREEN}✅ AWS CLI funciona (Account: $ACCOUNT_ID)${NC}"
else
    echo -e "${RED}❌ AWS CLI no funciona${NC}"
fi

# Probar acceso a S3
if aws s3 ls s3://$FRONTEND_BUCKET --profile $AWS_PROFILE &>/dev/null; then
    echo -e "${GREEN}✅ S3 bucket accesible: $FRONTEND_BUCKET${NC}"
else
    echo -e "${RED}❌ S3 bucket no accesible: $FRONTEND_BUCKET${NC}"
fi

# Probar Lambda function
if aws lambda get-function --function-name $LAMBDA_FUNCTION_NAME --profile $AWS_PROFILE &>/dev/null; then
    echo -e "${GREEN}✅ Lambda function existe: $LAMBDA_FUNCTION_NAME${NC}"
else
    echo -e "${RED}❌ Lambda function no encontrada: $LAMBDA_FUNCTION_NAME${NC}"
fi

echo ""
echo -e "${YELLOW}📋 2. Probando API endpoints...${NC}"

if [ ! -z "$VITE_API_BASE_URL" ]; then
    # Probar endpoint básico
    test_endpoint_content "$VITE_API_BASE_URL/basic" "Endpoint básico" "Basic Test Controller"
    
    # Probar endpoint de senderos
    test_endpoint_content "$VITE_API_BASE_URL/senderos" "Senderos públicos" '"success":true'
    
    # Probar endpoint de admin senderos
    test_endpoint_content "$VITE_API_BASE_URL/senderos/admin" "Senderos admin" '"success":true'
    
    # Probar otros endpoints comunes
    test_endpoint "$VITE_API_BASE_URL/health" "Health check" "200"
    test_endpoint "$VITE_API_BASE_URL/ping" "Ping" "200"
else
    echo -e "${RED}❌ VITE_API_BASE_URL no configurada${NC}"
fi

echo ""
echo -e "${YELLOW}📋 3. Probando frontend...${NC}"

# Verificar si el frontend está deployado
if [ ! -z "$FRONTEND_BUCKET" ]; then
    FRONTEND_URL="https://$FRONTEND_BUCKET.s3.$AWS_REGION.amazonaws.com"
    
    test_endpoint "$FRONTEND_URL/" "Frontend principal" "200"
    test_endpoint "$FRONTEND_URL/admin" "Admin panel" "200"
    
    echo -e "${BLUE}🌐 URLs del sistema:${NC}"
    echo -e "   Frontend: $FRONTEND_URL"
    echo -e "   Admin: $FRONTEND_URL/admin"
    echo -e "   API: $VITE_API_BASE_URL"
fi

echo ""
echo -e "${YELLOW}📋 4. Probando build local...${NC}"

# Probar build del frontend
if [ -d "frontend" ]; then
    echo -n "🔨 Build frontend... "
    if cd frontend && npm run build &>/dev/null; then
        echo -e "${GREEN}✅ OK${NC}"
        cd ..
    else
        echo -e "${RED}❌ Falló${NC}"
        cd ..
    fi
fi

# Probar build del backend
if [ -d "backend" ]; then
    echo -n "🔨 Build backend... "
    if cd backend && mvn compile -q &>/dev/null; then
        echo -e "${GREEN}✅ OK${NC}"
        cd ..
    else
        echo -e "${RED}❌ Falló${NC}"
        cd ..
    fi
fi

echo ""
echo -e "${YELLOW}📋 5. Información del sistema...${NC}"

# Mostrar información útil
echo -e "${BLUE}📊 Estado actual:${NC}"
echo "   AWS Profile: $AWS_PROFILE"
echo "   AWS Region: $AWS_REGION"
echo "   Frontend Bucket: $FRONTEND_BUCKET"
echo "   Lambda Function: $LAMBDA_FUNCTION_NAME"
echo "   API Gateway ID: $API_GATEWAY_ID"

# Mostrar timestamp del último deploy
if aws s3api head-object --bucket $FRONTEND_BUCKET --key index.html --profile $AWS_PROFILE &>/dev/null; then
    LAST_MODIFIED=$(aws s3api head-object --bucket $FRONTEND_BUCKET --key index.html --profile $AWS_PROFILE --query LastModified --output text)
    echo "   Último deploy frontend: $LAST_MODIFIED"
fi

if aws lambda get-function --function-name $LAMBDA_FUNCTION_NAME --profile $AWS_PROFILE &>/dev/null; then
    LAST_MODIFIED=$(aws lambda get-function --function-name $LAMBDA_FUNCTION_NAME --profile $AWS_PROFILE --query Configuration.LastModified --output text)
    echo "   Último deploy backend: $LAST_MODIFIED"
fi

echo ""
echo -e "${GREEN}🎯 Prueba de conexiones completada${NC}"
