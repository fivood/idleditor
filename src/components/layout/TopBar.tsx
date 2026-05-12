import { useState } from 'react'
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
  const totalBestsellers = useGameStore(s => s.totalBestsellers)
  const permanentBonuses = useGameStore(s => s.permanentBonuses)
  const reborn = useGameStore(s => s.reborn)
  const [showRebirth, setShowRebirth] = useState(false)

  const canReborn = totalBestsellers >= 1

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
        {canReborn && (
          <button
            onClick={() => setShowRebirth(true)}
            className="text-[10px] px-2 py-1 bg-copper-dark text-white border-2 border-border-dark font-mono cursor-pointer shadow-[2px_2px_0_#4a3728] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"
          >
            转生
          </button>
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
            {isRunning ? '⏸ 暂停' : '▶ 运行'}
          </button>
        )}
      </div>

      {showRebirth && (
        <RebirthModal
          onConfirm={() => { reborn(); setShowRebirth(false) }}
          onCancel={() => setShowRebirth(false)}
          bonuses={permanentBonuses}
          statues={currencies.statues}
        />
      )}
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

function RebirthModal({ onConfirm, onCancel, bonuses, statues }: {
  onConfirm: () => void
  onCancel: () => void
  bonuses: { manuscriptQualityBonus: number; editingSpeedBonus: number; royaltyMultiplier: number; authorTalentBoost: number }
  statues: number
}) {
  const nextCount = statues + 1
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-cream border-2 border-border-dark w-[400px] p-6 shadow-[6px_6px_0_#4a3728]">
        <h2 className="text-base font-bold text-ink mb-1 font-mono">铸造铜像 · 转生</h2>
        <p className="text-[10px] text-muted mb-4 font-mono">
          你的功绩将被铸成铜像，陈列在永夜出版社的大厅里。一切将从头开始——但你的经验将永存。
        </p>

        <div className="bg-card-inset border-2 border-border-dark p-3 mb-4">
          <p className="text-xs text-ink font-bold mb-2 font-mono">第 {nextCount} 座铜像加成：</p>
          <div className="text-[10px] text-muted space-y-0.5 font-mono leading-relaxed">
            <p>📖 稿件质量 +2（当前：+{bonuses.manuscriptQualityBonus}）</p>
            <p>⚡ 编辑速度 +5%（当前：+{Math.round(bonuses.editingSpeedBonus * 100)}%）</p>
            <p>💰 版税加成 +10%（当前：+{Math.round((bonuses.royaltyMultiplier - 1) * 100)}%）</p>
            <p>✍️ 作者才华 +1（当前：+{bonuses.authorTalentBoost}）</p>
            <p className="text-copper-dark font-bold mt-1">⚠ 所有进度将重置。铜像效果永久保留。</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onConfirm}
            className="flex-1 text-xs px-4 py-2 bg-copper text-white border-2 border-border-dark font-mono cursor-pointer shadow-[2px_2px_0_#4a3728] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"
          >
            确认转生
          </button>
          <button
            onClick={onCancel}
            className="flex-1 text-xs px-4 py-2 border-2 border-border-dark text-muted font-mono cursor-pointer bg-cream shadow-[2px_2px_0_#4a3728] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"
          >
            暂缓
          </button>
        </div>
      </div>
    </div>
  )
}
