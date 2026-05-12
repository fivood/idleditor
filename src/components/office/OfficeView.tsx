import { useGameStore } from '@/store/gameStore'
import type { DepartmentType } from '@/core/types'
import { useMemo } from 'react'

const DEPT_INFO: Record<DepartmentType, { label: string; icon: string; desc: string }> = {
  editing: { label: '编辑部', icon: '✍️', desc: '加快审稿、编辑和校对速度。' },
  design: { label: '设计部', icon: '🎨', desc: '提升封面和排版质量。' },
  marketing: { label: '市场部', icon: '📢', desc: '提高书籍销量和版税收入。' },
  rights: { label: '版权部', icon: '📜', desc: '随时间自动产生被动声望。' },
}

export function OfficeView() {
  const departments = useGameStore(s => s.departments)
  const currencies = useGameStore(s => s.currencies)
  const createDepartment = useGameStore(s => s.createDepartment)
  const upgradeDepartment = useGameStore(s => s.upgradeDepartment)

  const deptList = useMemo(() => [...departments.values()], [departments])

  return (
    <div className="h-full overflow-y-auto p-4">
      <h2 className="text-sm font-medium text-ink mb-3">部门管理</h2>
      <div className="grid gap-2">
        {Object.entries(DEPT_INFO).map(([type, info]) => {
          const dept = deptList.find(d => d.type === type)
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
                  雇佣 · 50 RP
                </button>
              ) : dept.upgradingUntil !== null ? (
                <span className="text-xs text-gold">升级中...</span>
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
                  升级 · {dept.upgradeCostRP} RP{dept.upgradeCostPrestige > 0 ? ` + ${dept.upgradeCostPrestige}声` : ''}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
