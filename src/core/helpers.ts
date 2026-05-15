import type { DepartmentType } from './types'
import { DEPARTMENT_BASE_EFFICIENCY } from './constants'
import { COLLECTIONS } from './collections'
import { TALENTS, type Talent } from './talents'
import type { GameWorldState } from './gameLoop'

export function getDeptEfficiency(world: GameWorldState, type: string): number {
  const base = DEPARTMENT_BASE_EFFICIENCY[type as DepartmentType] ?? 0.5
  for (const dept of world.departments.values()) {
    if (dept.type === type) {
      return base * dept.level / 10
    }
  }
  return 0
}

export function getDeptLevel(world: GameWorldState, type: string): number {
  for (const dept of world.departments.values()) {
    if (dept.type === type) return dept.level
  }
  return 0
}

export function getCollectionBoost(genre: string, unlocked: Set<string>): number {
  let boost = 1
  for (const c of COLLECTIONS) {
    if (unlocked.has(c.id) && c.genre === genre) {
      if (c.id === 'mystery-5') boost *= 1.05
      if (c.id === 'hybrid-2') boost *= 1.05
    }
  }
  return boost
}

export function getTalentEffects(selected: Record<number, string>): Talent['effects'] {
  const effects: Record<string, number> = {}
  for (const talentId of Object.values(selected)) {
    const t = TALENTS.find(t => t.id === talentId)
    if (!t) continue
    for (const [k, v] of Object.entries(t.effects)) {
      effects[k] = (effects[k] || 0) + (v as number)
    }
  }
  return effects
}
