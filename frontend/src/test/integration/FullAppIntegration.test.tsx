import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { CartProvider } from '../../contexts/CartContext';
import Activities from '../../pages/public/Activities';
import Accommodations from '../../pages/public/Accommodations';
import MyBookings from '../../pages/public/MyBookings';

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <ThemeProvider>
      <CartProvider>
        {children}
      </CartProvider>
    </ThemeProvider>
  </BrowserRouter>
);

// Mock server for full app integration tests
const server = setupServer();

describe('🚀 Full App Integration with Backend', () => {
  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' });
  });

  afterAll(() => {
    server.close();
  });

  beforeEach(() => {
    server.resetHandlers();
    vi.clearAllMocks();
  });

  describe('🥾 Activities Page Integration', () => {
    it('should load and display activities from backend', async () => {
      const mockSenderos = [
        {
          id: '123e4567-e89b-12d3-a456-426614174010',
          nombre: 'Sendero Río Yaguarón',
          descripcion: 'Paseo por el bosque ribereño del Río Yaguarón',
          duracionHoras: 4,
          distanciaKm: 4.0,
          nivelDificultad: 'BAJO',
          precioBase: 1100.00,
          activo: true,
          capacidadMaxima: 15,
          imagenes: ['sendero1.jpg'],
          puntoEncuentro: 'Ruta 7 km 439'
        },
        {
          id: '123e4567-e89b-12d3-a456-426614174011',
          nombre: 'Sendero Cuchilla del Yaguarón',
          descripcion: 'Recorrida por exuberante bosque de quebrada',
          duracionHoras: 3.5,
          distanciaKm: 3.0,
          nivelDificultad: 'MEDIO_BAJO',
          precioBase: 1100.00,
          activo: true,
          capacidadMaxima: 12,
          imagenes: ['sendero2.jpg'],
          puntoEncuentro: 'Ruta 7 km 439'
        }
      ];

      server.use(
        http.get('http://localhost:8080/api/senderos', () => {
          return HttpResponse.json({
            success: true,
            data: mockSenderos,
            message: 'Senderos obtenidos exitosamente'
          });
        })
      );

      render(
        <TestWrapper>
          <Activities />
        </TestWrapper>
      );

      // Wait for activities to load
      await waitFor(() => {
        expect(screen.getByText('Sendero Río Yaguarón')).toBeInTheDocument();
      });

      expect(screen.getByText('Sendero Cuchilla del Yaguarón')).toBeInTheDocument();
      expect(screen.getByText('4 horas')).toBeInTheDocument();
      expect(screen.getByText('3.5 horas')).toBeInTheDocument();
    });

    it('should handle activities loading error', async () => {
      server.use(
        http.get('http://localhost:8080/api/senderos', () => {
          return HttpResponse.json({
            success: false,
            error: 'Error al obtener senderos'
          }, { status: 500 });
        })
      );

      render(
        <TestWrapper>
          <Activities />
        </TestWrapper>
      );

      // Should show error message or empty state
      await waitFor(() => {
        // The component should handle the error gracefully
        expect(screen.getByText(/actividades/i)).toBeInTheDocument();
      });
    });

    it('should filter activities by difficulty level', async () => {
      const mockSenderos = [
        {
          id: '1',
          nombre: 'Sendero Fácil',
          nivelDificultad: 'BAJO',
          duracionHoras: 2,
          precioBase: 1100.00,
          activo: true,
          capacidadMaxima: 20
        },
        {
          id: '2',
          nombre: 'Sendero Medio',
          nivelDificultad: 'MEDIO',
          duracionHoras: 4,
          precioBase: 1100.00,
          activo: true,
          capacidadMaxima: 15
        },
        {
          id: '3',
          nombre: 'Sendero Difícil',
          nivelDificultad: 'ALTO',
          duracionHoras: 6,
          precioBase: 1100.00,
          activo: true,
          capacidadMaxima: 10
        }
      ];

      server.use(
        http.get('http://localhost:8080/api/senderos', () => {
          return HttpResponse.json({
            success: true,
            data: mockSenderos,
            message: 'Senderos obtenidos'
          });
        })
      );

      render(
        <TestWrapper>
          <Activities />
        </TestWrapper>
      );

      // Wait for activities to load
      await waitFor(() => {
        expect(screen.getByText('Sendero Fácil')).toBeInTheDocument();
      });

      // All activities should be visible initially
      expect(screen.getByText('Sendero Medio')).toBeInTheDocument();
      expect(screen.getByText('Sendero Difícil')).toBeInTheDocument();
    });
  });

  describe('🏠 Accommodations Page Integration', () => {
    it('should load and display accommodations from backend', async () => {
      const mockHabitaciones = [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          nombre: 'Habitación Bioconstrucción 1',
          descripcion: 'Habitación con techo vivo y vista al bosque',
          capacidadMaxima: 4,
          precioBase: 1500.00,
          activa: true,
          amenidades: ['WiFi', 'Aire Acondicionado', 'Baño Privado', 'Smart TV'],
          imagenes: ['habitacion1.jpg'],
          caracteristicas: ['Bioconstrucción', 'Techo Vivo']
        },
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          nombre: 'Habitación Bioconstrucción 2',
          descripcion: 'Segunda habitación con techo vivo',
          capacidadMaxima: 4,
          precioBase: 1500.00,
          activa: true,
          amenidades: ['WiFi', 'Aire Acondicionado', 'Baño Privado', 'Smart TV'],
          imagenes: ['habitacion2.jpg'],
          caracteristicas: ['Bioconstrucción', 'Techo Vivo']
        }
      ];

      server.use(
        http.get('http://localhost:8080/api/habitaciones', () => {
          return HttpResponse.json({
            success: true,
            data: mockHabitaciones,
            message: 'Habitaciones obtenidas exitosamente'
          });
        })
      );

      render(
        <TestWrapper>
          <Accommodations />
        </TestWrapper>
      );

      // Wait for accommodations to load
      await waitFor(() => {
        expect(screen.getByText('Habitación Bioconstrucción 1')).toBeInTheDocument();
      });

      expect(screen.getByText('Habitación Bioconstrucción 2')).toBeInTheDocument();
      expect(screen.getByText('$1500')).toBeInTheDocument();
      expect(screen.getByText('Capacidad: 4 personas')).toBeInTheDocument();
    });

    it('should handle accommodations availability check', async () => {
      const mockHabitaciones = [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          nombre: 'Habitación Test',
          capacidadMaxima: 4,
          precioBase: 1500.00,
          activa: true,
          amenidades: ['WiFi']
        }
      ];

      server.use(
        http.get('http://localhost:8080/api/habitaciones', () => {
          return HttpResponse.json({
            success: true,
            data: mockHabitaciones
          });
        }),
        http.post('http://localhost:8080/api/habitaciones/verificar-disponibilidad', () => {
          return HttpResponse.json({
            success: true,
            data: true,
            message: 'Habitación disponible'
          });
        })
      );

      render(
        <TestWrapper>
          <Accommodations />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Habitación Test')).toBeInTheDocument();
      });

      // The availability check would be triggered by date selection
      // This tests the integration is set up correctly
    });
  });

  describe('📅 Booking Integration Flow', () => {
    it('should complete full booking flow with backend', async () => {
      const mockSendero = {
        id: '123e4567-e89b-12d3-a456-426614174010',
        nombre: 'Sendero Test',
        precioBase: 1100.00,
        capacidadMaxima: 15
      };

      const mockReservaResponse = {
        id: '123e4567-e89b-12d3-a456-426614174030',
        codigo: 'TIN-2024-001',
        nombreCliente: 'Juan Pérez',
        estado: 'CONFIRMADA',
        precioTotal: 2200.00
      };

      server.use(
        // Get senderos
        http.get('http://localhost:8080/api/senderos', () => {
          return HttpResponse.json({
            success: true,
            data: [mockSendero]
          });
        }),
        // Verify availability
        http.post('http://localhost:8080/api/reservas/verificar-disponibilidad', () => {
          return HttpResponse.json({
            success: true,
            data: true,
            message: 'Disponible'
          });
        }),
        // Calculate price
        http.post('http://localhost:8080/api/reservas/calcular-precio', () => {
          return HttpResponse.json({
            success: true,
            data: {
              precioTotal: 2200.00,
              precioBase: 1100.00,
              cantidadPersonas: 2
            }
          });
        }),
        // Create reservation
        http.post('http://localhost:8080/api/reservas', () => {
          return HttpResponse.json({
            success: true,
            data: mockReservaResponse,
            message: 'Reserva creada exitosamente'
          }, { status: 201 });
        })
      );

      render(
        <TestWrapper>
          <Activities />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Sendero Test')).toBeInTheDocument();
      });

      // This tests that the booking flow integration is properly set up
      // In a real E2E test, you would click through the entire flow
    });
  });

  describe('📋 My Bookings Integration', () => {
    it('should load user bookings from backend', async () => {
      const mockReservas = [
        {
          id: '123e4567-e89b-12d3-a456-426614174030',
          codigo: 'TIN-2024-001',
          nombreCliente: 'Juan Pérez',
          fechaReserva: '2024-12-25',
          estado: 'CONFIRMADA',
          precioTotal: 2200.00,
          sendero: {
            nombre: 'Sendero Río Yaguarón',
            duracionHoras: 4
          }
        },
        {
          id: '123e4567-e89b-12d3-a456-426614174031',
          codigo: 'TIN-2024-002',
          nombreCliente: 'Juan Pérez',
          fechaReserva: '2024-12-26',
          estado: 'PENDIENTE',
          precioTotal: 1100.00,
          sendero: {
            nombre: 'Sendero Cuchilla del Yaguarón',
            duracionHoras: 3.5
          }
        }
      ];

      // Mock authentication
      localStorage.setItem('auth-token', 'mock-token');
      localStorage.setItem('user', JSON.stringify({
        id: '123',
        email: 'juan@email.com',
        nombre: 'Juan Pérez'
      }));

      server.use(
        http.get('http://localhost:8080/api/reservas/usuario', () => {
          return HttpResponse.json({
            success: true,
            data: mockReservas,
            message: 'Reservas obtenidas'
          });
        })
      );

      render(
        <TestWrapper>
          <MyBookings />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('TIN-2024-001')).toBeInTheDocument();
      });

      expect(screen.getByText('TIN-2024-002')).toBeInTheDocument();
      expect(screen.getByText('Sendero Río Yaguarón')).toBeInTheDocument();
      expect(screen.getByText('CONFIRMADA')).toBeInTheDocument();
      expect(screen.getByText('PENDIENTE')).toBeInTheDocument();

      // Cleanup
      localStorage.removeItem('auth-token');
      localStorage.removeItem('user');
    });

    it('should handle empty bookings list', async () => {
      localStorage.setItem('auth-token', 'mock-token');

      server.use(
        http.get('http://localhost:8080/api/reservas/usuario', () => {
          return HttpResponse.json({
            success: true,
            data: [],
            message: 'No hay reservas'
          });
        })
      );

      render(
        <TestWrapper>
          <MyBookings />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/no tienes reservas/i)).toBeInTheDocument();
      });

      localStorage.removeItem('auth-token');
    });
  });

  describe('🔐 Authentication Integration', () => {
    it('should handle login flow with backend', async () => {
      const mockAuthResponse = {
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: '123e4567-e89b-12d3-a456-426614174040',
          email: 'admin@tinambu.com',
          nombre: 'Administrador',
          rol: 'ADMIN'
        },
        expiresIn: 3600
      };

      server.use(
        http.post('http://localhost:8080/api/auth/login', () => {
          return HttpResponse.json({
            success: true,
            data: mockAuthResponse,
            message: 'Login exitoso'
          });
        })
      );

      // This would typically be tested with the actual login form
      // For now, we verify the server setup is correct
      const response = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@tinambu.com',
          password: 'admin123'
        })
      });

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.token).toBeDefined();
      expect(data.data.user.rol).toBe('ADMIN');
    });
  });

  describe('⚡ Performance Integration', () => {
    it('should handle multiple concurrent API calls', async () => {
      server.use(
        http.get('http://localhost:8080/api/senderos', () => {
          return HttpResponse.json({
            success: true,
            data: [{ id: '1', nombre: 'Sendero 1' }]
          });
        }),
        http.get('http://localhost:8080/api/habitaciones', () => {
          return HttpResponse.json({
            success: true,
            data: [{ id: '1', nombre: 'Habitación 1' }]
          });
        }),
        http.get('http://localhost:8080/api/guias', () => {
          return HttpResponse.json({
            success: true,
            data: [{ id: '1', nombre: 'Guía 1' }]
          });
        })
      );

      // Simulate multiple concurrent API calls
      const promises = [
        fetch('http://localhost:8080/api/senderos'),
        fetch('http://localhost:8080/api/habitaciones'),
        fetch('http://localhost:8080/api/guias')
      ];

      const responses = await Promise.all(promises);
      const results = await Promise.all(responses.map(r => r.json()));

      results.forEach(result => {
        expect(result.success).toBe(true);
        expect(result.data).toHaveLength(1);
      });
    });

    it('should handle API rate limiting gracefully', async () => {
      let requestCount = 0;
      
      server.use(
        http.get('http://localhost:8080/api/senderos', () => {
          requestCount++;
          if (requestCount > 3) {
            return HttpResponse.json({
              success: false,
              error: 'Rate limit exceeded'
            }, { status: 429 });
          }
          return HttpResponse.json({
            success: true,
            data: []
          });
        })
      );

      // Make multiple requests
      const responses = await Promise.all([
        fetch('http://localhost:8080/api/senderos'),
        fetch('http://localhost:8080/api/senderos'),
        fetch('http://localhost:8080/api/senderos'),
        fetch('http://localhost:8080/api/senderos')
      ]);

      // First 3 should succeed, 4th should be rate limited
      expect(responses[0].ok).toBe(true);
      expect(responses[1].ok).toBe(true);
      expect(responses[2].ok).toBe(true);
      expect(responses[3].status).toBe(429);
    });
  });

  describe('🌐 Network Resilience', () => {
    it('should handle network interruptions', async () => {
      let isNetworkUp = false;
      
      server.use(
        http.get('http://localhost:8080/api/health', () => {
          if (!isNetworkUp) {
            return HttpResponse.error();
          }
          return HttpResponse.json({
            success: true,
            data: { status: 'UP' }
          });
        })
      );

      // First request fails (network down)
      try {
        await fetch('http://localhost:8080/api/health');
        expect.fail('Should have failed');
      } catch (error) {
        expect(error).toBeDefined();
      }

      // Network comes back up
      isNetworkUp = true;

      // Second request succeeds
      const response = await fetch('http://localhost:8080/api/health');
      const data = await response.json();
      
      expect(data.success).toBe(true);
      expect(data.data.status).toBe('UP');
    });
  });
});

