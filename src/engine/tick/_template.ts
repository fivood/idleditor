import type { GameWorldState } from '@/core/gameLoop'
import type { TickResult } from '@/core/types'
import type { PhaseResult, TickContext } from '../types'

/**
 * Phase template for new mechanics.
 *
 * Copy this file, rename the function, mutate only the provided cloned `world`,
 * push UI side effects into `result`, then register the phase in `src/engine/index.ts`.
 * Do not read from Zustand, Dexie, or browser APIs here; tick phases must stay
 * deterministic under a seeded RNG and testable without React.
 */
export function processExamplePhase(
  world: GameWorldState,
  _ctx: TickContext,
  result: TickResult,
): PhaseResult {
  return { world, result }
}
