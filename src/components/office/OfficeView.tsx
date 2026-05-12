import { useGameStore } from '@/store/gameStore'
import type { DepartmentType } from '@/core/types'

const DEPT_INFO: Record<DepartmentType, { label: string; icon: string; desc: string }> = {
  editing: { label: 'Editorial', icon: '✍️', desc: 'Speeds up reviewing, editing, and proofing.' },
  design: { label: 'Design', icon: '🎨', desc: 'Improves book covers and layout quality.' },
  marketing: { label: 'Marketing', icon: '📢', desc: 'Boosts book sales and royalty income.' },
  rights: { label: 'Rights', icon: '📜', desc: 'Generates passive prestige over time.' },
}

export function OfficeView() {
  const departments = [...useGameStore(s => s.departments.values())]
  const currencies = useGameStore(s => s.currencies)
  const createDepartment = useGameStore(s => s.createDepartment)
  const upgradeDepartment = useGameStore(s => s.upgradeDepartment)

  return (
    <div>
      <h2 className="text-sm font-medium text-ink mb-3">Departments</h2>
      <div className="grid gap-2">
        {Object.entries(DEPT_INFO).map(([type, info]) => {
          const dept = departments.find(d => d.type === type)
          return (
            <div
              key={type}
              className="bg-card border border-border rounded-lg p-3"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{info.icon}</span>
                <span className="text-sm font-medium text-ink">{info.label}</span>
                {dept && <span className="text-xs text-green ml-auto">Lv.{dept.level}</span>}
              </div>
              <p className="text-xs text-muted mb-2">{info.desc}</p>
              {!dept ? (
                <button
                  onClick={() => createDepartment(type as DepartmentType)}
                  disabled={currencies.revisionPoints < 50}
                  className={`text-xs px-2 py-1 rounded cursor-pointer transition-colors ${
                    currencies.revisionPoints >= 50
                      ? 'bg-green-bg text-green border border-green-border hover:bg-green hover:text-white'
                      : 'bg-border text-muted border border-border cursor-not-allowed'
                  }`}
                >
                  Hire · 50 RP
                </button>
              ) : dept.upgradingUntil !== null ? (
                <span className="text-xs text-gold">Upgrading...</span>
              ) : (
                <button
                  onClick={() => upgradeDepartment(dept.id)}
                  disabled={currencies.revisionPoints < dept.upgradeCostRP}
                  className={`text-xs px-2 py-1 rounded cursor-pointer transition-colors ${
                    currencies.revisionPoints >= dept.upgradeCostRP
                      ? 'bg-green-bg text-green border border-green-border hover:bg-green hover:text-white'
                      : 'bg-border text-muted border border-border cursor-not-allowed'
                  }`}
                >
                  Upgrade · {dept.upgradeCostRP} RP{dept.upgradeCostPrestige > 0 ? ` + ${dept.upgradeCostPrestige}P` : ''}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
