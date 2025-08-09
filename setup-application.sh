#!/bin/bash

# =============================================================================
# SCRIPT DE CONFIGURACIÓN Y EJECUCIÓN - TINAMBÚ PASO CENTURIÓN TOURS
# =============================================================================
# 
# Este script automatiza todo el proceso de configuración y ejecución de la
# aplicación full-stack (React + Spring Boot + PostgreSQL) usando Docker.
#
# REQUISITOS PREVIOS:
# - Docker y Docker Compose instalados
# - Git instalado
# - Puertos 80, 8080 y 5432 disponibles
#
# EJECUCIÓN:
# chmod +x setup-application.sh
# ./setup-application.sh
#
# =============================================================================

set -e  # Terminar el script si hay algún error

# Colores para output más legible
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Función para mostrar mensajes con colores
print_step() {
    echo -e "${BLUE}[PASO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[ÉXITO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[ADVERTENCIA]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_info() {
    echo -e "${PURPLE}[INFO]${NC} $1"
}

# =============================================================================
# PASO 1: VERIFICACIÓN DE REQUISITOS PREVIOS
# =============================================================================

print_step "Verificando requisitos previos..."

# Verificar Docker
if ! command -v docker &> /dev/null; then
    print_error "Docker no está instalado. Por favor instala Docker antes de continuar."
    echo "Visita: https://docs.docker.com/get-docker/"
    exit 1
fi

# Verificar Docker Compose
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    print_error "Docker Compose no está instalado. Por favor instala Docker Compose antes de continuar."
    echo "Visita: https://docs.docker.com/compose/install/"
    exit 1
fi

# Verificar puertos disponibles
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null; then
        print_warning "El puerto $1 está en uso. La aplicación podría no funcionar correctamente."
        return 1
    fi
    return 0
}

print_info "Verificando disponibilidad de puertos..."
check_port 80 || print_warning "Puerto 80 (Frontend) en uso"
check_port 8080 || print_warning "Puerto 8080 (Backend) en uso"  
check_port 5432 || print_warning "Puerto 5432 (PostgreSQL) en uso"

print_success "Verificación de requisitos completada"

# =============================================================================
# PASO 2: CONFIGURACIÓN DEL ENTORNO
# =============================================================================

print_step "Configurando archivo de entorno..."

# Crear archivo .env si no existe
if [ ! -f .env ]; then
    print_info "Creando archivo .env desde env.example..."
    if [ -f env.example ]; then
        cp env.example .env
        print_success "Archivo .env creado desde env.example"
    else
        print_info "Creando archivo .env con configuración por defecto..."
        cat > .env << EOF
# Database Configuration
DB_HOST=postgres
DB_PORT=5432
DB_NAME=tinambu_tours
DB_USERNAME=postgres
DB_PASSWORD=secure_password_2024

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here-must-be-at-least-256-bits-long-for-security

# Application Configuration
BACKEND_PORT=8080
FRONTEND_PORT=80
SHOW_SQL=false
LOG_LEVEL=INFO
SQL_LOG_LEVEL=WARN

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,http://localhost:80

# AWS Configuration (para producción)
AWS_ACCESS_KEY_ID=YOUR_ACCESS_KEY
AWS_SECRET_ACCESS_KEY=YOUR_SECRET_KEY
AWS_REGION=us-east-1
S3_BUCKET_NAME=tinambu-tours-media
EOF
        print_success "Archivo .env creado con configuración por defecto"
    fi
else
    print_info "Archivo .env ya existe, usando configuración existente"
fi

# =============================================================================
# PASO 3: CONSTRUCCIÓN DE IMÁGENES DOCKER
# =============================================================================

print_step "Construyendo imágenes Docker..."

print_info "Esto puede tomar varios minutos la primera vez..."

# Construir todas las imágenes
if docker compose build; then
    print_success "Imágenes Docker construidas exitosamente"
else
    print_error "Error al construir las imágenes Docker"
    exit 1
fi

# =============================================================================
# PASO 4: INICIALIZACIÓN DE LA BASE DE DATOS
# =============================================================================

print_step "Inicializando base de datos PostgreSQL..."

# Iniciar solo PostgreSQL primero
print_info "Iniciando contenedor de PostgreSQL..."
if docker compose up postgres -d; then
    print_success "PostgreSQL iniciado"
else
    print_error "Error al iniciar PostgreSQL"
    exit 1
fi

# Esperar a que PostgreSQL esté listo
print_info "Esperando a que PostgreSQL esté listo..."
sleep 10

# Verificar conexión a la base de datos
max_attempts=30
attempt=1

while [ $attempt -le $max_attempts ]; do
    if docker compose exec postgres pg_isready -U postgres > /dev/null 2>&1; then
        print_success "PostgreSQL está listo para recibir conexiones"
        break
    fi
    
    if [ $attempt -eq $max_attempts ]; then
        print_error "PostgreSQL no respondió después de $max_attempts intentos"
        print_info "Verificando logs de PostgreSQL:"
        docker compose logs postgres --tail=20
        exit 1
    fi
    
    print_info "Intento $attempt/$max_attempts - Esperando PostgreSQL..."
    sleep 2
    ((attempt++))
done

# =============================================================================
# PASO 5: INICIALIZACIÓN DEL BACKEND
# =============================================================================

print_step "Iniciando backend (Spring Boot)..."

# Iniciar backend
if docker compose up backend -d; then
    print_success "Backend iniciado"
else
    print_error "Error al iniciar el backend"
    docker compose logs backend --tail=20
    exit 1
fi

# Esperar a que el backend esté listo
print_info "Esperando a que el backend esté listo..."
max_attempts=60
attempt=1

while [ $attempt -le $max_attempts ]; do
    if curl -s http://localhost:8080/api/health > /dev/null 2>&1; then
        print_success "Backend está respondiendo correctamente"
        break
    fi
    
    if [ $attempt -eq $max_attempts ]; then
        print_error "Backend no respondió después de $max_attempts intentos"
        print_info "Verificando logs del backend:"
        docker compose logs backend --tail=30
        exit 1
    fi
    
    print_info "Intento $attempt/$max_attempts - Esperando backend..."
    sleep 3
    ((attempt++))
done

# =============================================================================
# PASO 6: CONFIGURACIÓN INICIAL DE DATOS
# =============================================================================

print_step "Configurando datos iniciales..."

# Crear usuario administrador
print_info "Creando usuario administrador..."

# Verificar si el usuario admin ya existe
if docker compose exec postgres psql -U postgres -d tinambu_tours -c "SELECT email FROM usuarios.usuarios WHERE email='admin@tinambu.com';" | grep -q "admin@tinambu.com"; then
    print_info "Usuario administrador ya existe"
else
    print_info "Creando nuevo usuario administrador..."
    
    # Crear usuario admin usando el endpoint de signup
    signup_response=$(curl -s -X POST http://localhost:8080/api/auth/signup \
        -H "Content-Type: application/json" \
        -d '{"email":"admin@tinambu.com","password":"admin123","nombreCompleto":"Administrador"}' || echo '{"success":false}')
    
    if echo "$signup_response" | grep -q '"success":true'; then
        print_success "Usuario administrador creado exitosamente"
        
        # Cambiar tipo de usuario a ADMIN
        print_info "Configurando permisos de administrador..."
        if docker compose exec postgres psql -U postgres -d tinambu_tours -c "UPDATE usuarios.usuarios SET tipo='ADMIN' WHERE email='admin@tinambu.com';"; then
            print_success "Permisos de administrador configurados"
        else
            print_warning "Error al configurar permisos de administrador"
        fi
    else
        print_warning "No se pudo crear el usuario administrador automáticamente"
        print_info "Puedes crearlo manualmente después usando el endpoint /api/auth/signup"
    fi
fi

# =============================================================================
# PASO 7: INICIALIZACIÓN DEL FRONTEND
# =============================================================================

print_step "Iniciando frontend (React)..."

# Iniciar frontend
if docker compose up frontend -d; then
    print_success "Frontend iniciado"
else
    print_error "Error al iniciar el frontend"
    docker compose logs frontend --tail=20
    exit 1
fi

# Esperar a que el frontend esté listo
print_info "Esperando a que el frontend esté listo..."
max_attempts=30
attempt=1

while [ $attempt -le $max_attempts ]; do
    if curl -s http://localhost:80 > /dev/null 2>&1; then
        print_success "Frontend está respondiendo correctamente"
        break
    fi
    
    if [ $attempt -eq $max_attempts ]; then
        print_error "Frontend no respondió después de $max_attempts intentos"
        print_info "Verificando logs del frontend:"
        docker compose logs frontend --tail=20
        exit 1
    fi
    
    print_info "Intento $attempt/$max_attempts - Esperando frontend..."
    sleep 2
    ((attempt++))
done

# =============================================================================
# PASO 8: VERIFICACIÓN FINAL Y PRUEBAS
# =============================================================================

print_step "Realizando verificaciones finales..."

# Verificar estado de todos los contenedores
print_info "Verificando estado de contenedores:"
docker compose ps

# Probar endpoints principales
print_info "Probando conectividad de servicios..."

# Test backend health
if curl -s http://localhost:8080/api/health | grep -q "UP\|success"; then
    print_success "✓ Backend health check: OK"
else
    print_warning "✗ Backend health check: FALLO"
fi

# Test frontend
if curl -s http://localhost:80 | grep -q "html\|HTML"; then
    print_success "✓ Frontend: OK"
else
    print_warning "✗ Frontend: FALLO"
fi

# Test database connection
if docker compose exec postgres psql -U postgres -d tinambu_tours -c "SELECT 1;" > /dev/null 2>&1; then
    print_success "✓ Conexión a base de datos: OK"
else
    print_warning "✗ Conexión a base de datos: FALLO"
fi

# =============================================================================
# PASO 9: INFORMACIÓN FINAL Y INSTRUCCIONES
# =============================================================================

print_success "¡CONFIGURACIÓN COMPLETADA EXITOSAMENTE!"

echo ""
echo "==============================================================================="
echo "                    🎉 APLICACIÓN LISTA PARA USAR 🎉"
echo "==============================================================================="
echo ""
echo "📱 FRONTEND (React):     http://localhost:80"
echo "🚀 BACKEND (Spring):     http://localhost:8080"
echo "🗄️  BASE DE DATOS:        localhost:5432"
echo ""
echo "👤 CREDENCIALES DE ADMINISTRADOR:"
echo "   Ver archivo README-LOCAL.md para detalles completos"
echo ""
echo "🔧 COMANDOS ÚTILES:"
echo "   • Ver logs:              docker compose logs [servicio]"
echo "   • Parar aplicación:      docker compose down"
echo "   • Reiniciar:             docker compose restart"
echo "   • Ver estado:            docker compose ps"
echo "   • Ejecutar tests:        npm test (frontend), mvn test (backend)"
echo ""
echo "📂 ESTRUCTURA DE LA APLICACIÓN:"
echo "   • Frontend:  React + TypeScript + Bootstrap"
echo "   • Backend:   Spring Boot + JWT + PostgreSQL"
echo "   • Database:  PostgreSQL con esquemas separados"
echo ""
echo "🧪 TESTING:"
echo "   • Tests unitarios:       npm test (frontend), mvn test (backend)"
echo "   • Tests integración:     npm run test:e2e"
echo "   • Coverage:              npm run test:coverage"
echo ""

# Mostrar información adicional si hay warnings
if docker compose ps | grep -q "Exit\|unhealthy"; then
    print_warning "Algunos contenedores pueden tener problemas. Revisa con: docker compose ps"
    echo ""
fi

print_info "Para ver los logs en tiempo real: docker compose logs -f"
print_info "Para acceder a la aplicación, abre tu navegador en: http://localhost:80"

echo ""
echo "==============================================================================="
echo "          ¡Gracias por usar Tinambú Paso Centurión Tours! 🦅"
echo "==============================================================================="
