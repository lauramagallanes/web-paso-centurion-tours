package com.tinambu.tours.service;

import com.tinambu.tours.entity.sendero.NivelDificultad;
import com.tinambu.tours.entity.sendero.Sendero;
import com.tinambu.tours.repository.SenderoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class SenderoService {

    @Autowired
    private SenderoRepository senderoRepository;

    /**
     * Crear nuevo sendero
     */
    public Sendero crearSendero(Sendero sendero) {
        // Validar que el nombre no esté duplicado
        if (senderoRepository.findByNombre(sendero.getNombre()).isPresent()) {
            throw new IllegalArgumentException("Ya existe un sendero con el nombre: " + sendero.getNombre());
        }

        return senderoRepository.save(sendero);
    }

    /**
     * Actualizar sendero existente
     */
    public Sendero actualizarSendero(UUID id, Sendero senderoActualizado) {
        Sendero sendero = obtenerSenderoPorId(id);

        // Verificar si cambió el nombre y si ya existe
        if (!sendero.getNombre().equals(senderoActualizado.getNombre()) &&
            senderoRepository.findByNombre(senderoActualizado.getNombre()).isPresent()) {
            throw new IllegalArgumentException("Ya existe un sendero con el nombre: " + senderoActualizado.getNombre());
        }

        // Actualizar campos
        sendero.setNombre(senderoActualizado.getNombre());
        sendero.setDescripcion(senderoActualizado.getDescripcion());
        sendero.setDuracionHoras(senderoActualizado.getDuracionHoras());
        sendero.setNivelDificultad(senderoActualizado.getNivelDificultad());
        sendero.setCapacidadMaximaGrupo(senderoActualizado.getCapacidadMaximaGrupo());
        sendero.setPrecioPorPersona(senderoActualizado.getPrecioPorPersona());
        sendero.setUrlImagen(senderoActualizado.getUrlImagen());

        return senderoRepository.save(sendero);
    }

    /**
     * Activar/desactivar sendero
     */
    public Sendero cambiarEstadoSendero(UUID id, boolean activo) {
        Sendero sendero = obtenerSenderoPorId(id);
        sendero.setActivo(activo);
        return senderoRepository.save(sendero);
    }

    /**
     * Buscar senderos por capacidad mínima
     */
    @Transactional(readOnly = true)
    public List<Sendero> buscarPorCapacidadMinima(Integer numeroPersonas) {
        return senderoRepository.findByCapacidadMinima(numeroPersonas);
    }

    /**
     * Buscar senderos por nivel de dificultad
     */
    @Transactional(readOnly = true)
    public List<Sendero> buscarPorNivelDificultad(NivelDificultad nivelDificultad) {
        return senderoRepository.findByNivelDificultadAndActivoTrue(nivelDificultad);
    }

    /**
     * Buscar senderos por rango de duración
     */
    @Transactional(readOnly = true)
    public List<Sendero> buscarPorRangoDuracion(BigDecimal duracionMin, BigDecimal duracionMax) {
        return senderoRepository.findByRangoDuracion(duracionMin, duracionMax);
    }

    /**
     * Buscar senderos por rango de precios
     */
    @Transactional(readOnly = true)
    public List<Sendero> buscarPorRangoPrecio(BigDecimal precioMin, BigDecimal precioMax) {
        return senderoRepository.findByRangoPrecio(precioMin, precioMax);
    }

    /**
     * Buscar senderos por texto en nombre o descripción
     */
    @Transactional(readOnly = true)
    public List<Sendero> buscarPorTexto(String texto) {
        return senderoRepository.findByNombreOrDescripcionContaining(texto);
    }

    // Métodos de consulta con ordenamiento
    @Transactional(readOnly = true)
    public List<Sendero> obtenerSenderosOrdenadosPorDificultad() {
        return senderoRepository.findAllOrderByDificultad();
    }

    @Transactional(readOnly = true)
    public List<Sendero> obtenerSenderosOrdenadosPorDuracion() {
        return senderoRepository.findAllOrderByDuracion();
    }

    @Transactional(readOnly = true)
    public List<Sendero> obtenerSenderosOrdenadosPorPrecio() {
        return senderoRepository.findAllOrderByPrecio();
    }

    // Métodos de consulta básicos
    @Transactional(readOnly = true)
    public Sendero obtenerSenderoPorId(UUID id) {
        return senderoRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Sendero no encontrado"));
    }

    @Transactional(readOnly = true)
    public Sendero obtenerSenderoPorNombre(String nombre) {
        return senderoRepository.findByNombre(nombre)
            .orElseThrow(() -> new IllegalArgumentException("Sendero no encontrado con nombre: " + nombre));
    }

    @Transactional(readOnly = true)
    public List<Sendero> obtenerTodosLosSenderos() {
        return senderoRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<Sendero> obtenerSenderosActivos() {
        return senderoRepository.findByActivoTrue();
    }

    @Transactional(readOnly = true)
    public long contarSenderosActivos() {
        return senderoRepository.countByActivoTrue();
    }

    @Transactional(readOnly = true)
    public long contarSenderosPorDificultad(NivelDificultad nivelDificultad) {
        return senderoRepository.countByNivelDificultadAndActivoTrue(nivelDificultad);
    }

    /**
     * Eliminar sendero (soft delete - desactivar)
     */
    public void eliminarSendero(UUID id) {
        cambiarEstadoSendero(id, false);
    }

    /**
     * Obtener estadísticas de senderos
     */
    @Transactional(readOnly = true)
    public SenderoStats obtenerEstadisticas() {
        long totalSenderos = senderoRepository.count();
        long senderosActivos = senderoRepository.countByActivoTrue();
        
        List<Sendero> senderos = senderoRepository.findByActivoTrue();
        
        int capacidadTotalMaxima = senderos.stream()
            .mapToInt(Sendero::getCapacidadMaximaGrupo)
            .sum();

        BigDecimal duracionPromedio = senderos.stream()
            .map(Sendero::getDuracionHoras)
            .reduce(BigDecimal.ZERO, BigDecimal::add)
            .divide(BigDecimal.valueOf(Math.max(1, senderos.size())), 2, java.math.RoundingMode.HALF_UP);

        BigDecimal precioPromedio = senderos.stream()
            .map(Sendero::getPrecioPorPersona)
            .reduce(BigDecimal.ZERO, BigDecimal::add)
            .divide(BigDecimal.valueOf(Math.max(1, senderos.size())), 2, java.math.RoundingMode.HALF_UP);

        // Contar por dificultad
        long faciles = senderoRepository.countByNivelDificultadAndActivoTrue(NivelDificultad.FACIL);
        long moderados = senderoRepository.countByNivelDificultadAndActivoTrue(NivelDificultad.MODERADO);
        long dificiles = senderoRepository.countByNivelDificultadAndActivoTrue(NivelDificultad.DIFICIL);
        long expertos = senderoRepository.countByNivelDificultadAndActivoTrue(NivelDificultad.EXPERTO);

        return new SenderoStats(totalSenderos, senderosActivos, capacidadTotalMaxima, 
                               duracionPromedio, precioPromedio, faciles, moderados, dificiles, expertos);
    }

    // Clase interna para estadísticas
    public static class SenderoStats {
        private final long totalSenderos;
        private final long senderosActivos;
        private final int capacidadTotalMaxima;
        private final BigDecimal duracionPromedio;
        private final BigDecimal precioPromedio;
        private final long senderosFaciles;
        private final long senderosModera dos;
        private final long senderosDificiles;
        private final long senderosExpertos;

        public SenderoStats(long totalSenderos, long senderosActivos, int capacidadTotalMaxima,
                           BigDecimal duracionPromedio, BigDecimal precioPromedio,
                           long senderosFaciles, long senderosModera dos, long senderosDificiles, long senderosExpertos) {
            this.totalSenderos = totalSenderos;
            this.senderosActivos = senderosActivos;
            this.capacidadTotalMaxima = capacidadTotalMaxima;
            this.duracionPromedio = duracionPromedio;
            this.precioPromedio = precioPromedio;
            this.senderosFaciles = senderosFaciles;
            this.senderosModera dos = senderosModera dos;
            this.senderosDificiles = senderosDificiles;
            this.senderosExpertos = senderosExpertos;
        }

        // Getters
        public long getTotalSenderos() { return totalSenderos; }
        public long getSenderosActivos() { return senderosActivos; }
        public int getCapacidadTotalMaxima() { return capacidadTotalMaxima; }
        public BigDecimal getDuracionPromedio() { return duracionPromedio; }
        public BigDecimal getPrecioPromedio() { return precioPromedio; }
        public long getSenderosFaciles() { return senderosFaciles; }
        public long getSenderosModera dos() { return senderosModera dos; }
        public long getSenderosDificiles() { return senderosDificiles; }
        public long getSenderosExpertos() { return senderosExpertos; }
    }
}
