import type { CoverStyle, Manuscript } from '@/core/types'
import { COVER_STYLES, recommendCoverStyle } from '@/core/coverStyle'
import { coverTraits } from '@/art/covers'
import { getBaseTitle } from '@/core/titlePools'
import { useGameStore } from '@/store/gameStore'
import { useState } from 'react'
import { PixelCover } from '@/components/shared/PixelCover'

interface Props {
  manuscript: Manuscript
  onConfirm: (style: CoverStyle) => void
  onReject: () => void
  onCancel: () => void
}

export function CoverSelectModal({ manuscript, onConfirm, onReject, onCancel }: Props) {
  const author = useGameStore(s => s.authors.get(manuscript.authorId))
  const permanentBonuses = useGameStore(s => s.permanentBonuses)
  const playerName = useGameStore(s => s.playerName)
  const playTicks = useGameStore(s => s.playTicks)
  const setEditorNote = useGameStore(s => s.setEditorNote)
  // v2.6: 当前设计部等级——用于在标题区提示"由 Lv.N 设计部出品"
  const designLevel = useGameStore(s => {
    const d = [...s.departments.values()].find(x => x.type === 'design')
    return d?.level ?? 0
  })

  const recommended = recommendCoverStyle(manuscript)
  const [style, setStyle] = useState<CoverStyle>(recommended.style)
  const chosen = COVER_STYLES.find(x => x.id === style)!
  const traits = coverTraits(getBaseTitle(manuscript.title), manuscript.genre, style)
  const tags = traits.handDrawn ? ['手绘特装：三种取向共用同一幅画'] : [`主体：${traits.subject}`, `对比：${traits.contrast}`, traits.warm ? '暖色调' : '冷色调', ...(traits.prop ? [`附赠：${traits.prop}`] : [])]
  const pubPrestige = manuscript.isUnsuitable ? -10 : 10
  const marketLabel = manuscript.marketPotential >= 75 ? '极高' : manuscript.marketPotential >= 50 ? '良好' : manuscript.marketPotential >= 30 ? '一般' : '较低'
  const [noteInput, setNoteInput] = useState(manuscript.editorNote || '')
  const [noteSubmitted, setNoteSubmitted] = useState(!!manuscript.editorNote)

  return (
    // z-[100] 高于 Minimap z-50，避免 modal 底部按钮被桌沿菜单遮挡
    // 容器加 pb-20 给 Minimap 让出空间，让 modal 内容滚动时也不会卡在菜单后面
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 pb-20 md:pb-24 overflow-y-auto">
      <div className="px-panel w-full max-w-[640px] max-h-[88vh] overflow-y-auto my-auto"
        style={{ background: '#2a1810', color: '#ede0c8' }}>
        <div className="p-4 md:p-5 border-b-2 border-border-dark">
          <h2 className="text-sm md:text-base font-bold text-ink font-mono">确认封面 · 准备付印</h2>
          <p className="text-[13px] md:text-xs text-muted mt-0.5 font-mono">
            《{manuscript.title}》· {manuscript.genre}
            {designLevel > 0 && (
              <span className="ml-2" style={{ color: '#d4a85a' }}>
                · 设计部 Lv.{designLevel} 出品
              </span>
            )}
          </p>
        </div>

        <div className="p-4 md:p-5">
          {/* Desktop: side-by-side. Mobile: stack */}
          <div className="flex flex-col sm:flex-row gap-4 md:gap-5 mb-4">
            {/* Cover — 40×56 像素源 × 5 = 200×280 显示 */}
            <div className="shrink-0 mx-auto sm:mx-0">
              <PixelCover manuscript={manuscript} size="lg" coverStyle={style} />
              <div className="flex gap-1.5 mt-2 justify-center">
                {COVER_STYLES.map(opt => (
                  <button key={opt.id} onClick={() => setStyle(opt.id)} title={opt.blurb}
                    className="cursor-pointer p-0.5 border-2 font-mono text-[12px]"
                    style={{ borderColor: opt.id === style ? '#f5d878' : '#0a0806', background: '#1a0e08', color: opt.id === style ? '#f5d878' : '#b8a48a' }}>
                    <PixelCover manuscript={manuscript} width={50} coverStyle={opt.id} style={{ border: 'none' }} />
                    <div>{opt.label}{opt.id === recommended.style ? ' ★' : ''}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Right panel: synopsis + stats */}
            <div className="flex-1 min-w-0 space-y-3 md:space-y-4">
              {/* Cover direction */}
              <div className="bg-card-inset border-2 border-border-dark p-2 md:p-3">
                <p className="text-[14px] text-muted font-mono mb-0.5">封面取向 · {chosen.label}</p>
                <p className="text-[13px] md:text-xs text-ink leading-relaxed font-mono">{chosen.blurb}</p>
                <p className="text-[12px] text-muted font-mono mt-1">{tags.join(' · ')}</p>
                <p className="text-[12px] font-mono mt-1" style={{ color: '#d4a85a' }}>
                  ★ 设计部推荐「{COVER_STYLES.find(x => x.id === recommended.style)!.label}」：{recommended.reason}
                </p>
                <p className="text-[12px] text-muted font-mono">不听劝也不扣分，设计部只是下班晚一点。</p>
              </div>

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

          {/* Editor note */}
          <div className="bg-card-inset border-2 border-border-dark p-2 md:p-3 mb-3">
            <p className="text-[13px] md:text-[16px] text-muted font-mono mb-1">
              编辑批语{noteSubmitted ? '（已提交，出版前不可再编辑）' : ''}
            </p>
            {noteSubmitted ? (
              <p className="text-[13px] md:text-xs text-ink-light leading-relaxed font-mono italic">{noteInput}</p>
            ) : (
              <div className="flex gap-1.5">
                <input
                  value={noteInput}
                  onChange={e => setNoteInput(e.target.value)}
                  placeholder="审稿批注（最多80字）"
                  maxLength={80}
                  className="flex-1 text-[13px] md:text-xs bg-cream border border-border-medium px-2 py-1 font-mono outline-none focus:border-copper"
                />
                <button
                  onClick={() => {
                    if (noteInput.trim()) {
                      setEditorNote(manuscript.id, noteInput.trim())
                      setNoteSubmitted(true)
                      const state = useGameStore.getState()
                      state.addToast({
                        id: Math.random().toString(36).slice(2, 10),
                        text: `${playerName}飞快写下了对《${manuscript.title}》的批语：${noteInput.trim()}`,
                        type: 'info',
                        createdAt: playTicks,
                      })
                    }
                  }}
                  disabled={!noteInput.trim()}
                  className="text-[13px] md:text-xs px-2 py-1 bg-copper text-white border-2 border-border-dark font-mono cursor-pointer shadow-[2px_2px_0_#4a3728] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all disabled:bg-card-inset disabled:text-muted disabled:cursor-not-allowed"
                >
                  提交
                </button>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-1.5 md:gap-2">
            <button onClick={() => onConfirm(style)} className="flex-1 text-[13px] md:text-xs px-3 md:px-4 py-1.5 md:py-2 bg-copper text-white border-2 border-border-dark font-mono cursor-pointer shadow-[2px_2px_0_#4a3728] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all">
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
