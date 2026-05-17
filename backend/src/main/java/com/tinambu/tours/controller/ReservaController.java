package com.tinambu.tours.controller;

import com.tinambu.tours.dto.request.AdminReservaAlojamientoRequest;
import com.tinambu.tours.dto.request.AdminReservaSenderoRequest;
import com.tinambu.tours.dto.request.AlojamientoReservaRequest;
import com.tinambu.tours.dto.request.ReservaRequest;
import com.tinambu.tours.dto.response.AlojamientoReservaResponse;
import com.tinambu.tours.dto.response.ApiResponse;
import com.tinambu.tours.dto.response.DisponibilidadSenderoResponse;
import com.tinambu.tours.dto.response.ReservaResponse;
import com.tinambu.tours.entity.sendero.TurnoSendero;
import com.tinambu.tours.entity.usuario.Usuario;
import com.tinambu.tours.exception.SinDisponibilidadException;
import com.tinambu.tours.service.ReservaService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/reservas")
@CrossOrigin(origins = "*")
public class ReservaController {

    private static final Logger log = LoggerFactory.getLogger(ReservaController.class);

    @Autowired
    private ReservaService reservaService;

    // ==================== PUBLIC ENDPOINTS ====================

    @PostMapping("/sendero")
    public ResponseEntity<?> crearReservaSendero(@Valid @RequestBody ReservaRequest request) {
        try {
            log.info("POST /reservas/sendero - Creating sendero reservation");
            ReservaResponse response = reservaService.crearReservaSendero(request);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success(response, "Reserva de sendero creada exitosamente"));
        } catch (SinDisponibilidadException e) {
            log.warn("No availability for sendero reservation: {}", e.getMessage());
            // Return structured 409 so the frontend can show alternatives
            Map<String, Object> body = new HashMap<>();
            body.put("error", e.getMessage());
            body.put("alternativas", e.getAlternativas());
            return ResponseEntity.status(HttpStatus.CONFLICT).body(body);
        } catch (IllegalArgumentException e) {
            log.warn("Validation error creating sendero reservation: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("Error creating sendero reservation", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error interno al crear reserva: " + e.getMessage()));
        }
    }

    /**
     * Public availability check — called from the booking sidebar before checkout.
     * Never exposes guide names or internal data.
     * GET /reservas/sendero/disponibilidad?senderoId=X&fecha=YYYY-MM-DD&turno=MANANA|TARDE
     */
    @GetMapping("/sendero/disponibilidad")
    public ResponseEntity<?> checkDisponibilidad(
            @RequestParam UUID senderoId,
            @RequestParam String fecha,
            @RequestParam String turno) {
        try {
            log.info("GET /reservas/sendero/disponibilidad - sendero={} fecha={} turno={}", senderoId, fecha, turno);
            LocalDate fechaDate = LocalDate.parse(fecha);
            TurnoSendero turnoEnum = TurnoSendero.valueOf(turno.toUpperCase());
            DisponibilidadSenderoResponse response =
                    reservaService.verificarDisponibilidadSendero(senderoId, fechaDate, turnoEnum);
            return ResponseEntity.ok(ApiResponse.success(response, "Disponibilidad consultada"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("Error checking sendero availability", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al consultar disponibilidad"));
        }
    }

    @PostMapping("/alojamiento")
    public ResponseEntity<?> crearReservaAlojamiento(@Valid @RequestBody AlojamientoReservaRequest request) {
        try {
            log.info("POST /reservas/alojamiento - Creating alojamiento reservation");
            AlojamientoReservaResponse response = reservaService.crearReservaAlojamiento(request);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success(response, "Reserva de alojamiento creada exitosamente"));
        } catch (IllegalArgumentException e) {
            log.warn("Validation error creating alojamiento reservation: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("Error creating alojamiento reservation", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error interno al crear reserva: " + e.getMessage()));
        }
    }

    @GetMapping("/sendero/codigo/{codigo}")
    public ResponseEntity<?> obtenerReservaSenderoPorCodigo(@PathVariable String codigo) {
        try {
            log.info("GET /reservas/sendero/codigo/{} - Getting sendero reservation", codigo);
            ReservaResponse response = reservaService.obtenerReservaSenderoPorCodigo(codigo);
            return ResponseEntity.ok(ApiResponse.success(response, "Reserva encontrada"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/sendero/email/{email}")
    public ResponseEntity<?> obtenerReservasSenderoPorEmail(@PathVariable String email) {
        log.info("GET /reservas/sendero/email/{} - Getting sendero reservations", email);
        List<ReservaResponse> reservas = reservaService.obtenerReservasSenderoPorEmail(email);
        return ResponseEntity.ok(ApiResponse.success(reservas, "Reservas encontradas"));
    }

    @GetMapping("/alojamiento/email/{email}")
    public ResponseEntity<?> obtenerReservasAlojamientoPorEmail(@PathVariable String email) {
        log.info("GET /reservas/alojamiento/email/{} - Getting alojamiento reservations", email);
        List<AlojamientoReservaResponse> reservas = reservaService.obtenerReservasAlojamientoPorEmail(email);
        return ResponseEntity.ok(ApiResponse.success(reservas, "Reservas encontradas"));
    }

    /**
     * Cancelación solicitada por el usuario titular desde "Mis reservas".
     * No hay reembolso; el reagendamiento se coordina con el operador (hasta 2 meses).
     * Valida ownership por email y libera los bloqueos asociados.
     *
     * Body opcional: { "motivo": "texto libre" }
     */
    @PutMapping("/usuario/{id}/cancelar")
    public ResponseEntity<?> cancelarReservaUsuario(@PathVariable UUID id,
                                                    @RequestParam String tipo,
                                                    @RequestBody(required = false) Map<String, String> body,
                                                    Authentication authentication) {
        try {
            log.info("PUT /reservas/usuario/{}/cancelar - tipo={}", id, tipo);
            String email = resolveEmailUsuarioOrNull(authentication);
            if (email == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("Necesitas iniciar sesión para cancelar la reserva"));
            }
            String motivo = body != null ? body.get("motivo") : null;
            reservaService.cancelarReservaPorUsuario(id, tipo, email, motivo);
            return ResponseEntity.ok(ApiResponse.success("Reserva cancelada correctamente"));
        } catch (IllegalStateException e) {
            log.warn("State error cancelling reservation {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (IllegalArgumentException e) {
            log.warn("Validation error cancelling reservation {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("Error cancelling reservation {} for user", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al cancelar la reserva: " + e.getMessage()));
        }
    }

    private String resolveEmailUsuarioOrNull(Authentication authentication) {
        Authentication auth = authentication != null
                ? authentication
                : SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return null;
        }
        Object principal = auth.getPrincipal();
        if (principal instanceof Usuario usuario) {
            return usuario.getEmail();
        }
        if (principal instanceof UserDetails ud) {
            return ud.getUsername();
        }
        String name = auth.getName();
        if (name == null || name.isBlank() || "anonymousUser".equalsIgnoreCase(name)) {
            return null;
        }
        return name;
    }

    // ==================== ADMIN ENDPOINTS ====================

    /**
     * Admin-side manual sendero booking (e.g. walk-in, phone, customer who can't use the website).
     * Skips the public lead-time restriction. Cupos and guide availability are still validated.
     */
    @PostMapping("/admin/sendero")
    public ResponseEntity<?> crearReservaSenderoAdmin(@Valid @RequestBody AdminReservaSenderoRequest request) {
        try {
            log.info("POST /reservas/admin/sendero - Creating manual sendero reservation");
            ReservaResponse response = reservaService.crearReservaSenderoAdmin(request);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success(response, "Reserva de sendero creada exitosamente"));
        } catch (SinDisponibilidadException e) {
            log.warn("[ADMIN] No availability for sendero reservation: {}", e.getMessage());
            Map<String, Object> body = new HashMap<>();
            body.put("error", e.getMessage());
            body.put("alternativas", e.getAlternativas());
            return ResponseEntity.status(HttpStatus.CONFLICT).body(body);
        } catch (IllegalArgumentException e) {
            log.warn("[ADMIN] Validation error creating sendero reservation: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("[ADMIN] Error creating sendero reservation", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error interno al crear reserva: " + e.getMessage()));
        }
    }

    /** Admin-side manual alojamiento booking. */
    @PostMapping("/admin/alojamiento")
    public ResponseEntity<?> crearReservaAlojamientoAdmin(@Valid @RequestBody AdminReservaAlojamientoRequest request) {
        try {
            log.info("POST /reservas/admin/alojamiento - Creating manual alojamiento reservation");
            AlojamientoReservaResponse response = reservaService.crearReservaAlojamientoAdmin(request);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success(response, "Reserva de alojamiento creada exitosamente"));
        } catch (IllegalArgumentException e) {
            log.warn("[ADMIN] Validation error creating alojamiento reservation: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("[ADMIN] Error creating alojamiento reservation", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error interno al crear reserva: " + e.getMessage()));
        }
    }

    @PutMapping("/admin/{id}/confirmar-sendero")
    public ResponseEntity<?> confirmarReservaSendero(@PathVariable UUID id) {
        try {
            log.info("PUT /reservas/admin/{}/confirmar-sendero", id);
            ReservaResponse response = reservaService.confirmarReservaSendero(id);
            return ResponseEntity.ok(ApiResponse.success(response, "Reserva de sendero confirmada"));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/admin/{id}/confirmar-alojamiento")
    public ResponseEntity<?> confirmarReservaAlojamiento(@PathVariable UUID id) {
        try {
            log.info("PUT /reservas/admin/{}/confirmar-alojamiento", id);
            AlojamientoReservaResponse response = reservaService.confirmarReservaAlojamiento(id);
            return ResponseEntity.ok(ApiResponse.success(response, "Reserva de alojamiento confirmada"));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/admin/{id}/cancelar-sendero")
    public ResponseEntity<?> cancelarReservaSendero(@PathVariable UUID id) {
        try {
            log.info("PUT /reservas/admin/{}/cancelar-sendero", id);
            reservaService.cancelarReservaSendero(id);
            return ResponseEntity.ok(ApiResponse.success("Reserva de sendero cancelada"));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/admin/{id}/cancelar-alojamiento")
    public ResponseEntity<?> cancelarReservaAlojamiento(@PathVariable UUID id) {
        try {
            log.info("PUT /reservas/admin/{}/cancelar-alojamiento", id);
            reservaService.cancelarReservaAlojamiento(id);
            return ResponseEntity.ok(ApiResponse.success("Reserva de alojamiento cancelada"));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/admin/senderos")
    public ResponseEntity<?> obtenerTodasReservasSendero() {
        log.info("GET /reservas/admin/senderos - Getting all sendero reservations");
        List<ReservaResponse> reservas = reservaService.obtenerTodasReservasSendero();
        return ResponseEntity.ok(ApiResponse.success(reservas, "Reservas de sendero obtenidas"));
    }

    @GetMapping("/admin/alojamientos")
    public ResponseEntity<?> obtenerTodasReservasAlojamiento() {
        log.info("GET /reservas/admin/alojamientos - Getting all alojamiento reservations");
        List<AlojamientoReservaResponse> reservas = reservaService.obtenerTodasReservasAlojamiento();
        return ResponseEntity.ok(ApiResponse.success(reservas, "Reservas de alojamiento obtenidas"));
    }

    @GetMapping("/admin/estadisticas")
    public ResponseEntity<?> obtenerEstadisticas() {
        log.info("GET /reservas/admin/estadisticas - Getting reservation statistics");
        Map<String, Object> stats = reservaService.obtenerEstadisticas();
        return ResponseEntity.ok(ApiResponse.success(stats, "Estadísticas obtenidas"));
    }

    @GetMapping("/admin/sendero/{id}")
    public ResponseEntity<?> obtenerReservaSenderoPorId(@PathVariable UUID id) {
        try {
            ReservaResponse response = reservaService.obtenerReservaSenderoPorId(id);
            return ResponseEntity.ok(ApiResponse.success(response, "Reserva encontrada"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/admin/alojamiento/{id}")
    public ResponseEntity<?> obtenerReservaAlojamientoPorId(@PathVariable UUID id) {
        try {
            AlojamientoReservaResponse response = reservaService.obtenerReservaAlojamientoPorId(id);
            return ResponseEntity.ok(ApiResponse.success(response, "Reserva encontrada"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/admin/{id}/estado-alojamiento")
    public ResponseEntity<?> actualizarEstadoAlojamiento(@PathVariable UUID id,
                                                          @RequestBody Map<String, String> body) {
        try {
            String nuevoEstado = body.get("estado");
            log.info("PUT /reservas/admin/{}/estado-alojamiento - nuevo estado: {}", id, nuevoEstado);
            AlojamientoReservaResponse response = reservaService.actualizarEstadoAlojamiento(id, nuevoEstado);
            return ResponseEntity.ok(ApiResponse.success(response, "Estado actualizado"));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/admin/{id}/estado-sendero")
    public ResponseEntity<?> actualizarEstadoSendero(@PathVariable UUID id,
                                                      @RequestBody Map<String, String> body) {
        try {
            String nuevoEstado = body.get("estado");
            log.info("PUT /reservas/admin/{}/estado-sendero - nuevo estado: {}", id, nuevoEstado);
            ReservaResponse response = reservaService.actualizarEstadoSendero(id, nuevoEstado);
            return ResponseEntity.ok(ApiResponse.success(response, "Estado actualizado"));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/admin/{id}/estado-pago-alojamiento")
    public ResponseEntity<?> actualizarEstadoPagoAlojamiento(@PathVariable UUID id,
                                                              @RequestBody Map<String, Object> body) {
        try {
            String estadoPago = (String) body.get("estadoPago");
            Number montoPagadoNum = (Number) body.get("montoPagado");
            java.math.BigDecimal montoPagado = montoPagadoNum != null ?
                    new java.math.BigDecimal(montoPagadoNum.toString()) : null;
            log.info("PUT /reservas/admin/{}/estado-pago-alojamiento - estadoPago: {}, montoPagado: {}", id, estadoPago, montoPagado);
            AlojamientoReservaResponse response = reservaService.actualizarEstadoPagoAlojamiento(id, estadoPago, montoPagado);
            return ResponseEntity.ok(ApiResponse.success(response, "Estado de pago actualizado"));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/admin/{id}/estado-pago-sendero")
    public ResponseEntity<?> actualizarEstadoPagoSendero(@PathVariable UUID id,
                                                          @RequestBody Map<String, Object> body) {
        try {
            String estadoPago = (String) body.get("estadoPago");
            Number montoPagadoNum = (Number) body.get("montoPagado");
            java.math.BigDecimal montoPagado = montoPagadoNum != null ?
                    new java.math.BigDecimal(montoPagadoNum.toString()) : null;
            log.info("PUT /reservas/admin/{}/estado-pago-sendero - estadoPago: {}, montoPagado: {}", id, estadoPago, montoPagado);
            ReservaResponse response = reservaService.actualizarEstadoPagoSendero(id, estadoPago, montoPagado);
            return ResponseEntity.ok(ApiResponse.success(response, "Estado de pago actualizado"));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/admin/{id}/posponer-sendero")
    public ResponseEntity<?> posponerSendero(@PathVariable UUID id,
                                              @RequestBody Map<String, String> body) {
        try {
            String nuevaFechaStr = body.get("nuevaFecha");
            String turnoStr = body.get("turno");
            LocalDate nuevaFecha = LocalDate.parse(nuevaFechaStr);
            TurnoSendero turno = turnoStr != null ? TurnoSendero.valueOf(turnoStr.toUpperCase()) : null;
            log.info("PUT /reservas/admin/{}/posponer-sendero - nuevaFecha: {}, turno: {}", id, nuevaFecha, turno);
            ReservaResponse response = reservaService.posponerSendero(id, nuevaFecha, turno);
            return ResponseEntity.ok(ApiResponse.success(response, "Reserva pospuesta exitosamente"));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/admin/{id}/posponer-alojamiento")
    public ResponseEntity<?> posponerAlojamiento(@PathVariable UUID id,
                                                  @RequestBody Map<String, String> body) {
        try {
            String checkInStr = body.get("nuevaFechaCheckIn");
            String checkOutStr = body.get("nuevaFechaCheckOut");
            LocalDate nuevaFechaCheckIn = LocalDate.parse(checkInStr);
            LocalDate nuevaFechaCheckOut = LocalDate.parse(checkOutStr);
            log.info("PUT /reservas/admin/{}/posponer-alojamiento - checkIn: {}, checkOut: {}", id, nuevaFechaCheckIn, nuevaFechaCheckOut);
            AlojamientoReservaResponse response = reservaService.posponerAlojamiento(id, nuevaFechaCheckIn, nuevaFechaCheckOut);
            return ResponseEntity.ok(ApiResponse.success(response, "Reserva pospuesta exitosamente"));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
}
