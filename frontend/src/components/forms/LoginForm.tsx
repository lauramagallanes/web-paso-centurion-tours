import React, { useState } from 'react';
import { Form, Button, Alert, Card, Spinner } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';

interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToSignup?: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onSwitchToSignup }) => {
  const { login, state, clearError } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Limpiar error del campo cuando se modifica
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email es obligatorio';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email no válido';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Contraseña es obligatoria';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    clearError();

    try {
      await login(formData.email, formData.password);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      // El error ya está manejado en el context
      console.error('Error en login:', error);
    }
  };

  return (
    <Card className="login-form-card">
      <Card.Header className="bg-primary text-white text-center">
        <h4 className="mb-0">
          <i className="fas fa-sign-in-alt me-2"></i>
          Iniciar Sesión
        </h4>
      </Card.Header>
      
      <Card.Body>
        {state.error && (
          <Alert variant="danger" dismissible onClose={clearError}>
            <Alert.Heading>Error al iniciar sesión</Alert.Heading>
            {state.error}
          </Alert>
        )}

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              isInvalid={!!errors.email}
              placeholder="tu@email.com"
              disabled={state.loading}
            />
            <Form.Control.Feedback type="invalid">
              {errors.email}
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Contraseña</Form.Label>
            <Form.Control
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              isInvalid={!!errors.password}
              placeholder="Tu contraseña"
              disabled={state.loading}
            />
            <Form.Control.Feedback type="invalid">
              {errors.password}
            </Form.Control.Feedback>
          </Form.Group>

          <div className="d-grid gap-2">
            <Button 
              variant="primary" 
              type="submit" 
              size="lg"
              disabled={state.loading}
            >
              {state.loading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Iniciando sesión...
                </>
              ) : (
                <>
                  <i className="fas fa-sign-in-alt me-2"></i>
                  Iniciar Sesión
                </>
              )}
            </Button>
          </div>
        </Form>
      </Card.Body>

      {onSwitchToSignup && (
        <Card.Footer className="text-center">
          <p className="mb-0">
            ¿No tienes cuenta?{' '}
            <Button 
              variant="link" 
              className="p-0" 
              onClick={onSwitchToSignup}
              disabled={state.loading}
            >
              Regístrate aquí
            </Button>
          </p>
        </Card.Footer>
      )}
    </Card>
  );
};

export default LoginForm;
