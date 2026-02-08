# Guía de Implementación - Ambiente de Desarrollo
## Plan de Optimización de Costos

**Fecha**: Noviembre 2025  
**Objetivo**: Reducir costo de $24/mes a $8-15/mes  
**Tiempo estimado**: 2-3 horas  
**Downtime esperado**: 10-15 minutos

---

## 📋 Pre-requisitos

### 1. Credenciales AWS Configuradas
```bash
# Verificar que AWS CLI esté configurado
aws sts get-caller-identity

# Si no está configurado:
aws configure
# AWS Access Key ID: [Tu Access Key]
# AWS Secret Access Key: [Tu Secret Key]
# Default region: us-east-1
# Default output format: json
```

### 2. Terraform Instalado
```bash
# Verificar versión
terraform version
# Requiere: Terraform >= 1.5
```

### 3. Backup Manual de RDS (CRÍTICO)
```bash
# Crear snapshot de seguridad ANTES de cualquier cambio
aws rds create-db-snapshot \
  --db-instance-identifier tinambu-db-dev \
  --db-snapshot-identifier tinambu-db-dev-pre-optimization-$(date +%Y%m%d-%H%M) \
  --region us-east-1

# Verificar que se creó
aws rds describe-db-snapshots \
  --db-snapshot-identifier tinambu-db-dev-pre-optimization-* \
  --region us-east-1
```

---

## 🎯 Fase 1: Análisis Inicial (15 minutos)

### Paso 1: Analizar Costos Actuales
```bash
# Ejecutar análisis de tráfico del NAT Instance
./scripts/analyze-nat-traffic.sh 30

# Tomar nota del costo actual para comparación posterior
```

### Paso 2: Documentar Estado Actual
```bash
# Ver recursos actuales
aws rds describe-db-instances \
  --query 'DBInstances[*].[DBInstanceIdentifier,DBInstanceClass,AllocatedStorage,MultiAZ,BackupRetentionPeriod]' \
  --output table \
  --region us-east-1

aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=*nat*" \
  --query 'Reservations[*].Instances[*].[InstanceId,InstanceType,State.Name,Tags[?Key==`Name`].Value|[0]]' \
  --output table \
  --region us-east-1
```

**Guarda esta información** para comparar después.

---

## 🚀 Fase 2: Aplicar Optimizaciones de Terraform (45-60 minutos)

### Paso 1: Verificar Cambios
```bash
cd terraform/environments/dev

# Inicializar Terraform
terraform init

# Ver exactamente qué va a cambiar
terraform plan -out=tfplan

# REVISAR CUIDADOSAMENTE el output
# Buscar:
# - Recursos que se van a DESTRUIR (destroy)
# - Recursos que se van a RECREAR (replace)
# - Cambios en configuración
```

**⚠️ IMPORTANTE**: El plan debería mostrar:
- ✅ Reducción de 2 AZ a 1 AZ (subnets)
- ✅ Cambios en RDS (storage, backup retention)
- ✅ Cambios en budget alerts
- ⚠️ Posible recreación de RDS (si reduces storage)

### Paso 2: Revisar Cambios Específicos

**Cambios esperados en RDS**:
```
  ~ aws_db_instance.main
      ~ allocated_storage         = 20 -> 10
      ~ max_allocated_storage     = 100 -> 30
      ~ backup_retention_period   = 7 -> 1
      ~ multi_az                  = false (sin cambio en dev)
```

**Cambios esperados en Networking**:
```
  ~ aws_subnet.private[1]        (will be destroyed)
  ~ aws_route_table.private[1]   (will be destroyed)
```

**Cambios esperados en Monitoring**:
```
  ~ aws_budgets_budget.monthly_cost
      ~ limit_amount = 30 -> 15
```

### Paso 3: Aplicar Cambios

**OPCIÓN A: Si NO hay recreación de RDS** (solo cambios de configuración)
```bash
# Aplicar cambios
terraform apply tfplan

# Esto tomará 5-10 minutos
```

**OPCIÓN B: Si HAY recreación de RDS** (cambio de storage)
```bash
# ADVERTENCIA: Esto recreará la base de datos
# Habrá downtime de 10-15 minutos

# Confirmar que tienes backup reciente
aws rds describe-db-snapshots \
  --db-instance-identifier tinambu-db-dev \
  --query 'DBSnapshots[-1].[DBSnapshotIdentifier,SnapshotCreateTime]' \
  --region us-east-1

# Aplicar cambios
terraform apply tfplan

# Esto tomará 10-15 minutos
# RDS se eliminará y recreará con nueva configuración
```

### Paso 4: Verificar Aplicación Exitosa
```bash
# Verificar que Terraform completó sin errores
echo $?  # Debe ser 0

# Ver estado de recursos
terraform show | grep -A 5 "aws_db_instance.main"
terraform show | grep -A 5 "aws_budgets_budget"

# Verificar que RDS esté disponible
aws rds describe-db-instances \
  --db-instance-identifier tinambu-db-dev \
  --query 'DBInstances[0].[DBInstanceStatus,AllocatedStorage,BackupRetentionPeriod,MultiAZ]' \
  --region us-east-1
```

---

## 🔄 Fase 3: Implementar Rutina de Stop/Start (30 minutos)

### Paso 1: Testear Scripts

**Test 1: Analizar tráfico**
```bash
./scripts/analyze-nat-traffic.sh 7

# Debe mostrar:
# - ID del NAT Instance
# - Métricas de tráfico
# - Estimación de costos
```

**Test 2: Detener recursos**
```bash
# ADVERTENCIA: Esto detendrá RDS y NAT Instance
# Solo hazlo si NO necesitas trabajar en los próximos minutos

./scripts/stop-dev-resources.sh

# Debe mostrar:
# ✅ RDS: Detenido
# ✅ NAT Instance: Detenido
# 💰 Ahorro estimado: ~$1.30/día
```

**Test 3: Iniciar recursos**
```bash
# Esperar 2-3 minutos después de detener

./scripts/start-dev-resources.sh

# Debe mostrar:
# ⏳ Iniciando NAT Instance...
# ⏳ Iniciando RDS...
# ✅ Todos los recursos disponibles

# Tiempo esperado: 3-5 minutos
```

### Paso 2: Verificar Conectividad

```bash
# Verificar que puedes conectarte a RDS
# (desde tu aplicación o cliente SQL)

# Endpoint de RDS
aws rds describe-db-instances \
  --db-instance-identifier tinambu-db-dev \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text \
  --region us-east-1

# Test de conectividad (si tienes psql instalado)
# psql -h [endpoint] -U tinambu_admin -d tinambu_tours -c "SELECT version();"
```

### Paso 3: Documentar Rutina Diaria

Crear recordatorio para el equipo:

```
📋 RUTINA DIARIA DE DESARROLLO

Al TERMINAR de trabajar:
$ ./scripts/stop-dev-resources.sh
⏱️  30 segundos | 💰 Ahorro: ~$1.30/día

Al COMENZAR a trabajar:
$ ./scripts/start-dev-resources.sh
⏱️  3-5 minutos | ✅ Recursos disponibles

IMPORTANTE:
- Guardar cambios y hacer commit ANTES de detener
- Planificar inicio 5 minutos antes de necesitarlo
- Si RDS no se usa en 7 días, AWS lo reinicia automáticamente
```

---

## 📊 Fase 4: Monitoreo y Validación (Primera Semana)

### Día 1: Verificación Inmediata

**Después de aplicar cambios**:
```bash
# 1. Verificar que aplicación funciona
# - Frontend carga correctamente
# - Backend responde a APIs
# - Base de datos accesible

# 2. Revisar logs de CloudWatch
aws logs tail /aws/rds/instance/tinambu-db-dev/postgresql --follow

# 3. Verificar métricas de RDS
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name CPUUtilization \
  --dimensions Name=DBInstanceIdentifier,Value=tinambu-db-dev \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average \
  --region us-east-1
```

### Días 2-7: Monitoreo Diario

**Crear script de monitoreo diario**:
```bash
#!/bin/bash
# scripts/daily-monitoring.sh

echo "=== Monitoreo Diario de Costos ==="
echo "Fecha: $(date)"
echo ""

# Costo diario (aproximado)
echo "Verificando costos..."
aws ce get-cost-and-usage \
  --time-period Start=$(date -d '1 day ago' +%Y-%m-%d),End=$(date +%Y-%m-%d) \
  --granularity DAILY \
  --metrics "UnblendedCost" \
  --region us-east-1

echo ""
echo "Estado de recursos:"

# Estado RDS
RDS_STATUS=$(aws rds describe-db-instances \
  --db-instance-identifier tinambu-db-dev \
  --query 'DBInstances[0].DBInstanceStatus' \
  --output text \
  --region us-east-1)
echo "RDS: $RDS_STATUS"

# Estado NAT Instance
NAT_STATE=$(aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=tinambu-nat-instance-dev" \
  --query 'Reservations[0].Instances[0].State.Name' \
  --output text \
  --region us-east-1)
echo "NAT Instance: $NAT_STATE"

echo ""
echo "=== Fin del Monitoreo ==="
```

**Ejecutar diariamente**:
```bash
chmod +x scripts/daily-monitoring.sh
./scripts/daily-monitoring.sh
```

### Semana 1: Análisis de Resultados

**Al final de la primera semana**:
```bash
# 1. Analizar tráfico semanal
./scripts/analyze-nat-traffic.sh 7

# 2. Comparar costos
aws ce get-cost-and-usage \
  --time-period Start=$(date -d '7 days ago' +%Y-%m-%d),End=$(date +%Y-%m-%d) \
  --granularity DAILY \
  --metrics "UnblendedCost" \
  --group-by Type=DIMENSION,Key=SERVICE \
  --region us-east-1

# 3. Documentar resultados
# - Costo promedio diario
# - Comparar con $24/mes anterior ($0.80/día)
# - Objetivo: $8-15/mes ($0.27-0.50/día)
```

---

## 🎯 Métricas de Éxito

### Checklist de Validación

**Funcionalidad**:
- [ ] Aplicación funciona correctamente
- [ ] APIs responden normalmente
- [ ] Base de datos accesible
- [ ] No hay errores en logs
- [ ] Tiempo de respuesta aceptable (<500ms)

**Costos**:
- [ ] Costo diario < $0.50 (objetivo: $0.27-0.35)
- [ ] Budget alert configurado en $15/mes
- [ ] Sin alertas de presupuesto excedido
- [ ] Transferencia de datos reducida

**Operaciones**:
- [ ] Scripts de stop/start funcionan correctamente
- [ ] Tiempo de inicio: 3-5 minutos
- [ ] Recovery de RDS funciona (testear una vez)
- [ ] Equipo conoce la rutina diaria

**Seguridad**:
- [ ] Backups automáticos funcionando (1 día)
- [ ] Snapshots manuales creados
- [ ] Sin incidentes de seguridad
- [ ] GuardDuty sin hallazgos críticos

---

## ⚠️ Troubleshooting

### Problema 1: Terraform plan muestra errores
```bash
# Verificar sintaxis
terraform fmt -check
terraform validate

# Limpiar cache y reintentar
rm -rf .terraform .terraform.lock.hcl
terraform init
terraform plan
```

### Problema 2: RDS no inicia después de stop
```bash
# Verificar estado
aws rds describe-db-instances \
  --db-instance-identifier tinambu-db-dev \
  --query 'DBInstances[0].DBInstanceStatus' \
  --region us-east-1

# Si está "stopped" por más de 7 días, AWS lo reinicia automáticamente
# Esperar o forzar inicio:
aws rds start-db-instance \
  --db-instance-identifier tinambu-db-dev \
  --region us-east-1
```

### Problema 3: Costos siguen altos
```bash
# Analizar tráfico del NAT
./scripts/analyze-nat-traffic.sh 7

# Si transferencia > 10GB/semana, investigar:
# - Lambda ejecutándose demasiado
# - Descargas innecesarias
# - Tráfico no optimizado

# Ver logs de VPC Flow
aws ec2 describe-flow-logs --region us-east-1
```

### Problema 4: Aplicación no conecta a RDS
```bash
# 1. Verificar que RDS está "available"
aws rds describe-db-instances \
  --db-instance-identifier tinambu-db-dev \
  --query 'DBInstances[0].[DBInstanceStatus,Endpoint.Address]' \
  --region us-east-1

# 2. Verificar Security Groups
aws ec2 describe-security-groups \
  --filters "Name=tag:Name,Values=*rds*" \
  --region us-east-1

# 3. Testear conectividad desde Lambda
# (ejecutar test desde Lambda function)
```

---

## 📈 Siguiente Fase: Automatización (Opcional)

Después de 2-4 semanas de operación manual exitosa, considera:

### Opción 1: Automatizar con Cron (Local)
```bash
# Editar crontab
crontab -e

# Detener a las 8 PM de lunes a viernes
0 20 * * 1-5 cd /ruta/a/proyecto && ./scripts/stop-dev-resources.sh

# Iniciar a las 8 AM de lunes a viernes
0 8 * * 1-5 cd /ruta/a/proyecto && ./scripts/start-dev-resources.sh
```

### Opción 2: Automatizar con EventBridge (AWS)
Ver `AWS_COST_OPTIMIZATION_PLAN.md` sección 2.4 para configuración de EventBridge.

---

## 📊 Reporte de Resultados (Template)

**Después de 1 semana de implementación**:

```markdown
# Reporte de Optimización de Costos - Semana 1

## Resultados
- **Costo anterior**: $24/mes ($0.80/día)
- **Costo actual**: $XX/mes ($X.XX/día)
- **Ahorro**: $XX/mes (XX%)

## Métricas
- Uptime: XX%
- Incidentes: X
- Tiempo promedio de inicio: X minutos
- Compliance con rutina stop/start: XX%

## Problemas Encontrados
- [Listar problemas y soluciones]

## Recomendaciones
- [Ajustes sugeridos]

## Próximos Pasos
- [Acciones para siguiente fase]
```

---

## ✅ Checklist Final

### Antes de Implementar
- [ ] Backup manual de RDS creado
- [ ] Credenciales AWS configuradas
- [ ] Terraform inicializado
- [ ] Plan de Terraform revisado
- [ ] Equipo notificado del cambio

### Durante Implementación
- [ ] terraform apply ejecutado exitosamente
- [ ] Recursos verificados en AWS Console
- [ ] Aplicación funcional después de cambios
- [ ] Scripts de stop/start testeados

### Después de Implementar
- [ ] Rutina diaria documentada y comunicada
- [ ] Monitoreo diario configurado
- [ ] Alarmas de CloudWatch verificadas
- [ ] Budget alerts configurados
- [ ] Primera semana de monitoreo completada

### Documentación
- [ ] Resultados documentados
- [ ] Lecciones aprendidas registradas
- [ ] Plan de producción revisado

---

## 🚀 ¡Listo para Implementar!

**Comando final para iniciar**:
```bash
# 1. Crear backup
aws rds create-db-snapshot \
  --db-instance-identifier tinambu-db-dev \
  --db-snapshot-identifier tinambu-db-dev-pre-opt-$(date +%Y%m%d) \
  --region us-east-1

# 2. Esperar a que complete
aws rds wait db-snapshot-completed \
  --db-snapshot-identifier tinambu-db-dev-pre-opt-$(date +%Y%m%d) \
  --region us-east-1

# 3. Aplicar Terraform
cd terraform/environments/dev
terraform init
terraform plan -out=tfplan
terraform apply tfplan

# 4. Verificar
./scripts/start-dev-resources.sh
./scripts/analyze-nat-traffic.sh 1
```

**Tiempo total estimado**: 2-3 horas  
**Ahorro esperado**: $15-16/mes (64%)

---

**Documento creado**: Noviembre 2025  
**Última actualización**: Noviembre 2025  
**Versión**: 1.0


