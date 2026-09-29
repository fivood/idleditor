import { WIDTH, HEIGHT } from './pixels'

/**
 * Integer physical-pixel scale for the stage. Desktop fills the viewport when that crops at most 15% of the room,
 * otherwise it shows the whole room at the largest scale that fits (thin dark bands around it). Phones fit by width.
 */
export function pixelLayout(width: number, height: number, ratio: number, mobile: boolean) {
  const dpr = Math.max(.1, Math.round(ratio * 1000) / 1000)
  const fitW = width * dpr / WIDTH, fitH = height * dpr / HEIGHT
  const cover = Math.max(1, Math.ceil(Math.max(fitW, fitH)))
  const scale = mobile ? Math.max(1, Math.floor(fitW))
    : Math.min(fitW, fitH) / cover >= .85 ? cover : Math.max(1, Math.floor(Math.min(fitW, fitH)))
  const w = WIDTH * scale, h = HEIGHT * scale
  return { width: w / dpr, height: h / dpr, left: Math.floor((width * dpr - w) / 2) / dpr, top: Math.floor((height * dpr - h) * (mobile ? .44 : .5)) / dpr, scale }
}
