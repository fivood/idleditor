import { manuscriptSpawnInterval } from '../formulas'
import { createManuscriptForAuthor } from '../factories/manuscriptFactory'
import { personaPassiveFor } from '../data/personaPassives'
import type { TickContext } from './types'

export function processAuthorPhase({ world, result }: TickContext) {
  // 7. Tick author cooldowns
  for (const author of world.authors.values()) {
    if (author.poached || author.terminated) continue // Gone or contract terminated
    if (author.cooldownUntil !== null && author.cooldownUntil > 0) {
      author.cooldownUntil--
      if (author.cooldownUntil <= 0) {
        author.cooldownUntil = null
        result.authorsReturned.push(author)
      }
    } else if (author.tier !== 'new') {
      // Active signed+ authors occasionally submit manuscripts
      if (author.booksWritten >= author.maxBooks) continue // Retired / max books reached
      const interval = Math.round(manuscriptSpawnInterval(author) * (1 - personaPassiveFor(author).speedBonus))
      if (world.playTicks % interval === 0) {
        const submitted = [...world.manuscripts.values()].filter(m => m.status === 'submitted')
        const normalSubmitted = submitted.filter(m => world.authors.get(m.authorId)?.tier !== 'idol')
        // Idol authors bypass the queue limit
        if (author.tier === 'idol' || normalSubmitted.length < 7) {
          const ms = createManuscriptForAuthor(world, author)
          world.manuscripts.set(ms.id, ms)
          result.newManuscripts.push(ms)
        }
      }
    }
  }
}
