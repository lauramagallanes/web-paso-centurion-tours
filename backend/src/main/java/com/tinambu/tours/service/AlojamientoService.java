package com.tinambu.tours.service;

import com.tinambu.tours.dto.request.*;
import com.tinambu.tours.dto.response.*;
import com.tinambu.tours.entity.alojamiento.*;
import com.tinambu.tours.entity.reserva.AlojamientoReserva;
import com.tinambu.tours.repository.*;
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
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;
import java.time.Duration;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class AlojamientoService {

    @Autowired
    private AlojamientoRepository alojamientoRepository;
    
    @Autowired
    private AlojamientoImagenRepository alojamientoImagenRepository;
    
    @Autowired
    private AlojamientoDisponibilidadRepository disponibilidadRepository;
    
    @Autowired
    private AlojamientoReservaBloqueoRepository bloqueoRepository;
    
    @Autowired
    private AlojamientoReservaRepository reservaRepository;
    
    @Autowired(required = false)
    private S3Client s3Client;
    
    @Autowired(required = false)
    private S3Presigner s3Presigner;
    
    @Value("${S3_PUBLIC_ASSETS_BUCKET:tinambu-public-assets-dev}")
    private String s3BucketName;

    // Core CRUD Operations

    public AlojamientoResponse crearAlojamiento(AlojamientoRequest request) {
        System.out.println("🏠 Creando nuevo alojamiento: " + request.getNombre());
        
        // Validation
        String validationErrors = request.getValidationErrors();
        if (!validationErrors.isEmpty()) {
            throw new IllegalArgumentException("Errores de validación: " + validationErrors);
        }

        Alojamiento alojamiento = Alojamiento.builder()
                .nombre(request.getNombre())
                .descripcion(request.getDescripcion())
                .ubicacion(request.getUbicacion())
                .capacidadMinima(request.getCapacidadMinima())
                .capacidadMaxima(request.getCapacidadMaxima())
                .cantidadCamasDobles(request.getCantidadCamasDobles())
                .cantidadLiteras(request.getCantidadLiteras())
                .horaLlegada(request.getHoraLlegada())
                .horaSalida(request.getHoraSalida())
                .precioPorNoche(request.getPrecioPorNoche())
                .activo(true)
                .build();

        alojamiento = alojamientoRepository.save(alojamiento);
        System.out.println("✅ Alojamiento creado exitosamente con ID: " + alojamiento.getId());
        
        return convertirAResponse(alojamiento);
    }

    public AlojamientoResponse actualizarAlojamiento(UUID id, AlojamientoRequest request) {
        System.out.println("🔄 Actualizando alojamiento con ID: " + id);
        
        Alojamiento alojamiento = alojamientoRepository.findByIdAndActivoTrue(id)
                .orElseThrow(() -> new RuntimeException("Alojamiento no encontrado: " + id));

        // Validation
        String validationErrors = request.getValidationErrors();
        if (!validationErrors.isEmpty()) {
            throw new IllegalArgumentException("Errores de validación: " + validationErrors);
        }

        alojamiento.setNombre(request.getNombre());
        alojamiento.setDescripcion(request.getDescripcion());
        alojamiento.setUbicacion(request.getUbicacion());
        alojamiento.setCapacidadMinima(request.getCapacidadMinima());
        alojamiento.setCapacidadMaxima(request.getCapacidadMaxima());
        alojamiento.setCantidadCamasDobles(request.getCantidadCamasDobles());
        alojamiento.setCantidadLiteras(request.getCantidadLiteras());
        alojamiento.setHoraLlegada(request.getHoraLlegada());
        alojamiento.setHoraSalida(request.getHoraSalida());
        alojamiento.setPrecioPorNoche(request.getPrecioPorNoche());
        
        // Actualizar estado activo si se proporciona
        if (request.getActiva() != null) {
            alojamiento.setActivo(request.getActiva());
        }

        alojamiento = alojamientoRepository.save(alojamiento);
        System.out.println("✅ Alojamiento actualizado exitosamente: " + id);
        
        return convertirAResponse(alojamiento);
    }

    @Transactional(readOnly = true)
    public List<AlojamientoResponse> obtenerAlojamientos() {
        System.out.println("📋 Obteniendo todos los alojamientos activos");
        
        List<Alojamiento> alojamientos = alojamientoRepository.findByActivoTrue();
        return alojamientos.stream()
                .map(this::convertirAResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AlojamientoResponse> obtenerTodosLosAlojamientos() {
        System.out.println("📋 Obteniendo TODOS los alojamientos (admin)");
        
        List<Alojamiento> alojamientos = alojamientoRepository.findAll();
        return alojamientos.stream()
                .map(this::convertirAResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AlojamientoResponse obtenerAlojamientoPorId(UUID id) {
        System.out.println("🔍 Obteniendo alojamiento por ID: " + id);
        
        Alojamiento alojamiento = alojamientoRepository.findByIdAndActivoTrue(id)
                .orElseThrow(() -> new RuntimeException("Alojamiento no encontrado: " + id));
        
        return convertirAResponse(alojamiento);
    }

    public void eliminarAlojamiento(UUID id) {
        System.out.println("🗑️ Eliminando alojamiento con ID: " + id);
        
        // Buscar alojamiento sin importar si está activo o no
        Alojamiento alojamiento = alojamientoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Alojamiento no encontrado: " + id));

        // Check for active reservations
        Long reservasActivas = reservaRepository.countReservasActivas(id);
        if (reservasActivas > 0) {
            throw new IllegalStateException("No se puede eliminar el alojamiento. Tiene reservas activas.");
        }

        // Eliminar el alojamiento físicamente
        // Las imágenes y disponibilidades se eliminarán automáticamente por cascade = CascadeType.ALL
        alojamientoRepository.delete(alojamiento);
        
        System.out.println("✅ Alojamiento y datos relacionados eliminados exitosamente (cascade): " + id);
    }

    // Availability Methods

    public List<AlojamientoDisponibilidadResponse> listarDisponibilidades(UUID alojamientoId) {
        return disponibilidadRepository.findByAlojamientoIdOrdenadoPorFecha(alojamientoId)
                .stream()
                .map(this::convertirADisponibilidadResponse)
                .collect(Collectors.toList());
    }

    public void eliminarDisponibilidad(UUID disponibilidadId) {
        AlojamientoDisponibilidad disponibilidad = disponibilidadRepository.findById(disponibilidadId)
                .orElseThrow(() -> new RuntimeException("Disponibilidad no encontrada: " + disponibilidadId));
        disponibilidad.setActivo(false);
        disponibilidadRepository.save(disponibilidad);
        System.out.println("✅ Disponibilidad desactivada: " + disponibilidadId);
    }

    public AlojamientoDisponibilidadResponse crearDisponibilidad(AlojamientoDisponibilidadRequest request) {
        System.out.println("📅 Creando disponibilidad para alojamiento: " + request.getAlojamientoId());
        
        // Validation
        String validationErrors = request.getValidationErrors();
        if (!validationErrors.isEmpty()) {
            throw new IllegalArgumentException("Errores de validación: " + validationErrors);
        }

        // Check for overlaps
        List<AlojamientoDisponibilidad> solapamientos = disponibilidadRepository
                .findSolapamientos(request.getAlojamientoId(), request.getFechaInicio(), request.getFechaFin());
        
        if (!solapamientos.isEmpty()) {
            throw new IllegalStateException("Ya existe disponibilidad para algunas fechas en el rango especificado");
        }

        AlojamientoDisponibilidad disponibilidad = AlojamientoDisponibilidad.builder()
                .alojamientoId(request.getAlojamientoId())
                .fechaInicio(request.getFechaInicio())
                .fechaFin(request.getFechaFin())
                .activo(true)
                .build();

        disponibilidad = disponibilidadRepository.save(disponibilidad);
        System.out.println("✅ Disponibilidad creada exitosamente: " + disponibilidad.getId());
        
        return convertirADisponibilidadResponse(disponibilidad);
    }

    public boolean verificarDisponibilidad(UUID alojamientoId, LocalDate checkIn, LocalDate checkOut) {
        System.out.println("🔍 Verificando disponibilidad para alojamiento " + alojamientoId + " del " + checkIn + " al " + checkOut);
        
        // Check if there's availability range that covers the requested dates
        boolean tieneDisponibilidad = disponibilidadRepository
                .existeDisponibilidadParaRango(alojamientoId, checkIn, checkOut);
        
        if (!tieneDisponibilidad) {
            System.out.println("❌ No hay disponibilidad configurada para las fechas solicitadas");
            return false;
        }
        
        // Check for blocks (excluding checkout date)
        boolean tieneBloqueos = bloqueoRepository.tieneBloqueoEnRango(alojamientoId, checkIn, checkOut);
        
        boolean disponible = !tieneBloqueos;
        System.out.println("✅ Disponibilidad verificada: " + (disponible ? "DISPONIBLE" : "NO DISPONIBLE"));
        
        return disponible;
    }

    // Blocking System Methods

    public void bloquearAlojamientoParaReserva(UUID alojamientoId, UUID reservaId, LocalDate checkIn, LocalDate checkOut) {
        System.out.println("🔒 Bloqueando alojamiento " + alojamientoId + " para reserva " + reservaId + " del " + checkIn + " al " + checkOut);
        
        List<AlojamientoReservaBloqueo> bloqueos = new ArrayList<>();
        LocalDate fecha = checkIn;
        
        while (fecha.isBefore(checkOut)) { // Exclude checkout date
            AlojamientoReservaBloqueo bloqueo = AlojamientoReservaBloqueo.builder()
                    .alojamientoId(alojamientoId)
                    .reservaId(reservaId)
                    .fecha(fecha)
                    .activo(true)
                    .build();
            
            bloqueos.add(bloqueo);
            fecha = fecha.plusDays(1);
        }
        
        bloqueoRepository.saveAll(bloqueos);
        System.out.println("✅ Alojamiento bloqueado exitosamente: " + bloqueos.size() + " bloqueos creados");
    }

    public List<Map<String, Object>> listarBloqueosManuals(UUID alojamientoId) {
        List<AlojamientoReservaBloqueo> bloqueos = bloqueoRepository.findBloqueosManuals(alojamientoId);

        List<Map<String, Object>> ranges = new ArrayList<>();
        if (bloqueos.isEmpty()) return ranges;

        LocalDate start = bloqueos.get(0).getFecha();
        LocalDate prev = start;

        for (int i = 1; i < bloqueos.size(); i++) {
            LocalDate current = bloqueos.get(i).getFecha();
            if (!current.equals(prev.plusDays(1))) {
                Map<String, Object> range = new HashMap<>();
                range.put("fechaInicio", start.toString());
                range.put("fechaFin", prev.toString());
                ranges.add(range);
                start = current;
            }
            prev = current;
        }
        Map<String, Object> last = new HashMap<>();
        last.put("fechaInicio", start.toString());
        last.put("fechaFin", prev.toString());
        ranges.add(last);
        return ranges;
    }

    public void crearBloqueoManual(UUID alojamientoId, LocalDate fechaInicio, LocalDate fechaFin) {
        if (!fechaInicio.isBefore(fechaFin)) {
            throw new IllegalArgumentException("La fecha de inicio debe ser anterior a la fecha de fin");
        }
        boolean hayReservasActivas = reservaRepository.existeReservaEnRango(alojamientoId, fechaInicio, fechaFin);
        if (hayReservasActivas) {
            List<AlojamientoReserva> reservas = reservaRepository.findReservasSuperpuestas(alojamientoId, fechaInicio, fechaFin);
            String detalle = reservas.stream()
                    .map(r -> r.getFechaCheckIn() + " → " + r.getFechaCheckOut())
                    .collect(Collectors.joining(", "));
            throw new IllegalStateException(
                "No se puede bloquear el rango " + fechaInicio + " – " + fechaFin +
                " porque hay reservas activas en esas fechas: " + detalle
            );
        }
        List<AlojamientoReservaBloqueo> bloqueos = new ArrayList<>();
        LocalDate fecha = fechaInicio;
        while (!fecha.isAfter(fechaFin)) {
            bloqueos.add(AlojamientoReservaBloqueo.builder()
                    .alojamientoId(alojamientoId)
                    .reservaId(null)
                    .fecha(fecha)
                    .activo(true)
                    .build());
            fecha = fecha.plusDays(1);
        }
        bloqueoRepository.saveAll(bloqueos);
        System.out.println("✅ Bloqueo manual creado: " + fechaInicio + " al " + fechaFin + " (" + bloqueos.size() + " días)");
    }

    public void eliminarBloqueoManual(UUID alojamientoId, LocalDate fechaInicio, LocalDate fechaFin) {
        bloqueoRepository.desactivarBloqueosManualEnRango(alojamientoId, fechaInicio, fechaFin);
        System.out.println("✅ Bloqueo manual eliminado: " + fechaInicio + " al " + fechaFin);
    }

    public List<LocalDate> obtenerFechasBloqueadas(UUID alojamientoId, LocalDate desde, LocalDate hasta) {
        System.out.println("📅 Obteniendo fechas bloqueadas para alojamiento " + alojamientoId + " del " + desde + " al " + hasta);
        return bloqueoRepository.findFechasBloqueadasEnRango(alojamientoId, desde, hasta);
    }

    public void desbloquearAlojamientoDeReserva(UUID reservaId) {
        System.out.println("🔓 Desbloqueando alojamiento para reserva: " + reservaId);
        
        bloqueoRepository.desactivarBloqueosPorReserva(reservaId);
        System.out.println("✅ Alojamiento desbloqueado exitosamente para reserva: " + reservaId);
    }

    // Conversion Methods

    private AlojamientoResponse convertirAResponse(Alojamiento alojamiento) {
        List<AlojamientoImagen> imagenes = alojamientoImagenRepository
                .findByAlojamientoIdOrdenadaPorPrincipal(alojamiento.getId());
        
        List<AlojamientoImagenResponse> imagenesResponse = imagenes.stream()
                .map(this::convertirAImagenResponse)
                .collect(Collectors.toList());

        return AlojamientoResponse.builder()
                .id(alojamiento.getId())
                .nombre(alojamiento.getNombre())
                .descripcion(alojamiento.getDescripcion())
                .ubicacion(alojamiento.getUbicacion())
                .capacidadMinima(alojamiento.getCapacidadMinima())
                .capacidadMaxima(alojamiento.getCapacidadMaxima())
                .cantidadCamasDobles(alojamiento.getCantidadCamasDobles())
                .cantidadLiteras(alojamiento.getCantidadLiteras())
                .horaLlegada(alojamiento.getHoraLlegada())
                .horaSalida(alojamiento.getHoraSalida())
                .precioPorNoche(alojamiento.getPrecioPorNoche())
                .imagenPrincipal(alojamiento.getImagenPrincipalUrl())
                .activo(alojamiento.getActivo())
                .fechaCreacion(alojamiento.getFechaCreacion())
                .fechaActualizacion(alojamiento.getFechaActualizacion())
                .imagenes(imagenesResponse)
                .totalImagenes(imagenesResponse.size())
                .tieneGaleria(imagenesResponse.size() > 1)
                .build();
    }

    private AlojamientoImagenResponse convertirAImagenResponse(AlojamientoImagen imagen) {
        return AlojamientoImagenResponse.builder()
                .id(imagen.getId())
                .url(imagen.getUrlImagen())
                .descripcion(imagen.getDescripcion())
                .orden(imagen.getOrden())
                .esPrincipal(imagen.getEsPrincipal())
                .fechaSubida(imagen.getFechaSubida())
                .alojamientoId(imagen.getAlojamientoId())
                .build();
    }

    private AlojamientoDisponibilidadResponse convertirADisponibilidadResponse(AlojamientoDisponibilidad disponibilidad) {
        return AlojamientoDisponibilidadResponse.builder()
                .id(disponibilidad.getId())
                .alojamientoId(disponibilidad.getAlojamientoId())
                .fechaInicio(disponibilidad.getFechaInicio())
                .fechaFin(disponibilidad.getFechaFin())
                .activo(disponibilidad.getActivo())
                .build();
    }

    // Image Management Methods

    public List<AlojamientoImagenResponse> addImagesToAlojamiento(UUID alojamientoId, MultipartFile[] files, String[] descriptions) {
        // Check if S3 is available
        if (s3Client == null) {
            throw new IllegalStateException("S3 service not available. Check AWS configuration.");
        }
        
        // Validate alojamiento exists
        Alojamiento alojamiento = alojamientoRepository.findByIdAndActivoTrue(alojamientoId)
                .orElseThrow(() -> new RuntimeException("Alojamiento no encontrado: " + alojamientoId));
        
        // Get current image count for ordering
        Long countLong = alojamientoImagenRepository.countByAlojamientoId(alojamientoId);
        int currentOrder = countLong != null ? countLong.intValue() : 0;
        
        List<AlojamientoImagenResponse> uploadedImages = new ArrayList<>();
        
        for (int i = 0; i < files.length; i++) {
            MultipartFile file = files[i];
            String description = (descriptions != null && i < descriptions.length) ? descriptions[i] : null;
            
            // Validate file
            validateImageFile(file);
            
            try {
                // Generate unique filename
                String fileName = generateUniqueFileName(file.getOriginalFilename());
                String s3Key = "alojamientos/" + alojamientoId + "/" + fileName;
                
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
                AlojamientoImagen alojamientoImagen = AlojamientoImagen.builder()
                        .alojamientoId(alojamientoId)
                        .urlImagen(imageUrl)
                        .descripcion(description)
                        .orden(currentOrder + i + 1)
                        .esPrincipal(false)
                        .build();
                
                // Set as principal if it's the first image for this alojamiento OR if alojamiento has no imagenPrincipal yet
                boolean isFirstImage = (currentOrder == 0 && i == 0);
                boolean needsMainImage = (alojamiento.getImagenPrincipalUrl() == null || alojamiento.getImagenPrincipalUrl().isEmpty());
                
                if (isFirstImage || (i == 0 && needsMainImage)) {
                    alojamientoImagen.marcarComoPrincipal();
                    // Update alojamiento with main image URL
                    alojamiento.setImagenPrincipal(imageUrl);
                    alojamientoRepository.save(alojamiento);
                }
                
                alojamientoImagen = alojamientoImagenRepository.save(alojamientoImagen);
                uploadedImages.add(convertirAImagenResponse(alojamientoImagen));
                
                System.out.println("✅ Imagen subida: " + imageUrl);
                
            } catch (Exception e) {
                System.err.println("❌ Error uploading image: " + e.getMessage());
                e.printStackTrace();
                throw new RuntimeException("Error subiendo imagen: " + e.getMessage(), e);
            }
        }
        
        return uploadedImages;
    }

    public boolean removeImageFromAlojamiento(UUID imagenId) {
        // Check if S3 is available
        if (s3Client == null) {
            throw new IllegalStateException("S3 service not available. Check AWS configuration.");
        }
        
        Optional<AlojamientoImagen> imagenOpt = alojamientoImagenRepository.findById(imagenId);
        if (imagenOpt.isEmpty()) {
            return false;
        }
        
        AlojamientoImagen imagen = imagenOpt.get();
        
        try {
            // Delete from S3
            String s3Key = extractS3KeyFromUrl(imagen.getUrlImagen());
            DeleteObjectRequest deleteObjectRequest = DeleteObjectRequest.builder()
                    .bucket(s3BucketName)
                    .key(s3Key)
                    .build();
            
            s3Client.deleteObject(deleteObjectRequest);
            
            // If this was the principal image, unset it from alojamiento
            if (imagen.getEsPrincipal()) {
                Alojamiento alojamiento = alojamientoRepository.findByIdAndActivoTrue(imagen.getAlojamientoId())
                        .orElseThrow(() -> new RuntimeException("Alojamiento no encontrado"));
                alojamiento.setImagenPrincipal(null);
                alojamientoRepository.save(alojamiento);
            }
            
            // Delete from database
            alojamientoImagenRepository.delete(imagen);
            
            System.out.println("✅ Imagen eliminada: " + imagenId);
            return true;
            
        } catch (Exception e) {
            System.err.println("❌ Error deleting image: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Error eliminando imagen: " + e.getMessage(), e);
        }
    }

    public boolean setMainImage(UUID imagenId) {
        Optional<AlojamientoImagen> imagenOpt = alojamientoImagenRepository.findById(imagenId);
        if (imagenOpt.isEmpty()) {
            return false;
        }
        
        AlojamientoImagen nuevaPrincipal = imagenOpt.get();
        UUID alojamientoId = nuevaPrincipal.getAlojamientoId();
        
        // Remove principal flag from other images
        List<AlojamientoImagen> imagenes = alojamientoImagenRepository.findByAlojamientoIdOrderByOrden(alojamientoId);
        for (AlojamientoImagen img : imagenes) {
            if (img.getEsPrincipal() && !img.getId().equals(imagenId)) {
                img.desmarcarComoPrincipal();
                alojamientoImagenRepository.save(img);
            }
        }
        
        // Set new principal image
        nuevaPrincipal.marcarComoPrincipal();
        alojamientoImagenRepository.save(nuevaPrincipal);
        
        // Update alojamiento
        Alojamiento alojamiento = alojamientoRepository.findByIdAndActivoTrue(alojamientoId)
                .orElseThrow(() -> new RuntimeException("Alojamiento no encontrado"));
        alojamiento.setImagenPrincipal(nuevaPrincipal.getUrlImagen());
        alojamientoRepository.save(alojamiento);
        
        System.out.println("✅ Imagen principal actualizada: " + imagenId);
        return true;
    }

    public long getImageCount(UUID alojamientoId) {
        return alojamientoImagenRepository.countByAlojamientoId(alojamientoId);
    }

    public List<AlojamientoImagenResponse> getAlojamientoImages(UUID alojamientoId) {
        List<AlojamientoImagen> imagenes = alojamientoImagenRepository.findByAlojamientoIdOrderByOrden(alojamientoId);
        return imagenes.stream()
                .map(this::convertirAImagenResponse)
                .collect(Collectors.toList());
    }

    public boolean existsById(UUID alojamientoId) {
        return alojamientoRepository.existsById(alojamientoId);
    }

    // Helper methods for image processing

    private void validateImageFile(MultipartFile file) {
        // Validate file is not empty
        if (file.isEmpty()) {
            throw new IllegalArgumentException("El archivo está vacío");
        }
        
        // Validate file size (max 10MB)
        long maxSize = 10 * 1024 * 1024; // 10MB
        if (file.getSize() > maxSize) {
            throw new IllegalArgumentException("El archivo es demasiado grande. Tamaño máximo: 10MB");
        }
        
        // Validate content type
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("El archivo debe ser una imagen");
        }
        
        // Validate allowed image types
        List<String> allowedTypes = Arrays.asList("image/jpeg", "image/jpg", "image/png", "image/webp");
        if (!allowedTypes.contains(contentType.toLowerCase())) {
            throw new IllegalArgumentException("Tipo de imagen no permitido. Use: JPEG, PNG o WebP");
        }
    }

    private String generateUniqueFileName(String originalFilename) {
        String timestamp = String.valueOf(System.currentTimeMillis());
        String uuid = UUID.randomUUID().toString();
        String extension = "";
        
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        
        return timestamp + "_" + uuid + extension;
    }

    private String extractS3KeyFromUrl(String imageUrl) {
        // Extract key from URL like: https://bucket.s3.region.amazonaws.com/key
        String[] parts = imageUrl.split(".amazonaws.com/");
        if (parts.length > 1) {
            return parts[1];
        }
        throw new IllegalArgumentException("Invalid S3 URL: " + imageUrl);
    }

    // ================== PRESIGNED URL METHODS FOR DIRECT S3 UPLOAD ==================

    /**
     * Generate a presigned URL for uploading an image directly to S3
     * This bypasses API Gateway/Lambda size limits
     */
    public Map<String, String> generatePresignedUploadUrl(UUID alojamientoId, String filename, String contentType) {
        if (s3Presigner == null) {
            throw new IllegalStateException("S3 Presigner not available. Check AWS configuration.");
        }

        // Validate alojamiento exists
        if (!alojamientoRepository.existsById(alojamientoId)) {
            throw new IllegalArgumentException("Alojamiento no encontrado: " + alojamientoId);
        }

        // Check current image count
        Long count = alojamientoImagenRepository.countByAlojamientoId(alojamientoId);
        if (count != null && count >= 10) {
            throw new IllegalArgumentException("Máximo 10 imágenes por habitación alcanzado");
        }

        // Generate unique filename and S3 key
        String uniqueFilename = generateUniqueFileName(filename);
        String s3Key = "alojamientos/" + alojamientoId + "/" + uniqueFilename;

        // Create presigned PUT request
        PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                .bucket(s3BucketName)
                .key(s3Key)
                .contentType(contentType != null ? contentType : "image/jpeg")
                .build();

        PutObjectPresignRequest presignRequest = PutObjectPresignRequest.builder()
                .signatureDuration(Duration.ofMinutes(15)) // URL valid for 15 minutes
                .putObjectRequest(putObjectRequest)
                .build();

        PresignedPutObjectRequest presignedRequest = s3Presigner.presignPutObject(presignRequest);

        Map<String, String> response = new HashMap<>();
        response.put("uploadUrl", presignedRequest.url().toString());
        response.put("s3Key", s3Key);
        response.put("filename", uniqueFilename);
        response.put("imageUrl", String.format("https://%s.s3.us-east-1.amazonaws.com/%s", s3BucketName, s3Key));

        System.out.println("✅ Generated presigned URL for: " + s3Key);
        return response;
    }

    /**
     * Register an image in the database after it has been uploaded directly to S3
     * Called by frontend after successful S3 upload
     */
    public AlojamientoImagenResponse registerUploadedImage(UUID alojamientoId, String imageUrl, String descripcion) {
        // Validate alojamiento exists
        Alojamiento alojamiento = alojamientoRepository.findByIdAndActivoTrue(alojamientoId)
                .orElseThrow(() -> new RuntimeException("Alojamiento no encontrado: " + alojamientoId));

        // Get current image count for ordering
        Long countLong = alojamientoImagenRepository.countByAlojamientoId(alojamientoId);
        int currentOrder = countLong != null ? countLong.intValue() : 0;

        // Create image record
        AlojamientoImagen alojamientoImagen = AlojamientoImagen.builder()
                .alojamientoId(alojamientoId)
                .urlImagen(imageUrl)
                .descripcion(descripcion)
                .orden(currentOrder + 1)
                .esPrincipal(false)
                .build();

        // Set as principal if it's the first image
        boolean isFirstImage = (currentOrder == 0);
        boolean needsMainImage = (alojamiento.getImagenPrincipalUrl() == null || alojamiento.getImagenPrincipalUrl().isEmpty());

        if (isFirstImage || needsMainImage) {
            alojamientoImagen.marcarComoPrincipal();
            alojamiento.setImagenPrincipal(imageUrl);
            alojamientoRepository.save(alojamiento);
        }

        alojamientoImagen = alojamientoImagenRepository.save(alojamientoImagen);

        System.out.println("✅ Registered uploaded image: " + imageUrl);
        return convertirAImagenResponse(alojamientoImagen);
    }
}