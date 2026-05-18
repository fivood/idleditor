import type { GameWorldState } from '../gameLoop'

/**
 * 每游戏日灵感获取上限。
 * 防止无脑刷审稿/出版导致灵感通胀。
 */
export const INSPIRATION_DAILY_CAP = 30

/**
 * 灵感获取入口。在每个会增加灵感的地方调用（审稿成功、出版完成等）。
 * 返回实际增加的数量（可能因上限被截断）。
 */
export function gainInspiration(world: GameWorldState, amount: number): number {
  if (amount <= 0) return 0
  const today = world.calendar.totalDays
  if (world.inspirationDailyResetAt !== today) {
    world.inspirationDailyGained = 0
    world.inspirationDailyResetAt = today
  }
  const remaining = Math.max(0, INSPIRATION_DAILY_CAP - world.inspirationDailyGained)
  const actual = Math.min(amount, remaining)
  world.currencies.inspiration += actual
  world.inspirationDailyGained += actual
  return actual
}
