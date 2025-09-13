package com.tinambu.tours.controller;

import com.tinambu.tours.dto.response.ApiResponse;
import com.tinambu.tours.entity.sendero.Sendero;
import com.tinambu.tours.repository.SenderoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Controlador simplificado para senderos sin servicios complejos
 */
@RestController
@RequestMapping("/senderos")
@CrossOrigin(origins = {"*"})
public class SimpleSenderoController {

    @Autowired
    private SenderoRepository senderoRepository;

    /**
     * Obtener todos los senderos activos
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<Sendero>>> obtenerSenderosActivos() {
        try {
            // Usar base de datos real - obtener solo senderos activos
            List<Sendero> senderos = senderoRepository.findAll()
                .stream()
                .filter(Sendero::getActivo)
                .toList();
            return ResponseEntity.ok(ApiResponse.success(senderos));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Error al obtener senderos"));
        }
    }

    /**
     * Obtener sendero por ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Sendero>> obtenerSenderoPorId(@PathVariable UUID id) {
        try {
            return senderoRepository.findById(id)
                .map(sendero -> ResponseEntity.ok(ApiResponse.success(sendero)))
                .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Error al obtener sendero"));
        }
    }

    /**
     * Obtener todos los senderos (incluyendo inactivos) - Solo administradores
     */
    @GetMapping("/admin")
    public ResponseEntity<ApiResponse<List<Sendero>>> obtenerTodosLosSenderos() {
        try {
            List<Sendero> senderos = senderoRepository.findAll();
            return ResponseEntity.ok(ApiResponse.success(senderos));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Error al obtener senderos"));
        }
    }

    /**
     * Crear nuevo sendero - Solo administradores
     */
    @PostMapping("/admin")
    public ResponseEntity<ApiResponse<Sendero>> crearSendero(@RequestBody Sendero sendero) {
        try {
            // Generar ID si no existe
            if (sendero.getId() == null) {
                sendero.setId(UUID.randomUUID());
            }
            sendero.setActivo(true);
            
            Sendero nuevoSendero = senderoRepository.save(sendero);
            return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(nuevoSendero));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Error al crear sendero"));
        }
    }

    /**
     * Actualizar sendero existente - Solo administradores
     */
    @PutMapping("/admin/{id}")
    public ResponseEntity<ApiResponse<Sendero>> actualizarSendero(@PathVariable UUID id, @RequestBody Sendero sendero) {
        try {
            if (!senderoRepository.existsById(id)) {
                return ResponseEntity.notFound().build();
            }
            
            sendero.setId(id);
            Sendero senderoActualizado = senderoRepository.save(sendero);
            return ResponseEntity.ok(ApiResponse.success(senderoActualizado));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Error al actualizar sendero"));
        }
    }

    /**
     * Eliminar sendero - Solo administradores
     */
    @DeleteMapping("/admin/{id}")
    public ResponseEntity<ApiResponse<Void>> eliminarSendero(@PathVariable UUID id) {
        try {
            if (!senderoRepository.existsById(id)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("Sendero no encontrado"));
            }
            
            senderoRepository.deleteById(id);
            return ResponseEntity.ok(ApiResponse.success("Sendero eliminado exitosamente"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Error al eliminar sendero"));
        }
    }
}
