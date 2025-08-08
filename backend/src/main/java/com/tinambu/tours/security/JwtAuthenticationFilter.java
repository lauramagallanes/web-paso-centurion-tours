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
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Filtro de autenticación JWT que se ejecuta en cada request
 * Valida el token JWT y establece la autenticación en el SecurityContext
 */
@Component
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

        String username = null;
        String jwtToken = null;

        // JWT Token está en el formato "Bearer token"
        if (requestTokenHeader != null && requestTokenHeader.startsWith("Bearer ")) {
            jwtToken = requestTokenHeader.substring(7);
            try {
                username = jwtUtil.extractUsername(jwtToken);
            } catch (IllegalArgumentException e) {
                logger.error("No se puede obtener JWT Token", e);
            } catch (Exception e) {
                logger.error("JWT Token ha expirado o es inválido", e);
            }
        } else {
            // Log solo para debugging, no es error si no hay token en endpoints públicos
            logger.debug("JWT Token no comienza con Bearer String");
        }

        // Una vez que obtenemos el token, validamos
        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {

            try {
                UserDetails userDetails = usuarioService.loadUserByUsername(username);

                // Si el token es válido, configuramos Spring Security para establecer la autenticación
                if (jwtUtil.validateToken(jwtToken, userDetails)) {

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
                }
            } catch (Exception e) {
                logger.error("Error al establecer autenticación de usuario", e);
            }
        }
        
        chain.doFilter(request, response);
    }

    /**
     * Determinar si este filtro debe ejecutarse para la request actual
     * Evita procesamiento innecesario en endpoints que no requieren autenticación
     */
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) throws ServletException {
        String path = request.getRequestURI();
        
        // No filtrar endpoints de autenticación
        if (path.startsWith("/api/auth/")) {
            return true;
        }
        
        // No filtrar health checks
        if (path.equals("/api/health") || path.equals("/actuator/health")) {
            return true;
        }
        
        // No filtrar recursos estáticos
        if (path.startsWith("/static/") || path.startsWith("/public/")) {
            return true;
        }
        
        return false;
    }
}
