package com.tinambu.tours.controller;

import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/**
 * Controller de autenticación simplificado para testing
 * Funciona sin base de datos usando datos mock
 */
@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = "*")
@Profile("lambda-no-db")
public class AuthTestController {

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, Object> loginRequest) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            String email = (String) loginRequest.get("email");
            String password = (String) loginRequest.get("password");
            
            // Mock authentication - simple validation
            if (email != null && password != null && 
                email.contains("@") && password.length() >= 4) {
                
                // Mock JWT token
                String mockToken = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6Ik1vY2sgVXNlciIsImVtYWlsIjoiJHtlbWFpbH0iLCJyb2xlIjoiVVNFUiIsImV4cCI6MTY5OTk5OTk5OX0.mock-signature";
                
                response.put("status", "success");
                response.put("message", "Login successful (mock)");
                response.put("timestamp", Instant.now().toString());
                response.put("user", Map.of(
                    "id", 1,
                    "email", email,
                    "name", "Mock User",
                    "role", "USER"
                ));
                response.put("token", mockToken);
                response.put("tokenType", "Bearer");
                response.put("expiresIn", 3600); // 1 hour
                
                return ResponseEntity.ok(response);
                
            } else {
                response.put("status", "error");
                response.put("message", "Invalid credentials");
                response.put("timestamp", Instant.now().toString());
                
                return ResponseEntity.status(401).body(response);
            }
            
        } catch (Exception e) {
            response.put("status", "error");
            response.put("message", "Login failed: " + e.getMessage());
            response.put("timestamp", Instant.now().toString());
            
            return ResponseEntity.status(500).body(response);
        }
    }

    @PostMapping("/signup")
    public ResponseEntity<Map<String, Object>> signup(@RequestBody Map<String, Object> signupRequest) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            String email = (String) signupRequest.get("email");
            String password = (String) signupRequest.get("password");
            String name = (String) signupRequest.get("name");
            
            // Mock validation
            if (email != null && password != null && name != null &&
                email.contains("@") && password.length() >= 4 && name.length() >= 2) {
                
                response.put("status", "success");
                response.put("message", "User registered successfully (mock)");
                response.put("timestamp", Instant.now().toString());
                response.put("user", Map.of(
                    "id", 2,
                    "email", email,
                    "name", name,
                    "role", "USER"
                ));
                
                return ResponseEntity.ok(response);
                
            } else {
                response.put("status", "error");
                response.put("message", "Invalid registration data");
                response.put("timestamp", Instant.now().toString());
                response.put("validation", Map.of(
                    "email", email != null && email.contains("@") ? "valid" : "invalid",
                    "password", password != null && password.length() >= 4 ? "valid" : "too short",
                    "name", name != null && name.length() >= 2 ? "valid" : "too short"
                ));
                
                return ResponseEntity.status(400).body(response);
            }
            
        } catch (Exception e) {
            response.put("status", "error");
            response.put("message", "Signup failed: " + e.getMessage());
            response.put("timestamp", Instant.now().toString());
            
            return ResponseEntity.status(500).body(response);
        }
    }

    @GetMapping("/validate")
    public ResponseEntity<Map<String, Object>> validateToken(@RequestHeader(value = "Authorization", required = false) String authorization) {
        Map<String, Object> response = new HashMap<>();
        
        if (authorization != null && authorization.startsWith("Bearer ")) {
            String token = authorization.substring(7);
            
            // Mock token validation
            if (token.contains("mock-signature")) {
                response.put("status", "valid");
                response.put("message", "Token is valid (mock)");
                response.put("timestamp", Instant.now().toString());
                response.put("user", Map.of(
                    "id", 1,
                    "email", "mock@user.com",
                    "name", "Mock User",
                    "role", "USER"
                ));
                
                return ResponseEntity.ok(response);
            }
        }
        
        response.put("status", "invalid");
        response.put("message", "Token is invalid or missing");
        response.put("timestamp", Instant.now().toString());
        
        return ResponseEntity.status(401).body(response);
    }

    @GetMapping("/info")
    public ResponseEntity<Map<String, Object>> getAuthInfo() {
        Map<String, Object> response = new HashMap<>();
        
        response.put("status", "info");
        response.put("message", "Auth test controller is active");
        response.put("timestamp", Instant.now().toString());
        response.put("endpoints", Map.of(
            "login", "POST /auth/login",
            "signup", "POST /auth/signup",
            "validate", "GET /auth/validate",
            "info", "GET /auth/info"
        ));
        response.put("note", "This is a mock authentication system for testing");
        
        return ResponseEntity.ok(response);
    }
}

