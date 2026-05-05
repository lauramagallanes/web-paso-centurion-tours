package com.tinambu.tours.config;

import com.tinambu.tours.security.JwtAuthenticationEntryPoint;
import com.tinambu.tours.security.JwtAuthenticationFilter;
import com.tinambu.tours.security.RateLimitFilter;
import com.tinambu.tours.service.UsuarioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Profile;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
@Profile("lambda-with-db")
public class SecurityConfig {

    @Autowired
    private UsuarioService usuarioService;

    @Autowired
    private JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;

    /**
     * Bean del filtro JWT
     */
    @Bean
    public JwtAuthenticationFilter jwtAuthenticationFilter() {
        return new JwtAuthenticationFilter();
    }

    /**
     * Bean del filtro de rate limiting (B1)
     */
    @Bean
    public RateLimitFilter rateLimitFilter() {
        return new RateLimitFilter();
    }

    /**
     * Deshabilitar el registro automático del filtro JWT
     */
    @Bean
    public org.springframework.boot.web.servlet.FilterRegistrationBean<JwtAuthenticationFilter> jwtFilterRegistration(JwtAuthenticationFilter filter) {
        org.springframework.boot.web.servlet.FilterRegistrationBean<JwtAuthenticationFilter> registration = new org.springframework.boot.web.servlet.FilterRegistrationBean<>(filter);
        registration.setEnabled(false);
        return registration;
    }

    /**
     * Configuración principal de seguridad
     */
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // Deshabilitar CSRF para APIs REST
            .csrf(csrf -> csrf.disable())
            
            // Headers de seguridad (B2)
            .headers(headers -> headers
                .contentTypeOptions(contentType -> {}) // X-Content-Type-Options: nosniff
                .frameOptions(frame -> frame.deny())   // X-Frame-Options: DENY
                .httpStrictTransportSecurity(hsts -> hsts
                    .includeSubDomains(true)
                    .maxAgeInSeconds(31536000))         // HSTS: 1 año
                .cacheControl(cache -> {})              // Cache-Control: no-cache, no-store
            )
            
            // Configurar CORS
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            
            // Configurar manejo de excepciones de autenticación
            .exceptionHandling(exceptions -> exceptions
                .authenticationEntryPoint(jwtAuthenticationEntryPoint))
            
            // Configurar gestión de sesiones como STATELESS (sin sesiones)
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            
            // Configurar autorización de requests
            .authorizeHttpRequests(authz -> authz
                // Endpoints completamente públicos (sin prefijo /api porque ya estamos en el contexto)
                .requestMatchers("/auth/login").permitAll()
                .requestMatchers("/auth/signup").permitAll()
                .requestMatchers("/auth/refresh").permitAll()
                // promote-to-admin requiere ser ADMIN (H1)
                .requestMatchers("/auth/promote-to-admin").hasRole("ADMIN")
                // Endpoints de auth que requieren autenticación
                .requestMatchers("/auth/validate").authenticated()
                // debug solo para ADMIN (M4)
                .requestMatchers("/auth/debug").hasRole("ADMIN")
                .requestMatchers("/health").permitAll()
                .requestMatchers("/health/**").permitAll()
                .requestMatchers("/test").permitAll()
                .requestMatchers("/ping").permitAll()
                .requestMatchers("/basic").permitAll()
                .requestMatchers("/simple").permitAll()
                .requestMatchers("/actuator/health").permitAll()
                
                // Endpoints administrativos PRIMERO (más específicos)
                .requestMatchers("/dashboard/admin/**").hasRole("ADMIN")
                .requestMatchers("/admin/**").hasRole("ADMIN")
                .requestMatchers("/alojamientos/admin/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET, "/alojamientos/admin").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/alojamientos/admin").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/alojamientos/admin/**").hasRole("ADMIN")
                .requestMatchers("/habitaciones/admin/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/habitaciones/admin/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/habitaciones/admin").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/habitaciones/admin/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET, "/habitaciones/admin/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET, "/habitaciones/admin").hasRole("ADMIN")
                // Senderos admin: explicit rules required because GET /senderos/** below would
                // otherwise match these as permitAll and skip the JWT filter, breaking @PreAuthorize.
                .requestMatchers("/senderos/admin/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET, "/senderos/admin").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/senderos/admin").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/senderos/admin/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/senderos/admin/**").hasRole("ADMIN")
                .requestMatchers("/*/admin/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/reservas/admin/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/**").hasRole("ADMIN")
                
                // Endpoints públicos de consulta (solo GET) - DESPUÉS
                .requestMatchers(HttpMethod.GET, "/habitaciones/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/senderos/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/guias/**").permitAll()
                
                // Endpoints públicos de reservas (para visitantes)
                .requestMatchers(HttpMethod.POST, "/reservas").permitAll()
                .requestMatchers(HttpMethod.POST, "/reservas/verificar-disponibilidad").permitAll()
                .requestMatchers(HttpMethod.POST, "/reservas/calcular-precio").permitAll()
                .requestMatchers(HttpMethod.GET, "/reservas/codigo/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/reservas/email/**").permitAll()
                // Consulta de cupos por fecha/turno para el detalle de sendero (solo lectura, sin datos sensibles)
                .requestMatchers(HttpMethod.GET, "/reservas/sendero/disponibilidad").permitAll()
                
                // Cualquier otro endpoint requiere autenticación
                .anyRequest().authenticated())
            
            // Configurar provider de autenticación
            .authenticationProvider(daoAuthenticationProvider())
            
            // Rate limiting antes de todo (B1)
            .addFilterBefore(rateLimitFilter(), UsernamePasswordAuthenticationFilter.class)
            // Agregar filtro JWT antes del filtro de autenticación por username/password
            .addFilterBefore(jwtAuthenticationFilter(), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /**
     * Configuración de CORS
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // Orígenes permitidos (configurables por ambiente)
        // CORS: solo origenes conocidos, sin wildcards amplios (M1)
        configuration.setAllowedOriginPatterns(Arrays.asList(
            "http://localhost:*",
            "https://localhost:*",
            "http://127.0.0.1:*",
            "https://127.0.0.1:*",
            "https://tinambu-frontend-dev.s3.us-east-1.amazonaws.com",
            "https://tinambu-frontend-dev.s3-website-us-east-1.amazonaws.com"
        ));
        
        // Métodos HTTP permitidos
        configuration.setAllowedMethods(Arrays.asList(
            "GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"
        ));
        
        // Headers permitidos
        configuration.setAllowedHeaders(Arrays.asList("*"));
        
        // Permitir credenciales
        configuration.setAllowCredentials(true);
        
        // Headers expuestos al cliente
        configuration.setExposedHeaders(Arrays.asList(
            "Authorization", "Content-Type", "X-Total-Count"
        ));
        
        // Tiempo de cache para preflight requests
        configuration.setMaxAge(3600L);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        
        return source;
    }

    /**
     * Encoder de contraseñas usando BCrypt
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12); // Strength 12 para producción
    }

    /**
     * Provider de autenticación DAO
     */
    @Bean
    public DaoAuthenticationProvider daoAuthenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(usuarioService);
        provider.setPasswordEncoder(passwordEncoder());
        // Ocultar si el usuario no existe para evitar enumeración de cuentas (H4)
        provider.setHideUserNotFoundExceptions(true);
        return provider;
    }

    /**
     * Authentication Manager
     */
    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }
}
