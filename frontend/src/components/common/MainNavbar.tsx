import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { routes } from '../../utils/routes';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import ThemeToggle from './ThemeToggle';
import CartButton from './CartButton';
import Logo from './Logo';
import './MainNavbar.css';

const MainNavbar: React.FC = () => {
  const { state, logout } = useAuth();
  const { theme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const navbarRef = useRef<HTMLDivElement>(null);

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

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navbarRef.current && !navbarRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };

    if (activeDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeDropdown]);


  return (
    <>
      <nav className="main-navbar" role="navigation" aria-label="Main navigation" ref={navbarRef}>
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
          <div className="navbar-nav desktop-nav">
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
                  navigate(routes.alojamientos);
                  closeDropdowns();
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
                  <Link to={routes.alojamientos} className="dropdown-item" onClick={closeDropdowns}>
                    Ver Alojamientos
                  </Link>
                  <Link to={routes.alojamientos + '?type=cabanas'} className="dropdown-item" onClick={closeDropdowns}>
                    Cabañas Ecológicas
                  </Link>
                  <Link to={routes.alojamientos + '?type=habitaciones'} className="dropdown-item" onClick={closeDropdowns}>
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
                  navigate(routes.activities);
                  closeDropdowns();
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
                className={`nav-link dropdown-toggle ${activeDropdown === 'birding' ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(routes.birdwatching);
                  closeDropdowns();
                }}
                onMouseEnter={() => setActiveDropdown('birding')}
              >
                <span className="nav-label">Birding</span>
                <span className={`dropdown-arrow ${activeDropdown === 'birding' ? 'open' : ''}`}>
                  ▼
                </span>
              </button>
              
              {activeDropdown === 'birding' && (
                <div 
                  className="dropdown-menu"
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <Link to={routes.birdwatching} className="dropdown-item" onClick={closeDropdowns}>
                    Todas las Aves
                  </Link>
                  <Link to={routes.birdwatching + '?habitat=bosque'} className="dropdown-item" onClick={closeDropdowns}>
                    Aves de Bosque
                  </Link>
                  <Link to={routes.birdwatching + '?habitat=humedal'} className="dropdown-item" onClick={closeDropdowns}>
                    Aves de Humedal
                  </Link>
                  <Link to={routes.activities} className="dropdown-item" onClick={closeDropdowns}>
                    Reservar Tour de Avistamiento
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Desktop Actions */}
          <div className="navbar-actions desktop-actions">
            <ThemeToggle />
            
            {/* Carrito - solo visible si está autenticado */}
            {state.isAuthenticated && <CartButton />}
            
            {/* ADMIN PANEL BUTTON - ALWAYS VISIBLE WHEN AUTHENTICATED */}
            {state.isAuthenticated && (
              <Link to={routes.admin} className="admin-panel-button-super-visible">
                <span className="admin-icon">⚙️</span>
                <span className="admin-text">ADMIN</span>
              </Link>
            )}
            
            {state.isAuthenticated ? (
              <div className="user-menu">
                <Link to={routes.myBookings} className="nav-link">
                  <span className="nav-icon">📋</span>
                  <span className="nav-label">Mis Reservas</span>
                </Link>
                
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
              <div className="nav-dropdown user-dropdown">
                <button
                  className={`nav-link user-menu-toggle ${activeDropdown === 'user' ? 'active' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('User button clicked! Current dropdown:', activeDropdown);
                    handleDropdownToggle('user');
                  }}
                  aria-label="Menú de usuario"
                  type="button"
                >
                  <i className="bi bi-person-circle" style={{ fontSize: '1.5rem' }}></i>
                </button>
                
                {activeDropdown === 'user' && (
                  <div 
                    className="dropdown-menu user-dropdown-menu"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button 
                      className="dropdown-item"
                      onClick={(e) => {
                        e.stopPropagation();
                        closeDropdowns();
                        navigate('/login');
                      }}
                      type="button"
                    >
                      <i className="bi bi-box-arrow-in-right"></i>
                      Iniciar Sesion
                    </button>
                    <button 
                      className="dropdown-item"
                      onClick={(e) => {
                        e.stopPropagation();
                        closeDropdowns();
                        navigate('/login', { state: { tab: 'signup' } });
                      }}
                      type="button"
                    >
                      <i className="bi bi-person-plus"></i>
                      Registrarse
                    </button>
                  </div>
                )}
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
                to={routes.alojamientos}
                className={`mobile-nav-link ${isActiveRoute(routes.alojamientos) ? 'active' : ''}`}
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
                  {/* ADMIN BUTTON MOBILE - ALWAYS VISIBLE */}
                  <Link 
                    to={routes.admin} 
                    className="mobile-nav-link admin-super-visible"
                    onClick={closeMobileMenu}
                  >
                    <span className="nav-icon">⚙️</span>
                    <span className="nav-label">🔥 PANEL ADMIN</span>
                  </Link>
                  
                  <Link 
                    to={routes.myBookings} 
                    className="mobile-nav-link"
                    onClick={closeMobileMenu}
                  >
                    <span className="nav-icon">📋</span>
                    <span className="nav-label">Mis Reservas</span>
                  </Link>
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
                      closeMobileMenu();
                      navigate('/login');
                    }}
                  >
                    Iniciar Sesion
                  </button>
                  <button 
                    className="btn btn-primary w-full"
                    onClick={() => {
                      closeMobileMenu();
                      navigate('/login', { state: { tab: 'signup' } });
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

    </>
  );
};

export default MainNavbar;