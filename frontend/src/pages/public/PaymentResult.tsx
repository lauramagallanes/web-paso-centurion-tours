import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiService } from '../../services/apiService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import './PaymentResult.css';

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────

interface OrdenStatus {
  ordenId: string;
  codigoOrden: string;
  estadoOrden: string;
  montoTotal: number;
  tipoPago: string;
  placetoPayStatus: string;
  placetoPayMessage: string;
  items: Array<{
    reservaId: string;
    tipoReserva: string;
    estadoReserva: string;
    subtotal: number;
    descripcion: string;
  }>;
}

interface LegacyStatus {
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

const formatCurrency = (amount: number, currency = 'UYU') =>
  new Intl.NumberFormat('es-UY', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(amount);

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────

const getStatusDisplay = (p2pStatus: string, message?: string) => {
  if (p2pStatus === 'APPROVED') {
    return {
      icon: '✓',
      title: '¡Pago aprobado!',
      subtitle: 'Tu reserva fue confirmada exitosamente.',
      className: 'status-approved',
    };
  }
  if (p2pStatus === 'REJECTED') {
    return {
      icon: '✕',
      title: 'Pago rechazado',
      subtitle: 'El pago no pudo ser procesado. Podés intentar nuevamente.',
      className: 'status-rejected',
    };
  }
  if (p2pStatus === 'MOCK') {
    return {
      icon: '✓',
      title: 'Reserva creada',
      subtitle: 'Tu reserva fue creada exitosamente. El pago en línea no está habilitado aún.',
      className: 'status-pending',
    };
  }
  if (p2pStatus === 'PENDING') {
    return {
      icon: '⏳',
      title: 'Pago pendiente',
      subtitle: 'Tu pago está siendo procesado. Te notificaremos cuando sea confirmado.',
      className: 'status-pending',
    };
  }
  return {
    icon: 'ℹ',
    title: 'Estado del pago',
    subtitle: message || 'Consultando estado...',
    className: 'status-pending',
  };
};

// ──────────────────────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────────────────────

const PaymentResult: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const ordenId = searchParams.get('ordenId');
  const reservaId = searchParams.get('reservaId');
  const tipo = searchParams.get('tipo') || 'SENDERO';
  const isMock = searchParams.get('mock') === 'true';

  const [ordenStatus, setOrdenStatus] = useState<OrdenStatus | null>(null);
  const [legacyStatus, setLegacyStatus] = useState<LegacyStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isMock) {
      if (ordenId) {
        setOrdenStatus({
          ordenId,
          codigoOrden: 'ORD-MOCK',
          estadoOrden: 'PENDIENTE',
          montoTotal: 0,
          tipoPago: 'TOTAL',
          placetoPayStatus: 'MOCK',
          placetoPayMessage: 'Getnet no está configurado en este entorno. Su orden quedó creada y pendiente de pago.',
          items: [],
        });
      } else if (reservaId) {
        setLegacyStatus({
          reservaId,
          codigoReserva: 'RES-MOCK',
          tipoReserva: tipo,
          estadoPago: 'PENDIENTE',
          estadoReserva: 'PENDIENTE',
          precioTotal: 0,
          montoPagado: 0,
          saldoPendiente: 0,
          placetoPayStatus: 'MOCK',
          placetoPayMessage: 'Getnet no está configurado en este entorno. Su reserva quedó registrada correctamente.',
        });
      } else {
        setError('No se encontró información de la reserva o la orden.');
      }
      setLoading(false);
      return;
    }

    if (ordenId) {
      fetchOrdenStatus(ordenId);
    } else if (reservaId) {
      fetchLegacyStatus(reservaId, tipo);
    } else {
      setError('No se encontró información del pago.');
      setLoading(false);
    }
  }, [ordenId, reservaId, tipo, isMock]);

  const fetchOrdenStatus = async (id: string) => {
    try {
      setLoading(true);
      const response: any = await apiService.getOrdenPaymentStatus(id);
      const data = response?.data || response;
      setOrdenStatus(data);
    } catch (err: any) {
      setError('Error al consultar el estado del pago.');
    } finally {
      setLoading(false);
    }
  };

  const fetchLegacyStatus = async (id: string, tipoReserva: string) => {
    try {
      setLoading(true);
      const response: any = await apiService.getPaymentStatus(id, tipoReserva);
      const data = response?.data || response;
      setLegacyStatus(data);
    } catch (err: any) {
      setError('Error al consultar el estado del pago.');
    } finally {
      setLoading(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────

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

  // New multi-item order flow
  if (ordenStatus) {
    const display = getStatusDisplay(ordenStatus.placetoPayStatus, ordenStatus.placetoPayMessage);

    return (
      <div className="payment-result-page">
        <div className="payment-result-container">
          <div className={`result-icon ${display.className}`}>{display.icon}</div>
          <h1>{display.title}</h1>
          <p className="result-subtitle">{display.subtitle}</p>

          <div className="result-details">
            {ordenStatus.codigoOrden && ordenStatus.codigoOrden !== 'ORD-MOCK' && (
              <div className="detail-row">
                <span>Código de Orden:</span>
                <span className="detail-value">{ordenStatus.codigoOrden}</span>
              </div>
            )}
            {ordenStatus.montoTotal > 0 && (
              <div className="detail-row">
                <span>Total pagado:</span>
                <span>{formatCurrency(ordenStatus.montoTotal)}</span>
              </div>
            )}
            {ordenStatus.items.length > 0 && (
              <div className="result-items">
                <p className="result-items-title">Reservas incluidas:</p>
                {ordenStatus.items.map(item => (
                  <div key={item.reservaId} className="result-item-row">
                    <span className="result-item-type">
                      {item.tipoReserva === 'SENDERO' ? '🥾' : '🏠'} {item.tipoReserva}
                    </span>
                    <span className={`status-badge status-${item.estadoReserva?.toLowerCase()}`}>
                      {item.estadoReserva}
                    </span>
                    {item.subtotal > 0 && (
                      <span className="result-item-subtotal">{formatCurrency(item.subtotal)}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="result-actions">
            {ordenStatus.placetoPayStatus === 'REJECTED' && (
              <button className="btn-primary" onClick={() => navigate('/checkout')}>
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
  }

  // Legacy single-reservation flow
  if (legacyStatus) {
    const display = getStatusDisplay(legacyStatus.placetoPayStatus, legacyStatus.placetoPayMessage);

    return (
      <div className="payment-result-page">
        <div className="payment-result-container">
          <div className={`result-icon ${display.className}`}>{display.icon}</div>
          <h1>{display.title}</h1>
          <p className="result-subtitle">{display.subtitle}</p>

          <div className="result-details">
            {legacyStatus.codigoReserva && legacyStatus.codigoReserva !== 'RES-MOCK' && (
              <div className="detail-row">
                <span>Código de Reserva:</span>
                <span className="detail-value">{legacyStatus.codigoReserva}</span>
              </div>
            )}
            <div className="detail-row">
              <span>Tipo:</span>
              <span>{legacyStatus.tipoReserva === 'SENDERO' ? 'Sendero / Actividad' : 'Alojamiento'}</span>
            </div>
            {legacyStatus.precioTotal > 0 && (
              <div className="detail-row">
                <span>Total:</span>
                <span>{formatCurrency(legacyStatus.precioTotal)}</span>
              </div>
            )}
            <div className="detail-row">
              <span>Estado de Reserva:</span>
              <span className={`status-badge status-${legacyStatus.estadoReserva?.toLowerCase()}`}>
                {legacyStatus.estadoReserva}
              </span>
            </div>
          </div>

          <div className="result-actions">
            {legacyStatus?.placetoPayStatus === 'REJECTED' && (
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
  }

  return null;
};

export default PaymentResult;
