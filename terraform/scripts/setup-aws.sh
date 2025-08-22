#!/bin/bash

# AWS Setup Script for Tinambú Tours
# Creates S3 buckets for Terraform state and DynamoDB tables for locking

set -e

AWS_REGION=${1:-us-east-1}
PROJECT_NAME="tinambu-tours"

echo "🔧 Setting up AWS infrastructure for Terraform state management..."
echo "Region: ${AWS_REGION}"

# Create S3 buckets for each environment
for env in dev staging prod; do
    BUCKET_NAME="tinambu-terraform-state-${env}"
    TABLE_NAME="tinambu-terraform-lock-${env}"
    
    echo "📦 Creating S3 bucket: ${BUCKET_NAME}"
    aws s3api create-bucket \
        --bucket "${BUCKET_NAME}" \
        --region "${AWS_REGION}" \
        --create-bucket-configuration LocationConstraint="${AWS_REGION}" \
        2>/dev/null || echo "Bucket ${BUCKET_NAME} already exists"
    
    # Enable versioning
    aws s3api put-bucket-versioning \
        --bucket "${BUCKET_NAME}" \
        --versioning-configuration Status=Enabled
    
    # Enable encryption
    aws s3api put-bucket-encryption \
        --bucket "${BUCKET_NAME}" \
        --server-side-encryption-configuration '{
            "Rules": [
                {
                    "ApplyServerSideEncryptionByDefault": {
                        "SSEAlgorithm": "AES256"
                    }
                }
            ]
        }'
    
    # Block public access
    aws s3api put-public-access-block \
        --bucket "${BUCKET_NAME}" \
        --public-access-block-configuration \
        BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
    
    echo "🔒 Creating DynamoDB table: ${TABLE_NAME}"
    aws dynamodb create-table \
        --table-name "${TABLE_NAME}" \
        --attribute-definitions AttributeName=LockID,AttributeType=S \
        --key-schema AttributeName=LockID,KeyType=HASH \
        --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
        --region "${AWS_REGION}" \
        2>/dev/null || echo "Table ${TABLE_NAME} already exists"
done

echo "✅ AWS setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Update your AWS credentials"
echo "2. Run: ./deploy.sh dev plan"
echo "3. Run: ./deploy.sh dev apply"

