package com.tinambu.tours.service;

import com.tinambu.tours.dto.request.AlojamientoReservaRequest;
import com.tinambu.tours.dto.request.CheckoutOrdenRequest;
import com.tinambu.tours.dto.request.CheckoutOrdenRequest.ItemOrdenRequest;
import com.tinambu.tours.dto.request.CheckoutPagarPendientesRequest;
import com.tinambu.tours.dto.request.ReservaRequest;
import com.tinambu.tours.dto.response.AlojamientoReservaResponse;
import com.tinambu.tours.dto.response.CheckoutOrdenResponse;
import com.tinambu.tours.dto.response.CheckoutOrdenResponse.ReservaCreada;
import com.tinambu.tours.dto.response.ReservaResponse;
import com.tinambu.tours.dto.response.SesionPagoResponse;
import com.tinambu.tours.entity.orden.OrdenCompra;
import com.tinambu.tours.entity.orden.OrdenCompraItem;
import com.tinambu.tours.entity.reserva.AlojamientoReserva;
import com.tinambu.tours.entity.reserva.EstadoPago;
import com.tinambu.tours.entity.reserva.EstadoReserva;
import com.tinambu.tours.entity.reserva.SenderoReserva;
import com.tinambu.tours.entity.reserva.TipoReserva;
import com.tinambu.tours.entity.sendero.TurnoSendero;
import com.tinambu.tours.repository.AlojamientoReservaRepository;
import com.tinambu.tours.repository.OrdenCompraRepository;
import com.tinambu.tours.repository.SenderoReservaRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
public class CheckoutService {

    private static final Logger log = LoggerFactory.getLogger(CheckoutService.class);

    @Autowired
    private ReservaService reservaService;

    @Autowired
    private PlacetoPayService placetoPayService;

    @Autowired
    private OrdenCompraRepository ordenCompraRepository;

    @Autowired
    private SenderoReservaRepository senderoReservaRepository;

    @Autowired
    private AlojamientoReservaRepository alojamientoReservaRepository;

    /**
     * Full checkout flow:
     * 1. Create all reservations transactionally.
     * 2. Create OrdenCompra grouping them.
     * 3. Call PlacetoPay with the total amount.
     * 4. Return processUrl to redirect the user.
     */
    public CheckoutOrdenResponse procesarCheckout(CheckoutOrdenRequest request,
                                                   String ipAddress, String userAgent) {
        String metodoPago = request.getMetodoPago() != null ? request.getMetodoPago().toUpperCase() : "CARD";
        log.info("Processing checkout for {} with {} items (tipoPago: {}, metodoPago: {})",
                request.getEmailContacto(), request.getItems().size(),
                request.getTipoPago(), metodoPago);

        String tipoPago = request.getTipoPago() != null ? request.getTipoPago().toUpperCase() : "TOTAL";

        // Step 1: Create all reservations and OrdenCompra in a single transaction
        OrdenConReservas result = crearOrdenConReservas(request, tipoPago);
        OrdenCompra orden = result.orden;

        // Step 2 (PREX): skip PlacetoPay; user transfers manually and admin confirms.
        // Tag every reservation with metodoPago=PREX so the auto-cancel job can find them
        // 12h after creation if the admin hasn't registered the payment.
        if ("PREX".equals(metodoPago)) {
            marcarReservasComoPrex(result.reservasCreadas, tipoPago);
            log.info("Orden {} marked as pending Prex transfer ({} reservas tagged)",
                    orden.getCodigoOrden(), result.reservasCreadas.size());
            return CheckoutOrdenResponse.of(
                    orden.getId(), orden.getCodigoOrden(),
                    orden.getMontoTotal(), tipoPago,
                    null, "PENDIENTE_TRANSFERENCIA",
                    "Orden generada. Realizá la transferencia para confirmar tu reserva. Tenés 12 horas para enviar el comprobante; pasado ese plazo, la reserva se cancelará automáticamente.",
                    result.reservasCreadas
            );
        }

        // Tag CARD reservations too so admins can audit how the customer chose to pay
        marcarReservasComoMetodoPago(result.reservasCreadas, "CARD", tipoPago);

        // Step 2 (CARD): call PlacetoPay (outside the transaction, failure is non-fatal for DB state)
        try {
            SesionPagoResponse sesion = placetoPayService.crearSesionPagoOrden(
                    orden.getId(), tipoPago, ipAddress, userAgent);

            String status = sesion.getStatus();
            String processUrl = sesion.getProcessUrl();

            return CheckoutOrdenResponse.of(
                    orden.getId(), orden.getCodigoOrden(),
                    orden.getMontoTotal(), tipoPago,
                    processUrl, status,
                    "Sesión de pago creada. Redirigiendo al procesador de pagos.",
                    result.reservasCreadas
            );

        } catch (Exception e) {
            log.error("PlacetoPay session creation failed for orden {}: {}", orden.getCodigoOrden(), e.getMessage(), e);
            return CheckoutOrdenResponse.of(
                    orden.getId(), orden.getCodigoOrden(),
                    orden.getMontoTotal(), tipoPago,
                    null, "ERROR",
                    "Las reservas fueron creadas pero no se pudo iniciar el pago: " + e.getMessage(),
                    result.reservasCreadas
            );
        }
    }

    /**
     * Orden única por el saldo pendiente de reservas ya existentes (tarjeta o transferencia Prex).
     */
    public CheckoutOrdenResponse procesarPagoPendientes(CheckoutPagarPendientesRequest request,
                                                        String ipAddress, String userAgent) {
        String metodoPago = request.getMetodoPago() != null ? request.getMetodoPago().toUpperCase() : "CARD";
        log.info("Processing pending-balance checkout for {} with {} items (metodoPago: {})",
                request.getEmailContacto(), request.getItems().size(), metodoPago);

        final String tipoPago = "TOTAL";
        OrdenConReservas result = crearOrdenPagoPendientes(request, tipoPago);
        OrdenCompra orden = result.orden;
        List<ReservaCreada> lineas = result.reservasCreadas;

        if ("PREX".equals(metodoPago)) {
            marcarPrexReservasPendientesParaTransferencia(lineas, tipoPago);
            log.info("Orden {} (saldos agrupados) pending Prex transfer", orden.getCodigoOrden());
            return CheckoutOrdenResponse.of(
                    orden.getId(), orden.getCodigoOrden(),
                    orden.getMontoTotal(), tipoPago,
                    null, "PENDIENTE_TRANSFERENCIA",
                    "Orden generada. Realizá una única transferencia por el total indicado e incluí en el comprobante "
                            + "el código de la orden y los códigos de reserva. Las reservas aún no confirmadas que sigan "
                            + "pendientes de este pago pueden cancelarse automáticamente si no recibimos el comprobante "
                            + "en el plazo de 12 horas.",
                    lineas
            );
        }

        marcarReservasComoMetodoPago(lineas, "CARD", tipoPago);
        try {
            SesionPagoResponse sesion = placetoPayService.crearSesionPagoOrden(
                    orden.getId(), tipoPago, ipAddress, userAgent);

            String status = sesion.getStatus();
            String processUrl = sesion.getProcessUrl();

            return CheckoutOrdenResponse.of(
                    orden.getId(), orden.getCodigoOrden(),
                    orden.getMontoTotal(), tipoPago,
                    processUrl, status,
                    "Sesión de pago creada. Redirigiendo al procesador de pagos.",
                    lineas
            );

        } catch (Exception e) {
            log.error("PlacetoPay session creation failed for orden {} (pendientes): {}", orden.getCodigoOrden(), e.getMessage(), e);
            return CheckoutOrdenResponse.of(
                    orden.getId(), orden.getCodigoOrden(),
                    orden.getMontoTotal(), tipoPago,
                    null, "ERROR",
                    "La orden fue creada pero no se pudo iniciar el pago: " + e.getMessage(),
                    lineas
            );
        }
    }

    @Transactional
    protected OrdenConReservas crearOrdenConReservas(CheckoutOrdenRequest request, String tipoPago) {
        List<ReservaCreada> reservasCreadas = new ArrayList<>();
        BigDecimal montoTotal = BigDecimal.ZERO;

        for (ItemOrdenRequest item : request.getItems()) {
            String tipo = item.getTipo() != null ? item.getTipo().toUpperCase() : "";

            if ("SENDERO".equals(tipo)) {
                ReservaResponse reserva = crearReservaSendero(request, item);
                BigDecimal subtotal = reserva.getPrecioTotal();
                montoTotal = montoTotal.add(subtotal != null ? subtotal : BigDecimal.ZERO);
                reservasCreadas.add(ReservaCreada.of(
                        reserva.getId(), "SENDERO",
                        reserva.getCodigoReserva(), subtotal,
                        buildDescripcionSendero(item)));

            } else if ("ALOJAMIENTO".equals(tipo)) {
                AlojamientoReservaResponse reserva = crearReservaAlojamiento(request, item);
                BigDecimal subtotal = reserva.getPrecioTotal();
                montoTotal = montoTotal.add(subtotal != null ? subtotal : BigDecimal.ZERO);
                reservasCreadas.add(ReservaCreada.of(
                        reserva.getId(), "ALOJAMIENTO",
                        reserva.getCodigoReserva(), subtotal,
                        buildDescripcionAlojamiento(item)));

            } else {
                throw new IllegalArgumentException("Tipo de ítem no válido: " + item.getTipo() +
                        ". Use SENDERO o ALOJAMIENTO.");
            }
        }

        // Apply seña reduction to the order total if needed
        BigDecimal montoOrden;
        if ("SENA".equals(tipoPago)) {
            montoOrden = montoTotal.multiply(BigDecimal.valueOf(30))
                    .divide(BigDecimal.valueOf(100), 2, java.math.RoundingMode.HALF_UP);
        } else {
            montoOrden = montoTotal;
        }

        // Create OrdenCompra
        OrdenCompra orden = OrdenCompra.nueva(
                request.getEmailContacto(),
                request.getNombreContacto(),
                request.getTelefonoContacto(),
                request.getObservaciones(),
                montoOrden,
                tipoPago
        );

        orden = ordenCompraRepository.save(orden);

        // Create OrdenCompraItems
        for (ReservaCreada rc : reservasCreadas) {
            OrdenCompraItem oci = new OrdenCompraItem(
                    orden, rc.getReservaId(), rc.getTipoReserva(),
                    rc.getSubtotal(), rc.getDescripcion());
            orden.addItem(oci);
        }

        orden = ordenCompraRepository.save(orden);
        log.info("OrdenCompra created: {} with {} reservations, total: {}",
                orden.getCodigoOrden(), reservasCreadas.size(), montoOrden);

        return new OrdenConReservas(orden, reservasCreadas);
    }

    @Transactional
    protected OrdenConReservas crearOrdenPagoPendientes(CheckoutPagarPendientesRequest request, String tipoPago) {
        final String emailNorm = normalizarEmail(request.getEmailContacto());
        Set<UUID> vistos = new HashSet<>();
        List<ReservaCreada> lineas = new ArrayList<>();
        BigDecimal suma = BigDecimal.ZERO;

        for (CheckoutPagarPendientesRequest.ItemPendiente it : request.getItems()) {
            UUID id = it.getReservaId();
            if (!vistos.add(id)) {
                throw new IllegalArgumentException("La reserva " + id + " está repetida en la solicitud");
            }
            String tipo = it.getTipo() != null ? it.getTipo().toUpperCase(Locale.ROOT) : "";

            if ("SENDERO".equals(tipo)) {
                SenderoReserva r = senderoReservaRepository.findById(id)
                        .orElseThrow(() -> new IllegalArgumentException("Reserva de sendero no encontrada: " + id));
                assertEmailCoincide(r.getEmailContacto(), emailNorm);
                if (!puedePagarSaldoPendienteSendero(r)) {
                    throw new IllegalArgumentException(
                            "La reserva " + r.getCodigoReserva() + " no admite pago agrupado en este momento");
                }
                BigDecimal saldo = calcularSaldoLinea(r.getSaldoPendiente(), r.getPrecioTotal(), r.getMontoPagado());
                if (saldo.compareTo(BigDecimal.ZERO) <= 0) {
                    throw new IllegalArgumentException("La reserva " + r.getCodigoReserva() + " no tiene saldo pendiente");
                }
                String desc = "Saldo sendero — " + r.getCodigoReserva();
                lineas.add(ReservaCreada.of(id, "SENDERO", r.getCodigoReserva(), saldo, desc));
                suma = suma.add(saldo);
            } else if ("ALOJAMIENTO".equals(tipo)) {
                AlojamientoReserva ar = alojamientoReservaRepository.findById(id)
                        .orElseThrow(() -> new IllegalArgumentException("Reserva de alojamiento no encontrada: " + id));
                assertEmailCoincide(ar.getEmailContacto(), emailNorm);
                if (!puedePagarSaldoPendienteAlojamiento(ar)) {
                    throw new IllegalArgumentException(
                            "La reserva " + ar.getCodigoReserva() + " no admite pago agrupado en este momento");
                }
                BigDecimal saldo = calcularSaldoLinea(ar.getSaldoPendiente(), ar.getPrecioTotal(), ar.getMontoPagado());
                if (saldo.compareTo(BigDecimal.ZERO) <= 0) {
                    throw new IllegalArgumentException("La reserva " + ar.getCodigoReserva() + " no tiene saldo pendiente");
                }
                String desc = "Saldo alojamiento — " + ar.getCodigoReserva();
                lineas.add(ReservaCreada.of(id, "ALOJAMIENTO", ar.getCodigoReserva(), saldo, desc));
                suma = suma.add(saldo);
            } else {
                throw new IllegalArgumentException("Tipo de ítem no válido: " + it.getTipo() + ". Use SENDERO o ALOJAMIENTO.");
            }
        }

        if (lineas.isEmpty()) {
            throw new IllegalArgumentException("No hay líneas de pago pendientes");
        }
        if (suma.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("El importe total a pagar debe ser mayor a cero");
        }

        OrdenCompra orden = OrdenCompra.nueva(
                request.getEmailContacto().trim(),
                request.getNombreContacto().trim(),
                request.getTelefonoContacto(),
                request.getObservaciones(),
                suma,
                tipoPago
        );
        orden = ordenCompraRepository.save(orden);

        for (ReservaCreada rc : lineas) {
            OrdenCompraItem oci = new OrdenCompraItem(
                    orden, rc.getReservaId(), rc.getTipoReserva(),
                    rc.getSubtotal(), rc.getDescripcion());
            orden.addItem(oci);
        }
        orden = ordenCompraRepository.save(orden);
        log.info("OrdenCompra (pendientes) created: {} with {} lines, total: {}",
                orden.getCodigoOrden(), lineas.size(), suma);

        return new OrdenConReservas(orden, lineas);
    }

    private static String normalizarEmail(String email) {
        if (email == null) {
            return "";
        }
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private static void assertEmailCoincide(String emailReserva, String emailSolicitanteNorm) {
        if (emailReserva == null || normalizarEmail(emailReserva).isEmpty()) {
            throw new IllegalArgumentException("La reserva no tiene email de contacto");
        }
        if (!normalizarEmail(emailReserva).equals(emailSolicitanteNorm)) {
            throw new IllegalArgumentException("El email no coincide con el de las reservas seleccionadas");
        }
    }

    private static BigDecimal calcularSaldoLinea(BigDecimal saldoPendiente, BigDecimal precioTotal, BigDecimal montoPagado) {
        if (saldoPendiente != null && saldoPendiente.compareTo(BigDecimal.ZERO) > 0) {
            return saldoPendiente;
        }
        BigDecimal total = precioTotal != null ? precioTotal : BigDecimal.ZERO;
        BigDecimal pagado = montoPagado != null ? montoPagado : BigDecimal.ZERO;
        return total.subtract(pagado).max(BigDecimal.ZERO);
    }

    private static boolean esPrexTransferenciaInicialSinPagoSendero(SenderoReserva r) {
        String mp = r.getMetodoPago();
        if (mp == null || !"PREX".equalsIgnoreCase(mp.trim())) {
            return false;
        }
        if (r.getEstado() != EstadoReserva.PENDIENTE) {
            return false;
        }
        EstadoPago ep = r.getEstadoPago();
        if (ep != null && ep != EstadoPago.PENDIENTE) {
            return false;
        }
        BigDecimal pag = r.getMontoPagado() != null ? r.getMontoPagado() : BigDecimal.ZERO;
        return pag.compareTo(BigDecimal.ZERO) == 0;
    }

    private static boolean esPrexTransferenciaInicialSinPagoAlojamiento(AlojamientoReserva r) {
        String mp = r.getMetodoPago();
        if (mp == null || !"PREX".equalsIgnoreCase(mp.trim())) {
            return false;
        }
        if (r.getEstado() != EstadoReserva.PENDIENTE) {
            return false;
        }
        EstadoPago ep = r.getEstadoPago();
        if (ep != null && ep != EstadoPago.PENDIENTE) {
            return false;
        }
        BigDecimal pag = r.getMontoPagado() != null ? r.getMontoPagado() : BigDecimal.ZERO;
        return pag.compareTo(BigDecimal.ZERO) == 0;
    }

    private static boolean puedePagarSaldoPendienteSendero(SenderoReserva r) {
        if (r.getEstado() == EstadoReserva.CANCELADA || r.getEstado() == EstadoReserva.COMPLETADA) {
            return false;
        }
        EstadoPago ep = r.getEstadoPago();
        if (ep == EstadoPago.COMPLETO || ep == EstadoPago.NO_CORRESPONDE) {
            return false;
        }
        if (esPrexTransferenciaInicialSinPagoSendero(r)) {
            return false;
        }
        return r.getEstado() == EstadoReserva.PENDIENTE || r.getEstado() == EstadoReserva.CONFIRMADA;
    }

    private static boolean puedePagarSaldoPendienteAlojamiento(AlojamientoReserva r) {
        if (r.getEstado() == EstadoReserva.CANCELADA || r.getEstado() == EstadoReserva.COMPLETADA) {
            return false;
        }
        EstadoPago ep = r.getEstadoPago();
        if (ep == EstadoPago.COMPLETO || ep == EstadoPago.NO_CORRESPONDE) {
            return false;
        }
        if (esPrexTransferenciaInicialSinPagoAlojamiento(r)) {
            return false;
        }
        return r.getEstado() == EstadoReserva.PENDIENTE || r.getEstado() == EstadoReserva.CONFIRMADA;
    }

    /**
     * Solo las reservas en PENDIENTE reciben metodoPago=PREX para el job de cancelación a 12h.
     * Las ya CONFIRMADAS con saldo no deben quedar bloqueadas para futuros pagos con tarjeta.
     */
    private void marcarPrexReservasPendientesParaTransferencia(List<ReservaCreada> reservas, String tipoPago) {
        for (ReservaCreada rc : reservas) {
            try {
                if ("SENDERO".equalsIgnoreCase(rc.getTipoReserva())) {
                    senderoReservaRepository.findById(rc.getReservaId()).ifPresent(r -> {
                        if (r.getEstado() == EstadoReserva.PENDIENTE) {
                            r.setMetodoPago("PREX");
                            r.setTipoPago(tipoPago);
                            senderoReservaRepository.save(r);
                        }
                    });
                } else if ("ALOJAMIENTO".equalsIgnoreCase(rc.getTipoReserva())) {
                    alojamientoReservaRepository.findById(rc.getReservaId()).ifPresent(ar -> {
                        if (ar.getEstado() == EstadoReserva.PENDIENTE) {
                            ar.setMetodoPago("PREX");
                            ar.setTipoPago(tipoPago);
                            alojamientoReservaRepository.save(ar);
                        }
                    });
                }
            } catch (Exception e) {
                log.warn("Could not tag reservation {} for Prex batch: {}",
                        rc.getReservaId(), e.getMessage());
            }
        }
    }

    private ReservaResponse crearReservaSendero(CheckoutOrdenRequest req, ItemOrdenRequest item) {
        LocalDate fechaInicio = LocalDate.parse(item.getFechaInicio());
        LocalDate fechaFin = item.getFechaFin() != null
                ? LocalDate.parse(item.getFechaFin())
                : fechaInicio;

        TurnoSendero turno;
        try {
            turno = TurnoSendero.valueOf(item.getTurno().toUpperCase());
        } catch (Exception e) {
            throw new IllegalArgumentException("Turno no válido: " + item.getTurno());
        }

        ReservaRequest reservaReq = ReservaRequest.sendero(
                req.getEmailContacto(),
                req.getNombreContacto(),
                item.getNumeroPersonas(),
                fechaInicio,
                fechaFin,
                UUID.fromString(item.getProductoId()),
                null,
                turno
        );
        reservaReq.setTelefonoContacto(req.getTelefonoContacto());
        reservaReq.setObservaciones(req.getObservaciones());
        reservaReq.setTipoReserva(TipoReserva.SENDERO);

        return reservaService.crearReservaSendero(reservaReq);
    }

    private AlojamientoReservaResponse crearReservaAlojamiento(CheckoutOrdenRequest req, ItemOrdenRequest item) {
        AlojamientoReservaRequest alojReq = new AlojamientoReservaRequest();
        alojReq.setEmailContacto(req.getEmailContacto());
        alojReq.setNombreContacto(req.getNombreContacto());
        alojReq.setTelefonoContacto(req.getTelefonoContacto());
        alojReq.setObservaciones(req.getObservaciones());
        alojReq.setAlojamientoId(UUID.fromString(item.getProductoId()));
        alojReq.setFechaCheckIn(LocalDate.parse(item.getFechaCheckIn()));
        alojReq.setFechaCheckOut(LocalDate.parse(item.getFechaCheckOut()));
        alojReq.setNumeroHuespedes(item.getNumeroHuespedes());

        return reservaService.crearReservaAlojamiento(alojReq);
    }

    private String buildDescripcionSendero(ItemOrdenRequest item) {
        return String.format("Sendero %s - %s %s (%d personas)",
                item.getProductoId(), item.getFechaInicio(), item.getTurno(),
                item.getNumeroPersonas() != null ? item.getNumeroPersonas() : 1);
    }

    private String buildDescripcionAlojamiento(ItemOrdenRequest item) {
        return String.format("Alojamiento %s - Check-in: %s / Check-out: %s (%d huéspedes)",
                item.getProductoId(), item.getFechaCheckIn(), item.getFechaCheckOut(),
                item.getNumeroHuespedes() != null ? item.getNumeroHuespedes() : 1);
    }

    /**
     * Marks the just-created reservations as PREX. Required so the auto-cancel job can
     * locate them after the 12h transfer window. Failures are logged but never block the
     * checkout response (the order is already created).
     */
    private void marcarReservasComoPrex(List<ReservaCreada> reservas, String tipoPago) {
        marcarReservasComoMetodoPago(reservas, "PREX", tipoPago);
    }

    private void marcarReservasComoMetodoPago(List<ReservaCreada> reservas, String metodoPago, String tipoPago) {
        for (ReservaCreada rc : reservas) {
            try {
                if ("SENDERO".equalsIgnoreCase(rc.getTipoReserva())) {
                    senderoReservaRepository.findById(rc.getReservaId()).ifPresent(r -> {
                        SenderoReserva sr = (SenderoReserva) r;
                        sr.setMetodoPago(metodoPago);
                        sr.setTipoPago(tipoPago);
                        senderoReservaRepository.save(sr);
                    });
                } else if ("ALOJAMIENTO".equalsIgnoreCase(rc.getTipoReserva())) {
                    alojamientoReservaRepository.findById(rc.getReservaId()).ifPresent(r -> {
                        AlojamientoReserva ar = (AlojamientoReserva) r;
                        ar.setMetodoPago(metodoPago);
                        ar.setTipoPago(tipoPago);
                        alojamientoReservaRepository.save(ar);
                    });
                }
            } catch (Exception e) {
                log.warn("Could not tag reservation {} with metodoPago={}: {}",
                        rc.getReservaId(), metodoPago, e.getMessage());
            }
        }
    }

    // Internal holder for transaction result
    private static class OrdenConReservas {
        final OrdenCompra orden;
        final List<ReservaCreada> reservasCreadas;

        OrdenConReservas(OrdenCompra orden, List<ReservaCreada> reservasCreadas) {
            this.orden = orden;
            this.reservasCreadas = reservasCreadas;
        }
    }
}
