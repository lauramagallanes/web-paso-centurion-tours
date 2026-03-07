import React, { useState, useEffect } from 'react';
import { useBooking } from '../../contexts/BookingContext';
import AlojamientoForm from './AlojamientoForm';
import SenderoForm from './SenderoForm';
import BookingSummary from './BookingSummary';
import './BookingForm.css';

interface BookingFormProps {
  tipoReserva?: 'ALOJAMIENTO' | 'SENDERO';
  onSuccess?: (reserva: any) => void;
  onCancel?: () => void;
}

const STEPS = [
  { label: 'Información básica' },
  { label: 'Seleccionar opción' },
  { label: 'Detalles finales' },
];

const BookingForm: React.FC<BookingFormProps> = ({
  tipoReserva,
  onSuccess,
  onCancel,
}) => {
  const { state, startBooking, resetBooking, createReservation, clearError } = useBooking();
  const [step, setStep] = useState(1);
  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => {
    if (tipoReserva && !state.currentBooking) {
      startBooking(tipoReserva);
    }
    return () => {
      clearError();
    };
  }, [tipoReserva]);

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handlePrevious = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleShowSummary = () => setShowSummary(true);

  const handleConfirmReservation = async () => {
    if (!state.currentBooking) return;
    try {
      const nuevaReserva = await createReservation(state.currentBooking);
      if (onSuccess) onSuccess(nuevaReserva);
      resetBooking();
      setStep(1);
      setShowSummary(false);
    } catch (error) {
      console.error('Error al crear reserva:', error);
    }
  };

  const handleCancel = () => {
    resetBooking();
    setStep(1);
    setShowSummary(false);
    if (onCancel) onCancel();
  };

  /* ── Type selection screen ── */
  if (!state.currentBooking) {
    return (
      <div className="booking-type-selection">
        <h2 className="booking-type-title">¿Qué tipo de reserva querés hacer?</h2>
        <p className="booking-type-subtitle">
          Elegí una opción para comenzar
        </p>

        <div className="booking-type-cards">
          {/* Alojamiento */}
          <div
            className="booking-type-card"
            role="button"
            tabIndex={0}
            onClick={() => startBooking('ALOJAMIENTO')}
            onKeyDown={e => e.key === 'Enter' && startBooking('ALOJAMIENTO')}
          >
            <div className="booking-type-card-icon">
              <i className="bi bi-house-door-fill" />
            </div>
            <h3 className="booking-type-card-title">Alojamiento</h3>
            <p className="booking-type-card-desc">
              Reservá tu habitación o cabaña y disfrutá de una estadía en plena naturaleza
            </p>
            <span className="booking-type-card-cta">
              Reservar alojamiento <i className="bi bi-arrow-right" />
            </span>
          </div>

          {/* Sendero */}
          <div
            className="booking-type-card"
            role="button"
            tabIndex={0}
            onClick={() => startBooking('SENDERO')}
            onKeyDown={e => e.key === 'Enter' && startBooking('SENDERO')}
          >
            <div className="booking-type-card-icon">
              <i className="bi bi-signpost-2-fill" />
            </div>
            <h3 className="booking-type-card-title">Sendero</h3>
            <p className="booking-type-card-desc">
              Reservá tu excursión guiada y explorá los senderos de Paso Centurión
            </p>
            <span className="booking-type-card-cta">
              Reservar excursión <i className="bi bi-arrow-right" />
            </span>
          </div>
        </div>
      </div>
    );
  }

  /* ── Summary screen ── */
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

  const isAlojamiento = state.currentBooking.tipoReserva === 'ALOJAMIENTO';

  /* ── Form wizard ── */
  return (
    <div className="booking-form-wrapper">
      {/* Step progress */}
      <div className="booking-stepper">
        {STEPS.map((s, idx) => {
          const num = idx + 1;
          const isActive = step === num;
          const isCompleted = step > num;
          const cls = `booking-stepper-item${isActive ? ' step-active' : ''}${isCompleted ? ' step-completed' : ''}`;
          return (
            <div key={num} className={cls}>
              <div className="booking-stepper-circle">
                {isCompleted ? <i className="bi bi-check-lg" /> : num}
              </div>
              <span className="booking-stepper-label">{s.label}</span>
            </div>
          );
        })}
      </div>

      {/* Error */}
      {state.error && (
        <div className="booking-error-alert">
          <i className="bi bi-exclamation-circle-fill" />
          <span>{state.error}</span>
          <button className="booking-error-dismiss" onClick={clearError} aria-label="Cerrar">
            <i className="bi bi-x-lg" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="booking-form-header">
        <div className="booking-form-header-icon">
          <i className={isAlojamiento ? 'bi bi-house-door-fill' : 'bi bi-signpost-2-fill'} />
        </div>
        <div className="booking-form-header-text">
          <h4>{isAlojamiento ? 'Reserva de Alojamiento' : 'Reserva de Sendero'}</h4>
          <span>Paso {step} de {STEPS.length} — {STEPS[step - 1].label}</span>
        </div>
      </div>

      {/* Body */}
      <div className="booking-form-body">
        {isAlojamiento ? (
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
      </div>

      {/* Footer */}
      <div className="booking-form-footer">
        <div className="booking-footer-left">
          <button className="booking-cancel-link" onClick={handleCancel}>
            <i className="bi bi-x-circle" />
            Cancelar reserva
          </button>
        </div>
        <div className="booking-footer-right">
          {state.loading && (
            <div className="booking-processing">
              <div className="booking-processing-spinner" />
              Procesando…
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingForm;
