import type { Genre, AuthorPersona } from '../types'

// ──── Persona-genre bias map ────
// Determines which genres each persona is likely to write in

export const PERSONA_GENRE_BIAS: Partial<Record<AuthorPersona, Genre[]>> = {
  'reclusive-latam-writer': ['hybrid', 'social-science'],
  'nordic-crime-queen': ['mystery', 'suspense'],
  'american-bestseller-machine': ['hybrid', 'mystery'],
  'japanese-lightnovel-otaku': ['sci-fi', 'hybrid'],
  'fantasy-epic-writer': ['hybrid', 'sci-fi'],
  'french-literary-recluse': ['social-science', 'hybrid'],
  'indian-epic-sage': ['hybrid', 'social-science'],
  'russian-doom-spiral': ['social-science', 'suspense'],
  'korean-webnovel-queen': ['light-novel', 'hybrid'],
  'nigerian-magical-realist': ['hybrid', 'social-science'],
  'australian-outback-gothic': ['suspense', 'mystery'],
}

// ──── Max books per persona ────
// How many books each persona type can write before retiring

export const PERSONA_MAX_BOOKS: Partial<Record<AuthorPersona, [number, number]>> = {
  'american-bestseller-machine': [15, 30],
  'japanese-lightnovel-otaku': [12, 25],
  'korean-webnovel-queen': [20, 40],
  'fantasy-epic-writer': [8, 20],
  'anxious-debut': [1, 4],
  'french-literary-recluse': [2, 6],
  'russian-doom-spiral': [3, 8],
  'indian-epic-sage': [1, 3],
  'nigerian-magical-realist': [2, 5],
  'australian-outback-gothic': [3, 7],
}

export const DEFAULT_MAX_BOOKS: [number, number] = [4, 12]

// ──── All persona keys (as typed array) ────
export const ALL_PERSONAS: AuthorPersona[] = [
  'retired-professor', 'basement-scifi-geek', 'ex-intelligence-officer', 'sociology-phd', 'anxious-debut',
  'reclusive-latam-writer', 'nordic-crime-queen', 'american-bestseller-machine', 'japanese-lightnovel-otaku',
  'historical-detective-writer', 'fantasy-epic-writer',
  'french-literary-recluse', 'indian-epic-sage', 'russian-doom-spiral',
  'korean-webnovel-queen', 'nigerian-magical-realist', 'australian-outback-gothic',
]
