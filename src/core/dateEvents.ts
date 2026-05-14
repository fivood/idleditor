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

export const DATE_EVENTS: DateEvent[] = [
  { month: 0, day: 1, title: '新岁·开卷日', description: '深冬的书市最冷清也最安静——编辑们最喜欢的阅读季。', genre: null, multiplier: 1.3, durationDays: 8 },
  { month: 1, day: 14, title: '血色满月·推理之夜', description: '血月将至，通宵读推理小说成了永夜编辑们最合理的消遣。', genre: 'mystery', multiplier: 1.6, durationDays: 6 },
  { month: 2, day: 20, title: '颤栗书市', description: '惊蛰前的最后一场寒流。书商们以"暖身读物"的名义疯狂推销悬念小说。', genre: 'suspense', multiplier: 1.5, durationDays: 5 },
  { month: 3, day: 7, title: '42科幻日', description: '据传42是所有问题的答案。今天投稿的科幻作者似乎比平时更确信这一点。', genre: 'sci-fi', multiplier: 1.8, durationDays: 5 },
  { month: 4, day: 15, title: '晦朔·读诗节', description: '一年中白昼最短的日子之一，适合读任何东西——只要够短。混合类型的销量莫名飙升。', genre: 'hybrid', multiplier: 1.6, durationDays: 5 },
  { month: 5, day: 22, title: '寒夜悬疑节', description: '寂月中最长的夜晚。据说连吸血鬼都会因为悬疑小说脊背发凉——尽管他们没有体温。', genre: 'suspense', multiplier: 1.7, durationDays: 8 },
  { month: 6, day: 1, title: '亡灵社科学术论坛', description: '一年一度的社科学术会议。今年的主题是"永生者视角下的人类社会变迁"。很多与会者恰好是编辑部的熟人。', genre: 'social-science', multiplier: 1.5, durationDays: 7 },
  { month: 7, day: 13, title: '笔墨祭', description: '传说这一天墨水会带着执念流动。所有的新人作者灵感迸发，稿件质量临时提升。', genre: null, multiplier: 1.4, durationDays: 5 },
  { month: 8, day: 15, title: '不朽者文学奖·颁奖夜', description: '永夜出版社主办的年度文学奖。评委们都是活了几个世纪的吸血鬼，评选标准极其严苛——或者说极其随意，取决于当天的血质。', genre: null, multiplier: 1.4, durationDays: 8 },
  { month: 9, day: 30, title: '迷雾征文·截稿日', description: '每年的推理小说征文截稿。代理人们扛着成箱的稿件涌入编辑部，脸上带着"今年绝对能拿奖"的表情。', genre: 'mystery', multiplier: 2.0, durationDays: 3 },
  { month: 10, day: 31, title: '终末祭·混血狂欢', description: '岁末的出版狂欢。所有类型的稿件都带着一种"反正年底了，为什么不试试呢"的勇气涌来。', genre: 'hybrid', multiplier: 2.0, durationDays: 5 },
  { month: 11, day: 10, title: '虚无书展', description: '年末最后一个书展。展会上同时售出社科、科幻和悬疑三种类型的书——读者们的口味变得不可预测。', genre: null, multiplier: 1.6, durationDays: 8 },
]

export function checkDateEvent(cal: GameCalendar): DateEvent | null {
  for (const evt of DATE_EVENTS) {
    if (evt.month === cal.month && evt.day === cal.day) {
      return evt
    }
  }
  return null
}
