import React from 'react';
import { useCart } from '../../contexts/CartContext';
import './CartButton.css';

const CartButton: React.FC = () => {
  const { state, toggleCart } = useCart();

  return (
    <button 
      className="cart-button"
      onClick={toggleCart}
      aria-label={`Carrito de compras (${state.itemCount} elementos)`}
      title="Ver carrito"
    >
      <div className="cart-icon">
        🛒
        {state.itemCount > 0 && (
          <span className="cart-badge">
            {state.itemCount > 99 ? '99+' : state.itemCount}
          </span>
        )}
      </div>
      <span className="cart-text">Carrito</span>
    </button>
  );
};

export default CartButton;

