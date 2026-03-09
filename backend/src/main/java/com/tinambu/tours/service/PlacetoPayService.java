package com.tinambu.tours.service;

import com.tinambu.tours.config.PlacetoPayConfig;
import com.tinambu.tours.dto.response.EstadoPagoResponse;
import com.tinambu.tours.dto.response.OrdenEstadoResponse;
import com.tinambu.tours.dto.response.OrdenEstadoResponse.ItemEstado;
import com.tinambu.tours.dto.response.SesionPagoResponse;
import com.tinambu.tours.entity.orden.OrdenCompra;
import com.tinambu.tours.entity.orden.OrdenCompraItem;
import com.tinambu.tours.entity.reserva.*;
import com.tinambu.tours.repository.AlojamientoReservaRepository;
import com.tinambu.tours.repository.OrdenCompraRepository;
import com.tinambu.tours.repository.SenderoReservaRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@Transactional
public class PlacetoPayService {

    private static final Logger log = LoggerFactory.getLogger(PlacetoPayService.class);

    @Autowired
    private PlacetoPayConfig config;

    @Autowired
    @Qualifier("placetoPayRestTemplate")
    private RestTemplate restTemplate;

    @Autowired
    private SenderoReservaRepository senderoReservaRepository;

    @Autowired
    private AlojamientoReservaRepository alojamientoReservaRepository;

    @Autowired
    private OrdenCompraRepository ordenCompraRepository;

    // ==================== CREATE PAYMENT SESSION ====================

    public SesionPagoResponse crearSesionPagoSendero(UUID reservaId, String tipoPago, String ipAddress, String userAgent) {
        log.info("Creating PlacetoPay session for sendero reservation: {} (tipoPago: {})", reservaId, tipoPago);

        if (!config.isConfigured()) {
            log.warn("PlacetoPay not configured, returning mock response");
            return crearRespuestaMock(reservaId, "SENDERO");
        }

        SenderoReserva reserva = senderoReservaRepository.findById(reservaId)
                .orElseThrow(() -> new IllegalArgumentException("Reserva de sendero no encontrada: " + reservaId));

        // Calculate amount based on tipoPago (same logic as alojamiento)
        BigDecimal montoACobrar;
        boolean esSena = "SENA".equalsIgnoreCase(tipoPago);
        boolean esSaldo = "SALDO".equalsIgnoreCase(tipoPago);

        if (esSaldo) {
            BigDecimal saldo = reserva.getSaldoPendiente();
            if (saldo == null || saldo.compareTo(BigDecimal.ZERO) <= 0) {
                saldo = reserva.getPrecioTotal().subtract(
                        reserva.getMontoPagado() != null ? reserva.getMontoPagado() : BigDecimal.ZERO);
            }
            if (saldo.compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalArgumentException("No hay saldo pendiente para esta reserva");
            }
            montoACobrar = saldo;
            reserva.setTipoPago("SALDO");
        } else if (esSena) {
            montoACobrar = reserva.calcularMontoSeña();
            reserva.setTipoPago("SENA");
        } else {
            montoACobrar = reserva.getPrecioTotal();
            reserva.setTipoPago("TOTAL");
        }

        log.info("Amount to charge: {} (total: {}, tipoPago: {})", montoACobrar, reserva.getPrecioTotal(), tipoPago);

        String suffixDesc = esSena ? " (Reserva 30%)" : esSaldo ? " (Saldo pendiente)" : "";
        String description = String.format("Reserva Sendero: %s - %s%s",
                reserva.getSendero() != null ? reserva.getSendero().getNombre() : "N/A",
                reserva.getCodigoReserva(),
                suffixDesc);

        Map<String, Object> sessionRequest = buildSessionRequest(
                reserva.getCodigoReserva(),
                description,
                montoACobrar,
                reserva.getEmailContacto(),
                reserva.getNombreContacto(),
                ipAddress,
                userAgent,
                reservaId.toString(),
                "SENDERO"
        );

        Map<String, Object> response = callPlacetoPay("/api/session", sessionRequest);

        if (response != null && "OK".equals(getNestedString(response, "status", "status"))) {
            Long requestId = getLongValue(response, "requestId");
            String processUrl = (String) response.get("processUrl");

            reserva.setPlacetoPayRequestId(requestId);
            reserva.setMetodoPago("PLACETOPAY");
            senderoReservaRepository.save(reserva);

            log.info("PlacetoPay session created: requestId={}, processUrl={}", requestId, processUrl);

            return SesionPagoResponse.builder()
                    .reservaId(reservaId)
                    .codigoReserva(reserva.getCodigoReserva())
                    .requestId(requestId)
                    .processUrl(processUrl)
                    .status("OK")
                    .message("Sesión de pago creada exitosamente")
                    .build();
        }

        String errorMsg = response != null ? getNestedString(response, "status", "message") : "Error desconocido";
        log.error("PlacetoPay session creation failed: {}", errorMsg);

        return SesionPagoResponse.builder()
                .reservaId(reservaId)
                .codigoReserva(reserva.getCodigoReserva())
                .status("FAILED")
                .message("Error al crear sesión de pago: " + errorMsg)
                .build();
    }

    public SesionPagoResponse crearSesionPagoAlojamiento(UUID reservaId, String tipoPago, String ipAddress, String userAgent) {
        log.info("Creating PlacetoPay session for alojamiento reservation: {} (tipoPago: {})", reservaId, tipoPago);

        if (!config.isConfigured()) {
            log.warn("PlacetoPay not configured, returning mock response");
            return crearRespuestaMock(reservaId, "ALOJAMIENTO");
        }

        AlojamientoReserva reserva = alojamientoReservaRepository.findById(reservaId)
                .orElseThrow(() -> new IllegalArgumentException("Reserva de alojamiento no encontrada: " + reservaId));

        // Calculate the amount to charge based on tipoPago
        BigDecimal montoACobrar;
        boolean esSena = "SENA".equalsIgnoreCase(tipoPago);
        boolean esSaldo = "SALDO".equalsIgnoreCase(tipoPago);

        if (esSaldo) {
            // Pay remaining balance
            BigDecimal saldo = reserva.getSaldoPendiente();
            if (saldo == null || saldo.compareTo(BigDecimal.ZERO) <= 0) {
                saldo = reserva.getPrecioTotal().subtract(
                        reserva.getMontoPagado() != null ? reserva.getMontoPagado() : BigDecimal.ZERO);
            }
            if (saldo.compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalArgumentException("No hay saldo pendiente para esta reserva");
            }
            montoACobrar = saldo;
            reserva.setTipoPago("SALDO");
        } else if (esSena) {
            montoACobrar = reserva.calcularMontoSena();
            reserva.setTipoPago("SENA");
        } else {
            montoACobrar = reserva.getPrecioTotal();
            reserva.setTipoPago("TOTAL");
        }

        log.info("Amount to charge: {} (total: {}, tipoPago: {})", montoACobrar, reserva.getPrecioTotal(), tipoPago);

        String suffixDesc = esSena ? " (Reserva 30%)" : esSaldo ? " (Saldo pendiente)" : "";
        String description = String.format("Reserva Alojamiento: %s - %s%s",
                reserva.getAlojamiento() != null ? reserva.getAlojamiento().getNombre() : "N/A",
                reserva.getCodigoReserva(),
                suffixDesc);

        Map<String, Object> sessionRequest = buildSessionRequest(
                reserva.getCodigoReserva(),
                description,
                montoACobrar,
                reserva.getEmailContacto(),
                reserva.getNombreContacto(),
                ipAddress,
                userAgent,
                reservaId.toString(),
                "ALOJAMIENTO"
        );

        Map<String, Object> response = callPlacetoPay("/api/session", sessionRequest);

        if (response != null && "OK".equals(getNestedString(response, "status", "status"))) {
            Long requestId = getLongValue(response, "requestId");
            String processUrl = (String) response.get("processUrl");

            reserva.setPlacetoPayRequestId(requestId);
            alojamientoReservaRepository.save(reserva);

            log.info("PlacetoPay session created: requestId={}, processUrl={}", requestId, processUrl);

            return SesionPagoResponse.builder()
                    .reservaId(reservaId)
                    .codigoReserva(reserva.getCodigoReserva())
                    .requestId(requestId)
                    .processUrl(processUrl)
                    .status("OK")
                    .message("Sesión de pago creada exitosamente")
                    .build();
        }

        String errorMsg = response != null ? getNestedString(response, "status", "message") : "Error desconocido";
        log.error("PlacetoPay session creation failed: {}", errorMsg);

        return SesionPagoResponse.builder()
                .reservaId(reservaId)
                .codigoReserva(reserva.getCodigoReserva())
                .status("FAILED")
                .message("Error al crear sesión de pago: " + errorMsg)
                .build();
    }

    // ==================== ORDEN COMPRA PAYMENT ====================

    public SesionPagoResponse crearSesionPagoOrden(UUID ordenId, String tipoPago, String ipAddress, String userAgent) {
        log.info("Creating PlacetoPay session for orden: {} (tipoPago: {})", ordenId, tipoPago);

        OrdenCompra orden = ordenCompraRepository.findById(ordenId)
                .orElseThrow(() -> new IllegalArgumentException("Orden de compra no encontrada: " + ordenId));

        if (!config.isConfigured()) {
            log.warn("PlacetoPay not configured, returning mock response for orden");
            SesionPagoResponse mock = crearRespuestaMock(ordenId, "ORDEN");
            return mock;
        }

        boolean esSena = "SENA".equalsIgnoreCase(tipoPago);
        BigDecimal montoACobrar = orden.getMontoTotal();

        String suffixDesc = esSena ? " (Reserva 30%)" : "";
        String description = String.format("Orden de compra %s%s", orden.getCodigoOrden(), suffixDesc);

        Map<String, Object> sessionRequest = buildSessionRequest(
                orden.getCodigoOrden(),
                description,
                montoACobrar,
                orden.getEmailContacto(),
                orden.getNombreContacto(),
                ipAddress,
                userAgent,
                ordenId.toString(),
                "ORDEN"
        );

        Map<String, Object> response = callPlacetoPay("/api/session", sessionRequest);

        if (response != null && "OK".equals(getNestedString(response, "status", "status"))) {
            Long requestId = getLongValue(response, "requestId");
            String processUrl = (String) response.get("processUrl");

            orden.setPlacetoPayRequestId(requestId);
            ordenCompraRepository.save(orden);

            log.info("PlacetoPay session for orden created: requestId={}, processUrl={}", requestId, processUrl);

            return SesionPagoResponse.builder()
                    .reservaId(ordenId)
                    .codigoReserva(orden.getCodigoOrden())
                    .requestId(requestId)
                    .processUrl(processUrl)
                    .status("OK")
                    .message("Sesión de pago para orden creada exitosamente")
                    .build();
        }

        String errorMsg = response != null ? getNestedString(response, "status", "message") : "Error desconocido";
        log.error("PlacetoPay session creation failed for orden: {}", errorMsg);

        return SesionPagoResponse.builder()
                .reservaId(ordenId)
                .codigoReserva(orden.getCodigoOrden())
                .status("FAILED")
                .message("Error al crear sesión de pago: " + errorMsg)
                .build();
    }

    public OrdenEstadoResponse consultarEstadoPagoOrden(UUID ordenId) {
        log.info("Querying payment status for orden: {}", ordenId);

        OrdenCompra orden = ordenCompraRepository.findById(ordenId)
                .orElseThrow(() -> new IllegalArgumentException("Orden de compra no encontrada: " + ordenId));

        if (orden.getPlacetoPayRequestId() == null) {
            return buildOrdenEstadoResponse(orden, null, "No hay sesión de pago creada");
        }

        if (!config.isConfigured()) {
            return buildOrdenEstadoResponse(orden, null, "PlacetoPay no configurado");
        }

        Map<String, Object> authMap = new HashMap<>();
        authMap.put("auth", generarAuth());

        Map<String, Object> response = callPlacetoPay("/api/session/" + orden.getPlacetoPayRequestId(), authMap);

        if (response != null) {
            String p2pStatus = getNestedString(response, "status", "status");
            String p2pMessage = getNestedString(response, "status", "message");

            if ("APPROVED".equals(p2pStatus)) {
                // Confirm all reservations linked to this orden
                confirmarReservasDeOrden(orden);
                orden.marcarPagada();
                ordenCompraRepository.save(orden);
                log.info("Orden {} marked as PAGADA", orden.getCodigoOrden());
            }

            return buildOrdenEstadoResponse(orden, p2pStatus, p2pMessage);
        }

        return buildOrdenEstadoResponse(orden, null, "Error al consultar estado");
    }

    private void confirmarReservasDeOrden(OrdenCompra orden) {
        boolean esSena = "SENA".equalsIgnoreCase(orden.getTipoPago());

        for (OrdenCompraItem item : orden.getItems()) {
            try {
                // When the user paid only the seña (30%), register only that amount so the
                // payment status is correctly set to PARCIAL instead of COMPLETO.
                final BigDecimal montoPagadoItem = esSena
                        ? item.getSubtotal()
                              .multiply(BigDecimal.valueOf(30))
                              .divide(BigDecimal.valueOf(100), 2, java.math.RoundingMode.HALF_UP)
                        : item.getSubtotal();

                if ("SENDERO".equals(item.getTipoReserva())) {
                    senderoReservaRepository.findById(item.getReservaId()).ifPresent(reserva -> {
                        if (reserva.getEstado() == EstadoReserva.PENDIENTE) {
                            reserva.cambiarEstado(EstadoReserva.CONFIRMADA);
                            reserva.registrarPago(montoPagadoItem, "PLACETOPAY");
                            senderoReservaRepository.save(reserva);
                        }
                    });
                } else if ("ALOJAMIENTO".equals(item.getTipoReserva())) {
                    alojamientoReservaRepository.findById(item.getReservaId()).ifPresent(reserva -> {
                        if (reserva.getEstado() == EstadoReserva.PENDIENTE) {
                            reserva.setEstado(EstadoReserva.CONFIRMADA);
                            reserva.registrarPago(montoPagadoItem, "PLACETOPAY");
                            alojamientoReservaRepository.save(reserva);
                        }
                    });
                }
            } catch (Exception e) {
                log.error("Error confirming reservation {} for orden {}: {}",
                        item.getReservaId(), orden.getCodigoOrden(), e.getMessage(), e);
            }
        }
    }

    private OrdenEstadoResponse buildOrdenEstadoResponse(OrdenCompra orden, String p2pStatus, String p2pMessage) {
        List<ItemEstado> itemStates = new ArrayList<>();
        for (OrdenCompraItem item : orden.getItems()) {
            String estadoReserva = "DESCONOCIDO";
            try {
                if ("SENDERO".equals(item.getTipoReserva())) {
                    estadoReserva = senderoReservaRepository.findById(item.getReservaId())
                            .map(r -> r.getEstado().name()).orElse("NO_ENCONTRADA");
                } else if ("ALOJAMIENTO".equals(item.getTipoReserva())) {
                    estadoReserva = alojamientoReservaRepository.findById(item.getReservaId())
                            .map(r -> r.getEstado().name()).orElse("NO_ENCONTRADA");
                }
            } catch (Exception ignored) {}

            itemStates.add(ItemEstado.of(item.getReservaId(), item.getTipoReserva(),
                    estadoReserva, item.getSubtotal(), item.getDescripcion()));
        }

        return OrdenEstadoResponse.of(
                orden.getId(), orden.getCodigoOrden(),
                orden.getEstado(), orden.getMontoTotal(), orden.getTipoPago(),
                p2pStatus, p2pMessage, itemStates
        );
    }

    // ==================== QUERY PAYMENT STATUS ====================

    public EstadoPagoResponse consultarEstadoPagoSendero(UUID reservaId) {
        log.info("Querying payment status for sendero reservation: {}", reservaId);

        SenderoReserva reserva = senderoReservaRepository.findById(reservaId)
                .orElseThrow(() -> new IllegalArgumentException("Reserva de sendero no encontrada: " + reservaId));

        if (reserva.getPlacetoPayRequestId() == null) {
            return buildEstadoResponse(reservaId, reserva.getCodigoReserva(), "SENDERO",
                    reserva.getPrecioTotal(), BigDecimal.ZERO, reserva.getPrecioTotal(),
                    reserva.getEstado().name(), "PENDIENTE", null, "No hay sesión de pago creada", null);
        }

        if (!config.isConfigured()) {
            return buildEstadoResponse(reservaId, reserva.getCodigoReserva(), "SENDERO",
                    reserva.getPrecioTotal(), BigDecimal.ZERO, reserva.getPrecioTotal(),
                    reserva.getEstado().name(), "PENDIENTE", null, "PlacetoPay no configurado", 
                    reserva.getPlacetoPayRequestId());
        }

        return consultarYActualizarEstado(reserva.getPlacetoPayRequestId(), reservaId,
                reserva.getCodigoReserva(), "SENDERO", reserva);
    }

    public EstadoPagoResponse consultarEstadoPagoAlojamiento(UUID reservaId) {
        log.info("Querying payment status for alojamiento reservation: {}", reservaId);

        AlojamientoReserva reserva = alojamientoReservaRepository.findById(reservaId)
                .orElseThrow(() -> new IllegalArgumentException("Reserva de alojamiento no encontrada: " + reservaId));

        if (reserva.getPlacetoPayRequestId() == null) {
            return buildEstadoResponse(reservaId, reserva.getCodigoReserva(), "ALOJAMIENTO",
                    reserva.getPrecioTotal(), BigDecimal.ZERO, reserva.getPrecioTotal(),
                    reserva.getEstado().name(), "PENDIENTE", null, "No hay sesión de pago creada", null);
        }

        if (!config.isConfigured()) {
            return buildEstadoResponse(reservaId, reserva.getCodigoReserva(), "ALOJAMIENTO",
                    reserva.getPrecioTotal(), BigDecimal.ZERO, reserva.getPrecioTotal(),
                    reserva.getEstado().name(), "PENDIENTE", null, "PlacetoPay no configurado",
                    reserva.getPlacetoPayRequestId());
        }

        // Query PlacetoPay
        Map<String, Object> authMap = new HashMap<>();
        authMap.put("auth", generarAuth());

        Map<String, Object> response = callPlacetoPay(
                "/api/session/" + reserva.getPlacetoPayRequestId(), authMap);

        if (response != null) {
            String p2pStatus = getNestedString(response, "status", "status");
            String p2pMessage = getNestedString(response, "status", "message");

            // Update reservation based on payment status
            if ("APPROVED".equals(p2pStatus)) {
                // Determine how much was paid based on tipoPago
                BigDecimal montoPagado;
                if ("SENA".equals(reserva.getTipoPago())) {
                    montoPagado = reserva.calcularMontoSena();
                } else if ("SALDO".equals(reserva.getTipoPago())) {
                    BigDecimal saldo = reserva.getSaldoPendiente();
                    if (saldo == null || saldo.compareTo(BigDecimal.ZERO) <= 0) {
                        saldo = reserva.getPrecioTotal().subtract(
                                reserva.getMontoPagado() != null ? reserva.getMontoPagado() : BigDecimal.ZERO);
                    }
                    montoPagado = saldo;
                } else {
                    montoPagado = reserva.getPrecioTotal();
                }

                reserva.setEstado(EstadoReserva.CONFIRMADA);
                reserva.registrarPago(montoPagado, "PLACETOPAY");
                reserva.setFechaActualizacion(LocalDateTime.now());
                alojamientoReservaRepository.save(reserva);

                return buildEstadoResponse(reservaId, reserva.getCodigoReserva(), "ALOJAMIENTO",
                        reserva.getPrecioTotal(), reserva.getMontoPagado(), reserva.getSaldoPendiente(),
                        "CONFIRMADA", reserva.getEstadoPago().name(), p2pStatus, p2pMessage,
                        reserva.getPlacetoPayRequestId());
            }

            if ("REJECTED".equals(p2pStatus)) {
                return buildEstadoResponse(reservaId, reserva.getCodigoReserva(), "ALOJAMIENTO",
                        reserva.getPrecioTotal(), BigDecimal.ZERO, reserva.getPrecioTotal(),
                        reserva.getEstado().name(), "PENDIENTE", p2pStatus, p2pMessage,
                        reserva.getPlacetoPayRequestId());
            }

            // PENDING
            return buildEstadoResponse(reservaId, reserva.getCodigoReserva(), "ALOJAMIENTO",
                    reserva.getPrecioTotal(), BigDecimal.ZERO, reserva.getPrecioTotal(),
                    reserva.getEstado().name(), "PENDIENTE", p2pStatus, p2pMessage,
                    reserva.getPlacetoPayRequestId());
        }

        return buildEstadoResponse(reservaId, reserva.getCodigoReserva(), "ALOJAMIENTO",
                reserva.getPrecioTotal(), BigDecimal.ZERO, reserva.getPrecioTotal(),
                reserva.getEstado().name(), "PENDIENTE", null, "Error al consultar estado",
                reserva.getPlacetoPayRequestId());
    }

    // ==================== INTERNAL METHODS ====================

    private EstadoPagoResponse consultarYActualizarEstado(Long requestId, UUID reservaId,
                                                          String codigoReserva, String tipoReserva,
                                                          SenderoReserva reserva) {
        Map<String, Object> authMap = new HashMap<>();
        authMap.put("auth", generarAuth());

        Map<String, Object> response = callPlacetoPay("/api/session/" + requestId, authMap);

        if (response != null) {
            String p2pStatus = getNestedString(response, "status", "status");
            String p2pMessage = getNestedString(response, "status", "message");

            if ("APPROVED".equals(p2pStatus)) {
                // Determine amount paid based on tipoPago saved on the reservation
                BigDecimal montoPagado;
                if ("SENA".equals(reserva.getTipoPago())) {
                    montoPagado = reserva.calcularMontoSeña();
                } else if ("SALDO".equals(reserva.getTipoPago())) {
                    BigDecimal saldo = reserva.getSaldoPendiente();
                    if (saldo == null || saldo.compareTo(BigDecimal.ZERO) <= 0) {
                        saldo = reserva.getPrecioTotal().subtract(
                                reserva.getMontoPagado() != null ? reserva.getMontoPagado() : BigDecimal.ZERO);
                    }
                    montoPagado = saldo;
                } else {
                    montoPagado = reserva.getPrecioTotal();
                }

                reserva.cambiarEstado(EstadoReserva.CONFIRMADA);
                reserva.registrarPago(montoPagado, "PLACETOPAY");
                senderoReservaRepository.save(reserva);

                return buildEstadoResponse(reservaId, codigoReserva, tipoReserva,
                        reserva.getPrecioTotal(), reserva.getMontoPagado(), reserva.getSaldoPendiente(),
                        "CONFIRMADA", reserva.getEstadoPago().name(), p2pStatus, p2pMessage, requestId);
            }

            if ("REJECTED".equals(p2pStatus)) {
                return buildEstadoResponse(reservaId, codigoReserva, tipoReserva,
                        reserva.getPrecioTotal(), BigDecimal.ZERO, reserva.getPrecioTotal(),
                        reserva.getEstado().name(), "PENDIENTE", p2pStatus, p2pMessage, requestId);
            }

            return buildEstadoResponse(reservaId, codigoReserva, tipoReserva,
                    reserva.getPrecioTotal(), BigDecimal.ZERO, reserva.getPrecioTotal(),
                    reserva.getEstado().name(), "PENDIENTE", p2pStatus, p2pMessage, requestId);
        }

        return buildEstadoResponse(reservaId, codigoReserva, tipoReserva,
                reserva.getPrecioTotal(), BigDecimal.ZERO, reserva.getPrecioTotal(),
                reserva.getEstado().name(), "PENDIENTE", null, "Error al consultar estado", requestId);
    }

    private Map<String, Object> buildSessionRequest(String reference, String description,
                                                      BigDecimal total, String email, String name,
                                                      String ipAddress, String userAgent,
                                                      String reservaId, String tipoReserva) {
        Map<String, Object> request = new HashMap<>();

        // Auth
        request.put("auth", generarAuth());

        // Payment info
        Map<String, Object> payment = new HashMap<>();
        payment.put("reference", reference);
        payment.put("description", description);

        Map<String, Object> amount = new HashMap<>();
        amount.put("currency", config.getCurrency());
        amount.put("total", total);
        payment.put("amount", amount);

        request.put("payment", payment);

        // Buyer info
        Map<String, Object> buyer = new HashMap<>();
        buyer.put("email", email);
        String[] nameParts = name.split(" ", 2);
        buyer.put("name", nameParts[0]);
        if (nameParts.length > 1) {
            buyer.put("surname", nameParts[1]);
        }
        request.put("buyer", buyer);

        // Expiration (2 hours from now)
        LocalDateTime expiration = LocalDateTime.now().plusHours(2);
        request.put("expiration", expiration.atOffset(ZoneOffset.UTC)
                .format(DateTimeFormatter.ISO_OFFSET_DATE_TIME));

        // Return URL with reservation/order info
        String idParam = "ORDEN".equals(tipoReserva)
                ? "ordenId=" + reservaId
                : "reservaId=" + reservaId + "&tipo=" + tipoReserva;
        String returnUrl = config.getReturnUrl() + "?" + idParam;
        request.put("returnUrl", returnUrl);

        String cancelUrl = config.getCancelUrl() + "?" + idParam;
        request.put("cancelUrl", cancelUrl);

        // IP and User Agent
        request.put("ipAddress", ipAddress != null ? ipAddress : "127.0.0.1");
        request.put("userAgent", userAgent != null ? userAgent : "Tinambu Tours Web");

        request.put("locale", "es_UY");
        request.put("skipResult", false);

        return request;
    }

    private Map<String, Object> generarAuth() {
        Map<String, Object> auth = new HashMap<>();

        String login = config.getLogin();
        String secretKey = config.getSecretKey();
        String seed = LocalDateTime.now().atOffset(ZoneOffset.UTC)
                .format(DateTimeFormatter.ISO_OFFSET_DATE_TIME);
        String rawNonce = String.valueOf(System.nanoTime());

        try {
            // tranKey = Base64(SHA-256(nonce + seed + secretKey))
            String toHash = rawNonce + seed + secretKey;
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(toHash.getBytes(StandardCharsets.UTF_8));
            String tranKey = Base64.getEncoder().encodeToString(hash);

            String nonce = Base64.getEncoder().encodeToString(rawNonce.getBytes(StandardCharsets.UTF_8));

            auth.put("login", login);
            auth.put("tranKey", tranKey);
            auth.put("nonce", nonce);
            auth.put("seed", seed);

        } catch (Exception e) {
            log.error("Error generating PlacetoPay auth", e);
            throw new RuntimeException("Error generating PlacetoPay authentication", e);
        }

        return auth;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> callPlacetoPay(String endpoint, Map<String, Object> body) {
        try {
            String url = config.getBaseUrl() + endpoint;
            log.info("Calling PlacetoPay: POST {}", url);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(body, headers);

            ResponseEntity<Map> responseEntity = restTemplate.exchange(
                    url, HttpMethod.POST, requestEntity, Map.class);

            log.info("PlacetoPay response status: {}", responseEntity.getStatusCode());
            return responseEntity.getBody();

        } catch (Exception e) {
            log.error("Error calling PlacetoPay: {}", e.getMessage(), e);
            return null;
        }
    }

    private SesionPagoResponse crearRespuestaMock(UUID reservaId, String tipoReserva) {
        return SesionPagoResponse.builder()
                .reservaId(reservaId)
                .status("MOCK")
                .message("PlacetoPay no configurado - modo de prueba. " +
                         "Configure las credenciales P2P para habilitar pagos reales.")
                .build();
    }

    private EstadoPagoResponse buildEstadoResponse(UUID reservaId, String codigoReserva,
                                                    String tipoReserva, BigDecimal precioTotal,
                                                    BigDecimal montoPagado, BigDecimal saldoPendiente,
                                                    String estadoReserva, String estadoPago,
                                                    String p2pStatus, String p2pMessage,
                                                    Long p2pRequestId) {
        return EstadoPagoResponse.builder()
                .reservaId(reservaId)
                .codigoReserva(codigoReserva)
                .tipoReserva(tipoReserva)
                .precioTotal(precioTotal)
                .montoPagado(montoPagado)
                .saldoPendiente(saldoPendiente)
                .estadoReserva(estadoReserva)
                .estadoPago(estadoPago)
                .placetoPayStatus(p2pStatus)
                .placetoPayMessage(p2pMessage)
                .placetoPayRequestId(p2pRequestId)
                .build();
    }

    @SuppressWarnings("unchecked")
    private String getNestedString(Map<String, Object> map, String key1, String key2) {
        if (map == null) return null;
        Object nested = map.get(key1);
        if (nested instanceof Map) {
            Object value = ((Map<String, Object>) nested).get(key2);
            return value != null ? value.toString() : null;
        }
        return null;
    }

    private Long getLongValue(Map<String, Object> map, String key) {
        if (map == null) return null;
        Object value = map.get(key);
        if (value instanceof Number) {
            return ((Number) value).longValue();
        }
        return null;
    }
}
