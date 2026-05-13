import { useState, useEffect } from 'react'
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
  const [viewed, setViewed] = useState(false)
  const [flipping, setFlipping] = useState(false)
  const [flipProgress, setFlipProgress] = useState(0)
  const [expandSynopsis, setExpandSynopsis] = useState(false)
  const icon = GENRE_ICONS[manuscript.genre] ?? '/icons/misc/book.svg'

  // Animate flipping progress
  useEffect(() => {
    if (!flipping) return
    const duration = 1000 + manuscript.wordCount * 0.005 // ~1.5-2.5s depending on word count
    const start = Date.now()
    const timer = setInterval(() => {
      const elapsed = Date.now() - start
      const pct = Math.min(100, Math.round((elapsed / duration) * 100))
      setFlipProgress(pct)
      if (pct >= 100) {
        clearInterval(timer)
        setFlipping(false)
        setViewed(true)
      }
    }, 30)
    return () => clearInterval(timer)
  }, [flipping, manuscript.wordCount])

  const isBlurred = !viewed && !flipping

  return (
    <div className={`bg-cream border-2 p-2 md:p-3 flex gap-2 md:gap-3 items-start transition-all ${
      viewed ? 'border-border-dark shadow-[3px_3px_0_#4a3728] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_#4a3728]' :
      flipping ? 'border-progress shadow-[3px_3px_0_#3a6491]' :
      'border-border-medium'
    }`}>
      <div
        className={`w-7 h-10 md:w-8 md:h-11 flex-shrink-0 flex items-center justify-center border-2 border-border-dark bg-card-inset overflow-hidden transition-all ${isBlurred ? 'blur-[2px] opacity-50' : ''}`}
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

        {flipping ? (
          <div className="mt-2">
            <div className="h-2 bg-card-inset border-2 border-border-dark overflow-hidden">
              <div
                className="h-full bg-progress transition-all duration-75"
                style={{ width: `${flipProgress}%`, backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 4px, rgba(0,0,0,0.15) 4px, rgba(0,0,0,0.15) 8px)' }}
              />
            </div>
            <p className="text-[12px] text-progress font-mono mt-1">翻阅中... {flipProgress}%</p>
          </div>
        ) : viewed && manuscript.synopsis ? (
          <p
            onClick={() => setExpandSynopsis(!expandSynopsis)}
            className={`text-[14px] md:text-[16px] text-muted mt-1 leading-relaxed cursor-pointer hover:text-ink-light transition-colors ${expandSynopsis ? '' : 'line-clamp-2'}`}
          >
            {manuscript.synopsis}
            {!expandSynopsis && manuscript.synopsis.length > 60 && (
              <span className="text-progress ml-0.5">[...]</span>
            )}
          </p>
        ) : null}
      </div>
      <div className="flex flex-col gap-1 flex-shrink-0">
        {viewed ? (
          <>
            <button onClick={() => startReview(manuscript.id)} className="text-[14px] md:text-[16px] px-1.5 md:px-2 py-0.5 md:py-1 bg-copper text-white border-2 border-border-dark font-mono cursor-pointer transition-all shadow-[2px_2px_0_#4a3728] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]">
              审稿
            </button>
            <button onClick={() => rejectManuscript(manuscript.id)} className="text-[14px] md:text-[16px] px-1.5 md:px-2 py-0.5 md:py-1 bg-cream-dark text-muted border-2 border-border-dark font-mono cursor-pointer transition-all shadow-[2px_2px_0_#4a3728] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]">
              退稿
            </button>
            <button onClick={() => shelveManuscript(manuscript.id)} className="text-[14px] md:text-[16px] px-1.5 md:px-2 py-0.5 md:py-1 bg-cream text-muted border-2 border-border-dark font-mono cursor-pointer transition-all shadow-[2px_2px_0_#4a3728] active:shadow-none active:translate-x-[1px] active:translate-y-[1px]">
              搁置
            </button>
          </>
        ) : (
          <button
            onClick={() => !flipping && setFlipping(true)}
            disabled={flipping}
            className={`text-[14px] md:text-[16px] px-1.5 md:px-2 py-0.5 md:py-1 border-2 border-border-dark font-mono transition-all shadow-[2px_2px_0_#3a6491] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] ${
              flipping ? 'bg-cream-dark text-muted cursor-wait' : 'bg-progress text-white cursor-pointer'
            }`}
          >
            翻阅
          </button>
        )}
      </div>
    </div>
  )
}
