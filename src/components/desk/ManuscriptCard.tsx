import type { Manuscript } from '@/core/types'
import { GENRE_ICONS } from '@/core/types'
import { useGameStore } from '@/store/gameStore'

interface Props {
  manuscript: Manuscript
}

export function ManuscriptCard({ manuscript }: Props) {
  const startReview = useGameStore(s => s.startReview)
  const rejectManuscript = useGameStore(s => s.rejectManuscript)
  const icon = GENRE_ICONS[manuscript.genre] ?? '📖'

  return (
    <div className={`bg-card border rounded-lg p-3 flex gap-3 items-start transition-colors ${
      manuscript.isUnsuitable
        ? 'border-red-200 bg-red-50/30'
        : 'border-border hover:border-green-border'
    }`}>
      <div
        className="w-10 h-14 rounded flex-shrink-0 flex items-center justify-center text-lg"
        style={{ backgroundColor: manuscript.cover.placeholder.bgColor + '33' }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-ink truncate">
          {manuscript.title}
        </h3>
        <p className="text-xs text-muted mt-0.5">
          {manuscript.genre} · {Math.round(manuscript.wordCount / 1000)}K字 · 质量{manuscript.quality}
        </p>
        {manuscript.synopsis && (
          <p className="text-xs text-muted mt-1.5 leading-relaxed line-clamp-2">
            {manuscript.synopsis}
          </p>
        )}
        {manuscript.isUnsuitable && (
          <p className="text-xs text-red-600 mt-1.5 leading-relaxed">
            ⚠ {manuscript.rejectionReason}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-1 flex-shrink-0">
        <button
          onClick={() => startReview(manuscript.id)}
          className={`text-xs px-2 py-1 rounded cursor-pointer transition-colors ${
            manuscript.isUnsuitable
              ? 'text-muted border border-border hover:border-green-border hover:text-green'
              : 'bg-green-bg text-green border border-green-border hover:bg-green hover:text-white'
          }`}
        >
          审稿
        </button>
        <button
          onClick={() => rejectManuscript(manuscript.id)}
          className={`text-xs px-2 py-1 rounded cursor-pointer transition-colors ${
            manuscript.isUnsuitable
              ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
              : 'text-muted border border-border hover:border-red-300 hover:text-red-500'
          }`}
        >
          退稿
        </button>
      </div>
    </div>
  )
}
