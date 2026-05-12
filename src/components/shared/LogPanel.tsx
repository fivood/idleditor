import { useRef, useEffect } from 'react'
import { useGameStore } from '@/store/gameStore'

export function LogPanel() {
  const toasts = useGameStore(s => s.toasts)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [toasts.length])

  if (toasts.length === 0) {
    return (
      <div className="bg-cream border-2 border-border-dark p-2 md:p-3 h-full flex flex-col shadow-[3px_3px_0_#4a3728]">
        <h3 className="text-[13px] md:text-xs font-bold text-ink mb-1 font-mono border-b-2 border-border-dark pb-1">出版日志</h3>
        <p className="text-[11px] md:text-[13px] text-muted flex-1 flex items-center justify-center font-mono">
          暂无记录
        </p>
      </div>
    )
  }

  return (
    <div className="bg-cream border-2 border-border-dark p-2 md:p-3 h-full flex flex-col shadow-[3px_3px_0_#4a3728]">
      <h3 className="text-[13px] md:text-xs font-bold text-ink mb-1 md:mb-2 shrink-0 font-mono border-b-2 border-border-dark pb-1">出版日志</h3>
      <div className="flex-1 overflow-y-auto space-y-1 md:space-y-1.5 pr-1">
        {toasts.map(toast => (
          <div key={toast.id} className="text-[12px] md:text-xs leading-relaxed font-mono">
            <span className={`inline-block mr-1 ${
              toast.type === 'milestone' ? 'text-copper' :
              toast.type === 'award' ? 'text-green-600' :
              'text-muted'
            }`}>
              {toast.type === 'milestone' ? '◆' : toast.type === 'award' ? '★' : '·'}
            </span>
            <span className="text-ink">{toast.text}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
