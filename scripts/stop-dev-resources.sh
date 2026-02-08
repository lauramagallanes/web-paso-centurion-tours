#!/bin/bash
# Script para detener recursos de desarrollo AWS
# Uso: ./stop-dev-resources.sh

set -e

REGION="us-east-1"
ENVIRONMENT="dev"

echo "=========================================="
echo "Deteniendo recursos de desarrollo..."
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

# Función para detener RDS
stop_rds() {
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
    
    if [ "$DB_STATUS" = "stopped" ]; then
        echo "ℹ️  RDS ya está detenido"
        return 0
    fi
    
    if [ "$DB_STATUS" = "available" ]; then
        echo "🛑 Deteniendo RDS: $DB_IDENTIFIER..."
        aws rds stop-db-instance \
            --db-instance-identifier "$DB_IDENTIFIER" \
            --region "$REGION" > /dev/null
        
        echo "✅ RDS detenido exitosamente"
        echo "   Nota: RDS se reiniciará automáticamente después de 7 días"
        return 0
    fi
    
    echo "⚠️  RDS en estado: $DB_STATUS (no se puede detener ahora)"
    return 1
}

# Función para detener NAT Instance
stop_nat_instance() {
    local NAT_NAME="tinambu-nat-instance-${ENVIRONMENT}"
    
    echo "🔄 Buscando NAT Instance: $NAT_NAME..."
    
    NAT_INSTANCE_ID=$(aws ec2 describe-instances \
        --filters "Name=tag:Name,Values=$NAT_NAME" "Name=instance-state-name,Values=running" \
        --query 'Reservations[0].Instances[0].InstanceId' \
        --output text \
        --region "$REGION" 2>/dev/null || echo "None")
    
    if [ "$NAT_INSTANCE_ID" = "None" ] || [ -z "$NAT_INSTANCE_ID" ]; then
        echo "⚠️  NAT Instance no encontrado o ya está detenido"
        return 1
    fi
    
    echo "🛑 Deteniendo NAT Instance: $NAT_INSTANCE_ID..."
    aws ec2 stop-instances \
        --instance-ids "$NAT_INSTANCE_ID" \
        --region "$REGION" > /dev/null
    
    echo "✅ NAT Instance detenido exitosamente"
    return 0
}

# Función para mostrar estimación de ahorro
show_savings() {
    echo ""
    echo "=========================================="
    echo "💰 Estimación de Ahorro"
    echo "=========================================="
    echo "RDS detenido:        ~$0.70/día"
    echo "NAT Instance:        ~$0.10/día"
    echo "Transferencia datos: ~$0.50/día"
    echo "----------------------------------------"
    echo "TOTAL estimado:      ~$1.30/día"
    echo "=========================================="
    echo ""
    echo "📝 Notas importantes:"
    echo "   - Los recursos detenidos NO generan costos de compute"
    echo "   - El almacenamiento de RDS sigue generando costos (~$0.20/día)"
    echo "   - La EIP del NAT NO genera costos cuando está asociada"
    echo "   - RDS se reiniciará automáticamente después de 7 días"
    echo ""
}

# Función principal
main() {
    check_aws_cli
    check_aws_credentials
    
    echo "⏸️  Iniciando proceso de detención..."
    echo ""
    
    # Detener RDS primero (tarda más)
    stop_rds
    RDS_RESULT=$?
    
    echo ""
    
    # Detener NAT Instance
    stop_nat_instance
    NAT_RESULT=$?
    
    echo ""
    echo "=========================================="
    echo "📊 Resumen"
    echo "=========================================="
    
    if [ $RDS_RESULT -eq 0 ]; then
        echo "✅ RDS: Detenido"
    else
        echo "⚠️  RDS: No detenido"
    fi
    
    if [ $NAT_RESULT -eq 0 ]; then
        echo "✅ NAT Instance: Detenido"
    else
        echo "⚠️  NAT Instance: No detenido"
    fi
    
    show_savings
    
    echo "🔄 Para reiniciar los recursos, ejecuta:"
    echo "   ./scripts/start-dev-resources.sh"
    echo ""
}

# Ejecutar script
main


