package com.tinambu.tours.repository;

import com.tinambu.tours.entity.sendero.Sendero;
import com.tinambu.tours.entity.sendero.NivelDificultad;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SenderoRepository extends JpaRepository<Sendero, UUID> {

    /**
     * Buscar sendero por nombre
     */
    Optional<Sendero> findByNombre(String nombre);

    /**
     * Buscar senderos activos
     */
    List<Sendero> findByActivoTrue();

    /**
     * Buscar senderos por nivel de dificultad
     */
    List<Sendero> findByNivelDificultadAndActivoTrue(NivelDificultad nivelDificultad);

    /**
     * Buscar senderos que pueden acomodar un número específico de personas
     */
    @Query("SELECT s FROM Sendero s WHERE s.capacidadMaximaGrupo >= :numeroPersonas AND s.activo = true")
    List<Sendero> findByCapacidadMinima(@Param("numeroPersonas") Integer numeroPersonas);

    /**
     * Buscar senderos por rango de duración
     */
    @Query("SELECT s FROM Sendero s WHERE s.duracionHoras BETWEEN :duracionMin AND :duracionMax AND s.activo = true ORDER BY s.duracionHoras")
    List<Sendero> findByRangoDuracion(
        @Param("duracionMin") BigDecimal duracionMin,
        @Param("duracionMax") BigDecimal duracionMax
    );

    /**
     * Buscar senderos por rango de precios
     */
    @Query("SELECT s FROM Sendero s WHERE s.precioPorPersona BETWEEN :precioMin AND :precioMax AND s.activo = true ORDER BY s.precioPorPersona")
    List<Sendero> findByRangoPrecio(
        @Param("precioMin") BigDecimal precioMin,
        @Param("precioMax") BigDecimal precioMax
    );

    /**
     * Buscar senderos ordenados por dificultad (fácil primero)
     */
    @Query("SELECT s FROM Sendero s WHERE s.activo = true ORDER BY s.nivelDificultad, s.nombre")
    List<Sendero> findAllOrderByDificultad();

    /**
     * Buscar senderos ordenados por duración
     */
    @Query("SELECT s FROM Sendero s WHERE s.activo = true ORDER BY s.duracionHoras, s.nombre")
    List<Sendero> findAllOrderByDuracion();

    /**
     * Buscar senderos ordenados por precio
     */
    @Query("SELECT s FROM Sendero s WHERE s.activo = true ORDER BY s.precioPorPersona, s.nombre")
    List<Sendero> findAllOrderByPrecio();

    /**
     * Buscar senderos por descripción (búsqueda de texto)
     */
    @Query("SELECT s FROM Sendero s WHERE LOWER(s.descripcion) LIKE LOWER(CONCAT('%', :texto, '%')) AND s.activo = true")
    List<Sendero> findByDescripcionContaining(@Param("texto") String texto);

    /**
     * Buscar senderos por nombre o descripción
     */
    @Query("""
        SELECT s FROM Sendero s 
        WHERE (LOWER(s.nombre) LIKE LOWER(CONCAT('%', :texto, '%')) 
        OR LOWER(s.descripcion) LIKE LOWER(CONCAT('%', :texto, '%'))) 
        AND s.activo = true
        ORDER BY s.nombre
    """)
    List<Sendero> findByNombreOrDescripcionContaining(@Param("texto") String texto);

    /**
     * Contar senderos activos
     */
    long countByActivoTrue();

    /**
     * Contar senderos por nivel de dificultad
     */
    long countByNivelDificultadAndActivoTrue(NivelDificultad nivelDificultad);
}
