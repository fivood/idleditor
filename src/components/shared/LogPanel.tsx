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
      <div className="bg-card border border-border rounded-lg p-3 h-full flex flex-col">
        <h3 className="text-xs font-medium text-ink mb-1">出版日志</h3>
        <p className="text-[10px] text-muted flex-1 flex items-center justify-center">
          暂无记录，开始审稿后这里会出现日志。
        </p>
      </div>
    )
  }

  return (
    <div className="bg-card border border-border rounded-lg p-3 h-full flex flex-col">
      <h3 className="text-xs font-medium text-ink mb-2 shrink-0">出版日志</h3>
      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
        {toasts.map(toast => (
          <div key={toast.id} className="text-[10px] leading-relaxed">
            <span className={`inline-block mr-1 ${
              toast.type === 'milestone' ? 'text-gold' :
              toast.type === 'award' ? 'text-green' :
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
