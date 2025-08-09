#!/bin/bash

# Script para configurar seguridad AWS con COSTO MÍNIMO
# Paso Centurión Tours - Solo recursos gratuitos o muy baratos

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

# Banner
show_banner() {
    echo "============================================================"
    echo "  🚀 PASO CENTURIÓN TOURS - SETUP GRATUITO/MÍNIMO COSTO"
    echo "============================================================"
    echo ""
    echo "Este script configurará seguridad AWS con costos mínimos:"
    echo "• Security Groups mejorados (GRATIS)"
    echo "• CloudFront CDN (GRATIS hasta 1TB/mes)"
    echo "• SSL Certificate (GRATIS)"
    echo "• Optimizaciones S3 (GRATIS)"
    echo "• Monitoreo básico (GRATIS)"
    echo ""
}

# Check prerequisites
check_prerequisites() {
    log "Verificando prerequisitos..."
    
    if ! command -v aws &> /dev/null; then
        error "AWS CLI no está instalado"
        exit 1
    fi
    
    if ! command -v terraform &> /dev/null; then
        error "Terraform no está instalado"
        exit 1
    fi
    
    if ! aws sts get-caller-identity &> /dev/null; then
        error "AWS CLI no está configurado"
        exit 1
    fi
    
    success "Prerequisitos verificados"
}

# Get user preferences
get_preferences() {
    echo ""
    log "Configurando preferencias de costo..."
    
    echo "Selecciona tu nivel de presupuesto:"
    echo "1) GRATIS - Solo mejoras gratuitas ($0/mes)"
    echo "2) MÍNIMO - Con dominio custom ($0-3/mes)"  
    echo "3) BÁSICO - Con base de datos ($13/mes)"
    echo "4) COMPLETO - Infraestructura completa ($60/mes)"
    echo ""
    
    read -p "Selecciona opción (1-4): " BUDGET_LEVEL
    
    case $BUDGET_LEVEL in
        1)
            BUDGET_NAME="GRATIS"
            USE_DOMAIN="false"
            USE_DATABASE="false"
            USE_VPC="false"
            ;;
        2)
            BUDGET_NAME="MÍNIMO"
            USE_DOMAIN="true"
            USE_DATABASE="false"
            USE_VPC="false"
            ;;
        3)
            BUDGET_NAME="BÁSICO"
            USE_DOMAIN="true"
            USE_DATABASE="true"
            USE_VPC="false"
            ;;
        4)
            BUDGET_NAME="COMPLETO"
            USE_DOMAIN="true"
            USE_DATABASE="true"
            USE_VPC="true"
            ;;
        *)
            warning "Opción inválida, usando GRATIS por defecto"
            BUDGET_LEVEL=1
            BUDGET_NAME="GRATIS"
            USE_DOMAIN="false"
            USE_DATABASE="false"
            USE_VPC="false"
            ;;
    esac
    
    success "Configuración seleccionada: $BUDGET_NAME"
}

# Get existing resources
get_existing_resources() {
    log "Obteniendo información de recursos existentes..."
    
    # Get EC2 instance
    INSTANCE_ID=$(aws ec2 describe-instances \
        --query 'Reservations[*].Instances[?State.Name==`running`].[InstanceId]' \
        --output text | head -1)
    
    if [ -z "$INSTANCE_ID" ]; then
        error "No se encontró instancia EC2 en ejecución"
        exit 1
    fi
    
    # Get Elastic IP
    ELASTIC_IP=$(aws ec2 describe-addresses \
        --query 'Addresses[*].PublicIp' \
        --output text | head -1)
    
    if [ -z "$ELASTIC_IP" ]; then
        error "No se encontró Elastic IP"
        exit 1
    fi
    
    # Get S3 bucket with images
    S3_BUCKET=""
    for bucket in $(aws s3 ls | awk '{print $3}'); do
        image_count=$(aws s3 ls s3://$bucket --recursive | grep -E '\.(jpg|jpeg|png|gif|webp)$' | wc -l 2>/dev/null || echo "0")
        if [ "$image_count" -gt "0" ]; then
            S3_BUCKET=$bucket
            break
        fi
    done
    
    if [ -z "$S3_BUCKET" ]; then
        S3_BUCKET=$(aws s3 ls | awk '{print $3}' | head -1)
        warning "No se encontraron imágenes, usando primer bucket: $S3_BUCKET"
    fi
    
    # Get hosted zone if exists
    HOSTED_ZONE_ID=""
    if [ "$USE_DOMAIN" = "true" ]; then
        HOSTED_ZONE_ID=$(aws route53 list-hosted-zones \
            --query 'HostedZones[?contains(Name, `pasocenturion.com.uy`)].Id' \
            --output text 2>/dev/null | sed 's|/hostedzone/||' || echo "")
    fi
    
    # Get your public IP
    YOUR_IP=$(curl -s ifconfig.me || echo "0.0.0.0")
    
    success "Recursos existentes identificados:"
    echo "  • EC2 Instance: $INSTANCE_ID"
    echo "  • Elastic IP: $ELASTIC_IP"
    echo "  • S3 Bucket: $S3_BUCKET"
    echo "  • Tu IP: $YOUR_IP"
    if [ ! -z "$HOSTED_ZONE_ID" ]; then
        echo "  • Hosted Zone: $HOSTED_ZONE_ID"
    fi
}

# Generate terraform configuration
generate_terraform_config() {
    log "Generando configuración de Terraform optimizada para costos..."
    
    cd terraform
    
    # Determine which configuration to use
    if [ "$BUDGET_LEVEL" = "4" ]; then
        CONFIG_FILE="existing.tfvars.example"
        TF_FILES="existing-*.tf"
    else
        CONFIG_FILE="cost-optimized.tfvars.example"
        TF_FILES="cost-optimized*.tf"
    fi
    
    cp $CONFIG_FILE terraform.tfvars
    
    # Update with actual values
    cat > terraform.tfvars << EOF
# Configuración optimizada para $BUDGET_NAME
# Generado automáticamente el $(date)

# AWS Configuration
aws_region  = "us-east-1"
environment = "production"
project_name = "paso-centurion-tours"

# Infraestructura existente
existing_ec2_instance_id = "$INSTANCE_ID"
existing_elastic_ip = "$ELASTIC_IP"
existing_s3_bucket_name = "$S3_BUCKET"
existing_s3_bucket_domain = "$S3_BUCKET.s3.amazonaws.com"

# Configuración de presupuesto: $BUDGET_NAME
EOF

    if [ "$USE_DOMAIN" = "true" ]; then
        cat >> terraform.tfvars << EOF
domain_name = "pasocenturion.com.uy"
enable_ssl = true
existing_hosted_zone_id = "$HOSTED_ZONE_ID"
EOF
    else
        cat >> terraform.tfvars << EOF
domain_name = ""
enable_ssl = false
existing_hosted_zone_id = ""
EOF
    fi

    cat >> terraform.tfvars << EOF

# Opciones de costo
create_vpc = $USE_VPC
enable_cloudfront = true
create_database = $USE_DATABASE
enable_basic_monitoring = true
enable_direct_http = true
enable_direct_https = false

# Seguridad
allowed_ssh_cidrs = ["$YOUR_IP/32"]

# Base de datos (solo si create_database = true)
db_name = "pasocenturiondb"
db_username = "dbadmin"
db_password = "$(openssl rand -base64 12)PasoCenturion!"
EOF

    success "Configuración de Terraform generada"
}

# Initialize and plan terraform
terraform_plan() {
    log "Inicializando Terraform..."
    
    terraform init -reconfigure
    
    log "Generando plan de Terraform..."
    terraform plan -var-file=terraform.tfvars -out=tfplan
    
    echo ""
    warning "REVISA EL PLAN ANTES DE CONTINUAR"
    echo "El plan muestra exactamente qué recursos se crearán y sus costos estimados."
    echo ""
    
    read -p "¿Continuar con la aplicación? (y/N): " CONTINUE
    
    if [[ ! $CONTINUE =~ ^[Yy]$ ]]; then
        warning "Aplicación cancelada por el usuario"
        exit 0
    fi
}

# Apply terraform configuration
terraform_apply() {
    log "Aplicando configuración de Terraform..."
    
    terraform apply tfplan
    
    success "Configuración aplicada exitosamente"
}

# Show results and next steps
show_results() {
    echo ""
    echo "============================================================"
    echo "  ✅ CONFIGURACIÓN COMPLETADA - $BUDGET_NAME"
    echo "============================================================"
    echo ""
    
    # Get outputs
    if [ "$BUDGET_LEVEL" != "1" ]; then
        CLOUDFRONT_DOMAIN=$(terraform output -raw cloudfront_domain_name 2>/dev/null || echo "No disponible")
        echo "🌐 CloudFront Domain: $CLOUDFRONT_DOMAIN"
    fi
    
    echo "🖥️  EC2 Instance: $INSTANCE_ID"
    echo "🌍 Elastic IP: $ELASTIC_IP"
    echo "📦 S3 Bucket: $S3_BUCKET"
    echo ""
    
    echo "💰 COSTOS ESTIMADOS:"
    case $BUDGET_LEVEL in
        1)
            echo "   • CloudFront: GRATIS (hasta 1TB/mes)"
            echo "   • Security Groups: GRATIS"
            echo "   • SSL Certificate: GRATIS"
            echo "   • Total: $0/mes"
            ;;
        2)
            echo "   • CloudFront: GRATIS (hasta 1TB/mes)"
            echo "   • Route 53: ~$0.50/mes"
            echo "   • Total: ~$0.50-3/mes"
            ;;
        3)
            echo "   • CloudFront: GRATIS (hasta 1TB/mes)"
            echo "   • Route 53: ~$0.50/mes"
            echo "   • RDS db.t3.micro: ~$13/mes"
            echo "   • Total: ~$13-15/mes"
            ;;
        4)
            echo "   • Infraestructura completa: ~$60/mes"
            ;;
    esac
    
    echo ""
    echo "🔧 PRÓXIMOS PASOS:"
    
    if [ "$USE_DOMAIN" = "true" ]; then
        echo "1. Configurar DNS en tu proveedor (.uy):"
        if [ "$BUDGET_LEVEL" != "1" ]; then
            echo "   pasocenturion.com.uy → CNAME → $CLOUDFRONT_DOMAIN"
        fi
        echo ""
    fi
    
    echo "2. Verificar configuración:"
    echo "   curl -I http://$ELASTIC_IP"
    if [ "$USE_DOMAIN" = "true" ] && [ "$BUDGET_LEVEL" != "1" ]; then
        echo "   curl -I https://$CLOUDFRONT_DOMAIN"
    fi
    echo ""
    
    echo "3. Monitorear en AWS Console:"
    echo "   • CloudWatch → Dashboards"
    echo "   • CloudFront → Distributions"
    if [ "$USE_DATABASE" = "true" ]; then
        echo "   • RDS → Databases"
    fi
    echo ""
    
    echo "4. Configurar tu aplicación:"
    echo "   ssh -i tu-clave.pem ec2-user@$ELASTIC_IP"
    echo ""
    
    success "¡Tu infraestructura está lista con costos optimizados!"
}

# Main function
main() {
    show_banner
    check_prerequisites
    get_preferences
    get_existing_resources
    generate_terraform_config
    terraform_plan
    terraform_apply
    show_results
}

# Run main function
main
