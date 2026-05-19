import type { Genre, AuthorPersona } from '../types'

// ──── Persona-genre bias map ────
// 决定每种人格擅长写哪类作品。
// 题材分配逻辑：
//  - 长寿学术型（巫妖/女巫古魔典/血族贵族）→ 真实研究/跨种合著（积淀深）
//  - 文艺敏感型（血族诗人/哀嚎妖/换生灵）→ 银器恐怖/跨种合著
//  - 大众流行型（年轻血族/狼人/凡间快枪手）→ 少年血宫/凡间悬案
//  - 神秘预言型（风暴女巫）→ 日光幻想/银器恐怖
//  - 调查实干型（血族侦探/凡人记者/食尸鬼学者）→ 凡间悬案/真实研究
export const PERSONA_GENRE_BIAS: Partial<Record<AuthorPersona, Genre[]>> = {
  // 吸血鬼系 —— 永夜世界的天然贵族
  'vampire-aristocrat-historian':  ['social-science', 'hybrid'],
  'vampire-decadent-poet':         ['suspense', 'hybrid'],
  'vampire-young-rebel':           ['light-novel', 'mystery'],
  'vampire-amateur-detective':     ['mystery', 'suspense'],
  // 狼人系 —— 热情但常被月相干扰
  'werewolf-pack-bard':            ['hybrid', 'light-novel'],
  'werewolf-suburban-novelist':    ['light-novel', 'hybrid'],
  'werewolf-frontier-survivor':    ['suspense', 'social-science'],
  // 女巫系 —— 神秘且情绪波动巨大
  'witch-grimoire-keeper':         ['social-science', 'hybrid'],
  'witch-kitchen-novelist':        ['light-novel', 'mystery'],
  'witch-storm-prophetess':        ['sci-fi', 'suspense'],
  // 亡灵系 —— 寡言但极其深刻
  'lich-archive-curator':          ['social-science', 'hybrid'],
  'banshee-mourning-poet':         ['suspense', 'hybrid'],
  // 食尸鬼 —— 最接地气的地下学者
  'ghoul-cemetery-historian':      ['social-science', 'mystery'],
  // 人类知情者 —— 用短暂生命追寻真相
  'mortal-investigative-journalist': ['social-science', 'mystery'],
  'mortal-bestseller-hustler':     ['light-novel', 'mystery'],
  // 奇幻种族
  'fae-changeling-fabulist':       ['hybrid', 'sci-fi'],
  'demon-bureaucrat':              ['social-science', 'suspense'],
  // v2.5 新增
  'ghost-gothic-poet':             ['literary', 'suspense'],     // 哥特调诗集 / 凡间名著改写
  'mummy-chronicle-scholar':       ['fantasy', 'social-science'], // 古传说 + 社会纪实
  'noir-pulp-novelist':            ['suspense', 'mystery'],       // noir 主力
  'ancient-dragon-epic':           ['fantasy', 'literary'],       // 史诗巨著 + 凡间名著点评
}

// ──── 作品数上限（按种族寿命差异化）────
// [min, max] 创建作者时随机决定该作者一生总产量。
// 寿命越长的种族，作品数上下限越宽（一生可能写很多也可能只写几本）。
// 短寿命人类：少而快，频繁更替，制造"新人辈出"的群像感。
export const PERSONA_MAX_BOOKS: Partial<Record<AuthorPersona, [number, number]>> = {
  // 吸血鬼 —— 长寿，贵族沉稳少产、年轻热情多产
  'vampire-aristocrat-historian':  [4, 10],
  'vampire-decadent-poet':         [3, 8],
  'vampire-young-rebel':           [6, 15],
  'vampire-amateur-detective':     [4, 9],
  // 狼人 —— 中等寿命，生活节奏影响产量
  'werewolf-pack-bard':            [4, 10],
  'werewolf-suburban-novelist':    [3, 7],
  'werewolf-frontier-survivor':    [4, 8],
  // 女巫 —— 超长寿，但写作受"灵感季节"影响
  'witch-grimoire-keeper':         [5, 12],
  'witch-kitchen-novelist':        [3, 8],
  'witch-storm-prophetess':        [2, 5],
  // 亡灵 —— 极长寿但节奏极缓
  'lich-archive-curator':          [3, 6],
  'banshee-mourning-poet':         [2, 4],
  // 食尸鬼 —— 勤奋的田野工作者
  'ghoul-cemetery-historian':      [3, 7],
  // 人类知情者 —— 知道得太多，写得很少
  'mortal-investigative-journalist': [2, 4],
  'mortal-bestseller-hustler':     [3, 6],
  // 奇幻种族
  'fae-changeling-fabulist':       [3, 9],
  'demon-bureaucrat':              [3, 8],
  // v2.5 新增
  'ghost-gothic-poet':             [2, 5],   // 幽灵节奏极慢、产量少
  'mummy-chronicle-scholar':       [3, 6],   // 木乃伊勤奋但讲究
  'noir-pulp-novelist':            [5, 12],  // 黑色小说作家多产高产
  'ancient-dragon-epic':           [1, 3],   // 始祖龙一生只写极少几部巨著
}

export const DEFAULT_MAX_BOOKS: [number, number] = [3, 8]

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
  // v2.5
  'ghost-gothic-poet',
  'mummy-chronicle-scholar',
  'noir-pulp-novelist',
  'ancient-dragon-epic',
]

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
  // v2.5
  'ghost-gothic-poet':               '幽灵哥特诗人',
  'mummy-chronicle-scholar':         '木乃伊编年史家',
  'noir-pulp-novelist':              '黑色小说快手',
  'ancient-dragon-epic':             '始祖龙史诗作者',
}

export const PERSONA_SPECIES: Record<AuthorPersona, string> = {
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
  // v2.5 新种族
  'ghost-gothic-poet':               'ghost',
  'mummy-chronicle-scholar':         'mummy',
  'noir-pulp-novelist':              'human',  // 人类 noir 作家（短寿命快产）
  'ancient-dragon-epic':             'dragon',
}

// ──── 发表节奏（按种族/人格分档）────
// 这些不是代码变量，而是创作指导，用于决定每本新书的 cooldown 时长。
// 对应 personaPassives.ts 中的 speedBonus：
//   speedBonus 越大 → cooldown 越短 → 出书越快
//
// 快节奏（<5 分钟/本）：凡间快枪手、年轻血族叛逆
// 中节奏（10-20 分钟/本）：狼人吟游诗人、厨房女巫、血族侦探
// 慢节奏（>30 分钟/本）：巫妖、古魔典守护人、风暴女巫
export const PUBLISHING_RHYTHM = {
  fast: ['mortal-bestseller-hustler', 'vampire-young-rebel', 'noir-pulp-novelist'],
  medium: ['werewolf-pack-bard', 'witch-kitchen-novelist', 'vampire-amateur-detective',
           'werewolf-suburban-novelist', 'mortal-investigative-journalist',
           'fae-changeling-fabulist', 'demon-bureaucrat', 'werewolf-frontier-survivor',
           'mummy-chronicle-scholar'],
  slow: ['vampire-aristocrat-historian', 'vampire-decadent-poet', 'witch-grimoire-keeper',
         'witch-storm-prophetess', 'lich-archive-curator', 'banshee-mourning-poet',
         'ghoul-cemetery-historian', 'ghost-gothic-poet', 'ancient-dragon-epic'],
} as const
