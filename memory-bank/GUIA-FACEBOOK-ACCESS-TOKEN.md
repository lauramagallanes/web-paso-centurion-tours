# 📘 Guía Paso a Paso: Obtener Facebook Access Token

## 🎯 Objetivo
Obtener un **Page Access Token** de larga duración para acceder a las reviews de tu página de Facebook.

---

## 📋 Requisitos Previos
- ✅ Ser administrador de la página de Facebook de Tinambú
- ✅ Tener una cuenta de Facebook Developer (te ayudo a crearla si no la tienes)

---

## 🚀 Paso 1: Crear/Acceder a Facebook Developers

### 1.1 Ve a Facebook for Developers
Abre tu navegador y ve a: **https://developers.facebook.com/**

### 1.2 Inicia sesión
- Click en "**My Apps**" en la esquina superior derecha
- Inicia sesión con tu cuenta de Facebook (la que es admin de la página)

### 1.3 Acepta los términos
- Si es tu primera vez, acepta los términos de desarrollador
- Click en "**Register**" o "**Get Started**"

---

## 🎨 Paso 2: Crear una App de Facebook (si no tienes una)

### 2.1 Crear Nueva App
- Click en "**Create App**"
- Selecciona el tipo: "**Business**" (o "None" si no aparece Business)
- Click en "**Next**"

### 2.2 Configurar la App
- **Display Name**: "Tinambú Reviews API" (o el nombre que prefieras)
- **App Contact Email**: Tu email
- Click en "**Create App**"

### 2.3 Verificación
- Facebook puede pedirte que verifiques tu identidad
- Ingresa el código de seguridad que te envíen por SMS o email

---

## 🔧 Paso 3: Configurar Permisos de la App

### 3.1 Ve a la Configuración de la App
- En el panel izquierdo, busca "**Add Product**"
- O ve directamente a la sección "**Products**"

### 3.2 NO necesitas agregar productos específicos
- Para obtener reviews, no necesitas configurar productos adicionales
- Solo necesitamos generar el Access Token

---

## 🔑 Paso 4: Obtener el Access Token (¡Lo más importante!)

### 4.1 Abre el Graph API Explorer
Ve a: **https://developers.facebook.com/tools/explorer/**

### 4.2 Selecciona tu App
- En la parte superior, en "**Facebook App**"
- Selecciona la app que creaste ("Tinambú Reviews API")

### 4.3 Selecciona tu Página
- Click en "**User or Page**"
- Selecciona "**Get Page Access Token**"
- Se abrirá una ventana emergente

### 4.4 Selecciona tu Página de Facebook
- En la lista, busca y selecciona tu página de Tinambú
- Marca los siguientes permisos:
  - ✅ **pages_show_list** (para listar páginas)
  - ✅ **pages_read_engagement** (para leer reviews y ratings)
  - ✅ **pages_manage_metadata** (opcional, pero recomendado)

### 4.5 Genera el Token
- Click en "**Generate Token**"
- Aparecerá un token largo (empieza con "EAAx...")
- **¡NO CIERRES ESTA VENTANA AÚN!**

---

## ⏰ Paso 5: Convertir a Token de Larga Duración

Los tokens generados en el Explorer expiran en 1-2 horas. Necesitamos uno de **larga duración** (60 días).

### 5.1 Copia tu Token Temporal
- En el Graph API Explorer, copia el token que generaste
- Guárdalo temporalmente en un bloc de notas

### 5.2 Obtén tu App ID y App Secret
- Ve a: **Settings → Basic** en tu app de Facebook
- Copia el "**App ID**"
- Copia el "**App Secret**" (click en "Show" para verlo)

### 5.3 Genera Token de Larga Duración

**Opción A: Usando curl (en terminal)**

Ejecuta este comando reemplazando los valores:

```bash
curl -i -X GET "https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=TU_APP_ID&client_secret=TU_APP_SECRET&fb_exchange_token=TU_TOKEN_TEMPORAL"
```

Reemplaza:
- `TU_APP_ID` → El App ID que copiaste
- `TU_APP_SECRET` → El App Secret que copiaste
- `TU_TOKEN_TEMPORAL` → El token que generaste en el Explorer

**Opción B: Usando el navegador**

Abre esta URL en tu navegador (reemplaza los valores):

```
https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=TU_APP_ID&client_secret=TU_APP_SECRET&fb_exchange_token=TU_TOKEN_TEMPORAL
```

### 5.4 Copia el Token de Larga Duración
La respuesta será algo como:
```json
{
  "access_token": "EAAx...Este_es_tu_token_de_larga_duracion",
  "token_type": "bearer",
  "expires_in": 5183944
}
```

**¡COPIA Y GUARDA este nuevo access_token!** Este es el que durará 60 días.

---

## 📍 Paso 6: Obtener tu Page ID

### 6.1 Ve a tu Página de Facebook
- Abre tu página de Tinambú en Facebook
- Click en "**About**" o "**Acerca de**"

### 6.2 Busca el Page ID
- Scroll hasta abajo
- Busca "**Page ID**" o "**ID de página**"
- Copia el número (ejemplo: 123456789012345)

**Alternativa rápida:**
Ve a: https://www.facebook.com/TU_PAGINA
Y mira la URL o usa este comando en el Graph API Explorer:
```
me?fields=id,name
```
(Con tu Page Access Token seleccionado)

---

## ✅ Paso 7: Verifica que Funciona

### 7.1 Prueba tu Token
En el Graph API Explorer, pega tu nuevo token de larga duración y ejecuta:

```
/TU_PAGE_ID?fields=name,rating_count,overall_star_rating
```

Deberías ver algo como:
```json
{
  "name": "Tinambú Tours",
  "rating_count": 28,
  "overall_star_rating": 4.9,
  "id": "123456789012345"
}
```

Si ves esto, **¡FUNCIONA!** 🎉

---

## 📝 Paso 8: Guarda tus Credenciales

Ahora tienes:
- ✅ **Facebook Page ID**: 123456789012345
- ✅ **Access Token de larga duración**: EAAx...

**Agrégalos a tu archivo `.env`:**

```bash
FACEBOOK_PAGE_ID=123456789012345
FACEBOOK_ACCESS_TOKEN=EAAxtu_token_completo_aqui
```

---

## 🔒 Seguridad Importante

### ⚠️ NUNCA COMPARTAS:
- ❌ Tu Access Token
- ❌ Tu App Secret
- ❌ No lo subas a GitHub ni repositorios públicos

### ✅ El Access Token debe:
- Estar solo en tu archivo `.env` (que debe estar en `.gitignore`)
- Estar en las variables de entorno de AWS Lambda
- Renovarse cada 60 días

---

## 🔄 Renovación del Token

Los tokens de larga duración expiran en **60 días**.

### Para renovarlo:
1. Repite los pasos 4 y 5
2. O implementa renovación automática (te puedo ayudar después)

### Recordatorio automático:
- Configura un recordatorio en tu calendario para el día 50
- O yo puedo crear un sistema que te avise automáticamente

---

## 🆘 Problemas Comunes

### Error: "This app is in development mode"
**Solución:** 
- Ve a Settings → Basic
- Cambia "App Mode" de "Development" a "Live"
- (Solo si vas a producción)

### Error: "Permissions error"
**Solución:**
- Verifica que marcaste `pages_read_engagement`
- Vuelve a generar el token con los permisos correctos

### Error: "Invalid token"
**Solución:**
- El token temporal expiró
- Genera uno nuevo desde el paso 4

---

## 📞 ¿Necesitas Ayuda?

Si te atoras en algún paso:
1. Dime en qué paso estás
2. Qué error te aparece (si hay)
3. Te ayudo a resolverlo

**Una vez que tengas el Access Token, solo pégalo en tu `.env` y yo me encargo del resto!** 🚀

---

## 🎯 Próximo Paso

Cuando tengas:
- ✅ Facebook Page ID
- ✅ Facebook Access Token de larga duración
- ✅ Google Place ID
- ✅ Google API Key

Me avisas y yo:
1. Creo los servicios en el backend
2. Conecto con las APIs
3. Actualizo el frontend
4. Despliego todo

Y tu sitio mostrará las **reviews reales** automáticamente! 🎉


