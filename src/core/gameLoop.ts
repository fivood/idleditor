import type { Author, CatState, Department, EditorTrait, GameEvent, Genre, Manuscript, PermanentBonuses, TickResult, ToastMessage } from './types'
import { EDITOR_TRAIT_BONUSES, BOSS_START_YEARS } from './constants'
import { createCalendar } from './calendar'
import type { GameCalendar } from './calendar'
import { type DateEvent } from './dateEvents'
import { levelBonuses } from './leveling'
import { createManuscript } from './factories/manuscriptFactory'
import { loadAuthorNamePool } from './data/authorNames'
import { getTalentEffects } from './helpers'
import { nanoid } from '@/utils/id'
import {
  processCalendarPhase,
  processSpawnPhase,
  processPipelinePhase,
  processEconomyPhase,
  processAuthorPhase,
  processAutomationPhase,
  processRandomEventPhase,
  type TickContext
} from './tick'

// Re-export for consumers
export { loadAuthorNamePool }
export { createManuscript }

// ──── State that the game loop reads/mutates ────
export interface GameWorldState {
  manuscripts: Map<string, Manuscript>
  authors: Map<string, Author>
  departments: Map<string, Department>
  events: GameEvent[]
  playTicks: number
  totalPublished: number
  totalBestsellers: number
  totalRejections: number
  currencies: { revisionPoints: number; prestige: number; royalties: number; statues: number }
  permanentBonuses: PermanentBonuses
  trait: EditorTrait | null
  playerName: string
  calendar: GameCalendar
  spawnTimer: number
  solicitCooldown: number
  awardTimer: number
  trendTimer: number
  triggeredMilestones: Set<number>
  activeDateEvent: DateEvent | null
  coversManifest: Record<string, string> | null
  preferredGenres: Genre[]
  booksPublishedThisMonth: number
  publishedTitles: Set<string>
  editorXP: number
  editorLevel: number
  publishingQuotaUpgrades: number
  autoReviewEnabled: boolean
  autoCoverEnabled: boolean
  autoRejectEnabled: boolean
  unlockedCollections: Set<string>
  prActive: boolean
  readingRoomRenovated: boolean
  selectedTalents: Record<number, string>
  playerGender: 'male' | 'female' | null
  qualityThreshold: number
  catState: CatState | null
  catPetCooldown: number
  catRejectedUntilYear: number
  salonBooksRemaining: number
  activeEventChain: { chainId: string; step: number } | null
  bookstores: import('./types').Bookstore[]
  currentTrend: Genre | null
  blacklistedGenres: Genre[]
  acceptMortalSubmissions: boolean
}

// ──── World initialization ────
export function createInitialWorld(): GameWorldState {
  return {
    manuscripts: new Map(),
    authors: new Map(),
    departments: new Map(),
    events: [],
    playTicks: 0,
    totalPublished: 0,
    totalBestsellers: 0,
    totalRejections: 0,
    currencies: { revisionPoints: 0, prestige: 0, royalties: 0, statues: 0 },
    permanentBonuses: {
      manuscriptQualityBonus: 0,
      editingSpeedBonus: 0,
      royaltyMultiplier: 1,
      authorTalentBoost: 0,
      spawnRateBonus: 0,
      bossYears: BOSS_START_YEARS,
      countRelation: 0,
      countGender: 'male',
      epochPath: null,
    },
    trait: null,
    playerName: '',
    calendar: createCalendar(),
    spawnTimer: 5,
    solicitCooldown: 0,
    awardTimer: 0,
    triggeredMilestones: new Set(),
    activeDateEvent: null,
    coversManifest: null,
    preferredGenres: [],
    booksPublishedThisMonth: 0,
    publishedTitles: new Set(),
    editorXP: 0,
    editorLevel: 1,
    publishingQuotaUpgrades: 0,
    autoReviewEnabled: true,
    autoCoverEnabled: true,
    autoRejectEnabled: true,
    unlockedCollections: new Set(),
    prActive: false,
    readingRoomRenovated: false,
    selectedTalents: {},
    playerGender: null,
    qualityThreshold: 0,
    catState: null,
    catPetCooldown: 0,
    catRejectedUntilYear: 0,
    salonBooksRemaining: 0,
    activeEventChain: null,
    bookstores: [],
    currentTrend: null,
    trendTimer: 300,
    blacklistedGenres: [],
    acceptMortalSubmissions: false,  // 默认关闭：只产出永夜原生题材
  }
}

// ──── Tick function ────
export function tick(world: GameWorldState): TickResult {
  const result: TickResult = {
    newManuscripts: [],
    publishedBooks: [],
    royaltiesEarned: 0,
    toasts: [],
    eventsTriggered: [],
    authorsReturned: [],
    catDecisionAvailable: false,
  }

  world.playTicks++
  const ct = (text: string, type: ToastMessage['type']) =>
    ({ id: nanoid(), text, type, createdAt: world.playTicks })

  // Trait & permanent bonuses
  const trait = world.trait ? EDITOR_TRAIT_BONUSES[world.trait] : { rpBonus: 0, qualityBonus: 0, speedBonus: 0 }
  const talentBonuses = getTalentEffects(world.selectedTalents)
  const lvlBonuses = levelBonuses(world.editorLevel)
  const epochScholar = world.permanentBonuses.epochPath === 'scholar'
  const epochMerchant = world.permanentBonuses.epochPath === 'merchant'
  const epochSocialite = world.permanentBonuses.epochPath === 'socialite'

  const effSpeedBonus = world.permanentBonuses.editingSpeedBonus + trait.speedBonus + (talentBonuses.editSpeed || 0) + (talentBonuses.allStats || 0) + lvlBonuses.speed + (epochScholar ? 0.05 : 0)
  const effRpBonus = trait.rpBonus + (talentBonuses.allStats || 0) + lvlBonuses.rp

  const ctx: TickContext = {
    world,
    result,
    effSpeedBonus,
    effRpBonus,
    talentBonuses,
    lvlBonuses,
    epochScholar,
    epochMerchant,
    epochSocialite,
    ct
  }

  processCalendarPhase(ctx)
  processRandomEventPhase(ctx)
  processSpawnPhase(ctx)
  processPipelinePhase(ctx)
  processEconomyPhase(ctx)
  processAuthorPhase(ctx)
  processAutomationPhase(ctx)

  return result
}

// ──── Offline progress simulation ────
export function computeOfflineProgress(world: GameWorldState, tickCount: number): ReturnType<typeof tick> {
  let combined: ReturnType<typeof tick> = {
    newManuscripts: [],
    publishedBooks: [],
    royaltiesEarned: 0,
    toasts: [],
    eventsTriggered: [],
    authorsReturned: [],
    catDecisionAvailable: false,
  }
  // Simulate ticks in batches to avoid excessive computation
  const maxTicks = Math.min(tickCount, 3600) // Cap at 1 hour
  for (let i = 0; i < maxTicks; i++) {
    const result = tick(world)
    combined.publishedBooks.push(...result.publishedBooks)
    combined.royaltiesEarned += result.royaltiesEarned
    combined.newManuscripts.push(...result.newManuscripts)
    combined.authorsReturned.push(...result.authorsReturned)
  }
  return combined
}
