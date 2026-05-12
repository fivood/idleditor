import { useState, useMemo } from 'react'
import { useGameStore } from '@/store/gameStore'
import { ManuscriptCard } from './ManuscriptCard'
import { LogPanel } from '@/components/shared/LogPanel'
import { CoverSelectModal } from './CoverSelectModal'
import type { Manuscript } from '@/core/types'

const STAGE_ICONS: Record<string, string> = {
  reviewing: '👀', editing: '✍️', proofing: '🔍',
  cover_select: '🎨', publishing: '🖨️',
}

const STAGE_LABELS: Record<string, string> = {
  reviewing: '审稿', editing: '编辑', proofing: '校对',
  cover_select: '待选封面', publishing: '付印',
}

export function DeskView() {
  const manuscripts = useGameStore(s => s.manuscripts)
  const currencies = useGameStore(s => s.currencies)
  const isRunning = useGameStore(s => s.isRunning)
  const confirmCover = useGameStore(s => s.confirmCover)

  const [coverModalId, setCoverModalId] = useState<string | null>(null)

  const all = useMemo(() => [...manuscripts.values()], [manuscripts])
  const submitted = useMemo(() => all.filter(m => m.status === 'submitted'), [all])
  const inProgress = useMemo(() =>
    all.filter(m => ['reviewing', 'editing', 'proofing', 'cover_select', 'publishing'].includes(m.status)),
    [all],
  )

  const modalMs = coverModalId ? manuscripts.get(coverModalId) : null

  return (
    <div className="grid grid-cols-[3fr_1.2fr] gap-4 h-full p-4">
      <div className="flex flex-col gap-3 min-h-0">
        <div className="flex items-center gap-3 text-xs text-muted shrink-0 font-mono">
          <span className="text-ink font-bold border border-border-dark px-2 py-0.5 bg-cream">📥 {submitted.length} 待审</span>
          <span className="text-ink font-bold border border-border-dark px-2 py-0.5 bg-cream">⚙️ {inProgress.length} 进行中</span>
          {!isRunning && <span className="text-copper font-bold">⏸ 已暂停</span>}
        </div>

        {currencies.revisionPoints === 0 && submitted.length === 0 && (
          <div className="bg-cream border-2 border-border-dark p-4 text-sm shrink-0 shadow-[3px_3px_0_#4a3728]">
            <p className="font-bold text-ink mb-1 font-mono">欢迎来到永夜出版社。</p>
            <p className="text-muted text-xs leading-relaxed">
              稿件即将出现在你的书桌上。审读稿件来赚取修订点数，
              然后招募部门来让一切自动化。你需要的只是耐心——和一杯茶。
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 flex-1 min-h-0">
          <div className="flex flex-col min-h-0">
            <h2 className="text-xs font-bold text-muted uppercase tracking-wider mb-2 shrink-0 font-mono">📥 投稿池</h2>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {submitted.length === 0 && (
                <div className="text-center py-8 text-muted text-xs font-mono">
                  <p>稿件堆空了</p><p className="mt-1">等待新投稿……</p>
                </div>
              )}
              {submitted.map(ms => <ManuscriptCard key={ms.id} manuscript={ms} />)}
            </div>
          </div>

          <div className="flex flex-col min-h-0">
            <h2 className="text-xs font-bold text-muted uppercase tracking-wider mb-2 shrink-0 font-mono">⚙️ 编辑流水线</h2>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {inProgress.length === 0 && (
                <div className="text-center py-8 text-muted text-xs font-mono">
                  <p>流水线空闲</p><p className="mt-1">从投稿池审稿开始</p>
                </div>
              )}
              {inProgress.map(ms => (
                <PipelineCard key={ms.id} manuscript={ms} onSelectCover={() => setCoverModalId(ms.id)} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="min-h-0">
        <LogPanel />
      </div>

      {modalMs && modalMs.status === 'cover_select' && (
        <CoverSelectModal
          manuscript={modalMs}
          onConfirm={() => { confirmCover(modalMs.id); setCoverModalId(null) }}
          onCancel={() => setCoverModalId(null)}
        />
      )}
    </div>
  )
}

function PipelineCard({ manuscript: ms, onSelectCover }: { manuscript: Manuscript; onSelectCover: () => void }) {
  const stage = ms.status
  const pct = Math.min(100, Math.round(ms.editingProgress * 100))

  if (stage === 'cover_select') {
    return (
      <div className="bg-cream border-2 border-border-dark p-3 shadow-[3px_3px_0_#4a3728]">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-base">{STAGE_ICONS[stage]}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-ink truncate font-mono">{ms.title}</p>
            <p className="text-xs text-copper font-bold">待选封面</p>
          </div>
        </div>
        <button
          onClick={onSelectCover}
          className="w-full text-xs px-3 py-2 bg-copper text-white border-2 border-border-dark font-mono cursor-pointer shadow-[2px_2px_0_#4a3728] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"
        >
          选择封面
        </button>
      </div>
    )
  }

  return (
    <div className="bg-cream border-2 border-border-dark p-3 shadow-[3px_3px_0_#4a3728]">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base flex-shrink-0">{STAGE_ICONS[stage] ?? '📖'}</span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-ink truncate font-mono">{ms.title}</p>
            <p className="text-xs text-muted">{STAGE_LABELS[stage] ?? stage}</p>
          </div>
        </div>
        <span className="text-sm font-mono font-bold text-copper tabular-nums flex-shrink-0 ml-2">{pct}%</span>
      </div>
      <div className="h-3 bg-card-inset border-2 border-border-dark overflow-hidden">
        <div
          className="h-full bg-copper border-r-2 border-border-dark transition-all duration-700"
          style={{ width: `${pct}%`, backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 4px, rgba(0,0,0,0.15) 4px, rgba(0,0,0,0.15) 8px)' }}
        />
      </div>
      <p className="text-[10px] text-muted mt-1 text-right font-mono">{pct < 100 ? '处理中...' : '完成'}</p>
    </div>
  )
}
