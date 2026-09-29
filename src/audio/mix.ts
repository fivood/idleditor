import { WINDOWS } from '@/art/weather'
import type { RoomKind } from '@/art/rooms'
import type { Weather } from '@/core/weather'

export interface Scene { weather: Weather; room: RoomKind; working: boolean }
/** Target levels (0..1) of each ambience layer, and the cutoff of the "through the wall" filter. */
export interface Mix { rain: number; wind: number; hush: number; crickets: number; fire: number; typing: number; muffle: number }

/** Pure so it can be tested: what should this room sound like right now? */
export function sceneMix({ weather, room, working }: Scene): Mix {
  const windowed = room in WINDOWS
  const outdoor = windowed ? 1 : .3 // rooms without a window only hear the weather through the walls
  const by = <T extends number>(table: Partial<Record<Weather, T>>) => (table[weather] ?? 0) * outdoor
  return {
    rain: by({ drizzle: .3, storm: .65 }),
    wind: by({ wind: .55, storm: .35, snow: .15, fog: .08, drizzle: .06 }),
    hush: by({ snow: .35, fog: .3, clear: .05 }),
    crickets: by({ clear: .35 }),
    fire: room === 'study' ? .6 : 0,
    typing: room === 'desk' && working ? .5 : 0,
    muffle: windowed ? 5200 : 700,
  }
}

/** Seconds between a flash and its thunder: deterministic per flash so replays agree. */
export function thunderDelay(slot: number) {
  const n = Math.imul(slot + 7, 2654435761) >>> 0
  return .35 + (n % 1000) / 1000 * 2.1
}
