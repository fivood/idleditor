import { describe, expect, it } from 'vitest'
import { DECISION_EFFECTS } from '@/core/decisionEffects'
import type { GameStore } from '@/store/gameStore'
import type { Author } from '@/core/types'

function makeAuthor(): Author {
  return Object.freeze({
    id: 'author-1',
    name: 'Kim・Hiatus（金・休刊）',
    persona: 'korean-webnovel-queen',
    genre: 'light-novel',
    tier: 'signed',
    talent: 50,
    reliability: 50,
    fame: 0,
    cooldownUntil: null,
    rejectedCount: 0,
    signaturePhrase: '休刊不是停更，是蓄力。',
    affection: 50,
    poached: false,
    terminated: false,
    lastInteractionAt: 0,
    lastActiveAt: 0,
    booksWritten: 0,
    maxBooks: 3,
  })
}

describe('DECISION_EFFECTS', () => {
  it('personal-favor does not mutate frozen author objects from store state', () => {
    const state = {
      authors: new Map([['author-1', makeAuthor()]]),
      manuscripts: new Map(),
      toasts: [],
      playTicks: 100,
    } as unknown as GameStore

    expect(() => DECISION_EFFECTS['personal-favor'](state, 0)).not.toThrow()
  })
})
