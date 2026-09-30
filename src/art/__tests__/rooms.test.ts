import { describe, expect, it } from 'vitest'
import { animateRoom, DESK_OBJECTS, EMPTY_ROOM, objectAt, OBJECTS, renderRoom } from '../rooms'
import type { RoomKind } from '../rooms'
import { HEIGHT, INK, Pixels, UNIT, WIDTH } from '../pixels'
import { silhouette } from '../outline'
import { PORTRAITS } from '../portraitData'
import type { BakedSprite } from '../sprite'

// Fixed palette, the two embedded portraits, every baked sprite, and a few literal highlights.
const baked = Object.values(import.meta.glob<Record<string, BakedSprite>>('../baked/*.ts', { eager: true })).flatMap(m => Object.values(m))
const PALETTE_BOUND = Object.keys(INK).length + PORTRAITS.count.palette.length + PORTRAITS.editor.palette.length + baked.reduce((n, s) => n + s.palette.length, 0) + 4
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
      expect(new Set(one.data).size).toBeLessThanOrEqual(PALETTE_BOUND)
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
    expect(new Set(b.data).size).toBeLessThanOrEqual(PALETTE_BOUND * 6)
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
        for (let dy = -8; dy <= 8 && !hit; dy++) for (let dx = -8; dx <= 8 && !hit; dx++) hit = objectAt(tags, WIDTH, cx + dx, cy + dy) === o.key
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
  const screens: [number, number, number][] = [[1273, 643, 1], [1273, 643, 1.25], [1809, 1750, 1], [1440, 900, 2], [1920, 1080, 1], [2560, 1080, 1]]
  it.each(screens)('%s×%s @%s: integer square pixels, canvas covers the viewport, core mostly visible', (w, h, dpr) => {
    const { scale, frame, canvas, stage } = pixelLayout(w, h, dpr, false)
    expect(Number.isInteger(scale)).toBe(true)
    expect(canvas.width * dpr).toBeCloseTo(frame.width * scale)
    expect(stage.width * dpr).toBeCloseTo(WIDTH * scale)
    if (frame.width < WIDTH * 2) expect(canvas.width).toBeGreaterThanOrEqual(w - 1 / dpr)
    if (frame.height < HEIGHT * 2) expect(canvas.height).toBeGreaterThanOrEqual(h - 1 / dpr)
    expect(Math.min(w, stage.left + stage.width) - Math.max(0, stage.left)).toBeGreaterThanOrEqual(stage.width * .88 - 1)
    expect(Math.min(h, stage.top + stage.height) - Math.max(0, stage.top)).toBeGreaterThanOrEqual(stage.height * .88 - 1)
    expect(stage.left - canvas.left).toBeCloseTo(frame.ox * scale / dpr)
  })
  it('fills a 1080p screen with exactly the core room', () => {
    expect(pixelLayout(1920, 1080, 1, false)).toMatchObject({ scale: 2, frame: { width: 960, height: 540, ox: 0, oy: 0 } })
    expect(pixelLayout(1920, 1080, 1.0000000298, false).scale).toBe(2)
  })
  it('shows the full width of the room on a phone', () => {
    const { stage } = pixelLayout(390, 670, 3, true)
    expect(stage.left).toBeGreaterThanOrEqual(0)
    expect(stage.left + stage.width).toBeLessThanOrEqual(390)
  })
})

describe('extended frames', () => {
  const tall = { width: 900, height: 880, ox: -30, oy: 238 }
  it('fills every pixel of a larger canvas and keeps the core unchanged in place', () => {
    for (const kind of kinds) {
      const big = renderRoom(kind, EMPTY_ROOM, true, tall), core = renderRoom(kind)
      const bg = new Pixels(1, 1).data[0]
      let empty = 0
      for (const v of big.data) if (v === bg) empty++
      expect(empty / big.data.length, kind).toBeLessThan(.02)
      // A pixel well inside the core, away from anything that depends on the frame.
      const [x, y] = [470, 300]
      if (kind !== 'desk') expect(big.data[(y + tall.oy) * tall.width + x + tall.ox]).toBe(core.data[y * WIDTH + x])
    }
  })
  it('grows the editor window upward on tall screens, and animates on any frame', () => {
    const base = renderRoom('desk', { ...EMPTY_ROOM, hasCat: true }, false, tall)
    const frame = animateRoom(base, 'desk', EMPTY_ROOM, 3, 'storm')
    expect(frame.width).toBe(tall.width)
    expect(frame.height).toBe(tall.height)
    expect(objectAt(base.tags!, tall.width, Math.round(231 * UNIT + tall.ox), Math.round(178 * UNIT + tall.oy))).toBe('pipeline')
  })
})
