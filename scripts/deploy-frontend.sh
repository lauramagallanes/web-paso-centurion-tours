#!/bin/bash

# Script para deployar el frontend
# Usar: ./scripts/deploy-frontend.sh

set -e  # Exit on error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 Deployando Frontend - Tinambu Tours${NC}"

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

# Verificar variables requeridas
if [ -z "$FRONTEND_BUCKET" ]; then
    echo -e "${RED}❌ ERROR: FRONTEND_BUCKET no está configurado${NC}"
    exit 1
fi

if [ -z "$AWS_PROFILE" ]; then
    echo -e "${RED}❌ ERROR: AWS_PROFILE no está configurado${NC}"
    exit 1
fi

# Cambiar al directorio frontend
cd frontend

echo -e "${YELLOW}📦 Instalando dependencias...${NC}"
npm install

echo -e "${YELLOW}🔨 Construyendo frontend...${NC}"
npm run build

if [ ! -d "dist" ]; then
    echo -e "${RED}❌ ERROR: Build falló - directorio dist no existe${NC}"
    exit 1
fi

echo -e "${YELLOW}☁️  Subiendo a S3...${NC}"
aws s3 sync dist/ s3://$FRONTEND_BUCKET --delete --region $AWS_REGION --profile $AWS_PROFILE

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Frontend deployado exitosamente!${NC}"
    echo -e "${GREEN}🌐 URL: https://$FRONTEND_BUCKET.s3.$AWS_REGION.amazonaws.com/${NC}"
else
    echo -e "${RED}❌ ERROR: Deploy falló${NC}"
    exit 1
fi
