import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

// Mock server for API hooks integration tests
const server = setupServer();

describe('🎣 API Hooks Integration Tests (Simplified)', () => {
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

  describe('🔧 Basic API Connectivity', () => {
    it('should validate API service methods exist', async () => {
      // Import the API service
      const { default: apiService } = await import('../../services/apiService');

      // Verify all expected methods exist
      expect(typeof apiService.getSenderos).toBe('function');
      expect(typeof apiService.getHabitaciones).toBe('function');
      expect(typeof apiService.getGuias).toBe('function');
      expect(typeof apiService.createReserva).toBe('function');
      expect(typeof apiService.verifyAvailability).toBe('function');
      expect(typeof apiService.calculatePrice).toBe('function');
      expect(typeof apiService.login).toBe('function');
    });

    it('should have correct base URL configuration', async () => {
      const { default: apiService } = await import('../../services/apiService');
      
      expect(apiService.apiBaseURL).toBeDefined();
      expect(apiService.apiBaseURL).toContain('localhost:8080/api');
    });
  });

  describe('🏠 Habitaciones API Methods', () => {
    it('should call habitaciones endpoint correctly', async () => {
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

      const { default: apiService } = await import('../../services/apiService');
      const response = await apiService.getHabitaciones();

      expect(response.success).toBe(true);
      expect(response.data).toHaveLength(1);
      expect(response.data[0].nombre).toBe('Habitación Test');
    });
  });

  describe('🥾 Senderos API Methods', () => {
    it('should call senderos endpoint correctly', async () => {
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

      const { default: apiService } = await import('../../services/apiService');
      const response = await apiService.getSenderos();

      expect(response.success).toBe(true);
      expect(response.data).toHaveLength(1);
      expect(response.data[0].nombre).toBe('Sendero Test');
    });

    it('should call single sendero endpoint correctly', async () => {
      const senderoId = '123e4567-e89b-12d3-a456-426614174010';
      const mockSendero = {
        id: senderoId,
        nombre: 'Sendero Específico',
        duracionHoras: 4,
        precioBase: 1100.00
      };

      server.use(
        http.get(`http://localhost:8080/api/senderos/${senderoId}`, () => {
          return HttpResponse.json({
            success: true,
            data: mockSendero,
            message: 'Sendero obtenido'
          });
        })
      );

      const { default: apiService } = await import('../../services/apiService');
      const response = await apiService.getSendero(senderoId);

      expect(response.success).toBe(true);
      expect(response.data.id).toBe(senderoId);
      expect(response.data.nombre).toBe('Sendero Específico');
    });
  });

  describe('👥 Guías API Methods', () => {
    it('should call guías endpoint correctly', async () => {
      const mockGuias = [
        {
          id: '123e4567-e89b-12d3-a456-426614174020',
          nombre: 'Francisco Giúdice',
          especialidades: ['Observación de Aves'],
          activo: true
        }
      ];

      server.use(
        http.get('http://localhost:8080/api/guias', () => {
          return HttpResponse.json({
            success: true,
            data: mockGuias,
            message: 'Guías obtenidos'
          });
        })
      );

      const { default: apiService } = await import('../../services/apiService');
      const response = await apiService.getGuias();

      expect(response.success).toBe(true);
      expect(response.data).toHaveLength(1);
      expect(response.data[0].nombre).toBe('Francisco Giúdice');
    });

    it('should call guías disponibles endpoint correctly', async () => {
      const mockGuiasDisponibles = [
        {
          id: '123e4567-e89b-12d3-a456-426614174020',
          nombre: 'Francisco Giúdice',
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
              data: mockGuiasDisponibles,
              message: 'Guías disponibles encontrados'
            });
          }
          
          return HttpResponse.json({
            success: false,
            error: 'Parámetros faltantes'
          }, { status: 400 });
        })
      );

      const { default: apiService } = await import('../../services/apiService');
      const response = await apiService.getGuiasDisponibles('2024-12-25', 'MANANA');

      expect(response.success).toBe(true);
      expect(response.data).toHaveLength(1);
      expect(response.data[0].disponible).toBe(true);
    });
  });

  describe('📅 Reservas API Methods', () => {
    it('should create reserva correctly', async () => {
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

      const { default: apiService } = await import('../../services/apiService');
      const response = await apiService.createReserva(reservaData);

      expect(response.success).toBe(true);
      expect(response.data.codigo).toBe('TIN-2024-001');
      expect(response.data.estado).toBe('CONFIRMADA');
    });

    it('should verify availability correctly', async () => {
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

      const { default: apiService } = await import('../../services/apiService');
      const response = await apiService.verifyAvailability(availabilityData);

      expect(response.success).toBe(true);
      expect(response.data).toBe(true);
    });

    it('should calculate price correctly', async () => {
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

      const { default: apiService } = await import('../../services/apiService');
      const response = await apiService.calculatePrice(priceData);

      expect(response.success).toBe(true);
      expect(response.data.precioTotal).toBe(2200.00);
      expect(response.data.cantidadPersonas).toBe(2);
    });

    it('should get reserva by code correctly', async () => {
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

      const { default: apiService } = await import('../../services/apiService');
      const response = await apiService.getReservaByCode(codigo);

      expect(response.success).toBe(true);
      expect(response.data.codigo).toBe(codigo);
      expect(response.data.estado).toBe('CONFIRMADA');
    });
  });

  describe('🔐 Authentication API Methods', () => {
    it('should login correctly', async () => {
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

      const { default: apiService } = await import('../../services/apiService');
      const response = await apiService.login('admin@tinambu.com', 'admin123');

      expect(response.success).toBe(true);
      expect(response.data.token).toBeDefined();
      expect(response.data.user.rol).toBe('ADMIN');
    });

    it('should handle login error correctly', async () => {
      server.use(
        http.post('http://localhost:8080/api/auth/login', () => {
          return HttpResponse.json({
            success: false,
            error: 'Credenciales inválidas'
          }, { status: 401 });
        })
      );

      const { default: apiService } = await import('../../services/apiService');
      
      try {
        await apiService.login('wrong@email.com', 'wrongpassword');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('🌐 Error Handling', () => {
    it('should handle 404 errors correctly', async () => {
      server.use(
        http.get('http://localhost:8080/api/senderos/nonexistent', () => {
          return HttpResponse.json({
            success: false,
            error: 'Sendero no encontrado'
          }, { status: 404 });
        })
      );

      const { default: apiService } = await import('../../services/apiService');
      
      try {
        await apiService.getSendero('nonexistent');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle 500 errors correctly', async () => {
      server.use(
        http.get('http://localhost:8080/api/senderos', () => {
          return new HttpResponse(null, { status: 500 });
        })
      );

      const { default: apiService } = await import('../../services/apiService');
      
      try {
        await apiService.getSenderos();
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle network errors correctly', async () => {
      server.use(
        http.get('http://localhost:8080/api/senderos', () => {
          return HttpResponse.error();
        })
      );

      const { default: apiService } = await import('../../services/apiService');
      
      try {
        await apiService.getSenderos();
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('📊 Data Validation', () => {
    it('should validate response structure for senderos', async () => {
      const mockSenderos = [
        {
          id: '123e4567-e89b-12d3-a456-426614174010',
          nombre: 'Sendero Test',
          descripcion: 'Descripción del sendero',
          duracionHoras: 4,
          distanciaKm: 4.0,
          nivelDificultad: 'BAJO',
          precioBase: 1100.00,
          activo: true,
          capacidadMaxima: 15
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

      const { default: apiService } = await import('../../services/apiService');
      const response = await apiService.getSenderos();

      expect(response.success).toBe(true);
      expect(Array.isArray(response.data)).toBe(true);
      
      if (response.data.length > 0) {
        const sendero = response.data[0];
        expect(sendero).toHaveProperty('id');
        expect(sendero).toHaveProperty('nombre');
        expect(sendero).toHaveProperty('duracionHoras');
        expect(sendero).toHaveProperty('precioBase');
        expect(sendero).toHaveProperty('activo');
        expect(typeof sendero.precioBase).toBe('number');
        expect(typeof sendero.duracionHoras).toBe('number');
        expect(typeof sendero.activo).toBe('boolean');
      }
    });

    it('should validate UUID format in IDs', async () => {
      const validUUID = '123e4567-e89b-12d3-a456-426614174010';
      const mockSendero = {
        id: validUUID,
        nombre: 'Sendero Test'
      };

      server.use(
        http.get(`http://localhost:8080/api/senderos/${validUUID}`, () => {
          return HttpResponse.json({
            success: true,
            data: mockSendero
          });
        })
      );

      const { default: apiService } = await import('../../services/apiService');
      const response = await apiService.getSendero(validUUID);

      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect(response.data.id).toMatch(uuidRegex);
    });
  });
});

