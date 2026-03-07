import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Spinner, Container } from 'react-bootstrap';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAdmin = false 
}) => {
  const { state } = useAuth();
  const location = useLocation();

  // Mostrar loading mientras se verifica la autenticación
  if (state.loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Verificando autenticación...</p>
        </div>
      </Container>
    );
  }

  // Si no está autenticado, redirigir al login
  if (!state.isAuthenticated || !state.user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && state.user.tipo !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
