package com.tinambu.tours.controller;

import com.tinambu.tours.dto.response.ApiResponse;
import com.tinambu.tours.dto.response.FacebookReviewsResponse;
import com.tinambu.tours.dto.response.GoogleReviewsResponse;
import com.tinambu.tours.dto.response.ReviewsSummaryResponse;
import com.tinambu.tours.service.FacebookReviewsService;
import com.tinambu.tours.service.GoogleReviewsService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/reviews")
@CrossOrigin(origins = "*")
public class ReviewsController {
    
    private static final Logger logger = LoggerFactory.getLogger(ReviewsController.class);
    
    @Autowired
    private GoogleReviewsService googleReviewsService;
    
    @Autowired
    private FacebookReviewsService facebookReviewsService;
    
    /**
     * Obtiene reviews de Google
     * GET /api/reviews/google
     */
    @GetMapping("/google")
    public ResponseEntity<ApiResponse<GoogleReviewsResponse>> getGoogleReviews() {
        logger.info("📊 GET /api/reviews/google - Obteniendo reviews de Google");
        
        try {
            GoogleReviewsResponse reviews = googleReviewsService.getReviews();
            return ResponseEntity.ok(
                ApiResponse.success(reviews, "Reviews de Google obtenidas exitosamente")
            );
        } catch (Exception e) {
            logger.error("❌ Error al obtener reviews de Google", e);
            return ResponseEntity.internalServerError().body(
                ApiResponse.error("Error al obtener reviews de Google: " + e.getMessage())
            );
        }
    }
    
    /**
     * Obtiene reviews de Facebook
     * GET /api/reviews/facebook
     */
    @GetMapping("/facebook")
    public ResponseEntity<ApiResponse<FacebookReviewsResponse>> getFacebookReviews() {
        logger.info("📊 GET /api/reviews/facebook - Obteniendo reviews de Facebook");
        
        try {
            FacebookReviewsResponse reviews = facebookReviewsService.getReviews();
            return ResponseEntity.ok(
                ApiResponse.success(reviews, "Reviews de Facebook obtenidas exitosamente")
            );
        } catch (Exception e) {
            logger.error("❌ Error al obtener reviews de Facebook", e);
            return ResponseEntity.internalServerError().body(
                ApiResponse.error("Error al obtener reviews de Facebook: " + e.getMessage())
            );
        }
    }
    
    /**
     * Obtiene resumen de todas las reviews (Google + Facebook)
     * GET /api/reviews/summary
     */
    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<ReviewsSummaryResponse>> getAllReviews() {
        logger.info("📊 GET /api/reviews/summary - Obteniendo resumen de todas las reviews");
        
        try {
            GoogleReviewsResponse googleReviews = googleReviewsService.getReviews();
            FacebookReviewsResponse facebookReviews = facebookReviewsService.getReviews();
            
            ReviewsSummaryResponse summary = new ReviewsSummaryResponse(googleReviews, facebookReviews);
            
            return ResponseEntity.ok(
                ApiResponse.success(summary, "Resumen de reviews obtenido exitosamente")
            );
        } catch (Exception e) {
            logger.error("❌ Error al obtener resumen de reviews", e);
            return ResponseEntity.internalServerError().body(
                ApiResponse.error("Error al obtener resumen de reviews: " + e.getMessage())
            );
        }
    }
    
    /**
     * Endpoint de salud para verificar que el servicio de reviews funciona
     * GET /api/reviews/health
     */
    @GetMapping("/health")
    public ResponseEntity<ApiResponse<String>> healthCheck() {
        logger.info("💚 GET /api/reviews/health - Health check");
        return ResponseEntity.ok(
            ApiResponse.success("OK", "Reviews service is healthy")
        );
    }
}

