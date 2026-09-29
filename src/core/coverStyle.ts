import type { CoverStyle, Manuscript } from './types'

export const COVER_STYLES: { id: CoverStyle; label: string; blurb: string }[] = [
  { id: 'safe', label: '稳妥', blurb: '契合题材的正经封面。销量 +10%，一直如此。' },
  { id: 'bold', label: '醒目', blurb: '大主体、高对比。首发 10 分钟内销量 ×1.5，之后回落到 ×0.95。' },
  { id: 'weird', label: '荒诞', blurb: '附赠一个不相干的小东西。起初 ×0.85，出版半小时后开始发酵，×1.45。' },
]

const BOLD_WINDOW = 600
const WEIRD_DELAY = 1800

/** Sales multiplier by cover style and book age (ticks since publication). */
export function coverSalesMult(style: CoverStyle | undefined, age: number): number {
  if (style === 'bold') return age < BOLD_WINDOW ? 1.5 : .95
  if (style === 'weird') return age < WEIRD_DELAY ? .85 : 1.45
  return 1.1
}

/** The design department's suggestion. Deliberately a rule of thumb the player can overrule for free. */
export function recommendCoverStyle(m: Pick<Manuscript, 'quality'>): { style: CoverStyle; reason: string } {
  if (m.quality < 50) return { style: 'bold', reason: '内容撑不住，封面得替它大声说话，趁读者还没翻开。' }
  if (m.quality >= 75) return { style: 'weird', reason: '书扛得住，封面可以放肆点，等它慢慢发酵成梗。' }
  return { style: 'safe', reason: '中规中矩的书配中规中矩的封面，设计部可以准点下班。' }
}
