import { create } from 'zustand'
import type { Department, EditorTrait, Manuscript, CatState, PermanentBonuses, ToastMessage } from '@/core/types'
import { GENRE_PREFERENCE_THRESHOLDS } from '@/core/constants'
import type { Decision } from '@/core/decisions'
import { createInitialWorld, tick, createManuscript } from '@/core/gameLoop'
import type { TickResult } from '@/core/types'
import type { GameWorldState } from '@/core/gameLoop'
import { saveGameToDb, loadGameFromDb, hasExistingSave } from '@/db/saveManager'
import { nanoid } from '@/utils/id'
import { generateTemplateDecision } from '@/core/decisions'
import { loadSynopsisPool } from '@/core/humor/synopsis'
import { loadAuthorNamePool } from '@/core/gameLoop'
import { COUNT_SCENES, type CountScene } from '@/core/countStory'
import { TALENTS, TALENT_UNLOCK_LEVELS, type Talent } from '@/core/talents'
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
      `第${statues}次转生。`,
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
  activeTab: 'desk' | 'shelf' | 'authors' | 'office' | 'study'
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

function buildSolicitWorld(state: GameStore): GameWorldState {
  return {
    manuscripts: state.manuscripts,
    authors: state.authors,
    departments: state.departments,
    events: state.events,
    playTicks: state.playTicks,
    totalPublished: state.totalPublished,
    totalBestsellers: state.totalBestsellers,
    totalRejections: state.totalRejections,
    currencies: { ...state.currencies },
    permanentBonuses: state.permanentBonuses,
    trait: state.trait,
    playerName: state.playerName,
    calendar: { ...state.calendar },
    spawnTimer: state.spawnTimer,
    solicitCooldown: state.solicitCooldown,
    awardTimer: state.awardTimer,
    trendTimer: state.trendTimer,
    triggeredMilestones: new Set(state.triggeredMilestones),
    activeDateEvent: state.activeDateEvent,
    coversManifest: state.coversManifest,
    preferredGenres: [...state.preferredGenres],
    booksPublishedThisMonth: state.booksPublishedThisMonth,
    publishedTitles: new Set(state.publishedTitles),
    editorXP: state.editorXP,
    editorLevel: state.editorLevel,
    publishingQuotaUpgrades: state.publishingQuotaUpgrades,
    autoReviewEnabled: state.autoReviewEnabled,
    autoCoverEnabled: state.autoCoverEnabled,
    autoRejectEnabled: state.autoRejectEnabled,
    unlockedCollections: new Set(state.unlockedCollections),
    prActive: state.prActive,
    readingRoomRenovated: state.readingRoomRenovated,
    selectedTalents: { ...state.selectedTalents },
    playerGender: state.playerGender,
    qualityThreshold: state.qualityThreshold,
    catState: state.catState,
    catPetCooldown: state.catPetCooldown,
    catRejectedUntilYear: state.catRejectedUntilYear,
  }
}

export const useGameStore = create<GameStore>()((set, get) => ({
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
      booksPublishedThisMonth: state.booksPublishedThisMonth,
      publishedTitles: state.publishedTitles,
      editorXP: state.editorXP,
      editorLevel: state.editorLevel,
      publishingQuotaUpgrades: state.publishingQuotaUpgrades,
      autoReviewEnabled: state.autoReviewEnabled,
      autoCoverEnabled: state.autoCoverEnabled,
      autoRejectEnabled: state.autoRejectEnabled,
      unlockedCollections: state.unlockedCollections,
      prActive: state.prActive,
      readingRoomRenovated: state.readingRoomRenovated,
      selectedTalents: state.selectedTalents,
      playerGender: state.playerGender,
      solicitCooldown: state.solicitCooldown,
      qualityThreshold: state.qualityThreshold,
      catState: state.catState,
      catPetCooldown: state.catPetCooldown,
      catRejectedUntilYear: state.catRejectedUntilYear,
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
          createdAt: Date.now(),
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
    }
    set({
      ...createInitialWorld(),
      playerName: state.playerName,
      calendar: state.calendar,
      trait: state.trait,
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

  onCountSceneChoice: (choiceIndex: number) => {
    const state = get()
    const scene = state.activeCountScene
    if (!scene) return
    const choice = scene.choices[choiceIndex]
    if (!choice) return
    const newRelation = state.permanentBonuses.countRelation + choice.loyaltyChange
    set({
      permanentBonuses: { ...state.permanentBonuses, countRelation: newRelation },
      activeCountScene: null,
    })
    get().addToast({ id: nanoid(), text: choice.toastText, type: 'milestone', createdAt: Date.now() })
    // Gender choice after first scene
    if (scene.rebirth === 1) {
      set({ activeCountScene: { ...scene, rebirth: -1 } as CountScene }) // Signal gender choice
    }
  },

  onCountGenderChoice: (gender: 'male' | 'female') => {
    set(s => ({
      permanentBonuses: { ...s.permanentBonuses, countGender: gender },
      activeCountScene: null,
    }))
    const label = gender === 'female' ? '女伯爵' : '伯爵'
    get().addToast({ id: nanoid(), text: `伯爵档案已更新。此后称呼为：${label}。`, type: 'milestone', createdAt: Date.now() })
  },

  dismissEnding: () => set({ countEnding: null }),

  setPlayerGender: (gender) => set({ playerGender: gender }),

  setQualityThreshold: (val) => {
    const clamped = Math.max(0, Math.min(100, Math.round(val)))
    set({ qualityThreshold: clamped })
  },

  adoptCat: () => {
    const state = get()
    if (state.catState) return
    if (state.currencies.royalties < 300) return
    set({
      catState: { name: '', affection: 20, age: 0, immortal: false, alive: true, immortalityPrompted: false },
      currencies: { ...state.currencies, royalties: state.currencies.royalties - 300 },
    })
    get().addToast({
      id: nanoid(),
      text: '一只黑猫从窗台跳了进来。它在你桌上转了一圈，闻了闻咖啡杯，然后蜷在稿件堆上发出了咕噜声。它还没有名字——点击猫来为它取名。',
      type: 'milestone',
      createdAt: Date.now(),
    })
  },

  nameCat: (name: string) => {
    const state = get()
    if (!state.catState && state.currencies.royalties >= 300) return // adoption in progress, catState still null
    const trimmed = name.trim().slice(0, 6)
    if (!trimmed) return
    set({
      catState: {
        name: trimmed,
        affection: 20,
        age: 0,
        immortal: false,
        alive: true,
        immortalityPrompted: false,
      },
    })
    get().addToast({
      id: nanoid(),
      text: `"${trimmed}"——猫抬起头，似乎对这个名字略有不满，但最后还是打了个哈欠默许了。`,
      type: 'info',
      createdAt: Date.now(),
    })
  },

  petCat: () => {
    const state = get()
    if (!state.catState || !state.catState.alive || state.catPetCooldown > 0) return
    const cat = { ...state.catState }
    cat.affection = Math.min(100, cat.affection + 3)
    set({ catState: cat, catPetCooldown: 60 })
    const reactions = [
      `${cat.name}发出咕噜声，用头蹭了蹭你的手。`,
      `${cat.name}翻了个身，把肚子暴露在灯光下。这是最高级别的信任。`,
      `${cat.name}懒洋洋地甩了甩尾巴，在半空中画了个弧——大概是满意。`,
      `${cat.name}打了个哈欠，然后若无其事地走开了。被摸够了。`,
    ]
    get().addToast({ id: nanoid(), text: reactions[Math.floor(Math.random() * reactions.length)] + ' 好感 +3。', type: 'info', createdAt: Date.now() })
  },

  makeCatImmortal: () => {
    const state = get()
    if (!state.catState || !state.catState.alive || state.catState.immortal) return
    if (state.currencies.statues < 1) return
    const cat = { ...state.catState, immortal: true }
    set({
      catState: cat,
      currencies: { ...state.currencies, statues: state.currencies.statues - 1 },
    })
    get().addToast({
      id: nanoid(),
      text: `你在满月之夜将一座铜像浸入泉水。${cat.name}舔了舔那水——然后它的眼睛里映出了永恒。从此以后，它将与你共享无尽的夜晚。`,
      type: 'milestone',
      createdAt: Date.now(),
    })
  },

  shooCat: () => {
    const state = get()
    set({ catRejectedUntilYear: state.calendar.year })
    get().addToast({
      id: nanoid(),
      text: '你把窗关上了。猫发出一声不满的"喵"，跳回了夜色中。在你把窗锁修好之前——至少到明年——不会有东西打扰你了。',
      type: 'info',
      createdAt: Date.now(),
    })
  },

  generateEditorNote: async (id: string) => {
    const state = get()
    const ms = state.manuscripts.get(id)
    if (!ms) return
    if (state.llmCallsRemaining <= 0) {
      get().addToast({ id: nanoid(), text: '你什么都想不出来，以后再说吧。', type: 'humor', createdAt: Date.now() })
      return
    }
    try {
      const res = await fetch('/api/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: `你是一家吸血鬼出版社的编辑。请为已出版书籍《${ms.title}》写一句简短的编辑批语（20字以内）。风格：冷幽默、调侃、吸血鬼视角吐槽。不要剧透。` }),
      })
      const data = await res.json()
      if (data.text) {
        const s = get()
        const m = s.manuscripts.get(id)
        if (m) {
          m.editorNote = data.text.replace(/——/g, '--').replace(/—/g, '-')
          set({ manuscripts: new Map(s.manuscripts), llmCallsRemaining: s.llmCallsRemaining - 1 })
        }
      }
    } catch { /* ignore */ }
  },

  updateCustomNote: (id: string, note: string) => {
    const state = get()
    const ms = state.manuscripts.get(id)
    if (!ms) return
    ms.customNote = note.trim().slice(0, 120)
    set({ manuscripts: new Map(state.manuscripts) })
  },

  solicitFree: () => {
    const state = get()
    if (state.solicitCooldown > 0) return
    const world = buildSolicitWorld(state)
    const count = 2 + Math.floor(Math.random() * 3)
    const spawned: string[] = []
    for (let i = 0; i < count; i++) {
      const ms = createManuscript(world)
      world.manuscripts.set(ms.id, ms)
      spawned.push(ms.title)
    }
    set({
      manuscripts: new Map(world.manuscripts),
      publishedTitles: new Set(world.publishedTitles),
      solicitCooldown: 300,
    })
    get().addToast({
      id: nanoid(),
      text: `向出版业界发布了匿名征稿函。${count}份稿件应声而至：${spawned.join('、')}`,
      type: 'info',
      createdAt: Date.now(),
    })
  },

  solicitTargeted: () => {
    const state = get()
    if (state.solicitCooldown > 0) return
    if (state.currencies.revisionPoints < 30) return
    const world = buildSolicitWorld(state)
    world.currencies.revisionPoints -= 30
    const count = 2 + Math.floor(Math.random() * 2)
    const spawned: string[] = []
    for (let i = 0; i < count; i++) {
      const ms = createManuscript(world, 10)
      world.manuscripts.set(ms.id, ms)
      spawned.push(ms.title)
    }
    set({
      manuscripts: new Map(world.manuscripts),
      publishedTitles: new Set(world.publishedTitles),
      currencies: { ...world.currencies },
      solicitCooldown: 480,
    })
    get().addToast({
      id: nanoid(),
      text: `向${state.preferredGenres.length > 0 ? state.preferredGenres.map(g => ({'sci-fi':'科幻','mystery':'推理','suspense':'悬疑','social-science':'社科','hybrid':'混血','light-novel':'轻小说'}[g] ?? g)).join('、') + '领域' : '各领域'}定向约稿。${count}份高质量稿件已到：${spawned.join('、')}`,
      type: 'info',
      createdAt: Date.now(),
    })
  },

  solicitRush: () => {
    const state = get()
    if (state.currencies.royalties < 100) return
    const world = buildSolicitWorld(state)
    world.currencies.royalties -= 100
    const count = 1 + Math.floor(Math.random() * 2)
    const spawned: string[] = []
    for (let i = 0; i < count; i++) {
      const ms = createManuscript(world)
      world.manuscripts.set(ms.id, ms)
      spawned.push(ms.title)
    }
    set({
      manuscripts: new Map(world.manuscripts),
      publishedTitles: new Set(world.publishedTitles),
      currencies: { ...world.currencies },
      solicitCooldown: 120,
    })
    get().addToast({
      id: nanoid(),
      text: `动用宣传预算紧急征稿。${count}份稿件火速抵达：${spawned.join('、')}`,
      type: 'info',
      createdAt: Date.now(),
    })
  },

  selectTalent: (talentId: string) => {
    const talent = TALENTS.find(t => t.id === talentId)
    if (!talent) return
    const state = get()
    if (state.editorLevel < (TALENT_UNLOCK_LEVELS[talent.tier] ?? 99)) return
    if (state.selectedTalents[talent.tier]) return // Already picked this tier
    set({ selectedTalents: { ...state.selectedTalents, [talent.tier]: talentId } })
    get().addToast({ id: nanoid(), text: `天赋解锁：${talent.label}！${talent.desc.slice(0, 20)}...`, type: 'milestone', createdAt: Date.now() })
  },

  getTalentBonuses: () => {
    const state = get()
    const bonuses: Talent['effects'] = {}
    for (const talentId of Object.values(state.selectedTalents)) {
      const t = TALENTS.find(t => t.id === talentId)
      if (!t) continue
      for (const [k, v] of Object.entries(t.effects)) {
        (bonuses as Record<string, number>)[k] = ((bonuses as Record<string, number>)[k] || 0) + (v as number)
      }
    }
    return bonuses
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
    if (!ms || (ms.status !== 'submitted' && ms.status !== 'cover_select')) return
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
      author.affection += -10
      // Poached probability based on affection
      if (!wasUnsuitable) {
        const poachChance = author.affection >= 50 ? 0.1 : author.affection >= 20 ? 0.25 : 0.5
        if (Math.random() < poachChance) {
          author.poached = true
        }
      }
    }
    set({
      manuscripts: new Map(state.manuscripts),
      authors: new Map(state.authors),
      totalRejections: state.totalRejections + 1,
      editorXP: state.editorXP + 2,
      currencies: {
        ...state.currencies,
        revisionPoints: state.currencies.revisionPoints + rpReward,
        prestige: state.currencies.prestige + prestigeReward,
      },
    })
    const state2 = get()
    if (wasUnsuitable) {
      const authorNote = author?.tier !== 'new' && author ? ` · ${author.name}好感 -10` : ''
      state2.addToast({
        id: nanoid(),
        text: `"${ms.title}" 被果断退回。编辑的眼光又救了一次出版社。+${rpReward} 修订点 +${prestigeReward} 声誉${authorNote}`,
        type: 'info',
        createdAt: Date.now(),
      })
      // LLM rejection commentary
      state2.llmCommentary(ms.title, ms.genre, '被退稿')
    } else {
      const authorNote = author?.tier !== 'new' && author ? ` · ${author.name}好感 -10` : ''
      state2.addToast({
        id: nanoid(),
        text: `"${ms.title}" 已被退回。作者面露不悦——这本书本来还不错。声望 -5${authorNote}`,
        type: 'rejection',
        createdAt: Date.now(),
      })
    }
  },

  shelveManuscript: (id: string) => {
    const state = get()
    const ms = state.manuscripts.get(id)
    if (!ms || ms.status !== 'submitted') return
    ms.status = 'shelved'
    ms.shelvedAt = state.playTicks
    set({ manuscripts: new Map(state.manuscripts) })
    get().addToast({
      id: nanoid(),
      text: `"${ms.title}" 已搁置。作者可能会修改后重新投稿。`,
      type: 'info',
      createdAt: Date.now(),
    })
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
    const author = state.authors.get(ms.authorId)
    if (author) author.affection += 3
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
    if (state.booksPublishedThisMonth >= 10 + (state.publishingQuotaUpgrades || 0)) {
      state.addToast({
        id: nanoid(),
        text: '本月出版额度已用完！下个月再来吧。',
        type: 'info',
        createdAt: Date.now(),
      })
      return
    }
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
    author.affection += 10
    set({ authors: new Map(state.authors) })
  },

  terminateAuthor: (id: string) => {
    const state = get()
    const author = state.authors.get(id)
    if (!author || author.tier === 'new') return
    author.terminated = true
    author.cooldownUntil = null
    set({ authors: new Map(state.authors) })
    get().addToast({
      id: nanoid(),
      text: `合约解除。${author.name}从永夜出版社的作者名单中划去。他的书还在书架上——但新作不会再出现在你桌上了。`,
      type: 'info',
      createdAt: Date.now(),
    })
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

  llmCommentary: async (title: string, genre: string, context: string) => {
    const state = get()
    if (state.llmCallsRemaining <= 0) return
    try {
      const res = await fetch('/api/commentary', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, genre, context }) })
      const data = await res.json()
      if (data.text) {
        if (!data.cached) set({ llmCallsRemaining: state.llmCallsRemaining - 1 })
        get().addToast({ id: nanoid(), text: `[编辑吐槽] ${data.text}`, type: 'info', createdAt: Date.now() })
      }
    } catch { /* ignore */ }
  },

  generateLlmEditorNote: async (id: string) => {
    const state = get()
    if (state.llmCallsRemaining <= 0) return null
    const ms = state.manuscripts.get(id)
    if (!ms) return null

    const prompt = `你是一家吸血鬼出版社的编辑。请用中文写一段对已出版书籍《${ms.title}》的编辑批语。风格：冷幽默、吐槽感、1-2句话。不要剧透。`
    try {
      const res = await fetch('/api/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })
      const data = await res.json()
      if (data.text) {
        set({ llmCallsRemaining: state.llmCallsRemaining - 1 })
        return data.text
      }
    } catch { /* ignore */ }
    return null
  },

  resolveDecision: (optionIndex: number) => {
    const state = get()
    if (!state.pendingDecision) return

    const decision = state.pendingDecision
    const choice = decision.options[optionIndex]
    if (!choice) return

    // Handle cat arrival decision
    if (decision.id === 'cat-arrival') {
      if (optionIndex === 0) {
        // Adopt
        if (state.currencies.royalties >= 300) {
          set({
            pendingDecision: null,
            decisionCooldown: 900,
            catState: { name: '', affection: 20, age: 0, immortal: false, alive: true, immortalityPrompted: false },
            currencies: { ...state.currencies, royalties: state.currencies.royalties - 300 },
          })
          get().addToast({ id: nanoid(), text: '黑猫跳上了书桌。它在一叠稿件上踩了踩，找到了最舒服的位置。你需要给它取个名字。', type: 'milestone', createdAt: Date.now() })
        } else {
          get().addToast({ id: nanoid(), text: '你翻遍了抽屉——版税不够。猫看着你，尾巴尖轻轻摆了一下，然后跳回了窗外。它显然不想给贫穷的人打工。', type: 'info', createdAt: Date.now() })
          set({ pendingDecision: null, decisionCooldown: 900 })
        }
      } else {
        // Shoo
        get().shooCat()
        set({ pendingDecision: null, decisionCooldown: 900 })
      }
      return
    }

    applyDecisionEffect(decision.id, decision.title, optionIndex, state)

    // For LLM-generated decisions, parse and apply effects from description
    applyLLMEffects(choice.description, state)

    set({
      pendingDecision: null,
      decisionCooldown: 900,
    })
  },

  upgradePublishingQuota: () => {
    const state = get()
    const cost = 100 * Math.pow(2, state.publishingQuotaUpgrades || 0)
    if (state.currencies.royalties < cost) return
    set({
      publishingQuotaUpgrades: (state.publishingQuotaUpgrades || 0) + 1,
      currencies: {
        ...state.currencies,
        royalties: state.currencies.royalties - cost,
      },
    })
    get().addToast({
      id: nanoid(),
      text: `每月出版额度 +1！现在为 ${10 + (state.publishingQuotaUpgrades || 0) + 1} 本/月。`,
      type: 'milestone',
      createdAt: Date.now(),
    })
  },

  toggleAutoReview: () => set(s => ({ autoReviewEnabled: !s.autoReviewEnabled })),
  toggleAutoCover: () => set(s => ({ autoCoverEnabled: !s.autoCoverEnabled })),
  toggleAutoReject: () => set(s => ({ autoRejectEnabled: !s.autoRejectEnabled })),

  reissueBook: (id) => {
    const state = get()
    const ms = state.manuscripts.get(id)
    if (!ms || ms.status !== 'published') return
    const cost = 200 + Math.floor(ms.quality * 5)
    if (state.currencies.royalties < cost) {
      get().addToast({ id: nanoid(), text: `再版需要 ${cost} 版税，当前不足。`, type: 'info', createdAt: Date.now() })
      return
    }
    ms.quality = Math.min(100, ms.quality + 3)
    ms.meticulouslyEdited = true
    ms.reissueBoostUntil = state.playTicks + 420 // 7 game-day marketing window
    set({
      manuscripts: new Map(state.manuscripts),
      currencies: { ...state.currencies, royalties: state.currencies.royalties - cost },
    })
    get().addToast({ id: nanoid(), text: `"${ms.title}" 已再版！品质 +3，进入7天营销窗口期。`, type: 'milestone', createdAt: Date.now() })
  },

  buyAuthorMeal: (id) => {
    const state = get()
    const author = state.authors.get(id)
    if (!author || state.currencies.revisionPoints < 20) return
    if (state.playTicks - author.lastInteractionAt < 120) return // 2 min cooldown
    author.affection = Math.min(100, author.affection + 15)
    author.lastInteractionAt = state.playTicks
    set({
      authors: new Map(state.authors),
      currencies: { ...state.currencies, revisionPoints: state.currencies.revisionPoints - 20 },
    })
    const meals = ['一起吃了顿深夜拉面，聊了聊下一本书的构思。', '在出版社对面的茶馆喝了杯茶，讨论了截稿日期——双方都默契地没有提具体的数字。', '去了家隐藏在小巷里的居酒屋，喝到第二杯的时候作者终于承认第三章写得不好。']
    get().addToast({ id: nanoid(), text: `请${author.name}${meals[Math.floor(Math.random() * meals.length)]}好感 +15。`, type: 'info', createdAt: Date.now() })
  },

  sendAuthorGift: (id) => {
    const state = get()
    const author = state.authors.get(id)
    if (!author || state.currencies.revisionPoints < 15) return
    if (state.playTicks - author.lastInteractionAt < 120) return
    author.affection = Math.min(100, author.affection + 10)
    author.lastInteractionAt = state.playTicks
    set({
      authors: new Map(state.authors),
      currencies: { ...state.currencies, revisionPoints: state.currencies.revisionPoints - 15 },
    })
    const gifts = ['寄了一本永夜出版社的经典样书——扉页上只写了"请继续写"。', '送了一支旧羽毛笔，据说是19世纪的。附言："这支笔写过更糟的稿子。别担心。"', '把最新一期的《永夜文学报》夹在一本新书里寄了过去。报纸上有一篇匿名书评——作者看完后哭了。', '寄了一盒红茶——不是你以为的那种红。普通的英式红茶。附卡片："休息一下。你写得太多了。"']
    get().addToast({ id: nanoid(), text: `${author.name}${gifts[Math.floor(Math.random() * gifts.length)]}好感 +10。`, type: 'info', createdAt: Date.now() })
  },

  writeAuthorLetter: (id) => {
    const state = get()
    const author = state.authors.get(id)
    if (!author || state.currencies.revisionPoints < 10) return
    if (state.playTicks - author.lastInteractionAt < 120) return
    author.affection = Math.min(100, author.affection + 8)
    author.lastInteractionAt = state.playTicks
    set({
      authors: new Map(state.authors),
      currencies: { ...state.currencies, revisionPoints: state.currencies.revisionPoints - 10 },
    })
    const letters = ['写了一封手写回信，措辞认真到连标点符号都检查了三遍。', '回了封短信——只有五行字。但作者读了之后在工作室里踱步了半小时。', '在回信的末尾画了一只蝙蝠。作者回了一封邮件：只有一个问号。但ta显然被逗笑了。']
    get().addToast({ id: nanoid(), text: `${author.name}${letters[Math.floor(Math.random() * letters.length)]}好感 +8。`, type: 'info', createdAt: Date.now() })
  },

  generateBookReview: async (title, genre) => {
    try {
      const res = await fetch('/api/book-review', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, genre, type: 'review' }) })
      const data = await res.json()
      return data.text ? { text: data.text, poolSize: data.poolSize || 1 } : null
    } catch { return null }
  },

  generateAuthorQuote: async (title, authorName, genre) => {
    try {
      const res = await fetch('/api/book-review', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: `${title}（作者：${authorName}）`, genre, type: 'quote' }) })
      const data = await res.json()
      return data.text ? { text: data.text, poolSize: data.poolSize || 1 } : null
    } catch { return null }
  },

  rushAuthorCooldown: (id) => {
    const state = get()
    const author = state.authors.get(id)
    if (!author || !author.cooldownUntil || author.cooldownUntil <= 0 || state.currencies.revisionPoints < 30) return
    if (state.playTicks - author.lastInteractionAt < 120) return
    author.cooldownUntil = Math.max(0, Math.floor(author.cooldownUntil * 0.5))
    author.affection = Math.max(0, author.affection - 5)
    author.lastInteractionAt = state.playTicks
    set({
      authors: new Map(state.authors),
      currencies: { ...state.currencies, revisionPoints: state.currencies.revisionPoints - 30 },
    })
    get().addToast({ id: nanoid(), text: `催稿成功！${author.name}的冷却时间减半。好感 -5。`, type: 'info', createdAt: Date.now() })
  },

  hirePR: () => {
    const state = get()
    if (state.prActive) return // Already active
    if (state.currencies.royalties < 200) return
    set({
      currencies: { ...state.currencies, royalties: state.currencies.royalties - 200 },
      prActive: true,
    })
    get().addToast({ id: nanoid(), text: '公关团队已就位！下一本出版的新书将自动进入热销窗口（3天，销量 ×1.5）。', type: 'milestone', createdAt: Date.now() })
  },

  renovateReadingRoom: () => {
    const state = get()
    if (state.readingRoomRenovated) return // Already renovated
    if (state.currencies.royalties < 500) return
    set({
      currencies: { ...state.currencies, royalties: state.currencies.royalties - 500 },
      readingRoomRenovated: true,
    })
    get().addToast({ id: nanoid(), text: '阅览室焕然一新！作者好感获取永久 +20%。', type: 'milestone', createdAt: Date.now() })
  },

  sponsorAward: () => {
    const state = get()
    if (state.currencies.royalties < 1000) return
    const bestsellers = [...state.manuscripts.values()].filter(m => m.status === 'published' && m.isBestseller)
    if (bestsellers.length === 0) return
    const book = bestsellers[Math.floor(Math.random() * bestsellers.length)]
    set({
      currencies: { ...state.currencies, royalties: state.currencies.royalties - 1000, prestige: state.currencies.prestige + 50 },
    })
    get().addToast({ id: nanoid(), text: `赞助文学奖！《${book.title}》获得 +50 声望。`, type: 'milestone', createdAt: Date.now() })
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
}))

function applyDecisionEffect(_id: string, title: string, optionIndex: number, state: GameStore) {
  const set = (partial: Partial<GameStore>) => useGameStore.setState(partial)
  const addToast = (text: string) => {
    const s = useGameStore.getState()
    useGameStore.setState({ toasts: [...s.toasts, { id: nanoid(), text, type: 'milestone' as const, createdAt: Date.now() }].slice(-100) })
  }

  if (title === '评论家提前审读') {
    if (optionIndex === 0) {
      const submitted = [...state.manuscripts.values()].filter(m => m.status === 'submitted')
      const ms = submitted[Math.floor(Math.random() * submitted.length)]
      if (ms) {
        ms.quality = Math.max(0, ms.quality - 10)
        ms.status = 'publishing'
        ms.editingProgress = 0
        set({ manuscripts: new Map(state.manuscripts) })
        addToast(`"${ms.title}" 跳过编辑，直接出版！品质 -10。` )
      }
    }
    return
  }
  if (title === '作者请求加急') {
    if (optionIndex === 0) {
      const submitted = [...state.manuscripts.values()].filter(m => m.status === 'submitted')
      const ms = submitted[Math.floor(Math.random() * submitted.length)]
      if (ms) {
        ms.quality = Math.max(0, ms.quality - 5)
        ms.status = 'publishing'
        set({ manuscripts: new Map(state.manuscripts) })
        addToast(`"${ms.title}" 加急出版！品质 -5。`)
      }
    }
    return
  }
  if (title === '匿名举报') {
    if (optionIndex === 0) {
      const authors = [...state.authors.values()].filter(a => a.tier !== 'new')
      if (authors.length > 0) {
        const a = authors[Math.floor(Math.random() * authors.length)]
        a.cooldownUntil = 1800
        set({ authors: new Map(state.authors) })
      }
      set({ currencies: { ...state.currencies, prestige: state.currencies.prestige + 15 } })
      addToast('调查结束。一位作者被暂时停职。声望 +15。')
    } else {
      set({ currencies: { ...state.currencies, prestige: Math.max(0, state.currencies.prestige - 5) } })
      addToast('搁置举报。声望 -5。')
    }
    return
  }
  if (title === '图书博览会邀请') {
    if (optionIndex === 0) {
      const cost = Math.min(state.currencies.revisionPoints, 50)
      const success = Math.random() < 0.7
      set({
        currencies: {
          ...state.currencies,
          revisionPoints: state.currencies.revisionPoints - cost,
          prestige: state.currencies.prestige + (success ? 30 : 3),
        },
      })
      addToast(success ? '参展大获成功！声望 +30。' : '效果平平，但茶歇点心不错。+3 声望。')
    }
    return
  }
  if (title === '影视改编报价') {
    if (optionIndex === 0) {
      set({ currencies: { ...state.currencies, revisionPoints: state.currencies.revisionPoints + 200 } })
      addToast('买断成交！200 RP 到账。')
    }
    return
  }
  if (title.includes('预支稿费')) {
    if (optionIndex === 0) {
      set({ currencies: { ...state.currencies, revisionPoints: state.currencies.revisionPoints - 50 } })
      addToast('预支 50 RP。作者承诺下本品质 +15。')
    } else {
      if (Math.random() < 0.5) {
        const authors = [...state.authors.values()].filter(a => a.tier !== 'new')
        if (authors.length > 0) {
          const a = authors[Math.floor(Math.random() * authors.length)]
          a.cooldownUntil = 1200
          set({ authors: new Map(state.authors) })
          addToast(`${a.name} 被拒后进入冷却。`)
        }
      }
    }
    return
  }
  if (title.includes('新人推荐')) {
    if (optionIndex === 0) {
      const newcomers = [...state.authors.values()].filter(a => a.tier === 'new')
      if (newcomers.length > 0) {
        const a = newcomers[Math.floor(Math.random() * newcomers.length)]
        a.tier = 'signed'
        set({ authors: new Map(state.authors) })
        addToast(`${a.name} 签约成功！${Math.random() < 0.5 ? '入选新人奖！声望 +30。' : ''}`)
        if (Math.random() < 0.5) {
          set({ currencies: { ...state.currencies, prestige: state.currencies.prestige + 30 } })
        }
      }
    }
    return
  }
  if (title === '印刷厂罢工') {
    if (optionIndex === 0) {
      set({ currencies: { ...state.currencies, revisionPoints: Math.max(0, state.currencies.revisionPoints - 30) } })
      addToast('涨薪同意。印刷继续。')
    } else {
      for (const m of state.manuscripts.values()) {
        if (m.status === 'publishing') m.editingProgress = 0
      }
      set({ manuscripts: new Map(state.manuscripts) })
      addToast('拒绝涨薪。印刷进度归零。')
    }
    return
  }
  if (title === '负面书评风暴') {
    if (optionIndex === 0) {
      set({ currencies: { ...state.currencies, prestige: Math.max(0, state.currencies.prestige - 10) } })
      addToast('公开回应。声望 -10。')
    } else if (optionIndex === 1) {
      set({ currencies: { ...state.currencies, revisionPoints: Math.max(0, state.currencies.revisionPoints - 20) } })
      addToast('私下摆平。花了 20 RP。')
    }
    return
  }
  if (title === '开设分社') {
    if (optionIndex === 0) {
      if (Math.random() < 0.4) {
        addToast('分社开业！作者提交速度 +30%。')
      } else {
        set({ currencies: { ...state.currencies, revisionPoints: Math.max(0, state.currencies.revisionPoints - 500), prestige: Math.max(0, state.currencies.prestige - 100) } })
        addToast('分社失败。500 RP 和 100 声望打水漂。')
      }
    }
    return
  }
  if (title.includes('退休编辑')) {
    if (optionIndex === 0) {
      const signed = [...state.authors.values()].filter(a => a.tier !== 'new')
      for (let i = 0; i < Math.min(3, signed.length); i++) signed[i].cooldownUntil = 1200
      set({ authors: new Map(state.authors), currencies: { ...state.currencies, prestige: state.currencies.prestige + 50 } })
      addToast('回忆录出版！声望 +50。三位作者不满。')
    } else {
      set({ currencies: { ...state.currencies, prestige: state.currencies.prestige + 10 } })
      addToast('劝阻成功。声望 +10。')
    }
    return
  }
  if (title === '茶水间预算') {
    if (optionIndex === 0) {
      set({ currencies: { ...state.currencies, revisionPoints: state.currencies.revisionPoints + 20 } })
      addToast('省下 20 RP。编辑们不开心。')
    } else {
      set({ currencies: { ...state.currencies, revisionPoints: Math.max(0, state.currencies.revisionPoints - 20) } })
      addToast('继续供应。消耗 20 RP。编辑们满意。')
    }
    return
  }

  // ── Affection-risk decision effects ──
  if (title.includes('想换类型')) {
    const author = [...state.authors.values()].find(a => a.tier !== 'new' && a.tier !== 'idol')
    if (author) {
      if (optionIndex === 0) { author.affection = Math.min(100, author.affection + 10); addToast(`${author.name}很感激你的支持。好感 +10。`) }
      else { author.affection = Math.max(0, author.affection - 5); addToast(`${author.name}表示理解。好感 -5。`) }
      set({ authors: new Map(state.authors) })
    }
    return
  }
  if (title.includes('截稿日冲突')) {
    const author = [...state.authors.values()].find(a => a.tier !== 'new')
    if (author) {
      if (optionIndex === 0) { author.affection = Math.min(100, author.affection + 8); addToast(`再给两周。好感 +8。`) }
      else { author.affection = Math.max(0, author.affection - 8); author.cooldownUntil = 600; addToast(`勉强接受。好感 -8。`) }
      set({ authors: new Map(state.authors) })
    }
    return
  }
  if (title.includes('私人请求')) {
    const author = [...state.authors.values()].find(a => a.affection >= 50)
    if (author) {
      if (optionIndex === 0) { author.affection = Math.min(100, author.affection + 5); addToast(`帮忙看了稿子。好感 +5。`) }
      else { author.affection = Math.max(0, author.affection - 5); addToast(`拒绝了。好感 -5。`) }
      set({ authors: new Map(state.authors) })
    }
    return
  }
  if (title.includes('社交媒体')) {
    const author = [...state.authors.values()].find(a => a.tier === 'signed' || a.tier === 'known')
    if (author) {
      if (optionIndex === 0) {
        const prestige = Math.random() < 0.5 ? 15 : -5
        set({ currencies: { ...state.currencies, prestige: state.currencies.prestige + prestige } })
        addToast(`公开支持。舆论：${prestige > 0 ? '正面' : '翻车'}。`)
      } else {
        author.affection = Math.max(0, author.affection - 5)
        set({ authors: new Map(state.authors) })
        addToast(`保持沉默。好感 -5。`)
      }
    }
    return
  }
  addToast(`决策已执行：${title}`)
}

function applyLLMEffects(description: string, state: GameStore) {
  const set = (partial: Partial<GameStore>) => useGameStore.setState(partial)
  const addToast = (text: string) => {
    const s = useGameStore.getState()
    useGameStore.setState({ toasts: [...s.toasts, { id: nanoid(), text, type: 'milestone' as const, createdAt: Date.now() }].slice(-100) })
  }
  let changed = false

  // Parse RP changes: +N RP / -N RP / 获得 N RP / N 修订点
  const rpGain = description.match(/(?:获得|奖励)[\s]*(\d+)\s*(?:RP|修订点)/) || description.match(/\+(\d+)\s*(?:RP|修订点)/)
  const rpLoss = description.match(/[-−](\d+)\s*(?:RP|修订点)/)
  if (rpGain) {
    set({ currencies: { ...state.currencies, revisionPoints: state.currencies.revisionPoints + parseInt(rpGain[1]) } })
    changed = true
  }
  if (rpLoss) {
    set({ currencies: { ...state.currencies, revisionPoints: Math.max(0, state.currencies.revisionPoints - parseInt(rpLoss[1])) } })
    changed = true
  }

  // Parse prestige changes
  const prestigeGain = description.match(/声望[\s]*\+(\d+)/) || description.match(/声誉[\s]*\+(\d+)/)
  const prestigeLoss = description.match(/声望[\s]*[-−](\d+)/) || description.match(/声誉[\s]*[-−](\d+)/)
  if (prestigeGain) {
    set({ currencies: { ...state.currencies, prestige: state.currencies.prestige + parseInt(prestigeGain[1]) } })
    changed = true
  }
  if (prestigeLoss) {
    set({ currencies: { ...state.currencies, prestige: Math.max(0, state.currencies.prestige - parseInt(prestigeLoss[1])) } })
    changed = true
  }

  // Parse quality changes on manuscripts
  const qualityGain = description.match(/品质[\s]*\+(\d+)/) || description.match(/质量[\s]*\+(\d+)/)
  const qualityLoss = description.match(/品质[\s]*[-−](\d+)/) || description.match(/质量[\s]*[-−](\d+)/)
  if (qualityGain || qualityLoss) {
    const qty = qualityGain ? parseInt(qualityGain[1]) : -(parseInt(qualityLoss![1]))
    const submitted = [...state.manuscripts.values()].filter(m => m.status === 'submitted')
    if (submitted.length > 0) {
      const ms = submitted[Math.floor(Math.random() * submitted.length)]
      ms.quality = Math.max(0, Math.min(100, ms.quality + qty))
      set({ manuscripts: new Map(state.manuscripts) })
      changed = true
      addToast(`"${ms.title}" 品质 ${qty > 0 ? '+' + qty : qty}。`)
    }
  }

  // Parse author cooldown
  if (description.includes('冷却') || description.includes('休息')) {
    const authors = [...state.authors.values()].filter(a => a.tier !== 'new')
    if (authors.length > 0) {
      const a = authors[Math.floor(Math.random() * authors.length)]
      const cdMatch = description.match(/(\d+)\s*秒/)
      a.cooldownUntil = cdMatch ? parseInt(cdMatch[1]) : 1200
      set({ authors: new Map(state.authors) })
      changed = true
    }
  }

  if (!changed) {
    // Generic: show what was described but warn no numbers parsed
    addToast(`决策已执行：${description.slice(0, 40)}...`)
  }
}
