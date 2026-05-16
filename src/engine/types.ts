import type { GameWorldState } from '@/core/gameLoop'
import type { TickResult, ToastMessage } from '@/core/types'
import type { Talent } from '@/core/talents'

export type Rng = () => number

export interface TickContext {
  effSpeedBonus: number
  effRpBonus: number
  talentBonuses: Talent['effects']
  lvlBonuses: { quality: number; speed: number; rp: number }
  epochScholar: boolean
  epochMerchant: boolean
  epochSocialite: boolean
  ct: (text: string, type: ToastMessage['type']) => ToastMessage
}

export interface PhaseResult {
  world: GameWorldState
  result: TickResult
}

export type TickPhase = (world: GameWorldState, ctx: TickContext, result: TickResult) => PhaseResult

export interface RunTickOptions {
  rng?: Rng
}
