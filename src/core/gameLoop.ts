import type { Author, AuthorPersona, Department, EditorTrait, GameEvent, Manuscript, PermanentBonuses, TickResult, ToastMessage } from './types'
import { GENRE_ICONS, GENRES } from './types'
import { GENRE_COVER_COLORS } from './constants'
import {
  AUTHOR_BASE_TALENT,
  AUTHOR_TALENT_RANGE,
  AUTHOR_FAME_PER_PUBLISH,
  AUTHOR_TIER_THRESHOLDS,
  BESTSELLER_SALES,
  EDITOR_TRAIT_BONUSES,
  MAX_SUBMITTED_QUEUE,
  MILESTONES,
} from './constants'
import {
  authorQualityBoost,
  editingTicks,
  effectiveMarketPotential,
  effectiveQuality,
  manuscriptSpawnInterval,
  proofingTicks,
  publishingTicks,
  reviewTicks,
  rpPerEdit,
  rpPerProof,
  rpPerPublish,
  rpPerReview,
  rollQuality,
  rollWordCount,
  royaltyPerTick,
  salesPerTick,
} from './formulas'
import { nanoid } from '../utils/id'
import { pick, rangeInt, roll } from '../utils/random'
import { generateToast } from './humor/generator'
import { generateSynopsis, generateRejectionReason, isClearlyUnsuitable } from './humor/synopsis'
import { createCalendar, advanceCalendar, TICKS_PER_DAY } from './calendar'
import { checkDateEvent, type DateEvent } from './dateEvents'
import type { GameCalendar } from './calendar'
import { TITLE_POOLS, getBaseTitle, titleToSlug } from './titlePools'

// ──── State that the game loop reads/mutates ────
export interface GameWorldState {
  manuscripts: Map<string, Manuscript>
  authors: Map<string, Author>
  departments: Map<string, Department>
  events: GameEvent[]
  playTicks: number
  totalPublished: number
  totalBestsellers: number
  totalRejections: number
  currencies: { revisionPoints: number; prestige: number; royalties: number; statues: number }
  permanentBonuses: PermanentBonuses
  trait: EditorTrait | null
  playerName: string
  calendar: GameCalendar
  spawnTimer: number
  awardTimer: number
  trendTimer: number
  triggeredMilestones: Set<number>
  activeDateEvent: DateEvent | null
  coversManifest: Record<string, string> | null
}

// ──── Title generation ────
function generateTitle(genre: string): string {
  const pool = TITLE_POOLS[genre] ?? TITLE_POOLS['hybrid']
  const suffixes = ['（修订版）', '（未删节）', '（长篇）', '（完整版，大概）', '（作者恳请再版）', '（第二版，第一版印错了）', '（豪华版，送书签）', '']
  return pool[Math.floor(Math.random() * pool.length)] + (Math.random() < 0.35 ? ` ${pick(suffixes)}` : '')
}

function generateCover(title: string, genre: string, coversManifest: Record<string, string> | null): Manuscript['cover'] {
  const baseTitle = getBaseTitle(title)
  const slug = titleToSlug(baseTitle)
  const localSrc = coversManifest?.[slug] ? `/covers/${coversManifest[slug]}` : null
  return {
    type: 'generated',
    src: localSrc,
    placeholder: {
      bgColor: GENRE_COVER_COLORS[genre as keyof typeof GENRE_COVER_COLORS] ?? '#1a1a2e',
      icon: GENRE_ICONS[genre as keyof typeof GENRE_ICONS] ?? '📖',
      titleOverlay: title,
    },
  }
}

// ──── World initialization ────
export function createInitialWorld(): GameWorldState {
  return {
    manuscripts: new Map(),
    authors: new Map(),
    departments: new Map(),
    events: [],
    playTicks: 0,
    totalPublished: 0,
    totalBestsellers: 0,
    totalRejections: 0,
    currencies: { revisionPoints: 0, prestige: 0, royalties: 0, statues: 0 },
    permanentBonuses: {
      manuscriptQualityBonus: 0,
      editingSpeedBonus: 0,
      royaltyMultiplier: 1,
      authorTalentBoost: 0,
      spawnRateBonus: 0,
    },
    trait: null,
    playerName: '',
    calendar: createCalendar(),
    spawnTimer: 5,
    awardTimer: 0,
    trendTimer: 0,
    triggeredMilestones: new Set(),
    activeDateEvent: null,
    coversManifest: null,
  }
}

// ──── Tick function ────
export function tick(world: GameWorldState): TickResult {
  const result: TickResult = {
    newManuscripts: [],
    publishedBooks: [],
    royaltiesEarned: 0,
    toasts: [],
    eventsTriggered: [],
    authorsReturned: [],
  }

  world.playTicks++

  // Trait & permanent bonuses
  const trait = world.trait ? EDITOR_TRAIT_BONUSES[world.trait] : { rpBonus: 0, qualityBonus: 0, speedBonus: 0 }
  const effSpeedBonus = world.permanentBonuses.editingSpeedBonus + trait.speedBonus
  const effRpBonus = trait.rpBonus

  // Advance calendar every TICKS_PER_DAY ticks
  if (world.playTicks % TICKS_PER_DAY === 0) {
    advanceCalendar(world.calendar)
    // Tick down active date event duration
    if (world.activeDateEvent) {
      world.activeDateEvent = {
        ...world.activeDateEvent,
        durationDays: world.activeDateEvent.durationDays - 1,
      }
      if (world.activeDateEvent.durationDays <= 0) {
        world.activeDateEvent = null
      }
    }
    // Check for new date events
    const dateEvt = checkDateEvent(world.calendar)
    if (dateEvt) {
      world.activeDateEvent = { ...dateEvt }
      result.toasts.push({
        id: nanoid(),
        text: `📅 ${dateEvt.title}！${dateEvt.description}（${dateEvt.genre ? dateEvt.genre + '类书籍销量×' + dateEvt.multiplier : '全类书籍销量×' + dateEvt.multiplier}，持续${dateEvt.durationDays}天）`,
        type: 'milestone',
        createdAt: world.playTicks,
      })
    }
  }

  // Random events every 300 ticks (~5 min)
  if (world.playTicks % 300 === 0) {
    const randomEvt = rollRandomEvent(world)
    if (randomEvt) {
      result.toasts.push({ id: nanoid(), text: randomEvt, type: 'milestone', createdAt: world.playTicks })
    }
  }

  // 1. Spawn manuscripts
  world.spawnTimer--
  if (world.spawnTimer <= 0) {
    const submitted = [...world.manuscripts.values()].filter(m => m.status === 'submitted')
    if (submitted.length < MAX_SUBMITTED_QUEUE) {
      const ms = createManuscript(world)
      world.manuscripts.set(ms.id, ms)
      result.newManuscripts.push(ms)
    }
    world.spawnTimer = 15 + rangeInt(-3, 8)
  }

  // 2. Process reviewing
  for (const m of world.manuscripts.values()) {
    if (m.status !== 'reviewing') continue
    const editEfficiency = getDeptEfficiency(world, 'editing')
    const needed = reviewTicks(editEfficiency)
    const speedMult = 1 + effSpeedBonus
    m.editingProgress += (1 / needed) * speedMult
    if (m.editingProgress >= 1) {
      m.status = 'editing'
      m.editingProgress = 0
      world.currencies.revisionPoints += rpPerReview(effSpeedBonus + effRpBonus)
      result.toasts.push(createToast(generateToast('reviewComplete', {
        title: m.title,
        genre: m.genre,
        quality: String(m.quality),
        authorName: world.authors.get(m.authorId)?.name ?? 'Unknown',
        playerName: world.playerName,
      }), 'info'))
    }
  }

  // 3. Process editing
  for (const m of world.manuscripts.values()) {
    if (m.status !== 'editing') continue
    const editEfficiency = getDeptEfficiency(world, 'editing')
    const needed = editingTicks(m.wordCount, editEfficiency)
    const speedMult = 1 + effSpeedBonus
    m.editingProgress += (1 / needed) * speedMult
    if (m.editingProgress >= 1) {
      m.status = 'proofing'
      m.editingProgress = 0
      world.currencies.revisionPoints += rpPerEdit(effSpeedBonus + effRpBonus)
    }
  }

  // 4. Process proofing
  for (const m of world.manuscripts.values()) {
    if (m.status !== 'proofing') continue
    const editEfficiency = getDeptEfficiency(world, 'editing')
    const needed = proofingTicks(editEfficiency)
    const speedMult = 1 + effSpeedBonus
    m.editingProgress += (1 / needed) * speedMult
    if (m.editingProgress >= 1) {
      m.status = 'cover_select'
      m.editingProgress = 0
      world.currencies.revisionPoints += rpPerProof(effSpeedBonus + effRpBonus)
    }
  }

  // 5. Process publishing
  for (const m of world.manuscripts.values()) {
    if (m.status !== 'publishing') continue
    const editEfficiency = getDeptEfficiency(world, 'editing')
    const needed = publishingTicks(editEfficiency)
    const speedMult = 1 + effSpeedBonus
    m.editingProgress += (1 / needed) * speedMult
    if (m.editingProgress >= 1) {
      m.status = 'published'
      m.publishTime = world.playTicks
      m.editingProgress = 0
      world.totalPublished++
      world.currencies.revisionPoints += rpPerPublish(m.quality, 0)
      world.currencies.prestige += 10
      result.publishedBooks.push(m)
      result.toasts.push(createToast(generateToast('bookPublished', {
        title: m.title,
        genre: m.genre,
        authorName: world.authors.get(m.authorId)?.name ?? 'Unknown',
        playerName: world.playerName,
      }), 'milestone'))

      // Author fame progression
      const author = world.authors.get(m.authorId)
      if (author) {
        author.fame += AUTHOR_FAME_PER_PUBLISH
        const prevTier = author.tier
        if (prevTier === 'signed' && author.fame >= AUTHOR_TIER_THRESHOLDS.known) {
          author.tier = 'known'
          result.toasts.push(createToast(`🌟 ${author.name} 已晋升为知名作者！其作品质量获得了永久提升。`, 'milestone'))
        } else if (prevTier === 'known' && author.fame >= AUTHOR_TIER_THRESHOLDS.idol) {
          author.tier = 'idol'
          result.toasts.push(createToast(`🏆 ${author.name} 已晋升为传奇作者！永夜出版社的藏书阁将铭记这个时刻。`, 'milestone'))
        }
        if (author.tier !== prevTier) {
          // Tier promotion: boost author talent slightly
          author.talent = Math.min(95, author.talent + 5)
        }
      }
    }
  }

  // 6. Collect royalties and sales
  const marketingEfficiency = getDeptEfficiency(world, 'marketing')
  const salesMult = world.activeDateEvent ? world.activeDateEvent.multiplier : 1
  for (const m of world.manuscripts.values()) {
    if (m.status !== 'published') continue
    const royalty = royaltyPerTick(m, world.permanentBonuses.royaltyMultiplier, marketingEfficiency)
    world.currencies.royalties += royalty
    result.royaltiesEarned += royalty
    const hasGenreBuff = world.activeDateEvent && (world.activeDateEvent.genre === null || world.activeDateEvent.genre === m.genre)
    m.salesCount += salesPerTick(marketingEfficiency, m.quality) * (hasGenreBuff ? salesMult : 1)

    // Check bestseller
    if (!m.isBestseller && m.salesCount >= BESTSELLER_SALES) {
      m.isBestseller = true
      world.totalBestsellers++
      world.currencies.prestige += 50
      result.toasts.push(createToast(generateToast('bestseller', {
        title: m.title,
        authorName: world.authors.get(m.authorId)?.name ?? 'Unknown',
        playerName: world.playerName,
      }), 'award'))
    }
  }

  // 7. Tick author cooldowns
  for (const author of world.authors.values()) {
    if (author.cooldownUntil !== null && author.cooldownUntil > 0) {
      author.cooldownUntil--
      if (author.cooldownUntil <= 0) {
        author.cooldownUntil = null
        result.authorsReturned.push(author)
      }
    } else if (author.tier !== 'new') {
      // Active signed+ authors occasionally submit manuscripts
      const interval = manuscriptSpawnInterval(author)
      if (world.playTicks % interval === 0) {
        const ms = createManuscriptForAuthor(world, author)
        world.manuscripts.set(ms.id, ms)
        result.newManuscripts.push(ms)
      }
    }
  }

  // 8. Department upgrade ticks
  for (const dept of world.departments.values()) {
    if (dept.upgradingUntil !== null) {
      if (world.playTicks >= dept.upgradingUntil) {
        dept.level++
        dept.upgradingUntil = null
      }
    }
  }

  // 9. Check milestones
  for (const ms of MILESTONES) {
    if (!world.triggeredMilestones.has(ms.ticks) && world.playTicks >= ms.ticks) {
      world.triggeredMilestones.add(ms.ticks)
      result.toasts.push({ id: nanoid(), text: ms.message, type: 'milestone', createdAt: world.playTicks })
    }
  }

  return result
}

// ──── Manuscript creation ────
function createManuscript(world: GameWorldState): Manuscript {
  const traitQBonus = world.trait ? EDITOR_TRAIT_BONUSES[world.trait].qualityBonus : 0
  const quality = rollQuality() + world.permanentBonuses.manuscriptQualityBonus + traitQBonus
  const genre = pick(GENRES)
  const title = generateTitle(genre)

  // Chance to create a new author
  let authorId: string
  if (roll(0.3) || world.authors.size === 0) {
    const author = createRandomAuthor(world)
    world.authors.set(author.id, author)
    authorId = author.id
  } else {
    const activeAuthors = [...world.authors.values()].filter(a => a.cooldownUntil === null)
    if (activeAuthors.length > 0) {
      authorId = pick(activeAuthors).id
    } else {
      const author = createRandomAuthor(world)
      world.authors.set(author.id, author)
      authorId = author.id
    }
  }

  return {
    id: nanoid(10),
    title,
    authorId,
    genre,
    quality: Math.min(100, quality),
    wordCount: rollWordCount(),
    marketPotential: effectiveMarketPotential(quality, 0),
    status: 'submitted',
    editingProgress: 0,
    createdAt: world.playTicks,
    publishTime: null,
    isBestseller: false,
    salesCount: 0,
    awards: [],
    cover: generateCover(title, genre, world.coversManifest),
    synopsis: generateSynopsis(genre),
    isUnsuitable: isClearlyUnsuitable(quality),
    rejectionReason: isClearlyUnsuitable(quality) ? generateRejectionReason() : '',
  }
}

function createManuscriptForAuthor(world: GameWorldState, author: Author): Manuscript {
  const baseQuality = rollQuality() + authorQualityBoost(author)
  const traitQBonus = world.trait ? EDITOR_TRAIT_BONUSES[world.trait].qualityBonus : 0
  const quality = Math.min(100, effectiveQuality(baseQuality, author.talent + world.permanentBonuses.authorTalentBoost, world.permanentBonuses) + traitQBonus)
  const title = generateTitle(author.genre)

  return {
    id: nanoid(10),
    title,
    authorId: author.id,
    genre: author.genre,
    quality: Math.min(100, quality),
    wordCount: rollWordCount(),
    marketPotential: effectiveMarketPotential(quality, getDeptEfficiency(world, 'marketing')),
    status: 'submitted',
    editingProgress: 0,
    createdAt: world.playTicks,
    publishTime: null,
    isBestseller: false,
    salesCount: 0,
    awards: [],
    cover: generateCover(title, author.genre, world.coversManifest),
    synopsis: generateSynopsis(author.genre),
    isUnsuitable: isClearlyUnsuitable(quality),
    rejectionReason: isClearlyUnsuitable(quality) ? generateRejectionReason() : '',
  }
}

// ──── Author creation ────
function createRandomAuthor(_world: GameWorldState): Author {
  const personaList = ['retired-professor', 'basement-scifi-geek', 'ex-intelligence-officer', 'sociology-phd', 'anxious-debut'] as const
  const persona = pick([...personaList] as unknown as string[]) as AuthorPersona
  const names: Record<string, string[]> = {
    'retired-professor': ['沈默然', '林怀瑾', '顾知秋', '苏砚清'],
    'basement-scifi-geek': ['星野零', '陆星辰', '方代码', '季银河'],
    'ex-intelligence-officer': ['陈深', '秦墨', '韩隐', '洛铮'],
    'sociology-phd': ['周知行博士', '温如言博士', '许观澜博士'],
    'anxious-debut': ['小透明', '宋迟迟', '姜未名', '沈惴惴'],
  }
  const phrases: Record<string, string[]> = {
    'retired-professor': ['"截稿日期，说到底，只是一种建议。"', '"急什么。"'],
    'basement-scifi-geek': ['"量子力学部分应该没算错……吧。"', '"睡眠被高估了。"'],
    'ex-intelligence-officer': ['"这只是小说。大概。"', '"我可以告诉你更多，但……"'],
    'sociology-phd': ['"光是脚注就写了四十页，不客气。"', '"我调研了两千人。他们帮不上什么忙。"'],
    'anxious-debut': ['"写得不好。抱歉。"', '"嫌弃也行，我理解。"'],
  }

  return {
    id: nanoid(8),
    name: pick(names[persona]),
    persona,
    genre: pick(GENRES),
    tier: 'new',
    talent: AUTHOR_BASE_TALENT + rangeInt(0, AUTHOR_TALENT_RANGE),
    reliability: 20 + rangeInt(0, 60),
    fame: 0,
    cooldownUntil: null,
    rejectedCount: 0,
    signaturePhrase: pick(phrases[persona]),
  }
}

// ──── Helpers ────
function getDeptEfficiency(world: GameWorldState, type: string): number {
  for (const dept of world.departments.values()) {
    if (dept.type === type) {
      return 0.5 * dept.level / 10 // simplified
    }
  }
  return 0
}

// ──── Random Events ────
function rollRandomEvent(world: GameWorldState): string | null {
  if (Math.random() > 0.4) return null // 40% chance each check

  const pool: (() => string)[] = [
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
    () => {
      return `☕ 茶水间的古董咖啡机今天没有爆炸。所有人精神抖擞，工作效率似乎高了一点点。`
    },
    () => {
      const prestige = rangeInt(2, 8)
      world.currencies.prestige += prestige
      return `📰 《永夜文学报》刊登了一篇关于出版社的专题报道（可能因为主编欠编辑部主任一个人情）。声望 +${prestige}。`
    },
    () => {
      return `📚 一位老顾客搬走了半座图书馆。编辑们面面相觑——"我们仓库里什么时候有这么多书？"`
    },
    () => {
      const rp = rangeInt(10, 30)
      world.currencies.revisionPoints += rp
      return `💼 版权部成功将一本书的影视改编权卖给了某流媒体平台（虽然合同细则里出现了"永久使用权"这个词）。获得 ${rp} RP。`
    },
    () => {
      return `🔔 人力资源部的新实习生不小心把咖啡洒在了档案柜上——现在所有在编作者都收到了一份"恭喜您中奖"的邮件。场面一度非常尴尬。`
    },
    () => {
      const rp = rangeInt(8, 18)
      world.currencies.revisionPoints += rp
      return `📖 一位退休教授来到编辑部，淡定地指出三本书里的历史错误，然后顺便帮你审了两本稿子。获得 ${rp} RP。`
    },
    () => {
      return `🌙 今夜是新月。年轻编辑们在办公室偷偷讲鬼故事——图书主题的鬼故事销量意外增加了。`
    },
  ]

  return pick(pool)()
}

function createToast(text: string, type: ToastMessage['type']): ToastMessage {
  return { id: nanoid(), text, type, createdAt: Date.now() }
}

// ──── Offline progress ────
export function computeOfflineProgress(world: GameWorldState, offlineTicks: number): TickResult {
  const combined: TickResult = {
    newManuscripts: [],
    publishedBooks: [],
    royaltiesEarned: 0,
    toasts: [],
    eventsTriggered: [],
    authorsReturned: [],
  }

  // Cap offline progress to 8 hours
  const cappedTicks = Math.min(offlineTicks, 28800)

  for (let i = 0; i < cappedTicks; i++) {
    // Run a simplified tick (no toast generation to avoid spam)
    const t = tick(world)
    combined.newManuscripts.push(...t.newManuscripts)
    combined.publishedBooks.push(...t.publishedBooks)
    combined.royaltiesEarned += t.royaltiesEarned
    combined.eventsTriggered.push(...t.eventsTriggered)
  }

  // Generate a summary toast
  if (cappedTicks > 60) {
    combined.toasts.push({
      id: nanoid(),
      text: `你离开了${Math.round(cappedTicks / 60)}分钟。出版社自己运转了。结果嘛……还不错。`,
      type: 'info',
      createdAt: Date.now(),
    })
  }

  return combined
}

