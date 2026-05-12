import { useMemo } from 'react'
import { useGameStore } from '@/store/gameStore'
import { GENRE_ICONS } from '@/core/types'
import { AUTHOR_TIER_THRESHOLDS } from '@/core/constants'

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
      <div className="h-full overflow-y-auto p-5 text-center py-12">
        <p className="text-muted text-sm font-mono">还未发现任何作者。</p>
        <p className="text-muted text-xs mt-1 font-mono">当稿件出现在你的桌面上时，你会遇到作者。</p>
      </div>
    )
  }

  const sorted = [...list].sort((a, b) => (TIER_ORDER[a.tier] ?? 9) - (TIER_ORDER[b.tier] ?? 9))

  return (
    <div className="h-full overflow-y-auto p-4">
      <h2 className="text-sm font-bold text-ink mb-3 font-mono">{list.length} 位作者</h2>
      <div className="grid gap-2">
        {sorted.map(author => (
          <div
            key={author.id}
            className="bg-cream border-2 border-border-dark p-3 shadow-[3px_3px_0_#4a3728]"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl flex-shrink-0">
                {TIER_ICONS[author.tier] ?? '📝'}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-ink font-mono">
                  {author.name}
                  <span className="text-[10px] text-muted font-normal ml-2">
                    {TIER_LABELS[author.tier] ?? author.tier}
                  </span>
                </p>
                <p className="text-xs text-muted mt-0.5 font-mono">
                  {GENRE_ICONS[author.genre]} {author.genre} · 才华 {author.talent} · 名气 {author.fame}
                  {author.cooldownUntil !== null && author.cooldownUntil > 0 && (
                    <span className="text-copper font-bold ml-1">· 休息中 ({author.cooldownUntil}秒)</span>
                  )}
                </p>
                {(author.tier === 'signed' || author.tier === 'known') && (
                  <FameBar author={author} />
                )}
              </div>
              {author.tier === 'new' && (
                <button
                  onClick={() => signAuthor(author.id)}
                  className="text-xs px-3 py-1.5 bg-copper text-white border-2 border-border-dark font-mono cursor-pointer shadow-[2px_2px_0_#4a3728] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all flex-shrink-0"
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

import type { Author } from '@/core/types'

function FameBar({ author }: { author: Author }) {
  const nextTier = author.tier === 'signed' ? 'known' : 'idol'
  const threshold = AUTHOR_TIER_THRESHOLDS[nextTier] ?? 999
  const pct = Math.min(100, Math.round((author.fame / threshold) * 100))
  return (
    <div className="mt-1.5">
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[8px] text-muted font-mono">声望 → {TIER_LABELS[nextTier]}</span>
        <span className="text-[8px] text-muted font-mono tabular-nums">{author.fame}/{threshold}</span>
      </div>
      <div className="h-1.5 bg-card-inset border border-border-dark overflow-hidden">
        <div
          className="h-full bg-copper transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
