#!/bin/bash

# Script para hacer backup automático del archivo .env
# Usar: ./scripts/backup-env.sh

set -e

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}💾 Backup de archivo .env${NC}"

# Verificar que existe .env
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ Archivo .env no encontrado${NC}"
    exit 1
fi

# Crear directorio de backups si no existe
mkdir -p .env-backups

# Generar nombre del backup con timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE=".env-backups/env.backup.$TIMESTAMP"

# Crear backup
cp .env "$BACKUP_FILE"

echo -e "${GREEN}✅ Backup creado: $BACKUP_FILE${NC}"

# Mantener solo los últimos 20 backups
cd .env-backups
ls -1t env.backup.* 2>/dev/null | tail -n +21 | xargs rm -f 2>/dev/null || true
cd ..

echo -e "${GREEN}📊 Backups disponibles: $(ls -1 .env-backups/ | wc -l)${NC}"

# Mostrar los 3 backups más recientes
echo -e "${YELLOW}📋 Backups recientes:${NC}"
ls -lt .env-backups/ | head -4 | tail -3 | awk '{print "   " $9 " (" $6 " " $7 " " $8 ")"}'
