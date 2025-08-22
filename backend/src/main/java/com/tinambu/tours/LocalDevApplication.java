package com.tinambu.tours;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Profile;

/**
 * Aplicación local para desarrollo y testing
 * Usar profile "local" para ejecutar localmente
 */
@SpringBootApplication
@Profile("local")
public class LocalDevApplication {

    public static void main(String[] args) {
        System.setProperty("spring.profiles.active", "local");
        SpringApplication.run(LocalDevApplication.class, args);
        
        System.out.println("=== 🚀 LOCAL DEV SERVER STARTED ===");
        System.out.println("Server: http://localhost:8080");
        System.out.println("");
        System.out.println("📋 Test Endpoints:");
        System.out.println("- GET  http://localhost:8080/basic");
        System.out.println("- GET  http://localhost:8080/simple");
        System.out.println("- GET  http://localhost:8080/ping");
        System.out.println("- GET  http://localhost:8080/health");
        System.out.println("");
        System.out.println("🔐 Auth Endpoints:");
        System.out.println("- GET  http://localhost:8080/auth/info");
        System.out.println("- POST http://localhost:8080/auth/login");
        System.out.println("- POST http://localhost:8080/auth/signup");
        System.out.println("- GET  http://localhost:8080/auth/validate");
        System.out.println("");
        System.out.println("🗄️ Database Endpoints (if enabled):");
        System.out.println("- GET  http://localhost:8080/database/info");
        System.out.println("- GET  http://localhost:8080/database/test");
        System.out.println("=== Ready for testing! ===");
    }
}

