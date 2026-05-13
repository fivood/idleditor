// Editor leveling system

// XP required per level: uses a gentle curve
export function xpForLevel(level: number): number {
  return Math.round(100 * level * (1 + level * 0.15))
}

// Calculate current level from total XP
export function getLevelFromXP(xp: number): number {
  let level = 1
  let totalNeeded = 0
  while (true) {
    totalNeeded += xpForLevel(level)
    if (xp < totalNeeded) return level
    level++
  }
}

// XP earned from a published book (quality bonus if Q>50)
export function xpForPublish(quality: number): number {
  return 10 + Math.max(0, Math.floor((quality - 50) / 10))
}

// Current XP progress within the current level (0 to xpForLevel(level))
export function xpProgressInLevel(totalXP: number): { level: number; current: number; needed: number } {
  const level = getLevelFromXP(totalXP)
  let xpBelow = 0
  for (let i = 1; i < level; i++) xpBelow += xpForLevel(i)
  const current = totalXP - xpBelow
  const needed = xpForLevel(level)
  return { level, current, needed }
}

// Level bonuses: small permanent buffs every few levels
export function levelBonuses(level: number): { quality: number; speed: number; rp: number } {
  return {
    quality: Math.floor(level / 5),      // +1 per 5 levels
    speed: (Math.floor(level / 3) * 0.02), // +2% per 3 levels
    rp: Math.floor(level / 4) * 0.03,     // +3% per 4 levels
  }
}
