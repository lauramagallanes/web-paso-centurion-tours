# Terraform Infrastructure for Paso Centurión Tours

Este directorio contiene la configuración de Terraform para desplegar la infraestructura completa de Paso Centurión Tours en AWS.

## 🏗️ Arquitectura

La infraestructura incluye:

- **VPC** con subnets públicas y privadas
- **EC2 Instance** para el servidor web (frontend + backend)
- **RDS PostgreSQL** para la base de datos
- **S3 Bucket** para almacenamiento de deployments
- **Security Groups** configurados apropiadamente
- **Elastic IP** para IP estática
- **IAM Roles** para permisos de EC2
- **CloudWatch** para monitoreo y logs

## 📋 Prerrequisitos

1. **Terraform instalado** (>= 1.0)
2. **AWS CLI configurado** con credenciales apropiadas
3. **Clave SSH pública** para acceso a EC2

## 🚀 Despliegue Inicial

### 1. Configurar variables

```bash
# Copiar el archivo de ejemplo
cp terraform.tfvars.example terraform.tfvars

# Editar las variables según tu configuración
nano terraform.tfvars
```

**Variables importantes a configurar:**
- `public_key`: Tu clave SSH pública
- `db_password`: Contraseña segura para la base de datos
- `allowed_ssh_cidrs`: Tu IP para acceso SSH

### 2. Inicializar Terraform

```bash
cd terraform
terraform init
```

### 3. Planificar el despliegue

```bash
terraform plan
```

### 4. Aplicar la configuración

```bash
terraform apply
```

### 5. Obtener información de salida

```bash
terraform output
```

## 📊 Outputs Importantes

Después del despliegue, obtendrás:

- **application_url**: URL para acceder a la aplicación
- **web_server_public_ip**: IP pública del servidor
- **ssh_connection_command**: Comando para conectar por SSH
- **database_endpoint**: Endpoint de la base de datos
- **s3_deployments_bucket**: Bucket para deployments
- **github_actions_secrets**: Secrets necesarios para GitHub Actions

## 🔧 Configuración de GitHub Actions

Configura estos secrets en tu repositorio de GitHub:

```bash
# Obtener los valores necesarios
terraform output github_actions_secrets
```

**Secrets requeridos:**
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `EC2_HOST` (IP del servidor)
- `EC2_SSH_KEY` (clave privada SSH)
- `S3_DEPLOYMENT_BUCKET`
- `DB_HOST`, `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD`

## 🗂️ Estructura de Archivos

```
terraform/
├── main.tf                    # Configuración principal
├── variables.tf               # Definición de variables
├── outputs.tf                 # Outputs del despliegue
├── user-data.sh              # Script de inicialización EC2
├── terraform.tfvars.example  # Ejemplo de variables
└── README.md                 # Esta documentación
```

## 🔒 Seguridad

### Security Groups configurados:

**Web Server:**
- Puerto 80 (HTTP) - Acceso público
- Puerto 443 (HTTPS) - Acceso público
- Puerto 22 (SSH) - Solo IPs permitidas
- Puerto 8080 (Backend) - Solo VPC interna

**Database:**
- Puerto 5432 (PostgreSQL) - Solo desde web server

### Mejores prácticas implementadas:

- ✅ Subnets privadas para la base de datos
- ✅ Security Groups restrictivos
- ✅ Encriptación de volúmenes EBS
- ✅ Encriptación de S3 bucket
- ✅ IAM roles con permisos mínimos
- ✅ Backup automático de base de datos

## 🌍 Ambientes

Puedes desplegar múltiples ambientes cambiando la variable `environment`:

```bash
# Desarrollo
terraform apply -var="environment=dev"

# Staging
terraform apply -var="environment=staging"

# Producción
terraform apply -var="environment=production"
```

## 📈 Monitoreo

La infraestructura incluye:

- **CloudWatch Agent** instalado en EC2
- **Logs centralizados** en CloudWatch
- **Métricas de sistema** (CPU, memoria, disco)
- **Logs de aplicación** y Nginx

## 🔄 Gestión de Estado

### Estado local (desarrollo):
El estado se guarda localmente por defecto.

### Estado remoto (producción):
Descomenta y configura el backend S3 en `main.tf`:

```hcl
backend "s3" {
  bucket = "paso-centurion-terraform-state"
  key    = "terraform.tfstate"
  region = "us-east-1"
}
```

## 🛠️ Comandos Útiles

```bash
# Ver estado actual
terraform show

# Ver outputs
terraform output

# Validar configuración
terraform validate

# Formatear archivos
terraform fmt

# Destruir infraestructura (¡CUIDADO!)
terraform destroy

# Aplicar solo un recurso específico
terraform apply -target=aws_instance.web_server

# Importar recurso existente
terraform import aws_instance.web_server i-1234567890abcdef0
```

## 🚨 Troubleshooting

### Error: "InvalidKeyPair.NotFound"
Verifica que la clave pública en `terraform.tfvars` sea correcta.

### Error: "UnauthorizedOperation"
Verifica que tu usuario AWS tenga los permisos necesarios.

### Error: "DBInstanceAlreadyExists"
La base de datos ya existe, usa un nombre diferente o importa el recurso.

### Conectividad SSH
```bash
# Verificar security group
aws ec2 describe-security-groups --group-ids sg-xxxxxx

# Verificar instancia
aws ec2 describe-instances --instance-ids i-xxxxxx
```

## 💰 Costos Estimados

**Con Free Tier (primer año):**
- EC2 t3.micro: Gratis (750 horas/mes)
- RDS db.t3.micro: Gratis (750 horas/mes)
- EBS 20GB: Gratis (30GB incluidos)
- S3: Prácticamente gratis (5GB incluidos)

**Sin Free Tier:**
- EC2 t3.micro: ~$8/mes
- RDS db.t3.micro: ~$13/mes
- EBS 20GB: ~$2/mes
- Elastic IP: ~$4/mes (si no está asociada)
- Total estimado: ~$27/mes

## 📞 Soporte

Si tienes problemas:

1. Revisa los logs de Terraform
2. Verifica la configuración de AWS CLI
3. Consulta la documentación de Terraform AWS Provider
4. Revisa los logs de CloudWatch en la consola AWS

## 🔄 Actualizaciones

Para actualizar la infraestructura:

1. Modifica los archivos `.tf`
2. Ejecuta `terraform plan` para ver cambios
3. Ejecuta `terraform apply` para aplicar cambios

**¡Siempre haz backup antes de cambios importantes!**
