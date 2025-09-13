package com.tinambu.tours.controller;

import com.tinambu.tours.dto.response.ApiResponse;
import com.tinambu.tours.dto.response.UsuarioResponse;
import com.tinambu.tours.entity.usuario.Usuario;
import com.tinambu.tours.service.UsuarioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/admin-setup")
@CrossOrigin(origins = "*")
@Profile("lambda-with-db")
public class AdminSetupController {

    @Autowired
    private UsuarioService usuarioService;

    /**
     * Endpoint temporal para crear usuario administrador
     */
    @PostMapping("/create-admin")
    public ResponseEntity<ApiResponse<UsuarioResponse>> createAdmin(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            String password = request.get("password");
            String nombreCompleto = request.get("nombreCompleto");

            // Validaciones básicas
            if (email == null || password == null || nombreCompleto == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Email, password y nombreCompleto son requeridos"));
            }

            // Verificar si el email ya existe
            if (usuarioService.existeUsuarioConEmail(email)) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Ya existe un usuario con este email"));
            }

            // Crear administrador
            Usuario nuevoAdmin = usuarioService.crearAdministrador(email, password, nombreCompleto);

            // Convertir a response
            UsuarioResponse usuarioResponse = convertirAUsuarioResponse(nuevoAdmin);

            return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(usuarioResponse, "Administrador creado exitosamente"));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Error interno del servidor: " + e.getMessage()));
        }
    }

    // Helper method para convertir Usuario a UsuarioResponse
    private UsuarioResponse convertirAUsuarioResponse(Usuario usuario) {
        UsuarioResponse response = new UsuarioResponse();
        response.setId(usuario.getId());
        response.setEmail(usuario.getEmail());
        response.setNombreCompleto(usuario.getNombreCompleto());
        response.setTipo(usuario.getTipo());
        response.setActivo(usuario.getActivo());
        response.setFechaCreacion(usuario.getFechaCreacion());
        return response;
    }
}
