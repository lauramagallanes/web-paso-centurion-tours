#!/bin/bash

# Script para agregar nuevas rutas a API Gateway
# Usar: ./scripts/add-api-route.sh "GET /new-endpoint"

set -e  # Exit on error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

if [ $# -eq 0 ]; then
    echo -e "${RED}❌ ERROR: Debes especificar la ruta${NC}"
    echo -e "${YELLOW}💡 Uso: ./scripts/add-api-route.sh \"GET /new-endpoint\"${NC}"
    echo -e "${YELLOW}💡 Ejemplo: ./scripts/add-api-route.sh \"POST /habitaciones/admin\"${NC}"
    exit 1
fi

ROUTE_KEY="$1"

echo -e "${YELLOW}🛣️  Agregando ruta API: $ROUTE_KEY${NC}"

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
if [ -z "$API_GATEWAY_ID" ]; then
    echo -e "${RED}❌ ERROR: API_GATEWAY_ID no está configurado${NC}"
    exit 1
fi

if [ -z "$INTEGRATION_ID" ]; then
    echo -e "${RED}❌ ERROR: INTEGRATION_ID no está configurado${NC}"
    exit 1
fi

if [ -z "$AWS_PROFILE" ]; then
    echo -e "${RED}❌ ERROR: AWS_PROFILE no está configurado${NC}"
    exit 1
fi

echo -e "${YELLOW}🔧 Creando ruta en API Gateway...${NC}"
RESULT=$(AWS_PROFILE=$AWS_PROFILE aws apigatewayv2 create-route \
  --api-id $API_GATEWAY_ID \
  --route-key "$ROUTE_KEY" \
  --target "integrations/$INTEGRATION_ID" \
  --authorization-type NONE \
  --region $AWS_REGION)

if [ $? -eq 0 ]; then
    ROUTE_ID=$(echo $RESULT | grep -o '"RouteId":"[^"]*' | sed 's/"RouteId":"//')
    echo -e "${GREEN}✅ Ruta creada exitosamente!${NC}"
    echo -e "${GREEN}🆔 Route ID: $ROUTE_ID${NC}"
    echo -e "${GREEN}🛣️  Ruta: $ROUTE_KEY${NC}"
    echo -e "${GREEN}🌐 API: https://$API_GATEWAY_ID.execute-api.$AWS_REGION.amazonaws.com${NC}"
else
    echo -e "${RED}❌ ERROR: Creación de ruta falló${NC}"
    exit 1
fi
