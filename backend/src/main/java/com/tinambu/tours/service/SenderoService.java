package com.tinambu.tours.service;

import com.tinambu.tours.dto.request.SenderoRequest;
import com.tinambu.tours.dto.response.SenderoResponse;
import com.tinambu.tours.dto.response.SenderoImagenResponse;
import com.tinambu.tours.entity.sendero.NivelDificultad;
import com.tinambu.tours.entity.sendero.Sendero;
import com.tinambu.tours.entity.sendero.SenderoImagen;
import com.tinambu.tours.repository.SenderoRepository;
import com.tinambu.tours.repository.SenderoImagenRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.Arrays;
import java.util.Optional;

@Service
@Transactional
public class SenderoService {

    @Autowired
    private SenderoRepository senderoRepository;
    
    @Autowired
    private SenderoImagenRepository senderoImagenRepository;
    
    @Autowired
    private S3Client s3Client;
    
    @Value("${aws.s3.bucket-name:imagenespasocenturion}")
    private String s3BucketName;
    
    private final List<String> ALLOWED_IMAGE_TYPES = Arrays.asList(
        "image/jpeg", "image/jpg", "image/png", "image/webp"
    );
    
    private final long MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

    // ========== IMAGE MANAGEMENT METHODS (New) ==========
    
    /**
     * Add multiple images to a sendero (upload to S3 and save to DB)
     */
    @Transactional
    public List<SenderoImagenResponse> addImagesToSendero(UUID senderoId, MultipartFile[] files, String[] descriptions) {
        // Validate sendero exists
        Sendero sendero = obtenerSenderoPorId(senderoId);
        
        // Get current image count for ordering
        int currentOrder = (int) senderoImagenRepository.countBySenderoId(senderoId);
        
        List<SenderoImagenResponse> uploadedImages = new java.util.ArrayList<>();
        
        for (int i = 0; i < files.length; i++) {
            MultipartFile file = files[i];
            String description = (descriptions != null && i < descriptions.length) ? descriptions[i] : null;
            
            // Validate file
            validateImageFile(file);
            
            try {
                // Generate unique filename
                String fileName = generateUniqueFileName(file.getOriginalFilename());
                String s3Key = "senderos/" + senderoId + "/" + fileName;
                
                // Upload to S3
                PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(s3BucketName)
                    .key(s3Key)
                    .contentType(file.getContentType())
                    .build();
                
                s3Client.putObject(putObjectRequest, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));
                
                // Create image URL
                String imageUrl = String.format("https://%s.s3.us-east-1.amazonaws.com/%s", s3BucketName, s3Key);
                
                // Save to database
                SenderoImagen senderoImagen = new SenderoImagen(senderoId, imageUrl, description, currentOrder + i + 1);
                
                // Set as principal if it's the first image for this sendero
                if (currentOrder == 0 && i == 0) {
                    senderoImagen.marcarComoPrincipal();
                    sendero.setImagenPrincipal(imageUrl);
                    sendero.setGaleria(true);
                }
                
                SenderoImagen savedImage = senderoImagenRepository.save(senderoImagen);
                uploadedImages.add(new SenderoImagenResponse(savedImage));
                
            } catch (IOException e) {
                throw new RuntimeException("Error subiendo archivo: " + file.getOriginalFilename(), e);
            }
        }
        
        // Update sendero gallery flag
        if (!sendero.getGaleria() && uploadedImages.size() > 0) {
            sendero.setGaleria(true);
            senderoRepository.save(sendero);
        }
        
        return uploadedImages;
    }
    
    /**
     * Remove image from sendero (delete from S3 and DB)
     */
    @Transactional
    public boolean removeImageFromSendero(UUID imageId) {
        Optional<SenderoImagen> imageOpt = senderoImagenRepository.findById(imageId);
        if (!imageOpt.isPresent()) {
            return false;
        }
        
        SenderoImagen image = imageOpt.get();
        
        try {
            // Delete from S3
            String s3Key = extractS3KeyFromUrl(image.getUrlImagen());
            DeleteObjectRequest deleteObjectRequest = DeleteObjectRequest.builder()
                .bucket(s3BucketName)
                .key(s3Key)
                .build();
            s3Client.deleteObject(deleteObjectRequest);
            
            // Delete from database
            senderoImagenRepository.delete(image);
            
            // Update order of remaining images
            senderoImagenRepository.decrementOrderAfterPosition(image.getSenderoId(), image.getOrden());
            
            // Update sendero if this was the main image
            if (image.getEsPrincipal()) {
                updateMainImageAfterDelete(image.getSenderoId());
            }
            
            return true;
            
        } catch (Exception e) {
            throw new RuntimeException("Error eliminando imagen de S3", e);
        }
    }
    
    /**
     * Set an image as the main image for the sendero
     */
    @Transactional  
    public boolean setMainImage(UUID imageId) {
        Optional<SenderoImagen> imageOpt = senderoImagenRepository.findById(imageId);
        if (!imageOpt.isPresent()) {
            return false;
        }
        
        SenderoImagen image = imageOpt.get();
        
        // Unmark all images as principal for this sendero
        senderoImagenRepository.unmarkAllAsPrincipalForSendero(image.getSenderoId());
        
        // Mark this image as principal
        image.marcarComoPrincipal();
        senderoImagenRepository.save(image);
        
        // Update sendero main image URL
        Sendero sendero = obtenerSenderoPorId(image.getSenderoId());
        sendero.setImagenPrincipal(image.getUrlImagen());
        senderoRepository.save(sendero);
        
        return true;
    }
    
    /**
     * Update display order of images
     */
    @Transactional
    public boolean updateImageOrder(UUID senderoId, List<UUID> imageIds) {
        List<SenderoImagen> images = senderoImagenRepository.findBySenderoId(senderoId);
        
        // Validate all image IDs belong to this sendero
        List<UUID> existingImageIds = images.stream()
            .map(SenderoImagen::getId)
            .collect(Collectors.toList());
        
        if (!existingImageIds.containsAll(imageIds) || imageIds.size() != existingImageIds.size()) {
            return false;
        }
        
        // Update order
        for (int i = 0; i < imageIds.size(); i++) {
            UUID imageId = imageIds.get(i);
            SenderoImagen image = images.stream()
                .filter(img -> img.getId().equals(imageId))
                .findFirst()
                .orElse(null);
            
            if (image != null) {
                image.setOrden(i + 1);
                senderoImagenRepository.save(image);
            }
        }
        
        return true;
    }
    
    /**
     * Get all images for a sendero
     */
    @Transactional(readOnly = true)
    public List<SenderoImagenResponse> getSenderoImages(UUID senderoId) {
        List<SenderoImagen> images = senderoImagenRepository.findBySenderoIdOrderByOrdenAsc(senderoId);
        return images.stream()
            .map(SenderoImagenResponse::new)
            .collect(Collectors.toList());
    }
    
    /**
     * Get image count for a sendero
     */
    @Transactional(readOnly = true)
    public long getImageCount(UUID senderoId) {
        return senderoImagenRepository.countBySenderoId(senderoId);
    }
    
    /**
     * Check if sendero exists
     */
    @Transactional(readOnly = true)
    public boolean existsById(UUID senderoId) {
        return senderoRepository.existsById(senderoId);
    }
    
    // ========== PRIVATE HELPER METHODS ==========
    
    private void validateImageFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("El archivo está vacío");
        }
        
        if (file.getSize() > MAX_IMAGE_SIZE) {
            throw new IllegalArgumentException("El archivo es demasiado grande. Máximo 5MB");
        }
        
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_IMAGE_TYPES.contains(contentType.toLowerCase())) {
            throw new IllegalArgumentException("Tipo de archivo no permitido. Solo se permiten: JPEG, PNG, WebP");
        }
    }
    
    private String generateUniqueFileName(String originalFileName) {
        String extension = "";
        if (originalFileName != null && originalFileName.contains(".")) {
            extension = originalFileName.substring(originalFileName.lastIndexOf("."));
        }
        return System.currentTimeMillis() + "_" + UUID.randomUUID().toString() + extension;
    }
    
    private String extractS3KeyFromUrl(String imageUrl) {
        // Extract S3 key from URL like: https://bucket.s3.region.amazonaws.com/key
        if (imageUrl.contains(s3BucketName + ".s3.")) {
            return imageUrl.substring(imageUrl.indexOf(".amazonaws.com/") + 14);
        }
        return imageUrl; // fallback
    }
    
    private void updateMainImageAfterDelete(UUID senderoId) {
        // Find first remaining image and set as principal
        List<SenderoImagen> remainingImages = senderoImagenRepository.findBySenderoIdOrderByOrdenAsc(senderoId);
        
        Sendero sendero = obtenerSenderoPorId(senderoId);
        
        if (remainingImages.isEmpty()) {
            // No images left
            sendero.setImagenPrincipal(null);
            sendero.setGaleria(false);
        } else {
            // Set first image as principal
            SenderoImagen firstImage = remainingImages.get(0);
            firstImage.marcarComoPrincipal();
            senderoImagenRepository.save(firstImage);
            
            sendero.setImagenPrincipal(firstImage.getUrlImagen());
        }
        
        senderoRepository.save(sendero);
    }

    // ========== EXISTING SENDERO CRUD METHODS ==========

    /**
     * Crear nuevo sendero
     */
    public SenderoResponse crearSendero(SenderoRequest senderoRequest) {
        // Validar que el nombre no esté duplicado (usando findAll por simplicidad)
        List<Sendero> existingSenderos = senderoRepository.findAll();
        boolean nombreExiste = existingSenderos.stream()
            .anyMatch(s -> s.getNombre().equals(senderoRequest.getNombre()));
        if (nombreExiste) {
            throw new IllegalArgumentException("Ya existe un sendero con el nombre: " + senderoRequest.getNombre());
        }

        Sendero sendero = convertirRequestAEntidad(senderoRequest);
        Sendero senderoGuardado = senderoRepository.save(sendero);
        return convertirEntidadAResponse(senderoGuardado);
    }

    /**
     * Actualizar sendero existente
     */
    public SenderoResponse actualizarSendero(UUID id, SenderoRequest senderoRequest) {
        Sendero sendero = obtenerSenderoPorId(id);

        // Verificar si cambió el nombre y si ya existe
        if (!sendero.getNombre().equals(senderoRequest.getNombre())) {
            List<Sendero> existingSenderos = senderoRepository.findAll();
            boolean nombreExiste = existingSenderos.stream()
                .anyMatch(s -> s.getNombre().equals(senderoRequest.getNombre()) && !s.getId().equals(id));
            if (nombreExiste) {
                throw new IllegalArgumentException("Ya existe un sendero con el nombre: " + senderoRequest.getNombre());
            }
        }

        // Actualizar campos
        sendero.setNombre(senderoRequest.getNombre());
        sendero.setDescripcion(senderoRequest.getDescripcion());
        sendero.setDuracionHoras(senderoRequest.getDuracionHoras());
        sendero.setNivelDificultad(senderoRequest.getNivelDificultad());
        sendero.setCapacidadMaximaGrupo(senderoRequest.getCapacidadMaximaGrupo());
        sendero.setPrecioPorPersona(senderoRequest.getPrecioPorPersona());
        sendero.setUrlImagen(senderoRequest.getUrlImagen());

        Sendero senderoActualizado = senderoRepository.save(sendero);
        return convertirEntidadAResponse(senderoActualizado);
    }

    /**
     * Activar/desactivar sendero
     */
    public Sendero cambiarEstadoSendero(UUID id, boolean activo) {
        Sendero sendero = obtenerSenderoPorId(id);
        sendero.setActivo(activo);
        return senderoRepository.save(sendero);
    }

    /**
     * Buscar senderos por capacidad mínima
     */
    @Transactional(readOnly = true)
    public List<SenderoResponse> buscarPorCapacidadMinima(Integer numeroPersonas) {
        List<Sendero> allSenderos = senderoRepository.findAll();
        List<Sendero> senderos = allSenderos.stream()
            .filter(s -> s.getCapacidadMaximaGrupo() >= numeroPersonas && s.getActivo())
            .collect(Collectors.toList());
        return senderos.stream()
                .map(this::convertirEntidadAResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public SenderoResponse obtenerSenderoPorIdPublico(UUID id) {
        Sendero sendero = obtenerSenderoPorId(id);
        return convertirEntidadAResponse(sendero);
    }

    // Método interno para obtener entidad (usado internamente por el servicio)
    @Transactional(readOnly = true)
    public Sendero obtenerSenderoPorId(UUID id) {
        return senderoRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Sendero no encontrado"));
    }

    @Transactional(readOnly = true)
    public List<SenderoResponse> obtenerTodosLosSenderos() {
        List<Sendero> senderos = senderoRepository.findAll();
        return senderos.stream()
                .map(this::convertirEntidadAResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SenderoResponse> obtenerSenderosActivos() {
        List<Sendero> allSenderos = senderoRepository.findAll();
        List<Sendero> senderos = allSenderos.stream()
            .filter(s -> s.getActivo())
            .collect(Collectors.toList());
        return senderos.stream()
                .map(this::convertirEntidadAResponse)
                .collect(Collectors.toList());
    }

    /**
     * Eliminar sendero (soft delete - desactivar)
     */
    public void eliminarSendero(UUID id) {
        cambiarEstadoSendero(id, false);
    }

    // ========== MÉTODOS DE CONVERSIÓN ==========

    /**
     * Convierte un SenderoRequest DTO a entidad Sendero
     */
    private Sendero convertirRequestAEntidad(SenderoRequest request) {
        Sendero sendero = new Sendero();
        sendero.setNombre(request.getNombre());
        sendero.setDescripcion(request.getDescripcion());
        sendero.setDuracionHoras(request.getDuracionHoras());
        sendero.setNivelDificultad(request.getNivelDificultad());
        sendero.setCapacidadMaximaGrupo(request.getCapacidadMaximaGrupo());
        sendero.setPrecioPorPersona(request.getPrecioPorPersona());
        sendero.setUrlImagen(request.getUrlImagen());
        return sendero;
    }

    /**
     * Convierte una entidad Sendero a SenderoResponse DTO
     * Incluye información de imágenes si están disponibles
     */
    private SenderoResponse convertirEntidadAResponse(Sendero sendero) {
        SenderoResponse response = new SenderoResponse();
        response.setId(sendero.getId());
        response.setNombre(sendero.getNombre());
        response.setDescripcion(sendero.getDescripcion());
        response.setDuracionHoras(sendero.getDuracionHoras());
        response.setNivelDificultad(sendero.getNivelDificultad());
        response.setCapacidadMaximaGrupo(sendero.getCapacidadMaximaGrupo());
        response.setPrecioPorPersona(sendero.getPrecioPorPersona());
        response.setUrlImagen(sendero.getUrlImagen());
        
        // Add new image-related fields
        response.setImagenPrincipal(sendero.getImagenPrincipal());
        response.setTieneGaleria(sendero.getGaleria() != null ? sendero.getGaleria() : false);
        
        // Get image count
        long imageCount = senderoImagenRepository.countBySenderoId(sendero.getId());
        response.setTotalImagenes((int) imageCount);
        
        return response;
    }
}
