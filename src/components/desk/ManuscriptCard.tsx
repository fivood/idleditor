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
    <div className="bg-card border border-border rounded-lg p-3 flex gap-3 items-start hover:border-green-border transition-colors">
      <div
        className="w-10 h-14 rounded flex-shrink-0 flex items-center justify-center text-lg"
        style={{ backgroundColor: manuscript.cover.placeholder.bgColor + '33' }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-ink truncate">{manuscript.title}</h3>
        <p className="text-xs text-muted mt-0.5">
          {manuscript.genre} · {Math.round(manuscript.wordCount / 1000)}K words · Q{manuscript.quality}
        </p>
      </div>
      <div className="flex flex-col gap-1 flex-shrink-0">
        <button
          onClick={() => startReview(manuscript.id)}
          className="text-xs px-2 py-1 bg-green-bg text-green border border-green-border rounded cursor-pointer hover:bg-green hover:text-white transition-colors"
        >
          Review
        </button>
        <button
          onClick={() => rejectManuscript(manuscript.id)}
          className="text-xs px-2 py-1 text-muted border border-border rounded cursor-pointer hover:border-red-300 hover:text-red-500 transition-colors"
        >
          Reject
        </button>
      </div>
    </div>
  )
}
