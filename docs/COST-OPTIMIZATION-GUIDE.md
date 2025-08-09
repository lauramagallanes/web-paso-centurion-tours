# 💰 Guía de Optimización de Costos AWS

Esta guía te ayudará a implementar seguridad en AWS con **costos mínimos** para Paso Centurión Tours.

## 🎯 **Estrategias de Optimización**

### **Nivel 1: GRATIS (Free Tier) - $0/mes**
Solo mejoras que no cuestan nada:

✅ **Security Groups mejorados** (gratis)
✅ **CloudFront básico** (gratis hasta 1TB/mes)
✅ **SSL Certificate Manager** (gratis)
✅ **S3 optimizations** (gratis)
✅ **CloudWatch básico** (gratis hasta 10 métricas)

### **Nivel 2: MÍNIMO - $0-3/mes**
Agregando solo lo esencial:

✅ Todo del Nivel 1
✅ **Route 53 hosted zone** (~$0.50/mes)
✅ **CloudWatch alarms básicas** (~$0.10/mes cada una)

### **Nivel 3: BÁSICO - ~$13/mes**
Agregando base de datos:

✅ Todo del Nivel 2
✅ **RDS PostgreSQL db.t3.micro** (~$13/mes con Free Tier)

### **Nivel 4: COMPLETO - ~$60/mes**
Infraestructura completa:

✅ Todo del Nivel 3
✅ **VPC + NAT Gateway** (~$32/mes)
✅ **Application Load Balancer** (~$16/mes)
✅ **WAF** (~$5/mes)

## 🚀 **Implementación por Niveles**

### **NIVEL 1: GRATIS ($0/mes)**

```bash
# Usar la configuración optimizada para costos
cd terraform
cp cost-optimized.tfvars.example terraform.tfvars

# Configurar para nivel GRATIS
nano terraform.tfvars
```

Configuración para **$0/mes**:
```hcl
# Solo mejoras gratuitas
create_vpc = false           # No crear VPC nueva
enable_cloudfront = true     # CloudFront gratis hasta 1TB/mes
enable_ssl = false          # Solo si tienes dominio
create_database = false     # Usar SQLite local
enable_basic_monitoring = true
domain_name = ""            # Sin dominio custom para evitar costos
```

```bash
# Aplicar solo mejoras gratuitas
terraform apply -target=aws_security_group.web_server_optimized
terraform apply -target=aws_cloudfront_distribution.minimal
```

**Beneficios del Nivel 1:**
- ✅ **CloudFront CDN** global con protección DDoS
- ✅ **Security Groups** ultra-restrictivos
- ✅ **S3 optimizations** para mejor rendimiento
- ✅ **Monitoreo básico** con CloudWatch
- ✅ **Caché global** para mejor velocidad

### **NIVEL 2: MÍNIMO ($0-3/mes)**

Si quieres usar tu dominio pasocenturion.com.uy:

```hcl
domain_name = "pasocenturion.com.uy"
enable_ssl = true
existing_hosted_zone_id = "TU_HOSTED_ZONE_ID"  # Si ya tienes una
```

**Costos adicionales:**
- Route 53 hosted zone: $0.50/mes
- CloudWatch alarms: $0.10/mes cada una

### **NIVEL 3: BÁSICO (~$13/mes)**

Agregando base de datos PostgreSQL:

```hcl
create_database = true
db_password = "TuPasswordSegura123!"
```

**Costos adicionales:**
- RDS db.t3.micro: ~$13/mes (gratis con Free Tier primer año)

### **NIVEL 4: COMPLETO (~$60/mes)**

Infraestructura completa con VPC:

```hcl
create_vpc = true
# Usar existing-infrastructure.tf en lugar de cost-optimized.tf
```

## 🛠️ **Implementación Paso a Paso**

### **Paso 1: Analizar tu situación actual**

```bash
# Ejecutar script de análisis
./scripts/get-existing-resources.sh
```

### **Paso 2: Elegir nivel de costos**

```bash
cd terraform

# Para NIVEL 1-3 (optimizado costos)
cp cost-optimized.tfvars.example terraform.tfvars

# Para NIVEL 4 (completo)
cp existing.tfvars.example terraform.tfvars
```

### **Paso 3: Configurar según tu presupuesto**

```bash
nano terraform.tfvars
```

### **Paso 4: Implementar gradualmente**

```bash
# Inicializar
terraform init

# Para configuración optimizada (Niveles 1-3)
terraform plan -var-file=terraform.tfvars

# Aplicar solo lo que necesites
terraform apply -target=aws_security_group.web_server_optimized
terraform apply -target=aws_cloudfront_distribution.minimal
# etc...
```

## 💡 **Alternativas Gratuitas**

### **Base de Datos:**
En lugar de RDS ($13/mes), usar:
- ✅ **SQLite** local en tu EC2 (gratis)
- ✅ **PostgreSQL** instalado en EC2 (gratis, pero requiere mantenimiento)

### **Load Balancer:**
En lugar de ALB ($16/mes), usar:
- ✅ **Nginx** en tu EC2 como reverse proxy (gratis)
- ✅ **CloudFront** como único punto de entrada (gratis hasta 1TB)

### **VPC:**
En lugar de VPC + NAT Gateway ($32/mes), usar:
- ✅ **Default VPC** con Security Groups restrictivos (gratis)
- ✅ **Security Groups** bien configurados (gratis)

### **WAF:**
En lugar de AWS WAF ($5/mes), usar:
- ✅ **CloudFront** protección DDoS básica (gratis)
- ✅ **Nginx** con módulos de seguridad (gratis)
- ✅ **Fail2ban** en EC2 (gratis)

## 🔧 **Configuración de Nginx para Seguridad Gratuita**

Configura Nginx en tu EC2 para seguridad sin costos adicionales:

```nginx
# /etc/nginx/conf.d/security.conf
server {
    listen 80;
    server_name pasocenturion.com.uy www.pasocenturion.com.uy;
    
    # Security headers (gratis)
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    
    # Rate limiting (gratis)
    limit_req_zone $binary_remote_addr zone=login:10m rate=1r/s;
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    
    # Bloquear IPs maliciosas (gratis)
    location ~ /\. {
        deny all;
    }
    
    location ~* \.(php|asp|aspx|jsp)$ {
        deny all;
    }
    
    # Rate limiting en rutas críticas
    location /login {
        limit_req zone=login burst=3 nodelay;
        # Tu configuración de login
    }
    
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://localhost:8080/;
    }
    
    # Tu aplicación
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## 📊 **Comparación de Costos**

| Característica | Gratis | AWS Managed | Costo/mes |
|----------------|--------|-------------|-----------|
| **CDN/Cache** | CloudFront (1TB) | CloudFront | $0 |
| **SSL** | ACM Certificate | ACM Certificate | $0 |
| **Security Groups** | Incluido | Incluido | $0 |
| **Load Balancer** | Nginx en EC2 | ALB | $0 vs $16 |
| **Base de Datos** | SQLite/PostgreSQL local | RDS | $0 vs $13 |
| **VPC** | Default VPC | Custom VPC + NAT | $0 vs $32 |
| **WAF** | Nginx + CloudFront | AWS WAF | $0 vs $5 |
| **Monitoring** | CloudWatch básico | CloudWatch avanzado | $0 vs $10 |
| **DNS** | Proveedor actual | Route 53 | $0 vs $0.50 |

## 🚨 **Limitaciones de la Versión Gratuita**

### **CloudFront Gratuito:**
- ✅ 1TB de transferencia/mes
- ✅ 10,000,000 requests HTTP/mes
- ✅ 2,000,000 requests HTTPS/mes
- ❌ Sin WAF integrado
- ❌ Sin logs detallados

### **Alternativas si superas límites:**
- Optimizar imágenes (WebP, compresión)
- Implementar caché más agresivo
- Usar CDN alternativo (Cloudflare gratis)

## 🎯 **Recomendación por Situación**

### **Startup/MVP (Presupuesto: $0-5/mes):**
```hcl
create_vpc = false
enable_cloudfront = true
create_database = false  # SQLite local
enable_ssl = false      # Solo si tienes dominio
```
**Resultado:** Seguridad básica, CDN global, $0-3/mes

### **Negocio Pequeño (Presupuesto: $10-20/mes):**
```hcl
create_vpc = false
enable_cloudfront = true
create_database = true   # RDS PostgreSQL
enable_ssl = true       # Con dominio
```
**Resultado:** CDN + Base de datos managed, ~$15/mes

### **Negocio Establecido (Presupuesto: $50+/mes):**
```hcl
create_vpc = true
# Usar configuración completa
```
**Resultado:** Infraestructura enterprise, ~$60/mes

## 📞 **Soporte y Monitoreo Gratuito**

### **Herramientas gratuitas para monitoreo:**
- ✅ **CloudWatch** básico (10 métricas gratis)
- ✅ **AWS Personal Health Dashboard** (gratis)
- ✅ **Nginx access logs** (gratis)
- ✅ **Fail2ban** para seguridad (gratis)

### **Alertas gratuitas:**
- Email via SNS (1,000 emails/mes gratis)
- CloudWatch alarms básicas (10 gratis)

## 🔄 **Plan de Escalamiento**

1. **Mes 1-3:** Nivel 1 (Gratis) - Validar funcionalidad
2. **Mes 4-6:** Nivel 2 ($3/mes) - Agregar dominio
3. **Mes 7-12:** Nivel 3 ($15/mes) - Agregar base de datos
4. **Año 2+:** Nivel 4 ($60/mes) - Infraestructura completa

¡Empezar con $0/mes y escalar según necesidad y presupuesto! 🚀
