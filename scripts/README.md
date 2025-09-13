# 🛠️ Scripts de Desarrollo - Tinambu Tours

## 📋 Scripts Disponibles

### 🔍 **Validación y Testing**

#### `./scripts/validate-env.sh` 
**Validación completa de configuración**
- ✅ Verifica todas las variables de entorno
- ✅ Valida formatos de URLs, IDs, etc.
- ✅ Prueba AWS CLI y permisos
- ✅ Verifica Node.js, Java, Maven
- ✅ Reporte detallado con errores y warnings

```bash
./scripts/validate-env.sh
```

#### `./scripts/quick-check.sh`
**Validación rápida (30 segundos)**
- ✅ Verifica variables críticas
- ✅ Prueba AWS CLI básico
- ✅ Ideal para uso diario

```bash
./scripts/quick-check.sh
```

#### `./scripts/test-connections.sh`
**Prueba todas las conexiones del sistema**
- ✅ Prueba endpoints de API
- ✅ Verifica S3, Lambda, API Gateway
- ✅ Testa builds locales
- ✅ Muestra información del sistema

```bash
./scripts/test-connections.sh
```

### 🚀 **Deployment**

#### `./scripts/deploy-all.sh`
**Deploy completo (frontend + backend)**
- ✅ Validación automática antes del deploy
- ✅ Build y deploy del backend
- ✅ Build y deploy del frontend
- ✅ Confirmación interactiva

```bash
./scripts/deploy-all.sh
```

#### `./scripts/deploy-frontend.sh`
**Deploy solo frontend**
- ✅ Build con Vite
- ✅ Sync a S3
- ✅ Validación de errores

```bash
./scripts/deploy-frontend.sh
```

#### `./scripts/deploy-backend.sh`
**Deploy solo backend**
- ✅ Build con Maven
- ✅ Upload JAR a S3
- ✅ Update Lambda function

```bash
./scripts/deploy-backend.sh
```

### ⚙️ **Configuración**

#### `./scripts/setup-frontend-env.sh`
**Configurar variables del frontend**
- ✅ Crea frontend/.env.local automáticamente
- ✅ Copia variables VITE_* desde .env principal

```bash
./scripts/setup-frontend-env.sh
```

#### `./scripts/add-api-route.sh`
**Agregar rutas a API Gateway**
- ✅ Crea nuevas rutas en API Gateway
- ✅ Configuración automática desde .env

```bash
./scripts/add-api-route.sh "POST /nuevo-endpoint"
./scripts/add-api-route.sh "GET /habitaciones/admin"
```

## 🔧 **Flujo de Trabajo Diario**

### **Primera vez (Setup)**
```bash
# 1. Configurar variables
cp ENV-TEMPLATE.txt .env
nano .env  # Editar con valores reales

# 2. Validar configuración
./scripts/validate-env.sh

# 3. Configurar frontend
./scripts/setup-frontend-env.sh

# 4. Deploy inicial
./scripts/deploy-all.sh
```

### **Desarrollo diario**
```bash
# Validación rápida
./scripts/quick-check.sh

# Deploy cambios
./scripts/deploy-all.sh

# O deploy individual
./scripts/deploy-frontend.sh  # Solo frontend
./scripts/deploy-backend.sh   # Solo backend

# Probar conexiones
./scripts/test-connections.sh
```

### **Agregar nuevos endpoints**
```bash
# 1. Crear método en controller
# 2. Agregar ruta API Gateway
./scripts/add-api-route.sh "GET /nuevo-endpoint"
# 3. Deploy backend
./scripts/deploy-backend.sh
```

## 🎯 **Códigos de Salida**

| Script | Exit 0 | Exit 1+ |
|--------|--------|---------|
| `validate-env.sh` | Todo OK | Errores encontrados |
| `quick-check.sh` | Config válida | Problemas críticos |
| `test-connections.sh` | - | - |
| `deploy-*.sh` | Deploy exitoso | Deploy falló |

## 🔍 **Troubleshooting**

### **"No se encontraron variables"**
```bash
# Verificar que .env existe y tiene contenido
ls -la .env
cat .env
```

### **"AWS CLI no funciona"**
```bash
# Configurar profile
aws configure --profile tu-profile-name
```

### **"Deploy falló"**
```bash
# Ver validación completa
./scripts/validate-env.sh

# Probar conexiones
./scripts/test-connections.sh
```

### **"Build falló"**
```bash
# Frontend
cd frontend && npm install && npm run build

# Backend  
cd backend && mvn clean install
```

## 📚 **Archivos Relacionados**

- `ENV-TEMPLATE.txt` - Template de variables
- `SETUP-DEVELOPMENT.md` - Guía de setup completo
- `SECURITY-GUIDELINES.md` - Mejores prácticas de seguridad
- `.env` - Tus variables reales (no va a Git)

## 💡 **Tips**

- **Ejecuta `quick-check.sh` antes de cada sesión de desarrollo**
- **Usa `validate-env.sh` después de cambios importantes**  
- **`test-connections.sh` es útil después de deployments**
- **Los deploys incluyen validación automática**
- **Todos los scripts son seguros para usar repetidamente**
