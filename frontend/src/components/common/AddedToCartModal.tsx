import React from 'react';
import { useCart } from '../../contexts/CartContext';
import './AddedToCartModal.css';

interface AddedToCartModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemName: string;
  itemType: 'alojamiento' | 'sendero';
}

const AddedToCartModal: React.FC<AddedToCartModalProps> = ({
  isOpen,
  onClose,
  itemName,
  itemType,
}) => {
  const { state, openCart } = useCart();

  if (!isOpen) return null;

  const typeLabel = itemType === 'sendero' ? 'sendero' : 'alojamiento';
  const cartCount = state.itemCount;

  const handleGoToCart = () => {
    onClose();
    openCart();
  };

  const handleContinueShopping = () => {
    onClose();
  };

  return (
    <div className="added-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="added-modal-title">
      <div className="added-modal-card">
        <div className="added-modal-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="12" fill="var(--color-primary)" opacity="0.12" />
            <path d="M7 12.5l3.5 3.5 6.5-7" stroke="var(--color-primary)" strokeWidth="2.2"
                  strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <div className="added-modal-content">
          <h2 className="added-modal-title" id="added-modal-title">
            Reserva agregada al carrito
          </h2>
          <p className="added-modal-subtitle">
            <strong>{itemName}</strong> ({typeLabel}) fue agregado correctamente.
          </p>
          {cartCount > 1 && (
            <p className="added-modal-count">
              Tenés <strong>{cartCount}</strong> ítem{cartCount !== 1 ? 's' : ''} en el carrito.
            </p>
          )}
        </div>

        <div className="added-modal-actions">
          <button
            type="button"
            className="btn btn-outline-secondary added-modal-btn-continue"
            onClick={handleContinueShopping}
          >
            Seguir agregando
          </button>
          <button
            type="button"
            className="btn btn-primary added-modal-btn-cart"
            onClick={handleGoToCart}
          >
            Ir al carrito
            {cartCount > 0 && (
              <span className="added-modal-badge">{cartCount}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddedToCartModal;
