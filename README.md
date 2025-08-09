# 🦅 Tinambú Paso Centurión Tours

Una plataforma completa de ecoturismo y avistamiento de aves desarrollada con tecnologías modernas full-stack.

## 📋 Descripción

Tinambú Paso Centurión Tours es una aplicación web para gestión de reservas de turismo ecológico, especializada en avistamiento de aves y turismo de naturaleza. La plataforma permite a los visitantes explorar actividades, hacer reservas y gestionar su experiencia turística.

## 🏗️ Arquitectura

### Frontend
- **React 18** con TypeScript
- **Vite** como bundler
- **React Router** para navegación
- **Bootstrap 5** para UI/UX
- **Axios** para comunicación HTTP
- **Context API** para manejo de estado

### Backend
- **Spring Boot 3.2** con Java 17
- **Spring Security** con JWT
- **Spring Data JPA** con Hibernate
- **PostgreSQL** como base de datos
- **Docker** para containerización

### DevOps & Testing
- **Docker Compose** para orquestación
- **GitHub Actions** para CI/CD
- **JUnit 5 + Mockito** para tests backend
- **Vitest + Testing Library** para tests frontend
- **Playwright** para tests E2E

## 🚀 Inicio Rápido

### Opción 1: Script Automatizado (Recomendado)

```bash
# Clonar el repositorio
git clone <repository-url>
cd web-paso-centurion-tours

# Ejecutar script de configuración
./setup-application.sh
```

### Opción 2: Manual

```bash
# 1. Configurar entorno
cp env.example .env

# 2. Construir y ejecutar con Docker
docker compose up --build -d

# 3. Configurar usuario administrador (ver README-LOCAL.md para detalles)
```

## 🌐 Acceso a la Aplicación

- **Frontend**: http://localhost:80
- **Backend API**: http://localhost:8080/api
- **Base de Datos**: localhost:5432

> ℹ️ **Nota**: Las credenciales de administrador se configuran durante la instalación. Consulta el archivo `README-LOCAL.md` para detalles específicos del entorno local.

## 🧪 Testing

### Tests Unitarios Backend
```bash
cd backend
mvn test
mvn test -Dtest=UsuarioServiceTest
```

### Tests Frontend
```bash
cd frontend
npm test                    # Tests unitarios
npm run test:coverage      # Con coverage
npm run test:ui            # Interfaz visual
```

### Tests E2E
```bash
cd frontend
npm run test:e2e           # Tests Playwright
npm run test:e2e:ui        # Interfaz visual
```

### Suite Completa de Tests
```bash
# Backend
docker compose exec backend mvn test

# Frontend  
docker compose exec frontend npm test

# E2E (requiere aplicación corriendo)
npm run test:e2e
```

## 📁 Estructura del Proyecto

```
web-paso-centurion-tours/
├── frontend/                 # Aplicación React
│   ├── src/
│   │   ├── components/      # Componentes React
│   │   ├── contexts/        # Context API
│   │   ├── pages/           # Páginas principales
│   │   ├── services/        # Servicios API
│   │   ├── utils/           # Utilidades
│   │   └── tests/           # Tests unitarios
│   ├── tests/               # Tests E2E (Playwright)
│   ├── Dockerfile
│   └── package.json
│
├── backend/                 # API Spring Boot
│   ├── src/
│   │   ├── main/java/com/tinambu/tours/
│   │   │   ├── controller/  # Controladores REST
│   │   │   ├── service/     # Lógica de negocio
│   │   │   ├── entity/      # Entidades JPA
│   │   │   ├── repository/  # Repositorios
│   │   │   ├── security/    # Configuración JWT
│   │   │   └── config/      # Configuraciones
│   │   └── test/            # Tests unitarios
│   ├── Dockerfile
│   └── pom.xml
│
├── database/                # Scripts de BD
├── .github/workflows/       # GitHub Actions
├── docker-compose.yml       # Orquestación Docker
├── setup-application.sh     # Script de configuración
└── README.md
```

## 🔧 Comandos Útiles

### Docker
```bash
# Iniciar aplicación
docker compose up -d

# Ver logs
docker compose logs -f [servicio]

# Parar aplicación
docker compose down

# Reconstruir imágenes
docker compose build --no-cache

# Estado de contenedores
docker compose ps
```

### Base de Datos
```bash
# Conectar a PostgreSQL
docker compose exec postgres psql -U postgres -d tinambu_tours

# Backup
docker compose exec postgres pg_dump -U postgres tinambu_tours > backup.sql

# Restore
docker compose exec -T postgres psql -U postgres tinambu_tours < backup.sql
```

### Desarrollo
```bash
# Frontend en modo desarrollo
cd frontend && npm run dev

# Backend en modo desarrollo
cd backend && mvn spring-boot:run

# Linting
npm run lint                # Frontend
mvn checkstyle:check        # Backend
```

## 🔐 Configuración de Seguridad

### Variables de Entorno
Las variables de entorno se configuran en el archivo `.env`. Ver `env.example` para referencia y `README-LOCAL.md` para configuración específica del entorno de desarrollo.

### Endpoints de API

#### Públicos
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/signup` - Registrarse
- `GET /api/habitaciones` - Listar habitaciones
- `GET /api/senderos` - Listar senderos
- `GET /api/guias` - Listar guías

#### Protegidos (Requieren JWT)
- `GET /api/reservas/mis-reservas` - Mis reservas
- `POST /api/reservas` - Crear reserva

#### Admin (Requieren rol ADMIN)
- `GET /admin/**` - Panel administrativo
- `PUT /api/reservas/admin/**` - Gestión de reservas
- `DELETE /api/**` - Eliminar recursos

## 🚦 CI/CD

### GitHub Actions
- **CI/CD Principal** (`.github/workflows/ci-cd.yml`)
  - Build y test frontend/backend
  - Validación de código
  - Deploy automático

- **Seguridad** (`.github/workflows/security.yml`)
  - Análisis de vulnerabilidades
  - Audit de dependencias
  - Escaneo con Snyk

- **Testing** (`.github/workflows/test.yml`)
  - Suite completa de tests
  - Coverage reports
  - Tests E2E

### Secrets Requeridos
Para configuración de CI/CD, consultar documentación de deployment y `README-LOCAL.md` para detalles específicos.

## 🐛 Troubleshooting

### Problemas Comunes

**Puerto en uso**
```bash
# Verificar puertos ocupados
lsof -i :80 -i :8080 -i :5432

# Cambiar puertos en docker-compose.yml
```

**Error de conexión a BD**
```bash
# Verificar estado de PostgreSQL
docker compose logs postgres

# Reiniciar base de datos
docker compose restart postgres
```

**Error 401 en login**
```bash
# Verificar JWT secret
echo $JWT_SECRET

# Revisar logs del backend
docker compose logs backend | grep -i error
```

**Frontend no carga**
```bash
# Verificar build del frontend
docker compose logs frontend

# Reconstruir imagen
docker compose build frontend --no-cache
```

### Logs de Debug
```bash
# Habilitar logs detallados
export LOG_LEVEL=DEBUG
export SHOW_SQL=true

# Ver logs en tiempo real
docker compose logs -f backend frontend
```

## 🤝 Contribución

1. Fork el proyecto
2. Crear feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

### Estándares de Código
- **Frontend**: ESLint + Prettier
- **Backend**: Checkstyle + SpotBugs
- **Tests**: Cobertura mínima 80%
- **Commits**: Conventional Commits

## 📄 Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 👥 Equipo

- **Desarrollo Full-Stack**: [Tu Nombre]
- **DevOps**: [Tu Nombre]
- **Testing**: [Tu Nombre]

## 📞 Soporte

Para soporte técnico o preguntas:
- **Email**: soporte@tinambu.com
- **Issues**: [GitHub Issues](link-to-issues)
- **Documentación**: [Wiki](link-to-wiki)

---

**¡Gracias por contribuir al ecoturismo sostenible! 🌿🦅**