#!/bin/bash

# Script para verificar integridad del archivo .env
# Usar: ./scripts/check-env.sh

set -e

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔍 VERIFICACIÓN DE INTEGRIDAD .env${NC}"
echo -e "${BLUE}==================================${NC}"

# Verificar que existe .env
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ CRÍTICO: Archivo .env no encontrado${NC}"
    echo -e "${YELLOW}💡 Restaura desde backup: ./scripts/restore-env.sh${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Archivo .env existe${NC}"

# Verificar permisos
PERMS=$(stat -c %a .env)
if [ "$PERMS" != "644" ]; then
    echo -e "${YELLOW}⚠️  Permisos del archivo: $PERMS (recomendado: 644)${NC}"
else
    echo -e "${GREEN}✅ Permisos del archivo correctos (644)${NC}"
fi

# Verificar integridad usando checksum
if [ -f ".env.checksum" ]; then
    echo -n "🔐 Verificando integridad... "
    
    if command -v md5sum >/dev/null 2>&1; then
        if md5sum -c .env.checksum >/dev/null 2>&1; then
            echo -e "${GREEN}✅ Integridad verificada${NC}"
        else
            echo -e "${YELLOW}⚠️  Archivo ha sido modificado${NC}"
            echo -e "${YELLOW}💾 Creando nuevo backup...${NC}"
            ./scripts/backup-env.sh > /dev/null 2>&1
            md5sum .env > .env.checksum
        fi
    elif command -v shasum >/dev/null 2>&1; then
        if shasum -a 256 -c .env.checksum >/dev/null 2>&1; then
            echo -e "${GREEN}✅ Integridad verificada${NC}"
        else
            echo -e "${YELLOW}⚠️  Archivo ha sido modificado${NC}"
            echo -e "${YELLOW}💾 Creando nuevo backup...${NC}"
            ./scripts/backup-env.sh > /dev/null 2>&1
            shasum -a 256 .env > .env.checksum
        fi
    fi
elif [ -f ".env.timestamp" ]; then
    CURRENT_TIME=$(stat -c %Y .env)
    SAVED_TIME=$(cat .env.timestamp)
    
    if [ "$CURRENT_TIME" != "$SAVED_TIME" ]; then
        echo -e "${YELLOW}⚠️  Archivo ha sido modificado${NC}"
        echo -e "${YELLOW}💾 Creando nuevo backup...${NC}"
        ./scripts/backup-env.sh > /dev/null 2>&1
        echo $CURRENT_TIME > .env.timestamp
    else
        echo -e "${GREEN}✅ Timestamp verificado${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  No hay checksum de referencia${NC}"
    echo -e "${YELLOW}💾 Creando checksum inicial...${NC}"
    if command -v md5sum >/dev/null 2>&1; then
        md5sum .env > .env.checksum
    elif command -v shasum >/dev/null 2>&1; then
        shasum -a 256 .env > .env.checksum
    else
        stat -c %Y .env > .env.timestamp
    fi
fi

# Verificar contenido básico
echo -e "${BLUE}📊 Verificando contenido:${NC}"

REQUIRED_VARS=("VITE_API_BASE_URL" "AWS_PROFILE" "FRONTEND_BUCKET" "API_GATEWAY_ID")
MISSING_VARS=0

for var in "${REQUIRED_VARS[@]}"; do
    if grep -q "^$var=" .env; then
        VALUE=$(grep "^$var=" .env | cut -d'=' -f2-)
        if [[ "$VALUE" == *"your-"* ]] || [[ "$VALUE" == *"[API_GATEWAY_ID]"* ]]; then
            echo -e "   ${RED}❌ $var contiene placeholder${NC}"
            ((MISSING_VARS++))
        else
            echo -e "   ${GREEN}✅ $var configurada${NC}"
        fi
    else
        echo -e "   ${RED}❌ $var no encontrada${NC}"
        ((MISSING_VARS++))
    fi
done

# Verificar Git hook
echo -e "${BLUE}🔧 Verificando protecciones:${NC}"

if [ -f ".git/hooks/pre-commit" ] && grep -q "\.env" .git/hooks/pre-commit; then
    echo -e "   ${GREEN}✅ Git hook configurado${NC}"
else
    echo -e "   ${YELLOW}⚠️  Git hook no configurado${NC}"
    echo -e "   ${YELLOW}💡 Ejecuta: ./scripts/protect-env.sh${NC}"
fi

# Verificar backups
if [ -d ".env-backups" ]; then
    BACKUP_COUNT=$(ls -1 .env-backups/ 2>/dev/null | wc -l)
    if [ $BACKUP_COUNT -gt 0 ]; then
        echo -e "   ${GREEN}✅ Backups disponibles ($BACKUP_COUNT)${NC}"
        LATEST_BACKUP=$(ls -t .env-backups/ | head -1)
        BACKUP_DATE=$(stat -c %y ".env-backups/$LATEST_BACKUP" | cut -d' ' -f1,2 | cut -d'.' -f1)
        echo -e "      Último backup: $BACKUP_DATE${NC}"
    else
        echo -e "   ${YELLOW}⚠️  No hay backups${NC}"
    fi
else
    echo -e "   ${YELLOW}⚠️  Directorio de backups no existe${NC}"
fi

echo ""
echo -e "${BLUE}📋 RESUMEN:${NC}"

if [ $MISSING_VARS -eq 0 ]; then
    echo -e "${GREEN}🎉 Archivo .env íntegro y configurado correctamente${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  Archivo .env tiene $MISSING_VARS problemas${NC}"
    echo -e "${YELLOW}💡 Ejecuta: ./scripts/validate-env.sh para más detalles${NC}"
    exit 1
fi
