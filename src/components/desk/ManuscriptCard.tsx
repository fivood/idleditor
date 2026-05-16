import { useState, useEffect, useMemo } from 'react'
import type { Genre, Manuscript } from '@/core/types'
import { useGameStore } from '@/store/gameStore'
import { PaperCard } from '@/components/shared/PaperCard'

// 不同题材的稿件用不同颜色的"题材带"区分（替代原来的整张色卡）
const GENRE_BAND_COLORS: Record<Genre, string> = {
  'sci-fi':         '#3b82f6',  // 蓝
  mystery:          '#8b5cf6',  // 紫
  suspense:         '#ef4444',  // 红
  'social-science': '#d97706',  // 琥珀
  hybrid:           '#10b981',  // 绿
  'light-novel':    '#ec4899',  // 粉
}

// 基于 ID 稳定地生成微小旋转 + 是否有咖啡渍 + 是否有回形针
function deterministicNoise(id: string): { tilt: number; hasStain: boolean; hasClip: boolean } {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0
  const tilt = ((h % 7) - 3) * 0.3  // -0.9 ~ +0.9 度
  const hasStain = (h & 0x10) !== 0  // ~50%
  const hasClip = (h & 0x20) === 0   // ~50%
  return { tilt, hasStain, hasClip }
}

interface Props {
  manuscript: Manuscript
}

export function ManuscriptCard({ manuscript }: Props) {
  const startReview = useGameStore(s => s.startReview)
  const rejectManuscript = useGameStore(s => s.rejectManuscript)
  const shelveManuscript = useGameStore(s => s.shelveManuscript)
  const authors = useGameStore(s => s.authors)
  const getTalentBonuses = useGameStore(s => s.getTalentBonuses)
  const [viewed, setViewed] = useState(false)
  const [flipping, setFlipping] = useState(false)
  const [flipProgress, setFlipProgress] = useState(0)
  const [expandSynopsis, setExpandSynopsis] = useState(false)

  const noise = useMemo(() => deterministicNoise(manuscript.id), [manuscript.id])
  const bandColor = GENRE_BAND_COLORS[manuscript.genre] ?? GENRE_BAND_COLORS.hybrid

  // Animate flipping progress
  useEffect(() => {
    if (!flipping) return
    const bonuses = getTalentBonuses()
    const speedMult = 1 + (bonuses.flipSpeed || 0) - (bonuses.flipSpeedPenalty || 0)
    const baseDuration = 1000 + manuscript.wordCount * 0.005
    const duration = baseDuration / Math.max(0.3, speedMult)
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
  }, [flipping, manuscript.wordCount, getTalentBonuses])

  const author = authors.get(manuscript.authorId)
  const isSignedAuthor = author && author.tier !== 'new'

  const impression = manuscript.marketPotential < 25 ? { text: '初筛存疑', color: 'text-amber-700' }
    : manuscript.marketPotential < 45 ? { text: '尚需斟酌', color: 'text-muted' }
    : manuscript.marketPotential < 65 ? { text: '可堪一读', color: 'text-progress' }
    : { text: '潜力之作', color: 'text-copper' }

  return (
    <PaperCard
      tilt={noise.tilt}
      highlighted={flipping}
      className={`flex gap-2 md:gap-3 items-start overflow-hidden ${
        isSignedAuthor ? 'border-l-4 border-l-copper' : ''
      }`}
    >
      {/* 左侧题材色带（替代原来的整张色卡缩略图）*/}
      <div
        aria-hidden
        className="self-stretch w-2 shrink-0"
        style={{ backgroundColor: bandColor }}
      />

      {/* 回形针装饰（仅未审阅时显示）*/}
      {!viewed && !flipping && noise.hasClip && (
        <div
          aria-hidden
          className="absolute -top-1.5 left-3 pointer-events-none"
          style={{ filter: 'drop-shadow(1px 1px 0 rgba(0,0,0,0.2))' }}
        >
          <svg width="14" height="22" viewBox="0 0 20 40">
            <path d="M 10 4 Q 4 4 4 10 L 4 30 Q 4 36 10 36 Q 16 36 16 30 L 16 14 Q 16 10 12 10 Q 8 10 8 14 L 8 28"
              stroke="#a89072" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          </svg>
        </div>
      )}

      {/* 咖啡渍装饰（随机点缀）*/}
      {noise.hasStain && (
        <div
          aria-hidden
          className="absolute right-2 bottom-1 pointer-events-none opacity-60"
          style={{ width: 28, height: 28 }}
        >
          <svg viewBox="0 0 60 60" width="28" height="28">
            <ellipse cx="30" cy="30" rx="22" ry="20" fill="#8b6b3e" opacity="0.15" />
            <ellipse cx="30" cy="30" rx="18" ry="16" fill="none" stroke="#6b4f2a" strokeWidth="0.8" opacity="0.3" />
            <ellipse cx="28" cy="28" rx="12" ry="10" fill="#a08060" opacity="0.1" />
          </svg>
        </div>
      )}

      {/* 主体内容（右侧）*/}
      <div className="flex-1 min-w-0 py-2 md:py-3 pr-1">
        <h3 className="text-xs md:text-sm font-bold text-ink truncate font-mono">{manuscript.title}</h3>
        <p className="text-[14px] md:text-[16px] text-muted mt-0.5 font-mono">
          <span className={`font-bold mr-1 ${impression.color}`}>{impression.text}</span>·
          {' '}{manuscript.genre} · {Math.round(manuscript.wordCount / 1000)}K字
          {author && (() => {
            const tierLabel = author.tier === 'new' ? '' : author.tier === 'signed' ? '· 已签约' : author.tier === 'known' ? '· 知名作者' : '· 传奇作者'
            return <span className="text-copper font-bold ml-1">{author.name}{tierLabel}</span>
          })()}
          {!viewed && manuscript.marketPotential > 60 && <span className="text-progress ml-1">· 潜力高</span>}
        </p>

        {flipping ? (
          <div className="mt-2">
            <div className="h-2 bg-card-inset border-2 border-border-dark overflow-hidden">
              <div
                className="h-full bg-progress transition-all duration-75"
                style={{
                  width: `${flipProgress}%`,
                  backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 4px, rgba(0,0,0,0.15) 4px, rgba(0,0,0,0.15) 8px)',
                }}
              />
            </div>
            <p className="text-[12px] text-progress font-mono mt-1">翻阅中... {flipProgress}%</p>
          </div>
        ) : viewed && manuscript.synopsis ? (
          <p
            onClick={() => setExpandSynopsis(!expandSynopsis)}
            className={`text-[14px] md:text-[16px] text-muted mt-1 leading-relaxed cursor-pointer hover:text-ink-light transition-colors ${expandSynopsis ? '' : 'line-clamp-3'}`}
          >
            {manuscript.synopsis}
            {!expandSynopsis && manuscript.synopsis.length > 60 && (
              <span className="text-progress ml-0.5">[...]</span>
            )}
          </p>
        ) : null}
      </div>

      {/* 操作按钮 */}
      <div className="flex flex-col gap-1 flex-shrink-0 py-2 md:py-3 pr-2 md:pr-3">
        {viewed ? (
          <>
            <button onClick={() => startReview(manuscript.id)} className="text-[14px] md:text-[16px] px-1.5 md:px-2 py-0.5 md:py-1 bg-copper text-white border-2 border-border-dark font-mono cursor-pointer transition-all shadow-[2px_2px_0_#4a3728] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]">
              审稿
            </button>
            <button onClick={() => rejectManuscript(manuscript.id)} className="text-[14px] md:text-[16px] px-1.5 md:px-2 py-0.5 md:py-1 bg-cream-dark/80 text-muted border-2 border-border-dark font-mono cursor-pointer transition-all shadow-[2px_2px_0_#4a3728] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]">
              退稿
            </button>
            <button onClick={() => shelveManuscript(manuscript.id)} className="text-[14px] md:text-[16px] px-1.5 md:px-2 py-0.5 md:py-1 bg-cream/80 text-muted border-2 border-border-dark font-mono cursor-pointer transition-all shadow-[2px_2px_0_#4a3728] active:shadow-none active:translate-x-[1px] active:translate-y-[1px]">
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
    </PaperCard>
  )
}
