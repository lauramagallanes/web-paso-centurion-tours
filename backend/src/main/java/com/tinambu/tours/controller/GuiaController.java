package com.tinambu.tours.controller;

import com.tinambu.tours.dto.response.ApiResponse;
import com.tinambu.tours.entity.guia.Guia;
import com.tinambu.tours.entity.reserva.TurnoSendero;
import com.tinambu.tours.service.GuiaService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/guias")
@CrossOrigin(origins = {"${cors.allowed-origins}"})
public class GuiaController {

    @Autowired
    private GuiaService guiaService;

    // ========== ENDPOINTS PÚBLICOS ==========

    /**
     * Obtener todos los guías activos
     * Endpoint público para mostrar información de guías
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<Guia>>> obtenerGuiasActivos() {
        try {
            List<Guia> guias = guiaService.obtenerGuiasActivos();
            return ResponseEntity.ok(ApiResponse.success(guias));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Error al obtener guías"));
        }
    }

    /**
     * Obtener guía por ID
     * Endpoint público para ver perfil de un guía
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Guia>> obtenerGuiaPorId(@PathVariable UUID id) {
        try {
            Guia guia = guiaService.obtenerGuiaPorId(id);
            return ResponseEntity.ok(ApiResponse.success(guia));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Buscar guías disponibles para una fecha y turno
     * Endpoint público para búsqueda de disponibilidad
     */
    @GetMapping("/disponibles")
    public ResponseEntity<ApiResponse<List<Guia>>> buscarGuiasDisponibles(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha,
            @RequestParam TurnoSendero turno) {
        try {
            List<Guia> guias = guiaService.buscarGuiasDisponibles(fecha, turno);
            return ResponseEntity.ok(ApiResponse.success(guias));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error("Error en la búsqueda de disponibilidad"));
        }
    }

    /**
     * Verificar disponibilidad de guía específico
     * Endpoint público
     */
    @GetMapping("/{id}/disponible")
    public ResponseEntity<ApiResponse<Boolean>> verificarDisponibilidad(
            @PathVariable UUID id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha,
            @RequestParam TurnoSendero turno) {
        try {
            boolean disponible = guiaService.verificarDisponibilidad(id, fecha, turno);
            return ResponseEntity.ok(ApiResponse.success(disponible));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error("Error al verificar disponibilidad"));
        }
    }

    /**
     * Buscar guías por especialidad
     * Endpoint público
     */
    @GetMapping("/especialidad/{especialidad}")
    public ResponseEntity<ApiResponse<List<Guia>>> buscarPorEspecialidad(@PathVariable String especialidad) {
        try {
            List<Guia> guias = guiaService.buscarPorEspecialidad(especialidad);
            return ResponseEntity.ok(ApiResponse.success(guias));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Error al buscar por especialidad"));
        }
    }

    /**
     * Buscar guías por años de experiencia mínima
     * Endpoint público
     */
    @GetMapping("/experiencia/{anosMinimos}")
    public ResponseEntity<ApiResponse<List<Guia>>> buscarPorExperienciaMinima(@PathVariable Integer anosMinimos) {
        try {
            List<Guia> guias = guiaService.buscarPorExperienciaMinima(anosMinimos);
            return ResponseEntity.ok(ApiResponse.success(guias));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Error al buscar por experiencia"));
        }
    }

    /**
     * Buscar guías por nombre
     * Endpoint público
     */
    @GetMapping("/buscar")
    public ResponseEntity<ApiResponse<List<Guia>>> buscarPorNombre(@RequestParam String nombre) {
        try {
            List<Guia> guias = guiaService.buscarPorNombre(nombre);
            return ResponseEntity.ok(ApiResponse.success(guias));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Error en la búsqueda"));
        }
    }

    /**
     * Obtener guías ordenados por experiencia
     * Endpoint público
     */
    @GetMapping("/ordenados/experiencia")
    public ResponseEntity<ApiResponse<List<Guia>>> obtenerGuiasOrdenadosPorExperiencia() {
        try {
            List<Guia> guias = guiaService.obtenerGuiasOrdenadosPorExperiencia();
            return ResponseEntity.ok(ApiResponse.success(guias));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Error al obtener guías ordenados"));
        }
    }

    /**
     * Obtener disponibilidad de todos los guías para una fecha
     * Endpoint público - útil para mostrar calendario de disponibilidad
     */
    @GetMapping("/disponibilidad/{fecha}")
    public ResponseEntity<ApiResponse<List<Object[]>>> obtenerDisponibilidadPorFecha(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha) {
        try {
            List<Object[]> disponibilidad = guiaService.obtenerDisponibilidadPorFecha(fecha);
            return ResponseEntity.ok(ApiResponse.success(disponibilidad));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Error al obtener disponibilidad"));
        }
    }

    // ========== ENDPOINTS DE ADMINISTRACIÓN ==========

    /**
     * Obtener todos los guías (incluyendo inactivos)
     * Solo administradores
     */
    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<Guia>>> obtenerTodosLosGuias() {
        try {
            List<Guia> guias = guiaService.obtenerTodosLosGuias();
            return ResponseEntity.ok(ApiResponse.success(guias));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Error al obtener guías"));
        }
    }

    /**
     * Crear nuevo guía
     * Solo administradores
     */
    @PostMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Guia>> crearGuia(@Valid @RequestBody Guia guia) {
        try {
            Guia nuevoGuia = guiaService.crearGuia(guia);
            return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(nuevoGuia, "Guía creado exitosamente"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Error interno del servidor"));
        }
    }

    /**
     * Actualizar guía existente
     * Solo administradores
     */
    @PutMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Guia>> actualizarGuia(
            @PathVariable UUID id, 
            @Valid @RequestBody Guia guia) {
        try {
            Guia guiaActualizado = guiaService.actualizarGuia(id, guia);
            return ResponseEntity.ok(ApiResponse.success(guiaActualizado, "Guía actualizado exitosamente"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Error interno del servidor"));
        }
    }

    /**
     * Activar/desactivar guía
     * Solo administradores
     */
    @PutMapping("/admin/{id}/estado")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Guia>> cambiarEstadoGuia(
            @PathVariable UUID id, 
            @RequestParam boolean activo) {
        try {
            Guia guia = guiaService.cambiarEstadoGuia(id, activo);
            String mensaje = activo ? "Guía activado exitosamente" : "Guía desactivado exitosamente";
            return ResponseEntity.ok(ApiResponse.success(guia, mensaje));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Error interno del servidor"));
        }
    }

    /**
     * Eliminar guía (soft delete)
     * Solo administradores
     */
    @DeleteMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> eliminarGuia(@PathVariable UUID id) {
        try {
            guiaService.eliminarGuia(id);
            return ResponseEntity.ok(ApiResponse.success("Guía eliminado exitosamente"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Error interno del servidor"));
        }
    }

    /**
     * Obtener estadísticas de guías
     * Solo administradores
     */
    @GetMapping("/admin/estadisticas")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<GuiaService.GuiaStats>> obtenerEstadisticas() {
        try {
            GuiaService.GuiaStats stats = guiaService.obtenerEstadisticas();
            return ResponseEntity.ok(ApiResponse.success(stats));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Error al obtener estadísticas"));
        }
    }

    /**
     * Obtener guía por email (para búsquedas administrativas)
     * Solo administradores
     */
    @GetMapping("/admin/email/{email}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Guia>> obtenerGuiaPorEmail(@PathVariable String email) {
        try {
            Guia guia = guiaService.obtenerGuiaPorEmail(email);
            return ResponseEntity.ok(ApiResponse.success(guia));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error(e.getMessage()));
        }
    }
}
