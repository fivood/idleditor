import { create } from 'zustand'
import type { Department, EditorTrait, Manuscript, PermanentBonuses, ToastMessage } from '@/core/types'
import { createInitialWorld, tick } from '@/core/gameLoop'
import type { TickResult } from '@/core/types'
import type { GameWorldState } from '@/core/gameLoop'
import { saveGameToDb, loadGameFromDb, hasExistingSave } from '@/db/saveManager'
import { nanoid } from '@/utils/id'

export interface GameStore extends GameWorldState {
  // UI state
  toasts: ToastMessage[]
  isInitialized: boolean
  isRunning: boolean
  activeTab: 'desk' | 'shelf' | 'authors' | 'office'

  // Actions: lifecycle
  initialize: () => Promise<void>
  startLoop: () => void
  stopLoop: () => void
  tick: () => void
  applyTickResult: (result: TickResult) => void
  reborn: () => void

  // Actions: manuscript
  startReview: (id: string) => void
  rejectManuscript: (id: string) => void
  confirmCover: (id: string) => void
  getSubmittedManuscripts: () => Manuscript[]
  getPublishedBooks: () => Manuscript[]
  getInProgressManuscripts: () => Manuscript[]

  // Actions: author
  signAuthor: (id: string) => void

  // Actions: department
  createDepartment: (type: Department['type']) => void
  upgradeDepartment: (id: string) => void

  // Actions: UI
  setPlayerName: (name: string) => void
  setActiveTab: (tab: GameStore['activeTab']) => void
  dismissToast: (id: string) => void
  addToast: (toast: ToastMessage) => void
}

export const useGameStore = create<GameStore>()((set, get) => ({
  // ──── Initial state ────
  ...createInitialWorld(),
  toasts: [],
  isInitialized: false,
  isRunning: false,
  activeTab: 'desk',

  // ──── Lifecycle ────
  initialize: async () => {
    // Safety: always mark initialized even if DB fails
    const safetyTimeout = setTimeout(() => set({ isInitialized: true }), 3000)
    try {
      const existing = await hasExistingSave()
      if (existing) {
        const saved = await loadGameFromDb()
        if (saved) {
          clearTimeout(safetyTimeout)
          set({
            ...createInitialWorld(),
            ...saved,
            trait: (saved.trait as EditorTrait) ?? null,
            isInitialized: true,
          })
          return
        }
      }
    } catch {
      // IndexedDB unavailable or corrupted, start fresh
    }
    clearTimeout(safetyTimeout)
    set({ isInitialized: true })
  },

  startLoop: () => {
    set({ isRunning: true })
  },

  stopLoop: () => {
    set({ isRunning: false })
  },

  tick: () => {
    const state = get()
    const world: GameWorldState = {
      manuscripts: state.manuscripts,
      authors: state.authors,
      departments: state.departments,
      events: state.events,
      playTicks: state.playTicks,
      totalPublished: state.totalPublished,
      totalBestsellers: state.totalBestsellers,
      totalRejections: state.totalRejections,
      currencies: state.currencies,
      permanentBonuses: state.permanentBonuses,
      trait: state.trait,
      playerName: state.playerName,
      calendar: state.calendar,
      spawnTimer: state.spawnTimer,
      awardTimer: state.awardTimer,
      trendTimer: state.trendTimer,
      triggeredMilestones: state.triggeredMilestones,
    }
    const result = tick(world)

    // Pull mutated primitives back from world
    set({
      playTicks: world.playTicks,
      totalPublished: world.totalPublished,
      totalBestsellers: world.totalBestsellers,
      totalRejections: world.totalRejections,
      currencies: { ...world.currencies },
      calendar: { ...world.calendar },
      spawnTimer: world.spawnTimer,
      awardTimer: world.awardTimer,
      trendTimer: world.trendTimer,
      triggeredMilestones: new Set(world.triggeredMilestones),
      toasts: [...state.toasts, ...result.toasts].slice(-100),
    })

    // Auto-save every 60 ticks (1 minute)
    if (world.playTicks % 60 === 0) {
      saveGameToDb({
        playTicks: world.playTicks,
        currencies: world.currencies,
        permanentBonuses: world.permanentBonuses,
        trait: world.trait,
        playerName: world.playerName,
        calendar: world.calendar,
        totalPublished: world.totalPublished,
        totalBestsellers: world.totalBestsellers,
        totalRejections: world.totalRejections,
        triggeredMilestones: world.triggeredMilestones,
        manuscripts: world.manuscripts,
        authors: world.authors,
        departments: world.departments,
        events: world.events,
      }).catch(() => {})
    }
  },

  applyTickResult: (_result: TickResult) => {
    // No-op, logic moved into tick() above
  },

  reborn: () => {
    const state = get()
    const newStatues = state.currencies.statues + 1
    const bonuses: PermanentBonuses = {
      manuscriptQualityBonus: state.permanentBonuses.manuscriptQualityBonus + 2,
      editingSpeedBonus: state.permanentBonuses.editingSpeedBonus + 0.05,
      royaltyMultiplier: state.permanentBonuses.royaltyMultiplier + 0.1,
      authorTalentBoost: state.permanentBonuses.authorTalentBoost + 1,
      spawnRateBonus: state.permanentBonuses.spawnRateBonus + 0.03,
    }
    set({
      ...createInitialWorld(),
      playerName: state.playerName,
      calendar: state.calendar,
      permanentBonuses: bonuses,
      currencies: {
        revisionPoints: 0,
        prestige: 0,
        royalties: 0,
        statues: newStatues,
      },
      toasts: [{
        id: nanoid(),
        text: `你获得了第${newStatues === 1 ? '一' : newStatues}座铜像。严格来说，是${newStatues <= 2 ? '塑料' : newStatues <= 4 ? '镀铜' : '纯黄铜'}的——毕竟有预算限制。`,
        type: 'milestone' as const,
        createdAt: Date.now(),
      }],
    })
  },

  // ──── Manuscript actions ────
  startReview: (id: string) => {
    const state = get()
    const ms = state.manuscripts.get(id)
    if (!ms || ms.status !== 'submitted') return
    ms.status = 'reviewing'
    ms.editingProgress = 0
    set({ manuscripts: new Map(state.manuscripts) })
  },

  rejectManuscript: (id: string) => {
    const state = get()
    const ms = state.manuscripts.get(id)
    if (!ms || ms.status !== 'submitted') return
    ms.status = 'rejected'

    const wasUnsuitable = ms.isUnsuitable
    let rpReward = 0
    let prestigeReward = 0

    if (wasUnsuitable) {
      rpReward = 8
      prestigeReward = 3
    }

    const author = state.authors.get(ms.authorId)
    if (author) {
      author.rejectedCount++
      author.cooldownUntil = 1800 + author.rejectedCount * 300
    }
    set({
      manuscripts: new Map(state.manuscripts),
      authors: new Map(state.authors),
      totalRejections: state.totalRejections + 1,
      currencies: {
        ...state.currencies,
        revisionPoints: state.currencies.revisionPoints + rpReward,
        prestige: state.currencies.prestige + prestigeReward,
      },
    })
    const state2 = get()
    if (wasUnsuitable) {
      state2.addToast({
        id: nanoid(),
        text: `"${ms.title}" 被果断退回。编辑的眼光又救了一次出版社。+${rpReward} 修订点 +${prestigeReward} 声誉`,
        type: 'info',
        createdAt: Date.now(),
      })
    } else {
      state2.addToast({
        id: nanoid(),
        text: `"${ms.title}" 已被退回。作者会缓过来的。大概。`,
        type: 'rejection',
        createdAt: Date.now(),
      })
    }
  },

  confirmCover: (id: string) => {
    const state = get()
    const ms = state.manuscripts.get(id)
    if (!ms || ms.status !== 'cover_select') return
    ms.status = 'publishing'
    ms.editingProgress = 0
    set({ manuscripts: new Map(state.manuscripts) })
  },

  getSubmittedManuscripts: () => {
    return [...get().manuscripts.values()].filter(m => m.status === 'submitted')
  },

  getPublishedBooks: () => {
    return [...get().manuscripts.values()].filter(m => m.status === 'published')
  },

  getInProgressManuscripts: () => {
    const state = get()
    return [...state.manuscripts.values()].filter(
      m => ['reviewing', 'editing', 'proofing', 'cover_select', 'publishing'].includes(m.status)
    )
  },

  // ──── Author actions ────
  signAuthor: (id: string) => {
    const state = get()
    const author = state.authors.get(id)
    if (!author || author.tier !== 'new') return
    author.tier = 'signed'
    set({ authors: new Map(state.authors) })
  },

  // ──── Department actions ────
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
  },

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
  },

  // ──── UI actions ────
  setPlayerName: (name) => set({ playerName: name }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  dismissToast: (id) => {
    set(state => ({ toasts: state.toasts.filter(t => t.id !== id) }))
  },
  addToast: (toast) => {
    set(state => ({ toasts: [...state.toasts, toast].slice(-100) }))
  },
}))
