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
      <div className="bg-cream border-2 border-border-dark w-full max-w-[460px] max-h-[90vh] overflow-y-auto p-4 md:p-6 shadow-[6px_6px_0_#4a3728]">
        <h2 className="text-sm md:text-base font-bold text-ink mb-1 font-mono">查看封面</h2>
        <p className="text-[13px] md:text-xs text-muted mb-3 md:mb-4 font-mono">《{manuscript.title}》· {manuscript.genre}</p>

        {/* Synopsis */}
        <div className="bg-card-inset border-2 border-border-dark p-2 md:p-3 mb-3 md:mb-4">
          <p className="text-[13px] md:text-xs text-muted leading-relaxed font-mono">{manuscript.synopsis}</p>
        </div>

        {/* Cover preview */}
        <div className="mb-3 md:mb-4 border-2 border-border-dark bg-card-inset">
          <div className="w-full aspect-[3/4] max-h-[320px] flex items-center justify-center overflow-hidden">
            {displayCover ? (
              <img src={displayCover} alt="" className="w-full h-full object-cover" onError={(e) => { const el = e.currentTarget; if (el.src.endsWith('.png')) el.src = el.src.replace('.png', '.svg'); else el.style.display = 'none' }} />
            ) : (
              <div className="flex flex-col items-center gap-1 md:gap-2">
                <img src={icon} alt="" className="w-12 h-12 md:w-16 md:h-16" />
                <span className="text-[13px] md:text-xs text-muted font-mono">SVG 占位封面</span>
              </div>
            )}
          </div>
        </div>

        {/* Book stats + Author info */}
        <div className="grid grid-cols-2 gap-2 md:gap-3 mb-3 md:mb-4">
          <div className="bg-cream-dark border-2 border-border-dark p-2 md:p-3">
            <p className="text-[13px] md:text-xs text-muted font-mono mb-1.5">稿件数据</p>
            <div className="space-y-1 text-[13px] md:text-xs font-mono">
              <p className="flex justify-between"><span className="text-muted">品质</span> <span className="text-ink font-bold">Q{manuscript.quality}</span></p>
              <p className="flex justify-between"><span className="text-muted">字数</span> <span className="text-ink">{Math.round(manuscript.wordCount / 1000)}K</span></p>
              <p className="flex justify-between"><span className="text-muted">市场潜力</span> <span className="text-ink">{marketLabel}</span></p>
              <p className="flex justify-between"><span className="text-muted">出版声望</span> <span className={pubPrestige >= 0 ? 'text-green-600 font-bold' : 'text-copper-dark font-bold'}>{pubPrestige > 0 ? '+' : ''}{pubPrestige}</span></p>
              {manuscript.meticulouslyEdited && <p className="text-progress text-right">已精校</p>}
            </div>
          </div>

          <div className="bg-cream-dark border-2 border-border-dark p-2 md:p-3">
            <p className="text-[13px] md:text-xs text-muted font-mono mb-1.5">作者信息</p>
            {author ? (
              <div className="space-y-1 text-[13px] md:text-xs font-mono">
                <p className="text-ink font-bold truncate">{author.name}</p>
                <p className="flex justify-between"><span className="text-muted">才华</span> <span className="text-ink">{author.talent}</span></p>
                <p className="flex justify-between"><span className="text-muted">可靠</span> <span className="text-ink">{author.reliability}</span></p>
                <p className="flex justify-between"><span className="text-muted">好感</span> <span className="text-ink">{author.affection}/100</span></p>
                <p className="flex justify-between"><span className="text-muted">出版</span> <span className="text-ink">{[...useGameStore.getState().manuscripts.values()].filter(m => m.authorId === author.id && m.status === 'published').length} 本</span></p>
              </div>
            ) : (
              <p className="text-[13px] text-muted font-mono">匿名投稿</p>
            )}
          </div>
        </div>

        {/* Global bonuses summary */}
        <div className="bg-card-inset border-2 border-border-dark p-2 md:p-3 mb-3 md:mb-4">
          <p className="text-[13px] md:text-xs text-muted font-mono mb-1">当前加成</p>
          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[13px] md:text-xs font-mono">
            <p className="text-muted">铜像加成 品质+{permanentBonuses.manuscriptQualityBonus}</p>
            <p className="text-muted">铜像加成 速度+{Math.round(permanentBonuses.editingSpeedBonus * 100)}%</p>
            <p className="text-muted">铜像加成 版税+{Math.round((permanentBonuses.royaltyMultiplier - 1) * 100)}%</p>
            <p className="text-muted">编辑等级 Lv.{useGameStore.getState().editorLevel}</p>
          </div>
        </div>

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
  )
}
