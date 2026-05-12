import { pick, rangeInt } from '../../utils/random'
import type { Genre } from '../types'

// ──── Slots ────

const CHARACTERS = ['林远', '苏晚', '陈深', '白露', '沈默', '方舟', '温晴', '顾野', '洛星河', '季晚']
const PROFESSIONS = ['刑警', '教授', '黑客', '记者', 'AI工程师', '书店老板', '时间管理员', '社会学家']
const LOCATIONS = ['一座雾中的小城', '地下研究所', '废弃图书馆', '太空站第三层', '某个小镇的咖啡店', '深海实验室']
const DISCOVERIES = ['一台能预知截稿日期的机器', '一具无法辨认身份的尸体', '一段被删除的记忆', '一本全是空白的小说', '一个来自未来的退稿信']
const PROBLEMS = ['时间线开始自我折叠', '所有的线索都指向同一个不存在的人', '作者本人似乎也卷入了事件', '这根本就不是小说——它是真的']
const EVENTS = ['一封信件打破了平静', '主角发现自己的日记被别人提前写了', '一颗行星突然改变了轨道', '一家出版社收到了一份不可能存在的投稿']
const STAKES = ['整个太阳系的命运悬于一线', '一个百年疑案即将被揭开', '真相可能比谎言更危险', '出版社的声誉取决于此']
const TWISTS = ['凶手是所有人中看起来最不可能的那一个', '主线情节其实是个巨大的误会', '结局是开放式的——因为作者也没想好', '最后一章只有一行字："未完待续"']
const SCHOLARLY = [
  '基于对{number}名被试的长达七年的跟踪研究',
  '从社会学的角度重新审视了排队这一日常行为',
  '提出了一个大胆的假说：寒暄不是交流，是仪式',
  '将茶歇中的对话进行了严密的分类学分析',
]
const SOCIAL_TOPICS = ['外卖骑手的日常生活', '奶茶店排队的人类学观察', '城市噪音对社交行为的影响', '社交媒体上的道歉行为研究']

// ──── Genre templates ────

const SCI_FI_TEMPLATES = [
  '公元{year}年，{profession}{character}在一次例行工作中发现：{discovery}。但问题是——{problem}。',
  '{character}从未想过，自己作为{profession}的日常会被{event}彻底颠覆。因为{problem}，{stakes}。',
  '这是一个关于{character}的故事。作为{profession}，他与{discovery}不期而遇。{stakes}。',
  '当{discovery}时，没人当真。直到{event}发生。{character}不得不面对一个事实：{problem}。',
]

const MYSTERY_TEMPLATES = [
  '一具尸体出现在{location}。{profession}{character}接手调查，很快发现了一个惊人的事实：{problem}。',
  '{character}已经退休了。或者说，他以为自己退休了。直到{event}把他拉回{location}。{twist}。',
  '{location}发生了一起离奇案件。唯一的线索是{discovery}。{character}必须在{stakes}之前找到真相。',
  '这本该是一桩简单的案子。但{profession}{character}在{location}发现：{problem}。{twist}。',
]

const SUSPENSE_TEMPLATES = [
  '{character}收到了一条消息："{problem}"。发件人已注销。事情从这一刻开始变得不对劲。',
  '住在{location}的{character}并不知道，{event}将会改变一切。因为{discovery}，{stakes}。',
  '每当{character}闭上眼睛，就会看到同一个画面：{discovery}。{profession}说这是幻觉。{character}知道不是。',
  '所有人都告诉{character}{event}从未发生。但他有一份证据：{discovery}。{twist}。',
]

const SOCIAL_TEMPLATES = [
  '{scholarly}。结论出人意料——{character}认为，这揭示了当代社会一个被忽视的核心问题。',
  '作为一名{profession}，{character}决定研究{SocialTopic}。研究方法堪称清奇：{scholarly}。',
  '这本专著试图回答一个看似无聊实则深刻的问题：为什么我们会在{location}表现得与平时不同？',
  '{profession}{character}的新作将目光投向了{SocialTopic}。书中提出了一个令人坐立不安的观点：{twist}。',
]

const HYBRID_TEMPLATES = [
  '故事从{location}开始。{profession}{character}正在调查{discovery}。但很快发现，{problem}——而这只与{SocialTopic}有关。',
  '{character}有两重身份：一面是{profession}，另一面与{discovery}有关。当{event}，他必须在{stakes}之前做出选择。',
]

const UNSUITABLE_REASONS = [
  '这似乎是一本食谱，而非小说。',
  '通篇只有一个字："未完待续"。',
  '作者显然以为出版社是印刷厂——附带了一份A4纸采购清单。',
  '稿件其实是一封写给前女友/男友的信。长达两百页。我们不太方便干涉情感纠纷。',
  '这是一本教人如何开出版社的书。有点冒犯。',
  '封面写着"全球最烂小说"，作者似乎是认真的。',
  '内容与标题毫无关系。标题是《时间简史》，内文是菜谱。',
  '稿子沾了明显的咖啡渍。读起来也有那种不适感。',
  '引言写道："如果你在阅读这句话，说明你已经买了。"但这里不是书店。',
  '全部用Emoji写成。📖❓🤔',
]

// ──── Generator ────

function fillSlots(template: string): string {
  return template
    .replace(/\{character\}/g, () => pick(CHARACTERS))
    .replace(/\{profession\}/g, () => pick(PROFESSIONS))
    .replace(/\{location\}/g, () => pick(LOCATIONS))
    .replace(/\{discovery\}/g, () => pick(DISCOVERIES))
    .replace(/\{problem\}/g, () => pick(PROBLEMS))
    .replace(/\{event\}/g, () => pick(EVENTS))
    .replace(/\{stakes\}/g, () => pick(STAKES))
    .replace(/\{twist\}/g, () => pick(TWISTS))
    .replace(/\{scholarly\}/g, () => fillSlots(pick(SCHOLARLY)))
    .replace(/\{SocialTopic\}/g, () => pick(SOCIAL_TOPICS))
    .replace(/\{year\}/g, () => String(rangeInt(2080, 2542)))
    .replace(/\{number\}/g, () => String(rangeInt(200, 9999)))
}

const GENRE_TEMPLATES: Record<Genre, string[]> = {
  'sci-fi': SCI_FI_TEMPLATES,
  mystery: MYSTERY_TEMPLATES,
  suspense: SUSPENSE_TEMPLATES,
  'social-science': SOCIAL_TEMPLATES,
  hybrid: HYBRID_TEMPLATES,
}

export function generateSynopsis(genre: Genre): string {
  const templates = GENRE_TEMPLATES[genre] ?? HYBRID_TEMPLATES
  return fillSlots(pick(templates))
}

export function generateRejectionReason(): string {
  return pick(UNSUITABLE_REASONS)
}

export function isClearlyUnsuitable(quality: number): boolean {
  return quality < 28
}
