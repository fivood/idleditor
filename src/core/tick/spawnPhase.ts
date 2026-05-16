import { MAX_SUBMITTED_QUEUE } from '../constants'
import { createManuscript } from '../factories/manuscriptFactory'
import { rangeInt } from '@/utils/random'
import type { TickContext } from './types'

export function processSpawnPhase({ world, result, ct }: TickContext) {
  // 1. Spawn manuscripts
  world.spawnTimer--
  if (world.solicitCooldown > 0) world.solicitCooldown--

  const submitted = [...world.manuscripts.values()].filter(m => m.status === 'submitted')

  if (world.spawnTimer <= 0) {
    if (submitted.length < MAX_SUBMITTED_QUEUE) {
      const ms = createManuscript(world)
      world.manuscripts.set(ms.id, ms)
      result.newManuscripts.push(ms)
    }
    const spawnRateBonus = world.permanentBonuses.spawnRateBonus
    world.spawnTimer = Math.round((120 + rangeInt(-10, 30)) / (1 + spawnRateBonus))
  }

  // 1.5 Auto-clear stale submissions (player away too long)
  {
    const normalSubmitted = submitted.filter(m => {
      const author = world.authors.get(m.authorId)
      return author?.tier !== 'idol'
    })
    // Sort oldest-first, remove excess beyond the limit
    const excess = normalSubmitted.length > MAX_SUBMITTED_QUEUE ? normalSubmitted.slice(0, normalSubmitted.length - MAX_SUBMITTED_QUEUE) : []
    // Also remove any that have been sitting for > 600 ticks (10 min)
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
  }
}
