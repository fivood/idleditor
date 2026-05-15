import type { DepartmentType, EditorTrait, Genre } from './types'

// Re-export author data from canonical source
export { AUTHOR_PERSONA_NAMES } from './data/authorNames'
export { AUTHOR_PERSONA_PHRASES } from './data/authorPhrases'

// ──── Timing (1 tick = 1 second) ────
export const TICK_MS = 1000

// ──── Base spawn rates ────
export const BASE_MANUSCRIPT_SPAWN_INTERVAL = 30 // ticks between auto-spawns
export const MAX_SUBMITTED_QUEUE = 7

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
export const ROYALTY_BASE_RATE = 0.25 // per tick per book
export const PRESTIGE_PER_PUBLISH = 10
export const PRESTIGE_PER_BESTSELLER = 50

// ──── Bestseller threshold ────
export const BESTSELLER_SALES = 30_000

// ──── Author ────
export const AUTHOR_BASE_TALENT = 30
export const AUTHOR_TALENT_RANGE = 40
export const AUTHOR_BASE_RELIABILITY = 20
export const AUTHOR_RELIABILITY_RANGE = 60
export const AUTHOR_COOLDOWN_BASE = 1800 // 30 min
export const AUTHOR_COOLDOWN_PER_REJECTION = 300 // +5 min per reject
export const AUTHOR_RETURN_QUALITY_BOOST = 3 // quality per rejection
export const MAX_AUTHORS = 20

// ──── Author tier progression ────
export const AUTHOR_FAME_PER_PUBLISH = 10 // base fame per published book
export const AUTHOR_TIER_THRESHOLDS: Record<string, number> = {
  known: 100, // signed → known: ~10 books
  idol: 500,  // known → idol: ~50 books
}

// ──── Genre preference ────
export const GENRE_PREFERENCE_THRESHOLDS = [50, 200, 800, 2000]
export const GENRE_PREFERENCE_QUALITY_BONUS = 5
export const GENRE_PREFERENCE_SALES_BONUS = 0.1

// ──── Author persona names ── (see data/authorNames.ts)

// ──── Department ────
export const DEPARTMENT_BASE_COST_RP = 50
export const DEPARTMENT_COST_MULTIPLIER = 1.5
export const DEPARTMENT_BASE_EFFICIENCY: Record<DepartmentType, number> = {
  editing: 0.5,
  design: 0.3,
  marketing: 0.2,
  rights: 0.15,
}
export const DEPARTMENT_UPGRADE_TICKS_BASE = 180 // 3 min
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

export const BOSS_START_YEARS = 15

// ──── Automation perks ────
export const AUTO_REVIEW_DEPT_LEVEL = 3   // editing dept level >=3 unlocks auto-review
export const AUTO_COVER_PRESTIGE = 100     // prestige >=100 unlocks auto-cover (placeholder)
export const AUTO_REJECT_PRESTIGE = 200    // prestige >=200 + level 5 editing unlocks auto-reject unsuitable
export const PUBLISHING_QUOTA_PER_MONTH = 10

// ──── Author affection ────
export const AFFECTION_PER_PUBLISH = 5
export const AFFECTION_PER_QUALITY_PUBLISH = 3  // bonus if quality >= 60
export const AFFECTION_PER_PROMOTION = 20
export const AFFECTION_PER_SIGN = 10
export const AFFECTION_PER_METICULOUS = 3
export const AFFECTION_REJECT_PENALTY = -10
export const AFFECTION_BAD_PUBLISH_PENALTY = -5
export const AFFECTION_ELITE_TALENT = 60  // talent threshold for elite status
export const AFFECTION_LOYAL = 100
export const AFFECTION_LETTER = 50  // first thank-you threshold

// ──── Milestones (playTicks) ────
export const MILESTONES = [
  { ticks: 0, message: '永夜出版社迎来了又一个平凡的工作日。你在吱嘎作响的旧桌前坐下——这张桌子比你老，但比你短命的主人活得久。' },
  { ticks: 600, message: '第一本书出版。说实话，你在1732年出版第一本书时比现在兴奋。但习惯是个好东西——尤其是当你永远死不了。' },
  { ticks: 1200, message: '你雇了一位人类助理。Ta 最大的资历：不怕吸血鬼，且有一支能写出字的笔。' },
  { ticks: 3600, message: '三个完整的部门组建完毕。创始人伯爵从棺材里给你发了封感谢信——字迹潦草，但心意到了。' },
  { ticks: 10800, message: '第一本畅销书诞生。作者现在自称"文坛新星"。你算了算，以你的寿命，大概还能见证他重孙也获这个奖。' },
  { ticks: 28800, message: '第一座铜像到手。严格来说，是塑料的——毕竟伯爵他老人家虽然活了三个世纪，但预算永远是紧巴巴的。' },
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
  'light-novel': '#2a1a3e',
}

// ──── Author persona signature phrases ── (see data/authorPhrases.ts)