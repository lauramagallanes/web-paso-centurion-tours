package com.tinambu.tours.security;

import com.tinambu.tours.service.UsuarioService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;

import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Filtro de autenticación JWT que se ejecuta en cada request
 * Valida el token JWT y establece la autenticación en el SecurityContext
 */
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UsuarioService usuarioService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, 
                                  HttpServletResponse response, 
                                  FilterChain chain) throws ServletException, IOException {

        final String requestTokenHeader = request.getHeader("Authorization");
        logger.debug("=== INICIO FILTRO JWT === URI: " + request.getRequestURI() + " | Thread: " + Thread.currentThread().getName());

        String username = null;
        String jwtToken = null;

        // JWT Token está en el formato "Bearer token"
        if (requestTokenHeader != null && requestTokenHeader.startsWith("Bearer ")) {
            jwtToken = requestTokenHeader.substring(7);
            logger.debug("JWT Token extraído: " + jwtToken.substring(0, Math.min(20, jwtToken.length())) + "...");
            try {
                username = jwtUtil.extractUsername(jwtToken);
                logger.debug("Username extraído del token: " + username);
            } catch (IllegalArgumentException e) {
                logger.error("No se puede obtener JWT Token", e);
            } catch (Exception e) {
                logger.error("JWT Token ha expirado o es inválido", e);
            }
        } else {
            // Log solo para debugging, no es error si no hay token en endpoints públicos
            logger.debug("JWT Token no comienza con Bearer String o es null. Header: " + requestTokenHeader);
        }

        // Una vez que obtenemos el token, validamos
        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            logger.debug("Intentando validar token para usuario: " + username);

            try {
                UserDetails userDetails = usuarioService.loadUserByUsername(username);
                logger.debug("UserDetails cargado para: " + userDetails.getUsername());

                // Si el token es válido, configuramos Spring Security para establecer la autenticación
                boolean isValidToken = jwtUtil.validateToken(jwtToken, userDetails);
                logger.debug("Token válido: " + isValidToken);
                
                if (isValidToken) {

                    UsernamePasswordAuthenticationToken usernamePasswordAuthenticationToken = 
                        new UsernamePasswordAuthenticationToken(
                            userDetails, 
                            null, 
                            userDetails.getAuthorities()
                        );
                    
                    usernamePasswordAuthenticationToken
                        .setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    
                    // Después de establecer la autenticación en el contexto, especificamos
                    // que el usuario actual está autenticado. Pasa las verificaciones de Spring Security
                    SecurityContextHolder.getContext().setAuthentication(usernamePasswordAuthenticationToken);
                    logger.debug("Autenticación establecida exitosamente para: " + username);
                } else {
                    logger.debug("Token inválido para usuario: " + username);
                }
            } catch (Exception e) {
                logger.error("Error al establecer autenticación de usuario", e);
            }
        } else {
            if (username == null) {
                logger.debug("Username es null, no se puede validar token");
            } else {
                logger.debug("Ya existe autenticación en SecurityContext");
            }
        }
        
        logger.debug("=== FIN FILTRO JWT === URI: " + request.getRequestURI() + " | Thread: " + Thread.currentThread().getName());
        chain.doFilter(request, response);
    }

    /**
     * Determinar si este filtro debe ejecutarse para la request actual
     * Evita procesamiento innecesario en endpoints que no requieren autenticación
     */
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) throws ServletException {
        String path = request.getRequestURI();
        String contextPath = request.getContextPath();
        String servletPath = request.getServletPath();
        
        logger.debug("JWT Filter - URI: " + path + ", Context: " + contextPath + ", Servlet: " + servletPath);
        
        // No filtrar solo endpoints de autenticación públicos
        if (path.equals("/auth/login") || path.equals("/auth/signup") || path.equals("/auth/refresh")) {
            logger.debug("Skipping JWT filter for public auth endpoint: " + path);
            return true;
        }
        
        // No filtrar health checks
        if (path.equals("/health") || path.equals("/actuator/health") || path.contains("/health")) {
            logger.debug("Skipping JWT filter for health endpoint: " + path);
            return true;
        }
        
        // No filtrar recursos estáticos
        if (path.startsWith("/static/") || path.startsWith("/public/")) {
            logger.debug("Skipping JWT filter for static resources: " + path);
            return true;
        }
        
        logger.debug("JWT filter will process: " + path);
        return false;
    }
}
