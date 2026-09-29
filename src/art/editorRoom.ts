import { INK as C, noise, Pixels, UNIT } from './pixels'
import { PORTRAITS } from './portraitData'
import type { PixelImage } from './portraitData'
import { TYPEWRITER_SPRITE } from './typewriterSprite'

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

/** Three-pane casement with deep wood frame and a sill; glass is at (x, y, w, h) on the layout grid. */
export function deskWindow(p: Pixels, x: number, y: number, w: number, h: number) {
  const b = brush(p, x, y), W = w * UNIT, H = h * UNIT
  b.r(-16, -16, W + 32, H + 36, C.black)
  b.r(-13, -13, W + 26, H + 28, C.darkWood)
  b.r(-13, -13, W + 26, 2, C.wood); b.r(-13, -13, 2, H + 28, C.wood)
  b.r(-5, -5, W + 10, H + 10, C.black)
  b.r(-3, -3, W + 6, 1, C.brassDark)
  gothicCity(p, x, y, w, h)
  // Sill: a deep ledge that catches the candlelight.
  b.r(-20, H + 10, W + 40, 10, C.warmWood)
  b.r(-20, H + 10, W + 40, 2, C.honey)
  b.r(-20, H + 20, W + 40, 3, C.black)
  b.dith(-20, H + 12, W + 40, 8, C.darkWood, (i) => i / (W + 40) < .5 ? .45 - i / (W + 40) * .8 : 0)
}

/** Mullions drawn over the weather each frame. */
export function deskBars(p: Pixels, x: number, y: number, w: number, h: number) {
  const b = brush(p, x, y), W = w * UNIT, H = h * UNIT
  for (const bx of [0, Math.round(W / 3) - 3, Math.round(W * 2 / 3) - 3, W - 6]) { b.r(bx, 0, 6, H, C.darkWood); b.r(bx, 0, 1, H, C.wood); b.r(bx + 5, 0, 1, H, C.black) }
  const mid = H - 141 // transom stays at the same height above the sill however tall the glass
  b.r(0, mid, W, 6, C.darkWood); b.r(0, mid, W, 1, C.wood); b.r(0, mid + 5, W, 1, C.black)
  b.r(0, 0, W, 4, C.darkWood); b.r(0, H - 4, W, 4, C.darkWood)
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

/** Gothic wall clock; the pendulum swings in `clockPendulum`. */
export function wallClock(p: Pixels, x: number, y: number) {
  const b = brush(p, x, y)
  b.poly([[22, 0], [45, 18], [45, 104], [-1, 104], [-1, 18]], C.black)
  b.poly([[22, 2], [43, 19], [43, 102], [1, 102], [1, 19]], C.darkWood)
  b.line(22, 3, 42, 19, C.wood); b.line(22, 3, 2, 19, C.wood)
  b.r(3, 21, 1, 80, C.wood); b.r(41, 21, 1, 80, C.black)
  b.ell(22, 30, 16, 16, C.brassDark); b.ell(22, 30, 15, 15, C.brass); b.ell(22, 30, 13, 13, C.keyCap)
  b.dith(9, 17, 27, 27, C.keyShade, (i, j) => Math.hypot(i - 13, j - 13) < 13 && i + j > 30 ? .5 : 0)
  for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; b.d(22 + Math.round(Math.sin(a) * 11), 30 - Math.round(Math.cos(a) * 11), k % 3 ? C.brassDark : C.lash) }
  b.line(22, 30, 22, 21, C.lash); b.line(22, 30, 28, 33, C.lash); b.d(22, 30, C.brass)
  b.r(10, 52, 24, 44, C.black); b.r(11, 53, 22, 42, C.shadow); b.line(12, 54, 18, 94, C.slate)
  b.r(-3, 102, 50, 4, C.brassDark); b.r(-3, 102, 50, 1, C.brassLight)
  b.r(19, -4, 7, 6, C.brass); b.d(22, -5, C.brassLight)
}
export function clockPendulum(p: Pixels, x: number, y: number, tick: number) {
  const b = brush(p, x, y), swing = Math.round(Math.sin(tick / 6) * 5)
  b.r(11, 53, 22, 42, C.shadow); b.line(12, 54, 18, 94, C.slate)
  b.line(22, 54, 22 + swing, 84, C.brassDark)
  b.ell(22 + swing, 87, 5, 5, C.brass); b.ell(21 + swing, 86, 2, 2, C.brassLight)
}

/** Pigeonhole letter rack for the call for manuscripts. */
export function letterRack(p: Pixels, x: number, y: number) {
  const b = brush(p, x, y)
  b.r(-3, -3, 106, 92, C.black); b.r(0, 0, 100, 86, C.darkWood); b.r(0, 0, 100, 2, C.wood)
  b.poly([[-4, -3], [50, -14], [104, -3]], C.darkWood); b.line(-4, -3, 50, -14, C.wood)
  for (let row = 0; row < 2; row++) for (let col = 0; col < 3; col++) {
    const cx = 4 + col * 32, cy = 6 + row * 40
    b.r(cx, cy, 28, 36, C.black)
    b.r(cx, cy + 34, 28, 2, C.wood)
    const n = Math.floor(noise(col, row, 17) * 3)
    for (let k = 0; k < n + 1; k++) {
      const ex = cx + 2 + k * 3, ey = cy + 14 - k * 3
      b.r(ex, ey, 22, 20, k % 2 ? C.keyShade : C.keyCap)
      b.poly([[ex, ey], [ex + 11, ey + 8], [ex + 21, ey]], k % 2 ? C.keyCap : '#fff4dc')
      b.r(ex, ey + 19, 22, 1, C.keyShade)
    }
    if (n === 2) { b.ell(cx + 14, cy + 16, 3, 3, C.clothLight); b.d(cx + 13, cy + 15, C.clothShine) }
  }
  b.r(38, 80, 24, 5, C.brass); b.r(38, 80, 24, 1, C.brassLight)
}

/** A plant in a terracotta pot: long leaves with a lit edge. */
export function pottedPlant(p: Pixels, x: number, y: number) {
  const b = brush(p, x, y)
  const leaves: [number, number, number, number, number][] = [
    [30, 50, -26, -50, 7], [34, 50, 4, -64, 6], [36, 50, 30, -46, 7], [30, 52, -36, -18, 6], [38, 52, 40, -14, 6], [33, 50, -8, -40, 5], [35, 50, 16, -30, 5],
  ]
  for (const [bx, by, dx, dy, wid] of leaves) {
    const tipX = bx + dx, tipY = by + dy, nx = -dy / Math.hypot(dx, dy) * wid, ny = dx / Math.hypot(dx, dy) * wid
    const mx = bx + dx * .5, my = by + dy * .5
    b.poly([[bx, by], [mx + nx, my + ny], [tipX, tipY], [mx - nx * .4, my - ny * .4]], C.green)
    b.poly([[bx, by], [mx + nx * .5, my + ny * .5], [tipX, tipY]], C.leaf)
    b.line(bx, by, tipX, tipY, C.greenDark)
    b.line(Math.round(mx + nx * .9), Math.round(my + ny * .9), tipX, tipY, C.leafLight)
  }
  b.poly([[14, 50], [56, 50], [50, 86], [20, 86]], C.terracotta)
  b.r(12, 46, 46, 7, C.terracottaLight); b.r(12, 46, 46, 1, C.fire)
  b.line(16, 54, 22, 84, C.terracottaLight); b.line(52, 54, 48, 84, C.terracottaDark)
  b.ell(35, 88, 22, 3, C.black)
}

// ──── candlelight ────

const FLAME = [
  ['..y..', '.yYy.', '.yWy.', 'yYWYy', 'yYWYy', '.yYy.', '..o..'],
  ['..y..', '..Yy.', '.yWy.', '.YWYy', 'yYWYy', '.yYy.', '..o..'],
  ['.y...', '.yY..', '.yWy.', 'yYWy.', 'yYWYy', '.yYy.', '..o..'],
]
const FLAME_PAL = { y: C.fire, Y: C.flame, W: C.flameCore, o: C.ember }

/** A candle stub; its flame is painted by `flame` so it can flicker. */
function candleStub(b: Brush, a: number, c: number, h: number) {
  b.r(a, c, 6, h, C.keyCap); b.r(a, c, 2, h, '#fff4dc'); b.r(a + 5, c, 1, h, C.keyShade)
  b.r(a + 1, c - 1, 4, 1, C.keyShade); b.d(a + 3, c - 2, C.lash)
  b.r(a + 4, c + 1, 1, 4, '#fff4dc'); b.r(a, c + 3, 1, 5, C.keyShade) // drips
}
function flame(b: Brush, a: number, c: number, tick: number, seed: number) {
  b.spr(a, c, FLAME[Math.floor(noise(Math.floor(tick / 2), seed, 9) * 3)], FLAME_PAL)
}

export const CANDELABRA = { x: 343, y: 150 }
/** Brass candelabra with three candles; `candelabraFlames` animates it. */
export function candelabra(p: Pixels) {
  const b = brush(p, CANDELABRA.x, CANDELABRA.y)
  glowAt(b, 22, 6, 46, C.glow, .45); glowAt(b, 22, 6, 26, C.honey, .35)
  b.ell(22, 90, 16, 3, C.black)
  b.ell(22, 86, 12, 4, C.brassDark); b.ell(22, 85, 11, 3, C.brass); b.r(14, 84, 10, 1, C.brassLight)
  b.r(20, 40, 5, 45, C.brassDark); b.r(20, 40, 2, 45, C.brass); b.r(20, 40, 1, 45, C.brassLight)
  for (const ky of [50, 64, 76]) { b.ell(22, ky, 4, 2, C.brass); b.r(19, ky - 1, 2, 1, C.brassLight) }
  b.line(4, 26, 4, 36, C.brassDark); b.line(40, 26, 40, 36, C.brassDark)
  b.line(4, 36, 22, 44, C.brass); b.line(40, 36, 22, 44, C.brass); b.line(4, 35, 22, 43, C.brassLight)
  for (const cx of [4, 22, 40]) {
    const top = cx === 22 ? 12 : 22
    b.ell(cx, top + 16, 5, 2, C.brass); b.r(cx - 4, top + 15, 3, 1, C.brassLight)
    candleStub(b, cx - 3, top, 16)
  }
}
export function candelabraFlames(p: Pixels, tick: number) {
  const b = brush(p, CANDELABRA.x, CANDELABRA.y)
  flame(b, 2, 14, tick, 1); flame(b, 20, 4, tick, 2); flame(b, 38, 14, tick, 3)
}

export const WALL_CANDLE = { x: 384, y: 100 }
export function wallCandle(p: Pixels) {
  const b = brush(p, WALL_CANDLE.x, WALL_CANDLE.y)
  glowAt(b, 12, 8, 40, C.glow, .5); glowAt(b, 12, 8, 20, C.honey, .3)
  b.r(-6, 38, 40, 5, C.darkWood); b.r(-6, 38, 40, 1, C.wood); b.r(0, 43, 4, 8, C.darkWood); b.r(24, 43, 4, 8, C.darkWood)
  b.ell(12, 36, 8, 2, C.brassDark); b.ell(12, 35, 7, 2, C.brass)
  candleStub(b, 9, 16, 18)
}
export function wallCandleFlame(p: Pixels, tick: number) { flame(brush(p, WALL_CANDLE.x, WALL_CANDLE.y), 10, 7, tick, 4) }

// ──── the desk ────

/** Red tablecloth over the desk with gold embroidery and a pointed hem. */
export function clothDesk(p: Pixels) {
  const b = brush(p, 0, 0)
  const T = 376, L = 184, R = 784, BL = 176, BR = 792, S = 428 // top y, back x's, front x's, surface front y
  b.poly([[L, T], [R, T], [BR, S], [BL, S]], C.cloth)
  b.dith(BL, T, BR - BL, S - T, C.clothLight, (i, j) => Math.max(0, .55 - Math.abs(i - (BR - BL) * .55) / 500) * (j / (S - T)))
  b.line(L + 6, T + 4, R - 6, T + 4, C.brass); b.line(BL + 10, S - 5, BR - 10, S - 5, C.brass)
  b.line(L + 6, T + 4, BL + 10, S - 5, C.brass); b.line(R - 6, T + 4, BR - 10, S - 5, C.brass)
  b.r(BL, S, BR - BL, 2, C.clothShine)
  // Front drape with soft vertical folds.
  b.r(BL, S + 2, BR - BL, 52, C.cloth)
  for (let fx = BL + 20; fx < BR; fx += 44) {
    b.dith(fx - 10, S + 2, 20, 52, C.clothLight, (i) => Math.max(0, 1 - Math.abs(i - 10) / 10) * .6)
    b.dith(fx + 12, S + 2, 12, 52, C.clothDark, (i) => Math.max(0, 1 - Math.abs(i - 6) / 6) * .6)
  }
  // Embroidered band and pointed hem.
  b.r(BL, S + 30, BR - BL, 2, C.brass)
  for (let fx = BL + 8; fx < BR - 6; fx += 16) { b.poly([[fx, S + 38], [fx + 4, S + 34], [fx + 8, S + 38], [fx + 4, S + 42]], C.brass); b.d(fx + 4, S + 38, C.brassLight) }
  b.r(BL, S + 46, BR - BL, 2, C.brass)
  for (let fx = BL; fx < BR; fx += 24) b.poly([[fx, S + 54], [fx + 24, S + 54], [fx + 12, S + 68]], C.clothDark)
  for (let fx = BL; fx < BR; fx += 24) { b.line(fx, S + 54, fx + 12, S + 68, C.brass); b.line(fx + 24, S + 54, fx + 12, S + 68, C.brass); b.d(fx + 12, S + 69, C.brassLight) }
  b.dith(BL, S + 70, BR - BL, 12, C.black, (_, j) => .6 - j * .05)
}

export const INBOX = { x: 116, y: 170 }
/** Wooden in-tray; the stack grows with pending manuscripts (up to ten sheets). */
export function inTray(p: Pixels, count: number) {
  const b = brush(p, INBOX.x, INBOX.y)
  b.ell(48, 50, 50, 4, C.clothDark)
  b.r(2, 22, 92, 26, C.darkWood); b.r(2, 22, 92, 1, C.wood)
  const pages = Math.min(10, Math.max(0, count))
  for (let i = 0; i < pages; i++) {
    const px = 12 + (i % 3) * 2 - (i % 2), py = 38 - i * 3
    b.r(px, py, 72, 3, i % 2 ? C.keyShade : C.keyCap)
    b.r(px, py, 72, 1, '#fff4dc'); b.r(px + 71, py, 1, 3, C.keyShade)
  }
  if (pages) {
    const ty = 38 - (pages - 1) * 3
    for (let k = 0; k < 3; k++) b.r(20, ty + 1 + k, 30 - k * 8, 1, C.keyShade)
    b.ell(66, ty + 1, 3, 2, C.clothLight); b.d(65, ty, C.clothShine)
  }
  b.poly([[0, 34], [96, 34], [94, 48], [2, 48]], C.wood)
  b.r(0, 34, 96, 1, C.honey); b.r(2, 47, 92, 1, C.black)
  b.r(40, 39, 16, 5, C.brass); b.r(40, 39, 16, 1, C.brassLight); b.r(44, 41, 8, 1, C.brassDark)
}

/** Ink bottle and quill. */
export function inkAndQuill(p: Pixels, x: number, y: number) {
  const b = brush(p, x, y)
  b.ell(12, 46, 12, 3, C.clothDark)
  b.poly([[4, 30], [20, 30], [22, 44], [2, 44]], C.lash); b.r(8, 26, 8, 5, C.lash); b.r(7, 25, 10, 2, C.brass)
  b.line(5, 32, 4, 42, C.slate); b.d(6, 31, C.steel)
  b.line(12, 26, 26, -20, C.keyShade)
  b.poly([[14, 14], [22, -14], [28, -22], [26, -6], [18, 16]], C.keyCap)
  b.line(14, 14, 27, -21, C.keyShade)
  for (let k = 0; k < 6; k++) b.line(16 + k * 2, 10 - k * 5, 20 + k * 2, 6 - k * 5, '#fff4dc')
}

export const TYPEWRITER = { x: 200, y: 157 }
const typewriterFrames = new Map<number, Uint8Array>()
function typewriterFrame(i: number) {
  let px = typewriterFrames.get(i)
  if (!px) {
    const bin = atob(TYPEWRITER_SPRITE.frames[i])
    px = new Uint8Array(TYPEWRITER_SPRITE.width * TYPEWRITER_SPRITE.height)
    for (let k = 0, pos = 0; k < bin.length; k += 2) { const n = bin.charCodeAt(k + 1); px.fill(bin.charCodeAt(k), pos, pos + n); pos += n }
    typewriterFrames.set(i, px)
  }
  return px
}
/** The kinotype typewriter, baked to pixels: idle, or striking keys as the carriage steps along. */
export function typewriterFine(p: Pixels, working: boolean, tick = 0) {
  const b = brush(p, TYPEWRITER.x, TYPEWRITER.y), { width: W, height: H, palette } = TYPEWRITER_SPRITE
  b.ell(61, H - 2, 60, 4, C.clothDark)
  const px = typewriterFrame(working ? 1 + Math.floor(tick / 3) % 4 : 0)
  for (let y = 0; y < H; y++) for (let x = 0; x < W;) {
    const v = px[y * W + x]
    let n = 1
    while (x + n < W && px[y * W + x + n] === v) n++
    if (v) b.r(x, y, n, 1, palette[v])
    x += n
  }
}

export const JOURNAL = { x: 274, y: 182 }
/** The publishing log lying open, with a ribbon and a bat doodle. */
export function openJournal(p: Pixels) {
  const b = brush(p, JOURNAL.x, JOURNAL.y)
  b.ell(50, 36, 52, 4, C.clothDark)
  b.poly([[4, 8], [50, 12], [96, 8], [102, 32], [50, 36], [-2, 32]], C.redDark)
  b.poly([[6, 4], [48, 9], [48, 32], [2, 28]], C.keyCap)
  b.poly([[52, 9], [94, 4], [98, 28], [52, 32]], '#fff4dc')
  b.line(6, 4, 48, 9, C.keyShade); b.line(52, 9, 94, 4, C.keyShade)
  b.dith(40, 8, 12, 25, C.keyShade, (i) => Math.max(0, 1 - Math.abs(i - 10) / 10) * .8)
  for (let k = 0; k < 5; k++) { b.line(10, 11 + k * 4, 40 - (k * 7) % 16, 13 + k * 4, C.keyShade); b.line(58, 12 + k * 4, 88 - (k * 11) % 20, 10 + k * 4, C.keyShade) }
  b.spr(70, 24, ['s.....s', 'ss.s.ss', '.sssss.', '..s.s..'], { s: C.lash })
  b.line(50, 32, 52, 46, C.clothLight); b.line(51, 32, 53, 46, C.clothShine); b.poly([[50, 46], [54, 46], [52, 49]], C.clothLight)
}

export const TEACUP = { x: 364, y: 182 }
/** Porcelain cup and saucer; steam is animated separately. */
export function teacupFine(p: Pixels) {
  const b = brush(p, TEACUP.x, TEACUP.y)
  b.ell(22, 30, 22, 4, C.clothDark)
  b.ell(22, 27, 20, 4, C.keyShade); b.ell(22, 26, 18, 3, C.keyCap); b.r(10, 24, 12, 1, '#fff4dc')
  b.ell(40, 15, 5, 5, C.keyCap); b.ell(40, 15, 3, 3, C.cloth); b.ell(40, 15, 2, 2, C.clothDark)
  b.poly([[6, 8], [36, 8], [32, 25], [10, 25]], C.keyCap)
  b.dith(6, 8, 30, 17, C.keyShade, (i) => Math.max(0, (i - 14) / 18))
  b.r(8, 9, 2, 14, '#fff4dc')
  b.r(6, 7, 31, 2, C.brass); b.r(6, 7, 31, 1, C.brassLight)
  b.ell(21, 7, 14, 2, C.tea); b.r(14, 6, 6, 1, C.fire)
  b.ell(20, 16, 3, 3, C.clothLight); b.d(19, 15, C.clothShine); b.d(24, 18, C.leaf); b.d(16, 18, C.leaf)
}
export function teaSteam(p: Pixels, tick: number) {
  const b = brush(p, TEACUP.x, TEACUP.y)
  for (let i = 0; i < 3; i++) {
    const age = (tick + i * 9) % 30
    if (age < 22) b.r(16 + i * 5 + Math.round(Math.sin((age + i * 3) / 3) * 2), 2 - Math.floor(age * .9), 1, 2, age < 12 ? C.keyShade : C.slate)
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
