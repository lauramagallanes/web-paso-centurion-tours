package com.tinambu.tours.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.ssm.SsmClient;
import software.amazon.awssdk.services.ssm.model.GetParameterRequest;
import software.amazon.awssdk.services.ssm.model.GetParameterResponse;

import java.util.HashMap;
import java.util.Map;

/**
 * EnvironmentPostProcessor que obtiene parámetros de SSM ANTES de que Spring 
 * inicialice cualquier bean, incluido el DataSource.
 * SOLUCIÓN PERMANENTE Y SEGURA
 */
public class SsmEnvironmentPostProcessor implements EnvironmentPostProcessor {

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        // Solo ejecutar en perfiles lambda
        if (!environment.acceptsProfiles("lambda", "lambda-with-db")) {
            return;
        }

        System.out.println("🔐 SSM ENVIRONMENT POST PROCESSOR - Iniciando configuración segura...");
        
        try {
            String region = environment.getProperty("APP_REGION", "us-east-1");
            SsmClient ssmClient = SsmClient.builder()
                    .region(Region.of(region))
                    .build();

            Map<String, Object> ssmProperties = new HashMap<>();

            // Configurar datasource completo con variables de entorno
            String dbHost = environment.getProperty("DB_HOST");
            String dbPort = environment.getProperty("DB_PORT", "5432");
            String dbName = environment.getProperty("DB_NAME");
            String dbUser = environment.getProperty("DB_USER");
            
            if (dbHost != null && dbName != null && dbUser != null) {
                // DB_HOST puede incluir el puerto (ej: host:5432), extraer solo el host
                String hostOnly = dbHost;
                if (dbHost.contains(":")) {
                    hostOnly = dbHost.substring(0, dbHost.lastIndexOf(":"));
                }
                // Construir JDBC URL con parámetros SSL y timeout
                String jdbcUrl = String.format("jdbc:postgresql://%s:%s/%s?useUnicode=true&characterEncoding=UTF-8&sslmode=require&connectTimeout=10&socketTimeout=30", hostOnly, dbPort, dbName);
                ssmProperties.put("spring.datasource.url", jdbcUrl);
                ssmProperties.put("spring.datasource.username", dbUser);
                System.out.println("🔗 Configurando datasource: " + jdbcUrl + " con usuario: " + dbUser);
            }

            // Obtener contraseña de la base de datos de forma segura
            String dbPasswordPath = environment.getProperty("SSM_DB_PASSWORD");
            if (dbPasswordPath != null) {
                System.out.println("🔑 Obteniendo contraseña de base de datos desde SSM: " + dbPasswordPath);
                String dbPassword = getSsmParameter(ssmClient, dbPasswordPath);
                ssmProperties.put("spring.datasource.password", dbPassword);
                System.out.println("✅ Contraseña de base de datos configurada securely");
            }

            // Obtener JWT secret
            String jwtSecretPath = environment.getProperty("SSM_JWT_SECRET");
            if (jwtSecretPath != null) {
                System.out.println("🔑 Obteniendo JWT secret desde SSM: " + jwtSecretPath);
                String jwtSecret = getSsmParameter(ssmClient, jwtSecretPath);
                ssmProperties.put("security.jwt.secret", jwtSecret);
                System.out.println("✅ JWT secret configurado securely");
            }

            // Obtener credenciales PlaceToPay
            String p2pLoginPath = environment.getProperty("SSM_P2P_LOGIN");
            if (p2pLoginPath != null) {
                String p2pLogin = getSsmParameter(ssmClient, p2pLoginPath);
                ssmProperties.put("placetopay.login", p2pLogin);
                System.out.println("✅ PlaceToPay login configurado securely");
            }

            String p2pSecretPath = environment.getProperty("SSM_P2P_SECRET_KEY");
            if (p2pSecretPath != null) {
                String p2pSecret = getSsmParameter(ssmClient, p2pSecretPath);
                ssmProperties.put("placetopay.secret", p2pSecret);
                System.out.println("✅ PlaceToPay secret configurado securely");
            }

            // Agregar propiedades al environment de Spring con máxima prioridad
            if (!ssmProperties.isEmpty()) {
                MapPropertySource ssmPropertySource = new MapPropertySource("ssm-secure-parameters", ssmProperties);
                environment.getPropertySources().addFirst(ssmPropertySource);
                System.out.println("🎯 Configuración SSM aplicada exitosamente - " + ssmProperties.size() + " parámetros");
            }

        } catch (Exception e) {
            System.err.println("❌ ERROR EN SSM CONFIGURATION: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to load secure SSM parameters", e);
        }
        
        System.out.println("✅ SSM ENVIRONMENT POST PROCESSOR - Configuración segura completada");
    }

    private String getSsmParameter(SsmClient ssmClient, String parameterName) {
        try {
            GetParameterRequest request = GetParameterRequest.builder()
                    .name(parameterName)
                    .withDecryption(true)
                    .build();

            GetParameterResponse response = ssmClient.getParameter(request);
            return response.parameter().value();
        } catch (Exception e) {
            System.err.println("❌ ERROR getting SSM parameter " + parameterName + ": " + e.getMessage());
            throw new RuntimeException("Failed to get SSM parameter: " + parameterName, e);
        }
    }
}