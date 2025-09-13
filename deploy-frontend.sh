#!/bin/bash

# Script de deploy del frontend a S3
# Requiere AWS CLI configurado

BUCKET_NAME="tinambu-frontend-dev"
BUILD_DIR="frontend/dist"
REGION="us-east-1"

echo "🚀 Deploying frontend to S3..."
echo "Bucket: $BUCKET_NAME"
echo "Build dir: $BUILD_DIR"
echo "Region: $REGION"
echo ""

# Verificar que el build existe
if [ ! -d "$BUILD_DIR" ]; then
    echo "❌ Build directory not found: $BUILD_DIR"
    echo "Run 'cd frontend && npm run build' first"
    exit 1
fi

# Verificar AWS CLI y credenciales
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not installed"
    exit 1
fi

if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured"
    echo ""
    echo "Configure with:"
    echo "  aws configure sso"
    echo "  or"
    echo "  aws configure"
    echo ""
    echo "Or use environment variables:"
    echo "  export AWS_ACCESS_KEY_ID=your_key"
    echo "  export AWS_SECRET_ACCESS_KEY=your_secret"
    echo "  export AWS_DEFAULT_REGION=us-east-1"
    exit 1
fi

# Deploy to S3
echo "📤 Uploading files to S3..."
if aws s3 sync "$BUILD_DIR" "s3://$BUCKET_NAME" --delete --region "$REGION"; then
    echo ""
    echo "✅ Deploy successful!"
    echo ""
    echo "🌐 Frontend available at:"
    echo "https://$BUCKET_NAME.s3.us-east-1.amazonaws.com/index.html"
    echo ""
    echo "Or (if configured as website):"
    echo "https://$BUCKET_NAME.s3-website-us-east-1.amazonaws.com/"
else
    echo ""
    echo "❌ Deploy failed"
    exit 1
fi

# Optional: Invalidate CloudFront cache if available
echo "💨 Checking for CloudFront distribution..."
DISTRIBUTION_ID=$(aws cloudfront list-distributions --query "DistributionList.Items[?contains(Origins.Items[0].DomainName, '$BUCKET_NAME')].Id" --output text 2>/dev/null)

if [ ! -z "$DISTRIBUTION_ID" ] && [ "$DISTRIBUTION_ID" != "None" ]; then
    echo "🔄 Invalidating CloudFront cache: $DISTRIBUTION_ID"
    aws cloudfront create-invalidation --distribution-id "$DISTRIBUTION_ID" --paths "/*"
    echo "✅ CloudFront invalidation requested"
else
    echo "ℹ️ No CloudFront distribution found (this is normal for S3-only hosting)"
fi

echo ""
echo "🎉 Deploy completed!"
