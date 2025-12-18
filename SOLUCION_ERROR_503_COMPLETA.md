# 🔧 Solución Completa al Error 503

## 📋 Problema Identificado

**Error**: HTTP 503 al acceder a `/senderos`
**Causa Raíz**: Lambda hace timeout durante la inicialización porque:
1. El JDBC URL construido en `SsmEnvironmentPostProcessor` no incluía parámetros SSL
2. HikariCP no tenía configuración de timeout, usando valores por defecto muy cortos
3. La conexión a RDS toma más tiempo cuando se hace a través de internet (Lambda sin VPC → RDS público)

---

## ✅ Solución Implementada

### 1. **Corregir JDBC URL en SsmEnvironmentPostProcessor**

**Archivo**: `backend/src/main/java/com/tinambu/tours/config/SsmEnvironmentPostProcessor.java`

**Cambio**:
```java
// ANTES:
String jdbcUrl = String.format("jdbc:postgresql://%s:%s/%s", dbHost, dbPort, dbName);

// DESPUÉS:
String jdbcUrl = String.format("jdbc:postgresql://%s:%s/%s?useUnicode=true&characterEncoding=UTF-8&sslmode=require&connectTimeout=10&socketTimeout=30", dbHost, dbPort, dbName);
```

**Parámetros agregados**:
- `sslmode=require` - Requiere SSL/TLS
- `connectTimeout=10` - Timeout de conexión inicial (10 segundos)
- `socketTimeout=30` - Timeout de socket (30 segundos)

### 2. **Agregar Configuración de Timeout a HikariCP**

**Archivo**: `backend/src/main/resources/application.yml`

**Cambio**:
```yaml
hikari:
  connection-init-sql: SET client_encoding TO 'UTF8'
  connection-timeout: 30000  # 30 segundos
  maximum-pool-size: 5
  minimum-idle: 1
  idle-timeout: 300000  # 5 minutos
  max-lifetime: 600000  # 10 minutos
```

---

## 🔄 Pasos para Aplicar la Solución

### 1. Recompilar Backend
```bash
cd backend
mvn clean package -DskipTests
```

### 2. Redesplegar Lambda
```bash
# Actualizar el código de Lambda con el nuevo JAR
aws lambda update-function-code \
  --function-name tinambu-tours-backend-dev \
  --zip-file fileb://target/tinambu-tours-backend-1.0.0.jar
```

### 3. Verificar que Funciona
```bash
curl https://53dmek6dqk.execute-api.us-east-1.amazonaws.com/senderos
```

---

## 🔒 Seguridad

### Regla Temporal del Security Group

**⚠️ IMPORTANTE**: Se agregó una regla temporal que permite acceso desde cualquier IP (`0.0.0.0/0`) para diagnóstico.

**Después de confirmar que funciona**, debes:
1. Remover la regla temporal
2. Mantener solo las reglas con rangos IP de Lambda

**Comando para remover regla temporal**:
```bash
aws ec2 revoke-security-group-ingress \
  --group-id sg-0b829ea7e3f33ace3 \
  --ip-permissions '[{"IpProtocol":"tcp","FromPort":5432,"ToPort":5432,"IpRanges":[{"CidrIp":"0.0.0.0/0"}]}]'
```

---

## 📊 Verificación

### Logs Esperados Después del Fix:

```
🔗 Configurando datasource: jdbc:postgresql://tinambu-db-dev.../tinambu_tours?sslmode=require&connectTimeout=10&socketTimeout=30
🔑 Obteniendo contraseña de base de datos desde SSM: /dev/database/password
✅ Contraseña de base de datos configurada securely
... (Spring Boot inicializa correctamente)
```

### Si Aún Hay Problemas:

1. **Verificar Security Group**: Asegurar que permite acceso desde Lambda IPs
2. **Verificar SSL**: RDS debe tener SSL habilitado
3. **Verificar Timeout de Lambda**: Aumentar timeout de Lambda si es necesario (actualmente 30s)
4. **Verificar Logs**: Revisar logs de Lambda para errores específicos

---

## 🎯 Resumen

**Problema**: Lambda timeout durante inicialización por falta de configuración SSL y timeout en JDBC URL

**Solución**: 
- ✅ Agregar parámetros SSL y timeout al JDBC URL
- ✅ Configurar timeouts de HikariCP
- ✅ Regla temporal de Security Group para diagnóstico

**Próximos Pasos**:
1. Recompilar y redesplegar Lambda
2. Verificar que funciona
3. Remover regla temporal del Security Group

---

**Fecha**: 2025-12-18
**Estado**: Solución implementada, pendiente de despliegue

