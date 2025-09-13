package com.tinambu.tours.controller;

import com.tinambu.tours.entity.usuario.Usuario;
import com.tinambu.tours.service.UsuarioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
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
@Profile("lambda-with-db")
public class AuthTestController {

    @Autowired
    private UsuarioService usuarioService;
    
    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, Object> loginRequest) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            String email = (String) loginRequest.get("email");
            String password = (String) loginRequest.get("password");
            
            // REAL database authentication
            if (email != null && password != null && 
                email.contains("@") && password.length() >= 4) {
                
                try {
                    // Buscar usuario en base de datos real
                    Usuario usuario = usuarioService.obtenerUsuarioPorEmail(email);
                    
                    // Verificar contraseña
                    if (usuario.getActivo() && passwordEncoder.matches(password, usuario.getPassword())) {
                        
                        // Real JWT token (simplified)
                        String realToken = "real-jwt-token-" + System.currentTimeMillis();
                        
                        response.put("status", "success"); // Frontend espera "status", no "success"
                        response.put("message", "Login exitoso con BD real");
                        response.put("timestamp", Instant.now().toString());
                        response.put("token", realToken); // Frontend espera "token" directo
                        response.put("user", Map.of( // Frontend espera "user", no "data.usuario"
                            "id", usuario.getId().toString(),
                            "email", usuario.getEmail(),
                            "name", usuario.getNombreCompleto(), // Frontend espera "name"
                            "role", usuario.getTipo().name() // Frontend mapea role a tipo
                        ));
                        
                        return ResponseEntity.ok(response);
                    } else {
                        response.put("status", "error");
                        response.put("message", "Credenciales inválidas");
                        response.put("timestamp", Instant.now().toString());
                        return ResponseEntity.status(401).body(response);
                    }
                } catch (Exception dbError) {
                    response.put("status", "error");
                    response.put("message", "Usuario no encontrado: " + dbError.getMessage());
                    response.put("timestamp", Instant.now().toString());
                    return ResponseEntity.status(401).body(response);
                }
                
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
            
            // REAL database signup
            if (email != null && password != null && name != null &&
                email.contains("@") && password.length() >= 4 && name.length() >= 2) {
                
                try {
                    // Verificar si el usuario ya existe
                    if (usuarioService.existeUsuarioConEmail(email)) {
                        response.put("success", false);
                        response.put("error", "Ya existe un usuario con este email");
                        response.put("timestamp", Instant.now().toString());
                        return ResponseEntity.status(400).body(response);
                    }
                    
                    // Crear usuario real en la base de datos
                    Usuario nuevoUsuario = usuarioService.crearVisitante(email, password, name);
                    
                    response.put("success", true);
                    response.put("message", "Usuario registrado exitosamente en BD real");
                    response.put("timestamp", Instant.now().toString());
                    response.put("data", Map.of(
                        "id", nuevoUsuario.getId().toString(),
                        "email", nuevoUsuario.getEmail(),
                        "nombreCompleto", nuevoUsuario.getNombreCompleto(),
                        "tipo", nuevoUsuario.getTipo().name(),
                        "activo", nuevoUsuario.getActivo(),
                        "fechaCreacion", nuevoUsuario.getFechaCreacion().toString()
                    ));
                    
                    return ResponseEntity.status(201).body(response);
                    
                } catch (Exception dbError) {
                    response.put("success", false);
                    response.put("error", "Error al crear usuario: " + dbError.getMessage());
                    response.put("timestamp", Instant.now().toString());
                    return ResponseEntity.status(500).body(response);
                }
                
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

