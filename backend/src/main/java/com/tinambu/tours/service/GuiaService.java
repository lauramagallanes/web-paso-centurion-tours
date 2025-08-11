package com.tinambu.tours.service;

import com.tinambu.tours.dto.request.GuiaRequest;
import com.tinambu.tours.dto.response.GuiaResponse;
import com.tinambu.tours.entity.guia.Guia;
import com.tinambu.tours.entity.reserva.TurnoSendero;
import com.tinambu.tours.repository.GuiaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class GuiaService {

    @Autowired
    private GuiaRepository guiaRepository;

    /**
     * Crear nuevo guía
     */
    public GuiaResponse crearGuia(GuiaRequest guiaRequest) {
        // Validar que el email no esté duplicado (si se proporciona)
        if (guiaRequest.getEmail() != null && guiaRepository.findByEmail(guiaRequest.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Ya existe un guía con el email: " + guiaRequest.getEmail());
        }

        Guia guia = convertirRequestAEntidad(guiaRequest);
        Guia guiaGuardado = guiaRepository.save(guia);
        return convertirEntidadAResponse(guiaGuardado);
    }

    /**
     * Actualizar guía existente
     */
    public GuiaResponse actualizarGuia(UUID id, GuiaRequest guiaRequest) {
        Guia guia = obtenerGuiaPorId(id);

        // Verificar si cambió el email y si ya existe
        if (guiaRequest.getEmail() != null && 
            !guiaRequest.getEmail().equals(guia.getEmail()) &&
            guiaRepository.findByEmail(guiaRequest.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Ya existe un guía con el email: " + guiaRequest.getEmail());
        }

        // Actualizar campos
        guia.setNombre(guiaRequest.getNombre());
        guia.setApellido(guiaRequest.getApellido());
        guia.setEmail(guiaRequest.getEmail());
        guia.setBiografia(guiaRequest.getBiografia());
        guia.setAnosExperiencia(guiaRequest.getAnosExperiencia());
        guia.setEspecialidades(guiaRequest.getEspecialidades());
        guia.setUrlFoto(guiaRequest.getUrlFoto());

        Guia guiaActualizado = guiaRepository.save(guia);
        return convertirEntidadAResponse(guiaActualizado);
    }

    /**
     * Activar/desactivar guía
     */
    public GuiaResponse cambiarEstadoGuia(UUID id, boolean activo) {
        Guia guia = obtenerGuiaPorId(id);
        guia.setActivo(activo);
        Guia guiaActualizado = guiaRepository.save(guia);
        return convertirEntidadAResponse(guiaActualizado);
    }

    /**
     * Buscar guías disponibles para una fecha y turno específicos
     */
    @Transactional(readOnly = true)
    public List<GuiaResponse> buscarGuiasDisponibles(LocalDate fecha, TurnoSendero turno) {
        List<Guia> guias = guiaRepository.findGuiasDisponibles(fecha, turno);
        return guias.stream()
                .map(this::convertirEntidadAResponse)
                .collect(Collectors.toList());
    }

    /**
     * Verificar si un guía específico está disponible
     */
    @Transactional(readOnly = true)
    public boolean verificarDisponibilidad(UUID guiaId, LocalDate fecha, TurnoSendero turno) {
        return guiaRepository.isGuiaDisponible(guiaId, fecha, turno);
    }

    /**
     * Buscar guías por especialidad
     */
    @Transactional(readOnly = true)
    public List<GuiaResponse> buscarPorEspecialidad(String especialidad) {
        List<Guia> guias = guiaRepository.findByEspecialidadContaining(especialidad);
        return guias.stream()
                .map(this::convertirEntidadAResponse)
                .collect(Collectors.toList());
    }

    /**
     * Buscar guías por años de experiencia mínima
     */
    @Transactional(readOnly = true)
    public List<GuiaResponse> buscarPorExperienciaMinima(Integer anosMinimos) {
        List<Guia> guias = guiaRepository.findByAnosExperienciaMinima(anosMinimos);
        return guias.stream()
                .map(this::convertirEntidadAResponse)
                .collect(Collectors.toList());
    }

    /**
     * Buscar guías por nombre
     */
    @Transactional(readOnly = true)
    public List<GuiaResponse> buscarPorNombre(String nombre) {
        List<Guia> guias = guiaRepository.findByNombreCompletoContaining(nombre);
        return guias.stream()
                .map(this::convertirEntidadAResponse)
                .collect(Collectors.toList());
    }

    /**
     * Obtener disponibilidad de guías para una fecha específica
     */
    @Transactional(readOnly = true)
    public List<Object[]> obtenerDisponibilidadPorFecha(LocalDate fecha) {
        return guiaRepository.findDisponibilidadGuiasPorFecha(fecha);
    }

    // Métodos de consulta con ordenamiento
    @Transactional(readOnly = true)
    public List<GuiaResponse> obtenerGuiasOrdenadosPorExperiencia() {
        List<Guia> guias = guiaRepository.findAllOrderByExperiencia();
        return guias.stream()
                .map(this::convertirEntidadAResponse)
                .collect(Collectors.toList());
    }

    // Métodos de consulta básicos
    @Transactional(readOnly = true)
    public GuiaResponse obtenerGuiaPorIdPublico(UUID id) {
        Guia guia = obtenerGuiaPorId(id);
        return convertirEntidadAResponse(guia);
    }

    // Método interno para obtener entidad (usado internamente por el servicio)
    @Transactional(readOnly = true)
    public Guia obtenerGuiaPorId(UUID id) {
        return guiaRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Guía no encontrado"));
    }

    @Transactional(readOnly = true)
    public Guia obtenerGuiaPorEmail(String email) {
        return guiaRepository.findByEmail(email)
            .orElseThrow(() -> new IllegalArgumentException("Guía no encontrado con email: " + email));
    }

    @Transactional(readOnly = true)
    public List<GuiaResponse> obtenerTodosLosGuias() {
        List<Guia> guias = guiaRepository.findAll();
        return guias.stream()
                .map(this::convertirEntidadAResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<GuiaResponse> obtenerGuiasActivos() {
        List<Guia> guias = guiaRepository.findByActivoTrue();
        return guias.stream()
                .map(this::convertirEntidadAResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public long contarGuiasActivos() {
        return guiaRepository.countByActivoTrue();
    }

    /**
     * Eliminar guía (soft delete - desactivar)
     */
    public void eliminarGuia(UUID id) {
        cambiarEstadoGuia(id, false);
    }

    /**
     * Obtener estadísticas de guías
     */
    @Transactional(readOnly = true)
    public GuiaStats obtenerEstadisticas() {
        long totalGuias = guiaRepository.count();
        long guiasActivos = guiaRepository.countByActivoTrue();
        
        List<Guia> guias = guiaRepository.findByActivoTrue();
        
        double experienciaPromedio = guias.stream()
            .filter(g -> g.getAnosExperiencia() != null)
            .mapToInt(Guia::getAnosExperiencia)
            .average()
            .orElse(0.0);

        long guiasConExperiencia = guias.stream()
            .filter(g -> g.getAnosExperiencia() != null && g.getAnosExperiencia() > 0)
            .count();

        long guiasConEspecialidades = guias.stream()
            .filter(g -> g.getEspecialidades() != null && !g.getEspecialidades().trim().isEmpty())
            .count();

        return new GuiaStats(totalGuias, guiasActivos, experienciaPromedio, 
                           guiasConExperiencia, guiasConEspecialidades);
    }

    // ========== MÉTODOS DE CONVERSIÓN ==========

    /**
     * Convierte un GuiaRequest DTO a entidad Guia
     */
    private Guia convertirRequestAEntidad(GuiaRequest request) {
        Guia guia = new Guia();
        guia.setNombre(request.getNombre());
        guia.setApellido(request.getApellido());
        guia.setEmail(request.getEmail());
        guia.setBiografia(request.getBiografia());
        guia.setAnosExperiencia(request.getAnosExperiencia());
        guia.setEspecialidades(request.getEspecialidades());
        guia.setUrlFoto(request.getUrlFoto());
        return guia;
    }

    /**
     * Convierte una entidad Guia a GuiaResponse DTO
     * Excluye información sensible como email para respuestas públicas
     */
    private GuiaResponse convertirEntidadAResponse(Guia guia) {
        GuiaResponse response = new GuiaResponse();
        response.setId(guia.getId());
        response.setNombre(guia.getNombre());
        response.setApellido(guia.getApellido());
        response.setNombreCompleto(guia.getNombreCompleto());
        response.setBiografia(guia.getBiografia());
        response.setAnosExperiencia(guia.getAnosExperiencia());
        response.setEspecialidades(guia.getEspecialidades());
        response.setUrlFoto(guia.getUrlFoto());
        return response;
    }

    // Clase interna para estadísticas
    public static class GuiaStats {
        private final long totalGuias;
        private final long guiasActivos;
        private final double experienciaPromedio;
        private final long guiasConExperiencia;
        private final long guiasConEspecialidades;

        public GuiaStats(long totalGuias, long guiasActivos, double experienciaPromedio,
                        long guiasConExperiencia, long guiasConEspecialidades) {
            this.totalGuias = totalGuias;
            this.guiasActivos = guiasActivos;
            this.experienciaPromedio = experienciaPromedio;
            this.guiasConExperiencia = guiasConExperiencia;
            this.guiasConEspecialidades = guiasConEspecialidades;
        }

        // Getters
        public long getTotalGuias() { return totalGuias; }
        public long getGuiasActivos() { return guiasActivos; }
        public double getExperienciaPromedio() { return experienciaPromedio; }
        public long getGuiasConExperiencia() { return guiasConExperiencia; }
        public long getGuiasConEspecialidades() { return guiasConEspecialidades; }
    }
}
