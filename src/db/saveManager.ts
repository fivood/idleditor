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
  triggeredMilestones: Set<number>
  manuscripts: Map<string, Manuscript>
  authors: Map<string, Author>
  departments: Map<string, Department>
  events: GameEvent[]
  activeDateEvent?: import('@/core/dateEvents').DateEvent | null
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
    manuscriptsJson: serializeMap(data.manuscripts),
    authorsJson: serializeMap(data.authors),
    departmentsJson: serializeMap(data.departments),
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
    triggeredMilestones: new Set(save.triggeredMilestones),
    manuscripts: deserializeMap<string, Manuscript>(save.manuscriptsJson),
    authors: deserializeMap<string, Author>(save.authorsJson),
    departments: deserializeMap<string, Department>(save.departmentsJson),
    events: [],
  }
}

export async function hasExistingSave(): Promise<boolean> {
  const count = await db.saves.where('id').equals(DEFAULT_SAVE_ID).count()
  return count > 0
}
