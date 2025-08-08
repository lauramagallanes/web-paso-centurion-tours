import React from 'react';
import { AuthProvider } from './AuthContext';
import { BookingProvider } from './BookingContext';

// Componente principal que combina todos los providers
const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AuthProvider>
      <BookingProvider>
        {children}
      </BookingProvider>
    </AuthProvider>
  );
};

export default AppProviders;