# 🚀 Guía de Deployment - Tinambú Paso Centurión Tours

## 📋 Información Requerida

### 1. AWS SSO (IAM Identity Center)
Antes de empezar, necesitas obtener esta información de AWS Console:

#### ✅ Verificar si IAM Identity Center está habilitado
1. **AWS Console** → Buscar **"IAM Identity Center"**
2. Si ves "Enable IAM Identity Center" → Necesitas habilitarlo primero
3. Si ya está habilitado, anota:

```
SSO Start URL: https://d-xxxxxxxxxx.awsapps.com/start
SSO Region: us-east-1 (o tu región)
Account ID: 123456789012 (tu ID de 12 dígitos)
Role Name: AdministratorAccess (o el rol que uses)
```

#### 🔧 Si NO tienes SSO configurado:
1. **IAM Identity Center** → **Enable**
2. **Users** → **Add user** 
   - Email: tu-email@ejemplo.com
   - First/Last name
3. **Permission sets** → **Create permission set**
   - **Predefined permission set** → **AdministratorAccess**
4. **AWS accounts** → **Assign users and groups**
   - Selecciona tu cuenta → Asigna usuario → Selecciona permission set

#### 📧 Activar usuario
1. Revisa tu email → **Accept invitation**
2. Configura contraseña
3. Anota la **SSO Start URL** que aparece

---

## 🛠️ Proceso de Deployment

### PASO 1: Configurar AWS SSO Local
```bash
aws configure sso
```

**Te pedirá:**
- **SSO session name**: `tinambu-dev` (o cualquier nombre)
- **SSO start URL**: La URL que obtuviste arriba
- **SSO region**: `us-east-1` (o donde configuraste SSO)
- **Default client region**: `us-east-1` (recomendado para CloudFront)
- **Default output format**: `json`

### PASO 2: Login SSO
```bash
aws sso login --profile default
```
- Abrirá el browser
- Inicia sesión con tu usuario SSO
- Autoriza la aplicación

### PASO 3: Verificar credenciales
```bash
aws sts get-caller-identity
```
Deberías ver tu Account ID y Role.

### PASO 4: Crear Terraform Backend
```bash
chmod +x terraform/scripts/setup-aws.sh
./terraform/scripts/setup-aws.sh
```

### PASO 5: Validar Terraform
```bash
terraform fmt -recursive terraform/
cd terraform/environments/dev
terraform init
terraform validate
terraform plan
```

### PASO 6: Deploy Infraestructura
```bash
terraform apply
```

### PASO 7: Build Backend (Java)
```bash
cd backend
./mvnw clean package -DskipTests
```

### PASO 8: Build Frontend (React)
```bash
cd frontend
npm install
npm run build
```

### PASO 9: Upload a S3
```bash
# Se hará automáticamente con GitHub Actions
# O manualmente con aws s3 sync
```

---

## 🔄 GitHub Actions (CI/CD)

### PASO 1: Crear OIDC Provider en AWS
```bash
# Esto se hará después del deployment inicial
# Necesitamos el IAM Role ARN que Terraform creará
```

### PASO 2: Configurar GitHub Secrets
En tu repositorio GitHub → **Settings** → **Secrets and variables** → **Actions**

```
AWS_ROLE_ARN: arn:aws:iam::ACCOUNT-ID:role/github-actions-role
AWS_REGION: us-east-1
```

---

## 📝 Notas Importantes

### Regiones Recomendadas
- **CloudFront**: Requiere certificados en `us-east-1`
- **Aplicación**: Puede estar en cualquier región
- **Recomendación**: Todo en `us-east-1` para simplicidad

### Seguridad
- ✅ SSO para desarrollo local
- ✅ OIDC para CI/CD (sin Access Keys)
- ✅ Roles IAM con permisos mínimos
- ✅ Secrets en SSM Parameter Store

### Costos
- **Desarrollo**: ~$5-10/mes (t4g.nano NAT, RDS Single-AZ)
- **Producción**: ~$20-50/mes (con monitoring completo)

---

## 🆘 Troubleshooting

### Error: "Unable to locate credentials"
```bash
aws sso login --profile default
```

### Error: "Access Denied"
Verifica que tu usuario SSO tenga `AdministratorAccess`

### Error: "Region not found"
Asegúrate de usar la misma región donde configuraste SSO

---

## 📞 Próximos Pasos

1. **Configurar SSO** (este documento)
2. **Deploy infraestructura**
3. **Configurar GitHub Actions**
4. **Build y deploy aplicaciones**
5. **Configurar dominio y SSL**
6. **Configurar PlacetoPay**

---

**Estado actual**: ⏳ Configurando SSO
