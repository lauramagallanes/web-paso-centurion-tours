#!/bin/bash

# Script para diagnosticar y arreglar frontend S3
# Uso: ./fix-s3-frontend.sh

BUCKET_NAME="tinambu-frontend-dev"
REGION="us-east-1"

echo "=== 🌐 S3 FRONTEND DIAGNOSTICS AND FIX ==="
echo "Bucket: $BUCKET_NAME"
echo "Region: $REGION"
echo ""

# Función para verificar si AWS CLI está disponible
check_aws_cli() {
    if ! command -v aws &> /dev/null; then
        echo "❌ AWS CLI no está instalado"
        echo ""
        echo "🔧 SOLUCIÓN MANUAL:"
        echo "1. Abrir: https://s3.console.aws.amazon.com/s3/buckets/$BUCKET_NAME"
        echo "2. Properties → Static website hosting → Enable"
        echo "   - Index document: index.html"
        echo "   - Error document: error.html"
        echo "3. Permissions → Block public access → Edit → Uncheck all"
        echo "4. Bucket policy → Add public read policy"
        echo ""
        return 1
    fi
    return 0
}

# Función para diagnosticar el problema
diagnose_s3() {
    echo "📊 DIAGNÓSTICO:"
    echo ""
    
    # Probar acceso directo al bucket
    echo "1. Probando acceso al bucket..."
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://$BUCKET_NAME.s3.$REGION.amazonaws.com/index.html")
    echo "   Status: $HTTP_STATUS"
    
    if [ "$HTTP_STATUS" = "403" ]; then
        echo "   ❌ 403 Forbidden - Problema de permisos"
    elif [ "$HTTP_STATUS" = "404" ]; then
        echo "   ⚠️ 404 Not Found - Archivo no existe o bucket no configurado como website"
    elif [ "$HTTP_STATUS" = "200" ]; then
        echo "   ✅ 200 OK - Acceso directo funciona"
    else
        echo "   ⚠️ Status desconocido: $HTTP_STATUS"
    fi
    
    # Probar acceso como website
    echo ""
    echo "2. Probando acceso como website..."
    WEBSITE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://$BUCKET_NAME.s3-website-$REGION.amazonaws.com/")
    echo "   Status: $WEBSITE_STATUS"
    
    if [ "$WEBSITE_STATUS" = "403" ]; then
        echo "   ❌ 403 Forbidden - Website hosting no configurado o permisos"
    elif [ "$WEBSITE_STATUS" = "404" ]; then
        echo "   ⚠️ 404 Not Found - index.html no existe"
    elif [ "$WEBSITE_STATUS" = "200" ]; then
        echo "   ✅ 200 OK - Website funciona correctamente"
    else
        echo "   ⚠️ Status desconocido: $WEBSITE_STATUS"
    fi
    
    echo ""
}

# Función para mostrar comandos de arreglo
show_fix_commands() {
    echo "🔧 COMANDOS DE ARREGLO (requieren AWS CLI configurado):"
    echo ""
    
    echo "# 1. Habilitar website hosting"
    echo "aws s3 website s3://$BUCKET_NAME --index-document index.html --error-document error.html"
    echo ""
    
    echo "# 2. Remover bloqueo de acceso público"
    echo "aws s3api put-public-access-block --bucket $BUCKET_NAME --public-access-block-configuration 'BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false'"
    echo ""
    
    echo "# 3. Aplicar política de bucket público"
    echo "cat > bucket-policy.json << 'EOF'"
    echo "{"
    echo '  "Version": "2012-10-17",'
    echo '  "Statement": ['
    echo "    {"
    echo '      "Sid": "PublicReadGetObject",'
    echo '      "Effect": "Allow",'
    echo '      "Principal": "*",'
    echo '      "Action": "s3:GetObject",'
    echo "      \"Resource\": \"arn:aws:s3:::$BUCKET_NAME/*\""
    echo "    }"
    echo "  ]"
    echo "}"
    echo "EOF"
    echo ""
    echo "aws s3api put-bucket-policy --bucket $BUCKET_NAME --policy file://bucket-policy.json"
    echo ""
}

# Función para intentar arreglo automático
auto_fix() {
    if ! check_aws_cli; then
        return 1
    fi
    
    echo "🔄 INTENTANDO ARREGLO AUTOMÁTICO..."
    echo ""
    
    # Verificar si tenemos credenciales
    if ! aws sts get-caller-identity &> /dev/null; then
        echo "❌ No hay credenciales AWS configuradas"
        echo ""
        echo "Configurar credenciales con:"
        echo "aws configure sso"
        echo "o"
        echo "aws configure"
        return 1
    fi
    
    echo "1. Habilitando website hosting..."
    if aws s3 website "s3://$BUCKET_NAME" --index-document index.html --error-document error.html; then
        echo "✅ Website hosting habilitado"
    else
        echo "❌ Error habilitando website hosting"
        return 1
    fi
    
    echo ""
    echo "2. Removiendo bloqueo de acceso público..."
    if aws s3api put-public-access-block --bucket "$BUCKET_NAME" --public-access-block-configuration 'BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false'; then
        echo "✅ Bloqueo de acceso público removido"
    else
        echo "❌ Error removiendo bloqueo de acceso público"
        return 1
    fi
    
    echo ""
    echo "3. Aplicando política de bucket público..."
    
    # Crear política temporal
    cat > /tmp/bucket-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::$BUCKET_NAME/*"
    }
  ]
}
EOF
    
    if aws s3api put-bucket-policy --bucket "$BUCKET_NAME" --policy file:///tmp/bucket-policy.json; then
        echo "✅ Política de bucket aplicada"
        rm -f /tmp/bucket-policy.json
    else
        echo "❌ Error aplicando política de bucket"
        rm -f /tmp/bucket-policy.json
        return 1
    fi
    
    echo ""
    echo "🎉 ARREGLO COMPLETADO"
    echo ""
    echo "Probando acceso..."
    sleep 5
    
    FINAL_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://$BUCKET_NAME.s3-website-$REGION.amazonaws.com/")
    if [ "$FINAL_STATUS" = "200" ]; then
        echo "✅ Frontend ahora accesible: https://$BUCKET_NAME.s3-website-$REGION.amazonaws.com/"
    else
        echo "⚠️ Status: $FINAL_STATUS - Puede necesitar tiempo para propagarse"
    fi
}

# Función principal
main() {
    diagnose_s3
    
    echo "🤔 ¿Qué quieres hacer?"
    echo "1. Mostrar comandos de arreglo manual"
    echo "2. Intentar arreglo automático (requiere AWS CLI)"
    echo "3. Solo mostrar diagnóstico"
    echo ""
    
    read -p "Selecciona opción (1-3): " choice
    
    case $choice in
        1)
            show_fix_commands
            ;;
        2)
            auto_fix
            ;;
        3)
            echo "Diagnóstico completado."
            ;;
        *)
            echo "Opción no válida"
            show_fix_commands
            ;;
    esac
}

# Ejecutar si no se está sourcing el script
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi

