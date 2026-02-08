# SES Notifications Module

Este módulo de Terraform configura el manejo de bounces y complaints de Amazon SES usando SNS y Lambda.

## Descripción

Este módulo crea:
- **SNS Topics** para recibir notificaciones de bounces y complaints
- **Lambda Functions** para procesar las notificaciones
- **CloudWatch Log Groups** para almacenar logs
- **Configuración de SES** para enviar notificaciones a los topics de SNS

## Requisitos

- AWS Account con SES habilitado
- Identidades de SES (dominio o email) ya verificadas
- Permisos IAM adecuados para crear recursos

## Uso

```hcl
module "ses_notifications" {
  source = "../../modules/ses-notifications"

  environment         = "dev"
  ses_domain_identity = "pasocenturion.com.uy"
  ses_email_identities = ["tinambu.paso.centurion@gmail.com"]
}
```

## Variables

| Variable | Descripción | Tipo | Default | Requerido |
|----------|-------------|------|---------|-----------|
| `environment` | Nombre del ambiente (dev, staging, prod) | `string` | - | Sí |
| `ses_domain_identity` | Identidad de dominio de SES | `string` | `""` | No |
| `ses_email_identities` | Lista de identidades de email de SES | `list(string)` | `[]` | No |

## Outputs

| Output | Descripción |
|--------|-------------|
| `bounce_topic_arn` | ARN del topic de SNS para bounces |
| `complaint_topic_arn` | ARN del topic de SNS para complaints |
| `bounce_handler_function_name` | Nombre de la función Lambda para bounces |
| `complaint_handler_function_name` | Nombre de la función Lambda para complaints |

## Recursos Creados

### SNS Topics
- `ses-bounces-{environment}` - Topic para notificaciones de bounces
- `ses-complaints-{environment}` - Topic para notificaciones de complaints

### Lambda Functions
- `ses-bounce-handler-{environment}` - Procesa bounces
- `ses-complaint-handler-{environment}` - Procesa complaints

### CloudWatch Log Groups
- `/aws/lambda/ses-bounce-handler-{environment}` - Logs de bounces
- `/aws/lambda/ses-complaint-handler-{environment}` - Logs de complaints

### IAM Roles
- `ses-notifications-lambda-role-{environment}` - Rol para las funciones Lambda

## Funcionalidad

### Manejo de Bounces

La función Lambda procesa bounces y:
- Registra información detallada en CloudWatch Logs
- Identifica hard bounces (permanentes) vs soft bounces (temporales)
- Marca direcciones con hard bounces para supresión

### Manejo de Complaints

La función Lambda procesa complaints y:
- Registra con nivel CRITICAL en logs
- Identifica direcciones que marcaron correos como spam
- Marca para supresión inmediata

## Verificación

Después de aplicar Terraform, verifica la configuración:

```bash
# Verificar notificaciones configuradas
aws ses get-identity-notification-attributes \
  --identities pasocenturion.com.uy \
  --profile laura \
  --region us-east-1

# Ver logs de bounces
aws logs tail /aws/lambda/ses-bounce-handler-dev \
  --follow \
  --profile laura \
  --region us-east-1

# Ver logs de complaints
aws logs tail /aws/lambda/ses-complaint-handler-dev \
  --follow \
  --profile laura \
  --region us-east-1
```

## Pruebas

Puedes probar el sistema usando el mailbox simulator de SES:

```bash
# Enviar correo que simula bounce
aws ses send-email \
  --from "test@pasocenturion.com.uy" \
  --to "bounce@simulator.amazonses.com" \
  --subject "Test Bounce" \
  --text "Test message" \
  --profile laura \
  --region us-east-1

# Enviar correo que simula complaint
aws ses send-email \
  --from "test@pasocenturion.com.uy" \
  --to "complaint@simulator.amazonses.com" \
  --subject "Test Complaint" \
  --text "Test message" \
  --profile laura \
  --region us-east-1
```

## Notas

- Las identidades de SES (dominio o email) deben estar verificadas antes de aplicar este módulo
- El módulo configura notificaciones para todas las identidades proporcionadas
- Los logs se retienen por 30 días en CloudWatch
- Las funciones Lambda tienen timeout de 30 segundos y 128MB de memoria

## Mejoras Futuras

- Integración con DynamoDB para almacenar direcciones suprimidas
- Alertas automáticas cuando la tasa de complaints es alta
- Dashboard de CloudWatch para visualizar métricas
- Integración con sistema de supresión de SES


