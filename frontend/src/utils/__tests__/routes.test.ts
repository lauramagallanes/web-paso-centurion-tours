import { describe, it, expect } from 'vitest';
import { routes } from '../routes';

describe('Routes Utils', () => {
  it('exports all required route constants', () => {
    expect(routes.home).toBe('/');
    expect(routes.about).toBe('/about');
    expect(routes.activities).toBe('/activities');
    expect(routes.accomodations).toBe('/accomodations');
    expect(routes.book).toBe('/book');
    expect(routes.login).toBe('/login');
    expect(routes.myBookings).toBe('/my-bookings');
    expect(routes.privacy).toBe('/privacy');
    expect(routes.terms).toBe('/terms');
    expect(routes.cookies).toBe('/cookies');
  });

  it('all routes are strings', () => {
    Object.values(routes).forEach(route => {
      expect(typeof route).toBe('string');
      expect(route.startsWith('/')).toBe(true);
    });
  });
});
