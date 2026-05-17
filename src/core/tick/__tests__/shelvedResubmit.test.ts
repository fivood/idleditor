import { describe, it, expect } from 'vitest'
import { createInitialWorld, tick } from '@/core/gameLoop'

/**
 * Simulate the shelving action (shelveManuscript from miscActions.ts).
 * The actual action lives in the Zustand store and cannot be called in engine tests.
 * This reproduces its logic so we can test the full shelving -> resubmission lifecycle.
 *
 * From miscActions.ts:342-356:
 *   ms.status = 'shelved'
 *   ms.shelvedAt = draft.playTicks
 *   ms.shelvedResubmitAt = draft.playTicks + rangeInt(300, 600)
 */
function simulateShelve(world: ReturnType<typeof createInitialWorld>, msId: string, resubmitOffset: number): void {
  const ms = world.manuscripts.get(msId)
  if (!ms || ms.status !== 'submitted') return
  ms.status = 'shelved'
  ms.shelvedAt = world.playTicks
  ms.shelvedResubmitAt = world.playTicks + resubmitOffset
}

describe('shelved manuscript resubmission timing', () => {
  it('should resubmit at the predetermined shelvedResubmitAt tick', () => {
    const world = createInitialWorld()
    world.spawnTimer = 99999999
    world.trendTimer = 99999999

    // Manuscript shelved at tick 100, resubmit scheduled at tick 500
    world.manuscripts.set('shelved-ms', {
      id: 'shelved-ms',
      title: 'Test',
      authorId: 'auth-1',
      genre: 'sci-fi',
      quality: 40,
      wordCount: 50000,
      marketPotential: 50,
      status: 'shelved' as const,
      editingProgress: 0,
      createdAt: 0,
      publishTime: null,
      isBestseller: false,
      salesCount: 0,
      awards: [],
      cover: { type: 'generated', src: null, placeholder: { bgColor: '#000', icon: '?', titleOverlay: '' } },
      synopsis: 'Test synopsis',
      isUnsuitable: false,
      rejectionReason: '',
      meticulouslyEdited: false,
      shelvedAt: 100,
      shelvedResubmitAt: 500,
      reissueBoostUntil: null,
      editorNote: '',
      customNote: '',
    })

    // Run ticks up to 499 — should NOT trigger
    for (let t = 0; t < 499; t++) {
      tick(world)
    }
    expect(world.playTicks).toBe(499)
    expect(world.manuscripts.get('shelved-ms')?.status).toBe('shelved')

    // Tick 500 — should trigger exactly
    tick(world)
    expect(world.playTicks).toBe(500)
    expect(world.manuscripts.get('shelved-ms')?.status).toBe('submitted')
    expect(world.manuscripts.get('shelved-ms')?.quality).toBe(43) // 40 + 3
    expect(world.manuscripts.get('shelved-ms')?.shelvedAt).toBeNull()
    expect(world.manuscripts.get('shelved-ms')?.shelvedResubmitAt).toBeNull()
    // Synopsis should be modified with a resubmission note (all notes start with '（')
    expect(world.manuscripts.get('shelved-ms')?.synopsis).toContain('（')
    expect(world.manuscripts.get('shelved-ms')?.synopsis).not.toBe('Test synopsis')
  })

  it('should use fallback 450-tick delay when shelvedResubmitAt is missing (legacy save)', () => {
    const world = createInitialWorld()
    world.spawnTimer = 99999999
    world.trendTimer = 99999999

    world.manuscripts.set('legacy-ms', {
      id: 'legacy-ms',
      title: 'Legacy',
      authorId: 'auth-1',
      genre: 'mystery',
      quality: 50,
      wordCount: 40000,
      marketPotential: 50,
      status: 'shelved' as const,
      editingProgress: 0,
      createdAt: 0,
      publishTime: null,
      isBestseller: false,
      salesCount: 0,
      awards: [],
      cover: { type: 'generated', src: null, placeholder: { bgColor: '#000', icon: '?', titleOverlay: '' } },
      synopsis: 'Legacy synopsis',
      isUnsuitable: false,
      rejectionReason: '',
      meticulouslyEdited: false,
      shelvedAt: 100,
      shelvedResubmitAt: null, // missing — should fallback to shelvedAt + 450
      reissueBoostUntil: null,
      editorNote: '',
      customNote: '',
    })

    // Run to tick 549 (449 ticks since shelved) — should NOT trigger
    for (let t = 0; t < 549; t++) {
      tick(world)
    }
    expect(world.manuscripts.get('legacy-ms')?.status).toBe('shelved')

    // Tick 550 (450 ticks since shelved) — should trigger
    tick(world)
    const ms = world.manuscripts.get('legacy-ms')
    expect(ms?.status).toBe('submitted')
    expect(ms?.quality).toBe(53) // 50 + 3
    expect(ms?.shelvedAt).toBeNull()
    expect(ms?.shelvedResubmitAt).toBeNull()
    expect(ms?.synopsis).toContain('（')
    expect(ms?.synopsis).not.toBe('Legacy synopsis')
  })

  it('should fallback to current tick + 450 when both shelvedResubmitAt and shelvedAt are missing', () => {
    const world = createInitialWorld()
    world.spawnTimer = 99999999
    world.trendTimer = 99999999

    world.manuscripts.set('orphan-ms', {
      id: 'orphan-ms',
      title: 'Orphan',
      authorId: 'auth-1',
      genre: 'sci-fi',
      quality: 30,
      wordCount: 30000,
      marketPotential: 50,
      status: 'shelved' as const,
      editingProgress: 0,
      createdAt: 0,
      publishTime: null,
      isBestseller: false,
      salesCount: 0,
      awards: [],
      cover: { type: 'generated', src: null, placeholder: { bgColor: '#000', icon: '?', titleOverlay: '' } },
      synopsis: 'Orphan',
      isUnsuitable: false,
      rejectionReason: '',
      meticulouslyEdited: false,
      shelvedAt: null, // both null — fallback to world.playTicks + 450
      shelvedResubmitAt: null,
      reissueBoostUntil: null,
      editorNote: '',
      customNote: '',
    })

    // Run 449 ticks — should NOT trigger yet
    for (let t = 0; t < 449; t++) {
      tick(world)
    }
    expect(world.manuscripts.get('orphan-ms')?.status).toBe('shelved')

    // Tick 450 — should trigger (450 ticks from playTicks=0)
    tick(world)
    expect(world.playTicks).toBe(450)
    expect(world.manuscripts.get('orphan-ms')?.status).toBe('submitted')
    expect(world.manuscripts.get('orphan-ms')?.quality).toBe(33) // 30 + 3
  })

  it('full lifecycle: shelve action -> tick to resubmit -> verify state', () => {
    const world = createInitialWorld()
    world.spawnTimer = 99999999
    world.trendTimer = 99999999

    // Start with a submitted manuscript at tick 0
    world.manuscripts.set('lifecycle-ms', {
      id: 'lifecycle-ms',
      title: 'Lifecycle',
      authorId: 'auth-1',
      genre: 'sci-fi',
      quality: 45,
      wordCount: 50000,
      marketPotential: 50,
      status: 'submitted' as const,
      editingProgress: 0,
      createdAt: 0,
      publishTime: null,
      isBestseller: false,
      salesCount: 0,
      awards: [],
      cover: { type: 'generated', src: null, placeholder: { bgColor: '#000', icon: '?', titleOverlay: '' } },
      synopsis: 'Original synopsis',
      isUnsuitable: false,
      rejectionReason: '',
      meticulouslyEdited: false,
      shelvedAt: null,
      shelvedResubmitAt: null,
      reissueBoostUntil: null,
      editorNote: '',
      customNote: '',
    })

    // Advance to tick 100
    for (let t = 0; t < 100; t++) {
      tick(world)
    }
    expect(world.playTicks).toBe(100)
    expect(world.manuscripts.get('lifecycle-ms')?.status).toBe('submitted')

    // Simulate shelving at tick 100 with resubmitOffset = 400 (within [300, 600])
    simulateShelve(world, 'lifecycle-ms', 400)
    const shelved = world.manuscripts.get('lifecycle-ms')
    expect(shelved?.status).toBe('shelved')
    expect(shelved?.shelvedAt).toBe(100)
    expect(shelved?.shelvedResubmitAt).toBe(500) // 100 + 400

    // Tick from 100 to 499 (399 more ticks) — should NOT trigger
    for (let t = 0; t < 399; t++) {
      tick(world)
    }
    expect(world.playTicks).toBe(499)
    expect(world.manuscripts.get('lifecycle-ms')?.status).toBe('shelved')

    // Tick 500 — should trigger resubmission
    tick(world)
    const resubmitted = world.manuscripts.get('lifecycle-ms')
    expect(resubmitted?.status).toBe('submitted')
    expect(resubmitted?.quality).toBe(48) // 45 + 3
    expect(resubmitted?.shelvedAt).toBeNull()
    expect(resubmitted?.shelvedResubmitAt).toBeNull()
    expect(resubmitted?.synopsis).toContain('（')
    expect(resubmitted?.synopsis).not.toBe('Original synopsis')
  })

  it('should cap quality at 100 after resubmission boost', () => {
    const world = createInitialWorld()
    world.spawnTimer = 99999999
    world.trendTimer = 99999999

    world.manuscripts.set('high-quality-ms', {
      id: 'high-quality-ms',
      title: 'High Quality',
      authorId: 'auth-1',
      genre: 'sci-fi',
      quality: 98, // 98 + 3 would be 101, but capped at 100
      wordCount: 50000,
      marketPotential: 50,
      status: 'shelved' as const,
      editingProgress: 0,
      createdAt: 0,
      publishTime: null,
      isBestseller: false,
      salesCount: 0,
      awards: [],
      cover: { type: 'generated', src: null, placeholder: { bgColor: '#000', icon: '?', titleOverlay: '' } },
      synopsis: 'High quality',
      isUnsuitable: false,
      rejectionReason: '',
      meticulouslyEdited: false,
      shelvedAt: 100,
      shelvedResubmitAt: 200,
      reissueBoostUntil: null,
      editorNote: '',
      customNote: '',
    })

    // Run to tick 200
    for (let t = 0; t < 200; t++) {
      tick(world)
    }
    const ms = world.manuscripts.get('high-quality-ms')
    expect(ms?.status).toBe('submitted')
    expect(ms?.quality).toBe(100) // capped
  })

  it('multiple shelved manuscripts should resubmit independently at their own times', () => {
    const world = createInitialWorld()
    world.spawnTimer = 99999999
    world.trendTimer = 99999999

    // Manuscript A: resubmits at tick 100
    world.manuscripts.set('ms-a', {
      id: 'ms-a',
      title: 'MS A',
      authorId: 'auth-1',
      genre: 'sci-fi',
      quality: 40,
      wordCount: 50000,
      marketPotential: 50,
      status: 'shelved' as const,
      editingProgress: 0,
      createdAt: 0,
      publishTime: null,
      isBestseller: false,
      salesCount: 0,
      awards: [],
      cover: { type: 'generated', src: null, placeholder: { bgColor: '#000', icon: '?', titleOverlay: '' } },
      synopsis: 'A',
      isUnsuitable: false,
      rejectionReason: '',
      meticulouslyEdited: false,
      shelvedAt: 50,
      shelvedResubmitAt: 100,
      reissueBoostUntil: null,
      editorNote: '',
      customNote: '',
    })

    // Manuscript B: resubmits at tick 200
    world.manuscripts.set('ms-b', {
      id: 'ms-b',
      title: 'MS B',
      authorId: 'auth-2',
      genre: 'mystery',
      quality: 50,
      wordCount: 40000,
      marketPotential: 50,
      status: 'shelved' as const,
      editingProgress: 0,
      createdAt: 0,
      publishTime: null,
      isBestseller: false,
      salesCount: 0,
      awards: [],
      cover: { type: 'generated', src: null, placeholder: { bgColor: '#000', icon: '?', titleOverlay: '' } },
      synopsis: 'B',
      isUnsuitable: false,
      rejectionReason: '',
      meticulouslyEdited: false,
      shelvedAt: 100,
      shelvedResubmitAt: 200,
      reissueBoostUntil: null,
      editorNote: '',
      customNote: '',
    })

    // Tick to 100
    for (let t = 0; t < 100; t++) {
      tick(world)
    }
    expect(world.manuscripts.get('ms-a')?.status).toBe('submitted')
    expect(world.manuscripts.get('ms-b')?.status).toBe('shelved')

    // Tick to 200
    for (let t = 100; t < 200; t++) {
      tick(world)
    }
    expect(world.manuscripts.get('ms-b')?.status).toBe('submitted')
  })

  it('resubmit timing should be deterministic across multiple runs', () => {
    const results: number[] = []

    for (let run = 0; run < 10; run++) {
      const world = createInitialWorld()
      world.spawnTimer = 99999999
      world.trendTimer = 99999999

      world.manuscripts.set(`ms-${run}`, {
        id: `ms-${run}`,
        title: 'Test',
        authorId: 'auth-1',
        genre: 'sci-fi',
        quality: 40,
        wordCount: 50000,
        marketPotential: 50,
        status: 'shelved' as const,
        editingProgress: 0,
        createdAt: 0,
        publishTime: null,
        isBestseller: false,
        salesCount: 0,
        awards: [],
        cover: { type: 'generated', src: null, placeholder: { bgColor: '#000', icon: '?', titleOverlay: '' } },
        synopsis: 'Test',
        isUnsuitable: false,
        rejectionReason: '',
        meticulouslyEdited: false,
        shelvedAt: 100,
        shelvedResubmitAt: 600,
        reissueBoostUntil: null,
        editorNote: '',
        customNote: '',
      })

      for (let t = 0; t < 700; t++) {
        tick(world)
        if (world.manuscripts.get(`ms-${run}`)?.status === 'submitted') {
          results.push(world.playTicks)
          break
        }
      }
    }

    // All 10 runs should trigger at exactly the same tick
    for (const r of results) {
      expect(r).toBe(600)
    }
  })
})
