#!/bin/bash

# Script para deployar el backend
# Usar: ./scripts/deploy-backend.sh

set -e  # Exit on error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 Deployando Backend - Tinambu Tours${NC}"

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
if [ -z "$LAMBDA_FUNCTION_NAME" ]; then
    echo -e "${RED}❌ ERROR: LAMBDA_FUNCTION_NAME no está configurado${NC}"
    exit 1
fi

if [ -z "$ASSETS_BUCKET" ]; then
    echo -e "${RED}❌ ERROR: ASSETS_BUCKET no está configurado${NC}"
    exit 1
fi

if [ -z "$AWS_PROFILE" ]; then
    echo -e "${RED}❌ ERROR: AWS_PROFILE no está configurado${NC}"
    exit 1
fi

# Cambiar al directorio backend
cd backend

echo -e "${YELLOW}🔨 Compilando backend...${NC}"
mvn clean install -DskipTests

if [ ! -f "target/tinambu-tours-lambda.jar" ]; then
    echo -e "${RED}❌ ERROR: Build falló - JAR no fue generado${NC}"
    exit 1
fi

# Generar nombre único para el JAR
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
JAR_KEY="lambda/tinambu-tours-lambda-$TIMESTAMP.jar"

echo -e "${YELLOW}☁️  Subiendo JAR a S3...${NC}"
aws s3 cp target/tinambu-tours-lambda.jar s3://$ASSETS_BUCKET/$JAR_KEY --region $AWS_REGION --profile $AWS_PROFILE

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ ERROR: Upload a S3 falló${NC}"
    exit 1
fi

echo -e "${YELLOW}🔄 Actualizando función Lambda...${NC}"
AWS_PROFILE=$AWS_PROFILE aws lambda update-function-code \
  --function-name $LAMBDA_FUNCTION_NAME \
  --s3-bucket $ASSETS_BUCKET \
  --s3-key $JAR_KEY \
  --region $AWS_REGION

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backend deployado exitosamente!${NC}"
    echo -e "${GREEN}⚡ Lambda: $LAMBDA_FUNCTION_NAME${NC}"
    echo -e "${YELLOW}⏳ Esperando 10 segundos para que Lambda se actualice...${NC}"
    sleep 10
    echo -e "${GREEN}🎯 Listo para usar!${NC}"
else
    echo -e "${RED}❌ ERROR: Actualización de Lambda falló${NC}"
    exit 1
fi
