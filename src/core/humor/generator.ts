import { pick, rangeInt } from '../../utils/random'
import {
  pickAdjective,
  pickIntro,
  pickPunchline,
  pickVerb,
} from './lexicons/phrases'

export interface ToastContext {
  title?: string
  authorName?: string
  genre?: string
  quality?: string
  [key: string]: string | undefined
}

type SlotResolver = (ctx: ToastContext) => string

const SLOTS: Record<string, SlotResolver> = {
  '{editorName}': () => '你',
  '{title}': (ctx) => `《${ctx.title ?? '无名稿件'}》`,
  '{authorName}': (ctx) => ctx.authorName ?? '匿名作者',
  '{genre}': (ctx) => ctx.genre ?? '杂类',
  '{quality}': (ctx) => ctx.quality ?? '凑合',
  '{intro}': () => pickIntro(),
  '{verb_read}': () => pickVerb('reading'),
  '{verb_write}': () => pickVerb('writing'),
  '{verb_edit}': () => pickVerb('editing'),
  '{verb_sell}': () => pickVerb('selling'),
  '{adj_pos}': () => pickAdjective('positive'),
  '{adj_neg}': () => pickAdjective('negative'),
  '{adj_neut}': () => pickAdjective('neutral'),
  '{punch_review}': () => pickPunchline('review'),
  '{punch_publish}': () => pickPunchline('publish'),
  '{punch_author}': () => pickPunchline('author'),
  '{time_minutes}': () => String(rangeInt(5, 45)),
  '{time_hours}': () => String(rangeInt(1, 8)),
  '{time_days}': () => String(rangeInt(2, 14)),
}

function resolve(template: string, ctx: ToastContext): string {
  let result = template
  for (const [slot, resolver] of Object.entries(SLOTS)) {
    while (result.includes(slot)) {
      result = result.replace(slot, resolver(ctx))
    }
  }
  return result
}

const SCENES: Record<string, string[]> = {
  reviewComplete: [
    '{intro}{editorName}{verb_read}了{title}。{punch_review}',
    '{title}：用时{time_minutes}分钟读完，完全没读懂。{punch_review}',
    '{title}的最后一章让{editorName}盯着天花板整整发了{time_minutes}秒的呆。{punch_review}',
  ],
  bookPublished: [
    '{title}正式出版。{intro}现在这本书是读者的问题了。',
    '{intro}印刷机隆隆作响。{title}被释放在毫无防备的世人面前。',
    '一本新书加入了目录：《{title}》，作者{authorName}。书架微微倾斜以适应它的重量。',
  ],
  bestseller: [
    '{title}正在排行榜上{verb_sell}。据目击，竞品出版社的编辑在办公室里{verb_read}自己的垃圾堆，面露绝望。',
    '{intro}传真机被打爆了。各地书店都在补订{title}。传真机从未如此受欢迎。',
    '{title}销量突破了10万册！作者{authorName}现在逢人就说自己是作家。出版社的声誉随之水涨船高。',
  ],
  authorCooldown: [
    '{authorName}宣布需要休息一段时间。{punch_author}',
    '{intro}{authorName}正在某个地方{verb_write}下一部巨著。预计{time_days}个工作日之后交稿。上下浮动一个月。',
  ],
  authorReturn: [
    '{authorName}从休息中归来，气色好得可疑，还带了一份新稿子。',
    '{intro}{authorName}回到了书桌前。新稿件{adj_pos}。事情不太对劲。',
  ],
  manuscriptRejected: [
    '{intro}{title}被退稿了。{punch_review}作者会活下去的。大概吧。',
    '{title}——退稿决定已做出。相信它会在别处找到归宿。或者找不到。总之不是我们这儿。',
  ],
  idle: [
    '稿件堆安静地躺在那里。你琢磨着是不是该泡杯茶。',
    '{intro}一切如常。出版社轻轻地呼吸着。某个地方，一位作者正在恐慌。',
  ],
}

export function generateToast(scene: string, ctx: ToastContext = {}): string {
  const templates = SCENES[scene]
  if (!templates) {
    return '发生了一些事情。详情不明，一如传统。'
  }
  const template = pick(templates)
  return resolve(template, ctx)
}
