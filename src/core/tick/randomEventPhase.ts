import { nanoid } from '@/utils/id'
import { rangeInt, pick } from '@/utils/random'
import { createManuscript } from '../factories/manuscriptFactory'
import { RIVALS } from '../rivals'
import type { GameWorldState } from '../gameLoop'
import type { TickContext } from './types'

export function processRandomEventPhase({ world, result }: TickContext) {
  // Random events every 300 ticks (~5 min)
  if (world.playTicks % 300 === 0) {
    const randomEvt = rollRandomEvent(world)
    if (randomEvt) {
      result.toasts.push({ id: nanoid(), text: randomEvt, type: 'milestone', createdAt: world.playTicks })
    }
  }
}

// ──── Random Events ────
export function rollRandomEvent(world: GameWorldState): string | null {
  if (Math.random() > 0.4) return null // 40% chance each check

  const pool: (() => string | null)[] = [
    () => {
      const rp = rangeInt(5, 20)
      world.currencies.revisionPoints += rp
      return `🎭 一位匿名老编辑寄来了一叠修订笔记。获得 ${rp} RP。`
    },
    () => {
      const extraMS = createManuscript(world)
      world.manuscripts.set(extraMS.id, extraMS)
      return `📮 午夜投稿堆突然多了一份手稿——署名栏写着"顺路带来的"。新稿件：${extraMS.title}。`
    },
    () => {
      const rp = rangeInt(3, 12)
      world.currencies.revisionPoints += rp
      return `🦇 伯爵大人心血来潮巡视编辑部，随手批了几份稿子。获得 ${rp} RP。`
    },
    () => `☕ 茶水间的古董咖啡机今天没有爆炸。所有人精神抖擞，工作效率似乎高了一点点。`,
    () => {
      const prestige = rangeInt(2, 8)
      world.currencies.prestige += prestige
      return `📰 《永夜文学报》刊登了一篇关于出版社的专题报道（可能因为主编欠编辑部主任一个人情）。声望 +${prestige}。`
    },
    () => `📚 一位老顾客搬走了半座图书馆。编辑们面面相觑——"我们仓库里什么时候有这么多书？"`,
    () => {
      const rp = rangeInt(10, 30)
      world.currencies.revisionPoints += rp
      return `💼 版权部成功将一本书的影视改编权卖给了某流媒体平台（虽然合同细则里出现了"永久使用权"这个词）。获得 ${rp} RP。`
    },
    () => `🔔 人力资源部的新实习生不小心把咖啡洒在了档案柜上——现在所有在编作者都收到了一份"恭喜您中奖"的邮件。场面一度非常尴尬。`,
    () => {
      const rp = rangeInt(8, 18)
      world.currencies.revisionPoints += rp
      return `📖 一位退休教授来到编辑部，淡定地指出三本书里的历史错误，然后顺便帮你审了两本稿子。获得 ${rp} RP。`
    },
    () => `🌙 今夜是新月。年轻编辑们在办公室偷偷讲鬼故事——图书主题的鬼故事销量意外增加了。`,

    // ── Rejected author news ──
    () => {
      const rejected = [...world.authors.values()].filter(a => a.rejectedCount > 0)
      if (rejected.length === 0) return `📬 投稿箱里出现了一封没有署名的手写信。字迹潦草，但文法不错。`
      const a = rejected[Math.floor(Math.random() * rejected.length)]
      const snippets = [
        `${a.name}在社交媒体上发了一条："编辑可能没看懂我的作品"。获得了${rangeInt(200, 2000)}个赞。`,
        `${a.name}被拍到在另一家出版社门口徘徊。手里拿着同一份稿子。`,
        `${a.name}开始在网上连载被退的那部小说。评论区第一条："还是退了好"。`,
        `${a.name}的退稿信被裱起来挂在了工作室墙上。配文："他们会后悔的"。（其实不会）`,
        `${a.name}换了个笔名重新投稿了。但我们一眼就认出来了——第一章一个字都没改。`,
        `听闻${a.name}在一场读书会上公开朗读了自己被退稿的第一章。听众在第三章时走了一半。`,
        `${a.name}的猫在稿纸上踩了一排脚印。作者声称这是"被退稿的艺术回应"。`,
      ]
      return pick(snippets)
    },
    () => {
      const rejected = [...world.authors.values()].filter(a => a.rejectedCount > 0)
      if (rejected.length === 0) return `🗞️ 文学版编辑在报纸上写了一篇短文，标题是"为什么好稿子也会被退"。（实习生说这是他见过的最被动的攻击。）`
      const a = rejected[Math.floor(Math.random() * rejected.length)]
      const count = a.rejectedCount
      if (count >= 3) {
        return `📉 ${a.name}已累计被退稿${count}次。据了解，该作家目前正在考虑转行——可能去当编辑。`
      }
      if (count >= 2) {
        return `${a.name}在接受采访时表示："永夜出版社的退稿信比我的小说还长。至少编辑认真看了。大概。"`
      }
      return `${a.name}在咖啡馆偶遇编辑部主任，尴尬地聊了三分钟天气后火速离开。`
    },
    () => {
      const rejected = [...world.authors.values()].filter(a => a.rejectedCount > 0 && a.cooldownUntil !== null)
      if (rejected.length === 0) return null
      const a = rejected[Math.floor(Math.random() * rejected.length)]
      const quips = [
        `🍷 ${a.name}据称买了一整箱红酒，声称要"用酒精泡出下一本杰作"。邻居表示已经连续三天听到打字机声和哭声交替传来。`,
        `📝 ${a.name}在个人博客上发布了"被退稿后如何自我疗愈"的十点建议。第八点建议是：别写了。`,
        `🎤 ${a.name}报名参加了一个脱口秀开放麦。所有段子都和被退稿有关。据说效果还行——观众不确定该不该笑。`,
      ]
      return pick(quips)
    },
    () => {
      const onCooldown = [...world.authors.values()].filter(a => a.cooldownUntil !== null && a.cooldownUntil > 0)
      if (onCooldown.length === 0) return null
      const a = onCooldown[Math.floor(Math.random() * onCooldown.length)]
      return `⏳ ${a.name}的冷却还剩${a.cooldownUntil}秒。据线人透露，ta正在写一部"出版社不配拥有的神作"。`
    },

    // ── General news ──
    () => {
      if (world.totalPublished < 5) return null
      const titles = [...world.manuscripts.values()].filter(m => m.status === 'published')
      if (titles.length === 0) return null
      const book = titles[Math.floor(Math.random() * titles.length)]
      const newsItems = [
        `${book.title}在一家二手书店被当成"店员推荐"陈列。书店老板表示"其实没读过"。`,
        `一位读者在书评网站上给《${book.title}》打了五星，评论只有三个字："看哭了"。编辑们传阅这评论讨论了整个午休。`,
        `${book.title}的盗版在网上流传。作者表示"这是我第一次有盗版，感觉……还挺受认可的？"`,
        `某读书播客对《${book.title}》做了半小时的深度解析。主播在结尾说"我可能过度解读了"。`,
      ]
      return pick(newsItems)
    },
    () => {
      const rp = rangeInt(15, 35)
      world.currencies.revisionPoints += rp
      return `🏛️ 市立图书馆订购了出版社的整套目录。馆长说："预算花不完，你们懂的。"获得 ${rp} RP。`
    },
    () => `📸 一位知名书评人发了张自拍，背景里——模糊但可辨认——是出版社的大楼。配文："接下来三个月我最期待的事"。编辑们默默截图了。`,
    () => `🎂 今天是出版社的「永生茶话会」——每百年一次的团建活动。伯爵说了两句祝词，然后回棺材补觉了。`,
    () => `📬 一封寄给"永夜出版社全体员工"的匿名信。内容是一首关于破晓的十四行诗。编辑部一致同意：写得不错。但这不改变寄件人不知道我们是吸血鬼的事实。`,

    // ── Rival publisher news ──
    () => {
      const poached = [...world.authors.values()].filter(a => a.poached)
      if (poached.length === 0) return null
      const a = poached[Math.floor(Math.random() * poached.length)]
      const prestige = rangeInt(5, 10)
      world.currencies.prestige += prestige
      const rival = RIVALS[Math.floor(Math.random() * RIVALS.length)]
      return `📰 ${a.name}在${rival.name}出版了一本新书。书评人说还不错——至少比上次被退掉那本强。作为前编辑，你获得 ${prestige} 声望。`
    },
    () => {
      const rival = RIVALS[Math.floor(Math.random() * RIVALS.length)]
      const newsItems = [
        `${rival.name}本周推出了一个新书系。市场部紧急开会讨论。结论：先看看他们能撑多久。`,
        `${rival.name}的编辑在采访中提到永夜出版社，措辞相当客气——"有品位的竞品"。翻译：比不过。`,
        `${rival.name}签下了一位网红作者。据说首印十万册。永夜的编辑们看了一眼样稿，各自默默喝了一口茶。`,
        `${rival.name}的年度报告显示他们去年出版了${rangeInt(50, 300)}本书。其中${rangeInt(1, 10)}本进入过榜单。`,
        `图书展上，${rival.name}的展位离永夜只隔了一条通道。双方编辑在茶歇区进行了三分钟的礼貌交锋——话题包括天气、咖啡质量，以及"那个作者到底怎么回事"。`,
      ]
      return pick(newsItems)
    },
  ]
  const fn = pick(pool)
  return fn()
}
