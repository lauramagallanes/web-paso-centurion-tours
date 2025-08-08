import React, { useState } from 'react';
import { Card, Button, Alert, Spinner, Row, Col, Badge, Modal } from 'react-bootstrap';
import { ReservaData } from '../../contexts/BookingContext';

interface BookingSummaryProps {
  reservaData: ReservaData;
  precio: number | null;
  onConfirm: () => void;
  onEdit: () => void;
  onCancel: () => void;
  loading: boolean;
  error: string | null;
}

const BookingSummary: React.FC<BookingSummaryProps> = ({
  reservaData,
  precio,
  onConfirm,
  onEdit,
  onCancel,
  loading,
  error
}) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-UY', {
      style: 'currency',
      currency: 'UYU',
      minimumFractionDigits: 0
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-UY', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateNights = () => {
    if (reservaData.fechaInicio && reservaData.fechaFin && reservaData.tipoReserva === 'ALOJAMIENTO') {
      const inicio = new Date(reservaData.fechaInicio);
      const fin = new Date(reservaData.fechaFin);
      const diffTime = fin.getTime() - inicio.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    return 0;
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

  const handleConfirm = () => {
    if (acceptedTerms) {
      setShowConfirmModal(false);
      onConfirm();
    }
  };

  return (
    <div className="booking-summary">
      <Card>
        <Card.Header className="bg-primary text-white">
          <h4 className="mb-0">
            <i className={`fas ${reservaData.tipoReserva === 'ALOJAMIENTO' ? 'fa-bed' : 'fa-hiking'} me-2`}></i>
            Resumen de tu reserva
          </h4>
        </Card.Header>

        <Card.Body>
          {error && (
            <Alert variant="danger" className="mb-4">
              <Alert.Heading>Error al procesar la reserva</Alert.Heading>
              {error}
            </Alert>
          )}

          <Row>
            {/* Detalles de la reserva */}
            <Col lg={8}>
              <div className="reservation-details">
                <h5 className="mb-3">Detalles de la reserva</h5>

                {/* Información de contacto */}
                <Card className="mb-3">
                  <Card.Body>
                    <h6 className="text-primary mb-3">
                      <i className="fas fa-user me-2"></i>
                      Información de contacto
                    </h6>
                    <p className="mb-1"><strong>Nombre:</strong> {reservaData.nombreContacto}</p>
                    <p className="mb-1"><strong>Email:</strong> {reservaData.emailContacto}</p>
                    {reservaData.telefonoContacto && (
                      <p className="mb-1"><strong>Teléfono:</strong> {reservaData.telefonoContacto}</p>
                    )}
                    <p className="mb-0"><strong>Participantes:</strong> {reservaData.numeroPersonas} personas</p>
                  </Card.Body>
                </Card>

                {/* Detalles específicos por tipo */}
                {reservaData.tipoReserva === 'ALOJAMIENTO' ? (
                  <Card className="mb-3">
                    <Card.Body>
                      <h6 className="text-primary mb-3">
                        <i className="fas fa-bed me-2"></i>
                        Detalles del alojamiento
                      </h6>
                      <Row>
                        <Col md={6}>
                          <p className="mb-1"><strong>Habitación:</strong> {reservaData.habitacion?.numero}</p>
                          <p className="mb-1"><strong>Tipo:</strong> {reservaData.habitacion?.nombre}</p>
                          <p className="mb-1"><strong>Capacidad:</strong> {reservaData.habitacion?.capacidadMinima}-{reservaData.habitacion?.capacidadMaxima} personas</p>
                        </Col>
                        <Col md={6}>
                          <p className="mb-1"><strong>Check-in:</strong> {formatDate(reservaData.fechaInicio)}</p>
                          <p className="mb-1"><strong>Check-out:</strong> {formatDate(reservaData.fechaFin)}</p>
                          <p className="mb-1"><strong>Duración:</strong> {calculateNights()} noches</p>
                        </Col>
                      </Row>
                      {reservaData.habitacion?.descripcion && (
                        <div className="mt-2">
                          <small className="text-muted">{reservaData.habitacion.descripcion}</small>
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                ) : (
                  <Card className="mb-3">
                    <Card.Body>
                      <h6 className="text-primary mb-3">
                        <i className="fas fa-hiking me-2"></i>
                        Detalles de la excursión
                      </h6>
                      <Row>
                        <Col md={6}>
                          <p className="mb-1"><strong>Sendero:</strong> {reservaData.sendero?.nombre}</p>
                          <p className="mb-1">
                            <strong>Dificultad:</strong>
                            <Badge bg={getDificultadColor(reservaData.sendero?.nivelDificultad || '')} className="ms-2">
                              {getDificultadText(reservaData.sendero?.nivelDificultad || '')}
                            </Badge>
                          </p>
                          <p className="mb-1"><strong>Duración:</strong> {reservaData.sendero?.duracionHoras} horas</p>
                          <p className="mb-1"><strong>Guía:</strong> {reservaData.guia?.nombre} {reservaData.guia?.apellido}</p>
                        </Col>
                        <Col md={6}>
                          <p className="mb-1"><strong>Fecha:</strong> {formatDate(reservaData.fechaInicio)}</p>
                          <p className="mb-1">
                            <strong>Turno:</strong> {reservaData.turno === 'MANANA' ? 'Mañana (8:00-12:00)' : 'Tarde (14:00-18:00)'}
                          </p>
                          <p className="mb-1"><strong>Participantes:</strong> {reservaData.numeroPersonas} personas</p>
                        </Col>
                      </Row>
                      {reservaData.sendero?.descripcion && (
                        <div className="mt-2">
                          <small className="text-muted">{reservaData.sendero.descripcion}</small>
                        </div>
                      )}
                      {reservaData.guia?.especialidades && (
                        <div className="mt-2">
                          <small className="text-primary">
                            <i className="fas fa-leaf me-1"></i>
                            Especialidades: {reservaData.guia.especialidades}
                          </small>
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                )}

                {/* Observaciones */}
                {reservaData.observaciones && (
                  <Card className="mb-3">
                    <Card.Body>
                      <h6 className="text-primary mb-2">
                        <i className="fas fa-comment me-2"></i>
                        Observaciones
                      </h6>
                      <p className="mb-0">{reservaData.observaciones}</p>
                    </Card.Body>
                  </Card>
                )}
              </div>
            </Col>

            {/* Resumen de precio */}
            <Col lg={4}>
              <Card className="price-summary sticky-top">
                <Card.Header>
                  <h6 className="mb-0">Resumen de precio</h6>
                </Card.Header>
                <Card.Body>
                  {reservaData.tipoReserva === 'ALOJAMIENTO' ? (
                    <div className="price-breakdown">
                      <div className="d-flex justify-content-between mb-2">
                        <span>Precio por persona/noche:</span>
                        <span>{formatPrice(reservaData.habitacion?.precioPorPersonaNoche || 0)}</span>
                      </div>
                      <div className="d-flex justify-content-between mb-2">
                        <span>Personas:</span>
                        <span>{reservaData.numeroPersonas}</span>
                      </div>
                      <div className="d-flex justify-content-between mb-3">
                        <span>Noches:</span>
                        <span>{calculateNights()}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="price-breakdown">
                      <div className="d-flex justify-content-between mb-2">
                        <span>Precio por persona:</span>
                        <span>{formatPrice(reservaData.sendero?.precioPorPersona || 0)}</span>
                      </div>
                      <div className="d-flex justify-content-between mb-3">
                        <span>Participantes:</span>
                        <span>{reservaData.numeroPersonas}</span>
                      </div>
                    </div>
                  )}
                  
                  <hr />
                  
                  <div className="d-flex justify-content-between mb-3">
                    <strong>Total:</strong>
                    <strong className="text-primary fs-5">
                      {precio ? formatPrice(precio) : 'Calculando...'}
                    </strong>
                  </div>

                  <Alert variant="info" className="small mb-3">
                    <i className="fas fa-info-circle me-2"></i>
                    Tu reserva estará en estado <strong>PENDIENTE</strong> hasta ser confirmada por nuestro equipo.
                  </Alert>

                  <div className="d-grid gap-2">
                    <Button 
                      variant="success" 
                      size="lg"
                      onClick={() => setShowConfirmModal(true)}
                      disabled={loading || !precio}
                    >
                      {loading ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" />
                          Procesando...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-check me-2"></i>
                          Confirmar reserva
                        </>
                      )}
                    </Button>
                    
                    <Button variant="outline-primary" onClick={onEdit} disabled={loading}>
                      <i className="fas fa-edit me-2"></i>
                      Editar reserva
                    </Button>
                    
                    <Button variant="outline-secondary" onClick={onCancel} disabled={loading}>
                      <i className="fas fa-times me-2"></i>
                      Cancelar
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Modal de confirmación */}
      <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirmar reserva</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Estás a punto de confirmar tu reserva por un total de{' '}
            <strong className="text-primary">{precio ? formatPrice(precio) : 'N/A'}</strong>.
          </p>
          
          <Alert variant="warning" className="small">
            <i className="fas fa-exclamation-triangle me-2"></i>
            <strong>Importante:</strong> Tu reserva será procesada y recibirás un email de confirmación. 
            El estado inicial será PENDIENTE hasta que nuestro equipo la revise y confirme.
          </Alert>

          <div className="form-check mt-3">
            <input
              className="form-check-input"
              type="checkbox"
              id="acceptTerms"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
            />
            <label className="form-check-label small" htmlFor="acceptTerms">
              Acepto los términos y condiciones y las políticas de cancelación de Tinambú Tours.
            </label>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowConfirmModal(false)}>
            Cancelar
          </Button>
          <Button 
            variant="success" 
            onClick={handleConfirm}
            disabled={!acceptedTerms}
          >
            <i className="fas fa-check me-2"></i>
            Confirmar definitivamente
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default BookingSummary;
