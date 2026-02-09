import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './PaymentResult.css';

const PaymentCancelled: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const reservaId = searchParams.get('reservaId');
  const tipo = searchParams.get('tipo');

  return (
    <div className="payment-result-page">
      <div className="payment-result-container">
        <div className="result-icon status-rejected">
          ✕
        </div>

        <h1>Pago Cancelado</h1>
        <p className="result-subtitle">
          Has cancelado el proceso de pago. Tu reserva sigue pendiente y puedes
          intentar el pago nuevamente cuando lo desees.
        </p>

        <div className="result-actions">
          <button className="btn-primary" onClick={() => navigate(-2)}>
            Intentar Nuevamente
          </button>
          <button className="btn-primary" onClick={() => navigate('/')}>
            Volver al Inicio
          </button>
          <button className="btn-secondary" onClick={() => navigate('/activities')}>
            Ver Senderos
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentCancelled;
