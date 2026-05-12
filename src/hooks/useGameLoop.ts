import { useEffect, useRef } from 'react'
import { useGameStore } from '@/store/gameStore'

export function useGameLoop() {
  const isRunning = useGameStore(s => s.isRunning)
  const isInitialized = useGameStore(s => s.isInitialized)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!isInitialized) return

    if (isRunning) {
      intervalRef.current = setInterval(() => {
        useGameStore.getState().tick()
      }, 1000)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isRunning, isInitialized])
}
