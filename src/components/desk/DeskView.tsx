import { useGameStore } from '@/store/gameStore'
import { ManuscriptCard } from './ManuscriptCard'
import { LogPanel } from '@/components/shared/LogPanel'
import { useMemo } from 'react'

export function DeskView() {
  const manuscripts = useGameStore(s => s.manuscripts)
  const currencies = useGameStore(s => s.currencies)
  const isRunning = useGameStore(s => s.isRunning)

  const all = useMemo(() => [...manuscripts.values()], [manuscripts])
  const submitted = useMemo(() => all.filter(m => m.status === 'submitted'), [all])
  const inProgress = useMemo(
    () => all.filter(m => ['reviewing', 'editing', 'proofing', 'publishing'].includes(m.status)),
    [all],
  )

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
      {/* Main area */}
      <div className="lg:col-span-2 flex flex-col gap-4 overflow-y-auto">
        {/* Stats row */}
        <div className="flex items-center gap-4 text-xs text-muted">
          <span>{submitted.length} 篇稿件待处理</span>
          <span>{inProgress.length} 篇进行中</span>
          {!isRunning && (
            <span className="text-gold font-medium">已暂停 — 点击"运行中"继续</span>
          )}
        </div>

        {/* Welcome */}
        {currencies.revisionPoints === 0 && submitted.length === 0 && (
          <div className="bg-green-bg border border-green-border rounded-lg p-4 text-sm text-ink">
            <p className="font-medium text-green mb-1">欢迎来到闲散编辑社。</p>
            <p className="text-muted">
              稿件即将出现在你的书桌上。审读稿件来赚取修订点数，
              然后招募部门来让一切自动化。你需要的只是耐心——和一杯茶。
            </p>
          </div>
        )}

        {/* Submitted */}
        {submitted.length > 0 && (
          <section>
            <h2 className="text-sm font-medium text-ink mb-2">待审稿件</h2>
            <div className="grid gap-2">
              {submitted.map(ms => (
                <ManuscriptCard key={ms.id} manuscript={ms} />
              ))}
            </div>
          </section>
        )}

        {/* In progress */}
        {inProgress.length > 0 && (
          <section>
            <h2 className="text-sm font-medium text-ink mb-2">进行中</h2>
            <div className="grid gap-2">
              {inProgress.map(ms => (
                <div key={ms.id} className="bg-card border border-border rounded-lg p-3 flex items-center gap-3">
                  <span className="text-lg">{ms.status === 'reviewing' ? '👀' : ms.status === 'editing' ? '✍️' : ms.status === 'proofing' ? '🔍' : '🖨️'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{ms.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.round(ms.editingProgress * 100))}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted">{Math.round(ms.editingProgress * 100)}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Empty */}
        {submitted.length === 0 && inProgress.length === 0 && currencies.revisionPoints > 0 && (
          <div className="text-center py-8 text-muted text-sm">
            <p>稿件堆空了。</p>
            <p className="text-xs mt-1">新稿件大约每 20–30 秒到达。</p>
          </div>
        )}
      </div>

      {/* Log panel */}
      <div className="hidden lg:block min-h-0">
        <LogPanel />
      </div>
    </div>
  )
}
