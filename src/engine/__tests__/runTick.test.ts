import { describe, expect, it } from 'vitest'
import { createInitialWorld } from '@/core/gameLoop'
import { runTick } from '@/engine'
import type { Author, Manuscript } from '@/core/types'

function fixedRng(value: number) {
  return () => value
}

function makeAuthor(id = 'author-1'): Author {
  return {
    id,
    name: '测试作者',
    persona: 'anxious-debut',
    genre: 'mystery',
    tier: 'signed',
    talent: 50,
    reliability: 50,
    fame: 0,
    cooldownUntil: null,
    rejectedCount: 0,
    signaturePhrase: '测试短句',
    affection: 0,
    poached: false,
    terminated: false,
    lastInteractionAt: 0,
    lastActiveAt: 0,
    booksWritten: 0,
    maxBooks: 3,
  }
}

function makeManuscript(authorId = 'author-1'): Manuscript {
  return {
    id: 'manuscript-1',
    title: '测试书稿',
    authorId,
    genre: 'mystery',
    quality: 80,
    wordCount: 80_000,
    marketPotential: 1,
    status: 'published',
    editingProgress: 0,
    createdAt: 0,
    publishTime: null,
    isBestseller: false,
    salesCount: 0,
    awards: [],
    cover: { type: 'generated', src: null, placeholder: { bgColor: '#000', icon: 'book', titleOverlay: '测试书稿' } },
    synopsis: '测试简介',
    isUnsuitable: false,
    rejectionReason: '',
    meticulouslyEdited: false,
    shelvedAt: null,
    reissueBoostUntil: null,
    editorNote: '',
    customNote: '',
  }
}

describe('runTick', () => {
  it('returns a next world without mutating the input world', () => {
    const world = createInitialWorld()
    world.spawnTimer = 999
    world.trendTimer = 999
    world.authors.set('author-1', makeAuthor())
    world.manuscripts.set('manuscript-1', makeManuscript())

    const manuscriptBefore = world.manuscripts.get('manuscript-1')
    const result = runTick(world, { rng: fixedRng(0.5) })

    expect(world.playTicks).toBe(0)
    expect(world.manuscripts.get('manuscript-1')).toBe(manuscriptBefore)
    expect(world.manuscripts.get('manuscript-1')?.salesCount).toBe(0)
    expect(result.world.playTicks).toBe(1)
    expect(result.world.manuscripts.get('manuscript-1')?.salesCount).toBeGreaterThan(0)
  })

  it('publishes a completed publishing manuscript atomically in the returned world', () => {
    const world = createInitialWorld()
    world.spawnTimer = 999
    world.trendTimer = 999
    world.authors.set('author-1', makeAuthor())
    const manuscript = makeManuscript()
    manuscript.status = 'publishing'
    manuscript.editingProgress = 1
    world.manuscripts.set(manuscript.id, manuscript)

    const { world: nextWorld, result } = runTick(world, { rng: fixedRng(0.5) })

    expect(world.manuscripts.get(manuscript.id)?.status).toBe('publishing')
    expect(nextWorld.manuscripts.get(manuscript.id)?.status).toBe('published')
    expect(nextWorld.totalPublished).toBe(1)
    expect(result.publishedBooks).toHaveLength(1)
  })

  it('spawn phase can add manuscript and author without mutating the input maps', () => {
    const world = createInitialWorld()
    world.spawnTimer = 0
    world.trendTimer = 999
    world.acceptMortalSubmissions = false

    const { world: nextWorld, result } = runTick(world, { rng: fixedRng(0.5) })

    expect(world.manuscripts.size).toBe(0)
    expect(world.authors.size).toBe(0)
    expect(nextWorld.manuscripts.size).toBe(1)
    expect(nextWorld.authors.size).toBe(1)
    expect(result.newManuscripts).toHaveLength(1)
  })
})
