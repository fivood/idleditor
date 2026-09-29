import { describe, expect, it } from 'vitest'
import { animateRoom, EMPTY_ROOM, renderRoom } from '../rooms'
import { lightning, WINDOWS } from '../weather'
import { WIDTH } from '../pixels'
import { DAYS_PER_SPELL, weatherFor } from '@/core/weather'
import type { Weather } from '@/core/weather'

const kinds: Weather[] = ['clear', 'drizzle', 'storm', 'snow', 'fog', 'wind']
const checksum = (d: Uint32Array) => d.reduce((h, v) => Math.imul(h ^ v, 16777619) >>> 0, 2166136261)

describe('weather calendar', () => {
  it('is deterministic and constant within a spell', () => {
    for (let d = 0; d < 200; d++) expect(weatherFor(d)).toBe(weatherFor(d))
    expect(weatherFor(12 * DAYS_PER_SPELL)).toBe(weatherFor(12 * DAYS_PER_SPELL + DAYS_PER_SPELL - 1))
  })
  it('follows the seasons over several years', () => {
    const seen = new Map<Weather, number>()
    for (let spell = 0; spell < 720 / DAYS_PER_SPELL * 6; spell++) {
      const day = spell * DAYS_PER_SPELL, month = Math.floor(day % 720 / 60), w = weatherFor(day)
      seen.set(w, (seen.get(w) ?? 0) + 1)
      if (w === 'snow') expect([0, 1, 9, 10, 11]).toContain(month)
      if (w === 'storm') expect([3, 4, 5, 6, 7, 8, 9]).toContain(month)
    }
    expect([...seen.keys()].sort()).toEqual([...kinds].sort())
  })
})

describe('window weather', () => {
  const base = renderRoom('office', EMPTY_ROOM, false)
  it('each weather looks different and never touches the cached layer', () => {
    const before = checksum(base.data)
    const frames = kinds.map(k => checksum(animateRoom(base, 'office', EMPTY_ROOM, 30, k).data))
    expect(new Set(frames).size).toBe(kinds.length)
    expect(checksum(base.data)).toBe(before)
  })
  it('stays inside the window (and its sill)', () => {
    const [wx, wy, ww, wh] = WINDOWS.office!
    const clear = animateRoom(base, 'office', EMPTY_ROOM, 30, 'clear')
    for (const kind of ['drizzle', 'snow', 'fog', 'wind'] as Weather[]) {
      const other = animateRoom(base, 'office', EMPTY_ROOM, 30, kind)
      for (let i = 0; i < clear.data.length; i++) {
        if (clear.data[i] === other.data[i]) continue
        const x = i % WIDTH, y = Math.floor(i / WIDTH)
        expect(x >= wx - 6 && x <= wx + ww + 6 && y >= wy && y <= wy + wh + 3).toBe(true)
      }
    }
  })
  it('animates over time, and lightning flashes the whole room', () => {
    expect(checksum(animateRoom(base, 'office', EMPTY_ROOM, 0, 'drizzle').data)).not.toBe(checksum(animateRoom(base, 'office', EMPTY_ROOM, 5, 'drizzle').data))
    let strike = 0, calm = 0
    while (lightning(strike).level !== 2) strike++
    while (lightning(calm).level !== 0) calm++
    const lit = animateRoom(base, 'office', EMPTY_ROOM, strike, 'storm'), dark = animateRoom(base, 'office', EMPTY_ROOM, calm, 'storm')
    const outside = (0 * WIDTH) + 5 // a wall pixel far from the window
    expect(lit.data[outside]).not.toBe(dark.data[outside])
  })
  it('rooms without windows ignore weather', () => {
    const authors = renderRoom('authors', EMPTY_ROOM, false)
    expect(checksum(animateRoom(authors, 'authors', EMPTY_ROOM, 3, 'storm').data)).toBe(checksum(animateRoom(authors, 'authors', EMPTY_ROOM, 3, 'clear').data))
  })
})
