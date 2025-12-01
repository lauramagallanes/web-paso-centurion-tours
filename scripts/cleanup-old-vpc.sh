#!/bin/bash
# Script para limpiar recursos de VPC antigua después de que las ENIs se liberen
# Las ENIs de Lambda pueden tardar hasta 40 minutos en liberarse automáticamente

set -e

export AWS_PROFILE=laura
VPC_ID="vpc-0a2089e019248e5e5"

echo "=== Limpieza de VPC Antigua ==="
echo "VPC ID: $VPC_ID"
echo ""

# Función para verificar si hay ENIs activas
check_enis() {
    aws ec2 describe-network-interfaces \
        --filters "Name=vpc-id,Values=$VPC_ID" \
        --query 'NetworkInterfaces[?Status==`in-use`]' \
        --output json | jq -r 'length'
}

# Esperar a que las ENIs se liberen (máximo 60 minutos)
echo "Esperando a que las ENIs de Lambda se liberen..."
MAX_WAIT=60
WAITED=0

while [ $WAITED -lt $MAX_WAIT ]; do
    ENI_COUNT=$(check_enis)
    if [ "$ENI_COUNT" -eq "0" ]; then
        echo "✅ Todas las ENIs se han liberado!"
        break
    fi
    echo "⏳ Aún hay $ENI_COUNT ENIs activas. Esperando 2 minutos más... ($WAITED/$MAX_WAIT minutos)"
    sleep 120
    WAITED=$((WAITED + 2))
done

if [ "$ENI_COUNT" -gt "0" ]; then
    echo "⚠️  Aún hay ENIs activas después de $MAX_WAIT minutos."
    echo "Las ENIs se liberarán automáticamente cuando AWS termine de limpiarlas."
    exit 1
fi

echo ""
echo "=== Eliminando recursos ==="

# 1. Eliminar Security Groups
echo "1. Eliminando Security Groups..."
for sg in $(aws ec2 describe-security-groups \
    --filters "Name=vpc-id,Values=$VPC_ID" \
    --query 'SecurityGroups[?GroupName!=`default`].GroupId' \
    --output text); do
    echo "   Eliminando $sg..."
    aws ec2 delete-security-group --group-id $sg 2>&1 || echo "   ⚠️  No se pudo eliminar $sg"
done

# 2. Eliminar Subnets
echo "2. Eliminando Subnets..."
for subnet in $(aws ec2 describe-subnets \
    --filters "Name=vpc-id,Values=$VPC_ID" \
    --query 'Subnets[*].SubnetId' \
    --output text); do
    echo "   Eliminando $subnet..."
    aws ec2 delete-subnet --subnet-id $subnet 2>&1 || echo "   ⚠️  No se pudo eliminar $subnet"
done

# 3. Desasociar y eliminar Internet Gateway
echo "3. Eliminando Internet Gateway..."
IGW_ID=$(aws ec2 describe-internet-gateways \
    --filters "Name=attachment.vpc-id,Values=$VPC_ID" \
    --query 'InternetGateways[0].InternetGatewayId' \
    --output text)

if [ "$IGW_ID" != "None" ] && [ -n "$IGW_ID" ]; then
    echo "   Desasociando $IGW_ID..."
    aws ec2 detach-internet-gateway --internet-gateway-id $IGW_ID --vpc-id $VPC_ID 2>&1 || true
    echo "   Eliminando $IGW_ID..."
    aws ec2 delete-internet-gateway --internet-gateway-id $IGW_ID 2>&1 || echo "   ⚠️  No se pudo eliminar $IGW_ID"
fi

# 4. Eliminar Route Tables (excepto main)
echo "4. Eliminando Route Tables..."
for rt in $(aws ec2 describe-route-tables \
    --filters "Name=vpc-id,Values=$VPC_ID" \
    --query 'RouteTables[?Associations[0].Main==`false`].RouteTableId' \
    --output text); do
    echo "   Eliminando $rt..."
    aws ec2 delete-route-table --route-table-id $rt 2>&1 || echo "   ⚠️  No se pudo eliminar $rt"
done

# 5. Eliminar VPC
echo "5. Eliminando VPC..."
aws ec2 delete-vpc --vpc-id $VPC_ID 2>&1 && echo "✅ VPC eliminada exitosamente!" || echo "⚠️  No se pudo eliminar la VPC (puede tener dependencias restantes)"

echo ""
echo "=== Limpieza completada ==="

