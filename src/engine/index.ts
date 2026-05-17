import { EDITOR_TRAIT_BONUSES } from '@/core/constants'
import { levelBonuses } from '@/core/leveling'
import { getTalentEffects } from '@/core/helpers'
import { nanoid } from '@/utils/id'
import type { GameWorldState } from '@/core/gameLoop'
import type { TickResult, ToastMessage } from '@/core/types'
import { processCalendarPhase } from './tick/calendarPhase'
import { processRandomEventPhase } from './tick/randomEventPhase'
import { processSpawnPhase } from './tick/spawnPhase'
import { processPipelinePhase } from './tick/pipelinePhase'
import { processEconomyPhase } from './tick/economyPhase'
import { processAuthorPhase } from './tick/authorPhase'
import { processAutomationPhase } from './tick/automationPhase'
import type { RunTickOptions, TickContext, TickPhase } from './types'

const TICK_PHASES: Array<{ name: string; run: TickPhase }> = [
  { name: 'calendar', run: processCalendarPhase },
  { name: 'randomEvent', run: processRandomEventPhase },
  { name: 'spawn', run: processSpawnPhase },
  { name: 'pipeline', run: processPipelinePhase },
  { name: 'economy', run: processEconomyPhase },
  { name: 'author', run: processAuthorPhase },
  { name: 'automation', run: processAutomationPhase },
]

function createTickResult(): TickResult {
  return {
    newManuscripts: [],
    publishedBooks: [],
    royaltiesEarned: 0,
    toasts: [],
    eventsTriggered: [],
    authorsReturned: [],
    catDecisionAvailable: false,
  }
}

function createTickContext(world: GameWorldState): TickContext {
  const trait = world.trait ? EDITOR_TRAIT_BONUSES[world.trait] : { rpBonus: 0, qualityBonus: 0, speedBonus: 0 }
  const talentBonuses = getTalentEffects(world.selectedTalents)
  const lvlBonuses = levelBonuses(world.editorLevel)
  const epochScholar = world.permanentBonuses.epochPath === 'scholar'
  const epochMerchant = world.permanentBonuses.epochPath === 'merchant'
  const epochSocialite = world.permanentBonuses.epochPath === 'socialite'

  return {
    effSpeedBonus: world.permanentBonuses.editingSpeedBonus + trait.speedBonus + (talentBonuses.editSpeed || 0) + (talentBonuses.allStats || 0) + lvlBonuses.speed + (epochScholar ? 0.05 : 0),
    effRpBonus: trait.rpBonus + (talentBonuses.allStats || 0) + lvlBonuses.rp,
    talentBonuses,
    lvlBonuses,
    epochScholar,
    epochMerchant,
    epochSocialite,
    ct: (text: string, type: ToastMessage['type']) => ({ id: nanoid(), text, type, createdAt: world.playTicks }),
  }
}

function withOptionalRng<T>(rng: RunTickOptions['rng'], fn: () => T): T {
  if (!rng) return fn()
  const originalRandom = Math.random
  Math.random = rng
  try {
    return fn()
  } finally {
    Math.random = originalRandom
  }
}

/**
 * Runs one game tick against a cloned world and returns the next world plus UI events.
 *
 * Add new mechanics by implementing a phase in `src/engine/tick/`, then registering
 * it in `TICK_PHASES` above. Phases may mutate their provided cloned `world`, but
 * must not touch Zustand, Dexie, React state, or browser-only APIs.
 */
export function runTick(inputWorld: GameWorldState, options: RunTickOptions = {}): { world: GameWorldState; result: TickResult } {
  return withOptionalRng(options.rng, () => {
    let world = structuredClone(inputWorld) as GameWorldState
    const result = createTickResult()

    world.playTicks++
    const ctx = createTickContext(world)

    for (const phase of TICK_PHASES) {
      try {
        const phaseResult = phase.run(world, ctx, result)
        world = phaseResult.world
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        throw new Error(`Tick phase "${phase.name}" failed at tick ${world.playTicks}: ${message}`, { cause: error })
      }
    }

    return { world, result }
  })
}

export type { RunTickOptions, TickContext, TickPhase, PhaseResult, Rng } from './types'
