import type { Author, AuthorPersona, Genre } from '../types'
import { GENRES } from '../types'
import { AUTHOR_PERSONA_NAMES, PEN_NAME_POOL, getAuthorNamePool } from '../data/authorNames'
import { AUTHOR_PERSONA_PHRASES } from '../data/authorPhrases'
import { PERSONA_GENRE_BIAS, PERSONA_MAX_BOOKS, DEFAULT_MAX_BOOKS, ALL_PERSONAS } from '../data/personaData'
import { AUTHOR_BASE_TALENT, AUTHOR_TALENT_RANGE } from '../constants'
import { nanoid } from '../../utils/id'
import { pick, rangeInt } from '../../utils/random'
import type { GameWorldState } from '../gameLoop'

export { PERSONA_GENRE_BIAS }

export function createRandomAuthor(world: GameWorldState, preferredGenre?: Genre): Author {
  // Bias persona toward preferredGenre if provided
  let persona: AuthorPersona
  if (preferredGenre) {
    const matching = ALL_PERSONAS.filter(p => PERSONA_GENRE_BIAS[p]?.includes(preferredGenre))
    persona = matching.length > 0 && Math.random() < 0.8 ? pick(matching) : pick(ALL_PERSONAS)
  } else {
    persona = pick(ALL_PERSONAS)
  }

  // Foreign personas have genre biases
  const bias = PERSONA_GENRE_BIAS[persona]
  const genre = bias && Math.random() < 0.7 ? pick(bias) : pick(GENRES)

  // Pick a unique name - prefer LLM pool, fallback to hardcoded
  const existingNames = new Set([...world.authors.values()].map(a => a.name))
  const authorNamePool = getAuthorNamePool()
  const hardcodedNames = AUTHOR_PERSONA_NAMES[persona]
  let name: string

  if (authorNamePool?.[persona] && authorNamePool[persona].length > 0) {
    name = pick(authorNamePool[persona].filter(n => !existingNames.has(n)))
    if (!name || existingNames.has(name)) {
      name = pick(hardcodedNames)
    }
  } else {
    name = pick(hardcodedNames)
  }

  // Retry and fallback to pen names
  for (let i = 0; i < 15 && existingNames.has(name); i++) {
    name = pick(hardcodedNames)
  }
  if (existingNames.has(name)) {
    name = pick(PEN_NAME_POOL)
  }

  // Max books based on persona
  const maxBooksRange = PERSONA_MAX_BOOKS[persona] ?? DEFAULT_MAX_BOOKS
  const maxBooks = maxBooksRange[0] + Math.floor(Math.random() * (maxBooksRange[1] - maxBooksRange[0] + 1))

  return {
    id: nanoid(8),
    name,
    persona,
    genre,
    tier: 'new',
    talent: AUTHOR_BASE_TALENT + rangeInt(0, AUTHOR_TALENT_RANGE),
    reliability: 20 + rangeInt(0, 60),
    fame: 0,
    cooldownUntil: null,
    rejectedCount: 0,
    signaturePhrase: pick(AUTHOR_PERSONA_PHRASES[persona]),
    affection: 0,
    poached: false,
    terminated: false,
    lastInteractionAt: 0,
    lastActiveAt: 0,
    booksWritten: 0,
    maxBooks,
  }
}
