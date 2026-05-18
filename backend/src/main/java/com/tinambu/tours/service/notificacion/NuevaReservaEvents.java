package com.tinambu.tours.service.notificacion;

import com.tinambu.tours.entity.reserva.AlojamientoReserva;
import com.tinambu.tours.entity.reserva.SenderoReserva;

/**
 * Eventos de dominio que se publican cuando se crea una reserva.
 *
 * <p>Son consumidos por {@link NotificacionReservaService} con
 * {@code @TransactionalEventListener(AFTER_COMMIT)} para que el email a operaciones
 * sólo salga si la transacción de creación confirmó. Si la transacción hace rollback,
 * el listener no se invoca y el equipo no recibe avisos espúreos.
 */
public final class NuevaReservaEvents {

    private NuevaReservaEvents() {
        // utility holder
    }

    /** Notificación interna al equipo cuando se crea una reserva de sendero. */
    public static final class Sendero {
        private final SenderoReserva reserva;
        private final String senderoNombre;

        public Sendero(SenderoReserva reserva, String senderoNombre) {
            this.reserva = reserva;
            this.senderoNombre = senderoNombre;
        }

        public SenderoReserva getReserva() {
            return reserva;
        }

        public String getSenderoNombre() {
            return senderoNombre;
        }
    }

    /** Notificación interna al equipo cuando se crea una reserva de alojamiento. */
    public static final class Alojamiento {
        private final AlojamientoReserva reserva;
        private final String alojamientoNombre;

        public Alojamiento(AlojamientoReserva reserva, String alojamientoNombre) {
            this.reserva = reserva;
            this.alojamientoNombre = alojamientoNombre;
        }

        public AlojamientoReserva getReserva() {
            return reserva;
        }

        public String getAlojamientoNombre() {
            return alojamientoNombre;
        }
    }
}
