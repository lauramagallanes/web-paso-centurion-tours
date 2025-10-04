# Alojamiento Implementation Plan – Tinambú Paso Centurión Tours

## Objective
Implement a complete accommodation (alojamiento) management system with multiple image support, occupancy management, availability tracking, and advanced booking system with check-in/check-out functionality, based on the existing infrastructure and following the established architecture patterns.

## Infrastructure Requirements
This plan assumes the following infrastructure is already configured (see `infrastructure-implementation-plan.md`):
- ✅ **S3 bucket** configured for image storage
- ✅ **Environment variables**: `AWS_S3_BUCKET_NAME`, `AWS_REGION`
- ✅ **IAM role** with S3 permissions
- ✅ **MCP AWS client** configured in application

## 🏠 Accommodation Availability System Overview

### **How Accommodation Blocking Works**

When a user makes a reservation for an accommodation, the system automatically blocks the accommodation for the entire date range (check-in to check-out), making it unavailable for overlapping bookings:

#### **Example Scenario:**
1. **Accommodation Setup**: "Habitación Surucuá" is available:
   - **Date Range**: 1-30 septiembre 2025
   - **Capacity**: min 2, max 4 personas
   - **Features**: 1 cama doble, 1 litera
   - **Check-in**: 15:00, Check-out: 11:00

2. **Reservation Made**: User books for **5-8 septiembre** (3 nights) with 3 personas

3. **Automatic Blocking**: System creates `AlojamientoReservaBloqueo` records:
   - Accommodation blocked for **5, 6, 7, 8 septiembre**
   - Unavailable for any overlapping bookings during this period
   - Available again from **9 septiembre** onwards

#### **System Behavior:**
- ✅ **On Reservation**: Automatically blocks accommodation for entire date range
- ✅ **On Cancellation**: Automatically removes blocks and restores availability
- ✅ **On Query**: `verificarDisponibilidad()` excludes blocked dates
- ✅ **Real-time Updates**: Availability checks always consider current blocks

#### **Database Impact:**
- `alojamiento_reserva_bloqueos` table tracks all active blocks per date
- Indexed by `alojamiento_id` and `fecha` for fast queries
- Linked to `reserva_id` for automatic cleanup on cancellation

## Current State Analysis
- ❌ Missing: Complete alojamiento system implementation
- ✅ Backend: Basic infrastructure exists (S3, database connections)
- ✅ Frontend: Admin panel structure and authentication system
- ❌ Missing: Alojamiento entities, controllers, services, and frontend components

## Implementation Steps

### Phase 1: Database Schema Creation

#### Step 1.1: Create Alojamiento Entity
- **File**: `backend/src/main/java/com/tinambu/tours/entity/alojamiento/Alojamiento.java`
- **Fields**:
  - `id` (UUID, primary key)
  - `nombre` (String, not null) - accommodation name
  - `descripcion` (String) - detailed description
  - `ubicacion` (String) - location/address
  - `capacidadMinima` (Integer, not null) - minimum occupancy
  - `capacidadMaxima` (Integer, not null) - maximum occupancy
  - `cantidadCamasDobles` (Integer, default 0) - number of double beds
  - `cantidadLiteras` (Integer, default 0) - number of bunk beds/cuchetas
  - `horaLlegada` (LocalTime, not null) - check-in time (e.g., 15:00)
  - `horaSalida` (LocalTime, not null) - check-out time (e.g., 11:00)
  - `precioPorNoche` (BigDecimal, not null) - price per night
  - `imagenPrincipal` (String) - main image URL
  - `activo` (Boolean, default true) - if accommodation is active
  - `fechaCreacion` (LocalDateTime)
  - `fechaActualizacion` (LocalDateTime)
- **Relationships**:
  - `@OneToMany` to `AlojamientoImagen` entity
  - `@OneToMany` to `AlojamientoDisponibilidad` entity
- **Business Methods**:
  - `calcularPrecioTotal(int noches, int personas)` - calculate total price
  - `validarCapacidad(int personas)` - validate occupancy limits
  - `puedeAcomodar(int personas)` - check if can accommodate number of people
  - `obtenerCapacidadCamas()` - calculate total bed capacity

#### Step 1.2: Create AlojamientoImagen Entity
- **File**: `backend/src/main/java/com/tinambu/tours/entity/alojamiento/AlojamientoImagen.java`
- **Fields**:
  - `id` (UUID, primary key)
  - `alojamientoId` (UUID, foreign key)
  - `urlImagen` (String, S3 URL)
  - `descripcion` (String, optional)
  - `orden` (Integer, display order)
  - `esPrincipal` (Boolean, main image flag)
  - `fechaSubida` (LocalDateTime)

#### Step 1.3: Create AlojamientoDisponibilidad Entity
- **File**: `backend/src/main/java/com/tinambu/tours/entity/alojamiento/AlojamientoDisponibilidad.java`
- **Fields**:
  - `id` (UUID, primary key)
  - `alojamientoId` (UUID, foreign key to Alojamiento)
  - `fechaInicio` (LocalDate) - start date of availability range
  - `fechaFin` (LocalDate) - end date of availability range
  - `activo` (Boolean) - if this availability is active
  - `fechaCreacion` (LocalDateTime)
  - `fechaActualizacion` (LocalDateTime)

#### Step 1.4: Create AlojamientoReservaBloqueo Entity (Accommodation Blocking System)
- **File**: `backend/src/main/java/com/tinambu/tours/entity/alojamiento/AlojamientoReservaBloqueo.java`
- **Purpose**: Track when an accommodation is blocked due to existing reservations
- **Fields**:
  - `id` (UUID, primary key)
  - `alojamientoId` (UUID, foreign key to Alojamiento)
  - `reservaId` (UUID, foreign key to Reserva)
  - `fecha` (LocalDate) - blocked date
  - `activo` (Boolean) - if block is still active
  - `fechaCreacion` (LocalDateTime)

#### Step 1.5: Create AlojamientoReserva Entity
- **File**: `backend/src/main/java/com/tinambu/tours/entity/reserva/AlojamientoReserva.java`
- **Extends**: `Reserva` (inheritance)
- **Fields**:
  - `alojamientoId` (UUID, foreign key to Alojamiento)
  - `fechaCheckIn` (LocalDate, not null) - check-in date
  - `fechaCheckOut` (LocalDate, not null) - check-out date
  - `numeroNoches` (Integer, calculated) - number of nights
  - `numeroHuespedes` (Integer, not null) - number of guests
  - `observacionesEspeciales` (String) - special requests/notes
- **Business Methods**:
  - `calcularNumeroNoches()` - calculate nights between check-in and check-out
  - `validarFechas()` - validate check-in is before check-out
  - `calcularPrecioTotal()` - override base method for accommodation pricing

#### Step 1.6: Create Database Migration Scripts
- **File**: `database/init/06_alojamientos.sql`
- Create `alojamientos` table with all fields and constraints
- Create `alojamiento_imagenes` table
- Create `alojamiento_disponibilidad` table
- Create `alojamiento_reserva_bloqueos` table
- Add foreign key constraints and indexes for performance
- Add sample data for testing

### Phase 2: Backend Repository Layer

#### Step 2.1: Create AlojamientoRepository
- **File**: `backend/src/main/java/com/tinambu/tours/repository/AlojamientoRepository.java`
- **Methods**:
  - `findByActivoTrue()` - get all active accommodations
  - `findByCapacidadMinimiaLessThanEqualAndCapacidadMaximaGreaterThanEqual(int personas, int personas)` - find by capacity
  - `findByNombreContainingIgnoreCase(String nombre)` - search by name

#### Step 2.2: Create AlojamientoImagenRepository
- **File**: `backend/src/main/java/com/tinambu/tours/repository/AlojamientoImagenRepository.java`
- **Methods**:
  - `findByAlojamientoIdOrderByOrden(UUID alojamientoId)` - get images by accommodation
  - `findByAlojamientoIdAndEsPrincipalTrue(UUID alojamientoId)` - get main image

#### Step 2.3: Create AlojamientoDisponibilidadRepository
- **File**: `backend/src/main/java/com/tinambu/tours/repository/AlojamientoDisponibilidadRepository.java`
- **Methods**:
  - `findByAlojamientoIdAndActivoTrue(UUID alojamientoId)` - get availability ranges
  - `findByAlojamientoIdAndFechaInicioLessThanEqualAndFechaFinGreaterThanEqualAndActivoTrue()` - check date overlap

#### Step 2.4: Create AlojamientoReservaBloqueoRepository
- **File**: `backend/src/main/java/com/tinambu/tours/repository/AlojamientoReservaBloqueoRepository.java`
- **Methods**:
  - `findByAlojamientoIdAndFechaAndActivoTrue(UUID alojamientoId, LocalDate fecha)` - check if date is blocked
  - `findByReservaIdAndActivoTrue(UUID reservaId)` - get blocks for reservation
  - `findByAlojamientoIdAndFechaBetweenAndActivoTrue()` - get blocks for date range

#### Step 2.5: Create AlojamientoReservaRepository
- **File**: `backend/src/main/java/com/tinambu/tours/repository/AlojamientoReservaRepository.java`
- **Methods**:
  - `findByAlojamientoIdAndEstado(UUID alojamientoId, EstadoReserva estado)` - find reservations by status
  - `findByFechaCheckInBetween(LocalDate inicio, LocalDate fin)` - find reservations by check-in date

### Phase 3: Backend Service Layer

#### Step 3.1: Create AlojamientoService
- **File**: `backend/src/main/java/com/tinambu/tours/service/AlojamientoService.java`
- **Core Methods**:
  - `crearAlojamiento(AlojamientoRequest request)` - create new accommodation
  - `actualizarAlojamiento(UUID id, AlojamientoRequest request)` - update accommodation
  - `obtenerAlojamientos()` - get all active accommodations
  - `obtenerAlojamientoPorId(UUID id)` - get accommodation by ID
  - `eliminarAlojamiento(UUID id)` - soft delete accommodation
- **Image Management Methods**:
  - `agregarImagen(UUID alojamientoId, MultipartFile file, String descripcion)`
  - `eliminarImagen(UUID imagenId)`
  - `establecerImagenPrincipal(UUID imagenId)`  
  - `actualizarOrdenImagenes(UUID alojamientoId, List<UUID> imageIds)`
- **Availability Methods**:
  - `crearDisponibilidad(AlojamientoDisponibilidadRequest request)`
  - `actualizarDisponibilidad(UUID disponibilidadId, AlojamientoDisponibilidadRequest request)`
  - `eliminarDisponibilidad(UUID disponibilidadId)`
  - `verificarDisponibilidad(UUID alojamientoId, LocalDate checkIn, LocalDate checkOut)` - **excludes blocked dates**
  - `obtenerFechasDisponibles(UUID alojamientoId, LocalDate mesInicio, LocalDate mesFin)` - get available dates for calendar
- **Booking Methods**:
  - `calcularPrecio(UUID alojamientoId, LocalDate checkIn, LocalDate checkOut, int huespedes)`
  - `obtenerAlojamientosDisponibles(LocalDate checkIn, LocalDate checkOut, int huespedes)`
- **Blocking System Methods**:
  - `bloquearAlojamientoParaReserva(UUID alojamientoId, UUID reservaId, LocalDate checkIn, LocalDate checkOut)`
  - `desbloquearAlojamientoDeReserva(UUID reservaId)` - remove blocks when reservation cancelled

#### Step 3.2: Update ReservaService for Alojamiento Integration
- **File**: `backend/src/main/java/com/tinambu/tours/service/ReservaService.java`
- **Add Methods**:
  - `crearReservaAlojamiento(AlojamientoReservaRequest request)` - **automatically blocks accommodation**
  - `cancelarReservaAlojamiento(UUID reservaId)` - **automatically unblocks accommodation**
  - `confirmarReservaAlojamiento(UUID reservaId)` - **ensures accommodation remains blocked**

### Phase 4: Backend Controller Layer

#### Step 4.1: Create AlojamientoController
- **File**: `backend/src/main/java/com/tinambu/tours/controller/AlojamientoController.java`
- **Public Endpoints**:
  - `GET /alojamientos` - get all active accommodations
  - `GET /alojamientos/{id}` - get accommodation details
  - `POST /alojamientos/{id}/calcular-precio` - calculate price for dates/guests
  - `POST /alojamientos/{id}/verificar-disponibilidad` - check availability for booking
  - `GET /alojamientos/{id}/fechas-disponibles` - get available dates for calendar
  - `GET /alojamientos/buscar` - search accommodations by criteria
- **Admin Endpoints** (secured):
  - `POST /alojamientos` - create new accommodation
  - `PUT /alojamientos/{id}` - update accommodation
  - `DELETE /alojamientos/{id}` - delete accommodation
  - `POST /alojamientos/{id}/imagenes` - upload images
  - `DELETE /alojamientos/imagenes/{imagenId}` - delete image
  - `PUT /alojamientos/imagenes/{imagenId}/principal` - set main image
  - `POST /alojamientos/{id}/disponibilidad` - create availability range
  - `PUT /alojamientos/{id}/disponibilidad/{disponibilidadId}` - update availability
  - `DELETE /alojamientos/{id}/disponibilidad/{disponibilidadId}` - delete availability

#### Step 4.2: Update ReservaController for Alojamiento Reservations
- **File**: `backend/src/main/java/com/tinambu/tours/controller/ReservaController.java`
- **Add Endpoints**:
  - `POST /reservas/alojamiento` - create accommodation reservation
  - `GET /reservas/alojamiento/{alojamientoId}` - get reservations for accommodation
  - `PUT /reservas/alojamiento/{reservaId}/check-in` - register check-in (admin)
  - `PUT /reservas/alojamiento/{reservaId}/check-out` - register check-out (admin)

### Phase 5: Backend DTOs

#### Step 5.1: Create Request DTOs
- **File**: `backend/src/main/java/com/tinambu/tours/dto/request/AlojamientoRequest.java`
- **Fields**:
  - `nombre`, `descripcion`, `ubicacion`
  - `capacidadMinima`, `capacidadMaxima`
  - `cantidadCamasDobles`, `cantidadLiteras`
  - `horaLlegada`, `horaSalida`
  - `precioPorNoche`

- **File**: `backend/src/main/java/com/tinambu/tours/dto/request/AlojamientoDisponibilidadRequest.java`
- **Fields**:
  - `alojamientoId`, `fechaInicio`, `fechaFin`

- **File**: `backend/src/main/java/com/tinambu/tours/dto/request/AlojamientoReservaRequest.java`
- **Fields**:
  - `alojamientoId`, `fechaCheckIn`, `fechaCheckOut`
  - `numeroHuespedes`, `observacionesEspeciales`
  - User contact information (inherited from base ReservaRequest)

- **File**: `backend/src/main/java/com/tinambu/tours/dto/request/AlojamientoPrecioCalculoRequest.java`
- **Fields**:
  - `alojamientoId`, `fechaCheckIn`, `fechaCheckOut`, `numeroHuespedes`

#### Step 5.2: Create Response DTOs
- **File**: `backend/src/main/java/com/tinambu/tours/dto/response/AlojamientoResponse.java`
- **Fields**:
  - `id`, `nombre`, `descripcion`, `ubicacion`
  - `capacidadMinima`, `capacidadMaxima`
  - `cantidadCamasDobles`, `cantidadLiteras`
  - `horaLlegada`, `horaSalida`
  - `precioPorNoche`
  - `imagenPrincipal` (String)
  - `imagenes` (List<AlojamientoImagenResponse>)
  - `totalImagenes` (Integer)
  - `tieneGaleria` (Boolean)

- **File**: `backend/src/main/java/com/tinambu/tours/dto/response/AlojamientoImagenResponse.java`
- **Fields**:
  - `id`, `url`, `descripcion`, `orden`, `esPrincipal`

- **File**: `backend/src/main/java/com/tinambu/tours/dto/response/AlojamientoPrecioCalculoResponse.java`
- **Fields**:
  - `precioBasePorNoche`, `numeroNoches`, `precioTotal`
  - `fechaCheckIn`, `fechaCheckOut`
  - `numeroHuespedes`, `capacidadMaxima`

- **File**: `backend/src/main/java/com/tinambu/tours/dto/response/AlojamientoDisponibilidadResponse.java`
- **Fields**:
  - `fechasDisponibles` (List<LocalDate>)
  - `fechaInicio`, `fechaFin`
  - `alojamientoId`

- **File**: `backend/src/main/java/com/tinambu/tours/dto/response/AlojamientoReservaResponse.java`
- **Fields**:
  - Base reservation fields (inherited)
  - `alojamientoNombre`, `fechaCheckIn`, `fechaCheckOut`
  - `numeroNoches`, `numeroHuespedes`
  - `precioTotal`, `observacionesEspeciales`

### Phase 6: Frontend Infrastructure

#### Step 6.1: Update API Service
- **File**: `frontend/src/services/apiService.ts`
- **Add Methods**:
  - `getAlojamientos()` - get all accommodations
  - `getAlojamientoById(id: string)` - get accommodation details
  - `calculateAlojamientoPrice(alojamientoId: string, checkIn: string, checkOut: string, guests: number)`
  - `checkAlojamientoAvailability(alojamientoId: string, checkIn: string, checkOut: string)`
  - `getAlojamientoAvailableDates(alojamientoId: string, month: string, year: string)`
  - `searchAlojamientos(criteria: any)` - search with filters
  - `createAlojamientoReservation(reservationData: any)` - book accommodation
- **Admin Methods**:
  - `createAlojamiento(alojamientoData: any)`
  - `updateAlojamiento(id: string, alojamientoData: any)`
  - `deleteAlojamiento(id: string)`
  - `uploadAlojamientoImages(alojamientoId: string, files: FileList)`
  - `deleteAlojamientoImage(imageId: string)`
  - `setAlojamientoMainImage(imageId: string)`
  - `createAlojamientoAvailability(availabilityData: any)`
  - `updateAlojamientoAvailability(availabilityId: string, availabilityData: any)`

#### Step 6.2: Create Accommodation Card Component
- **File**: `frontend/src/components/common/AccommodationCard.tsx`
- **Features**:
  - Display accommodation main image
  - Show accommodation name and capacity info
  - Display price per night
  - Show bed configuration (double beds + bunk beds)
  - Heart icon for favorites (future feature)
  - Click handler to navigate to details page
  - **Lazy loading** for images
  - Responsive design matching the prototype

- **File**: `frontend/src/components/common/AccommodationCard.css`
- **Styling to match prototype**:
  - Card layout with image and info sections
  - Capacity indicators with person icons
  - Price display in bottom section
  - Hover effects and transitions

#### Step 6.3: Create Date Range Picker Component
- **File**: `frontend/src/components/common/DateRangePicker.tsx`
- **Features**:
  - Modal popup with dual calendar view
  - Check-in and check-out date selection
  - Visual indication of selected range
  - Month navigation with arrows
  - **Real-time availability checking** - disabled dates are grayed out
  - "Guardar" button to confirm selection
  - **Debounced API calls** (300ms) for availability checking
  - Minimum 1 night requirement validation
  - Future dates only validation

- **File**: `frontend/src/components/common/DateRangePicker.css`
- **Styling to match prototype**:
  - Side-by-side calendar months
  - Date range highlighting
  - Disabled date styling
  - Mobile responsive design

#### Step 6.4: Create Guest Selector Component
- **File**: `frontend/src/components/common/GuestSelector.tsx`
- **Features**:
  - Modal popup for guest count selection
  - Number input/counter with +/- buttons
  - Min/max capacity validation based on accommodation
  - Visual capacity indicators (bed icons)
  - "Guardar" button to confirm selection
  - Real-time price updates when guest count changes

#### Step 6.5: Create Accommodation Details Page
- **File**: `frontend/src/pages/public/AccommodationDetails.tsx`
- **Features**:
  - **Hero Section**: Main image with gallery grid (4 images visible)
  - **"Ver todas las fotos"** overlay on 4th image if more images exist
  - **Image lightbox/modal** for full gallery view
  - **Accommodation Information Card**:
    - Name, description, location
    - Capacity (min-max guests)
    - Bed configuration with icons
    - Check-in/check-out times
  - **Interactive Booking Section**:
    - Date range picker for check-in/check-out
    - Guest counter with capacity validation
    - **Real-time price calculation** (debounced 500ms)
    - **Price breakdown**: nights × price per night
    - "Reservar Ahora" and "Agregar al carrito" buttons
  - **Features & Amenities Section** (if applicable)
  - **Location Information** (if applicable)
  - **Related Accommodations** recommendations
  - **Breadcrumb Navigation**: Home > Alojamientos > [Accommodation Name]

- **File**: `frontend/src/pages/public/AccommodationDetails.css`
- **Styling to match prototype**:
  - Hero image layout with gallery grid
  - Information cards layout
  - Booking section with form elements
  - Responsive design for mobile/tablet

#### Step 6.6: Create Accommodations Page
- **File**: `frontend/src/pages/public/Accommodations.tsx`
- **Features**:
  - Grid layout of accommodation cards
  - **Search and filters** (capacity, price range, date availability)
  - **Pagination** for large result sets
  - **Loading states** and error handling
  - **Empty state** when no accommodations match criteria
  - Link to accommodation details page

- **File**: `frontend/src/pages/public/Accommodations.css`
- **Styling**:
  - Grid layout responsive to screen size
  - Filter sidebar/dropdown for mobile
  - Search bar styling

#### Step 6.7: Update Home Page
- **File**: `frontend/src/pages/public/Home.tsx`
- **Add Featured Accommodations Section**:
  - Display top 3-4 accommodations
  - Use AccommodationCard component
  - "Ver todos los alojamientos" link
  - Fetch real data from API

### Phase 7: Admin Panel Implementation

#### Step 7.1: Create Accommodation Management Page
- **File**: `frontend/src/pages/admin/AccommodationManagement.tsx`
- **Features**:
  - **Accommodation List Table**:
    - Name, capacity, price, status columns
    - Action buttons (edit, delete, manage images, availability)
    - Search and filter functionality
  - **Create/Edit Accommodation Modal**:
    - Form with all accommodation fields
    - Capacity validation (min ≤ max)
    - Time pickers for check-in/check-out
    - Image upload interface
  - **Image Management Section**:
    - Drag & drop image upload (max 10 images)
    - Image gallery with reorder functionality
    - Set main image option
    - Delete images with confirmation
  - **Availability Management Section**:
    - Create availability date ranges
    - Visual calendar showing availability overview
    - Edit/delete existing ranges
    - **Conflict detection** for overlapping ranges

- **File**: `frontend/src/pages/admin/AccommodationManagement.css`
- **Styling**:
  - Table layout with action buttons
  - Modal forms styling
  - Image management interface
  - Calendar component styling

#### Step 7.2: Update Admin Dashboard
- **File**: `frontend/src/pages/admin/Dashboard.tsx`
- **Add Accommodation Metrics**:
  - Total accommodations count
  - **Occupancy rate** current month
  - **Revenue from accommodations** current/previous month
  - **Upcoming check-ins/check-outs** today/tomorrow
  - **Most booked accommodations** (top 3)
  - **Average stay duration**

#### Step 7.3: Update Reservation Management
- **File**: `frontend/src/pages/admin/ReservationManagement.tsx`
- **Add Accommodation Features**:
  - Separate tab/filter for accommodation reservations
  - Display check-in/check-out dates
  - Show guest count and accommodation details
  - **Check-in/Check-out buttons** for day-of operations
  - **Accommodation calendar view** showing occupancy
  - Payment tracking specific to accommodation stays

#### Step 7.4: Create Admin API Hook
- **File**: `frontend/src/hooks/useAdminApi.ts`
- **Add Methods**:
  - `createAlojamiento`, `updateAlojamiento`, `deleteAlojamiento`
  - `uploadAlojamientoImages`, `deleteAlojamientoImage`, `setMainImage`
  - `createAvailability`, `updateAvailability`, `deleteAvailability`
  - `getAlojamientoReservations`, `processCheckIn`, `processCheckOut`
  - `getOccupancyStats`, `getRevenueStats`

### Phase 8: Routing and Navigation

#### Step 8.1: Add Routes
- **File**: `frontend/src/utils/routes.ts`
- **Add Routes**:
  - `accommodations: '/alojamientos'`
  - `accommodationDetails: '/alojamientos/:id'`
  - `adminAccommodations: '/admin/alojamientos'`

#### Step 8.2: Update App Router
- **File**: `frontend/src/App.tsx`
- Add routes for:
  - Accommodations listing page
  - Accommodation details page
  - Admin accommodation management

#### Step 8.3: Update Navigation
- **File**: `frontend/src/components/layout/Header.tsx`
- Add "Alojamientos" link to main navigation
- Update mobile navigation menu

- **File**: `frontend/src/components/admin/AdminSidebar.tsx`
- Add "Gestión de Alojamientos" link
- Add accommodation metrics to dashboard summary

### Phase 9: Integration with Existing Systems

#### Step 9.1: Update Cart Context
- **File**: `frontend/src/contexts/CartContext.tsx`
- **Add Support for Accommodation Items**:
  - `addAccommodationToCart(accommodationId, checkIn, checkOut, guests, price)`
  - Handle accommodation-specific cart item type
  - Update cart total calculations
  - Conflict detection for same accommodation different dates

#### Step 9.2: Update Booking Context
- **File**: `frontend/src/contexts/BookingContext.tsx`
- **Add Accommodation Booking Flow**:
  - `startAccommodationBooking(accommodationData)`
  - Handle accommodation-specific booking state
  - Manage check-in/check-out date validation
  - Guest count validation

#### Step 9.3: Update Reservation System
- **Integration with existing payment system**
- **Email notifications** for accommodation bookings
- **Calendar integration** for admin

### Phase 10: Database Migrations and Sample Data

#### Step 10.1: Create Migration Scripts
- **File**: `database/init/06_alojamientos.sql`
- Create all accommodation-related tables
- Add constraints and indexes
- **Include sample accommodation data** for testing:
  - "Habitación Surucuá" (2-4 guests, 1 double bed, 1 bunk bed)
  - "Cabaña Familiar" (4-6 guests, 2 double beds)
  - "Habitación Doble" (2 guests, 1 double bed)

#### Step 10.2: Add Foreign Key Constraints
- Link accommodation reservations to base reservation system
- Link image tables with proper cascading deletes
- Add indexes for performance on frequent queries

### Phase 11: Testing and Validation

#### Step 11.1: Backend Testing
- **Unit Tests**:
  - AlojamientoService test methods
  - Availability calculation logic
  - Price calculation accuracy
  - Blocking system functionality
- **Integration Tests**:
  - Full booking flow with database
  - Image upload and management
  - API endpoint testing

#### Step 11.2: Frontend Testing
- **Component Tests**:
  - AccommodationCard component
  - DateRangePicker validation
  - GuestSelector capacity limits
- **End-to-End Tests with Playwright**:
  - Complete accommodation booking flow
  - Admin accommodation creation and management
  - Image upload and gallery functionality
  - Availability calendar interaction

#### Step 11.3: API Contract Testing
- **OpenAPI 3.0 specification** generation
- **Contract tests** for all accommodation endpoints
- **Request/response schema validation**

### Phase 12: Performance and Optimization

#### Step 12.1: Image Optimization
- **Lazy loading** for accommodation images
- **WebP format** support with fallbacks
- **Image compression** before S3 upload
- **CDN integration** for faster image delivery

#### Step 12.2: Database Optimization
- **Query optimization** for availability checks
- **Database indexes** on frequently queried fields
- **Connection pooling** configuration

#### Step 12.3: Frontend Performance
- **Code splitting** for accommodation pages
- **Debounced API calls** for real-time features
- **Memoization** of expensive calculations
- **Virtual scrolling** for large accommodation lists

## File Dependencies Map

### Backend Files to Create:

**New Entities:**
1. `entity/alojamiento/Alojamiento.java` (new)
2. `entity/alojamiento/AlojamientoImagen.java` (new)
3. `entity/alojamiento/AlojamientoDisponibilidad.java` (new)
4. `entity/alojamiento/AlojamientoReservaBloqueo.java` (new)
5. `entity/reserva/AlojamientoReserva.java` (new)

**New Repositories:**
6. `repository/AlojamientoRepository.java` (new)
7. `repository/AlojamientoImagenRepository.java` (new)
8. `repository/AlojamientoDisponibilidadRepository.java` (new)
9. `repository/AlojamientoReservaBloqueoRepository.java` (new)
10. `repository/AlojamientoReservaRepository.java` (new)

**New Services & Controllers:**
11. `service/AlojamientoService.java` (new)
12. `controller/AlojamientoController.java` (new)

**New DTOs:**
13. `dto/request/AlojamientoRequest.java` (new)
14. `dto/request/AlojamientoDisponibilidadRequest.java` (new)
15. `dto/request/AlojamientoReservaRequest.java` (new)
16. `dto/request/AlojamientoPrecioCalculoRequest.java` (new)
17. `dto/response/AlojamientoResponse.java` (new)
18. `dto/response/AlojamientoImagenResponse.java` (new)
19. `dto/response/AlojamientoPrecioCalculoResponse.java` (new)
20. `dto/response/AlojamientoDisponibilidadResponse.java` (new)
21. `dto/response/AlojamientoReservaResponse.java` (new)

**Updated Services:**
22. `service/ReservaService.java` (update - add accommodation integration)

**Database Migrations:**
23. `database/init/06_alojamientos.sql` (new)

### Frontend Files to Create:

**New Public Components:**
1. `components/common/AccommodationCard.tsx` (new)
2. `components/common/AccommodationCard.css` (new)
3. `components/common/DateRangePicker.tsx` (new)
4. `components/common/DateRangePicker.css` (new)
5. `components/common/GuestSelector.tsx` (new)
6. `components/common/GuestSelector.css` (new)

**New Public Pages:**
7. `pages/public/Accommodations.tsx` (new)
8. `pages/public/Accommodations.css` (new)
9. `pages/public/AccommodationDetails.tsx` (new)
10. `pages/public/AccommodationDetails.css` (new)

**New Admin Pages:**
11. `pages/admin/AccommodationManagement.tsx` (new)
12. `pages/admin/AccommodationManagement.css` (new)

**Updated Pages:**
13. `pages/public/Home.tsx` (update - add featured accommodations)
14. `pages/admin/Dashboard.tsx` (update - add accommodation metrics)
15. `pages/admin/ReservationManagement.tsx` (update - add accommodation features)

**Updated Services & Contexts:**
16. `services/apiService.ts` (update - add accommodation methods)
17. `hooks/useAdminApi.ts` (update - add accommodation admin methods)
18. `contexts/CartContext.tsx` (update - add accommodation support)
19. `contexts/BookingContext.tsx` (update - add accommodation booking)

**Updated Configuration:**
20. `utils/routes.ts` (update - add accommodation routes)
21. `App.tsx` (update - add accommodation routes)
22. `components/layout/Header.tsx` (update - add navigation)
23. `components/admin/AdminSidebar.tsx` (update - add admin navigation)

**New Testing Files:**
24. `tests/e2e/accommodation-booking.spec.ts` (new)
25. `tests/e2e/accommodation-admin.spec.ts` (new)

### Configuration Files to Update:
1. `backend/src/main/resources/application.yml` (accommodation-specific config)
2. `env.example` (accommodation image limits)

## Success Criteria
- ✅ Admin can create accommodations with all required fields
- ✅ Admin can set min/max occupancy and bed configuration
- ✅ Admin can upload up to 10 images per accommodation
- ✅ Admin can set availability date ranges
- ✅ Public users can view accommodation cards as per prototype design
- ✅ Public users can view detailed accommodation information
- ✅ Users can select check-in/check-out dates with calendar picker
- ✅ Users can select guest count with capacity validation
- ✅ Date ranges are properly blocked when reservations are made
- ✅ Real-time price calculation based on nights and guests
- ✅ Responsive design works on all devices
- ✅ Integration with existing booking and payment systems
- ✅ Performance optimized for image loading and availability checking

## Estimated Timeline
- **Phase 1 (Database Schema)**: 3-4 days
- **Phase 2-3 (Backend Repositories & Services)**: 4-5 days
- **Phase 4-5 (Controllers & DTOs)**: 3-4 days
- **Phase 6 (Frontend Infrastructure)**: 8-10 days
- **Phase 7 (Admin Panel)**: 5-6 days
- **Phase 8-9 (Routing & Integration)**: 3-4 days
- **Phase 10 (Database & Sample Data)**: 2 days
- **Phase 11-12 (Testing & Performance)**: 4-5 days
- **Total**: 32-41 days

## Risk Mitigation
- **Date validation** to prevent invalid check-in/check-out combinations
- **Capacity validation** to ensure guest count doesn't exceed accommodation limits
- **Availability conflicts** properly handled with blocking system
- **Image upload limits** and format validation
- **Performance monitoring** for availability calculations
- **Database transaction management** for booking operations
- **Error handling** for all external API calls
- **Fallback handling** for missing images or unavailable dates

## Implementation Priority
1. **High Priority**: Core accommodation CRUD, availability system, basic booking flow
2. **Medium Priority**: Image management, admin interface, advanced filtering
3. **Low Priority**: Performance optimizations, advanced analytics, mobile app integration
