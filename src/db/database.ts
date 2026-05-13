import Dexie, { type EntityTable } from 'dexie'

export interface SavedGame {
  id: string
  name: string
  playTicks: number
  currencies: {
    revisionPoints: number
    prestige: number
    royalties: number
    statues: number
  }
  permanentBonuses: {
    manuscriptQualityBonus: number
    editingSpeedBonus: number
    royaltyMultiplier: number
    authorTalentBoost: number
    spawnRateBonus: number
    bossYears: number
  }
  trait: string | null
  playerName: string
  calendar: { day: number; month: number; year: number; totalDays: number }
  totalPublished: number
  totalBestsellers: number
  totalRejections: number
  triggeredMilestones: number[]
  booksPublishedThisMonth: number
  editorXP: number
  editorLevel: number
  // Serialized maps
  manuscriptsJson: string
  authorsJson: string
  departmentsJson: string
  updatedAt: number
}

export interface PlayerNovel {
  id: string
  title: string
  author: string
  genre: string
  synopsis: string
  recommendation: string
  content: string
  createdAt: number
  readingProgress: number
  wordCount: number
}

const db = new Dexie('IdleEditorDB') as Dexie & {
  saves: EntityTable<SavedGame, 'id'>
  novels: EntityTable<PlayerNovel, 'id'>
}

db.version(3).stores({
  saves: 'id, updatedAt',
  novels: 'id, createdAt',
})

export { db }

export async function loadGame(saveId: string): Promise<SavedGame | undefined> {
  return db.saves.get(saveId)
}

export async function saveGame(save: SavedGame): Promise<void> {
  await db.saves.put(save)
}

export async function deleteSave(saveId: string): Promise<void> {
  await db.saves.delete(saveId)
}

export async function listSaves(): Promise<SavedGame[]> {
  return db.saves.orderBy('updatedAt').reverse().toArray()
}

export function serializeMap<K, V>(map: Map<K, V>): string {
  return JSON.stringify([...map.entries()])
}

export function deserializeMap<K, V>(json: string): Map<K, V> {
  try {
    return new Map(JSON.parse(json))
  } catch {
    return new Map()
  }
}
