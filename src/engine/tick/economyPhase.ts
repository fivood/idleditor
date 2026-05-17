import { getDeptEfficiency, getCollectionBoost } from '@/core/helpers'
import { royaltyPerTick, salesPerTick } from '@/core/formulas'
import { generateToast } from '@/core/humor/generator'
import { BESTSELLER_SALES, GENRE_PREFERENCE_SALES_BONUS } from '@/core/constants'
import { personaPassiveFor } from '@/core/data/personaPassives'
import type { GameWorldState } from '@/core/gameLoop'
import type { TickResult } from '@/core/types'
import type { PhaseResult, TickContext } from '../types'

export function processEconomyPhase(world: GameWorldState, { ct, talentBonuses, epochMerchant, epochSocialite }: TickContext, result: TickResult): PhaseResult {
  const marketingEfficiency = getDeptEfficiency(world, 'marketing')
  const salesMult = world.activeDateEvent ? world.activeDateEvent.multiplier : 1
  const royaltyMult = world.permanentBonuses.royaltyMultiplier + (epochMerchant ? 0.2 : 0)
  const talentRoyaltyMult = 1 + (talentBonuses.royaltyIncome || 0) + (talentBonuses.allStats || 0)
  const talentSalesBase = 1 + (talentBonuses.salesBoost || 0) + (talentBonuses.allStats || 0)

  const bookstoreByManuscript = new Map<string, typeof world.bookstores[0]>()
  for (const store of world.bookstores) {
    for (const id of store.shelf) {
      bookstoreByManuscript.set(id, store)
    }
  }

  const genrePrefCounts = new Map<string, number>()
  for (const g of world.preferredGenres) {
    genrePrefCounts.set(g, (genrePrefCounts.get(g) || 0) + 1)
  }

  for (const m of world.manuscripts.values()) {
    if (m.status !== 'published') continue
    const royalty = royaltyPerTick(m, royaltyMult, marketingEfficiency)
    const bookAuthor = world.authors.get(m.authorId)
    const authorPassive = bookAuthor ? personaPassiveFor(bookAuthor) : { royaltyBonus: 0, salesBonus: 0, prestigeBonus: 0, bestsellerThresholdReduction: 0 }
    world.currencies.royalties += royalty * (talentRoyaltyMult + authorPassive.royaltyBonus)
    result.royaltiesEarned += royalty
    const hasGenreBuff = world.activeDateEvent && (world.activeDateEvent.genre === null || world.activeDateEvent.genre === m.genre)
    const trendBuff = world.currentTrend === m.genre ? 1.3 : 1
    const prefSalesBonus = 1 + (genrePrefCounts.get(m.genre) || 0) * GENRE_PREFERENCE_SALES_BONUS
    const reissueBoost = (m.reissueBoostUntil && world.playTicks < m.reissueBoostUntil) ? 1.5 : 1
    const collectionBoost = getCollectionBoost(m.genre, world.unlockedCollections)
    const talentSalesMult = talentSalesBase + authorPassive.salesBonus
    let bookstoreMult = 1
    const store = bookstoreByManuscript.get(m.id)
    if (store) {
      bookstoreMult = [1, 1.2, 1.5, 2.0][store.tier] || 1
      if (store.decorated) bookstoreMult *= 1.3
      if (store.signingUntil && world.playTicks < store.signingUntil) bookstoreMult *= 2
    }
    m.salesCount += salesPerTick(marketingEfficiency, m.quality) * (hasGenreBuff ? salesMult : 1) * trendBuff * prefSalesBonus * reissueBoost * collectionBoost * talentSalesMult * bookstoreMult

    if (Math.random() < 0.01 && m.salesCount > 1000) {
      const author = world.authors.get(m.authorId)
      if (author && author.affection < 100) {
        author.affection = Math.min(100, author.affection + 1)
      }
    }

    const bestsellerThreshold = (epochSocialite ? 24000 : BESTSELLER_SALES) - authorPassive.bestsellerThresholdReduction
    if (!m.isBestseller && m.salesCount >= bestsellerThreshold) {
      m.isBestseller = true
      world.totalBestsellers++
      world.currencies.prestige += 50
      result.toasts.push(ct(generateToast('bestseller', {
        title: m.title,
        authorName: world.authors.get(m.authorId)?.name ?? 'Unknown',
        playerName: world.playerName,
        playerGender: world.playerGender ?? '',
      }), 'award'))
    }
  }

  return { world, result }
}
