package com.tinambu.tours.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.ses.SesClient;

/**
 * Configuración de AWS SES para envío de emails
 */
@Configuration
@Profile({"lambda", "lambda-with-db"})
public class SESConfig {

    @Value("${aws.ses.region:us-east-1}")
    private String awsRegion;

    /**
     * Bean SesClient con configuración robusta
     * Si falla la inicialización, la aplicación continúa sin SES
     */
    @Bean(name = "sesClient")
    public SesClient sesClient() {
        try {
            System.out.println("🔧 Inicializando SesClient para región: " + awsRegion);
            
            SesClient client = SesClient.builder()
                .region(Region.of(awsRegion))
                .credentialsProvider(DefaultCredentialsProvider.create())
                .build();
            
            System.out.println("✅ SesClient inicializado exitosamente");
            return client;
            
        } catch (Exception e) {
            System.err.println("❌ Error inicializando SesClient: " + e.getMessage());
            System.err.println("⚠️ La aplicación continuará sin funcionalidad de envío de emails");
            
            // Retornar null es válido - el servicio debe manejar esta situación
            return null;
        }
    }
}





