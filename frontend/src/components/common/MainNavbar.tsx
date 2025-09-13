import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { routes } from '../../utils/routes';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import LoginForm from '../forms/LoginForm';
import SignupForm from '../forms/SignupForm';
import ThemeToggle from './ThemeToggle';
import CartButton from './CartButton';
import Logo from './Logo';
import './MainNavbar.css';

const MainNavbar: React.FC = () => {
  const { state, logout } = useAuth();
  const { theme } = useTheme();
  const location = useLocation();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

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

  const handleDropdownToggle = (dropdownName: string) => {
    setActiveDropdown(activeDropdown === dropdownName ? null : dropdownName);
  };

  const closeDropdowns = () => {
    setActiveDropdown(null);
  };



  return (
    <>
      <nav className="main-navbar" role="navigation" aria-label="Main navigation">
        <div className="navbar-container">
          {/* Logo/Brand */}
          <div className="navbar-brand">
            <Logo 
              variant="full" 
              size="md" 
              color="auto"
              as="a"
              href={routes.home}
              onClick={closeMobileMenu}
              className="navbar-logo"
            />
          </div>

          {/* Desktop Navigation */}
          <div className="navbar-nav desktop-nav" onClick={closeDropdowns}>
            <Link
              to={routes.home}
              className={`nav-link ${isActiveRoute(routes.home) ? 'active' : ''}`}
              onClick={closeMobileMenu}
            >
              <span className="nav-label">Inicio</span>
            </Link>
            
            <div className="nav-dropdown">
              <button
                className={`nav-link dropdown-toggle ${activeDropdown === 'alojamiento' ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDropdownToggle('alojamiento');
                }}
                onMouseEnter={() => setActiveDropdown('alojamiento')}
              >
                <span className="nav-label">Alojamiento</span>
                <span className={`dropdown-arrow ${activeDropdown === 'alojamiento' ? 'open' : ''}`}>
                  ▼
                </span>
              </button>
              
              {activeDropdown === 'alojamiento' && (
                <div 
                  className="dropdown-menu"
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <Link to={routes.accomodations} className="dropdown-item" onClick={closeDropdowns}>
                    Ver Alojamientos
                  </Link>
                  <Link to={routes.accomodations + '?type=cabanas'} className="dropdown-item" onClick={closeDropdowns}>
                    Cabañas Ecológicas
                  </Link>
                  <Link to={routes.accomodations + '?type=habitaciones'} className="dropdown-item" onClick={closeDropdowns}>
                    Habitaciones Premium
                  </Link>
                  <Link to={routes.book + '?service=accommodation'} className="dropdown-item" onClick={closeDropdowns}>
                    Reservar Alojamiento
                  </Link>
                </div>
              )}
            </div>
            
            <div className="nav-dropdown">
              <button
                className={`nav-link dropdown-toggle ${activeDropdown === 'senderismo' ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDropdownToggle('senderismo');
                }}
                onMouseEnter={() => setActiveDropdown('senderismo')}
              >
                <span className="nav-label">Senderismo</span>
                <span className={`dropdown-arrow ${activeDropdown === 'senderismo' ? 'open' : ''}`}>
                  ▼
                </span>
              </button>
              
              {activeDropdown === 'senderismo' && (
                <div 
                  className="dropdown-menu"
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <Link to={routes.activities} className="dropdown-item" onClick={closeDropdowns}>
                    Todos los Senderos
                  </Link>
                  <Link to={routes.activities + '?difficulty=easy'} className="dropdown-item" onClick={closeDropdowns}>
                    Senderos Fáciles
                  </Link>
                  <Link to={routes.activities + '?difficulty=moderate'} className="dropdown-item" onClick={closeDropdowns}>
                    Senderos Moderados
                  </Link>
                  <Link to={routes.activities + '?type=birdwatching'} className="dropdown-item" onClick={closeDropdowns}>
                    Observación de Aves
                  </Link>
                  <Link to={routes.book + '?service=hiking'} className="dropdown-item" onClick={closeDropdowns}>
                    Reservar Tour
                  </Link>
                </div>
              )}
            </div>
            
            <div className="nav-dropdown">
              <button
                className={`nav-link dropdown-toggle ${activeDropdown === 'nosotros' ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDropdownToggle('nosotros');
                }}
                onMouseEnter={() => setActiveDropdown('nosotros')}
              >
                <span className="nav-label">Nosotros</span>
                <span className={`dropdown-arrow ${activeDropdown === 'nosotros' ? 'open' : ''}`}>
                  ▼
                </span>
              </button>
              
              {activeDropdown === 'nosotros' && (
                <div 
                  className="dropdown-menu"
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <Link to={routes.about} className="dropdown-item" onClick={closeDropdowns}>
                    Sobre Nosotros
                  </Link>
                  <Link to={routes.about + '#team'} className="dropdown-item" onClick={closeDropdowns}>
                    Nuestro Equipo
                  </Link>
                  <Link to={routes.about + '#gallery'} className="dropdown-item" onClick={closeDropdowns}>
                    Galería
                  </Link>
                  <Link to={routes.about + '#contact'} className="dropdown-item" onClick={closeDropdowns}>
                    Contacto
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Desktop Actions */}
          <div className="navbar-actions desktop-actions">
            <CartButton />
            
            {state.isAuthenticated ? (
              <div className="user-menu">
                <Link to={routes.myBookings} className="nav-link">
                  <span className="nav-icon">📋</span>
                  <span className="nav-label">Mis Reservas</span>
                </Link>
                
                {/* Admin Panel Link - ALWAYS VISIBLE for authenticated users */}
                {state.isAuthenticated && (
                  <Link to={routes.admin} className="nav-link admin-link admin-panel-link">
                    <span className="nav-icon">⚙️</span>
                    <span className="nav-label admin-label">Panel Admin</span>
                  </Link>
                )}
                
                {/* Debug info */}
                {console.log('🔍 Debug MainNavbar:', { 
                  isAuthenticated: state.isAuthenticated,
                  userTipo: state.user?.tipo,
                  fullUser: state.user 
                })}
                
                {/* Original admin check */}
                {state.user?.tipo === 'ADMIN' && console.log('👑 Admin user detected!')}
                
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
              <Link
                to={routes.home}
                className={`mobile-nav-link ${isActiveRoute(routes.home) ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                <span className="nav-icon">🏠</span>
                <span className="nav-label">Inicio</span>
              </Link>
              
              <Link
                to={routes.accomodations}
                className={`mobile-nav-link ${isActiveRoute(routes.accomodations) ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                <span className="nav-icon">🏨</span>
                <span className="nav-label">Alojamiento</span>
              </Link>
              
              <Link
                to={routes.activities}
                className={`mobile-nav-link ${isActiveRoute(routes.activities) ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                <span className="nav-icon">🥾</span>
                <span className="nav-label">Senderismo</span>
              </Link>
              
              <Link
                to={routes.about}
                className={`mobile-nav-link ${isActiveRoute(routes.about) ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                <span className="nav-icon">ℹ️</span>
                <span className="nav-label">Nosotros</span>
              </Link>
              
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