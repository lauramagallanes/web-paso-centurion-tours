#!/bin/bash

# Script de monitoreo durante la implementación
# Uso: ./monitor-implementation.sh

API_BASE="https://53dmek6dqk.execute-api.us-east-1.amazonaws.com"
FRONTEND_URL="https://tinambu-frontend-dev.s3-website-us-east-1.amazonaws.com"

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=== 📊 MONITOR DE IMPLEMENTACIÓN EN TIEMPO REAL ===${NC}"
echo "API: $API_BASE"
echo "Frontend: $FRONTEND_URL"
echo ""

# Función para verificar estado
check_status() {
    local name=$1
    local url=$2
    local expected=$3
    
    response=$(curl -s -w "%{http_code}" -o /dev/null "$url" 2>/dev/null)
    
    if [ "$response" = "$expected" ]; then
        echo -e "${GREEN}✅ $name: OK ($response)${NC}"
        return 0
    else
        echo -e "${RED}❌ $name: FAIL ($response)${NC}"
        return 1
    fi
}

# Función de monitoreo continuo
monitor_loop() {
    local iteration=1
    
    while true; do
        echo -e "${BLUE}--- Iteración $iteration ($(date +%H:%M:%S)) ---${NC}"
        
        # Verificar endpoints básicos
        echo -n "Backend Básico: "
        check_status "Basic" "$API_BASE/basic" "200"
        
        # Verificar endpoints de auth
        echo -n "Auth Endpoints: "
        if check_status "Auth" "$API_BASE/auth/info" "200"; then
            echo -e "${GREEN}  🎉 ¡JAR SUBIDO EXITOSAMENTE!${NC}"
        fi
        
        # Verificar frontend
        echo -n "Frontend S3: "
        if check_status "Frontend" "$FRONTEND_URL" "200"; then
            echo -e "${GREEN}  🎉 ¡S3 CONFIGURADO EXITOSAMENTE!${NC}"
        fi
        
        echo ""
        
        # Verificar si todo está funcionando
        auth_ok=$(curl -s -w "%{http_code}" -o /dev/null "$API_BASE/auth/info" 2>/dev/null)
        frontend_ok=$(curl -s -w "%{http_code}" -o /dev/null "$FRONTEND_URL" 2>/dev/null)
        
        if [ "$auth_ok" = "200" ] && [ "$frontend_ok" = "200" ]; then
            echo -e "${GREEN}🎉🎉🎉 ¡IMPLEMENTACIÓN COMPLETADA! 🎉🎉🎉${NC}"
            echo ""
            echo -e "${GREEN}✅ Backend completo funcionando${NC}"
            echo -e "${GREEN}✅ Frontend accesible${NC}"
            echo -e "${GREEN}✅ Sistema 100% operativo${NC}"
            echo ""
            echo "URLs finales:"
            echo "- API: $API_BASE"
            echo "- Frontend: $FRONTEND_URL"
            break
        fi
        
        sleep 10
        iteration=$((iteration + 1))
    done
}

# Función de test único
single_test() {
    echo -e "${BLUE}=== 📊 TEST ÚNICO ===${NC}"
    
    echo "1. Backend básico:"
    check_status "  /basic" "$API_BASE/basic" "200"
    check_status "  /simple" "$API_BASE/simple" "200"
    check_status "  /ping" "$API_BASE/ping" "200"
    
    echo ""
    echo "2. Endpoints de autenticación:"
    check_status "  /auth/info" "$API_BASE/auth/info" "200"
    
    if [ "$(curl -s -w "%{http_code}" -o /dev/null "$API_BASE/auth/info")" = "200" ]; then
        echo -e "${GREEN}  ✅ JAR actualizado está funcionando${NC}"
        
        # Test login
        login_response=$(curl -s -w "%{http_code}" -o /tmp/login_test.txt \
            -X POST "$API_BASE/auth/login" \
            -H "Content-Type: application/json" \
            -d '{"email":"test@example.com","password":"test123"}' 2>/dev/null)
        
        if [ "$login_response" = "200" ]; then
            echo -e "${GREEN}  ✅ Login endpoint funcionando${NC}"
            echo "     Response: $(head -c 100 /tmp/login_test.txt)..."
        else
            echo -e "${YELLOW}  ⚠️  Login endpoint: $login_response${NC}"
        fi
    else
        echo -e "${RED}  ❌ JAR necesita ser subido (PASO 1)${NC}"
    fi
    
    echo ""
    echo "3. Frontend:"
    if check_status "  S3 Website" "$FRONTEND_URL" "200"; then
        echo -e "${GREEN}  ✅ Frontend completamente funcional${NC}"
    else
        echo -e "${RED}  ❌ S3 necesita configuración (PASO 2)${NC}"
    fi
    
    rm -f /tmp/login_test.txt
}

# Menú principal
echo "¿Qué quieres hacer?"
echo "1. 📊 Test único del estado actual"
echo "2. 🔄 Monitoreo continuo (durante implementación)"
echo "3. 🧪 Test completo con detalles"
echo ""
read -p "Selecciona opción (1-3): " choice

case $choice in
    1)
        single_test
        ;;
    2)
        echo -e "${BLUE}Iniciando monitoreo continuo...${NC}"
        echo "Presiona Ctrl+C para salir"
        echo ""
        monitor_loop
        ;;
    3)
        ./test-complete-system.sh
        ;;
    *)
        echo "Opción no válida, ejecutando test único..."
        single_test
        ;;
esac
