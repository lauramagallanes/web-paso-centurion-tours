# 🔧 Setup de Desarrollo - Tinambu Tours

## ⚡ Setup Rápido (5 minutos)

### 1. Configurar Variables de Entorno

```bash
# Copiar archivos de ejemplo
cp deployment-config.example.sh deployment-config.sh
cp frontend/env.example frontend/.env.local

# Editar con tus valores reales
nano deployment-config.sh    # Variables AWS
nano frontend/.env.local     # Variables del frontend
```

### 2. Configurar AWS CLI

```bash
# Si no tienes AWS CLI configurado
aws configure --profile [TU_PROFILE]
# Introducir Access Key, Secret Key, us-east-1, json

# Verificar que funciona
aws sts get-caller-identity --profile [TU_PROFILE]
```

### 3. Validar Configuración

```bash
# Validación completa (recomendado la primera vez)
./scripts/validate-env.sh

# Validación rápida (para uso diario)  
./scripts/quick-check.sh

# Configurar frontend automáticamente
./scripts/setup-frontend-env.sh
```

### 4. Probar Setup

```bash
# Deploy backend
./scripts/deploy-backend.sh

# Deploy frontend  
./scripts/deploy-frontend.sh

# O deploy completo (incluye validación automática)
./scripts/deploy-all.sh

# Probar que todo funciona
./scripts/test-connections.sh
```

---

## 📍 Ubicación de Variables de Entorno

### ✅ Backend (AWS Lambda) - YA CONFIGURADO
Las variables están en AWS Lambda Console:
- `DB_HOST`, `DB_PASSWORD`, `DB_USERNAME`
- `JWT_SECRET`, `SPRING_PROFILES_ACTIVE`

**👉 No necesitas cambiar nada aquí**

### 🔧 Frontend (Vite) - CONFIGURAR
Archivo: `frontend/.env.local`
```bash
VITE_API_BASE_URL=https://[API_GATEWAY_ID].execute-api.us-east-1.amazonaws.com
VITE_ENV=development
VITE_DEBUG=true
```

### 🚀 Scripts de Deployment - CONFIGURAR
Archivo: `deployment-config.sh`
```bash
export AWS_PROFILE=tu-profile
export FRONTEND_BUCKET=tu-bucket-frontend
export LAMBDA_FUNCTION_NAME=tu-lambda-function
export API_GATEWAY_ID=tu-api-gateway-id
export INTEGRATION_ID=tu-integration-id
```

---

## 🛠️ Comandos Principales

### Desarrollo Diario

```bash
# Deploy solo backend
./scripts/deploy-backend.sh

# Deploy solo frontend
./scripts/deploy-frontend.sh

# Deploy todo junto
./scripts/deploy-all.sh
```

### Agregar Nuevos Endpoints

```bash
# 1. Crear método en controller (ej: SimpleSenderoController.java)
# 2. Agregar ruta en API Gateway
./scripts/add-api-route.sh "GET /nuevo-endpoint"
./scripts/add-api-route.sh "POST /habitaciones/admin"

# 3. Deploy backend
./scripts/deploy-backend.sh
```

### Testing

```bash
# Backend
cd backend && mvn test

# Frontend  
cd frontend && npm test

# Test endpoint
curl https://[API_GATEWAY_ID].execute-api.us-east-1.amazonaws.com/basic
```

---

## 🔍 Troubleshooting

### ❌ "AWS Profile not found"
```bash
aws configure --profile [TU_PROFILE]
```

### ❌ "Variables no configuradas"  
```bash
# Validar configuración completa
./scripts/validate-env.sh

# Validación rápida
./scripts/quick-check.sh
```

### ❌ "deployment-config.sh no encontrado"
```bash
# Usar .env en su lugar (más simple)
cp ENV-TEMPLATE.txt .env
# Editar .env con tus valores reales
```

### ❌ "Build falló"
```bash
# Backend
cd backend && mvn clean install

# Frontend
cd frontend && npm install && npm run build
```

### ❌ "Deploy falló"
```bash
# Validar todo antes del deploy
./scripts/validate-env.sh

# Probar conexiones
./scripts/test-connections.sh
```

### ❌ "API devuelve 404"
```bash
# Verificar que la ruta existe en API Gateway
./scripts/add-api-route.sh "GET /tu-endpoint"
```

### ❌ "Frontend no carga"
```bash
# Verificar variables de entorno
cat frontend/.env.local

# Re-build y deploy
cd frontend && npm run build
./scripts/deploy-frontend.sh
```

---

## 📂 Estructura de Archivos

```
tinambu-tours/
├── deployment-config.sh          # 🔧 TUS variables AWS
├── deployment-config.example.sh  # 📝 Template de ejemplo
├── scripts/
│   ├── deploy-all.sh             # 🚀 Deploy completo
│   ├── deploy-backend.sh         # ⚡ Deploy backend
│   ├── deploy-frontend.sh        # 🌐 Deploy frontend
│   └── add-api-route.sh          # 🛣️ Agregar rutas
├── frontend/
│   ├── .env.local                # 🔧 TUS variables frontend
│   └── env.example               # 📝 Template frontend
└── backend/
    └── src/main/resources/
        └── application*.yml      # ⚠️ Configurado en Lambda
```

---

## 🔒 Seguridad

### ✅ Archivos que NUNCA se commitean:
- `deployment-config.sh`
- `frontend/.env.local`
- Cualquier archivo con credenciales reales

### ✅ Archivos seguros para commit:
- `*.example` - Templates sin credenciales
- `scripts/*.sh` - Scripts con variables
- Documentación

---

## 🎯 URLs del Sistema

Una vez configurado:

- **Frontend:** https://[FRONTEND_BUCKET].s3.us-east-1.amazonaws.com/
- **Admin:** https://[FRONTEND_BUCKET].s3.us-east-1.amazonaws.com/admin  
- **API:** https://[API_GATEWAY_ID].execute-api.us-east-1.amazonaws.com

---

## 💪 ¡Listo para Desarrollar!

Con este setup puedes:
- ✅ Deploy automático con un comando
- ✅ Variables de entorno separadas por entorno
- ✅ Agregar nuevos endpoints fácilmente
- ✅ Testing rápido y eficiente
- ✅ Seguridad: sin credenciales en git

**¿Problemas?** Revisar la sección Troubleshooting o contactar al lead dev.
