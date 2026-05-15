import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { Department, EditorTrait, Manuscript, CatState, PermanentBonuses, ToastMessage } from '@/core/types'
import { GENRE_PREFERENCE_THRESHOLDS } from '@/core/constants'
import type { Decision } from '@/core/decisions'
import { createInitialWorld, tick, createManuscript } from '@/core/gameLoop'
import type { TickResult } from '@/core/types'
import type { GameWorldState } from '@/core/gameLoop'
import { saveGameToDb, loadGameFromDb, hasExistingSave } from '@/db/saveManager'
import { nanoid } from '@/utils/id'
import { generateTemplateDecision } from '@/core/decisions'
import { DECISION_EFFECTS } from '@/core/decisionEffects'
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
    `澹版湜锛?{state.currencies.prestige}`,
    `淇鐐癸細${state.currencies.revisionPoints}`,
    `宸插嚭鐗堬細${state.totalPublished}鏈琡,
    `鐣呴攢涔︼細${state.totalBestsellers}鏈琡,
    `閫€绋挎暟锛?{state.totalRejections}`,
    `浣滆€呮暟锛?{state.authors.size}`,
    `閮ㄩ棬鏁帮細${state.departments.size}`,
    `閾滃儚锛?{state.currencies.statues}`,
    `鏈湀宸插嚭鐗堬細${state.booksPublishedThisMonth}/10`,
  ].join('锛?)

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
      `绗?{statues}娆＄邯鍏冦€俙,
      `鏈笘鍑虹増${published.length}鏈功锛屽叾涓?{bestsellers.length}鏈晠閿€涔︺€俙,
      `绱閫€绋?{state.totalRejections}娆°€俙,
      `闆囦剑浜?{authors.length}浣嶄綔鑰咃紝鍏朵腑${idols.length}浣嶆垚涓轰紶濂囥€俙,
      `鏈€楂樺０鏈涜揪鍒?{state.currencies.prestige}銆俙,
      `缂栬緫绛夌骇Lv.${state.editorLevel}銆俙,
      `浼埖鍏崇郴锛?{state.permanentBonuses.countRelation > 0 ? '浜茶繎' : state.permanentBonuses.countRelation < 0 ? '鐤忚繙' : '涓珛'}銆俙,
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

export const useGameStore = create<GameStore>()(immer((set, get) => ({
  // 鈹€鈹€鈹€鈹€ Initial state 鈹€鈹€鈹€鈹€
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

  // 鈹€鈹€鈹€鈹€ Lifecycle 鈹€鈹€鈹€鈹€
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
    set(draft => {
      const result = tick(draft as unknown as GameWorldState)
      draft.decisionCooldown = Math.max(0, (draft.decisionCooldown || 0) - 1)
      draft.toasts = [...draft.toasts, ...result.toasts].slice(-100)
    })

    // Post-tick: LLM, collections, decisions 鈥?need get() for async
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
          title: '绐楀鏉ヤ簡涓€鍙尗',
          description: '涓€鍙粦鐚粠绐楀彴璺充簡杩涙潵锛屽畠鍦ㄤ綘妗屼笂杞簡涓€鍦堬紝闂讳簡闂诲挅鍟℃澂銆備綘绗竴鏃堕棿娌″瀹冨浣曠埇鍒板崄妤兼劅鍒板洶鎯戯紝鑰屾槸鈥斺€?,
          options: [
            { label: '鏉ヤ簡杩樻兂璧帮紵鐣欎笅褰撴瀹狅紙300鐗堢◣锛?, description: '鏀跺吇瀹冦€傝姳璐?00鐗堢◣锛屼粠姝ゅ嚭鐗堢ぞ澶氫竴浣嶆棤钖憳宸ャ€? },
            { label: '鍝潵鐨勫洖鍝幓', description: '鍏充笂绐楁埛銆傚湪鏈勾搴︾粨鏉熶箣鍓嶏紝涓嶄細鏈変笢瑗挎墦鎵颁綘浜嗐€? },
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
          title: '绐楀鏉ヤ簡涓€鍙尗',
          description: '涓€鍙粦鐚粠绐楀彴璺充簡杩涙潵锛屽畠鍦ㄤ綘妗屼笂杞簡涓€鍦堬紝闂讳簡闂诲挅鍟℃澂銆備綘绗竴鏃堕棿娌″瀹冨浣曠埇鍒板崄妤兼劅鍒板洶鎯戯紝鑰屾槸鈥斺€?,
          options: [
            { label: '鏉ヤ簡杩樻兂璧帮紵鐣欎笅褰撴瀹狅紙300鐗堢◣锛?, description: '鏀跺吇瀹冦€傝姳璐?00鐗堢◣锛屼粠姝ゅ嚭鐗堢ぞ澶氫竴浣嶆棤钖憳宸ャ€? },
            { label: '鍝潵鐨勫洖鍝幓', description: '鍏充笂绐楁埛銆傚湪鏈勾搴︾粨鏉熶箣鍓嶏紝涓嶄細鏈変笢瑗挎墦鎵颁綘浜嗐€? },
          ],
        },
      })
    }

    // LLM commentary: occasional witty comments on recent events (30% chance)
    if (newState.llmCallsRemaining > 0 && world.playTicks % 180 === 0 && Math.random() < 0.3) {
      const reviewed = [...world.manuscripts.values()].find(m => m.status === 'editing' || m.status === 'proofing')
      if (reviewed) {
        newState.llmCommentary(reviewed.title, reviewed.genre, '瀹＄閫氳繃')
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
        revisionPoints: 100,
        prestige: 0,
        royalties: 500,
        statues: newStatues,
      },
      toasts: [{
        id: nanoid(),
        text: `浣犺幏寰椾簡绗?{newStatues === 1 ? '涓€' : newStatues}搴ч摐鍍忋€備弗鏍兼潵璇达紝鏄?{newStatues <= 2 ? '濉戞枡' : newStatues <= 4 ? '闀€閾? : '绾粍閾?}鐨勨€斺€旀瘯绔熸湁棰勭畻闄愬埗銆俙,
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
    get().addToast({ id: nanoid(), text: choice.toastText, type: 'milestone', createdAt: get().playTicks })
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
    const label = gender === 'female' ? '濂充集鐖? : '浼埖'
    get().addToast({ id: nanoid(), text: `浼埖妗ｆ宸叉洿鏂般€傛鍚庣О鍛间负锛?{label}銆俙, type: 'milestone', createdAt: get().playTicks })
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
      text: '涓€鍙粦鐚粠绐楀彴璺充簡杩涙潵銆傚畠鍦ㄤ綘妗屼笂杞簡涓€鍦堬紝闂讳簡闂诲挅鍟℃澂锛岀劧鍚庤湻鍦ㄧ浠跺爢涓婂彂鍑轰簡鍜曞櫆澹般€傚畠杩樻病鏈夊悕瀛椻€斺€旂偣鍑荤尗鏉ヤ负瀹冨彇鍚嶃€?,
      type: 'milestone',
      createdAt: get().playTicks,
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
      text: `"${trimmed}"鈥斺€旂尗鎶捣澶达紝浼间箮瀵硅繖涓悕瀛楃暐鏈変笉婊★紝浣嗘渶鍚庤繕鏄墦浜嗕釜鍝堟瑺榛樿浜嗐€俙,
      type: 'info',
      createdAt: get().playTicks,
    })
  },

  petCat: () => {
    const state = get()
    if (!state.catState || !state.catState.alive || state.catPetCooldown > 0) return
    const cat = { ...state.catState }
    cat.affection = Math.min(100, cat.affection + 3)
    set({ catState: cat, catPetCooldown: 60 })
    const reactions = [
      `${cat.name}鍙戝嚭鍜曞櫆澹帮紝鐢ㄥご韫簡韫綘鐨勬墜銆俙,
      `${cat.name}缈讳簡涓韩锛屾妸鑲氬瓙鏆撮湶鍦ㄧ伅鍏変笅銆傝繖鏄渶楂樼骇鍒殑淇′换銆俙,
      `${cat.name}鎳掓磱娲嬪湴鐢╀簡鐢╁熬宸达紝鍦ㄥ崐绌轰腑鐢讳簡涓姬鈥斺€斿ぇ姒傛槸婊℃剰銆俙,
      `${cat.name}鎵撲簡涓搱娆狅紝鐒跺悗鑻ユ棤鍏朵簨鍦拌蛋寮€浜嗐€傝鎽稿浜嗐€俙,
    ]
    get().addToast({ id: nanoid(), text: reactions[Math.floor(Math.random() * reactions.length)] + ' 濂芥劅 +3銆?, type: 'info', createdAt: get().playTicks })
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
      text: `浣犲湪婊℃湀涔嬪灏嗕竴搴ч摐鍍忔蹈鍏ユ硥姘淬€?{cat.name}鑸斾簡鑸旈偅姘粹€斺€旂劧鍚庡畠鐨勭溂鐫涢噷鏄犲嚭浜嗘案鎭掋€備粠姝や互鍚庯紝瀹冨皢涓庝綘鍏变韩鏃犲敖鐨勫鏅氥€俙,
      type: 'milestone',
      createdAt: get().playTicks,
    })
  },

  shooCat: () => {
    const state = get()
    set({ catRejectedUntilYear: state.calendar.year })
    get().addToast({
      id: nanoid(),
      text: '浣犳妸绐楀叧涓婁簡銆傜尗鍙戝嚭涓€澹颁笉婊＄殑"鍠?锛岃烦鍥炰簡澶滆壊涓€傚湪浣犳妸绐楅攣淇ソ涔嬪墠鈥斺€旇嚦灏戝埌鏄庡勾鈥斺€斾笉浼氭湁涓滆タ鎵撴壈浣犱簡銆?,
      type: 'info',
      createdAt: get().playTicks,
    })
  },

  generateEditorNote: async (id: string) => {
    const state = get()
    const ms = state.manuscripts.get(id)
    if (!ms) return
    if (state.llmCallsRemaining <= 0) {
      get().addToast({ id: nanoid(), text: '浣犱粈涔堥兘鎯充笉鍑烘潵锛屼互鍚庡啀璇村惂銆?, type: 'humor', createdAt: get().playTicks })
      return
    }
    try {
      const res = await fetch('/api/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: `浣犳槸涓€瀹跺惛琛€楝煎嚭鐗堢ぞ鐨勭紪杈戙€傝涓哄凡鍑虹増涔︾睄銆?{ms.title}銆嬪啓涓€鍙ョ畝鐭殑缂栬緫鎵硅锛?0瀛椾互鍐咃級銆傞鏍硷細鍐峰菇榛樸€佽皟渚冦€佸惛琛€楝艰瑙掑悙妲姐€備笉瑕佸墽閫忋€俙 }),
      })
      const data = await res.json()
      if (data.text) {
        const s = get()
        const m = s.manuscripts.get(id)
        if (m) {
          m.editorNote = data.text.replace(/鈥斺€?g, '--').replace(/鈥?g, '-')
          set({ manuscripts: new Map(s.manuscripts), llmCallsRemaining: s.llmCallsRemaining - 1 })
          const adverbs = ['蹇冭鏉ユ疆', '鎬濆墠鎯冲悗', '闂插緱娌′簨']
          get().addToast({
            id: nanoid(),
            text: `${s.playerName}${adverbs[Math.floor(Math.random() * adverbs.length)]}锛岀粰銆?{ms.title}銆嬮噸鍐欎簡涓€鏉¤瘎璁猴細${m.editorNote}`,
            type: 'info',
            createdAt: s.playTicks,
          })
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
    set(draft => {
      if (draft.solicitCooldown > 0) return
      const count = 2 + Math.floor(Math.random() * 3)
      const spawned: string[] = []
      for (let i = 0; i < count; i++) {
        const ms = createManuscript(draft)
        draft.manuscripts.set(ms.id, ms)
        spawned.push(ms.title)
      }
      draft.solicitCooldown = 300
      get().addToast({
        id: nanoid(),
        text: `鍚戝嚭鐗堜笟鐣屽彂甯冧簡鍖垮悕寰佺鍑姐€?{count}浠界浠跺簲澹拌€岃嚦锛?{spawned.join('銆?)}`,
        type: 'info',
        createdAt: draft.playTicks,
      })
    })
  },

  solicitTargeted: () => {
    set(draft => {
      if (draft.solicitCooldown > 0) return
      if (draft.currencies.revisionPoints < 30) return
      draft.currencies.revisionPoints -= 30
      const count = 2 + Math.floor(Math.random() * 2)
      const spawned: string[] = []
      for (let i = 0; i < count; i++) {
        const ms = createManuscript(draft, 10)
        draft.manuscripts.set(ms.id, ms)
        spawned.push(ms.title)
      }
      draft.solicitCooldown = 480
      get().addToast({
        id: nanoid(),
        text: `鍚?{draft.preferredGenres.length > 0 ? draft.preferredGenres.map(g => ({'sci-fi':'绉戝够','mystery':'鎺ㄧ悊','suspense':'鎮枒','social-science':'绀剧','hybrid':'娣疯','light-novel':'杞诲皬璇?}[g] ?? g)).join('銆?) + '棰嗗煙' : '鍚勯鍩?}瀹氬悜绾︾銆?{count}浠介珮璐ㄩ噺绋夸欢宸插埌锛?{spawned.join('銆?)}`,
        type: 'info',
        createdAt: draft.playTicks,
      })
    })
  },

  solicitRush: () => {
    set(draft => {
      if (draft.currencies.royalties < 100) return
      draft.currencies.royalties -= 100
      const count = 1 + Math.floor(Math.random() * 2)
      const spawned: string[] = []
      for (let i = 0; i < count; i++) {
        const ms = createManuscript(draft)
        draft.manuscripts.set(ms.id, ms)
        spawned.push(ms.title)
      }
      draft.solicitCooldown = 120
      get().addToast({
        id: nanoid(),
        text: `鍔ㄧ敤瀹ｄ紶棰勭畻绱ф€ュ緛绋裤€?{count}浠界浠剁伀閫熸姷杈撅細${spawned.join('銆?)}`,
        type: 'info',
        createdAt: draft.playTicks,
      })
    })
  },

  selectTalent: (talentId: string) => {
    const talent = TALENTS.find(t => t.id === talentId)
    if (!talent) return
    const state = get()
    if (state.editorLevel < (TALENT_UNLOCK_LEVELS[talent.tier] ?? 99)) return
    if (state.selectedTalents[talent.tier]) return // Already picked this tier
    set({ selectedTalents: { ...state.selectedTalents, [talent.tier]: talentId } })
    get().addToast({ id: nanoid(), text: `澶╄祴瑙ｉ攣锛?{talent.label}锛?{talent.desc.slice(0, 20)}...`, type: 'milestone', createdAt: get().playTicks })
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

  // 鈹€鈹€鈹€鈹€ Manuscript actions 鈹€鈹€鈹€鈹€
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
      const authorNote = author?.tier !== 'new' && author ? ` 路 ${author.name}濂芥劅 -10` : ''
      const quips = [
        `"${ms.title}" 琚灉鏂€€鍥炪€傜紪杈戠殑鐪煎厜鍙堟晳浜嗕竴娆″嚭鐗堢ぞ銆?${rpReward} 淇鐐?+${prestigeReward} 澹拌獕${authorNote}`,
        `閫€绋匡細"${ms.title}"銆傝鑰呬笉闇€瑕佽繖鏈功銆傝瀹炶瘽锛屼綔鑰呭彲鑳戒篃涓嶅お闇€瑕併€?${rpReward} RP`,
        `鍙堜竴鏈瀛愯繘浜嗛€€绋跨銆?${ms.title}"鐨勫皝闈㈣璁″叾瀹炰笉閿欌€斺€斿彲鎯滃唴瀹规病璺熶笂銆?${rpReward} RP +${prestigeReward} 澹版湜`,
        `${ms.title}鈥斺€旈€€銆傜悊鐢卞緢鍏呭垎锛氬啓寰椾笉濂姐€傚叿浣撳摢閲屼笉濂斤紵鍏ㄩ儴銆?${rpReward} RP`,
        `閫€绋裤€?{ms.title}銆嬨€傚瀹屽悗浣犳矇榛樹簡涓夌锛岀劧鍚庢嬁璧蜂簡涓嬩竴鏈€傛案鐢熻€呯殑鑰愬績涔熶笉鏄棤闄愮殑銆?${rpReward} RP`,
        `"${ms.title}"琚€€鍥炰綔鑰呮墜涓€傚笇鏈泃a涓嬫湰鍐欏緱鏇村ソ銆傛垨鑰呰嚦灏戞洿鐭€?${rpReward} RP`,
      ]
      state2.addToast({
        id: nanoid(),
        text: quips[Math.floor(Math.random() * quips.length)],
        type: 'info',
        createdAt: get().playTicks,
      })
      // LLM rejection commentary
      state2.llmCommentary(ms.title, ms.genre, '琚€€绋?)
    } else {
      const authorNote = author?.tier !== 'new' && author ? ` 路 ${author.name}濂芥劅 -10` : ''
      const quips = [
        `"${ms.title}" 宸茶閫€鍥炪€備綔鑰呴潰闇蹭笉鎮︹€斺€旇繖鏈功鏈潵杩樹笉閿欍€傚０鏈?-5${authorNote}`,
        `閫€绋匡細"${ms.title}"銆傝瀹炶瘽锛屽啓寰楄繕琛屸€斺€斾絾杩樿涓嶅銆傚湪姘稿鍑虹増绀撅紝"杩樿"鍜?涓嶅"涔嬮棿鍙樊涓€灏侀€€绋夸俊銆傚０鏈?-5`,
        `浣犻€€鍥炰簡銆?{ms.title}銆嬨€備綔鑰呭ぇ姒備細鐢熶竴闃垫皵鈥斺€斾絾涓€涓椿浜嗕袱鐧惧勾鐨勪汉瀵?涓€闃?鐨勫畾涔夊拰鍒汉涓嶅お涓€鏍枫€傚０鏈?-5`,
        `閫€绋垮喅瀹氾細${ms.title}銆備笉鏄洜涓哄啓寰楀樊锛屾槸鍥犱负鍙互鍐欏緱鏇村ソ銆傝嚦灏戠紪杈戞槸杩欎箞鍛婅瘔鑷繁鐨勩€傚０鏈?-5`,
        `浣犲悎涓娿€?{ms.title}銆嬶紝鍦ㄩ€€绋跨悊鐢辨爮鍐欎簡涓€涓瓧锛?涓?銆傚疄涔犵敓璇存槸涓嶆槸澶畝鐭簡銆備綘璇磋繖涓瓧鑺变簡浣犱袱鐧惧勾鎵嶅浼氥€傚０鏈?-5`,
        `"${ms.title}"閫€鍥炪€備綔鑰呭彲鑳戒細鍐欎竴绡囨劋鎬掔殑鍗氬锛屼篃鍙兘浠庢鍙戞劋鍥惧己銆備綘璧屽悗鑰呪€斺€斿洜涓轰綘鐨勬姇璧勫洖鎶ョ巼涓€鐩翠笉閿欍€傚０鏈?-5`,
      ]
      state2.addToast({
        id: nanoid(),
        text: quips[Math.floor(Math.random() * quips.length)] + (authorNote ? authorNote : ''),
        type: 'rejection',
        createdAt: get().playTicks,
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
      text: `"${ms.title}" 宸叉悂缃€備綔鑰呭彲鑳戒細淇敼鍚庨噸鏂版姇绋裤€俙,
      type: 'info',
      createdAt: get().playTicks,
    })
  },

  meticulousEdit: (id: string, level: 'light' | 'deep' | 'extreme') => {
    const state = get()
    const ms = state.manuscripts.get(id)
    if (!ms || ms.status !== 'editing' || ms.meticulouslyEdited) return

    const costs: Record<string, { rp: number; quality: number; label: string }> = {
      light: { rp: 10, quality: 3, label: '杞诲害绮炬牎' },
      deep: { rp: 30, quality: 8, label: '娣卞害绮炬牎' },
      extreme: { rp: 60, quality: 15, label: '鏋侀檺绮炬牎' },
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
      text: `馃攳 ${option.label}锛氥€?{ms.title}銆嬪搧璐?+${option.quality}锛堣姳璐?${option.rp} RP锛塦,
      type: 'info',
      createdAt: get().playTicks,
    })
  },

  confirmCover: (id: string) => {
    const state = get()
    const ms = state.manuscripts.get(id)
    if (!ms || ms.status !== 'cover_select') return
    if (state.booksPublishedThisMonth >= 10 + (state.publishingQuotaUpgrades || 0)) {
      state.addToast({
        id: nanoid(),
        text: '鏈湀鍑虹増棰濆害宸茬敤瀹岋紒涓嬩釜鏈堝啀鏉ュ惂銆?,
        type: 'info',
        createdAt: get().playTicks,
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

  // 鈹€鈹€鈹€鈹€ Author actions 鈹€鈹€鈹€鈹€
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
      text: `鍚堢害瑙ｉ櫎銆?{author.name}浠庢案澶滃嚭鐗堢ぞ鐨勪綔鑰呭悕鍗曚腑鍒掑幓銆備粬鐨勪功杩樺湪涔︽灦涓娾€斺€斾絾鏂颁綔涓嶄細鍐嶅嚭鐜板湪浣犳涓婁簡銆俙,
      type: 'info',
      createdAt: get().playTicks,
    })
  },

  // 鈹€鈹€鈹€鈹€ Department actions 鈹€鈹€鈹€鈹€
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

  // 鈹€鈹€鈹€鈹€ UI actions 鈹€鈹€鈹€鈹€
  setPlayerName: (name) => set({ playerName: name }),
  setTrait: (trait) => set({ trait }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  dismissToast: (id) => {
    set(state => ({ toasts: state.toasts.filter(t => t.id !== id) }))
  },
  addToast: (toast) => {
    set(state => ({ toasts: [...state.toasts, toast].slice(-100) }))
  },

  // 鈹€鈹€鈹€鈹€ Cloud save 鈹€鈹€鈹€鈹€
  setCloudSaveCode: (code) => set({ cloudSaveCode: code }),

  llmCommentary: async (title: string, genre: string, context: string) => {
    const state = get()
    if (state.llmCallsRemaining <= 0) return
    try {
      const res = await fetch('/api/commentary', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, genre, context }) })
      const data = await res.json()
      if (data.text) {
        if (!data.cached) set({ llmCallsRemaining: state.llmCallsRemaining - 1 })
        get().addToast({ id: nanoid(), text: `[缂栬緫鍚愭Ы] ${data.text}`, type: 'info', createdAt: get().playTicks })
      }
    } catch { /* ignore */ }
  },

  generateLlmEditorNote: async (id: string) => {
    const state = get()
    if (state.llmCallsRemaining <= 0) return null
    const ms = state.manuscripts.get(id)
    if (!ms) return null

    const prompt = `浣犳槸涓€瀹跺惛琛€楝煎嚭鐗堢ぞ鐨勭紪杈戙€傝鐢ㄤ腑鏂囧啓涓€娈靛宸插嚭鐗堜功绫嶃€?{ms.title}銆嬬殑缂栬緫鎵硅銆傞鏍硷細鍐峰菇榛樸€佸悙妲芥劅銆?-2鍙ヨ瘽銆備笉瑕佸墽閫忋€俙
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
          get().addToast({ id: nanoid(), text: '榛戠尗璺充笂浜嗕功妗屻€傚畠鍦ㄤ竴鍙犵浠朵笂韪╀簡韪╋紝鎵惧埌浜嗘渶鑸掓湇鐨勪綅缃€備綘闇€瑕佺粰瀹冨彇涓悕瀛椼€?, type: 'milestone', createdAt: get().playTicks })
        } else {
          get().addToast({ id: nanoid(), text: '浣犵炕閬嶄簡鎶藉眽鈥斺€旂増绋庝笉澶熴€傜尗鐪嬬潃浣狅紝灏惧反灏栬交杞绘憜浜嗕竴涓嬶紝鐒跺悗璺冲洖浜嗙獥澶栥€傚畠鏄剧劧涓嶆兂缁欒传绌风殑浜烘墦宸ャ€?, type: 'info', createdAt: get().playTicks })
          set({ pendingDecision: null, decisionCooldown: 900 })
        }
      } else {
        // Shoo
        get().shooCat()
        set({ pendingDecision: null, decisionCooldown: 900 })
      }
      return
    }

    // Dispatch effect by effectId (replaces old title-matching)
    if (decision.effectId && DECISION_EFFECTS[decision.effectId]) {
      DECISION_EFFECTS[decision.effectId](state, optionIndex)
    } else {
      // Fallback for LLM-generated decisions without effectId
      applyLLMEffects(choice.description, state)
    }

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
      text: `姣忔湀鍑虹増棰濆害 +1锛佺幇鍦ㄤ负 ${10 + (state.publishingQuotaUpgrades || 0) + 1} 鏈?鏈堛€俙,
      type: 'milestone',
      createdAt: get().playTicks,
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
      get().addToast({ id: nanoid(), text: `鍐嶇増闇€瑕?${cost} 鐗堢◣锛屽綋鍓嶄笉瓒炽€俙, type: 'info', createdAt: get().playTicks })
      return
    }
    ms.quality = Math.min(100, ms.quality + 3)
    ms.meticulouslyEdited = true
    ms.reissueBoostUntil = state.playTicks + 420 // 7 game-day marketing window
    set({
      manuscripts: new Map(state.manuscripts),
      currencies: { ...state.currencies, royalties: state.currencies.royalties - cost },
    })
    get().addToast({ id: nanoid(), text: `"${ms.title}" 宸插啀鐗堬紒鍝佽川 +3锛岃繘鍏?澶╄惀閿€绐楀彛鏈熴€俙, type: 'milestone', createdAt: get().playTicks })
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
    const meals = ['涓€璧峰悆浜嗛】娣卞鎷夐潰锛岃亰浜嗚亰涓嬩竴鏈功鐨勬瀯鎬濄€?, '鍦ㄥ嚭鐗堢ぞ瀵归潰鐨勮尪棣嗗枬浜嗘澂鑼讹紝璁ㄨ浜嗘埅绋挎棩鏈熲€斺€斿弻鏂归兘榛樺鍦版病鏈夋彁鍏蜂綋鐨勬暟瀛椼€?, '鍘讳簡瀹堕殣钘忓湪灏忓贩閲岀殑灞呴厭灞嬶紝鍠濆埌绗簩鏉殑鏃跺€欎綔鑰呯粓浜庢壙璁ょ涓夌珷鍐欏緱涓嶅ソ銆?]
    get().addToast({ id: nanoid(), text: `璇?{author.name}${meals[Math.floor(Math.random() * meals.length)]}濂芥劅 +15銆俙, type: 'info', createdAt: get().playTicks })
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
    const gifts = ['瀵勪簡涓€鏈案澶滃嚭鐗堢ぞ鐨勭粡鍏告牱涔︹€斺€旀墘椤典笂鍙啓浜?璇风户缁啓"銆?, '閫佷簡涓€鏀棫缇芥瘺绗旓紝鎹鏄?9涓栫邯鐨勩€傞檮瑷€锛?杩欐敮绗斿啓杩囨洿绯熺殑绋垮瓙銆傚埆鎷呭績銆?', '鎶婃渶鏂颁竴鏈熺殑銆婃案澶滄枃瀛︽姤銆嬪す鍦ㄤ竴鏈柊涔﹂噷瀵勪簡杩囧幓銆傛姤绾镐笂鏈変竴绡囧尶鍚嶄功璇勨€斺€斾綔鑰呯湅瀹屽悗鍝簡銆?, '瀵勪簡涓€鐩掔孩鑼垛€斺€斾笉鏄綘浠ヤ负鐨勯偅绉嶇孩銆傛櫘閫氱殑鑻卞紡绾㈣尪銆傞檮鍗＄墖锛?浼戞伅涓€涓嬨€備綘鍐欏緱澶浜嗐€?']
    get().addToast({ id: nanoid(), text: `${author.name}${gifts[Math.floor(Math.random() * gifts.length)]}濂芥劅 +10銆俙, type: 'info', createdAt: get().playTicks })
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
    const letters = ['鍐欎簡涓€灏佹墜鍐欏洖淇★紝鎺緸璁ょ湡鍒拌繛鏍囩偣绗﹀彿閮芥鏌ヤ簡涓夐亶銆?, '鍥炰簡灏佺煭淇♀€斺€斿彧鏈変簲琛屽瓧銆備絾浣滆€呰浜嗕箣鍚庡湪宸ヤ綔瀹ら噷韪辨浜嗗崐灏忔椂銆?, '鍦ㄥ洖淇＄殑鏈熬鐢讳簡涓€鍙潤铦犮€備綔鑰呭洖浜嗕竴灏侀偖浠讹細鍙湁涓€涓棶鍙枫€備絾ta鏄剧劧琚€楃瑧浜嗐€?]
    get().addToast({ id: nanoid(), text: `${author.name}${letters[Math.floor(Math.random() * letters.length)]}濂芥劅 +8銆俙, type: 'info', createdAt: get().playTicks })
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
      const res = await fetch('/api/book-review', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: `${title}锛堜綔鑰咃細${authorName}锛塦, genre, type: 'quote' }) })
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
    get().addToast({ id: nanoid(), text: `鍌鎴愬姛锛?{author.name}鐨勫喎鍗存椂闂村噺鍗娿€傚ソ鎰?-5銆俙, type: 'info', createdAt: get().playTicks })
  },

  hirePR: () => {
    const state = get()
    if (state.prActive) return // Already active
    if (state.currencies.royalties < 200) return
    set({
      currencies: { ...state.currencies, royalties: state.currencies.royalties - 200 },
      prActive: true,
    })
    get().addToast({ id: nanoid(), text: '鍏叧鍥㈤槦宸插氨浣嶏紒涓嬩竴鏈嚭鐗堢殑鏂颁功灏嗚嚜鍔ㄨ繘鍏ョ儹閿€绐楀彛锛?澶╋紝閿€閲?脳1.5锛夈€?, type: 'milestone', createdAt: get().playTicks })
  },

  renovateReadingRoom: () => {
    const state = get()
    if (state.readingRoomRenovated) return // Already renovated
    if (state.currencies.royalties < 500) return
    set({
      currencies: { ...state.currencies, royalties: state.currencies.royalties - 500 },
      readingRoomRenovated: true,
    })
    get().addToast({ id: nanoid(), text: '闃呰瀹ょ剷鐒朵竴鏂帮紒浣滆€呭ソ鎰熻幏鍙栨案涔?+20%銆?, type: 'milestone', createdAt: get().playTicks })
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
    get().addToast({ id: nanoid(), text: `璧炲姪鏂囧濂栵紒銆?{book.title}銆嬭幏寰?+50 澹版湜銆俙, type: 'milestone', createdAt: get().playTicks })
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
      text: '浣犲湪鍦颁笅瀹ょ殑铚＄儧鍦嗘涓婁妇鍔炰簡涓€鍦烘枃瀛︽矙榫欍€傚嚑浣嶄綔瀹朵妇鐫€绾㈤厭鏉璁轰簡涓変釜灏忔椂鐨?鐏垫劅鏉ユ簮"鈥斺€斿疄闄呭唴瀹规槸璋佺殑缁忕邯浜烘洿绂昏氨銆傛湭鏉?鏈嚭鐗堢殑鍝佽川 +5銆?,
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


// 鈹€鈹€ Decision effect logic moved to core/decisionEffects.ts 鈹€鈹€

function applyLLMEffects(description: string, state: GameStore) {
  const set = (partial: Partial<GameStore>) => useGameStore.setState(partial)
  const addToast = (text: string) => {
    const s = useGameStore.getState()
    useGameStore.setState({ toasts: [...s.toasts, { id: nanoid(), text, type: 'milestone' as const, createdAt: s.playTicks }].slice(-100) })
  }
  let changed = false

  // Parse RP changes: +N RP / -N RP / 鑾峰緱 N RP / N 淇鐐?  const rpGain = description.match(/(?:鑾峰緱|濂栧姳)[\s]*(\d+)\s*(?:RP|淇鐐?/) || description.match(/\+(\d+)\s*(?:RP|淇鐐?/)
  const rpLoss = description.match(/[-鈭抅(\d+)\s*(?:RP|淇鐐?/)
  if (rpGain) {
    set({ currencies: { ...state.currencies, revisionPoints: state.currencies.revisionPoints + parseInt(rpGain[1]) } })
    changed = true
  }
  if (rpLoss) {
    set({ currencies: { ...state.currencies, revisionPoints: Math.max(0, state.currencies.revisionPoints - parseInt(rpLoss[1])) } })
    changed = true
  }

  // Parse prestige changes
  const prestigeGain = description.match(/澹版湜[\s]*\+(\d+)/) || description.match(/澹拌獕[\s]*\+(\d+)/)
  const prestigeLoss = description.match(/澹版湜[\s]*[-鈭抅(\d+)/) || description.match(/澹拌獕[\s]*[-鈭抅(\d+)/)
  if (prestigeGain) {
    set({ currencies: { ...state.currencies, prestige: state.currencies.prestige + parseInt(prestigeGain[1]) } })
    changed = true
  }
  if (prestigeLoss) {
    set({ currencies: { ...state.currencies, prestige: Math.max(0, state.currencies.prestige - parseInt(prestigeLoss[1])) } })
    changed = true
  }

  // Parse quality changes on manuscripts
  const qualityGain = description.match(/鍝佽川[\s]*\+(\d+)/) || description.match(/璐ㄩ噺[\s]*\+(\d+)/)
  const qualityLoss = description.match(/鍝佽川[\s]*[-鈭抅(\d+)/) || description.match(/璐ㄩ噺[\s]*[-鈭抅(\d+)/)
  if (qualityGain || qualityLoss) {
    const qty = qualityGain ? parseInt(qualityGain[1]) : -(parseInt(qualityLoss![1]))
    const submitted = [...state.manuscripts.values()].filter(m => m.status === 'submitted')
    if (submitted.length > 0) {
      const ms = submitted[Math.floor(Math.random() * submitted.length)]
      ms.quality = Math.max(0, Math.min(100, ms.quality + qty))
      set({ manuscripts: new Map(state.manuscripts) })
      changed = true
      addToast(`"${ms.title}" 鍝佽川 ${qty > 0 ? '+' + qty : qty}銆俙)
    }
  }

  // Parse author cooldown
  if (description.includes('鍐峰嵈') || description.includes('浼戞伅')) {
    const authors = [...state.authors.values()].filter(a => a.tier !== 'new')
    if (authors.length > 0) {
      const a = authors[Math.floor(Math.random() * authors.length)]
      const cdMatch = description.match(/(\d+)\s*绉?)
      a.cooldownUntil = cdMatch ? parseInt(cdMatch[1]) : 1200
      set({ authors: new Map(state.authors) })
      changed = true
    }
  }

  if (!changed) {
    // Generic: show what was described but warn no numbers parsed
    addToast(`鍐崇瓥宸叉墽琛岋細${description.slice(0, 40)}...`)
  }
}
