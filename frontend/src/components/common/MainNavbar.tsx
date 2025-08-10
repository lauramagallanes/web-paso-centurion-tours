import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { routes } from '../../utils/routes';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import LoginForm from '../forms/LoginForm';
import SignupForm from '../forms/SignupForm';
import ThemeToggle from './ThemeToggle';
import './MainNavbar.css';

const MainNavbar: React.FC = () => {
  const { state, logout } = useAuth();
  const { theme } = useTheme();
  const location = useLocation();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLoginSuccess = () => {
    setShowLoginModal(false);
  };

  const handleSignupSuccess = () => {
    setShowSignupModal(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const isActiveRoute = (route: string) => {
    return location.pathname === route;
  };

  const navLinks = [
    { path: routes.home, label: 'Principal', icon: '🏠' },
    { path: routes.about, label: 'Sobre Nosotros', icon: '🌿' },
    { path: routes.accomodations, label: 'Alojamiento', icon: '🏡' },
    { path: routes.activities, label: 'Actividades', icon: '🦅' },
    { path: routes.book, label: 'Reservar', icon: '📅' },
  ];

  return (
    <>
      <nav className="main-navbar" role="navigation" aria-label="Main navigation">
        <div className="navbar-container">
          {/* Logo/Brand */}
          <div className="navbar-brand">
            <Link to={routes.home} className="brand-link" onClick={closeMobileMenu}>
              <img 
                src="/src/assets/images/logo/logo_white.svg" 
                alt="Tinambú Logo" 
                className="brand-logo"
                onError={(e) => {
                  // Fallback if logo doesn't load
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling!.textContent = 'Tinambú';
                }}
              />
              <span className="brand-text">Tinambú</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="navbar-nav desktop-nav">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`nav-link ${isActiveRoute(link.path) ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                <span className="nav-icon">{link.icon}</span>
                <span className="nav-label">{link.label}</span>
              </Link>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="navbar-actions desktop-actions">
            <ThemeToggle />
            
            {state.isAuthenticated ? (
              <div className="user-menu">
                <Link to={routes.myBookings} className="nav-link">
                  <span className="nav-icon">📋</span>
                  <span className="nav-label">Mis Reservas</span>
                </Link>
                
                {state.user?.tipo === 'ADMIN' && (
                  <Link to={routes.admin} className="nav-link admin-link">
                    <span className="nav-icon">⚙️</span>
                    <span className="nav-label">Admin</span>
                  </Link>
                )}
                
                <div className="user-info">
                  <span className="user-greeting">Hola, {state.user?.nombreCompleto}</span>
                  <button 
                    className="logout-btn"
                    onClick={logout}
                    aria-label="Cerrar sesión"
                  >
                    Cerrar Sesión
                  </button>
                </div>
              </div>
            ) : (
              <div className="auth-buttons">
                <button 
                  className="btn btn-outline"
                  onClick={() => setShowLoginModal(true)}
                >
                  Iniciar Sesión
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={() => setShowSignupModal(true)}
                >
                  Registrarse
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="mobile-menu-btn"
            onClick={toggleMobileMenu}
            aria-label="Toggle mobile menu"
            aria-expanded={isMobileMenuOpen}
          >
            <span className={`hamburger ${isMobileMenuOpen ? 'open' : ''}`}>
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>
        </div>

        {/* Mobile Navigation */}
        <div className={`mobile-nav ${isMobileMenuOpen ? 'open' : ''}`}>
          <div className="mobile-nav-content">
            <div className="mobile-nav-links">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`mobile-nav-link ${isActiveRoute(link.path) ? 'active' : ''}`}
                  onClick={closeMobileMenu}
                >
                  <span className="nav-icon">{link.icon}</span>
                  <span className="nav-label">{link.label}</span>
                </Link>
              ))}
              
              {state.isAuthenticated && (
                <>
                  <Link 
                    to={routes.myBookings} 
                    className="mobile-nav-link"
                    onClick={closeMobileMenu}
                  >
                    <span className="nav-icon">📋</span>
                    <span className="nav-label">Mis Reservas</span>
                  </Link>
                  
                  {state.user?.tipo === 'ADMIN' && (
                    <Link 
                      to={routes.admin} 
                      className="mobile-nav-link admin-link"
                      onClick={closeMobileMenu}
                    >
                      <span className="nav-icon">⚙️</span>
                      <span className="nav-label">Admin</span>
                    </Link>
                  )}
                </>
              )}
            </div>

            <div className="mobile-nav-actions">
              <div className="mobile-theme-toggle">
                <ThemeToggle />
              </div>
              
              {state.isAuthenticated ? (
                <div className="mobile-user-info">
                  <p className="user-greeting">Hola, {state.user?.nombreCompleto}</p>
                  <button 
                    className="btn btn-outline w-full"
                    onClick={() => {
                      logout();
                      closeMobileMenu();
                    }}
                  >
                    Cerrar Sesión
                  </button>
                </div>
              ) : (
                <div className="mobile-auth-buttons">
                  <button 
                    className="btn btn-outline w-full mb-2"
                    onClick={() => {
                      setShowLoginModal(true);
                      closeMobileMenu();
                    }}
                  >
                    Iniciar Sesión
                  </button>
                  <button 
                    className="btn btn-primary w-full"
                    onClick={() => {
                      setShowSignupModal(true);
                      closeMobileMenu();
                    }}
                  >
                    Registrarse
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div 
            className="mobile-menu-overlay"
            onClick={closeMobileMenu}
            aria-hidden="true"
          />
        )}
      </nav>

      {/* Modal de Login */}
      {showLoginModal && (
        <div className="modal-overlay" onClick={() => setShowLoginModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Iniciar Sesión</h2>
              <button 
                className="modal-close"
                onClick={() => setShowLoginModal(false)}
                aria-label="Cerrar modal"
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <LoginForm onSuccess={handleLoginSuccess} />
            </div>
          </div>
        </div>
      )}

      {/* Modal de Signup */}
      {showSignupModal && (
        <div className="modal-overlay" onClick={() => setShowSignupModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Registrarse</h2>
              <button 
                className="modal-close"
                onClick={() => setShowSignupModal(false)}
                aria-label="Cerrar modal"
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <SignupForm onSuccess={handleSignupSuccess} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MainNavbar;