import type { AuthorPersona, DepartmentType, EditorTrait, Genre } from './types'

// ──── Timing (1 tick = 1 second) ────
export const TICK_MS = 1000

// ──── Base spawn rates ────
export const BASE_MANUSCRIPT_SPAWN_INTERVAL = 30 // ticks between auto-spawns
export const MAX_SUBMITTED_QUEUE = 20

// ──── Manuscript generation ────
export const MANUSCRIPT_QUALITY_MIN = 20
export const MANUSCRIPT_QUALITY_MAX = 85
export const MANUSCRIPT_WORDCOUNT_MIN = 30_000
export const MANUSCRIPT_WORDCOUNT_MAX = 150_000
export const MANUSCRIPT_WORDS_PER_TICK = 500 // editing speed per tick

// ──── Editing stages ────
export const REVIEW_TICKS_BASE = 10
export const EDITING_TICKS_BASE = 30
export const PROOFING_TICKS_BASE = 15
export const PUBLISHING_TICKS_BASE = 8

// ──── Currency rewards ────
export const RP_PER_REVIEW = 5
export const RP_PER_EDIT = 3
export const RP_PER_PROOF = 2
export const RP_BASE_PER_PUBLISH = 50
export const ROYALTY_BASE_RATE = 0.1 // per tick per book
export const PRESTIGE_PER_PUBLISH = 10
export const PRESTIGE_PER_BESTSELLER = 50

// ──── Bestseller threshold ────
export const BESTSELLER_SALES = 100_000

// ──── Author ────
export const AUTHOR_BASE_TALENT = 30
export const AUTHOR_TALENT_RANGE = 40
export const AUTHOR_BASE_RELIABILITY = 20
export const AUTHOR_RELIABILITY_RANGE = 60
export const AUTHOR_COOLDOWN_BASE = 1800 // 30 min
export const AUTHOR_COOLDOWN_PER_REJECTION = 300 // +5 min per reject
export const AUTHOR_RETURN_QUALITY_BOOST = 3 // quality per rejection
export const MAX_AUTHORS = 20

// ──── Author persona names ────
export const AUTHOR_PERSONA_NAMES: Record<AuthorPersona, string[]> = {
  'retired-professor': ['Alistair Finch', 'Margaret Harlow', 'Edmund Cross'],
  'basement-scifi-geek': ['Zane Kepler', 'Luna Quark', 'Rex Nebula'],
  'ex-intelligence-officer': ['Charles Grey', 'Victoria Hale', 'Marcus Stone'],
  'sociology-phd': ['Dr. Priya Nair', 'Dr. Oliver Banks', 'Dr. Simone Webb'],
  'anxious-debut': ['Penny Wodehouse', 'Theo Ashworth', 'Clara Minton'],
}

// ──── Department ────
export const DEPARTMENT_BASE_COST_RP = 50
export const DEPARTMENT_COST_MULTIPLIER = 1.5
export const DEPARTMENT_BASE_EFFICIENCY: Record<DepartmentType, number> = {
  editing: 0.5,
  design: 0.3,
  marketing: 0.2,
  rights: 0.15,
}
export const DEPARTMENT_UPGRADE_TICKS_BASE = 600 // 10 min
export const DEPARTMENT_MAX_LEVEL = 10

// ──── Market trends ────
export const MARKET_TREND_INTERVAL_MIN = 7200 // 2 hours
export const MARKET_TREND_INTERVAL_MAX = 14400 // 4 hours
export const MARKET_TREND_MULTIPLIER_MIN = 1.2
export const MARKET_TREND_MULTIPLIER_MAX = 2.0
export const MARKET_TREND_DURATION = 3600 // 1 hour

// ──── Literary awards ────
export const AWARD_INTERVAL = 21600 // 6 hours
export const AWARD_NOMINATION_THRESHOLD = 60 // quality threshold

// ──── Rebirth ────
export const REBIRTH_THRESHOLD_BESTSELLERS = 1 // how many bestsellers needed
export const REBIRTH_STATUE_BONUSES = {
  qualityPerStatue: 2,
  speedPerStatue: 0.05,
  royaltyPerStatue: 0.1,
  talentPerStatue: 1,
  spawnPerStatue: 0.03,
}

// ──── Milestones (playTicks) ────
export const MILESTONES = [
  { ticks: 0, message: 'You sit down at a creaky old desk. The slush pile awaits.' },
  { ticks: 600, message: 'First manuscript published. It will not be the last — regrettably or otherwise.' },
  { ticks: 1800, message: 'You have hired an assistant. Their chief qualification: owning a functioning pen.' },
  { ticks: 7200, message: 'The press now has three whole departments. HMRC has taken notice.' },
  { ticks: 25200, message: 'Your first bestseller. The author is now insufferable at parties.' },
  { ticks: 36000, message: 'A first bronze statue. It is, technically, plastic. Budget, etc.' },
]

// ──── Editor trait bonuses ────
export const EDITOR_TRAIT_BONUSES: Record<EditorTrait, { rpBonus: number; qualityBonus: number; speedBonus: number }> = {
  decisive: { rpBonus: 0.2, qualityBonus: 0, speedBonus: 0.15 },
  meticulous: { rpBonus: 0, qualityBonus: 0.1, speedBonus: 0 },
  visionary: { rpBonus: 0.1, qualityBonus: 0.05, speedBonus: 0.05 },
}

// ──── Genre colours for placeholder covers ────
export const GENRE_COVER_COLORS: Record<Genre, string> = {
  'sci-fi': '#1a1a2e',
  mystery: '#2d2d1a',
  suspense: '#1a1a1a',
  'social-science': '#2e1a1a',
  hybrid: '#1a2e2d',
}

// ──── Author persona signature phrases ────
export const AUTHOR_PERSONA_PHRASES: Record<AuthorPersona, string[]> = {
  'retired-professor': [
    '"Deadlines are, at best, a suggestion."',
    '"I shall submit when the work is ready, not a moment before."',
  ],
  'basement-scifi-geek': [
    '"The quantum mechanics checks out. I think."',
    '"This draft replaces sleep. Literally."',
  ],
  'ex-intelligence-officer': [
    '"I could tell you where I got this idea, but then I\'d have to..."',
    '"It\'s fiction. Probably."',
  ],
  'sociology-phd': [
    '"The footnotes alone are 40 pages. You\'re welcome."',
    '"I\'ve surveyed 2,000 people about this. They were ... unhelpful."',
  ],
  'anxious-debut': [
    '"It\'s not very good. I mean it might be. Sorry."',
    '"Please don\'t hate it. Or do. I\'ll understand."',
  ],
}
