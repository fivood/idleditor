import type { GameCalendar } from './calendar'
import type { Genre } from './types'

export interface DateEvent {
  month: number   // 0-11
  day: number      // 1-30
  title: string
  description: string
  genre: Genre | null  // which genre gets a buff, null = global
  multiplier: number
  durationDays: number
}

// ──── Special date events (vampire-themed) ────

export const DATE_EVENTS: DateEvent[] = [
  {
    month: 1, day: 14,  // 暗月14日
    title: '血色满月·推理之夜',
    description: '血月将至，通宵读推理小说成了永夜编辑们最合理的消遣。',
    genre: 'mystery',
    multiplier: 1.6,
    durationDays: 3,
  },
  {
    month: 3, day: 7,   // 影月7日
    title: '42科幻日',
    description: '据传42是所有问题的答案。今天投稿的科幻作者似乎比平时更确信这一点。',
    genre: 'sci-fi',
    multiplier: 1.8,
    durationDays: 2,
  },
  {
    month: 5, day: 22,  // 寂月22日
    title: '寒夜悬疑节',
    description: '寂月中最长的夜晚。据说连吸血鬼都会因为悬疑小说脊背发凉——尽管他们没有体温。',
    genre: 'suspense',
    multiplier: 1.7,
    durationDays: 3,
  },
  {
    month: 6, day: 1,   // 冥月1日
    title: '亡灵社科学术论坛',
    description: '一年一度的社科学术会议。今年的主题是"永生者视角下的人类社会变迁"。很多与会者恰好是编辑部的熟人。',
    genre: 'social-science',
    multiplier: 1.5,
    durationDays: 4,
  },
  {
    month: 8, day: 15,  // 夜月15日
    title: '不朽者文学奖·颁奖夜',
    description: '永夜出版社主办的年度文学奖。评委们都是活了几个世纪的吸血鬼，评选标准极其严苛——或者说极其随意，取决于当天的血质。',
    genre: null,
    multiplier: 1.4,
    durationDays: 3,
  },
  {
    month: 10, day: 31, // 朽月31日（最后一天）
    title: '终末祭·混血狂欢',
    description: '岁末的出版狂欢。所有类型的稿件都带着一种"反正年底了，为什么不试试呢"的勇气涌来。',
    genre: 'hybrid',
    multiplier: 2.0,
    durationDays: 2,
  },
]

// Check if today triggers a date event
export function checkDateEvent(cal: GameCalendar): DateEvent | null {
  for (const evt of DATE_EVENTS) {
    if (evt.month === cal.month && evt.day === cal.day) {
      return evt
    }
  }
  return null
}
