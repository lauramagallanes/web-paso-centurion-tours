package com.tinambu.tours.service;

import com.tinambu.tours.dto.request.*;
import com.tinambu.tours.dto.response.*;
import com.tinambu.tours.entity.alojamiento.*;
import com.tinambu.tours.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class AlojamientoService {

    @Autowired
    private AlojamientoRepository alojamientoRepository;
    
    @Autowired
    private AlojamientoImagenRepository alojamientoImagenRepository;
    
    @Autowired
    private AlojamientoDisponibilidadRepository disponibilidadRepository;
    
    @Autowired
    private AlojamientoReservaBloqueoRepository bloqueoRepository;
    
    @Autowired
    private AlojamientoReservaRepository reservaRepository;

    // Core CRUD Operations

    public AlojamientoResponse crearAlojamiento(AlojamientoRequest request) {
        System.out.println("🏠 Creando nuevo alojamiento: " + request.getNombre());
        
        // Validation
        String validationErrors = request.getValidationErrors();
        if (!validationErrors.isEmpty()) {
            throw new IllegalArgumentException("Errores de validación: " + validationErrors);
        }

        Alojamiento alojamiento = Alojamiento.builder()
                .nombre(request.getNombre())
                .descripcion(request.getDescripcion())
                .ubicacion(request.getUbicacion())
                .capacidadMinima(request.getCapacidadMinima())
                .capacidadMaxima(request.getCapacidadMaxima())
                .cantidadCamasDobles(request.getCantidadCamasDobles())
                .cantidadLiteras(request.getCantidadLiteras())
                .horaLlegada(request.getHoraLlegada())
                .horaSalida(request.getHoraSalida())
                .precioPorNoche(request.getPrecioPorNoche())
                .activo(true)
                .build();

        alojamiento = alojamientoRepository.save(alojamiento);
        System.out.println("✅ Alojamiento creado exitosamente con ID: " + alojamiento.getId());
        
        return convertirAResponse(alojamiento);
    }

    public AlojamientoResponse actualizarAlojamiento(UUID id, AlojamientoRequest request) {
        System.out.println("🔄 Actualizando alojamiento con ID: " + id);
        
        Alojamiento alojamiento = alojamientoRepository.findByIdAndActivoTrue(id)
                .orElseThrow(() -> new RuntimeException("Alojamiento no encontrado: " + id));

        // Validation
        String validationErrors = request.getValidationErrors();
        if (!validationErrors.isEmpty()) {
            throw new IllegalArgumentException("Errores de validación: " + validationErrors);
        }

        alojamiento.setNombre(request.getNombre());
        alojamiento.setDescripcion(request.getDescripcion());
        alojamiento.setUbicacion(request.getUbicacion());
        alojamiento.setCapacidadMinima(request.getCapacidadMinima());
        alojamiento.setCapacidadMaxima(request.getCapacidadMaxima());
        alojamiento.setCantidadCamasDobles(request.getCantidadCamasDobles());
        alojamiento.setCantidadLiteras(request.getCantidadLiteras());
        alojamiento.setHoraLlegada(request.getHoraLlegada());
        alojamiento.setHoraSalida(request.getHoraSalida());
        alojamiento.setPrecioPorNoche(request.getPrecioPorNoche());

        alojamiento = alojamientoRepository.save(alojamiento);
        System.out.println("✅ Alojamiento actualizado exitosamente: " + id);
        
        return convertirAResponse(alojamiento);
    }

    @Transactional(readOnly = true)
    public List<AlojamientoResponse> obtenerAlojamientos() {
        System.out.println("📋 Obteniendo todos los alojamientos activos");
        
        List<Alojamiento> alojamientos = alojamientoRepository.findByActivoTrue();
        return alojamientos.stream()
                .map(this::convertirAResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AlojamientoResponse obtenerAlojamientoPorId(UUID id) {
        System.out.println("🔍 Obteniendo alojamiento por ID: " + id);
        
        Alojamiento alojamiento = alojamientoRepository.findByIdAndActivoTrue(id)
                .orElseThrow(() -> new RuntimeException("Alojamiento no encontrado: " + id));
        
        return convertirAResponse(alojamiento);
    }

    public void eliminarAlojamiento(UUID id) {
        System.out.println("🗑️ Eliminando alojamiento con ID: " + id);
        
        Alojamiento alojamiento = alojamientoRepository.findByIdAndActivoTrue(id)
                .orElseThrow(() -> new RuntimeException("Alojamiento no encontrado: " + id));

        // Check for active reservations
        Long reservasActivas = reservaRepository.countReservasActivas(id);
        if (reservasActivas > 0) {
            throw new IllegalStateException("No se puede eliminar el alojamiento. Tiene reservas activas.");
        }

        alojamiento.setActivo(false);
        alojamientoRepository.save(alojamiento);
        
        System.out.println("✅ Alojamiento eliminado exitosamente: " + id);
    }

    // Availability Methods

    public AlojamientoDisponibilidadResponse crearDisponibilidad(AlojamientoDisponibilidadRequest request) {
        System.out.println("📅 Creando disponibilidad para alojamiento: " + request.getAlojamientoId());
        
        // Validation
        String validationErrors = request.getValidationErrors();
        if (!validationErrors.isEmpty()) {
            throw new IllegalArgumentException("Errores de validación: " + validationErrors);
        }

        // Check for overlaps
        List<AlojamientoDisponibilidad> solapamientos = disponibilidadRepository
                .findSolapamientos(request.getAlojamientoId(), request.getFechaInicio(), request.getFechaFin());
        
        if (!solapamientos.isEmpty()) {
            throw new IllegalStateException("Ya existe disponibilidad para algunas fechas en el rango especificado");
        }

        AlojamientoDisponibilidad disponibilidad = AlojamientoDisponibilidad.builder()
                .alojamientoId(request.getAlojamientoId())
                .fechaInicio(request.getFechaInicio())
                .fechaFin(request.getFechaFin())
                .activo(true)
                .build();

        disponibilidad = disponibilidadRepository.save(disponibilidad);
        System.out.println("✅ Disponibilidad creada exitosamente: " + disponibilidad.getId());
        
        return convertirADisponibilidadResponse(disponibilidad);
    }

    public boolean verificarDisponibilidad(UUID alojamientoId, LocalDate checkIn, LocalDate checkOut) {
        System.out.println("🔍 Verificando disponibilidad para alojamiento " + alojamientoId + " del " + checkIn + " al " + checkOut);
        
        // Check if there's availability range that covers the requested dates
        boolean tieneDisponibilidad = disponibilidadRepository
                .existeDisponibilidadParaRango(alojamientoId, checkIn, checkOut);
        
        if (!tieneDisponibilidad) {
            System.out.println("❌ No hay disponibilidad configurada para las fechas solicitadas");
            return false;
        }
        
        // Check for blocks (excluding checkout date)
        boolean tieneBloqueos = bloqueoRepository.tieneBloqueoEnRango(alojamientoId, checkIn, checkOut);
        
        boolean disponible = !tieneBloqueos;
        System.out.println("✅ Disponibilidad verificada: " + (disponible ? "DISPONIBLE" : "NO DISPONIBLE"));
        
        return disponible;
    }

    // Blocking System Methods

    public void bloquearAlojamientoParaReserva(UUID alojamientoId, UUID reservaId, LocalDate checkIn, LocalDate checkOut) {
        System.out.println("🔒 Bloqueando alojamiento " + alojamientoId + " para reserva " + reservaId + " del " + checkIn + " al " + checkOut);
        
        List<AlojamientoReservaBloqueo> bloqueos = new ArrayList<>();
        LocalDate fecha = checkIn;
        
        while (fecha.isBefore(checkOut)) { // Exclude checkout date
            AlojamientoReservaBloqueo bloqueo = AlojamientoReservaBloqueo.builder()
                    .alojamientoId(alojamientoId)
                    .reservaId(reservaId)
                    .fecha(fecha)
                    .activo(true)
                    .build();
            
            bloqueos.add(bloqueo);
            fecha = fecha.plusDays(1);
        }
        
        bloqueoRepository.saveAll(bloqueos);
        System.out.println("✅ Alojamiento bloqueado exitosamente: " + bloqueos.size() + " bloqueos creados");
    }

    public void desbloquearAlojamientoDeReserva(UUID reservaId) {
        System.out.println("🔓 Desbloqueando alojamiento para reserva: " + reservaId);
        
        bloqueoRepository.desactivarBloqueosPorReserva(reservaId);
        System.out.println("✅ Alojamiento desbloqueado exitosamente para reserva: " + reservaId);
    }

    // Conversion Methods

    private AlojamientoResponse convertirAResponse(Alojamiento alojamiento) {
        List<AlojamientoImagen> imagenes = alojamientoImagenRepository
                .findByAlojamientoIdOrdenadaPorPrincipal(alojamiento.getId());
        
        List<AlojamientoImagenResponse> imagenesResponse = imagenes.stream()
                .map(this::convertirAImagenResponse)
                .collect(Collectors.toList());

        return AlojamientoResponse.builder()
                .id(alojamiento.getId())
                .nombre(alojamiento.getNombre())
                .descripcion(alojamiento.getDescripcion())
                .ubicacion(alojamiento.getUbicacion())
                .capacidadMinima(alojamiento.getCapacidadMinima())
                .capacidadMaxima(alojamiento.getCapacidadMaxima())
                .cantidadCamasDobles(alojamiento.getCantidadCamasDobles())
                .cantidadLiteras(alojamiento.getCantidadLiteras())
                .horaLlegada(alojamiento.getHoraLlegada())
                .horaSalida(alojamiento.getHoraSalida())
                .precioPorNoche(alojamiento.getPrecioPorNoche())
                .imagenPrincipal(alojamiento.getImagenPrincipalUrl())
                .activo(alojamiento.getActivo())
                .fechaCreacion(alojamiento.getFechaCreacion())
                .fechaActualizacion(alojamiento.getFechaActualizacion())
                .imagenes(imagenesResponse)
                .totalImagenes(imagenesResponse.size())
                .tieneGaleria(imagenesResponse.size() > 1)
                .build();
    }

    private AlojamientoImagenResponse convertirAImagenResponse(AlojamientoImagen imagen) {
        return AlojamientoImagenResponse.builder()
                .id(imagen.getId())
                .url(imagen.getUrlImagen())
                .descripcion(imagen.getDescripcion())
                .orden(imagen.getOrden())
                .esPrincipal(imagen.getEsPrincipal())
                .fechaSubida(imagen.getFechaSubida())
                .alojamientoId(imagen.getAlojamientoId())
                .build();
    }

    private AlojamientoDisponibilidadResponse convertirADisponibilidadResponse(AlojamientoDisponibilidad disponibilidad) {
        return AlojamientoDisponibilidadResponse.builder()
                .id(disponibilidad.getId())
                .alojamientoId(disponibilidad.getAlojamientoId())
                .fechaInicio(disponibilidad.getFechaInicio())
                .fechaFin(disponibilidad.getFechaFin())
                .activo(disponibilidad.getActivo())
                .build();
    }
}