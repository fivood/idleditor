import { useEffect } from 'react'
import { useGameStore } from '@/store/gameStore'

export function useGameLoop() {
  const isInitialized = useGameStore(s => s.isInitialized)

  useEffect(() => {
    if (!isInitialized) return
    const timer = setInterval(() => {
      useGameStore.getState().tick()
    }, 1000)
    return () => clearInterval(timer)
  }, [isInitialized])
}
