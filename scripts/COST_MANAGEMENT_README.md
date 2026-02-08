# Scripts de Gestión de Costos AWS

## Descripción

Conjunto de scripts para gestionar y optimizar los costos de AWS en el ambiente de desarrollo del proyecto Paso Centurion Tours.

## Scripts Disponibles

### 1. `stop-dev-resources.sh` - Detener Recursos

**Propósito**: Detiene RDS y NAT Instance para reducir costos cuando no se están utilizando.

**Uso**:
```bash
./scripts/stop-dev-resources.sh
```

**Recursos que detiene**:
- ✅ RDS PostgreSQL (`tinambu-db-dev`)
- ✅ NAT Instance (`tinambu-nat-instance-dev`)

**Ahorro estimado**: ~$1.30/día (~$40/mes si se usa 50% del tiempo)

**Tiempo de ejecución**: ~30 segundos

**Notas**:
- RDS se reiniciará automáticamente después de 7 días detenido
- El almacenamiento de RDS sigue generando costos (~$0.20/día)
- La EIP del NAT Instance NO genera costos adicionales cuando está asociada

**Ejemplo de output**:
```
==========================================
Deteniendo recursos de desarrollo...
Región: us-east-1
Ambiente: dev
==========================================

✅ Credenciales AWS verificadas
123456789012

🔄 Verificando estado de RDS: tinambu-db-dev...
🛑 Deteniendo RDS: tinambu-db-dev...
✅ RDS detenido exitosamente

🔄 Buscando NAT Instance: tinambu-nat-instance-dev...
🛑 Deteniendo NAT Instance: i-0123456789abcdef0...
✅ NAT Instance detenido exitosamente

==========================================
💰 Estimación de Ahorro
==========================================
TOTAL estimado: ~$1.30/día
==========================================
```

---

### 2. `start-dev-resources.sh` - Iniciar Recursos

**Propósito**: Inicia RDS y NAT Instance para comenzar a trabajar.

**Uso**:
```bash
./scripts/start-dev-resources.sh
```

**Recursos que inicia**:
- ✅ NAT Instance (primero, necesario para conectividad)
- ✅ RDS PostgreSQL (espera a que esté disponible)

**Tiempo de ejecución**: 3-5 minutos

**Orden de inicio**:
1. **NAT Instance** → Inicia primero (30 segundos + 30 segundos de configuración)
2. **RDS** → Inicia después (2-4 minutos hasta estar disponible)

**Verificaciones**:
- ✅ Espera a que cada recurso esté completamente disponible
- ✅ Muestra endpoint de RDS y IP pública del NAT
- ✅ Verifica conectividad

**Ejemplo de output**:
```
==========================================
Iniciando recursos de desarrollo...
==========================================

✅ Credenciales AWS verificadas
123456789012

🔄 Buscando NAT Instance: tinambu-nat-instance-dev...
▶️  Iniciando NAT Instance: i-0123456789abcdef0...
⏳ Esperando a que NAT Instance esté disponible...
✅ NAT Instance iniciado y disponible

🔄 Verificando estado de RDS: tinambu-db-dev...
▶️  Iniciando RDS: tinambu-db-dev...
⏳ Esperando a que RDS esté disponible (3-5 minutos)...
✅ RDS iniciado y disponible

🔍 Verificando conectividad...
✅ Endpoint RDS: tinambu-db-dev.xxxxx.us-east-1.rds.amazonaws.com
✅ IP Pública NAT: 54.123.45.67

==========================================
📊 Resumen
==========================================
✅ NAT Instance: Iniciado
✅ RDS: Iniciado

🎉 Todos los recursos están disponibles
```

---

### 3. `analyze-nat-traffic.sh` - Analizar Tráfico

**Propósito**: Analiza el tráfico de datos del NAT Instance y estima costos de transferencia.

**Uso**:
```bash
./scripts/analyze-nat-traffic.sh [días]

# Ejemplos:
./scripts/analyze-nat-traffic.sh 7   # Últimos 7 días
./scripts/analyze-nat-traffic.sh 14  # Últimos 14 días
./scripts/analyze-nat-traffic.sh 30  # Últimos 30 días
```

**Parámetros**:
- `días` (opcional): Número de días a analizar. Por defecto: 7

**Información que proporciona**:
- 📊 Tráfico de salida (NetworkOut) total y diario
- 📊 Tráfico de entrada (NetworkIn) total y diario
- 💰 Costo estimado de transferencia de datos
- 📈 Proyección mensual de costos
- 💡 Recomendaciones de optimización

**Costos de transferencia de datos**:
- Primer GB: **Gratis**
- Siguientes GB: **$0.09/GB**

**Ejemplo de output**:
```
==========================================
Análisis de Tráfico NAT Instance
Período: Últimos 7 días
==========================================

✅ NAT Instance ID: i-0123456789abcdef0

📊 Tráfico de Salida (NetworkOut) (últimos 7 días):
----------------------------------------
   Total transferido: 45.23 GB
   Promedio diario: 6.46 GB/día
   Máximo en un día: 12.30 GB
   💰 Costo estimado: $3.98 USD

📊 Tráfico de Entrada (NetworkIn) (últimos 7 días):
----------------------------------------
   Total transferido: 12.45 GB
   Promedio diario: 1.78 GB/día
   Máximo en un día: 3.20 GB
   💰 Costo estimado: $1.03 USD

💰 Resumen de Costos (últimos 7 días):
==========================================
   EC2 (t4g.nano): $0.70 USD
   Elastic IP: $0.00 USD (asociado)
   Transferencia datos: $3.98 USD
   ----------------------------------------
   TOTAL: $4.68 USD

   📈 Proyección mensual: $20.06 USD

💡 Recomendaciones:
==========================================
⚠️  Alto consumo de transferencia de datos detectado

   Posibles causas:
   - Descargas frecuentes de dependencias
   - Lambda ejecutándose con mucha frecuencia
   - Tráfico hacia APIs externas

   Soluciones:
   1. Usar VPC Endpoints para servicios AWS (S3 ya configurado ✅)
   2. Cachear dependencias en Lambda Layers
   3. Reducir frecuencia de ejecuciones en desarrollo
   4. Parar recursos cuando no se usan
```

**Interpretación de resultados**:

| Tráfico Mensual | Costo | Interpretación |
|----------------|-------|----------------|
| < 10 GB | < $1 | ✅ Normal para desarrollo |
| 10-30 GB | $1-3 | ⚠️ Revisar uso |
| 30-50 GB | $3-5 | ⚠️ Alto consumo |
| > 50 GB | > $5 | 🔴 Investigar urgente |

---

## Requisitos Previos

### 1. AWS CLI Instalado
```bash
# Verificar instalación
aws --version

# Si no está instalado:
# Linux
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# macOS
brew install awscli
```

### 2. Credenciales AWS Configuradas
```bash
# Configurar credenciales
aws configure

# Ingresar:
# AWS Access Key ID: YOUR_ACCESS_KEY
# AWS Secret Access Key: YOUR_SECRET_KEY
# Default region: us-east-1
# Default output format: json
```

### 3. Permisos IAM Necesarios

Los scripts requieren los siguientes permisos:

**Para RDS**:
- `rds:DescribeDBInstances`
- `rds:StopDBInstance`
- `rds:StartDBInstance`

**Para EC2**:
- `ec2:DescribeInstances`
- `ec2:StopInstances`
- `ec2:StartInstances`

**Para CloudWatch**:
- `cloudwatch:GetMetricStatistics`

**Para STS (verificación)**:
- `sts:GetCallerIdentity`

**Policy IAM de ejemplo**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "rds:DescribeDBInstances",
        "rds:StopDBInstance",
        "rds:StartDBInstance",
        "ec2:DescribeInstances",
        "ec2:StopInstances",
        "ec2:StartInstances",
        "cloudwatch:GetMetricStatistics",
        "sts:GetCallerIdentity"
      ],
      "Resource": "*"
    }
  ]
}
```

### 4. Herramientas Adicionales (para analyze-nat-traffic.sh)
```bash
# jq (para procesar JSON)
# Linux
sudo apt install jq

# macOS
brew install jq

# bc (para cálculos)
# Linux
sudo apt install bc

# macOS (pre-instalado)
```

---

## Flujo de Trabajo Recomendado

### Rutina Diaria

**Al comenzar a trabajar**:
```bash
# 1. Iniciar recursos (3-5 minutos)
./scripts/start-dev-resources.sh

# 2. Verificar que todo esté disponible
# El script mostrará endpoints y IPs

# 3. Comenzar a desarrollar
# ...
```

**Al terminar de trabajar**:
```bash
# 1. Commitear cambios
git add .
git commit -m "..."
git push

# 2. Detener recursos
./scripts/stop-dev-resources.sh

# 3. Verificar que se detuvieron
# El script mostrará confirmación
```

### Rutina Semanal

**Viernes al final del día**:
```bash
# 1. Analizar tráfico de la semana
./scripts/analyze-nat-traffic.sh 7

# 2. Revisar costos en AWS Cost Explorer
# https://console.aws.amazon.com/cost-management/home

# 3. Detener recursos para el fin de semana
./scripts/stop-dev-resources.sh
```

### Rutina Mensual

**Fin de mes**:
```bash
# 1. Analizar tráfico del mes
./scripts/analyze-nat-traffic.sh 30

# 2. Generar reporte de costos
./scripts/estimate-costs.sh  # Si existe

# 3. Revisar métricas:
#    - Costo total mensual
#    - Costo por servicio
#    - Comparar con presupuesto ($15/mes)
#    - Identificar oportunidades de optimización

# 4. Actualizar proyecciones para el siguiente mes
```

---

## Automatización (Opcional)

### Opción 1: Cron Jobs (Linux/macOS)

**Editar crontab**:
```bash
crontab -e
```

**Agregar tareas**:
```bash
# Detener recursos a las 8 PM de lunes a viernes
0 20 * * 1-5 cd /ruta/a/proyecto && ./scripts/stop-dev-resources.sh

# Iniciar recursos a las 8 AM de lunes a viernes
0 8 * * 1-5 cd /ruta/a/proyecto && ./scripts/start-dev-resources.sh

# Analizar tráfico cada lunes a las 9 AM
0 9 * * 1 cd /ruta/a/proyecto && ./scripts/analyze-nat-traffic.sh 7
```

### Opción 2: AWS EventBridge (Recomendado)

Ver configuración en `terraform/modules/monitoring/scheduled_actions.tf`

**Ventajas**:
- ✅ No depende de tu computadora
- ✅ Funciona aunque estés offline
- ✅ Logs centralizados en AWS
- ✅ Notificaciones por SNS

---

## Solución de Problemas

### Error: "AWS CLI no está instalado"
```bash
# Instalar AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
```

### Error: "No se pueden verificar las credenciales de AWS"
```bash
# Reconfigurar credenciales
aws configure

# O establecer variables de entorno
export AWS_ACCESS_KEY_ID="YOUR_ACCESS_KEY"
export AWS_SECRET_ACCESS_KEY="YOUR_SECRET_KEY"
export AWS_DEFAULT_REGION="us-east-1"
```

### Error: "Instancia RDS no encontrada"
```bash
# Verificar que existe
aws rds describe-db-instances \
  --query 'DBInstances[*].[DBInstanceIdentifier,DBInstanceStatus]' \
  --output table \
  --region us-east-1

# Verificar el nombre correcto en terraform/environments/dev/
```

### Error: "NAT Instance no encontrado"
```bash
# Listar todas las instancias
aws ec2 describe-instances \
  --query 'Reservations[*].Instances[*].[InstanceId,Tags[?Key==`Name`].Value|[0],State.Name]' \
  --output table \
  --region us-east-1

# Verificar el tag Name correcto
```

### Error: "RDS en estado no se puede detener ahora"
Estados de RDS:
- `available` → Se puede detener ✅
- `stopped` → Ya está detenido ✅
- `stopping` → Esperar a que termine ⏳
- `starting` → Esperar a que termine ⏳
- `backing-up` → Esperar a que termine el backup ⏳
- `modifying` → Esperar a que termine la modificación ⏳

```bash
# Ver estado actual
aws rds describe-db-instances \
  --db-instance-identifier tinambu-db-dev \
  --query 'DBInstances[0].DBInstanceStatus' \
  --output text \
  --region us-east-1
```

### Scripts no tienen permisos de ejecución
```bash
# Dar permisos de ejecución
chmod +x scripts/*.sh
```

---

## Preguntas Frecuentes

**P: ¿Puedo usar estos scripts en producción?**  
R: **NO**. Estos scripts están diseñados solo para desarrollo. En producción, los recursos deben estar disponibles 24/7.

**P: ¿Qué pasa si olvido iniciar los recursos?**  
R: La aplicación no funcionará hasta que inicies los recursos con `start-dev-resources.sh`.

**P: ¿Se pierden datos al detener RDS?**  
R: **NO**. Detener RDS es seguro, todos los datos se conservan. El almacenamiento persiste.

**P: ¿Cuánto tiempo puedo tener RDS detenido?**  
R: AWS reiniciará automáticamente RDS después de **7 días** detenido.

**P: ¿Por qué el NAT Instance se inicia primero?**  
R: Porque RDS necesita conectividad de red, y el NAT Instance proporciona esa conectividad.

**P: ¿Puedo detener solo RDS o solo NAT Instance?**  
R: Sí, pero no es recomendado. Ambos generan costos, así que es mejor detener ambos.

**P: ¿Qué pasa con las Lambda Functions?**  
R: Las Lambda Functions no se detienen. Solo generan costos cuando se ejecutan.

**P: ¿Cómo saber si vale la pena parar los recursos?**  
R: Si trabajas menos de 12 horas al día, definitivamente vale la pena. Ahorro: 50-70%.

---

## Roadmap de Mejoras

**Corto Plazo** (próximas semanas):
- [ ] Agregar notificaciones por email cuando se paran/inician recursos
- [ ] Script de verificación de salud (`health-check.sh`)
- [ ] Logs de cada ejecución

**Mediano Plazo** (próximo mes):
- [ ] Dashboard web para monitoreo de costos
- [ ] Integración con Slack/Discord para notificaciones
- [ ] Auto-stop si no hay actividad por X horas

**Largo Plazo** (pre-producción):
- [ ] Scripts de gestión para staging
- [ ] Alertas predictivas de costos
- [ ] Recomendaciones automáticas de optimización

---

## Contribuir

Si encuentras un bug o tienes una sugerencia de mejora:

1. Documenta el issue
2. Propón una solución
3. Testea los cambios en un ambiente seguro
4. Actualiza esta documentación

---

**Última actualización**: Noviembre 2025  
**Mantenedor**: Equipo DevOps  
**Licencia**: Uso interno del proyecto


