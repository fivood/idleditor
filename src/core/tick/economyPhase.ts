import { getDeptEfficiency, getCollectionBoost } from '../helpers'
import { royaltyPerTick, salesPerTick } from '../formulas'
import { generateToast } from '../humor/generator'
import { BESTSELLER_SALES, GENRE_PREFERENCE_SALES_BONUS } from '../constants'
import { personaPassiveFor } from '../data/personaPassives'
import type { TickContext } from './types'

export function processEconomyPhase({ world, result, ct, talentBonuses, epochMerchant, epochSocialite }: TickContext) {
  // 6. Collect royalties and sales
  const marketingEfficiency = getDeptEfficiency(world, 'marketing')
  const salesMult = world.activeDateEvent ? world.activeDateEvent.multiplier : 1
  for (const m of world.manuscripts.values()) {
    if (m.status !== 'published') continue
    const royalty = royaltyPerTick(m, world.permanentBonuses.royaltyMultiplier + (epochMerchant ? 0.2 : 0), marketingEfficiency)
    const bookAuthor = world.authors.get(m.authorId)
    const authorPassive = bookAuthor ? personaPassiveFor(bookAuthor) : { royaltyBonus: 0, salesBonus: 0, prestigeBonus: 0, bestsellerThresholdReduction: 0 }
    world.currencies.royalties += royalty * (1 + (talentBonuses.royaltyIncome || 0) + (talentBonuses.allStats || 0) + authorPassive.royaltyBonus)
    result.royaltiesEarned += royalty
    const hasGenreBuff = world.activeDateEvent && (world.activeDateEvent.genre === null || world.activeDateEvent.genre === m.genre)
    const prefSalesBonus = 1 + world.preferredGenres.filter(g => g === m.genre).length * GENRE_PREFERENCE_SALES_BONUS
    const reissueBoost = (m.reissueBoostUntil && world.playTicks < m.reissueBoostUntil) ? 1.5 : 1
    const collectionBoost = getCollectionBoost(m.genre, world.unlockedCollections)
    const talentSalesMult = 1 + (talentBonuses.salesBoost || 0) + (talentBonuses.allStats || 0) + authorPassive.salesBonus
    // Bookstore boost: stocked books sell faster
    let bookstoreMult = 1
    for (const store of world.bookstores) {
      if (store.shelf.includes(m.id)) {
        bookstoreMult = [1, 1.2, 1.5, 2.0][store.tier] || 1
        if (store.decorated) bookstoreMult *= 1.3
        if (store.signingUntil && world.playTicks < store.signingUntil) bookstoreMult *= 2
        break
      }
    }
    m.salesCount += salesPerTick(marketingEfficiency, m.quality) * (hasGenreBuff ? salesMult : 1) * prefSalesBonus * reissueBoost * collectionBoost * talentSalesMult * bookstoreMult

    // Passive affection gain from good sales (1% chance per tick)
    if (Math.random() < 0.01 && m.salesCount > 1000) {
      const author = world.authors.get(m.authorId)
      if (author && author.affection < 100) {
        author.affection = Math.min(100, author.affection + 1)
      }
    }

    // Check bestseller
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
}
