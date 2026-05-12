import { create } from 'zustand'
import type { Department, EditorTrait, Manuscript, PermanentBonuses, ToastMessage } from '@/core/types'
import { GENRE_PREFERENCE_THRESHOLDS } from '@/core/constants'
import { createInitialWorld, tick } from '@/core/gameLoop'
import type { TickResult } from '@/core/types'
import type { GameWorldState } from '@/core/gameLoop'
import { saveGameToDb, loadGameFromDb, hasExistingSave } from '@/db/saveManager'
import { nanoid } from '@/utils/id'

function serializeMapForDb(map: Map<unknown, unknown>): string {
  return JSON.stringify([...map.entries()])
}

export function getPreferenceSlots(prestige: number): number {
  let slots = 0
  for (const t of GENRE_PREFERENCE_THRESHOLDS) {
    if (prestige >= t) slots++
  }
  return slots
}

async function syncToCloudImpl(state: GameStore): Promise<boolean> {
  if (!state.cloudSaveCode) return false
  try {
    const res = await fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: state.cloudSaveCode,
        data: {
          playerName: state.playerName,
          playTicks: state.playTicks,
          totalPublished: state.totalPublished,
          totalBestsellers: state.totalBestsellers,
          totalRejections: state.totalRejections,
          currencies: state.currencies,
          permanentBonuses: state.permanentBonuses,
          calendar: state.calendar,
          triggeredMilestones: [...state.triggeredMilestones],
          manuscriptsJson: serializeMapForDb(state.manuscripts),
          authorsJson: serializeMapForDb(state.authors),
          departmentsJson: serializeMapForDb(state.departments),
        },
      }),
    })
    return res.ok
  } catch {
    return false
  }
}

export interface GameStore extends GameWorldState {
  // UI state
  toasts: ToastMessage[]
  isInitialized: boolean
  isRunning: boolean
  activeTab: 'desk' | 'shelf' | 'authors' | 'office'
  cloudSaveCode: string | null
  llmApiKey: string
  llmCallsRemaining: number

  // Actions: lifecycle
  initialize: () => Promise<void>
  startLoop: () => void
  stopLoop: () => void
  tick: () => void
  applyTickResult: (result: TickResult) => void
  reborn: () => void
  syncToCloud: () => Promise<boolean>
  loadFromCloud: (code: string) => Promise<boolean>

  // Actions: manuscript
  startReview: (id: string) => void
  rejectManuscript: (id: string) => void
  meticulousEdit: (id: string, level: 'light' | 'deep' | 'extreme') => void
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
  setTrait: (trait: EditorTrait) => void
  setActiveTab: (tab: GameStore['activeTab']) => void
  setCloudSaveCode: (code: string) => void
  setLlmApiKey: (key: string) => void
  generateLlmSynopsis: (id: string) => Promise<void>
  setPreferredGenre: (genre: string) => void
  removePreferredGenre: (genre: string) => void
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
  cloudSaveCode: null,
  llmApiKey: '',
  llmCallsRemaining: 30,

  // ──── Lifecycle ────
  initialize: async () => {
    // Safety: always mark initialized even if DB fails
    const safetyTimeout = setTimeout(() => set({ isInitialized: true }), 3000)
    try {
      // Load cover manifest
      try {
        const res = await fetch('/covers/manifest.json')
        if (res.ok) {
          const data = await res.json() as Array<{ slug: string; filename: string }>
          const manifest: Record<string, string> = {}
          for (const entry of data) manifest[entry.slug] = entry.filename
          set({ coversManifest: manifest })
        }
      } catch { /* manifest not available, use placeholders */ }

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
      activeDateEvent: state.activeDateEvent,
      coversManifest: state.coversManifest,
      preferredGenres: state.preferredGenres,
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
      activeDateEvent: world.activeDateEvent,
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

    // Cloud sync every 300 ticks (5 min)
    if (state.cloudSaveCode && world.playTicks % 300 === 0) {
      syncToCloudImpl(get()).catch(() => {})
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
      bossYears: Math.max(0, state.permanentBonuses.bossYears - 1),
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
      cloudSaveCode: state.cloudSaveCode,
      coversManifest: state.coversManifest,
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
    } else {
      // Rejecting a good manuscript: prestige penalty
      prestigeReward = -5
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
        text: `"${ms.title}" 已被退回。作者面露不悦——这本书本来还不错。声望 -5`,
        type: 'rejection',
        createdAt: Date.now(),
      })
    }
  },

  meticulousEdit: (id: string, level: 'light' | 'deep' | 'extreme') => {
    const state = get()
    const ms = state.manuscripts.get(id)
    if (!ms || ms.status !== 'editing' || ms.meticulouslyEdited) return

    const costs: Record<string, { rp: number; quality: number; label: string }> = {
      light: { rp: 10, quality: 3, label: '轻度精校' },
      deep: { rp: 30, quality: 8, label: '深度精校' },
      extreme: { rp: 60, quality: 15, label: '极限精校' },
    }
    const option = costs[level]
    if (!option || state.currencies.revisionPoints < option.rp) return

    ms.quality = Math.min(100, ms.quality + option.quality)
    ms.meticulouslyEdited = true
    set({
      manuscripts: new Map(state.manuscripts),
      currencies: {
        ...state.currencies,
        revisionPoints: state.currencies.revisionPoints - option.rp,
      },
    })
    get().addToast({
      id: nanoid(),
      text: `🔍 ${option.label}：《${ms.title}》品质 +${option.quality}（花费 ${option.rp} RP）`,
      type: 'info',
      createdAt: Date.now(),
    })
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
  setTrait: (trait) => set({ trait }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  dismissToast: (id) => {
    set(state => ({ toasts: state.toasts.filter(t => t.id !== id) }))
  },
  addToast: (toast) => {
    set(state => ({ toasts: [...state.toasts, toast].slice(-100) }))
  },

  // ──── Cloud save ────
  setCloudSaveCode: (code) => set({ cloudSaveCode: code }),

  setLlmApiKey: (key) => set({ llmApiKey: key }),

  generateLlmSynopsis: async (id) => {
    const state = get()
    if (!state.llmApiKey || state.llmCallsRemaining <= 0) return
    const ms = state.manuscripts.get(id)
    if (!ms) return

    const prompt = `书名：《${ms.title}》\n类型：${ms.genre}\n字数：${Math.round(ms.wordCount / 1000)}K\n品质预估：${ms.quality}/100\n请写一段简介。`
    try {
      const res = await fetch('/api/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: state.llmApiKey, prompt }),
      })
      const data = await res.json()
      if (data.text) {
        ms.synopsis = data.text
        set({ manuscripts: new Map(state.manuscripts), llmCallsRemaining: state.llmCallsRemaining - 1 })
        get().addToast({ id: nanoid(), text: `🤖 LLM 已生成《${ms.title}》的新简介。（剩余 ${state.llmCallsRemaining - 1} 次）`, type: 'info', createdAt: Date.now() })
      } else if (data.error) {
        get().addToast({ id: nanoid(), text: `LLM 调用失败：${data.error}`, type: 'info', createdAt: Date.now() })
      }
    } catch {
      get().addToast({ id: nanoid(), text: 'LLM 调用超时，请检查网络。', type: 'info', createdAt: Date.now() })
    }
  },

  setPreferredGenre: (genre) => {
    const state = get()
    const maxSlots = getPreferenceSlots(state.currencies.prestige)
    if (state.preferredGenres.length >= maxSlots) return
    set({ preferredGenres: [...state.preferredGenres, genre as never] })
  },

  removePreferredGenre: (genre) => {
    set(state => ({
      preferredGenres: state.preferredGenres.filter(g => g !== genre),
    }))
  },

  syncToCloud: async () => {
    return syncToCloudImpl(get())
  },

  loadFromCloud: async (code) => {
    try {
      const res = await fetch(`/api/load?code=${encodeURIComponent(code)}`)
      if (!res.ok) return false
      const data = await res.json()
      if (!data) return false
      // Restore from cloud data
      set({
        ...createInitialWorld(),
        playerName: data.playerName ?? '',
        playTicks: data.playTicks ?? 0,
        totalPublished: data.totalPublished ?? 0,
        totalBestsellers: data.totalBestsellers ?? 0,
        totalRejections: data.totalRejections ?? 0,
        currencies: data.currencies ?? { revisionPoints: 0, prestige: 0, royalties: 0, statues: 0 },
        permanentBonuses: data.permanentBonuses ?? createInitialWorld().permanentBonuses,
        calendar: data.calendar ?? createInitialWorld().calendar,
        triggeredMilestones: new Set(data.triggeredMilestones ?? []),
        cloudSaveCode: code,
        isInitialized: true,
      })
      // Load maps
      if (data.manuscriptsJson) {
        try {
          const entries = JSON.parse(data.manuscriptsJson) as [string, unknown][]
          set(s => { entries.forEach(([k, v]) => s.manuscripts.set(k, v as never)); return {} })
        } catch {}
      }
      if (data.authorsJson) {
        try {
          const entries = JSON.parse(data.authorsJson) as [string, unknown][]
          set(s => { entries.forEach(([k, v]) => s.authors.set(k, v as never)); return {} })
        } catch {}
      }
      if (data.departmentsJson) {
        try {
          const entries = JSON.parse(data.departmentsJson) as [string, unknown][]
          set(s => { entries.forEach(([k, v]) => s.departments.set(k, v as never)); return {} })
        } catch {}
      }
      return true
    } catch {
      return false
    }
  },
}))
