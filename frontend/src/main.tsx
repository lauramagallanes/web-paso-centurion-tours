import { createRoot } from 'react-dom/client'
import App from './App'
import './styles/globals.css'
import { BrowserRouter } from 'react-router-dom'
import Context from './contexts/Context'
import { ThemeProvider } from './contexts/ThemeContext'
import { CartProvider } from './contexts/CartContext'
import { FavoritesProvider } from './contexts/FavoritesContext'

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