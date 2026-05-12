import { useGameStore } from '@/store/gameStore'
import { getPreferenceSlots } from '@/store/gameStore'
import type { DepartmentType, Genre } from '@/core/types'
import { GENRE_ICONS } from '@/core/types'
import { GENRE_PREFERENCE_THRESHOLDS, AUTO_REVIEW_DEPT_LEVEL, AUTO_COVER_PRESTIGE, AUTO_REJECT_PRESTIGE } from '@/core/constants'
import { useMemo, useState } from 'react'
import { ChangelogModal } from './ChangelogModal'

const DEPT_INFO: Record<DepartmentType, { label: string; icon: string; desc: string }> = {
  editing: { label: '编辑部', icon: '✍️', desc: '加快审稿、编辑和校对速度。' },
  design: { label: '设计部', icon: '🎨', desc: '提升封面和排版质量。' },
  marketing: { label: '市场部', icon: '📢', desc: '提高书籍销量和版税收入。' },
  rights: { label: '版权部', icon: '📜', desc: '随时间自动产生被动声望。' },
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
        <button
          onClick={() => setShowChangelog(true)}
          className="text-[14px] md:text-[16px] text-muted font-mono border border-border-medium px-1.5 py-0.5 bg-cream hover:text-ink cursor-pointer transition-colors"
        >
          开发日志
        </button>
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
                <p className="text-[16px] md:text-xs text-muted mb-1.5 md:mb-2 font-mono">{info.desc}</p>
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
                  <span className="text-[16px] md:text-xs text-copper font-bold font-mono">升级中...</span>
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
        </div>

        {preferredGenres.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2 md:mb-3">
            {preferredGenres.map(g => (
              <button
                key={g}
                onClick={() => removePreferredGenre(g)}
                className="text-[15px] md:text-xs px-1.5 md:px-2 py-0.5 md:py-1 bg-copper text-white border-2 border-border-dark font-mono cursor-pointer shadow-[2px_2px_0_#4a3728] active:shadow-none active:translate-x-[1px] active:translate-y-[1px] transition-all flex items-center gap-1"
              >
                {GENRE_ICONS[g]} {GENRE_LABELS[g]} ×
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
                  <span className="text-xs md:text-sm">{GENRE_ICONS[genre]}</span>
                  <span>{GENRE_LABELS[genre]}</span>
                  {prefCount > 0 && <span className="text-copper font-bold">×{prefCount}</span>}
                </div>
              </button>
            )
          })}
        </div>
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
          />
          <PerkCard
            icon="🎨"
            label="自动出版"
            desc="封面待选的稿件自动使用占位封面出版。"
            req={`声望 ${AUTO_COVER_PRESTIGE}`}
            unlocked={currencies.prestige >= AUTO_COVER_PRESTIGE}
          />
          <PerkCard
            icon="🗑️"
            label="自动退稿"
            desc="一眼看出就不行的稿件不用你亲自动手退了。"
            req={`声望 ${AUTO_REJECT_PRESTIGE} + 编辑部 Lv.5`}
            unlocked={currencies.prestige >= AUTO_REJECT_PRESTIGE && editingLevel >= 5}
          />
        </div>
      </div>

      {showChangelog && <ChangelogModal onClose={() => setShowChangelog(false)} />}
    </div>
  )
}

function PerkCard({ icon, label, desc, req, unlocked }: {
  icon: string; label: string; desc: string; req: string; unlocked: boolean
}) {
  return (
    <div className={`border-2 p-2 md:p-3 transition-all ${
      unlocked
        ? 'bg-cream border-progress shadow-[3px_3px_0_#3a6491]'
        : 'bg-cream-dark border-border-dark opacity-50'
    }`}>
      <div className="flex items-center gap-2">
        <span className="text-sm md:text-lg">{icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[16px] md:text-xs font-bold text-ink font-mono">{label}</span>
            {unlocked && <span className="text-[14px] text-progress font-bold font-mono">已解锁</span>}
          </div>
          <p className="text-[14px] md:text-[16px] text-muted font-mono">{desc}</p>
        </div>
        <span className="text-[16px] md:text-[14px] text-muted font-mono text-right shrink-0">{req}</span>
      </div>
    </div>
  )
}
