// ──── 渐进解锁系统（v2.3）────
// 把游戏从"一开始所有东西全开"重塑为"按里程碑逐步解锁"，
// 让前期节奏清晰、后期内容仍有惊喜。
//
// 每个解锁项有 id + 触发条件 + 描述。运行时检查 isUnlocked(state, id) 即可。
// 解锁不可逆，记录在 state.unlockedFeatures Set 中（永久存档）。

import type { GameWorldState } from './gameLoop'
import type { Genre } from './types'

export interface UnlockGate {
  /** 唯一 ID */
  id: string
  /** 触发条件（任一未满足即未解锁） */
  requirement: {
    publishedBooks?: number
    bestsellers?: number
    editorLevel?: number
    statues?: number       // 纪元次数
    prestige?: number
    editingDeptLevel?: number
  }
  /** UI 展示用 */
  description: string
  /** 解锁时推送的 milestone toast 文案 */
  unlockToast?: string
}

// ──── 题材解锁（核心节奏控制）────
// 前期玩家只能审 light-novel + hybrid（年轻血族 / 跨种合著），
// 这些题材天然门槛低、产量高、市场反响快。
// 后续题材按出版数解锁，让玩家不会被"6 种题材一锅端"的内容量压垮。
const GENRE_GATES: Record<Genre, UnlockGate | null> = {
  'light-novel':    null,  // 默认解锁
  'hybrid':         null,  // 默认解锁
  'mystery':        { id: 'genre:mystery',        requirement: { publishedBooks: 3 },  description: '出版 3 本后解锁「凡间悬案」', unlockToast: '🗝️ 新题材解锁：凡间悬案（人类视角的离奇事件——对夜行读者就像异域奇谈）' },
  'suspense':       { id: 'genre:suspense',       requirement: { publishedBooks: 7 },  description: '出版 7 本后解锁「银器恐怖」', unlockToast: '🗝️ 新题材解锁：银器恐怖（涉及银/十字/阳光禁忌的惊悚故事）' },
  'social-science': { id: 'genre:social-science', requirement: { publishedBooks: 12 }, description: '出版 12 本后解锁「真实研究」', unlockToast: '🗝️ 新题材解锁：真实研究（关于夜行社群的严肃纪实——能涨声望但门槛高）' },
  'sci-fi':         { id: 'genre:sci-fi',         requirement: { publishedBooks: 18 }, description: '出版 18 本后解锁「日光幻想」', unlockToast: '🗝️ 新题材解锁：日光幻想（吸血鬼对阳光世界的奇想推演——读者基数最大）' },
}

export function isGenreUnlocked(world: GameWorldState, genre: Genre): boolean {
  const gate = GENRE_GATES[genre]
  if (!gate) return true
  return meetsRequirement(world, gate.requirement)
}

export function getGenreGate(genre: Genre): UnlockGate | null {
  return GENRE_GATES[genre]
}

// ──── 系统/部门解锁 ────
export const SYSTEM_GATES: Record<string, UnlockGate> = {
  // 部门（编辑部默认解锁，其他按门槛）
  'dept:design':    { id: 'dept:design',    requirement: { publishedBooks: 5 },  description: '出版 5 本后可雇佣设计部', unlockToast: '🏢 设计部可雇佣（封面阶段加品质，让你的稿件更好卖）' },
  'dept:marketing': { id: 'dept:marketing', requirement: { publishedBooks: 10 }, description: '出版 10 本后可雇佣市场部', unlockToast: '🏢 市场部可雇佣（每本书的销量都会获得加成）' },
  'dept:rights':    { id: 'dept:rights',    requirement: { publishedBooks: 20, prestige: 30 }, description: '出版 20 本 + 声望 30 后可雇佣版权部', unlockToast: '🏢 版权部可雇佣（每分钟被动产出声望——长寿编辑就是这样积累名望的）' },

  // 主要系统
  'system:dream':         { id: 'system:dream',         requirement: { editorLevel: 3 }, description: '编辑 Lv.3 后解锁梦境创作', unlockToast: '🌙 梦境创作解锁。白天睡眠时投入灵感，能写出你自己的作品。' },
  'system:bookstore':     { id: 'system:bookstore',     requirement: { bestsellers: 1 }, description: '出版第 1 本畅销书后解锁书店经营', unlockToast: '🏪 书店经营解锁。出版业的下一步是控制流通环节——开店去吧。' },
  'system:mortal-column': { id: 'system:mortal-column', requirement: { statues: 1 },     description: '完成第 1 次纪元后可开启凡间专栏', unlockToast: '👤 凡间专栏可开启。这是你第二个纪元的奖励——人类作家终于可以投稿了。' },
  'system:reissue':       { id: 'system:reissue',       requirement: { publishedBooks: 8 }, description: '出版 8 本后可再版已有书籍', unlockToast: '📚 再版功能解锁。已出版的书可以推精装/口袋本/全集版，长尾收益 +50%。' },

  // 自动化（之前是直接靠编辑部等级判断，现在加显式 gate 让 UI 提示更清晰）
  'system:auto-review':   { id: 'system:auto-review',   requirement: { publishedBooks: 6, editingDeptLevel: 3 }, description: '编辑部 Lv.3 + 出版 6 本后解锁自动审稿', unlockToast: '🤖 自动审稿解锁。编辑部能力够强了，可以自己处理低优先级稿件。' },
  'system:auto-cover':    { id: 'system:auto-cover',    requirement: { publishedBooks: 12, prestige: 100 }, description: '出版 12 本 + 声望 100 后解锁自动封面', unlockToast: '🤖 自动封面解锁。设计部能自主决定哪些稿件直接付印。' },
  'system:auto-reject':   { id: 'system:auto-reject',   requirement: { publishedBooks: 20, prestige: 200 }, description: '出版 20 本 + 声望 200 后解锁自动退稿', unlockToast: '🤖 自动退稿解锁。编辑部能识别"显然不行"的稿件直接处理掉。' },
}

export function isSystemUnlocked(world: GameWorldState, systemId: string): boolean {
  const gate = SYSTEM_GATES[systemId]
  if (!gate) return true
  return meetsRequirement(world, gate.requirement)
}

export function getSystemGate(systemId: string): UnlockGate | null {
  return SYSTEM_GATES[systemId] ?? null
}

// ──── 通用条件检查 ────
function meetsRequirement(world: GameWorldState, req: UnlockGate['requirement']): boolean {
  if (req.publishedBooks !== undefined && world.totalPublished < req.publishedBooks) return false
  if (req.bestsellers !== undefined && world.totalBestsellers < req.bestsellers) return false
  if (req.editorLevel !== undefined && world.editorLevel < req.editorLevel) return false
  if (req.statues !== undefined && world.currencies.statues < req.statues) return false
  if (req.prestige !== undefined && world.currencies.prestige < req.prestige) return false
  if (req.editingDeptLevel !== undefined) {
    const editing = [...world.departments.values()].find(d => d.type === 'editing')
    if (!editing || editing.level < req.editingDeptLevel) return false
  }
  return true
}

// ──── 已解锁的题材列表（供 spawnPhase / DreamPanel 等使用）────
export function getUnlockedGenres(world: GameWorldState): Genre[] {
  const all: Genre[] = ['light-novel', 'hybrid', 'mystery', 'suspense', 'social-science', 'sci-fi']
  return all.filter(g => isGenreUnlocked(world, g))
}

// ──── 每 tick 检查新解锁的内容并推 toast（防止重复广播）────
// 需要 world 上有 announcedUnlocks: Set<string> 记录已广播过的 id
export function checkNewUnlocks(world: GameWorldState): string[] {
  if (!world.announcedUnlocks) world.announcedUnlocks = new Set()
  const newlyUnlocked: string[] = []
  // 题材
  for (const [, gate] of Object.entries(GENRE_GATES)) {
    if (!gate) continue
    if (!world.announcedUnlocks.has(gate.id) && meetsRequirement(world, gate.requirement)) {
      world.announcedUnlocks.add(gate.id)
      if (gate.unlockToast) newlyUnlocked.push(gate.unlockToast)
    }
  }
  // 系统
  for (const gate of Object.values(SYSTEM_GATES)) {
    if (!world.announcedUnlocks.has(gate.id) && meetsRequirement(world, gate.requirement)) {
      world.announcedUnlocks.add(gate.id)
      if (gate.unlockToast) newlyUnlocked.push(gate.unlockToast)
    }
  }
  return newlyUnlocked
}
