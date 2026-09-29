import { Pixels } from './pixels'
import { HAND_COVERS } from './handCovers'
import type { CoverStyle } from '@/core/types'

/**
 * Procedural 40x56 book covers in the house style: a few flat colour blocks,
 * one big subject picked from the title, one small unrelated prop, scrawled title.
 * Deterministic per (title, genre); no image assets.
 */
export const COVER_W = 40
export const COVER_H = 56

interface Palette { bg: string; bg2: string; main: string; accent: string; ink: string; light: string; shade?: string }
const PALETTES: Palette[] = [
  { bg: '#7d9a3c', bg2: '#a6b96a', main: '#f4f0e6', accent: '#e88fa0', ink: '#22301a', light: '#ffffff' },
  { bg: '#a83a3e', bg2: '#c45a58', main: '#e9c9a8', accent: '#3a1418', ink: '#1a0a0c', light: '#f7e6d2' },
  { bg: '#1f6fb5', bg2: '#3d8fd0', main: '#f2e9d8', accent: '#e2a13a', ink: '#0d2238', light: '#ffffff' },
  { bg: '#7a3f34', bg2: '#96574a', main: '#e7a99a', accent: '#f2d7b6', ink: '#2a1210', light: '#fbeee0' },
  { bg: '#d9d6d2', bg2: '#bdb9b3', main: '#5b5651', accent: '#d9a441', ink: '#1f1c1a', light: '#ffffff' },
  { bg: '#0c0a0d', bg2: '#221a24', main: '#b83232', accent: '#e8c66a', ink: '#050405', light: '#f0e6d8', shade: '#5a4660' },
  { bg: '#5b9bc4', bg2: '#9cc7de', main: '#f4f1ea', accent: '#e9a15a', ink: '#20374a', light: '#ffffff' },
  { bg: '#efe6d2', bg2: '#d8c9a6', main: '#3a2f2a', accent: '#c2503c', ink: '#1a1512', light: '#fffaf0' },
  { bg: '#5b4a8b', bg2: '#7d6db0', main: '#f0d9a0', accent: '#e8836b', ink: '#1c1533', light: '#fff4d6' },
  { bg: '#2f6f6a', bg2: '#4d8f88', main: '#f3e5c0', accent: '#d9604a', ink: '#0f2422', light: '#fff8e6' },
  { bg: '#d6a63a', bg2: '#e8c46a', main: '#3b2a1e', accent: '#b8412f', ink: '#241a10', light: '#fff3d0' },
  { bg: '#1b2540', bg2: '#2b3a63', main: '#f2d16b', accent: '#8fd0c8', ink: '#0a0f1c', light: '#f4f1e6', shade: '#56689a' },
]
const GENRE_PALETTES: Record<string, number[]> = {
  'sci-fi': [11, 2, 6, 8, 5], mystery: [7, 4, 3, 10], suspense: [5, 1, 4, 11],
  'social-science': [4, 7, 6, 9, 10], literary: [7, 3, 8, 9, 2], hybrid: [9, 0, 6, 10, 8],
  fantasy: [8, 11, 9, 0, 5], 'light-novel': [2, 6, 0, 8, 10, 1],
}

// ──── tiny helpers ────
function hash(text: string) {
  let h = 2166136261
  for (const ch of text) h = Math.imul(h ^ (ch.codePointAt(0) ?? 0), 16777619)
  return h >>> 0
}
function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}
function luminance(hex: string) {
  const v = parseInt(hex.slice(1), 16)
  return (0.3 * (v >>> 16) + 0.59 * ((v >>> 8) & 255) + 0.11 * (v & 255)) / 255
}

/** A motif is authored in a 24x24 box and scaled by `s`. */
interface Ctx { p: Pixels; x: number; y: number; s: number; m: string; a: string; k: string; l: string; b: string }
type Pt = [number, number]
const R = (c: Ctx, x: number, y: number, w: number, h: number, col: string) => c.p.rect(c.x + x * c.s, c.y + y * c.s, Math.max(1, w * c.s), Math.max(1, h * c.s), col)
const E = (c: Ctx, x: number, y: number, rx: number, ry: number, col: string) => c.p.ellipse(c.x + x * c.s, c.y + y * c.s, Math.max(.6, rx * c.s), Math.max(.6, ry * c.s), col)
const P = (c: Ctx, pts: Pt[], col: string) => c.p.polygon(pts.map(([x, y]) => [c.x + x * c.s, c.y + y * c.s] as const), col)
const L = (c: Ctx, x0: number, y0: number, x1: number, y1: number, col: string) => c.p.line(c.x + x0 * c.s, c.y + y0 * c.s, c.x + x1 * c.s, c.y + y1 * c.s, col)
const flip = (pts: Pt[]): Pt[] => pts.map(([x, y]) => [24 - x, y])

const MOTIFS: Record<string, (c: Ctx) => void> = {
  cup(c) {
    L(c, 9, 2, 10, 6, c.l); L(c, 10, 6, 9, 8, c.l); L(c, 14, 1, 15, 5, c.l); L(c, 15, 5, 14, 8, c.l)
    R(c, 3, 20, 18, 2, c.a); R(c, 5, 9, 12, 11, c.m)
    E(c, 19, 14, 3.5, 3.5, c.m); E(c, 19, 14, 1.6, 1.6, c.b)
    R(c, 5, 9, 12, 2, c.k); R(c, 7, 12, 2, 6, c.l)
  },
  cat(c) {
    P(c, [[4, 9], [5, 1], [11, 6]], c.m); P(c, flip([[4, 9], [5, 1], [11, 6]]), c.m)
    P(c, [[6, 6], [6, 3], [9, 6]], c.a); P(c, flip([[6, 6], [6, 3], [9, 6]]), c.a)
    E(c, 12, 14, 9, 8, c.m)
    R(c, 6, 12, 4, 1, c.k); R(c, 14, 12, 4, 1, c.k); R(c, 11, 15, 2, 2, c.a)
    L(c, 1, 14, 7, 15, c.k); L(c, 1, 18, 7, 16, c.k); L(c, 23, 14, 17, 15, c.k); L(c, 23, 18, 17, 16, c.k)
  },
  dog(c) {
    P(c, [[3, 12], [4, 1], [10, 7]], c.k); P(c, flip([[3, 12], [4, 1], [10, 7]]), c.k)
    E(c, 12, 13, 9, 9, c.k); E(c, 12, 16, 6, 6, c.m)
    R(c, 6, 10, 4, 2, c.m); R(c, 14, 10, 4, 2, c.m); R(c, 8, 11, 2, 1, c.k); R(c, 14, 11, 2, 1, c.k)
    R(c, 10, 15, 4, 3, c.k); R(c, 11, 19, 2, 3, c.a)
  },
  bird(c) {
    E(c, 11, 14, 8, 5, c.k); E(c, 19, 8, 3.5, 3.5, c.k)
    P(c, [[21, 7], [24, 9], [21, 10]], c.a); P(c, [[4, 12], [0, 3], [11, 10]], c.k); P(c, [[4, 14], [0, 19], [8, 17]], c.k)
    dot(c, 19, 7, c.m); L(c, 10, 19, 10, 23, c.a); L(c, 14, 19, 14, 23, c.a)
  },
  bat(c) {
    const wing: Pt[] = [[10, 10], [0, 3], [3, 11], [1, 18], [6, 14], [10, 20]]
    P(c, wing, c.m); P(c, flip(wing), c.m)
    E(c, 12, 13, 3, 6, c.k); P(c, [[9, 9], [9, 3], [12, 8]], c.k); P(c, [[15, 9], [15, 3], [12, 8]], c.k)
    R(c, 10, 11, 1, 1, c.a); R(c, 13, 11, 1, 1, c.a)
  },
  drop(c) {
    P(c, [[12, 1], [5, 13], [19, 13]], c.m); E(c, 12, 15, 7.5, 7, c.m); R(c, 8, 14, 2, 5, c.l)
  },
  clock(c) {
    E(c, 4, 3, 3, 3, c.a); E(c, 20, 3, 3, 3, c.a)
    E(c, 12, 13, 10, 10, c.k); E(c, 12, 13, 8, 8, c.l)
    for (const [x, y] of [[12, 6], [12, 20], [5, 13], [19, 13]]) R(c, x, y, 1, 1, c.k)
    L(c, 12, 13, 12, 8, c.k); L(c, 12, 13, 16, 15, c.a); E(c, 12, 13, 1, 1, c.k)
  },
  planet(c) {
    E(c, 12, 12, 7, 7, c.m); R(c, 6, 10, 13, 1, c.a); R(c, 6, 14, 12, 1, c.a)
    for (let t = 0; t < 40; t++) {
      const a = t / 40 * Math.PI * 2, y = 12 + Math.sin(a) * 3.5
      if (Math.sin(a) > 0 || Math.abs(Math.cos(a)) > .8) dot(c, 12 + Math.cos(a) * 11.5, y, c.l)
    }
    dot(c, 2, 3, c.l); dot(c, 21, 19, c.l); dot(c, 19, 3, c.l)
  },
  moon(c) { E(c, 11, 12, 9, 9, c.m); E(c, 16, 10, 8, 8, c.b); dot(c, 20, 4, c.l); dot(c, 3, 19, c.l) },
  book(c) {
    R(c, 3, 3, 18, 18, c.m); R(c, 3, 3, 3, 18, c.k); R(c, 7, 19, 14, 2, c.l)
    R(c, 9, 7, 9, 5, c.a); R(c, 10, 14, 7, 1, c.k); R(c, 10, 16, 5, 1, c.k)
  },
  pen(c) {
    P(c, [[21, 1], [10, 5], [4, 16], [10, 12], [14, 11]], c.m); L(c, 20, 2, 5, 17, c.k)
    L(c, 5, 17, 3, 22, c.k); R(c, 12, 17, 9, 6, c.k); R(c, 12, 17, 9, 1, c.a)
  },
  dagger(c) {
    P(c, [[12, 1], [15, 14], [12, 16], [9, 14]], c.l); L(c, 12, 2, 12, 15, c.m)
    R(c, 6, 15, 12, 2, c.a); R(c, 11, 17, 3, 5, c.k); E(c, 12, 22, 2, 1.5, c.a)
  },
  magnifier(c) {
    E(c, 10, 10, 9, 9, c.k); E(c, 10, 10, 6.5, 6.5, c.l); P(c, [[15, 16], [17, 14], [23, 20], [21, 22]], c.k)
    L(c, 6, 7, 8, 5, c.b); L(c, 6, 9, 9, 6, c.b)
  },
  door(c) {
    E(c, 12, 7, 7, 6, c.k); R(c, 5, 7, 14, 16, c.k); E(c, 12, 7, 5.5, 5, c.m); R(c, 6.5, 7, 11, 15, c.m)
    R(c, 8, 10, 3, 5, c.k); R(c, 13, 10, 3, 5, c.k); E(c, 15.5, 17, 1.2, 1.2, c.a); P(c, [[6.5, 22], [17.5, 22], [22, 24], [3, 24]], c.a)
  },
  tower(c) {
    P(c, [[6, 8], [12, 0], [18, 8]], c.k); R(c, 8, 7, 8, 16, c.m)
    R(c, 11, 10, 2, 3, c.k); R(c, 11, 16, 2, 3, c.k); L(c, 8, 13, 15, 13, c.a); L(c, 8, 20, 15, 20, c.a)
  },
  castle(c) {
    R(c, 2, 9, 5, 14, c.m); R(c, 17, 9, 5, 14, c.m); R(c, 7, 14, 10, 9, c.m); R(c, 9, 4, 6, 10, c.m)
    for (const x of [2, 4, 6, 17, 19, 21]) R(c, x, 7, 1, 2, c.m)
    for (const x of [9, 11, 13]) R(c, x, 2, 1, 2, c.m)
    R(c, 11, 18, 2, 5, c.k); R(c, 11, 7, 2, 3, c.k); P(c, [[12, 2], [12, 0], [16, 1]], c.a)
  },
  key(c) {
    E(c, 6, 8, 5, 5, c.a); E(c, 6, 8, 2.5, 2.5, c.b); R(c, 10, 7, 12, 3, c.a); R(c, 17, 10, 2, 4, c.a); R(c, 21, 10, 2, 3, c.a)
  },
  ghost(c) {
    E(c, 12, 10, 8, 8, c.m); R(c, 4, 10, 16, 11, c.m)
    for (const x of [7, 12, 17]) E(c, x, 21, 2.6, 2.4, c.m)
    R(c, 4, 22, 16, 1, c.b)
    E(c, 9, 10, 1.4, 2, c.k); E(c, 15, 10, 1.4, 2, c.k); E(c, 12, 15, 2, 2.5, c.k)
  },
  hat(c) {
    E(c, 12, 19, 11, 3, c.k); P(c, [[13, 1], [7, 19], [17, 19]], c.k); R(c, 8, 15, 9, 2, c.a); R(c, 11, 14.5, 3, 3, c.l)
    dot(c, 5, 5, c.l); dot(c, 20, 9, c.l)
  },
  robot(c) {
    L(c, 12, 6, 12, 1, c.k); E(c, 12, 1.5, 2, 2, c.a)
    R(c, 4, 6, 16, 14, c.m); R(c, 2, 10, 2, 6, c.k); R(c, 20, 10, 2, 6, c.k)
    R(c, 7, 10, 4, 4, c.k); R(c, 14, 10, 4, 4, c.k); R(c, 8, 11, 2, 2, c.a); R(c, 15, 11, 2, 2, c.a); R(c, 8, 16, 9, 2, c.k)
  },
  coin(c) {
    E(c, 12, 12, 10.5, 10.5, c.k); E(c, 12, 12, 8.5, 8.5, c.a)
    R(c, 11, 6, 2, 12, c.k); R(c, 8, 10, 8, 1.5, c.k); R(c, 8, 13, 8, 1.5, c.k); L(c, 8, 6, 12, 11, c.k); L(c, 16, 6, 12, 11, c.k)
  },
  cookie(c) {
    E(c, 12, 21, 11, 2.5, c.l); E(c, 12, 12, 10, 10, c.a)
    for (const [x, y] of [[8, 9], [15, 8], [11, 14], [17, 15], [7, 16]]) E(c, x, y, 1.4, 1.4, c.k)
    E(c, 21, 6, 4, 4, c.b)
  },
  tree(c) {
    R(c, 10, 13, 4, 10, c.k); E(c, 12, 8, 8, 7, c.m); E(c, 6.5, 12, 5, 4, c.m); E(c, 17.5, 12, 5, 4, c.m)
    for (const [x, y] of [[8, 7], [15, 9], [11, 12]]) R(c, x, y, 2, 2, c.a)
  },
  mountain(c) {
    P(c, [[0, 23], [8, 7], [14, 16], [18, 10], [24, 23]], c.m); P(c, [[8, 7], [5.5, 12], [8, 11], [10, 12]], c.l); E(c, 19, 4, 3, 3, c.a)
  },
  wave(c) {
    for (let row = 0; row < 3; row++) for (let x = 0; x < 24; x++) {
      const y = 8 + row * 5 + Math.round(Math.sin(x / 2.6 + row) * 2)
      R(c, x, y, 1, 3, [c.m, c.l, c.a][row])
    }
  },
  flame(c) {
    P(c, [[12, 0], [18, 9], [21, 16], [12, 23], [3, 16], [6, 8], [9, 12]], c.a)
    P(c, [[12, 8], [16, 15], [12, 22], [8, 16]], c.m); P(c, [[12, 14], [14, 18], [12, 22], [10, 18]], c.l)
  },
  rain(c) {
    E(c, 8, 9, 5, 5, c.m); E(c, 15, 7, 6, 6, c.m); E(c, 19, 11, 4, 4, c.m); R(c, 5, 10, 18, 5, c.m)
    for (const [x, y] of [[6, 18], [11, 20], [16, 18], [20, 21], [8, 22]]) L(c, x, y, x - 2, y + 3, c.a)
  },
  eye(c) {
    P(c, [[0, 12], [12, 3], [24, 12], [12, 21]], c.m); E(c, 12, 12, 5, 5, c.a); E(c, 12, 12, 2.5, 2.5, c.k); dot(c, 10, 10, c.l)
  },
  emoji(c) {
    E(c, 12, 12, 10, 10, c.a); E(c, 8, 10, 1.5, 2, c.k); E(c, 16, 10, 1.5, 2, c.k)
    R(c, 8, 16, 8, 1.5, c.k); R(c, 6, 14, 2, 2, c.m); R(c, 16, 14, 2, 2, c.m)
  },
  question(c) {
    R(c, 7, 2, 10, 3, c.m); R(c, 15, 4, 3, 6, c.m); R(c, 11, 9, 7, 3, c.m); R(c, 10, 12, 3, 4, c.m); R(c, 10, 18, 3, 3, c.m)
  },
  crown(c) {
    P(c, [[2, 19], [2, 7], [7, 12], [12, 4], [17, 12], [22, 7], [22, 19]], c.a); R(c, 2, 17, 20, 3, c.m)
    for (const x of [6, 11, 16]) R(c, x, 18, 2, 1, c.k)
  },
  skull(c) {
    E(c, 12, 10, 8, 8, c.m); R(c, 8, 15, 8, 7, c.m)
    E(c, 8.5, 10, 2.4, 2.6, c.k); E(c, 15.5, 10, 2.4, 2.6, c.k); P(c, [[12, 13], [10.5, 16], [13.5, 16]], c.k)
    for (const x of [9.5, 12, 14.5]) R(c, x, 18, 1, 4, c.k)
  },
  coffin(c) {
    P(c, [[8, 1], [16, 1], [20, 8], [16, 23], [8, 23], [4, 8]], c.m); R(c, 11, 6, 2, 11, c.a); R(c, 8.5, 9, 7, 2, c.a)
  },
  boat(c) {
    P(c, [[2, 16], [22, 16], [18, 22], [6, 22]], c.m); R(c, 11, 3, 1, 13, c.k); P(c, [[12, 3], [12, 14], [20, 14]], c.l); P(c, [[11, 3], [11, 7], [6, 5]], c.a)
    R(c, 0, 22, 24, 2, c.a)
  },
  train(c) {
    R(c, 2, 5, 20, 14, c.m); R(c, 2, 5, 20, 2, c.k)
    for (const x of [4, 10, 16]) R(c, x, 9, 4, 4, c.l)
    R(c, 2, 15, 20, 1, c.a); E(c, 7, 20, 2.5, 2.5, c.k); E(c, 17, 20, 2.5, 2.5, c.k)
  },
  fish(c) {
    E(c, 10, 12, 9, 6, c.m); P(c, [[17, 12], [24, 5], [24, 19]], c.m); E(c, 5, 11, 1.2, 1.2, c.k); L(c, 8, 8, 8, 16, c.a); L(c, 12, 7, 12, 17, c.a)
  },
  suitcase(c) {
    R(c, 9, 4, 6, 5, c.k); R(c, 10.5, 5.5, 3, 3, c.b); R(c, 3, 8, 18, 14, c.m); R(c, 7, 8, 2, 14, c.k); R(c, 15, 8, 2, 14, c.k); E(c, 12, 15, 2, 2, c.a)
  },
  // ── props for the unrelated-object gag ──
  sock(c) {
    P(c, [[8, 1], [16, 1], [16, 14], [22, 19], [20, 23], [8, 23]], c.l); R(c, 8, 4, 8, 2, c.a); R(c, 8, 8, 8, 2, c.a); R(c, 8, 1, 8, 2, c.k)
  },
  duck(c) {
    E(c, 10, 16, 9, 6, c.a); E(c, 16, 8, 4.5, 4.5, c.a); P(c, [[19, 8], [24, 9], [19, 11]], c.m); dot(c, 17, 7, c.k); E(c, 7, 15, 4, 3, c.m)
  },
  banana(c) {
    P(c, [[3, 5], [8, 15], [15, 19], [21, 17], [22, 20], [14, 23], [5, 19], [0, 8]], c.a); R(c, 2, 3, 3, 3, c.k)
  },
  glasses(c) {
    E(c, 6, 13, 5, 5, c.k); E(c, 18, 13, 5, 5, c.k); E(c, 6, 13, 3.4, 3.4, c.l); E(c, 18, 13, 3.4, 3.4, c.l); R(c, 10, 12, 4, 1.5, c.k)
    L(c, 1, 12, 0, 8, c.k); L(c, 23, 12, 24, 8, c.k)
  },
  umbrella(c) {
    P(c, [[0, 12], [3, 5], [12, 1], [21, 5], [24, 12], [18, 10], [12, 12], [6, 10]], c.a); R(c, 11.5, 12, 1.5, 9, c.k); L(c, 11.5, 21, 8, 23, c.k)
  },
}
function dot(c: Ctx, x: number, y: number, col: string) { R(c, x, y, 1, 1, col) }

/** [motif, keywords...] — first hit in the title becomes the big subject. */
const KEYWORDS: [string, string][] = [
  ['cup', '茶 咖啡 杯 饮 酒 汤 壶'], ['cat', '猫 喵'], ['dog', '狗 哈士奇 犬 狼'], ['bird', '鸟 鹰 鸽 鸥 乌鸦 雀 鹅'],
  ['bat', '蝙蝠 吸血鬼 伯爵 血族'], ['drop', '血 泪'], ['clock', '钟 钟表 996 加班 日程'],
  ['planet', '星 宇宙 太空 火星 银河 光年 行星 黑洞 外星'], ['moon', '月 月亮'],
  ['book', '书 图书馆 阅读 词典 册 目录'], ['pen', '笔 写作 作家 墨'],
  ['dagger', '银 刀 剑 匕首 十字'], ['magnifier', '案 侦探 谋杀 福尔摩斯 密 证 疑 查'],
  ['door', '门 窗 房间'], ['castle', '城堡 庄园 宫 王国'], ['tower', '塔 楼 馆 院'],
  ['key', '钥匙 锁 链 密码'], ['ghost', '鬼 幽灵 灵 幻影'], ['hat', '魔法 巫师 女巫 法术'],
  ['robot', '机 AI 算法 代码 数据 量子 电脑 系统'], ['coin', '钱 版税 资本 预算 利润 经济 价'],
  ['cookie', '饼干 面包 蛋糕 食 菜 饭 味'], ['tree', '树 林 森 花 草 植 园'],
  ['mountain', '山 峰 岭'], ['wave', '海 湖 河 水 岛'], ['flame', '火 炎 烧 烛'], ['rain', '雨 雪 云 雾'],
  ['eye', '眼 看 视 目'], ['emoji', '表情 笑 脸 面具'], ['question', '谜 何 为什么 谁 名 姓名'],
  ['crown', '王 皇 冠 权力 帝'], ['skull', '骨 死 亡 尸 墓'], ['coffin', '棺 葬 殡'],
  ['boat', '船 航 舰 渡'], ['train', '车 列车 站 路'], ['fish', '鱼 鲸 虾'], ['suitcase', '旅行 行李 出差 假期'],
]
const GENRE_MOTIFS: Record<string, string[]> = {
  'sci-fi': ['planet', 'robot', 'clock', 'eye', 'moon'], mystery: ['magnifier', 'door', 'key', 'cup', 'skull'],
  suspense: ['dagger', 'ghost', 'bat', 'coffin', 'eye'], 'social-science': ['book', 'coin', 'tree', 'clock', 'cup'],
  literary: ['book', 'pen', 'cat', 'tower', 'tree'], hybrid: ['robot', 'boat', 'emoji', 'cup', 'suitcase'],
  fantasy: ['castle', 'hat', 'flame', 'crown', 'mountain'], 'light-novel': ['hat', 'door', 'cat', 'emoji', 'train'],
}
const PROPS = ['sock', 'duck', 'banana', 'glasses', 'umbrella', 'cookie', 'cup', 'fish', 'key', 'clock']

function pickMotifs(title: string, genre: string, rand: () => number) {
  const hits: { motif: string; at: number }[] = []
  for (const [motif, words] of KEYWORDS) {
    let at = Infinity
    for (const w of words.split(' ')) { const i = title.indexOf(w); if (i >= 0 && i < at) at = i }
    if (at < Infinity) hits.push({ motif, at })
  }
  hits.sort((a, b) => a.at - b.at)
  const pool = GENRE_MOTIFS[genre] ?? GENRE_MOTIFS['sci-fi']
  const main = hits[0]?.motif ?? pool[Math.floor(rand() * pool.length)]
  // The gag: a second keyword if there is one, otherwise something that has no business being here.
  const related = hits.find(h => h.motif !== main)?.motif
  const prop = related ?? PROPS.filter(x => x !== main)[Math.floor(rand() * (PROPS.length - 1))]
  return { main, prop, related: related !== undefined }
}

// ──── background, motifs, scrawled title ────
function background(p: Pixels, pal: Palette, style: number, rand: () => number) {
  p.rect(0, 0, COVER_W, COVER_H, pal.bg)
  if (style === 0) p.polygon([[0, 40], [40, 12], [40, 26], [0, 54]], pal.bg2)
  else if (style === 1) { p.rect(0, 30, COVER_W, 26, pal.bg2); p.rect(0, 30, COVER_W, 1, pal.light) }
  else if (style === 2) for (let x = 3; x < COVER_W; x += 9) p.rect(x, 0, 4, COVER_H, pal.bg2)
  else if (style === 3) { p.ellipse(20, 20, 18, 18, pal.bg2); p.ellipse(20, 20, 13, 13, pal.bg) }
  else if (style === 4) { p.rect(0, 0, COVER_W, COVER_H, pal.bg2); p.rect(3, 3, COVER_W - 6, COVER_H - 6, pal.bg) }
  else for (let i = 0; i < 26; i++) p.dot(Math.floor(rand() * COVER_W), Math.floor(rand() * 40), pal.bg2)
}

/** Quasi-glyphs: every character gets a stable, hand-scrawled stroke set. */
function scrawl(p: Pixels, title: string, color: string, top: number) {
  const chars = [...title].filter(ch => ch.trim() && !'，。：；、！？·—-,.:;!?'.includes(ch)).slice(0, 18)
  if (!chars.length) return
  const cw = chars.length <= 14 ? 4 : 3, per = Math.floor(36 / (cw + 1)), lines = Math.ceil(chars.length / per)
  const size = Math.ceil(chars.length / lines)
  chars.forEach((ch, i) => {
    const line = Math.floor(i / size), col = i % size, count = Math.min(size, chars.length - line * size)
    const x = Math.floor((COVER_W - count * (cw + 1) + 1) / 2) + col * (cw + 1), y = top + line * 7
    const code = ch.codePointAt(0) ?? 0
    const bits = (hash(ch) | (1 << code % 3) | (1 << (3 + code % 5))) >>> 0
    if (bits & 1) p.rect(x, y, cw, 1, color)
    if (bits & 2) p.rect(x, y + 2, cw, 1, color)
    if (bits & 4) p.rect(x, y + 4, cw, 1, color)
    if (bits & 8) p.rect(x, y, 1, 3, color)
    if (bits & 16) p.rect(x, y + 2, 1, 3, color)
    if (bits & 32) p.rect(x + cw - 1, y, 1, 3, color)
    if (bits & 64) p.rect(x + cw - 1, y + 2, 1, 3, color)
    if (bits & 128) p.line(x, y, x + cw - 1, y + 4, color)
    if (bits & 256) p.dot(x + 1, y + 1, color)
  })
}

function handCover(art: { palette: string[]; runs: number[] }) {
  const p = new Pixels(COVER_W, COVER_H)
  let pos = 0
  for (let i = 0; i < art.runs.length; i += 2) {
    const color = '#' + art.palette[art.runs[i]]
    for (let left = art.runs[i + 1]; left > 0;) {
      const x = pos % COVER_W, n = Math.min(left, COVER_W - x)
      p.rect(x, Math.floor(pos / COVER_W), n, 1, color)
      pos += n; left -= n
    }
  }
  return p
}

const NAMES: Record<string, string> = {
  cup: '茶杯', cat: '猫', dog: '狗', bird: '鸟', bat: '蝙蝠', drop: '血滴', clock: '闹钟', planet: '行星', moon: '月亮', book: '书',
  pen: '羽毛笔', dagger: '银匕首', magnifier: '放大镜', door: '门', tower: '塔', castle: '城堡', key: '钥匙', ghost: '幽灵', hat: '巫师帽',
  robot: '机器人', coin: '金币', cookie: '饼干', tree: '树', mountain: '山', wave: '海浪', flame: '火焰', rain: '雨云', eye: '眼睛',
  emoji: '表情', question: '问号', crown: '王冠', skull: '骷髅', coffin: '棺材', boat: '帆船', train: '列车', fish: '鱼', suitcase: '行李箱',
  sock: '袜子', duck: '橡皮鸭', banana: '香蕉', glasses: '眼镜', umbrella: '雨伞',
}

interface Plan { pal: Palette; bgStyle: number; band: boolean; main: string; prop: string | null; scale: number; propScale: number; left: boolean; jx: number; jy: number }

function planCover(title: string, genre: string, style: CoverStyle): Plan {
  const rand = rng(hash(genre + '|' + title + (style === 'safe' ? '' : '|' + style)))
  const choices = GENRE_PALETTES[genre] ?? GENRE_PALETTES['sci-fi']
  let idx = choices[Math.floor(rand() * choices.length)]
  let bgStyle = Math.floor(rand() * 6)
  let band = rand() < .55
  // The subject belongs to the book, not to the style: all three versions share it.
  const { main, prop, related } = pickMotifs(title, genre, rng(hash(genre + '|' + title)))
  const jx = Math.round((rand() - .5) * 4), jy = 3 + Math.floor(rand() * 4), left = rand() < .5
  if (style === 'bold') {
    // Loudest palettes: biggest luminance gap between subject and ground.
    const loud = PALETTES.map((p, i) => ({ i, c: Math.abs(luminance(p.main) - luminance(p.bg)) })).sort((x, y) => y.c - x.c).slice(0, 4)
    idx = loud[Math.floor(rand() * loud.length)].i; bgStyle = 3; band = true
  } else if (style === 'weird') idx = Math.floor(rand() * PALETTES.length)
  const scale = style === 'bold' ? 1.55 : style === 'weird' ? 1.1 : 1.3
  return {
    pal: PALETTES[idx], bgStyle, band, main, jx, jy, left, scale,
    prop: style === 'bold' ? null : style === 'safe' ? (related ? prop : null) : (related ? PROPS[Math.floor(rand() * PROPS.length)] : prop),
    propScale: style === 'weird' ? .95 : .55,
  }
}

export function isHandDrawn(title: string) { return title in HAND_COVERS }

export function renderCover(title: string, genre: string, style: CoverStyle = 'safe'): Pixels {
  const hand = HAND_COVERS[title]
  if (hand) return handCover(hand)
  const { pal, bgStyle, band, main, prop, scale: s, propScale, left, jx, jy } = planCover(title, genre, style)
  const p = new Pixels(COVER_W, COVER_H)
  background(p, pal, bgStyle, rng(hash(title)))
  const ctx = (x: number, y: number, sc: number): Ctx => ({ p, x, y, s: sc, m: pal.main, a: pal.accent, k: pal.shade ?? pal.ink, l: pal.light, b: pal.bg })
  const mx = Math.round(20 - 12 * s + jx), my = style === 'bold' ? 1 : jy
  p.ellipse(mx + 12 * s, my + 24 * s + 1, 11, 2, pal.bg2 === pal.bg ? pal.ink : pal.bg2)
  MOTIFS[main](ctx(mx, my, s))
  if (prop) MOTIFS[prop](ctx(left ? 1 : Math.round(40 - 24 * propScale - 1), band ? 25 : 30, propScale))
  if (band) { p.rect(0, 42, COVER_W, 14, pal.ink); p.rect(0, 42, COVER_W, 1, pal.accent) }
  scrawl(p, title, band ? pal.light : (luminance(pal.bg) > .5 ? pal.ink : pal.light), 44)
  return p
}

/** Measurable facts about a cover version, computed from the plan rather than judged. */
export interface CoverTraits { handDrawn: boolean; contrast: '高' | '中' | '低'; warm: boolean; subject: string; prop: string | null }
export function coverTraits(title: string, genre: string, style: CoverStyle): CoverTraits {
  if (isHandDrawn(title)) return { handDrawn: true, contrast: '中', warm: true, subject: '手绘', prop: null }
  const { pal, main, prop } = planCover(title, genre, style)
  const gap = Math.abs(luminance(pal.main) - luminance(pal.bg))
  const v = parseInt(pal.bg.slice(1), 16)
  return { handDrawn: false, contrast: gap > .5 ? '高' : gap > .35 ? '中' : '低', warm: (v >>> 16) > (v & 255), subject: NAMES[main], prop: prop ? NAMES[prop] : null }
}

const urls = new Map<string, string>()
/** Browser-only: PNG data URL for <img>, cached per title. */
export function coverDataUrl(title: string, genre: string, style: CoverStyle = 'safe') {
  const key = genre + '|' + title + '|' + style
  let url = urls.get(key)
  if (url === undefined) {
    const canvas = document.createElement('canvas')
    canvas.width = COVER_W; canvas.height = COVER_H
    const ctx = canvas.getContext('2d')
    url = ctx ? (ctx.putImageData(renderCover(title, genre, style).imageData(), 0, 0), canvas.toDataURL()) : ''
    urls.set(key, url)
  }
  return url
}
