import { nanoid } from '@/utils/id'
import {
  AWARD_LABELS,
  AWARD_REWARDS,
  collectYearWindow,
  computeAuthorsFirstBook,
  selectWinners,
} from '@/core/awards'
import { collectAwardMemory } from '@/core/dream/memoryCollector'
import type { AwardWinner } from '@/core/awards'
import type { GameWorldState } from '@/core/gameLoop'
import type { TickResult } from '@/core/types'
import type { PhaseResult, TickContext } from '../types'

/**
 * 永夜文学奖 · 年度颁奖 phase（v2.4）
 *
 * 当 calendar.year 推进时，回顾"刚结束的上一年"已出版作品，评出 4 个奖项。
 * 第一次见到日历时只记录 lastAwardYear，不颁奖（首年没有完整年度数据）。
 *
 * 离线追上多年时：依次为每个跳过的年份补颁，避免漏奖。
 */
export function processAwardsPhase(world: GameWorldState, _ctx: TickContext, result: TickResult): PhaseResult {
  const currentYear = world.calendar.year
  const last = world.lastAwardYear ?? 0
  if (last === 0) {
    // 首次进入：以当前年份为"已颁奖"基线，等下次跨年时再触发
    world.lastAwardYear = currentYear
    return { world, result }
  }
  if (currentYear <= last) return { world, result }

  // 为每个跳过的年份补颁
  for (let year = last; year < currentYear; year++) {
    runAwardsForYear(world, year, result)
  }
  world.lastAwardYear = currentYear
  return { world, result }
}

function runAwardsForYear(world: GameWorldState, year: number, result: TickResult): void {
  const window = collectYearWindow(world, year)
  if (window.books.length === 0) return

  const firstBookByAuthor = computeAuthorsFirstBook(world.manuscripts)
  const authorName = (id: string) => world.authors.get(id)?.name ?? '某位匿名作者'
  const winners = selectWinners(window, firstBookByAuthor, authorName)
  if (winners.length === 0) return

  // 仪式开场
  result.toasts.push({
    id: nanoid(),
    text: `🏛️ 第${year}届永夜文学奖颁奖典礼今夜在出版社大厅举行——伯爵罕见地出席并喝光了两杯红酒。共有 ${window.books.length} 部去年出版的作品参评。`,
    type: 'milestone',
    createdAt: world.playTicks,
  })

  // 每个获奖项：发奖、推 toast、给作者好感、写入 manuscript.awards、记入历史
  if (!world.awardHistory) world.awardHistory = []
  for (const w of winners) {
    applyReward(world, w)
    const book = world.manuscripts.get(w.bookId)
    if (book) {
      const tag = `${year}-${w.category}`
      if (!book.awards.includes(tag)) book.awards.push(tag)
    }
    world.awardHistory.push(w)
    pushToast(world, result, w)
    collectAwardMemory(world, {
      category: w.category,
      bookTitle: w.bookTitle,
      authorName: w.authorName,
      year: w.year,
    })
  }
}

function applyReward(world: GameWorldState, w: AwardWinner): void {
  const r = AWARD_REWARDS[w.category]
  world.currencies.prestige += r.prestige
  world.currencies.royalties += r.royalties
  world.currencies.revisionPoints += r.rp
  const author = world.authors.get(w.authorId)
  if (author) author.affection = Math.min(100, author.affection + r.authorAffection)
}

function pushToast(world: GameWorldState, result: TickResult, w: AwardWinner): void {
  const label = AWARD_LABELS[w.category]
  const r = AWARD_REWARDS[w.category]
  const rewards = [
    r.prestige ? `+${r.prestige} 声望` : null,
    r.royalties ? `+${r.royalties} 版税` : null,
    r.rp ? `+${r.rp} RP` : null,
  ].filter(Boolean).join(' · ')
  result.toasts.push({
    id: nanoid(),
    text: `${label}：《${w.bookTitle}》— ${w.authorName}。${w.citation}（${rewards}）`,
    type: 'award',
    createdAt: world.playTicks,
  })
}
