export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

export function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function weightedPick<T>(items: [number, T][]): T {
  const total = items.reduce((sum, [w]) => sum + w, 0)
  let r = Math.random() * total
  for (const [weight, item] of items) {
    r -= weight
    if (r <= 0) return item
  }
  return items[items.length - 1][1]
}

export function roll(chance: number): boolean {
  return Math.random() < chance
}

export function rangeInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}
