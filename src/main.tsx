import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

function ErrorFallback() {
  return (
    <div style={{ padding: 40, fontFamily: 'system-ui' }}>
      <h2 style={{ color: '#c00' }}>App crashed</h2>
      <p>Check the browser console (F12) for error details.</p>
    </div>
  )
}

try {
  const App = (await import('./App.tsx')).default
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
} catch (err) {
  console.error('Startup error:', err)
  createRoot(document.getElementById('root')!).render(<ErrorFallback />)
}
