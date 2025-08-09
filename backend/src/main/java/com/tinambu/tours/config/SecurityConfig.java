package com.tinambu.tours.config;

import com.tinambu.tours.security.JwtAuthenticationEntryPoint;
import com.tinambu.tours.security.JwtAuthenticationFilter;
import com.tinambu.tours.service.UsuarioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
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
public class SecurityConfig {

    @Autowired
    private UsuarioService usuarioService;

    @Autowired
    private JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    /**
     * Configuración principal de seguridad
     */
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // Deshabilitar CSRF para APIs REST
            .csrf(csrf -> csrf.disable())
            
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
                .requestMatchers("/auth/**").permitAll()
                .requestMatchers("/health").permitAll()
                .requestMatchers("/actuator/health").permitAll()
                
                // Endpoints públicos de consulta (solo GET)
                .requestMatchers(HttpMethod.GET, "/habitaciones/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/senderos/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/guias/**").permitAll()
                
                // Endpoints públicos de reservas (para visitantes)
                .requestMatchers(HttpMethod.POST, "/reservas").permitAll()
                .requestMatchers(HttpMethod.POST, "/reservas/verificar-disponibilidad").permitAll()
                .requestMatchers(HttpMethod.POST, "/reservas/calcular-precio").permitAll()
                .requestMatchers(HttpMethod.GET, "/reservas/codigo/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/reservas/email/**").permitAll()
                
                // Endpoints administrativos - requieren autenticación y rol ADMIN
                .requestMatchers("/*/admin/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/reservas/admin/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/**").hasRole("ADMIN")
                
                // Cualquier otro endpoint requiere autenticación
                .anyRequest().authenticated())
            
            // Configurar provider de autenticación
            .authenticationProvider(daoAuthenticationProvider())
            
            // Agregar filtro JWT antes del filtro de autenticación por username/password
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /**
     * Configuración de CORS
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // Orígenes permitidos (configurables por ambiente)
        configuration.setAllowedOriginPatterns(Arrays.asList(
            "http://localhost:*",
            "https://localhost:*",
            "http://127.0.0.1:*",
            "https://127.0.0.1:*"
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
        return new BCryptPasswordEncoder(10); // Strength 10 temporal para testing
    }

    /**
     * Provider de autenticación DAO
     */
    @Bean
    public DaoAuthenticationProvider daoAuthenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(usuarioService);
        provider.setPasswordEncoder(passwordEncoder());
        provider.setHideUserNotFoundExceptions(false);
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
