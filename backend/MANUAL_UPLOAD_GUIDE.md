# 📋 Guía Manual para Subir JAR a Lambda

## 🎯 Objetivo
Subir el JAR actualizado con endpoints de autenticación a AWS Lambda usando la consola web.

## 📦 Archivo a Subir
- **Archivo**: `target/tinambu-tours-lambda.jar`
- **Tamaño**: ~54MB
- **Contiene**: Endpoints de autenticación (`/auth/login`, `/auth/signup`, `/auth/validate`, `/auth/info`)

## 🔄 Método 1: Subida Directa a Lambda (Recomendado)

### Paso 1: Abrir AWS Lambda Console
1. Ir a: https://console.aws.amazon.com/lambda/
2. Región: **us-east-1** (N. Virginia)
3. Buscar función: **tinambu-tours-backend-dev**

### Paso 2: Subir JAR
1. En la función Lambda, ir a la pestaña **"Code"**
2. Hacer clic en **"Upload from"** → **".zip or .jar file"**
3. Seleccionar archivo: `backend/target/tinambu-tours-lambda.jar`
4. Hacer clic en **"Save"**
5. Esperar a que se complete la subida (~2-3 minutos)

### Paso 3: Verificar Subida
- La consola debería mostrar: **"The deployment package is too large to enable inline code editing"**
- Esto es normal para archivos grandes

## 🔄 Método 2: Subida vía S3 (Alternativo)

### Paso 1: Subir a S3
1. Ir a: https://s3.console.aws.amazon.com/s3/
2. Bucket: **tinambu-public-assets-dev**
3. Navegar a carpeta: **lambda/**
4. Subir archivo con nombre: **tinambu-tours-lambda-AUTH-ENDPOINTS.jar**

### Paso 2: Actualizar Lambda desde S3
1. Volver a Lambda Console: https://console.aws.amazon.com/lambda/
2. Función: **tinambu-tours-backend-dev**
3. Pestaña **"Code"** → **"Upload from"** → **"Amazon S3 location"**
4. S3 URL: `s3://tinambu-public-assets-dev/lambda/tinambu-tours-lambda-AUTH-ENDPOINTS.jar`
5. Hacer clic en **"Save"**

## ✅ Verificación Post-Subida

### Endpoints a Probar:
```bash
# Endpoint básico (debería seguir funcionando)
curl -X GET "https://53dmek6dqk.execute-api.us-east-1.amazonaws.com/basic"

# Nuevos endpoints de autenticación
curl -X GET "https://53dmek6dqk.execute-api.us-east-1.amazonaws.com/auth/info"

# Test de login
curl -X POST "https://53dmek6dqk.execute-api.us-east-1.amazonaws.com/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

### Respuestas Esperadas:
- **`/basic`**: `"Basic controller working!"` ✅
- **`/auth/info`**: JSON con información del controlador ✅
- **`/auth/login`**: JSON con token mock o error de validación ✅

## 🐛 Troubleshooting

### Si los endpoints devuelven 404:
1. **Verificar rutas en API Gateway**:
   - Ir a: https://console.aws.amazon.com/apigateway/
   - API: **tinambu-tours-api-dev**
   - Verificar que existan rutas: `GET /auth/info`, `POST /auth/login`, etc.

2. **Aplicar cambios de Terraform**:
   - Las rutas fueron agregadas al código pero necesitan aplicarse
   - Ejecutar: `terraform apply` en `terraform/environments/dev/`

### Si el JAR es demasiado grande:
- Usar **Método 2** (subida vía S3)
- S3 no tiene límite de 50MB como Lambda direct upload

### Si hay errores en Lambda:
1. **Ver logs**: CloudWatch Logs → `/aws/lambda/tinambu-tours-backend-dev`
2. **Verificar handler**: Debe ser `com.tinambu.tours.lambda.SpringBootLambdaHandler`
3. **Verificar timeout**: Aumentar si es necesario (actualmente 30s)

## 🎯 Próximos Pasos Después de la Subida

1. **Probar todos los endpoints** usando el script `./test-endpoints.sh`
2. **Aplicar cambios de Terraform** para las nuevas rutas
3. **Habilitar conexión a base de datos** (cambiar a profile `lambda-with-db`)
4. **Probar endpoints complejos** con validación JSON

## 📞 Comandos Útiles

```bash
# Compilar JAR actualizado
mvn clean package -DskipTests

# Verificar tamaño del JAR
ls -lh target/tinambu-tours-lambda.jar

# Probar endpoints después de subida
./test-endpoints.sh

# Ver logs de Lambda (requiere AWS CLI)
aws logs describe-log-streams --log-group-name "/aws/lambda/tinambu-tours-backend-dev" --order-by LastEventTime --descending --max-items 1
```

---
**Nota**: Esta guía asume que tienes acceso a la consola de AWS con permisos para Lambda, S3 y API Gateway.

