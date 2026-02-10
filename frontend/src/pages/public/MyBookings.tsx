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
  persons: number;
  total: number;
  paid: number;
  pending: number;
  currency: string;
}

const MyBookings: React.FC = () => {
  const { state } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

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
              code: r.codigo || r.codigoReserva || '-',
              status: r.estado || 'PENDIENTE',
              paymentStatus: r.estadoPago || 'PENDIENTE',
              date: r.fechaReserva || r.fecha || '',
              persons: r.cantidadPersonas || r.personas || 1,
              total: r.precioTotal || r.precio || 0,
              paid: r.montoPagado || 0,
              pending: r.saldoPendiente || 0,
              currency: 'USD',
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
              name: r.nombreAlojamiento || r.alojamientoNombre || 'Alojamiento',
              code: r.codigo || r.codigoReserva || '-',
              status: r.estado || 'PENDIENTE',
              paymentStatus: r.estadoPago || 'PENDIENTE',
              date: r.fechaCheckIn || r.fechaInicio || '',
              endDate: r.fechaCheckOut || r.fechaFin || '',
              persons: r.numeroHuespedes || r.cantidadPersonas || 1,
              total: r.precioTotal || r.precio || 0,
              paid: r.montoPagado || 0,
              pending: r.saldoPendiente || 0,
              currency: 'USD',
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
      RESERVA_PAGA: 'Sena pagada',
      PARCIAL: 'Pago parcial',
    };
    return map[ps] || ps;
  };

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
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBookings;
