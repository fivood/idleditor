import { HEIGHT, WIDTH } from './pixels'

/**
 * Two one-pixel rings hugging an object's visible silhouette: `inner` touches it, `outer` sits just beyond.
 * Painting inner light and outer dark keeps the outline readable on any background.
 */
export function silhouette(tags: Uint8Array, id: number, width = WIDTH, height = HEIGHT) {
  const ring = new Uint8Array(tags.length)
  const inner: number[] = [], outer: number[] = []
  const touches = (i: number, test: (j: number) => boolean) => {
    const x = i % width
    return (x > 0 && test(i - 1)) || (x < width - 1 && test(i + 1)) || (i >= width && test(i - width)) || (i < width * (height - 1) && test(i + width))
  }
  for (let i = 0; i < tags.length; i++) if (tags[i] !== id && touches(i, j => tags[j] === id)) { ring[i] = 1; inner.push(i) }
  for (let i = 0; i < tags.length; i++) if (tags[i] !== id && !ring[i] && touches(i, j => ring[j] === 1)) outer.push(i)
  return { inner: Int32Array.from(inner), outer: Int32Array.from(outer) }
}
