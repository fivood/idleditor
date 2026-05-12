import { useEffect } from 'react'
import { useGameStore } from '@/store/gameStore'

export function ToastContainer() {
  const toasts = useGameStore(s => s.toasts)
  const dismissToast = useGameStore(s => s.dismissToast)

  useEffect(() => {
    if (toasts.length === 0) return
    const latest = toasts[toasts.length - 1]
    const timer = setTimeout(() => dismissToast(latest.id), 8000)
    return () => clearTimeout(timer)
  }, [toasts, dismissToast])

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-14 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.slice(-3).map(toast => (
        <div
          key={toast.id}
          onClick={() => dismissToast(toast.id)}
          className={`bg-card border rounded-lg p-3 text-xs shadow-lg cursor-pointer transition-all animate-in ${
            toast.type === 'milestone'
              ? 'border-gold bg-gold-bg'
              : toast.type === 'award'
              ? 'border-green-border bg-green-bg'
              : 'border-border'
          }`}
        >
          <p className="text-ink leading-relaxed">{toast.text}</p>
        </div>
      ))}
    </div>
  )
}
