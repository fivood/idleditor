import { useGameStore } from '@/store/gameStore'
import { GENRE_ICONS } from '@/core/types'

export function AuthorView() {
  const authors = [...useGameStore(s => s.authors.values())]
  const signAuthor = useGameStore(s => s.signAuthor)

  if (authors.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted text-sm">No authors discovered yet.</p>
        <p className="text-muted text-xs mt-1">Authors appear when manuscripts arrive on your desk.</p>
      </div>
    )
  }

  const tierOrder = { idol: 0, known: 1, signed: 2, new: 3 }
  const sorted = [...authors].sort((a, b) => (tierOrder[a.tier] ?? 9) - (tierOrder[b.tier] ?? 9))

  return (
    <div>
      <h2 className="text-sm font-medium text-ink mb-3">{authors.length} author{authors.length !== 1 ? 's' : ''}</h2>
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
                <span className="text-[10px] text-muted font-normal uppercase tracking-wide">
                  {author.tier}
                </span>
              </p>
              <p className="text-xs text-muted mt-0.5">
                {GENRE_ICONS[author.genre]} {author.genre} · Talent {author.talent} · Fame {author.fame}
                {author.cooldownUntil !== null && (
                  <span className="text-gold ml-1">· Resting ({author.cooldownUntil}s)</span>
                )}
              </p>
            </div>
            {author.tier === 'new' && (
              <button
                onClick={() => signAuthor(author.id)}
                className="text-xs px-2 py-1 bg-green-bg text-green border border-green-border rounded cursor-pointer hover:bg-green hover:text-white transition-colors"
              >
                Sign
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
