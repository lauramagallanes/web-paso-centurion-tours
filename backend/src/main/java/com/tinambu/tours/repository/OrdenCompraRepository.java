package com.tinambu.tours.repository;

import com.tinambu.tours.entity.orden.OrdenCompra;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OrdenCompraRepository extends JpaRepository<OrdenCompra, UUID> {
    Optional<OrdenCompra> findByCodigoOrden(String codigoOrden);
    Optional<OrdenCompra> findByPlacetoPayRequestId(Long requestId);

    /** Find the orders that include a given reservation (matched against its OrdenCompraItem.reservaId). */
    @Query("SELECT DISTINCT oci.orden FROM OrdenCompraItem oci WHERE oci.reservaId = :reservaId")
    List<OrdenCompra> findByReservaId(@Param("reservaId") UUID reservaId);
}
