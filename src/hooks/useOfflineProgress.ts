import { useState, useCallback } from 'react'
import { useGameStore } from '@/store/gameStore'
import { loadGameFromDb } from '@/db/saveManager'
import { computeOfflineProgress } from '@/core/gameLoop'
import type { GameWorldState } from '@/core/gameLoop'

export function useOfflineProgress() {
  const [showReport, setShowReport] = useState(false)
  const [offlineTicks, setOfflineTicks] = useState(0)
  const [earned, setEarned] = useState({ royalties: 0, published: 0 })

  const checkOfflineProgress = useCallback(async () => {
    const saved = await loadGameFromDb()
    if (!saved) return

    const state = useGameStore.getState()
    const ticksSinceSave = state.playTicks - saved.playTicks
    if (ticksSinceSave < 30) return // less than 30 seconds, ignore

    const world: GameWorldState = {
      manuscripts: new Map(),
      authors: new Map(),
      departments: new Map(),
      events: [],
      playTicks: saved.playTicks,
      totalPublished: saved.totalPublished,
      totalBestsellers: saved.totalBestsellers,
      totalRejections: saved.totalRejections,
      currencies: { ...saved.currencies },
      permanentBonuses: { ...saved.permanentBonuses },
      trait: null,
      spawnTimer: 0,
      awardTimer: 0,
      trendTimer: 0,
      triggeredMilestones: new Set(saved.triggeredMilestones),
    }

    // Repopulate from saved data
    for (const [id, ms] of saved.manuscripts) world.manuscripts.set(id, ms)
    for (const [id, a] of saved.authors) world.authors.set(id, a)
    for (const [id, d] of saved.departments) world.departments.set(id, d)

    const result = computeOfflineProgress(world, ticksSinceSave)

    setOfflineTicks(ticksSinceSave)
    setEarned({
      royalties: result.royaltiesEarned,
      published: result.publishedBooks.length,
    })
    setShowReport(true)
  }, [])

  const dismiss = useCallback(() => setShowReport(false), [])

  return { showReport, offlineTicks, earned, checkOfflineProgress, dismiss }
}
