import { getDeptEfficiency } from '../helpers'
import { reviewTicks, rpPerReview, editingTicks, rpPerEdit, proofingTicks, rpPerProof, publishingTicks, rpPerPublish } from '../formulas'
import { generateToast } from '../humor/generator'
import { generatePublishNote, generateLevelUpToast } from '../data/editorNotes'
import { xpForPublish, getLevelFromXP } from '../leveling'
import {
  AFFECTION_BAD_PUBLISH_PENALTY,
  AFFECTION_ELITE_TALENT,
  AFFECTION_LOYAL,
  AFFECTION_PER_PROMOTION,
  AFFECTION_PER_PUBLISH,
  AFFECTION_PER_QUALITY_PUBLISH,
  AUTHOR_FAME_PER_PUBLISH,
  AUTHOR_TIER_THRESHOLDS,
} from '../constants'
import type { TickContext } from './types'

export function processPipelinePhase({ world, result, ct, effSpeedBonus, effRpBonus, talentBonuses, epochSocialite }: TickContext) {
  const editEfficiency = getDeptEfficiency(world, 'editing')
  const designEfficiency = getDeptEfficiency(world, 'design')
  const speedMult = 1 + effSpeedBonus

  // 2. Process reviewing
  for (const m of world.manuscripts.values()) {
    if (m.status !== 'reviewing') continue
    const needed = reviewTicks(editEfficiency)
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
    const needed = editingTicks(m.wordCount, editEfficiency)
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
    const needed = proofingTicks(editEfficiency)
    m.editingProgress += (1 / needed) * speedMult
    if (m.editingProgress >= 1) {
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
    const needed = publishingTicks(editEfficiency)
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
      world.currencies.prestige += pubPrestige * (epochSocialite ? 1.5 : 1)
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
}
