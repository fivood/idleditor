import type { AuthorPersona } from '../types'

// ──── 永夜世界虚构地名 ────
// 仅文档用途，可在文案里引用：
//  - 血都 Bloodspire（吸血鬼贵族聚居的首都旧城）
//  - 灰狼镇 Grayhowl（狼人小镇，月圆夜的狂欢中心）
//  - 银林 Silvergrove（女巫的森林集会区）
//  - 蜡都 Waxhold（巫妖们的档案城）
//  - 月谷 Moonvale（混居乡村）
//  - 烟堡 Smokefort（工业暗街）
//  - 镜湖 Mirrorlake（被诅咒的湖区）
//  - 永夜首都 Eternalnight Capital
//  - 雾乡 Mistlands（边境乡野）
//  - 红霜区 Redfrost District

// ──── 作者姓名池（按 persona 分组）────
// 全部虚构姓氏戏仿，无现实国家/民族联系。
// 平均 8-12 个名字/persona，保证创建作者时不重名概率高
export const AUTHOR_PERSONA_NAMES: Record<AuthorPersona, string[]> = {
  // ─── 吸血鬼系 ───
  'vampire-aristocrat-historian': [
    'Cassius·Vasilius（卡西乌斯·瓦希里斯）',
    'Lady Octavia·Noctemir（奥克塔维娅夫人·夜暮）',
    'Lord Edmund·Sanguine（埃德蒙伯爵·血脉）',
    'Vespera·Crimsonel（薇斯佩拉·绯红铭）',
    'Lucien·von Lichtsterben（卢西安·冯·光殁）',
    'Marchioness Iolanthe·Pallenor（约兰特侯爵夫人·苍辉）',
    'Tertius·Aetheran（泰提乌斯·永恒）',
    'Camilla·Mortvelle（卡米拉·静夜城）',
  ],
  'vampire-decadent-poet': [
    'Mortimer·Inkfang（莫蒂默·墨齿）',
    'Selvana·Crepusculé（赛尔瓦娜·薄暮）',
    'Drogo·Hemmlock（德罗戈·暗草）',
    'Lascelle·Wormwood（拉塞尔·苦艾）',
    'Octavian·Stillpool（奥克塔维安·静水）',
    'Vivienne·Madrigal（薇薇安·歌咏）',
    'Renaud·Pénombre（雷诺·阴翳）',
  ],
  'vampire-young-rebel': [
    'Felix·Brightwick（菲利克斯·亮烛）',
    'Mira·Halfmoon（米拉·半月）',
    'Theo·Quickfangs（西奥·快牙）',
    'Lyra·Nightshift（莱拉·夜班）',
    'Damiano·Rustcoat（达米亚诺·锈衣）',
    'Pepper·Pulsewright（佩珀·脉冲）',
    'Cyrus·Ashglow（赛勒斯·灰辉）',
    'Indira·Maverick（因迪拉·叛行）',
  ],
  'vampire-amateur-detective': [
    'Magnus·Coldwitness（马格努斯·冷证）',
    'Adelaide·Pallid（阿德莱德·苍白）',
    'Quentin·Veilbreaker（昆丁·破纱）',
    'Helena·Threadbare（海伦娜·线索）',
    'Florian·Lattimer（弗洛里安·拉提墨）',
    'Persephone·Underglass（佩塞福涅·镜下）',
    'Roderick·Quietstride（罗德里克·静步）',
  ],

  // ─── 狼人系 ───
  'werewolf-pack-bard': [
    'Brann·Howlrend（布兰·啸裂）',
    'Skadi·Moonspeak（斯卡迪·月语）',
    'Garek·Fenris（加雷克·芬里斯）',
    'Yola·Greypelt（约拉·灰毛）',
    'Mosse·Threnody（莫斯·哀曲）',
    'Hrolf·Saltjaw（赫罗尔夫·咸颚）',
  ],
  'werewolf-suburban-novelist': [
    'Maya·Hearthwild（玛雅·壁炉野）',
    'Tobias·Backyardlupus（托拜厄斯·后院狼）',
    'Bri·Picnictail（布丽·野餐尾）',
    'Norm·Schoolrun（诺姆·送娃跑）',
    'Vera·Casserole（薇拉·砂锅）',
  ],
  'werewolf-frontier-survivor': [
    'Goran·Saltbluff（戈兰·盐崖）',
    'Tessera·Drylands（特塞拉·旱地）',
    'Halvor·Pinemark（哈尔沃·松痕）',
    'Roan·Wendwild（罗恩·风荒）',
    'Bex·Salmer（贝克斯·萨尔默）',
  ],

  // ─── 女巫系 ───
  'witch-grimoire-keeper': [
    'Mother Esmeralda·Thornweb（艾斯梅拉达老母·荆网）',
    'Sister Iolan·Cinderwick（伊奥兰女巫·烬芯）',
    'Crone Maledictrix·Vespers（玛勒迪特里克斯长老·夕祷）',
    'Madame Vespertilia·Ashroot（薇斯帕缇莉夫人·灰根）',
    'Old Wren·Quickenbloom（老雷恩·速绽）',
    'Aunt Margery·Veil（玛杰丽姨母·薄纱）',
  ],
  'witch-kitchen-novelist': [
    'Beatrix·Mossbrew（碧翠丝·苔酿）',
    'Jenna·Saffroncauldron（杰娜·藏红锅）',
    'Mama Tilda·Honeyglass（蒂尔达妈妈·蜜瓶）',
    'Susu·Cinnamonbroom（苏苏·桂帚）',
    'Henrietta·Sourdough（亨利埃塔·酸面）',
  ],
  'witch-storm-prophetess': [
    'Iskara·Tempestcall（伊斯卡拉·唤暴）',
    'Vexa·Hailmurmur（薇克莎·雹语）',
    'Oracle Pelagia·Greysky（佩拉吉娅神谕者·灰天）',
  ],

  // ─── 亡灵系 ───
  'lich-archive-curator': [
    'Curator Vorgath·Marrowsong（沃格斯馆长·髓吟）',
    'Archivist Cinerith·Lethalan（西涅瑞斯档管·寂河）',
    'Magister Oss·Pageturner（奥斯术法师·翻页）',
    'Keeper Mortis·Foliospine（莫提斯守者·折页脊）',
  ],
  'banshee-mourning-poet': [
    'Wail·of·Lunara（卢娜拉之嚎）',
    'Sob·of·Pyrren（皮伦之泣）',
    'Threnody·Calling（哀曲·之呼）',
    'Sigh·of·Vellinor（薇林诺之叹）',
  ],

  // ─── 食尸鬼 ───
  'ghoul-cemetery-historian': [
    'Brogan·Boneholt（布罗根·骨堡）',
    'Vellie·Sepulchre（薇利·墓窟）',
    'Old Dust·Gravelman（老尘·砾汉）',
    'Madge·Crypttooth（玛奇·墓齿）',
    'Sallow·Headstone（萨洛·碑头）',
  ],

  // ─── 人类（知情者）───
  'mortal-investigative-journalist': [
    'Eleanor·Wakefield（埃莉诺·维克菲尔德）',
    'Trent·Hayworth（特伦特·海沃斯）',
    'Maris·Pennfold（玛瑞斯·笔册）',
    'Doug·Lattimer（道格·拉提墨）',
    'Iris·Cornwright（艾里斯·谷直）',
    'Sam·Underwire（萨姆·线下）',
  ],
  'mortal-bestseller-hustler': [
    'Brent·Slater（布伦特·斜板）',
    'Kelsey·Pageturn（凯尔西·翻页）',
    'Doug·Quickbuck（道格·快钱）',
    'Wendy·Cliffhanger（温迪·悬念）',
    'Jess·Trilogy（杰丝·三部曲）',
    'Aaron·Hookline（亚伦·钩线）',
  ],

  // ─── 奇幻种族 ───
  'fae-changeling-fabulist': [
    'Brierwild·the·Sevenname（七名者·荆野）',
    'Hollin·Faylight（霍林·仙光）',
    'Wisp·Greenmoss（薇斯普·青苔）',
    'Tatterskin（碎肤）',
    'Last·Acorn（最末橡果）',
  ],
  'demon-bureaucrat': [
    'Phyrith·Form-7B（菲里斯·表7B）',
    'Auditor Hellebore（赫勒博尔稽核员）',
    'Director Inkfang·jr.（墨齿署长·小）',
    'Clerk Vellmoor·Subsection·4（薇尔莫尔文员·第四款）',
    'Notary Cintherex（辛西雷克斯公证人）',
  ],
}

// ──── 兜底笔名（所有真名都用完时）────
export const PEN_NAME_POOL = [
  '匿名先生', '某不知名作者', '编辑部对面的那个', '一个不愿透露姓名的人',
  '失眠写作爱好者', '深夜打字机', '欠稿费的人',
  '自称是猫的人', '夜行邮政退回的稿件原主',
  'Anonymous·Nocturne（夜曲匿名者）',
  'The·Stranger·in·the·Coffin（棺材里的陌生人）',
  'A·Ghostwriter（幽灵写手）',
  'Midnight·Baker（午夜面包师）',
  'A·Day-Shift·Wakefield（白班维克菲尔德）',
]

// ──── LLM 预生成作者名池（运行时加载）────
let authorNamePool: Record<string, string[]> | null = null

export function getAuthorNamePool() { return authorNamePool }

export async function loadAuthorNamePool() {
  try {
    const res = await fetch('/authors/names.json')
    if (res.ok) authorNamePool = await res.json()
  } catch { /* 失败就用硬编码姓名池 */ }
}
