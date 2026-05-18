// ──── Calendar / Time System (v2.3 重新平衡) ────
// 1 tick = 1 real second（按钮响应不延迟）
// 1 game day = 60 ticks (1 real minute)
// 1 game month = 60 days（v2.3 之前 30，现在 ×2 让单月体感更"绵长"）
// 1 game year = 12 months = 720 days = 720 real min = 12 real hours
//
// 配合月出版上限从 10 → 5，每月有 1 real hour 玩 5 本书，
// 鼓励精雕细琢而非流水线式批量出版。

export const TICKS_PER_DAY = 60
export const DAYS_PER_MONTH = 60
export const MONTHS_PER_YEAR = 12

export const MONTH_NAMES = [
  '霜月', '暗月', '血月', '影月',
  '寂月', '冥月', '雾月', '夜月',
  '寒月', '朽月', '终月', '新月',
]

export interface GameCalendar {
  day: number       // 1–30
  month: number     // 0–11
  year: number      // starts at 1
  totalDays: number // total days elapsed
}

export function createCalendar(): GameCalendar {
  return { day: 1, month: 0, year: 1, totalDays: 0 }
}

export function advanceCalendar(cal: GameCalendar): GameCalendar {
  cal.day++
  cal.totalDays++
  if (cal.day > DAYS_PER_MONTH) {
    cal.day = 1
    cal.month++
    if (cal.month >= MONTHS_PER_YEAR) {
      cal.month = 0
      cal.year++
    }
  }
  return cal
}

export function formatDate(cal: GameCalendar): string {
  return `${cal.year}年${MONTH_NAMES[cal.month]}${cal.day}日`
}

export function totalDaysToCalendar(td: number): GameCalendar {
  const year = Math.floor(td / (DAYS_PER_MONTH * MONTHS_PER_YEAR)) + 1
  const remaining = td % (DAYS_PER_MONTH * MONTHS_PER_YEAR)
  const month = Math.floor(remaining / DAYS_PER_MONTH)
  const day = (remaining % DAYS_PER_MONTH) + 1
  return { day, month, year, totalDays: td }
}
