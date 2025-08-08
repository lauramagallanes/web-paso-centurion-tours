package com.tinambu.tours.service;

import com.tinambu.tours.entity.guia.Guia;
import com.tinambu.tours.entity.reserva.TurnoSendero;
import com.tinambu.tours.repository.GuiaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class GuiaService {

    @Autowired
    private GuiaRepository guiaRepository;

    /**
     * Crear nuevo guía
     */
    public Guia crearGuia(Guia guia) {
        // Validar que el email no esté duplicado (si se proporciona)
        if (guia.getEmail() != null && guiaRepository.findByEmail(guia.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Ya existe un guía con el email: " + guia.getEmail());
        }

        return guiaRepository.save(guia);
    }

    /**
     * Actualizar guía existente
     */
    public Guia actualizarGuia(UUID id, Guia guiaActualizado) {
        Guia guia = obtenerGuiaPorId(id);

        // Verificar si cambió el email y si ya existe
        if (guiaActualizado.getEmail() != null && 
            !guiaActualizado.getEmail().equals(guia.getEmail()) &&
            guiaRepository.findByEmail(guiaActualizado.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Ya existe un guía con el email: " + guiaActualizado.getEmail());
        }

        // Actualizar campos
        guia.setNombre(guiaActualizado.getNombre());
        guia.setApellido(guiaActualizado.getApellido());
        guia.setEmail(guiaActualizado.getEmail());
        guia.setBiografia(guiaActualizado.getBiografia());
        guia.setAnosExperiencia(guiaActualizado.getAnosExperiencia());
        guia.setEspecialidades(guiaActualizado.getEspecialidades());
        guia.setUrlFoto(guiaActualizado.getUrlFoto());

        return guiaRepository.save(guia);
    }

    /**
     * Activar/desactivar guía
     */
    public Guia cambiarEstadoGuia(UUID id, boolean activo) {
        Guia guia = obtenerGuiaPorId(id);
        guia.setActivo(activo);
        return guiaRepository.save(guia);
    }

    /**
     * Buscar guías disponibles para una fecha y turno específicos
     */
    @Transactional(readOnly = true)
    public List<Guia> buscarGuiasDisponibles(LocalDate fecha, TurnoSendero turno) {
        return guiaRepository.findGuiasDisponibles(fecha, turno);
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
    public List<Guia> buscarPorEspecialidad(String especialidad) {
        return guiaRepository.findByEspecialidadContaining(especialidad);
    }

    /**
     * Buscar guías por años de experiencia mínima
     */
    @Transactional(readOnly = true)
    public List<Guia> buscarPorExperienciaMinima(Integer anosMinimos) {
        return guiaRepository.findByAnosExperienciaMinima(anosMinimos);
    }

    /**
     * Buscar guías por nombre
     */
    @Transactional(readOnly = true)
    public List<Guia> buscarPorNombre(String nombre) {
        return guiaRepository.findByNombreCompletoContaining(nombre);
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
    public List<Guia> obtenerGuiasOrdenadosPorExperiencia() {
        return guiaRepository.findAllOrderByExperiencia();
    }

    // Métodos de consulta básicos
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
    public List<Guia> obtenerTodosLosGuias() {
        return guiaRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<Guia> obtenerGuiasActivos() {
        return guiaRepository.findByActivoTrue();
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
