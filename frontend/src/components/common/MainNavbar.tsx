import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { routes } from '../../utils/routes';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import ThemeToggle from './ThemeToggle';
import CartButton from './CartButton';
import Logo from './Logo';
import './MainNavbar.css';

// Bootstrap Icons 1.13 no incluye un icono de cama; este SVG sigue el mismo
// estilo (currentColor, viewBox 16x16) para integrarse con los demás bi-*.
const BedIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    width="1em"
    height="1em"
    fill="currentColor"
    viewBox="0 0 16 16"
    aria-hidden="true"
  >
    <path d="M1.5 4a.5.5 0 0 1 .5.5V8h11.5A1.5 1.5 0 0 1 15 9.5V13a.5.5 0 0 1-1 0v-1.5H2V13a.5.5 0 0 1-1 0V4.5a.5.5 0 0 1 .5-.5zM2 9v1.5h12V9.5a.5.5 0 0 0-.5-.5H2zm3.5-4a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm0 1a1 1 0 1 1 0 2 1 1 0 0 1 0-2zM9 7V5.5A1.5 1.5 0 0 1 10.5 4h2A1.5 1.5 0 0 1 14 5.5V7H9zm1-1.5V7h3V5.5a.5.5 0 0 0-.5-.5h-2a.5.5 0 0 0-.5.5z" />
  </svg>
);

const MainNavbar: React.FC = () => {
  const { state, logout, isAdmin } = useAuth();
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
            
            {state.isAuthenticated && isAdmin() && (
              <Link to={routes.admin} className="admin-panel-button-super-visible">
                <i className="admin-icon bi bi-shield-lock" aria-hidden="true"></i>
                <span className="admin-text">ADMIN</span>
              </Link>
            )}
            
            {state.isAuthenticated ? (
              <div className="user-menu">
                <Link to={routes.myBookings} className="nav-link">
                  <i className="nav-icon bi bi-calendar-check" aria-hidden="true"></i>
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
                <i className="nav-icon bi bi-house-door" aria-hidden="true"></i>
                <span className="nav-label">Inicio</span>
              </Link>
              
              <Link
                to={routes.alojamientos}
                className={`mobile-nav-link ${isActiveRoute(routes.alojamientos) ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                <BedIcon className="nav-icon" />
                <span className="nav-label">Alojamiento</span>
              </Link>
              
              <Link
                to={routes.activities}
                className={`mobile-nav-link ${isActiveRoute(routes.activities) ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                <i className="nav-icon bi bi-person-walking" aria-hidden="true"></i>
                <span className="nav-label">Senderismo</span>
              </Link>
              
              <Link
                to={routes.birdwatching}
                className={`mobile-nav-link ${isActiveRoute(routes.birdwatching) ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                <i className="nav-icon bi bi-binoculars" aria-hidden="true"></i>
                <span className="nav-label">Birding</span>
              </Link>
              
              <Link
                to={routes.about}
                className={`mobile-nav-link ${isActiveRoute(routes.about) ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                <i className="nav-icon bi bi-info-circle" aria-hidden="true"></i>
                <span className="nav-label">Nosotros</span>
              </Link>
              
              {state.isAuthenticated && (
                <>
                  {isAdmin() && (
                    <Link 
                      to={routes.admin} 
                      className="mobile-nav-link admin-super-visible"
                      onClick={closeMobileMenu}
                    >
                      <i className="nav-icon bi bi-shield-lock" aria-hidden="true"></i>
                      <span className="nav-label">Panel Admin</span>
                    </Link>
                  )}
                  
                  <Link 
                    to={routes.myBookings} 
                    className="mobile-nav-link"
                    onClick={closeMobileMenu}
                  >
                    <i className="nav-icon bi bi-calendar-check" aria-hidden="true"></i>
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