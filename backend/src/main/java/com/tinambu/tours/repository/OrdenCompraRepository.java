package com.tinambu.tours.repository;

import com.tinambu.tours.entity.orden.OrdenCompra;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface OrdenCompraRepository extends JpaRepository<OrdenCompra, UUID> {
    Optional<OrdenCompra> findByCodigoOrden(String codigoOrden);
    Optional<OrdenCompra> findByPlacetoPayRequestId(Long requestId);
}
