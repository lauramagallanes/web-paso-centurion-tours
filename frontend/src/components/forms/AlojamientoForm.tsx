import React, { useState, useEffect } from 'react';
import { Form, Button, Row, Col, Card, Badge, Alert } from 'react-bootstrap';
import { useBooking } from '../../contexts/BookingContext';
import { useHabitacionesDisponibles } from '../../hooks/useApi';

interface AlojamientoFormProps {
  step: number;
  onNext: () => void;
  onPrevious: () => void;
  onShowSummary: () => void;
}

const AlojamientoForm: React.FC<AlojamientoFormProps> = ({
  step,
  onNext,
  onPrevious,
  onShowSummary
}) => {
  const { state, updateBookingField, calculatePrice } = useBooking();
  const { data: habitacionesDisponibles, loading: searchingRooms, search: searchHabitaciones } = useHabitacionesDisponibles();
  
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [searchPerformed, setSearchPerformed] = useState(false);

  const booking = state.currentBooking;

  // Validaciones por paso
  const validateStep1 = () => {
    const newErrors: {[key: string]: string} = {};

    if (!booking?.nombreContacto.trim()) {
      newErrors.nombreContacto = 'Nombre es obligatorio';
    }

    if (!booking?.emailContacto.trim()) {
      newErrors.emailContacto = 'Email es obligatorio';
    } else if (!/\S+@\S+\.\S+/.test(booking.emailContacto)) {
      newErrors.emailContacto = 'Email no válido';
    }

    if (!booking?.numeroPersonas || booking.numeroPersonas < 2 || booking.numeroPersonas > 4) {
      newErrors.numeroPersonas = 'Debe ser entre 2 y 4 personas';
    }

    if (!booking?.fechaInicio) {
      newErrors.fechaInicio = 'Fecha de inicio es obligatoria';
    }

    if (!booking?.fechaFin) {
      newErrors.fechaFin = 'Fecha de fin es obligatoria';
    }

    if (booking?.fechaInicio && booking?.fechaFin) {
      const inicio = new Date(booking.fechaInicio);
      const fin = new Date(booking.fechaFin);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      if (inicio < hoy) {
        newErrors.fechaInicio = 'Fecha de inicio no puede ser en el pasado';
      }

      if (fin <= inicio) {
        newErrors.fechaFin = 'Fecha de fin debe ser posterior a fecha de inicio';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: {[key: string]: string} = {};

    if (!booking?.habitacionId) {
      newErrors.habitacionId = 'Debe seleccionar una habitación';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (step === 1) {
      if (validateStep1()) {
        // Buscar habitaciones disponibles
        await searchHabitaciones(
          booking!.fechaInicio,
          booking!.fechaFin,
          booking!.numeroPersonas
        );
        setSearchPerformed(true);
        onNext();
      }
    } else if (step === 2) {
      if (validateStep2()) {
        // Calcular precio antes de mostrar resumen
        if (booking) {
          await calculatePrice(booking);
        }
        onNext();
      }
    }
  };

  const handleFieldChange = (field: string, value: any) => {
    updateBookingField(field as any, value);
    
    // Limpiar error del campo cuando se modifica
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleHabitacionSelect = (habitacion: any) => {
    updateBookingField('habitacionId', habitacion.id);
    updateBookingField('habitacion', habitacion);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-UY', {
      style: 'currency',
      currency: 'UYU',
      minimumFractionDigits: 0
    }).format(price);
  };

  const calculateNights = () => {
    if (booking?.fechaInicio && booking?.fechaFin) {
      const inicio = new Date(booking.fechaInicio);
      const fin = new Date(booking.fechaFin);
      const diffTime = fin.getTime() - inicio.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    }
    return 0;
  };

  // Renderizar paso 1: Información básica
  if (step === 1) {
    return (
      <Form>
        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Nombre completo *</Form.Label>
              <Form.Control
                type="text"
                value={booking?.nombreContacto || ''}
                onChange={(e) => handleFieldChange('nombreContacto', e.target.value)}
                isInvalid={!!errors.nombreContacto}
                placeholder="Tu nombre completo"
              />
              <Form.Control.Feedback type="invalid">
                {errors.nombreContacto}
              </Form.Control.Feedback>
            </Form.Group>
          </Col>
          
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Email *</Form.Label>
              <Form.Control
                type="email"
                value={booking?.emailContacto || ''}
                onChange={(e) => handleFieldChange('emailContacto', e.target.value)}
                isInvalid={!!errors.emailContacto}
                placeholder="tu@email.com"
              />
              <Form.Control.Feedback type="invalid">
                {errors.emailContacto}
              </Form.Control.Feedback>
            </Form.Group>
          </Col>
        </Row>

        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Teléfono (opcional)</Form.Label>
              <Form.Control
                type="tel"
                value={booking?.telefonoContacto || ''}
                onChange={(e) => handleFieldChange('telefonoContacto', e.target.value)}
                placeholder="+598 99 123 456"
              />
            </Form.Group>
          </Col>
          
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Número de personas *</Form.Label>
              <Form.Select
                value={booking?.numeroPersonas || ''}
                onChange={(e) => handleFieldChange('numeroPersonas', parseInt(e.target.value))}
                isInvalid={!!errors.numeroPersonas}
              >
                <option value="">Seleccionar...</option>
                <option value="2">2 personas</option>
                <option value="3">3 personas</option>
                <option value="4">4 personas</option>
              </Form.Select>
              <Form.Control.Feedback type="invalid">
                {errors.numeroPersonas}
              </Form.Control.Feedback>
            </Form.Group>
          </Col>
        </Row>

        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Fecha de llegada *</Form.Label>
              <Form.Control
                type="date"
                value={booking?.fechaInicio || ''}
                onChange={(e) => handleFieldChange('fechaInicio', e.target.value)}
                isInvalid={!!errors.fechaInicio}
                min={new Date().toISOString().split('T')[0]}
              />
              <Form.Control.Feedback type="invalid">
                {errors.fechaInicio}
              </Form.Control.Feedback>
            </Form.Group>
          </Col>
          
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Fecha de salida *</Form.Label>
              <Form.Control
                type="date"
                value={booking?.fechaFin || ''}
                onChange={(e) => handleFieldChange('fechaFin', e.target.value)}
                isInvalid={!!errors.fechaFin}
                min={booking?.fechaInicio || new Date().toISOString().split('T')[0]}
              />
              <Form.Control.Feedback type="invalid">
                {errors.fechaFin}
              </Form.Control.Feedback>
            </Form.Group>
          </Col>
        </Row>

        {booking?.fechaInicio && booking?.fechaFin && (
          <Alert variant="info">
            <i className="fas fa-info-circle me-2"></i>
            <strong>{calculateNights()} noches</strong> para {booking.numeroPersonas} personas
          </Alert>
        )}

        <Form.Group className="mb-3">
          <Form.Label>Observaciones (opcional)</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            value={booking?.observaciones || ''}
            onChange={(e) => handleFieldChange('observaciones', e.target.value)}
            placeholder="Cualquier solicitud especial o comentario..."
          />
        </Form.Group>

        <div className="d-flex justify-content-end">
          <Button variant="primary" onClick={handleNext}>
            Buscar habitaciones disponibles
            <i className="fas fa-search ms-2"></i>
          </Button>
        </div>
      </Form>
    );
  }

  // Renderizar paso 2: Selección de habitación
  if (step === 2) {
    return (
      <div>
        <div className="mb-4">
          <h5>Habitaciones disponibles</h5>
          <p className="text-muted">
            Del {new Date(booking!.fechaInicio).toLocaleDateString()} al {' '}
            {new Date(booking!.fechaFin).toLocaleDateString()} para {booking!.numeroPersonas} personas
          </p>
        </div>

        {searchingRooms ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">Buscando...</span>
            </div>
            <p>Buscando habitaciones disponibles...</p>
          </div>
        ) : habitacionesDisponibles.length === 0 && searchPerformed ? (
          <Alert variant="warning">
            <i className="fas fa-exclamation-triangle me-2"></i>
            No hay habitaciones disponibles para las fechas seleccionadas. 
            Por favor, intenta con otras fechas.
          </Alert>
        ) : (
          <Row>
            {habitacionesDisponibles.map((habitacion: any) => (
              <Col md={6} lg={4} key={habitacion.id} className="mb-3">
                <Card 
                  className={`h-100 habitacion-card ${booking?.habitacionId === habitacion.id ? 'selected' : ''}`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleHabitacionSelect(habitacion)}
                >
                  {habitacion.urlImagen && (
                    <Card.Img 
                      variant="top" 
                      src={habitacion.urlImagen} 
                      style={{ height: '200px', objectFit: 'cover' }}
                    />
                  )}
                  
                  <Card.Body className="d-flex flex-column">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <Card.Title className="h6">
                        Habitación {habitacion.numero}
                      </Card.Title>
                      {booking?.habitacionId === habitacion.id && (
                        <Badge bg="success">
                          <i className="fas fa-check"></i>
                        </Badge>
                      )}
                    </div>
                    
                    <Card.Subtitle className="mb-2 text-muted">
                      {habitacion.nombre}
                    </Card.Subtitle>
                    
                    {habitacion.descripcion && (
                      <Card.Text className="small text-muted flex-grow-1">
                        {habitacion.descripcion}
                      </Card.Text>
                    )}
                    
                    <div className="mt-auto">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <small className="text-muted">
                          <i className="fas fa-users me-1"></i>
                          {habitacion.capacidadMinima}-{habitacion.capacidadMaxima} personas
                        </small>
                      </div>
                      
                      <div className="price-info">
                        <div className="fw-bold text-primary">
                          {formatPrice(habitacion.precioPorPersonaNoche)}/persona/noche
                        </div>
                        <small className="text-muted">
                          Total: {formatPrice(habitacion.precioPorPersonaNoche * booking!.numeroPersonas * calculateNights())}
                        </small>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        )}

        {errors.habitacionId && (
          <Alert variant="danger">
            {errors.habitacionId}
          </Alert>
        )}

        <div className="d-flex justify-content-between mt-4">
          <Button variant="outline-secondary" onClick={onPrevious}>
            <i className="fas fa-arrow-left me-2"></i>
            Anterior
          </Button>
          
          {booking?.habitacionId && (
            <Button variant="primary" onClick={handleNext}>
              Continuar
              <i className="fas fa-arrow-right ms-2"></i>
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Renderizar paso 3: Confirmación
  if (step === 3) {
    return (
      <div>
        <h5 className="mb-4">Confirmar reserva</h5>
        
        <Card className="mb-4">
          <Card.Body>
            <Row>
              <Col md={8}>
                <h6>Detalles de la reserva</h6>
                <p className="mb-1"><strong>Habitación:</strong> {booking?.habitacion?.numero} - {booking?.habitacion?.nombre}</p>
                <p className="mb-1"><strong>Fechas:</strong> {new Date(booking!.fechaInicio).toLocaleDateString()} - {new Date(booking!.fechaFin).toLocaleDateString()}</p>
                <p className="mb-1"><strong>Duración:</strong> {calculateNights()} noches</p>
                <p className="mb-1"><strong>Huéspedes:</strong> {booking?.numeroPersonas} personas</p>
                <p className="mb-1"><strong>Contacto:</strong> {booking?.nombreContacto} ({booking?.emailContacto})</p>
                {booking?.telefonoContacto && (
                  <p className="mb-1"><strong>Teléfono:</strong> {booking.telefonoContacto}</p>
                )}
                {booking?.observaciones && (
                  <p className="mb-1"><strong>Observaciones:</strong> {booking.observaciones}</p>
                )}
              </Col>
              
              <Col md={4}>
                <h6>Resumen de precio</h6>
                <div className="price-breakdown">
                  <div className="d-flex justify-content-between">
                    <span>{formatPrice(booking?.habitacion?.precioPorPersonaNoche || 0)} x {booking?.numeroPersonas} personas x {calculateNights()} noches</span>
                  </div>
                  <hr />
                  <div className="d-flex justify-content-between fw-bold">
                    <span>Total:</span>
                    <span className="text-primary">
                      {state.precioCalculado ? formatPrice(state.precioCalculado) : 'Calculando...'}
                    </span>
                  </div>
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        <div className="d-flex justify-content-between">
          <Button variant="outline-secondary" onClick={onPrevious}>
            <i className="fas fa-arrow-left me-2"></i>
            Anterior
          </Button>
          
          <Button variant="success" onClick={onShowSummary}>
            <i className="fas fa-check me-2"></i>
            Confirmar reserva
          </Button>
        </div>
      </div>
    );
  }

  return null;
};

export default AlojamientoForm;
