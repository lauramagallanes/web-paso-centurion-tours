#!/bin/bash
# Script para iniciar recursos de desarrollo AWS
# Uso: ./start-dev-resources.sh

set -e

REGION="us-east-1"
ENVIRONMENT="dev"

echo "=========================================="
echo "Iniciando recursos de desarrollo..."
echo "Región: $REGION"
echo "Ambiente: $ENVIRONMENT"
echo "=========================================="
echo ""

# Función para verificar si AWS CLI está instalado
check_aws_cli() {
    if ! command -v aws &> /dev/null; then
        echo "❌ Error: AWS CLI no está instalado"
        echo "Instala AWS CLI: https://aws.amazon.com/cli/"
        exit 1
    fi
}

# Función para verificar credenciales AWS
check_aws_credentials() {
    if ! aws sts get-caller-identity &> /dev/null; then
        echo "❌ Error: No se pueden verificar las credenciales de AWS"
        echo "Configura AWS CLI con: aws configure"
        exit 1
    fi
    
    echo "✅ Credenciales AWS verificadas"
    aws sts get-caller-identity --query 'Account' --output text
    echo ""
}

# Función para iniciar NAT Instance
start_nat_instance() {
    local NAT_NAME="tinambu-nat-instance-${ENVIRONMENT}"
    
    echo "🔄 Buscando NAT Instance: $NAT_NAME..."
    
    NAT_INSTANCE_ID=$(aws ec2 describe-instances \
        --filters "Name=tag:Name,Values=$NAT_NAME" "Name=instance-state-name,Values=stopped" \
        --query 'Reservations[0].Instances[0].InstanceId' \
        --output text \
        --region "$REGION" 2>/dev/null || echo "None")
    
    if [ "$NAT_INSTANCE_ID" = "None" ] || [ -z "$NAT_INSTANCE_ID" ]; then
        echo "⚠️  NAT Instance no encontrado o ya está en ejecución"
        return 1
    fi
    
    echo "▶️  Iniciando NAT Instance: $NAT_INSTANCE_ID..."
    aws ec2 start-instances \
        --instance-ids "$NAT_INSTANCE_ID" \
        --region "$REGION" > /dev/null
    
    echo "⏳ Esperando a que NAT Instance esté disponible..."
    aws ec2 wait instance-running \
        --instance-ids "$NAT_INSTANCE_ID" \
        --region "$REGION"
    
    # Esperar 30 segundos adicionales para que se configure el NAT
    echo "⏳ Esperando configuración del NAT (30s)..."
    sleep 30
    
    echo "✅ NAT Instance iniciado y disponible"
    return 0
}

# Función para iniciar RDS
start_rds() {
    local DB_IDENTIFIER="tinambu-db-${ENVIRONMENT}"
    
    echo "🔄 Verificando estado de RDS: $DB_IDENTIFIER..."
    
    DB_STATUS=$(aws rds describe-db-instances \
        --db-instance-identifier "$DB_IDENTIFIER" \
        --query 'DBInstances[0].DBInstanceStatus' \
        --output text \
        --region "$REGION" 2>/dev/null || echo "not-found")
    
    if [ "$DB_STATUS" = "not-found" ]; then
        echo "⚠️  Instancia RDS no encontrada: $DB_IDENTIFIER"
        return 1
    fi
    
    if [ "$DB_STATUS" = "available" ]; then
        echo "ℹ️  RDS ya está disponible"
        return 0
    fi
    
    if [ "$DB_STATUS" = "stopped" ]; then
        echo "▶️  Iniciando RDS: $DB_IDENTIFIER..."
        aws rds start-db-instance \
            --db-instance-identifier "$DB_IDENTIFIER" \
            --region "$REGION" > /dev/null
        
        echo "⏳ Esperando a que RDS esté disponible (esto puede tardar 3-5 minutos)..."
        aws rds wait db-instance-available \
            --db-instance-identifier "$DB_IDENTIFIER" \
            --region "$REGION"
        
        echo "✅ RDS iniciado y disponible"
        return 0
    fi
    
    echo "⚠️  RDS en estado: $DB_STATUS (no se puede iniciar ahora)"
    return 1
}

# Función para verificar conectividad
verify_connectivity() {
    echo ""
    echo "🔍 Verificando conectividad..."
    
    # Obtener endpoint de RDS
    DB_ENDPOINT=$(aws rds describe-db-instances \
        --db-instance-identifier "tinambu-db-${ENVIRONMENT}" \
        --query 'DBInstances[0].Endpoint.Address' \
        --output text \
        --region "$REGION" 2>/dev/null || echo "not-found")
    
    if [ "$DB_ENDPOINT" != "not-found" ]; then
        echo "✅ Endpoint RDS: $DB_ENDPOINT"
    fi
    
    # Obtener IP pública del NAT Instance
    NAT_PUBLIC_IP=$(aws ec2 describe-instances \
        --filters "Name=tag:Name,Values=tinambu-nat-instance-${ENVIRONMENT}" "Name=instance-state-name,Values=running" \
        --query 'Reservations[0].Instances[0].PublicIpAddress' \
        --output text \
        --region "$REGION" 2>/dev/null || echo "not-found")
    
    if [ "$NAT_PUBLIC_IP" != "not-found" ]; then
        echo "✅ IP Pública NAT: $NAT_PUBLIC_IP"
    fi
}

# Función principal
main() {
    check_aws_cli
    check_aws_credentials
    
    echo "▶️  Iniciando proceso de arranque..."
    echo ""
    
    # Iniciar NAT Instance primero (es más rápido y RDS lo necesita)
    start_nat_instance
    NAT_RESULT=$?
    
    echo ""
    
    # Iniciar RDS (tarda más)
    start_rds
    RDS_RESULT=$?
    
    # Verificar conectividad
    verify_connectivity
    
    echo ""
    echo "=========================================="
    echo "📊 Resumen"
    echo "=========================================="
    
    if [ $NAT_RESULT -eq 0 ]; then
        echo "✅ NAT Instance: Iniciado"
    else
        echo "⚠️  NAT Instance: No iniciado"
    fi
    
    if [ $RDS_RESULT -eq 0 ]; then
        echo "✅ RDS: Iniciado"
    else
        echo "⚠️  RDS: No iniciado"
    fi
    
    echo ""
    
    if [ $NAT_RESULT -eq 0 ] && [ $RDS_RESULT -eq 0 ]; then
        echo "🎉 Todos los recursos están disponibles"
        echo ""
        echo "📝 Puedes proceder con el desarrollo"
        echo ""
        echo "🛑 Cuando termines, ejecuta:"
        echo "   ./scripts/stop-dev-resources.sh"
    else
        echo "⚠️  Algunos recursos no se iniciaron correctamente"
        echo "   Revisa los mensajes anteriores para más detalles"
    fi
    
    echo ""
}

# Ejecutar script
main


