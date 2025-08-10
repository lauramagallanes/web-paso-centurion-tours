import { createRoot } from 'react-dom/client'
import App from './App'
import './styles/globals.css'
import { BrowserRouter } from 'react-router-dom'
import Context from './contexts/Context'
import { ThemeProvider } from './contexts/ThemeContext'

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <ThemeProvider>
      <Context>
        <App />
      </Context>
    </ThemeProvider>
  </BrowserRouter>
) 