// ──── Genres ────
export type Genre = 'sci-fi' | 'mystery' | 'suspense'   | 'social-science'
  | 'hybrid'
  | 'light-novel'

export const GENRES: Genre[] = ['sci-fi', 'mystery', 'suspense', 'social-science', 'hybrid', 'light-novel']

export const GENRE_LABELS: Record<Genre, string> = {
  'sci-fi': '科幻',
  mystery: '推理',
  suspense: '悬疑',
  'social-science': '社科',
  hybrid: '混血',
  'light-novel': '轻小说',
}

export const GENRE_ICONS: Record<Genre, string> = {
  'sci-fi': '/icons/genre/sci-fi.svg',
  mystery: '/icons/genre/mystery.svg',
  suspense: '/icons/genre/suspense.svg',
  'social-science': '/icons/genre/social-science.svg',
  hybrid: '/icons/genre/hybrid.svg',
  'light-novel': '/icons/genre/light-novel.svg',
}

// ──── Manuscript lifecycle ────
export type ManuscriptStatus =
  | 'submitted'
  | 'reviewing'
  | 'editing'
  | 'proofing'
  | 'cover_select'
  | 'publishing'
  | 'published'
  | 'rejected'
  | 'shelved'

// ──── Author progression (never degrades) ────
export type AuthorTier = 'new' | 'signed' | 'known' | 'idol'

export type AuthorPersona =
  | 'retired-professor'
  | 'basement-scifi-geek'
  | 'ex-intelligence-officer'
  | 'sociology-phd'
  | 'anxious-debut'
  | 'reclusive-latam-writer'
  | 'nordic-crime-queen'
  | 'american-bestseller-machine'
  | 'japanese-lightnovel-otaku'
  | 'historical-detective-writer'
  | 'fantasy-epic-writer'
  | 'french-literary-recluse'
  | 'indian-epic-sage'
  | 'russian-doom-spiral'
  | 'korean-webnovel-queen'
  | 'nigerian-magical-realist'
  | 'australian-outback-gothic'

// ──── Department types ────
export type DepartmentType = 'editing' | 'design' | 'marketing' | 'rights'

// ──── Event types ────
export type EventType = 'market_trend' | 'literary_award' | 'author_break' | 'delivery_delay'

// ──── Toast notification types ────
export type ToastType = 'info' | 'milestone' | 'award' | 'humor' | 'rejection' | 'levelUp'

// ──── Rejection style (purely cosmetic) ────
export type RejectionStyle = 'polite' | 'witty' | 'terse'

// ──── Editor trait ────
export type EditorTrait = 'decisive' | 'meticulous' | 'visionary'

// ──── Core entities ────

export interface Manuscript {
  id: string
  title: string
  authorId: string
  genre: Genre
  quality: number
  wordCount: number
  marketPotential: number
  status: ManuscriptStatus
  editingProgress: number
  createdAt: number
  publishTime: number | null
  isBestseller: boolean
  salesCount: number
  awards: string[]
  cover: BookCover
  synopsis: string
  isUnsuitable: boolean
  rejectionReason: string
  meticulouslyEdited: boolean
  shelvedAt: number | null
  reissueBoostUntil: number | null
  editorNote: string
  customNote: string
}

export interface BookCover {
  type: 'generated' | 'uploaded'
  src: string | null
  placeholder: {
    bgColor: string
    icon: string
    titleOverlay: string
  }
}

export interface Author {
  id: string
  name: string
  persona: AuthorPersona
  genre: Genre
  tier: AuthorTier
  talent: number
  reliability: number
  fame: number
  cooldownUntil: number | null
  rejectedCount: number
  signaturePhrase: string
  affection: number
  poached: boolean
  terminated: boolean
  lastInteractionAt: number
  lastActiveAt: number
  booksWritten: number
  maxBooks: number
}

export interface Department {
  id: string
  type: DepartmentType
  level: number
  upgradeCostRP: number
  upgradeCostPrestige: number
  upgradeTicks: number
  upgradingUntil: number | null
}

export interface CurrencyState {
  revisionPoints: number
  prestige: number
  royalties: number
  statues: number
}

export interface PermanentBonuses {
  manuscriptQualityBonus: number
  editingSpeedBonus: number
  royaltyMultiplier: number
  authorTalentBoost: number
  spawnRateBonus: number
  bossYears: number
  countRelation: number
  countGender: 'male' | 'female'
  epochPath: 'scholar' | 'merchant' | 'socialite' | null
}

export interface PlayerState {
  currencies: CurrencyState
  permanentBonuses: PermanentBonuses
  trait: EditorTrait | null
  totalPublished: number
  totalBestsellers: number
  totalRejections: number
  playTicks: number
  lastSaveTick: number
}

export interface GameEvent {
  id: string
  type: EventType
  title: string
  description: string
  buff: EventBuff | null
  remainingTicks: number
}

export interface EventBuff {
  genre: Genre | null
  salesMultiplier: number
}

export interface ToastMessage {
  id: string
  text: string
  type: ToastType
  createdAt: number
}

// ──── Game tick result ────
export interface TickResult {
  newManuscripts: Manuscript[]
  publishedBooks: Manuscript[]
  royaltiesEarned: number
  toasts: ToastMessage[]
  eventsTriggered: GameEvent[]
  authorsReturned: Author[]
  catDecisionAvailable: boolean
}

export interface CatState {
  name: string
  affection: number
  age: number
  immortal: boolean
  alive: boolean
  immortalityPrompted: boolean
}
