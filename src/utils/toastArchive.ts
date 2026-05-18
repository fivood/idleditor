import { totalDaysToCalendar } from '@/core/calendar'
import type { ToastMessage } from '@/core/types'

/**
 * 编辑部日志的"可见窗口"与"归档"分离：
 * - 当前日志面板只保留最近 TOAST_VISIBLE_CAP 条
 * - 溢出的旧日志按"游戏年份"归档到 archivedLogsByYear（在档案室"出版日志档案"里翻阅）
 */
export const TOAST_VISIBLE_CAP = 80
const ARCHIVE_PER_YEAR_CAP = 400  // 单个年份最多保留多少条，防止 IndexedDB 无限膨胀

function toastYear(toast: ToastMessage): number {
  // createdAt 写入时统一是 playTicks（1 tick = 1 秒，60 ticks = 1 游戏日）
  const totalDays = Math.floor(toast.createdAt / 60)
  return totalDaysToCalendar(totalDays).year
}

/**
 * Immer 草稿版：在原 draft 上追加并归档溢出。
 * draft 需暴露 `toasts` 与 `archivedLogsByYear` 两个字段。
 */
export function pushToastDraft(
  draft: { toasts: ToastMessage[]; archivedLogsByYear: Record<number, ToastMessage[]> },
  toasts: ToastMessage | ToastMessage[]
): void {
  if (Array.isArray(toasts)) {
    for (const t of toasts) draft.toasts.push(t)
  } else {
    draft.toasts.push(toasts)
  }
  if (draft.toasts.length <= TOAST_VISIBLE_CAP) return

  const overflow = draft.toasts.splice(0, draft.toasts.length - TOAST_VISIBLE_CAP)
  if (!draft.archivedLogsByYear) draft.archivedLogsByYear = {}
  for (const t of overflow) {
    const y = toastYear(t)
    if (!draft.archivedLogsByYear[y]) draft.archivedLogsByYear[y] = []
    draft.archivedLogsByYear[y].push(t)
    if (draft.archivedLogsByYear[y].length > ARCHIVE_PER_YEAR_CAP) {
      draft.archivedLogsByYear[y].splice(0, draft.archivedLogsByYear[y].length - ARCHIVE_PER_YEAR_CAP)
    }
  }
}
