package com.tinambu.tours.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.web.multipart.MultipartResolver;
import org.springframework.web.multipart.support.StandardServletMultipartResolver;

/**
 * Configuración específica de Multipart para entorno Lambda
 */
@Configuration
@Profile({"lambda", "lambda-with-db"})
public class LambdaMultipartConfig {

    /**
     * Configurar MultipartResolver para Lambda
     * StandardServletMultipartResolver funciona mejor en entornos Lambda
     */
    @Bean
    public MultipartResolver multipartResolver() {
        System.out.println("🔧 Configurando StandardServletMultipartResolver para Lambda");
        
        StandardServletMultipartResolver resolver = new StandardServletMultipartResolver();
        
        // Configuración específica para Lambda
        resolver.setResolveLazily(true);
        
        System.out.println("✅ StandardServletMultipartResolver configurado exitosamente");
        return resolver;
    }
}

