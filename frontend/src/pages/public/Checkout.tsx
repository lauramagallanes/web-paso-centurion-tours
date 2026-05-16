import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/apiService';
import { useAuth } from '../../contexts/AuthContext';
import { useCart, CartItem } from '../../contexts/CartContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Icon from '../../components/common/Icon';
import { PREX_ACCOUNT, PREX_COUNTRIES } from '../../config/prex';
import './Checkout.css';

interface ContactInfo {
  nombreContacto: string;
  emailContacto: string;
  telefonoContacto: string;
  observaciones: string;
  pais: string; // ISO 3166-1 alpha-2
}

const COUNTRIES: Array<{ code: string; name: string }> = [
  { code: 'UY', name: 'Uruguay' },
  { code: 'AR', name: 'Argentina' },
  { code: 'BR', name: 'Brasil' },
  { code: 'CL', name: 'Chile' },
  { code: 'PE', name: 'Perú' },
  { code: 'PY', name: 'Paraguay' },
  { code: 'BO', name: 'Bolivia' },
  { code: 'CO', name: 'Colombia' },
  { code: 'EC', name: 'Ecuador' },
  { code: 'MX', name: 'México' },
  { code: 'ES', name: 'España' },
  { code: 'US', name: 'Estados Unidos' },
  { code: 'OTHER', name: 'Otro' },
];

type MetodoPago = 'CARD' | 'PREX';

const formatCurrency = (amount: number, currency = 'UYU') =>
  new Intl.NumberFormat('es-UY', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(amount);

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat('es-UY', { year: 'numeric', month: 'short', day: 'numeric' }).format(
    new Date(iso + 'T12:00:00')
  );

const itemToOrdenItem = (item: CartItem) => {
  if (item.type === 'sendero') {
    return {
      tipo: 'SENDERO',
      productoId: item.id,
      fechaInicio: item.fecha,
      fechaFin: item.fecha,
      turno: item.turno,
      numeroPersonas: item.personas,
    };
  } else {
    return {
      tipo: 'ALOJAMIENTO',
      productoId: item.id,
      fechaCheckIn: item.checkIn,
      fechaCheckOut: item.checkOut,
      numeroHuespedes: item.huespedes,
    };
  }
};

interface CartItemSummaryProps {
  item: CartItem;
  currency: string;
  onEdit: (item: CartItem) => void;
  onRemove: (item: CartItem) => void;
  disabled?: boolean;
}

const CartItemSummary: React.FC<CartItemSummaryProps> = ({
  item,
  currency,
  onEdit,
  onRemove,
  disabled,
}) => (
  <div className="summary-item">
    <div className="summary-item-header">
      <div className="summary-item-type-badge">
        <Icon
          name={item.type === 'alojamiento' ? 'bed' : 'hiking'}
          size="sm"
          className="summary-item-type-icon"
        />
        <span>{item.type === 'alojamiento' ? 'Alojamiento' : 'Sendero'}</span>
      </div>
      <span className="summary-item-subtotal">{formatCurrency(item.price, currency)}</span>
    </div>
    <h4 className="summary-item-name">{item.name}</h4>
    <div className="summary-item-details">
      {item.type === 'alojamiento' ? (
        <>
          {item.checkIn && item.checkOut && (
            <span>
              <Icon name="calendar" size="xs" /> {formatDate(item.checkIn)} → {formatDate(item.checkOut)}
            </span>
          )}
          {item.noches != null && (
            <span>
              <Icon name="moon" size="xs" /> {item.noches} noche{item.noches !== 1 ? 's' : ''}
            </span>
          )}
          {item.huespedes != null && (
            <span>
              <Icon name="user" size="xs" /> {item.huespedes} huésped{item.huespedes !== 1 ? 'es' : ''}
            </span>
          )}
        </>
      ) : (
        <>
          {item.fecha && (
            <span>
              <Icon name="calendar" size="xs" /> {formatDate(item.fecha)}
            </span>
          )}
          {item.turno && (
            <span>
              <Icon name="clock" size="xs" />{' '}
              {item.turno === 'MANANA' ? 'Mañana' : item.turno === 'TARDE' ? 'Tarde' : item.turno}
            </span>
          )}
          {item.personas != null && (
            <span>
              <Icon name="user" size="xs" /> {item.personas} persona{item.personas !== 1 ? 's' : ''}
            </span>
          )}
        </>
      )}
    </div>
    <div className="summary-item-actions">
      <button
        type="button"
        className="summary-item-action summary-item-action-edit"
        onClick={() => onEdit(item)}
        disabled={disabled}
        title="Editar este ítem"
      >
        <Icon name="edit" size="xs" /> Editar
      </button>
      <button
        type="button"
        className="summary-item-action summary-item-action-remove"
        onClick={() => onRemove(item)}
        disabled={disabled}
        title="Quitar este ítem del carrito"
      >
        <Icon name="trash" size="xs" /> Quitar
      </button>
    </div>
  </div>
);

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const { state: cartState, clearCart, removeItem } = useCart();
  const { state: authState } = useAuth();

  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    nombreContacto: authState.user?.nombreCompleto || '',
    emailContacto: authState.user?.email || '',
    telefonoContacto: '',
    observaciones: '',
    pais: 'UY',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'review' | 'contact' | 'processing' | 'prex'>('review');
  const [tipoPago, setTipoPago] = useState<'TOTAL' | 'SENA'>('TOTAL');
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('CARD');
  const [alternativasSendero, setAlternativasSendero] = useState<Array<{ id: string; nombre: string }>>([]);
  const [removeConfirmItem, setRemoveConfirmItem] = useState<CartItem | null>(null);
  const [prexResult, setPrexResult] = useState<{
    codigoOrden: string;
    monto: number;
    currency: string;
  } | null>(null);

  const items = cartState.items;
  const totalBruto = items.reduce((sum, i) => sum + i.price, 0);
  const montoAPagar = tipoPago === 'SENA' ? totalBruto * 0.3 : totalBruto;
  const currency = items[0]?.currency || 'UYU';

  const prexAvailable = PREX_COUNTRIES.includes(contactInfo.pais as any);
  // Si el usuario cambia a un país sin Prex y tenía Prex seleccionado, lo volvemos a CARD.
  useEffect(() => {
    if (!prexAvailable && metodoPago === 'PREX') {
      setMetodoPago('CARD');
    }
  }, [prexAvailable, metodoPago]);

  const handleEditItem = (item: CartItem) => {
    const path = item.type === 'sendero' ? `/actividades/${item.id}` : `/alojamientos/${item.id}`;
    navigate(path);
  };

  const handleRequestRemove = (item: CartItem) => {
    setRemoveConfirmItem(item);
  };

  const handleConfirmRemove = () => {
    if (removeConfirmItem) {
      removeItem(removeConfirmItem.cartItemId);
      setRemoveConfirmItem(null);
    }
  };

  const handleCancelRemove = () => setRemoveConfirmItem(null);

  useEffect(() => {
    if (authState.user?.nombreCompleto && !contactInfo.nombreContacto) {
      setContactInfo(prev => ({ ...prev, nombreContacto: authState.user!.nombreCompleto }));
    }
    if (authState.user?.email && !contactInfo.emailContacto) {
      setContactInfo(prev => ({ ...prev, emailContacto: authState.user!.email }));
    }
  }, [authState.user]);

  const handleContactChange = (field: keyof ContactInfo, value: string) => {
    setContactInfo(prev => ({ ...prev, [field]: value }));
  };

  const isContactValid = () =>
    contactInfo.nombreContacto.trim() !== '' &&
    contactInfo.emailContacto.trim() !== '' &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactInfo.emailContacto);

  const handleProceedToPayment = async () => {
    if (items.length === 0 || !isContactValid()) return;

    setLoading(true);
    setError(null);
    setAlternativasSendero([]);
    setStep('processing');

    try {
      // Pre-validar disponibilidad de cada sendero del carrito (cupos + guía libre)
      const senderoItems = items.filter(it => it.type === 'sendero' && it.fecha && it.turno);
      const preChecks = await Promise.all(
        senderoItems.map(it =>
          apiService
            .checkSenderoDisponibilidad(it.id, it.fecha!, it.turno as 'MANANA' | 'TARDE')
            .then(res => ({ item: it, res }))
            .catch(() => null),
        ),
      );
      const noDisponible = preChecks.find(c => c && c.res?.data && !c.res.data.disponible);
      if (noDisponible) {
        const d = noDisponible.res.data;
        const motivo = !d.hayGuiaDisponible
          ? 'no hay guía disponible para esa fecha y turno'
          : d.cuposRestantes <= 0
            ? 'no quedan cupos para esa fecha y turno'
            : 'no está disponible';
        setError(
          `${noDisponible.item.name} ${motivo}. Cambiá la fecha o el turno antes de continuar.`,
        );
        if (Array.isArray(d.alternativas) && d.alternativas.length > 0) {
          setAlternativasSendero(d.alternativas);
        }
        setStep('contact');
        setLoading(false);
        return;
      }

      const payload = {
        emailContacto: contactInfo.emailContacto,
        nombreContacto: contactInfo.nombreContacto,
        telefonoContacto: contactInfo.telefonoContacto || undefined,
        observaciones: contactInfo.observaciones || undefined,
        tipoPago,
        metodoPago,
        paisComprador: contactInfo.pais,
        items: items.map(itemToOrdenItem),
      };

      const response: any = await apiService.createOrdenCheckout(payload);
      const data = response?.data || response;

      if (metodoPago === 'PREX' && data?.status === 'PENDIENTE_TRANSFERENCIA') {
        // Mostramos pantalla con instrucciones de transferencia y limpiamos carrito.
        setPrexResult({
          codigoOrden: data.codigoOrden || '',
          monto: Number(data.montoTotal) || montoAPagar,
          currency,
        });
        clearCart();
        setStep('prex');
      } else if (data?.processUrl) {
        clearCart();
        window.location.href = data.processUrl;
      } else if (data?.status === 'MOCK') {
        clearCart();
        navigate(
          `/pago/resultado?ordenId=${data.ordenId}&mock=true`
        );
      } else {
        throw new Error(data?.message || 'Error al crear la sesión de pago.');
      }
    } catch (err: any) {
      const alts = err.responseData?.alternativas;
      if (Array.isArray(alts) && alts.length > 0) {
        setAlternativasSendero(alts);
      } else {
        setAlternativasSendero([]);
      }
      setError(err.message || 'Error al procesar el pago. Por favor intentá nuevamente.');
      setStep('contact');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0 && step !== 'prex') {
    return (
      <div className="checkout-page">
        <div className="checkout-container">
          <div className="checkout-empty">
            <h2>Tu carrito está vacío</h2>
            <p>Agregá senderos o alojamientos para realizar una reserva.</p>
            <button className="btn btn-primary me-2" onClick={() => navigate('/actividades')}>
              Ver Senderos
            </button>
            <button className="btn btn-outline-secondary" onClick={() => navigate('/alojamientos')}>
              Ver Alojamientos
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Pantalla post-pago Prex: instrucciones de transferencia.
  if (step === 'prex' && prexResult) {
    return (
      <div className="checkout-page">
        <div className="checkout-container">
          <div className="prex-result">
            <div className="prex-result-icon"><Icon name="check-circle" size="xl" color="success" /></div>
            <h1 className="prex-result-title">¡Generamos tu orden!</h1>
            <p className="prex-result-subtitle">
              Para confirmar tu reserva, transferí el monto exacto a la cuenta Prex que figura abajo.
              Te confirmaremos por email apenas recibamos el pago.
            </p>

            <div className="prex-summary-card">
              <div className="prex-summary-row">
                <span>Código de orden:</span>
                <strong>{prexResult.codigoOrden || '—'}</strong>
              </div>
              <div className="prex-summary-row prex-summary-total">
                <span>Monto a transferir:</span>
                <strong>{formatCurrency(prexResult.monto, prexResult.currency)}</strong>
              </div>
            </div>

            <div className="prex-account-card">
              <h3>Datos de la cuenta Prex</h3>
              <ul>
                <li><span>Titular:</span><strong>{PREX_ACCOUNT.titular}</strong></li>
                <li><span>Alias:</span><strong>{PREX_ACCOUNT.alias}</strong></li>
                <li><span>Número de cuenta:</span><strong>{PREX_ACCOUNT.cuenta}</strong></li>
                <li><span>Documento:</span><strong>{PREX_ACCOUNT.documento}</strong></li>
                <li><span>Teléfono:</span><strong>{PREX_ACCOUNT.telefono}</strong></li>
                <li><span>Email para notificar transferencia:</span><strong>{PREX_ACCOUNT.email}</strong></li>
              </ul>
              <p className="prex-account-note">
                Importante: en el concepto/referencia indicá el <strong>código de orden</strong> para
                que podamos identificar tu pago rápido. Si necesitás soporte, escribinos al email de
                contacto y mostrá el comprobante.
              </p>
            </div>

            <div className="prex-actions">
              <button className="btn-primary" onClick={() => navigate('/mis-reservas')}>
                Ver mis reservas
              </button>
              <button className="btn-secondary" onClick={() => navigate('/')}>
                Volver al inicio
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        <h1 className="checkout-title">Checkout</h1>

        {/* Progress Steps */}
        <div className="checkout-steps">
          <div className={`step ${step === 'review' ? 'active' : 'completed'}`}>
            <span className="step-number">1</span>
            <span className="step-label">Revisar</span>
          </div>
          <div className="step-divider" />
          <div className={`step ${step === 'contact' ? 'active' : step === 'processing' ? 'completed' : ''}`}>
            <span className="step-number">2</span>
            <span className="step-label">Contacto</span>
          </div>
          <div className="step-divider" />
          <div className={`step ${step === 'processing' ? 'active' : ''}`}>
            <span className="step-number">3</span>
            <span className="step-label">Pago</span>
          </div>
        </div>

        <div className="checkout-content">
          {/* Order Summary */}
          <div className="checkout-summary">
            <h2>Estos son los servicios que estás por pagar</h2>

            <div className="summary-card">
              {items.map(item => (
                <CartItemSummary
                  key={item.cartItemId}
                  item={item}
                  currency={currency}
                  onEdit={handleEditItem}
                  onRemove={handleRequestRemove}
                  disabled={loading || step === 'processing'}
                />
              ))}

              <div className="summary-divider" />

              <div className="summary-subtotal-row">
                <span>Subtotal ({items.length} ítem{items.length !== 1 ? 's' : ''}):</span>
                <span>{formatCurrency(totalBruto, currency)}</span>
              </div>

              {/* Payment type selector */}
              <div className="payment-type-selector">
                <p className="payment-type-title">Forma de pago:</p>

                <div className={`payment-type-option ${tipoPago === 'TOTAL' ? 'payment-option-selected' : ''}`}>
                  <label>
                    <input
                      type="radio"
                      name="tipoPago"
                      value="TOTAL"
                      checked={tipoPago === 'TOTAL'}
                      onChange={() => setTipoPago('TOTAL')}
                    />
                    <strong>Pago total</strong>
                    <span className="payment-option-amount">{formatCurrency(totalBruto, currency)}</span>
                  </label>
                </div>

                <div className={`payment-type-option sena-highlight ${tipoPago === 'SENA' ? 'payment-option-selected' : ''}`}>
                  <label>
                    <input
                      type="radio"
                      name="tipoPago"
                      value="SENA"
                      checked={tipoPago === 'SENA'}
                      onChange={() => setTipoPago('SENA')}
                    />
                    <strong>Reserva (30%)</strong>
                    <span className="payment-option-amount">{formatCurrency(totalBruto * 0.3, currency)}</span>
                  </label>
                  <p>
                    Saldo restante: {formatCurrency(totalBruto * 0.7, currency)} a pagar antes de tu reserva.
                  </p>
                </div>

                <div className={`payment-amount-summary ${tipoPago === 'SENA' ? 'is-sena' : 'is-total'}`}>
                  <span>Monto a pagar ahora:</span>
                  <div className="payment-amount-value">{formatCurrency(montoAPagar, currency)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right panel */}
          <div className="checkout-form-section">
            {step === 'review' && (
              <div className="review-section">
                <h2>Revisá tu reserva</h2>
                <p>Verificá que los datos sean correctos antes de continuar.</p>
                <button className="btn-primary btn-full" onClick={() => setStep('contact')}>
                  Continuar
                </button>
              </div>
            )}

            {step === 'contact' && (
              <div className="contact-section">
                <h2>Datos de Contacto</h2>

                {error && (
                  <div className="checkout-error">
                    <p>{error}</p>
                    {alternativasSendero.length > 0 && (
                      <div className="checkout-alternatives">
                        <p className="alternatives-title">Podés reservar en cambio:</p>
                        {alternativasSendero.map(alt => (
                          <button
                            key={alt.id}
                            className="alternative-link"
                            onClick={() => navigate(`/actividades/${alt.id}`)}
                          >
                            → {alt.nombre}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="nombre">Nombre completo *</label>
                  <input
                    type="text"
                    id="nombre"
                    value={contactInfo.nombreContacto}
                    onChange={e => handleContactChange('nombreContacto', e.target.value)}
                    placeholder="Tu nombre completo"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email *</label>
                  <input
                    type="email"
                    id="email"
                    value={contactInfo.emailContacto}
                    readOnly={!!authState.user?.email}
                    onChange={e => handleContactChange('emailContacto', e.target.value)}
                    placeholder="tu@email.com"
                    required
                    className={authState.user?.email ? 'input-readonly' : ''}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="telefono">Teléfono</label>
                  <input
                    type="tel"
                    id="telefono"
                    value={contactInfo.telefonoContacto}
                    onChange={e => handleContactChange('telefonoContacto', e.target.value)}
                    placeholder="+598 99 123 456"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="pais">País *</label>
                  <select
                    id="pais"
                    value={contactInfo.pais}
                    onChange={e => handleContactChange('pais', e.target.value)}
                    required
                  >
                    {COUNTRIES.map(c => (
                      <option key={c.code} value={c.code}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="observaciones">Observaciones</label>
                  <textarea
                    id="observaciones"
                    value={contactInfo.observaciones}
                    onChange={e => handleContactChange('observaciones', e.target.value)}
                    placeholder="Comentarios adicionales para tu reserva..."
                    rows={3}
                  />
                </div>

                <div className="payment-method-section">
                  <p className="payment-method-title">Método de pago</p>

                  <label
                    className={`payment-method-option ${metodoPago === 'CARD' ? 'payment-method-selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name="metodoPago"
                      value="CARD"
                      checked={metodoPago === 'CARD'}
                      onChange={() => setMetodoPago('CARD')}
                    />
                    <div className="payment-method-text">
                      <strong>Tarjeta de crédito o débito</strong>
                      <small>Pago seguro procesado por Getnet. Aceptamos Visa, Mastercard y más.</small>
                    </div>
                  </label>

                  {prexAvailable && (
                    <label
                      className={`payment-method-option ${metodoPago === 'PREX' ? 'payment-method-selected' : ''}`}
                    >
                      <input
                        type="radio"
                        name="metodoPago"
                        value="PREX"
                        checked={metodoPago === 'PREX'}
                        onChange={() => setMetodoPago('PREX')}
                      />
                      <div className="payment-method-text">
                        <strong>Transferencia a cuenta Prex</strong>
                        <small>
                          Disponible para Uruguay, Argentina, Chile y Perú. Te mostraremos los datos de
                          cuenta al confirmar.
                        </small>
                      </div>
                    </label>
                  )}
                </div>

                <button
                  className="btn-primary btn-full btn-pay"
                  onClick={handleProceedToPayment}
                  disabled={!isContactValid() || loading}
                >
                  {loading
                    ? 'Procesando...'
                    : metodoPago === 'PREX'
                      ? 'Generar orden y ver datos de transferencia'
                      : 'Pago seguro con tarjeta de crédito o débito'}
                </button>

                <p className="checkout-secure">
                  {metodoPago === 'PREX'
                    ? 'Te mostraremos los datos de la cuenta Prex para completar la transferencia. Tu reserva se confirma cuando recibimos el pago.'
                    : 'Tu pago se procesa de forma segura a través de Getnet (PlacetoPay). No guardamos los datos de tu tarjeta.'}
                </p>
              </div>
            )}

            {step === 'processing' && (
              <div className="processing-section">
                <LoadingSpinner />
                <h2>Procesando tu reserva...</h2>
                <p>Por favor esperá mientras preparamos tu pago.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {removeConfirmItem && (
        <div className="checkout-confirm-overlay" onClick={handleCancelRemove}>
          <div className="checkout-confirm-modal" onClick={e => e.stopPropagation()}>
            <div className="checkout-confirm-icon">
              <Icon name="alert-triangle" size="xl" color="warning" />
            </div>
            <h3 className="checkout-confirm-title">¿Quitar este ítem del carrito?</h3>
            <p className="checkout-confirm-text">
              Vas a quitar <strong>{removeConfirmItem.name}</strong> del checkout.
              Podés volver a agregarlo desde su página si te arrepentís.
            </p>
            <div className="checkout-confirm-actions">
              <button className="btn-secondary" onClick={handleCancelRemove}>
                Cancelar
              </button>
              <button className="btn-danger" onClick={handleConfirmRemove}>
                Sí, quitar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;
