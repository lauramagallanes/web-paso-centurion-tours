import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';
import Icon from '../../components/common/Icon';
import Illustration from '../../components/common/Illustration';
import { routes } from '../../utils/routes';
import './ServerError.css';

interface ServerErrorProps {
  error?: Error;
  resetError?: () => void;
}

const ServerError: React.FC<ServerErrorProps> = ({ error, resetError }) => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    if (resetError) {
      resetError();
    }
    navigate(routes.home);
  };

  const handleReload = () => {
    if (resetError) {
      resetError();
    }
    window.location.reload();
  };

  const handleGoBack = () => {
    if (resetError) {
      resetError();
    }
    window.history.back();
  };

  return (
    <div className="server-error-page">
      <div className="server-error-container">
        <div className="server-error-content">
          <div className="server-error-visual">
            <Illustration 
              name="nature-hero" 
              size="xl" 
              className="server-error-illustration" 
            />
            <div className="server-error-number">500</div>
          </div>
          
          <div className="server-error-text">
            <h1 className="server-error-title">Error del Servidor</h1>
            <p className="server-error-description">
              Ha ocurrido un problema técnico en nuestros servidores. Nuestro equipo 
              técnico ha sido notificado y está trabajando para resolver el inconveniente 
              lo antes posible.
            </p>
            <p className="server-error-suggestion">
              Te sugerimos intentar nuevamente en unos minutos:
            </p>
            
            <div className="server-error-actions">
              <Button 
                variant="primary" 
                size="lg" 
                onClick={handleReload}
                className="server-error-button"
              >
                <Icon name="chevron-left" size="sm" />
                Reintentar
              </Button>
              <Button 
                variant="secondary" 
                size="lg" 
                onClick={handleGoHome}
                className="server-error-button"
              >
                <Icon name="home" size="sm" />
                Ir al Inicio
              </Button>
            </div>
            
            {process.env.NODE_ENV === 'development' && error && (
              <details className="error-details">
                <summary className="error-details-summary">
                  Detalles técnicos (desarrollo)
                </summary>
                <div className="error-details-content">
                  <h3>Error:</h3>
                  <pre className="error-message">{error.message}</pre>
                  {error.stack && (
                    <>
                      <h3>Stack trace:</h3>
                      <pre className="error-stack">{error.stack}</pre>
                    </>
                  )}
                </div>
              </details>
            )}
            
            <div className="server-error-help">
              <h3 className="help-title">¿El problema persiste?</h3>
              <div className="help-options">
                <button 
                  className="help-option"
                  onClick={handleGoBack}
                >
                  <Icon name="chevron-left" size="sm" color="accent" />
                  <span>Volver a la página anterior</span>
                </button>
                <a 
                  href="mailto:info@pasocenturion.com.uy"
                  className="help-option"
                >
                  <Icon name="email" size="sm" color="accent" />
                  <span>Contactar soporte técnico</span>
                </a>
                <button 
                  className="help-option"
                  onClick={() => navigate(routes.activities)}
                >
                  <Icon name="hiking" size="sm" color="accent" />
                  <span>Ver nuestras actividades</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="server-error-footer">
          <p className="footer-text">
            Si el problema continúa, puedes contactarnos en{' '}
            <a href="mailto:info@pasocenturion.com.uy" className="footer-link">
              info@pasocenturion.com.uy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ServerError;

