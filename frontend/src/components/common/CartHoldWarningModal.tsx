import React, { useState } from 'react';
import './AddedToCartModal.css';

interface CartHoldWarningModalProps {
  isOpen: boolean;
  roomName: string;
  horasRetencion: number;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}

const CartHoldWarningModal: React.FC<CartHoldWarningModalProps> = ({
  isOpen,
  roomName,
  horasRetencion,
  onCancel,
  onConfirm,
}) => {
  const [busy, setBusy] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="added-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="cart-hold-title">
      <div className="added-modal-card" style={{ maxWidth: 460 }}>
        <div className="added-modal-content">
          <h2 className="added-modal-title" id="cart-hold-title">
            Retención temporal de fechas
          </h2>
          <p className="added-modal-subtitle" style={{ textAlign: 'left' }}>
            Al agregar <strong>{roomName}</strong> al carrito, las fechas elegidas quedarán{' '}
            <strong>reservadas temporalmente para vos</strong> y <strong>no estarán disponibles</strong>{' '}
            para otros usuarios.
          </p>
          <p className="added-modal-subtitle" style={{ textAlign: 'left', marginTop: '0.75rem' }}>
            Tenés hasta <strong>{horasRetencion} horas</strong> para completar la reserva. Si no finalizás el
            pago en ese plazo, <strong>el carrito se vaciará automáticamente</strong> y las fechas volverán a
            estar disponibles para todos.
          </p>
        </div>

        <div className="added-modal-actions">
          <button
            type="button"
            className="btn btn-outline-secondary added-modal-btn-continue"
            onClick={onCancel}
            disabled={busy}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-primary added-modal-btn-cart"
            onClick={() => void handleConfirm()}
            disabled={busy}
          >
            {busy ? 'Reservando fechas…' : 'Entendido, continuar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartHoldWarningModal;
