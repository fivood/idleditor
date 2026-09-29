import { HEIGHT as FINE_H, INK as C, noise, Pixels, UNIT, WIDTH as FINE_W } from './pixels'
import { drawWeather, lightning, WINDOWS, windowBars } from './weather'
import {
  bats, brickWall, brush, candelabra, candelabraFlames, castlePainting, clockPendulum, clothDesk, deskBars, deskFloor, deskWindow,
  inkAndQuill, inTray, letterRack, openJournal, pottedPlant, refPortrait, sleepingCat, teacupFine, teaSteam, typewriterFine,
  wallCandle, wallCandleFlame, wallClock,
} from './editorRoom'
import type { Weather } from '@/core/weather'

/** Layout grid: rooms are composed on 480×270 and rasterised at UNIT× so shapes and portraits get finer detail. */
const WIDTH = FINE_W / UNIT, HEIGHT = FINE_H / UNIT

export type RoomKind = 'desk' | 'office' | 'shelf' | 'authors' | 'study' | 'stats'
export interface RoomState { submitted: number; working: number; hasCat: boolean; books: number; authors: number; departments: number }
export const EMPTY_ROOM: RoomState = { submitted: 0, working: 0, hasCat: false, books: 0, authors: 0, departments: 0 }
export const DESK_OBJECTS = [
  { key: 'solicit', label: '征稿信箱', x: 26, y: 106, w: 50, h: 49 },
  { key: 'submissions', label: '待审稿件', x: 116, y: 175, w: 49, h: 22 },
  { key: 'pipeline', label: '编辑流水线', x: 198, y: 157, w: 66, h: 42 },
  { key: 'log', label: '出版日志', x: 274, y: 183, w: 52, h: 24 },
  { key: 'dream', label: '梦境创作', x: 364, y: 182, w: 24, h: 17 },
  { key: 'cat', label: '黑猫', x: 350, y: 122, w: 50, h: 26 },
] as const

/** Clickable things in the rooms. A pixel's tag is the index + 1, so outlines and clicks follow real shapes. */
export const OBJECTS = [
  'solicit', 'submissions', 'pipeline', 'log', 'dream', 'cat',
  'dept0', 'dept1', 'dept2', 'dept3', 'tearoom', 'settings',
  'shelfLeft', 'shelfLadder', 'shelfBack', 'shelfRight', 'display', 'table',
  'portraits', 'roundtable', 'bookcase', 'armchair', 'hearth',
  'cabinet', 'logs', 'ledger', 'awards',
] as const
export type ObjectKey = typeof OBJECTS[number]
function tagged(p: Pixels, key: ObjectKey, draw: () => void) {
  const prev = p.tag
  p.tag = OBJECTS.indexOf(key) + 1
  draw()
  p.tag = prev
}
/** Object under native pixel (x, y), if any. */
export function objectAt(tags: Uint8Array, x: number, y: number): ObjectKey | null {
  if (x < 0 || y < 0 || x >= FINE_W || y >= FINE_H) return null
  const t = tags[y * FINE_W + x]
  return t ? OBJECTS[t - 1] : null
}

const BOOKS = [C.red, C.teal, C.bookBlue, C.plum, C.grain, C.leaf, C.paperShade]

function bookRow(p: Pixels, x: number, y: number, width: number, seed: number, count = 100) {
  let cursor = x
  for (let i = 0; i < count && cursor < x + width - 5; i++) {
    const w = 3 + Math.floor(noise(i, 1, seed) * 5)
    const h = 13 + Math.floor(noise(i, 2, seed) * 13)
    const col = BOOKS[Math.floor(noise(i, 3, seed) * BOOKS.length)]
    p.rect(cursor, y - h, w, h, col)
    p.rect(cursor, y - h, 1, h, C.shadow)
    p.rect(cursor + 1, y - h + 3, w - 2, 1, C.copper)
    if (w > 4) p.rect(cursor + 2, y - 5, w - 3, 1, C.paperShade)
    if (w > 5) {
      p.rect(cursor + 2, y - h + 7, w - 4, 5, C.paperShade)
      p.rect(cursor + 3, y - h + 8, 1, 3, col)
    }
    p.fine(() => {
      const X = cursor * UNIT, Y = (y - h) * UNIT, W = w * UNIT, H = h * UNIT
      p.rect(X + W - 1, Y, 1, H, C.black)
      p.rect(X + 2, Y + 6, W - 3, 1, C.gold)
      p.rect(X + 2, Y + H - 4, W - 3, 1, C.copper)
      if (noise(i, 4, seed) < .5) p.rect(X + 2, Y + 1, W - 4, 1, C.paperShade)
    })
    cursor += w + 1
  }
}

function shelf(p: Pixels, x: number, y: number, w: number, h: number, seed: number, count = 100) {
  p.rect(x - 3, y - 3, w + 6, h + 7, C.black)
  p.rect(x, y, w, h, C.darkWood)
  p.rect(x + 3, y + 3, w - 6, h - 6, C.shadow)
  const rows = Math.floor(h / 34)
  for (let i = 0; i < rows; i++) {
    const bottom = y + (i + 1) * 34 - 3
    bookRow(p, x + 5, bottom, w - 10, seed + i * 7, Math.max(0, count - i * Math.floor(w / 7)))
    p.rect(x, bottom, w, 4, C.warmWood)
    p.rect(x, bottom, w, 1, C.copper)
    p.rect(x + 2, bottom + 4, w - 4, 2, C.black)
  }
  p.rect(x, y, 3, h, C.grain); p.rect(x + w - 3, y, 3, h, C.wood)
  p.rect(x - 3, y - 5, w + 6, 4, C.grain)
  p.rect(x - 3, y - 5, w + 6, 1, C.copper)
}

function plant(p: Pixels, x: number, y: number, length: number, seed: number) {
  for (let k = 0; k < length; k += 4) {
    const sway = Math.round(Math.sin(k / 12 + seed) * 3)
    p.line(x + sway, y + k, x + sway + 1, y + k + 4, C.green)
    const side = k % 8 ? 1 : -1
    p.polygon([[x + sway, y + k], [x + sway + side * 7, y + k - 2], [x + sway + side * 5, y + k + 3]], C.leaf)
    p.line(x + sway + side, y + k, x + sway + side * 4, y + k, C.leafLight)
  }
}

function rug(p: Pixels, x: number, y: number, w: number, h: number) {
  p.rect(x, y, w, h, C.redDark)
  for (let i = 1; i < 7; i += 2) p.frame(x + i, y + i, w - i * 2, h - i * 2, i === 3 ? C.copper : C.rose)
  for (let yy = y + 10; yy < y + h - 8; yy += 9) for (let xx = x + 14; xx < x + w - 12; xx += 16) {
    p.polygon([[xx, yy - 3], [xx + 4, yy], [xx, yy + 3], [xx - 4, yy]], C.warmWood)
    p.dot(xx, yy, C.honey)
  }
}

function shell(p: Pixels) {
  p.rect(0, 0, WIDTH, HEIGHT, C.black)
  // Striped, damask-dotted wallpaper in cool indigo so warm wood and lamplight read against it.
  p.rect(0, 14, WIDTH, 186, C.wall)
  for (let x = 8; x < 472; x += 24) {
    p.rect(x, 14, 12, 154, C.wallLight)
    for (let y = 26; y < 166; y += 14) { p.dot(x + 5, y, C.wallDot); p.dot(x + 6, y, C.wallDot); p.dot(x + 5, y + 1, C.wallDot); p.dot(x + 6, y - 1, C.wallDot) }
  }
  // Crown moulding with dentils.
  p.rect(0, 0, WIDTH, 13, C.black)
  p.rect(0, 13, WIDTH, 3, C.warmWood); p.rect(0, 13, WIDTH, 1, C.honey)
  for (let x = 0; x < WIDTH; x += 6) p.rect(x, 16, 3, 3, C.darkWood)
  p.rect(0, 19, WIDTH, 1, C.black)
  for (let x = 40; x < WIDTH; x += 120) { p.rect(x, 0, 8, 13, C.darkWood); p.rect(x, 0, 1, 13, C.copper) }
  // Wall pilasters frame the room.
  for (const x of [0, 472]) { p.rect(x, 14, 8, 186, C.darkWood); p.rect(x + (x ? 0 : 7), 14, 1, 186, C.copper) }
  // Wainscot: chair rail over inset panels, then a heavy skirting board.
  p.rect(8, 166, 464, 3, C.warmWood); p.rect(8, 166, 464, 1, C.honey); p.rect(8, 169, 464, 1, C.black)
  p.rect(8, 170, 464, 27, C.wood)
  for (let x = 14; x < 466; x += 46) {
    p.rect(x, 174, 38, 19, C.darkWood)
    p.rect(x, 174, 38, 1, C.black); p.rect(x, 174, 1, 19, C.black)
    p.rect(x + 1, 192, 37, 1, C.warmWood); p.rect(x + 37, 175, 1, 18, C.warmWood)
  }
  p.rect(8, 197, 464, 4, C.black); p.rect(8, 197, 464, 1, C.copper)
  // Floor: long boards, staggered butt joints and a little grain.
  p.rect(0, 201, WIDTH, 69, C.wood)
  for (let row = 0, y = 201; y < HEIGHT; row++, y += 8) {
    p.rect(0, y, WIDTH, 1, C.black)
    p.rect(0, y + 1, WIDTH, 1, C.warmWood)
    if (row % 2) p.rect(0, y + 2, WIDTH, 6, C.darkWood)
    for (let x = (row * 47) % 120; x < WIDTH; x += 120) p.rect(x, y + 1, 1, 7, C.black)
    for (let k = 0; k < 6; k++) p.rect(Math.floor(noise(k, row, 3) * WIDTH), y + 3 + k % 3 * 2, 5 + k % 4 * 3, 1, C.grain)
  }
}

function cityWindow(p: Pixels, x: number, y: number, w: number, h: number) {
  p.rect(x - 7, y - 7, w + 14, h + 18, C.black)
  p.rect(x - 5, y - 5, w + 10, h + 12, C.grain)
  p.rect(x - 2, y - 2, w + 4, h + 4, C.copper)
  p.rect(x, y, w, h, C.sky)
  p.rect(x, y + Math.floor(h * .35), w, Math.ceil(h * .65), C.blue)
  for (let xx = 0; xx < w; xx++) {
    const cloudY = y + 25 + Math.round(Math.sin(xx / 23) * 5 + Math.sin(xx / 7) * 2)
    for (let yy = cloudY; yy < cloudY + 9; yy++) if (noise(xx, yy, 8) < .35) p.dot(x + xx, yy, C.blue)
  }
  for (let i = 0; i < 80; i++) {
    const xx = x + Math.floor(noise(i, 1) * w), yy = y + Math.floor(noise(i, 2) * h * .6)
    if (i % 7 === 0) p.dot(xx, yy, C.blueLight)
  }
  p.ellipse(x + w - 29, y + 21, 8, 8, C.blueLight)
  p.ellipse(x + w - 29, y + 20, 6, 6, C.moon)
  p.ellipse(x + w - 32, y + 17, 3, 2, C.steel)
  // Three skyline depths, mansard roofs and sparse inhabited windows.
  for (let layer = 0; layer < 3; layer++) {
    const step = layer ? 29 : 16
    for (let xx = x; xx < x + w; xx += step) {
      const top = y + Math.floor(h * (.45 + layer * .16)) - Math.floor(noise(xx, layer) * 17)
      const ww = Math.min(step - 1, x + w - xx)
      p.rect(xx, top + 5, ww, y + h - top - 5, layer === 0 ? C.haze : layer === 1 ? C.stone : C.roof)
      p.polygon([[xx, top + 6], [xx + 5, top], [xx + ww - 4, top], [xx + ww, top + 6]], layer === 2 ? C.black : C.roof)
      p.rect(xx + 7, top - 3, 3, 5, C.roof)
      for (let wy = top + 10; wy < y + h - 3; wy += 9) for (let wx = xx + 4; wx < xx + ww - 3; wx += 7) {
        const lit = noise(wx, wy, layer) > .69
        p.rect(wx, wy, 2, 3, lit ? C.honey : layer === 2 ? C.stone : C.blueLight)
        if (lit) p.dot(wx, wy + 1, C.cream)
      }
      p.line(xx, top + 6, xx + ww - 1, top + 6, C.blueLight)
      if (layer > 0) {
        for (let yy = top + 8; yy < y + h; yy += 4) p.rect(xx + ww - 2, yy, 1, 2, C.stoneLight)
        for (let k = 0; k < 3; k++) p.line(xx + 3 + k * 5, top + 5, xx + 5 + k * 5, top + 2, C.stone)
      }
    }
  }
  // Publisher's neighbourhood clock tower, designed on this pixel grid.
  const tx = x + Math.floor(w * .62), ty = y + Math.floor(h * .26)
  p.rect(tx - 6, ty + 15, 13, h - (ty - y) - 15, C.roof)
  p.rect(tx - 4, ty + 14, 3, h - (ty - y) - 14, C.stone)
  p.polygon([[tx - 9, ty + 17], [tx, ty], [tx + 9, ty + 17]], C.black)
  p.line(tx, ty - 6, tx, ty, C.roof)
  p.ellipse(tx, ty + 24, 4, 4, C.honey)
  p.ellipse(tx, ty + 24, 3, 3, C.warmWood)
  p.line(tx, ty + 21, tx, ty + 24, C.cream); p.line(tx, ty + 24, tx + 2, ty + 25, C.cream)
  windowBars(p, x, y, w, h)
  p.rect(x - 7, y + h + 3, w + 14, 5, C.warmWood)
  p.rect(x - 7, y + h + 3, w + 14, 1, C.honey)
  p.line(x - 4, y - 4, x + w + 3, y - 4, C.paperShade)
}

function candle(p: Pixels, x: number, y: number) {
  p.ellipse(x, y + 14, 8, 2, C.black)
  p.rect(x - 6, y + 11, 12, 2, C.copper)
  p.rect(x - 2, y, 5, 11, C.paperShade); p.rect(x - 2, y, 2, 10, C.cream)
  p.rect(x, y - 5, 2, 4, C.honey); p.dot(x, y - 6, C.gold); p.dot(x, y - 2, C.cream)
}

function desk(p: Pixels, x: number, y: number, w: number) {
  p.rect(x + 6, y + 5, w - 12, 43, C.black)
  for (const xx of [x + 7, x + w - 65]) {
    p.rect(xx, y + 8, 58, 37, C.darkWood)
    p.frame(xx + 3, y + 11, 51, 13, C.grain)
    p.frame(xx + 3, y + 27, 51, 14, C.warmWood)
    p.rect(xx + 25, y + 16, 8, 3, C.black); p.rect(xx + 26, y + 16, 6, 1, C.honey)
    p.rect(xx + 25, y + 32, 8, 3, C.black); p.rect(xx + 26, y + 32, 6, 1, C.copper)
  }
  p.polygon([[x + 13, y - 13], [x + w - 13, y - 13], [x + w, y + 4], [x, y + 4]], C.warmWood)
  for (let yy = y - 10; yy < y + 4; yy += 3) p.line(x + 13, yy, x + w - 13, yy, yy % 2 ? C.grain : C.wood)
  for (let k = 0; k < 55; k++) {
    const xx = x + 14 + Math.floor(noise(k, 9) * (w - 34)), yy = y - 10 + Math.floor(noise(k, 10) * 12)
    p.rect(xx, yy, 2 + Math.floor(noise(k, 11) * 7), 1, k % 3 ? C.warmWood : C.copper)
  }
  p.rect(x, y + 4, w, 5, C.darkWood); p.rect(x, y + 3, w, 2, C.copper)
  for (const xx of [x + 4, x + w - 9]) { p.rect(xx, y + 9, 5, 45, C.warmWood); p.rect(xx, y + 9, 1, 43, C.copper) }
}

function journal(p: Pixels, x: number, y: number) {
  p.polygon([[x + 6, y], [x + 24, y + 2], [x + 41, y], [x + 48, y + 15], [x + 24, y + 18], [x, y + 15]], C.redDark)
  p.polygon([[x + 6, y], [x + 23, y + 2], [x + 23, y + 15], [x + 3, y + 12]], C.paper)
  p.polygon([[x + 25, y + 2], [x + 41, y], [x + 45, y + 12], [x + 25, y + 15]], C.cream)
  for (let i = 0; i < 4; i++) { p.line(x + 9, y + 3 + i * 2, x + 20, y + 4 + i * 2, C.paperShade); p.line(x + 28, y + 4 + i * 2, x + 39, y + 3 + i * 2, C.paperShade) }
  p.line(x + 24, y + 2, x + 24, y + 17, C.rose)
}

function lamp(p: Pixels, x: number, y: number) {
  p.ellipse(x + 8, y + 37, 12, 3, C.black); p.ellipse(x + 8, y + 35, 10, 2, C.copper)
  p.rect(x + 7, y + 2, 3, 32, C.copper); p.rect(x + 7, y + 4, 1, 27, C.gold)
  p.line(x + 8, y + 3, x - 2, y - 6, C.honey)
  p.polygon([[x - 18, y - 9], [x + 3, y - 9], [x + 9, y + 3], [x - 24, y + 3]], C.greenDark)
  p.polygon([[x - 17, y - 8], [x + 1, y - 8], [x + 6, y], [x - 21, y]], C.green)
  p.line(x - 17, y - 7, x, y - 7, C.leafLight)
  p.rect(x - 22, y + 3, 29, 2, C.honey); p.rect(x - 15, y + 4, 16, 1, C.cream)
}

function teacup(p: Pixels, x: number, y: number) {
  p.ellipse(x + 8, y + 14, 12, 2, C.paperShade)
  p.ellipse(x + 8, y + 13, 10, 2, C.cream)
  p.frame(x + 14, y + 3, 6, 6, C.paper)
  p.rect(x + 1, y + 2, 14, 8, C.paper); p.rect(x + 3, y + 10, 10, 2, C.paperShade)
  p.rect(x + 2, y + 2, 12, 2, C.redDark); p.rect(x + 3, y, 10, 2, C.cream)
  p.rect(x + 5, y + 6, 3, 3, C.rose)
}

function typewriter(p: Pixels, x: number, y: number, working: boolean, tick = 0) {
  p.ellipse(x + 29, y + 36, 33, 4, C.black)
  p.rect(x + 13, y + 1, 34, 19, C.paperShade)
  p.rect(x + 14, y, 32, 16, C.paper)
  for (let i = 0; i < 4; i++) p.rect(x + 18, y + 4 + i * 3, 18 - i * 3, 1, C.paperShade)
  const shift = working ? Math.floor(tick / 6) % 4 : 0
  p.rect(x + 3 + shift, y + 15, 54, 4, C.black)
  p.rect(x + 4 + shift, y + 15, 51, 1, C.steel)
  p.rect(x, y + 15, 3, 6, C.slate); p.rect(x + 58, y + 15, 3, 6, C.metal)
  p.polygon([[x + 7, y + 19], [x + 52, y + 19], [x + 60, y + 34], [x, y + 34]], C.slate)
  p.polygon([[x + 8, y + 20], [x + 51, y + 20], [x + 55, y + 31], [x + 4, y + 31]], C.black)
  for (let row = 0; row < 3; row++) for (let k = 0; k < 9; k++) {
    p.rect(x + 8 + k * 5 - row, y + 23 + row * 3, 3, 2, working && (tick + row) % 9 === k ? C.copper : C.paper)
  }
  p.rect(x + 17, y + 33, 28, 2, C.metal); p.rect(x, y + 35, 60, 3, C.shadow)
  p.rect(x + 26, y + 20, 9, 1, C.copper)
  p.line(x + 9, y + 19, x + 19, y + 22, C.metal)
  p.line(x + 42, y + 22, x + 51, y + 19, C.metal)
  p.rect(x + 27, y + 17, 8, 2, C.red)
}

/** The editor's room: see editorRoom.ts. Positions are on the layout grid. */
const DESK_WINDOW = WINDOWS.desk!
function deskRoom(p: Pixels, state: RoomState, includeLiveObjects: boolean) {
  brickWall(p, 0, 12, WIDTH, 188)
  // Ceiling beam and a dark frieze.
  const top = brush(p, 0, 0)
  top.r(0, 0, FINE_W, 24, C.black); top.r(0, 24, FINE_W, 6, C.darkWood); top.r(0, 24, FINE_W, 1, C.wood); top.r(0, 30, FINE_W, 2, C.black)
  for (let x = 60; x < FINE_W; x += 220) { top.r(x, 0, 18, 24, C.darkWood); top.r(x, 0, 1, 24, C.wood) }
  deskFloor(p, 200)
  deskWindow(p, ...DESK_WINDOW)
  castlePainting(p, 30, 32)
  refPortrait(p, 84, 32, 'count'); refPortrait(p, 84, 72, 'editor')
  wallClock(p, 352, 30)
  wallCandle(p)
  shelf(p, 406, 28, 70, 88, 11)
  shelf(p, 344, 150, 132, 58, 27)
  tagged(p, 'solicit', () => letterRack(p, 26, 112))
  pottedPlant(p, 4, 170)
  clothDesk(p)
  inkAndQuill(p, 172, 168)
  candelabra(p)
  tagged(p, 'log', () => openJournal(p))
  tagged(p, 'dream', () => teacupFine(p))
  // Painted every frame by animateRoom; here they only need to claim their pixels.
  p.ghost = !includeLiveObjects
  tagged(p, 'submissions', () => inTray(p, state.submitted))
  tagged(p, 'pipeline', () => typewriterFine(p, state.working > 0))
  if (state.hasCat) tagged(p, 'cat', () => sleepingCat(p, 0))
  p.ghost = false
}

const lighting = new Map<RoomKind, Uint8Array>()
/** Painted faces take one flat light level: dithering across them reads as a screen door. */
const FLAT_LIGHT: Partial<Record<RoomKind, [number, number, number, number][]>> = {
  desk: [[79, 27, 32, 76]],
  study: [[207, 41, 70, 32]],
  authors: [0, 1, 2, 3].map(i => [49 + i * 108, 51, 62, 73]),
}
function lightMask(room: RoomKind) {
  const cached = lighting.get(room)
  if (cached) return cached
  const mask = new Uint8Array(FINE_W * FINE_H)
  const source = room === 'desk' ? [349, 152] : room === 'study' ? [240, 127 + HEARTH_DY] : room === 'shelf' ? [260, 181] : [240, 186]
  const win = WINDOWS[room], flat = FLAT_LIGHT[room] ?? []
  const light = (x: number, y: number) => {
    const pool = Math.max(0, 1 - Math.hypot((x - source[0]) / 135, (y - source[1]) / 110))
    const edge = Math.max(0, (Math.abs(x - 240) - 125) / 180) + Math.max(0, (y - 226) / 140)
    if (room === 'desk') {
      // Candlelit: dark brick, a warm pool round the candelabra, a smaller one at the wall candle.
      const wall = Math.max(0, 1 - Math.hypot((x - 396) / 60, (y - 112) / 50))
      return Math.max(0, Math.min(4, 1.35 + Math.max(0, 1 - Math.hypot((x - source[0]) / 135, (y - source[1]) / 100)) * 1.9 + wall * .9 - edge * 1.2))
    }
    return Math.max(0, Math.min(4, 2 + pool * 1.5 - edge * 1.1))
  }
  const inside = (r: readonly number[], lx: number, ly: number) => lx >= r[0] && lx < r[0] + r[2] && ly >= r[1] && ly < r[1] + r[3]
  for (let fy = 0; fy < FINE_H; fy++) for (let fx = 0; fx < FINE_W; fx++) {
    const x = (fx + .5) / UNIT - .5, y = (fy + .5) / UNIT - .5
    let value = light(x, y)
    const lx = Math.floor(fx / UNIT), ly = Math.floor(fy / UNIT)
    const face = flat.find(r => inside(r, lx, ly))
    if (face) value = Math.round(light(face[0] + face[2] / 2, face[1] + face[3] / 2))
    if (win && inside(win, lx, ly)) value = 2
    const level = Math.floor(value), fraction = value - level
    // 2x2 ordered dither at native resolution: gradients read as texture, not bands.
    // The candlelit room keeps surfaces clean: dither only in a narrow band where levels meet.
    const t = room === 'desk' ? (fraction < .38 ? 0 : fraction > .62 ? 1 : (fraction - .38) / .24) : fraction
    mask[fy * FINE_W + fx] = Math.min(4, level + (t > [.125, .625, .875, .375][(fy & 1) * 2 + (fx & 1)] ? 1 : 0))
  }
  lighting.set(room, mask)
  return mask
}

function gilt(p: Pixels, x: number, y: number, w: number, h: number) {
  p.rect(x - 4, y - 4, w + 8, 4, C.black); p.rect(x - 4, y + h, w + 8, 4, C.black)
  p.rect(x - 4, y, 4, h, C.black); p.rect(x + w, y, 4, h, C.black)
  p.rect(x - 3, y - 3, w + 6, 2, C.copper); p.rect(x - 3, y + h + 1, w + 6, 2, C.warmWood)
  p.rect(x - 3, y - 1, 2, h + 2, C.copper); p.rect(x + w + 1, y - 1, 2, h + 2, C.warmWood)
  p.rect(x - 3, y - 3, w + 6, 1, C.gold); p.rect(x - 1, y - 1, w + 2, 1, C.honey)
}

const COATS = [C.red, C.teal, C.bookBlue, C.plum, C.green, C.slate]
const HAIR = [C.shadow, C.warmWood, C.silver, C.black]
function portrait(p: Pixels, x: number, y: number, w: number, h: number, seed: number, occupied = true, plate = false) {
  const cx = x + Math.floor(w / 2)
  p.rect(x, y, w, h, [C.redDark, C.greenDark, C.roof, C.redDark][seed % 4])
  p.rect(x, y + Math.floor(h * .7), w, h - Math.floor(h * .7), [C.black, C.shadow][seed % 2]) // painted floor of the backdrop
  const hr = Math.max(4, Math.round(h * .16)), ry = hr + 1, hy = y + Math.round(h * .43)
  const sw = Math.round(w * .38), top = y + Math.round(h * .68)
  const coat = COATS[seed % COATS.length], hair = HAIR[seed % HAIR.length]
  if (!occupied) {
    p.ellipse(cx, hy, hr, ry, C.shadow); p.polygon([[cx - sw, y + h - 1], [cx - sw, top + 8], [cx - sw + 4, top + 3], [cx - 8, top - 1], [cx + 8, top - 1], [cx + sw - 4, top + 3], [cx + sw, top + 8], [cx + sw, y + h - 1]], C.shadow)
  } else {
    const style = seed % 4
    if (style === 1) { p.ellipse(cx, hy, hr + 3, ry + 3, hair); p.rect(cx - hr - 3, hy, 3, ry + 6, hair); p.rect(cx + hr + 1, hy, 3, ry + 6, hair) }
    const bot = y + h - 1, shoulder = Math.min(top + 8, bot)
    p.polygon([[cx - sw, bot], [cx - sw, shoulder], [cx - sw + 4, top + 3], [cx - 8, top - 1], [cx + 8, top - 1], [cx + sw - 4, top + 3], [cx + sw, shoulder], [cx + sw, bot]], coat)
    p.polygon([[cx - sw, bot], [cx - sw, shoulder], [cx - sw + 4, top + 3], [cx - 8, top - 1], [cx - 4, top], [cx - sw + 6, bot]], coat === C.red ? C.rose : coat === C.bookBlue ? C.blueLight : C.metal)
    p.rect(cx - 2, hy + ry - 2, 5, 6, C.skinShade)
    p.polygon([[cx - 5, top + 2], [cx + 5, top + 2], [cx, top + Math.round(h * .22)]], C.paper)
    p.polygon([[cx - 5, top + 2], [cx - 1, top + 2], [cx - 5, top + 8]], coat)
    p.polygon([[cx + 5, top + 2], [cx + 1, top + 2], [cx + 5, top + 8]], coat)
    p.ellipse(cx, hy, hr, ry, C.skin)
    p.rect(cx + hr - 1, hy - 2, 1, ry, C.skinShade)
    if (style === 3) { p.ellipse(cx, hy - ry + 2, hr, 2, hair); p.polygon([[cx - hr + 1, hy + 1], [cx + hr - 1, hy + 1], [cx, hy + ry + 4]], C.silver) }
    else { p.ellipse(cx, hy - ry + 3, hr + 1, 4, hair); p.rect(cx - hr, hy - 3, 2, 4, hair) }
    if (style === 2) p.ellipse(cx, hy - ry - 1, 3, 3, hair)
    const ex = Math.max(2, Math.round(hr * .5)), ey = hy - 1
    p.fine(() => {
      for (const side of [-1, 1]) {
        const X = (cx + side * ex) * UNIT, Y = ey * UNIT
        p.rect(X - 2, Y - 1, 5, 1, C.lash); p.rect(X - 1, Y, 3, 2, C.navy); p.rect(X, Y, 1, 1, C.bow)
        p.rect(X - 1, Y - 4, 4, 1, hair)
      }
      p.rect(cx * UNIT, (hy + 1) * UNIT, 1, 2, C.skinShade)
    })
    if (seed % 2 === 0) { p.frame(cx - ex - 2, ey - 2, 5, 4, C.gold); p.frame(cx + ex - 2, ey - 2, 5, 4, C.gold); p.dot(cx, ey - 1, C.gold) }
    p.fine(() => { p.rect(cx * UNIT - 2, (hy + ry - 4) * UNIT, 5, 1, C.rose); p.rect(cx * UNIT - 1, (hy + ry - 4) * UNIT + 1, 3, 1, C.skinShade) })
  }
  gilt(p, x, y, w, h)
  if (plate && occupied) { p.rect(cx - 11, y + h + 7, 22, 6, C.black); p.rect(cx - 10, y + h + 8, 20, 4, C.honey); p.rect(cx - 7, y + h + 9, 14, 1, C.warmWood); p.rect(cx - 5, y + h + 11, 10, 1, C.warmWood) }
}


function sconce(p: Pixels, x: number, y: number) {
  p.glow(x, y - 4, 17, 15, C.warmWood, .95)
  p.rect(x - 3, y + 7, 7, 3, C.copper); p.rect(x - 1, y + 4, 3, 4, C.copper)
  p.rect(x - 2, y - 3, 5, 8, C.paperShade); p.rect(x - 2, y - 3, 2, 8, C.cream)
  p.rect(x - 4, y + 5, 9, 1, C.honey)
  p.rect(x, y - 8, 2, 5, C.honey); p.dot(x, y - 9, C.gold); p.dot(x, y - 5, C.cream)
}

/** Front-facing wing chair. */
function armchair(p: Pixels, x: number, y: number, w: number, body: string, dark: string, hi: string) {
  const cx = x + Math.floor(w / 2), inner = w - 28
  p.ellipse(cx, y + 66, Math.floor(w / 2) + 3, 4, C.black)
  for (const fx of [x + 4, x + w - 9]) p.rect(fx, y + 56, 5, 10, C.black)
  p.rect(x + 8, y + 12, w - 16, 44, dark)
  p.ellipse(cx, y + 12, Math.floor((w - 16) / 2), 12, dark)
  p.rect(x + 14, y + 10, inner, 44, body)
  p.ellipse(cx, y + 11, Math.floor(inner / 2), 9, body)
  for (let k = 0; k < 3; k++) p.rect(x + 20 + k * Math.floor(inner / 3), y + 14, 1, 34, dark)
  p.dot(cx, y + 20, C.gold); p.dot(cx - 9, y + 30, C.gold); p.dot(cx + 9, y + 30, C.gold)
  for (const ax of [x, x + w - 15]) {
    p.rect(ax, y + 30, 15, 30, dark)
    p.rect(ax + 1, y + 27, 13, 7, body); p.rect(ax + 1, y + 27, 13, 1, hi)
    p.rect(ax + 3, y + 36, 9, 20, body)
  }
  p.rect(x + 12, y + 44, w - 24, 14, hi)
  p.rect(x + 12, y + 44, w - 24, 2, body)
  p.rect(x + 12, y + 57, w - 24, 2, dark)
}

function fireplace(p: Pixels, x: number, y: number) {
  p.rect(x - 7, y - 6, 98, 5, C.copper); p.rect(x - 7, y - 6, 98, 1, C.gold)
  p.rect(x - 3, y, 90, 85, C.warmWood)
  p.rect(x + 11, y + 20, 62, 60, C.black)
  p.polygon([[x + 11, y + 23], [x + 23, y + 11], [x + 62, y + 11], [x + 73, y + 23]], C.black)
  for (let yy = y; yy < y + 85; yy += 9) {
    p.line(x - 2, yy, x + 9, yy, C.grain); p.line(x + 74, yy, x + 85, yy, C.grain)
    const off = (yy - y) % 18 ? 5 : 0
    for (let xx = x - 3 + off; xx < x + 9; xx += 10) p.rect(xx, yy, 1, 9, C.wood)
    for (let xx = x + 75 + off; xx < x + 87; xx += 10) p.rect(xx, yy, 1, 9, C.wood)
  }
  p.rect(x + 8, y + 17, 68, 3, C.wood); p.rect(x + 8, y + 17, 68, 1, C.grain)
  p.rect(x - 10, y + 81, 104, 6, C.darkWood); p.rect(x - 10, y + 81, 104, 1, C.copper)
  // Candlesticks on the mantel.
  candle(p, x, y - 20); candle(p, x + 86, y - 20)
  hearthLogs(p)
}

/** The study hearth sits lower so two portraits fit between the ceiling and the mantel. */
const HEARTH_Y = 81, HEARTH_DY = HEARTH_Y - 57

function hearthLogs(p: Pixels) {
  const d = HEARTH_DY
  p.rect(212, 135 + d, 58, 3, C.black)
  p.polygon([[213, 131 + d], [258, 124 + d], [260, 128 + d], [215, 136 + d]], C.darkWood)
  p.line(214, 131 + d, 258, 125 + d, C.grain)
  p.polygon([[224, 125 + d], [268, 132 + d], [266, 136 + d], [222, 130 + d]], C.warmWood)
  p.line(225, 126 + d, 267, 133 + d, C.copper)
  for (const [ex, ey] of [[221, 134], [236, 132], [246, 134], [255, 131], [262, 135]]) { p.rect(ex, ey + d, 3, 1, C.fire); p.dot(ex + 1, ey + d - 1, C.ember) }
}

function flames(p: Pixels, tick: number) {
  const f = Math.floor(tick / 3), base = 132 + HEARTH_DY
  for (let k = 0; k < 6; k++) {
    const bx = 220 + k * 9 + Math.round(noise(k, f, 3) * 2)
    const h = 13 + Math.floor(noise(k, f, 7) * (k === 2 || k === 3 ? 27 : 15))
    const sway = Math.round((noise(k, f, 11) - .5) * 7)
    p.polygon([[bx - 6, base], [bx - 3, base - h * .55], [bx + sway, base - h], [bx + 3, base - h * .5], [bx + 6, base]], C.ember)
    p.polygon([[bx - 4, base], [bx - 2, base - h * .5], [bx + sway, base - h * .74], [bx + 2, base - h * .45], [bx + 4, base]], C.fire)
    p.polygon([[bx - 2, base], [bx + sway * .6, base - h * .46], [bx + 2, base]], C.gold)
    p.rect(bx - 1, base - 5, 2, 5, C.cream)
  }
  hearthLogs(p)
  for (let i = 0; i < 4; i++) {
    const age = (f * 5 + i * 7) % 24
    p.dot(226 + i * 12 + Math.round(Math.sin(age / 3 + i) * 3), base - 24 - age, age < 14 ? C.fire : C.ember)
  }
}

/** Deep reading hall: stone vault, distant stacks, side window and shared table. */
function libraryRoom(p: Pixels, state: RoomState) {
  p.rect(0, 0, WIDTH, HEIGHT, C.shadow)
  p.polygon([[0, 0], [110, 24], [110, 168], [0, 235]], C.darkWood)
  p.rect(110, 24, 334, 145, C.wood)
  p.polygon([[444, 24], [480, 0], [480, 238], [444, 169]], C.darkWood)
  p.texture(110, 26, 330, 138, C.darkWood, .1, 81)
  // The vaulted ceiling replaces the editor's low attic beams.
  for (const inset of [0, 7, 15]) {
    p.line(0, 32 + inset, 110, 24 + inset, C.grain)
    p.line(110, 24 + inset, 178, 8 + inset, C.grain)
    p.line(178, 8 + inset, 366, 8 + inset, C.grain)
    p.line(366, 8 + inset, 444, 24 + inset, C.grain)
    p.line(444, 24 + inset, 480, 34 + inset, C.grain)
  }
  p.polygon([[110, 168], [444, 168], [480, 235], [480, 270], [0, 270], [0, 235]], C.warmWood)
  for (let x = -240; x < 820; x += 66) {
    p.line(245 + (x - 245) * .18, 168, x, 270, C.darkWood)
  }
  for (const y of [174, 184, 198, 218, 246, 269]) {
    p.line(0, y, WIDTH, y, C.darkWood)
    p.line(0, y + 1, WIDTH, y + 1, C.grain)
  }
  // Narrow aisle leads past the table into the far archive.
  p.polygon([[211, 163], [267, 163], [204, 270], [106, 270]], C.redDark)
  p.line(214, 168, 113, 270, C.copper); p.line(264, 168, 198, 270, C.copper)
  for (let y = 176; y < 270; y += 16) {
    const x = 239 - Math.round((y - 163) * .8)
    p.polygon([[x, y - 3], [x + 5, y], [x, y + 3], [x - 5, y]], C.grain)
  }
  // Arched passage with smaller stacks behind it establishes depth.
  p.ellipse(241, 64, 37, 36, C.grain)
  p.rect(204, 64, 74, 101, C.grain)
  p.ellipse(241, 65, 30, 29, C.black)
  p.rect(211, 65, 60, 100, C.black)
  shelf(p, 220, 72, 42, 78, 92)
  p.polygon([[214, 151], [269, 151], [269, 165], [211, 165]], C.darkWood)
  for (const x of [204, 274]) {
    p.rect(x, 69, 4, 96, C.copper)
    for (let y = 75; y < 163; y += 13) p.rect(x, y, 4, 1, C.darkWood)
  }
  tagged(p, 'shelfLadder', () => shelf(p, 116, 43, 76, 118, 24))
  tagged(p, 'shelfBack', () => shelf(p, 291, 40, 148, 123, 64))
  // Low, lateral moonlight; no central picture window.
  cityWindow(p, 25, 43, 64, 65)
  p.rect(28, 120, 56, 4, C.copper)
  plant(p, 102, 36, 72, 8)
  // Brass rolling ladder against the far stacks.
  p.line(112, 49, 195, 49, C.metal)
  for (const x of [147, 161]) {
    p.line(x, 71, x - 22, 168, C.copper)
    p.line(x + 1, 71, x - 21, 168, C.honey)
    p.ellipse(x - 21, 169, 2, 2, C.black)
  }
  for (let y = 82; y < 164; y += 11) {
    const x = 147 - Math.round((y - 71) * 22 / 97)
    p.line(x, y, x + 14, y, C.honey)
    p.line(x, y + 1, x + 14, y + 1, C.warmWood)
  }
  // Foreground stacks overlap the back wall and frame the aisle.
  tagged(p, 'shelfLeft', () => { p.polygon([[107, 123], [124, 114], [124, 228], [107, 250]], C.black); shelf(p, 9, 128, 99, 123, 41) })
  tagged(p, 'shelfRight', () => { p.polygon([[382, 107], [405, 91], [405, 261], [382, 227]], C.black); shelf(p, 404, 93, 72, 170, 74) })
  // Chairs sit on both long sides of a shared reading table.
  for (const [x, y] of [[210, 170], [184, 204], [307, 172], [330, 210]]) {
    p.rect(x, y, 19, 24, C.darkWood)
    p.frame(x + 2, y + 2, 15, 16, C.grain)
    p.rect(x - 1, y + 23, 22, 5, C.red)
    p.rect(x + 1, y + 28, 3, 15, C.black)
    p.rect(x + 16, y + 28, 3, 15, C.black)
  }
  p.tag = OBJECTS.indexOf('table') + 1
  p.polygon([[219, 170], [301, 170], [353, 241], [185, 241]], C.black)
  for (const x of [193, 337]) {
    p.rect(x, 238, 7, 30, C.darkWood)
    p.rect(x, 242, 2, 25, C.copper)
  }
  p.polygon([[219, 170], [301, 170], [353, 237], [185, 237]], C.grain)
  p.line(186, 237, 352, 237, C.honey)
  for (let i = 1; i < 5; i++) p.line(219 + i * 16, 171, 185 + i * 33, 236, C.warmWood)
  for (let i = 0; i < 38; i++) {
    const y = 177 + Math.floor(noise(i, 2, 80) * 55)
    const left = 219 - (y - 170) * .5, w = 82 + (y - 170) * 1.2
    p.rect(left + 4 + Math.floor(noise(i, 1, 80) * (w - 15)), y, 5, 1, C.copper)
  }
  journal(p, 231, 188); journal(p, 266, 217)
  teacup(p, 214, 217)
  // New releases occupy a separate display stand, empty until publication.
  p.tag = OBJECTS.indexOf('display') + 1
  p.rect(314, 154, 61, 29, C.darkWood)
  p.frame(317, 158, 55, 21, C.grain)
  p.rect(310, 150, 69, 5, C.copper)
  bookRow(p, 314, 150, 61, 77, Math.min(state.books, 12))
  p.rect(334, 163, 21, 7, C.paperShade)
  p.line(338, 166, 350, 166, C.warmWood)
  p.tag = 0
  // Hanging amber reading light keeps the table free of office equipment.
  p.line(260, 20, 260, 137, C.black)
  p.line(261, 20, 261, 137, C.copper)
  p.polygon([[253, 137], [267, 137], [279, 148], [241, 148]], C.greenDark)
  p.line(248, 143, 272, 143, C.green)
  p.rect(241, 148, 38, 2, C.honey)
  p.rect(249, 150, 22, 2, C.cream)
}

/** Department emblem: quill, palette, megaphone, seal. */
function glyph(p: Pixels, cx: number, cy: number, kind: number, ink: string, accent: string) {
  if (kind === 0) {
    p.polygon([[cx - 5, cy + 6], [cx - 3, cy + 3], [cx + 6, cy - 7], [cx + 3, cy + 1]], ink)
    p.line(cx - 6, cy + 7, cx - 3, cy + 4, accent)
    p.line(cx - 4, cy + 3, cx + 4, cy - 5, accent)
  } else if (kind === 1) {
    p.ellipse(cx, cy, 7, 6, ink)
    p.ellipse(cx + 3, cy + 2, 2, 2, accent)
    for (const [dx, dy] of [[-4, -1], [-1, -4], [3, -3]]) p.rect(cx + dx, cy + dy, 2, 2, accent)
  } else if (kind === 2) {
    p.polygon([[cx - 7, cy - 2], [cx - 2, cy - 2], [cx + 6, cy - 7], [cx + 6, cy + 7], [cx - 2, cy + 2], [cx - 7, cy + 2]], ink)
    p.rect(cx - 6, cy + 2, 3, 5, ink); p.line(cx + 8, cy - 3, cx + 9, cy - 4, accent); p.line(cx + 8, cy + 3, cx + 9, cy + 4, accent)
  } else {
    p.line(cx - 4, cy + 4, cx - 6, cy + 9, accent); p.line(cx + 4, cy + 4, cx + 6, cy + 9, accent)
    p.ellipse(cx, cy, 6, 6, ink); p.ellipse(cx, cy, 3, 3, accent)
  }
}

function banner(p: Pixels, x: number, y: number, on: boolean, kind: number) {
  p.rect(x - 5, y, 43, 2, C.copper); p.rect(x - 5, y, 43, 1, C.gold)
  p.rect(x - 8, y - 1, 3, 4, C.honey); p.rect(x + 38, y - 1, 3, 4, C.honey)
  const col = on ? [C.red, C.teal, C.bookBlue, C.plum][kind] : C.shadow
  p.polygon([[x, y + 2], [x + 33, y + 2], [x + 33, y + 28], [x + 16, y + 22], [x, y + 28]], col)
  p.rect(x, y + 2, 33, 2, on ? C.gold : C.wood)
  p.rect(x, y + 4, 2, 22, on ? C.darkWood : C.black)
  glyph(p, x + 17, y + 13, kind, on ? C.cream : C.wood, on ? C.gold : C.black)
}

/** A modest work desk: pedestal drawers on the left, an open knee-space and a leg on the right. */
function workDesk(p: Pixels, x: number, y: number, w: number) {
  p.rect(x + 3, y + 5, w - 6, 47, C.black)
  p.rect(x + 3, y + 5, 33, 47, C.darkWood)
  for (const dy of [8, 29]) { p.frame(x + 6, y + dy, 27, 18, C.grain); p.rect(x + 16, y + dy + 7, 8, 2, C.honey) }
  p.rect(x + w - 8, y + 5, 5, 48, C.warmWood); p.rect(x + w - 8, y + 5, 1, 46, C.copper)
  p.rect(x + 3, y + 51, 5, 3, C.black); p.rect(x + w - 8, y + 52, 5, 2, C.black)
  p.polygon([[x + 9, y - 14], [x + w - 9, y - 14], [x + w, y], [x, y]], C.warmWood)
  for (let yy = y - 11; yy < y; yy += 3) p.line(x + 8, yy, x + w - 8, yy, yy % 2 ? C.grain : C.wood)
  p.rect(x, y, w, 5, C.darkWood); p.rect(x, y, w, 1, C.gold); p.rect(x, y + 4, w, 1, C.black)
  p.rect(x + 12, y + 2, 12, 2, C.honey)
}

/** Vacant workstation: the machine sits under a linen cover. */
function dustCover(p: Pixels, x: number, y: number) {
  p.ellipse(x + 29, y + 36, 33, 4, C.black)
  p.polygon([[x + 2, y + 35], [x + 8, y + 18], [x + 22, y + 12], [x + 40, y + 13], [x + 52, y + 19], [x + 58, y + 35]], C.paperShade)
  p.polygon([[x + 8, y + 18], [x + 22, y + 12], [x + 28, y + 14], [x + 18, y + 24], [x + 6, y + 35], [x + 2, y + 35]], C.paper)
  for (const fx of [14, 28, 44]) p.line(x + fx, y + 16 + Math.abs(fx - 28) / 5, x + fx + 2, y + 34, C.slate)
  p.rect(x + 2, y + 35, 56, 2, C.slate)
}

/** Vitrine for the literary prize: cup, medals and a sealed citation. */
function awardsCase(p: Pixels, x: number, y: number) {
  p.rect(x - 3, y - 6, 51, 5, C.copper); p.rect(x - 3, y - 6, 51, 1, C.gold)
  p.rect(x, y, 45, 88, C.black)
  p.rect(x + 2, y + 2, 41, 84, C.slate)
  for (let k = 0; k < 3; k++) { p.line(x + 12 + k * 12, y + 2, x + 4 + k * 12, y + 34, C.metal); p.line(x + 13 + k * 12, y + 2, x + 5 + k * 12, y + 34, C.metal) }
  for (const sy of [39, 65]) { p.rect(x + 2, y + sy, 41, 3, C.warmWood); p.rect(x + 2, y + sy, 41, 1, C.copper) }
  // Cup
  p.polygon([[x + 12, y + 8], [x + 33, y + 8], [x + 30, y + 24], [x + 15, y + 24]], C.gold)
  p.polygon([[x + 14, y + 9], [x + 22, y + 9], [x + 21, y + 23], [x + 17, y + 23]], C.cream)
  p.ellipse(x + 8, y + 15, 3, 5, C.honey); p.ellipse(x + 37, y + 15, 3, 5, C.honey)
  p.ellipse(x + 8, y + 15, 1, 3, C.roof); p.ellipse(x + 37, y + 15, 1, 3, C.roof)
  p.rect(x + 21, y + 24, 4, 7, C.honey); p.rect(x + 15, y + 31, 16, 5, C.gold); p.rect(x + 15, y + 34, 16, 2, C.copper)
  // Medals
  for (let i = 0; i < 3; i++) {
    const mx = x + 9 + i * 13
    p.line(mx, y + 43, mx, y + 50, i % 2 ? C.teal : C.red)
    p.line(mx + 1, y + 43, mx + 1, y + 50, i % 2 ? C.teal : C.red)
    p.ellipse(mx, y + 55, 4, 4, C.honey); p.ellipse(mx, y + 55, 2, 2, C.gold)
  }
  // Citation scroll with wax seal
  p.rect(x + 6, y + 73, 32, 8, C.paper); p.rect(x + 6, y + 73, 32, 1, C.cream)
  p.rect(x + 4, y + 72, 3, 10, C.paperShade); p.rect(x + 37, y + 72, 3, 10, C.paperShade)
  p.ellipse(x + 22, y + 78, 3, 3, C.red); p.dot(x + 22, y + 77, C.rose)
  p.rect(x + 42, y + 2, 1, 84, C.metal)
}

function otherRoom(p: Pixels, room: Exclude<RoomKind, 'desk' | 'shelf'>, state: RoomState) {
  shell(p)
  rug(p, 99, 220, 282, 49)
  if (room === 'office') {
    cityWindow(p, 165, 24, 150, 42)
    plant(p, 115, 20, 78, 1); plant(p, 336, 20, 72, 4)
    for (let i = 0; i < 4; i++) {
      const x = 22 + i * 104, on = i < state.departments
      p.tag = OBJECTS.indexOf(`dept${i}` as ObjectKey) + 1
      banner(p, x + 22, 78, on, i)
      workDesk(p, x, 150, 83)
      if (on) typewriter(p, x + 11, 111, true)
      else dustCover(p, x + 11, 111)
      p.rect(x + 66, 142, 13, 2, C.paperShade); p.rect(x + 66, 140, 13, 2, on ? C.paper : C.paperShade)
    }
    p.tag = OBJECTS.indexOf('tearoom') + 1
    // Notice board and tea counter.
    p.rect(414, 80, 54, 50, C.black); p.rect(416, 82, 50, 46, C.grain)
    p.texture(416, 82, 50, 46, C.warmWood, .2, 4)
    for (const [nx, ny, nw, nh, nc] of [[421, 87, 15, 17, C.paper], [440, 90, 12, 12, C.cream], [455, 86, 9, 18, C.paperShade], [423, 108, 20, 14, C.cream], [449, 109, 14, 14, C.paper]] as const) {
      p.rect(nx, ny, nw, nh, nc); p.rect(nx + 2, ny + 3, nw - 4, 1, C.paperShade); p.rect(nx + 2, ny + 6, nw - 6, 1, C.paperShade)
      p.dot(nx + Math.floor(nw / 2), ny + 1, C.red)
    }
    p.rect(380, 176, 88, 6, C.copper); p.rect(380, 176, 88, 1, C.gold)
    p.rect(384, 182, 80, 46, C.darkWood)
    for (const dx of [388, 428]) { p.frame(dx, 186, 34, 38, C.grain); p.rect(dx + 15, 200, 4, 8, C.honey) }
    p.rect(386, 228, 5, 4, C.black); p.rect(457, 228, 5, 4, C.black)
    p.ellipse(410, 164, 9, 10, C.copper); p.rect(406, 152, 8, 5, C.copper); p.rect(408, 148, 4, 4, C.gold)
    p.rect(403, 158, 3, 12, C.honey); p.line(419, 162, 425, 160, C.copper)
    teacup(p, 434, 163); teacup(p, 449, 163)
    // Emblem inlaid in the rug: moon over a closed book.
    p.tag = OBJECTS.indexOf('settings') + 1
    p.ellipse(240, 244, 40, 14, C.copper); p.ellipse(240, 244, 37, 12, C.redDark)
    p.ellipse(240, 244, 30, 9, C.rose); p.ellipse(240, 244, 28, 8, C.redDark)
    p.ellipse(240, 241, 8, 8, C.gold); p.ellipse(244, 239, 7, 7, C.redDark)
    p.polygon([[228, 249], [240, 246], [252, 249], [240, 253]], C.paper)
    p.line(240, 246, 240, 253, C.paperShade)
    for (const [sx, sy] of [[230, 237], [252, 238], [226, 243], [255, 246]]) p.dot(sx, sy, C.gold)
    p.tag = 0
  } else if (room === 'authors') {
    tagged(p, 'portraits', () => { for (let i = 0; i < 4; i++) portrait(p, 53 + i * 108, 55, 53, 64, i, i < state.authors, true) })
    for (const x of [26, 133, 241, 349, 456]) sconce(p, x, 78)
    armchair(p, 34, 150, 78, C.red, C.redDark, C.rose)
    armchair(p, 368, 150, 78, C.teal, C.greenDark, C.green)
    p.tag = OBJECTS.indexOf('roundtable') + 1
    p.rect(222, 196, 36, 44, C.darkWood); p.rect(222, 196, 3, 44, C.warmWood)
    p.ellipse(240, 240, 26, 4, C.black); p.ellipse(240, 238, 22, 3, C.warmWood)
    p.ellipse(240, 199, 72, 20, C.black); p.ellipse(240, 193, 72, 20, C.copper); p.ellipse(240, 191, 70, 19, C.warmWood)
    p.ellipse(240, 190, 56, 14, C.grain)
    journal(p, 208, 183); teacup(p, 277, 184); candle(p, 247, 165)
    p.rect(300, 185, 22, 4, C.red); p.rect(302, 181, 18, 4, C.bookBlue)
    p.tag = 0
  } else if (room === 'study') {
    cityWindow(p, 27, 39, 116, 88)
    tagged(p, 'hearth', () => { fireplace(p, 197, HEARTH_Y); refPortrait(p, 212, 44, 'count'); refPortrait(p, 246, 45, 'editor') })
    tagged(p, 'bookcase', () => shelf(p, 366, 126, 96, 110, 55))
    plant(p, 344, 32, 117, 8)
    tagged(p, 'armchair', () => { armchair(p, 64, 158, 90, C.plum, C.redDark, C.rose); journal(p, 88, 178) })
    desk(p, 250, 214, 83); teacup(p, 281, 199); lamp(p, 176, 154)
  } else {
    // Card-index wall: brass labels, worn drawers and one left open.
    p.tag = OBJECTS.indexOf('cabinet') + 1
    p.rect(18, 19, 236, 4, C.warmWood); p.rect(18, 19, 236, 1, C.honey)
    p.rect(20, 23, 232, 168, C.black)
    for (let row = 0; row < 5; row++) for (let col = 0; col < 5; col++) {
      const x = 24 + col * 45, y = 27 + row * 32
      if (row === 2 && col === 3) {
        p.rect(x, y + 4, 43, 26, C.black)
        for (let k = 0; k < 9; k++) p.rect(x + 3 + k * 4, y + 8 - k % 3, 3, 11 + k % 3, k % 2 ? C.paper : C.cream)
        p.rect(x, y + 17, 43, 14, C.darkWood); p.rect(x, y + 17, 43, 1, C.copper); p.rect(x + 15, y + 22, 13, 5, C.copper)
        continue
      }
      p.rect(x, y, 43, 30, noise(col, row, 5) > .5 ? C.darkWood : C.wood)
      p.frame(x + 2, y + 2, 39, 25, C.grain)
      p.rect(x + 12, y + 7, 20, 9, C.copper); p.rect(x + 14, y + 8, 16, 7, [C.paper, C.cream, C.paperShade][Math.floor(noise(col, row, 9) * 3)])
      p.rect(x + 16, y + 10, 12, 1, C.paperShade); p.rect(x + 16, y + 12, 8, 1, C.paperShade)
      p.rect(x + 16, y + 20, 11, 3, C.honey); p.rect(x + 17, y + 21, 9, 1, C.black)
    }
    tagged(p, 'logs', () => shelf(p, 279, 29, 121, 164, 44))
    tagged(p, 'awards', () => awardsCase(p, 421, 88))
    p.tag = 0
    // Reading lamp over the ledger desk.
    p.line(265, 20, 265, 150, C.black); p.line(266, 20, 266, 150, C.copper)
    p.polygon([[258, 150], [274, 150], [286, 161], [246, 161]], C.greenDark)
    p.line(252, 156, 280, 156, C.green); p.rect(246, 161, 40, 2, C.honey); p.rect(255, 163, 22, 2, C.cream)
    tagged(p, 'ledger', () => {
      desk(p, 148, 205, 187); journal(p, 214, 189); candle(p, 316, 176)
      p.rect(160, 192, 26, 4, C.red); p.rect(162, 188, 22, 4, C.bookBlue); p.rect(164, 184, 18, 4, C.plum)
    })
  }
}

export function renderRoom(room: RoomKind, state: RoomState = EMPTY_ROOM, includeLiveObjects = true) {
  const p = new Pixels(FINE_W, FINE_H, undefined, true)
  p.s = UNIT
  if (room === 'desk') deskRoom(p, state, includeLiveObjects)
  else if (room === 'shelf') libraryRoom(p, state)
  else otherRoom(p, room, state)
  return p
}

/** Lightning: the room jumps one grade brighter and the glass goes to the flash grade. */
function flashMask(room: RoomKind, level: 1 | 2) {
  const mask = lightMask(room).slice(), win = WINDOWS[room]
  for (let i = 0; i < mask.length; i++) mask[i] = Math.min(4, mask[i] + 1)
  if (win) for (let y = win[1] * UNIT; y < (win[1] + win[3]) * UNIT; y++) mask.fill(level === 2 ? 5 : 4, y * FINE_W + win[0] * UNIT, y * FINE_W + (win[0] + win[2]) * UNIT)
  return mask
}

export function animateRoom(base: Pixels, room: RoomKind, state: RoomState, tick: number, weather: Weather = 'clear', ramp = 1) {
  const p = new Pixels(FINE_W, FINE_H, base.data)
  p.s = UNIT
  const win = WINDOWS[room]
  if (room === 'desk') bats(p, ...DESK_WINDOW, tick)
  if (win) drawWeather(p, win, weather, tick, ramp, base.data, room === 'desk' ? deskBars : windowBars)
  if (room === 'desk') {
    clockPendulum(p, 352, 30, tick)
    candelabraFlames(p, tick); wallCandleFlame(p, tick)
    inTray(p, state.submitted)
    typewriterFine(p, state.working > 0, tick)
    if (state.hasCat) sleepingCat(p, tick)
    teaSteam(p, tick)
  } else if (room === 'study') {
    flames(p, tick)
  }
  const flash = win && weather === 'storm' ? lightning(tick).level : 0
  p.shade(flash ? flashMask(room, flash as 1 | 2) : lightMask(room))
  return p
}
