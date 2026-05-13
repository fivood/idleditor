import { useState, useCallback } from 'react'
import { useGameStore } from '@/store/gameStore'
import { loadGameFromDb } from '@/db/saveManager'
import { computeOfflineProgress } from '@/core/gameLoop'
import type { GameWorldState } from '@/core/gameLoop'

export function useOfflineProgress() {
  const [showReport, setShowReport] = useState(false)
  const [offlineTicks, setOfflineTicks] = useState(0)
  const [events, setEvents] = useState<string[]>([])
  const [earned, setEarned] = useState({ royalties: 0, published: 0, rejected: 0 })

  const checkOfflineProgress = useCallback(async () => {
    const saved = await loadGameFromDb()
    if (!saved) return

    const state = useGameStore.getState()
    const ticksSinceSave = state.playTicks - saved.playTicks
    if (ticksSinceSave < 30) return

    const world: GameWorldState = {
      manuscripts: new Map(),
      authors: new Map(),
      departments: new Map(),
      events: [],
      playTicks: saved.playTicks,
      totalPublished: saved.totalPublished,
      totalBestsellers: saved.totalBestsellers,
      totalRejections: saved.totalRejections,
      currencies: { ...saved.currencies },
      permanentBonuses: { ...saved.permanentBonuses },
      trait: null,
      playerName: saved.playerName ?? '',
      calendar: saved.calendar ?? { day: 1, month: 0, year: 1, totalDays: 0 },
      spawnTimer: 0,
      awardTimer: 0,
      trendTimer: 0,
      triggeredMilestones: new Set(saved.triggeredMilestones),
      activeDateEvent: null,
      coversManifest: null,
      preferredGenres: [],
      booksPublishedThisMonth: saved.booksPublishedThisMonth ?? 0,
      publishedTitles: new Set<string>(),
      editorXP: saved.editorXP ?? 0,
      editorLevel: saved.editorLevel ?? 1,
      publishingQuotaUpgrades: saved.publishingQuotaUpgrades ?? 0,
      autoReviewEnabled: saved.autoReviewEnabled ?? true,
      autoCoverEnabled: saved.autoCoverEnabled ?? true,
      autoRejectEnabled: saved.autoRejectEnabled ?? true,
      unlockedCollections: new Set<string>(),
    }

    for (const [id, ms] of saved.manuscripts) world.manuscripts.set(id, ms)
    for (const [id, a] of saved.authors) world.authors.set(id, a)
    for (const [id, d] of saved.departments) world.departments.set(id, d)

    const prevRejected = saved.totalRejections
    const result = computeOfflineProgress(world, ticksSinceSave)

    // Generate humorous offline events
    const elapsedMinutes = Math.round(ticksSinceSave / 60)
    const offlineXP = Math.floor(elapsedMinutes * 1) // 1 XP/min offline
    world.editorXP += offlineXP
    const newPublished = result.publishedBooks.length
    const newRejected = world.totalRejections - prevRejected

    const eventMsgs: string[] = []

    if (elapsedMinutes >= 60) {
      const hours = Math.round(elapsedMinutes / 60)
      eventMsgs.push(`你离开了约${hours}小时。伯爵敲了七次你办公室的门，然后叹了口气说"年轻人啊"。`)
    } else if (elapsedMinutes >= 10) {
      eventMsgs.push(`你离开了${elapsedMinutes}分钟。茶水间的咖啡机爆炸了两次——编辑们已经开始用冷水泡茶了。`)
    } else {
      eventMsgs.push(`离线期间积累经验：+${offlineXP} XP（在线效率约15倍）`)
    }

    if (newPublished > 0) {
      eventMsgs.push(`📚 ${newPublished}本书在你离开期间悄然出版。作者们纷纷发来感谢信——大部分感谢的是编辑部的自动回复机器人。`)
    } else {
      eventMsgs.push(`没有新书出版。流水线大概在等你回来才能继续运转。`)
    }

    if (newRejected > 0) {
      const reasons = [
        '据说有人在出版社门口举着"还我稿子"的牌子',
        '其中一位作者声称他的猫写了这本书的后半部分',
        '退稿信是用一首十四行诗写的——编辑显然太闲了',
      ]
      eventMsgs.push(`🗑️ ${newRejected}份稿件被无情退稿。${reasons[Math.floor(Math.random() * reasons.length)]}。`)
    }

    // Count submitted manuscripts that accumulated
    const submittedCount = [...world.manuscripts.values()].filter(m => m.status === 'submitted').length
    if (submittedCount >= 5) {
      eventMsgs.push(`📮 投稿池里堆了${submittedCount}份待审稿件。其中至少一半的作者在社交媒体上发过"编辑是不是死了"。`)
    }

    // Check authors on cooldown
    const cooldownAuthors = [...world.authors.values()].filter(a => a.cooldownUntil !== null && a.cooldownUntil > 0).length
    if (cooldownAuthors > 0) {
      eventMsgs.push(`😤 ${cooldownAuthors}位作者还在生闷气。有一位在咖啡里倒了盐而不是糖——不知道是针对谁的。`)
    }

    // More absurd events if gone for a long time
    if (elapsedMinutes >= 120) {
      const absurdEvents = [
        '版权部的实习生把三本书的封面印串了——现在一本推理小说封面上印着"如何种萝卜"。',
        '市场部在一次会议上决定把出版社的标语改成"不读就死"。伯爵不太高兴。',
        '有人把一只乌鸦带进办公室，声称它是已故作者转世。乌鸦现在在编辑部顶上筑巢。',
        '设计部的打印机吐出了一份不需要的稿子——连纸张都觉得太烂了。',
      ]
      eventMsgs.push(absurdEvents[Math.floor(Math.random() * absurdEvents.length)])
    }

    setOfflineTicks(ticksSinceSave)
    setEarned({ royalties: result.royaltiesEarned, published: newPublished, rejected: newRejected })
    setEvents(eventMsgs)
    setShowReport(true)
  }, [])

  const dismiss = useCallback(() => setShowReport(false), [])

  return { showReport, offlineTicks, earned, events, checkOfflineProgress, dismiss }
}
