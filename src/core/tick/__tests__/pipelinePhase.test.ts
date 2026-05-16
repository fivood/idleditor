import { describe, it, expect, beforeEach } from 'vitest'
import type { GameWorldState } from '@/core/gameLoop'
import { createInitialWorld } from '@/core/gameLoop'

describe('processPipelinePhase', () => {
  let world: GameWorldState

  beforeEach(() => {
    world = createInitialWorld()
  })

  it('should use effRpBonus for publish RP reward, not 0', async () => {
    const { tick } = await import('@/core/gameLoop')

    // Set up a manuscript that's already in publishing stage
    const ms = {
      id: 'test-ms-1',
      title: 'Test Book',
      authorId: 'test-author-1',
      genre: 'mystery' as const,
      quality: 60,
      wordCount: 50000,
      marketPotential: 50,
      status: 'publishing' as const,
      editingProgress: 0.99,
      createdAt: 0,
      publishTime: null,
      isBestseller: false,
      salesCount: 0,
      awards: [],
      cover: { type: 'generated' as const, src: null, placeholder: { bgColor: '#000', icon: '', titleOverlay: '' } },
      synopsis: '',
      isUnsuitable: false,
      rejectionReason: '',
      meticulouslyEdited: false,
      shelvedAt: null,
      reissueBoostUntil: null,
      editorNote: '',
      customNote: '',
    }
    world.manuscripts.set(ms.id, ms)

    // Add a test author
    world.authors.set('test-author-1', {
      id: 'test-author-1',
      name: 'Test Author',
      persona: 'retired-professor' as const,
      genre: 'mystery' as const,
      tier: 'signed' as const,
      talent: 50,
      reliability: 50,
      fame: 0,
      cooldownUntil: null,
      rejectedCount: 0,
      signaturePhrase: '',
      affection: 0,
      poached: false,
      terminated: false,
      lastInteractionAt: 0,
      lastActiveAt: 0,
      booksWritten: 0,
      maxBooks: 100,
    })

    // Set up trait bonus so effRpBonus > 0
    world.trait = 'decisive'

    const initialRp = world.currencies.revisionPoints
    const result = tick(world)

    // Manuscript should be published now
    expect(result.publishedBooks.length).toBe(1)

    // With trait='decisive', effRpBonus = 0.2 (rpBonus) + 0 (talent) + 0 (level)
    // rpPerPublish formula: Math.round(RP_BASE_PER_PUBLISH * (quality / 50) * (1 + rpBonus) * multiplier)
    // = Math.round(50 * (60/50) * (1 + 0.2) * 1) = Math.round(50 * 1.2 * 1.2) = 72
    // Without the fix (rpBonus=0): Math.round(50 * 1.2 * 1) = 60
    const earnedRp = world.currencies.revisionPoints - initialRp
    expect(earnedRp).toBeGreaterThan(60) // Should be 72 with the fix
    expect(earnedRp).toBe(72)
  })
})
