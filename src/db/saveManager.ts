import type { Author, Department, GameEvent, Manuscript } from '@/core/types'
import type { SavedGame } from './database'
import { db, deserializeMap, serializeMap } from './database'

const DEFAULT_SAVE_ID = 'autosave'

export interface GameSaveData {
  playTicks: number
  currencies: SavedGame['currencies']
  permanentBonuses: SavedGame['permanentBonuses']
  trait: string | null
  playerName: string
  calendar: SavedGame['calendar']
  totalPublished: number
  totalBestsellers: number
  totalRejections: number
  booksPublishedThisMonth: number
  editorXP: number
  editorLevel: number
  publishingQuotaUpgrades: number
  autoReviewEnabled: boolean
  autoCoverEnabled: boolean
  autoRejectEnabled: boolean
  prActive: boolean
  readingRoomRenovated: boolean
  catState: { name: string; affection: number; age: number; immortal: boolean; alive: boolean; immortalityPrompted: boolean } | null
  catPetCooldown: number
  catRejectedUntilYear: number
  triggeredMilestones: Set<number>
  manuscripts: Map<string, Manuscript>
  authors: Map<string, Author>
  departments: Map<string, Department>
  events: GameEvent[]
  activeDateEvent?: import('@/core/dateEvents').DateEvent | null
  currentTrend: import('@/core/types').Genre | null
  trendTimer: number
  blacklistedGenres: import('@/core/types').Genre[]
}

export async function saveGameToDb(data: GameSaveData): Promise<void> {
  const save: SavedGame = {
    id: DEFAULT_SAVE_ID,
    name: 'Autosave',
    playTicks: data.playTicks,
    currencies: data.currencies,
    permanentBonuses: data.permanentBonuses,
    trait: data.trait,
    playerName: data.playerName,
    calendar: data.calendar,
    totalPublished: data.totalPublished,
    totalBestsellers: data.totalBestsellers,
    totalRejections: data.totalRejections,
    triggeredMilestones: [...data.triggeredMilestones],
    booksPublishedThisMonth: data.booksPublishedThisMonth,
    editorXP: data.editorXP,
    editorLevel: data.editorLevel,
    publishingQuotaUpgrades: data.publishingQuotaUpgrades,
    autoReviewEnabled: data.autoReviewEnabled,
    autoCoverEnabled: data.autoCoverEnabled,
    autoRejectEnabled: data.autoRejectEnabled,
    prActive: data.prActive ?? false,
    readingRoomRenovated: data.readingRoomRenovated ?? false,
    catState: data.catState ?? null,
    catPetCooldown: data.catPetCooldown ?? 0,
    catRejectedUntilYear: data.catRejectedUntilYear ?? 0,
    manuscriptsJson: serializeMap(data.manuscripts),
    authorsJson: serializeMap(data.authors),
    departmentsJson: serializeMap(data.departments),
    currentTrend: data.currentTrend,
    trendTimer: data.trendTimer,
    blacklistedGenres: data.blacklistedGenres,
    updatedAt: Date.now(),
  }
  await db.saves.put(save)
}

export async function loadGameFromDb(): Promise<GameSaveData | null> {
  const save = await db.saves.get(DEFAULT_SAVE_ID)
  if (!save) return null

  return {
    playTicks: save.playTicks,
    currencies: save.currencies,
    permanentBonuses: save.permanentBonuses,
    trait: save.trait,
    playerName: save.playerName ?? '',
    calendar: save.calendar ?? { day: 1, month: 0, year: 1, totalDays: 0 },
    totalPublished: save.totalPublished,
    totalBestsellers: save.totalBestsellers,
    totalRejections: save.totalRejections,
    booksPublishedThisMonth: save.booksPublishedThisMonth ?? 0,
    editorXP: save.editorXP ?? 0,
    editorLevel: save.editorLevel ?? 1,
    publishingQuotaUpgrades: save.publishingQuotaUpgrades ?? 0,
    autoReviewEnabled: save.autoReviewEnabled ?? true,
    autoCoverEnabled: save.autoCoverEnabled ?? true,
    autoRejectEnabled: save.autoRejectEnabled ?? true,
    prActive: save.prActive ?? false,
    readingRoomRenovated: save.readingRoomRenovated ?? false,
    catState: save.catState ?? null,
    catPetCooldown: save.catPetCooldown ?? 0,
    catRejectedUntilYear: save.catRejectedUntilYear ?? 0,
    triggeredMilestones: new Set(save.triggeredMilestones),
    manuscripts: deserializeMap<string, Manuscript>(save.manuscriptsJson),
    authors: deserializeMap<string, Author>(save.authorsJson),
    departments: deserializeMap<string, Department>(save.departmentsJson),
    events: [],
    currentTrend: (save as any).currentTrend ?? null,
    trendTimer: (save as any).trendTimer ?? 300,
    blacklistedGenres: (save as any).blacklistedGenres ?? [],
  }
}

export async function hasExistingSave(): Promise<boolean> {
  const count = await db.saves.where('id').equals(DEFAULT_SAVE_ID).count()
  return count > 0
}
