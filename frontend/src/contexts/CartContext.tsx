import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';

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
  removeItem: (cartItemId: string) => void;
  clearCart: () => void;
  toggleCart: () => void;
  closeCart: () => void;
  openCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  useEffect(() => {
    const savedCart = localStorage.getItem('tinambu-cart');
    if (savedCart) {
      try {
        const parsed: CartItem[] = JSON.parse(savedCart);
        dispatch({ type: 'LOAD_CART', payload: parsed });
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('tinambu-cart', JSON.stringify(state.items));
  }, [state.items]);

  const addItem = (item: Omit<CartItem, 'cartItemId'>) => {
    dispatch({ type: 'ADD_ITEM', payload: item });
  };

  const removeItem = (cartItemId: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: cartItemId });
  };

  const clearCart = () => dispatch({ type: 'CLEAR_CART' });
  const toggleCart = () => dispatch({ type: 'TOGGLE_CART' });
  const closeCart = () => dispatch({ type: 'CLOSE_CART' });
  const openCart = () => dispatch({ type: 'OPEN_CART' });

  const value: CartContextType = {
    state,
    addItem,
    removeItem,
    clearCart,
    toggleCart,
    closeCart,
    openCart,
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
