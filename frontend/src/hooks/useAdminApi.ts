import React from 'react';
import { useApi } from './useApi';
import localStorageService from '../services/localStorageService';

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
  const [localData, setLocalData] = React.useState<any[]>([]);
  const [localLoading, setLocalLoading] = React.useState(false);
  const [localError, setLocalError] = React.useState<string | null>(null);
  const [useLocalStorage, setUseLocalStorage] = React.useState(false);

  const loadSenderos = async () => {
    try {
      const result = await execute('/senderos/admin');
      setUseLocalStorage(false);
      return result;
    } catch (err) {
      console.log('Backend not available, switching to localStorage');
      setUseLocalStorage(true);
      setLocalLoading(true);
      setLocalError(null);
      
      try {
        // Initialize with sample data if first time
        localStorageService.initializeSampleData();
        const senderos = localStorageService.getSenderos();
        setLocalData(senderos);
        setLocalError(null);
      } catch (localErr) {
        console.error('Error loading from localStorage:', localErr);
        setLocalError('Error cargando datos locales');
      } finally {
        setLocalLoading(false);
      }
      return null;
    }
  };
  
  const createSendero = async (sendero: any) => {
    if (useLocalStorage) {
      try {
        const newSendero = localStorageService.createSendero(sendero);
        const updatedSenderos = localStorageService.getSenderos();
        setLocalData(updatedSenderos);
        return { success: true, data: newSendero };
      } catch (err) {
        console.error('Error creating sendero locally:', err);
        throw new Error('Error guardando sendero localmente');
      }
    } else {
      return execute('/senderos/admin', {
        method: 'POST',
        body: JSON.stringify(sendero)
      });
    }
  };

  const updateSendero = async (id: string, sendero: any) => {
    if (useLocalStorage) {
      try {
        const updatedSendero = localStorageService.updateSendero(id, sendero);
        const updatedSenderos = localStorageService.getSenderos();
        setLocalData(updatedSenderos);
        return { success: true, data: updatedSendero };
      } catch (err) {
        console.error('Error updating sendero locally:', err);
        throw new Error('Error actualizando sendero localmente');
      }
    } else {
      return execute(`/senderos/admin/${id}`, {
        method: 'PUT',
        body: JSON.stringify(sendero)
      });
    }
  };

  const toggleActive = async (id: string, activo: boolean) => {
    if (useLocalStorage) {
      try {
        const updatedSendero = localStorageService.updateSendero(id, { activo });
        const updatedSenderos = localStorageService.getSenderos();
        setLocalData(updatedSenderos);
        return { success: true, data: updatedSendero };
      } catch (err) {
        console.error('Error toggling sendero locally:', err);
        throw new Error('Error actualizando estado localmente');
      }
    } else {
      return execute(`/senderos/admin/${id}/estado?activo=${activo}`, { method: 'PUT' });
    }
  };

  const deleteSendero = async (id: string) => {
    if (useLocalStorage) {
      try {
        const deleted = localStorageService.deleteSendero(id);
        if (deleted) {
          const updatedSenderos = localStorageService.getSenderos();
          setLocalData(updatedSenderos);
          return { success: true };
        } else {
          throw new Error('Sendero no encontrado');
        }
      } catch (err) {
        console.error('Error deleting sendero locally:', err);
        throw new Error('Error eliminando sendero localmente');
      }
    } else {
      return execute(`/senderos/admin/${id}`, { method: 'DELETE' });
    }
  };

  // Return appropriate data based on source
  const currentData = useLocalStorage ? localData : (data?.success ? (data.data || []) : []);
  const currentLoading = useLocalStorage ? localLoading : loading;
  const currentError = useLocalStorage ? localError : error;

  return { 
    data: currentData, 
    loading: currentLoading, 
    error: currentError, 
    loadSenderos,
    createSendero,
    updateSendero,
    toggleActive,
    deleteSendero,
    isUsingLocalStorage: useLocalStorage
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
