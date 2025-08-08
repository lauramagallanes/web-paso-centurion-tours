package com.tinambu.tours.entity.reserva;

import com.tinambu.tours.entity.sendero.Sendero;
import com.tinambu.tours.entity.guia.Guia;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@DiscriminatorValue("SENDERO")
public class SenderoReserva extends Reserva {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sendero_id", nullable = false)
    @NotNull(message = "Sendero es obligatorio para reserva de sendero")
    private Sendero sendero;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "guia_id", nullable = false)
    @NotNull(message = "Guía es obligatorio para reserva de sendero")
    private Guia guia;

    @Column(name = "turno", nullable = false)
    @Enumerated(EnumType.STRING)
    @NotNull(message = "Turno es obligatorio para reserva de sendero")
    private TurnoSendero turno;

    @Column(name = "numero_dias", nullable = false)
    private Integer numeroDias;

    // Constructors
    public SenderoReserva() {
        super();
    }

    public SenderoReserva(String emailContacto, String nombreContacto, Integer numeroPersonas,
                         LocalDate fechaInicio, LocalDate fechaFin, Sendero sendero, 
                         Guia guia, TurnoSendero turno) {
        super(emailContacto, nombreContacto, numeroPersonas, fechaInicio, fechaFin);
        this.sendero = sendero;
        this.guia = guia;
        this.turno = turno;
        this.numeroDias = calcularNumeroDias();
        this.setPrecioTotal(calcularPrecioTotal());
    }

    @Override
    public TipoReserva getTipoReserva() {
        return TipoReserva.SENDERO;
    }

    @Override
    public void validarReserva() {
        // Validar capacidad del sendero
        if (!sendero.puedeAcomodarGrupo(getNumeroPersonas())) {
            throw new IllegalArgumentException(
                String.format("Sendero %s no puede acomodar %d personas (máximo: %d)",
                    sendero.getNombre(), getNumeroPersonas(), sendero.getCapacidadMaximaGrupo())
            );
        }

        // Validar fechas
        if (getFechaInicio().isAfter(getFechaFin())) {
            throw new IllegalArgumentException("Fecha de inicio debe ser anterior o igual a fecha de fin");
        }

        if (getFechaInicio().isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Fecha de inicio no puede ser en el pasado");
        }

        // Validar que el guía esté activo
        if (!guia.getActivo()) {
            throw new IllegalArgumentException("El guía seleccionado no está disponible");
        }

        // Validar que el sendero esté activo
        if (!sendero.getActivo()) {
            throw new IllegalArgumentException("El sendero seleccionado no está disponible");
        }
    }

    @Override
    public BigDecimal calcularPrecioTotal() {
        if (sendero == null || numeroDias == null) {
            return BigDecimal.ZERO;
        }
        return sendero.calcularPrecioTotal(getNumeroPersonas())
                     .multiply(BigDecimal.valueOf(numeroDias));
    }

    // Business Methods
    public boolean bloqueaGuiaEnTurno() {
        return true; // Las reservas de sendero bloquean al guía en el turno específico
    }

    public boolean permiteMezclarGrupos() {
        return true; // Los senderos permiten mezclar grupos hasta la capacidad máxima
    }

    public String getIdentificadorTurno() {
        return String.format("%s-%s-%s", 
            guia.getId(), getFechaInicio(), turno);
    }

    @PostLoad
    @PostPersist
    @PostUpdate
    public void calcularDias() {
        if (getFechaInicio() != null && getFechaFin() != null) {
            this.numeroDias = super.calcularNumeroDias();
        }
    }

    // Getters and Setters
    public Sendero getSendero() { return sendero; }
    public void setSendero(Sendero sendero) { 
        this.sendero = sendero;
        if (numeroDias != null) {
            this.setPrecioTotal(calcularPrecioTotal());
        }
    }

    public Guia getGuia() { return guia; }
    public void setGuia(Guia guia) { this.guia = guia; }

    public TurnoSendero getTurno() { return turno; }
    public void setTurno(TurnoSendero turno) { this.turno = turno; }

    public Integer getNumeroDias() { return numeroDias; }
    public void setNumeroDias(Integer numeroDias) { this.numeroDias = numeroDias; }
}
