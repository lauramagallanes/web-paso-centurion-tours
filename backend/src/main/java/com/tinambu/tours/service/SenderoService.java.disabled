package com.tinambu.tours.service;

import com.tinambu.tours.dto.request.SenderoRequest;
import com.tinambu.tours.dto.response.SenderoResponse;
import com.tinambu.tours.entity.sendero.NivelDificultad;
import com.tinambu.tours.entity.sendero.Sendero;
import com.tinambu.tours.repository.SenderoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class SenderoService {

    @Autowired
    private SenderoRepository senderoRepository;

    /**
     * Crear nuevo sendero
     */
    public SenderoResponse crearSendero(SenderoRequest senderoRequest) {
        // Validar que el nombre no esté duplicado
        if (senderoRepository.findByNombre(senderoRequest.getNombre()).isPresent()) {
            throw new IllegalArgumentException("Ya existe un sendero con el nombre: " + senderoRequest.getNombre());
        }

        Sendero sendero = convertirRequestAEntidad(senderoRequest);
        Sendero senderoGuardado = senderoRepository.save(sendero);
        return convertirEntidadAResponse(senderoGuardado);
    }

    /**
     * Actualizar sendero existente
     */
    public SenderoResponse actualizarSendero(UUID id, SenderoRequest senderoRequest) {
        Sendero sendero = obtenerSenderoPorId(id);

        // Verificar si cambió el nombre y si ya existe
        if (!sendero.getNombre().equals(senderoRequest.getNombre()) &&
            senderoRepository.findByNombre(senderoRequest.getNombre()).isPresent()) {
            throw new IllegalArgumentException("Ya existe un sendero con el nombre: " + senderoRequest.getNombre());
        }

        // Actualizar campos
        sendero.setNombre(senderoRequest.getNombre());
        sendero.setDescripcion(senderoRequest.getDescripcion());
        sendero.setDuracionHoras(senderoRequest.getDuracionHoras());
        sendero.setNivelDificultad(senderoRequest.getNivelDificultad());
        sendero.setCapacidadMaximaGrupo(senderoRequest.getCapacidadMaximaGrupo());
        sendero.setPrecioPorPersona(senderoRequest.getPrecioPorPersona());
        sendero.setUrlImagen(senderoRequest.getUrlImagen());

        Sendero senderoActualizado = senderoRepository.save(sendero);
        return convertirEntidadAResponse(senderoActualizado);
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
    public List<SenderoResponse> buscarPorCapacidadMinima(Integer numeroPersonas) {
        List<Sendero> senderos = senderoRepository.findByCapacidadMinima(numeroPersonas);
        return senderos.stream()
                .map(this::convertirEntidadAResponse)
                .collect(Collectors.toList());
    }

    /**
     * Buscar senderos por nivel de dificultad
     */
    @Transactional(readOnly = true)
    public List<SenderoResponse> buscarPorNivelDificultad(NivelDificultad nivelDificultad) {
        List<Sendero> senderos = senderoRepository.findByNivelDificultadAndActivoTrue(nivelDificultad);
        return senderos.stream()
                .map(this::convertirEntidadAResponse)
                .collect(Collectors.toList());
    }

    /**
     * Buscar senderos por rango de duración
     */
    @Transactional(readOnly = true)
    public List<SenderoResponse> buscarPorRangoDuracion(BigDecimal duracionMin, BigDecimal duracionMax) {
        List<Sendero> senderos = senderoRepository.findByRangoDuracion(duracionMin, duracionMax);
        return senderos.stream()
                .map(this::convertirEntidadAResponse)
                .collect(Collectors.toList());
    }

    /**
     * Buscar senderos por rango de precios
     */
    @Transactional(readOnly = true)
    public List<SenderoResponse> buscarPorRangoPrecio(BigDecimal precioMin, BigDecimal precioMax) {
        List<Sendero> senderos = senderoRepository.findByRangoPrecio(precioMin, precioMax);
        return senderos.stream()
                .map(this::convertirEntidadAResponse)
                .collect(Collectors.toList());
    }

    /**
     * Buscar senderos por texto en nombre o descripción
     */
    @Transactional(readOnly = true)
    public List<SenderoResponse> buscarPorTexto(String texto) {
        List<Sendero> senderos = senderoRepository.findByNombreOrDescripcionContaining(texto);
        return senderos.stream()
                .map(this::convertirEntidadAResponse)
                .collect(Collectors.toList());
    }

    // Métodos de consulta con ordenamiento
    @Transactional(readOnly = true)
    public List<SenderoResponse> obtenerSenderosOrdenadosPorDificultad() {
        List<Sendero> senderos = senderoRepository.findAllOrderByDificultad();
        return senderos.stream()
                .map(this::convertirEntidadAResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SenderoResponse> obtenerSenderosOrdenadosPorDuracion() {
        List<Sendero> senderos = senderoRepository.findAllOrderByDuracion();
        return senderos.stream()
                .map(this::convertirEntidadAResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SenderoResponse> obtenerSenderosOrdenadosPorPrecio() {
        List<Sendero> senderos = senderoRepository.findAllOrderByPrecio();
        return senderos.stream()
                .map(this::convertirEntidadAResponse)
                .collect(Collectors.toList());
    }

    // Métodos de consulta básicos
    @Transactional(readOnly = true)
    public SenderoResponse obtenerSenderoPorIdPublico(UUID id) {
        Sendero sendero = obtenerSenderoPorId(id);
        return convertirEntidadAResponse(sendero);
    }

    // Método interno para obtener entidad (usado internamente por el servicio)
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
    public List<SenderoResponse> obtenerTodosLosSenderos() {
        List<Sendero> senderos = senderoRepository.findAll();
        return senderos.stream()
                .map(this::convertirEntidadAResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SenderoResponse> obtenerSenderosActivos() {
        List<Sendero> senderos = senderoRepository.findByActivoTrue();
        return senderos.stream()
                .map(this::convertirEntidadAResponse)
                .collect(Collectors.toList());
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
        private final long senderosModera;
        private final long senderosDificiles;
        private final long senderosExpertos;

        public SenderoStats(long totalSenderos, long senderosActivos, int capacidadTotalMaxima,
                           BigDecimal duracionPromedio, BigDecimal precioPromedio,
                           long senderosFaciles, long senderosModera, long senderosDificiles, long senderosExpertos) {
            this.totalSenderos = totalSenderos;
            this.senderosActivos = senderosActivos;
            this.capacidadTotalMaxima = capacidadTotalMaxima;
            this.duracionPromedio = duracionPromedio;
            this.precioPromedio = precioPromedio;
            this.senderosFaciles = senderosFaciles;
            this.senderosModera = senderosModera;
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
        public long getSenderosModera() { return senderosModera; }
        public long getSenderosDificiles() { return senderosDificiles; }
        public long getSenderosExpertos() { return senderosExpertos; }
    }

    // ========== MÉTODOS DE CONVERSIÓN ==========

    /**
     * Convierte un SenderoRequest DTO a entidad Sendero
     */
    private Sendero convertirRequestAEntidad(SenderoRequest request) {
        Sendero sendero = new Sendero();
        sendero.setNombre(request.getNombre());
        sendero.setDescripcion(request.getDescripcion());
        sendero.setDuracionHoras(request.getDuracionHoras());
        sendero.setNivelDificultad(request.getNivelDificultad());
        sendero.setCapacidadMaximaGrupo(request.getCapacidadMaximaGrupo());
        sendero.setPrecioPorPersona(request.getPrecioPorPersona());
        sendero.setUrlImagen(request.getUrlImagen());
        return sendero;
    }

    /**
     * Convierte una entidad Sendero a SenderoResponse DTO
     * Excluye información interna como estado activo y fechas de auditoría
     */
    private SenderoResponse convertirEntidadAResponse(Sendero sendero) {
        SenderoResponse response = new SenderoResponse();
        response.setId(sendero.getId());
        response.setNombre(sendero.getNombre());
        response.setDescripcion(sendero.getDescripcion());
        response.setDuracionHoras(sendero.getDuracionHoras());
        response.setNivelDificultad(sendero.getNivelDificultad());
        response.setCapacidadMaximaGrupo(sendero.getCapacidadMaximaGrupo());
        response.setPrecioPorPersona(sendero.getPrecioPorPersona());
        response.setUrlImagen(sendero.getUrlImagen());
        return response;
    }
}
