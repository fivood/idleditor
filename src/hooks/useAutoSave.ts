import { useEffect, useRef } from 'react'
import { useGameStore } from '@/store/gameStore'
import { saveGameToDb } from '@/db/saveManager'

export function useAutoSave() {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isInitialized = useGameStore(s => s.isInitialized)

  useEffect(() => {
    if (!isInitialized) return

    timerRef.current = setInterval(() => {
      const state = useGameStore.getState()
      saveGameToDb({
        playTicks: state.playTicks,
        currencies: state.currencies,
        permanentBonuses: state.permanentBonuses,
        trait: state.trait,
        playerName: state.playerName,
        calendar: state.calendar,
        totalPublished: state.totalPublished,
        totalBestsellers: state.totalBestsellers,
        totalRejections: state.totalRejections,
        booksPublishedThisMonth: state.booksPublishedThisMonth,
        editorXP: state.editorXP,
        editorLevel: state.editorLevel,
        publishingQuotaUpgrades: state.publishingQuotaUpgrades,
        autoReviewEnabled: state.autoReviewEnabled,
        autoCoverEnabled: state.autoCoverEnabled,
        autoRejectEnabled: state.autoRejectEnabled,
        triggeredMilestones: state.triggeredMilestones,
        manuscripts: state.manuscripts,
        authors: state.authors,
        departments: state.departments,
        events: state.events,
      }).catch(() => {})
    }, 60_000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isInitialized])

  // Save on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      const state = useGameStore.getState()
      saveGameToDb({
        playTicks: state.playTicks,
        currencies: state.currencies,
        permanentBonuses: state.permanentBonuses,
        trait: state.trait,
        playerName: state.playerName,
        calendar: state.calendar,
        totalPublished: state.totalPublished,
        totalBestsellers: state.totalBestsellers,
        totalRejections: state.totalRejections,
        booksPublishedThisMonth: state.booksPublishedThisMonth,
        editorXP: state.editorXP,
        editorLevel: state.editorLevel,
        publishingQuotaUpgrades: state.publishingQuotaUpgrades,
        autoReviewEnabled: state.autoReviewEnabled,
        autoCoverEnabled: state.autoCoverEnabled,
        autoRejectEnabled: state.autoRejectEnabled,
        triggeredMilestones: state.triggeredMilestones,
        manuscripts: state.manuscripts,
        authors: state.authors,
        departments: state.departments,
        events: state.events,
      }).catch(() => {})
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])
}
