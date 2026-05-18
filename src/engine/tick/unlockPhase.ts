import { checkNewUnlocks } from '@/core/progression'
import type { GameWorldState } from '@/core/gameLoop'
import type { TickResult } from '@/core/types'
import type { PhaseResult, TickContext } from '../types'

/**
 * 渐进解锁检测 phase（v2.3）。
 * 每 tick 检查是否有新解锁达成，达成后推 milestone toast 并记录到 announcedUnlocks，
 * 防止重复广播。
 *
 * 必须在 pipeline（出版增加 totalPublished）和 author phase 之后跑。
 */
export function processUnlockPhase(world: GameWorldState, { ct }: TickContext, result: TickResult): PhaseResult {
  const newlyUnlocked = checkNewUnlocks(world)
  for (const toastText of newlyUnlocked) {
    result.toasts.push(ct(toastText, 'milestone'))
  }
  return { world, result }
}
