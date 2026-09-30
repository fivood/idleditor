import { INK as C, noise, Pixels } from './pixels'

/**
 * Pixel-art UI skin: nine-slice frames drawn with the scene's rasteriser and palette, installed as CSS
 * custom properties (`--ui-*`) and used through `border-image` in index.css. Every image is tiny; CSS
 * scales it by an integer (see --ui-px) with `image-rendering: pixelated`.
 */

const blank = (w: number, h: number) => { const p = new Pixels(w, h); p.data.fill(0); return p }
const ring = (p: Pixels, i: number, c: string) => p.frame(i, i, p.width - i * 2, p.height - i * 2, c)
/** Lit top/left, shaded bottom/right at inset `i`. */
function bevel(p: Pixels, i: number, light: string, dark: string) {
  const w = p.width - i * 2, h = p.height - i * 2
  p.rect(i, i, w, 1, light); p.rect(i, i, 1, h, light)
  p.rect(i, i + h - 1, w, 1, dark); p.rect(i + w - 1, i, 1, h, dark)
}
/** Knock out the four outermost corner pixels for a rounded silhouette. */
function round(p: Pixels) { for (const [x, y] of [[0, 0], [p.width - 1, 0], [0, p.height - 1], [p.width - 1, p.height - 1]]) p.data[y * p.width + x] = 0 }

/** Panel: dark grained wood with brass corner caps and rivets. 24×24, slice 8. */
function panel() {
  const p = blank(24, 24)
  p.rect(0, 0, 24, 24, C.darkWood)
  for (let y = 1; y < 23; y++) for (let x = 1; x < 23; x++) if (noise(x >> 1, y, 3) < .3) p.dot(x, y, C.wood)
  ring(p, 0, C.black); bevel(p, 1, C.grain, C.black); ring(p, 6, C.black); bevel(p, 5, C.black, C.grain)
  p.rect(8, 8, 8, 8, C.darkWood)
  for (const [x, y] of [[0, 0], [16, 0], [0, 16], [16, 16]]) {
    p.rect(x, y, 8, 8, C.black); p.rect(x + 1, y + 1, 6, 6, C.brass); p.rect(x + 1, y + 1, 6, 1, C.brassLight); p.rect(x + 1, y + 1, 1, 6, C.brassLight)
    p.rect(x + 1, y + 6, 6, 1, C.brassDark); p.rect(x + 6, y + 1, 1, 6, C.brassDark)
    p.rect(x + 3, y + 3, 2, 2, C.brassDark); p.dot(x + 3, y + 3, C.gold)
  }
  round(p)
  return p
}

type Tone = { fill: string; light: string; dark: string; edge?: string }
const TONES: Record<string, Tone> = {
  brass: { fill: C.brass, light: C.brassLight, dark: C.brassDark },
  iron: { fill: C.slate, light: C.steel, dark: C.black },
  lacquer: { fill: C.cloth, light: C.clothShine, dark: C.clothDark },
  wood: { fill: C.darkWood, light: C.wood, dark: C.black, edge: C.brassDark },
}
/** Button in a tone and state: 12×12, slice 4 (fill included). */
function button(t: Tone, state: 'up' | 'hover' | 'down' | 'on') {
  const p = blank(12, 12)
  const fill = state === 'hover' ? t.light : t.fill
  p.rect(0, 0, 12, 12, fill)
  ring(p, 0, C.black)
  if (state === 'down') { bevel(p, 1, t.dark, t.light) }
  else { bevel(p, 1, t.light, t.dark); p.rect(1, 10, 10, 1, t.dark) }
  if (state === 'hover') p.rect(2, 2, 8, 1, C.flameCore)
  if (state === 'on' || t.edge) p.rect(2, 9, 8, 1, state === 'on' ? C.gold : t.edge!)
  round(p)
  return p
}
/** Label plaque: dark field, brass rim. 12×12, slice 4. */
function plaque() {
  const p = blank(12, 12)
  p.rect(0, 0, 12, 12, C.catFur)
  ring(p, 0, C.black); bevel(p, 1, C.brassLight, C.brassDark); ring(p, 2, C.black)
  round(p)
  return p
}
/** Inset well for numbers: dark, lit from below. 12×12, slice 4. */
function well() {
  const p = blank(12, 12)
  p.rect(0, 0, 12, 12, '#120c0e')
  ring(p, 0, C.black); bevel(p, 1, C.black, C.brassDark); p.rect(2, 2, 8, 1, C.shadow)
  return p
}
/** Beam: tileable dark wood with a lit top edge and brass rivets. 32×16. */
function beam() {
  const p = blank(32, 16)
  p.rect(0, 0, 32, 16, C.darkWood)
  for (let y = 2; y < 14; y++) for (let x = 0; x < 32; x++) if (noise(x >> 2, y, 11) < .28) p.dot(x, y, C.wood)
  p.rect(0, 0, 32, 1, C.grain); p.rect(0, 1, 32, 1, C.wood); p.rect(0, 14, 32, 1, C.black); p.rect(0, 15, 32, 1, C.brassDark)
  for (const x of [6, 22]) { p.rect(x, 6, 3, 3, C.brassDark); p.dot(x, 6, C.brassLight); p.dot(x + 1, 7, C.brass) }
  return p
}
/** Close glyph on a small lacquer button. 10×10. */
function closeGlyph(hover: boolean) {
  const p = blank(10, 10)
  p.rect(0, 0, 10, 10, hover ? C.clothLight : C.clothDark); ring(p, 0, C.black); bevel(p, 1, C.clothShine, C.black)
  for (let k = 0; k < 4; k++) { p.dot(3 + k, 3 + k, C.cream); p.dot(6 - k, 3 + k, C.cream) }
  round(p)
  return p
}

function url(p: Pixels) {
  const canvas = document.createElement('canvas'); canvas.width = p.width; canvas.height = p.height
  const ctx = canvas.getContext('2d')
  if (!ctx) return 'none'
  ctx.putImageData(p.imageData(), 0, 0)
  return `url(${canvas.toDataURL('image/png')})`
}

/** Draws the skin once and exposes it to CSS. Safe to call where canvas is unavailable (it simply does nothing). */
export function installUiSkin(root: HTMLElement = document.documentElement) {
  try {
    if (!document.createElement('canvas').getContext('2d')) return
  } catch { return }
  const set = (name: string, p: Pixels) => root.style.setProperty(`--ui-${name}`, url(p))
  set('panel', panel()); set('plaque', plaque()); set('well', well()); set('beam', beam())
  set('close', closeGlyph(false)); set('close-hover', closeGlyph(true))
  for (const [name, tone] of Object.entries(TONES)) for (const state of ['up', 'hover', 'down', 'on'] as const) set(`${name}-${state}`, button(tone, state))
}

export const uiSkinParts = { panel, plaque, well, beam, button, closeGlyph, TONES }
