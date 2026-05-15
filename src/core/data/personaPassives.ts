import type { Author, AuthorPersona } from '../types'

export interface PersonaPassive {
  qualityBonus: number
  speedBonus: number        // affects author cooldown interval
  royaltyBonus: number       // multiplicative on book royalties
  prestigeBonus: number      // flat prestige per publish
  salesBonus: number         // multiplicative on sales per tick
  wordCountBonus: number     // multiplicative on word count
  affectionGainBonus: number  // extra affection per positive interaction
  bestsellerThresholdReduction: number
}

export const PERSONA_PASSIVES: Record<AuthorPersona, PersonaPassive> = {
  'retired-professor':          { qualityBonus: 2,  speedBonus: 0,   royaltyBonus: 0,   prestigeBonus: 5,   salesBonus: 0,    wordCountBonus: 0,    affectionGainBonus: 0,  bestsellerThresholdReduction: 0 },
  'basement-scifi-geek':        { qualityBonus: 0,  speedBonus: 0.3, royaltyBonus: 0,   prestigeBonus: 0,   salesBonus: 0,    wordCountBonus: 0,    affectionGainBonus: 0,  bestsellerThresholdReduction: 0 },
  'ex-intelligence-officer':    { qualityBonus: 0,  speedBonus: 0,   royaltyBonus: 0,   prestigeBonus: 0,   salesBonus: 0.15, wordCountBonus: 0,    affectionGainBonus: 0,  bestsellerThresholdReduction: 0 },
  'sociology-phd':              { qualityBonus: 3,  speedBonus: -0.1,royaltyBonus: 0,   prestigeBonus: 0,   salesBonus: 0.1,  wordCountBonus: 0.3,  affectionGainBonus: 0,  bestsellerThresholdReduction: 0 },
  'anxious-debut':              { qualityBonus: -2, speedBonus: 0,   royaltyBonus: 0,   prestigeBonus: 0,   salesBonus: 0,    wordCountBonus: -0.2, affectionGainBonus: 2,  bestsellerThresholdReduction: 0 },
  'reclusive-latam-writer':     { qualityBonus: 5,  speedBonus: -0.3,royaltyBonus: 0,   prestigeBonus: 0,   salesBonus: 0,    wordCountBonus: 0.4,  affectionGainBonus: -2, bestsellerThresholdReduction: 0 },
  'nordic-crime-queen':         { qualityBonus: 3,  speedBonus: 0,   royaltyBonus: 0,   prestigeBonus: 0,   salesBonus: 0.2,  wordCountBonus: 0,    affectionGainBonus: 0,  bestsellerThresholdReduction: 0 },
  'american-bestseller-machine':{ qualityBonus: -3, speedBonus: 0.2, royaltyBonus: 0.3, prestigeBonus: 0,   salesBonus: 0.2,  wordCountBonus: -0.15,affectionGainBonus: 0,  bestsellerThresholdReduction: 5000 },
  'japanese-lightnovel-otaku':  { qualityBonus: -2, speedBonus: 0.2, royaltyBonus: 0.3, prestigeBonus: 0,   salesBonus: 0.3,  wordCountBonus: -0.3, affectionGainBonus: 0,  bestsellerThresholdReduction: 0 },
  'historical-detective-writer':{ qualityBonus: 2,  speedBonus: -0.1,royaltyBonus: 0,   prestigeBonus: 10,  salesBonus: 0,    wordCountBonus: 0.2,  affectionGainBonus: 0,  bestsellerThresholdReduction: 0 },
  'fantasy-epic-writer':        { qualityBonus: 3,  speedBonus: -0.25,royaltyBonus: 0,  prestigeBonus: 0,   salesBonus: 0,    wordCountBonus: 0.5,  affectionGainBonus: 0,  bestsellerThresholdReduction: 0 },
  'french-literary-recluse':    { qualityBonus: 4,  speedBonus: -0.2,royaltyBonus: 0,   prestigeBonus: 8,   salesBonus: 0,    wordCountBonus: 0,    affectionGainBonus: 0,  bestsellerThresholdReduction: 0 },
  'indian-epic-sage':           { qualityBonus: 6,  speedBonus: -0.4,royaltyBonus: 0,   prestigeBonus: 15,  salesBonus: 0,    wordCountBonus: 0.8,  affectionGainBonus: 0,  bestsellerThresholdReduction: 0 },
  'russian-doom-spiral':        { qualityBonus: 3,  speedBonus: -0.1,royaltyBonus: 0,   prestigeBonus: 10,  salesBonus: 0.1,  wordCountBonus: 0.3,  affectionGainBonus: -2, bestsellerThresholdReduction: 0 },
  'korean-webnovel-queen':      { qualityBonus: -4, speedBonus: 0.4, royaltyBonus: 0.4, prestigeBonus: 0,   salesBonus: 0.3,  wordCountBonus: -0.5, affectionGainBonus: 0,  bestsellerThresholdReduction: 0 },
  'nigerian-magical-realist':   { qualityBonus: 4,  speedBonus: 0,   royaltyBonus: 0,   prestigeBonus: 5,   salesBonus: 0,    wordCountBonus: 0.1,  affectionGainBonus: 2,  bestsellerThresholdReduction: 0 },
  'australian-outback-gothic':  { qualityBonus: 2,  speedBonus: 0,   royaltyBonus: 0,   prestigeBonus: 0,   salesBonus: 0.1,  wordCountBonus: 0,    affectionGainBonus: -1, bestsellerThresholdReduction: 0 },
}

export function personaPassiveFor(author: Author): PersonaPassive {
  return PERSONA_PASSIVES[author.persona]
}
