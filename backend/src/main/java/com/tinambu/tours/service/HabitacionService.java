package com.tinambu.tours.service;

import com.tinambu.tours.entity.habitacion.Habitacion;
import com.tinambu.tours.repository.HabitacionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class HabitacionService {

    @Autowired
    private HabitacionRepository habitacionRepository;

    /**
     * Crear nueva habitación
     */
    public Habitacion crearHabitacion(Habitacion habitacion) {
        // Validar que el número no esté duplicado
        if (habitacionRepository.existsByNumero(habitacion.getNumero())) {
            throw new IllegalArgumentException("Ya existe una habitación con el número: " + habitacion.getNumero());
        }

        return habitacionRepository.save(habitacion);
    }

    /**
     * Actualizar habitación existente
     */
    public Habitacion actualizarHabitacion(UUID id, Habitacion habitacionActualizada) {
        Habitacion habitacion = obtenerHabitacionPorId(id);

        // Verificar si cambió el número y si ya existe
        if (!habitacion.getNumero().equals(habitacionActualizada.getNumero()) &&
            habitacionRepository.existsByNumero(habitacionActualizada.getNumero())) {
            throw new IllegalArgumentException("Ya existe una habitación con el número: " + habitacionActualizada.getNumero());
        }

        // Actualizar campos
        habitacion.setNumero(habitacionActualizada.getNumero());
        habitacion.setNombre(habitacionActualizada.getNombre());
        habitacion.setDescripcion(habitacionActualizada.getDescripcion());
        habitacion.setCapacidadMinima(habitacionActualizada.getCapacidadMinima());
        habitacion.setCapacidadMaxima(habitacionActualizada.getCapacidadMaxima());
        habitacion.setPrecioPorPersonaNoche(habitacionActualizada.getPrecioPorPersonaNoche());
        habitacion.setUrlImagen(habitacionActualizada.getUrlImagen());

        return habitacionRepository.save(habitacion);
    }

    /**
     * Activar/desactivar habitación
     */
    public Habitacion cambiarEstadoHabitacion(UUID id, boolean activa) {
        Habitacion habitacion = obtenerHabitacionPorId(id);
        habitacion.setActiva(activa);
        return habitacionRepository.save(habitacion);
    }

    /**
     * Buscar habitaciones disponibles
     */
    @Transactional(readOnly = true)
    public List<Habitacion> buscarHabitacionesDisponibles(LocalDate fechaInicio, LocalDate fechaFin, Integer numeroPersonas) {
        return habitacionRepository.findHabitacionesDisponibles(fechaInicio, fechaFin, numeroPersonas);
    }

    /**
     * Verificar disponibilidad de habitación específica
     */
    @Transactional(readOnly = true)
    public boolean verificarDisponibilidad(UUID habitacionId, LocalDate fechaInicio, LocalDate fechaFin) {
        return habitacionRepository.isHabitacionDisponible(habitacionId, fechaInicio, fechaFin);
    }

    /**
     * Buscar habitaciones por capacidad
     */
    @Transactional(readOnly = true)
    public List<Habitacion> buscarPorCapacidad(Integer numeroPersonas) {
        return habitacionRepository.findByCapacidadPersonas(numeroPersonas);
    }

    /**
     * Buscar habitaciones por rango de precios
     */
    @Transactional(readOnly = true)
    public List<Habitacion> buscarPorRangoPrecio(BigDecimal precioMin, BigDecimal precioMax) {
        return habitacionRepository.findByRangoPrecio(precioMin, precioMax);
    }

    // Métodos de consulta básicos
    @Transactional(readOnly = true)
    public Habitacion obtenerHabitacionPorId(UUID id) {
        return habitacionRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Habitación no encontrada"));
    }

    @Transactional(readOnly = true)
    public Habitacion obtenerHabitacionPorNumero(String numero) {
        return habitacionRepository.findByNumero(numero)
            .orElseThrow(() -> new IllegalArgumentException("Habitación no encontrada con número: " + numero));
    }

    @Transactional(readOnly = true)
    public List<Habitacion> obtenerTodasLasHabitaciones() {
        return habitacionRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<Habitacion> obtenerHabitacionesActivas() {
        return habitacionRepository.findByActivaTrue();
    }

    @Transactional(readOnly = true)
    public List<Habitacion> obtenerHabitacionesOrdenadasPorCapacidad() {
        return habitacionRepository.findAllOrderByCapacidad();
    }

    @Transactional(readOnly = true)
    public long contarHabitacionesActivas() {
        return habitacionRepository.countByActivaTrue();
    }

    /**
     * Eliminar habitación (soft delete - desactivar)
     */
    public void eliminarHabitacion(UUID id) {
        cambiarEstadoHabitacion(id, false);
    }

    /**
     * Obtener estadísticas básicas de habitaciones
     */
    @Transactional(readOnly = true)
    public HabitacionStats obtenerEstadisticas() {
        long totalHabitaciones = habitacionRepository.count();
        long habitacionesActivas = habitacionRepository.countByActivaTrue();
        
        List<Habitacion> habitaciones = habitacionRepository.findByActivaTrue();
        
        int capacidadTotalMinima = habitaciones.stream()
            .mapToInt(Habitacion::getCapacidadMinima)
            .sum();
            
        int capacidadTotalMaxima = habitaciones.stream()
            .mapToInt(Habitacion::getCapacidadMaxima)
            .sum();

        BigDecimal precioPromedio = habitaciones.stream()
            .map(Habitacion::getPrecioPorPersonaNoche)
            .reduce(BigDecimal.ZERO, BigDecimal::add)
            .divide(BigDecimal.valueOf(Math.max(1, habitaciones.size())), 2, java.math.RoundingMode.HALF_UP);

        return new HabitacionStats(totalHabitaciones, habitacionesActivas, 
                                 capacidadTotalMinima, capacidadTotalMaxima, precioPromedio);
    }

    // Clase interna para estadísticas
    public static class HabitacionStats {
        private final long totalHabitaciones;
        private final long habitacionesActivas;
        private final int capacidadTotalMinima;
        private final int capacidadTotalMaxima;
        private final BigDecimal precioPromedio;

        public HabitacionStats(long totalHabitaciones, long habitacionesActivas, 
                             int capacidadTotalMinima, int capacidadTotalMaxima, 
                             BigDecimal precioPromedio) {
            this.totalHabitaciones = totalHabitaciones;
            this.habitacionesActivas = habitacionesActivas;
            this.capacidadTotalMinima = capacidadTotalMinima;
            this.capacidadTotalMaxima = capacidadTotalMaxima;
            this.precioPromedio = precioPromedio;
        }

        // Getters
        public long getTotalHabitaciones() { return totalHabitaciones; }
        public long getHabitacionesActivas() { return habitacionesActivas; }
        public int getCapacidadTotalMinima() { return capacidadTotalMinima; }
        public int getCapacidadTotalMaxima() { return capacidadTotalMaxima; }
        public BigDecimal getPrecioPromedio() { return precioPromedio; }
    }
}
