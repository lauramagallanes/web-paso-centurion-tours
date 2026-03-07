import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/apiService';
import { useAuth } from '../../contexts/AuthContext';
import { useCart, CartItem } from '../../contexts/CartContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import './Checkout.css';

interface ContactInfo {
  nombreContacto: string;
  emailContacto: string;
  telefonoContacto: string;
  observaciones: string;
}

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

const CartItemSummary: React.FC<{ item: CartItem; currency: string }> = ({ item, currency }) => (
  <div className="summary-item">
    <div className="summary-item-header">
      <div className="summary-item-type-badge">
        {item.type === 'alojamiento' ? '🏠 Alojamiento' : '🥾 Sendero'}
      </div>
      <span className="summary-item-subtotal">{formatCurrency(item.price, currency)}</span>
    </div>
    <h4 className="summary-item-name">{item.name}</h4>
    <div className="summary-item-details">
      {item.type === 'alojamiento' ? (
        <>
          {item.checkIn && item.checkOut && (
            <span>📅 {formatDate(item.checkIn)} → {formatDate(item.checkOut)}</span>
          )}
          {item.noches != null && <span>🌙 {item.noches} noche{item.noches !== 1 ? 's' : ''}</span>}
          {item.huespedes != null && <span>👥 {item.huespedes} huésped{item.huespedes !== 1 ? 'es' : ''}</span>}
        </>
      ) : (
        <>
          {item.fecha && <span>📅 {formatDate(item.fecha)}</span>}
          {item.turno && (
            <span>
              🕐 {item.turno === 'MANANA' ? 'Mañana' : item.turno === 'TARDE' ? 'Tarde' : item.turno}
            </span>
          )}
          {item.personas != null && <span>👥 {item.personas} persona{item.personas !== 1 ? 's' : ''}</span>}
        </>
      )}
    </div>
  </div>
);

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const { state: cartState, clearCart } = useCart();
  const { state: authState } = useAuth();

  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    nombreContacto: authState.user?.nombreCompleto || '',
    emailContacto: authState.user?.email || '',
    telefonoContacto: '',
    observaciones: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'review' | 'contact' | 'processing'>('review');
  const [tipoPago, setTipoPago] = useState<'TOTAL' | 'SENA'>('TOTAL');
  const [alternativasSendero, setAlternativasSendero] = useState<Array<{ id: string; nombre: string }>>([]);

  const items = cartState.items;
  const totalBruto = items.reduce((sum, i) => sum + i.price, 0);
  const montoAPagar = tipoPago === 'SENA' ? totalBruto * 0.3 : totalBruto;
  const currency = items[0]?.currency || 'UYU';

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
    setStep('processing');

    try {
      const payload = {
        emailContacto: contactInfo.emailContacto,
        nombreContacto: contactInfo.nombreContacto,
        telefonoContacto: contactInfo.telefonoContacto || undefined,
        observaciones: contactInfo.observaciones || undefined,
        tipoPago,
        items: items.map(itemToOrdenItem),
      };

      const response: any = await apiService.createOrdenCheckout(payload);
      const data = response?.data || response;

      if (data?.processUrl) {
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

  if (items.length === 0) {
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
                <CartItemSummary key={item.cartItemId} item={item} currency={currency} />
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
                  <label htmlFor="observaciones">Observaciones</label>
                  <textarea
                    id="observaciones"
                    value={contactInfo.observaciones}
                    onChange={e => handleContactChange('observaciones', e.target.value)}
                    placeholder="Comentarios adicionales para tu reserva..."
                    rows={3}
                  />
                </div>

                <button
                  className="btn-primary btn-full btn-pay"
                  onClick={handleProceedToPayment}
                  disabled={!isContactValid() || loading}
                >
                  {loading ? 'Procesando...' : 'Pagar con PlacetoPay'}
                </button>

                <p className="checkout-secure">
                  Serás redirigido a PlacetoPay para completar el pago de forma segura.
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
    </div>
  );
};

export default Checkout;
