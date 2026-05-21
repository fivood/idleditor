/**
 * 记忆碎片采集辅助 · v0.11
 *
 * 提供薄薄一层包装，让 tick phase 不用直接和 PlayerMemory 字段较劲。
 * 调用方传入「这是什么事件」+「玩家上下文」，返回一条 PlayerMemory 推到 world.memories.current。
 */

import { nanoid } from '@/utils/id'
import { IMPORTANCE, pushMemory } from '@/core/memories'
import type { MemoryType, PlayerMemory } from '@/core/memories'
import type { GameWorldState } from '@/core/gameLoop'
import type { Genre } from '@/core/types'

interface MemoryInput {
  type: MemoryType
  text: string
  importance: number
  meta?: {
    bookTitle?: string
    authorName?: string
    genre?: Genre
    quality?: number
  }
}

/** 把一条事件采集为玩家记忆。无副作用：直接 mutate world.memories.current。 */
export function collectMemory(world: GameWorldState, input: MemoryInput): void {
  if (!world.memories) world.memories = { current: [], heirloom: [] }
  const mem: PlayerMemory = {
    id: nanoid(),
    type: input.type,
    text: input.text,
    capturedAt: world.playTicks,
    capturedYear: world.calendar.year,
    capturedEpoch: world.currencies.statues + 1, // 第 N+1 次纪元（铜像数 + 1）
    importance: input.importance,
    meta: input.meta,
  }
  pushMemory(world.memories, mem)
}

// ──── 各场景的便捷函数（让 tick phase 调用更清晰） ────

export function collectPublishMemory(world: GameWorldState, opts: {
  title: string
  authorName: string
  genre: Genre
  quality: number
  isBestseller?: boolean
  isUnsuitable?: boolean
}): void {
  let importance: number
  let text: string
  if (opts.isBestseller) {
    importance = IMPORTANCE.PUBLISH_BESTSELLER
    text = `《${opts.title}》成为畅销书——${opts.authorName} 的稿子被读者抢购一空。`
  } else if (opts.isUnsuitable) {
    importance = IMPORTANCE.PUBLISH_UNSUITABLE
    text = `勉强出版了《${opts.title}》——质量很糟，但编辑部决定让它面世。`
  } else if (opts.quality >= 80) {
    importance = IMPORTANCE.PUBLISH_QUALITY_BOOK
    text = `出版《${opts.title}》（品质 ${opts.quality}）——${opts.authorName} 罕见的精品。`
  } else if (opts.quality >= 60) {
    importance = IMPORTANCE.PUBLISH_DECENT
    text = `出版《${opts.title}》（品质 ${opts.quality}）——${opts.authorName} 的稳健发挥。`
  } else {
    importance = IMPORTANCE.PUBLISH_NORMAL
    text = `出版《${opts.title}》——${opts.authorName} 的普通作品。`
  }
  collectMemory(world, {
    type: 'publish',
    text,
    importance,
    meta: { bookTitle: opts.title, authorName: opts.authorName, genre: opts.genre, quality: opts.quality },
  })
}

export function collectRejectionMemory(world: GameWorldState, opts: {
  title: string
  authorName: string
  genre: Genre
  quality: number
  wasUnsuitable: boolean
}): void {
  // 退烂稿是日常，但退掉好稿子才值得记住
  if (opts.wasUnsuitable) {
    if (opts.quality < 40) return  // 很烂的稿子退掉了不必记
    return  // 即使 unsuitable 但勉强的稿子，也不太值得记
  }
  if (opts.quality < 50) return  // 真的一般，不记
  collectMemory(world, {
    type: 'rejection',
    text: `退稿《${opts.title}》（品质 ${opts.quality}）——可能错过了 ${opts.authorName} 的一部好作品。`,
    importance: opts.quality >= 70 ? IMPORTANCE.REJECT_GOOD_BOOK + 10 : IMPORTANCE.REJECT_GOOD_BOOK,
    meta: { bookTitle: opts.title, authorName: opts.authorName, genre: opts.genre, quality: opts.quality },
  })
}

export function collectAuthorMemory(world: GameWorldState, opts: {
  authorName: string
  kind: 'signed' | 'tier-up' | 'retired' | 'poached'
  newTier?: string
  booksWritten?: number
}): void {
  let importance: number
  let text: string
  switch (opts.kind) {
    case 'signed':
      importance = IMPORTANCE.AUTHOR_SIGNED
      text = `签下了新作者 ${opts.authorName}——开始了一段编辑与作家的纠缠。`
      break
    case 'tier-up':
      importance = IMPORTANCE.AUTHOR_TIER_UP
      text = `${opts.authorName} 晋升为${opts.newTier ?? '更高段位'}——经年的修订笔记终于在书脊上闪光。`
      break
    case 'retired':
      importance = IMPORTANCE.AUTHOR_RETIRED
      text = `${opts.authorName} 写完 ${opts.booksWritten ?? '所有'} 本后封笔——长长的合作画上句号。`
      break
    case 'poached':
      importance = IMPORTANCE.AUTHOR_POACHED
      text = `${opts.authorName} 被竞争对手挖走——退稿那天，没想到会成为分水岭。`
      break
  }
  collectMemory(world, {
    type: 'author',
    text,
    importance,
    meta: { authorName: opts.authorName },
  })
}

export function collectAwardMemory(world: GameWorldState, opts: {
  category: 'best-novel' | 'best-newcomer' | 'best-seller' | 'jury-special'
  bookTitle: string
  authorName: string
  year: number
}): void {
  const labels: Record<typeof opts.category, [string, number]> = {
    'best-novel':    ['🏆 最佳小说',      IMPORTANCE.AWARD_BEST_NOVEL],
    'best-newcomer': ['🌟 最佳新人',      IMPORTANCE.AWARD_NEWCOMER],
    'best-seller':   ['💰 商业奇迹',      IMPORTANCE.AWARD_SELLER],
    'jury-special':  ['🎭 评审团特别奖',  IMPORTANCE.AWARD_JURY],
  }
  const [label, importance] = labels[opts.category]
  collectMemory(world, {
    type: 'milestone',
    text: `第 ${opts.year} 届永夜文学奖 ${label}：《${opts.bookTitle}》——${opts.authorName} 站在了大厅中央。`,
    importance,
    meta: { bookTitle: opts.bookTitle, authorName: opts.authorName },
  })
}

export function collectMilestoneMemory(world: GameWorldState, opts: {
  text: string
  isFirst?: boolean
}): void {
  collectMemory(world, {
    type: 'milestone',
    text: opts.text,
    importance: opts.isFirst ? IMPORTANCE.MILESTONE_FIRST : IMPORTANCE.MILESTONE_LATER,
  })
}

export function collectRandomEventMemory(world: GameWorldState, opts: {
  text: string
  noteworthy?: boolean
}): void {
  collectMemory(world, {
    type: 'random',
    text: opts.text,
    importance: opts.noteworthy ? IMPORTANCE.RANDOM_NOTEWORTHY : IMPORTANCE.RANDOM_TRIVIAL,
  })
}

export function collectDecisionMemory(world: GameWorldState, opts: {
  text: string
  isCountScene?: boolean
}): void {
  collectMemory(world, {
    type: 'decision',
    text: opts.text,
    importance: opts.isCountScene ? IMPORTANCE.COUNT_SCENE : IMPORTANCE.EVENT_CHAIN,
  })
}
