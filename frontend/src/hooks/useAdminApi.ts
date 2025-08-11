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
    
    return execute(`/habitaciones/disponibles?${params}`);
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

  const load = () => execute('/dashboard/admin/stats');

  return { data, loading, error, load };
};

export const useReservasAdmin = () => {
  const { data, loading, error, execute } = useApi();

  const loadReservas = async () => {
    try {
      const result = await execute('/reservas/admin');
      return result;
    } catch (err) {
      console.error('Error loading reservas:', err);
      return null;
    }
  };
  
  const confirmarReserva = (id: number, observaciones?: string) => 
    execute(`/reservas/admin/${id}/confirmar`, {
      method: 'PUT',
      body: JSON.stringify({ observacionesAdmin: observaciones })
    });

  const cancelarReserva = (id: number, observaciones?: string) => 
    execute(`/reservas/admin/${id}/cancelar`, {
      method: 'PUT',
      body: JSON.stringify({ observacionesAdmin: observaciones })
    });

  const completarReserva = (id: number) => 
    execute(`/reservas/admin/${id}/completar`, {
      method: 'PUT'
    });

  // Asegurar que data sea siempre un array válido
  const reservas = data?.success ? (data.data || []) : [];

  return { 
    data: reservas, 
    loading, 
    error, 
    loadReservas,
    confirmarReserva,
    cancelarReserva,
    completarReserva
  };
};

export const useHabitacionesAdmin = () => {
  const { data, loading, error, execute } = useApi();

  const loadHabitaciones = async () => {
    try {
      const result = await execute('/habitaciones/admin');
      return result;
    } catch (err) {
      console.error('Error loading habitaciones:', err);
      return null;
    }
  };
  
  const createHabitacion = (habitacion: any) => 
    execute('/habitaciones/admin', {
      method: 'POST',
      body: JSON.stringify(habitacion)
    });

  const updateHabitacion = (id: number, habitacion: any) => 
    execute(`/habitaciones/admin/${id}`, {
      method: 'PUT',
      body: JSON.stringify(habitacion)
    });

  const toggleActive = (id: number, currentState: boolean) => 
    execute(`/habitaciones/admin/${id}/estado?activa=${!currentState}`, { method: 'PUT' });

  const deleteHabitacion = (id: number) => 
    execute(`/habitaciones/admin/${id}`, { method: 'DELETE' });

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
      return null;
    }
  };
  
  const createSendero = (sendero: any) => 
    execute('/senderos/admin', {
      method: 'POST',
      body: JSON.stringify(sendero)
    });

  const updateSendero = (id: number, sendero: any) => 
    execute(`/senderos/admin/${id}`, {
      method: 'PUT',
      body: JSON.stringify(sendero)
    });

  const toggleActive = (id: number, activo: boolean) => 
    execute(`/senderos/admin/${id}/estado?activo=${activo}`, { method: 'PUT' });

  const deleteSendero = (id: number) => 
    execute(`/senderos/admin/${id}`, { method: 'DELETE' });

  // Asegurar que data sea siempre un array válido
  const senderos = data?.success ? (data.data || []) : [];

  return { 
    data: senderos, 
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

  const updateGuia = (id: number, guia: any) => 
    execute(`/guias/admin/${id}`, {
      method: 'PUT',
      body: JSON.stringify(guia)
    });

  const toggleActive = (id: number, activo: boolean) => 
    execute(`/guias/admin/${id}/estado?activo=${activo}`, { method: 'PUT' });

  const deleteGuia = (id: number) => 
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
