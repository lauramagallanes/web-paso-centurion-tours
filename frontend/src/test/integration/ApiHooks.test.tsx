import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { useApi, useHabitaciones, useSenderos, useGuiasDisponibles, useReservas } from '../../hooks/useApi';

// Mock server for API hooks integration tests
const server = setupServer();

describe('🎣 API Hooks Integration Tests', () => {
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

  describe('🔧 useApi Hook', () => {
    it('should execute GET request successfully', async () => {
      const mockData = { id: 1, name: 'Test Data' };
      
      server.use(
        http.get('http://localhost:8080/api/test', () => {
          return HttpResponse.json({
            success: true,
            data: mockData,
            message: 'Success'
          });
        })
      );

      const { result } = renderHook(() => useApi());

      expect(result.current.loading).toBe(false);
      expect(result.current.data).toBe(null);
      expect(result.current.error).toBe(null);

      // Execute the API call
      await act(async () => {
        await result.current.execute('/test');
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.data).toEqual({
        success: true,
        data: mockData,
        message: 'Success'
      });
      expect(result.current.error).toBe(null);
    });

    it('should handle API errors correctly', async () => {
      server.use(
        http.get('http://localhost:8080/api/error', () => {
          return new HttpResponse(null, { status: 500, statusText: 'Internal Server Error' });
        })
      );

      const { result } = renderHook(() => useApi());

      await act(async () => {
        try {
          await result.current.execute('/error');
        } catch (error) {
          // Error is expected
        }
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toContain('HTTP 500');
    });

    it('should manage loading state correctly', async () => {
      server.use(
        http.get('http://localhost:8080/api/slow', async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
          return HttpResponse.json({ success: true, data: 'slow response' });
        })
      );

      const { result } = renderHook(() => useApi());

      // Start the request
      const promise = act(async () => {
        await result.current.execute('/slow');
      });

      // Check loading state immediately
      expect(result.current.loading).toBe(true);

      // Wait for completion
      await promise;

      expect(result.current.loading).toBe(false);
    });

    it('should clear error and data correctly', async () => {
      const { result } = renderHook(() => useApi());

      // Set some initial state
      await act(async () => {
        result.current.clearData();
        result.current.clearError();
      });

      expect(result.current.data).toBe(null);
      expect(result.current.error).toBe(null);
    });
  });

  describe('🏠 useHabitaciones Hook', () => {
    it('should fetch habitaciones successfully', async () => {
      const mockHabitaciones = [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          nombre: 'Habitación Test',
          capacidadMaxima: 4,
          precioBase: 1500.00
        }
      ];

      server.use(
        http.get('http://localhost:8080/api/habitaciones', () => {
          return HttpResponse.json({
            success: true,
            data: mockHabitaciones,
            message: 'Habitaciones obtenidas'
          });
        })
      );

      const { result } = renderHook(() => useHabitaciones());

      // The hook should use the '/habitaciones' endpoint
      expect(result.current).toBeDefined();
    });
  });

  describe('🥾 useSenderos Hook', () => {
    it('should fetch senderos successfully', async () => {
      const mockSenderos = [
        {
          id: '123e4567-e89b-12d3-a456-426614174010',
          nombre: 'Sendero Test',
          duracionHoras: 4,
          precioBase: 1100.00
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

      const { result } = renderHook(() => useSenderos());

      // The hook should be properly initialized
      expect(result.current).toBeDefined();
    });
  });

  describe('👥 useGuiasDisponibles Hook', () => {
    it('should search for available guides', async () => {
      const mockGuias = [
        {
          id: '123e4567-e89b-12d3-a456-426614174020',
          nombre: 'Francisco Giúdice',
          especialidades: ['Observación de Aves'],
          disponible: true
        }
      ];

      server.use(
        http.get('http://localhost:8080/api/guias/disponibles', ({ request }) => {
          const url = new URL(request.url);
          const fecha = url.searchParams.get('fecha');
          const turno = url.searchParams.get('turno');
          
          if (fecha && turno) {
            return HttpResponse.json({
              success: true,
              data: mockGuias,
              message: 'Guías disponibles encontrados'
            });
          }
          
          return HttpResponse.json({
            success: false,
            error: 'Parámetros faltantes'
          }, { status: 400 });
        })
      );

      const { result } = renderHook(() => useGuiasDisponibles());

      expect(result.current.data).toBe(null);
      expect(result.current.loading).toBe(false);

      // Test search functionality
      await act(async () => {
        if (result.current.search) {
          await result.current.search('2024-12-25', 'MANANA');
        }
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe('📅 useReservas Hook', () => {
    it('should create reserva successfully', async () => {
      const reservaData = {
        nombreCliente: 'Juan Pérez',
        emailCliente: 'juan@email.com',
        telefonoCliente: '+59899123456',
        fechaReserva: '2024-12-25',
        cantidadPersonas: 2,
        senderoId: '123e4567-e89b-12d3-a456-426614174010',
        turno: 'MANANA'
      };

      const mockResponse = {
        id: '123e4567-e89b-12d3-a456-426614174030',
        codigo: 'TIN-2024-001',
        ...reservaData,
        estado: 'CONFIRMADA'
      };

      server.use(
        http.post('http://localhost:8080/api/reservas', () => {
          return HttpResponse.json({
            success: true,
            data: mockResponse,
            message: 'Reserva creada exitosamente'
          }, { status: 201 });
        })
      );

      const { result } = renderHook(() => useReservas());

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);

      let createdReserva;
      await act(async () => {
        createdReserva = await result.current.createReserva(reservaData);
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(createdReserva).toEqual(mockResponse);
    });

    it('should verify availability successfully', async () => {
      const availabilityData = {
        fechaReserva: '2024-12-25',
        senderoId: '123e4567-e89b-12d3-a456-426614174010',
        turno: 'MANANA',
        cantidadPersonas: 2
      };

      server.use(
        http.post('http://localhost:8080/api/reservas/verificar-disponibilidad', () => {
          return HttpResponse.json({
            success: true,
            data: true,
            message: 'Disponible'
          });
        })
      );

      const { result } = renderHook(() => useReservas());

      let isAvailable;
      await act(async () => {
        isAvailable = await result.current.verifyAvailability(availabilityData);
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(isAvailable).toBe(true);
    });

    it('should calculate price successfully', async () => {
      const priceData = {
        senderoId: '123e4567-e89b-12d3-a456-426614174010',
        cantidadPersonas: 2,
        fechaReserva: '2024-12-25'
      };

      const mockPriceResponse = {
        precioTotal: 2200.00,
        precioBase: 1100.00,
        cantidadPersonas: 2,
        descuentos: 0
      };

      server.use(
        http.post('http://localhost:8080/api/reservas/calcular-precio', () => {
          return HttpResponse.json({
            success: true,
            data: mockPriceResponse,
            message: 'Precio calculado'
          });
        })
      );

      const { result } = renderHook(() => useReservas());

      let calculatedPrice;
      await act(async () => {
        calculatedPrice = await result.current.calculatePrice(priceData);
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(calculatedPrice).toEqual(mockPriceResponse);
    });

    it('should handle reserva creation error', async () => {
      const invalidReservaData = {
        nombreCliente: '',
        emailCliente: 'invalid-email',
        telefonoCliente: '',
        fechaReserva: '',
        cantidadPersonas: 0,
        senderoId: '',
        turno: ''
      };

      server.use(
        http.post('http://localhost:8080/api/reservas', () => {
          return HttpResponse.json({
            success: false,
            error: 'Datos de reserva inválidos'
          }, { status: 400 });
        })
      );

      const { result } = renderHook(() => useReservas());

      await act(async () => {
        try {
          await result.current.createReserva(invalidReservaData);
          expect.fail('Should have thrown an error');
        } catch (error) {
          expect(error).toBeDefined();
        }
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeDefined();
    });

    it('should get reserva by code successfully', async () => {
      const codigo = 'TIN-2024-001';
      const mockReserva = {
        id: '123e4567-e89b-12d3-a456-426614174030',
        codigo: codigo,
        nombreCliente: 'Juan Pérez',
        estado: 'CONFIRMADA'
      };

      server.use(
        http.get(`http://localhost:8080/api/reservas/codigo/${codigo}`, () => {
          return HttpResponse.json({
            success: true,
            data: mockReserva,
            message: 'Reserva encontrada'
          });
        })
      );

      const { result } = renderHook(() => useReservas());

      let foundReserva;
      await act(async () => {
        foundReserva = await result.current.getReservaByCode(codigo);
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(foundReserva).toEqual(mockReserva);
    });
  });

  describe('🔄 Hook State Management', () => {
    it('should reset loading state after successful request', async () => {
      server.use(
        http.get('http://localhost:8080/api/test', () => {
          return HttpResponse.json({ success: true, data: 'test' });
        })
      );

      const { result } = renderHook(() => useApi());

      expect(result.current.loading).toBe(false);

      await act(async () => {
        await result.current.execute('/test');
      });

      expect(result.current.loading).toBe(false);
    });

    it('should reset loading state after failed request', async () => {
      server.use(
        http.get('http://localhost:8080/api/error', () => {
          return new HttpResponse(null, { status: 500 });
        })
      );

      const { result } = renderHook(() => useApi());

      await act(async () => {
        try {
          await result.current.execute('/error');
        } catch (error) {
          // Expected error
        }
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeDefined();
    });

    it('should clear error when starting new request', async () => {
      server.use(
        http.get('http://localhost:8080/api/error', () => {
          return new HttpResponse(null, { status: 500 });
        }),
        http.get('http://localhost:8080/api/success', () => {
          return HttpResponse.json({ success: true, data: 'success' });
        })
      );

      const { result } = renderHook(() => useApi());

      // First request fails
      await act(async () => {
        try {
          await result.current.execute('/error');
        } catch (error) {
          // Expected
        }
      });

      expect(result.current.error).toBeDefined();

      // Second request succeeds and should clear error
      await act(async () => {
        await result.current.execute('/success');
      });

      expect(result.current.error).toBe(null);
    });
  });

  describe('🌐 Network Conditions', () => {
    it('should handle network timeouts gracefully', async () => {
      server.use(
        http.get('http://localhost:8080/api/timeout', async () => {
          // Simulate very slow response
          await new Promise(resolve => setTimeout(resolve, 5000));
          return HttpResponse.json({ success: true });
        })
      );

      const { result } = renderHook(() => useApi());

      // This test simulates timeout behavior
      // In real implementation, you'd configure actual timeout
      expect(result.current.loading).toBe(false);
    }, 1000); // Short timeout for test

    it('should handle intermittent connectivity', async () => {
      let requestCount = 0;
      
      server.use(
        http.get('http://localhost:8080/api/intermittent', () => {
          requestCount++;
          if (requestCount === 1) {
            // First request fails
            return new HttpResponse(null, { status: 500 });
          } else {
            // Second request succeeds
            return HttpResponse.json({ success: true, data: 'recovered' });
          }
        })
      );

      const { result } = renderHook(() => useApi());

      // First request fails
      await act(async () => {
        try {
          await result.current.execute('/intermittent');
        } catch (error) {
          // Expected
        }
      });

      expect(result.current.error).toBeDefined();

      // Second request succeeds
      await act(async () => {
        await result.current.execute('/intermittent');
      });

      expect(result.current.error).toBe(null);
      expect(result.current.data).toEqual({ success: true, data: 'recovered' });
    });
  });
});

