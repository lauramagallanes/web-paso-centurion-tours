# GitHub Actions Configuration

Este directorio contiene los workflows de GitHub Actions para el proyecto Paso Centurión Tours.

## Workflows Configurados

### 1. `ci-cd.yml` - Pipeline Principal
- **Frontend**: Build, linting, type checking y testing de React
- **Backend**: Build, testing y packaging de Spring Boot (cuando se agregue)
- **Deployment**: Despliegue automático a AWS EC2 en la rama `main`

### 2. `security.yml` - Verificaciones de Seguridad
- **Frontend**: npm audit, verificación de dependencias obsoletas, Snyk scan
- **Backend**: Maven dependency check, OWASP dependency check
- **Programado**: Se ejecuta semanalmente los domingos

### 3. `test.yml` - Testing Comprehensivo
- **Frontend**: Tests, linting, type checking, build test
- **Backend**: Maven tests y verificación completa

## Secrets Requeridos

Configura estos secrets en GitHub (Settings → Secrets and variables → Actions):

### Obligatorios:
- `EC2_SSH_KEY`: Clave SSH privada para acceder al EC2
- `EC2_HOST`: IP pública o DNS del EC2

### Opcionales:
- `SNYK_TOKEN`: Token de Snyk para escaneo de seguridad
- `AWS_ACCESS_KEY_ID`: Para operaciones AWS adicionales
- `AWS_SECRET_ACCESS_KEY`: Para operaciones AWS adicionales

## Estructura del Proyecto

```
web-paso-centurion-tours/
├── frontend/          # React app (actual)
├── backend/           # Spring Boot app (futuro)
├── .github/
│   └── workflows/
│       ├── ci-cd.yml
│       ├── security.yml
│       └── test.yml
└── README.md
```

## Configuración del EC2

El EC2 debe tener:
- Nginx configurado para servir el frontend
- Java 17 instalado para el backend
- Systemd service configurado para el backend
- Usuario con permisos sudo para deployment

## Comandos Útiles

### Verificar workflows:
```bash
# En el repositorio local
git push origin main
```

### Ver logs de deployment:
```bash
# En el EC2
sudo journalctl -u paso-centurion-app -f
sudo systemctl status paso-centurion-app
```

### Rollback manual:
```bash
# En el EC2
sudo systemctl stop paso-centurion-app
sudo cp -r /var/www/paso-centurion.backup.* /var/www/paso-centurion/
sudo systemctl start paso-centurion-app
```
