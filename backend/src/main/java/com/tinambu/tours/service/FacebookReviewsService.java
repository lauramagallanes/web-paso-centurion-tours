package com.tinambu.tours.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tinambu.tours.dto.response.FacebookReviewsResponse;
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
public class FacebookReviewsService {
    
    private static final Logger logger = LoggerFactory.getLogger(FacebookReviewsService.class);
    
    @Value("${facebook.api.page-id:}")
    private String pageId;
    
    @Value("${facebook.api.access-token:}")
    private String accessToken;
    
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;
    
    // Cache simple
    private FacebookReviewsResponse cachedResponse;
    private long lastCacheTime = 0;
    private static final long CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 horas
    
    public FacebookReviewsService() {
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
        this.objectMapper = new ObjectMapper();
    }
    
    public FacebookReviewsResponse getReviews() {
        logger.info("🔍 Obteniendo reviews de Facebook...");
        
        // Verificar credenciales
        if (pageId == null || pageId.isEmpty()) {
            logger.warn("⚠️ Facebook Page ID no configurado");
            return createFallbackResponse();
        }
        
        if (accessToken == null || accessToken.isEmpty()) {
            logger.warn("⚠️ Facebook Access Token no configurado");
            return createFallbackResponse();
        }
        
        // Verificar caché
        long currentTime = System.currentTimeMillis();
        if (cachedResponse != null && (currentTime - lastCacheTime) < CACHE_DURATION_MS) {
            logger.info("✅ Usando reviews de Facebook desde caché");
            return cachedResponse;
        }
        
        try {
            // Construir URL de la API de Facebook Graph
            String url = String.format(
                "https://graph.facebook.com/v18.0/%s?fields=name,overall_star_rating,rating_count&access_token=%s",
                pageId,
                accessToken
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
                
                FacebookReviewsResponse reviewsResponse = new FacebookReviewsResponse();
                reviewsResponse.setId(root.has("id") ? root.get("id").asText() : pageId);
                reviewsResponse.setName(root.has("name") ? root.get("name").asText() : "");
                reviewsResponse.setRating(root.has("overall_star_rating") ? root.get("overall_star_rating").asDouble() : 0.0);
                reviewsResponse.setTotalReviews(root.has("rating_count") ? root.get("rating_count").asInt() : 0);
                
                // Actualizar caché
                cachedResponse = reviewsResponse;
                lastCacheTime = currentTime;
                
                logger.info("✅ Reviews de Facebook obtenidas exitosamente: {} estrellas, {} opiniones",
                        reviewsResponse.getRating(), reviewsResponse.getTotalReviews());
                
                return reviewsResponse;
            } else {
                logger.error("❌ Error en Facebook API: Status {} - {}", response.statusCode(), response.body());
                return createFallbackResponse();
            }
            
        } catch (Exception e) {
            logger.error("❌ Error al obtener reviews de Facebook", e);
            return createFallbackResponse();
        }
    }
    
    private FacebookReviewsResponse createFallbackResponse() {
        logger.info("📊 Usando datos de respaldo para Facebook");
        return new FacebookReviewsResponse(4.9, 28, "Tinambú Tours", pageId);
    }
}


