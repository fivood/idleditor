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
    <div className={`bg-cream border-2 p-3 flex gap-3 items-start transition-all ${
      manuscript.isUnsuitable
        ? 'border-copper-dark bg-cream-dark shadow-[3px_3px_0_#8b5a2b]'
        : 'border-border-dark shadow-[3px_3px_0_#4a3728] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_#4a3728]'
    }`}>
      <div
        className="w-8 h-11 flex-shrink-0 flex items-center justify-center text-sm border-2 border-border-dark bg-card-inset overflow-hidden"
        style={{ backgroundColor: manuscript.cover.placeholder.bgColor + '22' }}
      >
        {manuscript.cover.src ? (
          <img src={manuscript.cover.src} alt="" className="w-full h-full object-cover" />
        ) : (
          icon
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-bold text-ink truncate font-mono">{manuscript.title}</h3>
        <p className="text-[10px] text-muted mt-0.5 font-mono">
          {manuscript.genre} · {Math.round(manuscript.wordCount / 1000)}K字 · Q{manuscript.quality}
        </p>
        {manuscript.synopsis && (
          <p className="text-[10px] text-muted mt-1.5 leading-relaxed line-clamp-2">{manuscript.synopsis}</p>
        )}
        {manuscript.isUnsuitable && (
          <p className="text-[10px] text-copper-dark mt-1.5 leading-relaxed font-bold">
            ⚠ {manuscript.rejectionReason}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-1 flex-shrink-0">
        <button
          onClick={() => startReview(manuscript.id)}
          className={`text-[10px] px-2 py-1 border-2 border-border-dark font-mono cursor-pointer transition-all shadow-[2px_2px_0_#4a3728] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] ${
            manuscript.isUnsuitable
              ? 'bg-cream text-muted'
              : 'bg-copper text-white'
          }`}
        >
          审稿
        </button>
        <button
          onClick={() => rejectManuscript(manuscript.id)}
          className={`text-[10px] px-2 py-1 border-2 border-border-dark font-mono cursor-pointer transition-all shadow-[2px_2px_0_#4a3728] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] ${
            manuscript.isUnsuitable
              ? 'bg-copper-dark text-white'
              : 'bg-cream text-muted'
          }`}
        >
          退稿
        </button>
      </div>
    </div>
  )
}
