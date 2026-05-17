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

/**
 * 房间速跳条。横向平铺在场景底部桌沿。
 * 使用 PNG 像素图标 + image-rendering: pixelated 保持锐利。
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
          return (
            <button
              key={room.key}
              onClick={() => setActiveTab(room.key)}
              title={`${room.label}（按 ${room.hotkey}）`}
              aria-label={room.label}
              className="relative flex flex-col items-center justify-center w-14 md:w-16 h-12 md:h-14 px-1 border-r border-[#0a0806] last:border-r-0 cursor-pointer transition-all"
              style={{
                background: isActive
                  ? 'linear-gradient(180deg, #b8763b, #8a5828)'
                  : 'linear-gradient(180deg, #3d2614, #2a1810)',
                boxShadow: isActive
                  ? 'inset 0 0 0 1px #f5d878, 0 0 8px rgba(245, 216, 120, 0.4)'
                  : 'inset 0 1px 0 rgba(184, 118, 59, 0.2)',
              }}
            >
              <img
                src={room.iconPath}
                alt=""
                width={28}
                height={28}
                draggable={false}
                className="pointer-events-none select-none"
                style={{
                  imageRendering: 'pixelated',
                  filter: isActive
                    ? 'drop-shadow(0 0 2px rgba(245, 216, 120, 0.8))'
                    : 'none',
                  opacity: isActive ? 1 : 0.85,
                }}
              />
              <span
                className="text-[9px] md:text-[10px] font-mono mt-0.5 tracking-wider leading-none"
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
