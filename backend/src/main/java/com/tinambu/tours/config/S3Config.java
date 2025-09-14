package com.tinambu.tours.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;

/**
 * Configuración robusta de S3 con manejo de errores mejorado
 */
@Configuration
@Profile("lambda-with-db")
public class S3Config {

    @Value("${aws.s3.region:us-east-1}")
    private String awsRegion;

    /**
     * Bean S3Client con configuración robusta
     * Si falla la inicialización, la aplicación continúa sin S3
     */
    @Bean(name = "s3Client")
    public S3Client s3Client() {
        try {
            System.out.println("🔧 Inicializando S3Client para región: " + awsRegion);
            
            S3Client client = S3Client.builder()
                .region(Region.of(awsRegion))
                .credentialsProvider(DefaultCredentialsProvider.create())
                .build();
            
            System.out.println("✅ S3Client inicializado exitosamente");
            return client;
            
        } catch (Exception e) {
            System.err.println("❌ Error inicializando S3Client: " + e.getMessage());
            System.err.println("⚠️ La aplicación continuará sin funcionalidad S3");
            
            // Retornar null es válido - el servicio debe manejar esta situación
            return null;
        }
    }
}
