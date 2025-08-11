import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { CartProvider } from '../../contexts/CartContext';
import { FavoritesProvider } from '../../contexts/FavoritesContext';

// Custom render function that includes all providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <FavoritesProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </FavoritesProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };

// Helper function to create mock data
export const createMockActivity = (overrides = {}) => ({
  id: '1',
  title: 'Sendero Río Yaguarón',
  description: 'Paseo por el bosque ribereño del Río Yaguarón',
  price: 1100,
  duration: '4 horas',
  difficulty: 'bajo',
  image: 'https://example.com/image.jpg',
  category: 'senderismo',
  ...overrides,
});

export const createMockAccommodation = (overrides = {}) => ({
  id: '1',
  title: 'Habitación Bioconstrucción',
  description: 'Habitación sustentable con techo vivo',
  price: 1500,
  capacity: 4,
  amenities: ['WiFi', 'Aire acondicionado', 'Baño privado'],
  image: 'https://example.com/room.jpg',
  ...overrides,
});

export const createMockBooking = (overrides = {}) => ({
  id: '1',
  type: 'activity' as const,
  itemId: '1',
  itemTitle: 'Sendero Río Yaguarón',
  date: '2024-01-15',
  guests: 2,
  totalPrice: 2200,
  status: 'confirmed' as const,
  createdAt: '2024-01-10T10:00:00Z',
  ...overrides,
});

// Mock user event
export const mockUser = {
  id: '1',
  email: 'test@example.com',
  name: 'Test User',
  isAdmin: false,
};

