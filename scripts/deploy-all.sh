#!/bin/bash

# Script para deployar frontend y backend juntos
# Usar: ./scripts/deploy-all.sh

set -e  # Exit on error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 DEPLOY COMPLETO - Tinambu Tours${NC}"
echo -e "${BLUE}======================================${NC}"

# Verificar que existe archivo de configuración
if [ -f ".env" ]; then
    echo -e "${GREEN}📋 Cargando configuración desde .env...${NC}"
    # Cargar variables del archivo .env
    export $(grep -v '^#' .env | grep -v '^$' | xargs)
elif [ -f "deployment-config.sh" ]; then
    echo -e "${GREEN}📋 Cargando configuración desde deployment-config.sh...${NC}"
    source deployment-config.sh
else
    echo -e "${RED}❌ ERROR: Archivo .env o deployment-config.sh no encontrado${NC}"
    echo -e "${YELLOW}💡 Crea un archivo .env copiando ENV-TEMPLATE.txt${NC}"
    exit 1
fi

# Mostrar configuración
echo -e "${YELLOW}📊 Configuración actual:${NC}"
echo -e "   Frontend: $FRONTEND_BUCKET"
echo -e "   Backend: $LAMBDA_FUNCTION_NAME"
echo -e "   API: $API_GATEWAY_ID"
echo -e "   Profile: $AWS_PROFILE"
echo ""

# Confirmar antes de proceder
read -p "¿Continuar con el deployment? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}❌ Deployment cancelado${NC}"
    exit 0
fi

echo ""
echo -e "${BLUE}🔄 PASO 1: Deployando Backend...${NC}"
echo -e "${BLUE}================================${NC}"
./scripts/deploy-backend.sh

echo ""
echo -e "${BLUE}🔄 PASO 2: Deployando Frontend...${NC}"
echo -e "${BLUE}==================================${NC}"
./scripts/deploy-frontend.sh

echo ""
echo -e "${GREEN}🎉 DEPLOYMENT COMPLETO!${NC}"
echo -e "${GREEN}========================${NC}"
echo -e "${GREEN}✅ Backend actualizado en Lambda${NC}"
echo -e "${GREEN}✅ Frontend actualizado en S3${NC}"
echo ""
echo -e "${BLUE}🌐 URLs de acceso:${NC}"
echo -e "   Sitio: https://$FRONTEND_BUCKET.s3.$AWS_REGION.amazonaws.com/"
echo -e "   Admin: https://$FRONTEND_BUCKET.s3.$AWS_REGION.amazonaws.com/admin"
echo -e "   API: https://$API_GATEWAY_ID.execute-api.$AWS_REGION.amazonaws.com"
echo ""
echo -e "${YELLOW}⏳ El sistema estará listo en ~30 segundos${NC}"
