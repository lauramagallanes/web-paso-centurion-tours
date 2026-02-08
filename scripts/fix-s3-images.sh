#!/bin/bash

# Script para arreglar permisos y CORS de las imágenes en S3

set -e

AWS_PROFILE="laura"
S3_BUCKET_NAME="tinambu-public-assets-dev"
AWS_REGION="us-east-1"

echo "🔧 Arreglando configuración de S3 para imágenes..."
echo ""

# 1. Aplicar configuración de CORS
echo "1️⃣ Aplicando configuración de CORS al bucket..."
aws s3api put-bucket-cors \
  --bucket "${S3_BUCKET_NAME}" \
  --region "${AWS_REGION}" \
  --cors-configuration file://scripts/s3-cors-config.json \
  --profile "${AWS_PROFILE}"

echo "✅ Configuración de CORS aplicada"
echo ""

# 2. Aplicar bucket policy para hacer públicas las imágenes
echo "2️⃣ Aplicando bucket policy para acceso público a imágenes..."
aws s3api put-bucket-policy \
  --bucket "${S3_BUCKET_NAME}" \
  --region "${AWS_REGION}" \
  --policy file://scripts/s3-bucket-policy.json \
  --profile "${AWS_PROFILE}"

echo "✅ Bucket policy aplicada - todas las imágenes en /senderos/ son ahora públicas"
echo ""

# 3. Verificar una imagen
echo "3️⃣ Verificando que las imágenes sean accesibles..."
TEST_URL="https://${S3_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/senderos/"
echo "   Probando acceso a: ${TEST_URL}"
curl -I "${TEST_URL}" 2>&1 | grep -i "HTTP\|Access-Control" || true

echo ""
echo "✅ Configuración completada!"
echo ""
echo "🌐 Las imágenes deberían ser accesibles ahora desde:"
echo "   https://${S3_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/senderos/..."

