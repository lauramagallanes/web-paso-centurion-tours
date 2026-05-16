import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/apiService';
import { routes } from '../../utils/routes';
import './MyBookings.css';

interface BookingItem {
  id: string;
  type: 'sendero' | 'alojamiento';
  name: string;
  code: string;
  status: string;
  paymentStatus: string;
  date: string;
  endDate?: string;
  turno?: string;
  persons: number;
  total: number;
  paid: number;
  pending: number;
  currency: string;
  metodoPago?: string;
  fechaCreacion?: string;
}

const PREX_HOURS_TO_EXPIRE = 12;

/**
 * Small countdown banner shown on Prex pending reservations. Re-renders every minute
 * so the user sees the time remaining shrink in real time. When the deadline passes
 * the banner switches to an "expired" message; the actual cancellation happens
 * server-side as soon as anyone hits the system again.
 */
const PrexCountdown: React.FC<{ fechaCreacion?: string }> = ({ fechaCreacion }) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!fechaCreacion) return;
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, [fechaCreacion]);

  if (!fechaCreacion) {
    return (
      <div className="mb-prex-banner">
        <strong>Pago por transferencia Prex</strong>
        <span>
          Tenés 12 horas desde el momento de la reserva para enviarnos el comprobante.
          Si no llega a tiempo, liberamos la reserva automáticamente — ¡pero podés volver a reservar cuando quieras!
        </span>
      </div>
    );
  }

  const created = new Date(fechaCreacion + (fechaCreacion.includes('T') ? '' : 'T00:00:00')).getTime();
  const deadline = created + PREX_HOURS_TO_EXPIRE * 60 * 60 * 1000;
  const remainingMs = deadline - now;

  if (remainingMs <= 0) {
    return (
      <div className="mb-prex-banner mb-prex-banner-expired">
        <strong>Esta reserva ya se liberó</strong>
        <span>
          No alcanzamos a recibir el comprobante a tiempo, así que liberamos los cupos para otras personas.
          ¡Si querés, podés volver a reservar en cualquier momento!
        </span>
      </div>
    );
  }

  const totalMinutes = Math.floor(remainingMs / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const remainingLabel = hours > 0
    ? `${hours} h ${minutes.toString().padStart(2, '0')} min`
    : `${minutes} min`;

  return (
    <div className={`mb-prex-banner ${remainingMs < 60 * 60 * 1000 ? 'mb-prex-banner-warn' : ''}`}>
      <strong>Esperamos tu transferencia Prex</strong>
      <span>
        Te quedan <b>{remainingLabel}</b> para enviarnos el comprobante. Si no llega en ese plazo,
        liberamos la reserva para que otras personas puedan reservar.
      </span>
    </div>
  );
};

const MyBookings: React.FC = () => {
  const { state } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [payingId, setPayingId] = useState<string | null>(null);
  const [paymentModal, setPaymentModal] = useState<BookingItem | null>(null);
  const [selectedTipoPago, setSelectedTipoPago] = useState<'TOTAL' | 'SENA' | 'SALDO'>('TOTAL');

  useEffect(() => {
    const fetchBookings = async () => {
      if (!state.isAuthenticated || !state.user?.email) return;

      setLoading(true);
      setError(null);
      const items: BookingItem[] = [];

      try {
        // Fetch both sendero and alojamiento reservations in parallel
        const [senderoResult, alojamientoResult] = await Promise.allSettled([
          apiService.getReservasSenderoPorEmail(state.user.email),
          apiService.getReservasAlojamientoPorEmail(state.user.email),
        ]);

        // Process sendero reservations
        if (senderoResult.status === 'fulfilled' && senderoResult.value?.data) {
          const senderoData = Array.isArray(senderoResult.value.data) ? senderoResult.value.data : [];
          for (const r of senderoData) {
            items.push({
              id: r.id,
              type: 'sendero',
              name: r.nombreSendero || r.senderoNombre || 'Sendero',
              code: r.codigoReserva || r.codigo || '-',
              status: r.estado || 'PENDIENTE',
              paymentStatus: r.estadoPago || 'PENDIENTE',
              date: r.fechaInicio || r.fechaReserva || r.fecha || '',
              turno: r.turno || undefined,
              persons: r.numeroPersonas ?? r.cantidadPersonas ?? r.personas ?? 1,
              total: r.precioTotal || r.precio || 0,
              paid: r.montoPagado || 0,
              pending: r.saldoPendiente || 0,
              currency: 'UYU',
              metodoPago: r.metodoPago || undefined,
              fechaCreacion: r.fechaCreacion || undefined,
            });
          }
        }

        // Process alojamiento reservations
        if (alojamientoResult.status === 'fulfilled' && alojamientoResult.value?.data) {
          const alojData = Array.isArray(alojamientoResult.value.data) ? alojamientoResult.value.data : [];
          for (const r of alojData) {
            items.push({
              id: r.id,
              type: 'alojamiento',
              name: r.alojamientoNombre || r.nombreAlojamiento || 'Alojamiento',
              code: r.codigoReserva || r.codigo || '-',
              status: r.estado || 'PENDIENTE',
              paymentStatus: r.estadoPago || 'PENDIENTE',
              date: r.fechaCheckIn || r.fechaInicio || '',
              endDate: r.fechaCheckOut || r.fechaFin || '',
              persons: r.numeroHuespedes ?? r.cantidadPersonas ?? 1,
              total: r.precioTotal || r.precio || 0,
              paid: r.montoPagado || 0,
              pending: r.saldoPendiente || 0,
              currency: 'UYU',
              metodoPago: r.metodoPago || undefined,
              fechaCreacion: r.fechaCreacion || undefined,
            });
          }
        }

        setBookings(items);
      } catch (err: any) {
        console.error('Error fetching bookings:', err);
        setError(err?.message || 'Error al cargar las reservas');
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [state.isAuthenticated, state.user?.email]);

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      PENDIENTE: 'Pendiente',
      CONFIRMADA: 'Confirmada',
      CANCELADA: 'Cancelada',
      COMPLETADA: 'Completada',
      EN_CURSO: 'En curso',
    };
    return map[status] || status;
  };

  const getStatusClass = (status: string) => {
    const map: Record<string, string> = {
      PENDIENTE: 'status-pending',
      CONFIRMADA: 'status-confirmed',
      CANCELADA: 'status-cancelled',
      COMPLETADA: 'status-completed',
      EN_CURSO: 'status-confirmed',
    };
    return map[status] || 'status-pending';
  };

  const getPaymentLabel = (ps: string) => {
    const map: Record<string, string> = {
      PENDIENTE: 'Sin pago',
      PAGADO: 'Pagado',
      COMPLETO: 'Pagado',
      RESERVA_PAGA: 'Reserva pagada',
      PARCIAL: 'Pago parcial',
    };
    return map[ps] || ps;
  };

  const isPrexPending = (b: BookingItem) =>
    b.metodoPago === 'PREX' &&
    b.status === 'PENDIENTE' &&
    (b.paymentStatus === 'PENDIENTE' || !b.paymentStatus);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr + (dateStr.includes('T') ? '' : 'T00:00:00'));
      return d.toLocaleDateString('es-UY', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const filteredBookings = bookings.filter(b => {
    if (filterStatus === 'all') return true;
    return b.status === filterStatus;
  });

  const canPay = (b: BookingItem) =>
    (b.status === 'PENDIENTE' || b.status === 'CONFIRMADA') &&
    b.paymentStatus !== 'COMPLETO' && b.paymentStatus !== 'PAGADO' &&
    (b.paymentStatus === 'PENDIENTE' || b.paymentStatus === 'RESERVA_PAGA' || b.paymentStatus === 'PARCIAL');

  const hasPendingSaldo = (b: BookingItem) =>
    b.paymentStatus === 'PARCIAL' || b.paymentStatus === 'RESERVA_PAGA';

  const getSaldo = (b: BookingItem) => {
    if (b.pending > 0) return b.pending;
    return b.total - b.paid;
  };

  const handlePayClick = (booking: BookingItem) => {
    if (hasPendingSaldo(booking)) {
      // Already has partial payment - pay saldo directly
      processPayment(booking, 'SALDO');
    } else if (booking.type === 'alojamiento') {
      // Show modal to choose payment type (total vs 30% reserva)
      setPaymentModal(booking);
      setSelectedTipoPago('TOTAL');
    } else {
      // Sendero: pay directly
      processPayment(booking, 'TOTAL');
    }
  };

  const processPayment = async (booking: BookingItem, tipoPago: 'TOTAL' | 'SENA' | 'SALDO') => {
    setPayingId(booking.id);
    setPaymentModal(null);
    try {
      const tipoReserva = booking.type === 'sendero' ? 'SENDERO' : 'ALOJAMIENTO';
      const response: any = await apiService.createPaymentSession(booking.id, tipoReserva, tipoPago);
      const data = response?.data || response;
      if (data?.processUrl) {
        window.location.href = data.processUrl;
      } else {
        setError(data?.message || 'Error al crear sesion de pago');
        setPayingId(null);
      }
    } catch (err: any) {
      setError(err?.message || 'Error al procesar el pago');
      setPayingId(null);
    }
  };

  // Not authenticated
  if (!state.isAuthenticated) {
    return (
      <div className="mb-page">
        <div className="mb-container">
          <div className="mb-auth-required">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="#6b792e">
              <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
            </svg>
            <h2>Inicia sesion para ver tus reservas</h2>
            <p>Necesitas una cuenta para gestionar tus reservas.</p>
            <button className="mb-btn-primary" onClick={() => navigate(routes.login)}>
              Iniciar sesion
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-page">
      <div className="mb-container">
        {/* Header */}
        <div className="mb-header">
          <h1 className="mb-title">Mis Reservas</h1>
          <p className="mb-subtitle">
            Aqui encontraras todas tus reservas de senderos y alojamientos.
          </p>
        </div>

        {/* Filters */}
        <div className="mb-filters">
          {[
            { value: 'all', label: 'Todas' },
            { value: 'CONFIRMADA', label: 'Confirmadas' },
            { value: 'PENDIENTE', label: 'Pendientes' },
            { value: 'CANCELADA', label: 'Canceladas' },
          ].map(f => (
            <button
              key={f.value}
              className={`mb-filter ${filterStatus === f.value ? 'active' : ''}`}
              onClick={() => setFilterStatus(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="mb-loading">
            <div className="mb-spinner" />
            <p>Cargando reservas...</p>
          </div>
        ) : error ? (
          <div className="mb-error-state">
            <p>{error}</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="mb-empty">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="#807a75">
              <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
            </svg>
            <h3>No tienes reservas</h3>
            <p>Explora nuestros senderos y alojamientos para comenzar.</p>
            <div className="mb-empty-actions">
              <button className="mb-btn-primary" onClick={() => navigate(routes.activities)}>
                Ver senderos
              </button>
              <button className="mb-btn-secondary" onClick={() => navigate(routes.alojamientos)}>
                Ver alojamientos
              </button>
            </div>
          </div>
        ) : (
          <div className="mb-list">
            {filteredBookings.map(booking => (
              <div key={booking.id} className="mb-card">
                <div className="mb-card-header">
                  <div className="mb-card-type">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      {booking.type === 'sendero' ? (
                        <path d="M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM9.8 8.9L7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3C14.8 12 16.8 13 19 13v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1L6 8.3V13h2V9.6l1.8-.7"/>
                      ) : (
                        <path d="M7 14c1.66 0 3-1.34 3-3S8.66 8 7 8s-3 1.34-3 3 1.34 3 3 3zm0-4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm12-3h-8v8H3V5H1v15h2v-3h18v3h2v-9c0-2.21-1.79-4-4-4zm2 8h-8V9h6c1.1 0 2 .9 2 2v4z"/>
                      )}
                    </svg>
                    <span>{booking.type === 'sendero' ? 'Sendero' : 'Alojamiento'}</span>
                  </div>
                  <span className={`mb-status ${getStatusClass(booking.status)}`}>
                    {getStatusLabel(booking.status)}
                  </span>
                </div>

                <h3 className="mb-card-name">{booking.name}</h3>

                <div className="mb-card-details">
                  <div className="mb-detail">
                    <span className="mb-detail-label">Codigo</span>
                    <span className="mb-detail-value mb-code">{booking.code}</span>
                  </div>
                  <div className="mb-detail">
                    <span className="mb-detail-label">Fecha</span>
                    <span className="mb-detail-value">
                      {formatDate(booking.date)}
                      {booking.endDate && ` - ${formatDate(booking.endDate)}`}
                    </span>
                  </div>
                  {booking.type === 'sendero' && booking.turno && (
                    <div className="mb-detail">
                      <span className="mb-detail-label">Turno</span>
                      <span className="mb-detail-value">
                        {booking.turno === 'MANANA' ? 'Mañana' : booking.turno === 'TARDE' ? 'Tarde' : booking.turno}
                      </span>
                    </div>
                  )}
                  <div className="mb-detail">
                    <span className="mb-detail-label">Personas</span>
                    <span className="mb-detail-value">{booking.persons}</span>
                  </div>
                  <div className="mb-detail">
                    <span className="mb-detail-label">Total</span>
                    <span className="mb-detail-value">${booking.total.toLocaleString()} {booking.currency}</span>
                  </div>
                  <div className="mb-detail">
                    <span className="mb-detail-label">Pago</span>
                    <span className="mb-detail-value">{getPaymentLabel(booking.paymentStatus)}</span>
                  </div>
                  {hasPendingSaldo(booking) && (
                    <div className="mb-detail">
                      <span className="mb-detail-label">Saldo pendiente</span>
                      <span className="mb-detail-value mb-saldo">${getSaldo(booking).toLocaleString()} {booking.currency}</span>
                    </div>
                  )}
                </div>

                {isPrexPending(booking) && (
                  <PrexCountdown fechaCreacion={booking.fechaCreacion} />
                )}

                {/* Pay button for unpaid reservations */}
                {canPay(booking) && (
                  <div className="mb-card-actions">
                    <button
                      className="mb-btn-pay"
                      onClick={() => handlePayClick(booking)}
                      disabled={payingId === booking.id}
                    >
                      {payingId === booking.id ? (
                        <>
                          <div className="mb-btn-spinner" />
                          Procesando...
                        </>
                      ) : (
                        <>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
                          </svg>
                          {hasPendingSaldo(booking) ? `Pagar saldo ($${getSaldo(booking).toLocaleString()} ${booking.currency})` : 'Pagar ahora'}
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment type modal for alojamiento */}
      {paymentModal && (
        <div className="mb-modal-overlay" onClick={() => setPaymentModal(null)}>
          <div className="mb-modal" onClick={e => e.stopPropagation()}>
            <h3 className="mb-modal-title">Seleccionar forma de pago</h3>
            <p className="mb-modal-subtitle">{paymentModal.name} - Total: ${paymentModal.total.toLocaleString()} UYU</p>

            <div className="mb-modal-options">
              <label className={`mb-modal-option ${selectedTipoPago === 'TOTAL' ? 'selected' : ''}`}>
                <input type="radio" name="tipoPago" checked={selectedTipoPago === 'TOTAL'} onChange={() => setSelectedTipoPago('TOTAL')} />
                <div>
                  <strong>Pago total</strong>
                  <span className="mb-modal-amount">${paymentModal.total.toLocaleString()} UYU</span>
                </div>
              </label>
              <label className={`mb-modal-option ${selectedTipoPago === 'SENA' ? 'selected' : ''}`}>
                <input type="radio" name="tipoPago" checked={selectedTipoPago === 'SENA'} onChange={() => setSelectedTipoPago('SENA')} />
                <div>
                  <strong>Reserva (30%)</strong>
                  <span className="mb-modal-amount">${(paymentModal.total * 0.3).toLocaleString()} UYU</span>
                  <small>Saldo de ${(paymentModal.total * 0.7).toLocaleString()} UYU antes del check-in</small>
                </div>
              </label>
            </div>

            <div className="mb-modal-actions">
              <button className="mb-btn-pay" onClick={() => processPayment(paymentModal, selectedTipoPago)}>
                Pagar ${selectedTipoPago === 'SENA' ? (paymentModal.total * 0.3).toLocaleString() : paymentModal.total.toLocaleString()} UYU
              </button>
              <button className="mb-btn-cancel" onClick={() => setPaymentModal(null)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBookings;
