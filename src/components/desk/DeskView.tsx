import { useState, useMemo } from 'react'
import { useGameStore } from '@/store/gameStore'
import { ManuscriptCard } from './ManuscriptCard'
import { LogPanel } from '@/components/shared/LogPanel'
import { CoverSelectModal } from './CoverSelectModal'
import type { Manuscript } from '@/core/types'

const STAGE_ICONS: Record<string, string> = {
  reviewing: '👀',
  editing: '✍️',
  proofing: '🔍',
  cover_select: '🎨',
  publishing: '🖨️',
}

const STAGE_LABELS: Record<string, string> = {
  reviewing: '审稿',
  editing: '编辑',
  proofing: '校对',
  cover_select: '待选封面',
  publishing: '付印',
}

const STAGE_COLORS: Record<string, string> = {
  reviewing: 'bg-amber-400',
  editing: 'bg-green',
  proofing: 'bg-blue-400',
  cover_select: 'bg-pink-400',
  publishing: 'bg-purple-400',
}

export function DeskView() {
  const manuscripts = useGameStore(s => s.manuscripts)
  const currencies = useGameStore(s => s.currencies)
  const isRunning = useGameStore(s => s.isRunning)
  const confirmCover = useGameStore(s => s.confirmCover)

  const [coverModalId, setCoverModalId] = useState<string | null>(null)

  const all = useMemo(() => [...manuscripts.values()], [manuscripts])
  const submitted = useMemo(() => all.filter(m => m.status === 'submitted'), [all])
  const inProgress = useMemo(
    () => all.filter(m =>
      ['reviewing', 'editing', 'proofing', 'cover_select', 'publishing'].includes(m.status)
    ),
    [all],
  )

  const modalMs = coverModalId ? manuscripts.get(coverModalId) : null

  return (
    <div className="grid grid-cols-[3fr_1.2fr] gap-4 h-full p-5">
      {/* Main content */}
      <div className="flex flex-col gap-3 min-h-0">
        <div className="flex items-center gap-3 text-sm text-muted shrink-0">
          <span className="text-ink font-medium">📥 {submitted.length} 篇待审</span>
          <span className="text-ink font-medium">⚙️ {inProgress.length} 篇进行中</span>
          {!isRunning && <span className="text-gold">已暂停</span>}
        </div>

        {currencies.revisionPoints === 0 && submitted.length === 0 && (
          <div className="bg-green-bg border border-green-border rounded-lg p-4 text-sm text-ink shrink-0">
            <p className="font-medium text-green mb-1">欢迎来到闲散编辑社。</p>
            <p className="text-muted">
              稿件即将出现在你的书桌上。审读稿件来赚取修订点数，
              然后招募部门来让一切自动化。你需要的只是耐心——和一杯茶。
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 flex-1 min-h-0">
          <div className="flex flex-col min-h-0">
            <h2 className="text-sm font-medium text-muted uppercase tracking-wider mb-2 shrink-0">投稿池</h2>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {submitted.length === 0 && (
                <div className="text-center py-8 text-muted text-xs">
                  <p>稿件堆空了</p><p className="mt-1">等待新投稿……</p>
                </div>
              )}
              {submitted.map(ms => <ManuscriptCard key={ms.id} manuscript={ms} />)}
            </div>
          </div>

          <div className="flex flex-col min-h-0">
            <h2 className="text-sm font-medium text-muted uppercase tracking-wider mb-2 shrink-0">编辑流水线</h2>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {inProgress.length === 0 && (
                <div className="text-center py-8 text-muted text-xs">
                  <p>流水线空闲</p><p className="mt-1">从投稿池审稿开始</p>
                </div>
              )}
              {inProgress.map(ms => (
                <PipelineCard
                  key={ms.id}
                  manuscript={ms}
                  onSelectCover={() => setCoverModalId(ms.id)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="min-h-0">
        <LogPanel />
      </div>

      {/* Cover select modal */}
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
  const color = STAGE_COLORS[stage] ?? 'bg-green'

  if (stage === 'cover_select') {
    return (
      <div className="bg-card border border-pink-200 rounded-lg p-3 hover:border-pink-300 transition-colors">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-base">{STAGE_ICONS[stage]}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-ink truncate">{ms.title}</p>
            <p className="text-xs text-muted">待选封面 — 点击下方选择</p>
          </div>
        </div>
        <button
          onClick={onSelectCover}
          className="w-full text-sm px-3 py-2 rounded-lg bg-pink-50 text-pink-600 border border-pink-200 hover:bg-pink-100 transition-colors cursor-pointer"
        >
          选择封面
        </button>
      </div>
    )
  }

  return (
    <div className="bg-card border border-border rounded-lg p-3 hover:border-green-border/50 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base flex-shrink-0">{STAGE_ICONS[stage] ?? '📖'}</span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink truncate">{ms.title}</p>
            <p className="text-xs text-muted">{STAGE_LABELS[stage] ?? stage}</p>
          </div>
        </div>
        <span className="text-sm font-mono font-medium text-green tabular-nums flex-shrink-0 ml-2">{pct}%</span>
      </div>
      <div className="h-2.5 bg-border rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-muted mt-1 text-right">{pct < 100 ? '处理中...' : '完成'}</p>
    </div>
  )
}
