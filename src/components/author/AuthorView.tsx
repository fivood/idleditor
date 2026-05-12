import { useMemo } from 'react'
import { useGameStore } from '@/store/gameStore'
import { GENRE_ICONS } from '@/core/types'

export function AuthorView() {
  const authors = useGameStore(s => s.authors)
  const playTicks = useGameStore(s => s.playTicks)
  const signAuthor = useGameStore(s => s.signAuthor)

  const list = useMemo(() => [...authors.values()], [authors, playTicks])

  if (list.length === 0) {
    return (
      <div className="h-full overflow-y-auto p-4 text-center py-12">
        <p className="text-muted text-sm">还未发现任何作者。</p>
        <p className="text-muted text-xs mt-1">当稿件出现在你的桌面上时，你会遇到作者。</p>
      </div>
    )
  }

  const tierOrder: Record<string, number> = { idol: 0, known: 1, signed: 2, new: 3 }
  const sortLabels: Record<string, string> = { idol: '传奇', known: '知名', signed: '签约', new: '新人' }
  const sorted = [...list].sort((a, b) => (tierOrder[a.tier] ?? 9) - (tierOrder[b.tier] ?? 9))

  return (
    <div className="h-full overflow-y-auto p-4">
      <h2 className="text-sm font-medium text-ink mb-3">{list.length} 位作者</h2>
      <div className="grid gap-2">
        {sorted.map(author => (
          <div
            key={author.id}
            className="bg-card border border-border rounded-lg p-3 flex items-center gap-3"
          >
            <span className="text-2xl">
              {author.tier === 'idol' ? '🌟' : author.tier === 'known' ? '⭐' : author.tier === 'signed' ? '✒️' : '📝'}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-ink flex items-center gap-2">
                {author.name}
                <span className="text-[10px] text-muted font-normal">
                  {sortLabels[author.tier] ?? author.tier}
                </span>
              </p>
              <p className="text-xs text-muted mt-0.5">
                {GENRE_ICONS[author.genre]} {author.genre} · 才华 {author.talent} · 名气 {author.fame}
                {author.cooldownUntil !== null && author.cooldownUntil !== undefined && author.cooldownUntil > 0 && (
                  <span className="text-gold ml-1">· 休息中 ({author.cooldownUntil}秒)</span>
                )}
              </p>
            </div>
            {author.tier === 'new' && (
              <button
                onClick={() => signAuthor(author.id)}
                className="text-xs px-2 py-1 bg-green-bg text-green border border-green-border rounded cursor-pointer hover:bg-green hover:text-white transition-colors"
              >
                签约
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
