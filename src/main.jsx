import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { registarSW } from './registarSW.js'
import { V2 } from './lib/v2.js'

// A V2 traz as fontes da identidade nova e a classe que troca as variáveis do CSS
if (V2) {
  document.documentElement.classList.add('v2')
  const l = document.createElement('link')
  l.rel = 'stylesheet'
  l.href = 'https://fonts.googleapis.com/css2?family=Archivo+Black&family=Archivo:wght@400;500;600;700&display=swap'
  document.head.appendChild(l)
  document.title = 'LC Office Consulting · V2'
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)

registarSW()
