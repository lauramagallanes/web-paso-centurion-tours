#!/bin/bash
# Script para analizar el tráfico del NAT Instance
# Uso: ./analyze-nat-traffic.sh [días]

REGION="us-east-1"
ENVIRONMENT="dev"
DAYS="${1:-7}"  # Por defecto 7 días

echo "=========================================="
echo "Análisis de Tráfico NAT Instance"
echo "Región: $REGION"
echo "Ambiente: $ENVIRONMENT"
echo "Período: Últimos $DAYS días"
echo "=========================================="
echo ""

# Función para verificar si AWS CLI está instalado
check_aws_cli() {
    if ! command -v aws &> /dev/null; then
        echo "❌ Error: AWS CLI no está instalado"
        exit 1
    fi
}

# Función para obtener ID del NAT Instance
get_nat_instance_id() {
    local NAT_NAME="tinambu-nat-instance-${ENVIRONMENT}"
    
    NAT_INSTANCE_ID=$(aws ec2 describe-instances \
        --filters "Name=tag:Name,Values=$NAT_NAME" \
        --query 'Reservations[0].Instances[0].InstanceId' \
        --output text \
        --region "$REGION" 2>/dev/null)
    
    if [ -z "$NAT_INSTANCE_ID" ] || [ "$NAT_INSTANCE_ID" = "None" ]; then
        echo "❌ Error: NAT Instance no encontrado"
        exit 1
    fi
    
    echo "✅ NAT Instance ID: $NAT_INSTANCE_ID"
    echo ""
}

# Función para obtener métricas de red
get_network_metrics() {
    local METRIC_NAME=$1
    local METRIC_LABEL=$2
    
    echo "📊 $METRIC_LABEL (últimos $DAYS días):"
    echo "----------------------------------------"
    
    START_TIME=$(date -u -d "$DAYS days ago" +%Y-%m-%dT%H:%M:%S)
    END_TIME=$(date -u +%Y-%m-%dT%H:%M:%S)
    
    # Obtener estadísticas
    STATS=$(aws cloudwatch get-metric-statistics \
        --namespace AWS/EC2 \
        --metric-name "$METRIC_NAME" \
        --dimensions Name=InstanceId,Value="$NAT_INSTANCE_ID" \
        --start-time "$START_TIME" \
        --end-time "$END_TIME" \
        --period 86400 \
        --statistics Sum Average Maximum \
        --region "$REGION" \
        --output json)
    
    # Procesar resultados
    TOTAL_BYTES=$(echo "$STATS" | jq '[.Datapoints[].Sum] | add // 0')
    AVG_BYTES=$(echo "$STATS" | jq '[.Datapoints[].Average] | add / length // 0')
    MAX_BYTES=$(echo "$STATS" | jq '[.Datapoints[].Maximum] | max // 0')
    
    # Convertir a GB
    TOTAL_GB=$(echo "scale=2; $TOTAL_BYTES / 1073741824" | bc)
    AVG_GB=$(echo "scale=2; $AVG_BYTES / 1073741824" | bc)
    MAX_GB=$(echo "scale=2; $MAX_BYTES / 1073741824" | bc)
    
    echo "   Total transferido: $TOTAL_GB GB"
    echo "   Promedio diario: $AVG_GB GB/día"
    echo "   Máximo en un día: $MAX_GB GB"
    
    # Estimar costo (primera GB gratis, luego $0.09/GB)
    if (( $(echo "$TOTAL_GB > 1" | bc -l) )); then
        COST=$(echo "scale=2; ($TOTAL_GB - 1) * 0.09" | bc)
        echo "   💰 Costo estimado: \$$COST USD"
    else
        echo "   💰 Costo estimado: \$0.00 USD (dentro de capa gratuita)"
    fi
    
    echo ""
}

# Función para obtener detalles de la instancia
get_instance_details() {
    echo "🔍 Detalles del NAT Instance:"
    echo "----------------------------------------"
    
    INSTANCE_INFO=$(aws ec2 describe-instances \
        --instance-ids "$NAT_INSTANCE_ID" \
        --query 'Reservations[0].Instances[0]' \
        --region "$REGION" \
        --output json)
    
    INSTANCE_TYPE=$(echo "$INSTANCE_INFO" | jq -r '.InstanceType')
    STATE=$(echo "$INSTANCE_INFO" | jq -r '.State.Name')
    LAUNCH_TIME=$(echo "$INSTANCE_INFO" | jq -r '.LaunchTime')
    PUBLIC_IP=$(echo "$INSTANCE_INFO" | jq -r '.PublicIpAddress // "N/A"')
    
    echo "   Tipo: $INSTANCE_TYPE"
    echo "   Estado: $STATE"
    echo "   Tiempo de ejecución: $LAUNCH_TIME"
    echo "   IP Pública: $PUBLIC_IP"
    echo ""
}

# Función para calcular costo total
calculate_total_cost() {
    echo "💰 Resumen de Costos (últimos $DAYS días):"
    echo "=========================================="
    
    # Costo de la instancia t4g.nano
    INSTANCE_COST_PER_HOUR=0.0042
    HOURS_IN_PERIOD=$((DAYS * 24))
    INSTANCE_COST=$(echo "scale=2; $INSTANCE_COST_PER_HOUR * $HOURS_IN_PERIOD" | bc)
    
    echo "   EC2 (t4g.nano): \$$INSTANCE_COST USD"
    echo "   Elastic IP: \$0.00 USD (asociado)"
    
    # Costo de transferencia de datos NetworkOut
    NETWORK_OUT_COST=$(echo "scale=2; ($TOTAL_GB - 1) * 0.09" | bc)
    if (( $(echo "$NETWORK_OUT_COST < 0" | bc -l) )); then
        NETWORK_OUT_COST=0.00
    fi
    
    echo "   Transferencia datos: \$$NETWORK_OUT_COST USD"
    
    # Total
    TOTAL_COST=$(echo "scale=2; $INSTANCE_COST + $NETWORK_OUT_COST" | bc)
    echo "   ----------------------------------------"
    echo "   TOTAL: \$$TOTAL_COST USD"
    
    # Proyección mensual
    MONTHLY_PROJECTION=$(echo "scale=2; $TOTAL_COST * 30 / $DAYS" | bc)
    echo ""
    echo "   📈 Proyección mensual: \$$MONTHLY_PROJECTION USD"
    echo ""
}

# Función para mostrar recomendaciones
show_recommendations() {
    echo "💡 Recomendaciones:"
    echo "=========================================="
    
    if (( $(echo "$TOTAL_GB > 10" | bc -l) )); then
        echo "⚠️  Alto consumo de transferencia de datos detectado"
        echo ""
        echo "   Posibles causas:"
        echo "   - Descargas frecuentes de dependencias"
        echo "   - Lambda ejecutándose con mucha frecuencia"
        echo "   - Tráfico hacia APIs externas"
        echo ""
        echo "   Soluciones:"
        echo "   1. Usar VPC Endpoints para servicios AWS (S3 ya configurado ✅)"
        echo "   2. Cachear dependencias en Lambda Layers"
        echo "   3. Reducir frecuencia de ejecuciones en desarrollo"
        echo "   4. Parar recursos cuando no se usan"
    else
        echo "✅ Consumo de transferencia de datos normal"
        echo ""
        echo "   Para optimizar aún más:"
        echo "   - Detén los recursos cuando no los uses"
        echo "   - Ejecuta: ./scripts/stop-dev-resources.sh"
    fi
    
    echo ""
}

# Función principal
main() {
    check_aws_cli
    get_nat_instance_id
    get_instance_details
    
    # Obtener métricas de red
    get_network_metrics "NetworkOut" "Tráfico de Salida (NetworkOut)"
    get_network_metrics "NetworkIn" "Tráfico de Entrada (NetworkIn)"
    
    # Calcular costos
    calculate_total_cost
    
    # Mostrar recomendaciones
    show_recommendations
    
    echo "✅ Análisis completado"
    echo ""
    echo "📝 Para más detalles, visita AWS Cost Explorer:"
    echo "   https://console.aws.amazon.com/cost-management/home"
    echo ""
}

# Ejecutar script
main


