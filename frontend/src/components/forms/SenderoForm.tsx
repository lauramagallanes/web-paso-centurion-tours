import React, { useState, useEffect } from 'react';
import { Form, Button, Row, Col, Card, Badge, Alert } from 'react-bootstrap';
import { useBooking } from '../../contexts/BookingContext';
import { useSenderos, useGuiasDisponibles } from '../../hooks/useApi';

interface SenderoFormProps {
  step: number;
  onNext: () => void;
  onPrevious: () => void;
  onShowSummary: () => void;
}

const SenderoForm: React.FC<SenderoFormProps> = ({
  step,
  onNext,
  onPrevious,
  onShowSummary
}) => {
  const { state, updateBookingField, calculatePrice } = useBooking();
  const { data: senderos = [], loading: loadingSenderos } = useSenderos();
  const { data: guiasDisponibles, loading: searchingGuides, search: searchGuias } = useGuiasDisponibles();
  
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

    if (!booking?.numeroPersonas || booking.numeroPersonas < 1) {
      newErrors.numeroPersonas = 'Debe ser al menos 1 persona';
    }

    if (!booking?.fechaInicio) {
      newErrors.fechaInicio = 'Fecha es obligatoria';
    }

    if (!booking?.senderoId) {
      newErrors.senderoId = 'Debe seleccionar un sendero';
    }

    if (!booking?.turno) {
      newErrors.turno = 'Debe seleccionar un turno';
    }

    if (booking?.fechaInicio) {
      const fecha = new Date(booking.fechaInicio);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      if (fecha < hoy) {
        newErrors.fechaInicio = 'Fecha no puede ser en el pasado';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: {[key: string]: string} = {};

    if (!booking?.guiaId) {
      newErrors.guiaId = 'Debe seleccionar un guía';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (step === 1) {
      if (validateStep1()) {
        // Buscar guías disponibles
        if (booking?.fechaInicio && booking?.turno) {
          await searchGuias(booking.fechaInicio, booking.turno);
          setSearchPerformed(true);
        }
        onNext();
      }
    } else if (step === 2) {
      if (validateStep2()) {
        // Calcular precio antes de mostrar resumen
        if (booking) {
          // Para senderos, fecha fin es igual a fecha inicio
          updateBookingField('fechaFin', booking.fechaInicio);
          await calculatePrice({ ...booking, fechaFin: booking.fechaInicio });
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

    // Si cambió el sendero, limpiar la selección de guía
    if (field === 'senderoId' && booking?.guiaId) {
      updateBookingField('guiaId', '');
      updateBookingField('guia', null);
      setSearchPerformed(false);
    }

    // Si cambió fecha o turno, limpiar guía y buscar nuevamente
    if ((field === 'fechaInicio' || field === 'turno') && booking?.guiaId) {
      updateBookingField('guiaId', '');
      updateBookingField('guia', null);
      setSearchPerformed(false);
    }
  };

  const handleSenderoSelect = (sendero: any) => {
    updateBookingField('senderoId', sendero.id);
    updateBookingField('sendero', sendero);
    
    // Verificar capacidad del sendero
    if (booking?.numeroPersonas && booking.numeroPersonas > sendero.capacidadMaximaGrupo) {
      updateBookingField('numeroPersonas', sendero.capacidadMaximaGrupo);
    }
  };

  const handleGuiaSelect = (guia: any) => {
    updateBookingField('guiaId', guia.id);
    updateBookingField('guia', guia);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-UY', {
      style: 'currency',
      currency: 'UYU',
      minimumFractionDigits: 0
    }).format(price);
  };

  const getDificultadColor = (dificultad: string) => {
    switch (dificultad) {
      case 'FACIL': return 'success';
      case 'MODERADO': return 'warning';
      case 'DIFICIL': return 'danger';
      case 'EXPERTO': return 'dark';
      default: return 'secondary';
    }
  };

  const getDificultadText = (dificultad: string) => {
    switch (dificultad) {
      case 'FACIL': return 'Fácil';
      case 'MODERADO': return 'Moderado';
      case 'DIFICIL': return 'Difícil';
      case 'EXPERTO': return 'Experto';
      default: return dificultad;
    }
  };

  // Renderizar paso 1: Información básica y selección de sendero
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
              <Form.Control
                type="number"
                min="1"
                max={booking?.sendero?.capacidadMaximaGrupo || 10}
                value={booking?.numeroPersonas || ''}
                onChange={(e) => handleFieldChange('numeroPersonas', parseInt(e.target.value) || 1)}
                isInvalid={!!errors.numeroPersonas}
                placeholder="1"
              />
              <Form.Control.Feedback type="invalid">
                {errors.numeroPersonas}
              </Form.Control.Feedback>
              {booking?.sendero && (
                <Form.Text className="text-muted">
                  Máximo {booking.sendero.capacidadMaximaGrupo} personas para este sendero
                </Form.Text>
              )}
            </Form.Group>
          </Col>
        </Row>

        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Fecha de la excursión *</Form.Label>
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
              <Form.Label>Turno *</Form.Label>
              <Form.Select
                value={booking?.turno || ''}
                onChange={(e) => handleFieldChange('turno', e.target.value)}
                isInvalid={!!errors.turno}
              >
                <option value="">Seleccionar turno...</option>
                <option value="MANANA">Mañana (8:00 - 12:00)</option>
                <option value="TARDE">Tarde (14:00 - 18:00)</option>
              </Form.Select>
              <Form.Control.Feedback type="invalid">
                {errors.turno}
              </Form.Control.Feedback>
            </Form.Group>
          </Col>
        </Row>

        <Form.Group className="mb-4">
          <Form.Label>Seleccionar sendero *</Form.Label>
          {loadingSenderos ? (
            <div className="text-center py-3">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Cargando senderos...</span>
              </div>
            </div>
          ) : (
            <Row>
              {senderos.map((sendero: any) => (
                <Col md={6} lg={4} key={sendero.id} className="mb-3">
                  <Card 
                    className={`h-100 sendero-card ${booking?.senderoId === sendero.id ? 'selected' : ''}`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleSenderoSelect(sendero)}
                  >
                    {sendero.urlImagen && (
                      <Card.Img 
                        variant="top" 
                        src={sendero.urlImagen} 
                        style={{ height: '200px', objectFit: 'cover' }}
                      />
                    )}
                    
                    <Card.Body className="d-flex flex-column">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <Card.Title className="h6">
                          {sendero.nombre}
                        </Card.Title>
                        {booking?.senderoId === sendero.id && (
                          <Badge bg="success">
                            <i className="fas fa-check"></i>
                          </Badge>
                        )}
                      </div>
                      
                      <div className="mb-2">
                        <Badge bg={getDificultadColor(sendero.nivelDificultad)} className="me-2">
                          {getDificultadText(sendero.nivelDificultad)}
                        </Badge>
                        <small className="text-muted">
                          <i className="fas fa-clock me-1"></i>
                          {sendero.duracionHoras}h
                        </small>
                      </div>
                      
                      {sendero.descripcion && (
                        <Card.Text className="small text-muted flex-grow-1">
                          {sendero.descripcion}
                        </Card.Text>
                      )}
                      
                      <div className="mt-auto">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <small className="text-muted">
                            <i className="fas fa-users me-1"></i>
                            Máx. {sendero.capacidadMaximaGrupo} personas
                          </small>
                        </div>
                        
                        <div className="fw-bold text-primary">
                          {formatPrice(sendero.precioPorPersona)}/persona
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
          
          {errors.senderoId && (
            <div className="text-danger small mt-2">
              {errors.senderoId}
            </div>
          )}
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Observaciones (opcional)</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            value={booking?.observaciones || ''}
            onChange={(e) => handleFieldChange('observaciones', e.target.value)}
            placeholder="Experiencia previa, condiciones especiales, etc..."
          />
        </Form.Group>

        <div className="d-flex justify-content-end">
          <Button 
            variant="primary" 
            onClick={handleNext}
            disabled={!booking?.senderoId || !booking?.fechaInicio || !booking?.turno}
          >
            Buscar guías disponibles
            <i className="fas fa-search ms-2"></i>
          </Button>
        </div>
      </Form>
    );
  }

  // Renderizar paso 2: Selección de guía
  if (step === 2) {
    return (
      <div>
        <div className="mb-4">
          <h5>Guías disponibles</h5>
          <p className="text-muted">
            Para el {new Date(booking!.fechaInicio).toLocaleDateString()} en turno {' '}
            {booking!.turno === 'MANANA' ? 'mañana' : 'tarde'} - Sendero: {booking?.sendero?.nombre}
          </p>
        </div>

        {searchingGuides ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">Buscando guías...</span>
            </div>
            <p>Buscando guías disponibles...</p>
          </div>
        ) : guiasDisponibles.length === 0 && searchPerformed ? (
          <Alert variant="warning">
            <i className="fas fa-exclamation-triangle me-2"></i>
            No hay guías disponibles para la fecha y turno seleccionados. 
            Por favor, intenta con otra fecha o turno.
          </Alert>
        ) : (
          <Row>
            {guiasDisponibles.map((guia: any) => (
              <Col md={6} lg={4} key={guia.id} className="mb-3">
                <Card 
                  className={`h-100 guia-card ${booking?.guiaId === guia.id ? 'selected' : ''}`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleGuiaSelect(guia)}
                >
                  {guia.urlFoto && (
                    <Card.Img 
                      variant="top" 
                      src={guia.urlFoto} 
                      style={{ height: '200px', objectFit: 'cover' }}
                    />
                  )}
                  
                  <Card.Body className="d-flex flex-column">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <Card.Title className="h6">
                        {guia.nombre} {guia.apellido}
                      </Card.Title>
                      {booking?.guiaId === guia.id && (
                        <Badge bg="success">
                          <i className="fas fa-check"></i>
                        </Badge>
                      )}
                    </div>
                    
                    {guia.anosExperiencia && (
                      <div className="mb-2">
                        <small className="text-muted">
                          <i className="fas fa-star me-1"></i>
                          {guia.anosExperiencia} años de experiencia
                        </small>
                      </div>
                    )}
                    
                    {guia.especialidades && (
                      <div className="mb-2">
                        <small className="text-primary">
                          <i className="fas fa-leaf me-1"></i>
                          {guia.especialidades}
                        </small>
                      </div>
                    )}
                    
                    {guia.biografia && (
                      <Card.Text className="small text-muted flex-grow-1">
                        {guia.biografia}
                      </Card.Text>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        )}

        {errors.guiaId && (
          <Alert variant="danger">
            {errors.guiaId}
          </Alert>
        )}

        <div className="d-flex justify-content-between mt-4">
          <Button variant="outline-secondary" onClick={onPrevious}>
            <i className="fas fa-arrow-left me-2"></i>
            Anterior
          </Button>
          
          {booking?.guiaId && (
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
        <h5 className="mb-4">Confirmar reserva de sendero</h5>
        
        <Card className="mb-4">
          <Card.Body>
            <Row>
              <Col md={8}>
                <h6>Detalles de la excursión</h6>
                <p className="mb-1"><strong>Sendero:</strong> {booking?.sendero?.nombre}</p>
                <p className="mb-1">
                  <strong>Dificultad:</strong> 
                  <Badge bg={getDificultadColor(booking?.sendero?.nivelDificultad || '')} className="ms-2">
                    {getDificultadText(booking?.sendero?.nivelDificultad || '')}
                  </Badge>
                </p>
                <p className="mb-1"><strong>Duración:</strong> {booking?.sendero?.duracionHoras} horas</p>
                <p className="mb-1"><strong>Fecha:</strong> {new Date(booking!.fechaInicio).toLocaleDateString()}</p>
                <p className="mb-1"><strong>Turno:</strong> {booking?.turno === 'MANANA' ? 'Mañana (8:00-12:00)' : 'Tarde (14:00-18:00)'}</p>
                <p className="mb-1"><strong>Participantes:</strong> {booking?.numeroPersonas} personas</p>
                <p className="mb-1"><strong>Guía:</strong> {booking?.guia?.nombre} {booking?.guia?.apellido}</p>
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
                    <span>{formatPrice(booking?.sendero?.precioPorPersona || 0)} x {booking?.numeroPersonas} personas</span>
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

export default SenderoForm;
