import type { Author, AuthorPersona, Department, EditorTrait, GameEvent, Genre, Manuscript, PermanentBonuses, TickResult, ToastMessage } from './types'
import { GENRE_ICONS, GENRES } from './types'
import { GENRE_COVER_COLORS } from './constants'
import {
  AFFECTION_BAD_PUBLISH_PENALTY,
  AFFECTION_ELITE_TALENT,
  AFFECTION_LETTER,
  AFFECTION_LOYAL,
  AFFECTION_PER_PROMOTION,
  AFFECTION_PER_PUBLISH,
  AFFECTION_PER_QUALITY_PUBLISH,
  AUTHOR_BASE_TALENT,
  AUTHOR_TALENT_RANGE,
  AUTHOR_FAME_PER_PUBLISH,
  AUTHOR_TIER_THRESHOLDS,
  AUTO_COVER_PRESTIGE,
  AUTO_REJECT_PRESTIGE,
  AUTO_REVIEW_DEPT_LEVEL,
  BESTSELLER_SALES,
  BOSS_START_YEARS,
  EDITOR_TRAIT_BONUSES,
  GENRE_PREFERENCE_QUALITY_BONUS,
  GENRE_PREFERENCE_SALES_BONUS,
  MAX_SUBMITTED_QUEUE,
  MILESTONES,
  PUBLISHING_QUOTA_PER_MONTH,
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
  preferredGenres: Genre[]
  booksPublishedThisMonth: number
  publishedTitles: Set<string>
}

// ──── Title generation ────
function generateTitle(genre: string, world: GameWorldState): string {
  const pool = TITLE_POOLS[genre] ?? TITLE_POOLS['hybrid']
  const suffixes = ['（修订版）', '（未删节）', '（长篇）', '（完整版，大概）', '（作者恳请再版）', '（第二版，第一版印错了）', '（豪华版，送书签）', '']
  let title = ''
  for (let i = 0; i < 10; i++) {
    const candidate = pool[Math.floor(Math.random() * pool.length)]
    if (!world.publishedTitles.has(candidate)) {
      title = candidate
      break
    }
  }
  if (!title) title = pool[Math.floor(Math.random() * pool.length)]
  return title + (Math.random() < 0.35 ? ` ${pick(suffixes)}` : '')
}

function generateCover(title: string, genre: string, coversManifest: Record<string, string> | null): Manuscript['cover'] {
  const baseTitle = getBaseTitle(title)
  const slug = titleToSlug(baseTitle)
  const entry = coversManifest?.[slug]
  // Prefer PNG if available, fall back to SVG
  const localSrc = entry ? `/covers/${entry.replace('.svg', '.png')}` : null
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
      bossYears: BOSS_START_YEARS,
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
    preferredGenres: [],
    booksPublishedThisMonth: 0,
    publishedTitles: new Set(),
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
    const prevMonth = world.calendar.month
    advanceCalendar(world.calendar)
    // Reset publishing quota on month change
    if (world.calendar.month !== prevMonth) {
      world.booksPublishedThisMonth = 0
    }
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
    world.spawnTimer = 40 + rangeInt(-5, 15)
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
      const pubPrestige = m.isUnsuitable ? -10 : 10
      world.currencies.prestige += pubPrestige
      world.booksPublishedThisMonth++
      world.publishedTitles.add(m.title)
      result.publishedBooks.push(m)
      if (m.isUnsuitable) {
        result.toasts.push(createToast(
          `📘 《${m.title}》勉强出版。读者评价：浪费纸张。声望 -10`, 'info'))
      } else {
        result.toasts.push(createToast(generateToast('bookPublished', {
          title: m.title,
          genre: m.genre,
          authorName: world.authors.get(m.authorId)?.name ?? 'Unknown',
          playerName: world.playerName,
        }), 'milestone'))
      }

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
          author.affection += AFFECTION_PER_PROMOTION
        }
        // Affection tracking
        author.affection += AFFECTION_PER_PUBLISH
        if (m.quality >= 60) author.affection += AFFECTION_PER_QUALITY_PUBLISH
        if (m.isUnsuitable) author.affection += AFFECTION_BAD_PUBLISH_PENALTY
        if (author.talent >= AFFECTION_ELITE_TALENT) author.affection += 2
        // Loyalty check
        if (author.affection >= AFFECTION_LOYAL) {
          author.talent = Math.min(95, author.talent + 5)
          author.affection = 0
          result.toasts.push(createToast(`💖 ${author.name} 已成为永夜出版社的忠实作者！才华永久 +5。`, 'milestone'))
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
    const prefSalesBonus = 1 + world.preferredGenres.filter(g => g === m.genre).length * GENRE_PREFERENCE_SALES_BONUS
    m.salesCount += salesPerTick(marketingEfficiency, m.quality) * (hasGenreBuff ? salesMult : 1) * prefSalesBonus

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

  // 9. Automation perks
  const editingDeptLevel = getDeptLevel(world, 'editing')
  const prestige = world.currencies.prestige

  // Auto-review: editing dept >= 3
  if (editingDeptLevel >= AUTO_REVIEW_DEPT_LEVEL) {
    const submitted = [...world.manuscripts.values()].filter(m => m.status === 'submitted')
    if (submitted.length > 0) {
      const ms = submitted[0]
      ms.status = 'reviewing'
      ms.editingProgress = 0
      result.toasts.push(createToast(`🤖 自动审稿：《${ms.title}》`, 'info'))
    }
  }

  // Auto-cover: prestige >= 100
  if (prestige >= AUTO_COVER_PRESTIGE && world.booksPublishedThisMonth < PUBLISHING_QUOTA_PER_MONTH) {
    const awaitingCover = [...world.manuscripts.values()].filter(m => m.status === 'cover_select')
    if (awaitingCover.length > 0) {
      const ms = awaitingCover[0]
      ms.status = 'publishing'
      ms.editingProgress = 0
      result.toasts.push(createToast(`🤖 自动出版：《${ms.title}》`, 'info'))
    }
  }

  // Auto-reject unsuitable: prestige >= 200 && editing dept >= 5
  if (prestige >= AUTO_REJECT_PRESTIGE && editingDeptLevel >= 5) {
    const unsuitable = [...world.manuscripts.values()].filter(m => m.status === 'submitted' && m.isUnsuitable)
    for (const ms of unsuitable) {
      ms.status = 'rejected'
      world.totalRejections++
      world.currencies.revisionPoints += 8
      world.currencies.prestige += 3
      // Trigger author cooldown
      const author = world.authors.get(ms.authorId)
      if (author) {
        author.rejectedCount++
        author.cooldownUntil = 1800 + author.rejectedCount * 300
      }
      result.toasts.push(createToast(`🤖 自动退稿：《${ms.title}》——不值得人类编辑的注意力。`, 'info'))
    }
  }

  // 10. Check milestones
  for (const ms of MILESTONES) {
    if (!world.triggeredMilestones.has(ms.ticks) && world.playTicks >= ms.ticks) {
      world.triggeredMilestones.add(ms.ticks)
      world.triggeredMilestones.add(ms.ticks)
      result.toasts.push({ id: nanoid(), text: ms.message, type: 'milestone', createdAt: world.playTicks })
    }
  }

  return result
}

// ──── Manuscript creation ────
function createManuscript(world: GameWorldState): Manuscript {
  const traitQBonus = world.trait ? EDITOR_TRAIT_BONUSES[world.trait].qualityBonus : 0
  const genre = pick(GENRES)
  const prefCount = world.preferredGenres.filter(g => g === genre).length
  const prefQBonus = prefCount * GENRE_PREFERENCE_QUALITY_BONUS
  const quality = rollQuality() + world.permanentBonuses.manuscriptQualityBonus + traitQBonus + prefQBonus
  const title = generateTitle(genre, world)

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
    meticulouslyEdited: false,
  }
}

function createManuscriptForAuthor(world: GameWorldState, author: Author): Manuscript {
  const baseQuality = rollQuality() + authorQualityBoost(author)
  const traitQBonus = world.trait ? EDITOR_TRAIT_BONUSES[world.trait].qualityBonus : 0
  const prefCount = world.preferredGenres.filter(g => g === author.genre).length
  const prefQBonus = prefCount * GENRE_PREFERENCE_QUALITY_BONUS
  const quality = Math.min(100, effectiveQuality(baseQuality, author.talent + world.permanentBonuses.authorTalentBoost, world.permanentBonuses) + traitQBonus + prefQBonus)
  const title = generateTitle(author.genre, world)

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
    meticulouslyEdited: false,
  }
}

// ──── Author creation ────
function createRandomAuthor(_world: GameWorldState): Author {
  const personaList = [
    'retired-professor', 'basement-scifi-geek', 'ex-intelligence-officer', 'sociology-phd', 'anxious-debut',
    'reclusive-latam-writer', 'nordic-crime-queen', 'american-bestseller-machine', 'japanese-lightnovel-otaku',
  ] as const
  const persona = pick([...personaList] as unknown as string[]) as AuthorPersona
  const names: Record<string, string[]> = {
    'retired-professor': ['沈默然', '林怀瑾', '顾知秋', '苏砚清'],
    'basement-scifi-geek': ['星野零', '陆星辰', '方代码', '季银河'],
    'ex-intelligence-officer': ['陈深', '秦墨', '韩隐', '洛铮'],
    'sociology-phd': ['周知行博士', '温如言博士', '许观澜博士'],
    'anxious-debut': ['小透明', '宋迟迟', '姜未名', '沈惴惴'],
    'reclusive-latam-writer': ['加夫列尔·神', '马里奥·略哈', '胡里奥·塔萨'],
    'nordic-crime-queen': ['英格丽·凛', '阿斯特丽德·寒', '西格丽德·霜'],
    'american-bestseller-machine': ['杰克·麦克畅销', '艾米丽·页翻', '泰勒·排行榜'],
    'japanese-lightnovel-otaku': ['田中ライト', '鈴木ノベル', '佐藤異世界'],
  }
  const phrases: Record<string, string[]> = {
    'retired-professor': ['"截稿日期，说到底，只是一种建议。"', '"急什么。"'],
    'basement-scifi-geek': ['"量子力学部分应该没算错……吧。"', '"睡眠被高估了。"'],
    'ex-intelligence-officer': ['"这只是小说。大概。"', '"我可以告诉你更多，但……"'],
    'sociology-phd': ['"光是脚注就写了四十页，不客气。"', '"我调研了两千人。他们帮不上什么忙。"'],
    'anxious-debut': ['"写得不好。抱歉。"', '"嫌弃也行，我理解。"'],
    'reclusive-latam-writer': ['"花了十七年。前面十六年在泡茶。"', '"不要按章节读。第104页开始，跳回第3页。"'],
    'nordic-crime-queen': ['"第二具尸体在……不能说。"', '"暖气是灵感的敌人。"'],
    'american-bestseller-machine': ['"已经有三个制片人在竞价了。"', '"每章必须以钩子结尾。这是物理定律。"'],
    'japanese-lightnovel-otaku': ['"如果篇幅不够，第三章加个泳装回。"', '"前13卷在硬盘里，等出版社打电话。"'],
  }

  // Foreign personas have genre biases
  const genreBias: Record<string, Genre[]> = {
    'reclusive-latam-writer': ['hybrid', 'social-science'],
    'nordic-crime-queen': ['mystery', 'suspense'],
    'american-bestseller-machine': ['hybrid', 'mystery'],
    'japanese-lightnovel-otaku': ['sci-fi', 'hybrid'],
  }
  const bias = genreBias[persona]
  const genre = bias && Math.random() < 0.7 ? pick(bias) : pick(GENRES)

  return {
    id: nanoid(8),
    name: pick(names[persona]),
    persona,
    genre,
    tier: 'new',
    talent: AUTHOR_BASE_TALENT + rangeInt(0, AUTHOR_TALENT_RANGE),
    reliability: 20 + rangeInt(0, 60),
    fame: 0,
    cooldownUntil: null,
    rejectedCount: 0,
    signaturePhrase: pick(phrases[persona]),
    affection: 0,
  }
}

// ──── Helpers ────
function getDeptEfficiency(world: GameWorldState, type: string): number {
  for (const dept of world.departments.values()) {
    if (dept.type === type) {
      return 0.5 * dept.level / 10
    }
  }
  return 0
}

function getDeptLevel(world: GameWorldState, type: string): number {
  for (const dept of world.departments.values()) {
    if (dept.type === type) return dept.level
  }
  return 0
}

// ──── Random Events ────
function rollRandomEvent(world: GameWorldState): string | null {
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

    // ── Affection events ──
    () => {
      const loved = [...world.authors.values()].filter(a => a.affection >= AFFECTION_LETTER)
      if (loved.length === 0) return null
      const a = loved[Math.floor(Math.random() * loved.length)]
      const prestige = rangeInt(15, 30)
      world.currencies.prestige += prestige
      a.affection = Math.max(0, a.affection - 30)
      const letters = [
        `${a.name}寄来了一封手写感谢信。信纸是手工纸，墨水是深蓝色的，字迹因为激动而微微颤抖。附赠一小袋自家种的茶叶。声望 +${prestige}。`,
        `${a.name}在《永夜文学报》上刊登了一整版广告，内容只有一句话："谢谢永夜出版社的编辑。"编辑部主任把它裱起来了。声望 +${prestige}。`,
        `${a.name}寄来了一瓶红酒和一张卡片："致那位让我不敢写烂稿的编辑"。卡片背面还有一行小字："下次我会写得更好"。声望 +${prestige}。`,
        `${a.name}捐赠了一批书籍给出版社的阅览室。每本书的扉页上都手写了一句话。被编辑们轮流拍照发到了内部群里。声望 +${prestige}。`,
      ]
      return pick(letters)
    },
    () => {
      const elite = [...world.authors.values()].filter(a => a.talent >= AFFECTION_ELITE_TALENT && a.affection >= 30)
      if (elite.length === 0) return null
      const a = elite[Math.floor(Math.random() * elite.length)]
      const prestige = rangeInt(10, 20)
      world.currencies.prestige += prestige
      return `🌟 精英作者${a.name}在社交媒体上发了一条长文，称赞出版社的专业水准。文章被转发了${rangeInt(50, 500)}次。声望 +${prestige}。`
    },
    // ── Random events (non-love) ──
    () => {
      const loved = [...world.authors.values()].filter(a => a.affection >= AFFECTION_LETTER)
      if (loved.length === 0) return null
      const a = loved[Math.floor(Math.random() * loved.length)]
      const prestige = rangeInt(15, 30)
      world.currencies.prestige += prestige
      a.affection = Math.max(0, a.affection - 30)
      const letters = [
        `${a.name}寄来了一封手写感谢信。信纸是手工纸，墨水是深蓝色的，字迹因为激动而微微颤抖。附赠一小袋自家种的茶叶。声望 +${prestige}。`,
        `${a.name}在《永夜文学报》上刊登了一整版广告，内容只有一句话："谢谢永夜出版社的编辑。"编辑部主任把它裱起来了。声望 +${prestige}。`,
        `${a.name}寄来了一瓶红酒和一张卡片："致那位让我不敢写烂稿的编辑"。卡片背面还有一行小字："下次我会写得更好"。声望 +${prestige}。`,
        `${a.name}捐赠了一批书籍给出版社的阅览室。每本书的扉页上都手写了一句话。被编辑们轮流拍照发到了内部群里。声望 +${prestige}。`,
      ]
      return pick(letters)
    },
  ]

  // Pick a random event, retry if null (max 5 tries)
  for (let i = 0; i < 5; i++) {
    const result = pick(pool)()
    if (result !== null) return result
  }
  return null
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

