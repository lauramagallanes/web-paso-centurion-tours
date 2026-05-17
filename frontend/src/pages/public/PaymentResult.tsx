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
  nombreContacto?: string;
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

/** Mismos pictogramas que en Mis reservas / tarjetas de reserva (sendero vs alojamiento). */
const TipoReservaIcon: React.FC<{ tipo: string }> = ({ tipo }) => {
  const sendero = tipo === 'SENDERO';
  return (
    <span className="result-tipo-reserva-icon" aria-hidden>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        {sendero ? (
          <path d="M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM9.8 8.9L7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3C14.8 12 16.8 13 19 13v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1L6 8.3V13h2V9.6l1.8-.7" />
        ) : (
          <path d="M7 14c1.66 0 3-1.34 3-3S8.66 8 7 8s-3 1.34-3 3 1.34 3 3 3zm0-4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm12-3h-8v8H3V5H1v15h2v-3h18v3h2v-9c0-2.21-1.79-4-4-4zm2 8h-8V9h6c1.1 0 2 .9 2 2v4z" />
        )}
      </svg>
    </span>
  );
};

const labelTipoReserva = (tipo: string) =>
  tipo === 'SENDERO' ? 'Sendero' : 'Alojamiento';

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
            {ordenStatus.nombreContacto ? (
              <div className="detail-row">
                <span>Reserva a nombre de:</span>
                <span className="detail-value detail-value--name">{ordenStatus.nombreContacto}</span>
              </div>
            ) : ordenStatus.codigoOrden && ordenStatus.codigoOrden !== 'ORD-MOCK' ? (
              <div className="detail-row">
                <span>Código de Orden:</span>
                <span className="detail-value">{ordenStatus.codigoOrden}</span>
              </div>
            ) : null}
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
                      <span className="result-item-type-inner">
                        <TipoReservaIcon tipo={item.tipoReserva} />
                        <span>{labelTipoReserva(item.tipoReserva)}</span>
                      </span>
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
