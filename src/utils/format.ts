export function formatNumber(n: number): string {
  if (n < 1_000) return n.toFixed(0)
  if (n < 1_000_000) return (n / 1_000).toFixed(1) + 'K'
  if (n < 1_000_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  return (n / 1_000_000_000).toFixed(1) + 'B'
}

export function formatTime(ticks: number): string {
  const totalSeconds = ticks
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) return `${hours}h ${minutes}m`
  if (minutes > 0) return `${minutes}m ${seconds}s`
  return `${seconds}s`
}

export function formatRemaining(ticks: number): string {
  if (ticks <= 0) return 'Done'
  return formatTime(ticks)
}
