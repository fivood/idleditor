import type { Genre } from './types'

export interface Collection {
  id: string
  genre: Genre
  label: string
  title: string
  threshold: number
  bonus: string
  toastText: string
}

export const COLLECTIONS: Collection[] = [
  { id: 'mystery-5', genre: 'mystery', label: '推理', title: '悬案档案馆', threshold: 5, bonus: '推理类销量 +5%', toastText: '推理小说满5本！永夜出版社正式成立悬案档案馆。此后推理类书籍销量永久 +5%。' },
  { id: 'scifi-5', genre: 'sci-fi', label: '科幻', title: '星辰编年史', threshold: 5, bonus: '科幻类品质 +3%', toastText: '科幻小说满5本！星辰编年史项目启动。此后科幻类稿件品质 +3%。' },
  { id: 'social-3', genre: 'social-science', label: '社科', title: '智库出版部', threshold: 3, bonus: '每月声望 +5', toastText: '社科著作满3本！智库出版部正式组建。此后每月额外获得5声望。' },
  { id: 'suspense-3', genre: 'suspense', label: '悬疑', title: '暗影档案室', threshold: 3, bonus: '悬疑类退稿RP +50%', toastText: '悬疑小说满3本！暗影档案室启用。此后悬疑类退稿时RP奖励 +50%。' },
  { id: 'lightnovel-3', genre: 'light-novel', label: '轻小说', title: '异世界出版局', threshold: 3, bonus: '轻小说作者投稿间隔 -20%', toastText: '轻小说满3本！异世界出版局成立。此后轻小说作者投稿间隔减少20%。' },
  { id: 'hybrid-2', genre: 'hybrid', label: '混合', title: '跨界阅览室', threshold: 2, bonus: '混合类稿件品质 +5%', toastText: '混合类型满2本！跨界阅览室开放。此后混合类稿件品质 +5%。' },
]
