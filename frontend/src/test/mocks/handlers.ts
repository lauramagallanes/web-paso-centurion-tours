import { http, HttpResponse } from 'msw';
import { createMockActivity, createMockAccommodation, createMockBooking } from '../utils/test-utils';

export const handlers = [
  // Activities endpoints
  http.get('/api/activities', () => {
    return HttpResponse.json([
      createMockActivity({ id: '1', title: 'Sendero Río Yaguarón' }),
      createMockActivity({ id: '2', title: 'Sendero Cuchilla del Yaguarón' }),
      createMockActivity({ id: '3', title: 'Sendero Cañada Guardia Vieja' }),
    ]);
  }),

  http.get('/api/activities/:id', ({ params }) => {
    return HttpResponse.json(
      createMockActivity({ id: params.id, title: 'Sendero Río Yaguarón' })
    );
  }),

  // Accommodations endpoints
  http.get('/api/accommodations', () => {
    return HttpResponse.json([
      createMockAccommodation({ id: '1', title: 'Habitación Bioconstrucción 1' }),
      createMockAccommodation({ id: '2', title: 'Habitación Bioconstrucción 2' }),
    ]);
  }),

  http.get('/api/accommodations/:id', ({ params }) => {
    return HttpResponse.json(
      createMockAccommodation({ id: params.id, title: 'Habitación Bioconstrucción 1' })
    );
  }),

  // Bookings endpoints
  http.get('/api/bookings', () => {
    return HttpResponse.json([
      createMockBooking({ id: '1', itemTitle: 'Sendero Río Yaguarón' }),
      createMockBooking({ id: '2', itemTitle: 'Habitación Bioconstrucción 1', type: 'accommodation' }),
    ]);
  }),

  http.post('/api/bookings', async ({ request }) => {
    const newBooking = await request.json();
    return HttpResponse.json({
      ...createMockBooking(),
      ...newBooking,
      id: Math.random().toString(36).substr(2, 9),
    }, { status: 201 });
  }),

  http.delete('/api/bookings/:id', ({ params }) => {
    return HttpResponse.json({ message: 'Booking deleted successfully' });
  }),

  // Auth endpoints
  http.post('/api/auth/login', async ({ request }) => {
    const { email, password } = await request.json();
    
    if (email === 'test@example.com' && password === 'password123') {
      return HttpResponse.json({
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
          isAdmin: false,
        },
        token: 'mock-jwt-token',
      });
    }
    
    return HttpResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    );
  }),

  http.post('/api/auth/register', async ({ request }) => {
    const userData = await request.json();
    return HttpResponse.json({
      user: {
        id: Math.random().toString(36).substr(2, 9),
        ...userData,
        isAdmin: false,
      },
      token: 'mock-jwt-token',
    }, { status: 201 });
  }),

  http.post('/api/auth/logout', () => {
    return HttpResponse.json({ message: 'Logged out successfully' });
  }),

  // Error simulation endpoints
  http.get('/api/error/500', () => {
    return HttpResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }),

  http.get('/api/error/404', () => {
    return HttpResponse.json(
      { error: 'Not found' },
      { status: 404 }
    );
  }),
];

