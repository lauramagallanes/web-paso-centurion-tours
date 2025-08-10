import React, { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoginForm from '../../components/forms/LoginForm';
import SignupForm from '../../components/forms/SignupForm';
import Card, { CardBody, CardHeader } from '../../components/common/Card';
import Button from '../../components/common/Button';
import { useTheme } from '../../contexts/ThemeContext';
import { routes } from '../../utils/routes';
import './LoginPage.css';

const LoginPage: React.FC = () => {
  const { state } = useAuth();
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');

  // Si ya está autenticado, redirigir según el tipo de usuario
  if (state.isAuthenticated) {
    if (state.user?.tipo === 'ADMIN') {
      return <Navigate to="/admin" replace />;
    } else {
      return <Navigate to="/" replace />;
    }
  }

  const handleLoginSuccess = () => {
    // La redirección se maneja automáticamente por el Navigate anterior
  };

  const handleSignupSuccess = () => {
    // La redirección se maneja automáticamente por el Navigate anterior
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        {/* Background Illustration */}
        <div className="auth-background">
          <div className="auth-background-overlay" />
          <img 
            src="/src/assets/illustrations/Foto home  conocenos.svg" 
            alt="Naturaleza de Paso Centurión"
            className="auth-background-image"
          />
        </div>

        {/* Main Content */}
        <div className="auth-content">
          <div className="container">
            <div className="auth-layout">
              
              {/* Left Side - Welcome Content */}
              <div className="auth-welcome">
                <div className="auth-welcome-content">
                  <Link to={routes.home} className="auth-logo">
                    <img 
                      src="/src/assets/images/logo/logo_black.svg" 
                      alt="Tinambú Logo"
                      className="auth-logo-img"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling!.textContent = 'Tinambú';
                      }}
                    />
                    <span className="auth-logo-text">Tinambú</span>
                  </Link>
                  
                  <div className="auth-welcome-text">
                    <h1 className="auth-welcome-title">
                      Bienvenido a tu experiencia natural
                    </h1>
                    <p className="auth-welcome-description">
                      Descubre la biodiversidad única de Paso Centurión. 
                      Inicia sesión para acceder a reservas exclusivas y 
                      experiencias personalizadas de ecoturismo.
                    </p>
                    
                    <div className="auth-features">
                      <div className="auth-feature">
                        <span className="auth-feature-icon">🦅</span>
                        <span className="auth-feature-text">200+ especies de aves</span>
                      </div>
                      <div className="auth-feature">
                        <span className="auth-feature-icon">🏞️</span>
                        <span className="auth-feature-text">Senderos naturales</span>
                      </div>
                      <div className="auth-feature">
                        <span className="auth-feature-icon">🏠</span>
                        <span className="auth-feature-text">Alojamiento rural</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side - Auth Forms */}
              <div className="auth-forms">
                <Card variant="elevated" size="lg" className="auth-card">
                  <CardHeader>
                    <div className="auth-tabs">
                      <button
                        className={`auth-tab ${activeTab === 'login' ? 'active' : ''}`}
                        onClick={() => setActiveTab('login')}
                      >
                        Iniciar Sesión
                      </button>
                      <button
                        className={`auth-tab ${activeTab === 'signup' ? 'active' : ''}`}
                        onClick={() => setActiveTab('signup')}
                      >
                        Registrarse
                      </button>
                    </div>
                  </CardHeader>

                  <CardBody>
                    <div className="auth-form-container">
                      {activeTab === 'login' ? (
                        <div className="auth-form-content">
                          <div className="auth-form-header">
                            <h2 className="auth-form-title">Iniciar Sesión</h2>
                            <p className="auth-form-subtitle">
                              Accede a tu cuenta para gestionar tus reservas
                            </p>
                          </div>
                          <LoginForm onSuccess={handleLoginSuccess} />
                        </div>
                      ) : (
                        <div className="auth-form-content">
                          <div className="auth-form-header">
                            <h2 className="auth-form-title">Crear Cuenta</h2>
                            <p className="auth-form-subtitle">
                              Únete a nuestra comunidad de amantes de la naturaleza
                            </p>
                          </div>
                          <SignupForm onSuccess={handleSignupSuccess} />
                        </div>
                      )}
                    </div>
                  </CardBody>
                </Card>

                {/* Additional Links */}
                <div className="auth-links">
                  <div className="auth-help">
                    <span className="auth-help-text">¿Necesitas ayuda?</span>
                    <a href="tel:+59898394653" className="auth-help-link">
                      📞 +598 98 394 653
                    </a>
                  </div>
                  
                  <div className="auth-back">
                    <Link to={routes.home} className="auth-back-link">
                      ← Volver al inicio
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="auth-mobile-nav">
        <Link to={routes.home} className="auth-mobile-nav-link">
          <span className="auth-mobile-nav-icon">🏠</span>
          <span className="auth-mobile-nav-text">Inicio</span>
        </Link>
        <Link to={routes.activities} className="auth-mobile-nav-link">
          <span className="auth-mobile-nav-icon">🦅</span>
          <span className="auth-mobile-nav-text">Actividades</span>
        </Link>
        <Link to={routes.accomodations} className="auth-mobile-nav-link">
          <span className="auth-mobile-nav-icon">🏡</span>
          <span className="auth-mobile-nav-text">Alojamiento</span>
        </Link>
        <a href="tel:+59898394653" className="auth-mobile-nav-link">
          <span className="auth-mobile-nav-icon">📞</span>
          <span className="auth-mobile-nav-text">Contacto</span>
        </a>
      </div>
    </div>
  );
};

export default LoginPage;