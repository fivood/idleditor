import { manuscriptSpawnInterval } from '@/core/formulas'
import { createManuscriptForAuthorWithWorld } from '@/core/factories/manuscriptFactory'
import { personaPassiveFor } from '@/core/data/personaPassives'
import { MAX_SUBMITTED_QUEUE } from '@/core/constants'
import { collectAuthorMemory } from '@/core/dream/memoryCollector'
import type { GameWorldState } from '@/core/gameLoop'
import type { TickResult } from '@/core/types'
import type { PhaseResult, TickContext } from '../types'

// 用作者 ID 生成稳定的 0-N 偏移，让不同作者错峰提交（避免每分钟整点扎堆）
function authorOffset(id: string, interval: number): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0
  return Math.abs(h) % interval
}

export function processAuthorPhase(world: GameWorldState, ctx: TickContext, result: TickResult): PhaseResult {
  for (const author of world.authors.values()) {
    if (author.poached || author.terminated) continue
    if (author.cooldownUntil !== null && author.cooldownUntil > 0) {
      author.cooldownUntil--
      if (author.cooldownUntil <= 0) {
        author.cooldownUntil = null
        result.authorsReturned.push(author)
      }
    } else if (author.tier !== 'new') {
      // 封笔检测：刚跨过 maxBooks 时推送一次性 toast
      if (author.booksWritten >= author.maxBooks) {
        // 通过 newlyRetired flag 防止重复推送（首次跨过时设 true）
        // 这里用 booksWritten === maxBooks 作为"刚封笔"的标记
        if (author.booksWritten === author.maxBooks && !author.retirementAnnounced) {
          result.toasts.push(ctx.ct(
            `📚 ${author.name} 已写完 ${author.maxBooks} 本，正式封笔。其作品将作为永久遗产留存。`,
            'milestone'
          ))
          author.retirementAnnounced = true
          collectAuthorMemory(world, { authorName: author.name, kind: 'retired', booksWritten: author.booksWritten })
        }
        continue
      }
      const interval = Math.round(manuscriptSpawnInterval(author) * (1 - personaPassiveFor(author).speedBonus))
      // 错峰提交：每个作者用自己 ID hash 决定偏移
      if ((world.playTicks + authorOffset(author.id, interval)) % interval === 0) {
        const submitted = [...world.manuscripts.values()].filter(m => m.status === 'submitted')
        const normalSubmitted = submitted.filter(m => world.authors.get(m.authorId)?.tier !== 'idol')
        if (author.tier === 'idol' || normalSubmitted.length < MAX_SUBMITTED_QUEUE) {
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
