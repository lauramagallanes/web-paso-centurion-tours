package com.tinambu.tours.controller;

import com.tinambu.tours.dto.request.*;
import com.tinambu.tours.dto.response.*;
import com.tinambu.tours.service.AlojamientoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.UUID;

@RestController
@RequestMapping("/alojamientos")
@CrossOrigin(origins = "*")
public class AlojamientoController {

    @Autowired
    private AlojamientoService alojamientoService;

    // Public Endpoints

    @GetMapping
    public ResponseEntity<List<AlojamientoResponse>> obtenerAlojamientos() {
        try {
            List<AlojamientoResponse> alojamientos = alojamientoService.obtenerAlojamientos();
            return ResponseEntity.ok(alojamientos);
        } catch (Exception e) {
            System.err.println("Error obteniendo alojamientos: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<AlojamientoResponse> obtenerAlojamientoPorId(@PathVariable UUID id) {
        try {
            AlojamientoResponse alojamiento = alojamientoService.obtenerAlojamientoPorId(id);
            return ResponseEntity.ok(alojamiento);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            System.err.println("Error obteniendo alojamiento: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/{id}/verificar-disponibilidad")
    public ResponseEntity<Boolean> verificarDisponibilidad(
            @PathVariable UUID id,
            @RequestParam LocalDate checkIn,
            @RequestParam LocalDate checkOut) {
        try {
            boolean disponible = alojamientoService.verificarDisponibilidad(id, checkIn, checkOut);
            return ResponseEntity.ok(disponible);
        } catch (Exception e) {
            System.err.println("Error verificando disponibilidad: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(false);
        }
    }

    @GetMapping("/{id}/fechas-bloqueadas")
    public ResponseEntity<?> obtenerFechasBloqueadas(
            @PathVariable UUID id,
            @RequestParam LocalDate desde,
            @RequestParam LocalDate hasta) {
        try {
            List<LocalDate> fechas = alojamientoService.obtenerFechasBloqueadas(id, desde, hasta);
            return ResponseEntity.ok(fechas);
        } catch (Exception e) {
            System.err.println("Error obteniendo fechas bloqueadas: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Admin Endpoints (secured in future with @PreAuthorize)

    @GetMapping("/admin")
    public ResponseEntity<ApiResponse<List<AlojamientoResponse>>> obtenerAlojamientosAdmin() {
        try {
            System.out.println("📋 Obteniendo TODOS los alojamientos (admin)");
            List<AlojamientoResponse> alojamientos = alojamientoService.obtenerTodosLosAlojamientos();
            System.out.println("✅ Encontrados " + alojamientos.size() + " alojamientos");
            return ResponseEntity.ok(ApiResponse.success(alojamientos));
        } catch (Exception e) {
            System.err.println("Error obteniendo alojamientos admin: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al obtener alojamientos: " + e.getMessage()));
        }
    }

    @PostMapping("/admin")
    public ResponseEntity<AlojamientoResponse> crearAlojamiento(@Valid @RequestBody AlojamientoRequest request) {
        try {
            System.out.println("🏠 Creando alojamiento con request: " + request.getNombre());
            System.out.println("   - Capacidad min/max: " + request.getCapacidadMinima() + "/" + request.getCapacidadMaxima());
            System.out.println("   - Camas dobles/literas: " + request.getCantidadCamasDobles() + "/" + request.getCantidadLiteras());
            System.out.println("   - Precio: " + request.getPrecioPorNoche());
            
            AlojamientoResponse response = alojamientoService.crearAlojamiento(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            System.err.println("Error de validación: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            System.err.println("Error creando alojamiento: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<AlojamientoResponse> actualizarAlojamiento(
            @PathVariable UUID id,
            @Valid @RequestBody AlojamientoRequest request) {
        try {
            AlojamientoResponse response = alojamientoService.actualizarAlojamiento(id, request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            System.err.println("Error actualizando alojamiento: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarAlojamiento(@PathVariable UUID id) {
        try {
            alojamientoService.eliminarAlojamiento(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            System.err.println("Error eliminando alojamiento: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{id}/disponibilidad")
    public ResponseEntity<List<AlojamientoDisponibilidadResponse>> listarDisponibilidades(@PathVariable UUID id) {
        try {
            List<AlojamientoDisponibilidadResponse> disponibilidades = alojamientoService.listarDisponibilidades(id);
            return ResponseEntity.ok(disponibilidades);
        } catch (Exception e) {
            System.err.println("Error listando disponibilidades: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/{id}/disponibilidad")
    public ResponseEntity<?> crearDisponibilidad(
            @PathVariable UUID id,
            @Valid @RequestBody AlojamientoDisponibilidadRequest request) {
        try {
            request.setAlojamientoId(id);
            AlojamientoDisponibilidadResponse response = alojamientoService.crearDisponibilidad(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            System.err.println("Error creando disponibilidad: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Error interno del servidor"));
        }
    }

    @DeleteMapping("/{id}/disponibilidad/{disponibilidadId}")
    public ResponseEntity<Void> eliminarDisponibilidad(
            @PathVariable UUID id,
            @PathVariable UUID disponibilidadId) {
        try {
            alojamientoService.eliminarDisponibilidad(disponibilidadId);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            System.err.println("Error eliminando disponibilidad: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{id}/bloqueos-manuales")
    public ResponseEntity<?> listarBloqueosManuals(@PathVariable UUID id) {
        try {
            return ResponseEntity.ok(alojamientoService.listarBloqueosManuals(id));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/bloqueos-manuales")
    public ResponseEntity<?> crearBloqueoManual(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body) {
        try {
            LocalDate fechaInicio = LocalDate.parse(body.get("fechaInicio"));
            LocalDate fechaFin = LocalDate.parse(body.get("fechaFin"));
            alojamientoService.crearBloqueoManual(id, fechaInicio, fechaFin);
            return ResponseEntity.ok(Map.of("message", "Bloqueo manual creado exitosamente"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}/bloqueos-manuales")
    public ResponseEntity<?> eliminarBloqueoManual(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body) {
        try {
            LocalDate fechaInicio = LocalDate.parse(body.get("fechaInicio"));
            LocalDate fechaFin = LocalDate.parse(body.get("fechaFin"));
            alojamientoService.eliminarBloqueoManual(id, fechaInicio, fechaFin);
            return ResponseEntity.ok(Map.of("message", "Bloqueo manual eliminado exitosamente"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    // Exception handler for better error responses
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<String> handleValidationException(IllegalArgumentException e) {
        return ResponseEntity.badRequest().body("Error de validación: " + e.getMessage());
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<String> handleRuntimeException(RuntimeException e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error interno: " + e.getMessage());
    }
}
