import { useRef, useEffect, useState, useMemo } from 'react'
import { useGameStore } from '@/store/gameStore'
import { totalDaysToCalendar, MONTH_NAMES } from '@/core/calendar'

const YEAR_CHARS = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十',
  '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十']
function yearToChinese(y: number): string {
  if (y <= 0) return '第?年'
  if (y <= 20) return `第${YEAR_CHARS[y]}年`
  return `第${y}年`
}

export function LogPanel() {
  const toasts = useGameStore(s => s.toasts)
  const bottomRef = useRef<HTMLDivElement>(null)
  const [tab, setTab] = useState<'review' | 'publish'>('review')

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [toasts.length, tab])

  const reviewToasts = useMemo(() => toasts.filter(t => t.type === 'info' || t.type === 'rejection').reverse(), [toasts])
  const publishToasts = useMemo(() => toasts.filter(t => t.type === 'milestone' || t.type === 'award').reverse(), [toasts])
  const active = tab === 'review' ? reviewToasts : publishToasts

  // Group by year-month with dividers
  const grouped = useMemo(() => {
    const result: { label: string; toasts: typeof active }[] = []
    for (const t of active) {
      // createdAt may be Date.now() (huge) or playTicks — normalize
      const tick = t.createdAt > 1e9 ? Math.round(t.createdAt / 1000) : t.createdAt
      const cal = totalDaysToCalendar(Math.floor(tick / 60))
      const label = `${yearToChinese(cal.year)}${MONTH_NAMES[cal.month]}`
      const last = result[result.length - 1]
      if (last && last.label === label) {
        last.toasts.push(t)
      } else {
        result.push({ label, toasts: [t] })
      }
    }
    return result
  }, [active])

  if (toasts.length === 0) {
    return (
      <div className="bg-cream border-2 border-border-dark p-2 md:p-3 h-full flex flex-col shadow-[3px_3px_0_#4a3728]">
        <h3 className="text-[16px] md:text-xs font-bold text-ink mb-1 font-mono border-b-2 border-border-dark pb-1">编辑部日志</h3>
        <p className="text-[14px] md:text-[16px] text-muted flex-1 flex items-center justify-center font-mono">
          暂无记录
        </p>
      </div>
    )
  }

  return (
    <div className="bg-cream border-2 border-border-dark p-2 md:p-3 h-full flex flex-col shadow-[3px_3px_0_#4a3728]">
      <h3 className="text-[16px] md:text-xs font-bold text-ink mb-1 shrink-0 font-mono border-b-2 border-border-dark pb-1">编辑部日志</h3>
      <div className="flex gap-1 mb-1.5 shrink-0">
        <button
          onClick={() => setTab('review')}
          className={`text-[14px] md:text-[16px] px-2 py-0.5 border-2 border-border-dark font-mono transition-all ${
            tab === 'review' ? 'bg-copper text-white' : 'bg-cream-dark text-muted'
          }`}
        >
          审稿 ({reviewToasts.length})
        </button>
        <button
          onClick={() => setTab('publish')}
          className={`text-[14px] md:text-[16px] px-2 py-0.5 border-2 border-border-dark font-mono transition-all ${
            tab === 'publish' ? 'bg-copper text-white' : 'bg-cream-dark text-muted'
          }`}
        >
          出版 ({publishToasts.length})
        </button>
      </div>
      <div className="flex-1 overflow-y-auto space-y-1 md:space-y-1.5 pr-1">
        {active.length === 0 ? (
          <p className="text-[14px] md:text-[16px] text-muted text-center font-mono py-4">
            {tab === 'review' ? '暂无审稿记录' : '暂无出版记录'}
          </p>
        ) : (
          grouped.map((group, gi) => (
            <div key={gi}>
              <div className="flex items-center gap-2 text-[16px] md:text-[15px] text-muted font-mono mt-2 mb-0.5 first:mt-0">
                <span className="shrink-0 opacity-50">{group.label}</span>
                <span className="flex-1 border-b border-border-medium" />
              </div>
              {group.toasts.map(toast => (
                <div key={toast.id} className={`text-[15px] md:text-xs leading-relaxed font-mono ${
                  toast.type === 'levelUp' ? 'border-2 border-amber-400 bg-amber-50 p-1.5 shadow-[2px_2px_0_#b87333]' : ''
                }`}>
                  <span className={`inline-block mr-1 ${
                    toast.type === 'milestone' ? 'text-copper' :
                    toast.type === 'award' ? 'text-green-600' :
                    toast.type === 'levelUp' ? 'text-amber-600' :
                    'text-muted'
                  }`}>
                    {toast.type === 'milestone' ? '◆' : toast.type === 'award' ? '★' : toast.type === 'levelUp' ? '⬆' : '·'}
                  </span>
                  <span className="text-ink">{toast.text}</span>
                </div>
              ))}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
