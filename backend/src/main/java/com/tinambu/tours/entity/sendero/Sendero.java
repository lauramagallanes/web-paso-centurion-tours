package com.tinambu.tours.entity.sendero;

import com.tinambu.tours.entity.guia.Guia;
import com.tinambu.tours.entity.guia.GuiaReservaBloqueo;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Entity
@Table(name = "senderos")
public class Sendero {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    @NotBlank(message = "Nombre del sendero es obligatorio")
    private String nombre;

    @Column(columnDefinition = "TEXT")
    private String descripcion;

    @Column(name = "duracion_horas", nullable = false)
    @DecimalMin(value = "0.5", message = "Duración debe ser al menos 0.5 horas")
    private BigDecimal duracionHoras;

    @Column(name = "nivel_dificultad", nullable = false)
    @Enumerated(EnumType.STRING)
    private NivelDificultad nivelDificultad;

    @Column(name = "capacidad_maxima_grupo", nullable = false)
    @Min(value = 1, message = "Capacidad máxima debe ser al menos 1")
    private Integer capacidadMaximaGrupo = 8;

    @Column(name = "precio_por_persona", nullable = false, precision = 10, scale = 2)
    @DecimalMin(value = "0.0", inclusive = false, message = "Precio debe ser mayor a 0")
    private BigDecimal precioPorPersona;

    @Column(name = "url_imagen")
    private String urlImagen;

    // New fields for multiple images
    @Column(name = "imagen_principal", length = 512)
    private String imagenPrincipal;

    @Column(name = "galeria")
    private Boolean galeria = false;

    // New fields for guide requirements
    @Column(name = "requiere_guia_especializado")
    private Boolean requiereGuiaEspecializado = false;

    @Column(name = "activo", nullable = false)
    private Boolean activo = true;

    @Column(name = "fecha_creacion", nullable = false)
    private LocalDateTime fechaCreacion = LocalDateTime.now();

    @Column(name = "fecha_actualizacion")
    private LocalDateTime fechaActualizacion;

    // Relationships
    @JsonIgnore
    @OneToMany(mappedBy = "sendero", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<SenderoImagen> imagenes = new HashSet<>();

    @JsonIgnore
    @OneToMany(mappedBy = "sendero", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<SenderoDisponibilidad> disponibilidades = new HashSet<>();

    @JsonIgnore
    @ManyToMany
    @JoinTable(
        name = "sendero_guias_asignados",
        joinColumns = @JoinColumn(name = "sendero_id"),
        inverseJoinColumns = @JoinColumn(name = "guia_id")
    )
    private Set<Guia> guiasAsignados = new HashSet<>();

    // Constructors
    public Sendero() {}

    public Sendero(String nombre, String descripcion, BigDecimal duracionHoras, 
                   NivelDificultad nivelDificultad, BigDecimal precioPorPersona) {
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.duracionHoras = duracionHoras;
        this.nivelDificultad = nivelDificultad;
        this.precioPorPersona = precioPorPersona;
    }

    // Business Methods
    public boolean puedeAcomodarGrupo(int numeroPersonas) {
        return numeroPersonas > 0 && numeroPersonas <= capacidadMaximaGrupo;
    }

    public BigDecimal calcularPrecioTotal(int numeroPersonas) {
        if (!puedeAcomodarGrupo(numeroPersonas)) {
            throw new IllegalArgumentException(
                String.format("Sendero %s no puede acomodar %d personas (máximo: %d)", 
                    nombre, numeroPersonas, capacidadMaximaGrupo)
            );
        }
        return precioPorPersona.multiply(BigDecimal.valueOf(numeroPersonas));
    }

    // New pricing methods with adult/children discounts
    public BigDecimal calcularPrecioConDescuentos(int adultos, int ninos) {
        if (adultos < 0 || ninos < 0) {
            throw new IllegalArgumentException("Número de personas no puede ser negativo");
        }
        
        if (adultos == 0 && ninos > 0) {
            throw new IllegalArgumentException("Debe haber al menos un adulto para reservar");
        }

        BigDecimal precioAdultos = precioPorPersona.multiply(BigDecimal.valueOf(adultos));
        
        // 30% discount for children under 12
        BigDecimal descuentoNinos = BigDecimal.valueOf(0.30);
        BigDecimal precioNinos = precioPorPersona
            .multiply(BigDecimal.valueOf(ninos))
            .multiply(BigDecimal.ONE.subtract(descuentoNinos));
        
        return precioAdultos.add(precioNinos).setScale(2, RoundingMode.HALF_UP);
    }

    public BigDecimal calcularDescuentoGrupo(int totalPersonas) {
        // 10% discount for groups over 10
        if (totalPersonas > 10) {
            return BigDecimal.valueOf(0.10);
        }
        return BigDecimal.ZERO;
    }

    // Image management methods
    public void agregarImagen(String url, String descripcion, Integer orden) {
        SenderoImagen imagen = new SenderoImagen(this.id, url, descripcion, orden);
        this.imagenes.add(imagen);
        
        // If it's the first image, set as main
        if (this.imagenPrincipal == null || this.imagenes.size() == 1) {
            this.imagenPrincipal = url;
            imagen.marcarComoPrincipal();
        }
        
        this.galeria = this.imagenes.size() > 1;
    }

    public void establecerImagenPrincipal(String url) {
        // Unmark previous main image
        this.imagenes.forEach(img -> img.desmarcarComoPrincipal());
        
        // Mark new main image
        this.imagenes.stream()
            .filter(img -> img.getUrlImagen().equals(url))
            .findFirst()
            .ifPresent(img -> {
                img.marcarComoPrincipal();
                this.imagenPrincipal = url;
            });
    }

    public List<SenderoImagen> obtenerImagenesOrdenadas() {
        return imagenes.stream()
            .sorted(Comparator.comparing(SenderoImagen::getOrden))
            .collect(Collectors.toList());
    }

    public boolean tieneImagenes() {
        return !imagenes.isEmpty();
    }

    public int getTotalImagenes() {
        return imagenes.size();
    }

    // Guide management methods
    public void asignarGuia(Guia guia) {
        if (guia == null) {
            throw new IllegalArgumentException("Guía no puede ser null");
        }
        this.guiasAsignados.add(guia);
        guia.getSenderosAsignados().add(this);
    }

    public void removerGuia(Guia guia) {
        if (guia == null) return;
        this.guiasAsignados.remove(guia);
        guia.getSenderosAsignados().remove(this);
    }

    public boolean puedeSerGuiadoPor(Guia guia) {
        if (guia == null || !guia.getActivo()) return false;
        return this.guiasAsignados.contains(guia);
    }

    public List<Guia> obtenerGuiasActivos() {
        return guiasAsignados.stream()
            .filter(guia -> guia.getActivo())
            .collect(Collectors.toList());
    }

    // Availability methods
    public void agregarDisponibilidad(LocalDate inicio, LocalDate fin, 
                                    boolean manana, boolean tarde, List<Guia> guias) {
        SenderoDisponibilidad disponibilidad = new SenderoDisponibilidad(
            this.id, inicio, fin, manana, tarde);
        
        if (guias != null) {
            guias.forEach(disponibilidad::asignarGuia);
        }
        
        this.disponibilidades.add(disponibilidad);
    }

    public boolean estaDisponibleEn(LocalDate fecha, TurnoSendero turno) {
        return disponibilidades.stream()
            .filter(d -> d.getActivo())
            .anyMatch(d -> d.estaDisponibleEn(fecha, turno));
    }

    public List<Guia> obtenerGuiasDisponiblesEn(LocalDate fecha, TurnoSendero turno, 
                                               List<GuiaReservaBloqueo> bloqueos) {
        // Get guides assigned to availability ranges for this date/shift
        List<UUID> guiasAsignados = disponibilidades.stream()
            .filter(d -> d.getActivo() && d.estaDisponibleEn(fecha, turno))
            .flatMap(d -> d.obtenerGuiaIds().stream())
            .distinct()
            .collect(Collectors.toList());

        // Filter out blocked guides
        Set<UUID> guiasBloqueados = bloqueos.stream()
            .filter(b -> b.getActivo() && 
                        b.getFecha().equals(fecha) && 
                        b.getTurno().equals(turno))
            .map(GuiaReservaBloqueo::getGuiaId)
            .collect(Collectors.toSet());

        return this.guiasAsignados.stream()
            .filter(g -> g.getActivo() && 
                        guiasAsignados.contains(g.getId()) &&
                        !guiasBloqueados.contains(g.getId()))
            .collect(Collectors.toList());
    }

    @PreUpdate
    public void preUpdate() {
        this.fechaActualizacion = LocalDateTime.now();
    }

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    // New getters and setters
    public String getImagenPrincipal() { return imagenPrincipal; }
    public void setImagenPrincipal(String imagenPrincipal) { this.imagenPrincipal = imagenPrincipal; }

    public Boolean getGaleria() { return galeria; }
    public void setGaleria(Boolean galeria) { this.galeria = galeria; }

    public Boolean getRequiereGuiaEspecializado() { return requiereGuiaEspecializado; }
    public void setRequiereGuiaEspecializado(Boolean requiereGuiaEspecializado) { this.requiereGuiaEspecializado = requiereGuiaEspecializado; }

    // Relationship getters and setters
    public Set<SenderoImagen> getImagenes() { return imagenes; }
    public void setImagenes(Set<SenderoImagen> imagenes) { this.imagenes = imagenes; }

    public Set<SenderoDisponibilidad> getDisponibilidades() { return disponibilidades; }
    public void setDisponibilidades(Set<SenderoDisponibilidad> disponibilidades) { this.disponibilidades = disponibilidades; }

    public Set<Guia> getGuiasAsignados() { return guiasAsignados; }
    public void setGuiasAsignados(Set<Guia> guiasAsignados) { this.guiasAsignados = guiasAsignados; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }

    public BigDecimal getDuracionHoras() { return duracionHoras; }
    public void setDuracionHoras(BigDecimal duracionHoras) { this.duracionHoras = duracionHoras; }

    public NivelDificultad getNivelDificultad() { return nivelDificultad; }
    public void setNivelDificultad(NivelDificultad nivelDificultad) { this.nivelDificultad = nivelDificultad; }

    public Integer getCapacidadMaximaGrupo() { return capacidadMaximaGrupo; }
    public void setCapacidadMaximaGrupo(Integer capacidadMaximaGrupo) { this.capacidadMaximaGrupo = capacidadMaximaGrupo; }

    public BigDecimal getPrecioPorPersona() { return precioPorPersona; }
    public void setPrecioPorPersona(BigDecimal precioPorPersona) { this.precioPorPersona = precioPorPersona; }

    public String getUrlImagen() { return urlImagen; }
    public void setUrlImagen(String urlImagen) { this.urlImagen = urlImagen; }

    public Boolean getActivo() { return activo; }
    public void setActivo(Boolean activo) { this.activo = activo; }

    public LocalDateTime getFechaCreacion() { return fechaCreacion; }
    public void setFechaCreacion(LocalDateTime fechaCreacion) { this.fechaCreacion = fechaCreacion; }

    public LocalDateTime getFechaActualizacion() { return fechaActualizacion; }
    public void setFechaActualizacion(LocalDateTime fechaActualizacion) { this.fechaActualizacion = fechaActualizacion; }
}
