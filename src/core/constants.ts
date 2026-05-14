import type { AuthorPersona, DepartmentType, EditorTrait, Genre } from './types'

// ──── Timing (1 tick = 1 second) ────
export const TICK_MS = 1000

// ──── Base spawn rates ────
export const BASE_MANUSCRIPT_SPAWN_INTERVAL = 30 // ticks between auto-spawns
export const MAX_SUBMITTED_QUEUE = 20

// ──── Manuscript generation ────
export const MANUSCRIPT_QUALITY_MIN = 20
export const MANUSCRIPT_QUALITY_MAX = 85
export const MANUSCRIPT_WORDCOUNT_MIN = 30_000
export const MANUSCRIPT_WORDCOUNT_MAX = 150_000
export const MANUSCRIPT_WORDS_PER_TICK = 500 // editing speed per tick

// ──── Editing stages ────
export const REVIEW_TICKS_BASE = 10
export const EDITING_TICKS_BASE = 30
export const PROOFING_TICKS_BASE = 15
export const PUBLISHING_TICKS_BASE = 8

// ──── Currency rewards ────
export const RP_PER_REVIEW = 5
export const RP_PER_EDIT = 3
export const RP_PER_PROOF = 2
export const RP_BASE_PER_PUBLISH = 50
export const ROYALTY_BASE_RATE = 0.25 // per tick per book
export const PRESTIGE_PER_PUBLISH = 10
export const PRESTIGE_PER_BESTSELLER = 50

// ──── Bestseller threshold ────
export const BESTSELLER_SALES = 30_000

// ──── Author ────
export const AUTHOR_BASE_TALENT = 30
export const AUTHOR_TALENT_RANGE = 40
export const AUTHOR_BASE_RELIABILITY = 20
export const AUTHOR_RELIABILITY_RANGE = 60
export const AUTHOR_COOLDOWN_BASE = 1800 // 30 min
export const AUTHOR_COOLDOWN_PER_REJECTION = 300 // +5 min per reject
export const AUTHOR_RETURN_QUALITY_BOOST = 3 // quality per rejection
export const MAX_AUTHORS = 20

// ──── Author tier progression ────
export const AUTHOR_FAME_PER_PUBLISH = 10 // base fame per published book
export const AUTHOR_TIER_THRESHOLDS: Record<string, number> = {
  known: 100, // signed → known: ~10 books
  idol: 500,  // known → idol: ~50 books
}

// ──── Genre preference ────
export const GENRE_PREFERENCE_THRESHOLDS = [50, 200, 800, 2000]
export const GENRE_PREFERENCE_QUALITY_BONUS = 5
export const GENRE_PREFERENCE_SALES_BONUS = 0.1

// ──── Author persona names ────
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

// ──── Department ────
export const DEPARTMENT_BASE_COST_RP = 50
export const DEPARTMENT_COST_MULTIPLIER = 1.5
export const DEPARTMENT_BASE_EFFICIENCY: Record<DepartmentType, number> = {
  editing: 0.5,
  design: 0.3,
  marketing: 0.2,
  rights: 0.15,
}
export const DEPARTMENT_UPGRADE_TICKS_BASE = 180 // 3 min
export const DEPARTMENT_MAX_LEVEL = 10

// ──── Market trends ────
export const MARKET_TREND_INTERVAL_MIN = 7200 // 2 hours
export const MARKET_TREND_INTERVAL_MAX = 14400 // 4 hours
export const MARKET_TREND_MULTIPLIER_MIN = 1.2
export const MARKET_TREND_MULTIPLIER_MAX = 2.0
export const MARKET_TREND_DURATION = 3600 // 1 hour

// ──── Literary awards ────
export const AWARD_INTERVAL = 21600 // 6 hours
export const AWARD_NOMINATION_THRESHOLD = 60 // quality threshold

// ──── Rebirth ────
export const REBIRTH_THRESHOLD_BESTSELLERS = 1 // how many bestsellers needed
export const REBIRTH_STATUE_BONUSES = {
  qualityPerStatue: 2,
  speedPerStatue: 0.05,
  royaltyPerStatue: 0.1,
  talentPerStatue: 1,
  spawnPerStatue: 0.03,
}

export const BOSS_START_YEARS = 15

// ──── Automation perks ────
export const AUTO_REVIEW_DEPT_LEVEL = 3   // editing dept level >=3 unlocks auto-review
export const AUTO_COVER_PRESTIGE = 100     // prestige >=100 unlocks auto-cover (placeholder)
export const AUTO_REJECT_PRESTIGE = 200    // prestige >=200 + level 5 editing unlocks auto-reject unsuitable
export const PUBLISHING_QUOTA_PER_MONTH = 10

// ──── Author affection ────
export const AFFECTION_PER_PUBLISH = 5
export const AFFECTION_PER_QUALITY_PUBLISH = 3  // bonus if quality >= 60
export const AFFECTION_PER_PROMOTION = 20
export const AFFECTION_PER_SIGN = 10
export const AFFECTION_PER_METICULOUS = 3
export const AFFECTION_REJECT_PENALTY = -10
export const AFFECTION_BAD_PUBLISH_PENALTY = -5
export const AFFECTION_ELITE_TALENT = 60  // talent threshold for elite status
export const AFFECTION_LOYAL = 100
export const AFFECTION_LETTER = 50  // first thank-you threshold

// ──── Milestones (playTicks) ────
export const MILESTONES = [
  { ticks: 0, message: '永夜出版社迎来了又一个平凡的工作日。你在吱嘎作响的旧桌前坐下——这张桌子比你老，但比你短命的主人活得久。' },
  { ticks: 600, message: '第一本书出版。说实话，你在1732年出版第一本书时比现在兴奋。但习惯是个好东西——尤其是当你永远死不了。' },
  { ticks: 1200, message: '你雇了一位人类助理。Ta 最大的资历：不怕吸血鬼，且有一支能写出字的笔。' },
  { ticks: 3600, message: '三个完整的部门组建完毕。创始人伯爵从棺材里给你发了封感谢信——字迹潦草，但心意到了。' },
  { ticks: 10800, message: '第一本畅销书诞生。作者现在自称"文坛新星"。你算了算，以你的寿命，大概还能见证他重孙也获这个奖。' },
  { ticks: 28800, message: '第一座铜像到手。严格来说，是塑料的——毕竟伯爵他老人家虽然活了三个世纪，但预算永远是紧巴巴的。' },
]

// ──── Editor trait bonuses ────
export const EDITOR_TRAIT_BONUSES: Record<EditorTrait, { rpBonus: number; qualityBonus: number; speedBonus: number }> = {
  decisive: { rpBonus: 0.2, qualityBonus: 0, speedBonus: 0.15 },
  meticulous: { rpBonus: 0, qualityBonus: 0.1, speedBonus: 0 },
  visionary: { rpBonus: 0.1, qualityBonus: 0.05, speedBonus: 0.05 },
}

// ──── Genre colours for placeholder covers ────
export const GENRE_COVER_COLORS: Record<Genre, string> = {
  'sci-fi': '#1a1a2e',
  mystery: '#2d2d1a',
  suspense: '#1a1a1a',
  'social-science': '#2e1a1a',
  hybrid: '#1a2e2d',
  'light-novel': '#2a1a3e',
}

// ──── Author persona signature phrases ────
export const AUTHOR_PERSONA_PHRASES: Record<AuthorPersona, string[]> = {
  'retired-professor': [
    '"截稿日期，说到底，只是一种建议。"',
    '"作品写完自然就交了，急什么。"',
  ],
  'basement-scifi-geek': [
    '"量子力学部分应该没算错……吧。"',
    '"这份稿子直接取代了我这周的睡眠，字面意义上。"',
  ],
  'ex-intelligence-officer': [
    '"我可以告诉你灵感的来源，但之后恐怕得……总之不太方便。"',
    '"这只是小说。大概吧。"',
  ],
  'sociology-phd': [
    '"光是脚注就写了四十页，不客气。"',
    '"我调研了两千人。他们……怎么说呢，帮不上什么忙。"',
  ],
  'anxious-debut': [
    '"写得不是很好。可能其实还行。对不起。"',
    '"别太嫌弃就行。嫌弃也行，我理解。"',
  ],
  'reclusive-latam-writer': [
    '"我的文学经纪人已经不接我电话了。这是好现象。"',
    '"这篇稿子花了我十七年。前面十六年都在泡茶。"',
    '"不要按章节读。从第104页开始，然后跳回第3页。相信我。"',
  ],
  'nordic-crime-queen': [
    '"主角会在第47页发现第一具尸体。第二具会在……不能说。"',
    '"我写作的时候房间里必须降到12度。暖气是灵感的敌人。"',
    '"不是所有的死亡都是谋杀。但在这本书里，大部分是。"',
  ],
  'american-bestseller-machine': [
    '"这本书的后半部分是我在签售会上写的。前一半是编辑写的。说实话分不清了。"',
    '"已经有三个制片人在竞价改编权了。书还没出版，但你知道的——好莱坞。"',
    '"每章必须以一个钩子结尾。这不是建议，这是物理定律。"',
  ],
  'japanese-lightnovel-otaku': [
    '"这次的异世界没有魔王，但有出版社。主角用现代管理学拯救倒闭的编辑部。"',
    '"如果篇幅不够，我可以在第三章加一个泳装回。不用谢。"',
    '"这是系列的第14卷。前13卷在硬盘里——等出版社会打电话的时候再拿出来。"',
  ],
  'historical-detective-writer': [
    '"这段史料我翻了三个月。结论是：古人也拖稿。"',
    '"案牍库里翻出来的真实故事，比小说离奇多了。"',
  ],
  'fantasy-epic-writer': [
    '"地图还有三张没画完。别催。"',
    '"编年史只写了前六千年——后两千年还在整理。"',
    '"角色太多了？不，这才一百二十七个有名有姓的。这才第一卷。"',
    '"结局我已经想好了——大纲，不是正文。具体内容取决于截稿日。"',
  ],
  'french-literary-recluse': [
    '"这句话我改了十七遍。第十七遍和第一遍完全一样。"',
    '"出版社？哪个出版社？我不在乎。"',
  ],
  'indian-epic-sage': [
    '"这部史诗只有七卷。每卷大概一千页。"',
    '"故事的核心在前四百页铺垫之后才真正开始。"',
  ],
  'russian-doom-spiral': [
    '"幸福在文学中不真实。只有痛苦才经得起排版。"',
    '"结尾是开放的。完全开放。读者自己决定谁活了下来——我会在脚注里留些线索。"',
  ],
  'korean-webnovel-queen': [
    '"今天也准时上传了四千字。睡眠是凡人的事。"',
    '"读者在评论区说第一章埋的伏笔在第四十七章才回收——他们注意到了！"',
  ],
  'nigerian-magical-realist': [
    '"神灵在茶馆里点了一杯美式咖啡。世界果然变了。"',
    '"讲故事不是我的选择——是祖先的。"',
  ],
  'australian-outback-gothic': [
    '"土地也有记忆。大部分不是好的记忆。"',
    '"你在地平线上看到的不是雾气。那是另一种东西。"',
  ],
}