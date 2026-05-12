import { useGameStore } from '@/store/gameStore'
import { ManuscriptCard } from './ManuscriptCard'
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
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4 text-xs text-muted">
        <span>{submitted.length} manuscript{submitted.length !== 1 ? 's' : ''} waiting</span>
        <span>{inProgress.length} in progress</span>
        {!isRunning && (
          <span className="text-gold font-medium">Paused — press Start to continue</span>
        )}
      </div>

      {currencies.revisionPoints === 0 && submitted.length === 0 && (
        <div className="bg-green-bg border border-green-border rounded-lg p-4 text-sm text-ink">
          <p className="font-medium text-green mb-1">Welcome to Idle Editor.</p>
          <p className="text-muted">
            Manuscripts will appear in the slush pile shortly. Review them to earn Revision Points,
            then hire departments to automate the process. All you need is patience — and perhaps a cup of tea.
          </p>
        </div>
      )}

      {submitted.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-ink mb-2">Slush Pile</h2>
          <div className="grid gap-2">
            {submitted.map(ms => (
              <ManuscriptCard key={ms.id} manuscript={ms} />
            ))}
          </div>
        </section>
      )}

      {inProgress.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-ink mb-2">In Progress</h2>
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

      {submitted.length === 0 && inProgress.length === 0 && currencies.revisionPoints > 0 && (
        <div className="text-center py-8 text-muted text-sm">
          <p>The slush pile is empty.</p>
          <p className="text-xs mt-1">New submissions arrive every 20–30 seconds.</p>
        </div>
      )}
    </div>
  )
}
