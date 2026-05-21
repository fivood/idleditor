// ──── Genres（v2.5 八题材结构）────
export type Genre =
  | 'sci-fi'         // 日光幻想
  | 'mystery'        // 凡间悬案
  | 'suspense'       // 银器恐怖
  | 'social-science' // 真实研究
  | 'literary'       // 凡间名著（v2.5 从 social 拆出）
  | 'hybrid'         // 跨种合著
  | 'fantasy'        // 远古纪事（v2.5 从 hybrid 拆出）
  | 'light-novel'    // 少年血宫

export const GENRES: Genre[] = [
  'sci-fi', 'mystery', 'suspense', 'social-science',
  'literary', 'hybrid', 'fantasy', 'light-novel',
]

// 永夜版语义：把题材标签反转为永夜世界的视角
// 真实世界看起来是"奇幻"的东西（吸血鬼/狼人）在永夜是日常
// 真实世界的"日常"（阳光/人类生活）在永夜是奇幻
// 类型用 Record<string, string> 以兼容旧的字符串索引访问。
export const GENRE_LABELS: Record<string, string> = {
  'sci-fi':         '日光幻想',  // 关于阳光/人类的奇想
  mystery:          '凡间悬案',  // 人类视角的离奇案件
  suspense:         '银器恐怖',  // 涉及银/十字/阳光禁忌
  'social-science': '真实研究',  // 关于永夜社会的纪实
  literary:         '凡间名著',  // v2.5 凡人经典在永夜视角的改写
  hybrid:           '跨种合著',  // 两个物种作者合作
  fantasy:          '远古纪事',  // v2.5 永夜大陆古传说 / 大型奇幻史诗
  'light-novel':    '少年血宫',  // 年轻血族/异世界编辑爽文
}

// 旧称谓（人类世界视角），用于"凡间专栏"开关开启时显示
export const GENRE_LABELS_MORTAL: Record<string, string> = {
  'sci-fi':         '科幻',
  mystery:          '推理',
  suspense:         '悬疑',
  'social-science': '社科',
  literary:         '经典改编',
  hybrid:           '跨界融合',
  fantasy:          '奇幻史诗',
  'light-novel':    '轻小说',
}

export const GENRE_ICONS: Record<Genre, string> = {
  'sci-fi':         '/icons/genre/sci-fi.svg',
  mystery:          '/icons/genre/mystery.svg',
  suspense:         '/icons/genre/suspense.svg',
  'social-science': '/icons/genre/social-science.svg',
  literary:         '/icons/genre/social-science.svg', // 暂复用 social-science 图标
  hybrid:           '/icons/genre/hybrid.svg',
  fantasy:          '/icons/genre/hybrid.svg',         // 暂复用 hybrid 图标
  'light-novel':    '/icons/genre/light-novel.svg',
}

// ──── Manuscript lifecycle ────
export type ManuscriptStatus =
  | 'submitted'
  | 'reviewing'
  | 'editing'
  | 'proofing'
  | 'cover_designing'  // v2.6: 设计部进行封面设计的挂机阶段（有设计部时插入）
  | 'cover_select'
  | 'publishing'
  | 'published'
  | 'rejected'
  | 'shelved'

// ──── Author progression (never degrades) ────
export type AuthorTier = 'new' | 'signed' | 'known' | 'idol'

// 永夜世界作者人格（17 种，按种族划分）。
// 寿命越长，作品数上限越高，但创作期也越长——所以"挂机时长"被时间锁拉伸。
// 短寿命人类作家上限低（一生写完），更替快，制造"新人辈出"的群像感。
export type AuthorPersona =
  // 吸血鬼系（长寿，作品多，节奏慢）
  | 'vampire-aristocrat-historian'
  | 'vampire-decadent-poet'
  | 'vampire-young-rebel'
  | 'vampire-amateur-detective'
  // 狼人系（中等寿命）
  | 'werewolf-pack-bard'
  | 'werewolf-suburban-novelist'
  | 'werewolf-frontier-survivor'
  // 女巫系（超长寿，间歇产出）
  | 'witch-grimoire-keeper'
  | 'witch-kitchen-novelist'
  | 'witch-storm-prophetess'
  // 亡灵系（极长寿但寡言）
  | 'lich-archive-curator'
  | 'banshee-mourning-poet'
  // 食尸鬼
  | 'ghoul-cemetery-historian'
  // 人类（短寿命，作品少更替快）
  | 'mortal-investigative-journalist'
  | 'mortal-bestseller-hustler'
  // 奇幻种族
  | 'fae-changeling-fabulist'
  | 'demon-bureaucrat'
  // v2.5 新增：覆盖哥特/史学/noir/史诗 4 个新风格
  | 'ghost-gothic-poet'        // 幽灵诗人（哥特+经典改编）
  | 'mummy-chronicle-scholar'  // 木乃伊史学家（纪实+古传说）
  | 'noir-pulp-novelist'       // 黑色小说作家（悬疑+推理）
  | 'ancient-dragon-epic'      // 始祖级龙（远古纪事，超慢节奏巨著）

// ──── Department types ────
export type DepartmentType = 'editing' | 'design' | 'marketing' | 'rights'

// ──── Event types ────
export type EventType = 'market_trend' | 'literary_award' | 'author_break' | 'delivery_delay'

// ──── Toast notification types ────
export type ToastType = 'info' | 'milestone' | 'award' | 'humor' | 'rejection' | 'levelUp'

// ──── Rejection style (purely cosmetic) ────
export type RejectionStyle = 'polite' | 'witty' | 'terse'

// ──── Editor trait ────
export type EditorTrait = 'decisive' | 'meticulous' | 'visionary'

// ──── Core entities ────

export interface Manuscript {
  id: string
  title: string
  authorId: string
  genre: Genre
  quality: number
  wordCount: number
  marketPotential: number
  status: ManuscriptStatus
  editingProgress: number
  createdAt: number
  publishTime: number | null
  isBestseller: boolean
  salesCount: number
  awards: string[]
  cover: BookCover
  synopsis: string
  isUnsuitable: boolean
  rejectionReason: string
  meticulouslyEdited: boolean
  shelvedAt: number | null
  reissueBoostUntil: number | null
  editorNote: string
  customNote: string
  // v2.2.3: 玩家自创作（梦境写作产物）
  isPlayerCreated?: boolean
  // v2.6: 是否经过设计部完成封面设计。false → 出版时显示灰阶兜底封面。
  coverDesigned?: boolean
  // v0.11: 这本书引用了哪些玩家记忆（仅梦境创作书会有）
  inspirationMemoryIds?: string[]
  // v0.11: LLM 生成的章节摘录（巨著/长篇梦境作品会有，1-2 段）
  generatedExcerpts?: string[]
}

// 梦境创作项目（玩家进入梦境正在写的一本书）
export interface DreamProject {
  id: string
  title: string
  genre: Genre
  inspirationSpent: number   // 启动时投入的灵感数（决定品质和字数）
  progressTicks: number      // 已推进 tick
  totalTicks: number         // 总需 tick（一般 1800-5400）
  startedAt: number          // playTicks 时间戳
  // v0.11: 选中的灵感记忆 ID 列表（1-5 条），LLM 写书时引用
  inspirationMemoryIds?: string[]
  // v0.11: 投入档位（sketch/short/novella/novel/magnum），决定 LLM 是否额外输出章节摘录
  tier?: 'sketch' | 'short' | 'novella' | 'novel' | 'magnum'
}

export interface BookCover {
  type: 'generated' | 'uploaded'
  src: string | null
  placeholder: {
    bgColor: string
    icon: string
    titleOverlay: string
  }
}

export interface Author {
  id: string
  name: string
  persona: AuthorPersona
  genre: Genre
  tier: AuthorTier
  talent: number
  reliability: number
  fame: number
  cooldownUntil: number | null
  rejectedCount: number
  signaturePhrase: string
  affection: number
  poached: boolean
  terminated: boolean
  lastInteractionAt: number
  lastActiveAt: number
  booksWritten: number
  maxBooks: number
  // v2.2.2: 封笔时一次性广播 toast 的标记
  retirementAnnounced?: boolean
}

export interface Bookstore {
  id: string
  name: string
  tier: number
  shelf: string[]
  decorated: boolean
  signingUntil: number | null  // playTicks when signing boost ends
}

export interface Department {
  id: string
  type: DepartmentType
  level: number
  upgradeCostRP: number
  upgradeCostPrestige: number
  upgradeTicks: number
  upgradingUntil: number | null
}

export interface CurrencyState {
  revisionPoints: number
  prestige: number
  royalties: number
  statues: number
  // v2.2.3: 梦境创作的核心资源
  // 审稿/出版获取，投入梦境项目消耗
  inspiration: number
}

export interface PermanentBonuses {
  manuscriptQualityBonus: number
  editingSpeedBonus: number
  royaltyMultiplier: number
  authorTalentBoost: number
  spawnRateBonus: number
  bossYears: number
  countRelation: number
  countGender: 'male' | 'female'
  epochPath: 'scholar' | 'merchant' | 'socialite' | null
}

export interface PlayerState {
  currencies: CurrencyState
  permanentBonuses: PermanentBonuses
  trait: EditorTrait | null
  totalPublished: number
  totalBestsellers: number
  totalRejections: number
  playTicks: number
  lastSaveTick: number
}

export interface GameEvent {
  id: string
  type: EventType
  title: string
  description: string
  buff: EventBuff | null
  remainingTicks: number
}

export interface EventBuff {
  genre: Genre | null
  salesMultiplier: number
}

export interface ToastMessage {
  id: string
  text: string
  type: ToastType
  createdAt: number
}

// ──── Game tick result ────
export interface TickResult {
  newManuscripts: Manuscript[]
  publishedBooks: Manuscript[]
  royaltiesEarned: number
  toasts: ToastMessage[]
  eventsTriggered: GameEvent[]
  authorsReturned: Author[]
  catDecisionAvailable: boolean
}

export interface CatState {
  name: string
  affection: number
  age: number
  immortal: boolean
  alive: boolean
  immortalityPrompted: boolean
}
