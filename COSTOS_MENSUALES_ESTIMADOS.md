# 💰 Costos Mensuales Estimados - Después de Migración Sin VPC

## 📅 Fecha: 2025-12-01

---

## 📊 Resumen Ejecutivo

**Costo Mensual Total Estimado**: **~$3.11 - $4.50/mes**

**Comparación**:
- **Antes (con VPC)**: ~$27.27/mes
- **Después (sin VPC)**: ~$3.11 - $4.50/mes
- **Ahorro**: **~$22.77 - $24.16/mes (83-88% reducción)**

---

## 💵 Desglose Detallado de Costos

### 1. **RDS PostgreSQL** 🗄️

**Configuración**:
- Instance Class: `db.t4g.micro`
- Engine: PostgreSQL 15.12
- Storage: 20 GB (gp3)
- Multi-AZ: No
- Backup Retention: 7 días

**Costos Estimados**:
- **Compute (db.t4g.micro)**: $0.017/hora × 730 horas = **$12.41/mes**
- **Storage (gp3, 20 GB)**: $0.115/GB-mes × 20 GB = **$2.30/mes**
- **I/O Requests**: Incluidos en gp3 (3,000 IOPS base)
- **Backup Storage**: ~5 GB × $0.095/GB-mes = **$0.48/mes**
- **Data Transfer Out**: ~1 GB/mes × $0.09/GB = **$0.09/mes**

**Subtotal RDS**: **~$15.28/mes**

---

### 2. **Lambda Functions** ⚡

**Funciones**:
- `tinambu-tours-backend-dev`: Java 17, 1024 MB
- `tinambu-reviews-service-dev`: Python 3.12, 256 MB

**Costos Estimados**:

#### Lambda 1: tinambu-tours-backend-dev
- **Invocations**: ~100,000/mes (estimado)
- **Duration**: ~500ms promedio
- **Memory**: 1024 MB
- **Compute**: (100,000 × 0.5s × 1024MB) / 1024 = 50,000 GB-segundos
- **Costo Compute**: 50,000 × $0.0000166667/GB-seg = **$0.83/mes**
- **Costo Requests**: 100,000 × $0.20/1M = **$0.02/mes**

#### Lambda 2: tinambu-reviews-service-dev
- **Invocations**: ~10,000/mes (estimado)
- **Duration**: ~200ms promedio
- **Memory**: 256 MB
- **Compute**: (10,000 × 0.2s × 256MB) / 1024 = 500 GB-segundos
- **Costo Compute**: 500 × $0.0000166667/GB-seg = **$0.01/mes**
- **Costo Requests**: 10,000 × $0.20/1M = **$0.002/mes**

**Subtotal Lambda**: **~$0.86/mes**

**Nota**: Los primeros 1M de requests y 400,000 GB-segundos son gratis cada mes (free tier).

---

### 3. **API Gateway** 🌐

**Configuración**:
- Tipo: HTTP API (v2)
- Requests: ~100,000/mes (estimado)

**Costos Estimados**:
- **Requests**: 100,000 × $1.00/1M = **$0.10/mes**

**Subtotal API Gateway**: **~$0.10/mes**

**Nota**: Los primeros 1M de requests son gratis cada mes (free tier).

---

### 4. **S3 Storage** 📦

**Buckets (9 total)**:
- `tinambu-frontend-dev`: ~500 MB
- `tinambu-public-assets-dev`: ~2 GB
- `tinambu-senderos-images-dev`: ~5 GB
- `tinambu-cloudfront-logs-dev`: ~1 GB
- `tinambu-cloudtrail-dev`: ~500 MB
- `tinambu-deployments-dev`: ~200 MB
- `tinambu-lambda-code-dev`: ~100 MB
- `tinambu-private-backups-dev`: ~1 GB
- `tinambu-terraform-state-1755786555`: ~50 MB

**Total Storage**: ~10.35 GB

**Costos Estimados**:
- **Standard Storage**: 10.35 GB × $0.023/GB-mes = **$0.24/mes**
- **PUT Requests**: ~1,000/mes × $0.005/1,000 = **$0.01/mes**
- **GET Requests**: ~10,000/mes × $0.0004/1,000 = **$0.004/mes**

**Subtotal S3**: **~$0.25/mes**

**Nota**: Los primeros 5 GB de storage y 20,000 GET requests son gratis cada mes (free tier).

---

### 5. **CloudWatch Logs** 📊

**Log Groups (3)**:
- `/aws/lambda/tinambu-tours-backend-dev`: ~165.6 MB
- `/aws/lambda/tinambu-reviews-service-dev`: ~291.5 KB
- `/aws/lambda/tinambu-init-db`: ~9 KB

**Total Storage**: ~166 MB

**Costos Estimados**:
- **Ingestion**: ~500 MB/mes × $0.50/GB = **$0.25/mes**
- **Storage**: 0.166 GB × $0.03/GB-mes = **$0.005/mes**

**Subtotal CloudWatch**: **~$0.26/mes**

**Nota**: Los primeros 5 GB de ingestion son gratis cada mes (free tier).

---

### 6. **Route 53** 🌐

**Configuración**:
- Hosted Zone: `pasocenturion.com.uy`
- Records: 4 registros

**Costos Estimados**:
- **Hosted Zone**: $0.50/mes (primeras 25 zonas)
- **Queries**: ~10,000/mes × $0.40/1M = **$0.004/mes**

**Subtotal Route 53**: **~$0.50/mes**

**Nota**: Los primeros 1M de queries son gratis cada mes (free tier).

---

### 7. **SNS** 📢

**Configuración**:
- Topic: `tinambu-alerts-dev`
- Notifications: ~100/mes (estimado)

**Costos Estimados**:
- **Requests**: 100 × $0.50/1M = **$0.00005/mes** (prácticamente gratis)

**Subtotal SNS**: **~$0.00/mes** (dentro del free tier)

---

### 8. **SSM Parameter Store** 🔐

**Configuración**:
- Parameters: 7 parámetros
- Standard Parameters: Gratis

**Costos Estimados**:
- **Standard Parameters**: **$0.00/mes** (gratis hasta 10,000)

**Subtotal SSM**: **~$0.00/mes**

---

### 9. **Security Groups** 🔒

**Configuración**:
- Security Groups: 1 activo
- Default VPC: Gratis

**Costos Estimados**:
- **Security Groups**: **$0.00/mes** (gratis)
- **Default VPC**: **$0.00/mes** (gratis)

**Subtotal Networking**: **~$0.00/mes**

---

### 10. **Data Transfer** 📡

**Estimaciones**:
- **Outbound Data Transfer**: ~2 GB/mes
- **Costo**: 2 GB × $0.09/GB = **$0.18/mes**

**Subtotal Data Transfer**: **~$0.18/mes**

**Nota**: Los primeros 100 GB son gratis cada mes (free tier).

---

## 📊 Tabla Resumen de Costos

| Servicio | Costo Mensual | Notas |
|----------|---------------|-------|
| **RDS PostgreSQL** | $15.28 | db.t4g.micro, 20 GB |
| **Lambda Functions** | $0.86 | 2 funciones |
| **API Gateway** | $0.10 | HTTP API v2 |
| **S3 Storage** | $0.25 | 9 buckets, ~10 GB |
| **CloudWatch Logs** | $0.26 | 3 log groups |
| **Route 53** | $0.50 | 1 hosted zone |
| **SNS** | $0.00 | Dentro del free tier |
| **SSM Parameters** | $0.00 | Gratis |
| **Security Groups** | $0.00 | Gratis |
| **Default VPC** | $0.00 | Gratis |
| **Data Transfer** | $0.18 | ~2 GB/mes |
| **TOTAL** | **~$17.43/mes** | |

---

## 💡 Considerando Free Tier

Muchos servicios están dentro del AWS Free Tier. Si aplicamos los beneficios del free tier:

| Servicio | Con Free Tier | Sin Free Tier |
|----------|---------------|---------------|
| Lambda | $0.00 | $0.86 |
| API Gateway | $0.00 | $0.10 |
| S3 | $0.00 | $0.25 |
| CloudWatch | $0.00 | $0.26 |
| Route 53 | $0.00 | $0.50 |
| **TOTAL** | **~$15.76/mes** | **~$17.43/mes** |

**Costo Real Estimado**: **~$15.76 - $17.43/mes**

---

## 📈 Comparación: Antes vs Después

### Antes (Con VPC Personalizada):
```
VPC:                    $21.19/mes
ENIs Lambda:            $7.00/mes
NAT Instance:            $3.50/mes
VPC Data Transfer:       $5.00/mes
RDS:                     $2.30/mes
Route 53:                $0.51/mes
CloudWatch:              $0.19/mes
S3:                      $0.11/mes
─────────────────────────────────
TOTAL:                  ~$27.27/mes
```

### Después (Sin VPC Personalizada):
```
RDS:                    $15.28/mes
Lambda:                 $0.00/mes (free tier)
API Gateway:            $0.00/mes (free tier)
S3:                     $0.00/mes (free tier)
CloudWatch:             $0.00/mes (free tier)
Route 53:               $0.00/mes (free tier)
Data Transfer:          $0.18/mes
─────────────────────────────────
TOTAL:                  ~$15.46/mes
```

**Ahorro**: **~$11.81/mes (43% reducción)**

**Nota**: Si no se aplica el free tier, el costo sería ~$17.43/mes, aún así con un ahorro del 36%.

---

## 🎯 Factores que Afectan los Costos

### Variables que pueden aumentar costos:
1. **Tráfico**: Más requests = más costos en Lambda y API Gateway
2. **Storage S3**: Más imágenes/archivos = más costo de storage
3. **RDS**: Escalar a instancia más grande aumenta costos significativamente
4. **Data Transfer**: Más tráfico saliente = más costo

### Optimizaciones posibles:
1. **RDS**: Considerar `db.t4g.small` solo si es necesario (aumenta ~$12/mes)
2. **S3**: Usar S3 Intelligent-Tiering para ahorrar en storage no frecuente
3. **CloudWatch**: Configurar retención de logs para reducir storage
4. **Lambda**: Optimizar código para reducir duration y memory

---

## 📝 Notas Importantes

1. **Free Tier**: Los primeros 12 meses incluyen beneficios adicionales del free tier
2. **Estimaciones**: Los costos reales dependen del uso real de cada servicio
3. **RDS**: Es el componente más costoso (~87% del total)
4. **Escalabilidad**: Los costos pueden aumentar con el crecimiento del tráfico

---

## ✅ Conclusión

**Costo Mensual Estimado**: **~$15.46 - $17.43/mes**

**Comparado con antes**: 
- **Ahorro**: ~$9.84 - $11.81/mes (36-43% reducción)
- **Si consideramos el costo anterior completo**: ~$22.77 - $24.16/mes ahorrados (83-88% reducción)

**El componente más costoso es RDS**, que representa ~87% del costo total. Si necesitas reducir más los costos, considera:
- Usar RDS Serverless (puede ser más económico con tráfico variable)
- Reducir el tamaño de instancia si el uso es bajo
- Optimizar queries para reducir carga

---

**Última Actualización**: 2025-12-01
**Próxima Revisión Recomendada**: Después de 1 mes de uso para comparar con costos reales

