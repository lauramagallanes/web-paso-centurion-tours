# 📋 PASO 1: Subir JAR - Instrucciones Detalladas

## 🎯 **OBJETIVO**
Subir el JAR actualizado (55MB) con endpoints de autenticación a AWS Lambda

## 📦 **ARCHIVO A SUBIR**
```
Archivo: /media/laura/datos/proyectos/web-paso-centurion-tours/backend/target/tinambu-tours-lambda.jar
Tamaño: 55MB
Contiene: AuthController, AuthTestController, BasicTestController
```

## 🚀 **PASO A PASO**

### **1.2.1 Abrir AWS Lambda Console**
1. **Abrir navegador**
2. **Ir a**: https://console.aws.amazon.com/lambda/home?region=us-east-1#/functions/tinambu-tours-backend-dev
3. **Verificar región**: US East 1 (N. Virginia) en la esquina superior derecha
4. **Verificar función**: Nombre debe ser `tinambu-tours-backend-dev`

### **1.2.2 Verificar estado actual ANTES de subir**
1. **Ir a pestaña "Configuration"**
2. **Clic en "General configuration"**
3. **Anotar "Code size" actual**: ¿Cuánto muestra?
   - Si es ~55MB → JAR ya subido (problema diferente)
   - Si es menor → JAR NO subido (continuar)

### **1.2.3 Subir el JAR**
1. **Ir a pestaña "Code"**
2. **Clic en "Upload from"**
3. **Seleccionar ".zip or .jar file"**
4. **Navegar a la carpeta**:
   ```
   /media/laura/datos/proyectos/web-paso-centurion-tours/backend/target/
   ```
5. **Seleccionar archivo**: `tinambu-tours-lambda.jar`
6. **IMPORTANTE**: Verificar que aparece el nombre del archivo
7. **Clic "Open"**

### **1.2.4 Confirmar subida**
1. **Clic "Save"** (botón naranja)
2. **ESPERAR**: Aparecerá mensaje "Updating function code..."
3. **ESPERAR**: Mensaje "Successfully updated function tinambu-tours-backend-dev"
4. **Tiempo estimado**: 2-4 minutos

### **1.2.5 Verificar subida exitosa**
1. **Ir a "Configuration" → "General configuration"**
2. **Verificar "Code size"**: Debe mostrar ~55MB
3. **Verificar "Last modified"**: Debe mostrar fecha/hora reciente

## ✅ **VERIFICACIÓN**
Después de completar la subida, ejecutar:
```bash
curl "https://53dmek6dqk.execute-api.us-east-1.amazonaws.com/auth/info"
```
**Resultado esperado**: JSON con información (NO "Not Found")

## ⚠️ **PROBLEMAS COMUNES**

### **Si la subida falla:**
- **Error de tamaño**: Normal, archivo grande
- **Timeout**: Reintentar subida
- **Error de permisos**: Verificar login AWS

### **Si sigue devolviendo 404:**
- Verificar que Code size cambió a ~55MB
- Esperar 2-3 minutos adicionales
- Verificar que estás en la función correcta

## 🚀 **SIGUIENTE PASO**
Una vez completado, continuar con PASO 2 (S3 Frontend)

---

**¿Has completado la subida del JAR? Avísame el resultado.**
