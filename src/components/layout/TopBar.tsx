import { useGameStore } from '@/store/gameStore'
import { formatNumber } from '@/utils/format'
import { formatDate } from '@/core/calendar'

export function TopBar() {
  const currencies = useGameStore(s => s.currencies)
  const isRunning = useGameStore(s => s.isRunning)
  const isInitialized = useGameStore(s => s.isInitialized)
  const playerName = useGameStore(s => s.playerName)
  const calendar = useGameStore(s => s.calendar)
  const startLoop = useGameStore(s => s.startLoop)
  const stopLoop = useGameStore(s => s.stopLoop)
  const cloudSaveCode = useGameStore(s => s.cloudSaveCode)

  return (
    <header className="h-12 border-b-2 border-border-dark bg-cream-dark flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-3">
        <h1 className="text-sm font-bold text-ink tracking-tight font-mono">
          永夜出版社
        </h1>
        <span className="text-[10px] text-muted font-mono border border-border-medium px-1.5 py-0.5 bg-cream">
          {formatDate(calendar)}
        </span>
      </div>

      <div className="flex items-center gap-4 text-xs font-mono">
        <CurrencyBadge label="RP" value={currencies.revisionPoints} />
        <CurrencyBadge label="声" value={currencies.prestige} />
        <CurrencyBadge label="税" value={currencies.royalties} />
        <StatueDisplay count={currencies.statues} />
      </div>

      <div className="flex items-center gap-3">
        <span className="text-[10px] text-muted font-mono">{playerName}</span>
        {cloudSaveCode && (
          <span className="text-[10px] text-muted font-mono" title={`云存档：${cloudSaveCode}`}>
            ☁️
          </span>
        )}
        {isInitialized && (
          <button
            onClick={() => isRunning ? stopLoop() : startLoop()}
            className={`text-[10px] px-3 py-1 border-2 border-border-dark font-mono transition-all cursor-pointer ${
              isRunning
                ? 'bg-copper text-white shadow-[2px_2px_0_#4a3728]'
                : 'bg-cream text-ink-light shadow-[2px_2px_0_#4a3728] hover:bg-cream-dark'
            }`}
          >
            {isRunning ? '▶ 运行' : '⏸ 暂停'}
          </button>
        )}
      </div>
    </header>
  )
}

function CurrencyBadge({ label, value }: { label: string; value: number }) {
  return (
    <span className="flex items-center gap-1 text-ink-light">
      <span className="text-[10px] text-muted">{label}</span>
      <span className="tabular-nums text-copper font-bold">{formatNumber(Math.floor(value))}</span>
    </span>
  )
}

function StatueDisplay({ count }: { count: number }) {
  if (count === 0) return null
  return (
    <span className="flex items-center gap-1 text-copper" title={`${count} 座铜像`}>
      <span>🗽</span>
      <span className="tabular-nums font-bold text-xs">{count}</span>
    </span>
  )
}
