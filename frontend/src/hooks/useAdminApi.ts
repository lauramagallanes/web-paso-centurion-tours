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
    
    return execute(`/api/habitaciones/disponibles?${params}`);
  };

  return { data: data || [], loading, error, search };
};

export const useSenderos = () => {
  const { data, loading, error, execute } = useApi();

  const load = () => execute('/api/senderos');

  return { data: data || [], loading, error, load };
};

export const useGuiasDisponibles = () => {
  const { data, loading, error, execute } = useApi();

  const search = async (fecha: string, turno: string) => {
    const params = new URLSearchParams({ fecha, turno });
    return execute(`/api/guias/disponibles?${params}`);
  };

  return { data: data || [], loading, error, search };
};

export const useDashboardStats = () => {
  const { data, loading, error, execute } = useApi();

  const load = () => execute('/api/admin/dashboard/stats');

  return { data, loading, error, load };
};

export const useReservasAdmin = () => {
  const { data, loading, error, execute } = useApi();

  const loadReservas = () => execute('/api/admin/reservas');
  
  const confirmarReserva = (id: number, observaciones?: string) => 
    execute(`/api/admin/reservas/${id}/confirmar`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ observacionesAdmin: observaciones })
    });

  const cancelarReserva = (id: number, observaciones?: string) => 
    execute(`/api/admin/reservas/${id}/cancelar`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ observacionesAdmin: observaciones })
    });

  return { 
    data: data || [], 
    loading, 
    error, 
    loadReservas,
    confirmarReserva,
    cancelarReserva
  };
};

export const useHabitacionesAdmin = () => {
  const { data, loading, error, execute } = useApi();

  const loadHabitaciones = () => execute('/api/admin/habitaciones');
  
  const createHabitacion = (habitacion: any) => 
    execute('/api/admin/habitaciones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(habitacion)
    });

  const updateHabitacion = (id: number, habitacion: any) => 
    execute(`/api/admin/habitaciones/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(habitacion)
    });

  const toggleActive = (id: number) => 
    execute(`/api/admin/habitaciones/${id}/toggle-active`, { method: 'PUT' });

  const deleteHabitacion = (id: number) => 
    execute(`/api/admin/habitaciones/${id}`, { method: 'DELETE' });

  return { 
    data: data || [], 
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

  const loadSenderos = () => execute('/api/admin/senderos');
  
  const createSendero = (sendero: any) => 
    execute('/api/admin/senderos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sendero)
    });

  const updateSendero = (id: number, sendero: any) => 
    execute(`/api/admin/senderos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sendero)
    });

  const toggleActive = (id: number) => 
    execute(`/api/admin/senderos/${id}/toggle-active`, { method: 'PUT' });

  const deleteSendero = (id: number) => 
    execute(`/api/admin/senderos/${id}`, { method: 'DELETE' });

  return { 
    data: data || [], 
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

  const loadGuias = () => execute('/api/admin/guias');
  
  const createGuia = (guia: any) => 
    execute('/api/admin/guias', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(guia)
    });

  const updateGuia = (id: number, guia: any) => 
    execute(`/api/admin/guias/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(guia)
    });

  const toggleActive = (id: number) => 
    execute(`/api/admin/guias/${id}/toggle-active`, { method: 'PUT' });

  const deleteGuia = (id: number) => 
    execute(`/api/admin/guias/${id}`, { method: 'DELETE' });

  return { 
    data: data || [], 
    loading, 
    error, 
    loadGuias,
    createGuia,
    updateGuia,
    toggleActive,
    deleteGuia
  };
};
