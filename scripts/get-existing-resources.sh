#!/bin/bash

# Script para obtener información de recursos AWS existentes
# Paso Centurión Tours - Infraestructura Existente

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if AWS CLI is configured
check_aws_cli() {
    log "Verificando configuración de AWS CLI..."
    
    if ! command -v aws &> /dev/null; then
        error "AWS CLI no está instalado"
        exit 1
    fi
    
    if ! aws sts get-caller-identity &> /dev/null; then
        error "AWS CLI no está configurado correctamente"
        exit 1
    fi
    
    success "AWS CLI configurado correctamente"
}

# Get EC2 instances
get_ec2_instances() {
    log "Obteniendo información de instancias EC2..."
    
    echo "==================== INSTANCIAS EC2 ===================="
    aws ec2 describe-instances \
        --query 'Reservations[*].Instances[*].[InstanceId,Tags[?Key==`Name`].Value|[0],State.Name,PublicIpAddress,PrivateIpAddress,InstanceType,LaunchTime]' \
        --output table
    
    echo ""
    echo "Para usar en Terraform, copia el Instance ID de tu instancia:"
    aws ec2 describe-instances \
        --query 'Reservations[*].Instances[?State.Name==`running`].[InstanceId]' \
        --output text | head -1
}

# Get Elastic IPs
get_elastic_ips() {
    log "Obteniendo información de Elastic IPs..."
    
    echo "==================== ELASTIC IPs ===================="
    aws ec2 describe-addresses \
        --query 'Addresses[*].[PublicIp,InstanceId,AllocationId,Domain,Tags[?Key==`Name`].Value|[0]]' \
        --output table
    
    echo ""
    echo "Para usar en Terraform, copia la Public IP:"
    aws ec2 describe-addresses \
        --query 'Addresses[*].PublicIp' \
        --output text | head -1
}

# Get S3 buckets
get_s3_buckets() {
    log "Obteniendo información de buckets S3..."
    
    echo "==================== BUCKETS S3 ===================="
    aws s3 ls
    
    echo ""
    echo "Información detallada de buckets:"
    for bucket in $(aws s3 ls | awk '{print $3}'); do
        echo "Bucket: $bucket"
        region=$(aws s3api get-bucket-location --bucket $bucket --query 'LocationConstraint' --output text 2>/dev/null || echo "us-east-1")
        if [ "$region" = "None" ]; then
            region="us-east-1"
        fi
        echo "  Region: $region"
        echo "  Domain: $bucket.s3.amazonaws.com"
        echo "  Regional Domain: $bucket.s3.$region.amazonaws.com"
        
        # Check if bucket has images
        image_count=$(aws s3 ls s3://$bucket --recursive | grep -E '\.(jpg|jpeg|png|gif|webp)$' | wc -l || echo "0")
        echo "  Images found: $image_count"
        echo ""
    done
}

# Get Route 53 hosted zones
get_hosted_zones() {
    log "Obteniendo información de Route 53..."
    
    echo "==================== ROUTE 53 HOSTED ZONES ===================="
    aws route53 list-hosted-zones \
        --query 'HostedZones[*].[Name,Id,ResourceRecordSetCount]' \
        --output table 2>/dev/null || warning "No se pudieron obtener hosted zones (puede que no tengas permisos o no existan)"
    
    echo ""
    echo "Registros DNS para pasocenturion.com.uy:"
    hosted_zone_id=$(aws route53 list-hosted-zones \
        --query 'HostedZones[?contains(Name, `pasocenturion.com.uy`)].Id' \
        --output text 2>/dev/null | sed 's|/hostedzone/||' || echo "")
    
    if [ ! -z "$hosted_zone_id" ]; then
        echo "Hosted Zone ID: $hosted_zone_id"
        aws route53 list-resource-record-sets \
            --hosted-zone-id $hosted_zone_id \
            --query 'ResourceRecordSets[*].[Name,Type,ResourceRecords[0].Value]' \
            --output table 2>/dev/null || true
    else
        warning "No se encontró hosted zone para pasocenturion.com.uy"
    fi
}

# Get VPC information
get_vpc_info() {
    log "Obteniendo información de VPCs..."
    
    echo "==================== VPCs ===================="
    aws ec2 describe-vpcs \
        --query 'Vpcs[*].[VpcId,CidrBlock,State,IsDefault,Tags[?Key==`Name`].Value|[0]]' \
        --output table
    
    echo ""
    echo "Subnets:"
    aws ec2 describe-subnets \
        --query 'Subnets[*].[SubnetId,VpcId,CidrBlock,AvailabilityZone,MapPublicIpOnLaunch,Tags[?Key==`Name`].Value|[0]]' \
        --output table
}

# Get Security Groups
get_security_groups() {
    log "Obteniendo información de Security Groups..."
    
    echo "==================== SECURITY GROUPS ===================="
    aws ec2 describe-security-groups \
        --query 'SecurityGroups[*].[GroupId,GroupName,Description,VpcId]' \
        --output table
}

# Generate terraform.tfvars template
generate_terraform_vars() {
    log "Generando archivo terraform.tfvars con tus recursos..."
    
    # Get current resources
    INSTANCE_ID=$(aws ec2 describe-instances \
        --query 'Reservations[*].Instances[?State.Name==`running`].[InstanceId]' \
        --output text | head -1 || echo "i-CHANGE-ME")
    
    ELASTIC_IP=$(aws ec2 describe-addresses \
        --query 'Addresses[*].PublicIp' \
        --output text | head -1 || echo "CHANGE-ME")
    
    # Try to find image bucket
    S3_BUCKET=""
    for bucket in $(aws s3 ls | awk '{print $3}'); do
        image_count=$(aws s3 ls s3://$bucket --recursive | grep -E '\.(jpg|jpeg|png|gif|webp)$' | wc -l 2>/dev/null || echo "0")
        if [ "$image_count" -gt "0" ]; then
            S3_BUCKET=$bucket
            break
        fi
    done
    
    if [ -z "$S3_BUCKET" ]; then
        S3_BUCKET=$(aws s3 ls | awk '{print $3}' | head -1 || echo "CHANGE-ME")
    fi
    
    HOSTED_ZONE_ID=$(aws route53 list-hosted-zones \
        --query 'HostedZones[?contains(Name, `pasocenturion.com.uy`)].Id' \
        --output text 2>/dev/null | sed 's|/hostedzone/||' || echo "")
    
    # Get your public IP
    YOUR_IP=$(curl -s ifconfig.me || echo "CHANGE-ME")
    
    cat > terraform.tfvars << EOF
# Configuración para infraestructura existente de Paso Centurión Tours
# Generado automáticamente el $(date)

# AWS Configuration
aws_region  = "us-east-1"
environment = "production"
project_name = "paso-centurion-tours"

# Infraestructura existente - VERIFICAR Y ACTUALIZAR
existing_ec2_instance_id = "$INSTANCE_ID"
existing_elastic_ip = "$ELASTIC_IP"
existing_s3_bucket_name = "$S3_BUCKET"
existing_s3_bucket_domain = "$S3_BUCKET.s3.amazonaws.com"

# Dominio
domain_name = "pasocenturion.com.uy"

# Route 53 configuration
create_hosted_zone = $([ -z "$HOSTED_ZONE_ID" ] && echo "true" || echo "false")
$([ ! -z "$HOSTED_ZONE_ID" ] && echo "existing_hosted_zone_id = \"$HOSTED_ZONE_ID\"" || echo "# existing_hosted_zone_id = \"\"")

# Network Configuration
vpc_cidr = "10.0.0.0/16"
public_subnet_cidrs = ["10.0.1.0/24", "10.0.2.0/24"]
private_subnet_cidrs = ["10.0.10.0/24", "10.0.20.0/24"]

# IMPORTANTE: Cambiar por tu IP específica para mayor seguridad
allowed_ssh_cidrs = ["$YOUR_IP/32"]  # Tu IP actual

# Database Configuration
create_database = true
db_instance_class = "db.t3.micro"
db_allocated_storage = 20
db_max_allocated_storage = 100
postgres_version = "15.4"
db_name = "pasocenturiondb"
db_username = "dbadmin"
db_password = "CAMBIAR_PASSWORD_SEGURA_123!"  # ¡CAMBIAR!

# Security Features
enable_waf = true
enable_cloudfront = true
enable_alb = true

# Monitoring
enable_monitoring = true
log_retention_days = 30

# SSL Configuration
ssl_policy = "ELBSecurityPolicy-TLS-1-2-2017-01"

# Backups
enable_automated_backups = true
db_backup_retention_period = 7
db_backup_window = "03:00-04:00"
db_maintenance_window = "sun:04:00-sun:05:00"

# Additional tags
additional_tags = {
  Owner = "Laura Magallanes"
  CostCenter = "PasoCenturionTours"
}
EOF
    
    success "Archivo terraform.tfvars generado"
    warning "IMPORTANTE: Revisa y actualiza los valores en terraform.tfvars antes de usar"
    warning "Especialmente: db_password y allowed_ssh_cidrs"
}

# Main function
main() {
    echo "========================================================"
    echo "  PASO CENTURIÓN TOURS - ANÁLISIS DE INFRAESTRUCTURA"
    echo "========================================================"
    echo ""
    
    check_aws_cli
    echo ""
    
    get_ec2_instances
    echo ""
    
    get_elastic_ips
    echo ""
    
    get_s3_buckets
    echo ""
    
    get_hosted_zones
    echo ""
    
    get_vpc_info
    echo ""
    
    get_security_groups
    echo ""
    
    generate_terraform_vars
    echo ""
    
    success "Análisis completado"
    echo ""
    echo "========================================================"
    echo "PRÓXIMOS PASOS:"
    echo "1. Revisa el archivo terraform.tfvars generado"
    echo "2. Actualiza la contraseña de la base de datos"
    echo "3. Verifica que los IDs de recursos sean correctos"
    echo "4. Ejecuta: terraform plan -var-file=terraform.tfvars"
    echo "========================================================"
}

main
