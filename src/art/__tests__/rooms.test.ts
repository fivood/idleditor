import { describe, expect, it } from 'vitest'
import { animateRoom, DESK_OBJECTS, EMPTY_ROOM, renderRoom } from '../rooms'
import type { RoomKind } from '../rooms'
import { HEIGHT, INK, Pixels, WIDTH } from '../pixels'
import { pixelLayout } from '../layout'

const kinds: RoomKind[] = ['desk', 'office', 'shelf', 'authors', 'study', 'stats']
function checksum(data: Uint32Array) { return data.reduce((hash, value) => Math.imul(hash ^ value, 16777619) >>> 0, 2166136261) }
function differences(a: Pixels, b: Pixels) {
  const result: [number, number][] = []
  for (let i = 0; i < a.data.length; i++) if (a.data[i] !== b.data[i]) result.push([i % WIDTH, Math.floor(i / WIDTH)])
  return result
}

describe('procedural rooms', () => {
  it('renders all six distinct scenes deterministically without image loading', () => {
    const hashes = kinds.map(kind => {
      const one = renderRoom(kind), two = renderRoom(kind)
      expect(one.data.length).toBe(WIDTH * HEIGHT)
      expect(checksum(one.data)).toBe(checksum(two.data))
      expect(new Set(one.data).size).toBeGreaterThan(10)
      expect(new Set(one.data).size).toBeLessThanOrEqual(Object.keys(INK).length)
      return checksum(one.data)
    })
    expect(new Set(hashes).size).toBe(6)
  })

  it.each(['submitted', 'hasCat'] as const)('%s only changes the corresponding desk object', field => {
    const base = renderRoom('desk')
    const changed = renderRoom('desk', { ...EMPTY_ROOM, [field]: field === 'submitted' ? 8 : true })
    const diff = differences(base, changed)
    const area = DESK_OBJECTS.find(o => o.key === (field === 'submitted' ? 'submissions' : 'cat'))!
    expect(diff.length).toBeGreaterThan(20)
    expect(diff.every(([x, y]) => x >= area.x && x < area.x + area.w && y >= area.y && y < area.y + area.h)).toBe(true)
  })

  it('adds books and portraits when game progress changes', () => {
    expect(checksum(renderRoom('shelf').data)).not.toBe(checksum(renderRoom('shelf', { ...EMPTY_ROOM, books: 12 }).data))
    expect(checksum(renderRoom('authors').data)).not.toBe(checksum(renderRoom('authors', { ...EMPTY_ROOM, authors: 3 }).data))
    expect(checksum(renderRoom('office').data)).not.toBe(checksum(renderRoom('office', { ...EMPTY_ROOM, departments: 3 }).data))
  })

  it.each(['desk', 'study'] as const)('%s animates without modifying its cached static layer', kind => {
    const state = { ...EMPTY_ROOM, hasCat: true, working: 2 }
    const base = renderRoom(kind, state), original = checksum(base.data)
    const a = animateRoom(base, kind, state, 0), b = animateRoom(base, kind, state, 19)
    expect(checksum(base.data)).toBe(original)
    expect(checksum(a.data)).not.toBe(checksum(b.data))
    expect(new Set(b.data).size).toBeLessThanOrEqual(Object.keys(INK).length * 5)
  })

  it('does not animate the typewriter when the publishing queue is empty', () => {
    const area = DESK_OBJECTS.find(o => o.key === 'pipeline')!
    const idle = renderRoom('desk'), busyState = { ...EMPTY_ROOM, working: 1 }, busy = renderRoom('desk', busyState)
    const inside = ([x, y]: [number, number]) => x >= area.x && x < area.x + area.w && y >= area.y && y < area.y + area.h
    expect(differences(animateRoom(idle, 'desk', EMPTY_ROOM, 0), animateRoom(idle, 'desk', EMPTY_ROOM, 17)).some(inside)).toBe(false)
    expect(differences(animateRoom(busy, 'desk', busyState, 0), animateRoom(busy, 'desk', busyState, 17)).some(inside)).toBe(true)
  })

  it('clips primitives instead of wrapping pixels to the next row', () => {
    const p = new Pixels(4, 3)
    const background = p.data[0]
    p.rect(-2, -1, 4, 3, INK.gold)
    expect(p.data[0]).not.toBe(background)
    expect(p.data[2]).toBe(background)
    expect(p.data[8]).toBe(background)
    const original = p.data.slice()
    p.rect(5, 0, 2, 2, INK.cream)
    expect(p.data).toEqual(original)
  })
})

describe('physical pixel layout', () => {
  it.each([1, 1.25, 1.5, 2])('preserves square integer physical pixels at DPR %s', dpr => {
    const layout = pixelLayout(1273, 643, dpr, false)
    expect(layout.width * dpr / WIDTH).toBeCloseTo(layout.scale)
    expect(layout.height * dpr / HEIGHT).toBeCloseTo(layout.scale)
    expect(Number.isInteger(layout.scale)).toBe(true)
    expect(layout.width).toBeGreaterThanOrEqual(1273)
    expect(layout.height).toBeGreaterThanOrEqual(643)
    expect(layout.left * dpr).toBeCloseTo(Math.round(layout.left * dpr))
  })
  it('does not crop away the room on a narrow high-DPI phone', () => {
    const layout = pixelLayout(390, 670, 3, true)
    expect(layout.width).toBeLessThanOrEqual(390)
    expect(layout.height).toBeLessThan(670)
    expect(layout.scale).toBe(2)
  })
  it('ignores floating point noise around a device scale boundary', () => {
    expect(pixelLayout(1440, 810, 1.0000000298, false).scale).toBe(3)
  })
})
