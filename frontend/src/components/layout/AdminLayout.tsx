import React, { useState } from 'react';
import { Navbar, Nav, Container, Offcanvas, Button, Badge, Dropdown } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';

const AdminLayout: React.FC = () => {
  const { state: authState, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showSidebar, setShowSidebar] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const menuItems = [
    {
      path: '/admin',
      icon: 'fas fa-tachometer-alt',
      label: 'Dashboard',
      exact: true
    },
    {
      path: '/admin/calendar',
      icon: 'fas fa-calendar',
      label: 'Calendario'
    },
    {
      path: '/admin/reservations',
      icon: 'fas fa-calendar-alt',
      label: 'Reservas'
    },
    {
      path: '/admin/rooms',
      icon: 'fas fa-bed',
      label: 'Habitaciones'
    },
    {
      path: '/admin/trails',
      icon: 'fas fa-hiking',
      label: 'Senderos'
    },
    {
      path: '/admin/guides',
      icon: 'fas fa-user-tie',
      label: 'Guías'
    }
  ];

  const isActiveRoute = (path: string, exact = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="admin-layout">
      {/* Top Navigation */}
      <Navbar bg="dark" variant="dark" expand="lg" className="mb-0">
        <Container fluid>
          <Button
            variant="outline-light"
            className="d-lg-none me-2"
            onClick={() => setShowSidebar(true)}
          >
            <i className="fas fa-bars"></i>
          </Button>
          
          <Navbar.Brand href="/admin" className="d-flex align-items-center">
            <i className="fas fa-leaf me-2 text-success"></i>
            Tinambú Tours - Admin
          </Navbar.Brand>

          <Nav className="ms-auto">
            <Dropdown align="end">
              <Dropdown.Toggle variant="outline-light" id="user-dropdown">
                <i className="fas fa-user-circle me-2"></i>
                {authState.user?.nombreCompleto || 'Admin'}
              </Dropdown.Toggle>

              <Dropdown.Menu>
                <Dropdown.Item disabled>
                  <small className="text-muted">
                    <i className="fas fa-shield-alt me-2"></i>
                    {authState.user?.tipoUsuario}
                  </small>
                </Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item onClick={() => navigate('/')}>
                  <i className="fas fa-home me-2"></i>
                  Ver Sitio Público
                </Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item onClick={handleLogout} className="text-danger">
                  <i className="fas fa-sign-out-alt me-2"></i>
                  Cerrar Sesión
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </Nav>
        </Container>
      </Navbar>

      <div className="d-flex">
        {/* Desktop Sidebar */}
        <div className="d-none d-lg-block bg-light border-end" style={{ width: '250px', minHeight: 'calc(100vh - 56px)' }}>
          <div className="p-3">
            <Nav className="flex-column">
              {menuItems.map((item) => (
                <Nav.Link
                  key={item.path}
                  href={item.path}
                  className={`admin-nav-link ${isActiveRoute(item.path, item.exact) ? 'active' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(item.path);
                  }}
                >
                  <i className={`${item.icon} me-2`}></i>
                  {item.label}
                </Nav.Link>
              ))}
            </Nav>
          </div>
        </div>

        {/* Mobile Sidebar */}
        <Offcanvas show={showSidebar} onHide={() => setShowSidebar(false)} placement="start">
          <Offcanvas.Header closeButton>
            <Offcanvas.Title>
              <i className="fas fa-leaf me-2 text-success"></i>
              Tinambú Admin
            </Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body>
            <Nav className="flex-column">
              {menuItems.map((item) => (
                <Nav.Link
                  key={item.path}
                  href={item.path}
                  className={`admin-nav-link ${isActiveRoute(item.path, item.exact) ? 'active' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(item.path);
                    setShowSidebar(false);
                  }}
                >
                  <i className={`${item.icon} me-2`}></i>
                  {item.label}
                </Nav.Link>
              ))}
            </Nav>
          </Offcanvas.Body>
        </Offcanvas>

        {/* Main Content */}
        <div className="flex-grow-1" style={{ minHeight: 'calc(100vh - 56px)' }}>
          <Container fluid className="p-4">
            <Outlet />
          </Container>
        </div>
      </div>

      <style>{`
        .admin-nav-link {
          color: #6c757d !important;
          text-decoration: none;
          padding: 0.75rem 1rem;
          border-radius: 0.375rem;
          margin-bottom: 0.25rem;
          transition: all 0.15s ease-in-out;
        }
        
        .admin-nav-link:hover {
          background-color: #e9ecef;
          color: #495057 !important;
        }
        
        .admin-nav-link.active {
          background-color: #0d6efd;
          color: white !important;
        }
        
        .admin-nav-link.active i {
          color: white;
        }
      `}</style>
    </div>
  );
};

export default AdminLayout;