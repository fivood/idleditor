import { useState } from 'react'
import type { Manuscript } from '@/core/types'
import { GENRE_ICONS } from '@/core/types'
import { useGameStore } from '@/store/gameStore'

interface Props {
  manuscript: Manuscript
}

export function ManuscriptCard({ manuscript }: Props) {
  const startReview = useGameStore(s => s.startReview)
  const rejectManuscript = useGameStore(s => s.rejectManuscript)
  const shelveManuscript = useGameStore(s => s.shelveManuscript)
  const [expanded, setExpanded] = useState(false)
  const icon = GENRE_ICONS[manuscript.genre] ?? '/icons/misc/book.svg'

  return (
    <div className="bg-cream border-2 border-border-dark p-2 md:p-3 flex gap-2 md:gap-3 items-start transition-all shadow-[3px_3px_0_#4a3728] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_#4a3728]">
      <div
        className="w-7 h-10 md:w-8 md:h-11 flex-shrink-0 flex items-center justify-center text-xs md:text-sm border-2 border-border-dark bg-card-inset overflow-hidden"
        style={{ backgroundColor: manuscript.cover.placeholder.bgColor + '22' }}
      >
        {manuscript.cover.src ? (
          <img src={manuscript.cover.src} alt="" className="w-full h-full object-cover" />
        ) : (
          <img src={icon} alt="" className="w-4 h-4" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-xs md:text-sm font-bold text-ink truncate font-mono">{manuscript.title}</h3>
        <p className="text-[14px] md:text-[16px] text-muted mt-0.5 font-mono">
          {manuscript.genre} · {Math.round(manuscript.wordCount / 1000)}K字
        </p>
        {manuscript.synopsis && (
          <p
            onClick={() => setExpanded(!expanded)}
            className={`text-[14px] md:text-[16px] text-muted mt-1 leading-relaxed cursor-pointer hover:text-ink-light transition-colors ${expanded ? '' : 'line-clamp-2'}`}
          >
            {manuscript.synopsis}
            {!expanded && manuscript.synopsis.length > 60 && (
              <span className="text-progress ml-0.5">[...]</span>
            )}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-1 flex-shrink-0">
        <button
          onClick={() => startReview(manuscript.id)}
          className="text-[14px] md:text-[16px] px-1.5 md:px-2 py-0.5 md:py-1 bg-copper text-white border-2 border-border-dark font-mono cursor-pointer transition-all shadow-[2px_2px_0_#4a3728] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
        >
          审稿
        </button>
        <button
          onClick={() => rejectManuscript(manuscript.id)}
          className="text-[14px] md:text-[16px] px-1.5 md:px-2 py-0.5 md:py-1 bg-cream-dark text-muted border-2 border-border-dark font-mono cursor-pointer transition-all shadow-[2px_2px_0_#4a3728] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
        >
          退稿
        </button>
        <button
          onClick={() => shelveManuscript(manuscript.id)}
          className="text-[14px] md:text-[16px] px-1.5 md:px-2 py-0.5 md:py-1 bg-cream text-muted border-2 border-border-dark font-mono cursor-pointer transition-all shadow-[2px_2px_0_#4a3728] active:shadow-none active:translate-x-[1px] active:translate-y-[1px]"
        >
          搁置
        </button>
      </div>
    </div>
  )
}
