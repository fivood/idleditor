import { MAX_SUBMITTED_QUEUE } from '@/core/constants'
import { createManuscriptWithWorld } from '@/core/factories/manuscriptFactory'
import { rangeInt } from '@/utils/random'
import type { GameWorldState } from '@/core/gameLoop'
import type { TickResult } from '@/core/types'
import type { PhaseResult, TickContext } from '../types'

export function processSpawnPhase(world: GameWorldState, { ct }: TickContext, result: TickResult): PhaseResult {
  world.spawnTimer--
  if (world.solicitCooldown > 0) world.solicitCooldown--

  const submitted = [...world.manuscripts.values()].filter(m => m.status === 'submitted')

  if (world.spawnTimer <= 0) {
    if (submitted.length < MAX_SUBMITTED_QUEUE) {
      const created = createManuscriptWithWorld(world)
      world = created.world
      world.manuscripts.set(created.manuscript.id, created.manuscript)
      result.newManuscripts.push(created.manuscript)
    }
    const spawnRateBonus = world.permanentBonuses.spawnRateBonus
    world.spawnTimer = Math.round((120 + rangeInt(-10, 30)) / (1 + spawnRateBonus))
  }

  const normalSubmitted = submitted.filter(m => {
    const author = world.authors.get(m.authorId)
    return author?.tier !== 'idol'
  })
  const excess = normalSubmitted.length > MAX_SUBMITTED_QUEUE ? normalSubmitted.slice(0, normalSubmitted.length - MAX_SUBMITTED_QUEUE) : []
  const stale = normalSubmitted.filter(m => world.playTicks - m.createdAt > 600)
  const toRemove = new Set([...excess, ...stale].map(m => m.id))
  for (const id of toRemove) {
    world.manuscripts.delete(id)
  }
  if (toRemove.size > 0) {
    result.toasts.push(ct(
      `📮 有的稿件终究没等到审阅它的人。${toRemove.size}份稿子伤心地自我了断了。`,
      'info'
    ))
  }

  return { world, result }
}
