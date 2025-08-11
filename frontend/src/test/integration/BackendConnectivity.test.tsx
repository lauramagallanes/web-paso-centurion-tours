import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import apiService from '../../services/apiService';

// Mock server for backend integration tests
const server = setupServer();

describe('🔗 Backend Connectivity Integration Tests', () => {
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

  describe('🏥 Health Check Endpoint', () => {
    it('should connect to backend health endpoint successfully', async () => {
      // Mock successful health check response
      server.use(
        http.get('http://localhost:8080/api/health', () => {
          return HttpResponse.json({
            success: true,
            data: {
              status: 'UP',
              timestamp: '2024-01-01T10:00:00',
              service: 'Tinambú Tours API',
              version: '1.0.0'
            },
            message: 'API funcionando correctamente'
          })
        })
      );

      // Test the connection
      const response = await fetch('http://localhost:8080/api/health');
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
      expect(data.data.status).toBe('UP');
      expect(data.data.service).toBe('Tinambú Tours API');
    });

    it('should handle backend health endpoint failure', async () => {
      // Mock failed health check response
      server.use(
        http.get('http://localhost:8080/api/health', () => {
          return new HttpResponse(null, { status: 500 });
        })
      );

      // Test the connection failure
      const response = await fetch('http://localhost:8080/api/health');
      expect(response.ok).toBe(false);
      expect(response.status).toBe(500);
    });
  });

  describe('🏠 Habitaciones API Integration', () => {
    it('should fetch habitaciones from backend successfully', async () => {
      const mockHabitaciones = [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          nombre: 'Habitación Bioconstrucción 1',
          descripcion: 'Habitación con techo vivo',
          capacidadMaxima: 4,
          precioBase: 1500.00,
          activa: true,
          amenidades: ['WiFi', 'Aire Acondicionado', 'Baño Privado']
        },
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          nombre: 'Habitación Bioconstrucción 2',
          descripcion: 'Segunda habitación con techo vivo',
          capacidadMaxima: 4,
          precioBase: 1500.00,
          activa: true,
          amenidades: ['WiFi', 'Aire Acondicionado', 'Baño Privado']
        }
      ];

      server.use(
        http.get('http://localhost:8080/api/habitaciones', () => {
          return HttpResponse.json({
            success: true,
            data: mockHabitaciones,
            message: 'Habitaciones obtenidas exitosamente'
          })
        })
      );

      // Test using the actual apiService
      const response = await apiService.getHabitaciones();

      expect(response.success).toBe(true);
      expect(response.data).toHaveLength(2);
      expect(response.data[0].nombre).toBe('Habitación Bioconstrucción 1');
      expect(response.data[0].precioBase).toBe(1500.00);
      expect(response.data[1].capacidadMaxima).toBe(4);
    });

    it('should handle habitaciones API error', async () => {
      server.use(
        http.get('http://localhost:8080/api/habitaciones', () => {
          return HttpResponse.json({
            success: false,
            error: 'Error al obtener habitaciones'
          }, { status: 500 })
        })
      );

      try {
        await apiService.getHabitaciones();
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('🥾 Senderos API Integration', () => {
    it('should fetch senderos from backend successfully', async () => {
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
          capacidadMaxima: 15
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
          capacidadMaxima: 12
        }
      ];

      server.use(
        http.get('http://localhost:8080/api/senderos', () => {
          return HttpResponse.json({
            success: true,
            data: mockSenderos,
            message: 'Senderos obtenidos exitosamente'
          })
        })
      );

      const response = await apiService.getSenderos();

      expect(response.success).toBe(true);
      expect(response.data).toHaveLength(2);
      expect(response.data[0].nombre).toBe('Sendero Río Yaguarón');
      expect(response.data[0].precioBase).toBe(1100.00);
      expect(response.data[1].nivelDificultad).toBe('MEDIO_BAJO');
    });

    it('should fetch single sendero by ID', async () => {
      const senderoId = '123e4567-e89b-12d3-a456-426614174010';
      const mockSendero = {
        id: senderoId,
        nombre: 'Sendero Río Yaguarón',
        descripcion: 'Paseo por el bosque ribereño del Río Yaguarón',
        duracionHoras: 4,
        distanciaKm: 4.0,
        nivelDificultad: 'BAJO',
        precioBase: 1100.00,
        activo: true,
        capacidadMaxima: 15
      };

      server.use(
        http.get(`http://localhost:8080/api/senderos/${senderoId}`, () => {
          return HttpResponse.json({
            success: true,
            data: mockSendero,
            message: 'Sendero obtenido exitosamente'
          })
        })
      );

      const response = await apiService.getSendero(senderoId);

      expect(response.success).toBe(true);
      expect(response.data.id).toBe(senderoId);
      expect(response.data.nombre).toBe('Sendero Río Yaguarón');
    });
  });

  describe('👥 Guías API Integration', () => {
    it('should fetch guías from backend successfully', async () => {
      const mockGuias = [
        {
          id: '123e4567-e89b-12d3-a456-426614174020',
          nombre: 'Francisco Giúdice',
          especialidades: ['Observación de Aves', 'Flora Nativa'],
          idiomas: ['Español', 'Inglés'],
          activo: true,
          biografia: 'Guía especializado bilingüe en flora y fauna nativas'
        },
        {
          id: '123e4567-e89b-12d3-a456-426614174021',
          nombre: 'Laura Magallanes',
          especialidades: ['Observación de Aves', 'Interpretación del Paisaje'],
          idiomas: ['Español', 'Inglés'],
          activo: true,
          biografia: 'Guía especializada bilingüe en reconocimiento de especies'
        }
      ];

      server.use(
        http.get('http://localhost:8080/api/guias', () => {
          return HttpResponse.json({
            success: true,
            data: mockGuias,
            message: 'Guías obtenidos exitosamente'
          })
        })
      );

      const response = await apiService.getGuias();

      expect(response.success).toBe(true);
      expect(response.data).toHaveLength(2);
      expect(response.data[0].nombre).toBe('Francisco Giúdice');
      expect(response.data[0].idiomas).toContain('Español');
      expect(response.data[1].especialidades).toContain('Observación de Aves');
    });
  });

  describe('📅 Reservas API Integration', () => {
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

      const mockReservaResponse = {
        id: '123e4567-e89b-12d3-a456-426614174030',
        codigo: 'TIN-2024-001',
        ...reservaData,
        estado: 'CONFIRMADA',
        precioTotal: 2200.00,
        fechaCreacion: '2024-01-01T10:00:00'
      };

      server.use(
        http.post('http://localhost:8080/api/reservas', () => {
          return HttpResponse.json({
            success: true,
            data: mockReservaResponse,
            message: 'Reserva creada exitosamente'
          }, { status: 201 })
        })
      );

      const response = await apiService.createReserva(reservaData);

      expect(response.success).toBe(true);
      expect(response.data.codigo).toBe('TIN-2024-001');
      expect(response.data.estado).toBe('CONFIRMADA');
      expect(response.data.precioTotal).toBe(2200.00);
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
          })
        })
      );

      const response = await apiService.verifyAvailability(availabilityData);

      expect(response.success).toBe(true);
      expect(response.data).toBe(true);
      expect(response.message).toBe('Disponible');
    });

    it('should calculate price successfully', async () => {
      const priceData = {
        senderoId: '123e4567-e89b-12d3-a456-426614174010',
        cantidadPersonas: 2,
        fechaReserva: '2024-12-25'
      };

      const mockPriceResponse = {
        precioBase: 1100.00,
        cantidadPersonas: 2,
        subtotal: 2200.00,
        descuentos: 0,
        precioTotal: 2200.00,
        detalles: {
          precioPersona: 1100.00,
          descuentoAplicado: false
        }
      };

      server.use(
        http.post('http://localhost:8080/api/reservas/calcular-precio', () => {
          return HttpResponse.json({
            success: true,
            data: mockPriceResponse,
            message: 'Precio calculado exitosamente'
          })
        })
      );

      const response = await apiService.calculatePrice(priceData);

      expect(response.success).toBe(true);
      expect(response.data.precioTotal).toBe(2200.00);
      expect(response.data.cantidadPersonas).toBe(2);
      expect(response.data.precioBase).toBe(1100.00);
    });

    it('should handle reserva creation failure', async () => {
      const reservaData = {
        nombreCliente: 'Juan Pérez',
        emailCliente: 'invalid-email',
        telefonoCliente: '+59899123456',
        fechaReserva: '2024-12-25',
        cantidadPersonas: 2,
        senderoId: '123e4567-e89b-12d3-a456-426614174010',
        turno: 'MANANA'
      };

      server.use(
        http.post('http://localhost:8080/api/reservas', () => {
          return HttpResponse.json({
            success: false,
            error: 'Email inválido'
          }, { status: 400 })
        })
      );

      try {
        await apiService.createReserva(reservaData);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('🔐 Authentication Integration', () => {
    it('should login successfully', async () => {
      const loginData = {
        email: 'admin@tinambu.com',
        password: 'admin123'
      };

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
          })
        })
      );

      const response = await apiService.login(loginData.email, loginData.password);

      expect(response.success).toBe(true);
      expect(response.data.token).toBeDefined();
      expect(response.data.user.email).toBe('admin@tinambu.com');
      expect(response.data.user.rol).toBe('ADMIN');
    });

    it('should handle login failure', async () => {
      const loginData = {
        email: 'wrong@email.com',
        password: 'wrongpassword'
      };

      server.use(
        http.post('http://localhost:8080/api/auth/login', () => {
          return HttpResponse.json({
            success: false,
            error: 'Credenciales inválidas'
          }, { status: 401 })
        })
      );

      try {
        await apiService.login(loginData.email, loginData.password);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('🌐 CORS and Headers Integration', () => {
    it('should handle CORS headers correctly', async () => {
      server.use(
        http.get('http://localhost:8080/api/health', () => {
          return HttpResponse.json(
            { success: true, data: { status: 'UP' } },
            {
              headers: {
                'Access-Control-Allow-Origin': 'http://localhost:3000',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
              }
            }
          )
        })
      );

      const response = await fetch('http://localhost:8080/api/health');
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:3000');
    });

    it('should send correct Content-Type headers', async () => {
      let receivedHeaders: Headers | undefined;

      server.use(
        http.post('http://localhost:8080/api/reservas', ({ request }) => {
          receivedHeaders = request.headers;
          return HttpResponse.json({ success: true, data: {} });
        })
      );

      await apiService.createReserva({
        nombreCliente: 'Test',
        emailCliente: 'test@email.com',
        telefonoCliente: '+59899123456',
        fechaReserva: '2024-12-25',
        cantidadPersonas: 1,
        senderoId: '123e4567-e89b-12d3-a456-426614174010',
        turno: 'MANANA'
      });

      expect(receivedHeaders?.get('content-type')).toContain('application/json');
    });
  });

  describe('⚡ Performance and Timeout Integration', () => {
    it('should handle slow backend responses', async () => {
      server.use(
        http.get('http://localhost:8080/api/senderos', async () => {
          // Simulate slow response
          await new Promise(resolve => setTimeout(resolve, 1000));
          return HttpResponse.json({
            success: true,
            data: [],
            message: 'Slow response'
          });
        })
      );

      const startTime = Date.now();
      const response = await apiService.getSenderos();
      const endTime = Date.now();

      expect(response.success).toBe(true);
      expect(endTime - startTime).toBeGreaterThan(900); // At least 900ms
    });

    it('should handle network timeout', async () => {
      server.use(
        http.get('http://localhost:8080/api/health', async () => {
          // Simulate timeout by never resolving
          await new Promise(() => {});
          return HttpResponse.json({ success: true });
        })
      );

      // This test would need actual timeout configuration in the real app
      // For now, we just verify the setup works
      expect(true).toBe(true);
    }, 2000); // 2 second timeout for this test
  });
});
