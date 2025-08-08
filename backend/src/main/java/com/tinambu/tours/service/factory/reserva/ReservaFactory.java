package com.tinambu.tours.service.factory.reserva;

import com.tinambu.tours.entity.reserva.TipoReserva;
import com.tinambu.tours.service.strategy.reserva.ReservaStrategy;
import com.tinambu.tours.service.strategy.reserva.AlojamientoReservaStrategy;
import com.tinambu.tours.service.strategy.reserva.SenderoReservaStrategy;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/**
 * Factory Pattern para crear las estrategias correctas según el tipo de reserva
 * Este factory encapsula la lógica de selección de estrategias
 */
@Component
public class ReservaFactory {

    @Autowired
    private AlojamientoReservaStrategy alojamientoReservaStrategy;

    @Autowired
    private SenderoReservaStrategy senderoReservaStrategy;

    /**
     * Obtiene la estrategia correcta según el tipo de reserva
     * 
     * @param tipoReserva El tipo de reserva (ALOJAMIENTO, SENDERO)
     * @return La estrategia específica para ese tipo de reserva
     * @throws IllegalArgumentException Si el tipo de reserva no es soportado
     */
    public ReservaStrategy getStrategy(TipoReserva tipoReserva) {
        return switch (tipoReserva) {
            case ALOJAMIENTO -> alojamientoReservaStrategy;
            case SENDERO -> senderoReservaStrategy;
            // Fácil agregar nuevos tipos en el futuro:
            // case EXCURSION -> excursionReservaStrategy;
            // case TALLER -> tallerReservaStrategy;
        };
    }

    /**
     * Método de conveniencia para obtener la estrategia desde un string
     * Útil para APIs REST donde el tipo puede venir como parámetro
     */
    public ReservaStrategy getStrategy(String tipoReservaString) {
        try {
            TipoReserva tipoReserva = TipoReserva.valueOf(tipoReservaString.toUpperCase());
            return getStrategy(tipoReserva);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException(
                String.format("Tipo de reserva '%s' no válido. Tipos soportados: %s", 
                    tipoReservaString, 
                    java.util.Arrays.toString(TipoReserva.values()))
            );
        }
    }

    /**
     * Verifica si un tipo de reserva es soportado
     */
    public boolean isTipoReservaSoportado(TipoReserva tipoReserva) {
        try {
            getStrategy(tipoReserva);
            return true;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    /**
     * Obtiene todos los tipos de reserva soportados
     */
    public TipoReserva[] getTiposReservaSoportados() {
        return TipoReserva.values();
    }

    /**
     * Obtiene información sobre las capacidades de cada tipo de reserva
     */
    public String getInformacionTiposReserva() {
        StringBuilder info = new StringBuilder();
        info.append("Tipos de reserva soportados:\n");
        
        for (TipoReserva tipo : TipoReserva.values()) {
            info.append(String.format("- %s: %s\n", tipo.name(), tipo.getDescripcion()));
        }
        
        return info.toString();
    }
}
