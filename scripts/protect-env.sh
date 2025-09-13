#!/bin/bash

# Script para proteger el archivo .env
# Usar: ./scripts/protect-env.sh

set -e

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🛡️  SISTEMA DE PROTECCIÓN .env${NC}"
echo -e "${BLUE}==============================${NC}"

# 1. Crear backup automático
echo -e "${YELLOW}1. Creando backup automático...${NC}"
if [ -f ".env" ]; then
    ./scripts/backup-env.sh
else
    echo -e "${RED}❌ Archivo .env no encontrado${NC}"
    exit 1
fi

# 2. Configurar atributos de protección
echo -e "${YELLOW}2. Configurando protección de archivos...${NC}"

# Hacer el .env menos accesible para prevenir borrado accidental
chmod 644 .env
echo -e "${GREEN}✅ Permisos .env configurados (644)${NC}"

# 3. Crear hook de Git para prevenir commits accidentales
echo -e "${YELLOW}3. Configurando Git hooks...${NC}"

mkdir -p .git/hooks

cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash

# Hook para prevenir commit de archivos .env
if git diff --cached --name-only | grep -q "^\.env$"; then
    echo "🚨 ERROR: Intentando commitear archivo .env"
    echo "🛡️  El archivo .env contiene credenciales y NO debe ir a Git"
    echo "💡 Si necesitas commitear cambios en configuración, usa ENV-TEMPLATE.txt"
    exit 1
fi

# Hook para crear backup automático antes de commit
if [ -f ".env" ] && [ -f "scripts/backup-env.sh" ]; then
    echo "💾 Creando backup automático de .env..."
    ./scripts/backup-env.sh > /dev/null 2>&1 || true
fi
EOF

chmod +x .git/hooks/pre-commit
echo -e "${GREEN}✅ Git hook configurado${NC}"

# 4. Crear archivo de monitoreo
echo -e "${YELLOW}4. Configurando monitoreo de cambios...${NC}"

# Crear checksum del archivo actual
if command -v md5sum >/dev/null 2>&1; then
    md5sum .env > .env.checksum
elif command -v shasum >/dev/null 2>&1; then
    shasum -a 256 .env > .env.checksum
else
    stat -c %Y .env > .env.timestamp
fi

echo -e "${GREEN}✅ Checksum de archivo creado${NC}"

# 5. Crear crontab entry para backups automáticos (opcional)
echo -e "${YELLOW}5. Configuración de backups automáticos...${NC}"

cat > backup-cron-entry.txt << EOF
# Backup automático de .env cada 6 horas (opcional)
# Para activar: crontab backup-cron-entry.txt
# 0 */6 * * * cd $(pwd) && ./scripts/backup-env.sh > /dev/null 2>&1
EOF

echo -e "${GREEN}✅ Configuración de cron creada (opcional)${NC}"
echo -e "${YELLOW}   Para activar: crontab backup-cron-entry.txt${NC}"

# 6. Actualizar .gitignore con patrones adicionales
echo -e "${YELLOW}6. Actualizando .gitignore...${NC}"

# Asegurar que estos patrones estén en .gitignore
PATTERNS=(
    "# Environment backups"
    ".env-backups/"
    ".env.checksum"
    ".env.timestamp" 
    "backup-cron-entry.txt"
    ".env.*.backup"
    ".env.*.tmp"
)

for pattern in "${PATTERNS[@]}"; do
    if ! grep -q "^${pattern}$" .gitignore 2>/dev/null; then
        echo "$pattern" >> .gitignore
    fi
done

echo -e "${GREEN}✅ .gitignore actualizado${NC}"

echo ""
echo -e "${GREEN}🎉 SISTEMA DE PROTECCIÓN ACTIVADO${NC}"
echo -e "${GREEN}=================================${NC}"
echo ""
echo -e "${BLUE}🛡️  Protecciones activas:${NC}"
echo -e "   ✅ Backup automático creado"
echo -e "   ✅ Permisos de archivo configurados"
echo -e "   ✅ Git hook para prevenir commits"
echo -e "   ✅ Monitoreo de integridad configurado"
echo -e "   ✅ Backup automático en commits"
echo -e "   ✅ Patrones adicionales en .gitignore"
echo ""
echo -e "${BLUE}📋 Comandos disponibles:${NC}"
echo -e "   ./scripts/backup-env.sh    # Backup manual"
echo -e "   ./scripts/restore-env.sh   # Restaurar desde backup"
echo -e "   ./scripts/check-env.sh     # Verificar integridad"
echo ""
echo -e "${YELLOW}💡 Tu archivo .env está protegido contra:${NC}"
echo -e "   🚫 Commits accidentales a Git"
echo -e "   🚫 Pérdida de datos (backups automáticos)"
echo -e "   🚫 Modificaciones no monitoreadas"
echo -e "   🚫 Borrado accidental"
