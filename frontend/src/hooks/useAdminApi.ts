import React, { useState } from 'react';
import { useApi } from './useApi';

// Hook personalizado para APIs específicas del admin
export const useHabitacionesDisponibles = () => {
  const { data, loading, error, execute } = useApi();

  const search = async (fechaInicio: string, fechaFin: string, numeroPersonas: number) => {
    const params = new URLSearchParams({
      fechaInicio,
      fechaFin,
      numeroPersonas: numeroPersonas.toString()
    });
    
    return execute(`/alojamientos/disponibles?${params}`);
  };

  return { data: data || [], loading, error, search };
};

export const useSenderos = () => {
  const { data, loading, error, execute } = useApi();

  const load = () => execute('/senderos');

  return { data: data || [], loading, error, load };
};

export const useGuiasDisponibles = () => {
  const { data, loading, error, execute } = useApi();

  const search = async (fecha: string, turno: string) => {
    const params = new URLSearchParams({ fecha, turno });
    return execute(`/guias/disponibles?${params}`);
  };

  return { data: data || [], loading, error, search };
};

export const useDashboardStats = () => {
  const { data, loading, error, execute } = useApi();

  const load = () => execute('/reservas/admin/estadisticas');

  return { data, loading, error, load };
};

// Normalize backend datetime (stored in UTC without 'Z') to proper UTC string
const toUTCDatetime = (dt: string | null | undefined): string => {
  if (!dt) return '';
  // Backend stores LocalDateTime in UTC but serializes without 'Z'
  // Append 'Z' so the browser parses it as UTC and converts to local
  return dt.endsWith('Z') ? dt : dt + 'Z';
};

// Map sendero reservation from backend fields to frontend expected fields
const mapSenderoReserva = (r: any) => ({
  id: r.id,
  codigo: r.codigoReserva,
  tipoReserva: 'SENDERO' as const,
  nombreCliente: r.nombreContacto || '',
  emailCliente: r.emailContacto || '',
  telefonoCliente: r.telefonoContacto,
  cantidadPersonas: r.numeroPersonas || 0,
  fechaReserva: r.fechaInicio || '',
  fechaFin: r.fechaFin,
  fechaCreacion: toUTCDatetime(r.fechaCreacion),
  estado: r.estado || 'PENDIENTE',
  precioTotal: r.precioTotal || 0,
  observaciones: r.observaciones,
  observacionesAdmin: r.observacionesAdmin,
  informacionAdicional: r.informacionAdicional,
  estadoPago: r.estadoPago || 'PENDIENTE',
  montoPagado: r.montoPagado || 0,
  saldoPendiente: r.saldoPendiente || 0,
  metodoPago: r.metodoPago,
  placetoPayRequestId: r.placetoPayRequestId,
  turno: r.turno,
  sendero: r.nombreSendero ? { nombre: r.nombreSendero } : undefined,
});

// Map alojamiento reservation from backend fields to frontend expected fields
const mapAlojamientoReserva = (r: any) => ({
  id: r.id,
  codigo: r.codigoReserva,
  tipoReserva: 'ALOJAMIENTO' as const,
  nombreCliente: r.nombreContacto || '',
  emailCliente: r.emailContacto || '',
  telefonoCliente: r.telefonoContacto,
  cantidadPersonas: r.numeroHuespedes || 0,
  fechaReserva: r.fechaCheckIn || '',
  fechaFin: r.fechaCheckOut,
  fechaCreacion: toUTCDatetime(r.fechaCreacion),
  estado: r.estado || 'PENDIENTE',
  precioTotal: r.precioTotal || 0,
  observaciones: r.observaciones || r.observacionesEspeciales,
  observacionesAdmin: r.observacionesAdmin,
  habitacion: r.alojamientoNombre ? { id: r.alojamientoId, nombre: r.alojamientoNombre } : undefined,
  numeroNoches: r.numeroNoches,
  ubicacion: r.ubicacionAlojamiento,
  precioPorNoche: r.precioPorNoche,
  // Payment fields from backend
  estadoPago: r.estadoPago || 'PENDIENTE',
  montoPagado: r.montoPagado || 0,
  saldoPendiente: r.saldoPendiente || 0,
  metodoPago: r.metodoPago,
  tipoPago: r.tipoPago,
  porcentajeSena: r.porcentajeSena,
  placetoPayRequestId: r.placetoPayRequestId,
});

export const useReservasAdmin = () => {
  const [reservas, setReservas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { execute } = useApi();

  const loadReservas = async () => {
    setLoading(true);
    setError(null);
    try {
      // Load both types of reservations in parallel
      const [senderosResult, alojamientosResult] = await Promise.allSettled([
        execute('/reservas/admin/senderos'),
        execute('/reservas/admin/alojamientos')
      ]);

      const senderos = senderosResult.status === 'fulfilled' && senderosResult.value?.success
        ? (senderosResult.value.data || []).map(mapSenderoReserva)
        : [];

      const alojamientos = alojamientosResult.status === 'fulfilled' && alojamientosResult.value?.success
        ? (alojamientosResult.value.data || []).map(mapAlojamientoReserva)
        : [];

      const combined = [...senderos, ...alojamientos].sort(
        (a, b) => new Date(b.fechaCreacion || 0).getTime() - new Date(a.fechaCreacion || 0).getTime()
      );

      setReservas(combined);
      return combined;
    } catch (err) {
      console.error('Error loading reservas:', err);
      setError(err instanceof Error ? err.message : 'Error loading reservas');
      return [];
    } finally {
      setLoading(false);
    }
  };
  
  const confirmarReserva = (id: string, observaciones?: string, tipo?: string) => {
    const suffix = tipo === 'ALOJAMIENTO' ? 'confirmar-alojamiento' : 'confirmar-sendero';
    return execute(`/reservas/admin/${id}/${suffix}`, {
      method: 'PUT',
      body: JSON.stringify({ observacionesAdmin: observaciones })
    });
  };

  const cancelarReserva = (id: string, observaciones?: string, tipo?: string) => {
    const suffix = tipo === 'ALOJAMIENTO' ? 'cancelar-alojamiento' : 'cancelar-sendero';
    return execute(`/reservas/admin/${id}/${suffix}`, {
      method: 'PUT',
      body: JSON.stringify({ observacionesAdmin: observaciones })
    });
  };

  const completarReserva = (id: string, tipo?: string) => {
    const suffix = tipo === 'ALOJAMIENTO' ? 'estado-alojamiento' : 'estado-sendero';
    return execute(`/reservas/admin/${id}/${suffix}`, {
      method: 'PUT',
      body: JSON.stringify({ estado: 'COMPLETADA' })
    });
  };

  const actualizarEstado = (id: string, nuevoEstado: string, tipo?: string) => {
    const suffix = tipo === 'ALOJAMIENTO' ? 'estado-alojamiento' : 'estado-sendero';
    if (nuevoEstado === 'CONFIRMADA') return confirmarReserva(id, undefined, tipo);
    if (nuevoEstado === 'CANCELADA') return cancelarReserva(id, undefined, tipo);
    return execute(`/reservas/admin/${id}/${suffix}`, {
      method: 'PUT',
      body: JSON.stringify({ estado: nuevoEstado })
    });
  };

  const actualizarEstadoPago = (id: string, estadoPago: string, montoPagado?: number, tipo?: string) => {
    const suffix = tipo === 'ALOJAMIENTO' ? 'estado-pago-alojamiento' : 'estado-pago-sendero';
    return execute(`/reservas/admin/${id}/${suffix}`, {
      method: 'PUT',
      body: JSON.stringify({ estadoPago, montoPagado })
    });
  };

  const posponerReserva = (id: string, tipo: string, fechas: { nuevaFecha?: string; turno?: string; nuevaFechaCheckIn?: string; nuevaFechaCheckOut?: string }) => {
    const suffix = tipo === 'ALOJAMIENTO' ? 'posponer-alojamiento' : 'posponer-sendero';
    return execute(`/reservas/admin/${id}/${suffix}`, {
      method: 'PUT',
      body: JSON.stringify(fechas)
    });
  };

  return { 
    data: reservas,
    reservas,
    loading, 
    error, 
    loadReservas,
    confirmarReserva,
    cancelarReserva,
    completarReserva,
    actualizarEstado,
    actualizarEstadoPago,
    posponerReserva
  };
};

export const useHabitacionesAdmin = () => {
  const { data, loading, error, execute } = useApi();

  const loadHabitaciones = async () => {
    try {
      const result = await execute('/alojamientos/admin');
      return result;
    } catch (err) {
      console.error('Error loading alojamientos:', err);
      return null;
    }
  };
  
  // Mapear datos del frontend al formato del backend
  const mapToAlojamientoRequest = (habitacion: any) => {
    const precio = habitacion.precioPorNoche || habitacion.precioPorPersonaNoche || 1500;
    
    return {
      nombre: habitacion.nombre || habitacion.numero || '',
      descripcion: habitacion.descripcion || '',
      ubicacion: habitacion.ubicacion || '',
      capacidadMinima: parseInt(habitacion.capacidadMinima) || 1,
      capacidadMaxima: parseInt(habitacion.capacidadMaxima) || 2,
      cantidadCamasDobles: parseInt(habitacion.cantidadCamasDobles) || 0,
      cantidadLiteras: parseInt(habitacion.cantidadLiteras) || 0,
      horaLlegada: habitacion.horaLlegada || '14:00:00',
      horaSalida: habitacion.horaSalida || '10:00:00',
      precioPorNoche: parseFloat(precio),  // Enviar como número, no string
      activa: habitacion.activa ?? habitacion.activo ?? true  // Incluir estado activa
    };
  };
  
  const createHabitacion = (habitacion: any) => {
    const mappedData = mapToAlojamientoRequest(habitacion);
    return execute('/alojamientos/admin', {
      method: 'POST',
      body: JSON.stringify(mappedData)
    });
  };

  const updateHabitacion = (id: string, habitacion: any) => {
    const mappedData = mapToAlojamientoRequest(habitacion);
    return execute(`/alojamientos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(mappedData)
    });
  };

  const toggleActive = (id: string, currentState: boolean) => 
    execute(`/alojamientos/${id}`, { method: 'DELETE' });

  const deleteHabitacion = (id: string) => 
    execute(`/alojamientos/${id}`, { method: 'DELETE' });

  // Asegurar que data sea siempre un array válido
  const habitaciones = data?.success ? (data.data || []) : [];

  return { 
    data: habitaciones, 
    loading, 
    error, 
    loadHabitaciones,
    createHabitacion,
    updateHabitacion,
    toggleActive,
    deleteHabitacion
  };
};

export const useSenderosAdmin = () => {
  const { data, loading, error, execute } = useApi();

  const loadSenderos = async () => {
    try {
      const result = await execute('/senderos/admin');
      return result;
    } catch (err) {
      console.error('Error loading senderos:', err);
      throw err;
    }
  };
  
  const createSendero = async (sendero: any) => {
    return execute('/senderos/admin', {
      method: 'POST',
      body: JSON.stringify(sendero)
    });
  };

  const updateSendero = async (id: string, sendero: any) => {
    return execute(`/senderos/admin/${id}`, {
      method: 'PUT',
      body: JSON.stringify(sendero)
    });
  };

  const toggleActive = async (id: string, activo: boolean) => {
    return execute(`/senderos/admin/${id}/estado?activo=${activo}`, { method: 'PUT' });
  };

  const deleteSendero = async (id: string) => {
    return execute(`/senderos/admin/${id}`, { method: 'DELETE' });
  };

  return { 
    data: data?.success ? (data.data || []) : [], 
    loading, 
    error, 
    loadSenderos,
    createSendero,
    updateSendero,
    toggleActive,
    deleteSendero
  };
};

export const useGuiasAdmin = () => {
  const { data, loading, error, execute } = useApi();

  const loadGuias = async () => {
    try {
      const result = await execute('/guias/admin');
      return result;
    } catch (err) {
      console.error('Error loading guias:', err);
      return null;
    }
  };
  
  const createGuia = (guia: any) => 
    execute('/guias/admin', {
      method: 'POST',
      body: JSON.stringify(guia)
    });

  const updateGuia = (id: string, guia: any) => 
    execute(`/guias/admin/${id}`, {
      method: 'PUT',
      body: JSON.stringify(guia)
    });

  const toggleActive = (id: string, activo: boolean) => 
    execute(`/guias/admin/${id}/estado?activo=${activo}`, { method: 'PUT' });

  const deleteGuia = (id: string) => 
    execute(`/guias/admin/${id}`, { method: 'DELETE' });

  // Asegurar que data sea siempre un array válido
  const guias = data?.success ? (data.data || []) : [];

  return { 
    data: guias, 
    loading, 
    error, 
    loadGuias,
    createGuia,
    updateGuia,
    toggleActive,
    deleteGuia
  };
};
