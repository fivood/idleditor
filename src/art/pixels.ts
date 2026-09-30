/** Integer rasterizer. No vector antialiasing, image assets, or runtime randomness. */
export const WIDTH = 960
export const HEIGHT = 540
/** Rooms are composed on a 480×270 layout grid; one layout unit is UNIT native pixels. */
export const UNIT = 2
export const INK = {
  void: '#100f19', black: '#17131c', shadow: '#211b24', darkWood: '#2c2028', wood: '#463038',
  warmWood: '#624133', grain: '#80543b', copper: '#a77349', honey: '#c89659', gold: '#e1b772',
  cream: '#f5deb0', paper: '#d8c399', paperShade: '#aa967c', slate: '#384452', metal: '#5e727a',
  steel: '#93a2a1', sky: '#17243f', blue: '#243657', haze: '#354d73', moon: '#b6d4d5',
  blueLight: '#6482a0', roof: '#1d293f', stone: '#34405b', stoneLight: '#485776',
  redDark: '#321d2c', red: '#572b3b', rose: '#81424a', redLight: '#a95e60',
  greenDark: '#203832', green: '#365044', leaf: '#557455', leafLight: '#82916a',
  teal: '#335957', plum: '#594965', bookBlue: '#435a77', amber: '#ba824c',
  wall: '#262639', wallLight: '#2f2f47', wallDot: '#3d3c58',
  skin: '#d1a487', pale: '#e6dfda', peach: '#efd0b8', paleShade: '#b9aaa6', skinShade: '#a4735f', silver: '#a9a7b2', ember: '#c9552e', fire: '#ee8c3a',
  // Portrait inks: the Countess's velvet and hair, the Editor's hat, bow and lacing.
  velvetDark: '#6a1a26', velvet: '#9a2632', velvetLight: '#c23a42',
  hairDark: '#3a2c2c', hair: '#5e4a46', hairLight: '#8c7670', hairShine: '#b09a90',
  lilac: '#6e6c8c', lilacLight: '#9a98b8', navy: '#20243e', plaid: '#2e2e3a', plaidLight: '#4a4a5c',
  brow: '#4a3a2a', bangs: '#6a4630', bangsLight: '#946848', lash: '#120c10',
  // Editor's room, after the original bitmap scene: brick, red cloth, brass, gothic night.
  brick: '#3b2622', brickLight: '#533530', brickDark: '#2a1a1a', mortar: '#1a1115',
  cloth: '#62161e', clothLight: '#7e2226', clothDark: '#3c0e16', clothShine: '#a8403a',
  brass: '#b8863a', brassLight: '#ecc576', brassDark: '#6a4622',
  skyDeep: '#10163a', skyMid: '#1b2656', skyLight: '#2c3d7a', spire: '#0b0d22', spireMid: '#141a3e', spireFar: '#1f2958', castle: '#1a0c10',
  typeBody: '#1f4c4a', typeLight: '#3e7c76', typeDark: '#10292a', keyCap: '#efe2c4', keyShade: '#b3a386',
  flame: '#ffd27a', flameCore: '#fff6d6', glow: '#6e3e2c', catFur: '#15121a', catRim: '#56669a',
  terracotta: '#9a4a32', terracottaLight: '#c26a44', terracottaDark: '#5e2a20', tea: '#6a3418',
  hat: '#101116', hatSheen: '#2c3140', bow: '#ece6dc', bowShade: '#b2aca4', eyeRed: '#c42a2a', tealLight: '#4f8f86', charcoal: '#2a2a2e',
} as const

const packed = new Map<string, number>()
const grades = new Map<number, Uint32Array>()
const littleEndian = new Uint8Array(new Uint32Array([1]).buffer)[0] === 1
export function packColor(value: string) {
  let result = packed.get(value)
  if (result === undefined) {
    const rgb = parseInt(value.slice(1), 16)
    const r = rgb >>> 16, g = (rgb >>> 8) & 255, b = rgb & 255
    result = littleEndian ? (0xff000000 | b << 16 | g << 8 | r) >>> 0 : (r << 24 | g << 16 | b << 8 | 255) >>> 0
    packed.set(value, result)
  }
  return result
}
const color = packColor

export function noise(x: number, y: number, seed = 0) {
  let n = Math.imul(x + seed * 31, 374761393) ^ Math.imul(y + 17, 668265263)
  n = Math.imul(n ^ n >>> 13, 1274126177)
  return ((n ^ n >>> 16) >>> 0) / 4294967296
}

export class Pixels {
  readonly data: Uint32Array
  readonly width: number
  readonly height: number
  /** Which object owns each visible pixel (0 = none); drives hover outlines and clicks. */
  readonly tags: Uint8Array | null
  /** Drawing unit: 1 = native pixels (detail work), UNIT = room layout grid. Shapes always rasterise at native resolution. */
  s = 1
  /** Object id stamped by every draw call while set. */
  tag = 0
  /** Record tags only, leave colours alone (for objects that are painted later, every frame). */
  ghost = false
  /** Which baked sprite owns each pixel (0 = none); lets lighting treat a sprite as one surface. */
  readonly baked: Uint8Array | null
  /** Sprite id stamped by draw calls while set; see drawSprite. */
  mark = 0
  bakedCount = 0
  /** Where the 960×540 core room sits on a larger (or smaller) canvas, in native pixels. */
  OX = 0
  OY = 0
  constructor(width = WIDTH, height = HEIGHT, source?: Uint32Array, tagged = false) {
    this.width = width
    this.height = height
    this.data = source ? source.slice() : new Uint32Array(width * height).fill(color(INK.void))
    this.tags = tagged ? new Uint8Array(width * height) : null
    this.baked = tagged ? new Uint8Array(width * height) : null
  }
  private span(x0: number, x1: number, y: number, rgba: number) {
    if (y < 0 || y >= this.height) return
    x0 = Math.max(0, x0); x1 = Math.min(this.width, x1)
    if (x1 <= x0) return
    const row = y * this.width
    if (!this.ghost) this.data.fill(rgba, row + x0, row + x1)
    if (this.tags) this.tags.fill(this.tag, row + x0, row + x1)
    if (this.baked) this.baked.fill(this.mark, row + x0, row + x1)
  }
  /** Draw in native pixels regardless of the current unit. */
  fine(draw: () => void) {
    const s = this.s
    this.s = 1
    try { draw() } finally { this.s = s }
  }
  dot(x: number, y: number, c: string) { this.rect(x, y, 1, 1, c) }
  rect(x: number, y: number, w: number, h: number, c: string) {
    const k = this.s
    const x0 = Math.round(x * k) + this.OX, y0 = Math.max(0, Math.round(y * k) + this.OY)
    const x1 = Math.round((x + w) * k) + this.OX, y1 = Math.min(this.height, Math.round((y + h) * k) + this.OY)
    if (x1 <= x0 || y1 <= y0) return
    const rgba = color(c)
    for (let j = y0; j < y1; j++) this.span(x0, x1, j, rgba)
  }
  line(x0: number, y0: number, x1: number, y1: number, c: string) {
    const k = this.s
    // Stepped at native resolution with a unit-wide brush: diagonals stay smooth, weight stays the same.
    x0 = Math.round(x0 * k) + this.OX; y0 = Math.round(y0 * k) + this.OY; x1 = Math.round(x1 * k) + this.OX; y1 = Math.round(y1 * k) + this.OY
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1
    const rgba = color(c)
    let error = dx + dy
    while (true) {
      for (let j = 0; j < k; j++) this.span(x0, x0 + k, y0 + j, rgba)
      if (x0 === x1 && y0 === y1) break
      const twice = error * 2
      if (twice >= dy) { error += dy; x0 += sx }
      if (twice <= dx) { error += dx; y0 += sy }
    }
  }
  ellipse(cx: number, cy: number, rx: number, ry: number, c: string) {
    const rgba = color(c)
    if (this.s === 1) {
      for (let y = Math.ceil(cy - ry); y <= Math.floor(cy + ry); y++) {
        const dx = Math.floor(rx * Math.sqrt(Math.max(0, 1 - ((y - cy) / ry) ** 2)))
        this.span(Math.round(cx - dx) + this.OX, Math.round(cx + dx) + 1 + this.OX, y + this.OY, rgba)
      }
      return
    }
    const k = this.s, Cx = (cx + .5) * k + this.OX, Cy = (cy + .5) * k + this.OY, Rx = (rx + .5) * k, Ry = (ry + .5) * k
    for (let y = Math.ceil(Cy - Ry - .5); y <= Math.floor(Cy + Ry - .5); y++) {
      const t = (y + .5 - Cy) / Ry, dx = Rx * Math.sqrt(Math.max(0, 1 - t * t))
      this.span(Math.ceil(Cx - dx - .5), Math.floor(Cx + dx - .5) + 1, y, rgba)
    }
  }
  polygon(points: readonly (readonly [number, number])[], c: string) {
    // Vertices sit on layout-pixel centres; h widens edges by half a layout pixel so polygons meet rects flush.
    const k = this.s, h = (k - 1) / 2, rgba = color(c)
    const pts = points.map(([x, y]) => [(x + .5) * k + this.OX, (y + .5) * k + this.OY] as const)
    const top = Math.min(...pts.map(p => p[1])), bottom = Math.max(...pts.map(p => p[1]))
    const low = Math.max(0, Math.ceil(top - .5 - h)), high = Math.min(this.height - 1, Math.floor(bottom + h - .5))
    for (let y = low; y <= high; y++) {
      const yc = h ? Math.min(Math.max(y + .5, top), bottom - 1e-6) : y + .5
      const crossings: number[] = []
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i], b = pts[(i + 1) % pts.length]
        if ((a[1] <= yc && b[1] > yc) || (b[1] <= yc && a[1] > yc)) crossings.push(a[0] + (yc - a[1]) * (b[0] - a[0]) / (b[1] - a[1]))
      }
      crossings.sort((a, b) => a - b)
      for (let i = 0; i + 1 < crossings.length; i += 2) this.span(Math.ceil(crossings[i] - .5 - h), Math.floor(crossings[i + 1] - .5 + h) + 1, y, rgba)
    }
  }
  frame(x: number, y: number, w: number, h: number, c: string) {
    this.rect(x, y, w, 1, c); this.rect(x, y + h - 1, w, 1, c)
    this.rect(x, y, 1, h, c); this.rect(x + w - 1, y, 1, h, c)
  }
  /** Fixed-seed grain, always at native resolution. */
  texture(x: number, y: number, w: number, h: number, c: string, density: number, seed = 0) {
    const k = this.s, rgba = color(c)
    for (let j = Math.round(y * k); j < Math.round((y + h) * k); j++) for (let i = Math.round(x * k); i < Math.round((x + w) * k); i++) {
      if (noise(i, j, seed) < density) this.span(i + this.OX, i + 1 + this.OX, j + this.OY, rgba)
    }
  }
  /** Ordered, palette-only shading. It never introduces interpolated colours. */
  glow(cx: number, cy: number, rx: number, ry: number, c: string, density = 0.2) {
    const threshold = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5]
    const k = this.s, Cx = (cx + .5) * k + this.OX, Cy = (cy + .5) * k + this.OY, Rx = rx * k, Ry = ry * k, rgba = color(c)
    for (let y = Math.max(0, Math.floor(Cy - Ry)); y <= Math.min(this.height - 1, Math.ceil(Cy + Ry)); y++) {
      for (let x = Math.max(0, Math.floor(Cx - Rx)); x <= Math.min(this.width - 1, Math.ceil(Cx + Rx)); x++) {
        const d = ((x + .5 - Cx) / Rx) ** 2 + ((y + .5 - Cy) / Ry) ** 2
        if (d < 1 && threshold[(y & 3) * 4 + (x & 3)] / 16 < (1 - d) * density) this.span(x, x + 1, y, rgba)
      }
    }
  }
  shade(mask: Uint8Array) {
    let last = -1, lastRamp: Uint32Array | undefined
    for (let i = 0; i < this.data.length; i++) {
      const source = this.data[i]
      let ramp = source === last ? lastRamp : grades.get(source)
      if (!ramp) {
        const r = littleEndian ? source & 255 : source >>> 24
        const g = littleEndian ? source >>> 8 & 255 : source >>> 16 & 255
        const b = littleEndian ? source >>> 16 & 255 : source >>> 8 & 255
        ramp = new Uint32Array(6)
        for (let k = 0; k < 6; k++) {
          const factor = [.5, .72, 1, 1.08, 1.18, 1.8][k]
          const warm = [0, 0, 0, 6, 13, 0][k]
          const cool = k === 5 ? 40 : 0 // level 5 is a lightning flash
          const violet = [10, 5, 0, 0, 0, 0][k] // shadows lean violet, lamplight leans amber
          const rgb = [Math.min(255, Math.round(r * factor + warm + violet * .3)), Math.min(255, Math.round(g * factor + warm * .45 + cool * .6)), Math.min(255, Math.round(b * factor + cool + violet))]
          ramp[k] = color('#' + rgb.map(v => v.toString(16).padStart(2, '0')).join(''))
        }
        grades.set(source, ramp)
      }
      last = source; lastRamp = ramp
      this.data[i] = ramp[mask[i]]
    }
  }
  imageData() {
    const image = new ImageData(this.width, this.height)
    image.data.set(new Uint8Array(this.data.buffer))
    return image
  }
}
