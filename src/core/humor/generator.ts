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
  '{editorName}': (ctx) => ctx.playerName ?? '你',
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
  '{he}': (ctx) => ctx.playerGender === 'female' ? '她' : '他',
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
    '{title}：用时{time_minutes}分钟读完。{editorName}觉得，两百多年的编辑经验在此刻化为一声叹息。',
    '{title}的最后一章让{editorName}盯着天花板整整发了{time_minutes}秒的呆。永生有时候确实太长了。',
    '审完{title}，{editorName}在稿子空白处写了一句批语。区区三十字，{authorName}可能会琢磨三个月。',
    '{editorName}审完{title}后，在办公室里来回踱了{time_minutes}步。这是他思考的方式。蝙蝠式思考。',
    '审{title}的时候，{editorName}的羽毛笔漏墨了。他在手稿上留下了一个不可磨灭的墨点。作者可能会以为这是隐喻。其实不是。',
    '审完{title}后，{editorName}出门飞了两圈。夜风让人清醒——尤其是当你能飞的时候。回来时批注又多了一页。',
    '读完{title}，{editorName}决定去棺材里躺一会儿。不是困——是需要一个安静的地方消化这份稿子。',
    '{title}让{editorName}想起一个19世纪的夜晚。那时候审稿全靠烛光——和更好的眼力。',
  ],
  bookPublished: [
    '{title}正式出版。{intro}现在这本书是读者的问题了。{editorName}端起茶杯——里面当然是普通的红茶，不要再问了。',
    '{intro}印刷机隆隆作响。{title}被释放在毫无防备的世人面前。又一本。永远还有下一本。',
    '一本新书加入了永夜的目录：{title}。书架又倾斜了一点。三百年来一直如此。',
  ],
  bestseller: [
    '{title}正在排行榜上{verb_sell}。据目击，竞品出版社的编辑在办公室里{verb_read}自己的垃圾堆，面露绝望。',
    '{intro}传真机被打爆了。各地书店都在补订{title}。{editorName}想起上次看到这种场面还是在1920年代。那次是海明威。',
    '{title}销量突破了10万册！作者{authorName}很开心。{editorName}也很开心——至少以吸血鬼的标准来说，嘴角微微动了一下。',
  ],
  authorCooldown: [
    '{authorName}宣布需要休息一段时间。{editorName}表示理解——活两百年的人最懂什么叫"需要空间"。',
    '{intro}{authorName}正在某个地方{verb_write}下一部巨著。预计{time_days}个工作日之后交稿。对于永生者来说，这点时间不算什么。',
  ],
  authorReturn: [
    '{authorName}从休息中归来，气色好得可疑，还带来了一份新稿子。{editorName}怀疑他是不是偷喝了伯爵的存血。',
    '{intro}{authorName}回到了书桌前。新稿件{adj_pos}。活了两百年，{editorName}还是会被这种惊喜感动。',
  ],
  manuscriptRejected: [
    '{intro}{title}被退稿了。{editorName}活了这么久，退稿次数早已数不清。但每次都有不一样的失望。',
    '{title}——退稿决定已做出。编辑部里一百岁的实习生说了一句："确实不行。"他有发言权。',
  ],
  idle: [
    '稿件堆安静地躺在那里。{editorName}的茶杯飘出淡淡的红色蒸汽——纯红茶，绝对纯红茶。',
    '{intro}一切如常。永夜出版社轻轻地呼吸着。某个地方，一位人类作者正在恐慌。而{editorName}已经目睹这种恐慌几百年了。',
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
