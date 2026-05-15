import type { AuthorPersona } from '../types'

// ──── Canonical author name pools ────
// Single source of truth — used by both constants.ts (display) and authorFactory.ts (creation)

export const AUTHOR_PERSONA_NAMES: Record<AuthorPersona, string[]> = {
  'retired-professor': ['沈默然', '林怀瑾', '顾知秋', '苏砚清', '叶知秋', '孟晚舟', '秦观海', '陶退之', '谢半生', '裴未老'],
  'basement-scifi-geek': ['星野零', '陆星辰', '方代码', '季银河', '夏宇尘', '云起时', '钟离渊', '上官惑', '端木奇'],
  'ex-intelligence-officer': ['陈深', '秦墨', '韩隐', '洛铮', '石藏锋', '冷无言', '段无名', '尉迟默', '慕容简'],
  'sociology-phd': ['周知行博士', '温如言博士', '许观澜博士', '李问策博士', '郑观潮博士', '柳问津博士', '司马见微博士'],
  'anxious-debut': ['小透明', '宋迟迟', '姜未名', '沈惴惴', '贺小怯', '莫彷徨', '简不安', '顾忐忑', '叶微颤'],
  'reclusive-latam-writer': ['Gabriel·Manana（加布里埃尔·明日复明日）', 'Mario·Llama（马里奥·没灵感）', 'Julio·Taza（胡里奥·一杯茶写一页）', 'Roberto·Rano（罗贝托·慢慢写）'],
  'nordic-crime-queen': ['Ingrid·Frost（英格丽·冷飕飕）', 'Astrid·Winter（阿斯特丽德·冻死人）', 'Sigrid·Snow（西格丽德·下大雪）', 'Freya·Winter（芙蕾雅·下冰雹）'],
  'american-bestseller-machine': ['Jack·Bestsell（杰克·畅销王）', 'Emily·Pageturn（艾米丽·翻页快）', 'Taylor·Delay（泰勒·拖延症）', 'Morgan·Signing（摩根·签不完）'],
  'japanese-lightnovel-otaku': ['Tanaka Light（田中·亮得耀眼）', 'Suzuki Novel（铃木·小说家）', 'Sato Isekai（佐藤·又穿越了）', 'Takahashi Tensei（高桥·又转生了）'],
  'historical-detective-writer': ['马上飞', '史料虫', '文考源', '古道今', '案牍生', '鉴古斋主'],
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
  '前任咖啡店店员', '自称是猫的人', '失眠写作爱好者', '深夜打字机',
  '欠稿费的人', '上周来过茶水间的', '被你退过两次稿的人',
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
