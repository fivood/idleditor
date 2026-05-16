import { useGameStore } from '@/store/gameStore'

interface CorridorDoorProps {
  /** 门通向哪个房间（通常是 'office' 作为枢纽）*/
  to: 'desk' | 'shelf' | 'authors' | 'office' | 'study' | 'stats'
  /** 门所在的边 */
  side?: 'right' | 'left'
  /** 标签文字 */
  label: string
}

/**
 * 房间边缘的"门"，点击切换到相邻房间。
 * 通常右侧门通向走廊枢纽（办公室）。
 */
export function CorridorDoor({ to, side = 'right', label }: CorridorDoorProps) {
  const setActiveTab = useGameStore(s => s.setActiveTab)
  const isRight = side === 'right'
  return (
    <button
      onClick={() => setActiveTab(to)}
      aria-label={label}
      className={`absolute top-1/2 -translate-y-1/2 z-30 w-12 md:w-16 h-32 md:h-40 cursor-pointer border-y-2 border-${isRight ? 'l' : 'r'}-2 border-[#b8763b] flex items-center justify-center font-mono text-[10px] md:text-xs text-[#b8a48a] hover:text-[#f5d878] transition-colors ${
        isRight ? 'right-0' : 'left-0'
      }`}
      style={{
        background: isRight
          ? 'linear-gradient(90deg, transparent, rgba(245, 216, 120, 0.15))'
          : 'linear-gradient(-90deg, transparent, rgba(245, 216, 120, 0.15))',
        writingMode: 'vertical-rl',
      }}
    >
      🚪 {label}
    </button>
  )
}
