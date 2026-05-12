import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

function ErrorFallback() {
  return (
    <div style={{ padding: 40, fontFamily: 'system-ui' }}>
      <h2 style={{ color: '#c00' }}>启动失败</h2>
      <p>请打开浏览器控制台 (F12) 查看错误详情。</p>
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
