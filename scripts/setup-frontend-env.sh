#!/bin/bash

# Script para configurar variables de entorno del frontend
# Usar: ./scripts/setup-frontend-env.sh

set -e  # Exit on error

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔧 Configurando variables de entorno para frontend...${NC}"

# Verificar que existe archivo .env
if [ -f ".env" ]; then
    echo -e "${GREEN}📋 Encontrado archivo .env...${NC}"
    
    # Crear archivo .env.local para el frontend solo con variables VITE_*
    echo -e "${GREEN}📝 Creando frontend/.env.local...${NC}"
    
    # Extraer solo las variables que empiezan con VITE_ del archivo .env
    grep '^VITE_' .env > frontend/.env.local
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Variables de entorno del frontend configuradas!${NC}"
        echo -e "${GREEN}📄 Archivo creado: frontend/.env.local${NC}"
        echo ""
        echo -e "${YELLOW}📊 Variables configuradas:${NC}"
        cat frontend/.env.local
    else
        echo -e "${YELLOW}⚠️  No se encontraron variables VITE_ en .env${NC}"
    fi
else
    echo -e "${RED}❌ ERROR: Archivo .env no encontrado${NC}"
    echo -e "${YELLOW}💡 Crea un archivo .env copiando ENV-TEMPLATE.txt${NC}"
    exit 1
fi
