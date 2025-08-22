#!/bin/bash

# Terraform Deployment Script for Tinambú Tours
# Usage: ./deploy.sh <environment> [plan|apply|destroy]

set -e

ENVIRONMENT=${1:-dev}
ACTION=${2:-plan}

if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|prod)$ ]]; then
    echo "Error: Environment must be one of: dev, staging, prod"
    exit 1
fi

if [[ ! "$ACTION" =~ ^(plan|apply|destroy)$ ]]; then
    echo "Error: Action must be one of: plan, apply, destroy"
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_DIR="${SCRIPT_DIR}/../environments/${ENVIRONMENT}"

echo "🚀 Deploying Tinambú Tours infrastructure..."
echo "Environment: ${ENVIRONMENT}"
echo "Action: ${ACTION}"
echo "Directory: ${ENV_DIR}"

cd "${ENV_DIR}"

# Initialize Terraform
echo "📋 Initializing Terraform..."
terraform init

# Validate configuration
echo "✅ Validating Terraform configuration..."
terraform validate

# Format code
echo "🎨 Formatting Terraform code..."
terraform fmt -recursive

# Run the specified action
case $ACTION in
    plan)
        echo "📊 Running Terraform plan..."
        terraform plan
        ;;
    apply)
        if [[ "$ENVIRONMENT" == "prod" ]]; then
            echo "⚠️  Production deployment requires manual confirmation"
            terraform apply
        else
            echo "🔧 Applying Terraform configuration..."
            terraform apply -auto-approve
        fi
        ;;
    destroy)
        echo "💥 Destroying infrastructure..."
        if [[ "$ENVIRONMENT" == "prod" ]]; then
            echo "⚠️  Production destruction requires manual confirmation"
            terraform destroy
        else
            echo "Are you sure you want to destroy the $ENVIRONMENT environment? (yes/no)"
            read -r confirmation
            if [[ "$confirmation" == "yes" ]]; then
                terraform destroy -auto-approve
            else
                echo "Destruction cancelled."
                exit 0
            fi
        fi
        ;;
esac

echo "✅ Terraform $ACTION completed successfully!"

# Show outputs if apply was successful
if [[ "$ACTION" == "apply" ]]; then
    echo ""
    echo "📋 Infrastructure Outputs:"
    terraform output
fi

