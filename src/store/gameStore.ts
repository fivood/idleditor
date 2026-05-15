import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { Department, EditorTrait, Manuscript, CatState, PermanentBonuses, ToastMessage } from '@/core/types'
import { GENRE_PREFERENCE_THRESHOLDS } from '@/core/constants'
import type { Decision } from '@/core/decisions'
import { createInitialWorld, tick } from '@/core/gameLoop'
import type { TickResult } from '@/core/types'
import type { GameWorldState } from '@/core/gameLoop'
import { saveGameToDb, loadGameFromDb, hasExistingSave } from '@/db/saveManager'
import { nanoid } from '@/utils/id'
import { generateTemplateDecision } from '@/core/decisions'
import { loadSynopsisPool } from '@/core/humor/synopsis'
import { loadAuthorNamePool } from '@/core/gameLoop'
import { COUNT_SCENES, type CountScene } from '@/core/countStory'
import { type Talent } from '@/core/talents'
import { COLLECTIONS } from '@/core/collections'

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

async function tryTriggerDecision() {
  const state = useGameStore.getState()

  // Try LLM first
  const ctx = [
    `声望：${state.currencies.prestige}`,
    `修订点：${state.currencies.revisionPoints}`,
    `已出版：${state.totalPublished}本`,
    `畅销书：${state.totalBestsellers}本`,
    `退稿数：${state.totalRejections}`,
    `作者数：${state.authors.size}`,
    `部门数：${state.departments.size}`,
    `铜像：${state.currencies.statues}`,
    `本月已出版：${state.booksPublishedThisMonth}/10`,
  ].join('，')

  try {
    const res = await fetch('/api/decision', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ context: ctx }),
    })
    const data = await res.json()
    if (data.title && data.options?.length >= 2) {
      useGameStore.setState({
        pendingDecision: {
          id: Math.random().toString(36).slice(2, 10),
          title: data.title,
          description: data.description || '',
          options: data.options.slice(0, 3).map((o: { label: string; description: string }) => ({
            label: o.label,
            description: o.description,
          })),
        },
        decisionCooldown: 900,
      })
      return
    }
  } catch { /* fall through to templates */ }

  // Fallback to template decisions
  const decision = generateTemplateDecision(state)
  if (decision) {
    useGameStore.setState({ pendingDecision: decision, decisionCooldown: 900 })
  }
}

async function generateRebirthSummary(state: GameStore, statues: number): Promise<string | null> {
  try {
    const published = [...state.manuscripts.values()].filter(m => m.status === 'published')
    const bestsellers = published.filter(m => m.isBestseller)
    const authors = [...state.authors.values()]
    const idols = authors.filter(a => a.tier === 'idol')
    const stats = [
      `第${statues}次纪元。`,
      `本世出版${published.length}本书，其中${bestsellers.length}本畅销书。`,
      `累计退稿${state.totalRejections}次。`,
      `雇佣了${authors.length}位作者，其中${idols.length}位成为传奇。`,
      `最高声望达到${state.currencies.prestige}。`,
      `编辑等级Lv.${state.editorLevel}。`,
      `伯爵关系：${state.permanentBonuses.countRelation > 0 ? '亲近' : state.permanentBonuses.countRelation < 0 ? '疏远' : '中立'}。`,
    ].join('\n')

    const res = await fetch('/api/rebirth-summary', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stats }),
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.text || null
  } catch { return null }
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
          booksPublishedThisMonth: state.booksPublishedThisMonth,
          editorXP: state.editorXP,
          editorLevel: state.editorLevel,
          currencies: state.currencies,
          permanentBonuses: state.permanentBonuses,
          calendar: state.calendar,
          trait: state.trait,
          preferredGenres: state.preferredGenres,
          publishingQuotaUpgrades: state.publishingQuotaUpgrades,
          autoReviewEnabled: state.autoReviewEnabled,
          autoCoverEnabled: state.autoCoverEnabled,
          autoRejectEnabled: state.autoRejectEnabled,
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
  activeTab: 'desk' | 'shelf' | 'authors' | 'office' | 'study' | 'stats'
  cloudSaveCode: string | null
  llmCallsRemaining: number
  llmMonthLastReset: number
  pendingDecision: Decision | null
  decisionCooldown: number
  publishingQuotaUpgrades: number
  autoReviewEnabled: boolean
  autoCoverEnabled: boolean
  autoRejectEnabled: boolean
  unlockedCollections: Set<string>
  prActive: boolean
  readingRoomRenovated: boolean
  activeCountScene: CountScene | null
  countEnding: string | null
  selectedTalents: Record<number, string> // tier -> talent id
  playerGender: 'male' | 'female' | null
  solicitCooldown: number
  qualityThreshold: number
  catState: CatState | null
  catPetCooldown: number
  catRejectedUntilYear: number
  salonBooksRemaining: number

  // Actions: lifecycle
  initialize: () => Promise<void>
  startLoop: () => void
  stopLoop: () => void
  tick: () => void
  applyTickResult: (result: TickResult) => void
  reborn: () => void
  syncToCloud: () => Promise<boolean>
  loadFromCloud: (code: string) => Promise<boolean>
  upgradePublishingQuota: () => void
  toggleAutoReview: () => void
  toggleAutoCover: () => void
  toggleAutoReject: () => void
  reissueBook: (id: string) => void
  buyAuthorMeal: (id: string) => void
  sendAuthorGift: (id: string) => void
  writeAuthorLetter: (id: string) => void
  rushAuthorCooldown: (id: string) => void
  generateBookReview: (title: string, genre: string) => Promise<{ text: string; poolSize: number } | null>
  generateAuthorQuote: (title: string, authorName: string, genre: string) => Promise<{ text: string; poolSize: number } | null>
  hirePR: () => void
  renovateReadingRoom: () => void
  sponsorAward: () => void
  onCountSceneChoice: (choiceIndex: number) => void
  onCountGenderChoice: (gender: 'male' | 'female') => void
  dismissEnding: () => void
  selectTalent: (talentId: string) => void
  getTalentBonuses: () => Talent['effects']
  setPlayerGender: (gender: 'male' | 'female') => void
  solicitFree: () => void
  solicitTargeted: () => void
  solicitRush: () => void
  setQualityThreshold: (val: number) => void
  adoptCat: () => void
  nameCat: (name: string) => void
  petCat: () => void
  makeCatImmortal: () => void
  shooCat: () => void
  setEpochPath: (path: 'scholar' | 'merchant' | 'socialite') => void
  hostSalon: () => void
  generateEditorNote: (id: string) => Promise<void>
  updateCustomNote: (id: string, note: string) => void

  // Actions: manuscript
  startReview: (id: string) => void
  rejectManuscript: (id: string) => void
  shelveManuscript: (id: string) => void
  meticulousEdit: (id: string, level: 'light' | 'deep' | 'extreme') => void
  confirmCover: (id: string) => void
  getSubmittedManuscripts: () => Manuscript[]
  getPublishedBooks: () => Manuscript[]
  getInProgressManuscripts: () => Manuscript[]

  // Actions: author
  signAuthor: (id: string) => void
  terminateAuthor: (id: string) => void

  // Actions: department
  createDepartment: (type: Department['type']) => void
  upgradeDepartment: (id: string) => void

  // Actions: UI
  setPlayerName: (name: string) => void
  setTrait: (trait: EditorTrait) => void
  setActiveTab: (tab: GameStore['activeTab']) => void
  setCloudSaveCode: (code: string) => void
  generateLlmEditorNote: (id: string) => Promise<string | null>
  llmCommentary: (title: string, genre: string, context: string) => Promise<void>
  resolveDecision: (optionIndex: number) => void
  setPreferredGenre: (genre: string) => void
  removePreferredGenre: (genre: string) => void
  dismissToast: (id: string) => void
  addToast: (toast: ToastMessage) => void
}

// @ts-expect-error immer + zustand type compatibility — store actions are defined below
export const useGameStore = create<GameStore>()(immer((set, get) => ({
  // ──── Initial state ────
  ...createInitialWorld(),
  toasts: [],
  isInitialized: false,
  isRunning: false,
  activeTab: 'desk',
  cloudSaveCode: null,
  llmCallsRemaining: 30,
  llmMonthLastReset: 0,
  pendingDecision: null,
  decisionCooldown: 900,
  publishingQuotaUpgrades: 0,
  autoReviewEnabled: true,
  autoCoverEnabled: true,
  autoRejectEnabled: true,
  unlockedCollections: new Set(),
  prActive: false,
  readingRoomRenovated: false,
  activeCountScene: null,
  countEnding: null,
  selectedTalents: {},
  playerGender: null,
  solicitCooldown: 0,
  qualityThreshold: 0,
  catState: null,
  catPetCooldown: 0,
  catRejectedUntilYear: 0,
  salonBooksRemaining: 0,

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

      // Load LLM synopsis pool
      loadSynopsisPool().catch(() => {})
      // Load LLM author name pool
      loadAuthorNamePool().catch(() => {})

      const existing = await hasExistingSave()
      if (existing) {
        const saved = await loadGameFromDb()
        if (saved) {
          const currentManifest = get().coversManifest
          clearTimeout(safetyTimeout)
          set({
            ...createInitialWorld(),
            ...saved,
            permanentBonuses: {
              ...createInitialWorld().permanentBonuses,
              ...saved.permanentBonuses,
            },
            trait: (saved.trait as EditorTrait) ?? null,
            coversManifest: currentManifest,
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
    set(draft => {
      const result = tick(draft as unknown as GameWorldState)
      draft.decisionCooldown = Math.max(0, (draft.decisionCooldown || 0) - 1)
      draft.toasts = [...draft.toasts, ...result.toasts].slice(-100)
    })

    // Post-tick: LLM, collections, decisions — need get() for async
    const state = get()
    const world = state as unknown as GameWorldState

    // LLM calls reset per game month
    if (state.calendar.month !== state.llmMonthLastReset) {
      set({ llmCallsRemaining: 30, llmMonthLastReset: state.calendar.month })
    }

    // Check collection achievements
    for (const collection of COLLECTIONS) {
      if (state.unlockedCollections.has(collection.id)) continue
      const count = [...state.manuscripts.values()].filter(m => m.status === 'published' && m.genre === collection.genre).length
      if (count >= collection.threshold) {
        set(draft => { draft.unlockedCollections.add(collection.id) })
        get().addToast({
          id: nanoid(),
          text: collection.toastText,
          type: 'milestone',
          createdAt: get().playTicks,
        })
      }
    }

    // Decision trigger: every 600 ticks (~10 min)
    if (!state.pendingDecision && state.decisionCooldown <= 0 && state.playTicks % 600 === 0 && state.playTicks > 0) {
      tryTriggerDecision()
    }

    // Cat arrival decision
    const current = get()
    if (!current.catState && current.calendar.year > current.catRejectedUntilYear
        && !current.pendingDecision && Math.random() < 0.003) {
      set({
        pendingDecision: {
          id: 'cat-arrival',
          title: '窗外来了一只猫',
          description: '一只黑猫从窗台跳了进来，它在你桌上转了一圈，闻了闻咖啡杯。你第一时间没对它如何爬到十楼感到困惑，而是——',
          options: [
            { label: '来了还想走？留下当桌宠（300版税）', description: '收养它。花费300版税，从此出版社多一位无薪员工。' },
            { label: '哪来的回哪去', description: '关上窗户。在本年度结束之前，不会有东西打扰你了。' },
          ],
        },
      })
    }

    // Local save every 300 ticks
    if (state.playTicks % 300 === 0) {
      saveGameToDb({
        playTicks: state.playTicks,
        currencies: state.currencies,
        permanentBonuses: state.permanentBonuses,
        trait: state.trait,
        playerName: state.playerName,
        calendar: state.calendar,
        totalPublished: state.totalPublished,
        totalBestsellers: state.totalBestsellers,
        totalRejections: state.totalRejections,
        booksPublishedThisMonth: state.booksPublishedThisMonth,
        editorXP: state.editorXP,
        editorLevel: state.editorLevel,
        publishingQuotaUpgrades: state.publishingQuotaUpgrades,
        autoReviewEnabled: state.autoReviewEnabled,
        autoCoverEnabled: state.autoCoverEnabled,
        autoRejectEnabled: state.autoRejectEnabled,
        prActive: state.prActive,
        readingRoomRenovated: state.readingRoomRenovated,
        catState: state.catState,
        catPetCooldown: state.catPetCooldown,
        catRejectedUntilYear: state.catRejectedUntilYear,
        triggeredMilestones: state.triggeredMilestones,
        manuscripts: state.manuscripts,
        authors: state.authors,
        departments: state.departments,
        events: state.events,
      }).catch(() => {})
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
      solicitCooldown: world.solicitCooldown,
      qualityThreshold: world.qualityThreshold,
      awardTimer: world.awardTimer,
      trendTimer: world.trendTimer,
      triggeredMilestones: new Set(world.triggeredMilestones),
      activeDateEvent: world.activeDateEvent,
      booksPublishedThisMonth: world.booksPublishedThisMonth,
      publishedTitles: new Set(world.publishedTitles),
      editorXP: world.editorXP,
      editorLevel: world.editorLevel,
      publishingQuotaUpgrades: world.publishingQuotaUpgrades,
      autoReviewEnabled: world.autoReviewEnabled,
      autoCoverEnabled: world.autoCoverEnabled,
      autoRejectEnabled: world.autoRejectEnabled,
      unlockedCollections: new Set(world.unlockedCollections),
      prActive: world.prActive,
      readingRoomRenovated: world.readingRoomRenovated,
      playerGender: world.playerGender,
      catState: world.catState ? { ...world.catState } : null,
      catPetCooldown: Math.max(0, world.catPetCooldown - 1),
      catRejectedUntilYear: world.catRejectedUntilYear,
      decisionCooldown: Math.max(0, state.decisionCooldown - 1),
      manuscripts: new Map(world.manuscripts),
      authors: new Map(world.authors),
      departments: new Map(world.departments),
      toasts: [...state.toasts, ...result.toasts].slice(-100),
    })

    // LLM calls reset per game month
    if (world.calendar.month !== state.llmMonthLastReset) {
      set({ llmCallsRemaining: 30, llmMonthLastReset: world.calendar.month })
    }

    // Check collection achievements
    for (const collection of COLLECTIONS) {
      if (state.unlockedCollections.has(collection.id)) continue
      const count = [...world.manuscripts.values()].filter(m => m.status === 'published' && m.genre === collection.genre).length
      if (count >= collection.threshold) {
        const newState = get()
        newState.unlockedCollections.add(collection.id)
        set({ unlockedCollections: new Set(newState.unlockedCollections) })
        newState.addToast({
          id: nanoid(),
          text: collection.toastText,
          type: 'milestone',
          createdAt: get().playTicks,
        })
      }
    }

    // Decision trigger: every 600 ticks (~10 min), if no pending decision
    const newState = get()
    if (!newState.pendingDecision && newState.decisionCooldown <= 0 && world.playTicks % 600 === 0 && world.playTicks > 0) {
      tryTriggerDecision()
    }

    // Cat arrival decision: triggered by tick result
    if (result.catDecisionAvailable && !newState.pendingDecision) {
      set({
        pendingDecision: {
          id: 'cat-arrival',
          title: '窗外来了一只猫',
          description: '一只黑猫从窗台跳了进来，它在你桌上转了一圈，闻了闻咖啡杯。你第一时间没对它如何爬到十楼感到困惑，而是——',
          options: [
            { label: '来了还想走？留下当桌宠（300版税）', description: '收养它。花费300版税，从此出版社多一位无薪员工。' },
            { label: '哪来的回哪去', description: '关上窗户。在本年度结束之前，不会有东西打扰你了。' },
          ],
        },
      })
    }

    // LLM commentary: occasional witty comments on recent events (30% chance)
    if (newState.llmCallsRemaining > 0 && world.playTicks % 180 === 0 && Math.random() < 0.3) {
      const reviewed = [...world.manuscripts.values()].find(m => m.status === 'editing' || m.status === 'proofing')
      if (reviewed) {
        newState.llmCommentary(reviewed.title, reviewed.genre, '审稿通过')
      }
    }

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
        booksPublishedThisMonth: world.booksPublishedThisMonth,
        editorXP: world.editorXP,
        editorLevel: world.editorLevel,
        publishingQuotaUpgrades: world.publishingQuotaUpgrades,
        autoReviewEnabled: world.autoReviewEnabled,
        autoCoverEnabled: world.autoCoverEnabled,
        autoRejectEnabled: world.autoRejectEnabled,
        prActive: world.prActive,
        readingRoomRenovated: world.readingRoomRenovated,
        catState: world.catState,
        catPetCooldown: world.catPetCooldown,
        catRejectedUntilYear: world.catRejectedUntilYear,
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
      countRelation: state.permanentBonuses.countRelation,
      countGender: state.permanentBonuses.countGender,
      epochPath: state.permanentBonuses.epochPath,
    }
    set({
      ...createInitialWorld(),
      playerName: state.playerName,
      calendar: state.calendar,
      trait: state.trait,
      permanentBonuses: bonuses,
      currencies: {
        revisionPoints: 100,
        prestige: 0,
        royalties: 500,
        statues: newStatues,
      },
      toasts: [{
        id: nanoid(),
        text: `你获得了第${newStatues === 1 ? '一' : newStatues}座铜像。严格来说，是${newStatues <= 2 ? '塑料' : newStatues <= 4 ? '镀铜' : '纯黄铜'}的——毕竟有预算限制。`,
        type: 'milestone' as const,
        createdAt: get().playTicks,
      }],
      cloudSaveCode: state.cloudSaveCode,
      coversManifest: state.coversManifest,
      prActive: state.prActive,
      readingRoomRenovated: state.readingRoomRenovated,
      selectedTalents: state.selectedTalents,
    })

    // Check for count scene
    const scene = COUNT_SCENES.find(s => s.rebirth === newStatues)
    if (scene) {
      set({ activeCountScene: scene })
    }

    // Check for ending
    if (bonuses.bossYears <= 0) {
      const relation = bonuses.countRelation
      const ending = relation >= 5 ? 'loyal' : relation <= -3 ? 'independent' : 'balanced'
      set({ countEnding: ending })
    }

    // Fire LLM career summary
    generateRebirthSummary(state, newStatues).then(text => {
      if (text) get().addToast({ id: nanoid(), text, type: 'milestone', createdAt: state.playTicks })
    })
  },

  setEpochPath: (path) => {
    const state = get()
    if (state.permanentBonuses.epochPath) return // Already chosen
    set(draft => { draft.permanentBonuses.epochPath = path })
  },

  hostSalon: () => {
    const state = get()
    if (state.currencies.prestige < 200) return
    set(draft => {
      draft.currencies.prestige -= 200
      draft.salonBooksRemaining = 5
    })
    get().addToast({
      id: nanoid(),
      text: '你在地下室的蜡烛圆桌上举办了一场文学沙龙。几位作家举着红酒杯讨论了三个小时的"灵感来源"——实际内容是谁的经纪人更离谱。未来5本出版的品质 +5。',
      type: 'milestone',
      createdAt: get().playTicks,
    })
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
        booksPublishedThisMonth: data.booksPublishedThisMonth ?? 0,
        editorXP: data.editorXP ?? 0,
        editorLevel: data.editorLevel ?? 1,
        currencies: data.currencies ?? { revisionPoints: 0, prestige: 0, royalties: 0, statues: 0 },
        permanentBonuses: {
          manuscriptQualityBonus: data.permanentBonuses?.manuscriptQualityBonus ?? 0,
          editingSpeedBonus: data.permanentBonuses?.editingSpeedBonus ?? 0,
          royaltyMultiplier: data.permanentBonuses?.royaltyMultiplier ?? 1,
          authorTalentBoost: data.permanentBonuses?.authorTalentBoost ?? 0,
          spawnRateBonus: data.permanentBonuses?.spawnRateBonus ?? 0,
          bossYears: data.permanentBonuses?.bossYears ?? 10,
          countRelation: data.permanentBonuses?.countRelation ?? 0,
          countGender: data.permanentBonuses?.countGender ?? 'male',
          epochPath: (data.permanentBonuses as any)?.epochPath ?? null,
        },
        calendar: data.calendar ?? createInitialWorld().calendar,
        trait: data.trait ?? null,
        preferredGenres: data.preferredGenres ?? [],
        publishingQuotaUpgrades: data.publishingQuotaUpgrades ?? 0,
        autoReviewEnabled: data.autoReviewEnabled ?? true,
        autoCoverEnabled: data.autoCoverEnabled ?? true,
        autoRejectEnabled: data.autoRejectEnabled ?? true,
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
})))
