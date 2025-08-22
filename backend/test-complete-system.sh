#!/bin/bash

# Script de testing completo del sistema
# Uso: ./test-complete-system.sh

API_BASE="https://53dmek6dqk.execute-api.us-east-1.amazonaws.com"
FRONTEND_URL="https://tinambu-frontend-dev.s3-website-us-east-1.amazonaws.com"

echo "=== 🧪 TESTING COMPLETO DEL SISTEMA ==="
echo "API Base: $API_BASE"
echo "Frontend: $FRONTEND_URL"
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para test de endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local expected_status=$3
    local data=$4
    local description=$5
    
    echo -n "Testing $description... "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "%{http_code}" -o /tmp/response.txt "$API_BASE$endpoint")
    else
        response=$(curl -s -w "%{http_code}" -o /tmp/response.txt -X "$method" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$API_BASE$endpoint")
    fi
    
    http_code="${response: -3}"
    
    if [ "$http_code" = "$expected_status" ]; then
        echo -e "${GREEN}✅ OK ($http_code)${NC}"
        # Mostrar respuesta si es exitosa
        if [ "$http_code" = "200" ]; then
            echo "   Response: $(head -c 100 /tmp/response.txt)..."
        fi
    else
        echo -e "${RED}❌ FAIL ($http_code, expected $expected_status)${NC}"
        echo "   Response: $(cat /tmp/response.txt)"
    fi
    
    echo ""
}

# Función para test de frontend
test_frontend() {
    echo -n "Testing Frontend Access... "
    
    response=$(curl -s -w "%{http_code}" -o /tmp/frontend.txt "$FRONTEND_URL")
    http_code="${response: -3}"
    
    if [ "$http_code" = "200" ]; then
        echo -e "${GREEN}✅ OK ($http_code)${NC}"
        echo "   Frontend is accessible"
    elif [ "$http_code" = "403" ]; then
        echo -e "${RED}❌ FORBIDDEN ($http_code)${NC}"
        echo "   Frontend S3 permissions need to be fixed"
    else
        echo -e "${YELLOW}⚠️  UNKNOWN ($http_code)${NC}"
        echo "   Response: $(head -c 200 /tmp/frontend.txt)"
    fi
    
    echo ""
}

echo "📊 FASE 1: ENDPOINTS BÁSICOS (Deberían funcionar)"
echo "================================================"
test_endpoint "GET" "/basic" "200" "" "Basic Controller"
test_endpoint "GET" "/simple" "200" "" "Simple Endpoint"
test_endpoint "GET" "/ping" "200" "" "Ping Endpoint"

echo ""
echo "🔐 FASE 2: ENDPOINTS DE AUTENTICACIÓN (Requieren JAR actualizado)"
echo "=================================================================="
test_endpoint "GET" "/auth/info" "200" "" "Auth Info"
test_endpoint "POST" "/auth/login" "200" '{"email":"test@example.com","password":"test123"}' "Auth Login"
test_endpoint "POST" "/auth/signup" "200" '{"email":"new@example.com","password":"test123","name":"Test User"}' "Auth Signup"
test_endpoint "GET" "/auth/validate" "200" "" "Auth Validate"

echo ""
echo "💾 FASE 3: ENDPOINTS DE BASE DE DATOS (Requieren DB habilitada)"
echo "==============================================================="
test_endpoint "GET" "/database/info" "200" "" "Database Info"
test_endpoint "GET" "/database/test" "200" "" "Database Test"

echo ""
echo "🌐 FASE 4: FRONTEND"
echo "==================="
test_frontend

echo ""
echo "📋 RESUMEN FINAL"
echo "================"
echo ""

# Contar tests exitosos vs fallidos
total_basic=3
total_auth=4
total_db=2
total_frontend=1

echo "📊 ANÁLISIS DE RESULTADOS:"
echo ""

# Verificar si endpoints básicos funcionan
basic_working=$(curl -s -o /dev/null -w "%{http_code}" "$API_BASE/basic")
if [ "$basic_working" = "200" ]; then
    echo -e "${GREEN}✅ BACKEND BÁSICO: Funcionando${NC}"
else
    echo -e "${RED}❌ BACKEND BÁSICO: No funciona${NC}"
fi

# Verificar si endpoints de auth funcionan
auth_working=$(curl -s -o /dev/null -w "%{http_code}" "$API_BASE/auth/info")
if [ "$auth_working" = "200" ]; then
    echo -e "${GREEN}✅ ENDPOINTS AUTH: Funcionando (JAR actualizado)${NC}"
elif [ "$auth_working" = "404" ]; then
    echo -e "${RED}❌ ENDPOINTS AUTH: JAR necesita ser subido${NC}"
    echo "   👉 Ejecutar PASO 1 de IMPLEMENTATION_GUIDE.md"
else
    echo -e "${YELLOW}⚠️  ENDPOINTS AUTH: Estado desconocido ($auth_working)${NC}"
fi

# Verificar frontend
frontend_working=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL")
if [ "$frontend_working" = "200" ]; then
    echo -e "${GREEN}✅ FRONTEND: Accesible${NC}"
elif [ "$frontend_working" = "403" ]; then
    echo -e "${RED}❌ FRONTEND: Permisos S3 necesarios${NC}"
    echo "   👉 Ejecutar PASO 2 de IMPLEMENTATION_GUIDE.md"
else
    echo -e "${YELLOW}⚠️  FRONTEND: Estado desconocido ($frontend_working)${NC}"
fi

echo ""
echo "🚀 PRÓXIMOS PASOS:"
echo ""

if [ "$auth_working" != "200" ]; then
    echo "1. 🔥 CRÍTICO: Subir JAR a Lambda (PASO 1)"
fi

if [ "$frontend_working" != "200" ]; then
    echo "2. 🔥 CRÍTICO: Arreglar permisos S3 (PASO 2)"
fi

if [ "$auth_working" = "200" ] && [ "$frontend_working" = "200" ]; then
    echo "🎉 ¡SISTEMA FUNCIONANDO AL 100%!"
    echo ""
    echo "Opcional:"
    echo "3. ⚡ Aplicar cambios Terraform (PASO 3)"
fi

echo ""
echo "📖 Ver guía completa: IMPLEMENTATION_GUIDE.md"

# Limpiar archivos temporales
rm -f /tmp/response.txt /tmp/frontend.txt
