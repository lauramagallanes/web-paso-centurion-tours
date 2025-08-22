# Senderos Implementation Plan – Tinambú Paso Centurión Tours

## Objective
Update the frontend, backend, and database to fully implement the senderos (activities/trails) feature with multiple image support, advanced booking system, and guide management, based on the existing Sendero entity and the provided visual prototype.

## Infrastructure Requirements
This plan assumes the following infrastructure is already configured (see `infrastructure-implementation-plan.md`):
- ✅ **S3 bucket** configured for image storage
- ✅ **Environment variables**: `AWS_S3_BUCKET_NAME`, `AWS_REGION`
- ✅ **IAM role** with S3 permissions
- ✅ **MCP AWS client** configured in application

## 🔒 Guide Blocking System Overview

### **How Guide Blocking Works**

When a user makes a reservation for a sendero, the system automatically blocks the assigned guide for that specific date and shift across **ALL senderos** where they were available:

#### **Example Scenario:**
1. **Guide Setup**: Laura Magallanes is available for:
   - **Sendero Río Yaguarón**: 25-29 agosto, turno matutino
   - **Sendero Cerro Artigas**: 25-29 agosto, turno matutino  
   - **Sendero Laguna Negra**: 25-29 agosto, turno matutino

2. **Reservation Made**: User books **Río Yaguarón** for **27 agosto, turno matutino** with Laura

3. **Automatic Blocking**: System creates `GuiaReservaBloqueo` records:
   - Laura blocked for **27 agosto, turno matutino** across ALL senderos
   - She becomes unavailable for Cerro Artigas and Laguna Negra on that date/shift
   - She remains available for other dates and the afternoon shift

#### **System Behavior:**
- ✅ **On Reservation**: Automatically blocks guide across all senderos
- ✅ **On Cancellation**: Automatically removes blocks and restores availability  
- ✅ **On Query**: `obtenerGuiasDisponibles()` excludes blocked guides
- ✅ **Real-time Updates**: Availability checks always consider current blocks

#### **Database Impact:**
- `guia_reserva_bloqueos` table tracks all active blocks
- Indexed by `guia_id`, `fecha`, and `turno` for fast queries
- Linked to `reserva_id` for automatic cleanup on cancellation

## Current State Analysis
- ✅ Backend: Sendero entity, SenderoController, SenderoService, and repository are implemented
- ✅ Frontend: Basic Activities page exists with sample data and basic ActivityCard component
- ✅ Database: Senderos table exists with basic structure
- ❌ Missing: Multiple images support, sendero details page, proper data flow, booking system

## Implementation Steps

### Phase 1: Database Schema Updates

#### Step 1.1: Update Sendero Entity for Multiple Images and Guide Assignment
- **File**: `backend/src/main/java/com/tinambu/tours/entity/sendero/Sendero.java`
- **Changes**:
  - Remove single `urlImagen` field
  - Add `@OneToMany` relationship to new `SenderoImagen` entity
  - Add `imagenPrincipal` field (URL to main image)
  - Add `galeria` field (boolean to indicate if has gallery)
  - Add `@ManyToMany` relationship with Guia entity for guide assignments
  - Add `guiasAsignados` field (Set<Guia>) - guides that can lead this sendero
  - Add `requiereGuiaEspecializado` field (Boolean) - if requires specialized guide
  - Add business methods for price calculations with children discounts:
    - `calcularPrecioConDescuentos(int adultos, int ninos)` - 30% discount for children under 12
    - `calcularDescuentoGrupo(int totalPersonas)` - 10% discount for groups over 10
  - Add methods for guide management:
    - `asignarGuia(Guia guia)` - assign guide to sendero
    - `removerGuia(Guia guia)` - remove guide from sendero
    - `puedeSerGuiadoPor(Guia guia)` - check if guide can lead this sendero

#### Step 1.2: Create SenderoImagen Entity
- **File**: `backend/src/main/java/com/tinambu/tours/entity/sendero/SenderoImagen.java`
- **Fields**:
  - `id` (UUID, primary key)
  - `senderoId` (UUID, foreign key)
  - `urlImagen` (String, S3 URL)
  - `descripcion` (String, optional)
  - `orden` (Integer, display order)
  - `esPrincipal` (Boolean, main image flag)
  - `fechaSubida` (LocalDateTime)

#### Step 1.3: Update Guia Entity for Sendero Relationship
- **File**: `backend/src/main/java/com/tinambu/tours/entity/guia/Guia.java`
- **Changes**:
  - Add `@ManyToMany` relationship with Sendero entity (mappedBy = "guiasAsignados")
  - Add `senderosAsignados` field (Set<Sendero>) - senderos this guide can lead
  - Add `tarifaEspecial` field (BigDecimal) - special rate if applicable
  - Add methods:
    - `puedeGuiar(Sendero sendero)` - check if can guide specific sendero
    - `estaDisponibleEn(LocalDate fecha, TurnoSendero turno)` - check against existing reservations

#### Step 1.3a: Create SenderoDisponibilidad Entity
- **File**: `backend/src/main/java/com/tinambu/tours/entity/sendero/SenderoDisponibilidad.java`
- **Fields**:
  - `id` (UUID, primary key)
  - `senderoId` (UUID, foreign key to Sendero)
  - `fechaInicio` (LocalDate) - start date of availability range
  - `fechaFin` (LocalDate) - end date of availability range
  - `turnoManana` (Boolean) - available in morning shift
  - `turnoTarde` (Boolean) - available in afternoon shift
  - `activo` (Boolean) - if this availability is active
  - `fechaCreacion` (LocalDateTime)
  - `fechaActualizacion` (LocalDateTime)

#### Step 1.3b: Create SenderoDisponibilidadGuia Entity (Join Table)
- **File**: `backend/src/main/java/com/tinambu/tours/entity/sendero/SenderoDisponibilidadGuia.java`
- **Fields**:
  - `id` (UUID, primary key)
  - `senderoDisponibilidadId` (UUID, foreign key to SenderoDisponibilidad)
  - `guiaId` (UUID, foreign key to Guia)
  - `activo` (Boolean) - if this guide assignment is active
  - `fechaAsignacion` (LocalDateTime)

#### Step 1.3c: Create GuiaReservaBloqueo Entity (Guide Blocking System)
- **File**: `backend/src/main/java/com/tinambu/tours/entity/guia/GuiaReservaBloqueo.java`
- **Purpose**: Track when a guide is blocked due to existing reservations
- **Fields**:
  - `id` (UUID, primary key)
  - `guiaId` (UUID, foreign key to Guia)
  - `reservaId` (UUID, foreign key to Reserva)
  - `fecha` (LocalDate) - blocked date
  - `turno` (TurnoSendero) - blocked shift (MANANA/TARDE)
  - `senderoReservado` (String) - name of sendero that caused the block
  - `activo` (Boolean) - if block is still active
  - `fechaCreacion` (LocalDateTime)

#### Step 1.3d: Update Sendero Entity Relationships
- **File**: `backend/src/main/java/com/tinambu/tours/entity/sendero/Sendero.java`
- **Add**:
  - `@OneToMany` relationship to `SenderoDisponibilidad`
  - Methods:
    - `agregarDisponibilidad(LocalDate inicio, LocalDate fin, boolean manana, boolean tarde, List<Guia> guias)`
    - `estaDisponibleEn(LocalDate fecha, TurnoSendero turno)` - check availability
    - `obtenerGuiasDisponiblesEn(LocalDate fecha, TurnoSendero turno)` - get available guides (excluding blocked)

#### Step 1.4: Create Sendero Availability Tables
- **File**: `database/init/03_senderos_availability.sql`
- Create `sendero_disponibilidad` table:
  - `id` (UUID, primary key)
  - `sendero_id` (UUID, FK to senderos)
  - `fecha_inicio` (DATE, not null)
  - `fecha_fin` (DATE, not null)
  - `turno_manana` (BOOLEAN, default false)
  - `turno_tarde` (BOOLEAN, default false)
  - `activo` (BOOLEAN, default true)
  - `fecha_creacion` (TIMESTAMP, default now)
  - `fecha_actualizacion` (TIMESTAMP)
- Create `sendero_disponibilidad_guias` table:
  - `id` (UUID, primary key)
  - `sendero_disponibilidad_id` (UUID, FK to sendero_disponibilidad)
  - `guia_id` (UUID, FK to guias)
  - `activo` (BOOLEAN, default true)
  - `fecha_asignacion` (TIMESTAMP, default now)
- Create `guia_reserva_bloqueos` table:
  - `id` (UUID, primary key)
  - `guia_id` (UUID, FK to guias)
  - `reserva_id` (UUID, FK to reservas)
  - `fecha` (DATE, not null)
  - `turno` (VARCHAR(10), not null) -- 'MANANA' or 'TARDE'
  - `sendero_reservado` (VARCHAR(255))
  - `activo` (BOOLEAN, default true)
  - `fecha_creacion` (TIMESTAMP, default now)
- Add foreign key constraints and indexes for all tables

#### Step 1.5: Update Database Migration for Images and Payments
- **File**: `database/init/04_senderos_images.sql`
- Create `sendero_imagenes` table
- Add foreign key constraints
- Create indexes for performance

- **File**: `database/init/05_reservas_payment_fields.sql`  
- Add payment tracking columns to `reservas` table:
  - `numero_adultos`, `numero_ninos`
  - `precio_adultos`, `precio_ninos`, `descuento_grupo`
  - `monto_pagado`, `saldo_pendiente`
  - `requiere_sena`, `porcentaje_sena`
  - `fecha_limite_pago`, `metodo_pago`

### Phase 2: Update Reservation System for Adults/Children

#### Step 2.1: Update ReservaRequest for Adults/Children Support
- **File**: `backend/src/main/java/com/tinambu/tours/dto/request/ReservaRequest.java`
- **Changes**:
  - Add `numeroAdultos` field (Integer) - adults count (13+ years)
  - Add `numeroNinos` field (Integer) - children count (0-12 years)
  - Keep `numeroPersonas` as calculated field (adultos + ninos)
  - Update validation methods to ensure adultos + ninos = numeroPersonas
  - Add validation that at least 1 adult is required for sendero reservations

#### Step 2.2: Create EstadoPago Enum
- **File**: `backend/src/main/java/com/tinambu/tours/entity/reserva/EstadoPago.java` (new)
- **Values**:
  - `PENDIENTE` - no payment received
  - `PARCIAL` - partial payment (deposit) received  
  - `COMPLETO` - full payment received
- **Methods**:
  - `puedeTransicionarA(EstadoPago nuevoEstado)` - valid transitions
  - `getDescripcion()` - human-readable description

#### Step 2.3: Update Reserva Base Entity for Payment Tracking
- **File**: `backend/src/main/java/com/tinambu/tours/entity/reserva/Reserva.java`
- **Changes**:
  - Add `numeroAdultos` field (Integer) - adults count
  - Add `numeroNinos` field (Integer) - children count  
  - Add `precioAdultos` field (BigDecimal) - price for adults
  - Add `precioNinos` field (BigDecimal) - price for children
  - Add `descuentoGrupo` field (BigDecimal) - group discount amount
  - Add `montoPagado` field (BigDecimal, default 0) - amount already paid
  - Add `saldoPendiente` field (BigDecimal) - remaining balance
  - Add `estadoPago` field (EstadoPago enum, default PENDIENTE) - payment status
  - Add `requiereSeña` field (Boolean, default true) - requires deposit
  - Add `porcentajeSeña` field (BigDecimal, default 30%) - deposit percentage
  - Add `fechaLimitePago` field (LocalDate) - payment deadline
  - Add `metodoPago` field (String) - payment method used
  - Add `actualizarEstadoPago()` method - auto-update based on montoPagado vs precioTotal

#### Step 2.4: Update SenderoReserva Entity  
- **File**: `backend/src/main/java/com/tinambu/tours/entity/reserva/SenderoReserva.java`
- **Changes**:
  - Update `calcularPrecioTotal()` method to use adult/children pricing with discounts
  - Update validation to ensure at least 1 adult
  - Add method `calcularDetallePrecios()` for price breakdown

### Phase 3: Backend Service Updates

#### Step 3.1: Create Image Upload Controller
- **File**: `backend/src/main/java/com/tinambu/tours/controller/ImageController.java`
- Endpoints:
  - `POST /images/senderos/{senderoId}` - Upload multiple images
  - `DELETE /images/{imageId}` - Delete single image
  - `PUT /images/{imageId}/principal` - Set as main image
  - `PUT /images/{imageId}/orden` - Update display order

#### Step 3.2: Add Booking-specific Endpoints to SenderoController
- **File**: `backend/src/main/java/com/tinambu/tours/controller/SenderoController.java`
- Add new endpoints:
  - `POST /senderos/{senderoId}/calcular-precio` - Calculate detailed price with adults/children breakdown
  - `GET /senderos/{senderoId}/disponibilidad` - Check availability for specific dates
  - `GET /senderos/{senderoId}/guias-disponibles` - Get available guides for date/shift
  - `POST /senderos/{senderoId}/verificar-disponibilidad` - Verify availability for booking request
- Add admin endpoints for availability management:
  - `POST /senderos/{senderoId}/disponibilidad` - Create availability range (admin only)
  - `PUT /senderos/{senderoId}/disponibilidad/{disponibilidadId}` - Update availability range (admin only)
  - `DELETE /senderos/{senderoId}/disponibilidad/{disponibilidadId}` - Delete availability range (admin only)
  - `GET /senderos/{senderoId}/disponibilidad` - Get all availability ranges (admin only)
  - `GET /senderos/{senderoId}/disponibilidad/fecha/{fecha}` - Get availability for specific date (public)

#### Step 3.3: Create Payment Management Controller
- **File**: `backend/src/main/java/com/tinambu/tours/controller/PagoController.java`
- Endpoints for payment management:
  - `POST /pagos/registrar` - Register payment for reservation (admin only)
  - `GET /pagos/reserva/{reservaId}` - Get payment history for reservation
  - `PUT /pagos/{pagoId}/confirmar` - Confirm payment (admin only)
  - `GET /pagos/pendientes` - Get reservations with pending payments (admin only)

#### Step 3.4: Update ReservaController for Admin Management
- **File**: `backend/src/main/java/com/tinambu/tours/controller/ReservaController.java`
- Add admin endpoints:
  - `GET /reservas/admin/detalladas` - Get detailed reservation list with payment info
  - `PUT /reservas/{reservaId}/estado` - Update reservation status
  - `GET /reservas/admin/estadisticas` - Get reservation statistics
  - `GET /reservas/admin/pagos-pendientes` - Get reservations with pending payments

#### Step 3.8: Update SenderoService
- **File**: `backend/src/main/java/com/tinambu/tours/service/SenderoService.java`
- Add methods for image management:
  - `addImageToSendero(UUID senderoId, MultipartFile file, String descripcion)`
  - `removeImageFromSendero(UUID imageId)`
  - `setMainImage(UUID imageId)`
  - `updateImageOrder(UUID senderoId, List<UUID> imageIds)`
- Add methods for booking functionality:
  - `calcularPrecioDetallado(UUID senderoId, int adultos, int ninos, LocalDate fechaInicio, LocalDate fechaFin)`
  - `verificarDisponibilidad(UUID senderoId, LocalDate fechaInicio, LocalDate fechaFin, TurnoSendero turno)`
  - `obtenerGuiasDisponibles(UUID senderoId, LocalDate fecha, TurnoSendero turno)`
  - `obtenerSenderosRelacionados(UUID senderoId, int limite)` - for recommendations
- Add methods for availability management:
  - `crearDisponibilidad(SenderoDisponibilidadRequest request)` - create availability range
  - `actualizarDisponibilidad(UUID disponibilidadId, SenderoDisponibilidadRequest request)` - update range
  - `eliminarDisponibilidad(UUID disponibilidadId)` - delete range
  - `obtenerDisponibilidades(UUID senderoId)` - get all ranges for sendero
  - `verificarDisponibilidadEspecifica(UUID senderoId, LocalDate fecha, TurnoSendero turno)` - check specific date/shift
  - `obtenerGuiasDisponiblesParaFecha(UUID senderoId, LocalDate fecha, TurnoSendero turno)` - get available guides **excluding blocked**
- **Add methods for guide blocking system**:
  - `bloquearGuiaParaReserva(UUID guiaId, UUID reservaId, LocalDate fecha, TurnoSendero turno, String senderoNombre)` - **create block**
  - `desbloquearGuiaDeReserva(UUID reservaId)` - **remove blocks when reservation cancelled**
  - `obtenerGuiasBloqueados(LocalDate fecha, TurnoSendero turno)` - get all blocked guides for date/shift

#### Step 3.9: Create Payment Service
- **File**: `backend/src/main/java/com/tinambu/tours/service/PagoService.java`
- Methods for payment management:
  - `registrarPago(PagoRequest pagoRequest)` - register new payment
  - `obtenerHistorialPagos(UUID reservaId)` - get payment history
  - `calcularSaldoPendiente(UUID reservaId)` - calculate remaining balance
  - `marcarComoCompletamentePagado(UUID reservaId)` - mark as fully paid
  - `obtenerReservasConPagosPendientes()` - get reservations with pending payments

#### Step 3.10: Update ReservaService
- **File**: `backend/src/main/java/com/tinambu/tours/service/ReservaService.java`
- Add methods for admin management:
  - `obtenerReservasDetalladas()` - get detailed reservation list
  - `actualizarEstadoReserva(UUID reservaId, EstadoReserva nuevoEstado)`
  - `obtenerEstadisticasReservas()` - get reservation statistics
- **Add guide blocking integration**:
  - `crearReservaSendero()` - **automatically blocks assigned guide**
  - `cancelarReserva()` - **automatically unblocks guide**
  - `confirmarReserva()` - **ensures guide remains blocked**
  - `calcularIngresosPorPeriodo(LocalDate inicio, LocalDate fin)`

#### Step 3.11: Update DTOs
- **File**: `backend/src/main/java/com/tinambu/tours/dto/response/SenderoResponse.java`
- Add fields:
  - `imagenPrincipal` (String)
  - `imagenes` (List<SenderoImagenResponse>)
  - `totalImagenes` (Integer)
  - `tieneGaleria` (Boolean)

- **File**: `backend/src/main/java/com/tinambu/tours/dto/response/SenderoImagenResponse.java` (new)
- Fields:
  - `id`, `url`, `descripcion`, `orden`, `esPrincipal`

- **File**: `backend/src/main/java/com/tinambu/tours/dto/request/SenderoRequest.java`
- Update to handle image data (if needed for creation)

- **File**: `backend/src/main/java/com/tinambu/tours/dto/request/PrecioCalculoRequest.java` (new)
- Fields for detailed price calculation:
  - `senderoId` (UUID)
  - `adultos` (Integer) - adults count
  - `ninos` (Integer) - children count (0-12 years)
  - `fechaInicio` (LocalDate)
  - `fechaFin` (LocalDate)

- **File**: `backend/src/main/java/com/tinambu/tours/dto/response/PrecioCalculoResponse.java` (new)
- Fields for detailed price breakdown:
  - `precioBase` (BigDecimal) - base price per person
  - `precioAdultos` (BigDecimal) - total for adults
  - `precioNinos` (BigDecimal) - total for children (with discount)
  - `descuentoGrupo` (BigDecimal) - group discount amount
  - `precioTotal` (BigDecimal) - final total price
  - `montoSeña` (BigDecimal) - deposit amount required
  - `saldoRestante` (BigDecimal) - remaining balance after deposit
  - `detalleDescuentos` (List<String>) - discount descriptions

- **File**: `backend/src/main/java/com/tinambu/tours/dto/response/ReservaAdminResponse.java` (new)
- Fields for admin reservation management:
  - `id`, `codigoReserva`, `tipoReserva`
  - `nombreContacto`, `emailContacto`, `telefonoContacto`
  - `fechaInicio`, `fechaFin`, `numeroAdultos`, `numeroNinos`
  - `precioTotal`, `montoPagado`, `saldoPendiente`
  - `estado`, `fechaCreacion`, `fechaActualizacion`
  - `senderoNombre`, `guiaNombre` (for sendero reservations)
  - `habitacionNombre` (for accommodation reservations)
  - `requiereSeña`, `porcentajeSeña`, `fechaLimitePago`

- **File**: `backend/src/main/java/com/tinambu/tours/dto/request/PagoRequest.java` (new)
- Fields for payment processing:
  - `reservaId` (UUID)
  - `monto` (BigDecimal)
  - `metodoPago` (String) - "EFECTIVO", "TRANSFERENCIA", "MERCADO_PAGO"
  - `comprobantePago` (String) - receipt/reference number
  - `observaciones` (String)

- **File**: `backend/src/main/java/com/tinambu/tours/dto/request/SenderoDisponibilidadRequest.java` (new)
- Fields for creating availability ranges:
  - `senderoId` (UUID)
  - `fechaInicio` (LocalDate)
  - `fechaFin` (LocalDate)
  - `turnoManana` (Boolean)
  - `turnoTarde` (Boolean)
  - `guiaIds` (List<UUID>) - assigned guides for this range

- **File**: `backend/src/main/java/com/tinambu/tours/dto/response/SenderoDisponibilidadResponse.java` (new)
- Fields for displaying availability:
  - `id` (UUID)
  - `fechaInicio` (LocalDate)
  - `fechaFin` (LocalDate)
  - `turnoManana` (Boolean)
  - `turnoTarde` (Boolean)
  - `guias` (List<GuiaBasicResponse>) - assigned guides
  - `activo` (Boolean)

### Phase 4: Frontend Infrastructure Updates

#### Step 4.1: Update API Service
- **File**: `frontend/src/services/apiService.ts`
- Add methods for image management:
  - `uploadSenderoImages(senderoId: string, files: FileList)`
  - `deleteSenderoImage(imageId: string)`
  - `setSenderoMainImage(imageId: string)`
  - `updateSenderoImageOrder(senderoId: string, imageIds: string[])`
- Add methods for booking functionality:
  - `calculateSenderoPrice(senderoId: string, adults: number, children: number, startDate: string, endDate: string)` - with debounced calls
  - `calculateSenderoPriceLive(senderoId: string, adults: number, children: number)` - for real-time updates (debounced)
  - `checkSenderoAvailability(senderoId: string, startDate: string, endDate: string, shift?: string)`
  - `getAvailableGuides(senderoId: string, date: string, shift: string)`
  - `getRelatedSenderos(senderoId: string, limit?: number)`
  - `verifySenderoBooking(senderoId: string, bookingData: any)`
- Add methods for admin payment management:
  - `getDetailedReservations()` - get reservations with payment details
  - `updateReservationStatus(reservationId: string, status: string)`
  - `registerPayment(paymentData: any)` - register payment for reservation
  - `getPaymentHistory(reservationId: string)` - get payment history
  - `getPendingPayments()` - get reservations with pending payments
  - `getReservationStatistics()` - get admin statistics
- Add methods for guide management:
  - `assignGuideToSendero(senderoId: string, guiaId: string)`
  - `removeGuideFromSendero(senderoId: string, guiaId: string)`
  - `getAssignedGuides(senderoId: string)`

#### Step 4.2: Create Image Upload Components
- **File**: `frontend/src/components/common/ImageUploader.tsx`
- Features:
  - Drag & drop interface
  - Multiple file selection (max 10)
  - Image preview
  - Progress indicators
  - Validation (format, size)

- **File**: `frontend/src/components/common/ImageGallery.tsx`
- Features:
  - Grid display of images (4 visible + "Ver todas las fotos" overlay)
  - **Lazy loading** with Intersection Observer API
  - **Blur-up placeholders** for slow connections
  - Progressive image loading (low-res → high-res)
  - Lightbox/modal view for full gallery
  - Image reordering (admin)
  - Set main image (admin)
  - Error handling for failed image loads

- **File**: `frontend/src/components/common/DatePickerModal.tsx`
- Features:
  - Calendar modal interface (as shown in prototype)
  - Month navigation
  - Date selection with visual feedback
  - "Guardar" button to confirm selection
  - Responsive design

- **File**: `frontend/src/components/common/ParticipantsSelector.tsx`
- Features:
  - Modal popup for participant selection
  - Adults counter (13+ years) with +/- buttons
  - Children counter (0-12 years) with +/- buttons
  - Age indicators for each category
  - "Guardar" button to confirm selection
  - **Live backend price calculation** with 500ms debounce
  - Loading state during price calculation
  - Error handling for calculation failures

#### Step 4.3: Update ActivityCard Component
- **File**: `frontend/src/components/common/ActivityCard.tsx`
- Update to use new image structure:
  - Use `imagenPrincipal` for card image
  - Show gallery indicator if multiple images
  - Update props interface to match new SenderoResponse

#### Step 4.4: Create Sendero Details Page
- **File**: `frontend/src/pages/public/ActivityDetails.tsx`
- Features:
  - Hero section with main image and image gallery grid (4 images max visible)
  - "Ver todas las fotos" button overlay on last image if more than 4 images
  - Image lightbox/modal for full gallery view
  - Detailed sendero information section
  - Interactive booking section with:
    - Date picker modal with calendar (similar to prototype)
    - Participants selector modal with adults/children counters
    - Real-time price calculation
    - "Reservar Ahora" and "Agregar al carrito" buttons
  - Breadcrumb navigation
  - Benefits and special offers section
  - Related senderos recommendations

#### Step 4.5: Update Activities Page
- **File**: `frontend/src/pages/public/Activities.tsx`
- Update to:
  - Use real sendero data from API
  - Remove sample data fallback
  - Handle new image structure
  - Add link to details page

#### Step 4.6: Update Home Page
- **File**: `frontend/src/pages/public/Home.tsx`
- Update featured activities section:
  - Fetch real senderos from API
  - Use new image structure
  - Link to activity details

### Phase 5: Admin Panel Updates

#### Step 5.1: Update Trail Management
- **File**: `frontend/src/pages/admin/TrailManagement.tsx`
- Add image management features:
  - Image upload interface
  - Gallery management
  - Set main image
  - Reorder images
  - Delete images
- Add availability management features:
  - **Create availability ranges** with date pickers
  - **Select shifts** (morning/afternoon/both)
  - **Assign multiple guides** per range from dropdown
  - **Edit existing ranges** inline or in modal
  - **Delete ranges** with confirmation
  - **Visual calendar** showing availability overview
  - **Conflict detection** when ranges overlap

#### Step 5.2: Create Admin Dashboard
- **File**: `frontend/src/pages/admin/Dashboard.tsx` (update)
- Features:
  - **Key Metrics Cards**:
    - Nº de reservas activas (CONFIRMADA + PENDIENTE)
    - Ingresos pendientes (sum of saldoPendiente)
    - Senderos más reservados (top 5 with booking counts)
    - Reservas de hoy/esta semana
  - **Quick Actions**:
    - Ver reservas pendientes de pago
    - Confirmar reservas PENDIENTES
    - Acceso rápido a gestión de senderos
  - **Charts & Graphs**:
    - Reservas por mes (últimos 6 meses)
    - Estado de pagos (pie chart)
    - Senderos más populares (bar chart)

#### Step 5.3: Create Payment Management Page
- **File**: `frontend/src/pages/admin/PaymentManagement.tsx` (new)
- Features:
  - List all reservations with payment status
  - Filter by payment status (paid, pending, partial)
  - Register payments for reservations
  - View payment history
  - Update reservation status
  - Generate payment reports

#### Step 5.4: Update Reservation Management
- **File**: `frontend/src/pages/admin/ReservationManagement.tsx`
- Add payment tracking features:
  - Display detailed price breakdown (adults/children)
  - Show payment status and pending amounts
  - Quick payment registration
  - Payment history modal
  - Status change with payment validation

#### Step 5.5: Update Admin API Hook
- **File**: `frontend/src/hooks/useAdminApi.ts`
- Add methods for image management:
  - `uploadSenderoImages`
  - `deleteSenderoImage`
  - `setSenderoMainImage`
  - `updateSenderoImageOrder`
- Add methods for payment management:
  - `getDetailedReservations`
  - `registerPayment`
  - `updateReservationStatus`
  - `getPaymentHistory`
  - `getPendingPayments`
- Add methods for guide management:
  - `assignGuideToSendero`
  - `removeGuideFromSendero`
  - `getAssignedGuides`

### Phase 6: Routing and Navigation

#### Step 6.1: Add Activity Details Route
- **File**: `frontend/src/utils/routes.ts`
- Add route: `activityDetails: '/actividades/:id'`

#### Step 6.2: Update App Router
- **File**: `frontend/src/App.tsx`
- Add route for ActivityDetails component

#### Step 6.3: Update Navigation Links
- Update all activity cards to link to details page
- Add proper breadcrumb navigation

### Phase 7: Environment and Configuration

#### Step 7.1: Update Environment Variables
- **File**: `env.example`
- Add image configuration:
  ```
  # Image Configuration
  MAX_IMAGE_SIZE_MB=5
  MAX_IMAGES_PER_SENDERO=10
  ```

#### Step 7.2: Update Application Configuration
- **File**: `backend/src/main/resources/application.yml`
- Add image upload properties (max size, allowed formats)

### Phase 8: Testing and Validation

#### Step 8.1: Backend Testing
- Create unit tests for ImageController
- Test image upload/delete functionality
- Test sendero creation with images
- Test API endpoints
- **API Contract Testing**:
  - Add Spring REST Docs configuration
  - Generate API documentation from tests
  - Add OpenAPI 3.0 specification generation
  - Contract tests for all public endpoints
  - Validate request/response schemas

#### Step 8.2: Frontend Testing
- Test image upload component
- Test activity details page
- Test admin image management
- Test responsive design
- **End-to-End Testing with Playwright**:
  - Complete booking flow (select sendero → choose date → participants → confirm)
  - Price calculation accuracy
  - Admin reservation management flow
  - Payment registration flow
  - Image upload and gallery functionality

#### Step 8.3: Integration Testing
- Test complete flow: upload → display → manage
- Test error handling
- Test performance with multiple images

### Phase 9: UI/UX Enhancements

#### Step 9.1: Styling Updates
- **File**: `frontend/src/components/common/ActivityCard.css`
- Update card styling to match prototype
- Add image gallery indicators
- Improve responsive design

#### Step 9.2: Activity Details Styling
- **File**: `frontend/src/pages/public/ActivityDetails.css`
- Implement prototype design
- Hero image section with grid layout
- Gallery layout with "Ver todas las fotos" overlay
- Information cards and benefits section
- Interactive booking section styling

#### Step 9.3: Booking Components Styling
- **File**: `frontend/src/components/common/DatePickerModal.css`
- Calendar modal styling with month navigation
- Date selection states and hover effects
- Responsive calendar grid

- **File**: `frontend/src/components/common/ParticipantsSelector.css`
- Modal popup styling
- Counter buttons with +/- design
- Age indicators and category labels
- Price calculation display

#### Step 9.4: Admin Panel Styling
- Update admin forms for image management
- Drag & drop styling
- Image preview styling
- Progress indicators

## File Dependencies Map

### Backend Files to Create/Update:

**New Entities & DTOs:**
1. `entity/sendero/SenderoImagen.java` (new)
2. `entity/sendero/SenderoDisponibilidad.java` (new)
3. `entity/sendero/SenderoDisponibilidadGuia.java` (new)
4. `entity/guia/GuiaReservaBloqueo.java` (new) - **guide blocking system**
5. `entity/reserva/EstadoPago.java` (new)
6. `dto/response/SenderoImagenResponse.java` (new)
7. `dto/request/PrecioCalculoRequest.java` (new)
8. `dto/response/PrecioCalculoResponse.java` (new)
9. `dto/response/ReservaAdminResponse.java` (new)
10. `dto/request/PagoRequest.java` (new)
11. `dto/request/SenderoDisponibilidadRequest.java` (new)
12. `dto/response/SenderoDisponibilidadResponse.java` (new)

**New Services & Controllers:**
13. `service/PagoService.java` (new)
14. `controller/ImageController.java` (new)
15. `controller/PagoController.java` (new)
16. `repository/SenderoImagenRepository.java` (new)
17. `repository/SenderoDisponibilidadRepository.java` (new)
18. `repository/SenderoDisponibilidadGuiaRepository.java` (new)
19. `repository/GuiaReservaBloqueoRepository.java` (new) - **guide blocking queries**

**Updated Entities:**
20. `entity/sendero/Sendero.java` (update - add images, availability, price methods)
21. `entity/guia/Guia.java` (update - simplified, no complex availability)
22. `entity/reserva/Reserva.java` (update - add payment tracking fields)
23. `entity/reserva/SenderoReserva.java` (update - add adult/children logic)

**Updated Services & Controllers:**
24. `service/SenderoService.java` (update - add image, booking, availability methods + **guide blocking**)
25. `service/ReservaService.java` (update - add admin management methods + **guide blocking integration**)
26. `controller/SenderoController.java` (update - add booking & availability endpoints)
27. `controller/ReservaController.java` (update - add admin endpoints)

**Updated DTOs:**
28. `dto/response/SenderoResponse.java` (update - add image & availability fields)
29. `dto/request/SenderoRequest.java` (update - if needed)
30. `dto/request/ReservaRequest.java` (update - add adults/children fields)

**Database Migrations:**
31. `database/init/03_senderos_availability.sql` (new) - **includes guide blocking table**
32. `database/init/04_senderos_images.sql` (new)
33. `database/init/05_reservas_payment_fields.sql` (new)

### Frontend Files to Create/Update:

**New Public Pages:**
1. `pages/public/ActivityDetails.tsx` (new)
2. `pages/public/ActivityDetails.css` (new)

**New Admin Pages:**
3. `pages/admin/PaymentManagement.tsx` (new)
4. `pages/admin/PaymentManagement.css` (new)

**New Testing Files:**
5. `tests/e2e/booking-flow.spec.ts` (new) - Playwright E2E tests
6. `tests/e2e/admin-management.spec.ts` (new) - Admin flow tests

**New Components:**
7. `components/common/ImageUploader.tsx` (new)
8. `components/common/ImageGallery.tsx` (new)
9. `components/common/DatePickerModal.tsx` (new)
10. `components/common/DatePickerModal.css` (new)
11. `components/common/ParticipantsSelector.tsx` (new)
12. `components/common/ParticipantsSelector.css` (new)

**New Admin Components:**
13. `components/admin/AvailabilityManager.tsx` (new)
14. `components/admin/AvailabilityManager.css` (new)
15. `components/admin/AvailabilityCalendar.tsx` (new) - visual calendar overview
16. `components/admin/GuideSelector.tsx` (new) - multi-select guide picker

**Updated Components:**
17. `components/common/ActivityCard.tsx` (update)

**Updated Pages:**
18. `pages/public/Activities.tsx` (update)
19. `pages/public/Home.tsx` (update)
20. `pages/admin/Dashboard.tsx` (update - comprehensive metrics dashboard)
21. `pages/admin/TrailManagement.tsx` (update - add image & availability management)
22. `pages/admin/ReservationManagement.tsx` (update - add payment tracking)

**Updated Services & Hooks:**
23. `services/apiService.ts` (update - add payment & availability methods, debounced calls)
24. `hooks/useAdminApi.ts` (update - add availability management methods)

**Updated Configuration:**
25. `utils/routes.ts` (update - add new routes)
26. `App.tsx` (update - add new routes)
27. `package.json` (update - add Playwright dependency)

### Configuration Files to Update:
1. `backend/src/main/resources/application.yml` (image upload config)
2. `docker-compose.yml` (environment variables)
3. `env.example` (image variables)
4. `database/init/03_senderos_availability.sql` (new)
5. `database/init/04_senderos_images.sql` (new)
6. `database/init/05_reservas_payment_fields.sql` (new)

## Success Criteria
- ✅ Admin can upload up to 10 images per sendero
- ✅ Images are stored securely with proper organization
- ✅ Public users can view sendero details with image gallery
- ✅ Activity cards display main image and gallery indicator
- ✅ Home page shows real senderos data
- ✅ Admin can manage image order and set main image
- ✅ Responsive design works on all devices
- ✅ Performance is optimized for image loading
- ✅ Error handling for upload failures
- ✅ Integration with existing booking system

## Estimated Timeline
- **Phase 1 (Database Schema)**: 3 days (+ guide availability entities)
- **Phase 2 (Reservation System)**: 3-4 days (+ EstadoPago enum)
- **Phase 3 (Backend Services)**: 3-4 days
- **Phase 4 (Frontend Infrastructure)**: 6-7 days (+ live price calc, lazy loading)
- **Phase 5 (Admin Panel)**: 4-5 days (+ comprehensive dashboard)
- **Phase 6-7 (Routing & Config)**: 1-2 days
- **Phase 8-9 (Testing/Polish)**: 4-5 days (+ API contracts, E2E tests)
- **Total**: 24-30 days

## Risk Mitigation
- Image size and format validation to prevent issues
- Fallback handling for missing images
- Guide blocking conflicts properly handled
- Payment tracking accuracy ensured
- Progressive loading for better performance
- Backup strategy for uploaded images
