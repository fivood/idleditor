import { manuscriptSpawnInterval } from '../formulas'
import { createManuscriptForAuthor } from '../factories/manuscriptFactory'
import { personaPassiveFor } from '../data/personaPassives'
import type { TickContext } from './types'

function authorOffset(id: string, interval: number): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0
  return Math.abs(h) % interval
}

export function processAuthorPhase({ world, result, ct }: TickContext) {
  for (const author of world.authors.values()) {
    if (author.poached || author.terminated) continue
    if (author.cooldownUntil !== null && author.cooldownUntil > 0) {
      author.cooldownUntil--
      if (author.cooldownUntil <= 0) {
        author.cooldownUntil = null
        result.authorsReturned.push(author)
      }
    } else if (author.tier !== 'new') {
      if (author.booksWritten >= author.maxBooks) {
        if (author.booksWritten === author.maxBooks && !author.retirementAnnounced) {
          result.toasts.push(ct(
            `📚 ${author.name} 已写完 ${author.maxBooks} 本，正式封笔。其作品将作为永久遗产留存。`,
            'milestone'
          ))
          author.retirementAnnounced = true
        }
        continue
      }
      const interval = Math.round(manuscriptSpawnInterval(author) * (1 - personaPassiveFor(author).speedBonus))
      if ((world.playTicks + authorOffset(author.id, interval)) % interval === 0) {
        const submitted = [...world.manuscripts.values()].filter(m => m.status === 'submitted')
        const normalSubmitted = submitted.filter(m => world.authors.get(m.authorId)?.tier !== 'idol')
        if (author.tier === 'idol' || normalSubmitted.length < 7) {
          const ms = createManuscriptForAuthor(world, author)
          world.manuscripts.set(ms.id, ms)
          result.newManuscripts.push(ms)
        }
      }
    }
  }
}
