# Tinambú – Paso Centurión Tours

Plataforma web para turismo ecológico y observación de aves en Paso Centurión, Uruguay.

## 🏗️ Arquitectura del Proyecto

### Backend (Spring Boot + Java)
- **Arquitectura en capas**: Controller, Service, Repository, Entity, DTO
- **Patrones de diseño**: Factory y Strategy para diferentes tipos de reservas
- **Base de datos**: PostgreSQL
- **Autenticación**: JWT + Spring Security
- **Contenedorización**: Docker

### Frontend (React + TypeScript)
- **Arquitectura basada en componentes**
- **Gestión de estado**: Context API
- **Enrutamiento**: React Router
- **Estilos**: Bootstrap + CSS personalizado

## 📁 Estructura del Proyecto

```
web-paso-centurion-tours/
├── backend/                    # Aplicación Spring Boot
│   ├── src/main/java/com/tinambu/tours/
│   │   ├── controller/         # Controladores REST
│   │   ├── service/           # Lógica de negocio
│   │   ├── repository/        # Acceso a datos
│   │   ├── entity/           # Entidades JPA
│   │   ├── dto/              # Data Transfer Objects
│   │   ├── factory/          # Factory patterns
│   │   ├── strategy/         # Strategy patterns
│   │   └── config/           # Configuraciones
│   ├── src/main/resources/    # Recursos de configuración
│   └── Dockerfile            # Configuración Docker backend
├── frontend/                  # Aplicación React
│   ├── src/
│   │   ├── components/       # Componentes reutilizables
│   │   ├── pages/           # Páginas de la aplicación
│   │   ├── contexts/        # Context API
│   │   ├── hooks/           # Custom hooks
│   │   ├── services/        # Servicios API
│   │   └── utils/           # Utilidades
│   └── Dockerfile           # Configuración Docker frontend
├── memory-bank/             # Documentación del proyecto
└── docker-compose.yml      # Orquestación de servicios
```

## 🚀 Configuración y Desarrollo

### Prerrequisitos
- Java 17+
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL (si no usas Docker)

### Configuración del Entorno

1. **Copiar variables de entorno**:
   ```bash
   cp env.example .env
   ```

2. **Configurar variables en `.env`**:
   - Configuración de base de datos
   - Clave secreta JWT
   - Puertos de aplicación

### Desarrollo Local

#### Backend (Spring Boot)
```bash
cd backend
mvn clean install
mvn spring-boot:run
```

#### Frontend (React)
```bash
cd frontend
npm install
npm run dev
```

### Desarrollo con Docker

```bash
# Construir y ejecutar todos los servicios
docker compose up --build

# Solo base de datos
docker compose up postgres

# Backend + Base de datos
docker compose up postgres backend
```

## 🏨 Dominio de Reservas

### Tipos de Reserva

#### Reserva de Alojamiento
- **Unidad**: por persona, por noche
- **Capacidad**: mínimo 2, máximo 4 personas por habitación
- **Precio**: 1500 UYU por persona por noche
- **Exclusividad**: La habitación se bloquea completamente para las fechas seleccionadas

#### Reserva de Senderos
- **Unidad**: por persona, por día
- **Restricción de guía**: Solo un sendero por turno (mañana/tarde) por día por guía
- **Agrupación**: Permitida si no se excede el límite del grupo (definido al crear el sendero)
- **Bloqueo**: Bloquea al guía para ese turno específico

## 🔐 Autenticación y Autorización

- **Usuarios visitantes**: Pueden realizar reservas sin registro
- **Administradores**: Acceso completo al panel de administración
- **JWT**: Tokens para sesiones de administrador
- **Spring Security**: Protección de endpoints del backend

## 📊 Panel de Administración

### Funcionalidades
- Gestión de reservas (ver, confirmar, cancelar)
- Administración de habitaciones (crear, editar, deshabilitar)
- Administración de senderos y actividades
- Gestión de guías y disponibilidad
- Reportes de ocupación y ingresos

## 🌍 Despliegue en Producción

### AWS Infrastructure
- **EC2**: Hosting de aplicación y base de datos
- **S3**: Almacenamiento de imágenes (habitaciones, senderos)
- **Nginx**: Reverse proxy y servidor web
- **Docker**: Contenedorización de servicios

### Comandos de Despliegue

```bash
# Construcción para producción
docker compose -f docker-compose.prod.yml up --build

# Backup de base de datos
docker exec tinambu-postgres pg_dump -U postgres tinambu_tours > backup.sql
```

## 🧪 Testing

### Backend
```bash
cd backend
mvn test
```

### Frontend
```bash
cd frontend
npm test
```

## 📝 Contribución

1. Seguir la arquitectura en capas establecida
2. Implementar patrones de diseño apropiados
3. Mantener la documentación actualizada en `memory-bank/`
4. Escribir tests para nueva funcionalidad
5. Validar configuraciones Docker antes de commit

## 📞 Contacto

Para más información sobre el proyecto Tinambú – Paso Centurión Tours, contactar al equipo de desarrollo.