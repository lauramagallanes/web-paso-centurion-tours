#!/bin/bash

# ====================================================================
# Script para configurar las credenciales de Google y Facebook
# para obtener reviews reales en tu aplicación
# ====================================================================

AWS_PROFILE="laura"
AWS_REGION="us-east-1"
LAMBDA_FUNCTION_NAME="tinambu-tours-backend-dev"

echo "🔧 Configuración de APIs de Reviews para Tinambú Tours"
echo "======================================================"
echo ""

# Solicitar Google Place ID
read -p "📍 Ingresa tu Google Place ID: " GOOGLE_PLACE_ID

# Solicitar Google API Key
read -p "🔑 Ingresa tu Google API Key: " GOOGLE_API_KEY

# Preguntar si también quiere configurar Facebook
read -p "¿Quieres configurar Facebook ahora? (s/n): " CONFIGURAR_FACEBOOK

if [[ $CONFIGURAR_FACEBOOK == "s" || $CONFIGURAR_FACEBOOK == "S" ]]; then
  read -p "📘 Ingresa tu Facebook Page ID: " FACEBOOK_PAGE_ID
  read -p "🔐 Ingresa tu Facebook Access Token: " FACEBOOK_ACCESS_TOKEN
fi

echo ""
echo "⚙️  Configurando variables de entorno en Lambda..."
echo ""

# Construir el JSON con las variables de entorno
ENV_VARS=$(cat <<EOF
{
  "Variables": {
    "GOOGLE_API_KEY": "$GOOGLE_API_KEY",
    "GOOGLE_PLACE_ID": "$GOOGLE_PLACE_ID"
EOF
)

# Agregar Facebook si se configuró
if [[ $CONFIGURAR_FACEBOOK == "s" || $CONFIGURAR_FACEBOOK == "S" ]]; then
  ENV_VARS+=",
    \"FACEBOOK_PAGE_ID\": \"$FACEBOOK_PAGE_ID\",
    \"FACEBOOK_ACCESS_TOKEN\": \"$FACEBOOK_ACCESS_TOKEN\""
fi

ENV_VARS+="
  }
}"

# Actualizar las variables de entorno en Lambda
aws lambda update-function-configuration \
  --function-name "$LAMBDA_FUNCTION_NAME" \
  --region "$AWS_REGION" \
  --environment "$ENV_VARS" \
  --profile "$AWS_PROFILE"

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Variables de entorno configuradas exitosamente en Lambda!"
  echo ""
  echo "📋 Resumen de configuración:"
  echo "  - Google Place ID: ${GOOGLE_PLACE_ID:0:20}..."
  echo "  - Google API Key: ${GOOGLE_API_KEY:0:20}..."
  if [[ $CONFIGURAR_FACEBOOK == "s" || $CONFIGURAR_FACEBOOK == "S" ]]; then
    echo "  - Facebook Page ID: $FACEBOOK_PAGE_ID"
    echo "  - Facebook Access Token: ${FACEBOOK_ACCESS_TOKEN:0:20}..."
  fi
  echo ""
  echo "🚀 Ahora tu aplicación puede obtener reviews reales de Google"
  if [[ $CONFIGURAR_FACEBOOK == "s" || $CONFIGURAR_FACEBOOK == "S" ]]; then
    echo "🚀 Y también de Facebook"
  fi
else
  echo ""
  echo "❌ Error al configurar las variables de entorno"
  echo "Por favor verifica que:"
  echo "  1. Tu AWS Profile 'laura' esté configurado correctamente"
  echo "  2. Tengas permisos para actualizar la función Lambda"
  echo "  3. El nombre de la función Lambda sea correcto"
fi

echo ""
echo "======================================================"


