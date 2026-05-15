import type { GameStore } from '@/store/gameStore'
import { pick, rangeInt } from '../utils/random'

export interface DecisionOption {
  label: string
  description: string
}

export interface Decision {
  id: string
  effectId?: string
  title: string
  description: string
  options: DecisionOption[]
}

// Template pool — split into categories for variety
interface DecisionTemplate {
  effectId: string  // Stable identifier for effect dispatch (see decisionEffects.ts)
  condition: (state: GameStore) => boolean
  generate: (state: GameStore) => Decision
}

export function generateTemplateDecision(state: GameStore): Decision | null {
  const eligible = ALL_TEMPLATES.filter(t => t.condition(state))
  if (eligible.length === 0) return null

  const template = pick(eligible)
  const decision = template.generate(state)
  decision.id = Math.random().toString(36).slice(2, 10)
  decision.effectId = template.effectId
  return decision
}

const ALL_TEMPLATES: DecisionTemplate[] = [
  // ── Book quality decisions ──
  {
    effectId: 'critic-preview',
    condition: (s) => [...s.manuscripts.values()].some(m => m.status === 'submitted'),
    generate: (s) => {
      const ms = pick([...s.manuscripts.values()].filter(m => m.status === 'submitted'))
      return {
        id: '', title: '评论家提前审读',
        description: `著名书评人想提前审读《${ms.title}》。如果同意，书籍会直接跳过编辑流程进入出版，初期销量 +50%——但品质鉴定会降低 10 点。`,
        options: [
          { label: '同意提前出版', description: '销量 +50% · 品质 -10' },
          { label: '拒绝，走正常流程', description: '无变化' },
        ],
      }
    },
  },
  {
    effectId: 'rush-publish',
    condition: (s) => [...s.manuscripts.values()].some(m => m.status === 'submitted'),
    generate: (s) => {
      const ms = pick([...s.manuscripts.values()].filter(m => m.status === 'submitted'))
      return {
        id: '', title: '作者请求加急',
        description: `《${ms.title}》的作者请求加急出版，承诺下一本稿件品质 +15。但加急意味着跳过校对环节，本书品质 -5。`,
        options: [
          { label: '同意加急', description: '本书品质 -5 · 下本品质 +15' },
          { label: '按正常节奏', description: '无变化' },
        ],
      }
    },
  },
  {
    effectId: 'anonymous-report',
    condition: () => true,
    generate: () => ({
      id: '', title: '匿名举报',
      description: '收到一封匿名信，举报某位签约作者抄袭。如果调查，该作者将进入冷却期；如果不查，可能损害出版社声誉。',
      options: [
        { label: '启动调查', description: '随机一位签约作者冷却1800秒 · 声望 +15' },
        { label: '搁置', description: '声望 -5' },
      ],
    }),
  },

  // ── Resource decisions ──
  {
    effectId: 'book-fair',
    condition: (s) => s.currencies.revisionPoints >= 50,
    generate: () => {
      const amount = rangeInt(30, 80)
      return {
        id: '', title: '图书博览会邀请',
        description: `一年一度的图书博览会邀请永夜出版社参展。展位费 ${amount} RP。参展可能带来大量新作者和声望——也可能只在角落里吃灰。`,
        options: [
          { label: `支付 ${amount} RP 参展`, description: '70%概率声望 +30，30%概率退款+3声望' },
          { label: '婉拒', description: '无变化，省下RP用来升级部门' },
        ],
      }
    },
  },
  {
    effectId: 'film-adaptation',
    condition: (s) => s.currencies.prestige >= 100,
    generate: () => ({
      id: '', title: '影视改编报价',
      description: '一家流媒体平台对出版社的一本已出版书籍发出改编报价。两个方案：一次性买断 200 RP，或者分成模式（此后每卖一本 +0.5 RP）。',
      options: [
        { label: '一次性买断（200 RP）', description: '立即获得 200 RP' },
        { label: '分成模式', description: '此后每卖一本 +0.5 RP（长期收益）' },
      ],
    }),
  },

  // ── Author decisions ──
  {
    effectId: 'advance-payment',
    condition: (s) => [...s.authors.values()].some(a => a.tier === 'signed' || a.tier === 'known'),
    generate: (s) => {
      const author = pick([...s.authors.values()].filter(a => a.tier === 'signed' || a.tier === 'known'))
      return {
        id: '', title: `${author.name}要求预支稿费`,
        description: `${author.name}要求预支 50 RP 用于"采风"。承诺下本书品质 +15。如果不给，ta 可能会不高兴——但也有可能理解。`,
        options: [
          { label: `预支 50 RP`, description: '下本书品质 +15' },
          { label: '拒绝', description: '50%概率作者冷却 · 50%概率无变化' },
        ],
      }
    },
  },
  {
    effectId: 'newcomer-award',
    condition: (s) => [...s.authors.values()].some(a => a.tier === 'new'),
    generate: (s) => {
      const author = pick([...s.authors.values()].filter(a => a.tier === 'new'))
      return {
        id: '', title: `新人推荐名额`,
        description: `文学新人奖的评委联系出版社，询问是否推荐${author.name}参选。签约该作者即可获得推荐资格。参选结果随机——可能一鸣惊人，也可能默默无闻。`,
        options: [
          { label: '签约并推荐', description: '作者签约 · 50%概率声望+30' },
          { label: '暂不推荐', description: '作者依然存在，暂无变化' },
        ],
      }
    },
  },

  // ── Crisis decisions ──
  {
    effectId: 'printing-strike',
    condition: (s) => s.totalPublished >= 3,
    generate: (s) => {
      const count = s.currencies.prestige > 200 ? '大量' : '一些'
      return {
        id: '', title: '印刷厂罢工',
        description: `印刷厂工人因薪资问题集体罢工。出版社有${count}本书在排队等待印刷。如果同意涨薪，消耗 30 RP 但保持印刷进度；如果拒绝，所有待印刷的书延迟 120 秒。`,
        options: [
          { label: '同意涨薪（-30 RP）', description: '印刷进度不受影响' },
          { label: '拒绝', description: '所有出版中的书进度归零' },
        ],
      }
    },
  },
  {
    effectId: 'negative-review',
    condition: (s) => s.currencies.prestige >= 50,
    generate: () => ({
      id: '', title: '负面书评风暴',
      description: '一位有影响力的书评人对出版社最近出版的某本书发表了严厉批评。可以选择公开回应（消耗声望换取未来书籍销量）、私下沟通（消耗RP）、或无视。',
      options: [
        { label: '公开回应', description: '声望 -10 · 未来30本稿品质+3' },
        { label: '私下沟通', description: 'RP -20 · 无其他影响' },
        { label: '无视', description: '无变化' },
      ],
    }),
  },

  // ── Long-term strategy ──
  {
    effectId: 'branch-office',
    condition: (s) => s.totalBestsellers >= 1,
    generate: () => ({
      id: '', title: '开设分社',
      description: '伯爵提议在另一个城市开设分社。需要投入 500 RP 和 100 声望。如果成功，作者提交速度 +30%；如果失败，白花钱。成功率：40%。',
      options: [
        { label: '冒险投资', description: '40%成功：作者提交速度+30% / 60%：RP和声望白花' },
        { label: '稳健经营', description: '无变化，留着RP升级部门' },
      ],
    }),
  },
  {
    effectId: 'editor-memoir',
    condition: (s) => s.currencies.statues >= 3,
    generate: (s) => {
      const n = s.currencies.statues
      return {
        id: '', title: '退休编辑回忆录',
        description: `一位在永夜出版社工作了${n * 30}年的退休编辑，想出版回忆录。书中包含大量出版社内部秘辛。出版可获大量声望，但可能得罪一些作者。`,
        options: [
          { label: '支持出版', description: '声望 +50 · 随机3位作者进入冷却' },
          { label: '劝阻', description: '声望 +10 · 无副作用' },
        ],
      }
    },
  },
  {
    effectId: 'tea-room-budget',
    condition: () => true,
    generate: () => ({
      id: '', title: '茶水间预算',
      description: '财务部通知茶水间预算超支。咖啡消耗量是正常水平的三倍。编辑们声称这是因为"审稿需要咖啡因"。削减预算还是继续供应？',
      options: [
        { label: '削减预算', description: '省下20RP · 编辑效率暂时 -10%（持续600秒）' },
        { label: '继续供应', description: '消耗20RP · 编辑效率暂时 +10%（持续600秒）' },
      ],
    }),
  },

  // ── Affection-risk decisions ──
  {
    effectId: 'genre-change',
    condition: (s) => [...s.authors.values()].some(a => a.tier !== 'new' && a.tier !== 'idol'),
    generate: (s) => {
      const author = pick([...s.authors.values()].filter(a => a.tier !== 'new' && a.tier !== 'idol'))
      return {
        id: '', title: `${author.name}想换类型`,
        description: `${author.name}发来邮件说想尝试完全不同的类型——离开擅长的${author.genre}。支持的话下本书可能风格奇怪，但作者会很感激。拒绝的话……你懂的。`,
        options: [
          { label: '支持冒险', description: '作者好感度变化（效果未知）' },
          { label: '建议专注本行', description: '作者可能接受，也可能不高兴' },
        ],
      }
    },
  },
  {
    effectId: 'deadline-conflict',
    condition: (s) => [...s.authors.values()].some(a => a.tier !== 'new'),
    generate: (s) => {
      const author = pick([...s.authors.values()].filter(a => a.tier !== 'new'))
      return {
        id: '', title: `截稿日冲突`,
        description: `${author.name}说下本书需要再推两周。如果不催，书会更好但出版社的流水线空着。如果催……你知道作者们怎么评价催稿的编辑。`,
        options: [
          { label: '再给两周', description: '作者感谢，但流水线空转' },
          { label: '坚持原定日期', description: '流水线继续，但作者……' },
        ],
      }
    },
  },
  {
    effectId: 'personal-favor',
    condition: (s) => [...s.authors.values()].some(a => a.affection >= 50),
    generate: (s) => {
      const author = pick([...s.authors.values()].filter(a => a.affection >= 50))
      return {
        id: '', title: `${author.name}的私人请求`,
        description: `${author.name}请你帮忙看一篇朋友的稿子。不是永夜出版社的——是另一家出版社的。看的话可能得罪那家出版社，不看的话……你们之间的信任会受损。`,
        options: [
          { label: '帮忙看看', description: '跨社的人情。风险未知。' },
          { label: '礼貌拒绝', description: '作者可能会理解——也可能不会。' },
        ],
      }
    },
  },
  {
    effectId: 'social-media',
    condition: (s) => [...s.authors.values()].some(a => a.tier === 'signed' || a.tier === 'known'),
    generate: (s) => {
      const author = pick([...s.authors.values()].filter(a => a.tier === 'signed' || a.tier === 'known'))
      return {
        id: '', title: `${author.name}的社交媒体`,
        description: `${author.name}在社交媒体上发了一条可能有争议的帖子。现在有读者要求出版社表态。沉默是金，但沉默也意味着你不支持作者。`,
        options: [
          { label: '公开支持作者', description: '声望可能增加，也可能减少' },
          { label: '保持沉默', description: '作者可能会注意到你的沉默' },
        ],
      }
    },
  },
]
