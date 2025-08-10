# 🔐 GUÍA DE SEGURIDAD - TINAMBÚ TOURS

## 📋 Resumen

Esta guía describe las mejores prácticas de seguridad implementadas en la aplicación Tinambú Tours y cómo mantener un entorno seguro.

## 🛡️ Características de Seguridad Implementadas

### 1. **Gestión Segura de Credenciales**

- ✅ **Variables de Entorno**: Las credenciales se almacenan en archivos `.env` (no versionados)
- ✅ **Generación Automática**: Script para generar contraseñas seguras
- ✅ **Separación de Configuración**: Archivos de configuración local vs. producción
- ✅ **Backups Automáticos**: Respaldo automático antes de actualizar credenciales

### 2. **Autenticación y Autorización**

- ✅ **JWT (JSON Web Tokens)**: Autenticación sin estado
- ✅ **BCrypt**: Hashing seguro de contraseñas (strength 12)
- ✅ **Roles de Usuario**: Sistema de roles (USER, ADMIN)
- ✅ **Rutas Protegidas**: Middleware de autenticación

### 3. **Configuración de Base de Datos**

- ✅ **Esquemas Separados**: Separación lógica de datos
- ✅ **Conexiones Seguras**: Configuración de conexión con credenciales
- ✅ **Validación de Datos**: Validaciones a nivel de aplicación y base de datos

### 4. **Configuración del Servidor**

- ✅ **CORS Configurado**: Control de acceso entre dominios
- ✅ **Headers de Seguridad**: Headers HTTP de seguridad
- ✅ **Contenedores Docker**: Aislamiento de aplicaciones

## 🔧 Configuración de Seguridad

### **Credenciales de Administrador**

#### Opción 1: Generación Automática (Recomendado)
```bash
# Generar credenciales seguras automáticamente
./generate-admin-credentials.sh
```

#### Opción 2: Configuración Manual
```bash
# Editar archivo .env
ADMIN_EMAIL=tu-email@empresa.com
ADMIN_PASSWORD=tu-contraseña-super-segura
ADMIN_NAME=Tu Nombre Completo
```

### **JWT Secret**

```bash
# Generar JWT secret seguro (64 caracteres)
openssl rand -base64 64 | tr -d "=+/" | cut -c1-64
```

### **Contraseñas de Base de Datos**

```bash
# Generar contraseña segura para PostgreSQL
openssl rand -base64 32 | tr -d "=+/" | cut -c1-24
```

## ⚠️ Consideraciones de Seguridad

### **Desarrollo Local**

1. **Nunca commits archivos con credenciales**
   - ✅ `.env` está en `.gitignore`
   - ✅ `README-LOCAL.md` está en `.gitignore`
   - ⚠️ Revisa siempre antes de hacer commit

2. **Usa credenciales diferentes para cada entorno**
   - 🔄 Desarrollo: Credenciales simples
   - 🔒 Producción: Credenciales complejas

3. **Rotación de credenciales**
   - 📅 Cambia credenciales regularmente
   - 🔄 Usa el script de generación para actualizaciones

### **Producción**

1. **Variables de Entorno del Sistema**
   ```bash
   export ADMIN_EMAIL="admin@tuempresa.com"
   export ADMIN_PASSWORD="contraseña-super-segura-producción"
   export JWT_SECRET="jwt-secret-de-64-caracteres-muy-seguro"
   ```

2. **Servicios de Gestión de Secretos**
   - AWS Secrets Manager
   - Azure Key Vault
   - HashiCorp Vault
   - Docker Secrets

3. **Certificados SSL/TLS**
   - Usa HTTPS en producción
   - Certificados válidos y actualizados
   - Configuración de headers de seguridad

## 🚨 Procedimientos de Emergencia

### **Compromiso de Credenciales**

1. **Cambio inmediato de contraseñas**
   ```bash
   ./generate-admin-credentials.sh
   docker compose restart
   ```

2. **Revocación de tokens JWT**
   - Cambiar JWT_SECRET
   - Reiniciar aplicación
   - Forzar re-login de usuarios

3. **Auditoría de acceso**
   - Revisar logs de aplicación
   - Verificar accesos no autorizados
   - Cambiar credenciales de base de datos si es necesario

### **Recuperación de Acceso**

1. **Reset de contraseña de admin**
   ```bash
   # Conectar a base de datos
   docker compose exec postgres psql -U postgres -d tinambu_tours
   
   # Eliminar usuario admin existente
   DELETE FROM usuarios.usuarios WHERE email = 'admin@tinambu.com';
   
   # Regenerar credenciales y ejecutar script
   ./generate-admin-credentials.sh
   ./setup-application.sh
   ```

## 📝 Checklist de Seguridad

### **Antes del Deploy**

- [ ] Credenciales generadas con script seguro
- [ ] JWT_SECRET de al menos 64 caracteres
- [ ] Archivo `.env` no incluido en repositorio
- [ ] Contraseñas complejas en producción
- [ ] CORS configurado correctamente
- [ ] Headers de seguridad habilitados

### **Después del Deploy**

- [ ] Cambio de contraseña por defecto
- [ ] Verificación de acceso admin
- [ ] Pruebas de autenticación
- [ ] Configuración de backups
- [ ] Monitoreo de logs activado

### **Mantenimiento Regular**

- [ ] Rotación de credenciales (mensual)
- [ ] Actualización de dependencias
- [ ] Revisión de logs de seguridad
- [ ] Pruebas de penetración
- [ ] Backup de configuraciones

## 🔗 Recursos Adicionales

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Spring Security Reference](https://spring.io/projects/spring-security)
- [JWT Best Practices](https://auth0.com/blog/a-look-at-the-latest-draft-for-jwt-bcp/)
- [Docker Security](https://docs.docker.com/engine/security/)

## 📞 Contacto de Seguridad

Para reportar vulnerabilidades de seguridad, contacta:
- 📧 Email: security@tinambu.com
- 🔒 Usar cifrado PGP cuando sea posible

---

**⚠️ IMPORTANTE**: Esta aplicación contiene información sensible. Mantén siempre las mejores prácticas de seguridad y nunca expongas credenciales en repositorios públicos.
