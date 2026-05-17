import React, { createContext, useContext, useReducer, useEffect, useRef, ReactNode } from 'react';
import { apiService } from '../services/apiService';

const generateId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback for non-secure contexts (HTTP)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
};

// Types
export interface CartItem {
  cartItemId: string;   // unique UUID per cart entry (NOT product ID)
  id: string;           // product / service ID
  type: 'alojamiento' | 'sendero';
  name: string;
  description: string;
  image: string;
  price: number;        // total price already calculated for this booking
  currency: string;
  // Alojamiento specific
  checkIn?: string;     // ISO date string
  checkOut?: string;    // ISO date string
  huespedes?: number;
  noches?: number;
  cartHoldExpiresAt?: string;
  // Sendero specific
  fecha?: string;       // ISO date string
  personas?: number;
  turno?: string;
  duracion?: string;
}

export interface CartState {
  items: CartItem[];
  total: number;
  itemCount: number;
  isOpen: boolean;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: Omit<CartItem, 'cartItemId'> }
  | { type: 'REMOVE_ITEM'; payload: string }           // payload = cartItemId
  | { type: 'CLEAR_CART' }
  | { type: 'TOGGLE_CART' }
  | { type: 'CLOSE_CART' }
  | { type: 'OPEN_CART' }
  | { type: 'LOAD_CART'; payload: CartItem[] };

const initialState: CartState = {
  items: [],
  total: 0,
  itemCount: 0,
  isOpen: false,
};

const calcTotal = (items: CartItem[]) =>
  items.reduce((sum, item) => sum + item.price, 0);

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM': {
      // Always insert as a new entry — reservations for the same product
      // on different dates are separate items, not quantity increments.
      const newItem: CartItem = {
        ...action.payload,
        cartItemId: generateId(),
      };
      const updatedItems = [...state.items, newItem];
      return {
        ...state,
        items: updatedItems,
        total: calcTotal(updatedItems),
        itemCount: updatedItems.length,
      };
    }

    case 'REMOVE_ITEM': {
      const updatedItems = state.items.filter(item => item.cartItemId !== action.payload);
      return {
        ...state,
        items: updatedItems,
        total: calcTotal(updatedItems),
        itemCount: updatedItems.length,
      };
    }

    case 'CLEAR_CART':
      return { ...state, items: [], total: 0, itemCount: 0 };

    case 'TOGGLE_CART':
      return { ...state, isOpen: !state.isOpen };

    case 'CLOSE_CART':
      return { ...state, isOpen: false };

    case 'OPEN_CART':
      return { ...state, isOpen: true };

    case 'LOAD_CART':
      return {
        ...state,
        items: action.payload,
        total: calcTotal(action.payload),
        itemCount: action.payload.length,
      };

    default:
      return state;
  }
};

interface CartContextType {
  state: CartState;
  addItem: (item: Omit<CartItem, 'cartItemId'>) => void;
  removeItem: (cartItemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  toggleCart: () => void;
  closeCart: () => void;
  openCart: () => void;
  /**
   * Restaura un set de items en el carrito. Para alojamientos, re-registra el
   * bloqueo de carrito en el backend (renueva 2h). Pensado para el flujo de
   * cancelación de pago donde queremos devolver los items al carrito del usuario.
   */
  restoreItems: (items: Omit<CartItem, 'cartItemId'>[]) => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

interface CartProviderProps {
  children: ReactNode;
}

const getCurrentUserId = (): string | null => {
  try {
    const user = localStorage.getItem('user');
    if (user) return JSON.parse(user)?.id ?? null;
  } catch { /* ignore */ }
  return null;
};

const cartKey = (userId: string | null) =>
  userId ? `tinambu-cart-${userId}` : null;

/**
 * Revalida los items de alojamiento contra el backend. El backend es la fuente
 * de verdad: si el usuario actual no tiene bloqueo de carrito vigente para esas
 * fechas, el item se elimina (evita carritos "fantasma" persistidos en
 * localStorage de versiones previas o donde el bloqueo expiró server-side).
 */
const revalidateAlojamientoItems = async (items: CartItem[]): Promise<CartItem[]> => {
  const cleaned: CartItem[] = [];
  const userId = getCurrentUserId();
  for (const i of items) {
    if (i.type !== 'alojamiento' || !i.checkIn || !i.checkOut) {
      cleaned.push(i);
      continue;
    }
    // Sin sesión activa, no podemos consultar el backend; mantenemos el comportamiento
    // previo (descartar si no hay expiración local válida).
    if (!userId) {
      if (i.cartHoldExpiresAt && new Date(i.cartHoldExpiresAt).getTime() > Date.now()) {
        cleaned.push(i);
      }
      continue;
    }
    if (i.cartHoldExpiresAt && new Date(i.cartHoldExpiresAt).getTime() <= Date.now()) {
      // Expirado localmente: avisamos al backend por si quedó algo y lo descartamos
      await apiService.liberarCarritoAlojamientoSilent(i.id, i.checkIn, i.checkOut);
      continue;
    }
    try {
      const { vigente } = await apiService.consultarCarritoBloqueoAlojamiento(
        i.id,
        i.checkIn,
        i.checkOut,
      );
      if (vigente) {
        cleaned.push(i);
      }
    } catch {
      // En error de red, conservamos el item si no expiró localmente
      if (i.cartHoldExpiresAt && new Date(i.cartHoldExpiresAt).getTime() > Date.now()) {
        cleaned.push(i);
      }
    }
  }
  return cleaned;
};

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const lastUserIdRef = useRef<string | null>(getCurrentUserId());
  const hydratedRef = useRef(false);

  // Load cart for the current user on mount.
  // Revalida cada item de alojamiento contra el backend (fuente de verdad):
  // si el bloqueo no está vigente para este usuario, eliminamos el item.
  useEffect(() => {
    const key = cartKey(getCurrentUserId());
    if (!key) {
      hydratedRef.current = true;
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const saved = localStorage.getItem(key);
        if (!saved) {
          if (!cancelled) hydratedRef.current = true;
          return;
        }
        const parsed: CartItem[] = JSON.parse(saved);
        const cleaned: CartItem[] = await revalidateAlojamientoItems(parsed);
        if (!cancelled) {
          dispatch({ type: 'LOAD_CART', payload: cleaned });
          hydratedRef.current = true;
        }
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
        if (!cancelled) hydratedRef.current = true;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Persist cart under the current user's key whenever items change (post hidratación)
  useEffect(() => {
    if (!hydratedRef.current) return;
    const key = cartKey(getCurrentUserId());
    if (key) {
      localStorage.setItem(key, JSON.stringify(state.items));
    }
  }, [state.items]);

  // Detect user change (login / logout / switch) and reload the correct cart
  useEffect(() => {
    const interval = setInterval(async () => {
      const currentUserId = getCurrentUserId();
      if (currentUserId !== lastUserIdRef.current) {
        lastUserIdRef.current = currentUserId;
        hydratedRef.current = false;
        const key = cartKey(currentUserId);
        if (key) {
          try {
            const saved = localStorage.getItem(key);
            const parsed: CartItem[] = saved ? JSON.parse(saved) : [];
            const cleaned = await revalidateAlojamientoItems(parsed);
            dispatch({ type: 'LOAD_CART', payload: cleaned });
          } catch {
            dispatch({ type: 'CLEAR_CART' });
          }
        } else {
          dispatch({ type: 'CLEAR_CART' });
        }
        hydratedRef.current = true;
      }
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Limpieza local: elimina items con retención expirada según el reloj del cliente.
  const sweepExpiredAlojamientos = React.useCallback(() => {
    const now = Date.now();
    state.items.forEach(item => {
      if (
        item.type === 'alojamiento' &&
        item.cartHoldExpiresAt &&
        item.checkIn &&
        item.checkOut &&
        new Date(item.cartHoldExpiresAt).getTime() <= now
      ) {
        void apiService
          .liberarCarritoAlojamientoSilent(item.id, item.checkIn, item.checkOut)
          .finally(() => {
            dispatch({ type: 'REMOVE_ITEM', payload: item.cartItemId });
          });
      }
    });
  }, [state.items]);

  // Revalida con backend que cada item siga teniendo bloqueo vigente para este usuario.
  const revalidateWithBackend = React.useCallback(async () => {
    if (!getCurrentUserId() || state.items.length === 0) return;
    const cleaned = await revalidateAlojamientoItems(state.items);
    if (cleaned.length !== state.items.length) {
      dispatch({ type: 'LOAD_CART', payload: cleaned });
    }
  }, [state.items]);

  // Sweep periódico (corre incluso si el setInterval previo quedó pausado por sleep)
  useEffect(() => {
    sweepExpiredAlojamientos();
    const id = window.setInterval(sweepExpiredAlojamientos, 30_000);
    return () => clearInterval(id);
  }, [sweepExpiredAlojamientos]);

  // Al volver a la pestaña / al focar la ventana, sweep + revalidación con backend
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        sweepExpiredAlojamientos();
        void revalidateWithBackend();
      }
    };
    const onFocus = () => {
      sweepExpiredAlojamientos();
      void revalidateWithBackend();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onFocus);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onFocus);
    };
  }, [sweepExpiredAlojamientos, revalidateWithBackend]);

  const addItem = (item: Omit<CartItem, 'cartItemId'>) => {
    dispatch({ type: 'ADD_ITEM', payload: item });
  };

  const removeItem = async (cartItemId: string) => {
    const item = state.items.find(i => i.cartItemId === cartItemId);
    if (item?.type === 'alojamiento' && item.checkIn && item.checkOut && getCurrentUserId()) {
      await apiService.liberarCarritoAlojamientoSilent(item.id, item.checkIn, item.checkOut);
    }
    dispatch({ type: 'REMOVE_ITEM', payload: cartItemId });
  };

  const clearCart = async () => {
    if (getCurrentUserId() && state.items.some(i => i.type === 'alojamiento')) {
      await apiService.liberarTodosCarritoAlojamientoSilent();
    }
    dispatch({ type: 'CLEAR_CART' });
  };
  const toggleCart = () => {
    if (!state.isOpen) {
      sweepExpiredAlojamientos();
      void revalidateWithBackend();
    }
    dispatch({ type: 'TOGGLE_CART' });
  };
  const closeCart = () => dispatch({ type: 'CLOSE_CART' });
  const openCart = () => {
    sweepExpiredAlojamientos();
    void revalidateWithBackend();
    dispatch({ type: 'OPEN_CART' });
  };

  const restoreItems = async (items: Omit<CartItem, 'cartItemId'>[]) => {
    if (!Array.isArray(items) || items.length === 0) return;

    const restored: Omit<CartItem, 'cartItemId'>[] = [];
    for (const item of items) {
      if (item.type === 'alojamiento' && item.checkIn && item.checkOut && getCurrentUserId()) {
        try {
          const { expiresAt } = await apiService.registrarCarritoBloqueoAlojamiento(
            item.id,
            item.checkIn,
            item.checkOut,
          );
          restored.push({ ...item, cartHoldExpiresAt: expiresAt });
        } catch {
          restored.push(item);
        }
      } else {
        restored.push(item);
      }
    }

    const withIds: CartItem[] = restored.map(i => ({ ...i, cartItemId: generateId() }));
    dispatch({ type: 'LOAD_CART', payload: withIds });
  };

  const value: CartContextType = {
    state,
    addItem,
    removeItem,
    clearCart,
    toggleCart,
    closeCart,
    openCart,
    restoreItems,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export default CartContext;
