import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiService } from '../../services/apiService';
import { useCart, CartItem } from '../../contexts/CartContext';
import { routes } from '../../utils/routes';
import './PaymentResult.css';

type Estado = 'procesando' | 'restaurado' | 'sin-restaurar' | 'error';

const PaymentCancelled: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { restoreItems } = useCart();

  const ordenId = searchParams.get('ordenId');
  const reservaId = searchParams.get('reservaId');
  const tipo = searchParams.get('tipo');

  const [estado, setEstado] = useState<Estado>('procesando');
  const [mensaje, setMensaje] = useState<string>(
    'Estamos liberando tu reserva y devolviendo los items al carrito...'
  );

  // Evitamos doble ejecución cuando React monta el componente dos veces en StrictMode.
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    (async () => {
      try {
        if (ordenId) {
          await apiService.cancelarPagoOrden(ordenId);
        } else if (reservaId && tipo) {
          await apiService.cancelarPagoReserva(reservaId, tipo);
        }

        // Recuperamos snapshot guardado antes del redirect a la pasarela.
        let restoredCount = 0;
        try {
          const raw = sessionStorage.getItem('tinambu-pending-checkout');
          if (raw) {
            const parsed = JSON.parse(raw) as {
              ordenId?: string;
              savedAt?: number;
              items?: Omit<CartItem, 'cartItemId'>[];
            };
            const matchesOrden = !ordenId || !parsed.ordenId || parsed.ordenId === ordenId;
            if (matchesOrden && Array.isArray(parsed.items) && parsed.items.length > 0) {
              await restoreItems(parsed.items);
              restoredCount = parsed.items.length;
            }
            sessionStorage.removeItem('tinambu-pending-checkout');
          }
        } catch (storageErr) {
          console.warn('No se pudo restaurar el carrito tras cancelar el pago', storageErr);
        }

        if (restoredCount > 0) {
          setEstado('restaurado');
          setMensaje(
            'Tu reserva fue cancelada y los items volvieron a tu carrito. Cuando quieras retomarlo, finalizá el pago.'
          );
        } else {
          setEstado('sin-restaurar');
          setMensaje(
            'Tu reserva fue cancelada y las fechas quedaron disponibles nuevamente. Podés volver a buscar y reservar cuando quieras.'
          );
        }
      } catch (err) {
        console.error('Error cancelling payment:', err);
        setEstado('error');
        setMensaje(
          'No pudimos confirmar la cancelación automáticamente. Si tu reserva sigue figurando como pendiente, contactanos para liberarla.'
        );
      }
    })();
  }, [ordenId, reservaId, tipo, restoreItems]);

  return (
    <div className="payment-result-page">
      <div className="payment-result-container">
        <div className="result-icon status-rejected" aria-hidden="true">
          <i className="bi bi-x-lg" />
        </div>

        <h1>Pago cancelado</h1>
        <p className="result-subtitle">{mensaje}</p>

        <div className="result-actions">
          {estado === 'restaurado' && (
            <button
              className="btn-primary"
              onClick={() => navigate(routes.checkout)}
            >
              Volver al carrito
            </button>
          )}

          {estado !== 'restaurado' && (
            <button
              className="btn-primary"
              onClick={() => navigate(routes.book)}
            >
              Volver a reservar
            </button>
          )}

          <button className="btn-secondary" onClick={() => navigate(routes.home)}>
            Volver al inicio
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentCancelled;
