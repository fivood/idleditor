import { manuscriptSpawnInterval } from '@/core/formulas'
import { createManuscriptForAuthorWithWorld } from '@/core/factories/manuscriptFactory'
import { personaPassiveFor } from '@/core/data/personaPassives'
import type { GameWorldState } from '@/core/gameLoop'
import type { TickResult } from '@/core/types'
import type { PhaseResult, TickContext } from '../types'

export function processAuthorPhase(world: GameWorldState, _ctx: TickContext, result: TickResult): PhaseResult {
  for (const author of world.authors.values()) {
    if (author.poached || author.terminated) continue
    if (author.cooldownUntil !== null && author.cooldownUntil > 0) {
      author.cooldownUntil--
      if (author.cooldownUntil <= 0) {
        author.cooldownUntil = null
        result.authorsReturned.push(author)
      }
    } else if (author.tier !== 'new') {
      if (author.booksWritten >= author.maxBooks) continue
      const interval = Math.round(manuscriptSpawnInterval(author) * (1 - personaPassiveFor(author).speedBonus))
      if (world.playTicks % interval === 0) {
        const submitted = [...world.manuscripts.values()].filter(m => m.status === 'submitted')
        const normalSubmitted = submitted.filter(m => world.authors.get(m.authorId)?.tier !== 'idol')
        if (author.tier === 'idol' || normalSubmitted.length < 7) {
          const created = createManuscriptForAuthorWithWorld(world, author)
          world = created.world
          world.manuscripts.set(created.manuscript.id, created.manuscript)
          result.newManuscripts.push(created.manuscript)
        }
      }
    }
  }

  return { world, result }
}
