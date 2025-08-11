import { useState } from 'react';
import apiService from '../services/apiService';

// Hook genérico para llamadas a API
export function useApi<T = any>() {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = async (endpoint: string, options?: RequestInit) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${apiService.apiBaseURL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
          ...(apiService.getAuthHeaders())
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      setData(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error de conexión';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);
  const clearData = () => setData(null);

  return { data, loading, error, execute, clearError, clearData };
}

// Hook específico para habitaciones
export function useHabitaciones() {
  return useApi('/habitaciones');
}

// Hook específico para senderos
export function useSenderos() {
  return useApi('/senderos');
}

// Hook específico para guías
export function useGuias() {
  return useApi('/guias');
}

// Hook para búsqueda de disponibilidad de habitaciones
export function useHabitacionesDisponibles() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = async (fechaInicio: string, fechaFin: string, numeroPersonas: number) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiService.getHabitacionesDisponibles(fechaInicio, fechaFin, numeroPersonas);
      if (response.success) {
        setData(response.data);
      } else {
        setError(response.error || 'Error en la búsqueda');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const clear = () => {
    setData([]);
    setError(null);
  };

  return { data, loading, error, search, clear };
}

// Hook para búsqueda de guías disponibles
export function useGuiasDisponibles() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = async (fecha: string, turno: 'MANANA' | 'TARDE') => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiService.getGuiasDisponibles(fecha, turno);
      if (response.success) {
        setData(response.data);
      } else {
        setError(response.error || 'Error en la búsqueda');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const clear = () => {
    setData([]);
    setError(null);
  };

  return { data, loading, error, search, clear };
}

// Hook para gestión de reservas
export function useReservas() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createReserva = async (reservaData: any) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiService.createReserva(reservaData);
      if (response.success) {
        return response.data;
      } else {
        setError(response.error || 'Error al crear reserva');
        throw new Error(response.error);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error de conexión';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const verifyAvailability = async (reservaData: any) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiService.verifyAvailability(reservaData);
      if (response.success) {
        return response.data;
      } else {
        setError(response.error || 'Error al verificar disponibilidad');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const calculatePrice = async (reservaData: any) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiService.calculatePrice(reservaData);
      if (response.success) {
        return response.data;
      } else {
        setError(response.error || 'Error al calcular precio');
        return null;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getReservaByCode = async (codigo: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiService.getReservaByCode(codigo);
      if (response.success) {
        return response.data;
      } else {
        setError(response.error || 'Reserva no encontrada');
        return null;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getReservasByEmail = async (email: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiService.getReservasByEmail(email);
      if (response.success) {
        return response.data;
      } else {
        setError(response.error || 'Error al obtener reservas');
        return [];
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión');
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    createReserva,
    verifyAvailability,
    calculatePrice,
    getReservaByCode,
    getReservasByEmail,
  };
}

// Hook para funciones de administración
export function useAdmin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getReservasAdmin = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiService.getReservasAdmin();
      if (response.success) {
        return response.data;
      } else {
        setError(response.error || 'Error al obtener reservas');
        return [];
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const confirmarReserva = async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiService.confirmarReserva(id);
      if (response.success) {
        return response.data;
      } else {
        setError(response.error || 'Error al confirmar reserva');
        throw new Error(response.error);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error de conexión';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const cancelarReserva = async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiService.cancelarReserva(id);
      if (response.success) {
        return response.data;
      } else {
        setError(response.error || 'Error al cancelar reserva');
        throw new Error(response.error);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error de conexión';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    getReservasAdmin,
    confirmarReserva,
    cancelarReserva,
  };
}
