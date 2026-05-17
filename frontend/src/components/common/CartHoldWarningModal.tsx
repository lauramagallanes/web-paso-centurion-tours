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
            Reserva temporal de las fechas
          </h2>
          <p className="added-modal-subtitle" style={{ textAlign: 'left' }}>
            Al agregar <strong>{roomName}</strong> al carrito, las fechas que elegiste quedarán{' '}
            <strong>apartadas temporalmente para ti</strong> y <strong>no podrán reservarlas otras personas</strong>{' '}
            mientras completes el proceso.
          </p>
          <p className="added-modal-subtitle" style={{ textAlign: 'left', marginTop: '0.75rem' }}>
            Tienes hasta <strong>{horasRetencion} horas</strong> para completar la reserva. Si no finalizas el
            pago en ese tiempo, <strong>vaciamos el carrito por ti</strong> y las fechas vuelven a quedar libres
            para todos.
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
