package com.tinambu.tours.service;

import com.tinambu.tours.dto.request.AdminReservaAlojamientoRequest;
import com.tinambu.tours.dto.request.AdminReservaSenderoRequest;
import com.tinambu.tours.dto.request.AlojamientoReservaRequest;
import com.tinambu.tours.dto.request.ReservaRequest;
import com.tinambu.tours.dto.response.AlojamientoReservaResponse;
import com.tinambu.tours.dto.response.DisponibilidadSenderoResponse;
import com.tinambu.tours.dto.response.ReservaResponse;
import com.tinambu.tours.entity.alojamiento.Alojamiento;
import com.tinambu.tours.entity.guia.Guia;
import com.tinambu.tours.entity.guia.GuiaReservaBloqueo;
import com.tinambu.tours.entity.reserva.*;
import com.tinambu.tours.entity.sendero.Sendero;
import com.tinambu.tours.entity.sendero.SenderoDisponibilidad;
import com.tinambu.tours.entity.sendero.TurnoSendero;
import com.tinambu.tours.exception.SinDisponibilidadException;
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

    /** Minimum lead time (in days) required between today and the reservation date. */
    private static final int MIN_LEAD_DAYS_SENDERO = 2;

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

    @Autowired
    private SenderoDisponibilidadRepository disponibilidadRepository;

    @Autowired
    private SenderoDisponibilidadGuiaRepository disponibilidadGuiaRepository;

    @Autowired
    private SenderoBloqueoRepository senderoBloqueoRepository;

    // ==================== SENDERO RESERVATIONS ====================

    public ReservaResponse crearReservaSendero(ReservaRequest request) {
        log.info("Creating sendero reservation for: {}", request.getEmailContacto());

        // 1. Validate sendero
        Sendero sendero = senderoRepository.findById(request.getSenderoId())
                .orElseThrow(() -> new IllegalArgumentException("Sendero no encontrado: " + request.getSenderoId()));

        if (!sendero.getActivo()) {
            throw new IllegalArgumentException("El sendero no está disponible");
        }

        if (!sendero.puedeAcomodarGrupo(request.getNumeroPersonas())) {
            throw new IllegalArgumentException(
                String.format("El sendero %s no puede acomodar %d personas (máximo: %d)",
                    sendero.getNombre(), request.getNumeroPersonas(), sendero.getCapacidadMaximaGrupo()));
        }

        // 2. If admin explicitly provides a guide, use it (skip availability logic)
        if (request.getGuiaId() != null) {
            return crearReservaConGuiaExplicito(request, sendero);
        }

        // 3. Validate availability windows + cupos (shared logic used by both booking paths)
        List<SenderoDisponibilidad> ventanas = validarCuposDisponibles(
                sendero, request.getFechaInicio(), request.getTurno(), request.getNumeroPersonas());

        // 4. ¿Ya hay una reserva activa para este sendero/fecha/turno?
        //    Si la hay, reutilizamos ese guía: el grupo nuevo se suma al tour
        //    existente, no se requiere un guía "libre" adicional.
        List<UUID> guiasYaEnEsteSendero = senderoReservaRepository.findGuiaIdsByReservasActivas(
                sendero.getId(), request.getFechaInicio(), request.getTurno());

        UUID guiaIdElegido;
        if (!guiasYaEnEsteSendero.isEmpty()) {
            guiaIdElegido = guiasYaEnEsteSendero.get(0);
            log.info("Reusing guide already assigned to sendero {} on {} {} (internal id {})",
                    sendero.getNombre(), request.getFechaInicio(), request.getTurno(), guiaIdElegido);
        } else {
            // 5a. Guías habilitados para este sendero (ventanas activas o fallback a todos activos)
            List<UUID> guiasHabilitados = ventanas.stream()
                    .flatMap(v -> v.obtenerGuiaIds().stream())
                    .distinct()
                    .collect(Collectors.toList());

            if (guiasHabilitados.isEmpty()) {
                log.warn("No guides assigned to availability windows for sendero {}. Falling back to all active guides.", sendero.getNombre());
                guiasHabilitados = guiaRepository.findByActivoTrue().stream()
                        .map(Guia::getId)
                        .collect(Collectors.toList());
            }

            // 5b. Excluir guías ocupados en OTROS senderos (no en este) en (fecha, turno)
            List<UUID> guiasOcupadosOtros = guiaBloqueoRepository.findBlockedGuiaIdsExcludingSendero(
                    request.getFechaInicio(), request.getTurno(), sendero.getId());

            guiaIdElegido = guiasHabilitados.stream()
                    .filter(gid -> !guiasOcupadosOtros.contains(gid))
                    .findFirst()
                    .orElse(null);

            if (guiaIdElegido == null) {
                List<SinDisponibilidadException.AlternativaSendero> alts =
                        buscarAlternativas(sendero.getId(), request.getFechaInicio(), request.getTurno());
                throw new SinDisponibilidadException(
                        "No hay guías disponibles para la fecha y horario seleccionados.", alts);
            }

            log.info("Auto-assigned guide (internal id {}) for sendero {} on {} {}",
                    guiaIdElegido, sendero.getNombre(), request.getFechaInicio(), request.getTurno());
        }

        Guia guia = guiaRepository.findById(guiaIdElegido)
                .orElseThrow(() -> new IllegalArgumentException("Guía no encontrado internamente"));

        return persistirReserva(request, sendero, guia);
    }

    /** Used only when admin explicitly specifies a guide (e.g. from backoffice). */
    private ReservaResponse crearReservaConGuiaExplicito(ReservaRequest request, Sendero sendero) {
        Guia guia = guiaRepository.findById(request.getGuiaId())
                .orElseThrow(() -> new IllegalArgumentException("Guía no encontrado: " + request.getGuiaId()));

        if (!guia.getActivo()) {
            throw new IllegalArgumentException("El guía seleccionado no está activo");
        }

        boolean bloqueado = guiaBloqueoRepository.isGuiaBlocked(
                guia.getId(), request.getFechaInicio(), request.getTurno());
        if (bloqueado) {
            throw new IllegalArgumentException(
                    "El guía seleccionado no está disponible para esa fecha y horario");
        }

        // Same cupos/disponibilidad validation as the normal path. Prevents overbooking
        // when a guiaId is provided explicitly (admin backoffice or any external client).
        validarCuposDisponibles(sendero, request.getFechaInicio(), request.getTurno(), request.getNumeroPersonas());

        return persistirReserva(request, sendero, guia);
    }

    /**
     * Centralized cupos validation reused by both reservation paths.
     * <p>
     * Formula: cuposRestantes = cuposTotal - cuposOcupados
     * <ul>
     *   <li>cuposTotal = sendero.capacidadMaximaGrupo (single source of truth defined when the sendero is created).</li>
     *   <li>cuposOcupados = SUM of numeroPersonas of existing reservations in states CONFIRMADA / PENDIENTE
     *       for the same sendero + fecha + turno.</li>
     * </ul>
     * Throws {@link SinDisponibilidadException} if no window matches or cuposRestantes is insufficient.
     *
     * @return the list of matching availability windows (useful for downstream guide resolution)
     */
    private List<SenderoDisponibilidad> validarCuposDisponibles(
            Sendero sendero, LocalDate fecha, TurnoSendero turno, int numeroPersonas) {
        return validarCuposDisponibles(sendero, fecha, turno, numeroPersonas, false);
    }

    /**
     * Same as {@link #validarCuposDisponibles(Sendero, LocalDate, TurnoSendero, int)} but allows
     * the caller to bypass the minimum lead time restriction. Used by admin-side bookings.
     */
    private List<SenderoDisponibilidad> validarCuposDisponibles(
            Sendero sendero, LocalDate fecha, TurnoSendero turno, int numeroPersonas, boolean skipLeadTime) {

        // Reject the booking if the date is within the minimum lead time window.
        if (!skipLeadTime) {
            LocalDate fechaMinima = LocalDate.now().plusDays(MIN_LEAD_DAYS_SENDERO);
            if (fecha.isBefore(fechaMinima)) {
                throw new SinDisponibilidadException(
                        String.format(
                                "Las reservas deben hacerse con al menos %d días de antelación. La fecha más temprana disponible es %s.",
                                MIN_LEAD_DAYS_SENDERO, fechaMinima),
                        List.of());
            }
        }

        List<SenderoDisponibilidad> ventanas = disponibilidadRepository
                .findVentanasActivas(sendero.getId(), fecha, turno)
                .stream()
                .filter(v -> v.matchesDiaSemana(fecha))
                .collect(Collectors.toList());

        if (ventanas.isEmpty()) {
            List<SinDisponibilidadException.AlternativaSendero> alts =
                    buscarAlternativas(sendero.getId(), fecha, turno);
            throw new SinDisponibilidadException(
                    "Este sendero no tiene disponibilidad configurada para la fecha y horario seleccionados.", alts);
        }

        // Reject the booking if the date+turno is explicitly blocked by an admin override.
        if (!senderoBloqueoRepository.findBloqueosQueCubren(sendero.getId(), fecha, turno).isEmpty()) {
            List<SinDisponibilidadException.AlternativaSendero> alts =
                    buscarAlternativas(sendero.getId(), fecha, turno);
            throw new SinDisponibilidadException(
                    "Esta fecha y turno están bloqueados para este sendero.", alts);
        }

        int cuposTotal = sendero.getCapacidadMaximaGrupo() != null ? sendero.getCapacidadMaximaGrupo() : 0;
        int cuposOcupados = senderoReservaRepository.sumPersonasReservadas(sendero.getId(), fecha, turno);
        int cuposRestantes = cuposTotal - cuposOcupados;

        if (cuposRestantes < numeroPersonas) {
            List<SinDisponibilidadException.AlternativaSendero> alts =
                    buscarAlternativas(sendero.getId(), fecha, turno);
            throw new SinDisponibilidadException(
                    String.format("Este sendero ya no tiene cupos suficientes para %d personas (disponibles: %d).",
                            numeroPersonas, Math.max(0, cuposRestantes)), alts);
        }

        return ventanas;
    }

    /** Builds, validates, saves the reservation and creates the guide block. */
    private ReservaResponse persistirReserva(ReservaRequest request, Sendero sendero, Guia guia) {
        return persistirReserva(request, sendero, guia, null);
    }

    /**
     * Builds, validates, saves the reservation and creates the guide block.
     * If {@code estadoInicial} is {@link EstadoReserva#CONFIRMADA}, the reservation is created already
     * confirmed (used by the admin-side manual booking flow).
     */
    private ReservaResponse persistirReserva(ReservaRequest request, Sendero sendero, Guia guia, EstadoReserva estadoInicial) {
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

        BigDecimal precio = sendero.calcularPrecioTotal(request.getNumeroPersonas());
        reserva.setPrecioTotal(precio);
        reserva.setSaldoPendiente(precio);
        reserva.setFechaLimitePago(request.getFechaInicio().minusDays(2));

        if (estadoInicial != null) {
            reserva.setEstado(estadoInicial);
        }

        reserva.validarReserva();

        reserva = senderoReservaRepository.save(reserva);
        log.info("Sendero reservation created: {} (estado={})", reserva.getCodigoReserva(), reserva.getEstado());

        bloquearGuiaParaReserva(guia.getId(), reserva.getId(),
                request.getFechaInicio(), request.getTurno(), sendero.getNombre());

        return convertirSenderoReservaAResponse(reserva);
    }

    // ==================== ADMIN-SIDE BOOKINGS ====================

    /**
     * Creates a sendero reservation manually from the admin panel (e.g. walk-in or phone booking).
     * Skips the public-flow lead-time restriction; cupos and guide availability are still validated.
     */
    public ReservaResponse crearReservaSenderoAdmin(AdminReservaSenderoRequest request) {
        log.info("[ADMIN] Creating sendero reservation for: {} (estado={})",
                request.getEmailContacto(), request.getEstadoInicial());

        Sendero sendero = senderoRepository.findById(request.getSenderoId())
                .orElseThrow(() -> new IllegalArgumentException("Sendero no encontrado: " + request.getSenderoId()));

        if (!sendero.getActivo()) {
            throw new IllegalArgumentException("El sendero no está disponible");
        }

        if (!sendero.puedeAcomodarGrupo(request.getNumeroPersonas())) {
            throw new IllegalArgumentException(
                    String.format("El sendero %s no puede acomodar %d personas (máximo: %d)",
                            sendero.getNombre(), request.getNumeroPersonas(), sendero.getCapacidadMaximaGrupo()));
        }

        // Build a ReservaRequest reusing existing persistence/validation logic.
        ReservaRequest legacy = ReservaRequest.sendero(
                request.getEmailContacto(),
                request.getNombreContacto(),
                request.getNumeroPersonas(),
                request.getFechaInicio(),
                request.getFechaInicio(), // sendero is single-day
                request.getSenderoId(),
                request.getGuiaId(),
                request.getTurno()
        );
        legacy.setTelefonoContacto(request.getTelefonoContacto());
        legacy.setObservaciones(request.getObservaciones());

        Guia guia;
        if (request.getGuiaId() != null) {
            // Explicit guide: validate active and not blocked elsewhere; admin can override lead-time
            // but cannot pick a guide that is already busy in another sendero.
            guia = guiaRepository.findById(request.getGuiaId())
                    .orElseThrow(() -> new IllegalArgumentException("Guía no encontrado: " + request.getGuiaId()));
            if (!guia.getActivo()) {
                throw new IllegalArgumentException("El guía seleccionado no está activo");
            }
            // The block-check is OK to keep: if the guide is already on this sendero it's not "blocked"
            // for this sendero. If it's blocked it's because it's working another sendero.
            boolean bloqueado = guiaBloqueoRepository.isGuiaBlocked(
                    guia.getId(), request.getFechaInicio(), request.getTurno());
            if (bloqueado) {
                // Allow re-using the guide if the existing block belongs to this same sendero
                List<UUID> guiasYaEnEsteSendero = senderoReservaRepository.findGuiaIdsByReservasActivas(
                        sendero.getId(), request.getFechaInicio(), request.getTurno());
                if (!guiasYaEnEsteSendero.contains(guia.getId())) {
                    throw new IllegalArgumentException(
                            "El guía seleccionado no está disponible para esa fecha y horario");
                }
            }
            validarCuposDisponibles(sendero, request.getFechaInicio(), request.getTurno(),
                    request.getNumeroPersonas(), true);
        } else {
            // Auto-assign: same logic as public path but skipping lead-time.
            List<SenderoDisponibilidad> ventanas = validarCuposDisponibles(
                    sendero, request.getFechaInicio(), request.getTurno(),
                    request.getNumeroPersonas(), true);

            List<UUID> guiasYaEnEsteSendero = senderoReservaRepository.findGuiaIdsByReservasActivas(
                    sendero.getId(), request.getFechaInicio(), request.getTurno());

            UUID guiaIdElegido;
            if (!guiasYaEnEsteSendero.isEmpty()) {
                guiaIdElegido = guiasYaEnEsteSendero.get(0);
            } else {
                List<UUID> guiasHabilitados = ventanas.stream()
                        .flatMap(v -> v.obtenerGuiaIds().stream())
                        .distinct()
                        .collect(Collectors.toList());

                if (guiasHabilitados.isEmpty()) {
                    guiasHabilitados = guiaRepository.findByActivoTrue().stream()
                            .map(Guia::getId)
                            .collect(Collectors.toList());
                }

                List<UUID> guiasOcupadosOtros = guiaBloqueoRepository.findBlockedGuiaIdsExcludingSendero(
                        request.getFechaInicio(), request.getTurno(), sendero.getId());

                guiaIdElegido = guiasHabilitados.stream()
                        .filter(gid -> !guiasOcupadosOtros.contains(gid))
                        .findFirst()
                        .orElseThrow(() -> new IllegalArgumentException(
                                "No hay guías disponibles para la fecha y horario seleccionados."));
            }

            guia = guiaRepository.findById(guiaIdElegido)
                    .orElseThrow(() -> new IllegalArgumentException("Guía no encontrado internamente"));
        }

        return persistirReserva(legacy, sendero, guia, request.getEstadoInicial());
    }

    /**
     * Creates an alojamiento reservation manually from the admin panel.
     * Allows same-day check-in and lets the admin decide the initial state.
     */
    public AlojamientoReservaResponse crearReservaAlojamientoAdmin(AdminReservaAlojamientoRequest request) {
        log.info("[ADMIN] Creating alojamiento reservation for: {} (estado={})",
                request.getEmailContacto(), request.getEstadoInicial());

        String validationErrors = request.getValidationErrors();
        if (!validationErrors.isEmpty()) {
            throw new IllegalArgumentException("Errores de validación: " + validationErrors);
        }

        Alojamiento alojamiento = alojamientoRepository.findByIdAndActivoTrue(request.getAlojamientoId())
                .orElseThrow(() -> new IllegalArgumentException("Alojamiento no encontrado: " + request.getAlojamientoId()));

        if (!alojamiento.puedeAcomodar(request.getNumeroHuespedes())) {
            throw new IllegalArgumentException(
                    String.format("Alojamiento %s no puede acomodar %d huéspedes (capacidad: %d-%d)",
                            alojamiento.getNombre(), request.getNumeroHuespedes(),
                            alojamiento.getCapacidadMinima(), alojamiento.getCapacidadMaxima()));
        }

        boolean disponible = alojamientoService.verificarDisponibilidad(
                request.getAlojamientoId(), request.getFechaCheckIn(), request.getFechaCheckOut());
        if (!disponible) {
            throw new IllegalArgumentException(
                    "El alojamiento no está disponible para las fechas seleccionadas");
        }

        boolean existeSolapamiento = alojamientoReservaRepository.existeReservaEnRango(
                request.getAlojamientoId(), request.getFechaCheckIn(), request.getFechaCheckOut());
        if (existeSolapamiento) {
            throw new IllegalArgumentException(
                    "Ya existe una reserva para el alojamiento en las fechas seleccionadas");
        }

        int noches = request.calcularNumeroNoches();
        BigDecimal precio = alojamiento.getPrecioPorNoche()
                .multiply(BigDecimal.valueOf(noches))
                .multiply(BigDecimal.valueOf(request.getNumeroHuespedes()));

        EstadoReserva estado = request.getEstadoInicial() != null
                ? request.getEstadoInicial() : EstadoReserva.PENDIENTE;

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
                .estado(estado)
                .fechaCreacion(LocalDateTime.now())
                .build();

        reserva = alojamientoReservaRepository.save(reserva);
        log.info("[ADMIN] Alojamiento reservation created: {} (estado={})",
                reserva.getCodigoReserva(), reserva.getEstado());

        alojamientoService.bloquearAlojamientoParaReserva(
                request.getAlojamientoId(), reserva.getId(),
                request.getFechaCheckIn(), request.getFechaCheckOut());

        return convertirAlojamientoReservaAResponse(reserva, alojamiento);
    }

    // ==================== AVAILABILITY CHECK ====================

    /**
     * Public availability check used by the frontend before entering checkout.
     * Never exposes guide names.
     */
    @Transactional(readOnly = true)
    public DisponibilidadSenderoResponse verificarDisponibilidadSendero(
            UUID senderoId, LocalDate fecha, TurnoSendero turno) {

        DisponibilidadSenderoResponse resp = new DisponibilidadSenderoResponse();

        Sendero sendero = senderoRepository.findById(senderoId).orElse(null);
        if (sendero == null || !sendero.getActivo()) {
            resp.setDisponible(false);
            resp.setMensajeUsuario("Sendero no disponible.");
            resp.setAlternativas(List.of());
            return resp;
        }

        resp.setSenderoNombre(sendero.getNombre());

        // Reject the date if it's inside the minimum lead time window.
        LocalDate fechaMinima = LocalDate.now().plusDays(MIN_LEAD_DAYS_SENDERO);
        if (fecha.isBefore(fechaMinima)) {
            resp.setDisponible(false);
            resp.setHayGuiaDisponible(false);
            resp.setCuposTotal(sendero.getCapacidadMaximaGrupo() != null ? sendero.getCapacidadMaximaGrupo() : 0);
            resp.setCuposOcupados(0);
            resp.setCuposRestantes(0);
            resp.setMensajeUsuario(String.format(
                    "Las reservas deben hacerse con al menos %d días de antelación.",
                    MIN_LEAD_DAYS_SENDERO));
            resp.setAlternativas(List.of());
            return resp;
        }

        // Find matching windows
        List<SenderoDisponibilidad> ventanas = disponibilidadRepository
                .findVentanasActivas(senderoId, fecha, turno)
                .stream()
                .filter(v -> v.matchesDiaSemana(fecha))
                .collect(Collectors.toList());

        if (ventanas.isEmpty()) {
            resp.setDisponible(false);
            resp.setHayGuiaDisponible(false);
            resp.setCuposTotal(0);
            resp.setCuposOcupados(0);
            resp.setCuposRestantes(0);
            resp.setMensajeUsuario("Este sendero no opera en la fecha y horario seleccionados.");
            resp.setAlternativas(toAlternativaResponse(
                    buscarAlternativas(senderoId, fecha, turno)));
            return resp;
        }

        // Date/turno may be explicitly blocked by an admin override.
        if (!senderoBloqueoRepository.findBloqueosQueCubren(senderoId, fecha, turno).isEmpty()) {
            resp.setDisponible(false);
            resp.setHayGuiaDisponible(false);
            resp.setCuposTotal(sendero.getCapacidadMaximaGrupo() != null ? sendero.getCapacidadMaximaGrupo() : 0);
            resp.setCuposOcupados(0);
            resp.setCuposRestantes(0);
            resp.setMensajeUsuario("Esta fecha y turno están bloqueados para este sendero.");
            resp.setAlternativas(toAlternativaResponse(
                    buscarAlternativas(senderoId, fecha, turno)));
            return resp;
        }

        // Cupos: single source of truth = sendero.capacidadMaximaGrupo
        int cuposTotal    = sendero.getCapacidadMaximaGrupo() != null ? sendero.getCapacidadMaximaGrupo() : 0;
        int cuposOcupados = senderoReservaRepository.sumPersonasReservadas(senderoId, fecha, turno);
        int cuposRestantes = Math.max(0, cuposTotal - cuposOcupados);

        // Guide availability:
        // - Si ya hay una reserva activa para este mismo sendero/fecha/turno,
        //   el guía está ahí y puede recibir más personas mientras haya cupos.
        // - Si no, miramos guías habilitados del sendero y excluimos los que
        //   están ocupados en OTROS senderos (no en este) ese día/turno.
        boolean yaAtendiendoEsteSendero = !senderoReservaRepository
                .findGuiaIdsByReservasActivas(senderoId, fecha, turno).isEmpty();

        boolean hayGuia;
        if (yaAtendiendoEsteSendero) {
            hayGuia = true;
        } else {
            List<UUID> guiasHabilitados = ventanas.stream()
                    .flatMap(v -> v.obtenerGuiaIds().stream())
                    .distinct()
                    .collect(Collectors.toList());

            if (guiasHabilitados.isEmpty()) {
                guiasHabilitados = guiaRepository.findByActivoTrue().stream()
                        .map(Guia::getId).collect(Collectors.toList());
            }

            List<UUID> guiasOcupadosOtros = guiaBloqueoRepository
                    .findBlockedGuiaIdsExcludingSendero(fecha, turno, senderoId);
            hayGuia = guiasHabilitados.stream().anyMatch(gid -> !guiasOcupadosOtros.contains(gid));
        }

        resp.setCuposTotal(cuposTotal);
        resp.setCuposOcupados(cuposOcupados);
        resp.setCuposRestantes(cuposRestantes);
        resp.setHayGuiaDisponible(hayGuia);

        boolean disponible = hayGuia && cuposRestantes > 0;
        resp.setDisponible(disponible);

        if (!disponible) {
            List<SinDisponibilidadException.AlternativaSendero> alts =
                    buscarAlternativas(senderoId, fecha, turno);
            resp.setAlternativas(toAlternativaResponse(alts));

            if (!hayGuia) {
                resp.setMensajeUsuario(buildMensajeSinGuia(alts));
            } else {
                resp.setMensajeUsuario(String.format(
                        "Este sendero no tiene cupos disponibles para esa fecha y horario (disponibles: %d).",
                        cuposRestantes));
            }
        }

        return resp;
    }

    // ==================== HELPER: alternatives ============================

    /**
     * Returns senderos (other than the given one) that have at least one free guide
     * for the requested date/turno, respecting the day-of-week constraint.
     */
    private List<SinDisponibilidadException.AlternativaSendero> buscarAlternativas(
            UUID excluirSenderoId, LocalDate fecha, TurnoSendero turno) {

        List<UUID> otrosSenderoIds = disponibilidadRepository
                .findOtrosSenderoIdsConVentana(excluirSenderoId, fecha, turno);

        return otrosSenderoIds.stream()
                .filter(sid -> {
                    List<SenderoDisponibilidad> ventanas = disponibilidadRepository
                            .findVentanasActivas(sid, fecha, turno)
                            .stream()
                            .filter(v -> v.matchesDiaSemana(fecha))
                            .collect(Collectors.toList());
                    if (ventanas.isEmpty()) return false;

                    // Check guide availability: si ya hay reserva del MISMO sendero
                    // alternativo en (fecha, turno) → el guía está ahí; si no, hay
                    // que tener al menos un guía habilitado no ocupado en otro sendero.
                    boolean yaAtendiendo = !senderoReservaRepository
                            .findGuiaIdsByReservasActivas(sid, fecha, turno).isEmpty();
                    boolean hayGuia;
                    if (yaAtendiendo) {
                        hayGuia = true;
                    } else {
                        List<UUID> guiasH = ventanas.stream()
                                .flatMap(v -> v.obtenerGuiaIds().stream())
                                .distinct().collect(Collectors.toList());
                        if (guiasH.isEmpty()) {
                            guiasH = guiaRepository.findByActivoTrue().stream()
                                    .map(Guia::getId).collect(Collectors.toList());
                        }
                        List<UUID> guiasOcupadosOtros = guiaBloqueoRepository
                                .findBlockedGuiaIdsExcludingSendero(fecha, turno, sid);
                        hayGuia = guiasH.stream().anyMatch(gid -> !guiasOcupadosOtros.contains(gid));
                    }
                    if (!hayGuia) return false;

                    // Check cupos: single source of truth = sendero.capacidadMaximaGrupo
                    Sendero senderoAlt = senderoRepository.findById(sid).orElse(null);
                    if (senderoAlt == null || senderoAlt.getCapacidadMaximaGrupo() == null) return false;
                    int cuposTotal = senderoAlt.getCapacidadMaximaGrupo();
                    int ocupados   = senderoReservaRepository.sumPersonasReservadas(sid, fecha, turno);
                    return (cuposTotal - ocupados) > 0;
                })
                .map(sid -> senderoRepository.findById(sid).orElse(null))
                .filter(Objects::nonNull)
                .filter(Sendero::getActivo)
                .map(s -> new SinDisponibilidadException.AlternativaSendero(s.getId().toString(), s.getNombre()))
                .collect(Collectors.toList());
    }

    private List<DisponibilidadSenderoResponse.AlternativaSendero> toAlternativaResponse(
            List<SinDisponibilidadException.AlternativaSendero> alts) {
        return alts.stream()
                .map(a -> new DisponibilidadSenderoResponse.AlternativaSendero(a.getId(), a.getNombre()))
                .collect(Collectors.toList());
    }

    private String buildMensajeSinGuia(List<SinDisponibilidadException.AlternativaSendero> alts) {
        if (alts.isEmpty()) {
            return "No hay disponibilidad para la fecha y horario seleccionados.";
        }
        String nombres = alts.stream()
                .map(SinDisponibilidadException.AlternativaSendero::getNombre)
                .collect(Collectors.joining(", "));
        return "Para esa fecha y horario este sendero ya no está disponible. " +
               "Sendero" + (alts.size() > 1 ? "s disponibles" : " disponible") +
               " en ese horario: " + nombres + ".";
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
        reserva.setEstadoPago(EstadoPago.NO_CORRESPONDE);
        reserva.setFechaActualizacion(LocalDateTime.now());
        senderoReservaRepository.save(reserva);

        guiaBloqueoRepository.deactivateBlocksForReservation(reservaId);
        log.info("Sendero reservation cancelled and guide unblocked: {}", reserva.getCodigoReserva());
    }

    public void cancelarReservaAlojamiento(UUID reservaId) {
        log.info("Cancelling alojamiento reservation: {}", reservaId);

        AlojamientoReserva reserva = alojamientoReservaRepository.findById(reservaId)
                .orElseThrow(() -> new IllegalArgumentException("Reserva no encontrada: " + reservaId));

        reserva.setEstado(EstadoReserva.CANCELADA);
        reserva.setEstadoPago(EstadoPago.NO_CORRESPONDE);
        reserva.setFechaActualizacion(LocalDateTime.now());
        alojamientoReservaRepository.save(reserva);

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

        // Sendero-specific fields
        response.setNombreSendero(reserva.getSendero() != null ? reserva.getSendero().getNombre() : "Sendero");
        response.setTurno(reserva.getTurno() != null ? reserva.getTurno().name() : null);
        response.setEstadoPago(reserva.getEstadoPago() != null ? reserva.getEstadoPago().name() : "PENDIENTE");
        response.setMontoPagado(reserva.getMontoPagado());
        response.setSaldoPendiente(reserva.getSaldoPendiente());

        // Additional info (guide info is internal only, not exposed to users)
        String info = String.format("Sendero: %s | Turno: %s",
                reserva.getSendero() != null ? reserva.getSendero().getNombre() : "N/A",
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

        if (nuevoEstado == EstadoReserva.COMPLETADA && reserva.getEstadoPago() == EstadoPago.PARCIAL) {
            throw new IllegalStateException(
                    "No se puede completar una reserva con pago parcial. Primero registre el pago completo.");
        }

        reserva.setEstado(nuevoEstado);
        reserva.setFechaActualizacion(LocalDateTime.now());

        if (nuevoEstado == EstadoReserva.CANCELADA) {
            reserva.setEstadoPago(EstadoPago.NO_CORRESPONDE);
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

        // Auto-confirm reservation when payment is registered
        if ((nuevoEstadoPago == EstadoPago.PARCIAL || nuevoEstadoPago == EstadoPago.COMPLETO)
                && reserva.getEstado() == EstadoReserva.PENDIENTE) {
            reserva.setEstado(EstadoReserva.CONFIRMADA);
            log.info("Alojamiento reservation auto-confirmed after payment registration: {}", reserva.getCodigoReserva());
        }

        reserva = alojamientoReservaRepository.save(reserva);
        Alojamiento alojamiento = alojamientoRepository.findById(reserva.getAlojamientoId()).orElse(null);
        return convertirAlojamientoReservaAResponse(reserva, alojamiento);
    }

    public ReservaResponse actualizarEstadoSendero(UUID reservaId, String nuevoEstadoStr) {
        log.info("Updating sendero reservation state: {} -> {}", reservaId, nuevoEstadoStr);

        SenderoReserva reserva = senderoReservaRepository.findById(reservaId)
                .orElseThrow(() -> new IllegalArgumentException("Reserva no encontrada: " + reservaId));

        EstadoReserva nuevoEstado = EstadoReserva.valueOf(nuevoEstadoStr.toUpperCase());

        if (!reserva.getEstado().puedeTransicionarA(nuevoEstado)) {
            throw new IllegalStateException(
                    String.format("No se puede cambiar de %s a %s", reserva.getEstado(), nuevoEstado));
        }

        if (nuevoEstado == EstadoReserva.COMPLETADA && reserva.getEstadoPago() == EstadoPago.PARCIAL) {
            throw new IllegalStateException(
                    "No se puede completar una reserva con pago parcial. Primero registre el pago completo.");
        }

        reserva.cambiarEstado(nuevoEstado);

        if (nuevoEstado == EstadoReserva.CANCELADA) {
            reserva.setEstadoPago(EstadoPago.NO_CORRESPONDE);
            guiaBloqueoRepository.deactivateBlocksForReservation(reservaId);
        }

        reserva = senderoReservaRepository.save(reserva);
        return convertirSenderoReservaAResponse(reserva);
    }

    public ReservaResponse actualizarEstadoPagoSendero(UUID reservaId, String estadoPagoStr, BigDecimal montoPagado) {
        log.info("Updating sendero payment state: {} -> {} (monto: {})", reservaId, estadoPagoStr, montoPagado);

        SenderoReserva reserva = senderoReservaRepository.findById(reservaId)
                .orElseThrow(() -> new IllegalArgumentException("Reserva no encontrada: " + reservaId));

        EstadoPago nuevoEstadoPago = EstadoPago.fromString(estadoPagoStr);

        if (montoPagado != null) {
            reserva.setMontoPagado(montoPagado);
            reserva.setSaldoPendiente(reserva.getPrecioTotal().subtract(montoPagado));
        }

        reserva.setEstadoPago(nuevoEstadoPago);
        reserva.setFechaActualizacion(LocalDateTime.now());

        // Auto-confirm reservation when payment is registered
        if ((nuevoEstadoPago == EstadoPago.PARCIAL || nuevoEstadoPago == EstadoPago.COMPLETO)
                && reserva.getEstado() == EstadoReserva.PENDIENTE) {
            reserva.cambiarEstado(EstadoReserva.CONFIRMADA);
            log.info("Sendero reservation auto-confirmed after payment registration: {}", reserva.getCodigoReserva());
        }

        reserva = senderoReservaRepository.save(reserva);
        return convertirSenderoReservaAResponse(reserva);
    }

    public ReservaResponse posponerSendero(UUID reservaId, LocalDate nuevaFecha, TurnoSendero nuevoTurno) {
        log.info("Postponing sendero reservation: {} to {} {}", reservaId, nuevaFecha, nuevoTurno);

        SenderoReserva reserva = senderoReservaRepository.findById(reservaId)
                .orElseThrow(() -> new IllegalArgumentException("Reserva no encontrada: " + reservaId));

        if (reserva.getEstado() == EstadoReserva.CANCELADA || reserva.getEstado() == EstadoReserva.COMPLETADA) {
            throw new IllegalStateException("No se puede posponer una reserva en estado " + reserva.getEstado());
        }

        TurnoSendero turnoFinal = nuevoTurno != null ? nuevoTurno : reserva.getTurno();

        // Unblock old guide
        guiaBloqueoRepository.deactivateBlocksForReservation(reservaId);

        // Find available guide for new date/turno
        Sendero sendero = reserva.getSendero();
        List<SenderoDisponibilidad> ventanas = disponibilidadRepository
                .findVentanasActivas(sendero.getId(), nuevaFecha, turnoFinal)
                .stream()
                .filter(v -> v.matchesDiaSemana(nuevaFecha))
                .collect(Collectors.toList());

        List<UUID> guiasHabilitados = ventanas.stream()
                .flatMap(v -> v.obtenerGuiaIds().stream())
                .distinct()
                .collect(Collectors.toList());

        if (guiasHabilitados.isEmpty()) {
            guiasHabilitados = guiaRepository.findByActivoTrue().stream()
                    .map(Guia::getId)
                    .collect(Collectors.toList());
        }

        List<UUID> guiasBloqueados = guiaBloqueoRepository.findBlockedGuiaIds(nuevaFecha, turnoFinal);
        Optional<UUID> guiaIdOpt = guiasHabilitados.stream()
                .filter(gid -> !guiasBloqueados.contains(gid))
                .findFirst();

        if (guiaIdOpt.isEmpty()) {
            throw new IllegalStateException("No hay guías disponibles para la nueva fecha y horario seleccionados");
        }

        Guia nuevoGuia = guiaRepository.findById(guiaIdOpt.get())
                .orElseThrow(() -> new IllegalArgumentException("Guía no encontrado"));

        // Update reservation
        reserva.setFechaInicio(nuevaFecha);
        reserva.setFechaFin(nuevaFecha);
        reserva.setTurno(turnoFinal);
        reserva.setGuia(nuevoGuia);
        reserva.setFechaActualizacion(LocalDateTime.now());
        reserva = senderoReservaRepository.save(reserva);

        // Create new guide block
        bloquearGuiaParaReserva(nuevoGuia.getId(), reservaId, nuevaFecha, turnoFinal, sendero.getNombre());

        log.info("Sendero reservation postponed to {}", nuevaFecha);
        return convertirSenderoReservaAResponse(reserva);
    }

    public AlojamientoReservaResponse posponerAlojamiento(UUID reservaId, LocalDate nuevaFechaCheckIn, LocalDate nuevaFechaCheckOut) {
        log.info("Postponing alojamiento reservation: {} to {}-{}", reservaId, nuevaFechaCheckIn, nuevaFechaCheckOut);

        AlojamientoReserva reserva = alojamientoReservaRepository.findById(reservaId)
                .orElseThrow(() -> new IllegalArgumentException("Reserva no encontrada: " + reservaId));

        if (reserva.getEstado() == EstadoReserva.CANCELADA || reserva.getEstado() == EstadoReserva.COMPLETADA) {
            throw new IllegalStateException("No se puede posponer una reserva en estado " + reserva.getEstado());
        }

        // Unblock old accommodation dates
        alojamientoService.desbloquearAlojamientoDeReserva(reservaId);

        // Check availability for new dates
        boolean disponible = alojamientoService.verificarDisponibilidad(
                reserva.getAlojamientoId(), nuevaFechaCheckIn, nuevaFechaCheckOut);

        if (!disponible) {
            throw new IllegalStateException("El alojamiento no está disponible para las nuevas fechas seleccionadas");
        }

        // Recalculate price
        Alojamiento alojamiento = alojamientoRepository.findById(reserva.getAlojamientoId()).orElse(null);
        if (alojamiento != null) {
            int noches = (int) (nuevaFechaCheckOut.toEpochDay() - nuevaFechaCheckIn.toEpochDay());
            BigDecimal nuevoPrecio = alojamiento.getPrecioPorNoche()
                    .multiply(BigDecimal.valueOf(noches))
                    .multiply(BigDecimal.valueOf(reserva.getNumeroHuespedes()));
            reserva.setPrecioTotal(nuevoPrecio);
            BigDecimal pagado = reserva.getMontoPagado() != null ? reserva.getMontoPagado() : BigDecimal.ZERO;
            reserva.setSaldoPendiente(nuevoPrecio.subtract(pagado));
        }

        reserva.setFechaCheckIn(nuevaFechaCheckIn);
        reserva.setFechaCheckOut(nuevaFechaCheckOut);
        reserva.setFechaActualizacion(LocalDateTime.now());
        reserva = alojamientoReservaRepository.save(reserva);

        // Block accommodation for new dates
        alojamientoService.bloquearAlojamientoParaReserva(
                reserva.getAlojamientoId(), reservaId, nuevaFechaCheckIn, nuevaFechaCheckOut);

        log.info("Alojamiento reservation postponed to {}-{}", nuevaFechaCheckIn, nuevaFechaCheckOut);
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
