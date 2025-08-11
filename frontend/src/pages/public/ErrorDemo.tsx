import React, { useState } from 'react';
import Button from '../../components/common/Button';
import Card, { CardBody, CardHeader } from '../../components/common/Card';
import Icon from '../../components/common/Icon';
import './ErrorDemo.css';

const ErrorDemo: React.FC = () => {
  const [shouldThrow, setShouldThrow] = useState(false);

  const triggerError = () => {
    setShouldThrow(true);
  };

  const triggerNetworkError = () => {
    window.location.href = '/error-500';
  };

  const trigger404 = () => {
    window.location.href = '/pagina-que-no-existe';
  };

  if (shouldThrow) {
    throw new Error('Error de prueba generado intencionalmente para demostrar el ErrorBoundary');
  }

  return (
    <div className="error-demo-page">
      <div className="container">
        <div className="error-demo-header">
          <h1 className="page-title">Demostración de Páginas de Error</h1>
          <p className="page-description">
            Esta página te permite probar los diferentes tipos de errores y páginas de error 
            implementadas en la aplicación.
          </p>
        </div>

        <div className="error-demo-grid">
          <Card variant="flat" className="error-demo-card">
            <CardHeader>
              <h2 className="card-title">
                <Icon name="close" size="md" color="error" />
                Error Boundary (React Error)
              </h2>
            </CardHeader>
            <CardBody>
              <p className="card-description">
                Simula un error de JavaScript que será capturado por el Error Boundary. 
                Esto muestra cómo se maneja un error inesperado en el código React.
              </p>
              <Button 
                variant="danger" 
                size="lg" 
                onClick={triggerError}
                className="demo-button"
              >
                <Icon name="close" size="sm" />
                Generar Error React
              </Button>
            </CardBody>
          </Card>

          <Card variant="flat" className="error-demo-card">
            <CardHeader>
              <h2 className="card-title">
                <Icon name="close" size="md" color="warning" />
                Error 500 (Server Error)
              </h2>
            </CardHeader>
            <CardBody>
              <p className="card-description">
                Muestra la página de error 500 que se presenta cuando hay problemas 
                del servidor o errores internos de la aplicación.
              </p>
              <Button 
                variant="warning" 
                size="lg" 
                onClick={triggerNetworkError}
                className="demo-button"
              >
                <Icon name="close" size="sm" />
                Ver Error 500
              </Button>
            </CardBody>
          </Card>

          <Card variant="flat" className="error-demo-card">
            <CardHeader>
              <h2 className="card-title">
                <Icon name="search" size="md" color="muted" />
                Error 404 (Not Found)
              </h2>
            </CardHeader>
            <CardBody>
              <p className="card-description">
                Demuestra la página 404 que se muestra cuando un usuario intenta 
                acceder a una página que no existe en la aplicación.
              </p>
              <Button 
                variant="secondary" 
                size="lg" 
                onClick={trigger404}
                className="demo-button"
              >
                <Icon name="search" size="sm" />
                Ver Error 404
              </Button>
            </CardBody>
          </Card>
        </div>

        <div className="error-demo-info">
          <Card variant="nature" className="info-card">
            <CardBody>
              <h3 className="info-title">
                <Icon name="user" size="md" color="accent" />
                Información sobre el Manejo de Errores
              </h3>
              <div className="info-content">
                <div className="info-item">
                  <strong>Error Boundary:</strong> Captura errores de JavaScript en cualquier 
                  lugar del árbol de componentes React, registra esos errores y muestra una 
                  interfaz de respaldo.
                </div>
                <div className="info-item">
                  <strong>Error 404:</strong> Se muestra automáticamente cuando un usuario 
                  intenta acceder a una ruta que no existe en la aplicación.
                </div>
                <div className="info-item">
                  <strong>Error 500:</strong> Página personalizada para mostrar cuando hay 
                  errores del servidor o problemas internos de la aplicación.
                </div>
                <div className="info-item">
                  <strong>Desarrollo vs Producción:</strong> En modo desarrollo se muestran 
                  detalles técnicos adicionales para ayudar en la depuración.
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ErrorDemo;

