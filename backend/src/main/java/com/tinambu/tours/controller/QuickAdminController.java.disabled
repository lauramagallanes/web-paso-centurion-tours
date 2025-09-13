package com.tinambu.tours.controller;

import com.tinambu.tours.entity.usuario.TipoUsuario;
import com.tinambu.tours.entity.usuario.Usuario;
import com.tinambu.tours.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/quick-admin")
@CrossOrigin(origins = "*")
@Profile("lambda-with-db")
public class QuickAdminController {

    @Autowired
    private UsuarioRepository usuarioRepository;

    /**
     * Endpoint para convertir usuario existente a ADMIN
     */
    @PostMapping("/make-admin")
    public ResponseEntity<Map<String, Object>> makeAdmin(@RequestBody Map<String, String> request) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            String email = request.get("email");
            
            if (email == null) {
                response.put("success", false);
                response.put("message", "Email es requerido");
                return ResponseEntity.badRequest().body(response);
            }

            // Buscar usuario por email
            Optional<Usuario> usuarioOpt = usuarioRepository.findByEmail(email);
            
            if (usuarioOpt.isEmpty()) {
                response.put("success", false);
                response.put("message", "Usuario no encontrado: " + email);
                return ResponseEntity.notFound().build();
            }

            Usuario usuario = usuarioOpt.get();
            
            // Cambiar tipo a ADMIN
            usuario.setTipo(TipoUsuario.ADMIN);
            usuarioRepository.save(usuario);

            response.put("success", true);
            response.put("message", "Usuario convertido a ADMIN exitosamente");
            response.put("usuario", Map.of(
                "id", usuario.getId().toString(),
                "email", usuario.getEmail(),
                "nombreCompleto", usuario.getNombreCompleto(),
                "tipo", usuario.getTipo().name(),
                "activo", usuario.getActivo()
            ));

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
}

