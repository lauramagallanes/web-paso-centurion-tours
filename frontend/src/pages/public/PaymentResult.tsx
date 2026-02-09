import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiService } from '../../services/apiService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import './PaymentResult.css';

interface PaymentStatus {
  reservaId: string;
  codigoReserva: string;
  tipoReserva: string;
  estadoPago: string;
  estadoReserva: string;
  precioTotal: number;
  montoPagado: number;
  saldoPendiente: number;
  placetoPayStatus: string;
  placetoPayMessage: string;
}

const PaymentResult: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const reservaId = searchParams.get('reservaId');
  const tipo = searchParams.get('tipo') || 'SENDERO';
  const isMock = searchParams.get('mock') === 'true';

  const [status, setStatus] = useState<PaymentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!reservaId) {
      setError('No se encontró información de la reserva');
      setLoading(false);
      return;
    }

    if (isMock) {
      // Mock mode - PlacetoPay not configured
      setStatus({
        reservaId,
        codigoReserva: 'RES-MOCK',
        tipoReserva: tipo,
        estadoPago: 'PENDIENTE',
        estadoReserva: 'PENDIENTE',
        precioTotal: 0,
        montoPagado: 0,
        saldoPendiente: 0,
        placetoPayStatus: 'MOCK',
        placetoPayMessage: 'PlacetoPay no configurado. Tu reserva fue creada exitosamente y queda pendiente de pago.',
      });
      setLoading(false);
      return;
    }

    checkPaymentStatus();
  }, [reservaId, tipo, isMock]);

  const checkPaymentStatus = async () => {
    try {
      setLoading(true);
      const response: any = await apiService.getPaymentStatus(reservaId!, tipo);
      const data = response?.data || response;
      setStatus(data);
    } catch (err: any) {
      console.error('Error checking payment status:', err);
      setError('Error al consultar el estado del pago');
    } finally {
      setLoading(false);
    }
  };

  const getStatusDisplay = () => {
    if (!status) return null;

    const p2pStatus = status.placetoPayStatus;

    if (p2pStatus === 'APPROVED') {
      return {
        icon: '✓',
        title: 'Pago Aprobado',
        subtitle: 'Tu reserva ha sido confirmada exitosamente.',
        className: 'status-approved',
      };
    }

    if (p2pStatus === 'REJECTED') {
      return {
        icon: '✕',
        title: 'Pago Rechazado',
        subtitle: 'El pago no pudo ser procesado. Puedes intentar nuevamente.',
        className: 'status-rejected',
      };
    }

    if (p2pStatus === 'PENDING') {
      return {
        icon: '⏳',
        title: 'Pago Pendiente',
        subtitle: 'Tu pago está siendo procesado. Te notificaremos cuando sea confirmado.',
        className: 'status-pending',
      };
    }

    if (p2pStatus === 'MOCK') {
      return {
        icon: '✓',
        title: 'Reserva Creada',
        subtitle: 'Tu reserva fue creada exitosamente. El pago en línea no está habilitado aún.',
        className: 'status-pending',
      };
    }

    return {
      icon: 'ℹ',
      title: 'Estado del Pago',
      subtitle: status.placetoPayMessage || 'Consultando estado...',
      className: 'status-pending',
    };
  };

  if (loading) {
    return (
      <div className="payment-result-page">
        <div className="payment-result-container">
          <LoadingSpinner />
          <p>Consultando estado del pago...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="payment-result-page">
        <div className="payment-result-container">
          <div className="result-icon status-rejected">✕</div>
          <h1>Error</h1>
          <p>{error}</p>
          <button className="btn-primary" onClick={() => navigate('/')}>
            Volver al Inicio
          </button>
        </div>
      </div>
    );
  }

  const display = getStatusDisplay();

  return (
    <div className="payment-result-page">
      <div className="payment-result-container">
        <div className={`result-icon ${display?.className}`}>
          {display?.icon}
        </div>

        <h1>{display?.title}</h1>
        <p className="result-subtitle">{display?.subtitle}</p>

        {status && (
          <div className="result-details">
            {status.codigoReserva && status.codigoReserva !== 'RES-MOCK' && (
              <div className="detail-row">
                <span>Código de Reserva:</span>
                <span className="detail-value">{status.codigoReserva}</span>
              </div>
            )}
            <div className="detail-row">
              <span>Tipo:</span>
              <span>{status.tipoReserva === 'SENDERO' ? 'Sendero / Actividad' : 'Alojamiento'}</span>
            </div>
            {status.precioTotal > 0 && (
              <div className="detail-row">
                <span>Total:</span>
                <span>USD ${status.precioTotal?.toFixed(2)}</span>
              </div>
            )}
            <div className="detail-row">
              <span>Estado de Reserva:</span>
              <span className={`status-badge status-${status.estadoReserva?.toLowerCase()}`}>
                {status.estadoReserva}
              </span>
            </div>
          </div>
        )}

        <div className="result-actions">
          {status?.placetoPayStatus === 'REJECTED' && (
            <button className="btn-primary" onClick={() => navigate(-1)}>
              Intentar Nuevamente
            </button>
          )}
          <button className="btn-primary" onClick={() => navigate('/')}>
            Volver al Inicio
          </button>
          <button className="btn-secondary" onClick={() => navigate('/my-bookings')}>
            Ver Mis Reservas
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentResult;
