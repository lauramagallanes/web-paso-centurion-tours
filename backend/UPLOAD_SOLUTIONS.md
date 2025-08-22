# 🚀 Soluciones para Subir JAR a Lambda

## 📦 JAR Compilado
- **Archivo**: `target/tinambu-tours-lambda.jar`
- **Tamaño**: ~54MB
- **Contiene**: Todos los endpoints (básicos + autenticación + database)

## 🔧 **SOLUCIÓN 1: AWS Console (Recomendado)**

### Paso 1: Abrir Lambda Console
1. **URL**: https://console.aws.amazon.com/lambda/home?region=us-east-1#/functions/tinambu-tours-backend-dev
2. **Función**: `tinambu-tours-backend-dev`

### Paso 2: Subir JAR
1. Pestaña **"Code"** → **"Upload from"** → **".zip or .jar file"**
2. Seleccionar: `backend/target/tinambu-tours-lambda.jar`
3. **Save** y esperar ~3 minutos

## 🔧 **SOLUCIÓN 2: Usando Python + boto3**

```python
# Ejecutar en terminal:
python3 -c "
import boto3
import os

# Configurar cliente Lambda
lambda_client = boto3.client('lambda', region_name='us-east-1')

# Leer JAR
jar_path = 'target/tinambu-tours-lambda.jar'
with open(jar_path, 'rb') as f:
    jar_data = f.read()

print(f'Subiendo JAR de {len(jar_data)} bytes...')

# Actualizar función
response = lambda_client.update_function_code(
    FunctionName='tinambu-tours-backend-dev',
    ZipFile=jar_data
)

print('✅ JAR subido exitosamente!')
print(f'Versión: {response[\"Version\"]}')
"
```

## 🔧 **SOLUCIÓN 3: CloudShell**

1. **Abrir CloudShell**: https://console.aws.amazon.com/cloudshell/
2. **Subir archivo**: Drag & drop `tinambu-tours-lambda.jar`
3. **Ejecutar**:
```bash
aws lambda update-function-code \
  --function-name tinambu-tours-backend-dev \
  --zip-file fileb://tinambu-tours-lambda.jar
```

## 🔧 **SOLUCIÓN 4: Usar wget/curl desde CloudShell**

Si tienes el JAR en algún servidor temporal:

```bash
# En CloudShell:
wget https://tu-servidor.com/tinambu-tours-lambda.jar
aws lambda update-function-code \
  --function-name tinambu-tours-backend-dev \
  --zip-file fileb://tinambu-tours-lambda.jar
```

## ✅ **Verificación Post-Subida**

Después de subir, probar:

```bash
# Endpoint básico (debería seguir funcionando)
curl "https://53dmek6dqk.execute-api.us-east-1.amazonaws.com/basic"

# NUEVOS endpoints de autenticación (deberían funcionar)
curl "https://53dmek6dqk.execute-api.us-east-1.amazonaws.com/auth/info"

curl -X POST "https://53dmek6dqk.execute-api.us-east-1.amazonaws.com/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

## 🎯 **Respuestas Esperadas**

### **Después de subir JAR:**
- `/basic` → `"Basic controller working!"` ✅
- `/auth/info` → JSON con info del controller ✅
- `/auth/login` → JSON con token mock o error ✅

### **Aún fallarán (hasta aplicar Terraform):**
- Si devuelven 404, necesitas aplicar cambios de Terraform

---

**Nota**: Usa **SOLUCIÓN 1** si tienes acceso a AWS Console. Es la más simple y confiable.

