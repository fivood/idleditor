import type { Author, AuthorPersona } from '../types'

export interface PersonaPassive {
  qualityBonus: number
  speedBonus: number        // affects author cooldown interval（+ 加快出新书）
  royaltyBonus: number       // multiplicative on book royalties
  prestigeBonus: number      // flat prestige per publish
  salesBonus: number         // multiplicative on sales per tick
  wordCountBonus: number     // multiplicative on word count
  affectionGainBonus: number  // extra affection per positive interaction
  bestsellerThresholdReduction: number
}

// 永夜世界作者人格被动效果。
// 设计逻辑：
//  - 长寿种族（吸血鬼/女巫/巫妖）→ 品质 + 声望加成（积淀深）但速度慢
//  - 年轻种族（年轻吸血鬼/凡间快枪手）→ 速度 + 销量加成但品质低
//  - 高级种族（贵族吸血鬼/巫妖）→ 声望加成
//  - 大众种族（狼人/凡间快枪手）→ 销量加成
//  - 短寿命人类 → 速度极快但品质波动大
export const PERSONA_PASSIVES: Record<AuthorPersona, PersonaPassive> = {
  // 吸血鬼系
  'vampire-aristocrat-historian':  { qualityBonus: 4,  speedBonus: -0.3, royaltyBonus: 0,    prestigeBonus: 12, salesBonus: 0,    wordCountBonus: 0.4,  affectionGainBonus: -1, bestsellerThresholdReduction: 0 },
  'vampire-decadent-poet':         { qualityBonus: 3,  speedBonus: -0.2, royaltyBonus: 0,    prestigeBonus: 8,  salesBonus: 0.1,  wordCountBonus: 0,    affectionGainBonus: 0,  bestsellerThresholdReduction: 0 },
  'vampire-young-rebel':           { qualityBonus: -1, speedBonus: 0.25, royaltyBonus: 0.2,  prestigeBonus: 0,  salesBonus: 0.25, wordCountBonus: -0.1, affectionGainBonus: 2,  bestsellerThresholdReduction: 3000 },
  'vampire-amateur-detective':     { qualityBonus: 2,  speedBonus: 0,    royaltyBonus: 0,    prestigeBonus: 0,  salesBonus: 0.2,  wordCountBonus: 0,    affectionGainBonus: 0,  bestsellerThresholdReduction: 0 },
  // 狼人系
  'werewolf-pack-bard':            { qualityBonus: 2,  speedBonus: 0,    royaltyBonus: 0,    prestigeBonus: 5,  salesBonus: 0.15, wordCountBonus: 0.1,  affectionGainBonus: 1,  bestsellerThresholdReduction: 0 },
  'werewolf-suburban-novelist':    { qualityBonus: 1,  speedBonus: -0.1, royaltyBonus: 0.1,  prestigeBonus: 0,  salesBonus: 0.2,  wordCountBonus: 0,    affectionGainBonus: 2,  bestsellerThresholdReduction: 0 },
  'werewolf-frontier-survivor':    { qualityBonus: 2,  speedBonus: 0,    royaltyBonus: 0,    prestigeBonus: 0,  salesBonus: 0.1,  wordCountBonus: 0.2,  affectionGainBonus: -1, bestsellerThresholdReduction: 0 },
  // 女巫系
  'witch-grimoire-keeper':         { qualityBonus: 5,  speedBonus: -0.35,royaltyBonus: 0,    prestigeBonus: 10, salesBonus: 0,    wordCountBonus: 0.5,  affectionGainBonus: 0,  bestsellerThresholdReduction: 0 },
  'witch-kitchen-novelist':        { qualityBonus: 1,  speedBonus: 0,    royaltyBonus: 0.15, prestigeBonus: 0,  salesBonus: 0.2,  wordCountBonus: 0,    affectionGainBonus: 3,  bestsellerThresholdReduction: 0 },
  'witch-storm-prophetess':        { qualityBonus: 6,  speedBonus: -0.5, royaltyBonus: 0,    prestigeBonus: 15, salesBonus: 0,    wordCountBonus: 0.3,  affectionGainBonus: -2, bestsellerThresholdReduction: 0 },
  // 亡灵系
  'lich-archive-curator':          { qualityBonus: 5,  speedBonus: -0.4, royaltyBonus: 0,    prestigeBonus: 18, salesBonus: 0,    wordCountBonus: 0.6,  affectionGainBonus: -2, bestsellerThresholdReduction: 0 },
  'banshee-mourning-poet':         { qualityBonus: 4,  speedBonus: -0.3, royaltyBonus: 0,    prestigeBonus: 12, salesBonus: 0.1,  wordCountBonus: -0.2, affectionGainBonus: -1, bestsellerThresholdReduction: 0 },
  // 食尸鬼
  'ghoul-cemetery-historian':      { qualityBonus: 3,  speedBonus: -0.1, royaltyBonus: 0,    prestigeBonus: 6,  salesBonus: 0,    wordCountBonus: 0.3,  affectionGainBonus: 0,  bestsellerThresholdReduction: 0 },
  // 人类（短寿命）
  'mortal-investigative-journalist': { qualityBonus: 3,  speedBonus: 0.1,  royaltyBonus: 0,    prestigeBonus: 8,  salesBonus: 0.1,  wordCountBonus: 0.1,  affectionGainBonus: 0,  bestsellerThresholdReduction: 0 },
  'mortal-bestseller-hustler':     { qualityBonus: -3, speedBonus: 0.5,  royaltyBonus: 0.35, prestigeBonus: 0,  salesBonus: 0.4,  wordCountBonus: -0.3, affectionGainBonus: 0,  bestsellerThresholdReduction: 5000 },
  // 奇幻种族
  'fae-changeling-fabulist':       { qualityBonus: 4,  speedBonus: 0,    royaltyBonus: 0,    prestigeBonus: 5,  salesBonus: 0,    wordCountBonus: 0.2,  affectionGainBonus: 2,  bestsellerThresholdReduction: 0 },
  'demon-bureaucrat':              { qualityBonus: 2,  speedBonus: 0,    royaltyBonus: 0,    prestigeBonus: 10, salesBonus: 0.1,  wordCountBonus: 0.3,  affectionGainBonus: -2, bestsellerThresholdReduction: 0 },
  // v2.5
  'ghost-gothic-poet':             { qualityBonus: 6,  speedBonus: -0.4, royaltyBonus: 0,    prestigeBonus: 14, salesBonus: 0,    wordCountBonus: -0.3, affectionGainBonus: -2, bestsellerThresholdReduction: 0 },
  'mummy-chronicle-scholar':       { qualityBonus: 4,  speedBonus: -0.15,royaltyBonus: 0,    prestigeBonus: 10, salesBonus: 0,    wordCountBonus: 0.4,  affectionGainBonus: 0,  bestsellerThresholdReduction: 0 },
  'noir-pulp-novelist':            { qualityBonus: 0,  speedBonus: 0.4,  royaltyBonus: 0.25, prestigeBonus: 0,  salesBonus: 0.35, wordCountBonus: -0.1, affectionGainBonus: 0,  bestsellerThresholdReduction: 4000 },
  'ancient-dragon-epic':           { qualityBonus: 10, speedBonus: -0.6, royaltyBonus: 0.3,  prestigeBonus: 30, salesBonus: 0,    wordCountBonus: 1.0,  affectionGainBonus: -3, bestsellerThresholdReduction: 0 },
}

export function personaPassiveFor(author: Author): PersonaPassive {
  // 防御：旧存档的 persona 字符串可能不在新枚举里，给一组中庸的默认值
  return PERSONA_PASSIVES[author.persona] ?? {
    qualityBonus: 0, speedBonus: 0, royaltyBonus: 0, prestigeBonus: 0,
    salesBonus: 0, wordCountBonus: 0, affectionGainBonus: 0, bestsellerThresholdReduction: 0,
  }
}
