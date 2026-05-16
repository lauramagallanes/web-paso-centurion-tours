package com.tinambu.tours.controller;

import com.tinambu.tours.dto.request.GuiaRequest;
import com.tinambu.tours.dto.response.ApiResponse;
import com.tinambu.tours.dto.response.GuiaResponse;
import com.tinambu.tours.entity.sendero.TurnoSendero;
import com.tinambu.tours.service.GuiaService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Profile;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/guias")
@CrossOrigin(origins = "*")
@Profile("lambda-with-db")
public class GuiaController {

    @Autowired
    private GuiaService guiaService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<GuiaResponse>>> obtenerGuiasActivos() {
        try {
            List<GuiaResponse> guiasResponse = guiaService.obtenerGuiasActivos();
            return ResponseEntity.ok(ApiResponse.success(guiasResponse));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Error al obtener guías"));
        }
    }

    @GetMapping("/disponibles")
    public ResponseEntity<ApiResponse<List<GuiaResponse>>> buscarGuiasDisponibles(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha,
            @RequestParam TurnoSendero turno) {
        try {
            List<GuiaResponse> guiasResponse = guiaService.buscarGuiasDisponibles(fecha, turno);
            return ResponseEntity.ok(ApiResponse.success(guiasResponse));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error("Error en la búsqueda de disponibilidad"));
        }
    }

    @GetMapping("/especialidad/{especialidad}")
    public ResponseEntity<ApiResponse<List<GuiaResponse>>> buscarPorEspecialidad(@PathVariable String especialidad) {
        try {
            List<GuiaResponse> guiasResponse = guiaService.buscarPorEspecialidad(especialidad);
            return ResponseEntity.ok(ApiResponse.success(guiasResponse));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Error al buscar por especialidad"));
        }
    }

    @GetMapping("/experiencia/{anosMinimos}")
    public ResponseEntity<ApiResponse<List<GuiaResponse>>> buscarPorExperienciaMinima(@PathVariable Integer anosMinimos) {
        try {
            List<GuiaResponse> guiasResponse = guiaService.buscarPorExperienciaMinima(anosMinimos);
            return ResponseEntity.ok(ApiResponse.success(guiasResponse));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Error al buscar por experiencia"));
        }
    }

    @GetMapping("/buscar")
    public ResponseEntity<ApiResponse<List<GuiaResponse>>> buscarPorNombre(@RequestParam String nombre) {
        try {
            List<GuiaResponse> guiasResponse = guiaService.buscarPorNombre(nombre);
            return ResponseEntity.ok(ApiResponse.success(guiasResponse));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Error en la búsqueda"));
        }
    }

    @GetMapping("/ordenados/experiencia")
    public ResponseEntity<ApiResponse<List<GuiaResponse>>> obtenerGuiasOrdenadosPorExperiencia() {
        try {
            List<GuiaResponse> guias = guiaService.obtenerGuiasOrdenadosPorExperiencia();
            return ResponseEntity.ok(ApiResponse.success(guias));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Error al obtener guías ordenados"));
        }
    }

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

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<GuiaResponse>>> obtenerTodosLosGuias() {
        try {
            List<GuiaResponse> guias = guiaService.obtenerTodosLosGuias();
            return ResponseEntity.ok(ApiResponse.success(guias));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Error al obtener guías"));
        }
    }

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

    @GetMapping("/admin/email/{email}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<GuiaResponse>> obtenerGuiaPorEmailAdmin(@PathVariable String email) {
        try {
            GuiaResponse guia = guiaService.obtenerGuiaAdminPorEmail(email);
            return ResponseEntity.ok(ApiResponse.success(guia));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<GuiaResponse>> crearGuia(@Valid @RequestBody GuiaRequest guiaRequest) {
        try {
            GuiaResponse response = guiaService.crearGuia(guiaRequest);
            return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Guía creado exitosamente"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Error interno del servidor"));
        }
    }

    @PutMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<GuiaResponse>> actualizarGuia(
            @PathVariable UUID id,
            @Valid @RequestBody GuiaRequest guiaRequest) {
        try {
            GuiaResponse response = guiaService.actualizarGuia(id, guiaRequest);
            return ResponseEntity.ok(ApiResponse.success(response, "Guía actualizado exitosamente"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Error interno del servidor"));
        }
    }

    @PutMapping("/admin/{id}/estado")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<GuiaResponse>> cambiarEstadoGuia(
            @PathVariable UUID id,
            @RequestParam boolean activo) {
        try {
            GuiaResponse guia = guiaService.cambiarEstadoGuia(id, activo);
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

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<GuiaResponse>> obtenerGuiaPorId(@PathVariable UUID id) {
        try {
            GuiaResponse response = guiaService.obtenerGuiaPorIdPublico(id);
            return ResponseEntity.ok(ApiResponse.success(response));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error(e.getMessage()));
        }
    }
}
