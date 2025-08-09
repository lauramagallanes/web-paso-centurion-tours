package com.tinambu.tours.controller;

import com.tinambu.tours.dto.request.ReservaRequest;
import com.tinambu.tours.dto.response.ApiResponse;
import com.tinambu.tours.dto.response.ReservaResponse;
import com.tinambu.tours.entity.reserva.EstadoReserva;
import com.tinambu.tours.entity.reserva.Reserva;
import com.tinambu.tours.service.ReservaService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/reservas")
@CrossOrigin(origins = {"${cors.allowed-origins}"})
public class ReservaController {

    @Autowired
    private ReservaService reservaService;

    /**
     * Crear nueva reserva
     * Endpoint público - cualquier visitante puede hacer una reserva
     */
    @PostMapping
    public ResponseEntity<ApiResponse<ReservaResponse>> crearReserva(@Valid @RequestBody ReservaRequest request) {
        try {
            Reserva reserva = reservaService.crearReserva(request);
            ReservaResponse response = convertirAResponse(reserva);
            
            return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Reserva creada exitosamente"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Error interno del servidor"));
        }
    }

    /**
     * Verificar disponibilidad sin crear reserva
     * Endpoint público
     */
    @PostMapping("/verificar-disponibilidad")
    public ResponseEntity<ApiResponse<Boolean>> verificarDisponibilidad(@Valid @RequestBody ReservaRequest request) {
        try {
            boolean disponible = reservaService.verificarDisponibilidad(request);
            String mensaje = disponible ? "Disponible" : reservaService.obtenerInformacionDisponibilidad(request);
            
            return ResponseEntity.ok(ApiResponse.success(disponible, mensaje));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Calcular precio de reserva
     * Endpoint público
     */
    @PostMapping("/calcular-precio")
    public ResponseEntity<ApiResponse<BigDecimal>> calcularPrecio(@Valid @RequestBody ReservaRequest request) {
        try {
            BigDecimal precio = reservaService.calcularPrecio(request);
            return ResponseEntity.ok(ApiResponse.success(precio, "Precio calculado exitosamente"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Obtener reserva por código
     * Endpoint público - para que los visitantes puedan consultar sus reservas
     */
    @GetMapping("/codigo/{codigoReserva}")
    public ResponseEntity<ApiResponse<ReservaResponse>> obtenerPorCodigo(@PathVariable String codigoReserva) {
        try {
            Reserva reserva = reservaService.obtenerReservaPorCodigo(codigoReserva)
                .orElseThrow(() -> new IllegalArgumentException("Reserva no encontrada"));
            
            ReservaResponse response = convertirAResponse(reserva);
            return ResponseEntity.ok(ApiResponse.success(response));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Obtener reservas por email
     * Endpoint público - para que los visitantes vean sus reservas
     */
    @GetMapping("/email/{email}")
    public ResponseEntity<ApiResponse<List<ReservaResponse>>> obtenerPorEmail(@PathVariable String email) {
        try {
            List<Reserva> reservas = reservaService.obtenerReservasPorEmail(email);
            List<ReservaResponse> responses = reservas.stream()
                .map(this::convertirAResponse)
                .collect(Collectors.toList());
            
            return ResponseEntity.ok(ApiResponse.success(responses));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Error al obtener reservas"));
        }
    }

    // ========== ENDPOINTS DE ADMINISTRACIÓN ==========

    /**
     * Obtener todas las reservas (solo administradores)
     */
    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<ReservaResponse>>> obtenerTodasLasReservas() {
        try {
            List<Reserva> reservas = reservaService.obtenerReservasActivas();
            List<ReservaResponse> responses = reservas.stream()
                .map(this::convertirAResponse)
                .collect(Collectors.toList());
            
            return ResponseEntity.ok(ApiResponse.success(responses));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Error al obtener reservas"));
        }
    }

    /**
     * Obtener reserva por ID (solo administradores)
     */
    @GetMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ReservaResponse>> obtenerPorId(@PathVariable UUID id) {
        try {
            Reserva reserva = reservaService.obtenerReservaPorId(id);
            ReservaResponse response = convertirAResponse(reserva);
            return ResponseEntity.ok(ApiResponse.success(response));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Confirmar reserva (solo administradores)
     */
    @PutMapping("/admin/{id}/confirmar")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ReservaResponse>> confirmarReserva(@PathVariable UUID id) {
        try {
            Reserva reserva = reservaService.confirmarReserva(id);
            ReservaResponse response = convertirAResponse(reserva);
            return ResponseEntity.ok(ApiResponse.success(response, "Reserva confirmada exitosamente"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Cancelar reserva (solo administradores)
     */
    @PutMapping("/admin/{id}/cancelar")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ReservaResponse>> cancelarReserva(@PathVariable UUID id) {
        try {
            Reserva reserva = reservaService.cancelarReserva(id);
            ReservaResponse response = convertirAResponse(reserva);
            return ResponseEntity.ok(ApiResponse.success(response, "Reserva cancelada exitosamente"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Completar reserva (solo administradores)
     */
    @PutMapping("/admin/{id}/completar")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ReservaResponse>> completarReserva(@PathVariable UUID id) {
        try {
            Reserva reserva = reservaService.completarReserva(id);
            ReservaResponse response = convertirAResponse(reserva);
            return ResponseEntity.ok(ApiResponse.success(response, "Reserva completada exitosamente"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Obtener reservas por estado (solo administradores)
     */
    @GetMapping("/admin/estado/{estado}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<ReservaResponse>>> obtenerPorEstado(@PathVariable EstadoReserva estado) {
        try {
            List<Reserva> reservas = reservaService.obtenerReservasPorEstado(estado);
            List<ReservaResponse> responses = reservas.stream()
                .map(this::convertirAResponse)
                .collect(Collectors.toList());
            
            return ResponseEntity.ok(ApiResponse.success(responses));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Error al obtener reservas por estado"));
        }
    }

    /**
     * Obtener reservas por rango de fechas (solo administradores)
     */
    @GetMapping("/admin/fechas")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<ReservaResponse>>> obtenerPorRangoFechas(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaInicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaFin) {
        try {
            List<Reserva> reservas = reservaService.obtenerReservasPorRangoFechas(fechaInicio, fechaFin);
            List<ReservaResponse> responses = reservas.stream()
                .map(this::convertirAResponse)
                .collect(Collectors.toList());
            
            return ResponseEntity.ok(ApiResponse.success(responses));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Error al obtener reservas por fechas"));
        }
    }

    /**
     * Obtener reservas próximas (solo administradores)
     */
    @GetMapping("/admin/proximas")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<ReservaResponse>>> obtenerReservasProximas(
            @RequestParam(defaultValue = "7") int dias) {
        try {
            List<Reserva> reservas = reservaService.obtenerReservasProximas(dias);
            List<ReservaResponse> responses = reservas.stream()
                .map(this::convertirAResponse)
                .collect(Collectors.toList());
            
            return ResponseEntity.ok(ApiResponse.success(responses));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Error al obtener reservas próximas"));
        }
    }

    /**
     * Obtener reservas pendientes (solo administradores)
     */
    @GetMapping("/admin/pendientes")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<ReservaResponse>>> obtenerReservasPendientes() {
        try {
            List<Reserva> reservas = reservaService.obtenerReservasPendientes();
            List<ReservaResponse> responses = reservas.stream()
                .map(this::convertirAResponse)
                .collect(Collectors.toList());
            
            return ResponseEntity.ok(ApiResponse.success(responses));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Error al obtener reservas pendientes"));
        }
    }

    /**
     * Obtener estadísticas de reservas (solo administradores)
     */
    @GetMapping("/admin/estadisticas")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Object>> obtenerEstadisticas(
            @RequestParam(defaultValue = "12") int mesesAtras) {
        try {
            List<Object[]> estadisticas = reservaService.obtenerEstadisticasPorMes(mesesAtras);
            return ResponseEntity.ok(ApiResponse.success(estadisticas));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Error al obtener estadísticas"));
        }
    }

    // Helper method para convertir entidad a DTO
    private ReservaResponse convertirAResponse(Reserva reserva) {
        ReservaResponse response = new ReservaResponse();
        response.setId(reserva.getId());
        response.setCodigoReserva(reserva.getCodigoReserva());
        response.setTipoReserva(reserva.getTipoReserva());
        response.setEmailContacto(reserva.getEmailContacto());
        response.setNombreContacto(reserva.getNombreContacto());
        response.setTelefonoContacto(reserva.getTelefonoContacto());
        response.setNumeroPersonas(reserva.getNumeroPersonas());
        response.setFechaInicio(reserva.getFechaInicio());
        response.setFechaFin(reserva.getFechaFin());
        response.setPrecioTotal(reserva.getPrecioTotal());
        response.setEstado(reserva.getEstado());
        response.setObservaciones(reserva.getObservaciones());
        response.setFechaCreacion(reserva.getFechaCreacion());
        response.setFechaActualizacion(reserva.getFechaActualizacion());
        
        // Información adicional específica del tipo usando Strategy pattern
        response.setInformacionAdicional(reservaService.obtenerInformacionAdicional(reserva.getId()));
        
        return response;
    }
}
