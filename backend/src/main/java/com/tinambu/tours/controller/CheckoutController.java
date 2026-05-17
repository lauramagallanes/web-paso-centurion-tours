package com.tinambu.tours.controller;

import com.tinambu.tours.dto.request.CheckoutOrdenRequest;
import com.tinambu.tours.dto.request.CheckoutPagarPendientesRequest;
import com.tinambu.tours.dto.response.ApiResponse;
import com.tinambu.tours.dto.response.CheckoutOrdenResponse;
import com.tinambu.tours.exception.SinDisponibilidadException;
import com.tinambu.tours.service.CheckoutService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/checkout")
@CrossOrigin(origins = "*")
public class CheckoutController {

    private static final Logger log = LoggerFactory.getLogger(CheckoutController.class);

    @Autowired
    private CheckoutService checkoutService;

    @PostMapping("/orden")
    public ResponseEntity<?> crearOrdenCheckout(@Valid @RequestBody CheckoutOrdenRequest request,
                                                 HttpServletRequest httpRequest) {
        try {
            log.info("POST /checkout/orden - {} items for {}",
                    request.getItems().size(), request.getEmailContacto());

            String ipAddress = httpRequest.getHeader("X-Forwarded-For") != null
                    ? httpRequest.getHeader("X-Forwarded-For")
                    : httpRequest.getRemoteAddr();
            String userAgent = httpRequest.getHeader("User-Agent");

            CheckoutOrdenResponse response = checkoutService.procesarCheckout(request, ipAddress, userAgent);

            if ("ERROR".equals(response.getStatus())) {
                return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                        .body(ApiResponse.error(response.getMessage()));
            }

            return ResponseEntity.ok(ApiResponse.success(response, "Orden de compra creada exitosamente"));

        } catch (SinDisponibilidadException e) {
            log.warn("No availability: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (IllegalArgumentException e) {
            log.warn("Validation error: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("Error processing checkout orden", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al procesar el checkout: " + e.getMessage()));
        }
    }

    @PostMapping("/orden-pendientes")
    public ResponseEntity<?> crearOrdenPagoPendientes(@Valid @RequestBody CheckoutPagarPendientesRequest request,
                                                      HttpServletRequest httpRequest) {
        try {
            log.info("POST /checkout/orden-pendientes - {} items for {}",
                    request.getItems().size(), request.getEmailContacto());

            String ipAddress = httpRequest.getHeader("X-Forwarded-For") != null
                    ? httpRequest.getHeader("X-Forwarded-For")
                    : httpRequest.getRemoteAddr();
            String userAgent = httpRequest.getHeader("User-Agent");

            CheckoutOrdenResponse response = checkoutService.procesarPagoPendientes(request, ipAddress, userAgent);

            if ("ERROR".equals(response.getStatus())) {
                return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                        .body(ApiResponse.error(response.getMessage()));
            }

            return ResponseEntity.ok(ApiResponse.success(response, "Orden por saldos pendientes creada"));

        } catch (IllegalArgumentException e) {
            log.warn("Validation error (orden-pendientes): {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("Error processing orden-pendientes", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al procesar el pago agrupado: " + e.getMessage()));
        }
    }
}
