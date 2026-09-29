import { WIDTH, HEIGHT } from './pixels'

export function pixelLayout(width: number, height: number, ratio: number, mobile: boolean) {
  const dpr = Math.max(.1, Math.round(ratio * 1000) / 1000)
  const scale = mobile ? Math.max(1, Math.floor(width * dpr / WIDTH))
    : Math.max(1, Math.ceil(Math.max(width * dpr / WIDTH, height * dpr / HEIGHT)))
  const w = WIDTH * scale, h = HEIGHT * scale
  return { width: w / dpr, height: h / dpr, left: Math.floor((width * dpr - w) / 2) / dpr, top: Math.floor((height * dpr - h) * (mobile ? .44 : .5)) / dpr, scale }
}
