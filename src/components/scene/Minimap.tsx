import { useGameStore } from '@/store/gameStore'
import { IconDesk, IconShelf, IconAuthors, IconOffice, IconStudy, IconArchive } from '@/assets/pixelIcons'
import type { FC } from 'react'

type RoomKey = 'desk' | 'shelf' | 'authors' | 'office' | 'study' | 'stats'

interface PixelIconProps {
  size?: number
}

const ROOMS: { key: RoomKey; Icon: FC<PixelIconProps>; label: string; hotkey: string }[] = [
  { key: 'desk',    Icon: IconDesk,    label: '桌面', hotkey: '1' },
  { key: 'shelf',   Icon: IconShelf,   label: '书架', hotkey: '2' },
  { key: 'authors', Icon: IconAuthors, label: '作者', hotkey: '3' },
  { key: 'office',  Icon: IconOffice,  label: '办公室', hotkey: '4' },
  { key: 'study',   Icon: IconStudy,   label: '书房', hotkey: '5' },
  { key: 'stats',   Icon: IconArchive, label: '档案', hotkey: '6' },
]

/**
 * 房间速跳条。
 * 横向平铺在场景底部的桌沿暗区上（z-50），看起来像桌沿一排刻字的木牌。
 */
export function Minimap() {
  const activeTab = useGameStore(s => s.activeTab)
  const setActiveTab = useGameStore(s => s.setActiveTab)

  return (
    <div
      className="absolute bottom-0 left-0 right-0 z-50 flex items-end justify-center pointer-events-none"
      style={{ paddingBottom: 4 }}
    >
      <div
        className="pointer-events-auto flex items-stretch gap-0 border-2 border-[#0a0806]"
        style={{
          background: 'linear-gradient(180deg, #2a1810, #1a0e08)',
          boxShadow: '0 -1px 0 rgba(184, 118, 59, 0.15) inset, 2px 2px 0 rgba(0,0,0,0.4)',
        }}
      >
        {ROOMS.map(room => {
          const isActive = activeTab === room.key
          const RoomIcon = room.Icon
          return (
            <button
              key={room.key}
              onClick={() => setActiveTab(room.key)}
              title={`${room.label}（按 ${room.hotkey}）`}
              aria-label={room.label}
              className="relative flex flex-col items-center justify-center w-14 md:w-16 h-10 md:h-11 px-1 border-r border-[#0a0806] last:border-r-0 cursor-pointer transition-all"
              style={{
                background: isActive
                  ? 'linear-gradient(180deg, #b8763b, #8a5828)'
                  : 'linear-gradient(180deg, #3d2614, #2a1810)',
                boxShadow: isActive
                  ? 'inset 0 0 0 1px #f5d878, 0 0 8px rgba(245, 216, 120, 0.4)'
                  : 'inset 0 1px 0 rgba(184, 118, 59, 0.2)',
              }}
            >
              <span
                className="leading-none"
                style={{
                  filter: isActive ? 'drop-shadow(0 0 2px rgba(245, 216, 120, 0.6))' : 'none',
                }}
              >
                <RoomIcon size={18} />
              </span>
              <span
                className="text-[9px] md:text-[10px] font-mono mt-0.5 tracking-wider"
                style={{ color: isActive ? '#fff8e8' : '#b8a48a' }}
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
