import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';
import Icon from '../../components/common/Icon';
import Illustration from '../../components/common/Illustration';
import { routes } from '../../utils/routes';
import './NotFound.css';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate(routes.home);
  };

  const handleGoBack = () => {
    window.history.back();
  };

  const handleExploreActivities = () => {
    navigate(routes.activities);
  };

  const handleExploreAccommodations = () => {
    navigate(routes.alojamientos);
  };

  return (
    <div className="not-found-page">
      <div className="not-found-container">
        <div className="not-found-content">
          <div className="not-found-visual">
            <Illustration 
              name="nature-hero" 
              size="xl" 
              className="not-found-illustration" 
            />
            <div className="not-found-number">404</div>
          </div>
          
          <div className="not-found-text">
            <h1 className="not-found-title">¡Ups! Página no encontrada</h1>
            <p className="not-found-description">
              Parece que te has perdido en los senderos de Tinambú. La página que 
              buscas no existe o ha sido movida a otro lugar.
            </p>
            <p className="not-found-suggestion">
              No te preocupes, te ayudamos a encontrar lo que buscas:
            </p>
            
            <div className="not-found-actions">
              <Button 
                variant="primary" 
                size="lg" 
                onClick={handleGoHome}
                className="not-found-button"
              >
                <Icon name="home" size="sm" />
                Ir al Inicio
              </Button>
              <Button 
                variant="secondary" 
                size="lg" 
                onClick={handleGoBack}
                className="not-found-button"
              >
                <Icon name="chevron-left" size="sm" />
                Volver Atrás
              </Button>
            </div>
            
            <div className="not-found-suggestions">
              <h3 className="suggestions-title">O explora nuestras secciones:</h3>
              <div className="suggestions-grid">
                <button 
                  className="suggestion-item"
                  onClick={handleExploreActivities}
                >
                  <Icon name="hiking" size="md" color="accent" />
                  <span>Senderos y Actividades</span>
                </button>
                <button 
                  className="suggestion-item"
                  onClick={handleExploreAccommodations}
                >
                  <Icon name="bed" size="md" color="accent" />
                  <span>Alojamiento</span>
                </button>
                <button 
                  className="suggestion-item"
                  onClick={() => navigate(routes.about)}
                >
                  <Icon name="user" size="md" color="accent" />
                  <span>Sobre Nosotros</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="not-found-footer">
          <p className="footer-text">
            ¿Necesitas ayuda? <a href="mailto:info@pasocenturion.com.uy" className="footer-link">Contáctanos</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;

