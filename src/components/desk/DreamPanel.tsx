import { useMemo, useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { PixelTextButton } from '@/components/shared/PixelTextButton'
import { PixelProgressBar } from '@/components/shared/PixelProgressBar'
import { GENRE_LABELS, type Genre } from '@/core/types'
import { sortMemoriesForBrowsing } from '@/core/memories'

const GENRES: Genre[] = ['sci-fi', 'mystery', 'suspense', 'social-science', 'hybrid', 'light-novel']

const MAX_SELECTED_MEMORIES = 5

const MEMORY_TYPE_LABELS: Record<string, string> = {
  publish: '📘 出版', review: '👀 审稿', rejection: '✗ 退稿',
  author: '✍️ 作者', random: '🎲 偶遇', decision: '⚖ 抉择', milestone: '🏆 里程碑',
}

const TIER_OPTIONS = [
  { cost: 5,  label: '速写', desc: '~15 min · 12K 字 · 品质 40-50' },
  { cost: 10, label: '短篇', desc: '~30 min · 20K 字 · 品质 50-60' },
  { cost: 20, label: '中篇', desc: '~60 min · 50K 字 · 品质 65-75' },
  { cost: 30, label: '长篇', desc: '~90 min · 80K 字 · 品质 75-85' },
  { cost: 50, label: '巨著', desc: '~3 h · 150K 字 · 品质 85-95' },
]

/**
 * 梦境创作面板（桌面房间茶杯按钮触发）。
 */
export function DreamPanel({ onClose: _onClose }: { onClose: () => void }) {
  const inspiration = useGameStore(s => s.currencies.inspiration)
  const activeDream = useGameStore(s => s.activeDream)
  const startDream = useGameStore(s => s.startDream)
  const cancelDream = useGameStore(s => s.cancelDream)
  const editorLevel = useGameStore(s => s.editorLevel)
  const inspirationDailyGained = useGameStore(s => s.inspirationDailyGained)

  const memories = useGameStore(s => s.memories ?? { current: [], heirloom: [] })
  const allMemories = useMemo(() => sortMemoriesForBrowsing([...memories.current, ...memories.heirloom]), [memories])

  const [title, setTitle] = useState('')
  const [selectedGenre, setSelectedGenre] = useState<Genre>('hybrid')
  const [selectedTier, setSelectedTier] = useState(10)
  const [selectedMemIds, setSelectedMemIds] = useState<Set<string>>(new Set())

  const toggleMem = (id: string) => {
    setSelectedMemIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else if (next.size < MAX_SELECTED_MEMORIES) {
        next.add(id)
      }
      return next
    })
  }

  if (activeDream) {
    const pct = Math.min(100, Math.round((activeDream.progressTicks / activeDream.totalTicks) * 100))
    const remainingTicks = Math.max(0, activeDream.totalTicks - activeDream.progressTicks)
    const levelBoost = 1 + Math.floor(editorLevel / 5) * 0.5
    const remainingMin = Math.ceil(remainingTicks / levelBoost / 60)
    return (
      <div className="space-y-3" style={{ color: '#ede0c8' }}>
        <div>
          <div className="text-xs font-mono mb-1" style={{ color: '#b8a48a' }}>梦境中正在写作</div>
          <div className="text-base font-bold font-mono" style={{ color: '#f5d878' }}>
            《{activeDream.title}》
          </div>
          <div className="text-[11px] mt-0.5 font-mono" style={{ color: '#b8a48a' }}>
            {GENRE_LABELS[activeDream.genre]} · 投入 {activeDream.inspirationSpent} ✨
          </div>
        </div>
        <div>
          <PixelProgressBar value={pct} height={12} cells={20} />
          <div className="text-[11px] font-mono mt-1 flex justify-between" style={{ color: '#b8a48a' }}>
            <span>进度 {pct}%</span>
            <span>{remainingMin >= 60 ? `${Math.floor(remainingMin / 60)} 小时 ${remainingMin % 60} 分` : `${remainingMin} 分钟`}剩余</span>
          </div>
        </div>
        <p className="text-[11px] font-mono italic leading-relaxed" style={{ color: '#8a7a5a' }}>
          梦中你伏在打字机前，字句自动浮现。门外猫在打鼾，月光透过哥特窗照在键盘上。
        </p>
        <div className="pt-2 border-t" style={{ borderColor: '#5c3a1f' }}>
          <PixelTextButton variant="danger" size="sm" onClick={cancelDream}>中断梦境</PixelTextButton>
          <span className="text-[10px] ml-2 font-mono" style={{ color: '#8a7a5a' }}>
            （退还一半灵感）
          </span>
        </div>
      </div>
    )
  }

  const canAfford = inspiration >= selectedTier

  return (
    <div className="space-y-3" style={{ color: '#ede0c8' }}>
      {/* 灵感统计 */}
      <div className="flex items-center justify-between p-2 border-2" style={{ background: '#1a0e08', borderColor: '#5c3a1f' }}>
        <div>
          <div className="text-[10px] font-mono" style={{ color: '#b8a48a' }}>当前灵感</div>
          <div className="text-2xl font-bold font-mono tabular-nums" style={{ color: '#f5d878' }}>
            ✨ {inspiration}
          </div>
        </div>
        <div className="text-right text-[10px] font-mono" style={{ color: '#8a7a5a' }}>
          <div>今日已获 {inspirationDailyGained}/30</div>
          <div>审稿 +1 · 出版 +2</div>
        </div>
      </div>

      {/* 标题 */}
      <div>
        <div className="text-[11px] font-mono mb-1" style={{ color: '#b8a48a' }}>标题（可空，梦境会给一个）</div>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="比如《转生到自己的梦里》"
          maxLength={30}
          className="w-full px-2 py-1.5 text-sm font-mono border-2"
          style={{ background: '#1a0e08', borderColor: '#5c3a1f', color: '#ede0c8' }}
        />
      </div>

      {/* 题材 */}
      <div>
        <div className="text-[11px] font-mono mb-1" style={{ color: '#b8a48a' }}>题材</div>
        <div className="grid grid-cols-3 gap-1">
          {GENRES.map(g => (
            <button
              key={g}
              onClick={() => setSelectedGenre(g)}
              className="text-[11px] py-1 font-mono border-2"
              style={{
                background: selectedGenre === g ? '#b8763b' : '#1a0e08',
                borderColor: selectedGenre === g ? '#f5d878' : '#5c3a1f',
                color: selectedGenre === g ? '#fff8e8' : '#d4a85a',
                cursor: 'pointer',
              }}
            >
              {GENRE_LABELS[g]}
            </button>
          ))}
        </div>
      </div>

      {/* 投入档位 */}
      <div>
        <div className="text-[11px] font-mono mb-1" style={{ color: '#b8a48a' }}>灵感投入</div>
        <div className="space-y-1">
          {TIER_OPTIONS.map(tier => {
            const affordable = inspiration >= tier.cost
            const active = selectedTier === tier.cost
            return (
              <button
                key={tier.cost}
                onClick={() => affordable && setSelectedTier(tier.cost)}
                disabled={!affordable}
                className="w-full text-left p-2 font-mono border-2 flex items-center justify-between"
                style={{
                  background: active ? '#3d2614' : '#1a0e08',
                  borderColor: active ? '#f5d878' : '#5c3a1f',
                  color: affordable ? '#ede0c8' : '#5a4a38',
                  cursor: affordable ? 'pointer' : 'not-allowed',
                  opacity: affordable ? 1 : 0.5,
                }}
              >
                <div>
                  <div className="text-sm font-bold" style={{ color: active ? '#f5d878' : (affordable ? '#d4a85a' : '#5a4a38') }}>
                    {tier.label}
                  </div>
                  <div className="text-[10px]" style={{ color: '#8a7a5a' }}>{tier.desc}</div>
                </div>
                <div className="text-base font-bold tabular-nums">
                  ✨ {tier.cost}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* 灵感来源（玩家记忆选择） */}
      {allMemories.length > 0 && (
        <div>
          <div className="text-[11px] font-mono mb-1 flex justify-between" style={{ color: '#b8a48a' }}>
            <span>灵感来源（可选，最多 {MAX_SELECTED_MEMORIES} 条）</span>
            <span style={{ color: selectedMemIds.size > 0 ? '#f5d878' : '#5a4a38' }}>
              已选 {selectedMemIds.size}/{MAX_SELECTED_MEMORIES}
            </span>
          </div>
          <div
            className="max-h-32 overflow-y-auto border-2 p-1.5 space-y-1"
            style={{ background: '#1a0e08', borderColor: '#5c3a1f' }}
          >
            {allMemories.map(m => {
              const checked = selectedMemIds.has(m.id)
              const disabled = !checked && selectedMemIds.size >= MAX_SELECTED_MEMORIES
              const isHeirloom = memories.heirloom.some(h => h.id === m.id)
              return (
                <label
                  key={m.id}
                  className="flex items-start gap-1.5 text-[11px] font-mono leading-snug cursor-pointer"
                  style={{
                    opacity: disabled ? 0.4 : 1,
                    cursor: disabled ? 'not-allowed' : 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={disabled}
                    onChange={() => toggleMem(m.id)}
                    className="mt-0.5 accent-amber-400 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div style={{ color: checked ? '#f5d878' : '#ede0c8' }}>{m.text}</div>
                    <div className="text-[10px] mt-0.5" style={{ color: isHeirloom ? '#b8763b' : '#8a7a5a' }}>
                      {MEMORY_TYPE_LABELS[m.type] ?? m.type} · 第{m.capturedYear}年
                      {isHeirloom && ` · 历世传家`}
                      {' · 重要度 '}{m.importance}
                    </div>
                  </div>
                </label>
              )
            })}
          </div>
          {selectedMemIds.size === 0 && (
            <div className="text-[10px] font-mono mt-1 italic" style={{ color: '#8a7a5a' }}>
              （不选则任由梦境自由展开。选了的记忆会被 LLM 编织进书的简介）
            </div>
          )}
        </div>
      )}

      {/* 启动按钮 */}
      <div className="pt-2 border-t" style={{ borderColor: '#5c3a1f' }}>
        <PixelTextButton
          variant="primary"
          size="md"
          disabled={!canAfford}
          onClick={() => startDream(title, selectedGenre, selectedTier, Array.from(selectedMemIds))}
        >
          {canAfford ? `进入梦境（消耗 ${selectedTier} ✨）` : '灵感不足'}
        </PixelTextButton>
      </div>
    </div>
  )
}
