import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart, CartItem } from '../../contexts/CartContext';
import Button from './Button';
import EmptyState from './EmptyState';
import './ShoppingCart.css';

const formatCurrency = (amount: number, currency: string = 'UYU') =>
  new Intl.NumberFormat('es-UY', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(amount);

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat('es-UY', { year: 'numeric', month: 'long', day: 'numeric' }).format(
    new Date(iso + 'T12:00:00')
  );

const CartItemCard: React.FC<{ item: CartItem; onRemove: (id: string) => void }> = ({
  item,
  onRemove,
}) => (
  <div className="cart-item">
    <div className="cart-item-image">
      <img src={item.image} alt={item.name} />
      <span className={`cart-item-type ${item.type}`}>
        {item.type === 'alojamiento' ? '🏠' : '🥾'}
      </span>
    </div>

    <div className="cart-item-content">
      <div className="cart-item-header">
        <h4 className="cart-item-title">{item.name}</h4>
        <button
          className="cart-item-remove"
          onClick={() => onRemove(item.cartItemId)}
          aria-label="Quitar del carrito"
        >
          ✕
        </button>
      </div>

      <p className="cart-item-description">{item.description}</p>

      <div className="cart-item-details">
        {item.type === 'alojamiento' && (
          <>
            {item.checkIn && item.checkOut && (
              <div className="cart-item-dates">
                <span>📅 {formatDate(item.checkIn)} → {formatDate(item.checkOut)}</span>
              </div>
            )}
            {item.noches != null && (
              <div className="cart-item-nights">
                <span>🌙 {item.noches} noche{item.noches !== 1 ? 's' : ''}</span>
              </div>
            )}
            {item.huespedes != null && (
              <div className="cart-item-guests">
                <span>👥 {item.huespedes} huésped{item.huespedes !== 1 ? 'es' : ''}</span>
              </div>
            )}
          </>
        )}

        {item.type === 'sendero' && (
          <>
            {item.fecha && (
              <div className="cart-item-date">
                <span>📅 {formatDate(item.fecha)}</span>
              </div>
            )}
            {item.turno && (
              <div className="cart-item-turno">
                <span>
                  🕐{' '}
                  {item.turno === 'MANANA'
                    ? 'Turno mañana'
                    : item.turno === 'TARDE'
                    ? 'Turno tarde'
                    : item.turno}
                </span>
              </div>
            )}
            {item.personas != null && (
              <div className="cart-item-participants">
                <span>👥 {item.personas} persona{item.personas !== 1 ? 's' : ''}</span>
              </div>
            )}
            {item.duracion && (
              <div className="cart-item-duration">
                <span>⏱️ {item.duracion}</span>
              </div>
            )}
          </>
        )}
      </div>

      <div className="cart-item-footer">
        <div className="cart-item-price">
          <span className="item-price">{formatCurrency(item.price, item.currency)}</span>
        </div>
      </div>
    </div>
  </div>
);

const ShoppingCart: React.FC = () => {
  const navigate = useNavigate();
  const { state, removeItem, clearCart, closeCart } = useCart();

  // Pieza del item a confirmar para eliminar; null si no hay confirmación abierta.
  const [pendingRemove, setPendingRemove] = useState<CartItem | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  if (!state.isOpen) return null;

  const handleRequestRemove = (cartItemId: string) => {
    const item = state.items.find(i => i.cartItemId === cartItemId);
    if (item) setPendingRemove(item);
  };

  const handleConfirmRemove = () => {
    if (pendingRemove) {
      void removeItem(pendingRemove.cartItemId);
      setPendingRemove(null);
    }
  };

  const handleConfirmClear = () => {
    void clearCart();
    setConfirmClear(false);
  };

  const hasAlojamiento = state.items.some(i => i.type === 'alojamiento');

  return (
    <>
      <div className="cart-overlay" onClick={closeCart} />

      <div className="shopping-cart">
        <div className="cart-header">
          <h3 className="cart-title">
            <i className="bi bi-cart3" aria-hidden="true"></i> Mi Carrito
            {state.itemCount > 0 && (
              <span className="cart-count">({state.itemCount})</span>
            )}
          </h3>
          <button className="cart-close" onClick={closeCart} aria-label="Cerrar carrito">
            ✕
          </button>
        </div>

        <div className="cart-body">
          {state.items.length === 0 ? (
            <EmptyState
              illustration="empty-cart"
              title="Tu carrito está vacío"
              description="Agrega alojamientos y actividades para comenzar tu aventura en Tinambú."
              primaryAction={{
                label: 'Continuar Explorando',
                onClick: closeCart,
                variant: 'primary',
              }}
              className="cart-empty-state"
            />
          ) : (
            <>
              <div className="cart-items">
                {state.items.map(item => (
                  <CartItemCard key={item.cartItemId} item={item} onRemove={handleRequestRemove} />
                ))}
              </div>

              <div className="cart-summary">
                <div className="cart-total">
                  <div className="total-label">Total:</div>
                  <div className="total-amount">{formatCurrency(state.total)}</div>
                </div>

                <div className="cart-actions">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmClear(true)}
                    className="clear-cart"
                  >
                    Vaciar carrito
                  </Button>
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={() => {
                      closeCart();
                      navigate('/checkout');
                    }}
                    className="checkout-btn"
                    leftIcon="💳"
                  >
                    Proceder al pago
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Confirmación: eliminar un ítem */}
      {pendingRemove && (
        <div
          className="cart-confirm-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cart-confirm-remove-title"
          onClick={() => setPendingRemove(null)}
        >
          <div className="cart-confirm-modal" onClick={e => e.stopPropagation()}>
            <h3 id="cart-confirm-remove-title" className="cart-confirm-title">
              ¿Eliminar este ítem del carrito?
            </h3>
            <p className="cart-confirm-text">
              <strong>{pendingRemove.name}</strong>
              {pendingRemove.type === 'alojamiento' ? (
                <>
                  {' '}— Si lo quitas, se liberarán las fechas reservadas temporalmente y otras
                  personas podrán reservarlas.
                </>
              ) : (
                <> — Quitarás esta actividad de tu reserva.</>
              )}
            </p>
            <div className="cart-confirm-actions">
              <Button variant="ghost" size="md" onClick={() => setPendingRemove(null)}>
                Cancelar
              </Button>
              <Button variant="primary" size="md" onClick={handleConfirmRemove}>
                Sí, eliminar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmación: vaciar todo el carrito */}
      {confirmClear && (
        <div
          className="cart-confirm-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cart-confirm-clear-title"
          onClick={() => setConfirmClear(false)}
        >
          <div className="cart-confirm-modal" onClick={e => e.stopPropagation()}>
            <h3 id="cart-confirm-clear-title" className="cart-confirm-title">
              ¿Vaciar el carrito?
            </h3>
            <p className="cart-confirm-text">
              Vas a quitar todos los ítems del carrito.
              {hasAlojamiento && (
                <>
                  {' '}Las fechas de los alojamientos reservados temporalmente se liberarán para
                  que otras personas puedan reservarlas.
                </>
              )}
            </p>
            <div className="cart-confirm-actions">
              <Button variant="ghost" size="md" onClick={() => setConfirmClear(false)}>
                Cancelar
              </Button>
              <Button variant="primary" size="md" onClick={handleConfirmClear}>
                Sí, vaciar carrito
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ShoppingCart;
