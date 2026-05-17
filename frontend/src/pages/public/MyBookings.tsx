import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/apiService';
import { PREX_ACCOUNT, PREX_WHATSAPP_DISPLAY, prexComprobanteWhatsAppUrl } from '../../config/prex';
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

/** Normaliza estado de pago del API (enum .name() suele ser MAYÚSCULAS). */
const normalizeEstadoPago = (raw: string | undefined): string =>
  (raw == null || raw === '' ? 'PENDIENTE' : String(raw)).toUpperCase();

const PREX_HOURS_TO_EXPIRE = 12;

/**
 * The backend serializes `LocalDateTime` (UTC, since Lambda runs in UTC) without a
 * timezone suffix. `new Date(string)` would then interpret it as local time and the
 * countdown would drift by the timezone offset. We force UTC parsing by appending 'Z'
 * when the string has no zone information.
 */
const parseBackendDateTime = (raw: string): number => {
  if (!raw) return NaN;
  const hasTimezone = /[zZ]|[+-]\d{2}:?\d{2}$/.test(raw);
  if (hasTimezone) return new Date(raw).getTime();
  // Pure date or LocalDateTime → treat as UTC
  const normalized = raw.includes('T') ? `${raw}Z` : `${raw}T00:00:00Z`;
  return new Date(normalized).getTime();
};

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
        <strong>Transferencia Prex</strong>
        <span>
          Dispone de 12 horas desde el momento de la reserva para enviarnos el comprobante.
          Si no lo recibimos a tiempo, la reserva se cancelará de forma automática; puede volver a reservar cuando lo desee.
        </span>
      </div>
    );
  }

  const created = parseBackendDateTime(fechaCreacion);
  const deadline = created + PREX_HOURS_TO_EXPIRE * 60 * 60 * 1000;
  const remainingMs = deadline - now;

  if (remainingMs <= 0) {
    return (
      <div className="mb-prex-banner mb-prex-banner-expired">
        <strong>Plazo finalizado</strong>
        <span>
          No recibimos el comprobante dentro del plazo y la fecha quedó liberada.
          Puede realizar una nueva reserva cuando quiera. Gracias por su interés.
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
      <strong>Gracias: solo falta el comprobante</strong>
      <span>
        Dispone de <b>{remainingLabel}</b> para enviarnos el comprobante de su transferencia Prex.
        Cuando lo recibamos, confirmaremos su reserva por correo electrónico.
        Si no llega dentro de ese plazo, liberaremos la fecha para que otras personas puedan reservar.
      </span>
    </div>
  );
};

/** Datos de cuenta + instrucciones (checkout y Mis reservas). Identificación por nombre de quien reserva. */
const PrexTransferDetails: React.FC<{
  codigoReserva?: string;
  nombreQuienReserva: string;
  codigosReserva?: string[];
  saldoPendiente?: { monto: number; currency: string };
}> = ({ codigoReserva, nombreQuienReserva, codigosReserva, saldoPendiente }) => {
  const nombre = (nombreQuienReserva || '').trim() || '—';
  const codigosLista =
    codigosReserva && codigosReserva.length > 0
      ? codigosReserva
      : codigoReserva
        ? [codigoReserva]
        : [];
  const listaCodigosTexto = codigosLista.join(', ');

  const mailBody = (() => {
    let body = `Hola,\n\nAdjunto el comprobante de la transferencia Prex.\n\nNombre de quien reserva: ${nombre}\n`;
    if (saldoPendiente) {
      body += `Importe: $${saldoPendiente.monto.toLocaleString()} ${saldoPendiente.currency}\n`;
    }
    if (listaCodigosTexto) {
      body += `Códigos de reserva: ${listaCodigosTexto}\n`;
    }
    body += `\nSaludos.`;
    return body;
  })();

  const mailto = `mailto:${PREX_ACCOUNT.email}?subject=${encodeURIComponent(PREX_ACCOUNT.asuntoEmail)}&body=${encodeURIComponent(mailBody)}`;
  const whatsappUrl = prexComprobanteWhatsAppUrl(mailBody);
  return (
    <div className="mb-prex-transfer-details">
      <h4 className="mb-prex-transfer-title">Datos para la transferencia</h4>
      {saldoPendiente && (
        <p className="mb-prex-saldo-line">
          {listaCodigosTexto && codigosLista.length > 1 ? 'Total a transferir' : 'Saldo a transferir'}:{' '}
          <strong>
            ${saldoPendiente.monto.toLocaleString()} {saldoPendiente.currency}
          </strong>
        </p>
      )}
      <p className="mb-prex-nombre-line">
        Reserva a nombre de: <strong className="mb-code-inline">{nombre}</strong>
      </p>
      <ul className="mb-prex-transfer-list">
        <li><span>Titular</span><strong>{PREX_ACCOUNT.titular}</strong></li>
        <li><span>Número de cuenta</span><strong>{PREX_ACCOUNT.cuenta}</strong></li>
      </ul>
      <p className="mb-prex-transfer-note">
        Puede enviarnos el comprobante por correo a <strong>{PREX_ACCOUNT.email}</strong> (asunto{' '}
        <strong>«{PREX_ACCOUNT.asuntoEmail}»</strong>) o por WhatsApp al <strong>{PREX_WHATSAPP_DISPLAY}</strong>.
        Indique en el mensaje el <strong>nombre completo de quien hizo la reserva</strong> (el mismo que figura arriba).
        {listaCodigosTexto ? (
          <>
            {' '}
            Si lo desea, puede añadir también {codigosLista.length > 1 ? 'los códigos' : 'el código'} de reserva:{' '}
            <strong className="mb-code-inline">{listaCodigosTexto}</strong>.
          </>
        ) : null}{' '}
        Cuando registremos el pago, actualizaremos el estado en el sistema.
      </p>
      <div className="mb-prex-contact-actions">
        <a className="mb-prex-mailto" href={mailto}>
          Abrir el correo
        </a>
        <a className="mb-prex-whatsapp" href={whatsappUrl} target="_blank" rel="noopener noreferrer">
          Abrir WhatsApp
        </a>
      </div>
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
  const [saldoFlow, setSaldoFlow] = useState<
    | { booking: BookingItem; step: 'metodo'; metodo: 'CARD' | 'PREX' }
    | { booking: BookingItem; step: 'prex' }
    | null
  >(null);
  const [batchPayFlow, setBatchPayFlow] = useState<
    | { step: 'metodo'; metodo: 'CARD' | 'PREX'; items: BookingItem[]; total: number }
    | { step: 'prex'; items: BookingItem[]; total: number }
    | null
  >(null);
  const [cancelFlow, setCancelFlow] = useState<{
    booking: BookingItem;
    motivo: string;
    submitting: boolean;
    error: string | null;
  } | null>(null);

  const nombreQuienReservaUi =
    state.user?.nombreCompleto?.trim() || state.user?.email?.trim() || '';

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
              paymentStatus: normalizeEstadoPago(r.estadoPago),
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
              paymentStatus: normalizeEstadoPago(r.estadoPago),
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

  /**
   * Ocultar solo la reserva Prex todavía sin ningún pago (transferencia inicial pendiente).
   * Si ya hay seña o pago parcial aunque metodoPago siga PREX, debe poder pagar saldo / resto.
   */
  const canPay = (b: BookingItem) => {
    if (isPrexPending(b)) return false;
    return (
      (b.status === 'PENDIENTE' || b.status === 'CONFIRMADA') &&
      b.paymentStatus !== 'COMPLETO' &&
      b.paymentStatus !== 'PAGADO' &&
      (b.paymentStatus === 'PENDIENTE' ||
        b.paymentStatus === 'RESERVA_PAGA' ||
        b.paymentStatus === 'PARCIAL')
    );
  };

  const hasPendingSaldo = (b: BookingItem) =>
    b.paymentStatus === 'PARCIAL' ||
    b.paymentStatus === 'RESERVA_PAGA' ||
    (getSaldo(b) > 0 &&
      b.status === 'CONFIRMADA' &&
      b.paymentStatus !== 'COMPLETO' &&
      b.paymentStatus !== 'PAGADO' &&
      b.paid > 0);

  /**
   * El usuario sólo puede solicitar cancelar si:
   *  - La reserva está PENDIENTE o CONFIRMADA (no cancelada/completada).
   *  - La fecha de la reserva todavía no pasó.
   *  - No es una reserva Prex con la transferencia inicial pendiente: en ese caso
   *    se cancela sola por inactividad y el botón sólo agregaría ruido.
   */
  const canRequestCancellation = (b: BookingItem): boolean => {
    if (b.status !== 'PENDIENTE' && b.status !== 'CONFIRMADA') return false;
    if (isPrexPending(b)) return false;
    if (!b.date) return true;
    try {
      const start = new Date(b.date + (b.date.includes('T') ? '' : 'T00:00:00')).getTime();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return start >= today.getTime();
    } catch {
      return true;
    }
  };

  const handleConfirmCancellation = async () => {
    if (!cancelFlow || cancelFlow.submitting) return;
    const { booking, motivo } = cancelFlow;
    setCancelFlow({ ...cancelFlow, submitting: true, error: null });
    try {
      const tipo = booking.type === 'sendero' ? 'SENDERO' : 'ALOJAMIENTO';
      await apiService.cancelarReservaUsuario(booking.id, tipo, motivo);
      setBookings(prev =>
        prev.map(b =>
          b.id === booking.id ? { ...b, status: 'CANCELADA', paymentStatus: 'NO_CORRESPONDE' } : b,
        ),
      );
      setCancelFlow(null);
    } catch (err: any) {
      setCancelFlow(prev =>
        prev
          ? {
              ...prev,
              submitting: false,
              error: err?.message || 'No se pudo cancelar la reserva. Intentá nuevamente.',
            }
          : prev,
      );
    }
  };

  const getSaldo = (b: BookingItem) => {
    if (b.pending > 0) return b.pending;
    return b.total - b.paid;
  };

  const payableWithSaldoAll = bookings.filter(b => canPay(b) && getSaldo(b) > 0);
  const totalSaldoPendienteAgrupado = payableWithSaldoAll.reduce((acc, b) => acc + getSaldo(b), 0);

  const processBatchOrdenCard = async (items: BookingItem[]) => {
    setPayingId('batch');
    setError(null);
    try {
      const u = state.user;
      if (!u?.email) throw new Error('No hay sesión');
      const response: any = await apiService.createOrdenPagoPendientes({
        emailContacto: u.email,
        nombreContacto: u.nombreCompleto || u.email,
        metodoPago: 'CARD',
        items: items.map(it => ({
          tipo: it.type === 'sendero' ? ('SENDERO' as const) : ('ALOJAMIENTO' as const),
          reservaId: it.id,
        })),
      });
      const data = response?.data || response;
      if (data?.processUrl) {
        window.location.href = data.processUrl;
      } else {
        setError(data?.message || 'Error al crear sesión de pago');
        setPayingId(null);
      }
    } catch (err: any) {
      setError(err?.message || 'Error al procesar el pago');
      setPayingId(null);
    }
  };

  const submitBatchOrdenPrex = async (items: BookingItem[], total: number) => {
    setPayingId('batch');
    setError(null);
    try {
      const u = state.user;
      if (!u?.email) throw new Error('No hay sesión');
      const response: any = await apiService.createOrdenPagoPendientes({
        emailContacto: u.email,
        nombreContacto: u.nombreCompleto || u.email,
        metodoPago: 'PREX',
        items: items.map(it => ({
          tipo: it.type === 'sendero' ? ('SENDERO' as const) : ('ALOJAMIENTO' as const),
          reservaId: it.id,
        })),
      });
      const data = response?.data || response;
      if (data?.status === 'PENDIENTE_TRANSFERENCIA') {
        setBatchPayFlow({
          step: 'prex',
          items,
          total,
        });
      } else {
        setError(data?.message || 'No se pudo iniciar la transferencia Prex');
      }
    } catch (err: any) {
      setError(err?.message || 'Error al procesar el pago agrupado');
    } finally {
      setPayingId(null);
    }
  };

  const handleOpenBatchPay = () => {
    if (payableWithSaldoAll.length === 0 || totalSaldoPendienteAgrupado <= 0) return;
    setBatchPayFlow({
      step: 'metodo',
      metodo: 'CARD',
      items: payableWithSaldoAll,
      total: totalSaldoPendienteAgrupado,
    });
  };

  const handleBatchMetodoContinuar = () => {
    if (!batchPayFlow || batchPayFlow.step !== 'metodo') return;
    const { items, metodo, total } = batchPayFlow;
    if (metodo === 'PREX') {
      void submitBatchOrdenPrex(items, total);
      return;
    }
    setBatchPayFlow(null);
    void processBatchOrdenCard(items);
  };

  const handlePayClick = (booking: BookingItem) => {
    if (hasPendingSaldo(booking)) {
      setSaldoFlow({ booking, step: 'metodo', metodo: 'CARD' });
      return;
    }
    if (booking.type === 'alojamiento') {
      // Show modal to choose payment type (total vs 30% reserva)
      setPaymentModal(booking);
      setSelectedTipoPago('TOTAL');
    } else {
      // Sendero: pay directly
      processPayment(booking, 'TOTAL');
    }
  };

  const handleSaldoMetodoContinuar = () => {
    if (!saldoFlow || saldoFlow.step !== 'metodo') return;
    const { booking, metodo } = saldoFlow;
    if (metodo === 'PREX') {
      setSaldoFlow({ booking, step: 'prex' });
      return;
    }
    setSaldoFlow(null);
    void processPayment(booking, 'SALDO');
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

        {payableWithSaldoAll.length > 0 && totalSaldoPendienteAgrupado > 0 && (
          <div className="mb-batch-pay-bar">
            <div className="mb-batch-pay-info">
              <strong>Pagar todo junto</strong>
              <p className="mb-batch-pay-desc">
                Saldo total pendiente:{' '}
                <span className="mb-batch-pay-amount">
                  ${totalSaldoPendienteAgrupado.toLocaleString()} UYU
                </span>{' '}
                ({payableWithSaldoAll.length}{' '}
                {payableWithSaldoAll.length === 1 ? 'reserva' : 'reservas'})
              </p>
            </div>
            <button
              type="button"
              className="mb-btn-pay mb-batch-pay-btn"
              onClick={handleOpenBatchPay}
              disabled={!!payingId}
            >
              Elegir forma de pago
            </button>
          </div>
        )}

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
                    <span className="mb-detail-value">
                      {booking.metodoPago === 'PREX' &&
                      booking.status === 'PENDIENTE' &&
                      (booking.paymentStatus === 'PENDIENTE' || !booking.paymentStatus)
                        ? 'Transferencia Prex (pendiente)'
                        : getPaymentLabel(booking.paymentStatus)}
                    </span>
                  </div>
                  {hasPendingSaldo(booking) && (
                    <div className="mb-detail">
                      <span className="mb-detail-label">Saldo pendiente</span>
                      <span className="mb-detail-value mb-saldo">${getSaldo(booking).toLocaleString()} {booking.currency}</span>
                    </div>
                  )}
                </div>

                {isPrexPending(booking) && (
                  <>
                    <PrexCountdown fechaCreacion={booking.fechaCreacion} />
                    <PrexTransferDetails
                      codigoReserva={booking.code}
                      nombreQuienReserva={nombreQuienReservaUi}
                    />
                  </>
                )}

                {/* Pay button for unpaid reservations + cancel button when allowed */}
                {(canPay(booking) || canRequestCancellation(booking)) && (
                  <div className="mb-card-actions">
                    {canPay(booking) && (
                      <button
                        className="mb-btn-pay"
                        onClick={() => handlePayClick(booking)}
                        disabled={payingId === booking.id || payingId === 'batch'}
                      >
                        {payingId === booking.id ? (
                          <>
                            <div className="mb-btn-spinner" />
                            Procesando...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-credit-card" aria-hidden="true" />
                            {hasPendingSaldo(booking)
                              ? `Pagar saldo ($${getSaldo(booking).toLocaleString()} ${booking.currency})`
                              : 'Pagar ahora'}
                          </>
                        )}
                      </button>
                    )}
                    {canRequestCancellation(booking) && (
                      <button
                        type="button"
                        className="mb-btn-cancel-request"
                        onClick={() =>
                          setCancelFlow({
                            booking,
                            motivo: '',
                            submitting: false,
                            error: null,
                          })
                        }
                        disabled={payingId === booking.id || payingId === 'batch'}
                      >
                        <i className="bi bi-x-circle" aria-hidden="true" />
                        Solicitar cancelación
                      </button>
                    )}
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

      {saldoFlow && (
        <div
          className="mb-modal-overlay"
          onClick={() => {
            if (!payingId) setSaldoFlow(null);
          }}
        >
          <div
            className={`mb-modal ${saldoFlow.step === 'prex' ? 'mb-modal--saldo-prex' : ''}`}
            onClick={e => e.stopPropagation()}
          >
            {saldoFlow.step === 'metodo' && (
              <>
                <h3 className="mb-modal-title">Pagar saldo pendiente</h3>
                <p className="mb-modal-subtitle">
                  {saldoFlow.booking.name} — Saldo: ${getSaldo(saldoFlow.booking).toLocaleString()}{' '}
                  {saldoFlow.booking.currency}
                </p>
                <p className="mb-saldo-pay-intro">
                  Elija el mismo tipo de pago que en el checkout: tarjeta en línea o transferencia Prex.
                </p>
                <div className="mb-modal-options">
                  <label className={`mb-modal-option ${saldoFlow.metodo === 'CARD' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="saldoMetodoPago"
                      checked={saldoFlow.metodo === 'CARD'}
                      onChange={() => setSaldoFlow({ booking: saldoFlow.booking, step: 'metodo', metodo: 'CARD' })}
                    />
                    <div>
                      <strong>Tarjeta de crédito o débito</strong>
                      <small>Pago seguro con Getnet. Visa, Mastercard y otras tarjetas.</small>
                    </div>
                  </label>
                  <label className={`mb-modal-option ${saldoFlow.metodo === 'PREX' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="saldoMetodoPago"
                      checked={saldoFlow.metodo === 'PREX'}
                      onChange={() => setSaldoFlow({ booking: saldoFlow.booking, step: 'metodo', metodo: 'PREX' })}
                    />
                    <div>
                      <strong>Transferencia a cuenta Prex</strong>
                      <small>Verá los datos de la cuenta y podrá enviarnos el comprobante por correo.</small>
                    </div>
                  </label>
                </div>
                <div className="mb-modal-actions">
                  <button
                    type="button"
                    className="mb-btn-pay"
                    onClick={handleSaldoMetodoContinuar}
                    disabled={!!payingId}
                  >
                    {saldoFlow.metodo === 'PREX' ? 'Ver datos de transferencia' : 'Continuar con tarjeta'}
                  </button>
                  <button
                    type="button"
                    className="mb-btn-cancel"
                    onClick={() => setSaldoFlow(null)}
                    disabled={!!payingId}
                  >
                    Cancelar
                  </button>
                </div>
              </>
            )}
            {saldoFlow.step === 'prex' && (
              <>
                <h3 className="mb-modal-title">Transferencia Prex (saldo)</h3>
                <p className="mb-modal-subtitle">
                  Transfiera el importe del saldo y envíe el comprobante indicando el código de reserva.
                </p>
                <PrexTransferDetails
                  codigoReserva={saldoFlow.booking.code}
                  nombreQuienReserva={nombreQuienReservaUi}
                  saldoPendiente={{
                    monto: getSaldo(saldoFlow.booking),
                    currency: saldoFlow.booking.currency,
                  }}
                />
                <div className="mb-modal-actions">
                  <button
                    type="button"
                    className="mb-btn-secondary"
                    onClick={() => setSaldoFlow({ booking: saldoFlow.booking, step: 'metodo', metodo: 'PREX' })}
                  >
                    Volver
                  </button>
                  <button type="button" className="mb-btn-cancel" onClick={() => setSaldoFlow(null)}>
                    Cerrar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {batchPayFlow && (
        <div
          className="mb-modal-overlay"
          onClick={() => {
            if (!payingId) setBatchPayFlow(null);
          }}
        >
          <div
            className={`mb-modal ${batchPayFlow.step === 'prex' ? 'mb-modal--saldo-prex' : ''}`}
            onClick={e => e.stopPropagation()}
          >
            {batchPayFlow.step === 'metodo' && (
              <>
                <h3 className="mb-modal-title">Pagar todo lo pendiente</h3>
                <p className="mb-modal-subtitle">
                  Total: ${batchPayFlow.total.toLocaleString()} UYU — {batchPayFlow.items.length}{' '}
                  {batchPayFlow.items.length === 1 ? 'reserva' : 'reservas'}
                </p>
                <ul className="mb-batch-resumen">
                  {batchPayFlow.items.map(it => (
                    <li key={it.id}>
                      {it.name} ({it.code}) — ${getSaldo(it).toLocaleString()} {it.currency}
                    </li>
                  ))}
                </ul>
                <p className="mb-saldo-pay-intro">
                  Una sola operación por el saldo total. Elija tarjeta (Getnet) o transferencia Prex.
                </p>
                <div className="mb-modal-options">
                  <label className={`mb-modal-option ${batchPayFlow.metodo === 'CARD' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="batchMetodoPago"
                      checked={batchPayFlow.metodo === 'CARD'}
                      onChange={() =>
                        setBatchPayFlow({
                          step: 'metodo',
                          metodo: 'CARD',
                          items: batchPayFlow.items,
                          total: batchPayFlow.total,
                        })
                      }
                    />
                    <div>
                      <strong>Tarjeta de crédito o débito</strong>
                      <small>Pago seguro con Getnet. Visa, Mastercard y otras tarjetas.</small>
                    </div>
                  </label>
                  <label className={`mb-modal-option ${batchPayFlow.metodo === 'PREX' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="batchMetodoPago"
                      checked={batchPayFlow.metodo === 'PREX'}
                      onChange={() =>
                        setBatchPayFlow({
                          step: 'metodo',
                          metodo: 'PREX',
                          items: batchPayFlow.items,
                          total: batchPayFlow.total,
                        })
                      }
                    />
                    <div>
                      <strong>Transferencia a cuenta Prex</strong>
                      <small>Verá los datos de la cuenta; indique su nombre en el comprobante.</small>
                    </div>
                  </label>
                </div>
                <div className="mb-modal-actions">
                  <button
                    type="button"
                    className="mb-btn-pay"
                    onClick={handleBatchMetodoContinuar}
                    disabled={!!payingId}
                  >
                    {payingId === 'batch' ? (
                      <>
                        <div className="mb-btn-spinner" />
                        Procesando...
                      </>
                    ) : batchPayFlow.metodo === 'PREX' ? (
                      'Ver datos para transferir'
                    ) : (
                      'Continuar con tarjeta'
                    )}
                  </button>
                  <button
                    type="button"
                    className="mb-btn-cancel"
                    onClick={() => setBatchPayFlow(null)}
                    disabled={!!payingId}
                  >
                    Cancelar
                  </button>
                </div>
              </>
            )}
            {batchPayFlow.step === 'prex' && (
              <>
                <h3 className="mb-modal-title">Transferencia Prex (pago agrupado)</h3>
                <p className="mb-modal-subtitle">
                  Transfiera el importe total e indique en el comprobante el nombre de quien reserva (el mismo que
                  figura en su cuenta). Si lo desea, puede añadir también los códigos de las reservas.
                </p>
                <PrexTransferDetails
                  nombreQuienReserva={nombreQuienReservaUi}
                  codigosReserva={batchPayFlow.items.map(b => b.code)}
                  saldoPendiente={{ monto: batchPayFlow.total, currency: 'UYU' }}
                />
                <div className="mb-modal-actions">
                  <button
                    type="button"
                    className="mb-btn-secondary"
                    onClick={() =>
                      setBatchPayFlow({
                        step: 'metodo',
                        metodo: 'PREX',
                        items: batchPayFlow.items,
                        total: batchPayFlow.total,
                      })
                    }
                  >
                    Volver
                  </button>
                  <button type="button" className="mb-btn-cancel" onClick={() => setBatchPayFlow(null)}>
                    Cerrar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {cancelFlow && (
        <div
          className="mb-modal-overlay"
          onClick={() => {
            if (!cancelFlow.submitting) setCancelFlow(null);
          }}
        >
          <div
            className="mb-modal mb-modal--cancel-request"
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-flow-title"
          >
            <h3 id="cancel-flow-title" className="mb-modal-title mb-modal-title--warn">
              <i className="bi bi-exclamation-triangle-fill" aria-hidden="true" />
              Solicitar cancelación
            </h3>
            <p className="mb-modal-subtitle">
              {cancelFlow.booking.name} — {formatDate(cancelFlow.booking.date)}
              {cancelFlow.booking.endDate ? ` al ${formatDate(cancelFlow.booking.endDate)}` : ''}
            </p>

            <div className="mb-cancel-warning">
              <p className="mb-cancel-warning-lead">
                <strong>Importante:</strong> esta cancelación <strong>no tiene reembolso</strong> de los
                importes ya pagados.
              </p>
              <p>
                Sí podés <strong>reagendar</strong> tu reserva para una nueva fecha dentro de los próximos
                <strong> 2 meses </strong>
                desde la fecha original. Para hacerlo, contactanos por WhatsApp o por correo y
                te ayudamos a coordinar la nueva fecha según la disponibilidad.
              </p>
              <p className="mb-cancel-warning-note">
                Al confirmar, tu reserva quedará cancelada y las fechas se liberarán para otros usuarios.
              </p>
            </div>

            <label className="mb-cancel-motivo-label" htmlFor="cancel-motivo">
              Motivo (opcional)
            </label>
            <textarea
              id="cancel-motivo"
              className="mb-cancel-motivo"
              rows={3}
              maxLength={500}
              placeholder="Contanos brevemente por qué cancelás (opcional)..."
              value={cancelFlow.motivo}
              onChange={e =>
                setCancelFlow(prev => (prev ? { ...prev, motivo: e.target.value } : prev))
              }
              disabled={cancelFlow.submitting}
            />

            {cancelFlow.error && <p className="mb-cancel-error">{cancelFlow.error}</p>}

            <div className="mb-modal-actions">
              <button
                type="button"
                className="mb-btn-cancel"
                onClick={() => setCancelFlow(null)}
                disabled={cancelFlow.submitting}
              >
                Volver
              </button>
              <button
                type="button"
                className="mb-btn-confirm-cancel"
                onClick={handleConfirmCancellation}
                disabled={cancelFlow.submitting}
              >
                {cancelFlow.submitting ? (
                  <>
                    <div className="mb-btn-spinner" />
                    Cancelando...
                  </>
                ) : (
                  'Confirmar cancelación'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBookings;
