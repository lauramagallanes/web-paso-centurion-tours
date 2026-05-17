package com.tinambu.tours.repository;

import com.tinambu.tours.entity.alojamiento.Alojamiento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AlojamientoRepository extends JpaRepository<Alojamiento, UUID> {

    /**
     * Adquiere un advisory lock transaccional sobre el alojamiento para serializar
     * operaciones concurrentes que reservan/liberan fechas (carrito o reserva).
     * El lock se libera automáticamente al finalizar la transacción.
     */
    @Query(value = "SELECT pg_advisory_xact_lock(hashtext(CAST(:alojamientoId AS text)))",
           nativeQuery = true)
    void adquirirLockReservaPorAlojamiento(@Param("alojamientoId") UUID alojamientoId);

    List<Alojamiento> findByActivoTrue();

    @Query("SELECT a FROM Alojamiento a WHERE a.activo = true AND " +
           "a.capacidadMinima <= :personas AND a.capacidadMaxima >= :personas")
    List<Alojamiento> findByCapacidadParaPersonas(@Param("personas") int personas);

    List<Alojamiento> findByNombreContainingIgnoreCaseAndActivoTrue(String nombre);

    @Query("SELECT a FROM Alojamiento a WHERE a.activo = true AND " +
           "a.precioPorNoche BETWEEN :precioMin AND :precioMax")
    List<Alojamiento> findByRangoPrecio(@Param("precioMin") BigDecimal precioMin, 
                                       @Param("precioMax") BigDecimal precioMax);

    @Query("SELECT a FROM Alojamiento a WHERE a.activo = true AND " +
           "a.capacidadMinima <= :personas AND a.capacidadMaxima >= :personas AND " +
           "a.precioPorNoche BETWEEN :precioMin AND :precioMax")
    List<Alojamiento> findByCapacidadYPrecio(@Param("personas") int personas,
                                            @Param("precioMin") BigDecimal precioMin,
                                            @Param("precioMax") BigDecimal precioMax);

    @Query("SELECT DISTINCT a FROM Alojamiento a " +
           "JOIN a.disponibilidades d " +
           "WHERE a.activo = true AND d.activo = true AND " +
           "d.fechaInicio <= :checkIn AND d.fechaFin >= :checkOut AND " +
           "a.capacidadMinima <= :huespedes AND a.capacidadMaxima >= :huespedes AND " +
           "NOT EXISTS (" +
           "    SELECT 1 FROM AlojamientoReservaBloqueo b " +
           "    WHERE b.alojamientoId = a.id AND b.activo = true AND " +
           "    b.fecha >= :checkIn AND b.fecha < :checkOut" +
           ")")
    List<Alojamiento> findDisponiblesParaFechas(@Param("checkIn") LocalDate checkIn,
                                               @Param("checkOut") LocalDate checkOut,
                                               @Param("huespedes") int huespedes);

    @Query("SELECT a FROM Alojamiento a WHERE a.activo = true " +
           "ORDER BY RANDOM() LIMIT :limite")
    List<Alojamiento> findAlojamientosDestacados(@Param("limite") int limite);

    Optional<Alojamiento> findByIdAndActivoTrue(UUID id);

    @Query("SELECT COUNT(ar) FROM AlojamientoReserva ar WHERE ar.alojamientoId = :alojamientoId")
    Long countReservasByAlojamientoId(@Param("alojamientoId") UUID alojamientoId);

    @Query("SELECT a FROM Alojamiento a WHERE a.activo = true AND " +
           "(LOWER(a.nombre) LIKE LOWER(CONCAT('%', :termino, '%')) OR " +
           "LOWER(a.descripcion) LIKE LOWER(CONCAT('%', :termino, '%')) OR " +
           "LOWER(a.ubicacion) LIKE LOWER(CONCAT('%', :termino, '%')))")
    List<Alojamiento> buscarPorTermino(@Param("termino") String termino);
}
