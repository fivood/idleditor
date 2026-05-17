import { useState } from 'react'
import { useGameStore } from '@/store/gameStore'

interface CorridorDoorProps {
  /** 门通向哪个房间（通常是 'office' 作为枢纽）*/
  to: 'desk' | 'shelf' | 'authors' | 'office' | 'study' | 'stats'
  /** 门所在的边 - left 时图标会水平镜像（箭头朝左）*/
  side?: 'right' | 'left'
  /** 标签文字（hover 时显示 tooltip）*/
  label: string
}

/**
 * 房间边缘的"门"，点击切换到相邻房间。
 *
 * 使用 PNG 图标 icon-move.png（默认）和 icon-move-hover.png（hover）。
 * 当 side='left' 时图标水平镜像（CSS transform: scaleX(-1)），
 * 表示"往左走"。side='right' 默认朝向，表示"往右走"。
 */
export function CorridorDoor({ to, side = 'right', label }: CorridorDoorProps) {
  const setActiveTab = useGameStore(s => s.setActiveTab)
  const [hover, setHover] = useState(false)
  const isLeft = side === 'left'
  const iconSrc = hover ? '/scenes/icon-move-hover.png' : '/scenes/icon-move.png'

  return (
    <button
      onClick={() => setActiveTab(to)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      aria-label={label}
      title={label}
      className={`group absolute top-1/2 -translate-y-1/2 z-30 cursor-pointer bg-transparent border-0 p-2 ${
        isLeft ? 'left-1' : 'right-1'
      }`}
      style={{ width: 56, height: 80 }}
    >
      <img
        src={iconSrc}
        alt=""
        draggable={false}
        className="w-full h-full object-contain pointer-events-none select-none transition-transform duration-100 group-hover:scale-110 group-active:translate-x-[1px]"
        style={{
          imageRendering: 'pixelated',
          transform: isLeft ? 'scaleX(-1)' : 'none',
        }}
      />
      {/* hover 标签 */}
      <span
        className="absolute left-1/2 -translate-x-1/2 -bottom-7 opacity-0 group-hover:opacity-100 bg-[#f5d878] text-[#1a1410] px-2 py-0.5 text-xs font-bold font-mono border-2 border-[#4a3728] whitespace-nowrap pointer-events-none transition-opacity duration-100"
        style={{ zIndex: 100 }}
      >
        {label}
      </span>
    </button>
  )
}
