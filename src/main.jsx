import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { MembreProvider } from './context/MembreContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MembreProvider>
      <App />
    </MembreProvider>
  </StrictMode>,
)