# CI/CD Pipeline - Tinambu Tours

## Resumen

El proyecto cuenta con un pipeline de CI/CD automatizado usando **GitHub Actions** que despliega automáticamente al hacer push a la rama `development`.

## Arquitectura del deploy

```
Push a development
       │
       ▼
┌─────────────────┐
│ Detect changes   │  ← Analiza qué carpetas cambiaron
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐ ┌────────┐
│Frontend│ │Backend │  ← Se ejecutan en paralelo
└───┬────┘ └───┬────┘
    │          │
    ▼          ▼
  S3        Lambda
```

### Frontend (React/Vite → S3)
1. Instala dependencias (`npm ci`)
2. Compila el proyecto (`npm run build`)
3. Sincroniza `dist/` con el bucket S3 `tinambu-frontend-dev`

### Backend (Spring Boot → Lambda)
1. Compila el JAR (`mvn clean package -DskipTests`)
2. Sube el JAR a S3 (`tinambu-public-assets-dev`)
3. Actualiza la función Lambda (`tinambu-tours-backend-dev`)
4. Espera a que Lambda confirme que está lista

## Detección inteligente de cambios

El pipeline solo despliega lo que cambió:

| Cambio en          | Frontend deploy | Backend deploy |
|--------------------|:---------------:|:--------------:|
| `frontend/**`      | Si              | No             |
| `backend/src/**`   | No              | Si             |
| `backend/pom.xml`  | No              | Si             |
| Ambos              | Si              | Si             |
| Manual (dispatch)  | Si              | Si             |

## Seguridad

### Usuario IAM dedicado
- **Usuario**: `github-actions-deploy`
- **Principio**: Mínimo privilegio (least privilege)
- **Permisos**:
  - S3: PutObject, GetObject, DeleteObject, ListBucket (solo buckets de deploy)
  - Lambda: UpdateFunctionCode, GetFunction, GetFunctionConfiguration (solo la función de dev)

### Secrets de GitHub
Los credentials se almacenan como secrets encriptados en GitHub:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

Nunca se exponen en logs ni en el código.

## Archivo del workflow

El workflow se encuentra en `.github/workflows/deploy-dev.yml`.

## Tiempos aproximados

| Job              | Tiempo |
|------------------|--------|
| Detect changes   | ~15s   |
| Deploy Frontend  | ~50s   |
| Deploy Backend   | ~1m40s |

## Cómo ejecutar manualmente

Si necesitas forzar un deploy sin hacer cambios en el código:

1. Ir a: https://github.com/lauramagallanes/web-paso-centurion-tours/actions
2. Seleccionar **Deploy Development**
3. Click en **Run workflow** → seleccionar rama `development` → **Run workflow**

Esto despliega frontend y backend sin importar qué archivos cambiaron.

## Cómo ver el estado del deploy

- **GitHub Actions**: https://github.com/lauramagallanes/web-paso-centurion-tours/actions
- Cada run muestra el estado de cada job (Detect changes, Deploy Frontend, Deploy Backend)
- En caso de fallo, los logs detallan el paso exacto que falló

## Rotación de credenciales

Si necesitas rotar las access keys del usuario `github-actions-deploy`:

```bash
# Crear nueva key
aws iam create-access-key --user-name github-actions-deploy --profile laura

# Actualizar secrets en GitHub (desde el directorio del repo)
echo "NUEVA_KEY_ID" | gh secret set AWS_ACCESS_KEY_ID
echo "NUEVA_SECRET_KEY" | gh secret set AWS_SECRET_ACCESS_KEY

# Eliminar la key anterior
aws iam delete-access-key --user-name github-actions-deploy --access-key-id KEY_ANTERIOR --profile laura
```

## Consideraciones futuras

- **Agregar ambiente de producción**: Crear un workflow similar para `main` con buckets y Lambda de producción.
- **Notificaciones**: Agregar notificación por Slack/email cuando un deploy falla.
- **Tests automatizados**: Agregar un job de tests antes del deploy (actualmente se skipean los tests del backend por incompatibilidades con H2).
- **CloudFront invalidation**: Si se agrega CloudFront al frontend, añadir un paso de invalidación de cache después del sync a S3.
