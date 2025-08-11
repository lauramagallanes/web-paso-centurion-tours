import React from 'react';
import { useCart, CartItem } from '../../contexts/CartContext';
import Button from './Button';
import EmptyState from './EmptyState';
import './ShoppingCart.css';

const ShoppingCart: React.FC = () => {
  const { state, removeItem, updateQuantity, clearCart, closeCart } = useCart();

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-UY', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  const formatCurrency = (amount: number, currency: string = 'UYU') => {
    return new Intl.NumberFormat('es-UY', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handleQuantityChange = (id: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(id);
    } else {
      updateQuantity(id, newQuantity);
    }
  };

  const CartItemComponent: React.FC<{ item: CartItem }> = ({ item }) => (
    <div className="cart-item">
      <div className="cart-item-image">
        <img src={item.image} alt={item.name} />
        <span className={`cart-item-type ${item.type}`}>
          {item.type === 'accommodation' ? '🏠' : '🏃'}
        </span>
      </div>
      
      <div className="cart-item-content">
        <div className="cart-item-header">
          <h4 className="cart-item-title">{item.name}</h4>
          <button 
            className="cart-item-remove"
            onClick={() => removeItem(item.id)}
            aria-label="Eliminar del carrito"
          >
            ✕
          </button>
        </div>
        
        <p className="cart-item-description">{item.description}</p>
        
        <div className="cart-item-details">
          {item.type === 'accommodation' && (
            <>
              {item.checkIn && item.checkOut && (
                <div className="cart-item-dates">
                  <span>📅 {formatDate(item.checkIn)} - {formatDate(item.checkOut)}</span>
                </div>
              )}
              {item.guests && (
                <div className="cart-item-guests">
                  <span>👥 {item.guests} huésped{item.guests > 1 ? 'es' : ''}</span>
                </div>
              )}
            </>
          )}
          
          {item.type === 'activity' && (
            <>
              {item.date && (
                <div className="cart-item-date">
                  <span>📅 {formatDate(item.date)}</span>
                </div>
              )}
              {item.participants && (
                <div className="cart-item-participants">
                  <span>👥 {item.participants} participante{item.participants > 1 ? 's' : ''}</span>
                </div>
              )}
              {item.duration && (
                <div className="cart-item-duration">
                  <span>⏱️ {item.duration}</span>
                </div>
              )}
            </>
          )}
        </div>
        
        <div className="cart-item-footer">
          <div className="cart-item-quantity">
            <button 
              className="quantity-btn"
              onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
            >
              -
            </button>
            <span className="quantity-value">{item.quantity}</span>
            <button 
              className="quantity-btn"
              onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
            >
              +
            </button>
          </div>
          
          <div className="cart-item-price">
            <span className="item-price">
              {formatCurrency(item.price * item.quantity, item.currency)}
            </span>
            {item.quantity > 1 && (
              <span className="item-unit-price">
                {formatCurrency(item.price, item.currency)} c/u
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (!state.isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div className="cart-overlay" onClick={closeCart} />
      
      {/* Cart Panel */}
      <div className="shopping-cart">
        <div className="cart-header">
          <h3 className="cart-title">
            🛒 Mi Carrito
            {state.itemCount > 0 && (
              <span className="cart-count">({state.itemCount})</span>
            )}
          </h3>
          <button 
            className="cart-close"
            onClick={closeCart}
            aria-label="Cerrar carrito"
          >
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
                label: "Continuar Explorando",
                onClick: closeCart,
                variant: "primary"
              }}
              className="cart-empty-state"
            />
          ) : (
            <>
              <div className="cart-items">
                {state.items.map((item) => (
                  <CartItemComponent key={item.id} item={item} />
                ))}
              </div>
              
              <div className="cart-summary">
                <div className="cart-total">
                  <div className="total-label">Total:</div>
                  <div className="total-amount">
                    {formatCurrency(state.total)}
                  </div>
                </div>
                
                <div className="cart-actions">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={clearCart}
                    className="clear-cart"
                  >
                    Vaciar Carrito
                  </Button>
                  <Button 
                    variant="primary" 
                    size="lg"
                    onClick={() => {
                      // TODO: Navigate to checkout
                      console.log('Proceeding to checkout...');
                    }}
                    className="checkout-btn"
                    leftIcon="💳"
                  >
                    Proceder al Pago
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default ShoppingCart;
