# Configurar info@pasocenturion.com.uy

**Fecha:** 2026-02-04  
**Estado:** ✅ Receipt Rule creada

---

## ✅ CONFIGURACIÓN COMPLETADA

### 1. SES Receipt Rule ✅

- **Regla creada:** `inbound-info-to-s3`
- **Email:** `info@pasocenturion.com.uy`
- **Almacenamiento S3:** `inbound/info/`
- **Bucket:** `pasocenturion-emails-inbound`
- **Estado:** ✅ ACTIVA

### 2. Reenvío Automático ✅

El reenvío automático a Gmail **ya está configurado** y funcionará automáticamente para `info@pasocenturion.com.uy` porque:

- ✅ Lambda function `email-forwarding-dev` está configurada para procesar todos los emails en `inbound/`
- ✅ S3 Event Notifications están configuradas para `inbound/`
- ✅ Los correos a `info@pasocenturion.com.uy` se almacenarán en `inbound/info/`
- ✅ El Lambda procesará automáticamente estos correos y los reenviará a `pasocenturiontours@gmail.com`

**No se requiere configuración adicional para el reenvío.**

---

## 📧 CONFIGURAR GMAIL PARA ENVIAR DESDE info@pasocenturion.com.uy

### Pasos en Gmail:

1. **Gmail → ⚙️ → Ver toda la configuración**
2. **Pestaña "Cuentas e importación"**
3. **En "Enviar correo como" → "Agregar otra dirección de correo electrónico"**

### Configuración:

**Paso 1:**
- **Nombre:** `Info Paso Centurion` (o el que prefieras)
- **Dirección de correo electrónico:** `info@pasocenturion.com.uy`
- **Marcar:** ✅ "Tratarlo como un alias"
- Clic en **"Siguiente"**

**Paso 2: Configurar SMTP (MISMAS Credenciales)**

1. **Selecciona:** "Enviar el correo a través de tu servidor SMTP"

2. **Servidor SMTP:** 
   ```
   email-smtp.us-east-1.amazonaws.com
   ```
   - ⚠️ Mismo servidor que usaste para reservas y consultas

3. **Puerto:**
   - Selecciona `587` del dropdown

4. **Nombre de usuario:**
   ```
   [MISMO que usaste para reservas@pasocenturion.com.uy]
   ```
   - ⚠️ Las credenciales SMTP son las mismas para todo el dominio

5. **Contraseña:**
   ```
   [MISMA que usaste para reservas@pasocenturion.com.uy]
   ```
   - ⚠️ Misma contraseña SMTP

6. **Conexión segura:**
   - ✅ Selecciona "Conexión segura mediante TLS (recomendada)"

7. Clic en **"Añadir cuenta >>"**

### Verificación:

Gmail enviará un correo de verificación a `info@pasocenturion.com.uy`. Como los correos se reenvían automáticamente a Gmail, podrás ver el código de verificación.

---

## ✅ RESULTADO FINAL

Después de configurar Gmail:

- ✅ Correos entrantes a `info@pasocenturion.com.uy` se almacenan en S3 (`inbound/info/`)
- ✅ Correos se reenvían automáticamente a `pasocenturiontours@gmail.com`
- ✅ Sin "Fwd:" en el asunto
- ✅ Reply-To configurado correctamente
- ✅ Puedes enviar correos desde `info@pasocenturion.com.uy` desde Gmail
- ✅ Puedes responder correos como si vinieras de `info@pasocenturion.com.uy`

---

## 📋 RESUMEN DE DIRECCIONES CONFIGURADAS

| Dirección | S3 Prefix | Gmail Configurado |
|-----------|-----------|-------------------|
| `reservas@pasocenturion.com.uy` | `inbound/reservas/` | ✅ |
| `consultas@pasocenturion.com.uy` | `inbound/consultas/` | ✅ |
| `consulta@pasocenturion.com.uy` | `inbound/consultas/` | ✅ |
| `info@pasocenturion.com.uy` | `inbound/info/` | ⏳ Pendiente |

---

## 🧪 PRUEBA

**Para probar que todo funciona:**

1. **Enviar correo de prueba a `info@pasocenturion.com.uy`:**
   - Desde: Cualquier cuenta de email externa
   - Asunto: `Prueba info@pasocenturion.com.uy`
   - Cuerpo: Cualquier texto

2. **Verificar:**
   - ✅ Correo aparece en S3: `inbound/info/`
   - ✅ Correo llega a Gmail (`pasocenturiontours@gmail.com`)
   - ✅ Sin "Fwd:" en el asunto
   - ✅ Puedes responder desde Gmail usando `info@pasocenturion.com.uy`

---

**Última actualización:** 2026-02-04  
**Estado:** ✅ Receipt Rule creada, pendiente configuración Gmail


