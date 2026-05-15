import { nanoid } from '@/utils/id'
import type { GameStore } from '../gameStore'
import type { Department } from '@/core/types'

export const createDepartmentActions = (set: any, get: any) => ({
  createDepartment: (type) => {
      const state = get()
      const exists = [...state.departments.values()].some(d => d.type === type)
      if (exists) return
      const cost = 50
      if (state.currencies.revisionPoints < cost) return
      const dept: Department = {
        id: nanoid(),
        type,
        level: 1,
        upgradeCostRP: 75,
        upgradeCostPrestige: 0,
        upgradeTicks: 600,
        upgradingUntil: null,
      }
      const newDepts = new Map(state.departments)
      newDepts.set(dept.id, dept)
      set({
        departments: newDepts,
        currencies: {
          ...state.currencies,
          revisionPoints: state.currencies.revisionPoints - cost,
        },
      })
    },,

  upgradeDepartment: (id: string) => {
      const state = get()
      const dept = state.departments.get(id)
      if (!dept || dept.upgradingUntil !== null) return
      if (state.currencies.revisionPoints < dept.upgradeCostRP) return
      if (state.currencies.prestige < dept.upgradeCostPrestige) return
      dept.upgradingUntil = state.playTicks + dept.upgradeTicks
      set({
        departments: new Map(state.departments),
        currencies: {
          ...state.currencies,
          revisionPoints: state.currencies.revisionPoints - dept.upgradeCostRP,
          prestige: state.currencies.prestige - dept.upgradeCostPrestige,
        },
      })
    },,

})
