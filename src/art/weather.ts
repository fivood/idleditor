import { INK as C, noise, Pixels } from './pixels'
import type { RoomKind } from './rooms'
import type { Weather } from '@/core/weather'

/** Glass area of each room's night window: [x, y, w, h]. */
export type Rect = readonly [number, number, number, number]
export const WINDOWS: Partial<Record<RoomKind, Rect>> = {
  desk: [147, 29, 199, 123], shelf: [25, 43, 64, 65], study: [27, 39, 116, 88], office: [165, 24, 150, 42],
}

/** Mullions and transom, drawn last so weather always passes behind the frame. */
export function windowBars(p: Pixels, x: number, y: number, w: number, h: number) {
  for (const xx of [x, x + Math.floor(w / 3), x + Math.floor(w * 2 / 3), x + w - 2]) { p.rect(xx, y, 3, h, C.warmWood); p.rect(xx, y, 1, h, C.honey) }
  p.rect(x, y + Math.floor(h / 2), w, 4, C.darkWood)
  p.rect(x, y + Math.floor(h / 2), w, 1, C.honey)
}

/** Lightning in 14-tick slots: strong, dim, strong, then dark. */
export function lightning(tick: number) {
  const slot = Math.floor(tick / 14), phase = tick % 14
  const strikes = noise(slot, 5, 91) < .24
  return { slot, level: !strikes ? 0 : phase === 0 || phase === 2 ? 2 : phase === 1 ? 1 : 0 }
}

/** `source` is the untouched cached frame: drops on the glass refract it, never the rain itself. */
export function drawWeather(p: Pixels, [x, y, w, h]: Rect, kind: Weather, tick: number, ramp = 1, source: Uint32Array = p.data) {
  const box = (bx: number, by: number, bw: number, bh: number, c: string) => {
    const x0 = Math.max(x, bx), y0 = Math.max(y, by), x1 = Math.min(x + w, bx + bw), y1 = Math.min(y + h, by + bh)
    if (x1 > x0 && y1 > y0) p.rect(x0, y0, x1 - x0, y1 - y0, c)
  }
  // Native-resolution box, clipped to the glass: rain, snow and drops use it for finer strokes.
  const U = p.s, FX = x * U, FY = y * U, FW = w * U, FH = h * U
  const fbox = (bx: number, by: number, bw: number, bh: number, c: string) => {
    const x0 = Math.max(FX, bx), y0 = Math.max(FY, by), x1 = Math.min(FX + FW, bx + bw), y1 = Math.min(FY + FH, by + bh)
    if (x1 > x0 && y1 > y0) p.fine(() => p.rect(x0, y0, x1 - x0, y1 - y0, c))
  }
  const wrap = (v: number, m: number) => ((v % m) + m) % m
  const scale = Math.max(w / 199, .4) // particle counts follow glass area

  const rain = (count: number, speed: number, slant: number, length: number, colors: string[]) => {
    for (let i = 0; i < count * 1.4 * scale * ramp; i++) {
      const fall = wrap(i * 37 + tick * (speed + i % 3), h + length)
      const px = x + wrap(i * 61 - Math.floor(fall * slant), w)
      for (let k = 0; k < length * U; k++) fbox(px * U + Math.floor(k * slant), (y + fall - length) * U + k, 1, 1, colors[i % colors.length])
    }
  }
  // Beaded drops act as tiny lenses: the city behind them appears upside down, magnified, and a few drops slide.
  const beads = (count: number, trails: boolean) => {
    for (let i = 0; i < Math.ceil(count * scale) * ramp; i++) {
      const period = 150 + (i % 5) * 41, run = 24 + (i % 4) * 7
      const slide = Math.max(0, wrap(tick + i * 53, period) - (period - run))
      const rx = 3 + (i % 2), ry = 4 + (i % 2)
      const cx = x + 8 + Math.floor(noise(i, 7, 33) * (w - 16)), top = y + 8 + Math.floor(noise(i, 8, 33) * Math.max(1, h - 44))
      const cy = top + Math.floor(slide * 1.1)
      const Cx = (cx + .5) * U, Cy = (cy + .5) * U, Rx = (rx + .5) * U, Ry = (ry + .5) * U, W = p.width
      if (trails && slide > 0) for (let k = 0; k < slide * 1.1 * U; k += 3) fbox(Math.floor(Cx), (top + .5) * U + k, 1, 2, C.blueLight)
      for (let fy = Math.floor(Cy - Ry); fy <= Math.ceil(Cy + Ry); fy++) for (let fx = Math.floor(Cx - Rx); fx <= Math.ceil(Cx + Rx); fx++) {
        const dx = fx + .5 - Cx, dy = fy + .5 - Cy
        if ((dx / Rx) ** 2 + (dy / Ry) ** 2 > 1 || fx < FX || fx >= FX + FW || fy < FY || fy >= FY + FH) continue
        if ((dx / (Rx - 1.3)) ** 2 + (dy / (Ry - 1.3)) ** 2 > 1) { fbox(fx, fy, 1, 1, dx + dy < 0 ? C.steel : C.black); continue } // rim: lit upper left, shadowed lower right
        const sx = Math.min(FX + FW - 1, Math.max(FX, Math.round(Cx - dx * 3))), sy = Math.min(FY + FH - 1, Math.max(FY, Math.round(Cy - dy * 3)))
        p.data[fy * W + fx] = source[sy * W + sx]
      }
      fbox(Math.round(Cx - Rx * .45), Math.round(Cy - Ry * .55), 1, 2, C.moon)   // specular highlight
    }
  }
  const drips = () => {
    for (let i = 0; i < 4; i++) {
      const px = x + 10 + (i * 47) % Math.max(1, w - 20), py = y + wrap(tick + i * 29, h + 20) - 10
      box(px, py - 5, 1, 3, C.blueLight); box(px, py - 1, 1, 2, C.moon)
    }
  }

  if (kind === 'clear') {
    for (let i = 0; i < 30 * scale; i++) {
      if ((Math.floor(tick / 4) + i * 5) % 9 === 0) box(x + Math.floor(noise(i, 3, 12) * w), y + Math.floor(noise(i, 4, 12) * h * .45), 1, 1, C.moon)
    }
    const s = tick % 220 // an occasional shooting star
    if (s < 9 && w > 100) for (let k = 0; k < 6; k++) box(x + Math.floor(w * .72) - s * 3 - k * 2, y + Math.floor(h * .08) + s * 2 + k, 1, 1, k ? C.blueLight : C.moon)
  } else if (kind === 'drizzle') {
    rain(95, 2, .15, 4, [C.blueLight, C.steel])
    beads(10, true)
    drips()
  } else if (kind === 'storm') {
    rain(170, 3, .5, 6, [C.steel, C.blueLight])
    beads(16, true)
    drips()
  } else if (kind === 'snow') {
    for (let i = 0; i < 170 * scale * ramp; i++) {
      const near = i % 3 === 0
      const py = y + wrap(i * 29 + Math.floor(tick * (near ? .6 : .35)), h)
      const px = x + wrap(i * 53 + Math.round(Math.sin(tick / 9 + i) * 3), w)
      fbox(px * U, py * U, near ? 3 : 2, near ? 3 : 2, near ? C.cream : C.steel)
    }
    // Snow settles on the outside sill.
    p.rect(x - 5, y + h + 2, w + 10, 2, C.moon); p.rect(x - 3, y + h + 1, w + 6, 1, C.cream)
  } else if (kind === 'fog') {
    beads(5, false)
    for (let py = y; py < y + h; py++) {
      const density = (.2 + (py - y) / h * .6) * ramp
      const drift = Math.floor(tick / (3 + (py >> 3) % 3)) * ((py >> 3) % 2 ? 1 : -1)
      for (let px = x; px < x + w; px++) {
        if (((px + py) & 1) === 0 && noise((px + drift) >> 3, py >> 2, 9) < density) box(px, py, 1, 1, py % 6 < 3 ? C.blueLight : C.haze)
      }
    }
  } else {
    for (let i = 0; i < 6; i++) {
      const cx = x + wrap(i * 97 - Math.floor(tick * (1 + i % 3) * .9), w + 60) - 30, cy = y + 6 + (i * 23) % Math.max(4, Math.floor(h * .35))
      const cloud = i % 2 ? C.haze : C.stone
      for (const [dx, dy, rx, ry] of [[0, 0, 12, 4], [-9, 2, 8, 3], [10, 2, 9, 3]]) {
        for (let yy = -ry; yy <= ry; yy++) {
          const half = Math.floor(rx * Math.sqrt(1 - (yy / ry) ** 2))
          box(cx + dx - half, cy + dy + yy, half * 2 + 1, 1, cloud)
        }
      }
    }
    for (let i = 0; i < 8 * scale; i++) {
      const gust = wrap(tick * 3 + i * 41, w + 30) - 15
      box(x + w - gust, y + 8 + (i * 17) % Math.max(1, h - 16), 4 + i % 3 * 2, 1, C.steel)
    }
  }
  windowBars(p, x, y, w, h)
  if (kind === 'storm') {
    const strike = lightning(tick)
    if (strike.level === 2) {
      let bx = x + 12 + Math.floor(noise(strike.slot, 1, 77) * (w - 24)), by = y
      const ground = y + Math.floor(h * .58)
      while (by < ground) {
        const nx = bx + Math.round((noise(by, strike.slot, 78) - .5) * 12), ny = Math.min(ground, by + 6 + Math.floor(noise(by, strike.slot, 79) * 6))
        p.line(nx, ny, bx, by, C.moon)
        if (nx !== bx) p.line(nx + 1, ny, bx + 1, by, C.moon)
        bx = nx; by = ny
      }
    }
  }
}
