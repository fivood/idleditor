import { describe, expect, it } from 'vitest'
import { animateRoom, DESK_OBJECTS, EMPTY_ROOM, objectAt, OBJECTS, renderRoom } from '../rooms'
import type { RoomKind } from '../rooms'
import { HEIGHT, INK, Pixels, UNIT, WIDTH } from '../pixels'
import { silhouette } from '../outline'
import { pixelLayout } from '../layout'

const kinds: RoomKind[] = ['desk', 'office', 'shelf', 'authors', 'study', 'stats']
function checksum(data: Uint32Array) { return data.reduce((hash, value) => Math.imul(hash ^ value, 16777619) >>> 0, 2166136261) }
function differences(a: Pixels, b: Pixels) {
  const result: [number, number][] = []
  for (let i = 0; i < a.data.length; i++) if (a.data[i] !== b.data[i]) result.push([Math.floor(i % WIDTH / UNIT), Math.floor(i / WIDTH / UNIT)]) // layout-grid coordinates
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

  it('tags every desk object on the pixels that draw it, including ones painted per frame', () => {
    for (const live of [true, false]) {
      const tags = renderRoom('desk', { ...EMPTY_ROOM, submitted: 5, hasCat: true }, live).tags!
      for (const o of DESK_OBJECTS) {
        const cx = Math.floor((o.x + o.w / 2) * UNIT), cy = Math.floor((o.y + o.h / 2) * UNIT)
        let hit = false
        for (let dy = -8; dy <= 8 && !hit; dy++) for (let dx = -8; dx <= 8 && !hit; dx++) hit = objectAt(tags, cx + dx, cy + dy) === o.key
        expect(hit, o.key).toBe(true)
      }
    }
  })

  it('every tagged object in every room has a closed outline', () => {
    for (const kind of kinds) {
      const tags = renderRoom(kind, { ...EMPTY_ROOM, hasCat: true, books: 5, authors: 2, departments: 2 }).tags!
      const ids = new Set(tags); ids.delete(0)
      expect(ids.size).toBeGreaterThan(0)
      for (const id of ids) {
        const { inner, outer } = silhouette(tags, id)
        expect(inner.length, `${kind} ${OBJECTS[id - 1]}`).toBeGreaterThan(20)
        expect(outer.length).toBeGreaterThan(0)
        for (const i of inner) expect(tags[i]).not.toBe(id)
      }
    }
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
    // Either fills the viewport cropping at most 15%, or shows the whole room.
    const covers = layout.width >= 1273 && layout.height >= 643
    const contains = layout.width <= 1273 && layout.height <= 643
    expect(covers || contains).toBe(true)
    if (covers) expect(Math.min(1273 / layout.width, 643 / layout.height)).toBeGreaterThanOrEqual(.85)
    expect(layout.left * dpr).toBeCloseTo(Math.round(layout.left * dpr))
  })
  it('fills a 1080p screen exactly', () => {
    expect(pixelLayout(1920, 1080, 1, false)).toMatchObject({ scale: 2, width: 1920, height: 1080 })
  })
  it('does not crop away the room on a narrow high-DPI phone', () => {
    const layout = pixelLayout(390, 670, 3, true)
    expect(layout.width).toBeLessThanOrEqual(390)
    expect(layout.height).toBeLessThan(670)
    expect(layout.scale).toBe(1)
  })
  it('ignores floating point noise around a device scale boundary', () => {
    expect(pixelLayout(1920, 1080, 1.0000000298, false).scale).toBe(2)
  })
})
