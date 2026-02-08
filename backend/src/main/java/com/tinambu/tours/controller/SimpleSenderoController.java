package com.tinambu.tours.controller;

import com.tinambu.tours.dto.request.SenderoRequest;
import com.tinambu.tours.dto.request.PrecioCalculoRequest;
import com.tinambu.tours.dto.response.ApiResponse;
import com.tinambu.tours.dto.response.PrecioCalculoResponse;
import com.tinambu.tours.dto.response.SenderoResponse;
import com.tinambu.tours.entity.sendero.Sendero;
import com.tinambu.tours.entity.sendero.SenderoImagen;
import com.tinambu.tours.repository.SenderoRepository;
import com.tinambu.tours.repository.SenderoImagenRepository;
import com.tinambu.tours.service.SenderoService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Controlador para gestión de senderos.
 * Endpoints públicos para consulta y endpoints administrativos protegidos con @PreAuthorize.
 * Usa DTOs (SenderoRequest/SenderoResponse) para evitar exposición de entidades.
 */
@RestController
@RequestMapping("/senderos")
@CrossOrigin(origins = {"*"})
public class SimpleSenderoController {

    private static final Logger logger = LoggerFactory.getLogger(SimpleSenderoController.class);

    @Autowired
    private SenderoService senderoService;

    @Autowired
    private SenderoRepository senderoRepository;

    @Autowired
    private SenderoImagenRepository senderoImagenRepository;

    @Autowired(required = false)
    private S3Client s3Client;

    @Value("${S3_PUBLIC_ASSETS_BUCKET:tinambu-public-assets-dev}")
    private String s3BucketName;

    // ========== ENDPOINTS PÚBLICOS ==========

    /**
     * Obtener todos los senderos activos (público).
     * Usa versión optimizada que evita N+1 queries.
     */
    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<List<SenderoResponse>>> obtenerSenderosActivos() {
        try {
            logger.info("GET /senderos - Obteniendo senderos activos (optimizado)");
            List<SenderoResponse> senderos = senderoService.obtenerSenderosActivosOptimizado();
            logger.info("Devolviendo {} senderos activos", senderos.size());
            return ResponseEntity.ok(ApiResponse.success(senderos));
        } catch (Exception e) {
            logger.error("Error al obtener senderos activos: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Error al obtener senderos"));
        }
    }

    /**
     * Obtener sendero por ID (público).
     * Devuelve SenderoResponse en lugar de la entidad.
     */
    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<SenderoResponse>> obtenerSenderoPorId(@PathVariable UUID id) {
        try {
            SenderoResponse response = senderoService.obtenerSenderoPorIdResponse(id);
            return ResponseEntity.ok(ApiResponse.success(response));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error("Sendero no encontrado"));
        } catch (Exception e) {
            logger.error("Error al obtener sendero {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Error al obtener sendero"));
        }
    }

    /**
     * Calcular precio detallado para sendero (público).
     */
    @PostMapping("/{id}/calcular-precio")
    public ResponseEntity<ApiResponse<PrecioCalculoResponse>> calcularPrecio(
            @PathVariable UUID id,
            @Valid @RequestBody PrecioCalculoRequest request) {
        try {
            request.validate();

            Sendero sendero = senderoService.obtenerSenderoPorId(id);

            PrecioCalculoResponse response = new PrecioCalculoResponse(
                sendero.getId(), sendero.getNombre(),
                request.getAdultos(), request.getNinos()
            );

            response.setPrecioBase(sendero.getPrecioPorPersona());

            // Precio adultos (precio completo)
            response.setPrecioAdultos(sendero.getPrecioPorPersona()
                .multiply(BigDecimal.valueOf(request.getAdultos())));

            // Precio niños (30% descuento)
            BigDecimal descuentoNinos = sendero.getPrecioPorPersona()
                .multiply(BigDecimal.valueOf(0.30));
            BigDecimal precioUnitarioNinos = sendero.getPrecioPorPersona()
                .subtract(descuentoNinos);
            response.setPrecioNinos(precioUnitarioNinos
                .multiply(BigDecimal.valueOf(request.getNinos())));
            response.setDescuentoNinos(descuentoNinos.multiply(BigDecimal.valueOf(request.getNinos())));
            response.setAplicaDescuentoNinos(request.getNinos() > 0);

            BigDecimal subtotal = response.getPrecioAdultos().add(response.getPrecioNinos());

            // Descuento grupal (10% para grupos > 10 personas)
            if (request.getTotalPersonas() > 10) {
                response.setDescuentoGrupo(subtotal.multiply(BigDecimal.valueOf(0.10)));
                response.setAplicaDescuentoGrupo(true);
                subtotal = subtotal.subtract(response.getDescuentoGrupo());
            } else {
                response.setDescuentoGrupo(BigDecimal.ZERO);
                response.setAplicaDescuentoGrupo(false);
            }

            response.setPrecioTotal(subtotal);

            List<String> detalles = new ArrayList<>();
            if (response.isAplicaDescuentoNinos()) {
                detalles.add("30% descuento para niños menores de 12 años");
            }
            if (response.isAplicaDescuentoGrupo()) {
                detalles.add("10% descuento para grupos mayores a 10 personas");
            }
            response.setDetalleDescuentos(detalles);

            return ResponseEntity.ok(ApiResponse.success(response));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            logger.error("Error al calcular precio para sendero {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Error al calcular precio"));
        }
    }

    // ========== ENDPOINTS DE ADMINISTRACIÓN (requieren rol ADMIN) ==========

    /**
     * Obtener todos los senderos incluyendo inactivos (solo admin).
     */
    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<List<SenderoResponse>>> obtenerTodosLosSenderos() {
        try {
            List<SenderoResponse> senderos = senderoService.obtenerTodosLosSenderos();
            return ResponseEntity.ok(ApiResponse.success(senderos));
        } catch (Exception e) {
            logger.error("Error al obtener todos los senderos: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Error al obtener senderos"));
        }
    }

    /**
     * Crear nuevo sendero (solo admin).
     * Usa SenderoRequest DTO con validaciones @Valid.
     */
    @PostMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<SenderoResponse>> crearSendero(
            @Valid @RequestBody SenderoRequest senderoRequest) {
        try {
            SenderoResponse response = senderoService.crearSendero(senderoRequest);
            return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Sendero creado exitosamente"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            logger.error("Error al crear sendero: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Error al crear sendero"));
        }
    }

    /**
     * Actualizar sendero existente (solo admin).
     * Usa SenderoRequest DTO con validaciones @Valid.
     */
    @PutMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<SenderoResponse>> actualizarSendero(
            @PathVariable UUID id,
            @Valid @RequestBody SenderoRequest senderoRequest) {
        try {
            SenderoResponse response = senderoService.actualizarSendero(id, senderoRequest);
            return ResponseEntity.ok(ApiResponse.success(response, "Sendero actualizado exitosamente"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            logger.error("Error al actualizar sendero {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Error al actualizar sendero"));
        }
    }

    /**
     * Eliminar sendero y sus imágenes de S3 y DB (solo admin).
     * Hard delete: elimina el sendero, sus imágenes de S3 y los registros de la DB.
     */
    @DeleteMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public ResponseEntity<ApiResponse<Void>> eliminarSendero(@PathVariable UUID id) {
        try {
            if (!senderoService.existsById(id)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("Sendero no encontrado"));
            }

            // 1. Obtener imágenes antes de eliminar
            List<SenderoImagen> imagenes = senderoImagenRepository.findBySenderoId(id);

            // 2. Eliminar archivos de S3
            if (s3Client != null && !imagenes.isEmpty()) {
                for (SenderoImagen imagen : imagenes) {
                    try {
                        String s3Key = extractS3KeyFromUrl(imagen.getUrlImagen());
                        DeleteObjectRequest deleteRequest = DeleteObjectRequest.builder()
                            .bucket(s3BucketName)
                            .key(s3Key)
                            .build();
                        s3Client.deleteObject(deleteRequest);
                        logger.info("Eliminado de S3: {}", s3Key);
                    } catch (Exception e) {
                        logger.warn("Error eliminando imagen de S3: {}", e.getMessage());
                    }
                }
            }

            // 3. Eliminar registros de imágenes de la base de datos
            senderoImagenRepository.deleteBySenderoId(id);

            // 4. Eliminar el sendero
            senderoRepository.deleteById(id);

            return ResponseEntity.ok(ApiResponse.success("Sendero e imágenes eliminados exitosamente"));
        } catch (Exception e) {
            logger.error("Error al eliminar sendero {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Error al eliminar sendero: " + e.getMessage()));
        }
    }

    /**
     * Método auxiliar para extraer el S3 key de una URL.
     * Ejemplo: https://bucket.s3.region.amazonaws.com/senderos/id/file.jpg -> senderos/id/file.jpg
     */
    private String extractS3KeyFromUrl(String url) {
        if (url == null || url.isEmpty()) {
            throw new IllegalArgumentException("URL vacía");
        }

        String[] parts = url.split("\\.amazonaws\\.com/");
        if (parts.length > 1) {
            return parts[1];
        }

        int lastSlashIndex = url.indexOf(".com/");
        if (lastSlashIndex != -1) {
            return url.substring(lastSlashIndex + 5);
        }

        throw new IllegalArgumentException("No se pudo extraer S3 key de URL: " + url);
    }
}
