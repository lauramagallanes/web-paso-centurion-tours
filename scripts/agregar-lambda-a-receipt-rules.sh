#!/bin/bash
# Script para agregar acción Lambda a Receipt Rules existentes

set -e

export AWS_PROFILE=${AWS_PROFILE:-laura}
export AWS_REGION=${AWS_REGION:-us-east-1}

RULE_SET_NAME="inbound-to-s3-ses"
LAMBDA_FUNCTION_ARN=""

echo "=== Agregando Lambda a Receipt Rules ==="
echo ""

# Obtener ARN de Lambda (se actualizará después del deploy)
if [ -z "$LAMBDA_FUNCTION_ARN" ]; then
    echo "Obteniendo ARN de Lambda..."
    LAMBDA_FUNCTION_ARN=$(aws lambda get-function \
        --function-name email-forwarding-dev \
        --region $AWS_REGION \
        --profile $AWS_PROFILE \
        --query 'Configuration.FunctionArn' \
        --output text 2>/dev/null || echo "")
    
    if [ -z "$LAMBDA_FUNCTION_ARN" ]; then
        echo "⚠️ Lambda function no encontrada. Debes desplegar primero el módulo de Terraform."
        exit 1
    fi
fi

echo "Lambda ARN: $LAMBDA_FUNCTION_ARN"
echo ""

# Obtener Receipt Rules actuales
echo "Obteniendo Receipt Rules actuales..."
aws ses describe-active-receipt-rule-set \
    --region $AWS_REGION \
    --profile $AWS_PROFILE \
    --output json > /tmp/current-rules.json

# Actualizar cada regla para agregar acción Lambda
echo "Actualizando reglas para agregar acción Lambda..."

python3 << 'PYTHON_SCRIPT'
import json
import sys
import subprocess

rule_set_name = "inbound-to-s3-ses"
lambda_arn = sys.argv[1] if len(sys.argv) > 1 else ""

with open('/tmp/current-rules.json', 'r') as f:
    data = json.load(f)

rules = data.get('Rules', [])

for rule in rules:
    rule_name = rule['Name']
    print(f"\nActualizando regla: {rule_name}")
    
    # Agregar acción Lambda a las acciones existentes
    actions = rule.get('Actions', [])
    
    # Verificar si ya tiene acción Lambda
    has_lambda = any(action.get('LambdaAction') for action in actions)
    
    if not has_lambda:
        # Agregar acción Lambda
        lambda_action = {
            "LambdaAction": {
                "FunctionArn": lambda_arn,
                "InvocationType": "Event"  # Asíncrono
            }
        }
        actions.append(lambda_action)
        
        # Actualizar regla
        rule_update = {
            "Name": rule_name,
            "Enabled": rule.get('Enabled', True),
            "Recipients": rule.get('Recipients', []),
            "Actions": actions,
            "ScanEnabled": rule.get('ScanEnabled', True),
            "TlsPolicy": rule.get('TlsPolicy', 'Optional')
        }
        
        # Guardar regla actualizada
        with open(f'/tmp/rule-{rule_name}.json', 'w') as f:
            json.dump(rule_update, f, indent=2)
        
        print(f"  ✅ Regla {rule_name} actualizada con Lambda")
    else:
        print(f"  ⚠️ Regla {rule_name} ya tiene acción Lambda")

PYTHON_SCRIPT "$LAMBDA_FUNCTION_ARN"

# Actualizar reglas en SES
echo ""
echo "Aplicando cambios en SES..."

for rule_file in /tmp/rule-*.json; do
    if [ -f "$rule_file" ]; then
        rule_name=$(basename "$rule_file" .json | sed 's/rule-//')
        echo "Actualizando regla: $rule_name"
        
        aws ses update-receipt-rule \
            --rule-set-name "$RULE_SET_NAME" \
            --rule file://"$rule_file" \
            --region $AWS_REGION \
            --profile $AWS_PROFILE
        
        echo "  ✅ Regla $rule_name actualizada"
    fi
done

echo ""
echo "✅ Receipt Rules actualizadas con Lambda"
echo ""
echo "Ahora los correos se reenviarán automáticamente a Gmail"


