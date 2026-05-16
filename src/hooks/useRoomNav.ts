import { useEffect } from 'react'
import { useGameStore } from '@/store/gameStore'

type RoomKey = 'desk' | 'shelf' | 'authors' | 'office' | 'study' | 'stats'

const KEY_TO_ROOM: Record<string, RoomKey> = {
  '1': 'desk',
  '2': 'shelf',
  '3': 'authors',
  '4': 'office',
  '5': 'study',
  '6': 'stats',
}

/**
 * 键盘快捷键：1-6 切换房间，Esc 回 office 枢纽
 */
export function useRoomNav() {
  const setActiveTab = useGameStore(s => s.setActiveTab)
  const activeTab = useGameStore(s => s.activeTab)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // 忽略输入框中的按键
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return

      const room = KEY_TO_ROOM[e.key]
      if (room) {
        e.preventDefault()
        setActiveTab(room)
      } else if (e.key === 'Escape' && activeTab !== 'office') {
        e.preventDefault()
        setActiveTab('office')
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [setActiveTab, activeTab])
}
