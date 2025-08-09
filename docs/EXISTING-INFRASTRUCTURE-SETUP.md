# 🔒 Configuración de Seguridad para Infraestructura Existente

Esta guía te ayudará a implementar todas las medidas de seguridad necesarias para tu infraestructura existente de Paso Centurión Tours, incluyendo VPC, Gateway, WAF, CloudFront y más.

## 📋 Infraestructura Actual

Según lo que me has indicado, ya tienes:
- ✅ **EC2 Instance** desplegada
- ✅ **S3 Bucket** para imágenes
- ✅ **Elastic IP** configurada
- ✅ **Dominio** pasocenturion.com.uy vinculado

## 🛡️ Medidas de Seguridad a Implementar

### 1. **VPC con Subnets Privadas**
- VPC aislada para tu infraestructura
- Subnets públicas para ALB y NAT Gateway
- Subnets privadas para base de datos
- Internet Gateway para acceso público controlado
- NAT Gateway para acceso saliente desde subnets privadas

### 2. **Application Load Balancer (ALB)**
- Distribución de carga y alta disponibilidad
- Terminación SSL/TLS
- Health checks automáticos
- Logs de acceso centralizados

### 3. **CloudFront CDN**
- Caché global para mejor rendimiento
- Protección DDoS automática
- Compresión de contenido
- Integración con WAF

### 4. **Web Application Firewall (WAF)**
- Protección contra ataques comunes (SQL injection, XSS)
- Rate limiting
- Reglas de geolocalización
- Monitoreo de amenazas

### 5. **SSL/HTTPS Completo**
- Certificado SSL gratuito con AWS Certificate Manager
- Redirección automática HTTP → HTTPS
- Políticas de seguridad TLS 1.2+

### 6. **Security Groups Restrictivos**
- Acceso SSH solo desde IPs específicas
- Tráfico web solo a través de ALB
- Base de datos accesible solo desde aplicación

## 🚀 Pasos de Implementación

### **Paso 1: Obtener información de tu infraestructura actual**

Primero necesitamos los IDs de tus recursos existentes:

```bash
# Obtener ID de tu instancia EC2
aws ec2 describe-instances --query 'Reservations[*].Instances[*].[InstanceId,Tags[?Key==`Name`].Value|[0],State.Name,PublicIpAddress]' --output table

# Obtener información de tu Elastic IP
aws ec2 describe-addresses --query 'Addresses[*].[PublicIp,InstanceId,AllocationId]' --output table

# Obtener información de tu bucket S3
aws s3 ls
aws s3api get-bucket-location --bucket TU-BUCKET-NAME
```

### **Paso 2: Configurar Terraform**

```bash
cd terraform
cp existing.tfvars.example terraform.tfvars
```

Edita `terraform.tfvars` con tus valores reales:

```hcl
# Actualizar con tus valores reales
existing_ec2_instance_id = "i-0123456789abcdef0"    # Tu instancia EC2
existing_elastic_ip = "54.123.456.789"             # Tu IP elástica
existing_s3_bucket_name = "tu-bucket-imagenes"     # Tu bucket S3
existing_s3_bucket_domain = "tu-bucket-imagenes.s3.amazonaws.com"

# Tu dominio
domain_name = "pasocenturion.com.uy"

# Tu IP para SSH (más seguro que 0.0.0.0/0)
allowed_ssh_cidrs = ["TU_IP_PUBLICA/32"]

# Contraseña para la nueva base de datos
db_password = "TuPasswordMuySegura123!"
```

### **Paso 3: Desplegar la infraestructura de seguridad**

```bash
# Inicializar Terraform
terraform init -reconfigure

# Usar la configuración para infraestructura existente
terraform plan -var-file="terraform.tfvars"

# Aplicar cambios
terraform apply -var-file="terraform.tfvars"
```

### **Paso 4: Importar recursos existentes (opcional)**

Si quieres que Terraform gestione tus recursos existentes:

```bash
# Importar tu instancia EC2 (reemplaza con tu ID real)
terraform import aws_instance.existing i-0123456789abcdef0

# Importar tu Elastic IP
terraform import aws_eip.existing eipalloc-0123456789abcdef0

# Importar tu bucket S3
terraform import aws_s3_bucket.existing_images tu-bucket-imagenes
```

## 🔧 Configuración Post-Despliegue

### **1. Configurar DNS en tu dominio**

Después del despliegue, obtendrás:

```bash
terraform output cloudfront_domain_name
terraform output alb_dns_name
```

**Configura en tu proveedor DNS (.uy):**
- `pasocenturion.com.uy` → CNAME → `d1234567890abc.cloudfront.net`
- `www.pasocenturion.com.uy` → CNAME → `d1234567890abc.cloudfront.net`

### **2. Validar certificado SSL**

AWS creará un certificado SSL, pero necesitas validarlo:

```bash
# Ver el certificado creado
terraform output ssl_certificate_arn

# En la consola AWS Certificate Manager:
# 1. Ve a Certificate Manager
# 2. Encuentra tu certificado
# 3. Agrega los registros DNS de validación a tu dominio
```

### **3. Configurar tu aplicación en EC2**

Conecta a tu EC2 y actualiza la configuración:

```bash
# Conectar a tu EC2
ssh -i tu-clave.pem ec2-user@TU-IP-ELASTICA

# Actualizar Nginx para trabajar con ALB
sudo nano /etc/nginx/conf.d/default.conf
```

Configuración de Nginx recomendada:

```nginx
server {
    listen 80;
    server_name _;
    
    # Real IP desde ALB
    real_ip_header X-Forwarded-For;
    set_real_ip_from 10.0.0.0/16;  # Tu VPC CIDR
    
    # Health check para ALB
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
    
    # Tu aplicación
    location / {
        # Tu configuración actual
        try_files $uri $uri/ /index.html;
    }
    
    # Proxy para API backend
    location /api/ {
        proxy_pass http://localhost:8080/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### **4. Registrar tu EC2 en el Target Group**

```bash
# Obtener ARN del target group
terraform output target_group_arn

# Registrar tu instancia
aws elbv2 register-targets \
    --target-group-arn TU-TARGET-GROUP-ARN \
    --targets Id=TU-INSTANCE-ID,Port=80
```

## 🔍 Verificación de Seguridad

### **1. Verificar WAF**

```bash
# Ver reglas WAF activas
aws wafv2 get-web-acl --scope CLOUDFRONT --id TU-WAF-ID --region us-east-1
```

### **2. Verificar SSL**

```bash
# Probar SSL
curl -I https://pasocenturion.com.uy
openssl s_client -connect pasocenturion.com.uy:443 -servername pasocenturion.com.uy
```

### **3. Verificar Security Groups**

```bash
# Ver security groups
terraform output web_server_security_group_id
aws ec2 describe-security-groups --group-ids TU-SECURITY-GROUP-ID
```

### **4. Verificar CloudFront**

```bash
# Probar CloudFront
curl -I https://TU-CLOUDFRONT-DOMAIN.cloudfront.net
```

## 📊 Monitoreo y Alertas

### **CloudWatch Dashboard**

Terraform creará un dashboard con métricas de:
- CPU y red de EC2
- Latencia y errores de ALB
- Conexiones y performance de RDS
- Requests y cache hit ratio de CloudFront

### **Alertas Configuradas**

- ✅ CPU alto en EC2 (>80%)
- ✅ CPU alto en RDS (>80%)
- ✅ Errores 5xx en ALB
- ✅ Latencia alta en ALB

## 🛡️ Características de Seguridad Implementadas

### **Red**
- ✅ VPC aislada
- ✅ Subnets privadas para DB
- ✅ NAT Gateway para salida controlada
- ✅ Security Groups restrictivos
- ✅ NACLs por defecto

### **Aplicación**
- ✅ ALB con SSL termination
- ✅ CloudFront con DDoS protection
- ✅ WAF con reglas anti-ataques
- ✅ Rate limiting
- ✅ Headers de seguridad

### **Datos**
- ✅ RDS en subnet privada
- ✅ Encriptación en reposo
- ✅ Backups automáticos
- ✅ S3 con versioning
- ✅ Lifecycle policies

### **Acceso**
- ✅ SSH solo desde IPs específicas
- ✅ Base de datos no accesible desde internet
- ✅ IAM roles con permisos mínimos
- ✅ CloudTrail para auditoría

## 💰 Costos Adicionales Estimados

**Nuevos servicios agregados:**
- ALB: ~$16/mes
- NAT Gateway: ~$32/mes
- CloudFront: ~$1-5/mes (según tráfico)
- WAF: ~$5/mes + $0.60 por millón de requests
- Certificate Manager: Gratis
- Route 53: ~$0.50/mes por hosted zone

**Total adicional: ~$55-60/mes**

## 🚨 Consideraciones Importantes

### **1. Tiempo de propagación DNS**
Los cambios DNS pueden tardar 24-48 horas en propagarse completamente.

### **2. Validación SSL**
Debes validar el certificado SSL agregando registros DNS específicos.

### **3. Migración gradual**
Puedes mantener tu configuración actual mientras pruebas la nueva infraestructura.

### **4. Backup antes de cambios**
Haz backup de tu EC2 antes de hacer cambios importantes.

## 📞 Soporte y Troubleshooting

### **Problemas comunes:**

**1. Certificado SSL no valida**
```bash
# Verificar registros DNS de validación
aws acm describe-certificate --certificate-arn TU-CERT-ARN
```

**2. Health checks fallan**
```bash
# Verificar endpoint /health en tu aplicación
curl http://TU-IP-PRIVADA/health
```

**3. CloudFront no sirve contenido**
```bash
# Verificar configuración de origins
aws cloudfront get-distribution --id TU-DISTRIBUTION-ID
```

**4. WAF bloquea tráfico legítimo**
```bash
# Ver logs de WAF
aws wafv2 get-sampled-requests --web-acl-arn TU-WAF-ARN --rule-metric-name TU-REGLA --scope CLOUDFRONT --time-window StartTime=TIMESTAMP,EndTime=TIMESTAMP --max-items 100
```

## 🎯 Próximos Pasos

Una vez implementada la seguridad:

1. **Configurar monitoring avanzado**
2. **Implementar backup automático de EC2**
3. **Configurar alertas por email/SMS**
4. **Implementar CI/CD con la nueva infraestructura**
5. **Optimizar rendimiento con CloudFront**

¡Tu infraestructura estará protegida con las mejores prácticas de seguridad de AWS! 🚀
