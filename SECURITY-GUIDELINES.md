# 🔒 Guías de Seguridad - Variables de Entorno

## 🎯 **Principio Fundamental**

**NUNCA commitear credenciales reales a Git/GitHub**

## 📂 **Tipos de Archivos**

### ✅ **ARCHIVOS TEMPLATE/EXAMPLE (VAN A GITHUB)**
Contienen **datos de ejemplo/placeholders**, nunca datos reales:

| Archivo | Propósito | Contenido |
|---------|-----------|-----------|
| `ENV-TEMPLATE.txt` | Template principal | `your-api-gateway-id`, `your-admin-email@example.com` |
| `frontend/env.example` | Template frontend | `your-api-gateway-id.execute-api...` |
| `deployment-config.example.sh` | Template deployment | `your-aws-profile-name`, `your-frontend-bucket` |

### ❌ **ARCHIVOS REALES (NO VAN A GITHUB)**
Contienen **tus credenciales reales**, protegidos por `.gitignore`:

| Archivo | Propósito | Contenido |
|---------|-----------|-----------|
| `.env` | Tus variables reales | `53dmek6dqk`, `admin@pasocenturion.com.uy` |
| `frontend/.env.local` | Variables frontend reales | Se genera automáticamente |
| `deployment-config.sh` | Config deployment real | Opcional, alternativa a `.env` |

## 🛡️ **Verificación de Seguridad**

### ✅ **Antes de commitear, verifica:**

```bash
# 1. Verificar que .env NO está en staging
git status
# NO debe aparecer: modified: .env

# 2. Verificar contenido de archivos template
grep -n "53dmek6dqk\|admin@pasocenturion\|laura" ENV-TEMPLATE.txt frontend/env.example deployment-config.example.sh
# NO debe devolver resultados (datos reales)

# 3. Verificar .gitignore
cat .gitignore | grep -E "\.env$|deployment-config\.sh"
# DEBE mostrar que están ignorados
```

### ❌ **Señales de ALERTA:**

- Archivo `.env` aparece en `git status`
- Templates contienen IDs reales como `53dmek6dqk`
- Templates contienen emails reales como `admin@pasocenturion.com.uy`
- Templates contienen nombres reales como `laura` o `tinambu-frontend-dev`

## 🔧 **Configuración Correcta**

### **Para Desarrollador Principal:**
```bash
# 1. Crear archivo con datos reales
cp ENV-TEMPLATE.txt .env
# 2. Editar .env con credenciales reales
nano .env
# 3. Configurar frontend
./scripts/setup-frontend-env.sh
```

### **Para Nuevo Desarrollador:**
```bash
# 1. Clonar repo
git clone ...
# 2. Crear archivo local
cp ENV-TEMPLATE.txt .env
# 3. Pedir credenciales al lead developer
# 4. Configurar .env con datos reales
# 5. Configurar frontend
./scripts/setup-frontend-env.sh
```

## 🎯 **Ejemplos de Contenido CORRECTO**

### ✅ **ENV-TEMPLATE.txt (Template - VA a GitHub):**
```bash
VITE_API_BASE_URL=https://[API_GATEWAY_ID].execute-api.us-east-1.amazonaws.com
AWS_PROFILE=your-aws-profile-name
FRONTEND_BUCKET=your-frontend-bucket-name
ADMIN_EMAIL=your-admin-email@example.com
```

### ✅ **Tu archivo .env (Real - NO va a GitHub):**
```bash
VITE_API_BASE_URL=https://53dmek6dqk.execute-api.us-east-1.amazonaws.com
AWS_PROFILE=laura
FRONTEND_BUCKET=tinambu-frontend-dev
ADMIN_EMAIL=admin@pasocenturion.com.uy
```

## 🚨 **Si cometiste un error:**

### **Si commiteaste credenciales accidentalmente:**

```bash
# 1. NUNCA hagas push si no lo has hecho
# 2. Hacer commit correctivo inmediatamente
git add archivo-corregido
git commit -m "security: remove accidentally committed credentials"

# 3. Si ya hiciste push:
# - Cambiar inmediatamente las credenciales comprometidas
# - Notificar al equipo
# - Considerar reescribir historia de Git si es crítico
```

## ✅ **Checklist de Seguridad**

Antes de cada commit:

- [ ] `git status` no muestra `.env` o archivos con credenciales
- [ ] Templates solo contienen placeholders como `your-*` o `[VARIABLE]`
- [ ] No hay credenciales reales en archivos template
- [ ] `.gitignore` está actualizado
- [ ] Los archivos reales funcionan localmente

## 🎉 **Resultado Final**

Con esta configuración:
- ✅ **Seguridad:** Cero riesgo de filtrar credenciales
- ✅ **Colaboración:** Otros desarrolladores pueden configurar fácilmente
- ✅ **Mantenimiento:** Templates actualizados sin exponer datos
- ✅ **Automatización:** Scripts funcionan sin modificaciones
