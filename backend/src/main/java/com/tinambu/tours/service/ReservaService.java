package com.tinambu.tours.service;

import com.tinambu.tours.dto.request.AlojamientoReservaRequest;
import com.tinambu.tours.dto.request.ReservaRequest;
import com.tinambu.tours.dto.response.AlojamientoReservaResponse;
import com.tinambu.tours.dto.response.ReservaResponse;
import com.tinambu.tours.entity.alojamiento.Alojamiento;
import com.tinambu.tours.entity.alojamiento.AlojamientoReservaBloqueo;
import com.tinambu.tours.entity.guia.Guia;
import com.tinambu.tours.entity.guia.GuiaReservaBloqueo;
import com.tinambu.tours.entity.reserva.*;
import com.tinambu.tours.entity.sendero.Sendero;
import com.tinambu.tours.entity.sendero.TurnoSendero;
import com.tinambu.tours.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class ReservaService {

    private static final Logger log = LoggerFactory.getLogger(ReservaService.class);

    @Autowired
    private SenderoReservaRepository senderoReservaRepository;

    @Autowired
    private AlojamientoReservaRepository alojamientoReservaRepository;

    @Autowired
    private SenderoRepository senderoRepository;

    @Autowired
    private AlojamientoRepository alojamientoRepository;

    @Autowired
    private GuiaRepository guiaRepository;

    @Autowired
    private GuiaReservaBloqueoRepository guiaBloqueoRepository;

    @Autowired
    private AlojamientoReservaBloqueoRepository alojamientoBloqueoRepository;

    @Autowired
    private AlojamientoService alojamientoService;

    // ==================== SENDERO RESERVATIONS ====================

    public ReservaResponse crearReservaSendero(ReservaRequest request) {
        log.info("Creating sendero reservation for: {}", request.getEmailContacto());

        // Validate sendero exists and is active
        Sendero sendero = senderoRepository.findById(request.getSenderoId())
                .orElseThrow(() -> new IllegalArgumentException("Sendero no encontrado: " + request.getSenderoId()));

        if (!sendero.getActivo()) {
            throw new IllegalArgumentException("El sendero no está disponible");
        }

        // Validate capacity
        if (!sendero.puedeAcomodarGrupo(request.getNumeroPersonas())) {
            throw new IllegalArgumentException(
                String.format("Sendero %s no puede acomodar %d personas (máximo: %d)",
                    sendero.getNombre(), request.getNumeroPersonas(), sendero.getCapacidadMaximaGrupo())
            );
        }

        // Validate guide exists and is active
        Guia guia = guiaRepository.findById(request.getGuiaId())
                .orElseThrow(() -> new IllegalArgumentException("Guía no encontrado: " + request.getGuiaId()));

        if (!guia.getActivo()) {
            throw new IllegalArgumentException("El guía seleccionado no está disponible");
        }

        // Validate guide is not blocked for the requested date/shift
        boolean guiaBloqueado = guiaBloqueoRepository.isGuiaBlocked(
                guia.getId(), request.getFechaInicio(), request.getTurno());

        if (guiaBloqueado) {
            throw new IllegalArgumentException(
                String.format("El guía %s no está disponible para la fecha %s turno %s",
                    guia.getNombreCompleto(), request.getFechaInicio(), request.getTurno()));
        }

        // Create the sendero reservation
        SenderoReserva reserva = new SenderoReserva(
                request.getEmailContacto(),
                request.getNombreContacto(),
                request.getNumeroPersonas(),
                request.getFechaInicio(),
                request.getFechaFin(),
                sendero,
                guia,
                request.getTurno()
        );

        reserva.setTelefonoContacto(request.getTelefonoContacto());
        reserva.setObservaciones(request.getObservaciones());

        // Calculate price
        BigDecimal precio = sendero.calcularPrecioTotal(request.getNumeroPersonas());
        reserva.setPrecioTotal(precio);
        reserva.setSaldoPendiente(precio);

        // Set payment deadline (48 hours before start date)
        reserva.setFechaLimitePago(request.getFechaInicio().minusDays(2));

        // Validate the reservation
        reserva.validarReserva();

        // Save the reservation
        reserva = senderoReservaRepository.save(reserva);
        log.info("Sendero reservation created: {}", reserva.getCodigoReserva());

        // Block the guide for this date/shift across all senderos
        bloquearGuiaParaReserva(guia.getId(), reserva.getId(), 
                request.getFechaInicio(), request.getTurno(), sendero.getNombre());

        return convertirSenderoReservaAResponse(reserva);
    }

    // ==================== ALOJAMIENTO RESERVATIONS ====================

    public AlojamientoReservaResponse crearReservaAlojamiento(AlojamientoReservaRequest request) {
        log.info("Creating alojamiento reservation for: {}", request.getEmailContacto());

        // Validate request
        String validationErrors = request.getValidationErrors();
        if (!validationErrors.isEmpty()) {
            throw new IllegalArgumentException("Errores de validación: " + validationErrors);
        }

        // Validate alojamiento exists and is active
        Alojamiento alojamiento = alojamientoRepository.findByIdAndActivoTrue(request.getAlojamientoId())
                .orElseThrow(() -> new IllegalArgumentException("Alojamiento no encontrado: " + request.getAlojamientoId()));

        // Validate capacity
        if (!alojamiento.puedeAcomodar(request.getNumeroHuespedes())) {
            throw new IllegalArgumentException(
                String.format("Alojamiento %s no puede acomodar %d huéspedes (capacidad: %d-%d)",
                    alojamiento.getNombre(), request.getNumeroHuespedes(),
                    alojamiento.getCapacidadMinima(), alojamiento.getCapacidadMaxima())
            );
        }

        // Verify availability (no overlapping reservations or blocks)
        boolean disponible = alojamientoService.verificarDisponibilidad(
                request.getAlojamientoId(), request.getFechaCheckIn(), request.getFechaCheckOut());

        if (!disponible) {
            throw new IllegalArgumentException(
                "El alojamiento no está disponible para las fechas seleccionadas");
        }

        // Check for overlapping reservations
        boolean existeSolapamiento = alojamientoReservaRepository.existeReservaEnRango(
                request.getAlojamientoId(), request.getFechaCheckIn(), request.getFechaCheckOut());

        if (existeSolapamiento) {
            throw new IllegalArgumentException(
                "Ya existe una reserva para el alojamiento en las fechas seleccionadas");
        }

        // Calculate price: price per night * nights * guests
        int noches = request.calcularNumeroNoches();
        BigDecimal precio = alojamiento.getPrecioPorNoche()
                .multiply(BigDecimal.valueOf(noches))
                .multiply(BigDecimal.valueOf(request.getNumeroHuespedes()));

        // Create reservation
        AlojamientoReserva reserva = AlojamientoReserva.builder()
                .codigoReserva(generarCodigoReserva())
                .emailContacto(request.getEmailContacto())
                .nombreContacto(request.getNombreContacto())
                .telefonoContacto(request.getTelefonoContacto())
                .observaciones(request.getObservaciones())
                .alojamientoId(request.getAlojamientoId())
                .fechaCheckIn(request.getFechaCheckIn())
                .fechaCheckOut(request.getFechaCheckOut())
                .numeroHuespedes(request.getNumeroHuespedes())
                .observacionesEspeciales(request.getObservacionesEspeciales())
                .precioTotal(precio)
                .saldoPendiente(precio)
                .montoPagado(BigDecimal.ZERO)
                .estadoPago(EstadoPago.PENDIENTE)
                .estado(EstadoReserva.PENDIENTE)
                .fechaCreacion(LocalDateTime.now())
                .build();

        reserva = alojamientoReservaRepository.save(reserva);
        log.info("Alojamiento reservation created: {}", reserva.getCodigoReserva());

        // Block the accommodation for the date range
        alojamientoService.bloquearAlojamientoParaReserva(
                request.getAlojamientoId(), reserva.getId(),
                request.getFechaCheckIn(), request.getFechaCheckOut());

        return convertirAlojamientoReservaAResponse(reserva, alojamiento);
    }

    // ==================== COMMON OPERATIONS ====================

    public ReservaResponse confirmarReservaSendero(UUID reservaId) {
        log.info("Confirming sendero reservation: {}", reservaId);

        SenderoReserva reserva = senderoReservaRepository.findById(reservaId)
                .orElseThrow(() -> new IllegalArgumentException("Reserva no encontrada: " + reservaId));

        reserva.cambiarEstado(EstadoReserva.CONFIRMADA);
        reserva = senderoReservaRepository.save(reserva);

        log.info("Sendero reservation confirmed: {}", reserva.getCodigoReserva());
        return convertirSenderoReservaAResponse(reserva);
    }

    public AlojamientoReservaResponse confirmarReservaAlojamiento(UUID reservaId) {
        log.info("Confirming alojamiento reservation: {}", reservaId);

        AlojamientoReserva reserva = alojamientoReservaRepository.findById(reservaId)
                .orElseThrow(() -> new IllegalArgumentException("Reserva no encontrada: " + reservaId));

        reserva.setEstado(EstadoReserva.CONFIRMADA);
        reserva.setFechaActualizacion(LocalDateTime.now());
        reserva = alojamientoReservaRepository.save(reserva);

        Alojamiento alojamiento = alojamientoRepository.findById(reserva.getAlojamientoId()).orElse(null);
        log.info("Alojamiento reservation confirmed: {}", reserva.getCodigoReserva());
        return convertirAlojamientoReservaAResponse(reserva, alojamiento);
    }

    public void cancelarReservaSendero(UUID reservaId) {
        log.info("Cancelling sendero reservation: {}", reservaId);

        SenderoReserva reserva = senderoReservaRepository.findById(reservaId)
                .orElseThrow(() -> new IllegalArgumentException("Reserva no encontrada: " + reservaId));

        reserva.cambiarEstado(EstadoReserva.CANCELADA);
        senderoReservaRepository.save(reserva);

        // Unblock the guide
        guiaBloqueoRepository.deactivateBlocksForReservation(reservaId);
        log.info("Sendero reservation cancelled and guide unblocked: {}", reserva.getCodigoReserva());
    }

    public void cancelarReservaAlojamiento(UUID reservaId) {
        log.info("Cancelling alojamiento reservation: {}", reservaId);

        AlojamientoReserva reserva = alojamientoReservaRepository.findById(reservaId)
                .orElseThrow(() -> new IllegalArgumentException("Reserva no encontrada: " + reservaId));

        reserva.setEstado(EstadoReserva.CANCELADA);
        reserva.setFechaActualizacion(LocalDateTime.now());
        alojamientoReservaRepository.save(reserva);

        // Unblock the accommodation
        alojamientoService.desbloquearAlojamientoDeReserva(reservaId);
        log.info("Alojamiento reservation cancelled and accommodation unblocked: {}", reserva.getCodigoReserva());
    }

    // ==================== QUERY OPERATIONS ====================

    @Transactional(readOnly = true)
    public ReservaResponse obtenerReservaSenderoPorId(UUID reservaId) {
        SenderoReserva reserva = senderoReservaRepository.findById(reservaId)
                .orElseThrow(() -> new IllegalArgumentException("Reserva no encontrada: " + reservaId));
        return convertirSenderoReservaAResponse(reserva);
    }

    @Transactional(readOnly = true)
    public AlojamientoReservaResponse obtenerReservaAlojamientoPorId(UUID reservaId) {
        AlojamientoReserva reserva = alojamientoReservaRepository.findById(reservaId)
                .orElseThrow(() -> new IllegalArgumentException("Reserva no encontrada: " + reservaId));
        Alojamiento alojamiento = alojamientoRepository.findById(reserva.getAlojamientoId()).orElse(null);
        return convertirAlojamientoReservaAResponse(reserva, alojamiento);
    }

    @Transactional(readOnly = true)
    public List<ReservaResponse> obtenerReservasSenderoPorEmail(String email) {
        return senderoReservaRepository.findByEmailContacto(email).stream()
                .map(this::convertirSenderoReservaAResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AlojamientoReservaResponse> obtenerReservasAlojamientoPorEmail(String email) {
        // AlojamientoReserva doesn't have a findByEmail, so we get all and filter
        return alojamientoReservaRepository.findAll().stream()
                .filter(r -> email.equalsIgnoreCase(r.getEmailContacto()))
                .map(r -> {
                    Alojamiento a = alojamientoRepository.findById(r.getAlojamientoId()).orElse(null);
                    return convertirAlojamientoReservaAResponse(r, a);
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ReservaResponse obtenerReservaSenderoPorCodigo(String codigo) {
        SenderoReserva reserva = senderoReservaRepository.findByCodigoReserva(codigo)
                .orElseThrow(() -> new IllegalArgumentException("Reserva no encontrada con código: " + codigo));
        return convertirSenderoReservaAResponse(reserva);
    }

    // ==================== ADMIN OPERATIONS ====================

    @Transactional(readOnly = true)
    public List<ReservaResponse> obtenerTodasReservasSendero() {
        return senderoReservaRepository.findAllOrderByFechaCreacionDesc().stream()
                .map(this::convertirSenderoReservaAResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AlojamientoReservaResponse> obtenerTodasReservasAlojamiento() {
        return alojamientoReservaRepository.findAll().stream()
                .sorted((a, b) -> b.getFechaCreacion().compareTo(a.getFechaCreacion()))
                .map(r -> {
                    Alojamiento a = alojamientoRepository.findById(r.getAlojamientoId()).orElse(null);
                    return convertirAlojamientoReservaAResponse(r, a);
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Map<String, Object> obtenerEstadisticas() {
        Map<String, Object> stats = new HashMap<>();

        // Sendero stats
        Long senderoPendientes = senderoReservaRepository.countByEstado(EstadoReserva.PENDIENTE);
        Long senderoConfirmadas = senderoReservaRepository.countByEstado(EstadoReserva.CONFIRMADA);
        Long senderoCanceladas = senderoReservaRepository.countByEstado(EstadoReserva.CANCELADA);

        // Alojamiento stats
        long alojamientoTotal = alojamientoReservaRepository.count();
        List<AlojamientoReserva> alojamientoActivas = alojamientoReservaRepository.findReservasActivas(LocalDate.now());

        stats.put("sendero_pendientes", senderoPendientes != null ? senderoPendientes : 0);
        stats.put("sendero_confirmadas", senderoConfirmadas != null ? senderoConfirmadas : 0);
        stats.put("sendero_canceladas", senderoCanceladas != null ? senderoCanceladas : 0);
        stats.put("alojamiento_total", alojamientoTotal);
        stats.put("alojamiento_activas", alojamientoActivas.size());

        return stats;
    }

    // ==================== GUIDE BLOCKING ====================

    private void bloquearGuiaParaReserva(UUID guiaId, UUID reservaId, 
                                          LocalDate fecha, TurnoSendero turno, 
                                          String senderoNombre) {
        log.info("Blocking guide {} for date {} shift {} (sendero: {})", 
                guiaId, fecha, turno, senderoNombre);

        GuiaReservaBloqueo bloqueo = new GuiaReservaBloqueo();
        bloqueo.setGuiaId(guiaId);
        bloqueo.setReservaId(reservaId);
        bloqueo.setFecha(fecha);
        bloqueo.setTurno(turno);
        bloqueo.setSenderoReservado(senderoNombre);
        bloqueo.setActivo(true);

        guiaBloqueoRepository.save(bloqueo);
        log.info("Guide blocked successfully for reservation");
    }

    // ==================== HELPER METHODS ====================

    private String generarCodigoReserva() {
        return "RES-" + System.currentTimeMillis() + "-" +
               UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    private ReservaResponse convertirSenderoReservaAResponse(SenderoReserva reserva) {
        ReservaResponse response = new ReservaResponse();
        response.setId(reserva.getId());
        response.setCodigoReserva(reserva.getCodigoReserva());
        response.setTipoReserva(TipoReserva.SENDERO);
        response.setEmailContacto(reserva.getEmailContacto());
        response.setNombreContacto(reserva.getNombreContacto());
        response.setTelefonoContacto(reserva.getTelefonoContacto());
        response.setNumeroPersonas(reserva.getNumeroPersonas());
        response.setFechaInicio(reserva.getFechaInicio());
        response.setFechaFin(reserva.getFechaFin());
        response.setPrecioTotal(reserva.getPrecioTotal());
        response.setEstado(reserva.getEstado());
        response.setObservaciones(reserva.getObservaciones());
        response.setFechaCreacion(reserva.getFechaCreacion());
        response.setFechaActualizacion(reserva.getFechaActualizacion());

        // Additional info
        String info = String.format("Sendero: %s | Guía: %s | Turno: %s",
                reserva.getSendero() != null ? reserva.getSendero().getNombre() : "N/A",
                reserva.getGuia() != null ? reserva.getGuia().getNombreCompleto() : "N/A",
                reserva.getTurno() != null ? reserva.getTurno().name() : "N/A");
        response.setInformacionAdicional(info);

        return response;
    }

    // ==================== ADMIN UPDATE OPERATIONS ====================

    public AlojamientoReservaResponse actualizarEstadoAlojamiento(UUID reservaId, String nuevoEstadoStr) {
        log.info("Updating alojamiento reservation state: {} -> {}", reservaId, nuevoEstadoStr);

        AlojamientoReserva reserva = alojamientoReservaRepository.findById(reservaId)
                .orElseThrow(() -> new IllegalArgumentException("Reserva no encontrada: " + reservaId));

        EstadoReserva nuevoEstado = EstadoReserva.valueOf(nuevoEstadoStr.toUpperCase());

        if (!reserva.getEstado().puedeTransicionarA(nuevoEstado)) {
            throw new IllegalStateException(
                    String.format("No se puede cambiar de %s a %s", reserva.getEstado(), nuevoEstado));
        }

        reserva.setEstado(nuevoEstado);
        reserva.setFechaActualizacion(LocalDateTime.now());

        // If cancelled, release accommodation blocks
        if (nuevoEstado == EstadoReserva.CANCELADA) {
            alojamientoService.desbloquearAlojamientoDeReserva(reservaId);
        }

        reserva = alojamientoReservaRepository.save(reserva);
        Alojamiento alojamiento = alojamientoRepository.findById(reserva.getAlojamientoId()).orElse(null);
        return convertirAlojamientoReservaAResponse(reserva, alojamiento);
    }

    public AlojamientoReservaResponse actualizarEstadoPagoAlojamiento(UUID reservaId, String estadoPagoStr, BigDecimal montoPagado) {
        log.info("Updating alojamiento payment state: {} -> {} (monto: {})", reservaId, estadoPagoStr, montoPagado);

        AlojamientoReserva reserva = alojamientoReservaRepository.findById(reservaId)
                .orElseThrow(() -> new IllegalArgumentException("Reserva no encontrada: " + reservaId));

        EstadoPago nuevoEstadoPago = EstadoPago.fromString(estadoPagoStr);

        if (montoPagado != null) {
            reserva.setMontoPagado(montoPagado);
            reserva.setSaldoPendiente(reserva.getPrecioTotal().subtract(montoPagado));
        }

        reserva.setEstadoPago(nuevoEstadoPago);
        reserva.setFechaActualizacion(LocalDateTime.now());
        reserva = alojamientoReservaRepository.save(reserva);

        Alojamiento alojamiento = alojamientoRepository.findById(reserva.getAlojamientoId()).orElse(null);
        return convertirAlojamientoReservaAResponse(reserva, alojamiento);
    }

    // ==================== CONVERSION METHODS ====================

    private AlojamientoReservaResponse convertirAlojamientoReservaAResponse(
            AlojamientoReserva reserva, Alojamiento alojamiento) {
        return AlojamientoReservaResponse.builder()
                .id(reserva.getId())
                .codigoReserva(reserva.getCodigoReserva())
                .emailContacto(reserva.getEmailContacto())
                .nombreContacto(reserva.getNombreContacto())
                .telefonoContacto(reserva.getTelefonoContacto())
                .estado(reserva.getEstado() != null ? reserva.getEstado().name() : "PENDIENTE")
                .precioTotal(reserva.getPrecioTotal())
                .observaciones(reserva.getObservaciones())
                .fechaCreacion(reserva.getFechaCreacion())
                .fechaActualizacion(reserva.getFechaActualizacion())
                .alojamientoId(reserva.getAlojamientoId())
                .alojamientoNombre(alojamiento != null ? alojamiento.getNombre() : "N/A")
                .fechaCheckIn(reserva.getFechaCheckIn())
                .fechaCheckOut(reserva.getFechaCheckOut())
                .numeroNoches(reserva.getNumeroNoches())
                .numeroHuespedes(reserva.getNumeroHuespedes())
                .observacionesEspeciales(reserva.getObservacionesEspeciales())
                .ubicacionAlojamiento(alojamiento != null ? alojamiento.getUbicacion() : null)
                .precioPorNoche(alojamiento != null ? alojamiento.getPrecioPorNoche() : null)
                .placetoPayRequestId(reserva.getPlacetoPayRequestId())
                .montoPagado(reserva.getMontoPagado())
                .saldoPendiente(reserva.getSaldoPendiente())
                .estadoPago(reserva.getEstadoPago() != null ? reserva.getEstadoPago().name() : "PENDIENTE")
                .metodoPago(reserva.getMetodoPago())
                .tipoPago(reserva.getTipoPago())
                .porcentajeSena(reserva.getPorcentajeSena())
                .build();
    }
}
