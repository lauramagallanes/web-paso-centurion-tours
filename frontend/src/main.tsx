import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import Context from './Context/Context'

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <App />
    <Context/>
  </BrowserRouter>
) 