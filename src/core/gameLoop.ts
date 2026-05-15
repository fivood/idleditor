import type { Author, CatState, Department, DepartmentType, EditorTrait, GameEvent, Genre, Manuscript, PermanentBonuses, TickResult, ToastMessage } from './types'
import {
  AFFECTION_BAD_PUBLISH_PENALTY,
  AFFECTION_ELITE_TALENT,
  AFFECTION_LETTER,
  AFFECTION_LOYAL,
  AFFECTION_PER_PROMOTION,
  AFFECTION_PER_PUBLISH,
  AFFECTION_PER_QUALITY_PUBLISH,
  AUTHOR_FAME_PER_PUBLISH,
  AUTHOR_TIER_THRESHOLDS,
  AUTO_COVER_PRESTIGE,
  AUTO_REJECT_PRESTIGE,
  AUTO_REVIEW_DEPT_LEVEL,
  BESTSELLER_SALES,
  BOSS_START_YEARS,
  DEPARTMENT_BASE_EFFICIENCY,
  DEPARTMENT_COST_MULTIPLIER,
  EDITOR_TRAIT_BONUSES,
  GENRE_PREFERENCE_SALES_BONUS,
  MAX_SUBMITTED_QUEUE,
  MILESTONES,
} from './constants'
import {
  editingTicks,
  manuscriptSpawnInterval,
  proofingTicks,
  publishingTicks,
  reviewTicks,
  rpPerEdit,
  rpPerProof,
  rpPerPublish,
  rpPerReview,
  royaltyPerTick,
  salesPerTick,
} from './formulas'
import { nanoid } from '../utils/id'
import { pick, rangeInt } from '../utils/random'
import { generateToast } from './humor/generator'
import { createCalendar, advanceCalendar, TICKS_PER_DAY } from './calendar'
import { checkDateEvent, type DateEvent } from './dateEvents'
import type { GameCalendar } from './calendar'
import { xpForPublish, getLevelFromXP, levelBonuses } from './leveling'
import { COLLECTIONS } from './collections'
import { RIVALS } from './rivals'
import { TALENTS, type Talent } from './talents'
import { generatePublishNote, generateLevelUpToast, SHELVED_RESUBMISSION_NOTES } from './data/editorNotes'
import { createManuscript, createManuscriptForAuthor } from './factories/manuscriptFactory'
import { loadAuthorNamePool } from './data/authorNames'

// Re-export for consumers
export { loadAuthorNamePool }
export { createManuscript }

// ──── State that the game loop reads/mutates ────
export interface GameWorldState {
  manuscripts: Map<string, Manuscript>
  authors: Map<string, Author>
  departments: Map<string, Department>
  events: GameEvent[]
  playTicks: number
  totalPublished: number
  totalBestsellers: number
  totalRejections: number
  currencies: { revisionPoints: number; prestige: number; royalties: number; statues: number }
  permanentBonuses: PermanentBonuses
  trait: EditorTrait | null
  playerName: string
  calendar: GameCalendar
  spawnTimer: number
  solicitCooldown: number
  awardTimer: number
  trendTimer: number
  triggeredMilestones: Set<number>
  activeDateEvent: DateEvent | null
  coversManifest: Record<string, string> | null
  preferredGenres: Genre[]
  booksPublishedThisMonth: number
  publishedTitles: Set<string>
  editorXP: number
  editorLevel: number
  publishingQuotaUpgrades: number
  autoReviewEnabled: boolean
  autoCoverEnabled: boolean
  autoRejectEnabled: boolean
  unlockedCollections: Set<string>
  prActive: boolean
  readingRoomRenovated: boolean
  selectedTalents: Record<number, string>
  playerGender: 'male' | 'female' | null
  qualityThreshold: number
  catState: CatState | null
  catPetCooldown: number
  catRejectedUntilYear: number
  salonBooksRemaining: number
}

// ──── Title/Cover generation moved to factories/manuscriptFactory.ts ────

// ──── World initialization ────
export function createInitialWorld(): GameWorldState {
  return {
    manuscripts: new Map(),
    authors: new Map(),
    departments: new Map(),
    events: [],
    playTicks: 0,
    totalPublished: 0,
    totalBestsellers: 0,
    totalRejections: 0,
    currencies: { revisionPoints: 0, prestige: 0, royalties: 0, statues: 0 },
    permanentBonuses: {
      manuscriptQualityBonus: 0,
      editingSpeedBonus: 0,
      royaltyMultiplier: 1,
      authorTalentBoost: 0,
      spawnRateBonus: 0,
      bossYears: BOSS_START_YEARS,
      countRelation: 0,
      countGender: 'male',
    },
    trait: null,
    playerName: '',
    calendar: createCalendar(),
    spawnTimer: 5,
    solicitCooldown: 0,
    awardTimer: 0,
    trendTimer: 0,
    triggeredMilestones: new Set(),
    activeDateEvent: null,
    coversManifest: null,
    preferredGenres: [],
    booksPublishedThisMonth: 0,
    publishedTitles: new Set(),
    editorXP: 0,
    editorLevel: 1,
    publishingQuotaUpgrades: 0,
    autoReviewEnabled: true,
    autoCoverEnabled: true,
    autoRejectEnabled: true,
    unlockedCollections: new Set(),
    prActive: false,
    readingRoomRenovated: false,
    selectedTalents: {},
    playerGender: null,
    qualityThreshold: 0,
    catState: null,
    catPetCooldown: 0,
    catRejectedUntilYear: 0,
    salonBooksRemaining: 0,
  }
}

// ──── Tick function ────
export function tick(world: GameWorldState): TickResult {
  const result: TickResult = {
    newManuscripts: [],
    publishedBooks: [],
    royaltiesEarned: 0,
    toasts: [],
    eventsTriggered: [],
    authorsReturned: [],
    catDecisionAvailable: false,
  }

  world.playTicks++
  const ct = (text: string, type: ToastMessage['type']) =>
    ({ id: nanoid(), text, type, createdAt: world.playTicks })

  // Trait & permanent bonuses
  const trait = world.trait ? EDITOR_TRAIT_BONUSES[world.trait] : { rpBonus: 0, qualityBonus: 0, speedBonus: 0 }
  // Compute talent bonuses
  const talentBonuses = getTalentEffects(world.selectedTalents)
  // Level bonuses
  const lvlBonuses = levelBonuses(world.editorLevel)
  const effSpeedBonus = world.permanentBonuses.editingSpeedBonus + trait.speedBonus + (talentBonuses.editSpeed || 0) + (talentBonuses.allStats || 0) + lvlBonuses.speed
  const effRpBonus = trait.rpBonus + (talentBonuses.allStats || 0) + lvlBonuses.rp

  // Advance calendar every TICKS_PER_DAY ticks
  if (world.playTicks % TICKS_PER_DAY === 0) {
    const prevMonth = world.calendar.month
    const prevYear = world.calendar.year
    advanceCalendar(world.calendar)
    // Reset publishing quota on month change
    if (world.calendar.month !== prevMonth) {
      world.booksPublishedThisMonth = 0
    }
    // Cat lifecycle: age up on game-year change
    if (world.catState && world.catState.alive && world.calendar.year !== prevYear) {
      world.catState.age++
      const cat = world.catState
      // Immortality prompt: affection >= 80, age >= 5, not yet immortal
      if (cat.affection >= 80 && cat.age >= 5 && !cat.immortal) {
        result.toasts.push({
          id: nanoid(),
          text: `${cat.name}已经陪伴你${cat.age}年了。它开始显老——动作变慢，跳不上书架了。你看着它蜷在窗台晒太阳，忽然意识到：你的永生不该孤独。你可以选择用一座铜像换取它的永生。`,
          type: 'milestone',
          createdAt: world.playTicks,
        })
        cat.immortalityPrompted = true
      }
      // Mortality check: age >= 10, affection < 50, not immortal
      if (cat.age >= 10 && cat.affection < 50 && !cat.immortal) {
        if (Math.random() < 0.3) {
          result.toasts.push({
            id: nanoid(),
            text: `${cat.name}在一个安静的夜晚离开了。它蜷在你桌上那叠还没审的稿子旁边——和往常一样。你知道它只是睡着了，但这次不会再醒来。`,
            type: 'milestone',
            createdAt: world.playTicks,
          })
          world.catState = null
        } else {
          result.toasts.push(ct(`${cat.name}看起来更老了。它趴在暖气片旁边的时间越来越长。`, 'info'))
        }
      }
      // Age milestones
      if (cat.age === 1) result.toasts.push(ct(`${cat.name}已经陪伴你一年了。它学会了在稿件堆里找到最舒服的位置——通常是今天必须审完的那叠。`, 'info'))
      if (cat.age === 3) result.toasts.push(ct(`${cat.name}三岁了。它现在认识所有编辑的脚步声，唯独你的——它每次都会抬头。`, 'info'))
      if (cat.age === 5 && cat.immortal) result.toasts.push(ct(`${cat.name}五岁了。它跳上窗台的动作依然像第一天那样轻盈。永生是份礼物——尤其是给一只猫。`, 'info'))
    }
    // Tick down active date event duration
    if (world.activeDateEvent) {
      world.activeDateEvent = {
        ...world.activeDateEvent,
        durationDays: world.activeDateEvent.durationDays - 1,
      }
      if (world.activeDateEvent.durationDays <= 0) {
        world.activeDateEvent = null
      }
    }
    // Check for new date events
    const dateEvt = checkDateEvent(world.calendar)
    if (dateEvt) {
      world.activeDateEvent = { ...dateEvt }
      result.toasts.push({
        id: nanoid(),
        text: `📅 ${dateEvt.title}！${dateEvt.description}（${dateEvt.genre ? dateEvt.genre + '类书籍销量×' + dateEvt.multiplier : '全类书籍销量×' + dateEvt.multiplier}，持续${dateEvt.durationDays}天）`,
        type: 'milestone',
        createdAt: world.playTicks,
      })
    }
  }

  // Random events every 300 ticks (~5 min)
  if (world.playTicks % 300 === 0) {
    const randomEvt = rollRandomEvent(world)
    if (randomEvt) {
      result.toasts.push({ id: nanoid(), text: randomEvt, type: 'milestone', createdAt: world.playTicks })
    }
  }

  // 1. Spawn manuscripts
  world.spawnTimer--
  if (world.solicitCooldown > 0) world.solicitCooldown--
  if (world.spawnTimer <= 0) {
    const submitted = [...world.manuscripts.values()].filter(m => m.status === 'submitted')
    if (submitted.length < MAX_SUBMITTED_QUEUE) {
      const ms = createManuscript(world)
      world.manuscripts.set(ms.id, ms)
      result.newManuscripts.push(ms)
    }
    const spawnRateBonus = world.permanentBonuses.spawnRateBonus
    world.spawnTimer = Math.round((120 + rangeInt(-10, 30)) / (1 + spawnRateBonus))
  }

  // 1.5 Auto-clear stale submissions (player away too long)
  {
    const submitted = [...world.manuscripts.values()].filter(m => m.status === 'submitted')
    // Sort oldest-first, remove excess beyond the limit
    const excess = submitted.length > MAX_SUBMITTED_QUEUE ? submitted.slice(0, submitted.length - MAX_SUBMITTED_QUEUE) : []
    // Also remove any that have been sitting for > 600 ticks (10 min)
    const stale = submitted.filter(m => world.playTicks - m.createdAt > 600)
    const toRemove = new Set([...excess, ...stale].map(m => m.id))
    for (const id of toRemove) {
      world.manuscripts.delete(id)
    }
    if (toRemove.size > 0) {
      result.toasts.push(ct(
        `📮 有的稿件终究没等到审阅它的人。${toRemove.size}份稿子伤心地自我了断了。`,
        'info'
      ))
    }
  }

  // 2. Process reviewing
  for (const m of world.manuscripts.values()) {
    if (m.status !== 'reviewing') continue
    const editEfficiency = getDeptEfficiency(world, 'editing')
    const needed = reviewTicks(editEfficiency)
    const speedMult = 1 + effSpeedBonus
    m.editingProgress += (1 / needed) * speedMult
    if (m.editingProgress >= 1) {
      m.status = 'editing'
      m.editingProgress = 0
      world.currencies.revisionPoints += rpPerReview(effSpeedBonus + effRpBonus)
      result.toasts.push(ct(generateToast('reviewComplete', {
        title: m.title,
        genre: m.genre,
        quality: String(m.quality),
        authorName: world.authors.get(m.authorId)?.name ?? 'Unknown',
        playerName: world.playerName,
        playerGender: world.playerGender ?? '',
      }), 'info'))
    }
  }

  // 3. Process editing
  for (const m of world.manuscripts.values()) {
    if (m.status !== 'editing') continue
    const editEfficiency = getDeptEfficiency(world, 'editing')
    const needed = editingTicks(m.wordCount, editEfficiency)
    const speedMult = 1 + effSpeedBonus
    m.editingProgress += (1 / needed) * speedMult
    if (m.editingProgress >= 1) {
      m.status = 'proofing'
      m.editingProgress = 0
      world.currencies.revisionPoints += rpPerEdit(effSpeedBonus + effRpBonus)
    }
  }

  // 4. Process proofing
  for (const m of world.manuscripts.values()) {
    if (m.status !== 'proofing') continue
    const editEfficiency = getDeptEfficiency(world, 'editing')
    const needed = proofingTicks(editEfficiency)
    const speedMult = 1 + effSpeedBonus
    m.editingProgress += (1 / needed) * speedMult
    if (m.editingProgress >= 1) {
      // Design department: apply quality bonus when cover is prepared
      const designEfficiency = getDeptEfficiency(world, 'design')
      if (designEfficiency > 0) {
        m.quality = Math.min(100, m.quality + Math.round(designEfficiency * 10))
      }
      // Auto-finalize: skip cover_select for manuscripts below player's quality threshold
      if (world.qualityThreshold > 0 && m.quality < world.qualityThreshold && world.autoCoverEnabled) {
        m.status = 'publishing'
        m.editingProgress = 0
        result.toasts.push(ct(`🤖 全自动流水线跳过封面审核：《${m.title}》（品质${m.quality}，门槛${world.qualityThreshold}）`, 'info'))
      } else {
        m.status = 'cover_select'
        m.editingProgress = 0
      }
      world.currencies.revisionPoints += rpPerProof(effSpeedBonus + effRpBonus)
    }
  }

  // 5. Process publishing
  for (const m of world.manuscripts.values()) {
    if (m.status !== 'publishing') continue
    const editEfficiency = getDeptEfficiency(world, 'editing')
    const needed = publishingTicks(editEfficiency)
    const speedMult = 1 + effSpeedBonus
    m.editingProgress += (1 / needed) * speedMult
    if (m.editingProgress >= 1) {
      m.status = 'published'
      m.publishTime = world.playTicks
      m.editingProgress = 0
      // Salon boost: apply quality bonus to recent publications
      if (world.salonBooksRemaining > 0) {
        m.quality = Math.min(100, m.quality + 5)
        world.salonBooksRemaining--
      }
      // Generate editor note from template pool
      if (!m.editorNote) {
        m.editorNote = generatePublishNote(m)
      }
      world.totalPublished++
      world.currencies.revisionPoints += rpPerPublish(m.quality, 0, world.booksPublishedThisMonth)
      const pubPrestige = m.isUnsuitable ? -10 : 10
      world.currencies.prestige += pubPrestige
      world.booksPublishedThisMonth++
      world.publishedTitles.add(m.title)

      // PR boost: auto-apply to first published book
      if (world.prActive) {
        m.reissueBoostUntil = world.playTicks + 420
        world.prActive = false
      }

      // XP gain
      const xpEarned = xpForPublish(m.quality)
      world.editorXP += xpEarned
      const newLevel = getLevelFromXP(world.editorXP)
      if (newLevel > world.editorLevel) {
        world.editorLevel = newLevel
        result.toasts.push(ct(generateLevelUpToast(newLevel), 'levelUp'))
      }
      result.publishedBooks.push(m)
      if (m.isUnsuitable) {
        result.toasts.push(ct(
          `📘 《${m.title}》勉强出版。读者评价：浪费纸张。声望 -10`, 'info'))
      } else {
        result.toasts.push(ct(generateToast('bookPublished', {
          title: m.title,
          genre: m.genre,
          authorName: world.authors.get(m.authorId)?.name ?? 'Unknown',
          playerName: world.playerName,
          playerGender: world.playerGender ?? '',
        }), 'milestone'))
      }

      // Author fame progression
      const author = world.authors.get(m.authorId)
      if (author) {
        author.fame += AUTHOR_FAME_PER_PUBLISH
        const prevTier = author.tier
        if (prevTier === 'signed' && author.fame >= AUTHOR_TIER_THRESHOLDS.known) {
          author.tier = 'known'
          result.toasts.push(ct(`🌟 ${author.name} 已晋升为知名作者！其作品质量获得了永久提升。`, 'milestone'))
        } else if (prevTier === 'known' && author.fame >= AUTHOR_TIER_THRESHOLDS.idol) {
          author.tier = 'idol'
          result.toasts.push(ct(`🏆 ${author.name} 已晋升为传奇作者！永夜出版社的藏书阁将铭记这个时刻。`, 'milestone'))
        }
        if (author.tier !== prevTier) {
          // Tier promotion: boost author talent slightly
          author.talent = Math.min(95, author.talent + 5)
          author.affection += AFFECTION_PER_PROMOTION
        }
        // Affection tracking
        const affMult = world.readingRoomRenovated ? 1.2 : 1
        const talentAffMult = 1 + (talentBonuses.affectionGain || 0)
        author.affection += Math.round(AFFECTION_PER_PUBLISH * affMult * talentAffMult)
        if (m.quality >= 60) author.affection += Math.round(AFFECTION_PER_QUALITY_PUBLISH * affMult)
        if (m.isUnsuitable) author.affection += AFFECTION_BAD_PUBLISH_PENALTY
        if (author.talent >= AFFECTION_ELITE_TALENT) author.affection += 2
        // Loyalty check
        if (author.affection >= AFFECTION_LOYAL) {
          author.talent = Math.min(95, author.talent + 5)
          author.affection = 0
          result.toasts.push(ct(`💖 ${author.name} 已成为永夜出版社的忠实作者！才华永久 +5。`, 'milestone'))
        }
      }
    }
  }

  // 6. Collect royalties and sales
  const marketingEfficiency = getDeptEfficiency(world, 'marketing')
  const salesMult = world.activeDateEvent ? world.activeDateEvent.multiplier : 1
  for (const m of world.manuscripts.values()) {
    if (m.status !== 'published') continue
    const royalty = royaltyPerTick(m, world.permanentBonuses.royaltyMultiplier, marketingEfficiency)
    world.currencies.royalties += royalty * (1 + (talentBonuses.royaltyIncome || 0) + (talentBonuses.allStats || 0))
    result.royaltiesEarned += royalty
    const hasGenreBuff = world.activeDateEvent && (world.activeDateEvent.genre === null || world.activeDateEvent.genre === m.genre)
    const prefSalesBonus = 1 + world.preferredGenres.filter(g => g === m.genre).length * GENRE_PREFERENCE_SALES_BONUS
    const reissueBoost = (m.reissueBoostUntil && world.playTicks < m.reissueBoostUntil) ? 1.5 : 1
    const collectionBoost = getCollectionBoost(m.genre, world.unlockedCollections)
    const talentSalesMult = 1 + (talentBonuses.salesBoost || 0) + (talentBonuses.allStats || 0)
    m.salesCount += salesPerTick(marketingEfficiency, m.quality) * (hasGenreBuff ? salesMult : 1) * prefSalesBonus * reissueBoost * collectionBoost * talentSalesMult

    // Passive affection gain from good sales (1% chance per tick)
    if (Math.random() < 0.01 && m.salesCount > 1000) {
      const author = world.authors.get(m.authorId)
      if (author && author.affection < 100) {
        author.affection = Math.min(100, author.affection + 1)
      }
    }

    // Check bestseller
    if (!m.isBestseller && m.salesCount >= BESTSELLER_SALES) {
      m.isBestseller = true
      world.totalBestsellers++
      world.currencies.prestige += 50
      result.toasts.push(ct(generateToast('bestseller', {
        title: m.title,
        authorName: world.authors.get(m.authorId)?.name ?? 'Unknown',
        playerName: world.playerName,
        playerGender: world.playerGender ?? '',
      }), 'award'))
    }
  }

  // 7. Tick author cooldowns
  for (const author of world.authors.values()) {
    if (author.poached || author.terminated) continue // Gone or contract terminated
    if (author.cooldownUntil !== null && author.cooldownUntil > 0) {
      author.cooldownUntil--
      if (author.cooldownUntil <= 0) {
        author.cooldownUntil = null
        result.authorsReturned.push(author)
      }
    } else if (author.tier !== 'new') {
      // Active signed+ authors occasionally submit manuscripts
      if (author.booksWritten >= author.maxBooks) continue // Retired / max books reached
      const interval = manuscriptSpawnInterval(author)
      if (world.playTicks % interval === 0) {
        const ms = createManuscriptForAuthor(world, author)
        world.manuscripts.set(ms.id, ms)
        result.newManuscripts.push(ms)
      }
    }
  }

  // 8. Department upgrade ticks
  for (const dept of world.departments.values()) {
    if (dept.upgradingUntil !== null) {
      if (world.playTicks >= dept.upgradingUntil) {
        dept.level++
        dept.upgradingUntil = null
        // Scale costs for next upgrade
        dept.upgradeCostRP = Math.round(dept.upgradeCostRP * DEPARTMENT_COST_MULTIPLIER)
        dept.upgradeCostPrestige = Math.max(0, Math.round((dept.upgradeCostPrestige + 3) * 1.3))
        dept.upgradeTicks = Math.round(dept.upgradeTicks * 1.15)
        result.toasts.push(ct(`🏢 ${dept.type === 'editing' ? '编辑部' : dept.type === 'design' ? '设计部' : dept.type === 'marketing' ? '市场部' : '版权部'}升至 Lv.${dept.level}！`, 'milestone'))
      }
    }
  }

  // 8.5 Rights department: passive prestige generation
  const rightsEfficiency = getDeptEfficiency(world, 'rights')
  if (rightsEfficiency > 0) {
    world.currencies.prestige = Math.round((world.currencies.prestige + rightsEfficiency * 1.0) * 100) / 100
  }

  // 8.6 Cat arrival: random decision event
  if (!world.catState && world.calendar.year > world.catRejectedUntilYear && Math.random() < 0.003) {
    result.catDecisionAvailable = true
  }

  // 9. Automation perks
  const editingDeptLevel = getDeptLevel(world, 'editing')
  const prestige = world.currencies.prestige

  // Auto-review: editing dept >= 3
  if (editingDeptLevel >= AUTO_REVIEW_DEPT_LEVEL && world.autoReviewEnabled) {
    const submitted = [...world.manuscripts.values()].filter(m => m.status === 'submitted')
    if (submitted.length > 0) {
      const ms = submitted[0]
      ms.status = 'reviewing'
      ms.editingProgress = 0
      result.toasts.push(ct(`🤖 自动审稿：《${ms.title}》`, 'info'))
    }
  }

  // Auto-cover: prestige >= 100
  // Batch mode when editing >= 4 && design >= 3: process ALL cover_select at once
  if (prestige >= AUTO_COVER_PRESTIGE && world.booksPublishedThisMonth < 10 + world.publishingQuotaUpgrades && world.autoCoverEnabled) {
    const awaitingCover = [...world.manuscripts.values()].filter(m => m.status === 'cover_select')
    if (awaitingCover.length > 0) {
      const designLevel = getDeptLevel(world, 'design')
      const batchMode = editingDeptLevel >= 4 && designLevel >= 3
      const toProcess = batchMode ? awaitingCover : [awaitingCover[0]]
      let count = 0
      for (const ms of toProcess) {
        if (world.booksPublishedThisMonth >= 10 + world.publishingQuotaUpgrades) break
        ms.status = 'publishing'
        ms.editingProgress = 0
        count++
      }
      if (count > 0) {
        result.toasts.push(ct(
          count === 1 ? `🤖 自动出版：《${toProcess[0].title}》` : `🤖 批量自动出版：${count}份稿件已进入付印流水线`,
          'info'
        ))
      }
    }
  }

  // Auto-reject unsuitable: prestige >= 200 && editing dept >= 5
  if (prestige >= AUTO_REJECT_PRESTIGE && editingDeptLevel >= 5 && world.autoRejectEnabled) {
    const unsuitable = [...world.manuscripts.values()].filter(m => m.status === 'submitted' && m.isUnsuitable)
    for (const ms of unsuitable) {
      ms.status = 'rejected'
      world.totalRejections++
      world.currencies.revisionPoints += 8
      world.currencies.prestige += 3
      // Trigger author cooldown
      const author = world.authors.get(ms.authorId)
      if (author) {
        author.rejectedCount++
        author.cooldownUntil = 900 + author.rejectedCount * 180
      }
      result.toasts.push(ct(`🤖 自动退稿：《${ms.title}》——不值得人类编辑的注意力。`, 'info'))
    }
  }

  // 10. Check milestones
  for (const ms of MILESTONES) {
    if (!world.triggeredMilestones.has(ms.ticks) && world.playTicks >= ms.ticks) {
      world.triggeredMilestones.add(ms.ticks)
      result.toasts.push({ id: nanoid(), text: ms.message, type: 'milestone', createdAt: world.playTicks })
    }
  }

  // 11. Shelved manuscript resubmission
  for (const m of world.manuscripts.values()) {
    if (m.status !== 'shelved' || !m.shelvedAt) continue
    const shelvedDuration = world.playTicks - m.shelvedAt
    if (shelvedDuration >= 300 + rangeInt(0, 300)) {
      m.status = 'submitted'
      m.quality = Math.min(100, m.quality + 3)
      m.shelvedAt = null
      const notes = SHELVED_RESUBMISSION_NOTES
      if (!m.synopsis.includes('（作者修改')) {
        m.synopsis += ' ' + pick(notes)
      }
      result.toasts.push(ct(`📥 《${m.title}》经过修改后重新投稿。品质 +3。`, 'info'))
    }
  }

  return result
}

// ──── Manuscript/Author creation moved to factories/ ────

// ──── Helpers ────
function getDeptEfficiency(world: GameWorldState, type: string): number {
  const base = DEPARTMENT_BASE_EFFICIENCY[type as DepartmentType] ?? 0.5
  for (const dept of world.departments.values()) {
    if (dept.type === type) {
      return base * dept.level / 10
    }
  }
  return 0
}

function getDeptLevel(world: GameWorldState, type: string): number {
  for (const dept of world.departments.values()) {
    if (dept.type === type) return dept.level
  }
  return 0
}

function getCollectionBoost(genre: string, unlocked: Set<string>): number {
  let boost = 1
  for (const c of COLLECTIONS) {
    if (unlocked.has(c.id) && c.genre === genre) {
      if (c.id === 'mystery-5') boost *= 1.05
      if (c.id === 'hybrid-2') boost *= 1.05
    }
  }
  return boost
}

function getTalentEffects(selected: Record<number, string>): Talent['effects'] {
  const effects: Record<string, number> = {}
  for (const talentId of Object.values(selected)) {
    const t = TALENTS.find(t => t.id === talentId)
    if (!t) continue
    for (const [k, v] of Object.entries(t.effects)) {
      effects[k] = (effects[k] || 0) + v
    }
  }
  return effects
}

// ──── Random Events ────
function rollRandomEvent(world: GameWorldState): string | null {
  if (Math.random() > 0.4) return null // 40% chance each check

  const pool: (() => string | null)[] = [
    () => {
      const rp = rangeInt(5, 20)
      world.currencies.revisionPoints += rp
      return `🎭 一位匿名老编辑寄来了一叠修订笔记。获得 ${rp} RP。`
    },
    () => {
      const extraMS = createManuscript(world)
      world.manuscripts.set(extraMS.id, extraMS)
      return `📮 午夜投稿堆突然多了一份手稿——署名栏写着"顺路带来的"。新稿件：${extraMS.title}。`
    },
    () => {
      const rp = rangeInt(3, 12)
      world.currencies.revisionPoints += rp
      return `🦇 伯爵大人心血来潮巡视编辑部，随手批了几份稿子。获得 ${rp} RP。`
    },
    () => `☕ 茶水间的古董咖啡机今天没有爆炸。所有人精神抖擞，工作效率似乎高了一点点。`,
    () => {
      const prestige = rangeInt(2, 8)
      world.currencies.prestige += prestige
      return `📰 《永夜文学报》刊登了一篇关于出版社的专题报道（可能因为主编欠编辑部主任一个人情）。声望 +${prestige}。`
    },
    () => `📚 一位老顾客搬走了半座图书馆。编辑们面面相觑——"我们仓库里什么时候有这么多书？"`,
    () => {
      const rp = rangeInt(10, 30)
      world.currencies.revisionPoints += rp
      return `💼 版权部成功将一本书的影视改编权卖给了某流媒体平台（虽然合同细则里出现了"永久使用权"这个词）。获得 ${rp} RP。`
    },
    () => `🔔 人力资源部的新实习生不小心把咖啡洒在了档案柜上——现在所有在编作者都收到了一份"恭喜您中奖"的邮件。场面一度非常尴尬。`,
    () => {
      const rp = rangeInt(8, 18)
      world.currencies.revisionPoints += rp
      return `📖 一位退休教授来到编辑部，淡定地指出三本书里的历史错误，然后顺便帮你审了两本稿子。获得 ${rp} RP。`
    },
    () => `🌙 今夜是新月。年轻编辑们在办公室偷偷讲鬼故事——图书主题的鬼故事销量意外增加了。`,

    // ── Rejected author news ──
    () => {
      const rejected = [...world.authors.values()].filter(a => a.rejectedCount > 0)
      if (rejected.length === 0) return `📬 投稿箱里出现了一封没有署名的手写信。字迹潦草，但文法不错。`
      const a = rejected[Math.floor(Math.random() * rejected.length)]
      const snippets = [
        `${a.name}在社交媒体上发了一条："编辑可能没看懂我的作品"。获得了${rangeInt(200, 2000)}个赞。`,
        `${a.name}被拍到在另一家出版社门口徘徊。手里拿着同一份稿子。`,
        `${a.name}开始在网上连载被退的那部小说。评论区第一条："还是退了好"。`,
        `${a.name}的退稿信被裱起来挂在了工作室墙上。配文："他们会后悔的"。（其实不会）`,
        `${a.name}换了个笔名重新投稿了。但我们一眼就认出来了——第一章一个字都没改。`,
        `听闻${a.name}在一场读书会上公开朗读了自己被退稿的第一章。听众在第三章时走了一半。`,
        `${a.name}的猫在稿纸上踩了一排脚印。作者声称这是"被退稿的艺术回应"。`,
      ]
      return pick(snippets)
    },
    () => {
      const rejected = [...world.authors.values()].filter(a => a.rejectedCount > 0)
      if (rejected.length === 0) return `🗞️ 文学版编辑在报纸上写了一篇短文，标题是"为什么好稿子也会被退"。（实习生说这是他见过的最被动的攻击。）`
      const a = rejected[Math.floor(Math.random() * rejected.length)]
      const count = a.rejectedCount
      if (count >= 3) {
        return `📉 ${a.name}已累计被退稿${count}次。据了解，该作家目前正在考虑转行——可能去当编辑。`
      }
      if (count >= 2) {
        return `${a.name}在接受采访时表示："永夜出版社的退稿信比我的小说还长。至少编辑认真看了。大概。"`
      }
      return `${a.name}在咖啡馆偶遇编辑部主任，尴尬地聊了三分钟天气后火速离开。`
    },
    () => {
      const rejected = [...world.authors.values()].filter(a => a.rejectedCount > 0 && a.cooldownUntil !== null)
      if (rejected.length === 0) return null
      const a = rejected[Math.floor(Math.random() * rejected.length)]
      const quips = [
        `🍷 ${a.name}据称买了一整箱红酒，声称要"用酒精泡出下一本杰作"。邻居表示已经连续三天听到打字机声和哭声交替传来。`,
        `📝 ${a.name}在个人博客上发布了"被退稿后如何自我疗愈"的十点建议。第八点建议是：别写了。`,
        `🎤 ${a.name}报名参加了一个脱口秀开放麦。所有段子都和被退稿有关。据说效果还行——观众不确定该不该笑。`,
      ]
      return pick(quips)
    },
    () => {
      const onCooldown = [...world.authors.values()].filter(a => a.cooldownUntil !== null && a.cooldownUntil > 0)
      if (onCooldown.length === 0) return null
      const a = onCooldown[Math.floor(Math.random() * onCooldown.length)]
      return `⏳ ${a.name}的冷却还剩${a.cooldownUntil}秒。据线人透露，ta正在写一部"出版社不配拥有的神作"。`
    },

    // ── General news ──
    () => {
      if (world.totalPublished < 5) return null
      const titles = [...world.manuscripts.values()].filter(m => m.status === 'published')
      if (titles.length === 0) return null
      const book = titles[Math.floor(Math.random() * titles.length)]
      const newsItems = [
        `${book.title}在一家二手书店被当成"店员推荐"陈列。书店老板表示"其实没读过"。`,
        `一位读者在书评网站上给《${book.title}》打了五星，评论只有三个字："看哭了"。编辑们传阅这评论讨论了整个午休。`,
        `${book.title}的盗版在网上流传。作者表示"这是我第一次有盗版，感觉……还挺受认可的？"`,
        `某读书播客对《${book.title}》做了半小时的深度解析。主播在结尾说"我可能过度解读了"。`,
      ]
      return pick(newsItems)
    },
    () => {
      const rp = rangeInt(15, 35)
      world.currencies.revisionPoints += rp
      return `🏛️ 市立图书馆订购了出版社的整套目录。馆长说："预算花不完，你们懂的。"获得 ${rp} RP。`
    },
    () => `📸 一位知名书评人发了张自拍，背景里——模糊但可辨认——是出版社的大楼。配文："接下来三个月我最期待的事"。编辑们默默截图了。`,
    () => `🎂 今天是出版社的「永生茶话会」——每百年一次的团建活动。伯爵说了两句祝词，然后回棺材补觉了。`,
    () => `📬 一封寄给"永夜出版社全体员工"的匿名信。内容是一首关于破晓的十四行诗。编辑部一致同意：写得不错。但这不改变寄件人不知道我们是吸血鬼的事实。`,

    // ── Rival publisher news ──
    () => {
      const poached = [...world.authors.values()].filter(a => a.poached)
      if (poached.length === 0) return null
      const a = poached[Math.floor(Math.random() * poached.length)]
      const prestige = rangeInt(5, 10)
      world.currencies.prestige += prestige
      const rival = RIVALS[Math.floor(Math.random() * RIVALS.length)]
      return `📰 ${a.name}在${rival.name}出版了一本新书。书评人说还不错——至少比上次被退掉那本强。作为前编辑，你获得 ${prestige} 声望。`
    },
    () => {
      const rival = RIVALS[Math.floor(Math.random() * RIVALS.length)]
      const newsItems = [
        `${rival.name}本周推出了一个新书系。市场部紧急开会讨论。结论：先看看他们能撑多久。`,
        `${rival.name}的编辑在采访中提到永夜出版社，措辞相当客气——"有品位的竞品"。翻译：比不过。`,
        `${rival.name}签下了一位网红作者。据说首印十万册。永夜的编辑们看了一眼样稿，各自默默喝了一口茶。`,
        `${rival.name}的年度报告显示他们去年出版了${rangeInt(50, 300)}本书。其中${rangeInt(1, 10)}本进入过榜单。`,
        `图书展上，${rival.name}的展位离永夜只隔了一条通道。双方编辑在茶歇区进行了三分钟的礼貌交锋——话题包括天气、咖啡质量，以及"那个作者到底怎么回事"。`,
      ]
      return pick(newsItems)
    },
    () => {
      const rival = RIVALS[Math.floor(Math.random() * RIVALS.length)]
      const bestsellers = [...world.manuscripts.values()].filter(m => m.status === 'published' && m.isBestseller)
      if (bestsellers.length === 0) return null
      const book = bestsellers[Math.floor(Math.random() * bestsellers.length)]
      return `🏆 ${rival.name}宣布他们将推出《${book.title.slice(0, 8)}》的竞品版。永夜编辑回应："祝好运。"`
    },
    () => {
      const rival = RIVALS[Math.floor(Math.random() * RIVALS.length)]
      const authors = [...world.authors.values()].filter(a => a.tier === 'signed' || a.tier === 'known')
      if (authors.length === 0) return null
      const a = authors[Math.floor(Math.random() * authors.length)]
      return `📢 据传${rival.name}向${a.name}发出了邀约——更高的版税、更好的茶歇。${a.name}目前尚未回应。`
    },
    () => {
      const rival = RIVALS[Math.floor(Math.random() * RIVALS.length)]
      const authors = [...world.authors.values()].filter(a => a.tier === 'idol')
      if (authors.length === 0) return null
      const a = authors[Math.floor(Math.random() * authors.length)]
      const prestige = rangeInt(10, 20)
      world.currencies.prestige += prestige
      return `🏅 ${rival.name}公开称赞了永夜出版社的传奇作者${a.name}。"如果能签到她——"对方主编在采访中叹了口气。"但显然不太可能。"声望 +${prestige}。`
    },

    // ── Vampire events ──
    () => `🦇 读完一篇稿子之后，你出门飞了两圈透透气。回来时发现编辑部的实习生正在窗户边看——她以为你是只大鸟。`,
    () => `🍷 茶水间的"红茶"快用完了。你提醒采购部多订几箱——但没具体说是哪种红。`,
    () => `🌙 今晚月色很好。你在屋顶上看了会儿星星，翻了两页稿子。永生者很少感到满足——但这个夜晚算一个。`,
    () => `棺材维护费涨了。你在编辑部的意见箱里放了一张抗议纸条——署名"某位长期住户"。`,
    () => `📖 一本书的纸张里混了旧木的气味——闻起来像你1832年睡过的那口棺材。你盯着出版信息看了很久：印刷厂在北欧。可能是同一片树林。`,
    () => `🕯️ 实习生问你为什么办公室里从不装电灯。你说"习惯了"。她说"也对，蜡烛更有氛围"。她至今不知道真相。`,
    () => `🌫️ 雾气弥漫的夜晚最适合审稿。你站在窗前，一只手拿着稿子，另一只手——没有碰到玻璃。因为窗户是关着的。你穿过去了。`,
    () => `🪞 新来的实习生问为什么出版社没有任何镜子。你说"节约空间"。其实是你照不出来。300多年了，你对自己的长相全靠别人描述。`,
    () => `📝 你发现一支1848年的羽毛笔还能写字。墨水是当时的配方——混了五分之一鸽子血。血比例太低了，但你不打算跟作者解释。`,
    () => `🕊️ 鸽子们已经开始认识你了。每天傍晚你在窗台上放一把谷物——它们回报以安静。你审稿的时候，它们帮你盯着。大部分时候它们是对的。`,

    // ── Affection decay events ──
    () => {
      const signed = [...world.authors.values()].filter(a => a.tier !== 'new' && a.tier === 'signed' && a.cooldownUntil === null)
      if (signed.length === 0) return null
      const a = signed[Math.floor(Math.random() * signed.length)]
      a.affection = Math.max(0, a.affection - 3)
      return `📉 ${a.name}在采访中含蓄地提到"希望编辑更常回邮件"。好感 -3。`
    },
    () => {
      const allAuthors = [...world.authors.values()].filter(a => a.tier !== 'new')
      if (allAuthors.length === 0) return null
      const a = allAuthors[Math.floor(Math.random() * allAuthors.length)]
      const lastBook = [...world.manuscripts.values()].find(m => m.authorId === a.id && m.status === 'published')
      if (!lastBook || world.playTicks - (lastBook.publishTime || 0) < 600) return null
      a.affection = Math.max(0, a.affection - 5)
      return `⌛ ${a.name}已经很久没出新书了。不是你的错——但作者显然觉得是。好感 -5。`
    },
    () => {
      const signed = [...world.authors.values()].filter(a => a.tier !== 'new' && a.affection >= 30)
      if (signed.length === 0) return null
      const a = signed[Math.floor(Math.random() * signed.length)]
      a.affection = Math.max(0, a.affection - 2)
      return `📚 ${a.name}路过书店，看到自己的书被放在"打折清仓"区。她拍了张照片发给你——没有文字，只有一个省略号。好感 -2。`
    },

    // ── Author interaction events ──
    () => {
      const signed = [...world.authors.values()].filter(a => a.tier !== 'new' && !a.poached && a.cooldownUntil === null)
      if (signed.length === 0) return null
      const a = signed[Math.floor(Math.random() * signed.length)]
      const prestige = rangeInt(3, 8)
      world.currencies.prestige += prestige
      const msgs = [
        `${a.name}发来一封邮件，标题是"关于截稿日期的理解"。正文只有一行字："下周之前是不可能的。"声望 +${prestige}（因为至少他诚实）。`,
        `${a.name}在工作室里种了一盆罗勒。据说不为了吃——是为了在打字时看。你收到了照片。盆栽长得不错。声望 +${prestige}。`,
        `${a.name}寄来一份手写的修改方案——字迹潦草但内容扎实。你在边缘画了一只蝙蝠表示认可。声望 +${prestige}。`,
        `${a.name}在凌晨三点发了一条朋友圈："新章节写完了。可能是我写过最好的东西。也可能是最烂的。天亮以后再看。"你点了赞。声望 +${prestige}。`,
        `${a.name}邀请你去喝杯茶——"这次是真的茶，不是你的那种红"。你婉拒但很感动。声望 +${prestige}。`,
      ]
      return pick(msgs)
    },
    () => {
      const signed = [...world.authors.values()].filter(a => a.tier !== 'new' && !a.poached && !a.terminated)
      if (signed.length === 0) return null
      const a = signed[Math.floor(Math.random() * signed.length)]
      const prestige = rangeInt(5, 12)
      world.currencies.prestige += prestige
      const msgs = [
        `${a.name}接受了文学杂志的专访。整篇文章里有三段在夸永夜出版社。编辑部主任把它打印出来贴在了茶水间。声望 +${prestige}。`,
        `${a.name}的新书封面上了某设计网站的头条。"封面设计太棒了"——评论里有人问是哪个出版社做的。你没有回答，但在心里记了一笔。声望 +${prestige}。`,
        `${a.name}在签售会上被问到"最喜欢的编辑是谁"——他说了一个两百年的人名。没有人知道那是你。声望 +${prestige}。`,
      ]
      return pick(msgs)
    },

    // ── Affection events ──
    () => {
      const loved = [...world.authors.values()].filter(a => a.affection >= AFFECTION_LETTER)
      if (loved.length === 0) return null
      const a = loved[Math.floor(Math.random() * loved.length)]
      const prestige = rangeInt(15, 30)
      world.currencies.prestige += prestige
      a.affection = Math.max(0, a.affection - 30)
      const letters = [
        `${a.name}寄来了一封手写感谢信。信纸是手工纸，墨水是深蓝色的，字迹因为激动而微微颤抖。附赠一小袋自家种的茶叶。声望 +${prestige}。`,
        `${a.name}在《永夜文学报》上刊登了一整版广告，内容只有一句话："谢谢永夜出版社的编辑。"编辑部主任把它裱起来了。声望 +${prestige}。`,
        `${a.name}寄来了一瓶红酒和一张卡片："致那位让我不敢写烂稿的编辑"。卡片背面还有一行小字："下次我会写得更好"。声望 +${prestige}。`,
        `${a.name}捐赠了一批书籍给出版社的阅览室。每本书的扉页上都手写了一句话。被编辑们轮流拍照发到了内部群里。声望 +${prestige}。`,
      ]
      return pick(letters)
    },
    () => {
      const elite = [...world.authors.values()].filter(a => a.talent >= AFFECTION_ELITE_TALENT && a.affection >= 30)
      if (elite.length === 0) return null
      const a = elite[Math.floor(Math.random() * elite.length)]
      const prestige = rangeInt(10, 20)
      world.currencies.prestige += prestige
      return `🌟 精英作者${a.name}在社交媒体上发了一条长文，称赞出版社的专业水准。文章被转发了${rangeInt(50, 500)}次。声望 +${prestige}。`
    },
    // ── Supernatural & fantasy events ──
    () => {
      const rp = rangeInt(8, 20)
      world.currencies.revisionPoints += rp
      return pick([
        `🐺 一位自称狼人的作者在满月之夜投了稿。文笔凶猛但语法糟糕——主谓宾都变成嚎叫了。你用银色的订书钉把它订了起来。获得 ${rp} RP。`,
        `🧙 隔壁的女巫协会寄来了一份合作提案——用魔法墨水印刷书籍。唯一的问题是：墨水在白天会消失。你回信婉拒了。，但附赠了一盒红茶作为谢礼。`,
        `🧪 一位炼金术士把稿子送到编辑部时，纸张散发着硫磺味。退稿信被自动翻译成了古拉丁文。炼金术士回信表示"翻译有误"但语法比他自己的稿子好。获得 ${rp} RP。`,
        `👻 档案室闹鬼了——但幽灵只在十九世纪的手稿区活动。它对现代稿件的评论是"纸张太薄"。你请它帮忙校对了三篇历史小说。`,
        `🧚 一个精灵混进了作者群——她递交的合同是用晨露写在蜘蛛网上的。法务部表示"不具备法律效力"，但没有一个人敢当面告诉她。`,
        `🔮 占卜师今天在茶水间开了个卜卦摊。她看着你的茶渣说"会有五本畅销书"。然后看了看日历，沉默了。"第五本可能需要等一下。"`,
        `🦇 伯爵的远房亲戚——一位自称"蝙蝠伯爵二世"的年轻人——发来了一份简历。特长栏写着"能变成更大只的蝙蝠"。你在回复栏写了一句："我们会保持联系"。`,
        `🌕 满月之夜，一个毛茸茸的身影出现在投稿箱前。它投的不是稿子——是一根树枝。也许是灵感枯竭。也许是它只是只普通的狗。你决定不做过度解读。`,
        `📖 一本古书不知何时出现在你的书架上。原文是古诺尔斯语。内容大致是关于世界末日的预言——标准的冰岛文学。你把书脊朝外摆了摆，它作为装饰品挺好看的。`,
        `🧛 远房吸血鬼分支"日行者协会"寄来了一封抗议信，认为出版社的名字暗示了对昼间活动的歧视。你回信解释了"永夜"是一种审稿状态的比喻。他们没有再回信。`,
        `🕯️ 一个不请自来的幽灵作家——字面意义上的——在你的空稿纸上写了一章。你读完之后感动不已。它在你耳边低语：续集在另一个维度。`,
        `🐉 一条龙发来了投稿。不是龙写的——是它收集的城堡图书馆里的手稿。封面有烧焦的痕迹。你发回了审读意见：不太适合市场，但建议保留作为镇社之宝。`,
      ])
    },
    // ── Cat events ──
    () => {
      if (!world.catState || !world.catState.alive) return null
      return pick([
        `🐱 你的猫跳上了书桌，在一叠待审稿件上踩出一串梅花印。你把它拎下来的时候，它用尾巴扫掉了半杯红茶——不是你以为的那种红。`,
        `😺 猫叼着一只死老鼠回来放在你脚边。你摸了摸它的头。"审过了？"你问。它打了个哈欠——大概是说写得一般。`,
        `📜 猫把你今天要审的稿子推到了地上。你低头看了看——是那本你一直想退但作者坚持要改的。猫的判断力一直不错。`,
        `🐈 猫不知怎么钻进了书架顶层，现在它俯视着你。你知道这不是偶然——这是它在提醒你，出版业的鄙视链上总有人在上面。`,
        `🖋️ 猫爪下压着一张纸条。字迹是你自己的——"明天必须审完五本"。但猫已经替你画了四个叉。还剩一本。它认为那是合理的量。`,
        `🐱 猫在窗台上对着月亮叫了一声。你说"别叫了，月亮不听你的"。猫用沉默告诉你：月亮只是假装不听。`,
      ])
    },
  ]

  // Pick a random event, retry if null (max 5 tries)
  for (let i = 0; i < 5; i++) {
    const result = pick(pool)()
    if (result !== null) return result
  }
  return null
}

// ──── Offline progress ────
export function computeOfflineProgress(world: GameWorldState, offlineTicks: number): TickResult {
  const combined: TickResult = {
    newManuscripts: [],
    publishedBooks: [],
    royaltiesEarned: 0,
    toasts: [],
    eventsTriggered: [],
    authorsReturned: [],
    catDecisionAvailable: false,
  }

  // Cap offline progress to 8 hours
  const cappedTicks = Math.min(offlineTicks, 28800)

  for (let i = 0; i < cappedTicks; i++) {
    // Run a simplified tick (no toast generation to avoid spam)
    const t = tick(world)
    combined.newManuscripts.push(...t.newManuscripts)
    combined.publishedBooks.push(...t.publishedBooks)
    combined.royaltiesEarned += t.royaltiesEarned
    combined.eventsTriggered.push(...t.eventsTriggered)
  }

  // Generate a summary toast
  if (cappedTicks > 60) {
    combined.toasts.push({
      id: nanoid(),
      text: `你离开了${Math.round(cappedTicks / 60)}分钟。出版社自己运转了。结果嘛……还不错。`,
      type: 'info',
      createdAt: Date.now(),
    })
  }

  return combined
}

