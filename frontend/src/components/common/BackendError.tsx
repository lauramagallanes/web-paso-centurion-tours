import React from 'react';
import { Alert, Button, Spinner } from 'react-bootstrap';
import Icon from './Icon';

interface BackendErrorProps {
  error?: Error | string | null;
  loading?: boolean;
  onRetry: () => void;
  title?: string;
  description?: string;
  minHeight?: string;
}

const BackendError: React.FC<BackendErrorProps> = ({
  error,
  loading = false,
  onRetry,
  title,
  description,
  minHeight = '400px'
}) => {
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight }}>
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Cargando...</p>
        </div>
      </div>
    );
  }

  if (error) {
    // Handle both Error objects and string errors
    const errorMessage = typeof error === 'string' ? error : error.message || '';
    const is404 = errorMessage.includes('404') || errorMessage.includes('Not Found');
    
    console.log('🔍 BackendError Debug:', {
      error,
      errorMessage,
      is404,
      title
    });
    
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight }}>
        <div className="text-center">
          <Alert variant="warning" className="text-center">
            <Alert.Heading className="d-flex align-items-center justify-content-center">
              <Icon name="alert-triangle" className="me-2" />
              {is404 ? 'Backend en Desarrollo' : 'Error de Conexión'}
            </Alert.Heading>
            <p className="mb-3">
              {is404 
                ? (description || `${title || 'Esta funcionalidad'} aún no está disponible. El backend está siendo desarrollado.`)
                : `No se pudo cargar ${title?.toLowerCase() || 'la información'}. Error: ${errorMessage}`}
            </p>
            <Button variant="outline-warning" onClick={onRetry} disabled={loading}>
              <Icon name="refresh" className="me-2" />
              {loading ? 'Cargando...' : 'Reintentar'}
            </Button>
          </Alert>
        </div>
      </div>
    );
  }

  // No data state
  return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight }}>
      <div className="text-center">
        <Alert variant="info" className="text-center">
          <Alert.Heading className="d-flex align-items-center justify-content-center">
            <Icon name="inbox" className="me-2" />
            Sin Datos Disponibles
          </Alert.Heading>
          <p className="mb-3">No hay {title?.toLowerCase() || 'información'} disponible en este momento.</p>
          <Button variant="outline-primary" onClick={onRetry} disabled={loading}>
            <Icon name="refresh" className="me-2" />
            Cargar Datos
          </Button>
        </Alert>
      </div>
    </div>
  );
};

export default BackendError;
