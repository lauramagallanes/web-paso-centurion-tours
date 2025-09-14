package com.tinambu.tours.entity.guia;

import com.tinambu.tours.entity.sendero.Sendero;
import com.tinambu.tours.entity.sendero.TurnoSendero;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "guias")
public class Guia {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    @NotBlank(message = "Nombre del guía es obligatorio")
    private String nombre;

    @Column(nullable = false)
    @NotBlank(message = "Apellido del guía es obligatorio")
    private String apellido;

    @Column(unique = true)
    @Email(message = "Email debe tener formato válido")
    private String email;

    @Column(columnDefinition = "TEXT")
    private String biografia;

    @Column(name = "anos_experiencia")
    private Integer anosExperiencia;

    @Column(name = "especialidades")
    private String especialidades; // e.g., "Aves, Mamíferos, Botánica"

    @Column(name = "url_foto")
    private String urlFoto;

    @Column(name = "tarifa_especial", precision = 10, scale = 2)
    private BigDecimal tarifaEspecial;

    @Column(name = "activo", nullable = false)
    private Boolean activo = true;

    @Column(name = "fecha_creacion", nullable = false)
    private LocalDateTime fechaCreacion = LocalDateTime.now();

    @Column(name = "fecha_actualizacion")
    private LocalDateTime fechaActualizacion;

    // Relationships - temporarily commented out to fix mapping inconsistency
    // @JsonIgnore
    // @ManyToMany(mappedBy = "guiasAsignados")
    // private Set<Sendero> senderosAsignados = new HashSet<>();

    // Constructors
    public Guia() {}

    public Guia(String nombre, String apellido, String email) {
        this.nombre = nombre;
        this.apellido = apellido;
        this.email = email;
    }

    // Business Methods
    public String getNombreCompleto() {
        return nombre + " " + apellido;
    }

    public boolean esExpertoEn(String especialidad) {
        return especialidades != null && 
               especialidades.toLowerCase().contains(especialidad.toLowerCase());
    }

    // New business methods for sendero relationships - temporarily disabled
    // public boolean puedeGuiar(Sendero sendero) {
    //     if (!activo || sendero == null || !sendero.getActivo()) return false;
    //     return senderosAsignados.contains(sendero);
    // }

    public boolean estaDisponibleEn(LocalDate fecha, TurnoSendero turno) {
        // This would need to check against GuiaReservaBloqueo table
        // For now, return true if active
        return activo;
    }

    public boolean tieneTarifaEspecial() {
        return tarifaEspecial != null && tarifaEspecial.compareTo(BigDecimal.ZERO) > 0;
    }

    public BigDecimal obtenerTarifa() {
        return tieneTarifaEspecial() ? tarifaEspecial : BigDecimal.ZERO;
    }

    @PreUpdate
    public void preUpdate() {
        this.fechaActualizacion = LocalDateTime.now();
    }

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getApellido() { return apellido; }
    public void setApellido(String apellido) { this.apellido = apellido; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getBiografia() { return biografia; }
    public void setBiografia(String biografia) { this.biografia = biografia; }

    public Integer getAnosExperiencia() { return anosExperiencia; }
    public void setAnosExperiencia(Integer anosExperiencia) { this.anosExperiencia = anosExperiencia; }

    public String getEspecialidades() { return especialidades; }
    public void setEspecialidades(String especialidades) { this.especialidades = especialidades; }

    public String getUrlFoto() { return urlFoto; }
    public void setUrlFoto(String urlFoto) { this.urlFoto = urlFoto; }

    public BigDecimal getTarifaEspecial() { return tarifaEspecial; }
    public void setTarifaEspecial(BigDecimal tarifaEspecial) { this.tarifaEspecial = tarifaEspecial; }

    // COMMENTED FOR COMPATIBILITY - temporarily disabled to fix mapping inconsistency
    // public Set<Sendero> getSenderosAsignados() { return senderosAsignados; }
    // public void setSenderosAsignados(Set<Sendero> senderosAsignados) { this.senderosAsignados = senderosAsignados; }

    public Boolean getActivo() { return activo; }
    public void setActivo(Boolean activo) { this.activo = activo; }

    public LocalDateTime getFechaCreacion() { return fechaCreacion; }
    public void setFechaCreacion(LocalDateTime fechaCreacion) { this.fechaCreacion = fechaCreacion; }

    public LocalDateTime getFechaActualizacion() { return fechaActualizacion; }
    public void setFechaActualizacion(LocalDateTime fechaActualizacion) { this.fechaActualizacion = fechaActualizacion; }
}
