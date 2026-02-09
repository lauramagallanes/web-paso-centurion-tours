package com.tinambu.tours.dto.response;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SesionPagoResponse {

    private UUID reservaId;
    private String codigoReserva;
    private Long requestId;
    private String processUrl;
    private String status;
    private String message;
}
