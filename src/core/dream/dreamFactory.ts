import type { DreamProject, Genre, Manuscript } from '../types'
import type { GameWorldState } from '../gameLoop'
import { nanoid } from '@/utils/id'
import { GENRE_COVER_COLORS } from '../constants'
import { GENRE_ICONS } from '../types'

/**
 * 创建一个新的梦境创作项目。
 * 灵感投入决定字数 + 品质 + 总耗时。
 *
 * 平衡：
 *  - 10 灵感：30 分钟梦中(1800 ticks)，约 20K 字，中等品质
 *  - 30 灵感：90 分钟梦中(5400 ticks)，约 80K 字，高品质
 *  - 50 灵感：3 小时梦中(10800 ticks)，约 150K 字，杰作
 */
export function createDream(
  world: GameWorldState,
  opts: { title: string; genre: Genre; inspiration: number }
): DreamProject {
  // 字数：10 灵感 = 20K 字，线性外推
  // 总 ticks：每 1K 字 = 90 ticks（与正常稿件流水线大致相当）
  // 品质增益：投入越多越好（编辑等级也会加成，由发布时计算）
  const totalTicks = Math.max(900, opts.inspiration * 180)

  return {
    id: 'dream-' + nanoid(8),
    title: opts.title.trim() || randomDreamTitle(opts.genre),
    genre: opts.genre,
    inspirationSpent: opts.inspiration,
    progressTicks: 0,
    totalTicks,
    startedAt: world.playTicks,
  }
}

/**
 * 当 activeDream 完成时调用，把它转换成已出版的 Manuscript。
 */
export function dreamToManuscript(
  world: GameWorldState,
  dream: DreamProject
): Manuscript {
  const wordCount = Math.max(10_000, dream.inspirationSpent * 2_000)
  const inspirationBoost = Math.min(40, dream.inspirationSpent * 1.2)
  const editorBoost = (world.editorLevel - 1) * 2
  const baseQuality = 40 + inspirationBoost + editorBoost
  const quality = Math.min(99, Math.round(baseQuality + (Math.random() * 10 - 5)))
  const slug = titleToSlug(dream.title)
  return {
    id: 'm-' + nanoid(10),
    title: dream.title,
    authorId: 'player',  // 特殊作者 ID，渲染时显示为玩家名
    genre: dream.genre,
    quality,
    wordCount,
    marketPotential: 30,  // 初始市场潜力较低，靠玩家营销
    status: 'published',
    editingProgress: 1,
    createdAt: dream.startedAt,
    publishTime: world.playTicks,
    isBestseller: false,
    salesCount: 0,
    awards: [],
    cover: {
      type: 'generated',
      src: `/covers/${slug}.png`,
      placeholder: {
        bgColor: GENRE_COVER_COLORS[dream.genre as keyof typeof GENRE_COVER_COLORS] ?? '#1a1a2e',
        icon: GENRE_ICONS[dream.genre as keyof typeof GENRE_ICONS] ?? '📖',
        titleOverlay: dream.title,
      },
    },
    synopsis: '主编在梦中亲手写的作品。',
    isUnsuitable: false,
    rejectionReason: '',
    meticulouslyEdited: true,
    shelvedAt: null,
    reissueBoostUntil: null,
    editorNote: '',
    customNote: '',
    isPlayerCreated: true,
  }
}

function titleToSlug(title: string): string {
  return title
    .replace(/[：:]/g, '-')
    .replace(/[？?！!。，,、（）()【】\[\]《》""·]/g, '')
    .replace(/\s+/g, '-')
    .trim()
}

function randomDreamTitle(genre: Genre): string {
  const pool: Record<Genre, string[]> = {
    'sci-fi': ['梦中的阳光', '日光假说·我自己的版本', '永远没有月亮的一天'],
    'mystery': ['昨夜我做了一个奇怪的梦', '梦里那个人是谁', '镜中的访客'],
    'suspense': ['银器之梦', '梦境深处的银光', '不该梦到的'],
    'social-science': ['一份关于梦的田野笔记', '夜与梦的边界'],
    'light-novel': ['转生到自己的梦里', '梦中学院'],
    'hybrid': ['梦境合著', '醒来时我们都是另一个人'],
  }
  const arr = pool[genre] ?? pool['hybrid']
  return arr[Math.floor(Math.random() * arr.length)]
}
