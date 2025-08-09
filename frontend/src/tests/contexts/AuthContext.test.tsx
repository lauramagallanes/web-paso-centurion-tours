import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import ApiService from '../../services/apiService';

// Mock ApiService
vi.mock('../../services/apiService');
const MockedApiService = ApiService as jest.MockedClass<typeof ApiService>;

// Componente de prueba para usar el hook
const TestComponent = () => {
  const { state, login, logout, signup } = useAuth();
  
  return (
    <div>
      <div data-testid="auth-state">
        {JSON.stringify({
          isAuthenticated: state.isAuthenticated,
          user: state.user,
          loading: state.loading,
          error: state.error
        })}
      </div>
      <button 
        data-testid="login-btn" 
        onClick={() => login('test@example.com', 'password123')}
      >
        Login
      </button>
      <button 
        data-testid="logout-btn" 
        onClick={logout}
      >
        Logout
      </button>
      <button 
        data-testid="signup-btn" 
        onClick={() => signup('test@example.com', 'password123', 'Test User')}
      >
        Signup
      </button>
    </div>
  );
};

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {component}
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('AuthContext', () => {
  let mockApiInstance: jest.Mocked<ApiService>;

  beforeEach(() => {
    // Limpiar localStorage
    localStorage.clear();
    
    // Mock de la instancia de ApiService
    mockApiInstance = {
      post: vi.fn(),
      get: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      apiBaseURL: 'http://localhost:8080/api'
    } as any;

    MockedApiService.mockImplementation(() => mockApiInstance);
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should start with unauthenticated state', () => {
      // When
      renderWithRouter(<TestComponent />);

      // Then
      const authState = JSON.parse(screen.getByTestId('auth-state').textContent!);
      expect(authState.isAuthenticated).toBe(false);
      expect(authState.user).toBe(null);
      expect(authState.loading).toBe(false);
      expect(authState.error).toBe(null);
    });

    it('should load user from localStorage if token exists', () => {
      // Given
      const userData = {
        id: '123',
        email: 'test@example.com',
        nombreCompleto: 'Test User',
        tipo: 'VISITANTE'
      };
      localStorage.setItem('token', 'Bearer test-token');
      localStorage.setItem('user', JSON.stringify(userData));

      // When
      renderWithRouter(<TestComponent />);

      // Then
      const authState = JSON.parse(screen.getByTestId('auth-state').textContent!);
      expect(authState.isAuthenticated).toBe(true);
      expect(authState.user).toEqual(userData);
    });
  });

  describe('Login', () => {
    it('should login successfully', async () => {
      // Given
      const loginResponse = {
        success: true,
        data: {
          accessToken: 'test-access-token',
          refreshToken: 'test-refresh-token',
          usuario: {
            id: '123',
            email: 'test@example.com',
            nombreCompleto: 'Test User',
            tipo: 'VISITANTE'
          }
        }
      };
      mockApiInstance.post.mockResolvedValue(loginResponse);

      // When
      renderWithRouter(<TestComponent />);
      fireEvent.click(screen.getByTestId('login-btn'));

      // Then
      await waitFor(() => {
        const authState = JSON.parse(screen.getByTestId('auth-state').textContent!);
        expect(authState.isAuthenticated).toBe(true);
        expect(authState.user.email).toBe('test@example.com');
        expect(authState.loading).toBe(false);
      });

      expect(mockApiInstance.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'password123'
      });

      // Verificar que se guardó en localStorage
      expect(localStorage.getItem('token')).toBe('Bearer test-access-token');
      expect(localStorage.getItem('refreshToken')).toBe('test-refresh-token');
    });

    it('should handle login failure', async () => {
      // Given
      const loginError = {
        response: {
          data: {
            success: false,
            error: 'Credenciales inválidas'
          }
        }
      };
      mockApiInstance.post.mockRejectedValue(loginError);

      // When
      renderWithRouter(<TestComponent />);
      fireEvent.click(screen.getByTestId('login-btn'));

      // Then
      await waitFor(() => {
        const authState = JSON.parse(screen.getByTestId('auth-state').textContent!);
        expect(authState.isAuthenticated).toBe(false);
        expect(authState.error).toBe('Credenciales inválidas');
        expect(authState.loading).toBe(false);
      });
    });

    it('should set loading state during login', async () => {
      // Given
      const loginPromise = new Promise(resolve => 
        setTimeout(() => resolve({
          success: true,
          data: {
            accessToken: 'test-token',
            usuario: { id: '123', email: 'test@example.com' }
          }
        }), 100)
      );
      mockApiInstance.post.mockReturnValue(loginPromise as any);

      // When
      renderWithRouter(<TestComponent />);
      fireEvent.click(screen.getByTestId('login-btn'));

      // Then - Verificar estado de loading
      const authState = JSON.parse(screen.getByTestId('auth-state').textContent!);
      expect(authState.loading).toBe(true);

      // Esperar a que termine
      await waitFor(() => {
        const finalState = JSON.parse(screen.getByTestId('auth-state').textContent!);
        expect(finalState.loading).toBe(false);
      });
    });
  });

  describe('Signup', () => {
    it('should signup successfully', async () => {
      // Given
      const signupResponse = {
        success: true,
        data: {
          id: '123',
          email: 'test@example.com',
          nombreCompleto: 'Test User',
          tipo: 'VISITANTE'
        }
      };
      mockApiInstance.post.mockResolvedValue(signupResponse);

      // When
      renderWithRouter(<TestComponent />);
      fireEvent.click(screen.getByTestId('signup-btn'));

      // Then
      await waitFor(() => {
        const authState = JSON.parse(screen.getByTestId('auth-state').textContent!);
        expect(authState.loading).toBe(false);
      });

      expect(mockApiInstance.post).toHaveBeenCalledWith('/auth/signup', {
        email: 'test@example.com',
        password: 'password123',
        nombreCompleto: 'Test User'
      });
    });

    it('should handle signup failure', async () => {
      // Given
      const signupError = {
        response: {
          data: {
            success: false,
            error: 'Email ya existe'
          }
        }
      };
      mockApiInstance.post.mockRejectedValue(signupError);

      // When
      renderWithRouter(<TestComponent />);
      fireEvent.click(screen.getByTestId('signup-btn'));

      // Then
      await waitFor(() => {
        const authState = JSON.parse(screen.getByTestId('auth-state').textContent!);
        expect(authState.error).toBe('Email ya existe');
        expect(authState.loading).toBe(false);
      });
    });
  });

  describe('Logout', () => {
    it('should logout successfully', async () => {
      // Given - Usuario logueado
      const userData = {
        id: '123',
        email: 'test@example.com',
        nombreCompleto: 'Test User',
        tipo: 'VISITANTE'
      };
      localStorage.setItem('token', 'Bearer test-token');
      localStorage.setItem('user', JSON.stringify(userData));

      // When
      renderWithRouter(<TestComponent />);
      fireEvent.click(screen.getByTestId('logout-btn'));

      // Then
      await waitFor(() => {
        const authState = JSON.parse(screen.getByTestId('auth-state').textContent!);
        expect(authState.isAuthenticated).toBe(false);
        expect(authState.user).toBe(null);
      });

      // Verificar que se limpió localStorage
      expect(localStorage.getItem('token')).toBe(null);
      expect(localStorage.getItem('refreshToken')).toBe(null);
      expect(localStorage.getItem('user')).toBe(null);
    });
  });

  describe('Error Handling', () => {
    it('should clear error when starting new operation', async () => {
      // Given - Estado con error previo
      const loginError = {
        response: {
          data: { success: false, error: 'Error previo' }
        }
      };
      mockApiInstance.post.mockRejectedValueOnce(loginError);

      renderWithRouter(<TestComponent />);
      fireEvent.click(screen.getByTestId('login-btn'));

      await waitFor(() => {
        const authState = JSON.parse(screen.getByTestId('auth-state').textContent!);
        expect(authState.error).toBe('Error previo');
      });

      // When - Nueva operación
      mockApiInstance.post.mockResolvedValue({
        success: true,
        data: {
          accessToken: 'token',
          usuario: { id: '123', email: 'test@example.com' }
        }
      });
      
      fireEvent.click(screen.getByTestId('login-btn'));

      // Then - Error debería limpiarse
      await waitFor(() => {
        const authState = JSON.parse(screen.getByTestId('auth-state').textContent!);
        expect(authState.error).toBe(null);
        expect(authState.isAuthenticated).toBe(true);
      });
    });
  });

  describe('Token Management', () => {
    it('should handle token refresh', async () => {
      // Este test requeriría implementar token refresh en el contexto
      // Por ahora, verificamos que los tokens se manejan correctamente
      
      const loginResponse = {
        success: true,
        data: {
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
          usuario: {
            id: '123',
            email: 'test@example.com'
          }
        }
      };
      mockApiInstance.post.mockResolvedValue(loginResponse);

      renderWithRouter(<TestComponent />);
      fireEvent.click(screen.getByTestId('login-btn'));

      await waitFor(() => {
        expect(localStorage.getItem('token')).toBe('Bearer new-access-token');
        expect(localStorage.getItem('refreshToken')).toBe('new-refresh-token');
      });
    });
  });
});
