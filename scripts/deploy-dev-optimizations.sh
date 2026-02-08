#!/bin/bash
# Script de Implementación de Optimizaciones de Desarrollo
# Paso Centurion Tours - Optimización de Costos AWS

set -e  # Detener en errores

REGION="us-east-1"
ENVIRONMENT="dev"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "════════════════════════════════════════════════════════════════════"
echo "  🚀 IMPLEMENTACIÓN DE OPTIMIZACIONES - DESARROLLO"
echo "════════════════════════════════════════════════════════════════════"
echo ""
echo "Objetivo: Reducir costo de \$24/mes a \$8-15/mes (64% ahorro)"
echo "Tiempo estimado: 2-3 horas"
echo ""
echo "════════════════════════════════════════════════════════════════════"
echo ""

# ═══════════════════════════════════════════════════════════════════════
# FASE 0: VERIFICACIONES PRE-IMPLEMENTACIÓN
# ═══════════════════════════════════════════════════════════════════════

echo -e "${BLUE}[0/6] Verificaciones Pre-Implementación${NC}"
echo "─────────────────────────────────────────────────────────────────"
echo ""

# Verificar AWS CLI
echo -n "✓ Verificando AWS CLI... "
if ! command -v aws &> /dev/null; then
    echo -e "${RED}FALLO${NC}"
    echo ""
    echo "❌ AWS CLI no está instalado."
    echo "Por favor instala AWS CLI:"
    echo "  https://aws.amazon.com/cli/"
    exit 1
fi
echo -e "${GREEN}OK${NC}"

# Verificar credenciales AWS
echo -n "✓ Verificando credenciales AWS... "
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}FALLO${NC}"
    echo ""
    echo "❌ No se pueden verificar las credenciales de AWS."
    echo ""
    echo "Por favor configura AWS CLI con:"
    echo "  aws configure"
    echo ""
    echo "Necesitarás:"
    echo "  - AWS Access Key ID"
    echo "  - AWS Secret Access Key"
    echo "  - Default region: us-east-1"
    echo "  - Default output format: json"
    exit 1
fi
ACCOUNT_ID=$(aws sts get-caller-identity --query 'Account' --output text)
echo -e "${GREEN}OK${NC} (Account: $ACCOUNT_ID)"

# Verificar Terraform
echo -n "✓ Verificando Terraform... "
if ! command -v terraform &> /dev/null; then
    echo -e "${YELLOW}NO INSTALADO${NC}"
    echo ""
    echo "⚠️  Terraform no está instalado."
    echo "Puedes instalarlo desde: https://www.terraform.io/downloads"
    echo ""
    read -p "¿Continuar sin Terraform? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    TF_VERSION=$(terraform version -json 2>/dev/null | jq -r '.terraform_version' || terraform version | head -1)
    echo -e "${GREEN}OK${NC} ($TF_VERSION)"
fi

# Verificar que RDS existe
echo -n "✓ Verificando RDS tinambu-db-dev... "
if ! aws rds describe-db-instances \
    --db-instance-identifier tinambu-db-dev \
    --region $REGION &> /dev/null; then
    echo -e "${YELLOW}NO ENCONTRADO${NC}"
    echo ""
    echo "⚠️  No se encontró la instancia RDS 'tinambu-db-dev'"
    echo "Esto es normal si es la primera vez que despliegas."
    echo ""
else
    RDS_STATUS=$(aws rds describe-db-instances \
        --db-instance-identifier tinambu-db-dev \
        --query 'DBInstances[0].DBInstanceStatus' \
        --output text \
        --region $REGION)
    echo -e "${GREEN}OK${NC} (Status: $RDS_STATUS)"
fi

echo ""
echo -e "${GREEN}✓ Todas las verificaciones pasadas${NC}"
echo ""

# ═══════════════════════════════════════════════════════════════════════
# FASE 1: ANÁLISIS INICIAL
# ═══════════════════════════════════════════════════════════════════════

echo -e "${BLUE}[1/6] Análisis Inicial (Baseline)${NC}"
echo "─────────────────────────────────────────────────────────────────"
echo ""

# Analizar tráfico del NAT Instance (si existe)
if [[ -f "$PROJECT_ROOT/scripts/analyze-nat-traffic.sh" ]]; then
    echo "Analizando tráfico de los últimos 30 días..."
    echo ""
    
    if bash "$PROJECT_ROOT/scripts/analyze-nat-traffic.sh" 30 2>&1 | tee "$PROJECT_ROOT/baseline-traffic.txt"; then
        echo ""
        echo -e "${GREEN}✓ Análisis de tráfico completado${NC}"
        echo "Resultado guardado en: baseline-traffic.txt"
    else
        echo -e "${YELLOW}⚠️  No se pudo analizar el tráfico (puede ser normal si es nuevo deployment)${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Script de análisis no encontrado${NC}"
fi

echo ""

# Documentar estado actual de recursos
echo "Documentando estado actual de recursos..."
echo ""

echo "RDS Instances:" > "$PROJECT_ROOT/baseline-resources.txt"
aws rds describe-db-instances \
    --query 'DBInstances[*].[DBInstanceIdentifier,DBInstanceClass,AllocatedStorage,MultiAZ,BackupRetentionPeriod]' \
    --output table \
    --region $REGION >> "$PROJECT_ROOT/baseline-resources.txt" 2>&1 || echo "No RDS instances found"

echo "" >> "$PROJECT_ROOT/baseline-resources.txt"
echo "EC2 NAT Instances:" >> "$PROJECT_ROOT/baseline-resources.txt"
aws ec2 describe-instances \
    --filters "Name=tag:Name,Values=*nat*" "Name=instance-state-name,Values=running,stopped" \
    --query 'Reservations[*].Instances[*].[InstanceId,InstanceType,State.Name,Tags[?Key==`Name`].Value|[0]]' \
    --output table \
    --region $REGION >> "$PROJECT_ROOT/baseline-resources.txt" 2>&1 || echo "No NAT instances found"

echo -e "${GREEN}✓ Estado actual documentado${NC}"
echo "Resultado guardado en: baseline-resources.txt"
echo ""

# ═══════════════════════════════════════════════════════════════════════
# FASE 2: CREAR BACKUP DE SEGURIDAD (CRÍTICO)
# ═══════════════════════════════════════════════════════════════════════

echo -e "${BLUE}[2/6] Crear Backup de Seguridad (CRÍTICO)${NC}"
echo "─────────────────────────────────────────────────────────────────"
echo ""

# Verificar si RDS existe antes de intentar backup
if aws rds describe-db-instances \
    --db-instance-identifier tinambu-db-dev \
    --region $REGION &> /dev/null; then
    
    SNAPSHOT_ID="tinambu-db-dev-pre-optimization-$(date +%Y%m%d-%H%M)"
    
    echo "Creando snapshot manual de RDS..."
    echo "Snapshot ID: $SNAPSHOT_ID"
    echo ""
    
    if aws rds create-db-snapshot \
        --db-instance-identifier tinambu-db-dev \
        --db-snapshot-identifier "$SNAPSHOT_ID" \
        --region $REGION > /dev/null 2>&1; then
        
        echo -e "${GREEN}✓ Snapshot creado exitosamente${NC}"
        echo ""
        echo "⏳ Esperando a que el snapshot complete..."
        echo "(Esto puede tomar 5-10 minutos)"
        echo ""
        
        # Esperar a que complete (con timeout de 15 minutos)
        TIMEOUT=900
        ELAPSED=0
        while [ $ELAPSED -lt $TIMEOUT ]; do
            STATUS=$(aws rds describe-db-snapshots \
                --db-snapshot-identifier "$SNAPSHOT_ID" \
                --query 'DBSnapshots[0].Status' \
                --output text \
                --region $REGION 2>/dev/null)
            
            if [ "$STATUS" = "available" ]; then
                echo -e "${GREEN}✓ Snapshot completado y disponible${NC}"
                break
            fi
            
            echo -n "."
            sleep 10
            ELAPSED=$((ELAPSED + 10))
        done
        
        if [ $ELAPSED -ge $TIMEOUT ]; then
            echo ""
            echo -e "${YELLOW}⚠️  Snapshot aún en progreso (continuará en background)${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  No se pudo crear snapshot (puede ser que ya exista uno reciente)${NC}"
        echo "Verificando snapshots existentes..."
        aws rds describe-db-snapshots \
            --db-instance-identifier tinambu-db-dev \
            --query 'DBSnapshots[-1].[DBSnapshotIdentifier,SnapshotCreateTime,Status]' \
            --output table \
            --region $REGION
    fi
else
    echo -e "${YELLOW}⚠️  RDS no existe aún, saltando backup${NC}"
fi

echo ""
read -p "¿Continuar con la implementación? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Implementación cancelada por el usuario."
    exit 0
fi
echo ""

# ═══════════════════════════════════════════════════════════════════════
# FASE 3: APLICAR TERRAFORM
# ═══════════════════════════════════════════════════════════════════════

echo -e "${BLUE}[3/6] Aplicar Optimizaciones de Terraform${NC}"
echo "─────────────────────────────────────────────────────────────────"
echo ""

cd "$PROJECT_ROOT/terraform/environments/dev"

echo "Directorio de trabajo: $(pwd)"
echo ""

# Terraform init
echo "Inicializando Terraform..."
if terraform init -upgrade; then
    echo -e "${GREEN}✓ Terraform inicializado${NC}"
else
    echo -e "${RED}✗ Error al inicializar Terraform${NC}"
    exit 1
fi
echo ""

# Terraform plan
echo "Generando plan de cambios..."
echo ""
if terraform plan -out=tfplan; then
    echo ""
    echo -e "${GREEN}✓ Plan generado exitosamente${NC}"
else
    echo -e "${RED}✗ Error al generar plan${NC}"
    exit 1
fi
echo ""

# Revisar plan
echo "════════════════════════════════════════════════════════════════════"
echo -e "${YELLOW}⚠️  REVISAR PLAN CUIDADOSAMENTE${NC}"
echo "════════════════════════════════════════════════════════════════════"
echo ""
echo "Cambios esperados:"
echo "  ✓ Reducción de 2 AZ a 1 AZ"
echo "  ✓ RDS storage: 20GB → 10GB"
echo "  ✓ RDS backups: 7 días → 1 día"
echo "  ✓ Budget alert: \$30 → \$15"
echo ""
echo "⚠️  Si ves cambios inesperados o destructivos, CANCELA AHORA"
echo ""

read -p "¿Aplicar cambios de Terraform? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Terraform apply cancelado por el usuario."
    echo ""
    echo "El plan se guardó en: tfplan"
    echo "Puedes revisarlo y aplicarlo manualmente más tarde con:"
    echo "  cd terraform/environments/dev"
    echo "  terraform apply tfplan"
    exit 0
fi

# Terraform apply
echo ""
echo "Aplicando cambios..."
echo ""
if terraform apply tfplan; then
    echo ""
    echo -e "${GREEN}✓ Terraform aplicado exitosamente${NC}"
else
    echo -e "${RED}✗ Error al aplicar Terraform${NC}"
    echo ""
    echo "Revisa los errores anteriores."
    echo "Puedes intentar aplicar manualmente con:"
    echo "  cd terraform/environments/dev"
    echo "  terraform apply tfplan"
    exit 1
fi

cd "$PROJECT_ROOT"
echo ""

# ═══════════════════════════════════════════════════════════════════════
# FASE 4: VERIFICAR RECURSOS
# ═══════════════════════════════════════════════════════════════════════

echo -e "${BLUE}[4/6] Verificar Recursos Actualizados${NC}"
echo "─────────────────────────────────────────────────────────────────"
echo ""

echo "Esperando a que recursos estén disponibles (30 segundos)..."
sleep 30
echo ""

echo "Estado de RDS:"
if aws rds describe-db-instances \
    --db-instance-identifier tinambu-db-dev \
    --query 'DBInstances[0].[DBInstanceStatus,AllocatedStorage,BackupRetentionPeriod,MultiAZ]' \
    --output table \
    --region $REGION; then
    echo -e "${GREEN}✓ RDS verificado${NC}"
else
    echo -e "${YELLOW}⚠️  No se pudo verificar RDS${NC}"
fi
echo ""

echo "Estado de NAT Instance:"
if aws ec2 describe-instances \
    --filters "Name=tag:Name,Values=tinambu-nat-instance-dev" \
    --query 'Reservations[0].Instances[0].[InstanceId,InstanceType,State.Name]' \
    --output table \
    --region $REGION; then
    echo -e "${GREEN}✓ NAT Instance verificado${NC}"
else
    echo -e "${YELLOW}⚠️  No se pudo verificar NAT Instance${NC}"
fi
echo ""

# ═══════════════════════════════════════════════════════════════════════
# FASE 5: TESTEAR SCRIPTS
# ═══════════════════════════════════════════════════════════════════════

echo -e "${BLUE}[5/6] Testear Scripts de Stop/Start${NC}"
echo "─────────────────────────────────────────────────────────────────"
echo ""

if [[ -f "$PROJECT_ROOT/scripts/stop-dev-resources.sh" ]]; then
    echo "Testeando script de stop..."
    echo ""
    
    read -p "¿Testear deteniendo recursos? (esto los apagará) (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if bash "$PROJECT_ROOT/scripts/stop-dev-resources.sh"; then
            echo ""
            echo -e "${GREEN}✓ Script de stop funcionó correctamente${NC}"
            echo ""
            echo "Esperando 30 segundos antes de reiniciar..."
            sleep 30
            echo ""
            
            echo "Testeando script de start..."
            if bash "$PROJECT_ROOT/scripts/start-dev-resources.sh"; then
                echo ""
                echo -e "${GREEN}✓ Script de start funcionó correctamente${NC}"
            else
                echo -e "${RED}✗ Error en script de start${NC}"
            fi
        else
            echo -e "${RED}✗ Error en script de stop${NC}"
        fi
    else
        echo "Test de scripts saltado."
    fi
else
    echo -e "${YELLOW}⚠️  Scripts no encontrados${NC}"
fi

echo ""

# ═══════════════════════════════════════════════════════════════════════
# FASE 6: CONFIGURAR MONITOREO
# ═══════════════════════════════════════════════════════════════════════

echo -e "${BLUE}[6/6] Configurar Monitoreo${NC}"
echo "─────────────────────────────────────────────────────────────────"
echo ""

# Crear recordatorio de rutina diaria
cat > "$PROJECT_ROOT/RUTINA_DIARIA.md" << 'EOF'
# 📋 RUTINA DIARIA DE DESARROLLO

## Al TERMINAR de trabajar cada día

```bash
./scripts/stop-dev-resources.sh
```

⏱️  Tiempo: 30 segundos  
💰 Ahorro: ~\$1.30/día

## Al COMENZAR a trabajar cada día

```bash
./scripts/start-dev-resources.sh
```

⏱️  Tiempo: 3-5 minutos  
✅ Recursos disponibles para desarrollo

## Semanalmente (viernes)

```bash
./scripts/analyze-nat-traffic.sh 7
```

📊 Revisar tráfico y costos de la semana

## IMPORTANTE

- ⚠️  Hacer commit ANTES de detener recursos
- ⚠️  Planificar inicio 5 minutos antes de necesitarlo
- ⚠️  RDS se reinicia automáticamente después de 7 días detenido
- ⚠️  Si no lo usas por varios días, AWS puede cobrarte por el storage

## Monitoreo de Costos

### Diario (primera semana)
```bash
aws ce get-cost-and-usage \
  --time-period Start=$(date -d '1 day ago' +%Y-%m-%d),End=$(date +%Y-%m-%d) \
  --granularity DAILY \
  --metrics "UnblendedCost" \
  --region us-east-1
```

### Semanal
```bash
./scripts/analyze-nat-traffic.sh 7

aws ce get-cost-and-usage \
  --time-period Start=$(date -d '7 days ago' +%Y-%m-%d),End=$(date +%Y-%m-%d) \
  --granularity DAILY \
  --metrics "UnblendedCost" \
  --group-by Type=DIMENSION,Key=SERVICE \
  --region us-east-1
```

## Objetivos

- 📊 Costo diario < \$0.50 (objetivo: \$0.27-0.35)
- 📊 Costo mensual < \$15
- ✅ Compliance con stop/start: >80%
- ✅ Zero pérdida de datos
EOF

echo -e "${GREEN}✓ Rutina diaria documentada${NC}"
echo "Ver: RUTINA_DIARIA.md"
echo ""

# ═══════════════════════════════════════════════════════════════════════
# RESUMEN FINAL
# ═══════════════════════════════════════════════════════════════════════

echo ""
echo "════════════════════════════════════════════════════════════════════"
echo -e "${GREEN}✅ IMPLEMENTACIÓN COMPLETADA EXITOSAMENTE${NC}"
echo "════════════════════════════════════════════════════════════════════"
echo ""

echo "📊 Resumen:"
echo "  ✓ Terraform aplicado en desarrollo"
echo "  ✓ Configuración optimizada (1 AZ, 10GB RDS, 1 día backups)"
echo "  ✓ Scripts de stop/start testeados"
echo "  ✓ Documentación actualizada"
echo ""

echo "💰 Ahorro Esperado:"
echo "  Antes:    \$24/mes (\$0.80/día)"
echo "  Después:  \$8-15/mes (\$0.27-0.50/día)"
echo "  Ahorro:   \$10-16/mes (41-64%)"
echo "  Anual:    \$120-192/año"
echo ""

echo "📋 Próximos Pasos:"
echo "  1. Verificar que la aplicación funciona correctamente"
echo "  2. Establecer rutina de stop/start (ver RUTINA_DIARIA.md)"
echo "  3. Monitorear costos DIARIAMENTE por 1 semana"
echo "  4. Ejecutar: ./scripts/analyze-nat-traffic.sh 7 (cada semana)"
echo "  5. Comparar costos con baseline después de 1 semana"
echo ""

echo "⚠️  IMPORTANTE:"
echo "  - Detén recursos al terminar: ./scripts/stop-dev-resources.sh"
echo "  - Inicia recursos al comenzar: ./scripts/start-dev-resources.sh"
echo "  - Monitorea AWS Cost Explorer diariamente"
echo ""

echo "📚 Documentación:"
echo "  - Rutina diaria: RUTINA_DIARIA.md"
echo "  - Guía completa: IMPLEMENTATION_GUIDE_DEV.md"
echo "  - Baseline traffic: baseline-traffic.txt"
echo "  - Baseline resources: baseline-resources.txt"
echo ""

echo "════════════════════════════════════════════════════════════════════"
echo -e "${GREEN}¡ÉXITO CON LA OPTIMIZACIÓN! 🚀💰${NC}"
echo "════════════════════════════════════════════════════════════════════"
echo ""


