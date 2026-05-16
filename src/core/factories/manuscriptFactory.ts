import type { Author, Manuscript, Genre } from '../types'
import { GENRE_ICONS, GENRES } from '../types'
import { GENRE_COVER_COLORS } from '../constants'
import { TITLE_SUBTITLES } from '../data/editorNotes'
import { PERSONA_GENRE_BIAS } from '../data/personaData'
import {
  effectiveMarketPotential,
  effectiveQuality,
  rollQuality,
  rollWordCount,
  authorQualityBoost,
} from '../formulas'
import { EDITOR_TRAIT_BONUSES, GENRE_PREFERENCE_QUALITY_BONUS } from '../constants'
import { personaPassiveFor } from '../data/personaPassives'
import { TITLE_POOLS, getBaseTitle, titleToSlug } from '../titlePools'
import { NIGHT_TITLE_POOLS } from '../lore/nightTitles'
import { levelBonuses } from '../leveling'
import { generateSynopsis, generateRejectionReason, isClearlyUnsuitable } from '../humor/synopsis'
import { createRandomAuthor } from './authorFactory'
import { nanoid } from '../../utils/id'
import { pick } from '../../utils/random'
import type { GameWorldState } from '../gameLoop'

// ──── Title generation ────
// 永夜世界优先：默认从永夜原生标题池抽取。
// 凡间专栏开启时，30% 概率从现实戏仿池抽取（标记为"来自白班世界的稀奇投稿"）。
export function generateTitle(genre: string, world: GameWorldState): string {
  const nightPool = NIGHT_TITLE_POOLS[genre] ?? NIGHT_TITLE_POOLS['hybrid']
  const mortalPool = TITLE_POOLS[genre] ?? TITLE_POOLS['hybrid']
  const useMortal = world.acceptMortalSubmissions && Math.random() < 0.3
  const pool = useMortal ? mortalPool : nightPool
  let title = ''
  for (let i = 0; i < 15; i++) {
    const candidate = pool[Math.floor(Math.random() * pool.length)]
    const suffixed = Math.random() < 0.35 ? `${candidate} · ${pick(TITLE_SUBTITLES)}` : candidate
    if (!world.publishedTitles.has(suffixed)) {
      title = suffixed
      break
    }
  }
  if (!title) title = pool[Math.floor(Math.random() * pool.length)]
  return title
}

// ──── Cover generation ────
export function generateCover(title: string, genre: string, coversManifest: Record<string, string> | null): Manuscript['cover'] {
  const baseTitle = getBaseTitle(title)
  const slug = titleToSlug(baseTitle)
  const entry = coversManifest?.[slug]
  // Use manifest if available, otherwise try direct .png path
  const localSrc = entry ? `/covers/${entry.replace('.svg', '.png')}` : `/covers/${slug}.png`
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

// ──── Helper: get department efficiency ────
function getDeptEfficiency(world: GameWorldState, type: string): number {
  const base = { editing: 0.5, design: 0.3, marketing: 0.2, rights: 0.15 }[type] ?? 0.5
  for (const dept of world.departments.values()) {
    if (dept.type === type) {
      return base * dept.level / 10
    }
  }
  return 0
}

// ──── Manuscript creation (from pool / random author) ────
export function createManuscript(world: GameWorldState, qualityBonus = 0): Manuscript {
  const traitQBonus = world.trait ? EDITOR_TRAIT_BONUSES[world.trait].qualityBonus : 0
  // Calculate weights for genres
  const genreWeights = new Map<Genre, number>()
  let totalWeight = 0
  for (const g of GENRES as Genre[]) {
    let weight = 10
    if (g === world.currentTrend) weight += 15 // +150% for trend
    if (world.preferredGenres.includes(g)) weight += 10 // +100% for preference
    genreWeights.set(g, weight)
    totalWeight += weight
  }
  let roll = Math.random() * totalWeight
  let genre: Genre = GENRES[0] as Genre
  for (const [g, w] of genreWeights.entries()) {
    roll -= w
    if (roll <= 0) {
      genre = g
      break
    }
  }

  const prefCount = world.preferredGenres.filter(g => g === genre).length
  const prefQBonus = prefCount * GENRE_PREFERENCE_QUALITY_BONUS
  const quality = rollQuality() + world.permanentBonuses.manuscriptQualityBonus + traitQBonus + prefQBonus + qualityBonus + levelBonuses(world.editorLevel).quality + (world.permanentBonuses.epochPath === 'scholar' ? 3 : 0)
  const title = generateTitle(genre, world)

  // Chance to create a new author
  let authorId: string
  if (Math.random() < 0.3 || world.authors.size === 0) {
    const author = createRandomAuthor(world, genre)
    world.authors.set(author.id, author)
    authorId = author.id
  } else {
    // Prefer authors whose persona genre-bias matches this manuscript's genre
    const genreBiased = [...world.authors.values()].filter((a: Author) => {
      if (a.cooldownUntil !== null || a.poached || a.terminated) return false
      if (a.booksWritten >= a.maxBooks) return false
      const bias = PERSONA_GENRE_BIAS[a.persona]
      return bias && bias.includes(genre)
    })
    const candidates = genreBiased.length > 0 ? genreBiased
      : [...world.authors.values()].filter((a: Author) => a.cooldownUntil === null && !a.poached && !a.terminated && a.booksWritten < a.maxBooks)
    if (candidates.length > 0) {
      const author = pick(candidates)
      author.lastActiveAt = world.playTicks
      authorId = author.id
    } else {
      const author = createRandomAuthor(world, genre)
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
    synopsis: generateSynopsis(genre, title),
    isUnsuitable: isClearlyUnsuitable(quality),
    rejectionReason: isClearlyUnsuitable(quality) ? generateRejectionReason() : '',
    meticulouslyEdited: false,
    shelvedAt: null,
    reissueBoostUntil: null,
    editorNote: '',
    customNote: '',
  }
}

export function createManuscriptWithWorld(world: GameWorldState, qualityBonus = 0): { world: GameWorldState; manuscript: Manuscript } {
  const nextWorld = structuredClone(world) as GameWorldState
  const manuscript = createManuscript(nextWorld, qualityBonus)
  return { world: nextWorld, manuscript }
}

// ──── Manuscript creation for a specific signed author ────
export function createManuscriptForAuthor(world: GameWorldState, author: Author): Manuscript {
  const baseQuality = rollQuality() + authorQualityBoost(author)
  const traitQBonus = world.trait ? EDITOR_TRAIT_BONUSES[world.trait].qualityBonus : 0
  const prefCount = world.preferredGenres.filter(g => g === author.genre).length
  const prefQBonus = prefCount * GENRE_PREFERENCE_QUALITY_BONUS
  const quality = Math.min(100, effectiveQuality(baseQuality, author.talent + world.permanentBonuses.authorTalentBoost, world.permanentBonuses) + traitQBonus + prefQBonus + levelBonuses(world.editorLevel).quality + (world.permanentBonuses.epochPath === 'scholar' ? 3 : 0))
  const passive = personaPassiveFor(author)
  const title = generateTitle(author.genre, world)

  author.booksWritten++
  author.lastActiveAt = world.playTicks
  return {
    id: nanoid(10),
    title,
    authorId: author.id,
    genre: author.genre,
    quality: Math.min(100, quality + passive.qualityBonus),
    wordCount: Math.round(rollWordCount() * (1 + passive.wordCountBonus)),
    marketPotential: effectiveMarketPotential(quality, getDeptEfficiency(world, 'marketing')),
    status: 'submitted',
    editingProgress: 0,
    createdAt: world.playTicks,
    publishTime: null,
    isBestseller: false,
    salesCount: 0,
    awards: [],
    cover: generateCover(title, author.genre, world.coversManifest),
    synopsis: generateSynopsis(author.genre, title),
    isUnsuitable: isClearlyUnsuitable(quality),
    rejectionReason: isClearlyUnsuitable(quality) ? generateRejectionReason() : '',
    meticulouslyEdited: false,
    shelvedAt: null,
    reissueBoostUntil: null,
    editorNote: '',
    customNote: '',
  }
}

export function createManuscriptForAuthorWithWorld(world: GameWorldState, author: Author): { world: GameWorldState; manuscript: Manuscript } {
  const nextWorld = structuredClone(world) as GameWorldState
  const nextAuthor = nextWorld.authors.get(author.id)
  if (!nextAuthor) {
    throw new Error(`Cannot create manuscript for missing author: ${author.id}`)
  }
  const manuscript = createManuscriptForAuthor(nextWorld, nextAuthor)
  return { world: nextWorld, manuscript }
}
