#!/bin/bash
# Deployment Configuration Template
# Copy this file to deployment-config.sh and fill with your actual values

# AWS Configuration
export AWS_PROFILE=your-aws-profile-name
export AWS_REGION=us-east-1

# S3 Buckets
export FRONTEND_BUCKET=your-frontend-bucket-name
export ASSETS_BUCKET=your-assets-bucket-name

# AWS Lambda Configuration
export LAMBDA_FUNCTION_NAME=your-lambda-function-name

# API Gateway Configuration
export API_GATEWAY_ID=your-api-gateway-id
export INTEGRATION_ID=your-integration-id

# Optional: Set these if they differ from defaults
# export DB_HOST=your-rds-endpoint.amazonaws.com
# export DB_NAME=your-database-name
# export DB_USERNAME=your-database-username

echo "✅ Deployment environment variables loaded"
echo "📦 Frontend bucket: $FRONTEND_BUCKET"
echo "⚡ Lambda function: $LAMBDA_FUNCTION_NAME"  
echo "🌐 API Gateway: $API_GATEWAY_ID"
