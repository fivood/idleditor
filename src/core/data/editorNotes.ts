import type { Manuscript } from '../types'

// ──── Editor note templates (generated at publish time) ────

const PUBLISH_NOTE_TEMPLATES = [
  (ms: Manuscript) => `审稿时喝了三杯茶。看到第${(ms.quality * 7) % 300 + 10}页差点喷出来——不是贬义。就是太意外了。`,
  (_ms: Manuscript) => `作者在致谢里写了"感谢永夜出版社那位永远年轻的编辑"。他知道得太多了。`,
  (ms: Manuscript) => `排版时发现第${Math.floor((ms.quality * 7) % 300) + 10}页的页码印成了emoji。决定不修改——当作彩蛋。`,
  (_ms: Manuscript) => `这是作者迄今最好的书。他自己也这么认为。感谢信写了七页——我们读了前两页。`,
  (_ms: Manuscript) => `版权部已把本书推给三家影视机构。对方都说"有深度但不好改"。翻译：内心独白太多。`,
  (_ms: Manuscript) => `校对最后一遍时发现了一个拼写错误——但不是我们的。是作者在致谢里把自己的名字拼错了。`,
  (_ms: Manuscript) => `稿子送来时带着一股陈年纸张的气味。打开一看，原来作者把祖父的旧稿混进去了——还挺好看。`,
  (_ms: Manuscript) => `这本稿子在审稿会上引发了一场持续45分钟的讨论。结论：挺好的，别改了。发吧。`,
]

export function generatePublishNote(ms: Manuscript): string {
  return PUBLISH_NOTE_TEMPLATES[ms.quality % PUBLISH_NOTE_TEMPLATES.length](ms)
}

// ──── Level-up toast lines ────

export function generateLevelUpToast(newLevel: number): string {
  const lines = [
    `[Lv.${newLevel}] 你感到一股熟悉的力量涌上指尖。连续退稿十七次依然心平气和的那种力量。`,
    `[Lv.${newLevel}] 你的红笔现在可以在三米之外凭空画蝙蝠。仅限审稿时。已经够用了。`,
    `[Lv.${newLevel}] 办公室的实习生偷偷在你的茶杯旁放了一包速溶咖啡。你礼貌地假装没看到。你喝的东西不需要速溶。`,
    `[Lv.${newLevel}] 伯爵的画像在墙上咳了一声。可能是赞赏。也可能是灰尘。你决定当它是赞赏。`,
    `[Lv.${newLevel}] 你的棺材板底下传来一阵轻微的震动。那是出版社两百年前的奠基石。它每提升一级就抖一下。没人知道为什么。你习惯了。`,
    `[Lv.${newLevel}] 一位退休作者在远方忽然打了个喷嚏。他不知道为什么。但他感觉到世界的某个角落有一支红笔刚刚变得更强了。`,
    `[Lv.${newLevel}] 你把脚翘在书桌上，对着天花板发了一会儿呆。不是偷懒。是思考。不同之处在于你不需要眨眼。`,
    `[Lv.${newLevel}] 编辑部走廊里的灯泡闪了一下。实习生说"是不是电压不稳"。你说"不是"。你知道那是什么。`,
  ]
  return lines[Math.floor(Math.random() * lines.length)]
}

// ──── Shelved manuscript resubmission notes ────

export const SHELVED_RESUBMISSION_NOTES = [
  '（作者修改后重新投稿：删掉了第三章那四十页关于天气的描写）',
  '（第二稿：作者说"这次真的改好了"。我们拭目以待。）',
  '（修改版：新增了一个人物，删除了两个比喻，书名没变——作者觉得书名挺好的）',
  '（修订稿：作者在邮件里写了三千字修改说明，我们只读了前两行）',
  '（重投稿：主要改动是把主角的猫删了——编辑上次在批注里画了三只蝙蝠表示不满）',
  '（修改后重投：作者声称"这是最终版"——我们都听过这句话）',
]

// ──── Subtitle pool for title generation ────

export const TITLE_SUBTITLES = [
  '修订版', '未删节', '长篇', '完整版，大概', '作者恳请再版',
  '第二版，第一版印错了', '豪华版，送书签',
]
