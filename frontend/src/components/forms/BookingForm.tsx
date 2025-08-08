import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Alert, Spinner, Row, Col } from 'react-bootstrap';
import { useBooking } from '../../contexts/BookingContext';
import AlojamientoForm from './AlojamientoForm';
import SenderoForm from './SenderoForm';
import BookingSummary from './BookingSummary';

interface BookingFormProps {
  tipoReserva?: 'ALOJAMIENTO' | 'SENDERO';
  onSuccess?: (reserva: any) => void;
  onCancel?: () => void;
}

const BookingForm: React.FC<BookingFormProps> = ({ 
  tipoReserva, 
  onSuccess, 
  onCancel 
}) => {
  const { state, startBooking, resetBooking, createReservation, clearError } = useBooking();
  const [step, setStep] = useState(1);
  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => {
    if (tipoReserva && !state.currentBooking) {
      startBooking(tipoReserva);
    }

    return () => {
      // Cleanup al desmontar el componente
      clearError();
    };
  }, [tipoReserva]);

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    }
  };

  const handlePrevious = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleShowSummary = () => {
    setShowSummary(true);
  };

  const handleConfirmReservation = async () => {
    if (!state.currentBooking) return;

    try {
      const nuevaReserva = await createReservation(state.currentBooking);
      
      // Llamar callback de éxito
      if (onSuccess) {
        onSuccess(nuevaReserva);
      }
      
      // Resetear formulario
      resetBooking();
      setStep(1);
      setShowSummary(false);
      
    } catch (error) {
      // El error ya está manejado en el context
      console.error('Error al crear reserva:', error);
    }
  };

  const handleCancel = () => {
    resetBooking();
    setStep(1);
    setShowSummary(false);
    
    if (onCancel) {
      onCancel();
    }
  };

  if (!state.currentBooking) {
    return (
      <Card className="booking-form-card">
        <Card.Body className="text-center">
          <h4 className="mb-4">Selecciona el tipo de reserva</h4>
          <Row>
            <Col md={6} className="mb-3">
              <Button
                variant="outline-primary"
                size="lg"
                className="w-100 h-100 d-flex flex-column align-items-center p-4"
                onClick={() => startBooking('ALOJAMIENTO')}
              >
                <i className="fas fa-bed fa-3x mb-3"></i>
                <h5>Alojamiento</h5>
                <p className="text-muted mb-0">Reserva tu habitación</p>
              </Button>
            </Col>
            <Col md={6} className="mb-3">
              <Button
                variant="outline-success"
                size="lg"
                className="w-100 h-100 d-flex flex-column align-items-center p-4"
                onClick={() => startBooking('SENDERO')}
              >
                <i className="fas fa-hiking fa-3x mb-3"></i>
                <h5>Sendero</h5>
                <p className="text-muted mb-0">Reserva tu excursión</p>
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    );
  }

  if (showSummary) {
    return (
      <BookingSummary
        reservaData={state.currentBooking}
        precio={state.precioCalculado}
        onConfirm={handleConfirmReservation}
        onEdit={() => setShowSummary(false)}
        onCancel={handleCancel}
        loading={state.loading}
        error={state.error}
      />
    );
  }

  return (
    <div className="booking-form-container">
      {/* Progress Bar */}
      <div className="booking-progress mb-4">
        <div className="progress">
          <div 
            className="progress-bar" 
            style={{ width: `${(step / 3) * 100}%` }}
          ></div>
        </div>
        <div className="progress-labels d-flex justify-content-between mt-2">
          <span className={step >= 1 ? 'text-primary fw-bold' : 'text-muted'}>
            1. Información básica
          </span>
          <span className={step >= 2 ? 'text-primary fw-bold' : 'text-muted'}>
            2. Seleccionar opción
          </span>
          <span className={step >= 3 ? 'text-primary fw-bold' : 'text-muted'}>
            3. Detalles finales
          </span>
        </div>
      </div>

      {/* Error Alert */}
      {state.error && (
        <Alert variant="danger" dismissible onClose={clearError}>
          <Alert.Heading>Error</Alert.Heading>
          {state.error}
        </Alert>
      )}

      {/* Form Content */}
      <Card className="booking-form-card">
        <Card.Header>
          <h4 className="mb-0">
            {state.currentBooking.tipoReserva === 'ALOJAMIENTO' ? (
              <>
                <i className="fas fa-bed me-2"></i>
                Reserva de Alojamiento
              </>
            ) : (
              <>
                <i className="fas fa-hiking me-2"></i>
                Reserva de Sendero
              </>
            )}
          </h4>
        </Card.Header>
        
        <Card.Body>
          {state.currentBooking.tipoReserva === 'ALOJAMIENTO' ? (
            <AlojamientoForm 
              step={step} 
              onNext={handleNext}
              onPrevious={handlePrevious}
              onShowSummary={handleShowSummary}
            />
          ) : (
            <SenderoForm 
              step={step} 
              onNext={handleNext}
              onPrevious={handlePrevious}
              onShowSummary={handleShowSummary}
            />
          )}
        </Card.Body>

        <Card.Footer>
          <div className="d-flex justify-content-between">
            <Button 
              variant="outline-secondary" 
              onClick={handleCancel}
            >
              <i className="fas fa-times me-2"></i>
              Cancelar
            </Button>
            
            {state.loading && (
              <div className="d-flex align-items-center">
                <Spinner animation="border" size="sm" className="me-2" />
                Procesando...
              </div>
            )}
          </div>
        </Card.Footer>
      </Card>
    </div>
  );
};

export default BookingForm;
