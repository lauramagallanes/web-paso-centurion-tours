#!/bin/bash

# Validación rápida de configuración
# Usar: ./scripts/quick-check.sh

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🔍 Quick Check - Configuración${NC}"
echo "================================"

# Verificar archivo .env
if [ -f ".env" ]; then
    echo -e "${GREEN}✅ .env existe${NC}"
    export $(grep -v '^#' .env | grep -v '^$' | xargs) 2>/dev/null || true
else
    echo -e "${RED}❌ .env no encontrado${NC}"
    echo -e "${YELLOW}💡 Ejecuta: cp ENV-TEMPLATE.txt .env${NC}"
    exit 1
fi

# Variables críticas
CRITICAL_VARS=("VITE_API_BASE_URL" "AWS_PROFILE" "FRONTEND_BUCKET" "API_GATEWAY_ID")
MISSING=0

for var in "${CRITICAL_VARS[@]}"; do
    if [ -z "${!var}" ] || [[ "${!var}" == *"your-"* ]]; then
        echo -e "${RED}❌ $var no configurada${NC}"
        ((MISSING++))
    else
        echo -e "${GREEN}✅ $var: ${!var}${NC}"
    fi
done

# AWS CLI
if aws sts get-caller-identity --profile $AWS_PROFILE &>/dev/null; then
    echo -e "${GREEN}✅ AWS CLI funciona${NC}"
else
    echo -e "${RED}❌ AWS CLI no funciona${NC}"
    ((MISSING++))
fi

echo ""
if [ $MISSING -eq 0 ]; then
    echo -e "${GREEN}🎉 Todo configurado correctamente${NC}"
    exit 0
else
    echo -e "${RED}❌ $MISSING problemas encontrados${NC}"
    echo -e "${YELLOW}💡 Ejecuta ./scripts/validate-env.sh para detalles${NC}"
    exit 1
fi
