#!/bin/bash

# Script para subir JAR a Lambda
# Uso: ./upload-jar.sh

echo "=== 🚀 UPLOADING JAR TO LAMBDA ==="

JAR_FILE="target/tinambu-tours-lambda.jar"
S3_BUCKET="tinambu-public-assets-dev"
S3_KEY="lambda/tinambu-tours-lambda-AUTH-ENDPOINTS.jar"
LAMBDA_FUNCTION="tinambu-tours-backend-dev"

# Verificar que el JAR existe
if [ ! -f "$JAR_FILE" ]; then
    echo "❌ Error: JAR file not found: $JAR_FILE"
    echo "Run 'mvn clean package -DskipTests' first"
    exit 1
fi

echo "📦 JAR file: $JAR_FILE"
echo "📊 JAR size: $(du -h $JAR_FILE | cut -f1)"

# Subir a S3
echo "📤 Uploading to S3..."
aws s3 cp "$JAR_FILE" "s3://$S3_BUCKET/$S3_KEY"

if [ $? -eq 0 ]; then
    echo "✅ Successfully uploaded to S3"
    
    # Actualizar función Lambda
    echo "🔄 Updating Lambda function..."
    aws lambda update-function-code \
        --function-name "$LAMBDA_FUNCTION" \
        --s3-bucket "$S3_BUCKET" \
        --s3-key "$S3_KEY"
    
    if [ $? -eq 0 ]; then
        echo "✅ Lambda function updated successfully!"
        echo ""
        echo "🧪 Ready to test endpoints:"
        echo "- GET  https://53dmek6dqk.execute-api.us-east-1.amazonaws.com/auth/info"
        echo "- POST https://53dmek6dqk.execute-api.us-east-1.amazonaws.com/auth/login"
        echo "- POST https://53dmek6dqk.execute-api.us-east-1.amazonaws.com/auth/signup"
    else
        echo "❌ Failed to update Lambda function"
        exit 1
    fi
else
    echo "❌ Failed to upload to S3"
    exit 1
fi

