package com.tinambu.tours.controller;

import com.tinambu.tours.dto.request.AlojamientoReservaRequest;
import com.tinambu.tours.dto.request.ReservaRequest;
import com.tinambu.tours.dto.response.AlojamientoReservaResponse;
import com.tinambu.tours.dto.response.ApiResponse;
import com.tinambu.tours.dto.response.ReservaResponse;
import com.tinambu.tours.service.ReservaService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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

    // ==================== ADMIN ENDPOINTS ====================

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
}
