import type { AuthorPersona } from '../types'

// ──── Canonical author name pools ────
// Single source of truth — used by both constants.ts (display) and authorFactory.ts (creation)

export const AUTHOR_PERSONA_NAMES: Record<AuthorPersona, string[]> = {
  'retired-professor': ['沈默然', '顾知秋', '孟晚舟', 'Victor·Page（维克多·佩奇）', 'Helena·Frost（海伦娜·弗罗斯特）', 'Marco·Costa（马可·科斯塔）', 'Nora·Blackwood（诺拉·黑木）', 'Isaac·Wyatt（艾萨克·怀亚特）', 'Beatrice·Oldham（碧翠丝·奥尔德姆）', 'Arthur·Quill（亚瑟·奎尔）'],
  'basement-scifi-geek': ['星野零', '陆星辰', '方代码', 'Nova·Bite（诺瓦·比特）', 'Sebastian·Quark（塞巴斯蒂安·夸克）', 'Ada·Circuit（艾达·回路）', 'Max·Warp（马克斯·跃迁）', 'Leah·Node（莉亚·节点）', 'Zero·Protocol（零号协议）'],
  'ex-intelligence-officer': ['陈深', '秦墨', '韩隐', 'Victor·Shade（维克多·影）', 'Elena·Locke（艾琳娜·洛克）', 'Gray·Fell（格雷·菲尔）', 'Marcus·Cipher（马库斯·密文）', 'Natasha·Deep（娜塔莎·深）', 'Isabella·Vault（伊莎贝拉·穹）'],
  'sociology-phd': ['周知行博士', '温如言博士', 'Emily·Clarke博士（艾米丽·克拉克）', 'Victor·Weber博士（维克多·韦伯）', 'Susan·Mills博士（苏珊·米尔斯）', 'Karl·Mann博士（卡尔·曼海姆）', 'Hannah·Arden博士（汉娜·阿登特）'],
  'anxious-debut': ['小透明', '宋迟迟', '沈惴惴', '匿名のEliot（匿名的艾略特）', 'Unsigned·Jane（未签名的简）', 'First-timer·Leo（第一次投稿的利奥）', 'Corner·Suzie（躲在角落的苏西）', 'Ink·Spiller（滴墨者）', 'Nervous·Typewriter（紧张打字机）'],
  'reclusive-latam-writer': ['Gabriel·Manana（加布里埃尔·明日复明日）', 'Mario·Llama（马里奥·没灵感）', 'Julio·Taza（胡里奥·一杯茶写一页）', 'Roberto·Rano（罗贝托·慢慢写）'],
  'nordic-crime-queen': ['Ingrid·Frost（英格丽·冷飕飕）', 'Astrid·Winter（阿斯特丽德·冻死人）', 'Sigrid·Snow（西格丽德·下大雪）', 'Freya·Winter（芙蕾雅·下冰雹）'],
  'american-bestseller-machine': ['Jack·Bestsell（杰克·畅销王）', 'Emily·Pageturn（艾米丽·翻页快）', 'Taylor·Delay（泰勒·拖延症）', 'Morgan·Signing（摩根·签不完）'],
  'japanese-lightnovel-otaku': ['Tanaka Light（田中·亮得耀眼）', 'Suzuki Novel（铃木·小说家）', 'Sato Isekai（佐藤·又穿越了）', 'Takahashi Tensei（高桥·又转生了）'],
  'historical-detective-writer': ['马上飞', '鉴古斋主', 'Philip·Archive（菲利普·档案）', 'Laurence·Vellum（劳伦斯·羊皮纸）', 'Veronica·Coldcase（维罗妮卡·旧案）', 'Edgar·Folio（埃德加·尘卷）'],
  'fantasy-epic-writer': [
    'Robert·Roundabout（罗伯特·绕远路）', 'George·Slowwrite·Martin（乔治·慢写慢写·马丁）',
    'J·R·R·Prolongue（J·R·R·铺垫金）', 'Brandon·TooFast（布兰登·写太快）',
    'Terry·Flatworld（特里·扁平世界）', 'Andrzej·GameCanon（安德烈·游戏正统）',
    'Patrick·ChapterThree（帕特里克·第三章还没写完）', 'Robin·Hobbyname（罗宾·笔名太长）',
  ],
  'french-literary-recluse': ['Marguerite·SansFin（玛格丽特·没写完）', 'Jacques·Phrase（雅克·长句子）', 'Céline·Rature（塞琳·改不完）'],
  'indian-epic-sage': ['Anand·Purana（阿南德·往世书）', 'Kavita·Mahabharata（卡维塔·太长了）', 'Raj·Samsara（拉杰·轮回中）'],
  'russian-doom-spiral': ['Dmitri·Toska（德米特里·苦闷）', 'Natalia·Zima（娜塔莉亚·凛冬）', 'Sergei·OchenDlinno（谢尔盖·太长了）'],
  'korean-webnovel-queen': ['Park·DailyUpdate（朴·日更万）', 'Kim·Hiatus（金·休刊）', 'Choi·Paywall（崔·付费墙）'],
  'nigerian-magical-realist': ['Chinua·Spirit（钦努阿·神灵附体）', 'Adaeze·Oracle（阿达泽·神谕）', 'Olu·MarketGod（奥卢·市场之神）'],
  'australian-outback-gothic': ['Bruce·RedDust（布鲁斯·红尘）', 'Sheila·Heatwave（希拉·热浪）', 'Mick·Drought（米克·大旱）'],
}

// ──── Fallback pen names (when all real names are taken) ────

export const PEN_NAME_POOL = [
  '匿名先生', '某不知名作者', '编辑部对面的那个', '一个不愿透露姓名的人',
  '失眠写作爱好者', '深夜打字机', '欠稿费的人',
  'Anonymous·Nocturne（夜曲匿名者）', 'The·Stranger·in·the·Coffin（棺材里的陌生人）',
  'A·Ghostwriter（幽灵写手）', 'Midnight·Baker（午夜面包师）',
]

// ──── LLM-generated author name pool (loaded at runtime) ────

let authorNamePool: Record<string, string[]> | null = null

export function getAuthorNamePool() { return authorNamePool }

export async function loadAuthorNamePool() {
  try {
    const res = await fetch('/authors/names.json')
    if (res.ok) authorNamePool = await res.json()
  } catch { /* use hardcoded names */ }
}
