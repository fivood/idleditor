import { DAYS_PER_MONTH, MONTHS_PER_YEAR } from './calendar'

/** The sky is always night; only what falls out of it changes. */
export type Weather = 'clear' | 'drizzle' | 'storm' | 'snow' | 'fog' | 'wind'

export const WEATHER_LABELS: Record<Weather, string> = { clear: '晴夜', drizzle: '小雨', storm: '雷暴', snow: '落雪', fog: '起雾', wind: '大风' }
export const WEATHER_LINES: Record<Weather, string> = {
  clear: '星星很清楚，第两百一十七年的窗前没有一滴雨',
  drizzle: '雨落在第两百一十七年的窗前',
  storm: '雷把第两百一十七年的窗框震得直响',
  snow: '雪无声地落在第两百一十七年的窗前',
  fog: '雾把第两百一十七年的城市擦成了水彩',
  wind: '风推着云从第两百一十七年的月亮前跑过',
}

/** Days per weather spell; one game day is one real minute. */
export const DAYS_PER_SPELL = 6

// Odds by month (霜月 … 新月) for [clear, drizzle, storm, snow, fog, wind].
const ODDS: number[][] = [
  [2, 0, 0, 5, 2, 1], [2, 0, 0, 4, 3, 1], [3, 4, 0, 0, 2, 3], [3, 5, 1, 0, 2, 3],
  [4, 4, 2, 0, 1, 3], [4, 2, 5, 0, 1, 2], [2, 2, 2, 0, 6, 2], [5, 1, 5, 0, 0, 2],
  [3, 3, 1, 0, 4, 3], [3, 3, 1, 1, 4, 4], [2, 1, 0, 5, 3, 3], [2, 0, 0, 6, 2, 2],
]
const KINDS: Weather[] = ['clear', 'drizzle', 'storm', 'snow', 'fog', 'wind']

function spellRoll(spell: number) {
  let n = Math.imul(spell + 1, 2654435761) ^ 0x9e3779b9
  n = Math.imul(n ^ n >>> 15, 2246822519); n = Math.imul(n ^ n >>> 13, 3266489917)
  return ((n ^ n >>> 16) >>> 0) / 4294967296
}

/** Deterministic: the same game day always has the same weather, across reloads. */
export function weatherFor(totalDays: number): Weather {
  const spell = Math.floor(Math.max(0, totalDays) / DAYS_PER_SPELL)
  const month = Math.floor(spell * DAYS_PER_SPELL % (DAYS_PER_MONTH * MONTHS_PER_YEAR) / DAYS_PER_MONTH)
  const odds = ODDS[month]
  let pick = spellRoll(spell) * odds.reduce((a, b) => a + b, 0)
  for (let i = 0; i < KINDS.length; i++) if ((pick -= odds[i]) < 0) return KINDS[i]
  return 'clear'
}
