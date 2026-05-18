package com.tinambu.tours.service.notificacion;

import com.tinambu.tours.entity.reserva.AlojamientoReserva;
import com.tinambu.tours.entity.reserva.EstadoPago;
import com.tinambu.tours.entity.reserva.EstadoReserva;
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
 * Notificaciones por mail al crear una reserva:
 *
 * <ul>
 *   <li>Al equipo (env {@code RESERVAS_NOTIF_EMAIL}, por defecto reservas@…) con los datos
 *       internos para operaciones (estado, método de pago, contacto, etc.).</li>
 *   <li>Al propio cliente que reservó (su {@code emailContacto}) con un resumen amigable
 *       y los próximos pasos según el método de pago.</li>
 * </ul>
 *
 * <p>Se ejecuta con {@code @TransactionalEventListener(AFTER_COMMIT)}: si la transacción
 * de creación de la reserva hace rollback, no se envía nada. Cualquier fallo de SES se
 * loguea y nunca se propaga, así un mail caído no rompe el flujo de reserva.
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

    // Datos de la cuenta Prex que se le comparten al cliente para hacer la transferencia.
    // Los defaults coinciden con frontend/src/config/prex.ts; se pueden sobreescribir vía
    // env vars sin tocar el código.
    @Value("${PREX_TITULAR:Laura Magallanes}")
    private String prexTitular;

    @Value("${PREX_CUENTA:1643941}")
    private String prexCuenta;

    @Value("${PREX_COMPROBANTE_EMAIL:info@pasocenturion.com.uy}")
    private String prexComprobanteEmail;

    @Value("${PREX_COMPROBANTE_EMAIL_SUBJECT:Pago de reserva}")
    private String prexComprobanteEmailSubject;

    @Value("${PREX_COMPROBANTE_WHATSAPP:+598 98 372 742}")
    private String prexComprobanteWhatsapp;

    // ==================== EVENT LISTENERS ====================

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onNuevaReservaSendero(NuevaReservaEvents.Sendero event) {
        SenderoReserva r = event.getReserva();
        String senderoNombre = event.getSenderoNombre();

        // 1) Mail al equipo
        try {
            String subject = "Nueva reserva de sendero - " + safe(r.getNombreContacto())
                    + " (" + safe(r.getCodigoReserva()) + ")";
            enviarMail(reservasEmail, subject, buildSenderoStaffBody(r, senderoNombre), r.getEmailContacto());
        } catch (Exception e) {
            log.error("[NOTIF-RESERVA] Error enviando mail al equipo (sendero {}): {}",
                    r.getCodigoReserva(), e.getMessage(), e);
        }

        // 2) Mail al cliente
        try {
            if (esEmailValido(r.getEmailContacto())) {
                String subject = "Confirmación de tu reserva en Tinambú · " + safe(senderoNombre);
                enviarMail(r.getEmailContacto(), subject, buildSenderoClienteBody(r, senderoNombre), reservasEmail);
            } else {
                log.warn("[NOTIF-RESERVA] Email del cliente vacío para sendero {}; no se envía confirmación",
                        r.getCodigoReserva());
            }
        } catch (Exception e) {
            log.error("[NOTIF-RESERVA] Error enviando mail al cliente (sendero {}): {}",
                    r.getCodigoReserva(), e.getMessage(), e);
        }
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onNuevaReservaAlojamiento(NuevaReservaEvents.Alojamiento event) {
        AlojamientoReserva r = event.getReserva();
        String alojamientoNombre = event.getAlojamientoNombre();

        // 1) Mail al equipo
        try {
            String subject = "Nueva reserva de alojamiento - " + safe(r.getNombreContacto())
                    + " (" + safe(r.getCodigoReserva()) + ")";
            enviarMail(reservasEmail, subject, buildAlojamientoStaffBody(r, alojamientoNombre), r.getEmailContacto());
        } catch (Exception e) {
            log.error("[NOTIF-RESERVA] Error enviando mail al equipo (alojamiento {}): {}",
                    r.getCodigoReserva(), e.getMessage(), e);
        }

        // 2) Mail al cliente
        try {
            if (esEmailValido(r.getEmailContacto())) {
                String subject = "Confirmación de tu reserva en Tinambú · " + safe(alojamientoNombre);
                enviarMail(r.getEmailContacto(), subject,
                        buildAlojamientoClienteBody(r, alojamientoNombre), reservasEmail);
            } else {
                log.warn("[NOTIF-RESERVA] Email del cliente vacío para alojamiento {}; no se envía confirmación",
                        r.getCodigoReserva());
            }
        } catch (Exception e) {
            log.error("[NOTIF-RESERVA] Error enviando mail al cliente (alojamiento {}): {}",
                    r.getCodigoReserva(), e.getMessage(), e);
        }
    }

    // ==================== ENVÍO ====================

    /**
     * Envía un mail vía SES. Cualquier fallo se loguea y se traga; el caller no debe romperse
     * por un problema de mail.
     */
    private void enviarMail(String toEmail, String subject, String body, String replyTo) {
        if (sesClient == null) {
            log.warn("[NOTIF-RESERVA] SES no disponible. Mail NO enviado a {} - {}", toEmail, subject);
            return;
        }

        try {
            SendEmailRequest.Builder req = SendEmailRequest.builder()
                    .source(sesFromEmail)
                    .destination(Destination.builder().toAddresses(toEmail).build())
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
                    toEmail, response.messageId(), subject);
        } catch (MessageRejectedException e) {
            log.warn("[NOTIF-RESERVA] SES rechazó el envío a {}: {} (subject={})",
                    toEmail, e.getMessage(), subject);
        } catch (Exception e) {
            log.error("[NOTIF-RESERVA] Error inesperado enviando mail a {}: {}",
                    toEmail, e.getMessage(), e);
        }
    }

    // ==================== PLANTILLAS — STAFF ====================

    private String buildSenderoStaffBody(SenderoReserva r, String senderoNombre) {
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

    private String buildAlojamientoStaffBody(AlojamientoReserva r, String alojamientoNombre) {
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

    // ==================== PLANTILLAS — CLIENTE ====================

    private String buildSenderoClienteBody(SenderoReserva r, String senderoNombre) {
        StringBuilder b = new StringBuilder();
        b.append("Hola ").append(primerNombre(r.getNombreContacto())).append(",\n\n");
        b.append("¡Gracias por elegir Tinambú - Paso Centurión Tours!\n");
        b.append("Recibimos tu reserva del sendero ").append(safe(senderoNombre)).append(".\n\n");

        b.append("----------------------------------------\n");
        b.append("DETALLES DE TU RESERVA\n");
        b.append("----------------------------------------\n");
        b.append("Código:        ").append(safe(r.getCodigoReserva())).append("\n");
        b.append("Sendero:       ").append(safe(senderoNombre)).append("\n");
        if (r.getFechaInicio() != null) {
            b.append("Fecha:         ").append(r.getFechaInicio().format(FMT_FECHA)).append("\n");
        }
        if (r.getTurno() != null) {
            b.append("Turno:         ").append(r.getTurno()).append("\n");
        }
        b.append("Personas:      ").append(r.getNumeroPersonas()).append("\n");
        b.append("Total:         ").append(formatPrecio(r.getPrecioTotal())).append(" UYU\n");
        b.append("Estado:        ").append(estadoAmigable(r.getEstado())).append("\n\n");

        b.append(mensajeSegunPago(r.getEstado(), r.getEstadoPago(), r.getMetodoPago(),
                r.getCodigoReserva(), r.getNombreContacto()));

        b.append("\n----------------------------------------\n");
        b.append("ANTES DE TU EXPERIENCIA\n");
        b.append("----------------------------------------\n");
        b.append("• Te recomendamos llegar con 15 minutos de anticipación.\n");
        b.append("• Llevá calzado cómodo, protector solar y agua.\n");
        b.append("• Si necesitas reagendar o tienes alguna duda, contáctanos respondiendo a este correo.\n\n");

        b.append("¡Te esperamos!\n");
        b.append("Equipo Tinambú - Paso Centurión Tours\n");
        b.append("https://pasocenturion.com.uy\n");
        return b.toString();
    }

    private String buildAlojamientoClienteBody(AlojamientoReserva r, String alojamientoNombre) {
        StringBuilder b = new StringBuilder();
        b.append("Hola ").append(primerNombre(r.getNombreContacto())).append(",\n\n");
        b.append("¡Gracias por elegir Tinambú - Paso Centurión Tours!\n");
        b.append("Recibimos tu reserva del alojamiento ").append(safe(alojamientoNombre)).append(".\n\n");

        b.append("----------------------------------------\n");
        b.append("DETALLES DE TU RESERVA\n");
        b.append("----------------------------------------\n");
        b.append("Código:        ").append(safe(r.getCodigoReserva())).append("\n");
        b.append("Alojamiento:   ").append(safe(alojamientoNombre)).append("\n");
        if (r.getFechaCheckIn() != null) {
            b.append("Check-in:      ").append(r.getFechaCheckIn().format(FMT_FECHA)).append(" (a partir de las 15:00 h)\n");
        }
        if (r.getFechaCheckOut() != null) {
            b.append("Check-out:     ").append(r.getFechaCheckOut().format(FMT_FECHA)).append(" (hasta las 12:00 h)\n");
        }
        if (r.getNumeroNoches() != null) {
            b.append("Noches:        ").append(r.getNumeroNoches()).append("\n");
        }
        b.append("Huéspedes:     ").append(r.getNumeroHuespedes()).append("\n");
        b.append("Total:         ").append(formatPrecio(r.getPrecioTotal())).append(" UYU\n");
        b.append("Estado:        ").append(estadoAmigable(r.getEstado())).append("\n\n");

        b.append(mensajeSegunPago(r.getEstado(), r.getEstadoPago(), r.getMetodoPago(),
                r.getCodigoReserva(), r.getNombreContacto()));

        b.append("\n----------------------------------------\n");
        b.append("INFORMACIÓN ÚTIL\n");
        b.append("----------------------------------------\n");
        b.append("• El alojamiento incluye baño privado, agua caliente, frigobar, TV y WiFi.\n");
        b.append("• Tienes acceso a las áreas comunes y al comedero de aves.\n");
        b.append("• Estamos sobre la Ruta 7, dentro del Área Protegida Paso Centurión y Sierra de Ríos,\n");
        b.append("  a 3 km del Río Yaguarón.\n");
        b.append("• Si necesitas reagendar o tienes alguna duda, contáctanos respondiendo a este correo.\n\n");

        b.append("¡Te esperamos!\n");
        b.append("Equipo Tinambú - Paso Centurión Tours\n");
        b.append("https://pasocenturion.com.uy\n");
        return b.toString();
    }

    private String mensajeSegunPago(EstadoReserva estado, EstadoPago estadoPago, String metodoPago,
                                    String codigoReserva, String nombreContacto) {
        if (estado == EstadoReserva.CANCELADA) {
            return "Tu reserva figura como CANCELADA. Si esto no es lo esperado, por favor"
                    + " contáctanos respondiendo a este correo.\n";
        }
        String metodo = metodoPago == null ? "" : metodoPago.toUpperCase();

        if ("PREX".equals(metodo)) {
            return buildBloqueTransferenciaPrex(codigoReserva, nombreContacto);
        }
        if ("EFECTIVO".equals(metodo) || "PAGO_EFECTIVO".equals(metodo)) {
            return "Reservaste con pago en efectivo al momento de la experiencia.\n"
                    + "Coordinamos contigo el saldo antes de tu visita.\n";
        }
        if (estadoPago == EstadoPago.COMPLETO || estado == EstadoReserva.CONFIRMADA) {
            return "Tu reserva quedó CONFIRMADA. Ya está todo listo, te esperamos.\n";
        }
        return "Tu reserva quedó registrada. En breve te contactamos por cualquier detalle pendiente.\n"
                + "Puedes ver el estado y los próximos pasos desde \"Mis Reservas\" en el sitio.\n";
    }

    /**
     * Bloque con los datos para transferir por Prex e instrucciones para enviar
     * el comprobante. Se incluye cuando el cliente eligió pago con Prex.
     */
    private String buildBloqueTransferenciaPrex(String codigoReserva, String nombreContacto) {
        StringBuilder b = new StringBuilder();
        b.append("Tu reserva quedó registrada como PENDIENTE de pago. Para confirmarla,\n");
        b.append("realiza la transferencia mediante Prex dentro de las próximas 12 horas.\n");
        b.append("Si no recibimos el comprobante en ese plazo, la reserva se cancela automáticamente.\n\n");

        b.append("----------------------------------------\n");
        b.append("DATOS PARA LA TRANSFERENCIA PREX\n");
        b.append("----------------------------------------\n");
        b.append("Titular:           ").append(safe(prexTitular)).append("\n");
        b.append("Número de cuenta:  ").append(safe(prexCuenta)).append("\n\n");

        b.append("----------------------------------------\n");
        b.append("CÓMO ENVIARNOS EL COMPROBANTE\n");
        b.append("----------------------------------------\n");
        b.append("Una vez realizada la transferencia, envíanos el comprobante por:\n\n");
        b.append("  • Correo:    ").append(safe(prexComprobanteEmail))
                .append("  (asunto: «").append(safe(prexComprobanteEmailSubject)).append("»)\n");
        b.append("  • WhatsApp:  ").append(safe(prexComprobanteWhatsapp)).append("\n\n");

        b.append("Importante: indica en el mensaje el nombre completo de quien reservó");
        if (nombreContacto != null && !nombreContacto.isBlank()) {
            b.append(" (").append(nombreContacto).append(")");
        }
        b.append("\ny, si lo tienes a mano, el código de reserva");
        if (codigoReserva != null && !codigoReserva.isBlank()) {
            b.append(" ").append(codigoReserva);
        }
        b.append(",\nasí podemos identificar tu pago rápidamente.\n");
        return b.toString();
    }

    // ==================== HELPERS ====================

    private static String estadoAmigable(EstadoReserva estado) {
        if (estado == null) return "-";
        switch (estado) {
            case PENDIENTE:  return "Pendiente";
            case CONFIRMADA: return "Confirmada";
            case CANCELADA:  return "Cancelada";
            case COMPLETADA: return "Completada";
            default:         return estado.name();
        }
    }

    private static String primerNombre(String nombreCompleto) {
        if (nombreCompleto == null || nombreCompleto.isBlank()) return "";
        String trimmed = nombreCompleto.trim();
        int sp = trimmed.indexOf(' ');
        return sp > 0 ? trimmed.substring(0, sp) : trimmed;
    }

    private static boolean esEmailValido(String email) {
        if (email == null) return false;
        String trimmed = email.trim();
        return !trimmed.isEmpty() && trimmed.contains("@") && trimmed.contains(".");
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
