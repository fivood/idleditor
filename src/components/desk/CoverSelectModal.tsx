import type { Manuscript } from '@/core/types'
import { GENRE_ICONS } from '@/core/types'
import { useGameStore } from '@/store/gameStore'

interface Props {
  manuscript: Manuscript
  onConfirm: () => void
  onReject: () => void
  onCancel: () => void
}

export function CoverSelectModal({ manuscript, onConfirm, onReject, onCancel }: Props) {
  const icon = GENRE_ICONS[manuscript.genre] ?? '/icons/misc/book.svg'
  const displayCover = manuscript.cover.src ?? null
  const author = useGameStore(s => s.authors.get(manuscript.authorId))
  const permanentBonuses = useGameStore(s => s.permanentBonuses)

  const pubPrestige = manuscript.isUnsuitable ? -10 : 10
  const marketLabel = manuscript.marketPotential >= 75 ? '极高' : manuscript.marketPotential >= 50 ? '良好' : manuscript.marketPotential >= 30 ? '一般' : '较低'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-cream border-2 border-border-dark w-full max-w-[640px] max-h-[90vh] overflow-y-auto shadow-[6px_6px_0_#4a3728]">
        <div className="p-4 md:p-5 border-b-2 border-border-dark">
          <h2 className="text-sm md:text-base font-bold text-ink font-mono">查看封面</h2>
          <p className="text-[13px] md:text-xs text-muted mt-0.5 font-mono">《{manuscript.title}》· {manuscript.genre}</p>
        </div>

        <div className="p-4 md:p-5">
          {/* Desktop: side-by-side. Mobile: stack */}
          <div className="flex flex-col sm:flex-row gap-4 md:gap-5 mb-4">
            {/* Cover — fixed 5:7 ratio */}
            <div className="shrink-0 mx-auto sm:mx-0" style={{ width: 'min(200px, 50vw)', aspectRatio: '5/7' }}>
              <div className="w-full h-full border-2 border-border-dark bg-card-inset overflow-hidden">
                {displayCover ? (
                  <img src={displayCover} alt="" className="w-full h-full object-cover" onError={(e) => { const el = e.currentTarget; if (el.src.endsWith('.png')) el.src = el.src.replace('.png', '.svg'); else el.style.display = 'none' }} />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                    <img src={icon} alt="" className="w-10 h-10 md:w-12 md:h-12 opacity-50" />
                    <span className="text-[13px] md:text-xs text-muted font-mono">占位封面</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right panel: synopsis + stats */}
            <div className="flex-1 min-w-0 space-y-3 md:space-y-4">
              {/* Synopsis */}
              <div className="bg-card-inset border-2 border-border-dark p-2 md:p-3">
                <p className="text-[14px] text-muted font-mono mb-0.5">内容简介</p>
                <p className="text-[13px] md:text-xs text-ink leading-relaxed font-mono">{manuscript.synopsis}</p>
              </div>

              {/* Book stats + Author info side by side */}
              <div className="grid grid-cols-2 gap-2 md:gap-3">
                <div className="bg-cream-dark border-2 border-border-dark p-2 md:p-3">
                  <p className="text-[13px] md:text-xs text-muted font-mono mb-1.5">稿件数据</p>
                  <div className="space-y-1 text-[13px] md:text-xs font-mono">
                    <p className="flex justify-between"><span className="text-muted">品质</span> <span className="text-ink font-bold">Q{manuscript.quality}</span></p>
                    <p className="flex justify-between"><span className="text-muted">字数</span> <span className="text-ink">{Math.round(manuscript.wordCount / 1000)}K</span></p>
                    <p className="flex justify-between"><span className="text-muted">市场</span> <span className="text-ink">{marketLabel}</span></p>
                    <p className="flex justify-between"><span className="text-muted">声望</span> <span className={pubPrestige >= 0 ? 'text-green-600 font-bold' : 'text-copper-dark font-bold'}>{pubPrestige > 0 ? '+' : ''}{pubPrestige}</span></p>
                    {manuscript.meticulouslyEdited && <p className="text-progress text-right">已精校</p>}
                  </div>
                </div>

                <div className="bg-cream-dark border-2 border-border-dark p-2 md:p-3">
                  <p className="text-[13px] md:text-xs text-muted font-mono mb-1.5">作者</p>
                  {author ? (
                    <div className="space-y-1 text-[13px] md:text-xs font-mono">
                      <p className="text-ink font-bold truncate">{author.name}</p>
                      <p className="flex justify-between"><span className="text-muted">才华</span> <span className="text-ink">{author.talent}</span></p>
                      <p className="flex justify-between"><span className="text-muted">可靠</span> <span className="text-ink">{author.reliability}</span></p>
                      <p className="flex justify-between"><span className="text-muted">好感</span> <span className="text-ink">{author.affection}/100</span></p>
                    </div>
                  ) : (
                    <p className="text-[13px] text-muted font-mono">匿名投稿</p>
                  )}
                </div>
              </div>

              {/* Global bonuses */}
              <div className="bg-card-inset border-2 border-border-dark p-2 md:p-3">
                <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[13px] md:text-xs font-mono text-muted">
                  <p>铜像 品质+{permanentBonuses.manuscriptQualityBonus}</p>
                  <p>铜像 速度+{Math.round(permanentBonuses.editingSpeedBonus * 100)}%</p>
                  <p>铜像 版税+{Math.round((permanentBonuses.royaltyMultiplier - 1) * 100)}%</p>
                  <p>编辑 Lv.{useGameStore.getState().editorLevel}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-1.5 md:gap-2">
            <button onClick={onConfirm} className="flex-1 text-[13px] md:text-xs px-3 md:px-4 py-1.5 md:py-2 bg-copper text-white border-2 border-border-dark font-mono cursor-pointer shadow-[2px_2px_0_#4a3728] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all">
              确认出版
            </button>
            <button onClick={onReject} className="text-[13px] md:text-xs px-3 md:px-4 py-1.5 md:py-2 border-2 border-border-dark bg-copper-dark text-white font-mono cursor-pointer shadow-[2px_2px_0_#4a3728] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all">
              退稿
            </button>
            <button onClick={onCancel} className="text-[13px] md:text-xs px-3 md:px-4 py-1.5 md:py-2 border-2 border-border-dark text-muted font-mono cursor-pointer bg-cream shadow-[2px_2px_0_#4a3728] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all">
              搁置
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
