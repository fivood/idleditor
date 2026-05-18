import { useMemo } from 'react'
import { useGameStore } from '@/store/gameStore'
import { AWARD_LABELS } from '@/core/awards'
import type { AwardCategory } from '@/core/awards'

const YEAR_CHARS = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十',
  '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十']
function yearToChinese(y: number): string {
  if (y <= 0) return '第?届'
  if (y <= 20) return `第${YEAR_CHARS[y]}届`
  return `第${y}届`
}

const ORDER: AwardCategory[] = ['best-novel', 'best-newcomer', 'best-seller', 'jury-special']

/**
 * 永夜文学奖 · 历届名录。
 * 按年份倒序展示获奖书目；每届含 1-4 个奖项。
 */
export function AwardsView() {
  const history = useGameStore(s => s.awardHistory ?? [])
  const byYear = useMemo(() => {
    const map = new Map<number, typeof history>()
    for (const w of history) {
      if (!map.has(w.year)) map.set(w.year, [])
      map.get(w.year)!.push(w)
    }
    return [...map.entries()].sort((a, b) => b[0] - a[0])
  }, [history])

  if (byYear.length === 0) {
    return (
      <div className="font-mono text-[14px] md:text-[15px] text-[#b8a48a] text-center py-6 space-y-2">
        <p>每年游戏年份切换时，永夜文学奖颁奖典礼会在大厅举行。</p>
        <p className="opacity-70">出版至少 1 本书 + 度过一整年后，第一届就会自动开奖。</p>
      </div>
    )
  }

  return (
    <div className="font-mono text-[13px] md:text-[14px] space-y-3 max-h-[60vh] overflow-y-auto pr-1">
      {byYear.map(([year, winners]) => {
        const sorted = winners.slice().sort((a, b) => ORDER.indexOf(a.category) - ORDER.indexOf(b.category))
        return (
          <div key={year} className="border-2 p-2 md:p-3" style={{ borderColor: '#5c3a1f', background: '#1a0e08' }}>
            <div className="flex items-center justify-between border-b border-[#5c3a1f] pb-1 mb-2">
              <span className="font-bold" style={{ color: '#f5d878' }}>{yearToChinese(year)}永夜文学奖</span>
              <span className="opacity-60 text-[12px]" style={{ color: '#b8a48a' }}>{winners.length} 个奖项</span>
            </div>
            <div className="space-y-1.5">
              {sorted.map((w, i) => (
                <div key={`${year}-${i}`} className="leading-relaxed" style={{ color: '#ede0c8' }}>
                  <div>
                    <span style={{ color: '#f5d878' }}>{AWARD_LABELS[w.category]}</span>
                    <span className="mx-1.5 opacity-60">·</span>
                    <span className="font-bold">《{w.bookTitle}》</span>
                    <span className="mx-1 opacity-60">—</span>
                    <span style={{ color: '#d4a85a' }}>{w.authorName}</span>
                  </div>
                  <div className="text-[12px] md:text-[13px] opacity-70 mt-0.5 pl-2 border-l border-[#5c3a1f]" style={{ color: '#b8a48a' }}>
                    {w.citation}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
