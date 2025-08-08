package com.tinambu.tours.controller;

import com.tinambu.tours.dto.response.ApiResponse;
import com.tinambu.tours.entity.habitacion.Habitacion;
import com.tinambu.tours.service.HabitacionService;
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

@RestController
@RequestMapping("/api/habitaciones")
@CrossOrigin(origins = {"${cors.allowed-origins}"})
public class HabitacionController {

    @Autowired
    private HabitacionService habitacionService;

    // ========== ENDPOINTS PÚBLICOS ==========

    /**
     * Obtener todas las habitaciones activas
     * Endpoint público para mostrar opciones de alojamiento
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<Habitacion>>> obtenerHabitacionesActivas() {
        try {
            List<Habitacion> habitaciones = habitacionService.obtenerHabitacionesActivas();
            return ResponseEntity.ok(ApiResponse.success(habitaciones));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Error al obtener habitaciones"));
        }
    }

    /**
     * Obtener habitación por ID
     * Endpoint público para ver detalles de una habitación
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Habitacion>> obtenerHabitacionPorId(@PathVariable UUID id) {
        try {
            Habitacion habitacion = habitacionService.obtenerHabitacionPorId(id);
            return ResponseEntity.ok(ApiResponse.success(habitacion));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Buscar habitaciones disponibles
     * Endpoint público para búsqueda de disponibilidad
     */
    @GetMapping("/disponibles")
    public ResponseEntity<ApiResponse<List<Habitacion>>> buscarHabitacionesDisponibles(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaInicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaFin,
            @RequestParam Integer numeroPersonas) {
        try {
            List<Habitacion> habitaciones = habitacionService.buscarHabitacionesDisponibles(
                fechaInicio, fechaFin, numeroPersonas);
            return ResponseEntity.ok(ApiResponse.success(habitaciones));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error("Error en la búsqueda de disponibilidad"));
        }
    }

    /**
     * Verificar disponibilidad de habitación específica
     * Endpoint público
     */
    @GetMapping("/{id}/disponible")
    public ResponseEntity<ApiResponse<Boolean>> verificarDisponibilidad(
            @PathVariable UUID id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaInicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaFin) {
        try {
            boolean disponible = habitacionService.verificarDisponibilidad(id, fechaInicio, fechaFin);
            return ResponseEntity.ok(ApiResponse.success(disponible));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error("Error al verificar disponibilidad"));
        }
    }

    /**
     * Buscar habitaciones por capacidad
     * Endpoint público
     */
    @GetMapping("/capacidad/{numeroPersonas}")
    public ResponseEntity<ApiResponse<List<Habitacion>>> buscarPorCapacidad(@PathVariable Integer numeroPersonas) {
        try {
            List<Habitacion> habitaciones = habitacionService.buscarPorCapacidad(numeroPersonas);
            return ResponseEntity.ok(ApiResponse.success(habitaciones));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Error al buscar por capacidad"));
        }
    }

    /**
     * Buscar habitaciones por rango de precios
     * Endpoint público
     */
    @GetMapping("/precio")
    public ResponseEntity<ApiResponse<List<Habitacion>>> buscarPorRangoPrecio(
            @RequestParam BigDecimal precioMin,
            @RequestParam BigDecimal precioMax) {
        try {
            List<Habitacion> habitaciones = habitacionService.buscarPorRangoPrecio(precioMin, precioMax);
            return ResponseEntity.ok(ApiResponse.success(habitaciones));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Error al buscar por precio"));
        }
    }

    // ========== ENDPOINTS DE ADMINISTRACIÓN ==========

    /**
     * Obtener todas las habitaciones (incluyendo inactivas)
     * Solo administradores
     */
    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<Habitacion>>> obtenerTodasLasHabitaciones() {
        try {
            List<Habitacion> habitaciones = habitacionService.obtenerTodasLasHabitaciones();
            return ResponseEntity.ok(ApiResponse.success(habitaciones));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Error al obtener habitaciones"));
        }
    }

    /**
     * Crear nueva habitación
     * Solo administradores
     */
    @PostMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Habitacion>> crearHabitacion(@Valid @RequestBody Habitacion habitacion) {
        try {
            Habitacion nuevaHabitacion = habitacionService.crearHabitacion(habitacion);
            return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(nuevaHabitacion, "Habitación creada exitosamente"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Error interno del servidor"));
        }
    }

    /**
     * Actualizar habitación existente
     * Solo administradores
     */
    @PutMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Habitacion>> actualizarHabitacion(
            @PathVariable UUID id, 
            @Valid @RequestBody Habitacion habitacion) {
        try {
            Habitacion habitacionActualizada = habitacionService.actualizarHabitacion(id, habitacion);
            return ResponseEntity.ok(ApiResponse.success(habitacionActualizada, "Habitación actualizada exitosamente"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Error interno del servidor"));
        }
    }

    /**
     * Activar/desactivar habitación
     * Solo administradores
     */
    @PutMapping("/admin/{id}/estado")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Habitacion>> cambiarEstadoHabitacion(
            @PathVariable UUID id, 
            @RequestParam boolean activa) {
        try {
            Habitacion habitacion = habitacionService.cambiarEstadoHabitacion(id, activa);
            String mensaje = activa ? "Habitación activada exitosamente" : "Habitación desactivada exitosamente";
            return ResponseEntity.ok(ApiResponse.success(habitacion, mensaje));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Error interno del servidor"));
        }
    }

    /**
     * Eliminar habitación (soft delete)
     * Solo administradores
     */
    @DeleteMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> eliminarHabitacion(@PathVariable UUID id) {
        try {
            habitacionService.eliminarHabitacion(id);
            return ResponseEntity.ok(ApiResponse.success("Habitación eliminada exitosamente"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Error interno del servidor"));
        }
    }

    /**
     * Obtener estadísticas de habitaciones
     * Solo administradores
     */
    @GetMapping("/admin/estadisticas")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<HabitacionService.HabitacionStats>> obtenerEstadisticas() {
        try {
            HabitacionService.HabitacionStats stats = habitacionService.obtenerEstadisticas();
            return ResponseEntity.ok(ApiResponse.success(stats));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Error al obtener estadísticas"));
        }
    }

    /**
     * Obtener habitaciones ordenadas por capacidad
     * Solo administradores
     */
    @GetMapping("/admin/ordenadas-capacidad")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<Habitacion>>> obtenerHabitacionesOrdenadasPorCapacidad() {
        try {
            List<Habitacion> habitaciones = habitacionService.obtenerHabitacionesOrdenadasPorCapacidad();
            return ResponseEntity.ok(ApiResponse.success(habitaciones));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Error al obtener habitaciones ordenadas"));
        }
    }
}
