import React, { createContext, useContext, useReducer, useEffect } from 'react';
import apiService from '../services/apiService';

// Tipos para el estado de autenticación
export interface Usuario {
  id: string;
  email: string;
  nombreCompleto: string;
  tipo: 'ADMIN' | 'VISITANTE';
  activo: boolean;
  fechaCreacion: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: Usuario | null;
  accessToken: string | null;
  refreshToken: string | null;
  loading: boolean;
  error: string | null;
}

// Tipos para las acciones
type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: Usuario; accessToken: string; refreshToken: string } }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'REFRESH_TOKEN_SUCCESS'; payload: { accessToken: string; refreshToken: string } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'CLEAR_ERROR' };

// Estado inicial
const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  accessToken: localStorage.getItem('accessToken'),
  refreshToken: localStorage.getItem('refreshToken'),
  loading: false,
  error: null,
};

// Reducer para manejar el estado de autenticación
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        loading: true,
        error: null,
      };

    case 'LOGIN_SUCCESS':
      localStorage.setItem('accessToken', action.payload.accessToken);
      localStorage.setItem('refreshToken', action.payload.refreshToken);
      localStorage.setItem('user', JSON.stringify(action.payload.user));
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        accessToken: action.payload.accessToken,
        refreshToken: action.payload.refreshToken,
        loading: false,
        error: null,
      };

    case 'LOGIN_FAILURE':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        accessToken: null,
        refreshToken: null,
        loading: false,
        error: action.payload,
      };

    case 'LOGOUT':
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      return {
        ...initialState,
        accessToken: null,
        refreshToken: null,
      };

    case 'REFRESH_TOKEN_SUCCESS':
      localStorage.setItem('accessToken', action.payload.accessToken);
      localStorage.setItem('refreshToken', action.payload.refreshToken);
      return {
        ...state,
        accessToken: action.payload.accessToken,
        refreshToken: action.payload.refreshToken,
      };

    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };

    default:
      return state;
  }
};

// Contexto de autenticación
interface AuthContextType {
  state: AuthState;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, nombreCompleto: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
  clearError: () => void;
  isAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider de autenticación
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Verificar autenticación al cargar la app
  useEffect(() => {
    const initAuth = async () => {
      const storedUser = localStorage.getItem('user');
      const storedAccessToken = localStorage.getItem('accessToken');

      if (storedUser && storedAccessToken) {
        try {
          const user = JSON.parse(storedUser);
          
          // Solo restaurar el estado sin validar inmediatamente
          // La validación se hará cuando sea necesario
          dispatch({
            type: 'LOGIN_SUCCESS',
            payload: {
              user,
              accessToken: storedAccessToken,
              refreshToken: localStorage.getItem('refreshToken') || '',
            },
          });
        } catch (error) {
          console.error('Error al inicializar autenticación:', error);
          logout();
        }
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    dispatch({ type: 'LOGIN_START' });

    try {
      const data = await apiService.login(email, password);

      if (data.success === true) {
        const usuario = data.data?.usuario;
        if (!usuario) {
          throw new Error('Datos de usuario no encontrados en la respuesta');
        }

        const mappedUser: Usuario = {
          id: usuario.id.toString(),
          email: usuario.email,
          nombreCompleto: usuario.nombreCompleto,
          tipo: usuario.tipo,
          activo: usuario.activo,
          fechaCreacion: usuario.fechaCreacion,
        };

        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: {
            user: mappedUser,
            accessToken: data.data.accessToken,
            refreshToken: data.data.refreshToken,
          },
        });
      } else {
        dispatch({
          type: 'LOGIN_FAILURE',
          payload: data.message || 'Error al iniciar sesión',
        });
      }
    } catch (error) {
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: 'Error de conexión',
      });
    }
  };

  const signup = async (email: string, password: string, nombreCompleto: string): Promise<void> => {
    dispatch({ type: 'LOGIN_START' });

    try {
      const data = await apiService.signup(email, password, nombreCompleto);

      if (data.status === 'success') {
        // Después del registro exitoso, hacer login automático
        await login(email, password);
      } else {
        dispatch({
          type: 'LOGIN_FAILURE',
          payload: data.error || 'Error al registrarse',
        });
      }
    } catch (error) {
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: 'Error de conexión',
      });
    }
  };

  const logout = (): void => {
    dispatch({ type: 'LOGOUT' });
  };

  const refreshToken = async (): Promise<boolean> => {
    const storedRefreshToken = localStorage.getItem('refreshToken');
    
    if (!storedRefreshToken) {
      return false;
    }

    try {
      const baseURL = import.meta.env.VITE_API_BASE_URL || 'https://53dmek6dqk.execute-api.us-east-1.amazonaws.com';
      const response = await fetch(`${baseURL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${storedRefreshToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          dispatch({
            type: 'REFRESH_TOKEN_SUCCESS',
            payload: {
              accessToken: data.data.accessToken,
              refreshToken: data.data.refreshToken,
            },
          });
          return true;
        }
      }

      // Si el refresh falló, hacer logout
      logout();
      return false;
    } catch {
      logout();
      return false;
    }
  };

  const clearError = (): void => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const isAdmin = (): boolean => {
    return state.user?.tipo === 'ADMIN';
  };

  const contextValue: AuthContextType = {
    state,
    login,
    signup,
    logout,
    refreshToken,
    clearError,
    isAdmin,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizado para usar el contexto de autenticación
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};
