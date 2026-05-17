import { useState } from 'react'
import { useGameStore } from '@/store/gameStore'

type RoomKey = 'desk' | 'shelf' | 'authors' | 'office' | 'study' | 'stats'

const ROOMS: { key: RoomKey; iconPath: string; label: string; hotkey: string }[] = [
  { key: 'desk',    iconPath: '/scenes/icon-desk.png',    label: '桌面',   hotkey: '1' },
  { key: 'shelf',   iconPath: '/scenes/icon-shelf.png',   label: '书架',   hotkey: '2' },
  { key: 'authors', iconPath: '/scenes/icon-authors.png', label: '作者',   hotkey: '3' },
  { key: 'office',  iconPath: '/scenes/icon-office.png',  label: '办公室', hotkey: '4' },
  { key: 'study',   iconPath: '/scenes/icon-study.png',   label: '书房',   hotkey: '5' },
  { key: 'stats',   iconPath: '/scenes/icon-stats.png',   label: '档案',   hotkey: '6' },
]

const TEXT_OUTLINE = [
  '1px 0 0 #0a0806',
  '-1px 0 0 #0a0806',
  '0 1px 0 #0a0806',
  '0 -1px 0 #0a0806',
  '1px 1px 0 #0a0806',
  '-1px -1px 0 #0a0806',
  '1px -1px 0 #0a0806',
  '-1px 1px 0 #0a0806',
].join(', ')

// 红色 1px 描边（4 向 drop-shadow）
const RED_OUTLINE = 'drop-shadow(1px 0 0 #c84040) drop-shadow(-1px 0 0 #c84040) drop-shadow(0 1px 0 #c84040) drop-shadow(0 -1px 0 #c84040)'
// 铜金 active 描边
const COPPER_OUTLINE = 'drop-shadow(1px 0 0 #f5d878) drop-shadow(-1px 0 0 #f5d878) drop-shadow(0 1px 0 #f5d878) drop-shadow(0 -1px 0 #f5d878)'
// 默认黑色硬阴影
const DEFAULT_SHADOW = 'drop-shadow(1px 1px 0 #0a0806)'

export function Minimap() {
  const activeTab = useGameStore(s => s.activeTab)
  const setActiveTab = useGameStore(s => s.setActiveTab)
  const [hoverKey, setHoverKey] = useState<RoomKey | null>(null)

  return (
    <div
      className="absolute bottom-0 left-0 right-0 z-50 flex items-end justify-center pointer-events-none"
      style={{ paddingBottom: 6 }}
    >
      <div className="pointer-events-auto flex items-end gap-1 md:gap-2">
        {ROOMS.map(room => {
          const isActive = activeTab === room.key
          const isHover = hoverKey === room.key
          // 优先级：active 铜金 > hover 红色 > 默认黑影
          const filter = isActive ? COPPER_OUTLINE : isHover ? RED_OUTLINE : DEFAULT_SHADOW
          return (
            <button
              key={room.key}
              onClick={() => setActiveTab(room.key)}
              onMouseEnter={() => setHoverKey(room.key)}
              onMouseLeave={() => setHoverKey(prev => (prev === room.key ? null : prev))}
              title={`${room.label}（按 ${room.hotkey}）`}
              aria-label={room.label}
              className="relative flex flex-col items-center justify-center w-14 md:w-16 px-1 py-1 cursor-pointer bg-transparent border-0"
            >
              <img
                src={room.iconPath}
                alt=""
                width={36}
                height={36}
                draggable={false}
                className="pointer-events-none select-none"
                style={{
                  imageRendering: 'pixelated',
                  filter,
                  opacity: isActive || isHover ? 1 : 0.88,
                  transform: isActive ? 'scale(1.08)' : isHover ? 'scale(1.05)' : 'scale(1)',
                }}
              />
              <span
                className="text-[11px] md:text-xs font-mono mt-1 tracking-wider leading-none font-bold"
                style={{
                  color: isActive ? '#f5d878' : isHover ? '#f5b8b8' : '#fff8e8',
                  textShadow: TEXT_OUTLINE,
                }}
              >
                {room.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
