import { getDeptEfficiency, getDeptLevel } from '../helpers'
import { rangeInt, pick } from '@/utils/random'
import { DEPARTMENT_COST_MULTIPLIER, AUTO_REVIEW_DEPT_LEVEL, AUTO_COVER_PRESTIGE, AUTO_REJECT_PRESTIGE, MILESTONES } from '../constants'
import { SHELVED_RESUBMISSION_NOTES } from '../data/editorNotes'
import type { TickContext } from './types'

export function processAutomationPhase({ world, result, ct }: TickContext) {
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
}

// Ensure nanoid import exists
import { nanoid } from '@/utils/id'
