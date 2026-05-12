import { useGameStore } from '@/store/gameStore'
import { formatNumber } from '@/utils/format'

export function TopBar() {
  const currencies = useGameStore(s => s.currencies)
  const isRunning = useGameStore(s => s.isRunning)
  const isInitialized = useGameStore(s => s.isInitialized)
  const startLoop = useGameStore(s => s.startLoop)
  const stopLoop = useGameStore(s => s.stopLoop)

  return (
    <header className="h-12 border-b border-border bg-card flex items-center justify-between px-4 shrink-0">
      <h1 className="text-sm font-serif font-bold text-green tracking-tight">
        Idle Editor
      </h1>

      <div className="flex items-center gap-4 text-xs">
        <CurrencyBadge label="RP" value={currencies.revisionPoints} color="text-green" />
        <CurrencyBadge label="Prestige" value={currencies.prestige} color="text-gold" />
        <CurrencyBadge label="Royalties" value={currencies.royalties} color="text-muted" />
        <StatueDisplay count={currencies.statues} />
      </div>

      {isInitialized && (
        <button
          onClick={() => isRunning ? stopLoop() : startLoop()}
          className={`text-xs px-3 py-1 rounded-full border transition-colors cursor-pointer ${
            isRunning
              ? 'border-green-border text-green bg-green-bg'
              : 'border-border text-muted hover:border-green-border hover:text-green'
          }`}
        >
          {isRunning ? 'Running' : 'Paused'}
        </button>
      )}
    </header>
  )
}

function CurrencyBadge({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <span className={`flex items-center gap-1 ${color}`}>
      <span className="opacity-60 font-medium">{label}</span>
      <span className="tabular-nums font-mono">{formatNumber(Math.floor(value))}</span>
    </span>
  )
}

function StatueDisplay({ count }: { count: number }) {
  if (count === 0) return null
  return (
    <span className="flex items-center gap-1 text-gold" title={`${count} bronze statue${count > 1 ? 's' : ''}`}>
      <span>🗽</span>
      <span className="tabular-nums font-mono text-xs">{count}</span>
    </span>
  )
}
