import React, { useState } from 'react';
import { Form, Button, Alert, Card, Spinner } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';

interface SignupFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

const SignupForm: React.FC<SignupFormProps> = ({ onSuccess, onSwitchToLogin }) => {
  const { signup, state, clearError } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    nombreCompleto: '',
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

    if (!formData.nombreCompleto.trim()) {
      newErrors.nombreCompleto = 'Nombre completo es obligatorio';
    } else if (formData.nombreCompleto.trim().length < 2) {
      newErrors.nombreCompleto = 'Nombre debe tener al menos 2 caracteres';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email es obligatorio';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email no válido';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Contraseña es obligatoria';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Contraseña debe tener al menos 8 caracteres';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Contraseña debe tener al menos una mayúscula, una minúscula y un número';
    }

    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Confirmación de contraseña es obligatoria';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    clearError();

    try {
      await signup(formData.email, formData.password, formData.nombreCompleto);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      // El error ya está manejado en el context
      console.error('Error en signup:', error);
    }
  };

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    strength = Object.values(checks).filter(Boolean).length;

    if (strength < 2) return { level: 'weak', color: 'danger', text: 'Débil' };
    if (strength < 4) return { level: 'medium', color: 'warning', text: 'Media' };
    return { level: 'strong', color: 'success', text: 'Fuerte' };
  };

  const passwordStrength = formData.password ? getPasswordStrength(formData.password) : null;

  return (
    <Card className="signup-form-card">
      <Card.Header className="bg-success text-white text-center">
        <h4 className="mb-0">
          <i className="fas fa-user-plus me-2"></i>
          Crear Cuenta
        </h4>
      </Card.Header>
      
      <Card.Body>
        {state.error && (
          <Alert variant="danger" dismissible onClose={clearError}>
            <Alert.Heading>Error al registrarse</Alert.Heading>
            {state.error}
          </Alert>
        )}

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Nombre completo</Form.Label>
            <Form.Control
              type="text"
              name="nombreCompleto"
              value={formData.nombreCompleto}
              onChange={handleChange}
              isInvalid={!!errors.nombreCompleto}
              placeholder="Tu nombre completo"
              disabled={state.loading}
            />
            <Form.Control.Feedback type="invalid">
              {errors.nombreCompleto}
            </Form.Control.Feedback>
          </Form.Group>

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
              placeholder="Mínimo 8 caracteres"
              disabled={state.loading}
            />
            <Form.Control.Feedback type="invalid">
              {errors.password}
            </Form.Control.Feedback>
            
            {/* Indicador de fortaleza de contraseña */}
            {formData.password && passwordStrength && (
              <div className="mt-2">
                <div className="d-flex align-items-center">
                  <small className="me-2">Fortaleza:</small>
                  <span className={`badge bg-${passwordStrength.color}`}>
                    {passwordStrength.text}
                  </span>
                </div>
                <div className="progress mt-1" style={{ height: '4px' }}>
                  <div 
                    className={`progress-bar bg-${passwordStrength.color}`}
                    style={{ 
                      width: `${(passwordStrength.level === 'weak' ? 33 : passwordStrength.level === 'medium' ? 66 : 100)}%` 
                    }}
                  ></div>
                </div>
                <small className="text-muted">
                  Usa mayúsculas, minúsculas, números y símbolos para mayor seguridad
                </small>
              </div>
            )}
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Confirmar contraseña</Form.Label>
            <Form.Control
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              isInvalid={!!errors.confirmPassword}
              placeholder="Repite tu contraseña"
              disabled={state.loading}
            />
            <Form.Control.Feedback type="invalid">
              {errors.confirmPassword}
            </Form.Control.Feedback>
            
            {/* Indicador de coincidencia */}
            {formData.confirmPassword && (
              <div className="mt-1">
                {formData.password === formData.confirmPassword ? (
                  <small className="text-success">
                    <i className="fas fa-check me-1"></i>
                    Las contraseñas coinciden
                  </small>
                ) : (
                  <small className="text-danger">
                    <i className="fas fa-times me-1"></i>
                    Las contraseñas no coinciden
                  </small>
                )}
              </div>
            )}
          </Form.Group>

          <Alert variant="info" className="small">
            <i className="fas fa-info-circle me-2"></i>
            Al registrarte, podrás hacer reservas y consultar tu historial. 
            Tu cuenta será de tipo <strong>Visitante</strong>.
          </Alert>

          <div className="d-grid gap-2">
            <Button 
              variant="success" 
              type="submit" 
              size="lg"
              disabled={state.loading}
            >
              {state.loading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Creando cuenta...
                </>
              ) : (
                <>
                  <i className="fas fa-user-plus me-2"></i>
                  Crear Cuenta
                </>
              )}
            </Button>
          </div>
        </Form>
      </Card.Body>

      {onSwitchToLogin && (
        <Card.Footer className="text-center">
          <p className="mb-0">
            ¿Ya tienes cuenta?{' '}
            <Button 
              variant="link" 
              className="p-0" 
              onClick={onSwitchToLogin}
              disabled={state.loading}
            >
              Inicia sesión aquí
            </Button>
          </p>
        </Card.Footer>
      )}
    </Card>
  );
};

export default SignupForm;
