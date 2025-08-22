import { createRoot } from 'react-dom/client'
import App from './App'
import './styles/globals.css'
import { BrowserRouter } from 'react-router-dom'
import Context from './contexts/Context'
import { ThemeProvider } from './contexts/ThemeContext'
import { CartProvider } from './contexts/CartContext'
import { FavoritesProvider } from './contexts/FavoritesContext'
import { initializeErrorHandlers } from './utils/errorHandlers'

// Inicializar manejadores de errores globales
// Esto resuelve el problema de login que se bloqueaba por errores silenciosos
initializeErrorHandlers();

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <ThemeProvider>
      <FavoritesProvider>
        <CartProvider>
          <Context>
            <App />
          </Context>
        </CartProvider>
      </FavoritesProvider>
    </ThemeProvider>
  </BrowserRouter>
) 