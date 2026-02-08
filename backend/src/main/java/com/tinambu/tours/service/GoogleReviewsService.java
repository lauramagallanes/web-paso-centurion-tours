package com.tinambu.tours.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tinambu.tours.dto.response.GoogleReviewsResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

@Service
public class GoogleReviewsService {
    
    private static final Logger logger = LoggerFactory.getLogger(GoogleReviewsService.class);
    
    @Value("${google.api.key:}")
    private String googleApiKey;
    
    @Value("${google.api.place-id:}")
    private String placeId;
    
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;
    
    // Cache simple
    private GoogleReviewsResponse cachedResponse;
    private long lastCacheTime = 0;
    private static final long CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 horas
    
    public GoogleReviewsService() {
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
        this.objectMapper = new ObjectMapper();
    }
    
    public GoogleReviewsResponse getReviews() {
        logger.info("🔍 Obteniendo reviews de Google...");
        
        // Verificar credenciales
        if (googleApiKey == null || googleApiKey.isEmpty()) {
            logger.warn("⚠️ Google API Key no configurada");
            return createFallbackResponse();
        }
        
        if (placeId == null || placeId.isEmpty()) {
            logger.warn("⚠️ Google Place ID no configurado");
            return createFallbackResponse();
        }
        
        // Verificar caché
        long currentTime = System.currentTimeMillis();
        if (cachedResponse != null && (currentTime - lastCacheTime) < CACHE_DURATION_MS) {
            logger.info("✅ Usando reviews de Google desde caché");
            return cachedResponse;
        }
        
        try {
            // Construir URL de la API de Google Places
            String url = String.format(
                "https://maps.googleapis.com/maps/api/place/details/json?place_id=%s&fields=name,rating,user_ratings_total&key=%s",
                placeId,
                googleApiKey
            );
            
            // Hacer request
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .GET()
                    .timeout(Duration.ofSeconds(10))
                    .build();
            
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            
            if (response.statusCode() == 200) {
                // Parsear respuesta
                JsonNode root = objectMapper.readTree(response.body());
                JsonNode result = root.get("result");
                
                if (result != null) {
                    GoogleReviewsResponse reviewsResponse = new GoogleReviewsResponse();
                    reviewsResponse.setName(result.has("name") ? result.get("name").asText() : "");
                    reviewsResponse.setRating(result.has("rating") ? result.get("rating").asDouble() : 0.0);
                    reviewsResponse.setTotalReviews(result.has("user_ratings_total") ? result.get("user_ratings_total").asInt() : 0);
                    
                    // Actualizar caché
                    cachedResponse = reviewsResponse;
                    lastCacheTime = currentTime;
                    
                    logger.info("✅ Reviews de Google obtenidas exitosamente: {} estrellas, {} opiniones",
                            reviewsResponse.getRating(), reviewsResponse.getTotalReviews());
                    
                    return reviewsResponse;
                } else {
                    logger.error("❌ No se encontró 'result' en la respuesta de Google");
                    return createFallbackResponse();
                }
            } else {
                logger.error("❌ Error en Google API: Status {} - {}", response.statusCode(), response.body());
                return createFallbackResponse();
            }
            
        } catch (Exception e) {
            logger.error("❌ Error al obtener reviews de Google", e);
            return createFallbackResponse();
        }
    }
    
    private GoogleReviewsResponse createFallbackResponse() {
        logger.info("📊 Usando datos de respaldo para Google");
        return new GoogleReviewsResponse(4.5, 52, "Tinambú Tours");
    }
}


