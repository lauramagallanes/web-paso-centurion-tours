# 🎯 Guía Visual de Implementación - Screenshots Paso a Paso

## 🔥 **PASO 1: SUBIR JAR A LAMBDA** (5 minutos)

### **1.1 Abrir Lambda Console**
```
URL: https://console.aws.amazon.com/lambda/home?region=us-east-1#/functions/tinambu-tours-backend-dev
```

### **1.2 Navegar a la función**
- Buscar: `tinambu-tours-backend-dev`
- Hacer clic en la función

### **1.3 Subir JAR**
- Pestaña: **"Code"**
- Botón: **"Upload from"** → **".zip or .jar file"**
- Seleccionar archivo: `backend/target/tinambu-tours-lambda.jar`
- **IMPORTANTE**: Esperar mensaje "Successfully updated..."
- Tiempo: ~3 minutos

### **1.4 Verificar subida**
```bash
curl "https://53dmek6dqk.execute-api.us-east-1.amazonaws.com/auth/info"
```
**Resultado esperado**: JSON con información (no 404)

---

## 🔥 **PASO 2: ARREGLAR FRONTEND S3** (10 minutos)

### **2.1 Abrir S3 Console**
```
URL: https://s3.console.aws.amazon.com/s3/buckets/tinambu-frontend-dev
```

### **2.2 Habilitar Website Hosting**
- Pestaña: **"Properties"**
- Sección: **"Static website hosting"**
- Botón: **"Edit"**
- Seleccionar: ✅ **"Enable"**
- Index document: `index.html`
- Error document: `error.html`
- Botón: **"Save changes"**

### **2.3 Configurar Permisos Públicos**
- Pestaña: **"Permissions"**
- Sección: **"Block public access (bucket settings)"**
- Botón: **"Edit"**
- **DESMARCAR TODAS** las opciones:
  - ❌ Block all public access
  - ❌ Block public access to buckets and objects granted through new access control lists (ACLs)
  - ❌ Block public access to buckets and objects granted through any access control lists (ACLs)
  - ❌ Block public access to buckets and objects granted through new public bucket or access point policies
  - ❌ Block public access to buckets and objects granted through any public bucket or access point policies
- Botón: **"Save changes"**
- Confirmar escribiendo: `confirm`

### **2.4 Aplicar Bucket Policy**
- En **"Permissions"**
- Sección: **"Bucket policy"**
- Botón: **"Edit"**
- **COPIAR Y PEGAR** exactamente este JSON:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::tinambu-frontend-dev/*"
    }
  ]
}
```

- Botón: **"Save changes"**

### **2.5 Verificar arreglo**
```bash
curl -I "https://tinambu-frontend-dev.s3-website-us-east-1.amazonaws.com/"
```
**Resultado esperado**: `HTTP/1.1 200 OK`

---

## ⚡ **PASO 3: TERRAFORM** (5 minutos) - OPCIONAL

### **3.1 Configurar AWS CLI** (una sola vez)
```bash
aws configure sso
# O alternativamente:
aws configure
```

### **3.2 Aplicar cambios**
```bash
cd terraform/environments/dev
terraform plan
terraform apply
```

---

## 🧪 **TESTING DESPUÉS DE CADA PASO**

### **Script automatizado**:
```bash
./test-complete-system.sh
```

### **Tests manuales**:

#### **Después de PASO 1**:
```bash
# Básicos (deberían seguir funcionando)
curl "https://53dmek6dqk.execute-api.us-east-1.amazonaws.com/basic"

# Auth (DEBERÍAN FUNCIONAR AHORA)
curl "https://53dmek6dqk.execute-api.us-east-1.amazonaws.com/auth/info"
curl -X POST "https://53dmek6dqk.execute-api.us-east-1.amazonaws.com/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

#### **Después de PASO 2**:
```bash
# Frontend (DEBERÍA FUNCIONAR AHORA)
curl -I "https://tinambu-frontend-dev.s3-website-us-east-1.amazonaws.com/"

# Abrir en navegador:
https://tinambu-frontend-dev.s3-website-us-east-1.amazonaws.com/
```

---

## 📊 **TROUBLESHOOTING**

### **Si el JAR no sube (PASO 1)**:
- Verificar tamaño: `ls -lh target/tinambu-tours-lambda.jar`
- Debe ser ~55MB
- Si es muy pequeño, recompilar: `mvn clean package -DskipTests`

### **Si S3 sigue dando 403 (PASO 2)**:
- Verificar que se desmarcaron TODAS las opciones de "Block public access"
- Verificar que la bucket policy se guardó correctamente
- Esperar 2-3 minutos para propagación

### **Si Terraform falla (PASO 3)**:
- Verificar credenciales: `aws sts get-caller-identity`
- Si no funciona, usar AWS Console para configurar rutas manualmente

---

## 🎯 **CHECKLIST DE VERIFICACIÓN**

### **PASO 1 - JAR subido** ✅
- [ ] JAR de 55MB subido a Lambda
- [ ] `curl .../auth/info` devuelve JSON (no 404)
- [ ] `curl .../auth/login` con POST devuelve JSON

### **PASO 2 - S3 arreglado** ✅  
- [ ] Website hosting habilitado
- [ ] Block public access deshabilitado
- [ ] Bucket policy aplicada
- [ ] `curl -I ...s3-website...` devuelve 200 OK

### **PASO 3 - Terraform aplicado** ✅
- [ ] `terraform apply` exitoso
- [ ] Nuevas rutas en API Gateway
- [ ] Todos los endpoints optimizados

---

## 🎉 **RESULTADO FINAL ESPERADO**

### **Sistema 100% Funcional**:
- ✅ Backend API completo (básicos + auth + database)
- ✅ Frontend accesible sin errores
- ✅ Infraestructura AWS optimizada
- ✅ Spring Boot + Lambda funcionando perfectamente

### **URLs finales**:
- **API**: `https://53dmek6dqk.execute-api.us-east-1.amazonaws.com`
- **Frontend**: `https://tinambu-frontend-dev.s3-website-us-east-1.amazonaws.com`

---

## ⏱️ **TIEMPO ESTIMADO TOTAL**: 20 minutos

**¡Listo para implementar! 🚀**
