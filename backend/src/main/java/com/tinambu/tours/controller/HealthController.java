package com.tinambu.tours.controller;

import com.tinambu.tours.dto.response.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = {"${cors.allowed-origins}"})
public class HealthController {

    /**
     * Health check endpoint
     * Endpoint público para verificar que la API está funcionando
     */
    @GetMapping("/health")
    public ResponseEntity<ApiResponse<Map<String, Object>>> health() {
        Map<String, Object> healthData = new HashMap<>();
        healthData.put("status", "UP");
        healthData.put("timestamp", LocalDateTime.now());
        healthData.put("service", "Tinambú Tours API");
        healthData.put("version", "1.0.0");
        
        return ResponseEntity.ok(ApiResponse.success(healthData, "API funcionando correctamente"));
    }
}
