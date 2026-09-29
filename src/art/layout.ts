import { WIDTH, HEIGHT } from './pixels'
import type { Frame } from './rooms'

/** A box in CSS pixels, relative to the viewport element. */
export interface Box { left: number; top: number; width: number; height: number }

/**
 * Integer physical-pixel scale, then a canvas that covers the viewport by extending the room past its
 * 960×540 core. The scale is the largest that keeps at least 88% of the core in view on both axes
 * (phones keep the full width). Canvas growth is capped at twice the core per axis; past that it is centred.
 * `stage` is where the core sits, so percentage hotspots line up with the art.
 */
export function pixelLayout(width: number, height: number, ratio: number, mobile: boolean) {
  const dpr = Math.max(.1, Math.round(ratio * 1000) / 1000)
  const vw = width * dpr, vh = height * dpr
  let scale = 1
  for (let s = 2; s <= 12; s++) if (vw / s >= WIDTH * (mobile ? 1 : .88) && vh / s >= HEIGHT * .88) scale = s
  const W = Math.min(WIDTH * 2, Math.ceil(vw / scale)), H = Math.min(HEIGHT * 2, Math.ceil(vh / scale))
  const frame: Frame = { width: W, height: H, ox: Math.round((W - WIDTH) / 2), oy: H > HEIGHT ? Math.round((H - HEIGHT) * .7) : Math.round((H - HEIGHT) / 2) }
  const left = Math.floor((vw - W * scale) / 2), top = Math.floor((vh - H * scale) * (mobile ? .44 : .5))
  const css = (v: number) => v / dpr
  return {
    scale, frame,
    canvas: { left: css(left), top: css(top), width: css(W * scale), height: css(H * scale) } satisfies Box,
    stage: { left: css(left + frame.ox * scale), top: css(top + frame.oy * scale), width: css(WIDTH * scale), height: css(HEIGHT * scale) } satisfies Box,
  }
}
