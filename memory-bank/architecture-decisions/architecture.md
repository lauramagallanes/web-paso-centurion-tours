# Architecture – Tinambú Paso Centurión Tours

## Backend Architecture (Spring Boot)

### Layered Architecture (N-tier)
- **Controller Layer**: Handles HTTP requests/responses.
- **Service Layer**: Contains business logic, validation, and orchestration.
- **Repository Layer**: Interfaces for data persistence using Spring Data JPA.
- **Entity Layer**: Maps database tables to Java classes.
- **DTO Layer**: Manages API input/output without exposing internal models.

### Reservation Domain
There are two distinct reservation types, each with specific logic:

#### Lodging Reservation
- **Unit**: per person, per night
- **Min/Max**: Minimum 2, maximum 4 people per room
- **Price**: 1500 UYU per person per night
- **Exclusive**: Once booked for given dates, room is fully blocked

#### Trail Reservation
- **Unit**: per person, per day
- **Guide constraint**: Only one trail per time slot (morning/afternoon) per day per guide
- **Group merging**: Allowed if group limit (defined when trail is created) is not exceeded
- **Slot blocking**: Blocks the guide for that time slot

A **Reservation Factory** and optional **Strategy pattern** are used to encapsulate the logic per reservation type.

### RESTful API Design
- Follows resource-based endpoints and HTTP standards (GET, POST, PUT, DELETE)

### Database
- PostgreSQL hosted on AWS EC2
- Entities: User, Reserva, Habitacion, Sendero, Guía, etc.
- Guide availability is tracked to prevent double bookings per slot

### Deployment
- Dockerized backend deployed on AWS EC2
- Nginx used as reverse proxy
- Media assets stored in S3 (room and trail photos)

---

## Frontend Architecture (React + TypeScript)

### Component-Based Architecture
- Presentational and container components for reusability and clarity

### State Management
- **Context API** used for:
  - Authentication
  - Booking state
  - Admin session state

### Routing
- React Router for SPA structure

### Forms
- Controlled components with basic validation
- Optional use of libraries like React Hook Form for complex inputs

---

This architecture balances clarity, domain specificity, and future scalability while supporting business rules unique to nature tourism and lodging reservations.