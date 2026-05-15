import type { Author, Department, Manuscript, PermanentBonuses } from './types'
import {
  AUTHOR_BASE_RELIABILITY,
  AUTHOR_BASE_TALENT,
  AUTHOR_RETURN_QUALITY_BOOST,
  AUTHOR_TALENT_RANGE,
  DEPARTMENT_BASE_EFFICIENCY,
  DEPARTMENT_MAX_LEVEL,
  EDITING_TICKS_BASE,
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

export function manuscriptSpawnInterval(author: Author): number {
  const base = 60 // 1 minute base
  return Math.max(10, Math.round(base * (1 - author.reliability / 200)))
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
