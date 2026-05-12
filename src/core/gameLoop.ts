import type { Author, AuthorPersona, Department, EditorTrait, GameEvent, Manuscript, PermanentBonuses, TickResult, ToastMessage } from './types'
import { GENRE_ICONS, GENRES } from './types'
import { GENRE_COVER_COLORS } from './constants'
import {
  AUTHOR_BASE_TALENT,
  AUTHOR_TALENT_RANGE,
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
  spawnTimer: number
  awardTimer: number
  trendTimer: number
  triggeredMilestones: Set<number>
}

// ──── Title generation ────
const SCI_FI_TITLES = [
  'The Last Chrononaut', 'Quantum Tea Leaves', 'Mars, Regrettably',
  'The Sentient Footnote', 'Gravity Is Optional Here', 'A Brief History of Tomorrow',
]
const MYSTERY_TITLES = [
  'The Biscuit Tin Affair', 'Death by Committee', 'The Vicar Did It (Again)',
  'Murder at the Fete', 'The Curious Incident of the Dog in the Library',
]
const SUSPENSE_TITLES = [
  'The Man Who Knew Too Little', 'Deadline', 'The Silent Caller',
  'Beneath the Floorboards', 'The Wrong Key', 'Last Train to Nowhere',
]
const SOCIAL_TITLES = [
  'On Queuing: A Field Study', 'The Sociology of Small Talk',
  'Why We Apologise', 'An Anthropological Survey of the M&S Cafe',
]
const HYBRID_TITLES = [
  'The AI Detective', 'Time Crime Unit', 'The Psychological Time Machine',
  'The Algorithm Murders',
]

const TITLE_POOLS: Record<string, string[]> = {
  'sci-fi': SCI_FI_TITLES,
  mystery: MYSTERY_TITLES,
  suspense: SUSPENSE_TITLES,
  'social-science': SOCIAL_TITLES,
  hybrid: HYBRID_TITLES,
}

function generateTitle(genre: string): string {
  const pool = TITLE_POOLS[genre] ?? HYBRID_TITLES
  return pick(pool) + (roll(0.3) ? ` ${['(Revised)', '(Unabridged)', '(A Novel)', ''][rangeInt(0, 3)]}` : '')
}

function generatePlaceholderCover(title: string, genre: string): Manuscript['cover'] {
  return {
    type: 'generated',
    src: null,
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
    spawnTimer: 5, // first manuscript in 5 seconds
    awardTimer: 0,
    trendTimer: 0,
    triggeredMilestones: new Set(),
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

  // 1. Spawn manuscripts
  world.spawnTimer--
  if (world.spawnTimer <= 0) {
    const submitted = [...world.manuscripts.values()].filter(m => m.status === 'submitted')
    if (submitted.length < MAX_SUBMITTED_QUEUE) {
      const ms = createManuscript(world)
      world.manuscripts.set(ms.id, ms)
      result.newManuscripts.push(ms)
    }
    world.spawnTimer = 20 + rangeInt(-5, 10)
  }

  // 2. Process reviewing
  for (const m of world.manuscripts.values()) {
    if (m.status !== 'reviewing') continue
    m.editingProgress++
    const editEfficiency = getDeptEfficiency(world, 'editing')
    const needed = reviewTicks(editEfficiency)
    const speedMult = 1 + world.permanentBonuses.editingSpeedBonus
    const progressPerTick = (1 / needed) * speedMult
    m.editingProgress = Math.min(1, m.editingProgress * progressPerTick + (1 / needed))
    if (m.editingProgress >= 1) {
      m.status = 'editing'
      m.editingProgress = 0
      world.currencies.revisionPoints += rpPerReview(world.permanentBonuses.editingSpeedBonus)
      result.toasts.push(createToast(generateToast('reviewComplete', {
        title: m.title,
        genre: m.genre,
        quality: String(m.quality),
        authorName: world.authors.get(m.authorId)?.name ?? 'Unknown',
      }), 'info'))
    }
  }

  // 3. Process editing
  for (const m of world.manuscripts.values()) {
    if (m.status !== 'editing') continue
    const editEfficiency = getDeptEfficiency(world, 'editing')
    const needed = editingTicks(m.wordCount, editEfficiency)
    const speedMult = 1 + world.permanentBonuses.editingSpeedBonus
    m.editingProgress += (1 / needed) * speedMult
    if (m.editingProgress >= 1) {
      m.status = 'proofing'
      m.editingProgress = 0
      world.currencies.revisionPoints += rpPerEdit(world.permanentBonuses.editingSpeedBonus)
    }
  }

  // 4. Process proofing
  for (const m of world.manuscripts.values()) {
    if (m.status !== 'proofing') continue
    const editEfficiency = getDeptEfficiency(world, 'editing')
    const needed = proofingTicks(editEfficiency)
    const speedMult = 1 + world.permanentBonuses.editingSpeedBonus
    m.editingProgress += (1 / needed) * speedMult
    if (m.editingProgress >= 1) {
      m.status = 'publishing'
      m.editingProgress = 0
      world.currencies.revisionPoints += rpPerProof(world.permanentBonuses.editingSpeedBonus)
    }
  }

  // 5. Process publishing
  for (const m of world.manuscripts.values()) {
    if (m.status !== 'publishing') continue
    const editEfficiency = getDeptEfficiency(world, 'editing')
    const needed = publishingTicks(editEfficiency)
    const speedMult = 1 + world.permanentBonuses.editingSpeedBonus
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
      }), 'milestone'))
    }
  }

  // 6. Collect royalties and sales
  const marketingEfficiency = getDeptEfficiency(world, 'marketing')
  for (const m of world.manuscripts.values()) {
    if (m.status !== 'published') continue
    const royalty = royaltyPerTick(m, world.permanentBonuses.royaltyMultiplier, marketingEfficiency)
    world.currencies.royalties += royalty
    result.royaltiesEarned += royalty
    m.salesCount += salesPerTick(marketingEfficiency, m.quality)

    // Check bestseller
    if (!m.isBestseller && m.salesCount >= 100000) {
      m.isBestseller = true
      world.totalBestsellers++
      world.currencies.prestige += 50
      result.toasts.push(createToast(generateToast('bestseller', {
        title: m.title,
        authorName: world.authors.get(m.authorId)?.name ?? 'Unknown',
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
  const quality = rollQuality() + world.permanentBonuses.manuscriptQualityBonus
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
    cover: generatePlaceholderCover(title, genre),
  }
}

function createManuscriptForAuthor(world: GameWorldState, author: Author): Manuscript {
  const baseQuality = rollQuality() + authorQualityBoost(author)
  const quality = effectiveQuality(baseQuality, author.talent + world.permanentBonuses.authorTalentBoost, world.permanentBonuses)
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
    cover: generatePlaceholderCover(title, author.genre),
  }
}

// ──── Author creation ────
function createRandomAuthor(_world: GameWorldState): Author {
  const personaList = ['retired-professor', 'basement-scifi-geek', 'ex-intelligence-officer', 'sociology-phd', 'anxious-debut'] as const
  const persona = pick([...personaList] as unknown as string[]) as AuthorPersona
  const names: Record<string, string[]> = {
    'retired-professor': ['Alistair Finch', 'Margaret Harlow', 'Edmund Cross', 'Beatrice Wren'],
    'basement-scifi-geek': ['Zane Kepler', 'Luna Quark', 'Rex Nebula', 'Nova Chen'],
    'ex-intelligence-officer': ['Charles Grey', 'Victoria Hale', 'Marcus Stone'],
    'sociology-phd': ['Dr. Priya Nair', 'Dr. Oliver Banks', 'Dr. Simone Webb'],
    'anxious-debut': ['Penny Wodehouse', 'Theo Ashworth', 'Clara Minton', 'Felix Timid'],
  }
  const phrases: Record<string, string[]> = {
    'retired-professor': ['"Deadlines are, at best, a suggestion."', '"I shall submit when ready."'],
    'basement-scifi-geek': ['"The science checks out. I think."', '"Sleep is overrated."'],
    'ex-intelligence-officer': ['"It\'s fiction. Probably."', '"I could tell you more, but..."'],
    'sociology-phd': ['"The footnotes are 40 pages. You\'re welcome."', '"I surveyed 2,000 people. They were unhelpful."'],
    'anxious-debut': ['"It\'s not very good. Sorry."', '"Please don\'t hate it. Or do. I\'ll understand."'],
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
      text: `You were away for ${Math.round(cappedTicks / 60)} minutes. The press managed without you �?debatably.`,
      type: 'info',
      createdAt: Date.now(),
    })
  }

  return combined
}

