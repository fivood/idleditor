import { useEffect, useRef, useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import type { ToastMessage } from '@/core/types'

/**
 * 永夜出版社 · 顶部走马灯。
 *
 * 行为：
 * - 始终显示 toasts 数组里"最新一条"，直到下一条把它顶掉。
 * - 新消息进入时短暂高亮 + 闪烁 ◆ 图标，3 秒后归于常态。
 * - 高度紧凑（约 22~26px），位于 TopBar 与主场景之间。
 * - 文本超出宽度时省略；hover 展开 tooltip 显示全文。
 */
export function TickerBar() {
  const latest = useGameStore(s => s.toasts.length > 0 ? s.toasts[s.toasts.length - 1] : null)
  const [pulse, setPulse] = useState(false)
  const prevIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!latest) return
    if (prevIdRef.current === latest.id) return
    prevIdRef.current = latest.id
    setPulse(true)
    const t = setTimeout(() => setPulse(false), 2400)
    return () => clearTimeout(t)
  }, [latest])

  if (!latest) {
    return (
      <div
        className="px-well shrink-0 px-2 h-[26px] flex items-center text-[12px] font-mono"
        style={{ color: '#6a553a' }}
      >
        <span className="opacity-60">夜色未起，编辑部一片寂静……</span>
      </div>
    )
  }

  return (
    <div
      className="px-well shrink-0 px-2 h-[26px] md:h-[28px] flex items-center gap-2 text-[12px] font-mono overflow-hidden whitespace-nowrap"
      style={{
        color: pulse ? '#f5d878' : '#d4a85a',
        transition: 'color 1.6s linear',
      }}
      title={latest.text}
      role="status"
      aria-live="polite"
    >
      <span className="shrink-0" style={{ color: typeIconColor(latest) }}>
        {typeIcon(latest)}
      </span>
      <span className="truncate" style={{ minWidth: 0 }}>{latest.text}</span>
    </div>
  )
}

function typeIcon(t: ToastMessage): string {
  switch (t.type) {
    case 'milestone': return '◆'
    case 'award': return '★'
    case 'rejection': return '✗'
    case 'levelUp': return '⬆'
    case 'humor': return '·'
    default: return '·'
  }
}

function typeIconColor(t: ToastMessage): string {
  switch (t.type) {
    case 'milestone': return '#f5d878'
    case 'award': return '#7ce28c'
    case 'rejection': return '#e57b7b'
    case 'levelUp': return '#ffcc66'
    default: return '#b8a48a'
  }
}
