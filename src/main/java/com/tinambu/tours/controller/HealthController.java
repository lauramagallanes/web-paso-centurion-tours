package com.tinambu.tours.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/**
 * Health check controller for testing Spring Boot integration with Lambda
 */
@RestController
@RequestMapping("/health")
public class HealthController {

    @Autowired
    private ApplicationContext applicationContext;

    @GetMapping
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "ok");
        response.put("message", "Spring Boot is fully working in Lambda!");
        response.put("timestamp", Instant.now().toString());
        response.put("service", "tinambu-tours-backend");
        response.put("environment", System.getenv().getOrDefault("ENVIRONMENT", "unknown"));
        response.put("spring_context", "initialized");
        response.put("bean_count", applicationContext.getBeanDefinitionCount());
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/info")
    public ResponseEntity<Map<String, Object>> info() {
        Map<String, Object> response = new HashMap<>();
        response.put("application", "Tinambu Tours");
        response.put("version", "1.0.0");
        response.put("spring.profiles.active", System.getProperty("spring.profiles.active", "default"));
        response.put("java.version", System.getProperty("java.version"));
        response.put("aws.region", System.getenv("AWS_REGION"));
        response.put("lambda.function", System.getenv("AWS_LAMBDA_FUNCTION_NAME"));
        response.put("lambda.version", System.getenv("AWS_LAMBDA_FUNCTION_VERSION"));
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/beans")
    public ResponseEntity<Map<String, Object>> beans() {
        Map<String, Object> response = new HashMap<>();
        response.put("total_beans", applicationContext.getBeanDefinitionCount());
        response.put("bean_names", applicationContext.getBeanDefinitionNames());
        
        return ResponseEntity.ok(response);
    }
}