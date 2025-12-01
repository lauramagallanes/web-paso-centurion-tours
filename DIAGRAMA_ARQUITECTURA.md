# 🏗️ Diagrama de Arquitectura Actual

## 📐 Arquitectura Sin VPC Personalizada

```
┌─────────────────────────────────────────────────────────────────┐
│                         INTERNET                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CLOUDFRONT / S3                              │
│              (Frontend Estático)                                │
│         tinambu-frontend-dev.s3-website-...                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ API Calls
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API GATEWAY (HTTP API v2)                    │
│         https://53dmek6dqk.execute-api.us-east-1...            │
│                                                                  │
│  Rutas: /api/alojamientos, /api/senderos, /api/auth, etc.      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Invoke
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              LAMBDA FUNCTION (Sin VPC) ⚡                        │
│         tinambu-tours-backend-dev                               │
│                                                                  │
│  Runtime: Java 17                                                │
│  Memory: 1024 MB                                                 │
│  Timeout: 30s                                                    │
│  SnapStart: ✅ Habilitado                                        │
│                                                                  │
│  VPC Config: ❌ NINGUNA (sin ENIs, sin costos de red)          │
│                                                                  │
│  Acceso Directo a:                                              │
│  ├─→ RDS (vía endpoint público)                                │
│  ├─→ S3 (acceso directo)                                         │
│  └─→ SSM Parameter Store (acceso directo)                      │
└─────────────────────────────────────────────────────────────────┘
         │                    │                    │
         │ SSL                │ IAM                │ IAM
         │ (sslmode=require)   │                    │
         ▼                    ▼                    ▼
┌──────────────────┐  ┌──────────────┐  ┌──────────────────┐
│   RDS PostgreSQL │  │  S3 Buckets  │  │ SSM Parameters  │
│                  │  │              │  │                  │
│  Estado: PÚBLICO │  │  - Frontend  │  │  - DB Password   │
│  pero SEGURO     │  │  - Assets    │  │  - JWT Secret    │
│                  │  │              │  │  - API Keys      │
│  Subnet Group:   │  │  Políticas   │  │                  │
│  default VPC     │  │  restrictivas│  │  SecureString    │
│                  │  │              │  │                  │
│  Security Group: │  │              │  │                  │
│  Solo IPs Lambda │  │              │  │                  │
│                  │  │              │  │                  │
│  SSL Requerido   │  │              │  │                  │
│  Encryption: ✅   │  │              │  │                  │
└──────────────────┘  └──────────────┘  └──────────────────┘
         │
         │ Default VPC
         │ (solo para Security Groups)
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DEFAULT VPC (AWS)                            │
│              vpc-083f6330ac801264e                              │
│                                                                  │
│  Propósito: Solo Security Groups de RDS                         │
│  Costo: GRATIS                                                   │
└─────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────┐
│           VPC PERSONALIZADA (OBSOLETA - Pendiente Limpieza)     │
│              vpc-0a2089e019248e5e5                              │
│                                                                  │
│  ⚠️  Aún existe pero NO se usa                                 │
│  ⚠️  Bloqueada por ENIs de Lambda (se liberarán automáticamente)│
│                                                                  │
│  Recursos pendientes:                                            │
│  - Subnets privadas                                             │
│  - Security Groups antiguos                                      │
│  - VPC Endpoints                                                │
│  - Route Tables                                                 │
│                                                                  │
│  Script de limpieza: scripts/cleanup-old-vpc.sh                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Flujo de Petición Completo

### 1. Usuario accede al Frontend
```
Usuario → CloudFront/S3 → Frontend React
```

### 2. Frontend hace llamada a API
```
Frontend → API Gateway → Lambda Function
```

### 3. Lambda procesa la petición
```
Lambda:
  ├─ Lee parámetros de SSM Parameter Store
  ├─ Consulta RDS (conexión SSL)
  ├─ Lee/Escribe en S3 (imágenes)
  └─ Retorna respuesta JSON
```

### 4. Respuesta al usuario
```
Lambda → API Gateway → Frontend → Usuario
```

---

## 🔒 Capas de Seguridad

```
┌─────────────────────────────────────────────────────────┐
│  CAPA 1: Network Security                              │
│  - Security Group restringe acceso a IPs de Lambda     │
│  - Default VPC para aislamiento básico                 │
└─────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│  CAPA 2: Transport Security                            │
│  - SSL/TLS requerido (sslmode=require)                │
│  - Encriptación en tránsito                            │
└─────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│  CAPA 3: Storage Security                              │
│  - RDS storage encryption                              │
│  - Contraseñas en SSM (SecureString)                   │
│  - S3 policies restrictivas                            │
└─────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│  CAPA 4: Application Security                         │
│  - Autenticación JWT                                   │
│  - CORS configurado                                    │
│  - Validación de entrada                               │
└─────────────────────────────────────────────────────────┘
```

---

## 💰 Comparación de Costos

### Antes (Con VPC):
```
VPC:              $21.19/mes
EC2 (NAT):        $ 2.97/mes
RDS:              $ 2.30/mes
Route 53:         $ 0.51/mes
CloudWatch:       $ 0.19/mes
S3:               $ 0.11/mes
─────────────────────────────
TOTAL:            $27.27/mes
```

### Ahora (Sin VPC):
```
RDS:              $ 2.30/mes
Route 53:         $ 0.51/mes
CloudWatch:       $ 0.19/mes
S3:               $ 0.11/mes
─────────────────────────────
TOTAL:            ~$ 3.11/mes

AHORRO:           ~$24.16/mes (88% reducción)
```

---

## ✅ Estado de Componentes

| Componente | Estado | VPC | Costo Mensual |
|------------|--------|-----|---------------|
| Lambda | ✅ Activo | ❌ Sin VPC | Gratis |
| RDS | ✅ Activo | Default VPC | ~$2.30 |
| API Gateway | ✅ Activo | N/A | Gratis |
| S3 Frontend | ✅ Activo | N/A | ~$0.05 |
| S3 Assets | ✅ Activo | N/A | ~$0.06 |
| Route 53 | ✅ Activo | N/A | ~$0.51 |
| CloudWatch | ✅ Activo | N/A | ~$0.19 |
| **VPC Personalizada** | ⚠️ Obsoleta | - | $0 (no se usa) |

---

## 🎯 Características Clave

1. **Sin ENIs**: Lambda ejecuta sin interfaces de red (sin costos)
2. **RDS Público Seguro**: Accesible solo desde Lambda con Security Group + SSL
3. **Default VPC**: Solo para Security Groups (gratis)
4. **Acceso Directo**: Lambda accede directamente a servicios AWS sin NAT
5. **Múltiples Capas de Seguridad**: Network + Transport + Storage + Application

---

**Última Actualización**: 2025-12-01
**Estado**: ✅ Operativa y Optimizada

