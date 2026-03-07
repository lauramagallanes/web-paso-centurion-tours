package com.tinambu.tours.entity.sendero;

import com.tinambu.tours.entity.guia.Guia;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.GenericGenerator;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Entity
@Table(name = "sendero_disponibilidad")
public class SenderoDisponibilidad {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(
        name = "UUID",
        strategy = "org.hibernate.id.UUIDGenerator"
    )
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "sendero_id", nullable = false)
    private UUID senderoId;

    @Column(name = "fecha_inicio", nullable = false)
    private LocalDate fechaInicio;

    @Column(name = "fecha_fin", nullable = false)
    private LocalDate fechaFin;

    /** Primary turno for this availability window (one row per turno since v2). */
    @Column(name = "turno", nullable = false)
    @Enumerated(EnumType.STRING)
    private TurnoSendero turno;

    /**
     * Comma-separated Spanish day names: LUNES,MARTES,MIERCOLES,JUEVES,VIERNES,SABADO,DOMINGO
     * Null means "applies to all days of the week".
     */
    @Column(name = "dias_semana")
    private String diasSemana;

    /** Maximum people allowed in this slot (cupos). */
    @Column(name = "cupos_total", nullable = false)
    private Integer cuposTotal = 8;

    // Legacy boolean columns kept for DB compatibility — not used by service logic.
    @Column(name = "turno_manana", nullable = false)
    private Boolean turnoManana = false;

    @Column(name = "turno_tarde", nullable = false)
    private Boolean turnoTarde = false;

    @Column(name = "activo", nullable = false)
    private Boolean activo = true;

    @CreationTimestamp
    @Column(name = "fecha_creacion", nullable = false)
    private LocalDateTime fechaCreacion;

    @UpdateTimestamp
    @Column(name = "fecha_actualizacion")
    private LocalDateTime fechaActualizacion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sendero_id", insertable = false, updatable = false)
    private Sendero sendero;

    @OneToMany(mappedBy = "senderoDisponibilidad", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<SenderoDisponibilidadGuia> guiasAsignados = new HashSet<>();

    private static final Map<String, DayOfWeek> DIA_MAP = Map.of(
        "LUNES",     DayOfWeek.MONDAY,
        "MARTES",    DayOfWeek.TUESDAY,
        "MIERCOLES", DayOfWeek.WEDNESDAY,
        "JUEVES",    DayOfWeek.THURSDAY,
        "VIERNES",   DayOfWeek.FRIDAY,
        "SABADO",    DayOfWeek.SATURDAY,
        "DOMINGO",   DayOfWeek.SUNDAY
    );

    // Constructors
    public SenderoDisponibilidad() {}

    public SenderoDisponibilidad(UUID senderoId, LocalDate fechaInicio, LocalDate fechaFin,
                                 TurnoSendero turno, String diasSemana, int cuposTotal) {
        this.senderoId = senderoId;
        this.fechaInicio = fechaInicio;
        this.fechaFin = fechaFin;
        this.turno = turno;
        this.diasSemana = diasSemana;
        this.cuposTotal = cuposTotal;
        this.turnoManana = (turno == TurnoSendero.MANANA);
        this.turnoTarde  = (turno == TurnoSendero.TARDE);
        this.activo = true;
    }

    // Business methods

    /**
     * Returns true when this window applies to the given date and turno.
     * Checks: active flag + date range + turno match + day-of-week constraint.
     */
    public boolean aplica(LocalDate fecha, TurnoSendero turnoSolicitado) {
        if (!Boolean.TRUE.equals(activo)) return false;
        if (fecha.isBefore(fechaInicio) || fecha.isAfter(fechaFin)) return false;
        if (this.turno != turnoSolicitado) return false;
        return matchesDiaSemana(fecha);
    }

    /** Legacy compatibility — delegates to aplica(). */
    public boolean estaDisponibleEn(LocalDate fecha, TurnoSendero turnoSolicitado) {
        return aplica(fecha, turnoSolicitado);
    }

    /** Returns true if this window has no day-of-week restriction, or if fecha's day matches. */
    public boolean matchesDiaSemana(LocalDate fecha) {
        if (diasSemana == null || diasSemana.isBlank()) return true;
        DayOfWeek dow = fecha.getDayOfWeek();
        return Arrays.stream(diasSemana.split(","))
                .map(String::trim)
                .map(String::toUpperCase)
                .map(DIA_MAP::get)
                .filter(Objects::nonNull)
                .anyMatch(d -> d == dow);
    }

    public boolean incluyeFecha(LocalDate fecha) {
        return !fecha.isBefore(fechaInicio) && !fecha.isAfter(fechaFin);
    }

    public boolean seSolapaCon(LocalDate inicio, LocalDate fin) {
        return !fin.isBefore(fechaInicio) && !inicio.isAfter(fechaFin);
    }

    public void asignarGuia(Guia guia) {
        SenderoDisponibilidadGuia assignment = new SenderoDisponibilidadGuia();
        assignment.setSenderoDisponibilidadId(this.id);
        assignment.setGuiaId(guia.getId());
        assignment.setSenderoDisponibilidad(this);
        assignment.setActivo(true);
        
        this.guiasAsignados.add(assignment);
    }

    public void removerGuia(UUID guiaId) {
        this.guiasAsignados.removeIf(assignment -> 
            assignment.getGuiaId().equals(guiaId));
    }

    public List<UUID> obtenerGuiaIds() {
        return guiasAsignados.stream()
                .filter(SenderoDisponibilidadGuia::getActivo)
                .map(SenderoDisponibilidadGuia::getGuiaId)
                .toList();
    }

    public void activar() {
        this.activo = true;
    }

    public void desactivar() {
        this.activo = false;
    }

    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getSenderoId() {
        return senderoId;
    }

    public void setSenderoId(UUID senderoId) {
        this.senderoId = senderoId;
    }

    public LocalDate getFechaInicio() {
        return fechaInicio;
    }

    public void setFechaInicio(LocalDate fechaInicio) {
        this.fechaInicio = fechaInicio;
    }

    public LocalDate getFechaFin() {
        return fechaFin;
    }

    public void setFechaFin(LocalDate fechaFin) {
        this.fechaFin = fechaFin;
    }

    public TurnoSendero getTurno() { return turno; }
    public void setTurno(TurnoSendero turno) {
        this.turno = turno;
        this.turnoManana = (turno == TurnoSendero.MANANA);
        this.turnoTarde  = (turno == TurnoSendero.TARDE);
    }

    public String getDiasSemana() { return diasSemana; }
    public void setDiasSemana(String diasSemana) { this.diasSemana = diasSemana; }

    public Integer getCuposTotal() { return cuposTotal != null ? cuposTotal : 8; }
    public void setCuposTotal(Integer cuposTotal) { this.cuposTotal = cuposTotal; }

    public Boolean getTurnoManana() { return turnoManana; }
    public void setTurnoManana(Boolean turnoManana) { this.turnoManana = turnoManana; }

    public Boolean getTurnoTarde() { return turnoTarde; }
    public void setTurnoTarde(Boolean turnoTarde) { this.turnoTarde = turnoTarde; }

    public Boolean getActivo() {
        return activo;
    }

    public void setActivo(Boolean activo) {
        this.activo = activo;
    }

    public LocalDateTime getFechaCreacion() {
        return fechaCreacion;
    }

    public void setFechaCreacion(LocalDateTime fechaCreacion) {
        this.fechaCreacion = fechaCreacion;
    }

    public LocalDateTime getFechaActualizacion() {
        return fechaActualizacion;
    }

    public void setFechaActualizacion(LocalDateTime fechaActualizacion) {
        this.fechaActualizacion = fechaActualizacion;
    }

    public Sendero getSendero() {
        return sendero;
    }

    public void setSendero(Sendero sendero) {
        this.sendero = sendero;
    }

    public Set<SenderoDisponibilidadGuia> getGuiasAsignados() {
        return guiasAsignados;
    }

    public void setGuiasAsignados(Set<SenderoDisponibilidadGuia> guiasAsignados) {
        this.guiasAsignados = guiasAsignados;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof SenderoDisponibilidad)) return false;
        SenderoDisponibilidad that = (SenderoDisponibilidad) o;
        return id != null && id.equals(that.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }

    @Override
    public String toString() {
        return "SenderoDisponibilidad{" +
                "id=" + id +
                ", senderoId=" + senderoId +
                ", fechaInicio=" + fechaInicio +
                ", fechaFin=" + fechaFin +
                ", turno=" + turno +
                ", diasSemana=" + diasSemana +
                ", cuposTotal=" + cuposTotal +
                ", activo=" + activo +
                '}';
    }
}
