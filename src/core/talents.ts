export interface Talent {
  id: string
  tier: number
  label: string
  desc: string
  effects: {
    flipSpeed?: number
    editSpeed?: number
    affectionGain?: number
    qualityDetection?: number
    royaltyIncome?: number
    salesBoost?: number
    allStats?: number
    qualityFromEdit?: number
    authorTalentBoost?: number
    flipSpeedPenalty?: number
    affectionPenalty?: number
  }
}

export const TALENTS: Talent[] = [
  // Tier 1 — unlocked at editor Lv.3
  { id: 'speed-read', tier: 1, label: '速读', desc: '两百年足够让你学会在一杯茶的时间里翻完一本稿子。', effects: { flipSpeed: 0.2 } },
  { id: 'quick-pen', tier: 1, label: '快笔', desc: '你的红笔比别人的快。不是因为墨水，而是因为果断。', effects: { editSpeed: 0.15 } },
  { id: 'gentle-critique', tier: 1, label: '温和批评', desc: '退稿信写得比情书还温柔——作者们反而更愧疚。', effects: { affectionGain: 0.1 } },

  // Tier 2 — unlocked at Lv.6
  { id: 'scanner', tier: 2, label: '扫读', desc: '你不读每一个字——你读每一页的整体感觉。速度提升，偶尔漏掉细节。', effects: { flipSpeed: 0.3, qualityDetection: -0.05 } },
  { id: 'double-page', tier: 2, label: '双页', desc: '你学会了同时看两页。左手翻页右手批注，像某种文学章鱼。', effects: { editSpeed: 0.25 } },
  { id: 'empathic-reader', tier: 2, label: '共情阅读', desc: '你读得太投入了——慢，但作者能感觉到你真的在乎。', effects: { affectionGain: 0.2, flipSpeedPenalty: 0.1 } },

  // Tier 3 — unlocked at Lv.9
  { id: 'close-reader', tier: 3, label: '精读', desc: '每个字都读三遍。慢到让人发疯——但漏掉的细节几乎为零。', effects: { flipSpeedPenalty: 0.3, qualityDetection: 0.1 } },
  { id: 'all-nighter', tier: 3, label: '通宵', desc: '你不睡觉——你是吸血鬼。但作者们开始担心你的健康（真的担心吗）。', effects: { editSpeed: 0.4, affectionPenalty: 0.05 } },
  { id: 'mentor-aura', tier: 3, label: '导师光环', desc: '签约作者一见你就觉得"这位编辑懂我"——然后交出更好的稿子。', effects: { affectionGain: 0.15, authorTalentBoost: 5 } },

  // Tier 4 — unlocked at Lv.12
  { id: 'pricing-intuition', tier: 4, label: '定价直觉', desc: '你知道一本书该卖多少钱——精确到小数点后两位。读者们莫名其妙就付了更多。', effects: { royaltyIncome: 0.1 } },
  { id: 'negotiator', tier: 4, label: '谈判专家', desc: '和印刷厂、作者、书店的每一次谈判，你都赢了。不是靠口才——是靠活得比他们久。', effects: { allStats: 0.05 } },
  { id: 'marketing-eye', tier: 4, label: '营销眼', desc: '你本能地知道哪本书会在社交媒体上爆红。通常准——不可靠的历史只有三次。', effects: { salesBoost: 0.15 } },

  // Tier 5 — unlocked at Lv.15
  { id: 'undying-patience', tier: 5, label: '不死耐心', desc: '你对稿子的修改总是刚刚好——不多不少。就像活了这么多年，你知道什么值得改。', effects: { qualityFromEdit: 0.1 } },
  { id: 'century-experience', tier: 5, label: '百年经验', desc: '有些东西只能靠时间学会。比如——你比你想象中更有经验。', effects: { allStats: 0.05 } },
  { id: 'night-vision', tier: 5, label: '夜视', desc: '吸血鬼的老朋友——黑暗。编辑部从来不开灯，但你读稿比谁都清楚。', effects: { flipSpeed: 0.15 } },
]

export const TALENT_TIERS = [1, 2, 3, 4, 5]
export const TALENT_UNLOCK_LEVELS: Record<number, number> = { 1: 3, 2: 6, 3: 9, 4: 12, 5: 15 }
