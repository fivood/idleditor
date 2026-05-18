import type { Genre, AuthorPersona } from '../types'

// ──── Persona-genre bias map ────
// 决定每种人格擅长写哪类作品。
// 题材分配大致逻辑：
//  - 学者型（巫妖/巫师/记者）→ 真实研究/凡间悬案
//  - 文艺型（吸血鬼贵族/精灵/哀嚎妖）→ 跨种合著/银器恐怖
//  - 大众型（年轻吸血鬼/狼人/凡间快枪手）→ 少年血宫/凡间悬案
//  - 神秘型（女巫预言家/换生灵）→ 日光幻想（吸血鬼们最幻想的题材）
export const PERSONA_GENRE_BIAS: Partial<Record<AuthorPersona, Genre[]>> = {
  // 吸血鬼系
  'vampire-aristocrat-historian':  ['social-science', 'hybrid'],
  'vampire-decadent-poet':         ['suspense', 'hybrid'],
  'vampire-young-rebel':           ['light-novel', 'mystery'],
  'vampire-amateur-detective':     ['mystery', 'suspense'],
  // 狼人系
  'werewolf-pack-bard':            ['hybrid', 'light-novel'],
  'werewolf-suburban-novelist':    ['light-novel', 'hybrid'],
  'werewolf-frontier-survivor':    ['suspense', 'social-science'],
  // 女巫系
  'witch-grimoire-keeper':         ['social-science', 'hybrid'],
  'witch-kitchen-novelist':        ['light-novel', 'mystery'],
  'witch-storm-prophetess':        ['sci-fi', 'suspense'],
  // 亡灵系
  'lich-archive-curator':          ['social-science', 'hybrid'],
  'banshee-mourning-poet':         ['suspense', 'hybrid'],
  // 食尸鬼
  'ghoul-cemetery-historian':      ['social-science', 'mystery'],
  // 人类
  'mortal-investigative-journalist': ['social-science', 'mystery'],
  'mortal-bestseller-hustler':     ['light-novel', 'mystery'],
  // 奇幻种族
  'fae-changeling-fabulist':       ['hybrid', 'sci-fi'],
  'demon-bureaucrat':              ['social-science', 'suspense'],
}

// ──── 作品数上限（按种族寿命差异化）────
// [min, max] 在创建作者时随机抽取，决定该作者一生总产量
// 这是 v2.2 的核心节奏控制：长寿种族写得多但慢，短寿命人类写得少更替快
export const PERSONA_MAX_BOOKS: Partial<Record<AuthorPersona, [number, number]>> = {
  // 吸血鬼（长寿但分类型：贵族慢、贵族少；年轻热血多产）
  'vampire-aristocrat-historian':  [5, 12],
  'vampire-decadent-poet':         [4, 10],
  'vampire-young-rebel':           [6, 15],   // 新生代血气方刚，写得多
  'vampire-amateur-detective':     [4, 9],
  // 狼人（中等寿命）
  'werewolf-pack-bard':            [4, 10],
  'werewolf-suburban-novelist':    [3, 7],    // 家庭羁绊，写得不多
  'werewolf-frontier-survivor':    [4, 8],
  // 女巫（超长寿但兴致间歇）
  'witch-grimoire-keeper':         [5, 12],
  'witch-kitchen-novelist':        [3, 8],
  'witch-storm-prophetess':        [2, 5],    // 神谕罕见
  // 亡灵（极长寿但低产）
  'lich-archive-curator':          [3, 7],    // 数十年才一本
  'banshee-mourning-poet':         [2, 4],    // 情感强烈但寡作
  // 食尸鬼
  'ghoul-cemetery-historian':      [3, 7],
  // 人类（短寿命，一生作品有限）
  'mortal-investigative-journalist': [2, 5],
  'mortal-bestseller-hustler':     [3, 6],
  // 奇幻种族
  'fae-changeling-fabulist':       [3, 9],    // 间歇性爆发
  'demon-bureaucrat':              [3, 8],
}

export const DEFAULT_MAX_BOOKS: [number, number] = [3, 8]

// ──── 所有 persona 键 ────
export const ALL_PERSONAS: AuthorPersona[] = [
  'vampire-aristocrat-historian',
  'vampire-decadent-poet',
  'vampire-young-rebel',
  'vampire-amateur-detective',
  'werewolf-pack-bard',
  'werewolf-suburban-novelist',
  'werewolf-frontier-survivor',
  'witch-grimoire-keeper',
  'witch-kitchen-novelist',
  'witch-storm-prophetess',
  'lich-archive-curator',
  'banshee-mourning-poet',
  'ghoul-cemetery-historian',
  'mortal-investigative-journalist',
  'mortal-bestseller-hustler',
  'fae-changeling-fabulist',
  'demon-bureaucrat',
]

// ──── 人格中文显示名（UI 用）────
export const PERSONA_LABELS: Record<AuthorPersona, string> = {
  'vampire-aristocrat-historian':    '血族贵族编年史家',
  'vampire-decadent-poet':           '颓废派血族诗人',
  'vampire-young-rebel':             '血族新生代叛逆',
  'vampire-amateur-detective':       '血族业余侦探小说家',
  'werewolf-pack-bard':              '狼群游吟诗人',
  'werewolf-suburban-novelist':      '郊区狼人家庭小说家',
  'werewolf-frontier-survivor':      '边境拓荒狼人',
  'witch-grimoire-keeper':           '古魔典守护人',
  'witch-kitchen-novelist':          '厨房女巫小说家',
  'witch-storm-prophetess':          '风暴预言女巫',
  'lich-archive-curator':            '巫妖档案馆长',
  'banshee-mourning-poet':           '哀嚎妖挽歌诗人',
  'ghoul-cemetery-historian':        '墓园食尸鬼地志学家',
  'mortal-investigative-journalist': '凡间调查记者',
  'mortal-bestseller-hustler':       '凡间畅销快枪手',
  'fae-changeling-fabulist':         '换生灵寓言家',
  'demon-bureaucrat':                '魔裔官僚作家',
}

// ──── 人格所属种族（用于未来按种族分类、世界观一致性）────
export const PERSONA_SPECIES: Record<AuthorPersona, 'vampire' | 'werewolf' | 'witch' | 'lich' | 'banshee' | 'ghoul' | 'human' | 'fae' | 'demon'> = {
  'vampire-aristocrat-historian':    'vampire',
  'vampire-decadent-poet':           'vampire',
  'vampire-young-rebel':             'vampire',
  'vampire-amateur-detective':       'vampire',
  'werewolf-pack-bard':              'werewolf',
  'werewolf-suburban-novelist':      'werewolf',
  'werewolf-frontier-survivor':      'werewolf',
  'witch-grimoire-keeper':           'witch',
  'witch-kitchen-novelist':          'witch',
  'witch-storm-prophetess':          'witch',
  'lich-archive-curator':            'lich',
  'banshee-mourning-poet':           'banshee',
  'ghoul-cemetery-historian':        'ghoul',
  'mortal-investigative-journalist': 'human',
  'mortal-bestseller-hustler':       'human',
  'fae-changeling-fabulist':         'fae',
  'demon-bureaucrat':                'demon',
}
