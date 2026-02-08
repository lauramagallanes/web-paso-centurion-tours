# 📍 Cómo Configurar tu Google Place ID

## ✅ Ya tienes tu Place ID - Sigue estos pasos:

### Paso 1: Configura las Variables de Entorno en AWS Lambda

Ejecuta este comando en tu terminal:

```bash
cd /media/laura/datos/proyectos/web-paso-centurion-tours
./scripts/configurar-reviews-api.sh
```

El script te pedirá:
1. 📍 Tu **Google Place ID** (pégalo cuando te lo pida)
2. 🔑 Tu **Google API Key** 
   - Si NO la tienes todavía, créala aquí: https://console.cloud.google.com/apis/credentials
   - Asegúrate de habilitar **Places API**

### Paso 2: El Script Hace Todo Automáticamente

El script:
- ✅ Configura las variables de entorno en tu función Lambda de AWS
- ✅ Guarda tu Place ID de forma segura
- ✅ Prepara tu aplicación para obtener reviews reales

### Paso 3: Espera la Actualización del Backend

Una vez que yo termine de:
1. Crear el servicio de Google Reviews
2. Crear el endpoint `/api/reviews/google`
3. Actualizar el frontend para consumir datos reales
4. Compilar y desplegar

Tu aplicación mostrará automáticamente las reviews reales de Google.

---

## 🔑 ¿Todavía no tienes el Google API Key?

### Paso a paso para obtener tu API Key:

1. Ve a: https://console.cloud.google.com/apis/credentials
2. Selecciona tu proyecto (o crea uno nuevo)
3. Click en "**+ CREATE CREDENTIALS**"
4. Selecciona "**API key**"
5. Copia la API Key que se genera
6. Click en "**Restrict Key**" (recomendado para seguridad)
7. En "API restrictions" selecciona "**Restrict key**"
8. Marca "**Places API**"
9. Click en "**Save**"

**Tu API Key está lista!** 🎉

---

## 📋 Resumen

**Lo que necesitas:**
- ✅ Google Place ID (ya lo tienes)
- 🔑 Google API Key (créala si no la tienes)

**Qué hacer:**
1. Ejecuta `./scripts/configurar-reviews-api.sh`
2. Pega tu Place ID y API Key cuando te los pida
3. ¡Listo! El resto lo hago yo

---

## 🆘 ¿Problemas?

Si tienes algún error al ejecutar el script, avísame y te ayudo a resolverlo.

**Nota:** El Place ID y la API Key se guardan de forma **segura** en las variables de entorno de AWS Lambda. Nunca se exponen públicamente en el código.


