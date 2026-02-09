package com.tinambu.tours.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CrearSesionPagoRequest {

    @NotNull(message = "El ID de la reserva es obligatorio")
    private UUID reservaId;

    @NotNull(message = "El tipo de reserva es obligatorio")
    private String tipoReserva; // "SENDERO" or "ALOJAMIENTO"

    private String ipAddress;
    private String userAgent;
}
