import { Pixels, UNIT } from './pixels'

/**
 * Pixel frames baked from 3D models by scripts/bake (`npm run art:bake`).
 * Palette index 0 is transparent and 1 is the outline. Each frame is base64 of
 * [paletteIndex, runLength] byte pairs in row-major order. Anchors are native-pixel
 * points inside the sprite (candle wicks, the cup rim…) for effects drawn on top.
 */
export interface BakedSprite {
  width: number
  height: number
  palette: readonly string[]
  frames: readonly string[]
  anchors?: Readonly<Record<string, readonly [number, number]>>
}

const decoded = new WeakMap<BakedSprite, Uint8Array[]>()
export function spriteFrame(s: BakedSprite, i: number) {
  let all = decoded.get(s)
  if (!all) decoded.set(s, all = [])
  let px = all[i]
  if (!px) {
    const bin = atob(s.frames[i])
    px = all[i] = new Uint8Array(s.width * s.height)
    for (let k = 0, pos = 0; k < bin.length; k += 2) { const n = bin.charCodeAt(k + 1); px.fill(bin.charCodeAt(k), pos, pos + n); pos += n }
  }
  return px
}

/** Paint frame `i` with its top-left corner at layout point (x, y). */
export function drawSprite(p: Pixels, s: BakedSprite, x: number, y: number, i = 0) {
  const px = spriteFrame(s, Math.min(i, s.frames.length - 1)), W = s.width
  const X = Math.round(x * UNIT), Y = Math.round(y * UNIT)
  // Small sprites are lit as one surface; large ones (desk, bookcases) keep the room's light pool.
  const prev = p.mark
  if (p.baked && W * s.height < 20000 && p.bakedCount < 255) p.mark = ++p.bakedCount
  p.fine(() => {
    for (let row = 0; row < s.height; row++) for (let col = 0; col < W;) {
      const v = px[row * W + col]
      let n = 1
      while (col + n < W && px[row * W + col + n] === v) n++
      if (v) p.rect(X + col, Y + row, n, 1, s.palette[v])
      col += n
    }
  })
  p.mark = prev
}

/** Layout-grid position of a sprite anchor when the sprite is drawn at (x, y). */
export const anchorAt = (s: BakedSprite, name: string, x: number, y: number) => {
  const a = s.anchors?.[name] ?? [0, 0]
  return [x + a[0] / UNIT, y + a[1] / UNIT] as const
}
