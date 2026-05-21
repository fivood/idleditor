/**
 * 玩家记忆系统 · v0.11 起
 *
 * 把玩家在游戏里发生的"值得记住"的事件（审稿 / 出版 / 退稿 / 获奖 / 作者封笔 /
 * 重要随机事件 / 决策结果）自动收集为「记忆碎片」，存到 world 状态里。
 * 玩家进入梦境创作时可挑选 1-5 条记忆作为"灵感原型"，喂给 LLM 生成专属书简介。
 *
 * 设计原则：
 *  - 被动自动收集，不打扰玩家；
 *  - 跨周目（纪元）保留 top N 条 importance 高的"传家记忆"；
 *  - 记忆**不消耗**——同一条记忆可以反复成为多本书的素材（题材厚度感）；
 *  - 没有 LLM 时走本地模板兜底，离线也能玩。
 */

import type { Genre } from './types'

export type MemoryType =
  | 'review'      // 审稿通过（高品质书）
  | 'publish'     // 出版成功（畅销 / 高品质 / 首次某事件）
  | 'rejection'   // 退稿（特别是退掉了好书）
  | 'random'      // 随机事件（伯爵巡视 / 文学报报道等）
  | 'decision'    // 决策结果（伯爵剧情 / 事件链选择）
  | 'author'      // 作者节点（签约 / 晋升 / 封笔）
  | 'milestone'   // 里程碑（第 1 本畅销 / 第 1 次纪元 / 获奖）

export interface PlayerMemory {
  id: string
  type: MemoryType
  /** 一句话摘要，进 LLM prompt 的原料；最多 ~120 字 */
  text: string
  /** 采集时的游戏 playTicks */
  capturedAt: number
  /** 采集时的游戏年份（calendar.year） */
  capturedYear: number
  /** 第几次纪元采集的；用于跨周目识别 */
  capturedEpoch: number
  /** 0-100 重要性，决定保留优先级 + 默认排序 */
  importance: number
  /** 可选的结构化补充字段，LLM prompt 里能引用 */
  meta?: {
    bookTitle?: string
    authorName?: string
    genre?: Genre
    quality?: number
  }
}

/** 记忆碎片在玩家世界里的两个池子：当前周目 + 跨周目传家记忆 */
export interface MemoryPools {
  /** 当前周目积累的所有记忆——纪元时筛选后写入 heirloom */
  current: PlayerMemory[]
  /** 跨周目保留，按 importance 取 top N（受铜像数量影响上限） */
  heirloom: PlayerMemory[]
}

// ──── 重要性预设 ────
// 用 enum-style 数值常量集中管理，方便平衡调优。

export const IMPORTANCE = {
  // 出版类
  PUBLISH_BESTSELLER: 90,
  PUBLISH_QUALITY_BOOK: 70,    // quality ≥ 80
  PUBLISH_DECENT: 40,           // quality 60–79
  PUBLISH_NORMAL: 20,
  PUBLISH_UNSUITABLE: 15,       // "勉强出版" 的烂书也算一段经历

  // 审稿类
  REVIEW_HIGH_QUALITY: 45,      // 审过 quality ≥ 75 的稿件
  REVIEW_FIRST: 30,             // 首次审稿

  // 退稿类
  REJECT_GOOD_BOOK: 55,         // 退掉了 quality ≥ 60 的稿件
  REJECT_NORMAL: 15,

  // 作者
  AUTHOR_SIGNED: 40,
  AUTHOR_TIER_UP: 65,           // 升级到 known / idol
  AUTHOR_RETIRED: 70,           // 自然封笔
  AUTHOR_POACHED: 50,           // 被竞争对手挖走

  // 奖项
  AWARD_BEST_NOVEL: 95,
  AWARD_NEWCOMER: 80,
  AWARD_SELLER: 75,
  AWARD_JURY: 60,

  // 决策 / 剧情
  COUNT_SCENE: 100,             // 伯爵剧情（最重要）
  COUNT_ENDING: 100,            // 伯爵结局
  EVENT_CHAIN: 80,              // 事件链决策

  // 随机事件 / 里程碑
  MILESTONE_FIRST: 90,          // 第 1 本书 / 第 1 次纪元
  MILESTONE_LATER: 50,          // 后续里程碑
  RANDOM_NOTEWORTHY: 35,        // 大多数随机事件
  RANDOM_TRIVIAL: 15,           // 鸡毛蒜皮（不一定要收集）
} as const

// ──── 收集 / 修剪辅助 ────

const MAX_CURRENT_MEMORIES = 200      // 单周目内的硬上限——超过后丢弃低 importance 的
const MIN_IMPORTANCE_TO_COLLECT = 15  // 低于此分数的事件不入库

/** 把一条新记忆塞进 current 池子。会过滤太低 importance 的，会修剪溢出。
 *  改变 `pools.current` 引用——caller 应该直接 mutate world state。 */
export function pushMemory(pools: MemoryPools, mem: PlayerMemory): void {
  if (mem.importance < MIN_IMPORTANCE_TO_COLLECT) return
  pools.current.push(mem)
  if (pools.current.length > MAX_CURRENT_MEMORIES) {
    // 按 importance 排序，把分数最低的 10 条丢掉
    pools.current.sort((a, b) => b.importance - a.importance)
    pools.current.length = MAX_CURRENT_MEMORIES - 10
  }
}

/** 计算跨周目记忆传承上限：基础 10 + 每座铜像 +5。 */
export function heirloomCap(statues: number): number {
  return 10 + statues * 5
}

/** 纪元时筛选 current 池子里 importance 最高的 N 条，写入 heirloom 池子。
 *  保留旧的 heirloom，新筛选的合并进去，最后再裁到上限。 */
export function promoteToHeirloom(pools: MemoryPools, statues: number): void {
  const cap = heirloomCap(statues)
  const merged = [...pools.heirloom, ...pools.current]
  merged.sort((a, b) => b.importance - a.importance)
  pools.heirloom = merged.slice(0, cap)
  pools.current = []
}

/** 默认浏览顺序：按 importance 降序，同分按时间倒序（新的在前） */
export function sortMemoriesForBrowsing(memories: PlayerMemory[]): PlayerMemory[] {
  return [...memories].sort((a, b) => {
    if (b.importance !== a.importance) return b.importance - a.importance
    return b.capturedAt - a.capturedAt
  })
}

/** 把记忆数组扁平化成 LLM prompt 可读的文本块 */
export function memoriesToPromptContext(memories: PlayerMemory[], playerName: string, _currentYear: number, currentEpoch: number): string {
  if (memories.length === 0) return ''
  const lines = memories.map((m, i) => {
    const epochTag = m.capturedEpoch !== currentEpoch ? `（第${m.capturedEpoch}次纪元 · 距今${currentEpoch - m.capturedEpoch}世）` : ''
    const yearTag = `第${m.capturedYear}年`
    return `[记忆 ${i + 1}${epochTag}] ${yearTag}：${m.text}`
  })
  return [
    `${playerName} 是一位活过 ${currentEpoch} 个纪元的吸血鬼编辑。这是 ta 过往经历中值得记住的片段：`,
    '',
    ...lines,
  ].join('\n')
}
