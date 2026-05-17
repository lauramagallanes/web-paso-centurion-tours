package com.tinambu.tours.entity.alojamiento;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "alojamiento_reserva_bloqueos")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(callSuper = false)
public class AlojamientoReservaBloqueo {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "alojamiento_id", nullable = false)
    private UUID alojamientoId;

    @Column(name = "reserva_id", nullable = true)
    private UUID reservaId;

    @Column(name = "carrito_usuario_id")
    private UUID carritoUsuarioId;

    @Column(name = "carrito_expira_en")
    private LocalDateTime carritoExpiraEn;

    @Column(nullable = false)
    private LocalDate fecha;

    @Builder.Default
    private Boolean activo = true;

    @Column(name = "fecha_creacion")
    private LocalDateTime fechaCreacion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "alojamiento_id", insertable = false, updatable = false)  
    private Alojamiento alojamiento;
    
    // Note: Reserva relationship temporarily removed to avoid circular dependency

    @PrePersist
    protected void onCreate() {
        fechaCreacion = LocalDateTime.now();
    }

    // Business Methods
    public boolean estaActivoPara(LocalDate fechaConsulta) {
        return activo && fecha.equals(fechaConsulta);
    }

    public void desactivar() {
        this.activo = false;
    }

    public void activar() {
        this.activo = true;
    }

    public boolean perteneceAReserva(UUID idReserva) {
        return reservaId != null && reservaId.equals(idReserva);
    }
}
