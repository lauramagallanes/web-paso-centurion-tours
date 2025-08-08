import React, { createContext, useContext, useReducer } from 'react';

// Tipos para reservas
export interface Habitacion {
  id: string;
  numero: string;
  nombre: string;
  descripcion: string;
  capacidadMinima: number;
  capacidadMaxima: number;
  precioPorPersonaNoche: number;
  urlImagen?: string;
  activa: boolean;
}

export interface Sendero {
  id: string;
  nombre: string;
  descripcion: string;
  duracionHoras: number;
  nivelDificultad: 'FACIL' | 'MODERADO' | 'DIFICIL' | 'EXPERTO';
  capacidadMaximaGrupo: number;
  precioPorPersona: number;
  urlImagen?: string;
  activo: boolean;
}

export interface Guia {
  id: string;
  nombre: string;
  apellido: string;
  email?: string;
  biografia?: string;
  anosExperiencia?: number;
  especialidades?: string;
  urlFoto?: string;
  activo: boolean;
}

export interface ReservaData {
  tipoReserva: 'ALOJAMIENTO' | 'SENDERO';
  emailContacto: string;
  nombreContacto: string;
  telefonoContacto?: string;
  numeroPersonas: number;
  fechaInicio: string;
  fechaFin: string;
  observaciones?: string;
  
  // Campos específicos para alojamiento
  habitacionId?: string;
  habitacion?: Habitacion;
  
  // Campos específicos para senderos
  senderoId?: string;
  sendero?: Sendero;
  guiaId?: string;
  guia?: Guia;
  turno?: 'MANANA' | 'TARDE';
}

export interface Reserva {
  id: string;
  codigoReserva: string;
  tipoReserva: 'ALOJAMIENTO' | 'SENDERO';
  emailContacto: string;
  nombreContacto: string;
  telefonoContacto?: string;
  numeroPersonas: number;
  fechaInicio: string;
  fechaFin: string;
  precioTotal: number;
  estado: 'PENDIENTE' | 'CONFIRMADA' | 'CANCELADA' | 'COMPLETADA';
  observaciones?: string;
  fechaCreacion: string;
  fechaActualizacion?: string;
  informacionAdicional?: string;
}

// Estado del contexto de reservas
export interface BookingState {
  // Datos de la reserva actual
  currentBooking: ReservaData | null;
  
  // Disponibilidad
  habitacionesDisponibles: Habitacion[];
  senderosDisponibles: Sendero[];
  guiasDisponibles: Guia[];
  
  // Reservas del usuario
  userReservations: Reserva[];
  
  // Estado de carga
  loading: boolean;
  error: string | null;
  
  // Precios calculados
  precioCalculado: number | null;
}

// Tipos para las acciones
type BookingAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_CURRENT_BOOKING'; payload: ReservaData | null }
  | { type: 'UPDATE_BOOKING_FIELD'; payload: { field: keyof ReservaData; value: any } }
  | { type: 'SET_HABITACIONES_DISPONIBLES'; payload: Habitacion[] }
  | { type: 'SET_SENDEROS_DISPONIBLES'; payload: Sendero[] }
  | { type: 'SET_GUIAS_DISPONIBLES'; payload: Guia[] }
  | { type: 'SET_USER_RESERVATIONS'; payload: Reserva[] }
  | { type: 'ADD_RESERVATION'; payload: Reserva }
  | { type: 'SET_PRECIO_CALCULADO'; payload: number | null }
  | { type: 'RESET_BOOKING' };

// Estado inicial
const initialState: BookingState = {
  currentBooking: null,
  habitacionesDisponibles: [],
  senderosDisponibles: [],
  guiasDisponibles: [],
  userReservations: [],
  loading: false,
  error: null,
  precioCalculado: null,
};

// Reducer para manejar el estado de reservas
const bookingReducer = (state: BookingState, action: BookingAction): BookingState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    
    case 'SET_CURRENT_BOOKING':
      return { ...state, currentBooking: action.payload };
    
    case 'UPDATE_BOOKING_FIELD':
      if (!state.currentBooking) return state;
      return {
        ...state,
        currentBooking: {
          ...state.currentBooking,
          [action.payload.field]: action.payload.value,
        },
      };
    
    case 'SET_HABITACIONES_DISPONIBLES':
      return { ...state, habitacionesDisponibles: action.payload };
    
    case 'SET_SENDEROS_DISPONIBLES':
      return { ...state, senderosDisponibles: action.payload };
    
    case 'SET_GUIAS_DISPONIBLES':
      return { ...state, guiasDisponibles: action.payload };
    
    case 'SET_USER_RESERVATIONS':
      return { ...state, userReservations: action.payload };
    
    case 'ADD_RESERVATION':
      return {
        ...state,
        userReservations: [action.payload, ...state.userReservations],
      };
    
    case 'SET_PRECIO_CALCULADO':
      return { ...state, precioCalculado: action.payload };
    
    case 'RESET_BOOKING':
      return {
        ...state,
        currentBooking: null,
        precioCalculado: null,
        error: null,
      };
    
    default:
      return state;
  }
};

// Contexto de reservas
interface BookingContextType {
  state: BookingState;
  
  // Gestión de reserva actual
  startBooking: (tipo: 'ALOJAMIENTO' | 'SENDERO') => void;
  updateBookingField: (field: keyof ReservaData, value: any) => void;
  resetBooking: () => void;
  
  // Búsqueda de disponibilidad
  searchHabitacionesDisponibles: (fechaInicio: string, fechaFin: string, numeroPersonas: number) => Promise<void>;
  searchGuiasDisponibles: (fecha: string, turno: 'MANANA' | 'TARDE') => Promise<void>;
  
  // Cálculos
  calculatePrice: (reservaData: ReservaData) => Promise<void>;
  
  // Verificación
  verifyAvailability: (reservaData: ReservaData) => Promise<boolean>;
  
  // Creación de reserva
  createReservation: (reservaData: ReservaData) => Promise<Reserva>;
  
  // Consulta de reservas
  getUserReservations: (email: string) => Promise<void>;
  getReservationByCode: (codigo: string) => Promise<Reserva | null>;
  
  // Utilidades
  clearError: () => void;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

// Provider de reservas
export const BookingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(bookingReducer, initialState);

  const startBooking = (tipo: 'ALOJAMIENTO' | 'SENDERO'): void => {
    const newBooking: ReservaData = {
      tipoReserva: tipo,
      emailContacto: '',
      nombreContacto: '',
      numeroPersonas: tipo === 'ALOJAMIENTO' ? 2 : 1,
      fechaInicio: '',
      fechaFin: '',
    };
    
    dispatch({ type: 'SET_CURRENT_BOOKING', payload: newBooking });
  };

  const updateBookingField = (field: keyof ReservaData, value: any): void => {
    dispatch({ type: 'UPDATE_BOOKING_FIELD', payload: { field, value } });
  };

  const resetBooking = (): void => {
    dispatch({ type: 'RESET_BOOKING' });
  };

  const searchHabitacionesDisponibles = async (
    fechaInicio: string, 
    fechaFin: string, 
    numeroPersonas: number
  ): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const response = await fetch(
        `/api/habitaciones/disponibles?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}&numeroPersonas=${numeroPersonas}`
      );
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        dispatch({ type: 'SET_HABITACIONES_DISPONIBLES', payload: data.data });
      } else {
        dispatch({ type: 'SET_ERROR', payload: data.error || 'Error al buscar habitaciones' });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Error de conexión' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const searchGuiasDisponibles = async (fecha: string, turno: 'MANANA' | 'TARDE'): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const response = await fetch(`/api/guias/disponibles?fecha=${fecha}&turno=${turno}`);
      const data = await response.json();
      
      if (response.ok && data.success) {
        dispatch({ type: 'SET_GUIAS_DISPONIBLES', payload: data.data });
      } else {
        dispatch({ type: 'SET_ERROR', payload: data.error || 'Error al buscar guías' });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Error de conexión' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const calculatePrice = async (reservaData: ReservaData): Promise<void> => {
    try {
      const response = await fetch('/api/reservas/calcular-precio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reservaData),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        dispatch({ type: 'SET_PRECIO_CALCULADO', payload: data.data });
      } else {
        dispatch({ type: 'SET_ERROR', payload: data.error || 'Error al calcular precio' });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Error de conexión' });
    }
  };

  const verifyAvailability = async (reservaData: ReservaData): Promise<boolean> => {
    try {
      const response = await fetch('/api/reservas/verificar-disponibilidad', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reservaData),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        return data.data;
      } else {
        dispatch({ type: 'SET_ERROR', payload: data.error || 'Error al verificar disponibilidad' });
        return false;
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Error de conexión' });
      return false;
    }
  };

  const createReservation = async (reservaData: ReservaData): Promise<Reserva> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const response = await fetch('/api/reservas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reservaData),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        const newReservation = data.data;
        dispatch({ type: 'ADD_RESERVATION', payload: newReservation });
        dispatch({ type: 'RESET_BOOKING' });
        return newReservation;
      } else {
        dispatch({ type: 'SET_ERROR', payload: data.error || 'Error al crear reserva' });
        throw new Error(data.error || 'Error al crear reserva');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error de conexión';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const getUserReservations = async (email: string): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const response = await fetch(`/api/reservas/email/${email}`);
      const data = await response.json();
      
      if (response.ok && data.success) {
        dispatch({ type: 'SET_USER_RESERVATIONS', payload: data.data });
      } else {
        dispatch({ type: 'SET_ERROR', payload: data.error || 'Error al obtener reservas' });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Error de conexión' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const getReservationByCode = async (codigo: string): Promise<Reserva | null> => {
    try {
      const response = await fetch(`/api/reservas/codigo/${codigo}`);
      const data = await response.json();
      
      if (response.ok && data.success) {
        return data.data;
      } else {
        dispatch({ type: 'SET_ERROR', payload: data.error || 'Reserva no encontrada' });
        return null;
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Error de conexión' });
      return null;
    }
  };

  const clearError = (): void => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const contextValue: BookingContextType = {
    state,
    startBooking,
    updateBookingField,
    resetBooking,
    searchHabitacionesDisponibles,
    searchGuiasDisponibles,
    calculatePrice,
    verifyAvailability,
    createReservation,
    getUserReservations,
    getReservationByCode,
    clearError,
  };

  return (
    <BookingContext.Provider value={contextValue}>
      {children}
    </BookingContext.Provider>
  );
};

// Hook personalizado para usar el contexto de reservas
export const useBooking = (): BookingContextType => {
  const context = useContext(BookingContext);
  if (context === undefined) {
    throw new Error('useBooking debe ser usado dentro de un BookingProvider');
  }
  return context;
};
