/**
 * 永夜文学奖 · 年度颁奖
 *
 * 每年游戏年份切换时（calendar.year++）评出 4 个奖项，覆盖上一年度全部已出版作品。
 * 评选纯函数化：吃一个 `BookEntry[]` 列表 + 上一年的年份，出 `AwardResult[]`。
 *
 * 设计原则：
 *  - 不依赖随机数（除"特别奖"抽签）；同样输入产出同样结果，便于测试和回放。
 *  - 候选不足时跳过该奖项，不强凑。
 *  - 同书最多拿 2 个奖（避免一书通杀失去张力）。
 */

import { totalDaysToCalendar } from './calendar'
import type { Manuscript } from './types'

export type AwardCategory =
  | 'best-novel'        // 🏆 最佳小说
  | 'best-newcomer'     // 🌟 最佳新人
  | 'best-seller'       // 💰 商业奇迹
  | 'jury-special'      // 🎭 评审团特别奖

export interface AwardWinner {
  year: number
  category: AwardCategory
  bookId: string
  bookTitle: string
  bookGenre: string
  authorId: string
  authorName: string
  quality: number
  salesCount: number
  /** 奖项颁出时的"获奖词"——固定文案池，不走 LLM */
  citation: string
}

export const AWARD_LABELS: Record<AwardCategory, string> = {
  'best-novel': '🏆 最佳小说',
  'best-newcomer': '🌟 最佳新人',
  'best-seller': '💰 商业奇迹',
  'jury-special': '🎭 评审团特别奖',
}

/** 各奖项给玩家的奖励（也会给作者好感） */
export const AWARD_REWARDS: Record<AwardCategory, { prestige: number; royalties: number; rp: number; authorAffection: number }> = {
  'best-novel':      { prestige: 50, royalties: 200, rp: 30, authorAffection: 20 },
  'best-newcomer':   { prestige: 30, royalties: 100, rp: 20, authorAffection: 25 },
  'best-seller':     { prestige: 15, royalties: 500, rp: 10, authorAffection: 10 },
  'jury-special':    { prestige: 15, royalties:  50, rp: 15, authorAffection: 10 },
}

const CITATIONS: Record<AwardCategory, string[]> = {
  'best-novel': [
    '"评审团一致认为，这本书做到了所有人都希望做到、但很少有人真正做到的事——读完了还想再读一遍。"',
    '"在永夜的纪元里，这样的文字是稀罕物。它配得上一座铜像，也配得上一杯陈年红酒。"',
    '"它没有炫技，没有故作高深。它只是好。这年头，好就够了。"',
  ],
  'best-newcomer': [
    '"我们记下这个名字。明年我们还会再听到的。"',
    '"第一本书就这样写，下一本会不会逊色？编辑部已经压了不少赌注。"',
    '"颁奖词写得短，因为这位作家未来还有很多年可以继续写。"',
  ],
  'best-seller': [
    '"作者向编辑部说他根本没想到会卖这么多。读者向我们说同样的话。市场就是这样神秘。"',
    '"销量证明了一件事：即使是永生者，也无法对一本好故事的传播速度作出预判。"',
    '"市场部宣布将开瓶香槟。会计部建议先把版税分了再说。"',
  ],
  'jury-special': [
    '"它没得最佳，但有些东西无法用奖项归类。评审团决定为它单独留一个位置。"',
    '"在所有候选作品里，它最难评——所以评审团把它放到了一个无法被归类的奖里。"',
    '"严格说这本书不该得奖，但严格说很多事都不该。评审团破了规矩。"',
  ],
}

export interface AwardWindow {
  year: number
  books: Manuscript[]
}

/** 提取上一年度已出版的书 */
export function collectYearWindow(world: { manuscripts: Map<string, Manuscript> }, year: number): AwardWindow {
  const books: Manuscript[] = []
  for (const m of world.manuscripts.values()) {
    if (m.status !== 'published') continue
    if (m.publishTime == null) continue
    const ttlDays = Math.floor(m.publishTime / 60)
    const cal = totalDaysToCalendar(ttlDays)
    if (cal.year === year) books.push(m)
  }
  return { year, books }
}

function pickCitation(category: AwardCategory): string {
  const pool = CITATIONS[category]
  return pool[Math.floor(Math.random() * pool.length)]
}

/**
 * 主评选逻辑：传入候选窗口 + 该年已知"首作作者集合"，返回获奖列表。
 * 评选规则：
 *  - 最佳小说 = 品质最高（≥60 才有资格）
 *  - 最佳新人 = 该书是作者第一本已出版作品里最高品质的（≥50 才有资格）
 *  - 商业奇迹 = 销量最高（≥10000 才有资格）
 *  - 评审团特别奖 = 上述三奖之外随机一本（不限品质）
 *
 * 防一书通杀：同一本书最多拿 2 个奖，按优先级 best-novel > best-seller > best-newcomer 分配。
 */
export function selectWinners(
  window: AwardWindow,
  authorsFirstBookId: Map<string, string>,
  authorNameById: (id: string) => string,
): AwardWinner[] {
  const { books, year } = window
  if (books.length === 0) return []

  const used = new Map<string, number>() // bookId → 已得奖数
  const canTake = (id: string) => (used.get(id) ?? 0) < 2

  const winners: AwardWinner[] = []
  const makeWinner = (m: Manuscript, category: AwardCategory): AwardWinner => ({
    year,
    category,
    bookId: m.id,
    bookTitle: m.title,
    bookGenre: m.genre,
    authorId: m.authorId,
    authorName: authorNameById(m.authorId),
    quality: m.quality,
    salesCount: m.salesCount,
    citation: pickCitation(category),
  })

  // 1. 最佳小说
  const novelCandidates = books.filter(b => b.quality >= 60 && canTake(b.id)).sort((a, b) => b.quality - a.quality)
  if (novelCandidates.length > 0) {
    const winner = novelCandidates[0]
    used.set(winner.id, (used.get(winner.id) ?? 0) + 1)
    winners.push(makeWinner(winner, 'best-novel'))
  }

  // 2. 商业奇迹
  const sellerCandidates = books.filter(b => b.salesCount >= 10000 && canTake(b.id)).sort((a, b) => b.salesCount - a.salesCount)
  if (sellerCandidates.length > 0) {
    const winner = sellerCandidates[0]
    used.set(winner.id, (used.get(winner.id) ?? 0) + 1)
    winners.push(makeWinner(winner, 'best-seller'))
  }

  // 3. 最佳新人
  const newcomerCandidates = books
    .filter(b => b.quality >= 50 && authorsFirstBookId.get(b.authorId) === b.id && canTake(b.id))
    .sort((a, b) => b.quality - a.quality)
  if (newcomerCandidates.length > 0) {
    const winner = newcomerCandidates[0]
    used.set(winner.id, (used.get(winner.id) ?? 0) + 1)
    winners.push(makeWinner(winner, 'best-newcomer'))
  }

  // 4. 评审团特别奖：从未获奖中抽一本
  const specialCandidates = books.filter(b => (used.get(b.id) ?? 0) === 0)
  if (specialCandidates.length > 0) {
    const winner = specialCandidates[Math.floor(Math.random() * specialCandidates.length)]
    winners.push(makeWinner(winner, 'jury-special'))
  }

  return winners
}

/** 从所有出版书中算每位作者的"第一本书 id"，用于"最佳新人"判定 */
export function computeAuthorsFirstBook(manuscripts: Map<string, Manuscript>): Map<string, string> {
  const first = new Map<string, { id: string; publishTime: number }>()
  for (const m of manuscripts.values()) {
    if (m.status !== 'published' || m.publishTime == null) continue
    const cur = first.get(m.authorId)
    if (!cur || m.publishTime < cur.publishTime) {
      first.set(m.authorId, { id: m.id, publishTime: m.publishTime })
    }
  }
  const result = new Map<string, string>()
  for (const [aid, { id }] of first.entries()) result.set(aid, id)
  return result
}
