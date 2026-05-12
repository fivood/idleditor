import { pick } from '../../../utils/random'

type Lexicon = Record<string, string[]>

const INTRO: Lexicon = {
  calm: [
    '仔细斟酌之后，',
    '在片刻清明中，',
    '喝完一杯红茶之后，',
    '以圣徒般才有的耐心，',
    '在一个丝毫不令人意外的进展中，',
  ],
  dramatic: [
    '出人意料地，',
    '在一个没人预料到的转折中，',
    '仿佛天意一般，',
    '让全社同事大跌眼镜的是，',
    '只能说，这是一次出版界的奇迹——',
  ],
  deadpan: [
    '行吧。事情是这样的。',
    '嗯好。',
    '总之，',
    '事实就是事实。',
    '事情是这么发生的：',
  ],
}

const VERBS: Lexicon = {
  reading: ['翻阅了', '扫了一眼', '啃完了', '硬撑着读完了', '瞄了一下'],
  writing: ['草拟了', '敲出了一份', '折腾了半天写出了', '勉勉强强拼凑出了'],
  editing: ['大刀阔斧地砍了', '精雕细琢地打磨了', '和这部稿子打了一架', '差不多算是改完了'],
  selling: ['横扫了排行榜', '细水长流地卖着', '被恰好三个懂行的人买走了', '在国内卖得算体面'],
}

const ADJECTIVES: Lexicon = {
  positive: ['出乎意料的好看', '难得的惊喜', '让人虎躯一震', '相当不错，说真的'],
  negative: ['野心很大，细节欠奉', '勇气可嘉', '结构……不拘一格', '毫无疑问是一部稿子'],
  neutral: ['严格来说有七万字', '印在了纸上', '有封面，有内页', '存在于这个房间里'],
}

const PUNCHLINES: Lexicon = {
  review: [
    '"至少纸张质量还行。"',
    '"我已经看完了。我的分析到此为止。"',
    '"作者试图表达了什么。至于是什么，论文还在重写。"',
    '"它确实是一本书。这一点可以确认。"',
  ],
  publish: [
    '"送印厂！——小心点。"',
    '"让读者自己去评判吧。虽然他们十有八九会评错，但这反而让人安心。"',
    '"书架上又多一本。字面和比喻意义上都是。"',
  ],
  author: [
    '"需要时间\'找到自己的声音\'。或者至少找张地图。"',
    '"他说这叫小假期。我们管它叫\'补觉\'。"',
    '"缪斯女神已经离开了这栋楼。保安正在查监控。"',
  ],
}

export function pickIntro(): string {
  return pick(pick(Object.values(INTRO)))
}

export function pickVerb(category: string): string {
  return pick(VERBS[category] ?? VERBS.reading)
}

export function pickAdjective(category: string): string {
  return pick(ADJECTIVES[category] ?? ADJECTIVES.neutral)
}

export function pickPunchline(category: string): string {
  return pick(PUNCHLINES[category] ?? PUNCHLINES.review)
}

export function getLexicon(category: string): string[] {
  const all: Record<string, string[]> = { ...INTRO, ...VERBS, ...ADJECTIVES, ...PUNCHLINES }
  return all[category] ?? []
}
