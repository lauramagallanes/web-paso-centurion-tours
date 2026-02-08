package com.tinambu.tours.controller;

import com.tinambu.tours.dto.response.AlojamientoImagenResponse;
import com.tinambu.tours.dto.response.SenderoImagenResponse;
import com.tinambu.tours.service.AlojamientoService;
import com.tinambu.tours.service.SenderoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.UUID;

/**
 * Controller for managing sendero images upload to S3 and database operations
 * Based on senderos-implementation-plan.md Phase 3.1
 */
@RestController
@RequestMapping("/images")
@CrossOrigin(origins = "*")
public class ImageController {

    @Autowired
    private SenderoService senderoService;
    
    @Autowired
    private AlojamientoService alojamientoService;

    /**
     * Upload multiple images for a sendero
     * POST /api/images/senderos/{senderoId}
     * 
     * NOTE: Temporarily disabled @PreAuthorize for development debugging
     * TODO: Re-enable authentication once CORS and token issues are resolved
     */
    @PostMapping(value = "/senderos/{senderoId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    // @PreAuthorize("hasRole('ADMIN')") // Temporarily disabled for debugging
    public ResponseEntity<?> uploadSenderoImages(
            @PathVariable UUID senderoId,
            @RequestParam(value = "files", required = false) MultipartFile[] files,
            @RequestParam(value = "descriptions", required = false) String[] descriptions,
            HttpServletRequest request) {
        
        try {
            // Validate sendero exists
            if (!senderoService.existsById(senderoId)) {
                return ResponseEntity.notFound().build();
            }

            // Check if files come from Lambda multipart processing
            MultipartFile[] actualFiles = files;
            if ((actualFiles == null || actualFiles.length == 0) && 
                Boolean.TRUE.equals(request.getAttribute("lambda.multipart.processed"))) {
                
                System.out.println("🔧 Getting files from Lambda multipart processing");
                @SuppressWarnings("unchecked")
                java.util.List<MultipartFile> lambdaFiles = 
                    (java.util.List<MultipartFile>) request.getAttribute("lambda.multipart.files");
                
                if (lambdaFiles != null && !lambdaFiles.isEmpty()) {
                    actualFiles = lambdaFiles.toArray(new MultipartFile[0]);
                    System.out.println("✅ Retrieved " + actualFiles.length + " file(s) from Lambda processing");
                }
            }

            // Validate files
            if (actualFiles == null || actualFiles.length == 0) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "No se proporcionaron archivos para subir");
                return ResponseEntity.badRequest().body(errorResponse);
            }

            // Validate file count (max 10 per sendero)
            long currentImageCount = senderoService.getImageCount(senderoId);
            if (currentImageCount + actualFiles.length > 10) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "Máximo 10 imágenes por sendero. Actualmente tienes " + currentImageCount);
                return ResponseEntity.badRequest().body(errorResponse);
            }

            // Upload images
            List<SenderoImagenResponse> uploadedImages = senderoService.addImagesToSendero(senderoId, actualFiles, descriptions);
            
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
     * 
     * NOTE: Temporarily disabled @PreAuthorize for development debugging
     */
    @DeleteMapping("/{imageId}")
    // @PreAuthorize("hasRole('ADMIN')") // Temporarily disabled for debugging
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

    // ================== ALOJAMIENTOS IMAGE ENDPOINTS ==================

    /**
     * Upload multiple images for an alojamiento
     * POST /api/images/alojamientos/{alojamientoId}
     */
    @PostMapping(value = "/alojamientos/{alojamientoId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    // @PreAuthorize("hasRole('ADMIN')") // Temporarily disabled for debugging
    public ResponseEntity<?> uploadAlojamientoImages(
            @PathVariable UUID alojamientoId,
            @RequestParam(value = "files", required = false) MultipartFile[] files,
            @RequestParam(value = "descriptions", required = false) String[] descriptions,
            HttpServletRequest request) {
        
        try {
            // Validate alojamiento exists
            if (!alojamientoService.existsById(alojamientoId)) {
                return ResponseEntity.notFound().build();
            }

            // Check if files come from Lambda multipart processing
            MultipartFile[] actualFiles = files;
            if ((actualFiles == null || actualFiles.length == 0) && 
                Boolean.TRUE.equals(request.getAttribute("lambda.multipart.processed"))) {
                
                System.out.println("🔧 Getting files from Lambda multipart processing");
                @SuppressWarnings("unchecked")
                java.util.List<MultipartFile> lambdaFiles = 
                    (java.util.List<MultipartFile>) request.getAttribute("lambda.multipart.files");
                
                if (lambdaFiles != null && !lambdaFiles.isEmpty()) {
                    actualFiles = lambdaFiles.toArray(new MultipartFile[0]);
                    System.out.println("✅ Retrieved " + actualFiles.length + " file(s) from Lambda processing");
                }
            }

            // Validate files
            if (actualFiles == null || actualFiles.length == 0) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "No se proporcionaron archivos para subir");
                return ResponseEntity.badRequest().body(errorResponse);
            }

            // Validate file count (max 10 per alojamiento)
            long currentImageCount = alojamientoService.getImageCount(alojamientoId);
            if (currentImageCount + actualFiles.length > 10) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "Máximo 10 imágenes por habitación. Actualmente tienes " + currentImageCount);
                return ResponseEntity.badRequest().body(errorResponse);
            }

            // Upload images
            List<AlojamientoImagenResponse> uploadedImages = alojamientoService.addImagesToAlojamiento(alojamientoId, actualFiles, descriptions);
            
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
     * Get all images for an alojamiento
     * GET /api/images/alojamientos/{alojamientoId}
     */
    @GetMapping("/alojamientos/{alojamientoId}")
    public ResponseEntity<?> getAlojamientoImages(@PathVariable UUID alojamientoId) {
        try {
            List<AlojamientoImagenResponse> images = alojamientoService.getAlojamientoImages(alojamientoId);
            return ResponseEntity.ok(images);
            
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Error obteniendo imágenes: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    // ================== PRESIGNED URL ENDPOINTS FOR DIRECT S3 UPLOAD ==================

    /**
     * Generate a presigned URL for uploading an image directly to S3
     * GET /api/images/alojamientos/{alojamientoId}/presigned-url
     * 
     * Query params:
     *  - filename: Original filename
     *  - contentType: MIME type (e.g., image/jpeg)
     */
    @GetMapping("/alojamientos/{alojamientoId}/presigned-url")
    // @PreAuthorize("hasRole('ADMIN')") // Temporarily disabled for debugging
    public ResponseEntity<?> generatePresignedUrl(
            @PathVariable UUID alojamientoId,
            @RequestParam String filename,
            @RequestParam(required = false) String contentType) {
        
        try {
            Map<String, String> presignedData = alojamientoService.generatePresignedUploadUrl(
                alojamientoId, 
                filename, 
                contentType
            );
            
            return ResponseEntity.ok(presignedData);
            
        } catch (IllegalArgumentException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Error generando URL de subida: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Register an image after it has been uploaded directly to S3
     * POST /api/images/alojamientos/{alojamientoId}/register
     * 
     * Request body:
     *  - imageUrl: The S3 URL of the uploaded image
     *  - descripcion: Optional description
     */
    @PostMapping("/alojamientos/{alojamientoId}/register")
    // @PreAuthorize("hasRole('ADMIN')") // Temporarily disabled for debugging
    public ResponseEntity<?> registerUploadedImage(
            @PathVariable UUID alojamientoId,
            @RequestBody Map<String, String> payload) {
        
        try {
            String imageUrl = payload.get("imageUrl");
            String descripcion = payload.get("descripcion");
            
            if (imageUrl == null || imageUrl.isEmpty()) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "imageUrl es requerido");
                return ResponseEntity.badRequest().body(errorResponse);
            }
            
            AlojamientoImagenResponse image = alojamientoService.registerUploadedImage(
                alojamientoId, 
                imageUrl, 
                descripcion
            );
            
            Map<String, Object> successResponse = new HashMap<>();
            successResponse.put("message", "Imagen registrada exitosamente");
            successResponse.put("image", image);
            return ResponseEntity.ok(successResponse);
            
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Error registrando imagen: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

}
