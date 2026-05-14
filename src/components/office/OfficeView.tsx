import { useGameStore } from '@/store/gameStore'
import { getPreferenceSlots } from '@/store/gameStore'
import type { DepartmentType, Department, Genre } from '@/core/types'
import { GENRE_ICONS } from '@/core/types'
import { GENRE_PREFERENCE_THRESHOLDS, AUTO_REVIEW_DEPT_LEVEL, AUTO_COVER_PRESTIGE, AUTO_REJECT_PRESTIGE } from '@/core/constants'
import { TALENTS, TALENT_UNLOCK_LEVELS } from '@/core/talents'
import { useMemo, useState } from 'react'
import { ChangelogModal } from './ChangelogModal'

const DEPT_INFO: Record<DepartmentType, { label: string; icon: string; getEffect: (level: number) => string }> = {
  editing: { label: '编辑部', icon: '✍️', getEffect: (l) => l === 0 ? '未雇佣' : `流水线速度 +${l * 5}%` },
  design: { label: '设计部', icon: '🎨', getEffect: (l) => l === 0 ? '未雇佣' : `封面阶段品质 +${Math.round(l * 0.3)}` },
  marketing: { label: '市场部', icon: '📢', getEffect: (l) => l === 0 ? '未雇佣' : `书籍销量 +${Math.round(l * 2)}%` },
  rights: { label: '版权部', icon: '📜', getEffect: (l) => l === 0 ? '未雇佣' : `每分钟声望 +${(l * 0.9).toFixed(1)}` },
}

const GENRE_LABELS: Record<string, string> = {
  'sci-fi': '科幻', mystery: '推理', suspense: '悬疑',
  'social-science': '社科', hybrid: '混合', 'light-novel': '轻小说',
}

const ALL_GENRES: Genre[] = ['sci-fi', 'mystery', 'suspense', 'social-science', 'hybrid', 'light-novel']

export function OfficeView() {
  const departments = useGameStore(s => s.departments)
  const currencies = useGameStore(s => s.currencies)
  const preferredGenres = useGameStore(s => s.preferredGenres)
  const createDepartment = useGameStore(s => s.createDepartment)
  const upgradeDepartment = useGameStore(s => s.upgradeDepartment)
  const setPreferredGenre = useGameStore(s => s.setPreferredGenre)
  const removePreferredGenre = useGameStore(s => s.removePreferredGenre)
  const upgradePublishingQuota = useGameStore(s => s.upgradePublishingQuota)
  const toggleAutoReview = useGameStore(s => s.toggleAutoReview)
  const toggleAutoCover = useGameStore(s => s.toggleAutoCover)
  const toggleAutoReject = useGameStore(s => s.toggleAutoReject)
  const autoReviewEnabled = useGameStore(s => s.autoReviewEnabled)
  const autoCoverEnabled = useGameStore(s => s.autoCoverEnabled)
  const autoRejectEnabled = useGameStore(s => s.autoRejectEnabled)
  const publishingQuotaUpgrades = useGameStore(s => s.publishingQuotaUpgrades || 0)
  const hirePR = useGameStore(s => s.hirePR)
  const renovateReadingRoom = useGameStore(s => s.renovateReadingRoom)
  const sponsorAward = useGameStore(s => s.sponsorAward)
  const selectedTalents = useGameStore(s => s.selectedTalents)
  const editorLevel = useGameStore(s => s.editorLevel)
  const selectTalent = useGameStore(s => s.selectTalent)
  const playerGender = useGameStore(s => s.playerGender)
  const setPlayerGender = useGameStore(s => s.setPlayerGender)
  const readingRoomRenovated = useGameStore(s => s.readingRoomRenovated)
  const prActive = useGameStore(s => s.prActive)
  const qualityThreshold = useGameStore(s => s.qualityThreshold)
  const setQualityThreshold = useGameStore(s => s.setQualityThreshold)
  const playTicks = useGameStore(s => s.playTicks)
  const [showChangelog, setShowChangelog] = useState(false)

  const deptList = useMemo(() => [...departments.values()], [departments])
  const editingLevel = deptList.find(d => d.type === 'editing')?.level ?? 0
  const maxSlots = getPreferenceSlots(currencies.prestige)
  const usedSlots = preferredGenres.length
  const nextThreshold = GENRE_PREFERENCE_THRESHOLDS.find(t => currencies.prestige < t)

  return (
    <div className="h-full overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xs md:text-sm font-bold text-ink font-mono">办公室</h2>
        <div className="flex items-center gap-2">
          {playerGender && (
            <button onClick={() => setPlayerGender(playerGender === 'male' ? 'female' : 'male')} className="text-[14px] md:text-[16px] text-muted font-mono border border-border-medium px-1.5 py-0.5 bg-cream hover:text-ink cursor-pointer transition-colors">
              {playerGender === 'male' ? '他' : '她'}
            </button>
          )}
          <button
          onClick={() => setShowChangelog(true)}
          className="text-[14px] md:text-[16px] text-muted font-mono border border-border-medium px-1.5 py-0.5 bg-cream hover:text-ink cursor-pointer transition-colors"
        >
          开发日志
          </button>
        </div>
      </div>

      <div>
        <h2 className="text-xs md:text-sm font-bold text-ink mb-2 md:mb-3 font-mono">部门管理</h2>
        <div className="grid gap-1.5 md:gap-2">
          {Object.entries(DEPT_INFO).map(([type, info]) => {
            const dept = deptList.find(d => d.type === type)
            return (
              <div key={type} className="bg-cream border-2 border-border-dark p-2 md:p-3 shadow-[3px_3px_0_#4a3728]">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base md:text-lg">{info.icon}</span>
                  <span className="text-xs md:text-sm font-bold text-ink font-mono">{info.label}</span>
                  {dept && <span className="text-[16px] md:text-xs text-copper font-bold ml-auto font-mono">Lv.{dept.level}</span>}
                </div>
                <p className="text-[16px] md:text-xs text-muted mb-1.5 md:mb-2 font-mono">{info.getEffect(dept?.level ?? 0)}</p>
                {!dept ? (
                  <button
                    onClick={() => createDepartment(type as DepartmentType)}
                    disabled={currencies.revisionPoints < 50}
                    className={`text-[15px] md:text-xs px-2 md:px-3 py-1 md:py-1.5 border-2 border-border-dark font-mono cursor-pointer transition-all shadow-[2px_2px_0_#4a3728] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] ${
                      currencies.revisionPoints >= 50 ? 'bg-copper text-white' : 'bg-cream-dark text-muted cursor-not-allowed'
                    }`}
                  >
                    雇佣 · 50 RP
                  </button>
                ) : dept.upgradingUntil !== null ? (
                  <UpgradeProgress dept={dept} now={playTicks} />
                ) : (
                  <button
                    onClick={() => upgradeDepartment(dept.id)}
                    disabled={currencies.revisionPoints < dept.upgradeCostRP}
                    className={`text-[15px] md:text-xs px-2 md:px-3 py-1 md:py-1.5 border-2 border-border-dark font-mono cursor-pointer transition-all shadow-[2px_2px_0_#4a3728] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] ${
                      currencies.revisionPoints >= dept.upgradeCostRP ? 'bg-copper text-white' : 'bg-cream-dark text-muted cursor-not-allowed'
                    }`}
                  >
                    升级 · {dept.upgradeCostRP} RP{dept.upgradeCostPrestige > 0 ? ` + ${dept.upgradeCostPrestige}声` : ''}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div>
        <h2 className="text-xs md:text-sm font-bold text-ink mb-1 font-mono">偏爱领域</h2>
        <p className="text-[14px] md:text-[16px] text-muted mb-2 md:mb-3 font-mono">
          声望越高，在编辑部的话语权越大。选择一个或多个偏爱的图书领域，获得质量与销量加成。
        </p>

        <div className="bg-card-inset border-2 border-border-dark p-1.5 md:p-2 mb-2 md:mb-3">
          <div className="flex items-center gap-0.5 md:gap-1">
            <span className="text-[14px] md:text-[16px] text-muted font-mono">话语权：</span>
            {Array.from({ length: GENRE_PREFERENCE_THRESHOLDS.length }).map((_, i) => (
              <span key={i} className={`text-[16px] md:text-xs ${i < maxSlots ? '' : 'opacity-30'}`}>
                {i < maxSlots ? '◆' : '◇'}
              </span>
            ))}
            <span className="text-[14px] md:text-[16px] text-muted font-mono ml-auto">
              {usedSlots}/{maxSlots}
              {nextThreshold && <span className="hidden md:inline"> · {nextThreshold}声解锁</span>}
            </span>
        </div>

        {/* Quality Threshold */}
        <div className="mt-3 md:mt-4 p-2 md:p-3 border-2 border-border-dark bg-cream shadow-[3px_3px_0_#4a3728]">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-ink font-mono">🎚️ 审稿门槛</span>
            <span className="text-xs font-mono text-copper font-bold">{qualityThreshold === 0 ? '关闭' : `≥ ${qualityThreshold} 品`}</span>
          </div>
          <input
            type="range"
            min={0}
            max={80}
            step={5}
            value={qualityThreshold}
            onChange={e => setQualityThreshold(parseInt(e.target.value))}
            className="w-full h-2 appearance-none bg-card-inset border-2 border-border-dark outline-none cursor-pointer"
            style={{ accentColor: '#b87333' }}
          />
          <p className="text-[12px] md:text-[13px] text-muted font-mono mt-1 leading-relaxed">
            低于此品质的稿件直接跳过封面审核，全自动出版。设 0 关闭门槛，所有稿件都由你亲自过目。
          </p>
          {qualityThreshold > 0 && currencies.prestige < 100 && (
            <p className="text-[12px] md:text-[13px] text-amber-600 font-mono mt-1">
              ⚠️ 自动跳过封面需要声望 ≥ 100 且自动出版已开启
            </p>
          )}
        </div>
      </div>

        {preferredGenres.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2 md:mb-3">
            {preferredGenres.map(g => (
              <button
                key={g}
                onClick={() => removePreferredGenre(g)}
                className="text-[15px] md:text-xs px-1.5 md:px-2 py-0.5 md:py-1 bg-copper text-white border-2 border-border-dark font-mono cursor-pointer shadow-[2px_2px_0_#4a3728] active:shadow-none active:translate-x-[1px] active:translate-y-[1px] transition-all flex items-center gap-1"
              >
                <img src={GENRE_ICONS[g] ?? '/icons/misc/book.svg'} alt="" className="inline w-4 h-4 md:w-3.5 md:h-3.5 align-text-bottom" /> {GENRE_LABELS[g]} ×
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-3 gap-1 md:gap-1.5">
          {ALL_GENRES.map(genre => {
            const isFull = usedSlots >= maxSlots
            const prefCount = preferredGenres.filter(g => g === genre).length
            return (
              <button
                key={genre}
                onClick={() => setPreferredGenre(genre)}
                disabled={isFull}
                className={`text-[15px] md:text-xs px-1.5 md:px-2 py-1 md:py-2 border-2 border-border-dark font-mono transition-all shadow-[2px_2px_0_#4a3728] active:shadow-none active:translate-x-[1px] active:translate-y-[1px] ${
                  isFull ? 'bg-cream-dark text-muted cursor-not-allowed' : 'bg-cream text-ink hover:bg-cream-dark cursor-pointer'
                }`}
              >
                <div className="flex items-center justify-center gap-1">
                  <img src={GENRE_ICONS[genre]} alt="" className="w-4 h-4 md:w-5 md:h-5" />
                  <span>{GENRE_LABELS[genre]}</span>
                  {prefCount > 0 && <span className="text-copper font-bold">×{prefCount}</span>}
                </div>
                {!isFull && (
                  <p className="text-[12px] text-progress font-mono text-center mt-0.5">品质 +5 · 销量 +10%</p>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Royalty Spend */}
      <div>
        <h2 className="text-xs md:text-sm font-bold text-ink mb-1 font-mono">版税消费</h2>
        <p className="text-[12px] md:text-[13px] text-muted mb-2 md:mb-3 font-mono">
          版税不是用来存的——是用来花的。以下升级用版税购买。
        </p>
        {(() => {
          const cost = 100 * Math.pow(2, publishingQuotaUpgrades)
          const canAfford = currencies.royalties >= cost
          return (
            <div className={`border-2 p-2 md:p-3 ${canAfford ? 'bg-cream border-progress shadow-[3px_3px_0_#3a6491]' : 'bg-cream-dark border-border-dark opacity-50'}`}>
              <div className="flex items-center gap-2">
                <span className="text-sm md:text-lg">+1</span>
                <div className="flex-1 min-w-0">
                  <span className="text-[12px] md:text-xs font-bold text-ink font-mono">扩展出版额度</span>
                  <p className="text-[12px] md:text-[13px] text-muted font-mono">每月出版上限 +1（当前 {10 + publishingQuotaUpgrades}/月）</p>
                </div>
                <button
                  onClick={upgradePublishingQuota}
                  disabled={!canAfford}
                  className={`text-[12px] md:text-xs px-3 py-1 border-2 border-border-dark font-mono cursor-pointer transition-all shadow-[2px_2px_0_#4a3728] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] ${
                    canAfford ? 'bg-progress text-white' : 'bg-cream-dark text-muted cursor-not-allowed'
                  }`}
                >
                  {Math.floor(cost)} 税
                </button>
              </div>
            </div>
          )
        })()}

        {/* Hire PR */}
        {(() => {
          const cost = 200
          const canAfford = currencies.royalties >= cost
          const done = prActive
          return (
            <div className={`border-2 p-2 md:p-3 mt-1.5 ${done ? 'bg-cream-dark border-border-dark opacity-70' : canAfford ? 'bg-cream border-progress shadow-[3px_3px_0_#3a6491]' : 'bg-cream-dark border-border-dark opacity-50'}`}>
              <div className="flex items-center gap-2">
                <span className="text-sm md:text-lg">D</span>
                <div className="flex-1 min-w-0">
                  <span className="text-[12px] md:text-xs font-bold text-ink font-mono">雇佣公关</span>
                  <p className="text-[12px] md:text-[13px] text-muted font-mono">{done ? '当前：已激活 · 等待下一本新书出版触发' : '下一本出版的书进入热销窗口（3天 ×1.5销量）'}</p>
                </div>
                <button onClick={hirePR} disabled={!canAfford || done} className={`text-[12px] md:text-xs px-3 py-1 border-2 border-border-dark font-mono transition-all shadow-[2px_2px_0_#4a3728] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] ${done ? 'bg-card-inset text-muted cursor-not-allowed' : canAfford ? 'bg-progress text-white cursor-pointer' : 'bg-cream-dark text-muted cursor-not-allowed'}`}>
                  {done ? '已激活' : cost + ' 税'}
                </button>
              </div>
            </div>
          )
        })()}

        {/* Renovate Reading Room */}
        {(() => {
          const cost = 500
          const canAfford = currencies.royalties >= cost
          const done = readingRoomRenovated
          return (
            <div className={`border-2 p-2 md:p-3 mt-1.5 ${done ? 'bg-cream-dark border-border-dark opacity-70' : canAfford ? 'bg-cream border-progress shadow-[3px_3px_0_#3a6491]' : 'bg-cream-dark border-border-dark opacity-50'}`}>
              <div className="flex items-center gap-2">
                <span className="text-sm md:text-lg">E</span>
                <div className="flex-1 min-w-0">
                  <span className="text-[12px] md:text-xs font-bold text-ink font-mono">装修阅览室</span>
                  <p className="text-[12px] md:text-[13px] text-muted font-mono">{done ? '当前：已装修 · 作者互动好感 +20%' : '作者互动好感获取永久 +20%'}</p>
                </div>
                <button onClick={renovateReadingRoom} disabled={!canAfford || done} className={`text-[12px] md:text-xs px-3 py-1 border-2 border-border-dark font-mono transition-all shadow-[2px_2px_0_#4a3728] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] ${done ? 'bg-card-inset text-muted cursor-not-allowed' : canAfford ? 'bg-progress text-white cursor-pointer' : 'bg-cream-dark text-muted cursor-not-allowed'}`}>
                  {done ? '已装修' : cost + ' 税'}
                </button>
              </div>
            </div>
          )
        })()}

        {/* Sponsor Award */}
        {(() => {
          const cost = 1000
          const canAfford = currencies.royalties >= cost
          return (
            <div className={`border-2 p-2 md:p-3 mt-1.5 ${canAfford ? 'bg-cream border-progress shadow-[3px_3px_0_#3a6491]' : 'bg-cream-dark border-border-dark opacity-50'}`}>
              <div className="flex items-center gap-2">
                <span className="text-sm md:text-lg">F</span>
                <div className="flex-1 min-w-0">
                  <span className="text-[12px] md:text-xs font-bold text-ink font-mono">赞助文学奖</span>
                  <p className="text-[12px] md:text-[13px] text-muted font-mono">随机一本畅销书 +50 声望（当前声望：{currencies.prestige}）</p>
                </div>
                <button onClick={sponsorAward} disabled={!canAfford} className={`text-[12px] md:text-xs px-3 py-1 border-2 border-border-dark font-mono cursor-pointer transition-all shadow-[2px_2px_0_#4a3728] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] ${canAfford ? 'bg-progress text-white' : 'bg-cream-dark text-muted cursor-not-allowed'}`}>
                  {cost} 税
                </button>
              </div>
            </div>
          )
        })()}
      </div>

      {/* Automation Perks */}
      <div>
        <h2 className="text-xs md:text-sm font-bold text-ink mb-1 font-mono">编辑特权</h2>
        <p className="text-[14px] md:text-[16px] text-muted mb-2 md:mb-3 font-mono">
          随着你在出版社的资历增长，一些枯燥的工作会自动化——毕竟活了两个多世纪，有些事该交给系统了。
        </p>
        <div className="grid gap-1.5 md:gap-2">
          <PerkCard
            icon="🤖"
            label="自动审稿"
            desc="编辑部自动受理投稿池里的稿件。"
            req={`编辑部 Lv.${AUTO_REVIEW_DEPT_LEVEL}`}
            unlocked={editingLevel >= AUTO_REVIEW_DEPT_LEVEL}
            enabled={autoReviewEnabled}
            onToggle={toggleAutoReview}
          />
          <PerkCard
            icon="🎨"
            label="自动出版"
            desc="封面待选的稿件自动使用占位封面出版。"
            req={`声望 ${AUTO_COVER_PRESTIGE}`}
            unlocked={currencies.prestige >= AUTO_COVER_PRESTIGE}
            enabled={autoCoverEnabled}
            onToggle={toggleAutoCover}
          />
          <PerkCard
            icon="🗑️"
            label="自动退稿"
            desc="一眼看出就不行的稿件不用你亲自动手退了。"
            req={`声望 ${AUTO_REJECT_PRESTIGE} + 编辑部 Lv.5`}
            unlocked={currencies.prestige >= AUTO_REJECT_PRESTIGE && editingLevel >= 5}
            enabled={autoRejectEnabled}
            onToggle={toggleAutoReject}
          />
        </div>
      </div>

      {/* Talents */}
      <div>
        <h2 className="text-xs md:text-sm font-bold text-ink mb-1 font-mono">天赋树</h2>
        <p className="text-[14px] md:text-[16px] text-muted mb-2 md:mb-3 font-mono">
          编辑等级提升解锁天赋选择。每层只能选一个——选定了就会伴随你接下来的编辑生涯。
        </p>
        <div className="grid gap-1.5 md:gap-2">
          {Object.entries(TALENT_UNLOCK_LEVELS).map(([tierStr, level]) => {
            const tier = parseInt(tierStr)
            const unlocked = editorLevel >= level
            const selected = selectedTalents[tier]
            const tierTalents = TALENTS.filter(t => t.tier === tier)
            return (
              <div key={tier} className={`border-2 p-2 md:p-3 ${unlocked ? 'bg-cream border-progress shadow-[3px_3px_0_#3a6491]' : 'bg-cream-dark border-border-dark opacity-50'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[12px] md:text-xs font-bold text-progress font-mono">T{tier}</span>
                  <span className="text-[12px] md:text-xs text-muted font-mono">解锁 Lv.{level}</span>
                  {selected && <span className="text-[12px] text-progress font-bold font-mono ml-auto">{TALENTS.find(t => t.id === selected)?.label} 已选</span>}
                </div>
                {unlocked && !selected && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-1">
                    {tierTalents.map(t => (
                      <button
                        key={t.id}
                        onClick={() => selectTalent(t.id)}
                        className="text-left text-[12px] px-2 py-1.5 border-2 border-border-dark bg-cream hover:bg-cream-dark transition-all cursor-pointer shadow-[2px_2px_0_#4a3728] active:shadow-none active:translate-x-[1px] active:translate-y-[1px]"
                        title={t.desc}
                      >
                        <p className="text-[12px] font-bold text-ink font-mono">{t.label}</p>
                        <p className="text-[12px] text-muted font-mono mt-0.5">{t.desc.slice(0, 16)}...</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {showChangelog && <ChangelogModal onClose={() => setShowChangelog(false)} />}
    </div>
  )
}

function UpgradeProgress({ dept, now }: { dept: Department; now: number }) {
  const elapsed = now - (dept.upgradingUntil! - dept.upgradeTicks)
  const pct = Math.min(100, Math.round((elapsed / dept.upgradeTicks) * 100))
  const remaining = Math.max(0, dept.upgradingUntil! - now)
  return (
    <div className="flex-1">
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[16px] md:text-xs text-copper font-bold font-mono">升级中... {pct}%</span>
        <span className="text-[16px] md:text-xs text-muted font-mono">{remaining}s</span>
      </div>
      <div className="h-1.5 bg-card-inset border border-border-dark overflow-hidden">
        <div className="h-full bg-copper transition-all duration-75" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function PerkCard({ icon, label, desc, req, unlocked, enabled, onToggle }: {
  icon: string; label: string; desc: string; req: string; unlocked: boolean; enabled?: boolean; onToggle?: () => void
}) {
  return (
    <div className={`border-2 p-2 md:p-3 transition-all ${
      unlocked && enabled !== false
        ? 'bg-cream border-progress shadow-[3px_3px_0_#3a6491]'
        : 'bg-cream-dark border-border-dark opacity-50'
    }`}>
      <div className="flex items-center gap-2">
        <span className="text-sm md:text-lg">{icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[12px] md:text-xs font-bold text-ink font-mono">{label}</span>
            {unlocked && enabled !== false && <span className="text-[12px] text-progress font-bold font-mono">已解锁</span>}
            {unlocked && enabled === false && <span className="text-[12px] text-muted font-mono">已暂停</span>}
          </div>
          <p className="text-[12px] md:text-[13px] text-muted font-mono">{desc}</p>
        </div>
        <span className="text-[12px] md:text-[13px] text-muted font-mono text-right shrink-0">{req}</span>
        {unlocked && onToggle && (
          <button
            onClick={onToggle}
            className={`text-[14px] px-2 py-0.5 border-2 border-border-dark font-mono cursor-pointer transition-all ${
              enabled ? 'bg-progress text-white' : 'bg-cream text-muted'
            }`}
          >
            {enabled ? 'ON' : 'OFF'}
          </button>
        )}
      </div>
    </div>
  )
}
