package com.tinambu.tours.controller;

import com.tinambu.tours.dto.response.ApiResponse;
import com.tinambu.tours.service.AlojamientoService;
import com.tinambu.tours.service.SenderoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.ArrayList;

/**
 * Controlador para el dashboard administrativo
 */
@RestController
@RequestMapping("/api/dashboard/admin")
@CrossOrigin(origins = "*")
public class DashboardController {

    @Autowired
    private AlojamientoService alojamientoService;

    @Autowired
    private SenderoService senderoService;

    /**
     * Obtener estadísticas del dashboard
     * Solo administradores
     */
    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> obtenerEstadisticasDashboard() {
        try {
            Map<String, Object> stats = new HashMap<>();

            // Obtener estadísticas reales cuando sea posible
            int totalAlojamientos = alojamientoService.obtenerAlojamientos().size();
            int totalSenderos = senderoService.obtenerTodosLosSenderos().size();

            // Estadísticas básicas
            stats.put("totalReservas", 0);
            stats.put("reservasPendientes", 0);
            stats.put("reservasConfirmadas", 0);
            stats.put("reservasCanceladas", 0);
            stats.put("totalAlojamientos", totalAlojamientos);
            stats.put("totalSenderos", totalSenderos);
            stats.put("ingresosMensuales", 0);
            stats.put("senderosMasPopulares", new ArrayList<>());
            stats.put("reservasRecientes", new ArrayList<>());
            stats.put("message", "Dashboard funcionando correctamente");

            return ResponseEntity.ok(ApiResponse.success(stats));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Error al obtener estadísticas del dashboard: " + e.getMessage()));
        }
    }

    /**
     * Obtener resumen del sistema
     * Solo administradores
     */
    @GetMapping("/resumen")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> obtenerResumenSistema() {
        try {
            Map<String, Object> resumen = new HashMap<>();
            
            // Obtener datos reales
            int totalAlojamientos = alojamientoService.obtenerAlojamientos().size();
            int totalSenderos = senderoService.obtenerTodosLosSenderos().size();
            
            resumen.put("totalAlojamientos", totalAlojamientos);
            resumen.put("totalSenderos", totalSenderos);
            resumen.put("totalGuias", 0);
            resumen.put("sistemaActivo", true);

            return ResponseEntity.ok(ApiResponse.success(resumen));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Error al obtener resumen del sistema"));
        }
    }
}
