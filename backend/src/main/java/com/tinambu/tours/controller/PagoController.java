package com.tinambu.tours.controller;

import com.tinambu.tours.dto.request.CrearSesionPagoRequest;
import com.tinambu.tours.dto.response.ApiResponse;
import com.tinambu.tours.dto.response.EstadoPagoResponse;
import com.tinambu.tours.dto.response.OrdenEstadoResponse;
import com.tinambu.tours.dto.response.SesionPagoResponse;
import com.tinambu.tours.entity.usuario.Usuario;
import com.tinambu.tours.service.CheckoutService;
import com.tinambu.tours.service.PlacetoPayService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/pagos")
@CrossOrigin(origins = "*")
public class PagoController {

    private static final Logger log = LoggerFactory.getLogger(PagoController.class);

    @Autowired
    private PlacetoPayService placetoPayService;

    @Autowired
    private CheckoutService checkoutService;

    @PostMapping("/crear-sesion")
    public ResponseEntity<?> crearSesionPago(@Valid @RequestBody CrearSesionPagoRequest request,
                                              HttpServletRequest httpRequest) {
        try {
            log.info("POST /pagos/crear-sesion - Creating payment session for reservation: {} (type: {})",
                    request.getReservaId(), request.getTipoReserva());

            String ipAddress = request.getIpAddress() != null ? request.getIpAddress() :
                    httpRequest.getHeader("X-Forwarded-For") != null ? 
                    httpRequest.getHeader("X-Forwarded-For") : httpRequest.getRemoteAddr();

            String userAgent = request.getUserAgent() != null ? request.getUserAgent() :
                    httpRequest.getHeader("User-Agent");

            SesionPagoResponse response;

            String tipoPago = request.getTipoPago() != null ? request.getTipoPago() : "TOTAL";

            if ("SENDERO".equalsIgnoreCase(request.getTipoReserva())) {
                response = placetoPayService.crearSesionPagoSendero(
                        request.getReservaId(), tipoPago, ipAddress, userAgent);
            } else if ("ALOJAMIENTO".equalsIgnoreCase(request.getTipoReserva())) {
                response = placetoPayService.crearSesionPagoAlojamiento(
                        request.getReservaId(), tipoPago, ipAddress, userAgent);
            } else {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("Tipo de reserva no válido. Use SENDERO o ALOJAMIENTO"));
            }

            if ("OK".equals(response.getStatus()) || "MOCK".equals(response.getStatus())) {
                return ResponseEntity.ok(ApiResponse.success(response, "Sesión de pago creada"));
            } else {
                return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                        .body(ApiResponse.success(response, "Error al crear sesión de pago"));
            }

        } catch (IllegalArgumentException e) {
            log.warn("Validation error creating payment session: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("Error creating payment session", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error interno al crear sesión de pago: " + e.getMessage()));
        }
    }

    @GetMapping("/estado/{reservaId}")
    public ResponseEntity<?> consultarEstadoPago(@PathVariable UUID reservaId,
                                                  @RequestParam(defaultValue = "SENDERO") String tipo) {
        try {
            log.info("GET /pagos/estado/{} - Querying payment status (type: {})", reservaId, tipo);

            EstadoPagoResponse response;

            if ("SENDERO".equalsIgnoreCase(tipo)) {
                response = placetoPayService.consultarEstadoPagoSendero(reservaId);
            } else if ("ALOJAMIENTO".equalsIgnoreCase(tipo)) {
                response = placetoPayService.consultarEstadoPagoAlojamiento(reservaId);
            } else {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("Tipo de reserva no válido"));
            }

            return ResponseEntity.ok(ApiResponse.success(response, "Estado de pago consultado"));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("Error querying payment status", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al consultar estado de pago: " + e.getMessage()));
        }
    }

    @GetMapping("/estado/orden/{ordenId}")
    public ResponseEntity<?> consultarEstadoPagoOrden(@PathVariable UUID ordenId) {
        try {
            log.info("GET /pagos/estado/orden/{} - Querying payment status for orden", ordenId);

            OrdenEstadoResponse response = placetoPayService.consultarEstadoPagoOrden(ordenId);
            return ResponseEntity.ok(ApiResponse.success(response, "Estado de orden consultado"));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("Error querying orden payment status", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al consultar estado de orden: " + e.getMessage()));
        }
    }

    @PostMapping("/webhook")
    public ResponseEntity<?> webhookPlacetoPay(@RequestBody Map<String, Object> payload) {
        try {
            log.info("POST /pagos/webhook - PlacetoPay notification received: {}", payload);
            // Future: Process PlacetoPay webhook notifications
            // For now, return OK to acknowledge
            return ResponseEntity.ok(Map.of("status", "received"));
        } catch (Exception e) {
            log.error("Error processing webhook", e);
            return ResponseEntity.ok(Map.of("status", "error", "message", e.getMessage()));
        }
    }

    /**
     * Cancela una orden de compra pendiente cuando el usuario abandona la pasarela de pago.
     * Libera los bloqueos de las reservas asociadas para que las fechas vuelvan a estar disponibles.
     * Idempotente: si ya está pagada o cancelada, devuelve cancelled=false.
     */
    @PostMapping("/orden/{ordenId}/cancelar")
    public ResponseEntity<?> cancelarOrdenPendiente(@PathVariable UUID ordenId,
                                                    Authentication authentication) {
        try {
            log.info("POST /pagos/orden/{}/cancelar - User abandoned payment", ordenId);
            String email = resolveEmailUsuarioOrNull(authentication);
            boolean cancelled = checkoutService.cancelarOrdenPendiente(ordenId, email);
            return ResponseEntity.ok(Map.of("cancelled", cancelled));
        } catch (IllegalArgumentException e) {
            log.warn("Validation error cancelling orden {}: {}", ordenId, e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("Error cancelling orden {}", ordenId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al cancelar la orden: " + e.getMessage()));
        }
    }

    /**
     * Cancela una reserva pendiente individual cuando el usuario abandona la pasarela.
     * Útil para flujos sin orden agrupadora (p. ej. cancelUrl que llega con reservaId+tipo).
     */
    @PostMapping("/reserva/{reservaId}/cancelar")
    public ResponseEntity<?> cancelarReservaPendiente(@PathVariable UUID reservaId,
                                                      @RequestParam String tipo,
                                                      Authentication authentication) {
        try {
            log.info("POST /pagos/reserva/{}/cancelar - tipo={}", reservaId, tipo);
            String email = resolveEmailUsuarioOrNull(authentication);
            boolean cancelled = checkoutService.cancelarReservaPendiente(reservaId, tipo, email);
            return ResponseEntity.ok(Map.of("cancelled", cancelled));
        } catch (IllegalArgumentException e) {
            log.warn("Validation error cancelling reserva {}: {}", reservaId, e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("Error cancelling reserva {}", reservaId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al cancelar la reserva: " + e.getMessage()));
        }
    }

    /**
     * Resuelve el email del usuario autenticado a partir del Authentication.
     * Retorna null si no hay sesión válida.
     */
    private String resolveEmailUsuarioOrNull(Authentication authentication) {
        Authentication auth = authentication != null
                ? authentication
                : SecurityContextHolder.getContext().getAuthentication();

        if (auth == null || !auth.isAuthenticated()) {
            return null;
        }

        Object principal = auth.getPrincipal();
        if (principal instanceof Usuario usuario) {
            return usuario.getEmail();
        }
        if (principal instanceof UserDetails ud) {
            return ud.getUsername();
        }

        String name = auth.getName();
        if (name == null || name.isBlank() || "anonymousUser".equalsIgnoreCase(name)) {
            return null;
        }
        return name;
    }
}
