import type { GameWorldState } from '../gameLoop'
import type { TickResult, ToastMessage } from '../types'
import type { Talent } from '../talents'

export interface TickContext {
  world: GameWorldState
  result: TickResult
  effSpeedBonus: number
  effRpBonus: number
  talentBonuses: Talent['effects']
  lvlBonuses: { quality: number; speed: number; rp: number }
  epochScholar: boolean
  epochMerchant: boolean
  epochSocialite: boolean
  ct: (text: string, type: ToastMessage['type']) => ToastMessage
}
