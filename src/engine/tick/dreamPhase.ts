import { dreamToManuscript } from '@/core/dream/dreamFactory'
import type { GameWorldState } from '@/core/gameLoop'
import type { TickResult } from '@/core/types'
import type { PhaseResult, TickContext } from '../types'

/**
 * 梦境创作进度推进 phase（v2.2.3+）。
 *
 * 每 tick：
 *  - 如果有 activeDream，progressTicks++
 *  - 等级 ≥ 5 时再 +0.5 tick（高级编辑梦得更深）
 *  - 进度满后转换为已出版的 Manuscript 入书架，清空 activeDream
 *  - 推送一条 milestone toast 通知玩家
 *
 * 不消耗审稿流水线，独立运行。
 */
export function processDreamPhase(world: GameWorldState, { ct }: TickContext, result: TickResult): PhaseResult {
  const dream = world.activeDream
  if (!dream) return { world, result }

  // 等级加成：每 5 级 +50% 推进速度
  const levelBoost = 1 + Math.floor(world.editorLevel / 5) * 0.5
  dream.progressTicks += levelBoost

  if (dream.progressTicks >= dream.totalTicks) {
    // 完成：创建 Manuscript，存入书架
    const ms = dreamToManuscript(world, dream)
    world.manuscripts.set(ms.id, ms)
    world.publishedTitles.add(ms.title)
    world.totalPublished++

    const wordsK = Math.round(ms.wordCount / 1000)
    result.toasts.push(ct(
      `🌙 你从梦中醒来。《${ms.title}》已经写完了——${wordsK}K 字，品质 ${ms.quality}。这本会作为你的私人创作进入书架。`,
      'milestone'
    ))
    result.publishedBooks.push(ms)

    world.activeDream = null
  }

  return { world, result }
}
