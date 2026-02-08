package com.tinambu.tours.controller;

import com.tinambu.tours.dto.response.ApiResponse;
import com.tinambu.tours.entity.sendero.Sendero;
import com.tinambu.tours.entity.sendero.SenderoImagen;
import com.tinambu.tours.repository.SenderoImagenRepository;
import com.tinambu.tours.repository.SenderoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Temporary controller to fix sendero images
 */
@RestController
@RequestMapping("/fix")
@CrossOrigin(origins = "*")
public class FixImageController {
    
    @Autowired
    private SenderoRepository senderoRepository;
    
    @Autowired
    private SenderoImagenRepository senderoImagenRepository;
    
    /**
     * Sync all senderos with their principal images
     */
    @GetMapping("/sync-sendero-images")
    @Transactional
    public ResponseEntity<ApiResponse<Map<String, Object>>> syncSenderoImages() {
        try {
            List<Sendero> senderos = senderoRepository.findAll();
            int updated = 0;
            int skipped = 0;
            
            for (Sendero sendero : senderos) {
                // Find principal image
                List<SenderoImagen> images = senderoImagenRepository.findBySenderoIdOrderByOrdenAsc(sendero.getId());
                
                if (!images.isEmpty()) {
                    // Find the principal image or use the first one
                    SenderoImagen principalImage = images.stream()
                        .filter(SenderoImagen::getEsPrincipal)
                        .findFirst()
                        .orElse(images.get(0));
                    
                    // Update sendero
                    sendero.setImagenPrincipal(principalImage.getUrlImagen());
                    sendero.setGaleria(true);
                    senderoRepository.save(sendero);
                    updated++;
                } else {
                    skipped++;
                }
            }
            
            Map<String, Object> result = new HashMap<>();
            result.put("total", senderos.size());
            result.put("updated", updated);
            result.put("skipped", skipped);
            result.put("message", "Sync completed successfully");
            
            return ResponseEntity.ok(ApiResponse.success(result));
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                .body(ApiResponse.error("Error syncing images: " + e.getMessage()));
        }
    }
}
