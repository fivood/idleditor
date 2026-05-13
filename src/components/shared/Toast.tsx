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
    <div className="fixed top-10 md:top-14 right-2 md:right-4 z-50 flex flex-col gap-1.5 md:gap-2 max-w-[260px] md:max-w-sm">
      {toasts.slice(-3).map(toast => (
        <div
          key={toast.id}
          onClick={() => dismissToast(toast.id)}
          className={`border-2 p-2 md:p-3 text-[16px] md:text-xs cursor-pointer transition-all animate-in shadow-[3px_3px_0_#4a3728] font-mono ${
            toast.type === 'milestone'
              ? 'bg-cream border-copper'
              : toast.type === 'award'
              ? 'bg-cream border-green-600'
              : toast.type === 'levelUp'
              ? 'bg-amber-50 border-amber-500 shadow-[3px_3px_0_#b87333]'
              : 'bg-cream border-border-dark'
          }`}
        >
          <p className="text-ink leading-relaxed">{toast.text}</p>
        </div>
      ))}
    </div>
  )
}
