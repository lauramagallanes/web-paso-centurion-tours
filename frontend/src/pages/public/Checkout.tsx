import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiService } from '../../services/apiService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useCart } from '../../contexts/CartContext';
import './Checkout.css';

interface CheckoutItem {
  type: 'sendero' | 'alojamiento';
  id: string;
  nombre: string;
  precio: number;
  fechaInicio?: string;
  fechaFin?: string;
  personas?: number;
  turno?: string;
  guiaId?: string;
  guiaNombre?: string;
  checkIn?: string;
  checkOut?: string;
  huespedes?: number;
  noches?: number;
}

interface ContactInfo {
  nombreContacto: string;
  emailContacto: string;
  telefonoContacto: string;
  observaciones: string;
}

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state: cartState, clearCart } = useCart();

  const [item, setItem] = useState<CheckoutItem | null>(null);
  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    nombreContacto: '',
    emailContacto: '',
    telefonoContacto: '',
    observaciones: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'review' | 'contact' | 'processing'>('review');

  useEffect(() => {
    // Check if item was passed via navigation state
    const navState = location.state as CheckoutItem | null;
    if (navState) {
      setItem(navState);
    } else if (cartState.items && cartState.items.length > 0) {
      // Use first cart item
      const cartItem = cartState.items[0];
      const dateStr = cartItem.date ? new Date(cartItem.date).toISOString().split('T')[0] : '';
      const checkInStr = cartItem.checkIn ? new Date(cartItem.checkIn).toISOString().split('T')[0] : dateStr;
      const checkOutStr = cartItem.checkOut ? new Date(cartItem.checkOut).toISOString().split('T')[0] : dateStr;

      setItem({
        type: cartItem.type === 'accommodation' ? 'alojamiento' : 'sendero',
        id: cartItem.id,
        nombre: cartItem.name,
        precio: cartItem.price,
        fechaInicio: dateStr,
        fechaFin: dateStr,
        personas: cartItem.participants || cartItem.guests || 1,
        turno: 'MANANA',
        checkIn: checkInStr,
        checkOut: checkOutStr,
        huespedes: cartItem.guests || cartItem.participants || 1,
      });
    }
  }, [location.state, cartState.items]);

  const handleContactChange = (field: keyof ContactInfo, value: string) => {
    setContactInfo(prev => ({ ...prev, [field]: value }));
  };

  const isContactValid = () => {
    return contactInfo.nombreContacto.trim() !== '' &&
           contactInfo.emailContacto.trim() !== '' &&
           /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactInfo.emailContacto);
  };

  const handleProceedToPayment = async () => {
    if (!item || !isContactValid()) return;

    setLoading(true);
    setError(null);
    setStep('processing');

    try {
      let reservaResponse: any;

      if (item.type === 'sendero') {
        // Create sendero reservation
        reservaResponse = await apiService.createSenderoReservation({
          tipoReserva: 'SENDERO',
          emailContacto: contactInfo.emailContacto,
          nombreContacto: contactInfo.nombreContacto,
          telefonoContacto: contactInfo.telefonoContacto,
          numeroPersonas: item.personas || 1,
          fechaInicio: item.fechaInicio || '',
          fechaFin: item.fechaFin || item.fechaInicio || '',
          senderoId: item.id,
          guiaId: item.guiaId || '',
          turno: item.turno || 'MANANA',
          observaciones: contactInfo.observaciones,
        });
      } else {
        // Create alojamiento reservation
        reservaResponse = await apiService.createAlojamientoReservation({
          emailContacto: contactInfo.emailContacto,
          nombreContacto: contactInfo.nombreContacto,
          telefonoContacto: contactInfo.telefonoContacto,
          alojamientoId: item.id,
          fechaCheckIn: item.checkIn || item.fechaInicio || '',
          fechaCheckOut: item.checkOut || item.fechaFin || '',
          numeroHuespedes: item.huespedes || item.personas || 1,
          observaciones: contactInfo.observaciones,
        });
      }

      const reservaData = reservaResponse?.data || reservaResponse;
      const reservaId = reservaData?.id;

      if (!reservaId) {
        throw new Error('No se pudo crear la reserva');
      }

      // Create PlacetoPay payment session
      const paymentResponse: any = await apiService.createPaymentSession(
        reservaId,
        item.type === 'sendero' ? 'SENDERO' : 'ALOJAMIENTO'
      );

      const paymentData = paymentResponse?.data || paymentResponse;

      if (paymentData?.processUrl) {
        // Clear cart and redirect to PlacetoPay
        clearCart();
        window.location.href = paymentData.processUrl;
      } else if (paymentData?.status === 'MOCK') {
        // PlacetoPay not configured - redirect to result page with mock
        clearCart();
        navigate(`/pago/resultado?reservaId=${reservaId}&tipo=${item.type === 'sendero' ? 'SENDERO' : 'ALOJAMIENTO'}&mock=true`);
      } else {
        throw new Error(paymentData?.message || 'Error al crear sesión de pago');
      }

    } catch (err: any) {
      console.error('Error in checkout:', err);
      setError(err.message || 'Error al procesar el pago. Por favor intenta nuevamente.');
      setStep('contact');
    } finally {
      setLoading(false);
    }
  };

  if (!item) {
    return (
      <div className="checkout-page">
        <div className="checkout-container">
          <div className="checkout-empty">
            <h2>No hay items para pagar</h2>
            <p>Selecciona un sendero o alojamiento para realizar una reserva.</p>
            <button className="btn-primary" onClick={() => navigate('/activities')}>
              Ver Senderos
            </button>
            <button className="btn-secondary" onClick={() => navigate('/alojamientos')}>
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
          <div className={`step ${step === 'review' ? 'active' : step !== 'review' ? 'completed' : ''}`}>
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
            <h2>Resumen de Reserva</h2>
            <div className="summary-card">
              <div className="summary-type">
                {item.type === 'sendero' ? 'Sendero / Actividad' : 'Alojamiento'}
              </div>
              <h3>{item.nombre}</h3>
              
              {item.type === 'sendero' ? (
                <div className="summary-details">
                  <div className="detail-row">
                    <span>Fecha:</span>
                    <span>{item.fechaInicio}</span>
                  </div>
                  <div className="detail-row">
                    <span>Turno:</span>
                    <span>{item.turno === 'MANANA' ? 'Mañana' : 'Tarde'}</span>
                  </div>
                  <div className="detail-row">
                    <span>Personas:</span>
                    <span>{item.personas}</span>
                  </div>
                  {item.guiaNombre && (
                    <div className="detail-row">
                      <span>Guía:</span>
                      <span>{item.guiaNombre}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="summary-details">
                  <div className="detail-row">
                    <span>Check-in:</span>
                    <span>{item.checkIn || item.fechaInicio}</span>
                  </div>
                  <div className="detail-row">
                    <span>Check-out:</span>
                    <span>{item.checkOut || item.fechaFin}</span>
                  </div>
                  <div className="detail-row">
                    <span>Huéspedes:</span>
                    <span>{item.huespedes || item.personas}</span>
                  </div>
                  {item.noches && (
                    <div className="detail-row">
                      <span>Noches:</span>
                      <span>{item.noches}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="summary-total">
                <span>Total:</span>
                <span className="total-price">USD ${item.precio?.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Contact Form or Processing */}
          <div className="checkout-form-section">
            {step === 'review' && (
              <div className="review-section">
                <h2>Revisa tu reserva</h2>
                <p>Verifica que los datos de tu reserva sean correctos antes de continuar.</p>
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
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="nombre">Nombre completo *</label>
                  <input
                    type="text"
                    id="nombre"
                    value={contactInfo.nombreContacto}
                    onChange={(e) => handleContactChange('nombreContacto', e.target.value)}
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
                    onChange={(e) => handleContactChange('emailContacto', e.target.value)}
                    placeholder="tu@email.com"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="telefono">Teléfono</label>
                  <input
                    type="tel"
                    id="telefono"
                    value={contactInfo.telefonoContacto}
                    onChange={(e) => handleContactChange('telefonoContacto', e.target.value)}
                    placeholder="+598 99 123 456"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="observaciones">Observaciones</label>
                  <textarea
                    id="observaciones"
                    value={contactInfo.observaciones}
                    onChange={(e) => handleContactChange('observaciones', e.target.value)}
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
                <p>Por favor espera mientras preparamos tu pago.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
