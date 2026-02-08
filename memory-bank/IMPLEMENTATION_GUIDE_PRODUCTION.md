# Guía de Implementación - Ambiente de Producción Optimizado
## Arquitectura Económica para Bajo Tráfico

**Fecha**: Noviembre 2025  
**Presupuesto Objetivo**: $15-20 USD/mes  
**Tráfico Soportado**: 1,000-2,000 usuarios/mes  
**Tiempo estimado**: 4-6 horas (primera vez)

---

## 📋 Pre-requisitos Críticos

### 1. Validación en Desarrollo
- [ ] Desarrollo optimizado funcionando por 2+ semanas
- [ ] Rutina de stop/start validada
- [ ] Costos de desarrollo reducidos exitosamente
- [ ] Sin incidentes graves en desarrollo

### 2. Dominio y DNS
- [ ] Dominio registrado: `pasocenturion.com.uy`
- [ ] Acceso a configuración DNS
- [ ] Subdominio API planificado: `api.pasocenturion.com.uy`

### 3. Cuenta CloudFlare (CRÍTICO para ahorro)
- [ ] Cuenta gratuita creada en cloudflare.com
- [ ] Plan Free (suficiente)
- [ ] Acceso a configuración DNS

### 4. Backups y Recovery Plan
- [ ] Procedimiento de backup documentado
- [ ] Recovery testeado en desarrollo
- [ ] Plan de rollback preparado

---

## 🎯 Arquitectura de Producción Optimizada

### Costo Objetivo: $18-25/mes

```
Componente                    Costo/Mes    Justificación
───────────────────────────────────────────────────────────────
RDS db.t4g.micro (Single-AZ)  $12-13      Suficiente 1-2K usuarios
NAT Instance t4g.nano         $3-4        Conectividad económica
Lambda + API Gateway          $0-1        Capa gratuita
CloudFront CDN                $0          Capa gratuita (1TB/mes)
S3 Storage                    $0.50       Assets + backups
Route 53                      $0.50       DNS
GuardDuty                     $3-5        Seguridad esencial
CloudWatch                    $1-2        Monitoreo básico
CloudFlare WAF                $0          Free plan (DDoS + WAF)
───────────────────────────────────────────────────────────────
TOTAL                         $18-25
```

---

## 📝 Fase 0: Pre-Implementación (1-2 semanas antes)

### Paso 1: Configurar CloudFlare

**1.1 Crear Cuenta**
```
1. Ir a https://dash.cloudflare.com/sign-up
2. Crear cuenta con email corporativo
3. Verificar email
4. Plan: Seleccionar FREE (suficiente)
```

**1.2 Añadir Dominio**
```
1. Dashboard → Add a Site
2. Ingresar: pasocenturion.com.uy
3. Plan: Select Free
4. CloudFlare escaneará DNS actual
```

**1.3 Configurar Nameservers**
```
CloudFlare proporcionará 2 nameservers:
- xxx.ns.cloudflare.com
- yyy.ns.cloudflare.com

Ir al registrar del dominio y cambiar nameservers
Esperar 24-48 horas para propagación
```

**1.4 Configuración Inicial CloudFlare**
```
SSL/TLS:
- Mode: Full (strict)
- Always Use HTTPS: ON
- Automatic HTTPS Rewrites: ON

Security:
- Security Level: Medium
- Bot Fight Mode: ON
- Challenge Passage: 30 minutes

Speed:
- Auto Minify: JS, CSS, HTML ON
- Brotli: ON
- HTTP/2: ON
- HTTP/3 (QUIC): ON

Caching:
- Caching Level: Standard
- Browser Cache TTL: 4 hours
```

### Paso 2: Preparar Terraform de Producción

**2.1 Copiar Configuración**
```bash
cd terraform/environments

# Copiar ejemplo a producción
cp prod/terraform.tfvars.example prod/terraform.tfvars

# Editar con valores reales
nano prod/terraform.tfvars
```

**2.2 Configurar terraform.tfvars**
```hcl
# ARCHIVO: terraform/environments/prod/terraform.tfvars

environment = "prod"
aws_region  = "us-east-1"

# DECISIÓN CRÍTICA: Single-AZ para economía
availability_zones = ["us-east-1a"]

# Dominios (CAMBIAR por los tuyos)
domain_name     = "pasocenturion.com.uy"
api_domain_name = "api.pasocenturion.com.uy"

# RDS Optimizado
# NOTA: Estos valores se definen en el módulo, no en tfvars
# Ver terraform/modules/database/variables.tf

# Lambda
lambda_zip_path = "../../../backend/target/tinambu-tours-lambda.zip"

# Seguridad ECONÓMICA
enable_guardduty                    = true   # $3-5/mes - ESENCIAL
enable_waf                          = false  # Usar CloudFlare gratis
enable_config                       = false  # Ahorro $2-4/mes
enable_interface_endpoints          = false  # Ahorro $22/mes c/u
enable_advanced_payment_integration = true

# Budget
budget_limit = 25  # Alertar si supera $25/mes
```

**2.3 Crear variables específicas de producción**
```bash
# Archivo: terraform/environments/prod/prod.auto.tfvars
# Variables específicas que sobrescriben defaults del módulo

# RDS Production Settings
db_instance_class       = "db.t4g.micro"  # Suficiente para 1-2K usuarios
db_allocated_storage    = 20              # GB
db_max_storage          = 50              # GB (autoscaling)
db_backup_retention     = 7               # días
db_multi_az             = false           # DECISIÓN: Single-AZ por costo
db_performance_insights = false           # Ahorro $7/mes
db_monitoring_interval  = 0               # Ahorro $5/mes

# NAT Instance (no NAT Gateway)
nat_instance_type  = "t4g.nano"           # $3/mes
enable_nat_gateway = false                # Ahorro $32/mes × 2 AZ

# Lambda
lambda_memory_size       = 1024           # MB
lambda_timeout           = 30             # segundos
lambda_reserved_concurrency = 10          # Evitar costos descontrolados

# CloudFront
cloudfront_price_class = "PriceClass_100"  # NA + Europa (más barato)
cloudfront_min_ttl     = 3600              # 1 hora
cloudfront_default_ttl = 86400             # 24 horas
cloudfront_max_ttl     = 604800            # 7 días
```

### Paso 3: Preparar Backend (Lambda)

**3.1 Compilar aplicación**
```bash
cd backend

# Compilar con todas las dependencias
mvn clean package -DskipTests

# Verificar que se creó el JAR
ls -lh target/tinambu-tours-lambda*.jar
# Debe ser < 50MB (idealmente 20-30MB)
```

**3.2 Optimizar JAR (opcional)**
```bash
# Si el JAR es muy grande (>50MB), considerar:
# 1. Excluir dependencias no usadas
# 2. Usar thin JARs
# 3. Lambda Layers para dependencias comunes

# Ver tamaño de dependencias
mvn dependency:tree | grep compile
```

### Paso 4: Preparar Frontend

**4.1 Build de producción**
```bash
cd frontend

# Build optimizado
npm run build

# Verificar tamaño
du -sh dist/
# Debe ser < 10MB idealmente
```

**4.2 Optimizar Assets**
```bash
# Comprimir imágenes si no están optimizadas
# Usar herramientas como:
# - imagemin
# - svgo para SVGs
# - webp para imágenes modernas

# Verificar bundle size
npm run build -- --analyze
```

---

## 🚀 Fase 1: Implementación Inicial (Día de Lanzamiento)

### Hora 0-1: Crear Infraestructura Base

**1.1 Inicializar Terraform**
```bash
cd terraform/environments/prod

# Inicializar
terraform init

# Validar configuración
terraform validate

# Ver plan completo
terraform plan -out=prod.tfplan

# REVISAR CUIDADOSAMENTE:
# - Recursos que se crearán
# - Costos estimados
# - Configuración de seguridad
```

**1.2 Aplicar Infraestructura**
```bash
# ADVERTENCIA: Esto creará recursos reales que generan costos

# Aplicar
terraform apply prod.tfplan

# Tiempo estimado: 15-20 minutos
# - VPC y subnets: 2-3 min
# - RDS: 10-12 min
# - Lambda + API Gateway: 2-3 min
# - CloudFront: 5-10 min
```

**1.3 Guardar Outputs Importantes**
```bash
# Guardar outputs en archivo
terraform output > ../../../PROD_OUTPUTS.txt

# Outputs importantes:
# - RDS endpoint
# - API Gateway URL
# - CloudFront distribution ID
# - Lambda function name
```

### Hora 1-2: Configurar CloudFlare

**2.1 Obtener Información de AWS**
```bash
# Obtener CloudFront distribution domain
CLOUDFRONT_DOMAIN=$(terraform output -raw cloudfront_domain_name)
echo "CloudFront: $CLOUDFRONT_DOMAIN"

# Obtener API Gateway custom domain (si existe)
API_GATEWAY_DOMAIN=$(terraform output -raw api_gateway_domain)
echo "API Gateway: $API_GATEWAY_DOMAIN"
```

**2.2 Configurar DNS en CloudFlare**
```
CloudFlare Dashboard → DNS

Añadir registros:

1. Registro A para root domain:
   Type: CNAME
   Name: @
   Content: [CLOUDFRONT_DOMAIN]
   Proxy: ON (naranja) ← IMPORTANTE

2. Registro para API:
   Type: CNAME
   Name: api
   Content: [API_GATEWAY_DOMAIN]
   Proxy: ON (naranja) ← IMPORTANTE

3. Registro para www (opcional):
   Type: CNAME
   Name: www
   Content: pasocenturion.com.uy
   Proxy: ON (naranja)
```

**2.3 Configurar SSL en CloudFlare**
```
SSL/TLS → Origin Server

1. Create Certificate
   - Certificate validity: 15 years
   - List the hostnames: 
     *.pasocenturion.com.uy
     pasocenturion.com.uy

2. Copiar certificado y private key

3. Subir a AWS Certificate Manager:
```

```bash
# Importar certificado a ACM
aws acm import-certificate \
  --certificate fileb://cert.pem \
  --private-key fileb://privkey.pem \
  --region us-east-1

# Guardar ARN del certificado
```

**2.4 Configurar Page Rules (Optimización)**
```
CloudFlare → Page Rules

Rule 1: Cache estático
URL: pasocenturion.com.uy/assets/*
Settings:
  - Browser Cache TTL: 7 days
  - Cache Level: Cache Everything

Rule 2: API no cachear
URL: api.pasocenturion.com.uy/*
Settings:
  - Browser Cache TTL: Respect Existing Headers
  - Cache Level: Bypass

(Plan Free: 3 page rules incluidas)
```

### Hora 2-3: Subir Frontend

**3.1 Sync a S3**
```bash
cd frontend

# Obtener bucket name
S3_BUCKET=$(cd ../../terraform/environments/prod && terraform output -raw s3_frontend_bucket)

# Sync archivos
aws s3 sync dist/ s3://$S3_BUCKET/ \
  --delete \
  --cache-control "public, max-age=31536000" \
  --exclude "index.html" \
  --region us-east-1

# index.html con cache corto
aws s3 cp dist/index.html s3://$S3_BUCKET/index.html \
  --cache-control "public, max-age=3600" \
  --region us-east-1
```

**3.2 Invalidar CloudFront**
```bash
# Obtener distribution ID
DISTRIBUTION_ID=$(cd ../../terraform/environments/prod && terraform output -raw cloudfront_distribution_id)

# Invalidar cache
aws cloudfront create-invalidation \
  --distribution-id $DISTRIBUTION_ID \
  --paths "/*" \
  --region us-east-1

# Esperar 5-10 minutos para propagación
```

### Hora 3-4: Inicializar Base de Datos

**4.1 Obtener Credenciales**
```bash
# Endpoint de RDS
RDS_ENDPOINT=$(cd terraform/environments/prod && terraform output -raw rds_endpoint)

# Password de RDS (desde SSM Parameter Store)
RDS_PASSWORD=$(aws ssm get-parameter \
  --name "/prod/database/password" \
  --with-decryption \
  --query 'Parameter.Value' \
  --output text \
  --region us-east-1)

echo "RDS Endpoint: $RDS_ENDPOINT"
echo "RDS Password: [OCULTO]"
```

**4.2 Ejecutar Migraciones**
```bash
# Opción 1: Desde Lambda de inicialización
aws lambda invoke \
  --function-name tinambu-tours-init-db-prod \
  --region us-east-1 \
  response.json

# Ver resultado
cat response.json

# Opción 2: Desde local con psql
# SOLO si Lambda está en VPC y tienes acceso VPN/bastion
# psql -h $RDS_ENDPOINT -U tinambu_admin -d tinambu_tours -f schema.sql
```

**4.3 Verificar Schema**
```bash
# Listar tablas
aws lambda invoke \
  --function-name tinambu-tours-backend-prod \
  --payload '{"action":"list-tables"}' \
  --region us-east-1 \
  response.json

cat response.json
```

### Hora 4-5: Testing Completo

**5.1 Test de Infraestructura**
```bash
# Archivo: scripts/test-production.sh

#!/bin/bash
echo "=== Test de Producción ==="

# 1. Test DNS
echo "1. Testing DNS..."
nslookup pasocenturion.com.uy
nslookup api.pasocenturion.com.uy

# 2. Test SSL
echo "2. Testing SSL..."
curl -I https://pasocenturion.com.uy

# 3. Test API
echo "3. Testing API..."
curl https://api.pasocenturion.com.uy/health

# 4. Test RDS connectivity (desde Lambda)
echo "4. Testing RDS..."
aws lambda invoke \
  --function-name tinambu-tours-backend-prod \
  --payload '{"action":"db-health"}' \
  --region us-east-1 \
  response.json

# 5. Test CloudFront
echo "5. Testing CloudFront..."
curl -I https://pasocenturion.com.uy | grep -i cloudfront

echo "=== Tests Completados ==="
```

**5.2 Test Funcional**
```
Manual testing en browser:

1. Abrir https://pasocenturion.com.uy
   ✓ Página carga
   ✓ HTTPS habilitado
   ✓ Sin errores en console

2. Navegar secciones principales
   ✓ Home
   ✓ Tours
   ✓ Alojamientos
   ✓ Contacto

3. Test de formularios
   ✓ Registro de usuario
   ✓ Login
   ✓ Búsqueda de tours

4. Test de performance
   ✓ Lighthouse score >80
   ✓ Time to first byte <500ms
   ✓ First contentful paint <2s
```

**5.3 Test de Seguridad**
```bash
# SSL Labs test
# Ir a: https://www.ssllabs.com/ssltest/
# Ingresar: pasocenturion.com.uy
# Objetivo: Grade A o A+

# Security Headers
curl -I https://pasocenturion.com.uy | grep -i "x-\|strict-\|content-security"

# WAF test (CloudFlare)
# Dashboard → Security → Events
# Verificar que esté bloqueando amenazas comunes
```

---

## 📊 Fase 2: Post-Lanzamiento (Primera Semana)

### Día 1: Monitoreo Intensivo

**Configurar Alarmas**
```bash
# Archivo: scripts/setup-production-alarms.sh

#!/bin/bash
# Crear alarmas críticas de CloudWatch

# 1. RDS CPU > 80%
aws cloudwatch put-metric-alarm \
  --alarm-name "prod-rds-high-cpu" \
  --alarm-description "RDS CPU > 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/RDS \
  --statistic Average \
  --period 300 \
  --evaluation-periods 2 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=DBInstanceIdentifier,Value=tinambu-db-prod \
  --region us-east-1

# 2. Lambda Errors > 1%
aws cloudwatch put-metric-alarm \
  --alarm-name "prod-lambda-high-errors" \
  --alarm-description "Lambda error rate > 1%" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --evaluation-periods 1 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=FunctionName,Value=tinambu-tours-backend-prod \
  --region us-east-1

# 3. Budget > $20
# (Ya configurado en Terraform con budget_limit = 25)

echo "Alarmas configuradas"
```

**Monitorear Logs**
```bash
# Logs de Lambda (tiempo real)
aws logs tail /aws/lambda/tinambu-tours-backend-prod --follow

# Logs de RDS
aws logs tail /aws/rds/instance/tinambu-db-prod/postgresql --follow

# Logs de CloudFront (cada 5 min)
# Dashboard → CloudFront → Reports & analytics
```

### Días 2-7: Optimización

**Analizar Métricas**
```bash
# Script de análisis diario
# Archivo: scripts/daily-production-report.sh

#!/bin/bash
echo "=== Reporte Diario de Producción ===" date

# Costos
echo "Costos (últimas 24 horas):"
aws ce get-cost-and-usage \
  --time-period Start=$(date -d '1 day ago' +%Y-%m-%d),End=$(date +%Y-%m-%d) \
  --granularity DAILY \
  --metrics "UnblendedCost" \
  --group-by Type=DIMENSION,Key=SERVICE \
  --region us-east-1

# Métricas de uso
echo ""
echo "Métricas de uso:"
# Lambda invocaciones
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=tinambu-tours-backend-prod \
  --start-time $(date -u -d '24 hours ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 86400 \
  --statistics Sum \
  --region us-east-1

# CloudFront requests
# (Ver en Console o API)

echo "=== Fin del Reporte ==="
```

**Ajustar Cache**
```
Basado en métricas reales:

1. Si CloudFront cache hit rate < 70%:
   - Aumentar TTL de assets
   - Añadir más tipos de archivos a cache
   - Revisar headers de cache

2. Si Lambda cold starts > 5%:
   - Verificar que SnapStart esté habilitado
   - Considerar provisioned concurrency (solo si crítico)

3. Si RDS CPU consistentemente < 30%:
   - db.t4g.micro es suficiente ✓

4. Si transferencia de datos > 5GB/mes:
   - Optimizar tamaño de assets
   - Aumentar compresión
   - Verificar que CloudFront cache funcione
```

---

## 💰 Monitoreo de Costos

### Alertas Configuradas

```
Budget Alert 1: $20/mes (80% del presupuesto)
- Email a: [TU_EMAIL]
- Acción: Revisar costos inmediatamente

Budget Alert 2: $25/mes (100% del presupuesto)
- Email a: [TU_EMAIL] + [MANAGER_EMAIL]
- Acción: Investigar causa y tomar medidas

Budget Alert 3: $30/mes (120% del presupuesto - crítico)
- Email a: [TU_EMAIL] + [MANAGER_EMAIL]
- Acción: Detener recursos no esenciales si es necesario
```

### Análisis Semanal

```bash
# Reporte semanal de costos
aws ce get-cost-and-usage \
  --time-period Start=$(date -d '7 days ago' +%Y-%m-%d),End=$(date +%Y-%m-%d) \
  --granularity DAILY \
  --metrics "UnblendedCost" \
  --group-by Type=DIMENSION,Key=SERVICE \
  --region us-east-1 \
  > weekly-cost-report.json

# Analizar:
# - ¿Algún servicio tiene pico inusual?
# - ¿Transferencia de datos dentro de lo esperado?
# - ¿RDS storage creciendo como esperado?
# - ¿Lambda invocaciones consistentes?
```

---

## 🔄 Plan de Escalamiento

### Gatillos para Upgrade

**Escenario 1: Tráfico crece a 5K usuarios/mes**
```
Acciones:
1. Monitorear RDS CPU/Memory
2. Si CPU > 70% consistentemente:
   → Upgrade a db.t4g.small ($23/mes)
3. Mantener Single-AZ (aún suficiente)
4. Costo esperado: $30-40/mes
```

**Escenario 2: Tráfico crece a 10K+ usuarios/mes**
```
Acciones:
1. Considerar Multi-AZ ($48/mes para db.t4g.small)
2. Evaluar NAT Gateway para HA ($64/mes)
3. CloudFlare Pro si es necesario ($20/mes)
4. Costo esperado: $80-100/mes
```

**Escenario 3: Downtime se vuelve crítico**
```
Acciones:
1. Implementar Multi-AZ inmediatamente
2. NAT Gateway Multi-AZ
3. Read Replica para RDS
4. Contratar AWS Support (Business: $100/mes)
5. Costo esperado: $150-200/mes
```

### Comando de Upgrade

```bash
# Cuando sea necesario upgrade de RDS:

cd terraform/environments/prod

# Editar prod.auto.tfvars
# db_instance_class = "db.t4g.small"

terraform plan -out=upgrade.tfplan
# REVISAR: debe mostrar in-place update (no recreación)

terraform apply upgrade.tfplan
# Downtime: 2-3 minutos para reboot
```

---

## ⚠️ Plan de Rollback

### Si algo sale mal

**Rollback de Terraform**
```bash
# Si los cambios causaron problemas:

cd terraform/environments/prod

# Ver estado anterior
terraform show

# Rollback a versión anterior
terraform state list
terraform import [recurso] [id]

# O destruir y recrear desde backup
terraform destroy -target=[recurso_problemático]
terraform apply
```

**Restaurar RDS desde Backup**
```bash
# Listar backups disponibles
aws rds describe-db-snapshots \
  --db-instance-identifier tinambu-db-prod \
  --query 'DBSnapshots[*].[DBSnapshotIdentifier,SnapshotCreateTime]' \
  --region us-east-1

# Restaurar desde snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier tinambu-db-prod-restored \
  --db-snapshot-identifier [SNAPSHOT_ID] \
  --db-instance-class db.t4g.micro \
  --region us-east-1

# Actualizar endpoint en aplicación
# Esperar 10-15 minutos
```

**Rollback de Frontend**
```bash
# Revertir a versión anterior en S3
aws s3 sync s3://$S3_BUCKET-backup/ s3://$S3_BUCKET/ \
  --delete \
  --region us-east-1

# Invalidar CloudFront
aws cloudfront create-invalidation \
  --distribution-id $DISTRIBUTION_ID \
  --paths "/*" \
  --region us-east-1
```

---

## ✅ Checklist de Lanzamiento

### Pre-Lanzamiento
- [ ] CloudFlare configurado y DNS propagado
- [ ] Terraform plan revisado y aprobado
- [ ] Backend compilado y optimizado
- [ ] Frontend buildeado y optimizado
- [ ] Backups automáticos configurados
- [ ] Alarmas de CloudWatch creadas
- [ ] Budget alerts configurados
- [ ] Plan de rollback documentado

### Día de Lanzamiento
- [ ] Infraestructura creada con Terraform
- [ ] CloudFlare DNS configurado
- [ ] Frontend subido a S3
- [ ] CloudFront invalidado
- [ ] Base de datos inicializada
- [ ] Tests funcionales pasados
- [ ] Tests de seguridad pasados
- [ ] Monitoreo activo

### Post-Lanzamiento (Primera Semana)
- [ ] Monitoreo diario de costos
- [ ] Métricas de rendimiento aceptables
- [ ] Sin incidentes críticos
- [ ] Cache de CloudFront optimizado
- [ ] Logs revisados sin errores graves
- [ ] Backups verificados funcionando

### Primer Mes
- [ ] Costo mensual dentro de presupuesto ($18-25)
- [ ] Uptime >99.5%
- [ ] Sin brechas de seguridad
- [ ] GuardDuty sin hallazgos críticos
- [ ] CloudFlare bloqueando amenazas
- [ ] Plan de escalamiento revisado

---

## 📞 Soporte y Contactos

### AWS Support
- Plan: Developer (incluido gratis)
- Limitaciones: Solo soporte técnico básico
- Response time: 12-24 horas

### CloudFlare Support
- Plan: Free (soporte comunitario)
- Forum: https://community.cloudflare.com/
- Docs: https://developers.cloudflare.com/

### Emergency Contacts
```
Incidente Crítico:
1. [TU_EMAIL]
2. [BACKUP_CONTACT]
3. AWS Support (si es problema de AWS)

Incidente de Seguridad:
1. Deshabilitar tráfico en CloudFlare (5 clicks)
2. Revisar GuardDuty findings
3. Revisar logs de CloudWatch
4. Contactar AWS Support si es necesario
```

---

## 🎯 Métricas de Éxito

### Mes 1
- ✅ Costo < $25/mes
- ✅ Uptime > 99%
- ✅ Zero brechas de seguridad
- ✅ Tiempo de carga < 3s
- ✅ Sin incidentes críticos

### Mes 3
- ✅ Costo < $20/mes (con optimizaciones)
- ✅ Uptime > 99.5%
- ✅ 500+ usuarios registrados
- ✅ Plan de escalamiento validado

### Mes 6
- ✅ Evaluar Reserved Instances (ahorro 30-40%)
- ✅ Decidir si escalar a Multi-AZ
- ✅ Considerar CloudFlare Pro si es necesario

---

**Documento creado**: Noviembre 2025  
**Para implementar**: Cuando desarrollo esté validado  
**Costo objetivo**: $18-25/mes  
**Tráfico soportado**: 1,000-5,000 usuarios/mes  

**¡Éxito con el lanzamiento! 🚀**


