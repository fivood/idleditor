import { useState } from 'react'
import type { FC } from 'react'
import { useGameStore } from '@/store/gameStore'
import { formatNumber } from '@/utils/format'
import { formatDate } from '@/core/calendar'
import { xpProgressInLevel } from '@/core/leveling'
import { GENRE_LABELS } from '@/core/types'
import { IconRP, IconPrestige, IconRoyalty, IconStatue, IconScroll, IconTrend, IconCloud, IconCoffin, IconMoon } from '@/assets/pixelIcons'
import { PixelProgressBar } from '@/components/shared/PixelProgressBar'

interface PixelIconProps {
  size?: number
}

export function TopBar() {
  const currencies = useGameStore(s => s.currencies)
  const playerName = useGameStore(s => s.playerName)
  const calendar = useGameStore(s => s.calendar)
  const cloudSaveCode = useGameStore(s => s.cloudSaveCode)
  const booksPublishedThisMonth = useGameStore(s => s.booksPublishedThisMonth)
  const publishingQuotaUpgrades = useGameStore(s => s.publishingQuotaUpgrades || 0)
  const totalBestsellers = useGameStore(s => s.totalBestsellers)
  const permanentBonuses = useGameStore(s => s.permanentBonuses)
  const editorXP = useGameStore(s => s.editorXP)
  const reborn = useGameStore(s => s.reborn)
  const trait = useGameStore(s => s.trait)
  const totalPublished = useGameStore(s => s.totalPublished)
  const totalRejections = useGameStore(s => s.totalRejections)
  const authors = useGameStore(s => s.authors)
  const editorLevel = useGameStore(s => s.editorLevel)
  const setEpochPath = useGameStore(s => s.setEpochPath)
  const epochPath = useGameStore(s => s.permanentBonuses.epochPath)
  const currentTrend = useGameStore(s => s.currentTrend)
  const [showRebirth, setShowRebirth] = useState(false)
  const [selectedEpochPath, setSelectedEpochPath] = useState<'scholar' | 'merchant' | 'socialite' | null>(null)

  const canReborn = totalBestsellers >= 1

  return (
    <header
      className="border-b-2 border-[#0a0806] shrink-0 relative"
      style={{ background: '#1a0e08' }}
    >
      <div className="flex items-center justify-between px-3 md:px-4 h-8 md:h-12 relative z-10">
        <div className="flex items-center gap-2 md:gap-3">
          <img src="/favicon.svg" alt="" className="w-5 h-5 md:w-6 md:h-6" />
          <h1 className="text-xs md:text-sm font-bold tracking-tight font-mono" style={{ color: '#d4a85a', textShadow: '1px 1px 0 #0a0806' }}>
            永夜出版社
          </h1>
          <WoodPlaque title="夜间纪年">{formatDate(calendar)}</WoodPlaque>
        </div>

        <div className="flex items-center gap-1.5 md:gap-2 text-[13px] md:text-xs font-mono">
          <CurrencyBadge Icon={IconRP} label="修订点" value={currencies.revisionPoints} />
          <CurrencyBadge Icon={IconPrestige} label="声望" value={currencies.prestige} />
          <CurrencyBadge Icon={IconRoyalty} label="版税" value={currencies.royalties} />
          {currencies.inspiration > 0 && (
            <CurrencyBadge Icon={IconMoon} label="梦境灵感（审稿/出版获取）" value={currencies.inspiration} />
          )}
          <StatueDisplay count={currencies.statues} />
          <WoodPlaque title="本月出版额度" icon={<IconScroll />}>
            {booksPublishedThisMonth}/{10 + publishingQuotaUpgrades}
          </WoodPlaque>
          {currentTrend && (
            <WoodPlaque title="当前市场风向：相关题材销量大幅提升" accent icon={<IconTrend />}>
              {GENRE_LABELS[currentTrend] || currentTrend}
            </WoodPlaque>
          )}
        </div>

        <div className="flex items-center gap-1.5 md:gap-2">
          {(() => {
            const p = xpProgressInLevel(editorXP)
            const pct = Math.min(100, Math.round(p.current / p.needed * 100))
            return (
              <span className="hidden md:flex items-center gap-1.5 px-2 py-0.5 border-2 border-[#5c3a1f]" style={{ background: '#0a0806' }} title={`Lv.${p.level} (${p.current}/${p.needed} XP)`}>
                <span className="text-xs font-bold font-mono" style={{ color: '#d4a85a' }}>Lv.{p.level}</span>
                <PixelProgressBar value={pct} width={64} height={8} />
              </span>
            )
          })()}
          <WoodPlaque title="编辑名牌">{playerName}</WoodPlaque>
          {cloudSaveCode && (
            <span style={{ color: '#b8a48a' }} title={`云存档：${cloudSaveCode}`}>
              <IconCloud />
            </span>
          )}
          {canReborn && (
            <button
              onClick={() => setShowRebirth(true)}
              className="text-[14px] md:text-xs px-2 py-0.5 md:py-1 font-mono cursor-pointer transition-none border-2 flex items-center gap-1 active:translate-x-[1px] active:translate-y-[1px]"
              style={{
                background: '#b8763b',
                color: '#fff8e8',
                borderColor: '#0a0806',
                boxShadow: 'inset 1px 1px 0 #f5d878, inset -1px -1px 0 #5c3a1f',
              }}
            >
              <IconCoffin /> 纪元
            </button>
          )}
        </div>
      </div>

      {/* Mobile date bar */}
      <div className="md:hidden flex items-center justify-between px-3 pb-1.5 relative z-10">
        <span className="text-[15px] font-mono border border-[#5c3a1f] px-1.5" style={{ background: '#0a0806', color: '#d4a85a' }}>
          {formatDate(calendar)}
        </span>
        <span className="text-[15px] font-mono" style={{ color: '#b8a48a' }}>{playerName}</span>
      </div>

      {showRebirth && (
        <RebirthModal
          onConfirm={() => {
            if (selectedEpochPath && !epochPath) setEpochPath(selectedEpochPath)
            reborn(); setShowRebirth(false); setSelectedEpochPath(null)
          }}
          onCancel={() => { setShowRebirth(false); setSelectedEpochPath(null) }}
          bonuses={permanentBonuses}
          statues={currencies.statues}
          trait={trait}
          stats={{ totalPublished, totalBestsellers, totalRejections, authorCount: authors.size, editorLevel }}
          selectedPath={selectedEpochPath}
          epochPath={epochPath}
          onSelectPath={setSelectedEpochPath}
        />
      )}
    </header>
  )
}

/**
 * 暗色木牌：所有顶栏徽章共享的视觉容器，
 * 看起来像挂在墙上的小铜框/木刻牌。
 */
function WoodPlaque({ children, title, accent, icon }: { children: React.ReactNode; title?: string; accent?: boolean; icon?: React.ReactNode }) {
  return (
    <span
      title={title}
      className="hidden md:inline-flex items-center gap-1 px-1.5 py-0.5 text-[11px] font-mono border-2 whitespace-nowrap"
      style={{
        background: accent ? '#3d2614' : '#2a1810',
        borderColor: accent ? '#b8763b' : '#5c3a1f',
        color: accent ? '#f5d878' : '#d4a85a',
      }}
    >
      {icon}
      {children}
    </span>
  )
}

/**
 * 货币徽章：木刻 + 像素图标 + 铜色数字
 */
function CurrencyBadge({ Icon, label, value }: { Icon: FC<PixelIconProps>; label: string; value: number }) {
  return (
    <span
      className="flex items-center gap-1 px-1.5 py-0.5 text-[11px] font-mono border-2"
      title={label}
      style={{ background: '#2a1810', borderColor: '#5c3a1f' }}
    >
      <Icon />
      <span className="tabular-nums font-bold" style={{ color: '#f5d878' }}>
        {formatNumber(Math.floor(value))}
      </span>
    </span>
  )
}

/**
 * 铜像展示：金色雕刻牌
 */
function StatueDisplay({ count }: { count: number }) {
  if (count === 0) return null
  return (
    <span
      className="flex items-center gap-1 px-1.5 py-0.5 text-[11px] font-mono border-2"
      title={`${count} 座铜像`}
      style={{ background: '#3d2614', borderColor: '#b8763b', color: '#f5d878' }}
    >
      <IconStatue />
      <span className="tabular-nums font-bold">{count}</span>
    </span>
  )
}

function RebirthModal({ onConfirm, onCancel, bonuses, statues, trait, stats, onSelectPath, selectedPath, epochPath }: {
  onConfirm: () => void
  onCancel: () => void
  bonuses: { manuscriptQualityBonus: number; editingSpeedBonus: number; royaltyMultiplier: number; authorTalentBoost: number; bossYears: number }
  statues: number
  trait: string | null
  stats: { totalPublished: number; totalBestsellers: number; totalRejections: number; authorCount: number; editorLevel: number }
  onSelectPath: (path: 'scholar' | 'merchant' | 'socialite') => void
  selectedPath: 'scholar' | 'merchant' | 'socialite' | null
  epochPath: 'scholar' | 'merchant' | 'socialite' | null
}) {
  const nextCount = statues + 1
  const nextBossYears = Math.max(0, bonuses.bossYears - 1)
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 pb-20 md:pb-24 overflow-y-auto">
      <div className="bg-cream border-2 border-border-dark w-full max-w-[380px] p-4 md:p-6 shadow-[6px_6px_0_#4a3728] max-h-[90vh] overflow-y-auto">
        <h2 className="text-sm md:text-base font-bold text-ink mb-1 font-mono">铸造铜像 · 新纪元</h2>
        <p className="text-[15px] md:text-[16px] text-muted mb-3 md:mb-4 font-mono">
          你的功绩将被铸成铜像，陈列在永夜出版社的大厅里。一切将从头开始——但你的经验将永存。
        </p>

        {/* Career summary */}
        <div className="bg-card-inset border-2 border-border-dark p-2 md:p-3 mb-3 md:mb-4">
          <p className="text-[16px] md:text-xs text-ink font-bold mb-1 md:mb-2 font-mono">📜 本世回顾</p>
          <div className="text-[15px] md:text-[16px] text-muted space-y-0.5 font-mono leading-relaxed">
            <p>📚 出版 {stats.totalPublished} 本书 · {stats.totalBestsellers} 本畅销</p>
            <p>📮 退稿 {stats.totalRejections} 次</p>
            <p>✍️ 合作过 {stats.authorCount} 位作者</p>
            <p>⬆ 编辑等级 Lv.{stats.editorLevel}</p>
          </div>
        </div>

        <div className="bg-card-inset border-2 border-border-dark p-2 md:p-3 mb-3 md:mb-4">
          <p className="text-[16px] md:text-xs text-ink font-bold mb-1 md:mb-2 font-mono">第 {nextCount} 座铜像加成：</p>
          <div className="text-[15px] md:text-[16px] text-muted space-y-0.5 font-mono leading-relaxed">
            <p>📖 稿件质量 +2（当前：+{bonuses.manuscriptQualityBonus}）</p>
            <p>⚡ 编辑速度 +5%（当前：+{Math.round(bonuses.editingSpeedBonus * 100)}%）</p>
            <p>💰 版税加成 +10%（当前：+{Math.round((bonuses.royaltyMultiplier - 1) * 100)}%）</p>
            <p>✍️ 作者才华 +1（当前：+{bonuses.authorTalentBoost}）</p>
            <p className="text-copper-dark mt-1">🦇 伯爵剩余年数：{bonuses.bossYears} → {nextBossYears}</p>
            {nextBossYears === 0 && (
              <p className="text-copper font-bold mt-1">🏆 伯爵将退休，你将成为永夜出版社的新主人！</p>
            )}
            {trait && (
              <p className="text-progress mt-1">🎭 编辑风格「{trait === 'decisive' ? '果断' : trait === 'meticulous' ? '细致' : '远见'}」将保留。</p>
            )}
            <p className="text-copper-dark font-bold mt-1">⚠ 所有进度将重置。铜像效果永久保留。</p>
          </div>
        </div>

        {/* Epoch Path */}
        <div className="bg-card-inset border-2 border-border-dark p-2 md:p-3 mb-3 md:mb-4">
          <p className="text-[16px] md:text-xs text-ink font-bold mb-1 md:mb-2 font-mono">🏛️ 纪元之路（可选）</p>
          <p className="text-[14px] md:text-[16px] text-muted mb-2 font-mono">选择你在新纪元的专精方向。首次纪元可免选（沿用基础加成）。</p>
          <div className="space-y-1.5">
            {(['scholar', 'merchant', 'socialite'] as const).map(path => {
              const selected = selectedPath === path
              const current = epochPath === path
              const labels = { scholar: '📖 学者之路', merchant: '💼 商人之路', socialite: '🎭 名流之路' }
              const descs = { scholar: '品质 +5 · 编辑速度 +15%', merchant: '版税 ×1.2 · 作者投稿速度 +20%', socialite: '声望 ×1.5 · 畅销书阈值 24,000' }
              return (
                <button
                  key={path}
                  onClick={() => onSelectPath(path)}
                  className={`w-full text-left p-2 border-2 font-mono text-[15px] md:text-xs transition-all ${
                    selected ? 'bg-amber-50 border-copper shadow-[2px_2px_0_#b87333]' :
                    current ? 'bg-cream-dark border-border-medium opacity-50' :
                    'bg-cream border-border-dark hover:bg-cream-dark'
                  } ${current ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                  disabled={!!current}
                >
                  <span className="font-bold text-ink">{labels[path]}</span>
                  {current && <span className="text-muted ml-1">（当前选择）</span>}
                  {selected && !current && <span className="text-copper font-bold ml-1">✓</span>}
                  <p className="text-muted mt-0.5">{descs[path]}</p>
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onConfirm}
            className="flex-1 text-[16px] md:text-xs px-3 md:px-4 py-1.5 md:py-2 bg-copper text-white border-2 border-border-dark font-mono cursor-pointer shadow-[2px_2px_0_#4a3728] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"
          >
             开启纪元
          </button>
          <button
            onClick={onCancel}
            className="flex-1 text-[16px] md:text-xs px-3 md:px-4 py-1.5 md:py-2 border-2 border-border-dark text-muted font-mono cursor-pointer bg-cream shadow-[2px_2px_0_#4a3728] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"
          >
            暂缓
          </button>
        </div>
      </div>
    </div>
  )
}
