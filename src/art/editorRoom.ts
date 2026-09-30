import { INK as C, noise, Pixels, UNIT } from './pixels'
import { PORTRAITS } from './portraitData'
import type { PixelImage } from './portraitData'
import { anchorAt, drawSprite } from './sprite'
import { Typewriter } from './baked/typewriter'
import { Candelabra } from './baked/candelabra'
import { WallSconce } from './baked/wall-sconce'
import { Teacup } from './baked/teacup'
import { InkAndQuill } from './baked/ink-and-quill'
import { InTray } from './baked/in-tray'
import { Journal } from './baked/journal'
import { WallClock } from './baked/wall-clock'
import { LetterRack } from './baked/letter-rack'
import { PottedPlant } from './baked/potted-plant'
import { BookcaseTall } from './baked/bookcase-tall'
import { BookcaseLow } from './baked/bookcase-low'
import { ClothDesk } from './baked/cloth-desk'

/**
 * The editor's room, after the original bitmap scene: brick walls, a gothic city of spires behind a
 * three-pane window, a red-clothed desk lit by candles. Objects are painted in native pixels with
 * rim light, ambient shadow and dithered glow, so they hold up close.
 */

type Pt = readonly [number, number]
const B4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5]

/** Native-pixel brush anchored at a layout-grid point. */
export function brush(p: Pixels, x: number, y: number) {
  const X = Math.round(x * UNIT), Y = Math.round(y * UNIT)
  const fine = (draw: () => void) => p.fine(draw)
  return {
    X, Y,
    r: (a: number, b: number, w: number, h: number, c: string) => fine(() => p.rect(X + a, Y + b, w, h, c)),
    d: (a: number, b: number, c: string) => fine(() => p.rect(X + a, Y + b, 1, 1, c)),
    poly: (pts: Pt[], c: string) => fine(() => p.polygon(pts.map(([a, b]) => [X + a, Y + b] as const), c)),
    ell: (a: number, b: number, rx: number, ry: number, c: string) => fine(() => p.ellipse(X + a, Y + b, rx, ry, c)),
    line: (a0: number, b0: number, a1: number, b1: number, c: string) => fine(() => p.line(X + a0, Y + b0, X + a1, Y + b1, c)),
    /** Ordered-dither fill; `amount(i, j)` in 0..1 is the share of pixels that take colour c. */
    dith: (a: number, b: number, w: number, h: number, c: string, amount: (i: number, j: number) => number) => fine(() => {
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
        const v = amount(i, j)
        if (v > 0 && B4[((Y + b + j) & 3) * 4 + ((X + a + i) & 3)] / 16 < v) p.rect(X + a + i, Y + b + j, 1, 1, c)
      }
    }),
    /** Hand-placed pixels: one string per row, '.' is transparent. */
    spr: (a: number, b: number, rows: readonly string[], pal: Record<string, string>) => fine(() => {
      rows.forEach((row, j) => { for (let i = 0; i < row.length; i++) { const c = pal[row[i]]; if (c) p.rect(X + a + i, Y + b + j, 1, 1, c) } })
    }),
  }
}
type Brush = ReturnType<typeof brush>
const glowAt = (b: Brush, cx: number, cy: number, r: number, c: string, strength: number) =>
  b.dith(cx - r, cy - r, r * 2, r * 2, c, (i, j) => Math.max(0, 1 - Math.hypot(i - r, j - r) / r) * strength)

// ──── walls, floor, window ────

/** Running-bond brick over a layout-grid rectangle; the bond is anchored to the room, so it never slides on resize. */
export function brickWall(p: Pixels, x: number, y: number, w: number, h: number) {
  const b = brush(p, 0, 0), X0 = Math.round(x * UNIT), Y0 = Math.round(y * UNIT), X1 = Math.round((x + w) * UNIT), Y1 = Math.round((y + h) * UNIT)
  b.r(X0, Y0, X1 - X0, Y1 - Y0, C.mortar)
  for (let row = Math.floor(Y0 / 14); row * 14 < Y1; row++) {
    const top = Math.max(Y0, row * 14), bottom = Math.min(Y1, row * 14 + 12)
    if (bottom <= top) continue
    const off = (row & 1) ? 13 : 0
    for (let bx = Math.floor((X0 - off) / 27) * 27 + off; bx < X1; bx += 27) {
      const n = noise(Math.floor(bx / 27) + 40, row, 71)
      const col = n < .22 ? C.brickDark : n > .82 ? C.brickLight : C.brick
      const x0 = Math.max(X0, bx), x1 = Math.min(X1, bx + 25)
      if (x1 <= x0) continue
      b.r(x0, top, x1 - x0, bottom - top, col)
      if (top === row * 14) b.r(x0, top, x1 - x0, 1, col === C.brickDark ? C.brick : C.brickLight)
      if (bottom === row * 14 + 12) b.r(x0, bottom - 1, x1 - x0, 1, C.brickDark)
      if (x0 === bx) b.r(x0, top, 1, bottom - top, col === C.brickDark ? C.brick : C.brickLight)
      if (x1 === bx + 25) b.r(x1 - 1, top, 1, bottom - top, C.brickDark)
      if (n > .9 && x1 - x0 > 14 && bottom - top > 9) { b.line(x0 + 6, top + 2, x0 + 9, top + 6, C.mortar); b.line(x0 + 9, top + 6, x0 + 8, top + 9, C.mortar) }
      b.dith(x0, top + 1, x1 - x0, Math.max(0, bottom - top - 2), C.brickDark, (i, j) => noise(x0 + i, top + 1 + j, 5) < .5 ? .18 : 0)
      if (n > .5 && n < .56 && x1 - x0 > 8 && bottom - top > 7) b.r(x0 + 4, top + 5, 3, 2, C.mortar) // chipped corner
    }
  }
}

/** Plank floor from layout row `y` to `b`, spanning `l`..`r`; joints are anchored to the room. */
export function deskFloor(p: Pixels, l: number, y: number, r: number, bottom: number) {
  const b = brush(p, 0, 0), X0 = Math.round(l * UNIT), X1 = Math.round(r * UNIT), Y0 = y * UNIT, Y1 = Math.round(bottom * UNIT)
  b.r(X0, Y0, X1 - X0, Y1 - Y0, C.darkWood)
  for (let row = 0; Y0 + row * 16 < Y1; row++) {
    const top = Y0 + row * 16
    b.r(X0, top, X1 - X0, 1, C.black); b.r(X0, top + 1, X1 - X0, 1, C.wood)
    for (let x = Math.floor((X0 - (row * 97) % 180) / 180) * 180 + (row * 97) % 180; x < X1; x += 180) if (x >= X0) b.r(x, top + 1, 1, 15, C.black)
    b.dith(X0, top + 2, X1 - X0, 14, C.wood, (i, j) => noise((X0 + i) >> 3, row * 16 + j, 13) < .35 ? .25 : 0)
  }
  b.r(X0, Y0, X1 - X0, 4, C.black); b.r(X0, Y0 + 4, X1 - X0, 2, C.brickDark) // skirting shadow
}

/** Gothic skyline: three depths of spires, turrets and crenellations with scattered lit windows. */
export function gothicCity(p: Pixels, x: number, y: number, w: number, h: number) {
  const b = brush(p, x, y), W = w * UNIT, H = h * UNIT, H0 = 256 // skyline is sized for 128 layout rows of glass
  b.r(0, 0, W, H, C.skyDeep)
  b.dith(0, 0, W, H, C.skyMid, (_, j) => Math.min(1, Math.max(0, (j / H - .1) * 2)))
  b.dith(0, 0, W, H, C.skyLight, (_, j) => Math.max(0, (j / H - .45) * 2.2))
  // Moonlit cloud streaks.
  for (let k = 0; k < 5; k++) {
    const cx = noise(k, 1, 60) * W, cy = H * (.08 + k * .07), rx = 40 + noise(k, 2, 60) * 50, ry = 4 + k % 3
    b.dith(Math.round(cx - rx), Math.round(cy - ry), Math.round(rx * 2), Math.round(ry * 2), k % 2 ? C.skyLight : C.skyMid,
      (i, j) => Math.max(0, 1 - ((i - rx) / rx) ** 2 - ((j - ry) / ry) ** 2) * .8)
  }
  const mx = Math.round(W * .78), my = Math.round(H * .16)
  glowAt(b, mx, my, 34, C.skyLight, .7)
  b.ell(mx, my, 12, 12, C.moon)
  b.ell(mx + 3, my + 2, 3, 2, C.steel); b.ell(mx - 5, my - 4, 2, 2, C.steel); b.ell(mx - 2, my + 6, 2, 1, C.blueLight)
  b.r(mx - 8, my - 6, 2, 2, '#e6f0ee')
  const layer = (base: number, col: string, edge: string, lit: number, seed: number, reach: number, near = false) => {
    let cx = -6
    while (cx < W) {
      const bw = 12 + Math.floor(noise(cx, seed, 1) * 18)
      const top = Math.round(base - noise(cx, seed, 2) * H0 * reach)
      b.r(cx, top, bw, H - top, col)
      b.r(cx, top, 1, H - top, edge)
      const kind = Math.floor(noise(cx, seed, 3) * 4), mid = cx + bw / 2
      if (kind === 0) { b.poly([[cx, top], [mid, top - bw * 1.7], [cx + bw - 1, top]], col); b.line(mid, top - bw * 1.7 - 5, mid, top - bw * 1.7, col) }
      else if (kind === 1) b.poly([[cx - 1, top], [mid, top - bw * .7], [cx + bw, top]], col)
      else if (kind === 2) for (let i = 0; i < bw; i += 4) b.r(cx + i, top - 3, 2, 3, col)
      else { b.r(cx, top - 10, 5, 10, col); b.poly([[cx - 1, top - 10], [cx + 2, top - 18], [cx + 5, top - 10]], col); b.r(cx + bw - 5, top - 8, 5, 8, col); b.poly([[cx + bw - 6, top - 8], [cx + bw - 3, top - 15], [cx + bw, top - 8]], col) }
      for (let wy = top + 5; wy < H - 4; wy += 7) for (let wx = cx + 3; wx < cx + bw - 2; wx += 5) {
        if (noise(wx, wy, seed) < lit) { b.r(wx, wy, near ? 2 : 1, 2, C.honey); b.d(wx, wy, near ? C.flame : C.fire) }
      }
      cx += bw + (noise(cx, seed, 4) < .3 ? 3 : 0)
    }
  }
  layer(H - H0 * .4, C.spireFar, C.skyLight, .015, 11, .32)
  // A cathedral in the middle distance with a rose window.
  const cc = Math.round(W * .42), ct = Math.round(H - H0 * .65)
  b.r(cc - 14, ct, 28, H - ct, C.spireMid)
  b.poly([[cc - 15, ct], [cc, ct - 58], [cc + 15, ct]], C.spireMid)
  b.line(cc, ct - 68, cc, ct - 58, C.spireMid); b.r(cc - 3, ct - 64, 7, 1, C.spireMid)
  b.ell(cc, ct + 14, 5, 5, C.ember); b.ell(cc, ct + 14, 3, 3, C.fire); b.d(cc, ct + 14, C.cream)
  for (const s of [-1, 1]) { b.r(cc + s * 20 - 5, ct + 12, 10, H - ct - 12, C.spireMid); b.poly([[cc + s * 20 - 6, ct + 12], [cc + s * 20, ct - 14], [cc + s * 20 + 6, ct + 12]], C.spireMid) }
  layer(H - H0 * .26, C.spireMid, C.spireFar, .03, 23, .42)
  layer(H - H0 * .08, C.spire, C.spireMid, .06, 37, .55, true)
}

/** Three-pane casement: moulded casing, inner stop, glass, and a bullnosed sill; glass is at (x, y, w, h) on the layout grid. */
export function deskWindow(p: Pixels, x: number, y: number, w: number, h: number) {
  const b = brush(p, x, y), W = w * UNIT, H = h * UNIT
  // Casing, outside in: outline, a lit bead, a groove, a grained flat, a lit edge, the inner stop.
  b.r(-18, -18, W + 36, H + 30, C.black)
  b.r(-17, -17, W + 34, H + 28, C.wood)
  b.r(-17, -17, W + 34, 1, C.grain); b.r(-17, -17, 1, H + 28, C.grain)
  b.r(-17, H + 10, W + 34, 1, C.darkWood); b.r(W + 16, -17, 1, H + 28, C.darkWood)
  b.r(-14, -14, W + 28, H + 22, C.black)
  b.r(-13, -13, W + 26, H + 20, C.darkWood)
  b.dith(-13, -13, W + 26, H + 20, C.wood, (i, j) => noise((b.X + i) >> 2, j >> 4, 23) < .3 ? .22 : 0)
  b.r(-13, -13, W + 26, 1, C.wood); b.r(-13, -13, 1, H + 20, C.wood)
  b.r(-6, -6, W + 12, H + 12, C.black)
  b.r(-5, -5, W + 10, 3, C.warmWood); b.r(-5, -5, 3, H + 10, C.warmWood)
  b.r(-5, -5, W + 10, 1, C.honey); b.r(W + 2, -5, 3, H + 10, C.darkWood); b.r(-5, H + 2, W + 10, 3, C.darkWood)
  gothicCity(p, x, y, w, h)
  // Sill: lit top, bullnosed front edge, and the shadow it throws on the brick.
  b.r(-24, H + 8, W + 48, 5, C.warmWood)
  b.r(-24, H + 8, W + 48, 1, C.gold); b.r(-24, H + 9, W + 48, 1, C.honey)
  b.r(-24, H + 13, W + 48, 6, C.wood); b.r(-24, H + 13, W + 48, 1, C.grain); b.r(-24, H + 18, W + 48, 1, C.darkWood)
  b.r(-25, H + 8, 1, 11, C.black); b.r(W + 24, H + 8, 1, 11, C.black)
  b.r(-22, H + 19, W + 44, 2, C.black)
  b.dith(-22, H + 21, W + 44, 6, C.black, (_, j) => .55 - j * .09)
}

/** Mullions and transom drawn over the weather each frame, with a brass latch where they cross. */
export function deskBars(p: Pixels, x: number, y: number, w: number, h: number) {
  const b = brush(p, x, y), W = w * UNIT, H = h * UNIT, mid = H - 141 // transom keeps its height above the sill
  const bar = (bx: number) => { b.r(bx, 0, 7, H, C.darkWood); b.r(bx, 0, 1, H, C.black); b.r(bx + 1, 0, 1, H, C.wood); b.r(bx + 6, 0, 1, H, C.black) }
  for (const bx of [Math.round(W / 3) - 3, Math.round(W * 2 / 3) - 3]) bar(bx)
  b.r(0, mid, W, 7, C.darkWood); b.r(0, mid, W, 1, C.black); b.r(0, mid + 1, W, 1, C.wood); b.r(0, mid + 6, W, 1, C.black)
  const lx = Math.round(W / 3) - 1
  b.r(lx - 2, mid - 3, 7, 12, C.brassDark); b.r(lx - 1, mid - 2, 5, 10, C.brass); b.r(lx - 1, mid - 2, 5, 1, C.brassLight); b.d(lx + 1, mid + 3, C.lash)
}

// ──── wall decor ────

function frameFine(b: Brush, a: number, c: number, w: number, h: number) {
  b.r(a - 5, c - 5, w + 10, h + 10, C.black)
  b.r(a - 4, c - 4, w + 8, h + 8, C.brassDark)
  b.r(a - 4, c - 4, w + 8, 1, C.brassLight); b.r(a - 4, c - 4, 1, h + 8, C.brass)
  b.r(a - 3, c - 3, w + 6, 1, C.brass); b.r(a - 1, c - 1, w + 2, h + 2, C.black)
  for (const [px, py] of [[a - 4, c - 4], [a + w + 1, c - 4], [a - 4, c + h + 1], [a + w + 1, c + h + 1]]) b.r(px, py, 3, 3, C.brassLight)
}

function blit(b: Brush, a: number, c: number, img: PixelImage) {
  let pos = 0
  for (let i = 0; i < img.runs.length; i += 2) {
    const col = '#' + img.palette[img.runs[i]]
    for (let left = img.runs[i + 1]; left > 0;) {
      const px = pos % img.width, n = Math.min(left, img.width - px)
      b.r(a + px, c + Math.floor(pos / img.width), n, 1, col)
      pos += n; left -= n
    }
  }
}

/** One of the two reference portraits, 1 image pixel per native pixel, in a thin gilt frame. */
export function refPortrait(p: Pixels, x: number, y: number, who: 'count' | 'editor') {
  const b = brush(p, x, y), img = PORTRAITS[who]
  frameFine(b, 0, 0, img.width, img.height)
  blit(b, 0, 0, img)
}
/** Portrait size on the layout grid, frame included. */
export const portraitBox = (who: 'count' | 'editor') => [(PORTRAITS[who].width + 10) / UNIT, (PORTRAITS[who].height + 10) / UNIT] as const

/** Red-sky castle, as in the original bitmap room. */
export function castlePainting(p: Pixels, x: number, y: number) {
  const b = brush(p, x, y), W = 72, H = 124
  frameFine(b, 0, 0, W, H)
  b.r(0, 0, W, H, C.velvetDark)
  b.dith(0, 0, W, H, C.velvet, (_, j) => Math.min(1, j / H * 1.6))
  b.dith(0, 0, W, H, C.ember, (_, j) => Math.max(0, (j / H - .45) * 2.2))
  b.dith(0, 0, W, H, C.fire, (_, j) => Math.max(0, (j / H - .7) * 2.5))
  b.ell(50, 34, 9, 9, C.fire); b.ell(50, 34, 7, 7, C.flame)
  const ink = C.castle
  b.poly([[0, H], [0, 104], [18, 96], [40, 100], [72, 92], [72, H]], ink)
  b.r(22, 58, 26, 46, ink)
  b.poly([[20, 58], [35, 20], [50, 58]], ink); b.line(35, 12, 35, 20, ink)
  for (const [tx, tw, th] of [[10, 10, 62], [50, 12, 66], [4, 7, 80]] as const) {
    b.r(tx, th, tw, H - th, ink); b.poly([[tx - 1, th], [tx + tw / 2, th - tw * 1.8], [tx + tw, th]], ink)
  }
  for (const [wx, wy] of [[31, 68], [38, 68], [34, 80], [14, 76], [55, 80], [27, 90]] as const) { b.r(wx, wy, 2, 3, C.fire); b.d(wx, wy, C.flame) }
  for (const [bx, by] of [[12, 30], [22, 22], [60, 50]] as const) { b.d(bx, by, ink); b.d(bx - 1, by - 1, ink); b.d(bx + 1, by - 1, ink) }
}

// ──── baked props (scripts/bake): positions are layout-grid top-left corners ────

const CLOCK = { x: 352, y: 30 }
export function wallClock(p: Pixels) { drawSprite(p, WallClock, CLOCK.x, CLOCK.y, 2) }
/** Five baked pendulum angles, stepped along a sine. */
export function clockPendulum(p: Pixels, tick: number) { drawSprite(p, WallClock, CLOCK.x, CLOCK.y, Math.round((Math.sin(tick / 6) + 1) * 2)) }

export function letterRack(p: Pixels) { drawSprite(p, LetterRack, 23, 104) }
export function pottedPlant(p: Pixels) { drawSprite(p, PottedPlant, 0, 214 - PottedPlant.height / 2) }
export function bookcases(p: Pixels) { drawSprite(p, BookcaseTall, 405, 26); drawSprite(p, BookcaseLow, 342, 148) }

// ──── candlelight ────

const FLAME = [
  ['..y..', '.yYy.', '.yWy.', 'yYWYy', 'yYWYy', '.yYy.', '..o..'],
  ['..y..', '..Yy.', '.yWy.', '.YWYy', 'yYWYy', '.yYy.', '..o..'],
  ['.y...', '.yY..', '.yWy.', 'yYWy.', 'yYWYy', '.yYy.', '..o..'],
]
const FLAME_PAL = { y: C.fire, Y: C.flame, W: C.flameCore, o: C.ember }
/** A flickering flame standing on a wick at layout point (x, y). */
function flame(p: Pixels, [x, y]: readonly [number, number], tick: number, seed: number) {
  brush(p, x, y).spr(-2, -6, FLAME[Math.floor(noise(Math.floor(tick / 2), seed, 9) * 3)], FLAME_PAL)
}

const CANDELABRA = { x: 341, y: 150 }
export function candelabra(p: Pixels) {
  const [cx, cy] = anchorAt(Candelabra, 'centre', CANDELABRA.x, CANDELABRA.y), b = brush(p, cx, cy)
  glowAt(b, 0, 10, 46, C.glow, .45); glowAt(b, 0, 10, 26, C.honey, .35)
  drawSprite(p, Candelabra, CANDELABRA.x, CANDELABRA.y)
}
export function candelabraFlames(p: Pixels, tick: number) {
  ;(['left', 'centre', 'right'] as const).forEach((wick, i) => flame(p, anchorAt(Candelabra, wick, CANDELABRA.x, CANDELABRA.y), tick, i + 1))
}

const SCONCE = { x: 380, y: 98 }
export function wallCandle(p: Pixels) {
  const [fx, fy] = anchorAt(WallSconce, 'flame', SCONCE.x, SCONCE.y), b = brush(p, fx, fy)
  glowAt(b, 0, 2, 40, C.glow, .5); glowAt(b, 0, 2, 20, C.honey, .3)
  drawSprite(p, WallSconce, SCONCE.x, SCONCE.y)
}
export function wallCandleFlame(p: Pixels, tick: number) { flame(p, anchorAt(WallSconce, 'flame', SCONCE.x, SCONCE.y), tick, 4) }

// ──── the desk ────

/** The red-clothed desk, placed so its back edge meets the wall at layout row 188. */
export function clothDesk(p: Pixels) { drawSprite(p, ClothDesk, 88, 188 - (ClothDesk.anchors?.back[1] ?? 0) / UNIT) }

/** Wooden in-tray; one baked frame per sheet, up to ten. */
export function inTray(p: Pixels, count: number) { drawSprite(p, InTray, 116, 168, Math.min(10, Math.max(0, count))) }
export function inkAndQuill(p: Pixels) { drawSprite(p, InkAndQuill, 171, 156) }

/** The kinotype typewriter: idle, or striking keys as the carriage steps along. */
export function typewriterFine(p: Pixels, working: boolean, tick = 0) {
  brush(p, 200, 157).ell(61, Typewriter.height - 2, 60, 4, C.clothDark)
  drawSprite(p, Typewriter, 200, 157, working ? 1 + Math.floor(tick / 3) % 4 : 0)
}

export function openJournal(p: Pixels) { drawSprite(p, Journal, 273, 179) }

const TEACUP = { x: 363, y: 181 }
export function teacupFine(p: Pixels) { drawSprite(p, Teacup, TEACUP.x, TEACUP.y) }
export function teaSteam(p: Pixels, tick: number) {
  const [sx, sy] = anchorAt(Teacup, 'steam', TEACUP.x, TEACUP.y), b = brush(p, sx, sy)
  for (let i = 0; i < 3; i++) {
    const age = (tick + i * 9) % 30
    if (age < 22) b.r(-5 + i * 5 + Math.round(Math.sin((age + i * 3) / 3) * 2), -2 - Math.floor(age * .9), 1, 2, age < 12 ? C.keyShade : C.slate)
  }
}

export const CAT = { x: 350, y: 124 }
/** Black cat asleep on the low bookcase, moonlight on its back. */
export function sleepingCat(p: Pixels, tick: number) {
  const b = brush(p, CAT.x, CAT.y), breath = Math.floor(tick / 18) % 2
  b.ell(46, 42, 44, 4, C.black)
  b.ell(40, 28 - breath, 34, 13 + breath, C.catFur)
  b.dith(8, 16, 64, 12, C.catRim, (i, j) => j < 3 && Math.abs(i - 30) < 26 ? .7 : 0)
  b.ell(74, 26, 13, 11, C.catFur)
  b.poly([[64, 20], [66, 8], [72, 17]], C.catFur); b.poly([[76, 16], [83, 6], [85, 20]], C.catFur)
  b.poly([[66, 18], [67, 11], [70, 17]], C.rose); b.poly([[79, 16], [83, 10], [83, 18]], C.rose)
  b.line(65, 9, 66, 16, C.catRim); b.line(82, 7, 77, 15, C.catRim)
  b.line(67, 27, 70, 28, C.steel); b.line(70, 28, 72, 27, C.steel); b.line(77, 27, 80, 28, C.steel); b.line(80, 28, 82, 27, C.steel)
  b.d(75, 31, C.rose)
  b.line(83, 30, 94, 28, C.slate); b.line(83, 32, 94, 33, C.slate)
  // Tail curled around the front.
  b.line(10, 36, 44, 40, C.catFur); b.line(10, 37, 44, 41, C.catFur); b.line(44, 40, 58, 36, C.catFur); b.line(44, 41, 58, 37, C.catFur)
  b.line(12, 36, 42, 39, C.catRim)
}

/** Bats cross the sky slowly; drawn under the weather. */
export function bats(p: Pixels, x: number, y: number, w: number, h: number, tick: number) {
  const b = brush(p, x, y), W = w * UNIT, H = h * UNIT
  const up = ['k.....k', 'kk...kk', '.kkkkk.', '...k...'], down = ['.......', '..kkk..', '.kk.kk.', 'k.....k']
  for (let i = 0; i < 3; i++) {
    const bx = ((i * 131 + tick * (1 + i % 2)) % (W + 40)) - 20, by = Math.round(H * (.12 + i * .1) + Math.sin(tick / 5 + i) * 3)
    if (bx < 2 || bx > W - 9) continue
    b.spr(bx, by, (Math.floor(tick / 3) + i) % 2 ? up : down, { k: C.spire })
  }
}
