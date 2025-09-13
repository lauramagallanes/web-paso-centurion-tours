package com.tinambu.tours.controller;

import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/simple-auth")
@CrossOrigin(origins = "*")
@Profile("lambda-with-db")
public class SimpleAuthController {

    @PostMapping("/test-login")
    public ResponseEntity<Map<String, Object>> testLogin(@RequestBody Map<String, String> request) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            String email = request.get("email");
            String password = request.get("password");
            
            response.put("success", true);
            response.put("message", "Endpoint funcionando correctamente");
            response.put("receivedEmail", email);
            response.put("receivedPassword", password != null ? "***" : null);
            response.put("timestamp", LocalDateTime.now().toString());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", "Error en endpoint simple: " + e.getMessage());
            response.put("timestamp", LocalDateTime.now().toString());
            
            return ResponseEntity.internalServerError().body(response);
        }
    }
}

