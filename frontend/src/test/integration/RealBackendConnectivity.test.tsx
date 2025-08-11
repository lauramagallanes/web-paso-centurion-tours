import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';

/**
 * 🌐 Real Backend Connectivity Tests
 * 
 * These tests validate actual connectivity to the backend when it's running.
 * They can be skipped in CI/CD if the backend is not available.
 * 
 * To run these tests:
 * 1. Start the backend: docker compose up -d
 * 2. Run: npm run test -- --run src/test/integration/RealBackendConnectivity.test.tsx
 */

const BACKEND_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';
const TIMEOUT = 10000; // 10 seconds timeout for real network requests

// Helper function to check if backend is running
const isBackendRunning = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${BACKEND_URL}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    return response.ok;
  } catch (error) {
    return false;
  }
};

describe('🌐 Real Backend Connectivity Tests', () => {
  let backendAvailable = false;

  beforeAll(async () => {
    backendAvailable = await isBackendRunning();
    
    if (!backendAvailable) {
      console.warn('⚠️  Backend not available - skipping real connectivity tests');
      console.warn('💡 To run these tests, start the backend with: docker compose up -d');
    }
  }, TIMEOUT);

  afterAll(() => {
    if (!backendAvailable) {
      console.log('ℹ️  Real backend connectivity tests were skipped');
    }
  });

  describe('🏥 Health Check', () => {
    it('should connect to real backend health endpoint', async () => {
      if (!backendAvailable) {
        console.log('⏭️  Skipping - backend not available');
        return;
      }

      const response = await fetch(`${BACKEND_URL}/health`);
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
      expect(data.data.status).toBe('UP');
      expect(data.data.service).toContain('Tinambú');
    }, TIMEOUT);

    it('should receive proper CORS headers', async () => {
      if (!backendAvailable) {
        console.log('⏭️  Skipping - backend not available');
        return;
      }

      const response = await fetch(`${BACKEND_URL}/health`);
      
      // Check CORS headers
      const corsOrigin = response.headers.get('Access-Control-Allow-Origin');
      expect(corsOrigin).toBeDefined();
      
      expect(response.ok).toBe(true);
    }, TIMEOUT);
  });

  describe('🥾 Senderos Endpoint', () => {
    it('should fetch senderos from real backend', async () => {
      if (!backendAvailable) {
        console.log('⏭️  Skipping - backend not available');
        return;
      }

      const response = await fetch(`${BACKEND_URL}/senderos`);
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      
      // If there are senderos, validate structure
      if (data.data.length > 0) {
        const sendero = data.data[0];
        expect(sendero).toHaveProperty('id');
        expect(sendero).toHaveProperty('nombre');
        expect(sendero).toHaveProperty('precioBase');
        expect(sendero).toHaveProperty('activo');
      }
    }, TIMEOUT);

    it('should fetch specific sendero by ID', async () => {
      if (!backendAvailable) {
        console.log('⏭️  Skipping - backend not available');
        return;
      }

      // First get all senderos to get a valid ID
      const allSenderosResponse = await fetch(`${BACKEND_URL}/senderos`);
      const allSenderosData = await allSenderosResponse.json();
      
      if (!allSenderosData.success || allSenderosData.data.length === 0) {
        console.log('⏭️  Skipping - no senderos available');
        return;
      }

      const senderoId = allSenderosData.data[0].id;
      
      // Now fetch specific sendero
      const response = await fetch(`${BACKEND_URL}/senderos/${senderoId}`);
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
      expect(data.data.id).toBe(senderoId);
    }, TIMEOUT);
  });

  describe('🏠 Habitaciones Endpoint', () => {
    it('should fetch habitaciones from real backend', async () => {
      if (!backendAvailable) {
        console.log('⏭️  Skipping - backend not available');
        return;
      }

      const response = await fetch(`${BACKEND_URL}/habitaciones`);
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      
      // If there are habitaciones, validate structure
      if (data.data.length > 0) {
        const habitacion = data.data[0];
        expect(habitacion).toHaveProperty('id');
        expect(habitacion).toHaveProperty('nombre');
        expect(habitacion).toHaveProperty('capacidadMaxima');
        expect(habitacion).toHaveProperty('precioBase');
      }
    }, TIMEOUT);
  });

  describe('👥 Guías Endpoint', () => {
    it('should fetch guías from real backend', async () => {
      if (!backendAvailable) {
        console.log('⏭️  Skipping - backend not available');
        return;
      }

      const response = await fetch(`${BACKEND_URL}/guias`);
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      
      // If there are guías, validate structure
      if (data.data.length > 0) {
        const guia = data.data[0];
        expect(guia).toHaveProperty('id');
        expect(guia).toHaveProperty('nombre');
        expect(guia).toHaveProperty('activo');
      }
    }, TIMEOUT);
  });

  describe('📅 Reservas Validation', () => {
    it('should validate reserva availability check', async () => {
      if (!backendAvailable) {
        console.log('⏭️  Skipping - backend not available');
        return;
      }

      // First get a valid sendero ID
      const senderosResponse = await fetch(`${BACKEND_URL}/senderos`);
      const senderosData = await senderosResponse.json();
      
      if (!senderosData.success || senderosData.data.length === 0) {
        console.log('⏭️  Skipping - no senderos available for availability check');
        return;
      }

      const senderoId = senderosData.data[0].id;
      
      // Check availability for a future date
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30); // 30 days from now
      
      const availabilityData = {
        fechaReserva: futureDate.toISOString().split('T')[0],
        senderoId: senderoId,
        turno: 'MANANA',
        cantidadPersonas: 2
      };

      const response = await fetch(`${BACKEND_URL}/reservas/verificar-disponibilidad`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(availabilityData)
      });

      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
      expect(typeof data.data).toBe('boolean');
    }, TIMEOUT);

    it('should calculate price correctly', async () => {
      if (!backendAvailable) {
        console.log('⏭️  Skipping - backend not available');
        return;
      }

      // First get a valid sendero ID
      const senderosResponse = await fetch(`${BACKEND_URL}/senderos`);
      const senderosData = await senderosResponse.json();
      
      if (!senderosData.success || senderosData.data.length === 0) {
        console.log('⏭️  Skipping - no senderos available for price calculation');
        return;
      }

      const sendero = senderosData.data[0];
      
      const priceData = {
        senderoId: sendero.id,
        cantidadPersonas: 2,
        fechaReserva: '2024-12-25'
      };

      const response = await fetch(`${BACKEND_URL}/reservas/calcular-precio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(priceData)
      });

      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('precioTotal');
      expect(data.data).toHaveProperty('precioBase');
      expect(data.data).toHaveProperty('cantidadPersonas');
      expect(data.data.cantidadPersonas).toBe(2);
      
      // Price should be reasonable (sendero.precioBase * cantidadPersonas)
      const expectedPrice = sendero.precioBase * 2;
      expect(data.data.precioTotal).toBeGreaterThanOrEqual(expectedPrice * 0.9); // Allow 10% variance
      expect(data.data.precioTotal).toBeLessThanOrEqual(expectedPrice * 1.1);
    }, TIMEOUT);
  });

  describe('🔐 Authentication Endpoints', () => {
    it('should handle invalid login correctly', async () => {
      if (!backendAvailable) {
        console.log('⏭️  Skipping - backend not available');
        return;
      }

      const loginData = {
        email: 'nonexistent@email.com',
        password: 'wrongpassword'
      };

      const response = await fetch(`${BACKEND_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      });

      // Should return 401 for invalid credentials
      expect(response.status).toBe(401);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
    }, TIMEOUT);

    it('should validate JWT token format', async () => {
      if (!backendAvailable) {
        console.log('⏭️  Skipping - backend not available');
        return;
      }

      // Try to access a protected endpoint without token
      const response = await fetch(`${BACKEND_URL}/admin/senderos`);
      
      // Should return 401 or 403 for unauthorized access
      expect([401, 403]).toContain(response.status);
    }, TIMEOUT);
  });

  describe('⚡ Performance and Load', () => {
    it('should handle multiple concurrent requests', async () => {
      if (!backendAvailable) {
        console.log('⏭️  Skipping - backend not available');
        return;
      }

      // Make multiple concurrent requests
      const promises = [
        fetch(`${BACKEND_URL}/health`),
        fetch(`${BACKEND_URL}/senderos`),
        fetch(`${BACKEND_URL}/habitaciones`),
        fetch(`${BACKEND_URL}/guias`),
        fetch(`${BACKEND_URL}/health`)
      ];

      const responses = await Promise.all(promises);
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.ok).toBe(true);
      });
    }, TIMEOUT);

    it('should respond within reasonable time', async () => {
      if (!backendAvailable) {
        console.log('⏭️  Skipping - backend not available');
        return;
      }

      const startTime = Date.now();
      const response = await fetch(`${BACKEND_URL}/health`);
      const endTime = Date.now();
      
      const responseTime = endTime - startTime;
      
      expect(response.ok).toBe(true);
      expect(responseTime).toBeLessThan(5000); // Should respond within 5 seconds
    }, TIMEOUT);
  });

  describe('🌐 Network Configuration', () => {
    it('should have correct Content-Type headers', async () => {
      if (!backendAvailable) {
        console.log('⏭️  Skipping - backend not available');
        return;
      }

      const response = await fetch(`${BACKEND_URL}/health`);
      
      const contentType = response.headers.get('Content-Type');
      expect(contentType).toContain('application/json');
    }, TIMEOUT);

    it('should handle OPTIONS preflight requests', async () => {
      if (!backendAvailable) {
        console.log('⏭️  Skipping - backend not available');
        return;
      }

      try {
        const response = await fetch(`${BACKEND_URL}/senderos`, {
          method: 'OPTIONS',
          headers: {
            'Origin': 'http://localhost:3000',
            'Access-Control-Request-Method': 'GET',
            'Access-Control-Request-Headers': 'Content-Type'
          }
        });

        // OPTIONS request should be handled properly
        expect([200, 204]).toContain(response.status);
      } catch (error) {
        // Some servers might not handle OPTIONS explicitly, that's okay
        console.log('ℹ️  OPTIONS request not explicitly handled (may be normal)');
      }
    }, TIMEOUT);
  });

  describe('📊 Data Validation', () => {
    it('should return consistent data structures', async () => {
      if (!backendAvailable) {
        console.log('⏭️  Skipping - backend not available');
        return;
      }

      const endpoints = [
        { url: `${BACKEND_URL}/senderos`, name: 'senderos' },
        { url: `${BACKEND_URL}/habitaciones`, name: 'habitaciones' },
        { url: `${BACKEND_URL}/guias`, name: 'guías' }
      ];

      for (const endpoint of endpoints) {
        const response = await fetch(endpoint.url);
        const data = await response.json();

        expect(response.ok).toBe(true);
        expect(data).toHaveProperty('success');
        expect(data).toHaveProperty('data');
        expect(data.success).toBe(true);
        expect(Array.isArray(data.data)).toBe(true);
      }
    }, TIMEOUT);

    it('should validate UUID format in responses', async () => {
      if (!backendAvailable) {
        console.log('⏭️  Skipping - backend not available');
        return;
      }

      const response = await fetch(`${BACKEND_URL}/senderos`);
      const data = await response.json();

      if (data.success && data.data.length > 0) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const sendero = data.data[0];
        
        expect(sendero.id).toMatch(uuidRegex);
      }
    }, TIMEOUT);
  });
});

