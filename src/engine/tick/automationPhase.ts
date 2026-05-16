import { getDeptEfficiency, getDeptLevel } from '@/core/helpers'
import { rangeInt, pick } from '@/utils/random'
import { nanoid } from '@/utils/id'
import { DEPARTMENT_COST_MULTIPLIER, AUTO_REVIEW_DEPT_LEVEL, AUTO_COVER_PRESTIGE, AUTO_REJECT_PRESTIGE, MILESTONES } from '@/core/constants'
import { GENRES, type Genre } from '@/core/types'
import { SHELVED_RESUBMISSION_NOTES } from '@/core/data/editorNotes'
import type { GameWorldState } from '@/core/gameLoop'
import type { TickResult } from '@/core/types'
import type { PhaseResult, TickContext } from '../types'

const DEPT_NAMES: Record<string, string> = {
  editing: '编辑部', design: '设计部', marketing: '市场部', rights: '版权部',
}

export function processAutomationPhase(world: GameWorldState, { ct }: TickContext, result: TickResult): PhaseResult {
  for (const dept of world.departments.values()) {
    if (dept.upgradingUntil !== null && world.playTicks >= dept.upgradingUntil) {
      dept.level++
      dept.upgradingUntil = null
      dept.upgradeCostRP = Math.round(dept.upgradeCostRP * DEPARTMENT_COST_MULTIPLIER)
      dept.upgradeCostPrestige = Math.max(0, Math.round((dept.upgradeCostPrestige + 3) * 1.3))
      dept.upgradeTicks = Math.round(dept.upgradeTicks * 1.15)
      result.toasts.push(ct(`🏢 ${DEPT_NAMES[dept.type] ?? dept.type}升至 Lv.${dept.level}！`, 'milestone'))
    }
  }

  const rightsEfficiency = getDeptEfficiency(world, 'rights')
  if (rightsEfficiency > 0) {
    world.currencies.prestige = Math.round((world.currencies.prestige + rightsEfficiency * 1.0) * 100) / 100
  }

  if (!world.catState && world.calendar.year > world.catRejectedUntilYear && Math.random() < 0.003) {
    result.catDecisionAvailable = true
  }

  const editingDeptLevel = getDeptLevel(world, 'editing')
  const prestige = world.currencies.prestige

  if (editingDeptLevel >= AUTO_REVIEW_DEPT_LEVEL && world.autoReviewEnabled) {
    const submitted = [...world.manuscripts.values()].filter(m => m.status === 'submitted')
    if (submitted.length > 0) {
      const ms = submitted[0]
      ms.status = 'reviewing'
      ms.editingProgress = 0
      result.toasts.push(ct(`🤖 自动审稿：《${ms.title}》`, 'info'))
    }
  }

  if (prestige >= AUTO_COVER_PRESTIGE && world.booksPublishedThisMonth < 10 + world.publishingQuotaUpgrades && world.autoCoverEnabled) {
    const awaitingCover = [...world.manuscripts.values()].filter(m => m.status === 'cover_select')
    if (awaitingCover.length > 0) {
      const designLevel = getDeptLevel(world, 'design')
      const batchMode = editingDeptLevel >= 4 && designLevel >= 3
      const toProcess = batchMode ? awaitingCover : [awaitingCover[0]]
      let count = 0
      for (const ms of toProcess) {
        if (world.booksPublishedThisMonth + count >= 10 + world.publishingQuotaUpgrades) break
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

  if (prestige >= AUTO_REJECT_PRESTIGE && editingDeptLevel >= 5 && world.autoRejectEnabled) {
    const toReject = [...world.manuscripts.values()].filter(m => m.status === 'submitted' && (m.isUnsuitable || world.blacklistedGenres.includes(m.genre)))
    for (const ms of toReject) {
      ms.status = 'rejected'
      world.totalRejections++
      world.currencies.revisionPoints += 8
      world.currencies.prestige += 3
      const author = world.authors.get(ms.authorId)
      if (author) {
        author.rejectedCount++
        author.cooldownUntil = 900 + author.rejectedCount * 180
      }
      if (world.blacklistedGenres.includes(ms.genre)) {
        result.toasts.push(ct(`🤖 自动退稿（黑名单）：《${ms.title}》——我们目前不收此类题材。`, 'info'))
      } else {
        result.toasts.push(ct(`🤖 自动退稿：《${ms.title}》——不值得人类编辑的注意力。`, 'info'))
      }
    }
  }

  world.trendTimer--
  if (world.trendTimer <= 0) {
    world.trendTimer = 720
    const oldTrend = world.currentTrend
    let newTrend = pick(GENRES)
    while (newTrend === oldTrend) {
      newTrend = pick(GENRES)
    }
    world.currentTrend = newTrend as Genre
    result.toasts.push(ct(`📈 市场风向标：近期【${newTrend}】类小说似乎格外受到读者追捧，相关作品自然投稿率与销量大幅提升。`, 'milestone'))
  }

  for (const ms of MILESTONES) {
    if (!world.triggeredMilestones.has(ms.ticks) && world.playTicks >= ms.ticks) {
      world.triggeredMilestones.add(ms.ticks)
      result.toasts.push({ id: nanoid(), text: ms.message, type: 'milestone', createdAt: world.playTicks })
    }
  }

  for (const m of world.manuscripts.values()) {
    if (m.status !== 'shelved' || !m.shelvedAt) continue
    const shelvedDuration = world.playTicks - m.shelvedAt
    if (shelvedDuration >= 300 + rangeInt(0, 300)) {
      m.status = 'submitted'
      m.quality = Math.min(100, m.quality + 3)
      m.shelvedAt = null
      if (!m.synopsis.includes('（作者修改')) {
        m.synopsis += ' ' + pick(SHELVED_RESUBMISSION_NOTES)
      }
      result.toasts.push(ct(`📥 《${m.title}》经过修改后重新投稿。品质 +3。`, 'info'))
    }
  }

  return { world, result }
}
