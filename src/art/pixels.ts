/** Integer rasterizer. No vector antialiasing, image assets, or runtime randomness. */
export const WIDTH = 480
export const HEIGHT = 270
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
} as const

const packed = new Map<string, number>()
const grades = new Map<number, Uint32Array>()
const littleEndian = new Uint8Array(new Uint32Array([1]).buffer)[0] === 1
function color(value: string) {
  let result = packed.get(value)
  if (result === undefined) {
    const rgb = parseInt(value.slice(1), 16)
    const r = rgb >>> 16, g = (rgb >>> 8) & 255, b = rgb & 255
    result = littleEndian ? (0xff000000 | b << 16 | g << 8 | r) >>> 0 : (r << 24 | g << 16 | b << 8 | 255) >>> 0
    packed.set(value, result)
  }
  return result
}

export function noise(x: number, y: number, seed = 0) {
  let n = Math.imul(x + seed * 31, 374761393) ^ Math.imul(y + 17, 668265263)
  n = Math.imul(n ^ n >>> 13, 1274126177)
  return ((n ^ n >>> 16) >>> 0) / 4294967296
}

export class Pixels {
  readonly data: Uint32Array
  readonly width: number
  readonly height: number
  constructor(width = WIDTH, height = HEIGHT, source?: Uint32Array) {
    this.width = width
    this.height = height
    this.data = source ? source.slice() : new Uint32Array(width * height).fill(color(INK.void))
  }
  dot(x: number, y: number, c: string) { this.rect(x, y, 1, 1, c) }
  rect(x: number, y: number, w: number, h: number, c: string) {
    const x0 = Math.max(0, Math.round(x)), y0 = Math.max(0, Math.round(y))
    const x1 = Math.min(this.width, Math.round(x + w)), y1 = Math.min(this.height, Math.round(y + h))
    if (x1 <= x0 || y1 <= y0) return
    const rgba = color(c)
    for (let j = y0; j < y1; j++) this.data.fill(rgba, j * this.width + x0, j * this.width + x1)
  }
  line(x0: number, y0: number, x1: number, y1: number, c: string) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1)
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1
    let error = dx + dy
    while (true) {
      this.dot(x0, y0, c)
      if (x0 === x1 && y0 === y1) break
      const twice = error * 2
      if (twice >= dy) { error += dy; x0 += sx }
      if (twice <= dx) { error += dx; y0 += sy }
    }
  }
  ellipse(cx: number, cy: number, rx: number, ry: number, c: string) {
    for (let y = Math.ceil(cy - ry); y <= Math.floor(cy + ry); y++) {
      const dx = Math.floor(rx * Math.sqrt(Math.max(0, 1 - ((y - cy) / ry) ** 2)))
      this.rect(cx - dx, y, dx * 2 + 1, 1, c)
    }
  }
  polygon(points: readonly (readonly [number, number])[], c: string) {
    const low = Math.max(0, Math.floor(Math.min(...points.map(p => p[1]))))
    const high = Math.min(this.height - 1, Math.ceil(Math.max(...points.map(p => p[1]))))
    for (let y = low; y <= high; y++) {
      const crossings: number[] = []
      for (let i = 0; i < points.length; i++) {
        const a = points[i], b = points[(i + 1) % points.length]
        if ((a[1] <= y && b[1] > y) || (b[1] <= y && a[1] > y)) crossings.push(a[0] + (y - a[1]) * (b[0] - a[0]) / (b[1] - a[1]))
      }
      crossings.sort((a, b) => a - b)
      for (let i = 0; i + 1 < crossings.length; i += 2) this.rect(Math.ceil(crossings[i]), y, Math.floor(crossings[i + 1]) - Math.ceil(crossings[i]) + 1, 1, c)
    }
  }
  frame(x: number, y: number, w: number, h: number, c: string) {
    this.rect(x, y, w, 1, c); this.rect(x, y + h - 1, w, 1, c)
    this.rect(x, y, 1, h, c); this.rect(x + w - 1, y, 1, h, c)
  }
  texture(x: number, y: number, w: number, h: number, c: string, density: number, seed = 0) {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (noise(i, j, seed) < density) this.dot(i, j, c)
  }
  /** Ordered, palette-only shading. It never introduces interpolated colours. */
  glow(cx: number, cy: number, rx: number, ry: number, c: string, density = 0.2) {
    const threshold = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5]
    for (let y = Math.max(0, cy - ry); y <= Math.min(this.height - 1, cy + ry); y++) {
      for (let x = Math.max(0, cx - rx); x <= Math.min(this.width - 1, cx + rx); x++) {
        const d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2
        if (d < 1 && threshold[(y & 3) * 4 + (x & 3)] / 16 < (1 - d) * density) this.dot(x, y, c)
      }
    }
  }
  shade(mask: Uint8Array) {
    for (let i = 0; i < this.data.length; i++) {
      const source = this.data[i]
      let ramp = grades.get(source)
      if (!ramp) {
        const r = littleEndian ? source & 255 : source >>> 24
        const g = littleEndian ? source >>> 8 & 255 : source >>> 16 & 255
        const b = littleEndian ? source >>> 16 & 255 : source >>> 8 & 255
        ramp = new Uint32Array(6)
        for (let k = 0; k < 6; k++) {
          const factor = [.5, .72, 1, 1.08, 1.18, 1.8][k]
          const warm = [0, 0, 0, 6, 13, 0][k]
          const cool = k === 5 ? 40 : 0 // level 5 is a lightning flash
          const rgb = [Math.min(255, Math.round(r * factor + warm)), Math.min(255, Math.round(g * factor + warm * .45 + cool * .6)), Math.min(255, Math.round(b * factor + cool))]
          ramp[k] = color('#' + rgb.map(v => v.toString(16).padStart(2, '0')).join(''))
        }
        grades.set(source, ramp)
      }
      this.data[i] = ramp[mask[i]]
    }
  }
  imageData() {
    const image = new ImageData(this.width, this.height)
    image.data.set(new Uint8Array(this.data.buffer))
    return image
  }
}
