import type { Author, Department, Manuscript, PermanentBonuses } from './types'
import {
  AUTHOR_BASE_RELIABILITY,
  AUTHOR_BASE_TALENT,
  AUTHOR_RETURN_QUALITY_BOOST,
  AUTHOR_TALENT_RANGE,
  DEPARTMENT_BASE_EFFICIENCY,
  DEPARTMENT_MAX_LEVEL,
  EDITING_TICKS_BASE,
  GENRE_PREFERENCE_THRESHOLDS,
  MANUSCRIPT_QUALITY_MAX,
  MANUSCRIPT_QUALITY_MIN,
  MANUSCRIPT_WORDCOUNT_MIN,
  MANUSCRIPT_WORDCOUNT_MAX,
  MANUSCRIPT_WORDS_PER_TICK,
  MARKET_TREND_MULTIPLIER_MIN,
  MARKET_TREND_MULTIPLIER_MAX,
  PROOFING_TICKS_BASE,
  PUBLISHING_TICKS_BASE,
  REVIEW_TICKS_BASE,
  RP_BASE_PER_PUBLISH,
  RP_PER_EDIT,
  RP_PER_PROOF,
  RP_PER_REVIEW,
  ROYALTY_BASE_RATE,
} from './constants'
import { clamp, rangeInt } from '../utils/random'

// ──── Manuscript generation ────

export function rollQuality(): number {
  return rangeInt(MANUSCRIPT_QUALITY_MIN, MANUSCRIPT_QUALITY_MAX)
}

export function rollWordCount(): number {
  return rangeInt(MANUSCRIPT_WORDCOUNT_MIN, MANUSCRIPT_WORDCOUNT_MAX)
}

export function effectiveQuality(baseQuality: number, talent: number, bonuses: PermanentBonuses): number {
  const talentBonus = (talent - 50) / 100
  return clamp(
    Math.round(baseQuality * (1 + talentBonus) + bonuses.manuscriptQualityBonus),
    0,
    100,
  )
}

export function effectiveMarketPotential(quality: number, marketingEfficiency: number): number {
  return clamp(Math.round(quality * (0.5 + marketingEfficiency)), 0, 100)
}

// ──── Author generation ────

export function rollAuthorTalent(): number {
  return rangeInt(AUTHOR_BASE_TALENT, AUTHOR_BASE_TALENT + AUTHOR_TALENT_RANGE)
}

export function rollAuthorReliability(): number {
  return rangeInt(AUTHOR_BASE_RELIABILITY, AUTHOR_BASE_RELIABILITY + 60)
}

/**
 * 作者交稿节奏（v2.2.2）。
 * 不再是固定 60s，按 persona 的种族节奏分档：
 *  - fast  (~6 min):  凡间快枪手 / 年轻血族叛逆 — 短寿 or 多产
 *  - medium(~20 min): 大部分 — 正常节奏
 *  - slow  (~60 min): 巫妖 / 古魔典守护人 / 风暴女巫 / 血族贵族 / 哀嚎妖 — 长寿、深思
 * 作者可靠性微调 0.7x ~ 1.3x。
 * playerName 不变，但每个作者一生总产量受 maxBooks 限制，
 * 配合长间隔形成"内容有限但游戏时长 200+ 小时"的体验。
 */
export function manuscriptSpawnInterval(author: Author): number {
  // 动态 import 避免循环依赖（personaData 也可能 import formulas）
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PUBLISHING_RHYTHM } = require('./data/personaData') as { PUBLISHING_RHYTHM: { fast: readonly string[]; medium: readonly string[]; slow: readonly string[] } }
  const persona = author.persona as string
  let base: number
  if (PUBLISHING_RHYTHM.fast.includes(persona)) {
    base = 360       // ~6 min
  } else if (PUBLISHING_RHYTHM.slow.includes(persona)) {
    base = 3600      // ~60 min
  } else {
    base = 1200      // ~20 min
  }
  // 可靠性微调（0.7x ~ 1.3x）
  const reliabilityMult = 1.3 - author.reliability / 200
  return Math.max(60, Math.round(base * reliabilityMult))
}

export function authorQualityBoost(author: Author): number {
  return author.rejectedCount * AUTHOR_RETURN_QUALITY_BOOST
}

// ──── Editing timing ────

export function reviewTicks(departmentEfficiency: number): number {
  return Math.max(2, Math.round(REVIEW_TICKS_BASE * (1 - departmentEfficiency)))
}

export function editingTicks(wordCount: number, departmentEfficiency: number): number {
  const baseTicks = Math.ceil(wordCount / MANUSCRIPT_WORDS_PER_TICK)
  return Math.max(5, Math.round(EDITING_TICKS_BASE + baseTicks * (1 - departmentEfficiency)))
}

export function proofingTicks(departmentEfficiency: number): number {
  return Math.max(2, Math.round(PROOFING_TICKS_BASE * (1 - departmentEfficiency)))
}

export function publishingTicks(departmentEfficiency: number): number {
  return Math.max(2, Math.round(PUBLISHING_TICKS_BASE * (1 - departmentEfficiency)))
}

/**
 * v2.6: 封面设计阶段时长（仅当设计部存在时才会进入此阶段）。
 * 基准 90 ticks ≈ 1.5 个游戏日；设计部每提升 1 级约缩短 7%，地板 30 ticks。
 * Lv.0（无设计部）：跳过此阶段，直接出版（覆盖灰阶兜底封面）。
 * Lv.1 ≈ 84 / Lv.3 ≈ 72 / Lv.5 ≈ 60 / Lv.10 ≈ 30
 */
export function coverDesigningTicks(designDeptLevel: number): number {
  if (designDeptLevel <= 0) return 0
  return Math.max(30, Math.round(90 * Math.pow(0.93, designDeptLevel - 1)))
}

// ──── Currency ────

export function rpPerReview(editorSpeedBonus: number): number {
  return Math.round(RP_PER_REVIEW * (1 + editorSpeedBonus))
}

export function rpPerEdit(editorSpeedBonus: number): number {
  return Math.round(RP_PER_EDIT * (1 + editorSpeedBonus))
}

export function rpPerProof(editorSpeedBonus: number): number {
  return Math.round(RP_PER_PROOF * (1 + editorSpeedBonus))
}

export function rpPerPublish(quality: number, rpBonus: number, monthlyIndex = 0): number {
  const decay = 1 - (monthlyIndex * 0.05) // 100% → 50% over ~10 books
  const multiplier = Math.max(0.5, decay)
  return Math.round(RP_BASE_PER_PUBLISH * (quality / 50) * (1 + rpBonus) * multiplier)
}

export function royaltyPerTick(book: Manuscript, royaltyMultiplier: number, marketingEfficiency: number): number {
  const base = ROYALTY_BASE_RATE * (book.salesCount / 10000 + 1)
  const qualityMod = book.quality / 50
  const marketMod = book.marketPotential / 50
  return Math.round(base * qualityMod * marketMod * royaltyMultiplier * (1 + marketingEfficiency) * 10) / 10
}

export function salesPerTick(marketingEfficiency: number, quality: number): number {
  const base = 1.5
  return base * (1 + marketingEfficiency) * (quality / 50)
}

// ──── Department ────

export function departmentUpgradeCostRP(level: number): number {
  return Math.round(50 * Math.pow(1.5, level - 1))
}

export function departmentUpgradeCostPrestige(level: number): number {
  return level <= 3 ? 0 : Math.round(10 * Math.pow(1.3, level - 3))
}

export function departmentEfficiency(department: Department): number {
  const base = DEPARTMENT_BASE_EFFICIENCY[department.type]
  return Math.min(0.95, base * department.level / DEPARTMENT_MAX_LEVEL)
}

// ──── Market trend ────

export function trendMultiplier(): number {
  return MARKET_TREND_MULTIPLIER_MIN + Math.random() * (MARKET_TREND_MULTIPLIER_MAX - MARKET_TREND_MULTIPLIER_MIN)
}

// ──── Prestige ────

export function prestigePerBestseller(totalBestsellers: number): number {
  return 50 + totalBestsellers * 5
}

// ──── Genre preference slots ────

export function getPreferenceSlots(prestige: number): number {
  let slots = 0
  for (const t of GENRE_PREFERENCE_THRESHOLDS) {
    if (prestige >= t) slots++
  }
  return slots
}
