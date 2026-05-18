package com.tinambu.tours.service.notificacion;

import com.tinambu.tours.entity.reserva.AlojamientoReserva;
import com.tinambu.tours.entity.reserva.SenderoReserva;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import software.amazon.awssdk.services.ses.SesClient;
import software.amazon.awssdk.services.ses.model.Body;
import software.amazon.awssdk.services.ses.model.Content;
import software.amazon.awssdk.services.ses.model.Destination;
import software.amazon.awssdk.services.ses.model.Message;
import software.amazon.awssdk.services.ses.model.MessageRejectedException;
import software.amazon.awssdk.services.ses.model.SendEmailRequest;
import software.amazon.awssdk.services.ses.model.SendEmailResponse;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;

/**
 * Envía notificaciones al equipo (reservas@) cuando se crea una reserva.
 *
 * <p>Escucha eventos publicados desde {@code ReservaService} y dispara el envío
 * <strong>después del commit</strong> de la transacción. Si SES no está disponible
 * (entornos locales sin AWS) o si el envío falla, se hace logging y se sigue:
 * nunca rompemos el flujo de reserva por un mail.
 */
@Service
public class NotificacionReservaService {

    private static final Logger log = LoggerFactory.getLogger(NotificacionReservaService.class);
    private static final DateTimeFormatter FMT_FECHA = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter FMT_FECHA_HORA = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    @Autowired(required = false)
    private SesClient sesClient;

    @Value("${RESERVAS_NOTIF_EMAIL:reservas@pasocenturion.com.uy}")
    private String reservasEmail;

    @Value("${SES_FROM_EMAIL:noreply@pasocenturion.com.uy}")
    private String sesFromEmail;

    // ==================== EVENT LISTENERS ====================

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onNuevaReservaSendero(NuevaReservaEvents.Sendero event) {
        try {
            SenderoReserva r = event.getReserva();
            String subject = "Nueva reserva de sendero - " + safe(r.getNombreContacto())
                    + " (" + safe(r.getCodigoReserva()) + ")";
            String body = buildSenderoBody(r, event.getSenderoNombre());
            enviarMail(subject, body, r.getEmailContacto());
        } catch (Exception e) {
            log.error("[NOTIF-RESERVA] Error preparando notificación de sendero: {}", e.getMessage(), e);
        }
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onNuevaReservaAlojamiento(NuevaReservaEvents.Alojamiento event) {
        try {
            AlojamientoReserva r = event.getReserva();
            String subject = "Nueva reserva de alojamiento - " + safe(r.getNombreContacto())
                    + " (" + safe(r.getCodigoReserva()) + ")";
            String body = buildAlojamientoBody(r, event.getAlojamientoNombre());
            enviarMail(subject, body, r.getEmailContacto());
        } catch (Exception e) {
            log.error("[NOTIF-RESERVA] Error preparando notificación de alojamiento: {}", e.getMessage(), e);
        }
    }

    // ==================== ENVÍO ====================

    private void enviarMail(String subject, String body, String replyTo) {
        if (sesClient == null) {
            log.warn("[NOTIF-RESERVA] SES no disponible. Notificación NO enviada. Subject: {}\n{}", subject, body);
            return;
        }

        try {
            SendEmailRequest.Builder req = SendEmailRequest.builder()
                    .source(sesFromEmail)
                    .destination(Destination.builder().toAddresses(reservasEmail).build())
                    .message(Message.builder()
                            .subject(Content.builder().data(subject).charset("UTF-8").build())
                            .body(Body.builder()
                                    .text(Content.builder().data(body).charset("UTF-8").build())
                                    .build())
                            .build());

            if (replyTo != null && !replyTo.isBlank()) {
                req.replyToAddresses(replyTo);
            }

            SendEmailResponse response = sesClient.sendEmail(req.build());
            log.info("[NOTIF-RESERVA] Email enviado a {} (msgId={}) - {}",
                    reservasEmail, response.messageId(), subject);
        } catch (MessageRejectedException e) {
            log.warn("[NOTIF-RESERVA] SES rechazó el envío (¿identidad no verificada?): {} - subject={}",
                    e.getMessage(), subject);
        } catch (Exception e) {
            log.error("[NOTIF-RESERVA] Error inesperado enviando notificación a {}: {}",
                    reservasEmail, e.getMessage(), e);
        }
    }

    // ==================== PLANTILLAS ====================

    private String buildSenderoBody(SenderoReserva r, String senderoNombre) {
        StringBuilder b = new StringBuilder();
        b.append("Nueva reserva registrada en el sitio web.\n\n");
        b.append("========================================\n");
        b.append("DATOS DE LA RESERVA\n");
        b.append("========================================\n");
        b.append("Tipo:               Sendero\n");
        b.append("Código:             ").append(safe(r.getCodigoReserva())).append("\n");
        b.append("Estado:             ").append(r.getEstado()).append("\n");
        b.append("Estado de pago:     ").append(r.getEstadoPago()).append("\n");
        if (r.getMetodoPago() != null) {
            b.append("Método de pago:     ").append(r.getMetodoPago()).append("\n");
        }
        b.append("Total:              ").append(formatPrecio(r.getPrecioTotal())).append(" UYU\n");
        if (r.getFechaCreacion() != null) {
            b.append("Creada:             ").append(r.getFechaCreacion().format(FMT_FECHA_HORA)).append("\n");
        }
        b.append("\n----------------------------------------\n");
        b.append("DETALLE\n");
        b.append("----------------------------------------\n");
        b.append("Sendero:            ").append(safe(senderoNombre)).append("\n");
        if (r.getFechaInicio() != null) {
            b.append("Fecha:              ").append(r.getFechaInicio().format(FMT_FECHA)).append("\n");
        }
        if (r.getTurno() != null) {
            b.append("Turno:              ").append(r.getTurno()).append("\n");
        }
        b.append("Personas:           ").append(r.getNumeroPersonas()).append("\n");

        b.append("\n----------------------------------------\n");
        b.append("CONTACTO\n");
        b.append("----------------------------------------\n");
        b.append("Nombre:             ").append(safe(r.getNombreContacto())).append("\n");
        b.append("Email:              ").append(safe(r.getEmailContacto())).append("\n");
        b.append("Teléfono:           ").append(safeOrDash(r.getTelefonoContacto())).append("\n");
        if (r.getObservaciones() != null && !r.getObservaciones().isBlank()) {
            b.append("\nObservaciones:\n").append(r.getObservaciones()).append("\n");
        }
        b.append("\n========================================\n");
        b.append("Notificación automática del sistema de reservas.\n");
        return b.toString();
    }

    private String buildAlojamientoBody(AlojamientoReserva r, String alojamientoNombre) {
        StringBuilder b = new StringBuilder();
        b.append("Nueva reserva registrada en el sitio web.\n\n");
        b.append("========================================\n");
        b.append("DATOS DE LA RESERVA\n");
        b.append("========================================\n");
        b.append("Tipo:               Alojamiento\n");
        b.append("Código:             ").append(safe(r.getCodigoReserva())).append("\n");
        b.append("Estado:             ").append(r.getEstado()).append("\n");
        b.append("Estado de pago:     ").append(r.getEstadoPago()).append("\n");
        if (r.getMetodoPago() != null) {
            b.append("Método de pago:     ").append(r.getMetodoPago()).append("\n");
        }
        b.append("Total:              ").append(formatPrecio(r.getPrecioTotal())).append(" UYU\n");
        if (r.getFechaCreacion() != null) {
            b.append("Creada:             ").append(r.getFechaCreacion().format(FMT_FECHA_HORA)).append("\n");
        }
        b.append("\n----------------------------------------\n");
        b.append("DETALLE\n");
        b.append("----------------------------------------\n");
        b.append("Alojamiento:        ").append(safe(alojamientoNombre)).append("\n");
        if (r.getFechaCheckIn() != null) {
            b.append("Check-in:           ").append(r.getFechaCheckIn().format(FMT_FECHA)).append("\n");
        }
        if (r.getFechaCheckOut() != null) {
            b.append("Check-out:          ").append(r.getFechaCheckOut().format(FMT_FECHA)).append("\n");
        }
        if (r.getNumeroNoches() != null) {
            b.append("Noches:             ").append(r.getNumeroNoches()).append("\n");
        }
        b.append("Huéspedes:          ").append(r.getNumeroHuespedes()).append("\n");

        b.append("\n----------------------------------------\n");
        b.append("CONTACTO\n");
        b.append("----------------------------------------\n");
        b.append("Nombre:             ").append(safe(r.getNombreContacto())).append("\n");
        b.append("Email:              ").append(safe(r.getEmailContacto())).append("\n");
        b.append("Teléfono:           ").append(safeOrDash(r.getTelefonoContacto())).append("\n");
        if (r.getObservacionesEspeciales() != null && !r.getObservacionesEspeciales().isBlank()) {
            b.append("\nObservaciones especiales:\n").append(r.getObservacionesEspeciales()).append("\n");
        }
        if (r.getObservaciones() != null && !r.getObservaciones().isBlank()) {
            b.append("\nObservaciones:\n").append(r.getObservaciones()).append("\n");
        }
        b.append("\n========================================\n");
        b.append("Notificación automática del sistema de reservas.\n");
        return b.toString();
    }

    private static String safe(String s) {
        return s == null ? "-" : s;
    }

    private static String safeOrDash(String s) {
        return (s == null || s.isBlank()) ? "-" : s;
    }

    private static String formatPrecio(BigDecimal v) {
        return v == null ? "0" : v.stripTrailingZeros().toPlainString();
    }
}
