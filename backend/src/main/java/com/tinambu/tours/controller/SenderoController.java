package com.tinambu.tours.controller;

import com.tinambu.tours.dto.request.SenderoRequest;
import com.tinambu.tours.dto.response.ApiResponse;
import com.tinambu.tours.dto.response.SenderoResponse;
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
    public ResponseEntity<ApiResponse<List<SenderoResponse>>> obtenerSenderosActivos() {
        try {
            List<SenderoResponse> senderosResponse = senderoService.obtenerSenderosActivos();
            return ResponseEntity.ok(ApiResponse.success(senderosResponse));
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
    public ResponseEntity<ApiResponse<SenderoResponse>> obtenerSenderoPorId(@PathVariable UUID id) {
        try {
            SenderoResponse response = senderoService.obtenerSenderoPorIdPublico(id);
            return ResponseEntity.ok(ApiResponse.success(response));
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
    public ResponseEntity<ApiResponse<List<SenderoResponse>>> buscarPorCapacidad(@PathVariable Integer numeroPersonas) {
        try {
            List<SenderoResponse> senderosResponse = senderoService.buscarPorCapacidadMinima(numeroPersonas);
            return ResponseEntity.ok(ApiResponse.success(senderosResponse));
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
    public ResponseEntity<ApiResponse<List<SenderoResponse>>> buscarPorNivelDificultad(@PathVariable NivelDificultad nivelDificultad) {
        try {
            List<SenderoResponse> senderosResponse = senderoService.buscarPorNivelDificultad(nivelDificultad);
            return ResponseEntity.ok(ApiResponse.success(senderosResponse));
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
    public ResponseEntity<ApiResponse<List<SenderoResponse>>> buscarPorRangoDuracion(
            @RequestParam BigDecimal duracionMin,
            @RequestParam BigDecimal duracionMax) {
        try {
            List<SenderoResponse> senderosResponse = senderoService.buscarPorRangoDuracion(duracionMin, duracionMax);
            return ResponseEntity.ok(ApiResponse.success(senderosResponse));
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
    public ResponseEntity<ApiResponse<List<SenderoResponse>>> buscarPorRangoPrecio(
            @RequestParam BigDecimal precioMin,
            @RequestParam BigDecimal precioMax) {
        try {
            List<SenderoResponse> senderosResponse = senderoService.buscarPorRangoPrecio(precioMin, precioMax);
            return ResponseEntity.ok(ApiResponse.success(senderosResponse));
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
    public ResponseEntity<ApiResponse<List<SenderoResponse>>> buscarPorTexto(@RequestParam String texto) {
        try {
            List<SenderoResponse> senderosResponse = senderoService.buscarPorTexto(texto);
            return ResponseEntity.ok(ApiResponse.success(senderosResponse));
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
    public ResponseEntity<ApiResponse<List<SenderoResponse>>> obtenerSenderosOrdenadosPorDificultad() {
        try {
            List<SenderoResponse> senderosResponse = senderoService.obtenerSenderosOrdenadosPorDificultad();
            return ResponseEntity.ok(ApiResponse.success(senderosResponse));
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
    public ResponseEntity<ApiResponse<List<SenderoResponse>>> obtenerSenderosOrdenadosPorDuracion() {
        try {
            List<SenderoResponse> senderosResponse = senderoService.obtenerSenderosOrdenadosPorDuracion();
            return ResponseEntity.ok(ApiResponse.success(senderosResponse));
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
    public ResponseEntity<ApiResponse<List<SenderoResponse>>> obtenerSenderosOrdenadosPorPrecio() {
        try {
            List<SenderoResponse> senderosResponse = senderoService.obtenerSenderosOrdenadosPorPrecio();
            return ResponseEntity.ok(ApiResponse.success(senderosResponse));
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
    public ResponseEntity<ApiResponse<List<SenderoResponse>>> obtenerTodosLosSenderos() {
        try {
            List<SenderoResponse> senderos = senderoService.obtenerTodosLosSenderos();
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
    public ResponseEntity<ApiResponse<SenderoResponse>> crearSendero(@Valid @RequestBody SenderoRequest senderoRequest) {
        try {
            SenderoResponse response = senderoService.crearSendero(senderoRequest);
            return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Sendero creado exitosamente"));
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
    public ResponseEntity<ApiResponse<SenderoResponse>> actualizarSendero(
            @PathVariable UUID id, 
            @Valid @RequestBody SenderoRequest senderoRequest) {
        try {
            SenderoResponse response = senderoService.actualizarSendero(id, senderoRequest);
            return ResponseEntity.ok(ApiResponse.success(response, "Sendero actualizado exitosamente"));
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

    // ========== MÉTODOS HELPER ==========
    // Los métodos de conversión ahora están en el servicio para mejor separación de responsabilidades
}
