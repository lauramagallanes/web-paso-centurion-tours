package com.tinambu.tours.service;

import com.tinambu.tours.dto.request.SenderoBloqueoRequest;
import com.tinambu.tours.dto.request.SenderoDisponibilidadRequest;
import com.tinambu.tours.dto.request.SenderoRequest;
import com.tinambu.tours.dto.response.SenderoBloqueoResponse;
import com.tinambu.tours.dto.response.SenderoDisponibilidadResponse;
import com.tinambu.tours.dto.response.SenderoResponse;
import com.tinambu.tours.dto.response.SenderoImagenResponse;
import com.tinambu.tours.entity.sendero.NivelDificultad;
import com.tinambu.tours.entity.sendero.Sendero;
import com.tinambu.tours.entity.sendero.SenderoBloqueo;
import com.tinambu.tours.entity.sendero.SenderoDisponibilidad;
import com.tinambu.tours.entity.sendero.SenderoImagen;
import com.tinambu.tours.entity.sendero.TurnoSendero;
import com.tinambu.tours.repository.SenderoBloqueoRepository;
import com.tinambu.tours.repository.SenderoRepository;
import com.tinambu.tours.repository.SenderoImagenRepository;
import com.tinambu.tours.repository.SenderoDisponibilidadRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
// S3 imports for image management
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class SenderoService {

    @Autowired
    private SenderoRepository senderoRepository;
    
    @Autowired
    private SenderoImagenRepository senderoImagenRepository;

    @Autowired
    private SenderoDisponibilidadRepository senderoDisponibilidadRepository;

    @Autowired
    private SenderoBloqueoRepository senderoBloqueoRepository;

    @Autowired(required = false)
    private S3Client s3Client;
    
    @Value("${S3_PUBLIC_ASSETS_BUCKET:tinambu-public-assets-dev}")
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
        // Check if S3 is available
        if (s3Client == null) {
            throw new IllegalStateException("S3 service not available. Check AWS configuration.");
        }
        
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
                
                // Set as principal if it's the first image for this sendero OR if sendero has no imagenPrincipal yet
                boolean isFirstImage = (currentOrder == 0 && i == 0);
                boolean needsMainImage = (sendero.getImagenPrincipal() == null || sendero.getImagenPrincipal().isEmpty());
                
                if (isFirstImage || (i == 0 && needsMainImage)) {
                    senderoImagen.marcarComoPrincipal();
                    // Update sendero with main image URL
                    sendero.setImagenPrincipal(imageUrl);
                    sendero.setGaleria(true);
                    senderoRepository.save(sendero);
                    System.out.println("✅ Set imagen principal for sendero: " + senderoId + " -> " + imageUrl);
                }
                
                SenderoImagen savedImage = senderoImagenRepository.save(senderoImagen);
                uploadedImages.add(new SenderoImagenResponse(savedImage));
                
            } catch (IOException e) {
                throw new RuntimeException("Error subiendo archivo: " + file.getOriginalFilename(), e);
            }
        }
        
        return uploadedImages;
    }
    
    /**
     * Remove image from sendero (delete from S3 and DB)
     */
    @Transactional
    public boolean removeImageFromSendero(UUID imageId) {
        // Check if S3 is available
        if (s3Client == null) {
            throw new IllegalStateException("S3 service not available. Check AWS configuration.");
        }
        
        Optional<SenderoImagen> imageOpt = senderoImagenRepository.findById(imageId);
        if (!imageOpt.isPresent()) {
            return false;
        }
        
        SenderoImagen image = imageOpt.get();
        boolean wasPrincipal = image.getEsPrincipal();
        UUID senderoId = image.getSenderoId();
        
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
            
            // If this was the principal image, update sendero and set new principal
            if (wasPrincipal) {
                Sendero sendero = obtenerSenderoPorId(senderoId);
                List<SenderoImagen> remainingImages = senderoImagenRepository.findBySenderoIdOrderByOrdenAsc(senderoId);
                
                if (!remainingImages.isEmpty()) {
                    // Set first remaining image as principal
                    SenderoImagen newPrincipal = remainingImages.get(0);
                    newPrincipal.marcarComoPrincipal();
                    senderoImagenRepository.save(newPrincipal);
                    sendero.setImagenPrincipal(newPrincipal.getUrlImagen());
                } else {
                    // No more images, clear principal image
                    sendero.setImagenPrincipal(null);
                    sendero.setGaleria(false);
                }
                senderoRepository.save(sendero);
            }
            
            // Update order of remaining images if repository method exists
            try {
                senderoImagenRepository.decrementOrderAfterPosition(senderoId, image.getOrden());
            } catch (Exception e) {
                // If custom repository method doesn't exist, continue silently
                System.out.println("Warning: Could not reorder images after deletion");
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
     * Obtener sendero por ID como Response (público para controller)
     */
    @Transactional(readOnly = true)
    public SenderoResponse obtenerSenderoPorIdResponse(UUID id) {
        Sendero sendero = obtenerSenderoPorId(id);
        return convertirEntidadAResponse(sendero);
    }

    /**
     * Lists active availability windows for a sendero.
     * Exposed publicly so the frontend calendar can filter bookable dates/turnos.
     */
    @Transactional(readOnly = true)
    public List<SenderoDisponibilidadResponse> listarDisponibilidadesActivas(UUID senderoId) {
        Sendero sendero = senderoRepository.findById(senderoId)
                .orElseThrow(() -> new IllegalArgumentException("Sendero no encontrado: " + senderoId));
        int cuposTotalSendero = sendero.getCapacidadMaximaGrupo() != null ? sendero.getCapacidadMaximaGrupo() : 0;
        return senderoDisponibilidadRepository
                .findBySenderoIdAndActivoTrueOrderByFechaInicioAsc(senderoId)
                .stream()
                .map(sd -> convertirDisponibilidadAResponse(sd, cuposTotalSendero))
                .collect(Collectors.toList());
    }

    private SenderoDisponibilidadResponse convertirDisponibilidadAResponse(SenderoDisponibilidad sd, int cuposTotalSendero) {
        return new SenderoDisponibilidadResponse(
                sd.getId(),
                sd.getSenderoId(),
                sd.getFechaInicio(),
                sd.getFechaFin(),
                sd.getTurno(),
                sd.getDiasSemana(),
                cuposTotalSendero,
                sd.getActivo()
        );
    }

    // ========== ADMIN: GESTIÓN DE VENTANAS DE DISPONIBILIDAD ==========

    /**
     * Lista todas las ventanas (incluso inactivas) — vista admin.
     */
    @Transactional(readOnly = true)
    public List<SenderoDisponibilidadResponse> listarDisponibilidadesAdmin(UUID senderoId) {
        Sendero sendero = senderoRepository.findById(senderoId)
                .orElseThrow(() -> new IllegalArgumentException("Sendero no encontrado: " + senderoId));
        int cuposTotalSendero = sendero.getCapacidadMaximaGrupo() != null ? sendero.getCapacidadMaximaGrupo() : 0;
        return senderoDisponibilidadRepository.findAll().stream()
                .filter(sd -> sd.getSenderoId().equals(senderoId))
                .sorted((a, b) -> a.getFechaInicio().compareTo(b.getFechaInicio()))
                .map(sd -> convertirDisponibilidadAResponse(sd, cuposTotalSendero))
                .collect(Collectors.toList());
    }

    public SenderoDisponibilidadResponse crearDisponibilidad(UUID senderoId, SenderoDisponibilidadRequest req) {
        Sendero sendero = senderoRepository.findById(senderoId)
                .orElseThrow(() -> new IllegalArgumentException("Sendero no encontrado: " + senderoId));
        validarRangoFechas(req.getFechaInicio(), req.getFechaFin());

        SenderoDisponibilidad sd = new SenderoDisponibilidad(
                senderoId,
                req.getFechaInicio(),
                req.getFechaFin(),
                req.getTurno(),
                normalizarDiasSemana(req.getDiasSemana()),
                sendero.getCapacidadMaximaGrupo() != null ? sendero.getCapacidadMaximaGrupo() : 8
        );
        if (req.getActivo() != null) sd.setActivo(req.getActivo());

        SenderoDisponibilidad guardada = senderoDisponibilidadRepository.save(sd);
        return convertirDisponibilidadAResponse(
                guardada,
                sendero.getCapacidadMaximaGrupo() != null ? sendero.getCapacidadMaximaGrupo() : 0);
    }

    public SenderoDisponibilidadResponse actualizarDisponibilidad(UUID disponibilidadId, SenderoDisponibilidadRequest req) {
        SenderoDisponibilidad sd = senderoDisponibilidadRepository.findById(disponibilidadId)
                .orElseThrow(() -> new IllegalArgumentException("Disponibilidad no encontrada: " + disponibilidadId));
        validarRangoFechas(req.getFechaInicio(), req.getFechaFin());

        sd.setFechaInicio(req.getFechaInicio());
        sd.setFechaFin(req.getFechaFin());
        sd.setTurno(req.getTurno());
        sd.setDiasSemana(normalizarDiasSemana(req.getDiasSemana()));
        if (req.getActivo() != null) sd.setActivo(req.getActivo());

        SenderoDisponibilidad guardada = senderoDisponibilidadRepository.save(sd);
        Sendero sendero = senderoRepository.findById(sd.getSenderoId()).orElseThrow();
        return convertirDisponibilidadAResponse(
                guardada,
                sendero.getCapacidadMaximaGrupo() != null ? sendero.getCapacidadMaximaGrupo() : 0);
    }

    public void eliminarDisponibilidad(UUID disponibilidadId) {
        if (!senderoDisponibilidadRepository.existsById(disponibilidadId)) {
            throw new IllegalArgumentException("Disponibilidad no encontrada: " + disponibilidadId);
        }
        senderoDisponibilidadRepository.deleteById(disponibilidadId);
    }

    // ========== ADMIN/PÚBLICO: BLOQUEOS DE FECHAS ==========

    @Transactional(readOnly = true)
    public List<SenderoBloqueoResponse> listarBloqueos(UUID senderoId) {
        if (!senderoRepository.existsById(senderoId)) {
            throw new IllegalArgumentException("Sendero no encontrado: " + senderoId);
        }
        return senderoBloqueoRepository.findBySenderoIdOrderByFechaInicioAsc(senderoId).stream()
                .map(this::convertirBloqueoAResponse)
                .collect(Collectors.toList());
    }

    public SenderoBloqueoResponse crearBloqueo(UUID senderoId, SenderoBloqueoRequest req) {
        if (!senderoRepository.existsById(senderoId)) {
            throw new IllegalArgumentException("Sendero no encontrado: " + senderoId);
        }
        validarRangoFechas(req.getFechaInicio(), req.getFechaFin());

        SenderoBloqueo bloqueo = new SenderoBloqueo(
                senderoId,
                req.getFechaInicio(),
                req.getFechaFin(),
                req.getTurno(),
                req.getMotivo()
        );
        return convertirBloqueoAResponse(senderoBloqueoRepository.save(bloqueo));
    }

    public void eliminarBloqueo(UUID bloqueoId) {
        if (!senderoBloqueoRepository.existsById(bloqueoId)) {
            throw new IllegalArgumentException("Bloqueo no encontrado: " + bloqueoId);
        }
        senderoBloqueoRepository.deleteById(bloqueoId);
    }

    /**
     * Helper consultable por otros services (ej. ReservaService) para saber si una
     * combinación sendero+fecha+turno está bloqueada.
     */
    @Transactional(readOnly = true)
    public boolean estaBloqueado(UUID senderoId, LocalDate fecha, TurnoSendero turno) {
        return !senderoBloqueoRepository.findBloqueosQueCubren(senderoId, fecha, turno).isEmpty();
    }

    private SenderoBloqueoResponse convertirBloqueoAResponse(SenderoBloqueo b) {
        return new SenderoBloqueoResponse(
                b.getId(), b.getSenderoId(), b.getFechaInicio(), b.getFechaFin(),
                b.getTurno(), b.getMotivo());
    }

    private void validarRangoFechas(LocalDate inicio, LocalDate fin) {
        if (inicio == null || fin == null) {
            throw new IllegalArgumentException("Fecha de inicio y fin son obligatorias");
        }
        if (fin.isBefore(inicio)) {
            throw new IllegalArgumentException("La fecha de fin no puede ser anterior a la fecha de inicio");
        }
    }

    /** Limpia diasSemana: trim, mayúsculas, sin duplicados, null si vacío. */
    private String normalizarDiasSemana(String diasSemana) {
        if (diasSemana == null || diasSemana.isBlank()) return null;
        String normalized = Arrays.stream(diasSemana.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(String::toUpperCase)
                .distinct()
                .collect(Collectors.joining(","));
        return normalized.isEmpty() ? null : normalized;
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
        if (senderoRequest.getActivo() != null) {
            sendero.setActivo(senderoRequest.getActivo());
        }

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
     * Versión optimizada que evita el problema N+1 haciendo batch queries
     * Obtiene todos los senderos activos y sus imágenes en solo 3 queries totales
     */
    @Transactional(readOnly = true)
    public List<SenderoResponse> obtenerSenderosActivosOptimizado() {
        System.out.println("🚀 Obteniendo senderos activos (VERSIÓN OPTIMIZADA)");
        
        // Query 1: Obtener todos los senderos activos
        List<Sendero> senderos = senderoRepository.findAll().stream()
            .filter(Sendero::getActivo)
            .collect(Collectors.toList());
        
        if (senderos.isEmpty()) {
            System.out.println("✅ No hay senderos activos");
            return List.of();
        }
        
        // Obtener IDs de senderos para batch queries
        List<UUID> senderoIds = senderos.stream()
            .map(Sendero::getId)
            .collect(Collectors.toList());
        
        // Query 2: Obtener TODAS las imágenes principales en una sola query batch optimizada
        List<SenderoImagen> imagenesPrincipales = senderoImagenRepository.findBySenderoIdInAndEsPrincipalTrue(senderoIds);
        
        // Crear un mapa de senderoId -> imagen principal para acceso O(1)
        java.util.Map<UUID, String> imagenPrincipalMap = imagenesPrincipales.stream()
            .collect(Collectors.toMap(
                SenderoImagen::getSenderoId,
                SenderoImagen::getUrlImagen,
                (existing, replacement) -> existing // Si hay duplicados, mantener el primero
            ));
        
        // Query 3: Obtener TODOS los conteos de imágenes en una sola query batch optimizada
        List<Object[]> conteos = senderoImagenRepository.countBySenderoIdIn(senderoIds);
        java.util.Map<UUID, Long> conteoImagenesMap = conteos.stream()
            .collect(Collectors.toMap(
                row -> (UUID) row[0],
                row -> (Long) row[1]
            ));
        
        System.out.println("✅ Obtenidos " + senderos.size() + " senderos activos");
        System.out.println("✅ Obtenidas " + imagenPrincipalMap.size() + " imágenes principales");
        System.out.println("✅ Obtenidos conteos para " + conteoImagenesMap.size() + " senderos");
        
        // Convertir a Response usando los mapas pre-cargados (sin queries adicionales)
        return senderos.stream()
            .map(sendero -> convertirEntidadAResponseOptimizado(sendero, imagenPrincipalMap, conteoImagenesMap))
            .collect(Collectors.toList());
    }
    
    /**
     * Versión optimizada de convertirEntidadAResponse que usa mapas pre-cargados
     * Evita hacer queries individuales por cada sendero
     */
    private SenderoResponse convertirEntidadAResponseOptimizado(
            Sendero sendero,
            java.util.Map<UUID, String> imagenPrincipalMap,
            java.util.Map<UUID, Long> conteoImagenesMap) {
        
        SenderoResponse response = new SenderoResponse();
        response.setId(sendero.getId());
        response.setNombre(sendero.getNombre());
        response.setDescripcion(sendero.getDescripcion());
        response.setDuracionHoras(sendero.getDuracionHoras());
        response.setNivelDificultad(sendero.getNivelDificultad());
        response.setCapacidadMaximaGrupo(sendero.getCapacidadMaximaGrupo());
        response.setPrecioPorPersona(sendero.getPrecioPorPersona());
        response.setUrlImagen(sendero.getUrlImagen());
        response.setActivo(sendero.getActivo() != null ? sendero.getActivo() : Boolean.TRUE);
        
        // Usar imagen principal del mapa (sin query adicional)
        String imagenPrincipal = imagenPrincipalMap.get(sendero.getId());
        if (imagenPrincipal != null && !imagenPrincipal.isEmpty()) {
            response.setImagenPrincipal(imagenPrincipal);
            response.setUrlImagen(imagenPrincipal); // También actualizar campo legacy
        } else {
            // Fallback a sendero.imagenPrincipal si no hay imagen principal en el mapa
            response.setImagenPrincipal(sendero.getImagenPrincipal());
        }
        
        response.setTieneGaleria(sendero.getGaleria() != null ? sendero.getGaleria() : false);
        
        // Usar conteo del mapa (sin query adicional)
        Long imageCount = conteoImagenesMap.getOrDefault(sendero.getId(), 0L);
        response.setTotalImagenes(imageCount.intValue());
        
        return response;
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
        if (request.getActivo() != null) {
            sendero.setActivo(request.getActivo());
        }
        return sendero;
    }

    /**
     * Convierte una entidad Sendero a SenderoResponse DTO
     * Incluye información de imágenes si están disponibles
     * FIXED: Now queries sendero_imagenes table for the actual principal image
     */
    private SenderoResponse convertirEntidadAResponse(Sendero sendero) {
        System.out.println("🔍 Converting Sendero to Response: " + sendero.getNombre() + " (ID: " + sendero.getId() + ")");
        
        SenderoResponse response = new SenderoResponse();
        response.setId(sendero.getId());
        response.setNombre(sendero.getNombre());
        response.setDescripcion(sendero.getDescripcion());
        response.setDuracionHoras(sendero.getDuracionHoras());
        response.setNivelDificultad(sendero.getNivelDificultad());
        response.setCapacidadMaximaGrupo(sendero.getCapacidadMaximaGrupo());
        response.setPrecioPorPersona(sendero.getPrecioPorPersona());
        response.setUrlImagen(sendero.getUrlImagen());
        response.setActivo(sendero.getActivo() != null ? sendero.getActivo() : Boolean.TRUE);
        
        System.out.println("   - sendero.imagenPrincipal: " + sendero.getImagenPrincipal());
        System.out.println("   - sendero.urlImagen: " + sendero.getUrlImagen());
        
        // FIXED: Query sendero_imagenes table for the actual principal image
        Optional<SenderoImagen> principalImageOpt = senderoImagenRepository.findBySenderoIdAndEsPrincipalTrue(sendero.getId());
        System.out.println("   - Principal image found in DB: " + principalImageOpt.isPresent());
        
        if (principalImageOpt.isPresent()) {
            String principalUrl = principalImageOpt.get().getUrlImagen();
            System.out.println("   - Principal image URL: " + principalUrl);
            // Use the image marked as principal in sendero_imagenes table
            response.setImagenPrincipal(principalUrl);
            response.setUrlImagen(principalUrl); // Also set legacy field
        } else {
            // Fallback to sendero.imagenPrincipal if no principal image found in sendero_imagenes
            System.out.println("   - Using fallback: sendero.imagenPrincipal");
            response.setImagenPrincipal(sendero.getImagenPrincipal());
        }
        
        response.setTieneGaleria(sendero.getGaleria() != null ? sendero.getGaleria() : false);
        
        // Get image count
        long imageCount = senderoImagenRepository.countBySenderoId(sendero.getId());
        response.setTotalImagenes((int) imageCount);
        
        System.out.println("   ✅ Final response.imagenPrincipal: " + response.getImagenPrincipal());
        
        return response;
    }
}
