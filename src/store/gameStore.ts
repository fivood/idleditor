import { create } from 'zustand'
import { enableMapSet } from 'immer'
import { immer } from 'zustand/middleware/immer'
import { createMiscActions } from './actions/miscActions'
import type { Department, EditorTrait, Manuscript, Bookstore, CatState, PermanentBonuses, ToastMessage, Genre } from '@/core/types'
import { GENRE_PREFERENCE_THRESHOLDS } from '@/core/constants'
import type { Decision } from '@/core/decisions'
import { createInitialWorld, tick } from '@/core/gameLoop'
import type { TickResult } from '@/core/types'
import type { GameWorldState } from '@/core/gameLoop'
import { saveGameToDb, loadGameFromDb, hasExistingSave } from '@/db/saveManager'
import { nanoid } from '@/utils/id'
import { generateTemplateDecision } from '@/core/decisions'
import { DECISION_EFFECTS } from '@/core/decisionEffects'
import { loadSynopsisPool } from '@/core/humor/synopsis'
import { loadAuthorNamePool } from '@/core/gameLoop'
import { COUNT_SCENES, type CountScene } from '@/core/countStory'
import { type Talent } from '@/core/talents'
import { COLLECTIONS } from '@/core/collections'
import { EVENT_CHAINS } from '@/core/eventChains'

enableMapSet()

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
          currentTrend: state.currentTrend,
          trendTimer: state.trendTimer,
          blacklistedGenres: state.blacklistedGenres,
          acceptMortalSubmissions: state.acceptMortalSubmissions,
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
  activeEventChain: { chainId: string; step: number } | null
  bookstores: Bookstore[]

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
  toggleBlacklistedGenre: (genre: Genre) => void
  toggleAcceptMortalSubmissions: () => void
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
  openBookstore: () => void
  stockBook: (storeId: string, bookId: string) => void
  unstockBook: (storeId: string, bookId: string) => void
  hostSigning: (storeId: string) => void
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
  setEditorNote: (id: string, note: string) => void

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
  activeEventChain: null,
  bookstores: [],

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
      draft.catPetCooldown = Math.max(0, (draft.catPetCooldown ?? 0) - 1)
      draft.toasts = [...draft.toasts, ...result.toasts].slice(-100)
    })

    // Post-tick: LLM, collections, decisions — need get() for async
    const state = get()

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

    // Event chain trigger
    {
      const cur = get()
      if (cur.activeEventChain && !cur.pendingDecision) {
        const chain = EVENT_CHAINS.find(c => c.id === cur.activeEventChain!.chainId)
        if (chain && cur.activeEventChain!.step < chain.steps.length) {
          const step = chain.steps[cur.activeEventChain!.step]
          set({
            pendingDecision: {
              id: `chain-${chain.id}`,
              title: step.title,
              description: step.description,
              options: step.options.map(o => ({ label: o.label, description: o.description })),
            },
          })
        }
      } else if (!cur.activeEventChain && !cur.pendingDecision && state.playTicks % 900 === 0 && Math.random() < 0.3) {
        const eligible = EVENT_CHAINS.filter(c => c.condition(cur))
        if (eligible.length > 0) {
          const chain = eligible[Math.floor(Math.random() * eligible.length)]
          set({ activeEventChain: { chainId: chain.id, step: 0 } })
        }
      }
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
        currentTrend: state.currentTrend,
        trendTimer: state.trendTimer,
        blacklistedGenres: state.blacklistedGenres,
        acceptMortalSubmissions: state.acceptMortalSubmissions,
      }).catch(() => {})
    }
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

  openBookstore: () => {
    const state = get()
    if (state.bookstores.length >= 3) return
    const costs = [300, 800, 2000]
    const tier = state.bookstores.length + 1
    if (state.currencies.royalties < costs[tier - 1]) return
    const names = ['街角书屋', '地下室文库', '猫与书房', '旧纸堆书店', '墨水巷']
    set(draft => {
      draft.currencies.royalties -= costs[tier - 1]
      draft.bookstores.push({
        id: nanoid(),
        name: names[Math.floor(Math.random() * names.length)],
        tier,
        shelf: [],
        decorated: false,
        signingUntil: null,
      })
    })
    const slots = [4, 6, 8][tier - 1]
    const mult = ['×1.2', '×1.5', '×2.0'][tier - 1]
    get().addToast({
      id: nanoid(),
      text: `你在街角盘下了一家店——"${get().bookstores[get().bookstores.length - 1]?.name || '无名'}"。${slots}个货架位，销量 ${mult}。`,
      type: 'milestone',
      createdAt: get().playTicks,
    })
  },

  stockBook: (storeId, bookId) => {
    const maxSlots = [4, 6, 8]
    set(draft => {
      const store = draft.bookstores.find(s => s.id === storeId)
      const book = draft.manuscripts.get(bookId)
      if (!store || !book || book.status !== 'published') return
      if (store.shelf.includes(bookId)) return
      if (store.shelf.length >= maxSlots[store.tier - 1]) return
      store.shelf.push(bookId)
    })
  },

  unstockBook: (storeId, bookId) => {
    set(draft => {
      const store = draft.bookstores.find(s => s.id === storeId)
      if (!store) return
      store.shelf = store.shelf.filter(id => id !== bookId)
    })
  },

  hostSigning: (storeId) => {
    const state = get()
    if (state.currencies.prestige < 50) return
    set(draft => {
      const store = draft.bookstores.find(s => s.id === storeId)
      if (!store || store.signingUntil) return
      draft.currencies.prestige -= 50
      store.signingUntil = state.playTicks + 180
    })
    get().addToast({
      id: nanoid(),
      text: `签售会开始！${get().bookstores.find(s => s.id === storeId)?.name || '书店'}门口排起了长龙。未来3分钟库存书籍销量 ×2。`,
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
    set(draft => { draft.preferredGenres = draft.preferredGenres.filter(g => g !== genre) })
  },

  ...createMiscActions(set, get),

  syncToCloud: async () => {
    return syncToCloudImpl(get())
  },

  loadFromCloud: async (code) => {
    try {
      const res = await fetch(`/api/load?code=${encodeURIComponent(code)}`)
      if (!res.ok) return false
      const data = await res.json()
      if (!data) return false
      const cloudPermanentBonuses = data.permanentBonuses as Partial<PermanentBonuses> | undefined
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
          epochPath: cloudPermanentBonuses?.epochPath ?? null,
        },
        calendar: data.calendar ?? createInitialWorld().calendar,
        trait: data.trait ?? null,
        preferredGenres: data.preferredGenres ?? [],
        publishingQuotaUpgrades: data.publishingQuotaUpgrades ?? 0,
        autoReviewEnabled: data.autoReviewEnabled ?? true,
        autoCoverEnabled: data.autoCoverEnabled ?? true,
        autoRejectEnabled: data.autoRejectEnabled ?? true,
        currentTrend: data.currentTrend ?? null,
        trendTimer: data.trendTimer ?? 300,
        blacklistedGenres: data.blacklistedGenres ?? [],
        acceptMortalSubmissions: data.acceptMortalSubmissions ?? false,
        triggeredMilestones: new Set(data.triggeredMilestones ?? []),
        cloudSaveCode: code,
        isInitialized: true,
      })
      // Load maps
      if (data.manuscriptsJson) {
        try {
          const entries = JSON.parse(data.manuscriptsJson) as [string, unknown][]
          set(s => { entries.forEach(([k, v]) => s.manuscripts.set(k, v as never)) })
        } catch { /* ignore malformed cloud manuscript data */ }
      }
      if (data.authorsJson) {
        try {
          const entries = JSON.parse(data.authorsJson) as [string, unknown][]
          set(s => { entries.forEach(([k, v]) => s.authors.set(k, v as never)) })
        } catch { /* ignore malformed cloud author data */ }
      }
      if (data.departmentsJson) {
        try {
          const entries = JSON.parse(data.departmentsJson) as [string, unknown][]
          set(s => { entries.forEach(([k, v]) => s.departments.set(k, v as never)) })
        } catch { /* ignore malformed cloud department data */ }
      }
      return true
    } catch {
      return false
    }
  },

  resolveDecision: (optionIndex: number) => {
    const state = get()
    if (!state.pendingDecision) return
    const decision = state.pendingDecision

    // Handle event chains
    if (decision.id?.startsWith('chain-')) {
      const chainId = decision.id.replace('chain-', '')
      const chain = EVENT_CHAINS.find(c => c.id === chainId)
      if (chain && state.activeEventChain) {
        const step = chain.steps[state.activeEventChain.step]
        const choice = step.options[optionIndex]
        if (choice) {
          // Apply effects
          if (choice.effects) {
            set(draft => {
              const e = choice.effects!
              if (e.rp) draft.currencies.revisionPoints = Math.max(0, draft.currencies.revisionPoints + e.rp)
              if (e.prestige) draft.currencies.prestige += e.prestige
              if (e.royalties) draft.currencies.royalties += e.royalties
            })
            if (choice.effects.toastText) {
              get().addToast({ id: nanoid(), text: choice.effects.toastText, type: 'milestone', createdAt: get().playTicks })
            }
          }
          // Advance or end chain
          if (state.activeEventChain.step + 1 < chain.steps.length) {
            set({ activeEventChain: { chainId, step: state.activeEventChain.step + 1 } })
          } else {
            set({ activeEventChain: null })
          }
        }
      }
      set({ pendingDecision: null, decisionCooldown: 900 })
      return
    }

    // Handle cat arrival
    if (decision.id === 'cat-arrival') {
      if (optionIndex === 0) {
        if (state.currencies.royalties >= 300) {
          set({
            pendingDecision: null,
            decisionCooldown: 900,
            catState: { name: '', affection: 20, age: 0, immortal: false, alive: true, immortalityPrompted: false },
            currencies: { ...state.currencies, royalties: state.currencies.royalties - 300 },
          })
          get().addToast({ id: nanoid(), text: '黑猫跳上了书桌。它在一叠稿件上踩了踩，找到了最舒服的位置。你需要给它取个名字。', type: 'milestone', createdAt: get().playTicks })
        } else {
          get().addToast({ id: nanoid(), text: '你翻遍了抽屉——版税不够。猫看着你，尾巴尖轻轻摆了一下，然后跳回了窗外。它显然不想给贫穷的人打工。', type: 'info', createdAt: get().playTicks })
          set({ pendingDecision: null, decisionCooldown: 900 })
        }
      } else {
        get().shooCat()
        set({ pendingDecision: null, decisionCooldown: 900 })
      }
      return
    }

    // Normal template/LLM decision
    const effects = DECISION_EFFECTS[decision.effectId || '']
    if (effects) {
      effects(state, optionIndex)
    }
    set({ pendingDecision: null, decisionCooldown: 900 })
  },

})))
