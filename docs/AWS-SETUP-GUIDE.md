# 🚀 Guía Completa de Setup AWS con Terraform

Esta guía te llevará paso a paso para configurar toda la infraestructura de Paso Centurión Tours en AWS usando Terraform.

## 📋 Prerrequisitos

### 1. Herramientas necesarias
- **Terraform** >= 1.6.0 ([Descargar](https://terraform.io/downloads))
- **AWS CLI** >= 2.0 ([Descargar](https://aws.amazon.com/cli/))
- **Git** para clonar el repositorio

### 2. Cuenta de AWS
- Cuenta AWS activa
- Usuario IAM con permisos administrativos
- Access Key y Secret Key configurados

## 🔧 Configuración Inicial

### 1. Instalar Terraform

```bash
# Ubuntu/Debian
wget -O- https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
sudo apt update && sudo apt install terraform

# macOS
brew tap hashicorp/tap
brew install hashicorp/tap/terraform

# Verificar instalación
terraform --version
```

### 2. Configurar AWS CLI

```bash
# Instalar AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Configurar credenciales
aws configure
```

Cuando te pida los datos, ingresa:
- **AWS Access Key ID**: Tu access key
- **AWS Secret Access Key**: Tu secret key  
- **Default region**: `us-east-1`
- **Default output format**: `json`

### 3. Verificar permisos AWS

```bash
# Verificar que tienes acceso
aws sts get-caller-identity
aws ec2 describe-regions
```

## 🏗️ Desplegar Infraestructura

### 1. Preparar configuración

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
```

### 2. Editar variables

Abre `terraform.tfvars` y configura:

```hcl
# AWS Configuration
aws_region  = "us-east-1"
environment = "production"

# Tu clave SSH pública (reemplaza con la tuya)
public_key = "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQDIizWC2dGDyC2apf/B4tp7YJHZsacJ1b3SX3JLY1zXNftDR6Jo2XIMPRk..."

# Contraseña segura para la base de datos
db_password = "TuPasswordSegura123!"

# Tu IP para acceso SSH (más seguro)
allowed_ssh_cidrs = ["TU_IP_PUBLICA/32"]
```

### 3. Desplegar infraestructura

```bash
# Inicializar Terraform
terraform init

# Ver qué se va a crear
terraform plan

# Aplicar cambios
terraform apply
```

Cuando te pregunte, escribe `yes` para confirmar.

### 4. Obtener información de conexión

```bash
# Ver todos los outputs
terraform output

# Obtener IP pública
terraform output web_server_public_ip

# Obtener comando SSH
terraform output ssh_connection_command
```

## 🔑 Configurar GitHub Actions

### 1. Secrets necesarios en GitHub

Ve a tu repositorio → Settings → Secrets and variables → Actions

Configura estos secrets:

```bash
# AWS Credentials
AWS_ACCESS_KEY_ID: tu-access-key-id
AWS_SECRET_ACCESS_KEY: tu-secret-access-key

# EC2 Connection
EC2_HOST: la-ip-publica-de-tu-ec2
EC2_SSH_KEY: tu-clave-privada-ssh-completa
EC2_PUBLIC_KEY: tu-clave-publica-ssh

# Database
DB_PASSWORD: la-misma-password-de-terraform
DB_HOST: endpoint-de-tu-rds
DB_NAME: pasocenturiondb
DB_USERNAME: dbadmin

# S3 Deployment
S3_DEPLOYMENT_BUCKET: nombre-del-bucket-s3
```

### 2. Obtener valores automáticamente

```bash
# Ejecutar después de terraform apply
cd terraform

echo "=== GitHub Secrets Configuration ==="
echo "AWS_ACCESS_KEY_ID: $(aws configure get aws_access_key_id)"
echo "AWS_SECRET_ACCESS_KEY: $(aws configure get aws_secret_access_key)"
echo "EC2_HOST: $(terraform output -raw web_server_public_ip)"
echo "EC2_SSH_KEY: Usar el contenido de ~/.ssh/ec2_key"
echo "EC2_PUBLIC_KEY: $(cat ~/.ssh/ec2_key.pub)"
echo "S3_DEPLOYMENT_BUCKET: $(terraform output -raw s3_deployments_bucket)"
echo "DB_HOST: $(terraform output -raw database_endpoint)"
echo "DB_NAME: $(terraform output -raw database_name)"
echo "DB_USERNAME: $(terraform output -raw database_username)"
echo "DB_PASSWORD: El que configuraste en terraform.tfvars"
```

## 🧪 Verificar Despliegue

### 1. Conectar por SSH

```bash
# Usar el comando que te dio terraform output
ssh -i ~/.ssh/ec2_key ec2-user@TU-IP-PUBLICA
```

### 2. Verificar servicios

```bash
# En el servidor EC2
sudo systemctl status nginx
sudo systemctl status amazon-cloudwatch-agent
curl http://localhost/health
```

### 3. Acceder a la aplicación

Abre en tu navegador: `http://TU-IP-PUBLICA`

Deberías ver la página de "Deployment Ready".

## 🔄 Workflow de Desarrollo

### 1. Desarrollo local
```bash
# Trabajar en branch development
git checkout development
git push origin development
# Los workflows de testing se ejecutan automáticamente
```

### 2. Deploy a producción
```bash
# Merge a main para deployment automático
git checkout main
git merge development
git push origin main
# Se ejecuta el deployment automático
```

### 3. Actualizaciones de infraestructura
```bash
# Modificar archivos en terraform/
# Push activa el workflow de Terraform
git add terraform/
git commit -m "Update infrastructure"
git push origin main
```

## 📊 Monitoreo y Logs

### 1. CloudWatch Logs

Ve a AWS Console → CloudWatch → Logs:
- `paso-centurion-tours/nginx/access`
- `paso-centurion-tours/nginx/error`
- `paso-centurion-tours/application`

### 2. Métricas de EC2

Ve a AWS Console → CloudWatch → Metrics → PasoCenturionTours/EC2

### 3. Logs en el servidor

```bash
# Conectar por SSH y revisar logs
ssh -i ~/.ssh/ec2_key ec2-user@TU-IP

# Logs de Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Logs de aplicación
sudo tail -f /var/log/paso-centurion-tours/app.log

# Estado de servicios
sudo systemctl status nginx
sudo systemctl status paso-centurion-tours
```

## 🛠️ Comandos Útiles

### Terraform

```bash
# Ver estado actual
terraform show

# Ver solo outputs
terraform output

# Actualizar un recurso específico
terraform apply -target=aws_instance.web_server

# Destruir todo (¡CUIDADO!)
terraform destroy
```

### AWS CLI

```bash
# Ver instancias EC2
aws ec2 describe-instances

# Ver base de datos RDS
aws rds describe-db-instances

# Ver buckets S3
aws s3 ls

# Ver logs de CloudWatch
aws logs describe-log-groups
```

### SSH y Servidor

```bash
# Conectar al servidor
ssh -i ~/.ssh/ec2_key ec2-user@IP

# Reiniciar servicios
sudo systemctl restart nginx
sudo systemctl restart paso-centurion-tours

# Ver uso de recursos
htop
df -h
```

## 🚨 Troubleshooting

### Error: "InvalidKeyPair.NotFound"
```bash
# Verificar que la clave pública esté correcta
cat ~/.ssh/ec2_key.pub
# Copiar exactamente esa clave a terraform.tfvars
```

### Error: "UnauthorizedOperation"
```bash
# Verificar permisos AWS
aws iam get-user
aws sts get-caller-identity
```

### No puedo conectar por SSH
```bash
# Verificar security group
aws ec2 describe-security-groups --filters "Name=group-name,Values=paso-centurion-tours-web-*"

# Verificar tu IP pública
curl ifconfig.me
# Debe estar en allowed_ssh_cidrs
```

### La aplicación no carga
```bash
# Conectar al servidor y verificar
ssh -i ~/.ssh/ec2_key ec2-user@IP

# Ver logs
sudo tail -f /var/log/nginx/error.log
sudo systemctl status nginx

# Verificar puertos
sudo netstat -tlnp | grep :80
```

### Base de datos no conecta
```bash
# Verificar endpoint
terraform output database_endpoint

# Probar conexión desde EC2
psql -h ENDPOINT -U dbadmin -d pasocenturiondb
```

## 💰 Costos Estimados

**Primer año (Free Tier):**
- EC2 t3.micro: Gratis
- RDS db.t3.micro: Gratis  
- 20GB EBS: Gratis
- S3: Prácticamente gratis
- **Total: ~$0/mes**

**Después del Free Tier:**
- EC2 t3.micro: ~$8/mes
- RDS db.t3.micro: ~$13/mes
- EBS 20GB: ~$2/mes
- Elastic IP: ~$4/mes (si no está en uso)
- **Total: ~$27/mes**

## 🔒 Mejores Prácticas de Seguridad

### Implementadas automáticamente:
- ✅ Subnets privadas para base de datos
- ✅ Security groups restrictivos
- ✅ Encriptación de volúmenes
- ✅ Backup automático de DB
- ✅ IAM roles con permisos mínimos

### Recomendaciones adicionales:
- 🔐 Usar contraseñas seguras
- 🔐 Restringir SSH a tu IP
- 🔐 Configurar SSL/HTTPS
- 🔐 Monitorear logs regularmente
- 🔐 Actualizar sistema operativo

## 📞 Soporte

Si tienes problemas:

1. **Revisa los logs** de Terraform y AWS
2. **Verifica credenciales** AWS
3. **Consulta la documentación** de Terraform AWS Provider
4. **Revisa GitHub Actions** logs
5. **Verifica security groups** y permisos

## 🎯 Próximos Pasos

Una vez que tengas todo funcionando:

1. **Configurar dominio personalizado**
2. **Agregar SSL/HTTPS**
3. **Configurar backup automático**
4. **Implementar monitoreo avanzado**
5. **Configurar alertas de CloudWatch**

¡Tu infraestructura está lista para recibir deployments automáticos desde GitHub Actions! 🚀
