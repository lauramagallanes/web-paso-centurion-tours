import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';

// Types
export interface FavoriteItem {
  id: string;
  type: 'accommodation' | 'activity';
  name: string;
  description: string;
  image: string;
  price: number;
  currency: string;
  // Accommodation specific
  capacity?: {
    min: number;
    max: number;
  };
  amenities?: string[];
  rating?: number;
  // Activity specific
  difficulty?: string;
  duration?: string;
  maxParticipants?: number;
  includes?: string[];
  addedAt: Date;
}

export interface FavoritesState {
  items: FavoriteItem[];
  count: number;
}

// Actions
type FavoritesAction =
  | { type: 'ADD_FAVORITE'; payload: Omit<FavoriteItem, 'addedAt'> }
  | { type: 'REMOVE_FAVORITE'; payload: string }
  | { type: 'CLEAR_FAVORITES' }
  | { type: 'LOAD_FAVORITES'; payload: FavoriteItem[] };

// Initial state
const initialState: FavoritesState = {
  items: [],
  count: 0,
};

// Reducer
const favoritesReducer = (state: FavoritesState, action: FavoritesAction): FavoritesState => {
  switch (action.type) {
    case 'ADD_FAVORITE': {
      // Check if item already exists
      const existingItemIndex = state.items.findIndex(item => item.id === action.payload.id);
      
      if (existingItemIndex >= 0) {
        // Item already in favorites, don't add again
        return state;
      }

      const newItem: FavoriteItem = {
        ...action.payload,
        addedAt: new Date()
      };

      const updatedItems = [...state.items, newItem];

      return {
        ...state,
        items: updatedItems,
        count: updatedItems.length,
      };
    }

    case 'REMOVE_FAVORITE': {
      const updatedItems = state.items.filter(item => item.id !== action.payload);

      return {
        ...state,
        items: updatedItems,
        count: updatedItems.length,
      };
    }

    case 'CLEAR_FAVORITES':
      return {
        ...state,
        items: [],
        count: 0,
      };

    case 'LOAD_FAVORITES':
      return {
        ...state,
        items: action.payload,
        count: action.payload.length,
      };

    default:
      return state;
  }
};

// Context
interface FavoritesContextType {
  state: FavoritesState;
  addFavorite: (item: Omit<FavoriteItem, 'addedAt'>) => void;
  removeFavorite: (id: string) => void;
  clearFavorites: () => void;
  isFavorite: (id: string) => boolean;
  toggleFavorite: (item: Omit<FavoriteItem, 'addedAt'>) => void;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

// Provider
interface FavoritesProviderProps {
  children: ReactNode;
}

export const FavoritesProvider: React.FC<FavoritesProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(favoritesReducer, initialState);

  // Load favorites from localStorage on mount
  useEffect(() => {
    const savedFavorites = localStorage.getItem('tinambu-favorites');
    if (savedFavorites) {
      try {
        const parsedFavorites: FavoriteItem[] = JSON.parse(savedFavorites).map((item: any) => ({
          ...item,
          addedAt: new Date(item.addedAt)
        }));
        dispatch({ type: 'LOAD_FAVORITES', payload: parsedFavorites });
      } catch (error) {
        console.error('Error loading favorites from localStorage:', error);
      }
    }
  }, []);

  // Save favorites to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('tinambu-favorites', JSON.stringify(state.items));
  }, [state.items]);

  const addFavorite = (item: Omit<FavoriteItem, 'addedAt'>) => {
    dispatch({ type: 'ADD_FAVORITE', payload: item });
  };

  const removeFavorite = (id: string) => {
    dispatch({ type: 'REMOVE_FAVORITE', payload: id });
  };

  const clearFavorites = () => {
    dispatch({ type: 'CLEAR_FAVORITES' });
  };

  const isFavorite = (id: string): boolean => {
    return state.items.some(item => item.id === id);
  };

  const toggleFavorite = (item: Omit<FavoriteItem, 'addedAt'>) => {
    if (isFavorite(item.id)) {
      removeFavorite(item.id);
    } else {
      addFavorite(item);
    }
  };

  const value: FavoritesContextType = {
    state,
    addFavorite,
    removeFavorite,
    clearFavorites,
    isFavorite,
    toggleFavorite,
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};

// Hook
export const useFavorites = (): FavoritesContextType => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};

export default FavoritesContext;

