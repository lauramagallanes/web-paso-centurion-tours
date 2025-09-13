package com.tinambu.tours.controller;

import com.tinambu.tours.dto.response.SenderoImagenResponse;
import com.tinambu.tours.service.SenderoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.UUID;

/**
 * Controller for managing sendero images upload to S3 and database operations
 * Based on senderos-implementation-plan.md Phase 3.1
 */
@RestController
@RequestMapping("/api/images")
@CrossOrigin(origins = "*")
public class ImageController {

    @Autowired
    private SenderoService senderoService;

    /**
     * Upload multiple images for a sendero
     * POST /api/images/senderos/{senderoId}
     */
    @PostMapping(value = "/senderos/{senderoId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> uploadSenderoImages(
            @PathVariable UUID senderoId,
            @RequestParam("files") MultipartFile[] files,
            @RequestParam(value = "descriptions", required = false) String[] descriptions) {
        
        try {
            // Validate sendero exists
            if (!senderoService.existsById(senderoId)) {
                return ResponseEntity.notFound().build();
            }

            // Validate files
            if (files == null || files.length == 0) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "No se proporcionaron archivos para subir");
                return ResponseEntity.badRequest().body(errorResponse);
            }

            // Validate file count (max 10 per sendero)
            long currentImageCount = senderoService.getImageCount(senderoId);
            if (currentImageCount + files.length > 10) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "Máximo 10 imágenes por sendero. Actualmente tienes " + currentImageCount);
                return ResponseEntity.badRequest().body(errorResponse);
            }

            // Upload images
            List<SenderoImagenResponse> uploadedImages = senderoService.addImagesToSendero(senderoId, files, descriptions);
            
            Map<String, Object> successResponse = new HashMap<>();
            successResponse.put("message", "Imágenes subidas exitosamente");
            successResponse.put("images", uploadedImages);
            successResponse.put("count", uploadedImages.size());
            return ResponseEntity.ok(successResponse);
            
        } catch (IllegalArgumentException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Error interno del servidor: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Delete a single image
     * DELETE /api/images/{imageId}
     */
    @DeleteMapping("/{imageId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteImage(@PathVariable UUID imageId) {
        try {
            boolean deleted = senderoService.removeImageFromSendero(imageId);
            
            if (deleted) {
                Map<String, Object> successResponse = new HashMap<>();
                successResponse.put("message", "Imagen eliminada exitosamente");
                return ResponseEntity.ok(successResponse);
            } else {
                return ResponseEntity.notFound().build();
            }
            
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Error eliminando imagen: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Set an image as the main image for the sendero
     * PUT /api/images/{imageId}/principal
     */
    @PutMapping("/{imageId}/principal")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> setMainImage(@PathVariable UUID imageId) {
        try {
            boolean updated = senderoService.setMainImage(imageId);
            
            if (updated) {
                Map<String, Object> successResponse = new HashMap<>();
                successResponse.put("message", "Imagen principal actualizada exitosamente");
                return ResponseEntity.ok(successResponse);
            } else {
                return ResponseEntity.notFound().build();
            }
            
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Error actualizando imagen principal: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Update display order of multiple images
     * PUT /api/images/senderos/{senderoId}/orden
     */
    @PutMapping("/senderos/{senderoId}/orden")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateImageOrder(
            @PathVariable UUID senderoId,
            @RequestBody List<UUID> imageIds) {
        
        try {
            boolean updated = senderoService.updateImageOrder(senderoId, imageIds);
            
            if (updated) {
                Map<String, Object> successResponse = new HashMap<>();
                successResponse.put("message", "Orden de imágenes actualizado exitosamente");
                return ResponseEntity.ok(successResponse);
            } else {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "No se pudo actualizar el orden de las imágenes");
                return ResponseEntity.badRequest().body(errorResponse);
            }
            
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Error actualizando orden: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Get all images for a sendero
     * GET /api/images/senderos/{senderoId}
     */
    @GetMapping("/senderos/{senderoId}")
    public ResponseEntity<?> getSenderoImages(@PathVariable UUID senderoId) {
        try {
            List<SenderoImagenResponse> images = senderoService.getSenderoImages(senderoId);
            return ResponseEntity.ok(images);
            
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Error obteniendo imágenes: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

}
