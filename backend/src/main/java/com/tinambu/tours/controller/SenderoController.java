package com.tinambu.tours.controller;

import com.tinambu.tours.dto.response.ApiResponse;
import com.tinambu.tours.entity.sendero.NivelDificultad;
import com.tinambu.tours.entity.sendero.Sendero;
import com.tinambu.tours.service.SenderoService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/senderos")
@CrossOrigin(origins = {"${cors.allowed-origins}"})
public class SenderoController {

    @Autowired
    private SenderoService senderoService;

    // ========== ENDPOINTS PÚBLICOS ==========

    /**
     * Obtener todos los senderos activos
     * Endpoint público para mostrar opciones de senderos
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<Sendero>>> obtenerSenderosActivos() {
        try {
            List<Sendero> senderos = senderoService.obtenerSenderosActivos();
            return ResponseEntity.ok(ApiResponse.success(senderos));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Error al obtener senderos"));
        }
    }

    /**
     * Obtener sendero por ID
     * Endpoint público para ver detalles de un sendero
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Sendero>> obtenerSenderoPorId(@PathVariable UUID id) {
        try {
            Sendero sendero = senderoService.obtenerSenderoPorId(id);
            return ResponseEntity.ok(ApiResponse.success(sendero));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Buscar senderos por capacidad mínima
     * Endpoint público
     */
    @GetMapping("/capacidad/{numeroPersonas}")
    public ResponseEntity<ApiResponse<List<Sendero>>> buscarPorCapacidad(@PathVariable Integer numeroPersonas) {
        try {
            List<Sendero> senderos = senderoService.buscarPorCapacidadMinima(numeroPersonas);
            return ResponseEntity.ok(ApiResponse.success(senderos));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Error al buscar por capacidad"));
        }
    }

    /**
     * Buscar senderos por nivel de dificultad
     * Endpoint público
     */
    @GetMapping("/dificultad/{nivelDificultad}")
    public ResponseEntity<ApiResponse<List<Sendero>>> buscarPorNivelDificultad(@PathVariable NivelDificultad nivelDificultad) {
        try {
            List<Sendero> senderos = senderoService.buscarPorNivelDificultad(nivelDificultad);
            return ResponseEntity.ok(ApiResponse.success(senderos));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Error al buscar por dificultad"));
        }
    }

    /**
     * Buscar senderos por rango de duración
     * Endpoint público
     */
    @GetMapping("/duracion")
    public ResponseEntity<ApiResponse<List<Sendero>>> buscarPorRangoDuracion(
            @RequestParam BigDecimal duracionMin,
            @RequestParam BigDecimal duracionMax) {
        try {
            List<Sendero> senderos = senderoService.buscarPorRangoDuracion(duracionMin, duracionMax);
            return ResponseEntity.ok(ApiResponse.success(senderos));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Error al buscar por duración"));
        }
    }

    /**
     * Buscar senderos por rango de precios
     * Endpoint público
     */
    @GetMapping("/precio")
    public ResponseEntity<ApiResponse<List<Sendero>>> buscarPorRangoPrecio(
            @RequestParam BigDecimal precioMin,
            @RequestParam BigDecimal precioMax) {
        try {
            List<Sendero> senderos = senderoService.buscarPorRangoPrecio(precioMin, precioMax);
            return ResponseEntity.ok(ApiResponse.success(senderos));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Error al buscar por precio"));
        }
    }

    /**
     * Buscar senderos por texto en nombre o descripción
     * Endpoint público
     */
    @GetMapping("/buscar")
    public ResponseEntity<ApiResponse<List<Sendero>>> buscarPorTexto(@RequestParam String texto) {
        try {
            List<Sendero> senderos = senderoService.buscarPorTexto(texto);
            return ResponseEntity.ok(ApiResponse.success(senderos));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Error en la búsqueda"));
        }
    }

    /**
     * Obtener senderos ordenados por dificultad
     * Endpoint público
     */
    @GetMapping("/ordenados/dificultad")
    public ResponseEntity<ApiResponse<List<Sendero>>> obtenerSenderosOrdenadosPorDificultad() {
        try {
            List<Sendero> senderos = senderoService.obtenerSenderosOrdenadosPorDificultad();
            return ResponseEntity.ok(ApiResponse.success(senderos));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Error al obtener senderos ordenados"));
        }
    }

    /**
     * Obtener senderos ordenados por duración
     * Endpoint público
     */
    @GetMapping("/ordenados/duracion")
    public ResponseEntity<ApiResponse<List<Sendero>>> obtenerSenderosOrdenadosPorDuracion() {
        try {
            List<Sendero> senderos = senderoService.obtenerSenderosOrdenadosPorDuracion();
            return ResponseEntity.ok(ApiResponse.success(senderos));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Error al obtener senderos ordenados"));
        }
    }

    /**
     * Obtener senderos ordenados por precio
     * Endpoint público
     */
    @GetMapping("/ordenados/precio")
    public ResponseEntity<ApiResponse<List<Sendero>>> obtenerSenderosOrdenadosPorPrecio() {
        try {
            List<Sendero> senderos = senderoService.obtenerSenderosOrdenadosPorPrecio();
            return ResponseEntity.ok(ApiResponse.success(senderos));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Error al obtener senderos ordenados"));
        }
    }

    // ========== ENDPOINTS DE ADMINISTRACIÓN ==========

    /**
     * Obtener todos los senderos (incluyendo inactivos)
     * Solo administradores
     */
    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<Sendero>>> obtenerTodosLosSenderos() {
        try {
            List<Sendero> senderos = senderoService.obtenerTodosLosSenderos();
            return ResponseEntity.ok(ApiResponse.success(senderos));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Error al obtener senderos"));
        }
    }

    /**
     * Crear nuevo sendero
     * Solo administradores
     */
    @PostMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Sendero>> crearSendero(@Valid @RequestBody Sendero sendero) {
        try {
            Sendero nuevoSendero = senderoService.crearSendero(sendero);
            return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(nuevoSendero, "Sendero creado exitosamente"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Error interno del servidor"));
        }
    }

    /**
     * Actualizar sendero existente
     * Solo administradores
     */
    @PutMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Sendero>> actualizarSendero(
            @PathVariable UUID id, 
            @Valid @RequestBody Sendero sendero) {
        try {
            Sendero senderoActualizado = senderoService.actualizarSendero(id, sendero);
            return ResponseEntity.ok(ApiResponse.success(senderoActualizado, "Sendero actualizado exitosamente"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Error interno del servidor"));
        }
    }

    /**
     * Activar/desactivar sendero
     * Solo administradores
     */
    @PutMapping("/admin/{id}/estado")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Sendero>> cambiarEstadoSendero(
            @PathVariable UUID id, 
            @RequestParam boolean activo) {
        try {
            Sendero sendero = senderoService.cambiarEstadoSendero(id, activo);
            String mensaje = activo ? "Sendero activado exitosamente" : "Sendero desactivado exitosamente";
            return ResponseEntity.ok(ApiResponse.success(sendero, mensaje));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Error interno del servidor"));
        }
    }

    /**
     * Eliminar sendero (soft delete)
     * Solo administradores
     */
    @DeleteMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> eliminarSendero(@PathVariable UUID id) {
        try {
            senderoService.eliminarSendero(id);
            return ResponseEntity.ok(ApiResponse.success("Sendero eliminado exitosamente"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Error interno del servidor"));
        }
    }

    /**
     * Obtener estadísticas de senderos
     * Solo administradores
     */
    @GetMapping("/admin/estadisticas")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<SenderoService.SenderoStats>> obtenerEstadisticas() {
        try {
            SenderoService.SenderoStats stats = senderoService.obtenerEstadisticas();
            return ResponseEntity.ok(ApiResponse.success(stats));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Error al obtener estadísticas"));
        }
    }

    /**
     * Contar senderos por dificultad
     * Solo administradores
     */
    @GetMapping("/admin/contar-dificultad/{nivelDificultad}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Long>> contarSenderosPorDificultad(@PathVariable NivelDificultad nivelDificultad) {
        try {
            long count = senderoService.contarSenderosPorDificultad(nivelDificultad);
            return ResponseEntity.ok(ApiResponse.success(count));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Error al contar senderos"));
        }
    }
}
