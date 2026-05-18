import { useMemo, useState } from 'react'
import { useGameStore } from '@/store/gameStore'

const YEAR_CHARS = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十',
  '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十']
function yearToChinese(y: number): string {
  if (y <= 0) return '第?年'
  if (y <= 20) return `第${YEAR_CHARS[y]}年`
  return `第${y}年`
}

/**
 * 出版日志档案：日志面板溢出的旧条目按"游戏年份"分册收纳。
 * 在档案室"出版日志档案"里翻阅，左侧年份目录，右侧条目正文。
 */
export function ArchivedLogsView() {
  const archived = useGameStore(s => s.archivedLogsByYear ?? {})
  const years = useMemo(() => Object.keys(archived).map(Number).filter(y => archived[y]?.length).sort((a, b) => b - a), [archived])
  const [selected, setSelected] = useState<number | null>(years[0] ?? null)

  const activeYear = selected != null && archived[selected] ? selected : years[0] ?? null
  const items = activeYear != null ? archived[activeYear].slice().reverse() : []

  if (years.length === 0) {
    return (
      <p className="text-[14px] md:text-[15px] text-[#b8a48a] font-mono text-center py-6">
        档案柜空空如也。等出版日志堆得溢出来时，才会按年份归档到这里。
      </p>
    )
  }

  return (
    <div className="flex gap-3 font-mono text-[13px] md:text-[14px]">
      {/* 左侧：年份目录 */}
      <div className="shrink-0 w-[110px] border-r border-[#5c3a1f] pr-2 max-h-[60vh] overflow-y-auto">
        {years.map(y => {
          const isActive = y === activeYear
          return (
            <button
              key={y}
              onClick={() => setSelected(y)}
              className="w-full text-left px-2 py-1 mb-0.5 border-2 transition-none cursor-pointer"
              style={{
                background: isActive ? '#5c3a1f' : '#2a1810',
                borderColor: isActive ? '#b8763b' : '#5c3a1f',
                color: isActive ? '#f5d878' : '#d4a85a',
              }}
            >
              <div className="font-bold">{yearToChinese(y)}</div>
              <div className="text-[12px] opacity-70">{archived[y].length} 条</div>
            </button>
          )
        })}
      </div>
      {/* 右侧：当年日志正文 */}
      <div className="flex-1 max-h-[60vh] overflow-y-auto pr-1 space-y-1">
        {items.map(t => (
          <div key={t.id} className="leading-relaxed">
            <span className={`inline-block mr-1 ${
              t.type === 'milestone' ? 'text-[#d4a85a]' :
              t.type === 'award' ? 'text-green-400' :
              t.type === 'rejection' ? 'text-red-400' :
              'text-[#b8a48a]'
            }`}>
              {t.type === 'milestone' ? '◆' : t.type === 'award' ? '★' : t.type === 'rejection' ? '✗' : '·'}
            </span>
            <span style={{ color: '#ede0c8' }}>{t.text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
