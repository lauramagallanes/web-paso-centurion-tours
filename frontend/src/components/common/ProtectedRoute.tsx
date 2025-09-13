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

  // Si requiere admin y no es admin, redirigir al home
  if (requireAdmin && state.user.tipo !== 'ADMIN') {
    console.log('🚫 ProtectedRoute ADMIN CHECK FAILED:', {
      requireAdmin: requireAdmin,
      userTipo: state.user?.tipo,
      fullUser: state.user,
      isEqual: state.user?.tipo === 'ADMIN'
    });
    return <Navigate to="/" replace />;
  }
  
  // Debug: log successful admin access
  if (requireAdmin && state.user.tipo === 'ADMIN') {
    console.log('✅ ProtectedRoute ADMIN ACCESS GRANTED:', {
      requireAdmin: requireAdmin,
      userTipo: state.user?.tipo,
      fullUser: state.user
    });
  }

  return <>{children}</>;
};

export default ProtectedRoute;
