package com.tinambu.tours.controller;

import com.tinambu.tours.dto.request.CrearSesionPagoRequest;
import com.tinambu.tours.dto.response.ApiResponse;
import com.tinambu.tours.dto.response.EstadoPagoResponse;
import com.tinambu.tours.dto.response.SesionPagoResponse;
import com.tinambu.tours.service.PlacetoPayService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
}
