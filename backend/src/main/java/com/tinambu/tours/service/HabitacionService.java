package com.tinambu.tours.service;

import com.tinambu.tours.dto.request.HabitacionRequest;
import com.tinambu.tours.dto.response.HabitacionResponse;
import com.tinambu.tours.entity.habitacion.Habitacion;
import com.tinambu.tours.repository.HabitacionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class HabitacionService {

    @Autowired
    private HabitacionRepository habitacionRepository;

    /**
     * Crear nueva habitación
     */
    public HabitacionResponse crearHabitacion(HabitacionRequest habitacionRequest) {
        // Validar que el número no esté duplicado
        if (habitacionRepository.existsByNumero(habitacionRequest.getNumero())) {
            throw new IllegalArgumentException("Ya existe una habitación con el número: " + habitacionRequest.getNumero());
        }

        Habitacion habitacion = convertirRequestAEntidad(habitacionRequest);
        Habitacion habitacionGuardada = habitacionRepository.save(habitacion);
        return convertirEntidadAResponse(habitacionGuardada);
    }

    /**
     * Actualizar habitación existente
     */
    public HabitacionResponse actualizarHabitacion(UUID id, HabitacionRequest habitacionRequest) {
        Habitacion habitacion = obtenerHabitacionPorId(id);

        // Verificar si cambió el número y si ya existe
        if (!habitacion.getNumero().equals(habitacionRequest.getNumero()) &&
            habitacionRepository.existsByNumero(habitacionRequest.getNumero())) {
            throw new IllegalArgumentException("Ya existe una habitación con el número: " + habitacionRequest.getNumero());
        }

        // Actualizar campos
        habitacion.setNumero(habitacionRequest.getNumero());
        habitacion.setNombre(habitacionRequest.getNombre());
        habitacion.setDescripcion(habitacionRequest.getDescripcion());
        habitacion.setCapacidadMinima(habitacionRequest.getCapacidadMinima());
        habitacion.setCapacidadMaxima(habitacionRequest.getCapacidadMaxima());
        habitacion.setPrecioPorPersonaNoche(habitacionRequest.getPrecioPorPersonaNoche());
        habitacion.setUrlImagen(habitacionRequest.getUrlImagen());

        Habitacion habitacionActualizada = habitacionRepository.save(habitacion);
        return convertirEntidadAResponse(habitacionActualizada);
    }

    /**
     * Activar/desactivar habitación
     */
    public HabitacionResponse cambiarEstadoHabitacion(UUID id, boolean activa) {
        Habitacion habitacion = obtenerHabitacionPorId(id);
        habitacion.setActiva(activa);
        Habitacion habitacionActualizada = habitacionRepository.save(habitacion);
        return convertirEntidadAResponse(habitacionActualizada);
    }

    /**
     * Buscar habitaciones disponibles
     */
    @Transactional(readOnly = true)
    public List<HabitacionResponse> buscarHabitacionesDisponibles(LocalDate fechaInicio, LocalDate fechaFin, Integer numeroPersonas) {
        List<Habitacion> habitaciones = habitacionRepository.findHabitacionesDisponibles(fechaInicio, fechaFin, numeroPersonas);
        return habitaciones.stream()
                .map(this::convertirEntidadAResponse)
                .collect(Collectors.toList());
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
    public List<HabitacionResponse> buscarPorCapacidad(Integer numeroPersonas) {
        List<Habitacion> habitaciones = habitacionRepository.findByCapacidadPersonas(numeroPersonas);
        return habitaciones.stream()
                .map(this::convertirEntidadAResponse)
                .collect(Collectors.toList());
    }

    /**
     * Buscar habitaciones por rango de precios
     */
    @Transactional(readOnly = true)
    public List<HabitacionResponse> buscarPorRangoPrecio(BigDecimal precioMin, BigDecimal precioMax) {
        List<Habitacion> habitaciones = habitacionRepository.findByRangoPrecio(precioMin, precioMax);
        return habitaciones.stream()
                .map(this::convertirEntidadAResponse)
                .collect(Collectors.toList());
    }

    // Métodos de consulta básicos
    @Transactional(readOnly = true)
    public HabitacionResponse obtenerHabitacionPorIdPublico(UUID id) {
        Habitacion habitacion = obtenerHabitacionPorId(id);
        return convertirEntidadAResponse(habitacion);
    }

    // Método interno para obtener entidad (usado internamente por el servicio)
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
    public List<HabitacionResponse> obtenerTodasLasHabitaciones() {
        List<Habitacion> habitaciones = habitacionRepository.findAll();
        return habitaciones.stream()
                .map(this::convertirEntidadAResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<HabitacionResponse> obtenerHabitacionesActivas() {
        List<Habitacion> habitaciones = habitacionRepository.findByActivaTrue();
        return habitaciones.stream()
                .map(this::convertirEntidadAResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<HabitacionResponse> obtenerHabitacionesOrdenadasPorCapacidad() {
        List<Habitacion> habitaciones = habitacionRepository.findAllOrderByCapacidad();
        return habitaciones.stream()
                .map(this::convertirEntidadAResponse)
                .collect(Collectors.toList());
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

    // ========== MÉTODOS DE CONVERSIÓN ==========

    /**
     * Convierte un HabitacionRequest DTO a entidad Habitacion
     */
    private Habitacion convertirRequestAEntidad(HabitacionRequest request) {
        Habitacion habitacion = new Habitacion();
        habitacion.setNumero(request.getNumero());
        habitacion.setNombre(request.getNombre());
        habitacion.setDescripcion(request.getDescripcion());
        habitacion.setCapacidadMinima(request.getCapacidadMinima());
        habitacion.setCapacidadMaxima(request.getCapacidadMaxima());
        habitacion.setPrecioPorPersonaNoche(request.getPrecioPorPersonaNoche());
        habitacion.setUrlImagen(request.getUrlImagen());
        return habitacion;
    }

    /**
     * Convierte una entidad Habitacion a HabitacionResponse DTO
     * Excluye información interna como estado activo y fechas de auditoría
     */
    private HabitacionResponse convertirEntidadAResponse(Habitacion habitacion) {
        HabitacionResponse response = new HabitacionResponse();
        response.setId(habitacion.getId());
        response.setNumero(habitacion.getNumero());
        response.setNombre(habitacion.getNombre());
        response.setDescripcion(habitacion.getDescripcion());
        response.setCapacidadMinima(habitacion.getCapacidadMinima());
        response.setCapacidadMaxima(habitacion.getCapacidadMaxima());
        response.setPrecioPorPersonaNoche(habitacion.getPrecioPorPersonaNoche());
        response.setUrlImagen(habitacion.getUrlImagen());
        return response;
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
