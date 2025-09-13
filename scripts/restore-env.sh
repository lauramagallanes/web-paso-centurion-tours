#!/bin/bash

# Script para restaurar archivo .env desde backup
# Usar: ./scripts/restore-env.sh [nombre-backup]

set -e

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔄 Restaurar archivo .env${NC}"

# Verificar que existe directorio de backups
if [ ! -d ".env-backups" ]; then
    echo -e "${RED}❌ No hay backups disponibles${NC}"
    exit 1
fi

# Contar backups disponibles
BACKUP_COUNT=$(ls -1 .env-backups/ 2>/dev/null | wc -l)
if [ $BACKUP_COUNT -eq 0 ]; then
    echo -e "${RED}❌ No hay backups disponibles${NC}"
    exit 1
fi

echo -e "${GREEN}📦 Backups disponibles ($BACKUP_COUNT):${NC}"
echo ""

# Mostrar lista numerada de backups
i=1
for backup in $(ls -t .env-backups/); do
    DATE=$(stat -c %y ".env-backups/$backup" | cut -d' ' -f1,2 | cut -d'.' -f1)
    printf "%2d. %-30s (%s)\n" $i "$backup" "$DATE"
    ((i++))
done

echo ""

# Si se proporcionó un argumento, usar ese backup
if [ $# -eq 1 ]; then
    SELECTED_BACKUP="$1"
    if [ ! -f ".env-backups/$SELECTED_BACKUP" ]; then
        echo -e "${RED}❌ Backup '$SELECTED_BACKUP' no encontrado${NC}"
        exit 1
    fi
else
    # Pedir al usuario que seleccione
    echo -n "Selecciona el número del backup a restaurar (1-$BACKUP_COUNT): "
    read SELECTION
    
    # Validar selección
    if ! [[ "$SELECTION" =~ ^[0-9]+$ ]] || [ "$SELECTION" -lt 1 ] || [ "$SELECTION" -gt $BACKUP_COUNT ]; then
        echo -e "${RED}❌ Selección inválida${NC}"
        exit 1
    fi
    
    # Obtener el nombre del backup seleccionado
    SELECTED_BACKUP=$(ls -t .env-backups/ | sed -n "${SELECTION}p")
fi

echo ""
echo -e "${YELLOW}📋 Backup seleccionado: $SELECTED_BACKUP${NC}"

# Hacer backup del .env actual si existe
if [ -f ".env" ]; then
    echo -e "${YELLOW}💾 Haciendo backup del .env actual...${NC}"
    ./scripts/backup-env.sh > /dev/null 2>&1
fi

# Restaurar el backup
cp ".env-backups/$SELECTED_BACKUP" ".env"

echo -e "${GREEN}✅ Archivo .env restaurado exitosamente${NC}"

# Mostrar algunas variables para verificar
echo ""
echo -e "${BLUE}📊 Variables restauradas:${NC}"
grep -v '^#' .env | grep -v '^$' | head -5 | while read line; do
    echo "   $line"
done

# Ejecutar validación rápida
echo ""
echo -e "${YELLOW}🔍 Ejecutando validación rápida...${NC}"
if ./scripts/quick-check.sh; then
    echo -e "${GREEN}🎉 Restauración completada y validada${NC}"
else
    echo -e "${YELLOW}⚠️  Restauración completada - verifica la configuración${NC}"
fi
