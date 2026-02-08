#!/bin/bash

# Script para limpiar imágenes huérfanas de S3
# Autor: AI Assistant
# Fecha: 2025-11-07

set -e

BUCKET="tinambu-public-assets-dev"
REGION="us-east-1"
PREFIX="senderos/"

echo "🧹 Limpieza de imágenes huérfanas en S3"
echo "=================================="
echo "Bucket: ${BUCKET}"
echo "Región: ${REGION}"
echo "Prefijo: ${PREFIX}"
echo ""

# Advertencia
echo "⚠️  ADVERTENCIA: Este script eliminará TODAS las imágenes en ${PREFIX}"
echo "⚠️  Solo ejecuta esto si estás seguro de que no hay senderos en la base de datos."
echo ""
read -p "¿Estás seguro? (escribe 'SI' para continuar): " CONFIRM

if [ "$CONFIRM" != "SI" ]; then
    echo "❌ Operación cancelada"
    exit 1
fi

echo ""
echo "📋 Listando archivos huérfanos..."

# Listar archivos antes de eliminar
aws s3 ls "s3://${BUCKET}/${PREFIX}" --recursive --human-readable --summarize --profile laura --region "${REGION}"

echo ""
read -p "¿Proceder con la eliminación? (escribe 'ELIMINAR' para continuar): " CONFIRM2

if [ "$CONFIRM2" != "ELIMINAR" ]; then
    echo "❌ Operación cancelada"
    exit 1
fi

echo ""
echo "🗑️  Eliminando archivos..."

# Eliminar todos los archivos del prefijo
aws s3 rm "s3://${BUCKET}/${PREFIX}" --recursive --profile laura --region "${REGION}"

echo ""
echo "✅ Limpieza completada!"
echo ""
echo "📊 Estado final del bucket:"
aws s3 ls "s3://${BUCKET}/${PREFIX}" --recursive --human-readable --summarize --profile laura --region "${REGION}" || echo "No hay archivos en ${PREFIX}"


