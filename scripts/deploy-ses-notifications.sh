#!/bin/bash
# Script para desplegar el sistema de manejo de bounces y complaints de SES

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PROFILE="${AWS_PROFILE:-laura}"
REGION="${AWS_REGION:-us-east-1}"

echo -e "${GREEN}=== Desplegando Sistema de Manejo de Bounces y Complaints ===${NC}"
echo "Profile: $PROFILE"
echo "Region: $REGION"
echo ""

# Verificar que estamos autenticados
echo -e "${YELLOW}Verificando autenticación AWS...${NC}"
if ! aws sts get-caller-identity --profile "$PROFILE" &>/dev/null; then
    echo -e "${RED}❌ No estás autenticado en AWS${NC}"
    echo "Ejecuta: aws sso login --profile $PROFILE"
    exit 1
fi

ACCOUNT_ID=$(aws sts get-caller-identity --profile "$PROFILE" --query Account --output text)
echo -e "${GREEN}✓ Autenticado en cuenta: $ACCOUNT_ID${NC}"
echo ""

# Ir al directorio de Terraform
cd "$(dirname "$0")/../terraform/environments/dev"

# Inicializar Terraform
echo -e "${YELLOW}Paso 1: Inicializando Terraform...${NC}"
if ! terraform init -upgrade; then
    echo -e "${RED}❌ Error al inicializar Terraform${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Terraform inicializado${NC}"
echo ""

# Plan
echo -e "${YELLOW}Paso 2: Creando plan de Terraform...${NC}"
if ! terraform plan -out=tfplan; then
    echo -e "${RED}❌ Error al crear plan${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Plan creado${NC}"
echo ""

# Mostrar resumen
echo -e "${YELLOW}Resumen de recursos a crear/modificar:${NC}"
terraform show -no-color tfplan | grep -E "^  # |^Plan:" | head -20
echo ""

# Preguntar confirmación
read -p "¿Deseas aplicar estos cambios? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    echo -e "${YELLOW}Despliegue cancelado${NC}"
    exit 0
fi

# Aplicar
echo -e "${YELLOW}Paso 3: Aplicando cambios...${NC}"
if ! terraform apply tfplan; then
    echo -e "${RED}❌ Error al aplicar cambios${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Cambios aplicados exitosamente${NC}"
echo ""

# Verificar recursos creados
echo -e "${YELLOW}Paso 4: Verificando recursos creados...${NC}"

# Verificar SNS Topics
BOUNCE_TOPIC=$(aws sns list-topics --profile "$PROFILE" --region "$REGION" \
  --query "Topics[?contains(TopicArn, 'ses-bounces')].TopicArn" \
  --output text | head -n1)

COMPLAINT_TOPIC=$(aws sns list-topics --profile "$PROFILE" --region "$REGION" \
  --query "Topics[?contains(TopicArn, 'ses-complaints')].TopicArn" \
  --output text | head -n1)

if [ -n "$BOUNCE_TOPIC" ]; then
    echo -e "${GREEN}✓ Bounce topic creado: $BOUNCE_TOPIC${NC}"
else
    echo -e "${RED}❌ Bounce topic no encontrado${NC}"
fi

if [ -n "$COMPLAINT_TOPIC" ]; then
    echo -e "${GREEN}✓ Complaint topic creado: $COMPLAINT_TOPIC${NC}"
else
    echo -e "${RED}❌ Complaint topic no encontrado${NC}"
fi

# Verificar Lambda Functions
BOUNCE_LAMBDA=$(aws lambda list-functions --profile "$PROFILE" --region "$REGION" \
  --query "Functions[?contains(FunctionName, 'ses-bounce-handler')].FunctionName" \
  --output text | head -n1)

COMPLAINT_LAMBDA=$(aws lambda list-functions --profile "$PROFILE" --region "$REGION" \
  --query "Functions[?contains(FunctionName, 'ses-complaint-handler')].FunctionName" \
  --output text | head -n1)

if [ -n "$BOUNCE_LAMBDA" ]; then
    echo -e "${GREEN}✓ Bounce handler creado: $BOUNCE_LAMBDA${NC}"
else
    echo -e "${RED}❌ Bounce handler no encontrado${NC}"
fi

if [ -n "$COMPLAINT_LAMBDA" ]; then
    echo -e "${GREEN}✓ Complaint handler creado: $COMPLAINT_LAMBDA${NC}"
else
    echo -e "${RED}❌ Complaint handler no encontrado${NC}"
fi

# Verificar configuración de SES
echo ""
echo -e "${YELLOW}Verificando configuración de SES...${NC}"
SES_CONFIG=$(aws ses get-identity-notification-attributes \
  --identities pasocenturion.com.uy \
  --profile "$PROFILE" \
  --region "$REGION" \
  --output json 2>/dev/null || echo "{}")

if echo "$SES_CONFIG" | grep -q "BounceTopic"; then
    echo -e "${GREEN}✓ SES configurado para enviar bounces a SNS${NC}"
else
    echo -e "${YELLOW}⚠ SES aún no está configurado. Ejecuta:${NC}"
    echo "  ./scripts/configure-ses-notifications.sh"
fi

if echo "$SES_CONFIG" | grep -q "ComplaintTopic"; then
    echo -e "${GREEN}✓ SES configurado para enviar complaints a SNS${NC}"
else
    echo -e "${YELLOW}⚠ SES aún no está configurado. Ejecuta:${NC}"
    echo "  ./scripts/configure-ses-notifications.sh"
fi

echo ""
echo -e "${GREEN}=== Despliegue Completado ===${NC}"
echo ""
echo "Próximos pasos:"
echo "1. Si SES no está configurado automáticamente, ejecuta:"
echo "   ./scripts/configure-ses-notifications.sh"
echo ""
echo "2. Prueba el sistema con mailbox simulator:"
echo "   aws ses send-email --from 'tinambu.paso.centurion@gmail.com' \\"
echo "     --to 'bounce@simulator.amazonses.com' \\"
echo "     --subject 'Test' --text 'Test' --profile $PROFILE --region $REGION"
echo ""
echo "3. Verifica los logs:"
echo "   aws logs tail /aws/lambda/ses-bounce-handler-dev --follow \\"
echo "     --profile $PROFILE --region $REGION"
echo ""
echo "4. Responde a AWS usando: RESPUESTA_AWS_SES.md"


