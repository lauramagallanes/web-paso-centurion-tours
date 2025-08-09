import React, { useState } from 'react';
import { Container, Row, Col, Card, Tab, Tabs } from 'react-bootstrap';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoginForm from '../../components/forms/LoginForm';
import SignupForm from '../../components/forms/SignupForm';

const LoginPage: React.FC = () => {
  const { state } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('login');

  // Si ya está autenticado, redirigir según el tipo de usuario
  if (state.isAuthenticated) {
    if (state.user?.tipo === 'ADMIN') {
      return <Navigate to="/admin" replace />;
    } else {
      return <Navigate to="/" replace />;
    }
  }

  const handleLoginSuccess = () => {
    // La redirección se maneja automáticamente por el efecto anterior
  };

  const handleSignupSuccess = () => {
    // La redirección se maneja automáticamente por el efecto anterior
  };

  return (
    <div className="min-vh-100 d-flex align-items-center bg-light">
      <Container>
        <Row className="justify-content-center">
          <Col md={6} lg={5}>
            <Card className="shadow">
              <Card.Header className="bg-dark text-white text-center py-3">
                <h3 className="mb-0">
                  <i className="fas fa-leaf me-2"></i>
                  Tinambú - Paso Centurión
                </h3>
              </Card.Header>
              <Card.Body className="p-4">
                <Tabs
                  activeKey={activeTab}
                  onSelect={(k) => setActiveTab(k || 'login')}
                  className="mb-4"
                  justify
                >
                  <Tab eventKey="login" title="Iniciar Sesión">
                    <LoginForm onSuccess={handleLoginSuccess} />
                  </Tab>
                  <Tab eventKey="signup" title="Registrarse">
                    <SignupForm onSuccess={handleSignupSuccess} />
                  </Tab>
                </Tabs>
              </Card.Body>
              <Card.Footer className="text-center text-muted">
                <small>
                  ¿Problemas para acceder? Contacta: +598 98394653
                </small>
              </Card.Footer>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default LoginPage;
