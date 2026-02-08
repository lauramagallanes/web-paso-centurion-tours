# 🚀 Instrucciones para Implementar Optimizaciones en Desarrollo

## ⚠️ Pre-requisito: Configurar Credenciales AWS

Antes de ejecutar el script de deployment, necesitas configurar las credenciales de AWS:

```bash
aws configure
```

Te pedirá:
```
AWS Access Key ID [None]: TU_ACCESS_KEY_AQUI
AWS Secret Access Key [None]: TU_SECRET_KEY_AQUI
Default region name [None]: us-east-1
Default output format [None]: json
```

### ¿Cómo obtener las credenciales?

1. Ve a AWS Console: https://console.aws.amazon.com/
2. Click en tu nombre (arriba derecha) → "Security credentials"
3. Sección "Access keys" → "Create access key"
4. Guarda el Access Key ID y Secret Access Key

## 🎯 Opción 1: Ejecutar Script Automático (Recomendado)

El script automático hace todo el proceso por ti:

```bash
./scripts/deploy-dev-optimizations.sh
```

### ¿Qué hace el script?

1. ✅ Verifica que tengas AWS CLI y credenciales configuradas
2. ✅ Verifica que Terraform esté instalado
3. ✅ Analiza el estado actual (baseline)
4. ✅ Crea backup automático de RDS
5. ✅ Ejecuta terraform plan y te muestra los cambios
6. ✅ Te pide confirmación antes de aplicar
7. ✅ Aplica las optimizaciones con terraform apply
8. ✅ Verifica que todo esté funcionando
9. ✅ Testea los scripts de stop/start
10. ✅ Crea documentación de rutina diaria

**Tiempo total**: 30-45 minutos (incluye esperas de AWS)

## 🔧 Opción 2: Ejecutar Manualmente Paso a Paso

Si prefieres control total, ejecuta cada paso manualmente:

### Paso 1: Configurar AWS CLI
```bash
aws configure
# Ingresar credenciales
```

### Paso 2: Verificar conexión
```bash
aws sts get-caller-identity
# Debe mostrar tu Account ID
```

### Paso 3: Crear Backup de RDS (CRÍTICO)
```bash
aws rds create-db-snapshot \
  --db-instance-identifier tinambu-db-dev \
  --db-snapshot-identifier tinambu-db-dev-pre-opt-$(date +%Y%m%d) \
  --region us-east-1

# Esperar a que complete (5-10 minutos)
aws rds wait db-snapshot-completed \
  --db-snapshot-identifier tinambu-db-dev-pre-opt-$(date +%Y%m%d) \
  --region us-east-1
```

### Paso 4: Aplicar Terraform
```bash
cd terraform/environments/dev

# Inicializar
terraform init -upgrade

# Ver cambios (REVISAR CUIDADOSAMENTE)
terraform plan -out=tfplan

# Si todo se ve bien, aplicar
terraform apply tfplan
```

### Paso 5: Verificar Recursos
```bash
# Verificar RDS
aws rds describe-db-instances \
  --db-instance-identifier tinambu-db-dev \
  --query 'DBInstances[0].[DBInstanceStatus,AllocatedStorage,BackupRetentionPeriod]' \
  --region us-east-1

# Verificar aplicación funciona
# (testear manualmente tu aplicación)
```

### Paso 6: Testear Scripts
```bash
cd ../../../

# Testear stop
./scripts/stop-dev-resources.sh

# Esperar 30 segundos
sleep 30

# Testear start
./scripts/start-dev-resources.sh
```

### Paso 7: Analizar Tráfico
```bash
./scripts/analyze-nat-traffic.sh 30
```

## 📊 Después de la Implementación

### Monitoreo Diario (Primera Semana)

**Cada día durante la primera semana**, verifica los costos:

```bash
# Ver costo del día anterior
aws ce get-cost-and-usage \
  --time-period Start=$(date -d '1 day ago' +%Y-%m-%d),End=$(date +%Y-%m-%d) \
  --granularity DAILY \
  --metrics "UnblendedCost" \
  --region us-east-1
```

**Objetivo**: Costo diario < $0.50 (ideal: $0.27-0.35)

### Rutina Diaria Establecida

**Al TERMINAR de trabajar**:
```bash
./scripts/stop-dev-resources.sh
```

**Al COMENZAR a trabajar**:
```bash
./scripts/start-dev-resources.sh
# Esperar 3-5 minutos
```

### Análisis Semanal

**Cada viernes**:
```bash
# Analizar tráfico de la semana
./scripts/analyze-nat-traffic.sh 7

# Ver costos de la semana
aws ce get-cost-and-usage \
  --time-period Start=$(date -d '7 days ago' +%Y-%m-%d),End=$(date +%Y-%m-%d) \
  --granularity DAILY \
  --metrics "UnblendedCost" \
  --group-by Type=DIMENSION,Key=SERVICE \
  --region us-east-1
```

## ✅ Checklist de Validación

Después de la implementación, verifica:

### Funcionalidad
- [ ] Aplicación carga correctamente
- [ ] Backend responde a APIs
- [ ] Base de datos es accesible
- [ ] No hay errores en logs
- [ ] Tiempo de respuesta aceptable

### Costos
- [ ] Costo diario < $0.50
- [ ] Budget alert en $15/mes configurado
- [ ] Sin alertas de presupuesto
- [ ] Transferencia de datos reducida

### Scripts
- [ ] stop-dev-resources.sh funciona
- [ ] start-dev-resources.sh funciona
- [ ] analyze-nat-traffic.sh funciona
- [ ] Tiempo de inicio: 3-5 minutos

### Documentación
- [ ] RUTINA_DIARIA.md creado
- [ ] baseline-traffic.txt guardado
- [ ] baseline-resources.txt guardado
- [ ] Equipo informado de la rutina

## 🆘 Troubleshooting

### Error: "Unable to locate credentials"
```bash
# Solución: Configurar AWS CLI
aws configure
```

### Error: "Access Denied" en AWS
```bash
# Verificar que tus credenciales tengan permisos para:
# - RDS (describe, stop, start, create-snapshot)
# - EC2 (describe, stop, start)
# - CloudWatch (get-metric-statistics)

# Ver qué usuario estás usando:
aws sts get-caller-identity
```

### Error: Terraform plan muestra cambios destructivos inesperados
```bash
# NO aplicar terraform apply
# Revisar qué cambió
# Consultar documentación: IMPLEMENTATION_GUIDE_DEV.md
# O contactar soporte
```

### RDS no inicia después de stop
```bash
# Ver estado
aws rds describe-db-instances \
  --db-instance-identifier tinambu-db-dev \
  --query 'DBInstances[0].DBInstanceStatus' \
  --region us-east-1

# Si está "stopped", forzar inicio
aws rds start-db-instance \
  --db-instance-identifier tinambu-db-dev \
  --region us-east-1
```

### Aplicación no conecta a base de datos
```bash
# 1. Verificar que RDS esté "available"
aws rds describe-db-instances \
  --db-instance-identifier tinambu-db-dev \
  --region us-east-1

# 2. Verificar Security Groups
# 3. Verificar que Lambda tenga acceso a VPC
```

## 📚 Documentación Adicional

- **Guía completa**: `IMPLEMENTATION_GUIDE_DEV.md`
- **Plan maestro**: `AWS_COST_OPTIMIZATION_PLAN.md`
- **Referencia rápida**: `AWS_COST_QUICK_REFERENCE.md`
- **Scripts**: `scripts/COST_MANAGEMENT_README.md`

## 💰 Resultado Esperado

### Antes
```
Costo mensual: $24.06
Costo diario:  $0.80
```

### Después (sin parada manual)
```
Costo mensual: ~$14
Costo diario:  ~$0.47
Ahorro:        41%
```

### Después (con parada manual 50% del tiempo)
```
Costo mensual: ~$8-9
Costo diario:  ~$0.27-0.30
Ahorro:        64%
```

## 🎯 Siguiente Paso

**Ejecuta el script de deployment**:

```bash
./scripts/deploy-dev-optimizations.sh
```

El script te guiará paso a paso y te pedirá confirmación antes de aplicar cambios.

---

**¿Preguntas?** Consulta `IMPLEMENTATION_GUIDE_DEV.md` para más detalles.

**¡Éxito con la optimización!** 🚀💰


