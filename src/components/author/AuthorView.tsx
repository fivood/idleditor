import { useMemo } from 'react'
import { useGameStore } from '@/store/gameStore'
import { GENRE_ICONS } from '@/core/types'
import { AUTHOR_TIER_THRESHOLDS, AFFECTION_ELITE_TALENT, AFFECTION_LETTER } from '@/core/constants'
import type { Author } from '@/core/types'

const TIER_LABELS: Record<string, string> = { idol: '传奇', known: '知名', signed: '签约', new: '新人' }
const TIER_ICONS: Record<string, string> = { idol: '🌟', known: '⭐', signed: '✒️', new: '📝' }
const TIER_ORDER: Record<string, number> = { idol: 0, known: 1, signed: 2, new: 3 }

export function AuthorView() {
  const authors = useGameStore(s => s.authors)
  const playTicks = useGameStore(s => s.playTicks)
  const signAuthor = useGameStore(s => s.signAuthor)

  const list = useMemo(() => [...authors.values()], [authors, playTicks])

  if (list.length === 0) {
    return (
      <div className="h-full overflow-y-auto p-3 md:p-5 text-center py-10 md:py-12">
        <p className="text-muted text-xs md:text-sm font-mono">还未发现任何作者。</p>
        <p className="text-muted text-[16px] md:text-xs mt-1 font-mono">当稿件出现在你的桌面上时，你会遇到作者。</p>
      </div>
    )
  }

  const sorted = [...list].sort((a, b) => (TIER_ORDER[a.tier] ?? 9) - (TIER_ORDER[b.tier] ?? 9))

  return (
    <div className="h-full overflow-y-auto p-3 md:p-4">
      <h2 className="text-xs md:text-sm font-bold text-ink mb-2 md:mb-3 font-mono">{list.length} 位作者</h2>
      <div className="grid gap-1.5 md:gap-2">
        {sorted.map(author => (
          <div
            key={author.id}
            className="bg-cream border-2 border-border-dark p-2 md:p-3 shadow-[3px_3px_0_#4a3728]"
          >
            <div className="flex items-center gap-2 md:gap-3">
              <span className="text-xl md:text-2xl flex-shrink-0">
                {TIER_ICONS[author.tier] ?? '📝'}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs md:text-sm font-bold text-ink font-mono">
                  {author.talent >= AFFECTION_ELITE_TALENT && <span className="text-copper" title="精英作者">💎 </span>}
                  {author.name}
                  {author.affection >= AFFECTION_LETTER && <span className="text-copper-dark ml-1" title="好感度高">💌</span>}
                  <span className="text-[14px] md:text-[16px] text-muted font-normal ml-1.5">
                    {TIER_LABELS[author.tier] ?? author.tier}
                  </span>
                </p>
                <p className="text-[15px] md:text-xs text-muted mt-0.5 font-mono">
                  <img src={GENRE_ICONS[author.genre] ?? '/icons/misc/book.svg'} alt="" className="inline w-4 h-4 md:w-3.5 md:h-3.5 align-text-bottom" /> {author.genre} · 才华 {author.talent} · 名气 {author.fame}
                  {author.cooldownUntil !== null && author.cooldownUntil > 0 && (
                    <span className="text-copper font-bold ml-1">· 休息中</span>
                  )}
                </p>
                {(author.tier === 'signed' || author.tier === 'known') && (
                  <FameBar author={author} />
                )}
              </div>
              {author.tier === 'new' && (
                <button
                  onClick={() => signAuthor(author.id)}
                  className="text-[15px] md:text-xs px-2 md:px-3 py-1 md:py-1.5 bg-copper text-white border-2 border-border-dark font-mono cursor-pointer shadow-[2px_2px_0_#4a3728] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all flex-shrink-0"
                >
                  签约
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function FameBar({ author }: { author: Author }) {
  const nextTier = author.tier === 'signed' ? 'known' : 'idol'
  const threshold = AUTHOR_TIER_THRESHOLDS[nextTier] ?? 999
  const pct = Math.min(100, Math.round((author.fame / threshold) * 100))
  return (
    <div className="mt-1 md:mt-1.5">
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[16px] md:text-[14px] text-muted font-mono">→ {TIER_LABELS[nextTier]}</span>
        <span className="text-[16px] md:text-[14px] text-muted font-mono tabular-nums">{author.fame}/{threshold}</span>
      </div>
      <div className="h-1 md:h-1.5 bg-card-inset border border-border-dark overflow-hidden">
        <div className="h-full bg-progress transition-all duration-700" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
