import React, { useState } from 'react';
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import { Link } from 'react-router-dom';
import { routes } from '../../utils/routes';
import { useAuth } from '../../contexts/AuthContext';
import LoginForm from '../forms/LoginForm';
import SignupForm from '../forms/SignupForm';

const MainNavbar: React.FC = () => {
  const { state, logout } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);

  const handleLoginSuccess = () => {
    setShowLoginModal(false);
  };

  const handleSignupSuccess = () => {
    setShowSignupModal(false);
  };

  return (
    <>
      <Navbar bg="dark" data-bs-theme="dark">
        <Container>
          <Navbar.Brand as={Link} to={routes.home}>Tinambú</Navbar.Brand>
          <Nav className="me-auto">
            <Nav.Link as={Link} to={routes.home}>Principal</Nav.Link>
            <Nav.Link as={Link} to={routes.about}>Tinambú</Nav.Link>
            <Nav.Link as={Link} to={routes.accomodations}>Alojamiento</Nav.Link>
            <Nav.Link as={Link} to={routes.activities}>Actividades</Nav.Link>
            <Nav.Link as={Link} to={routes.book}>Reservar</Nav.Link>
          </Nav>
          
          <Nav>
            {state.isAuthenticated ? (
              <>
                <Nav.Link as={Link} to={routes.myBookings}>Mis Reservas</Nav.Link>
                {state.user?.tipo === 'ADMIN' && (
                  <Nav.Link as={Link} to={routes.admin}>
                    <i className="fas fa-cogs me-1"></i>
                    Admin
                  </Nav.Link>
                )}
                <Navbar.Text className="me-3">
                  Hola, {state.user?.nombreCompleto}
                </Navbar.Text>
                <Button variant="outline-light" onClick={logout}>
                  Cerrar Sesión
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="outline-light" 
                  className="me-2"
                  onClick={() => setShowLoginModal(true)}
                >
                  Iniciar Sesión
                </Button>
                <Button 
                  variant="light"
                  onClick={() => setShowSignupModal(true)}
                >
                  Registrarse
                </Button>
              </>
            )}
          </Nav>
        </Container>
      </Navbar>

      {/* Modal de Login */}
      <Modal show={showLoginModal} onHide={() => setShowLoginModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Iniciar Sesión</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <LoginForm onSuccess={handleLoginSuccess} />
        </Modal.Body>
      </Modal>

      {/* Modal de Signup */}
      <Modal show={showSignupModal} onHide={() => setShowSignupModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Registrarse</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <SignupForm onSuccess={handleSignupSuccess} />
        </Modal.Body>
      </Modal>
    </>
  );
}

export default MainNavbar; 