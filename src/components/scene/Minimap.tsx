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

// 文字黑色描边：4 向 + 4 对角的 text-shadow 叠加
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

/**
 * 房间速跳条。
 * 透明背景，PNG 图标 + 黑描边文字直接浮在场景上。
 */
export function Minimap() {
  const activeTab = useGameStore(s => s.activeTab)
  const setActiveTab = useGameStore(s => s.setActiveTab)

  return (
    <div
      className="absolute bottom-0 left-0 right-0 z-50 flex items-end justify-center pointer-events-none"
      style={{ paddingBottom: 6 }}
    >
      <div className="pointer-events-auto flex items-end gap-1 md:gap-2">
        {ROOMS.map(room => {
          const isActive = activeTab === room.key
          return (
            <button
              key={room.key}
              onClick={() => setActiveTab(room.key)}
              title={`${room.label}（按 ${room.hotkey}）`}
              aria-label={room.label}
              className="group relative flex flex-col items-center justify-center w-14 md:w-16 px-1 py-1 cursor-pointer transition-all bg-transparent border-0"
            >
              <img
                src={room.iconPath}
                alt=""
                width={36}
                height={36}
                draggable={false}
                className="pointer-events-none select-none transition-all duration-100"
                style={{
                  imageRendering: 'pixelated',
                  filter: isActive
                    ? 'drop-shadow(1px 0 0 #f5d878) drop-shadow(-1px 0 0 #f5d878) drop-shadow(0 1px 0 #f5d878) drop-shadow(0 -1px 0 #f5d878) brightness(1.15)'
                    : 'drop-shadow(0 1px 1px rgba(0,0,0,0.6))',
                  opacity: isActive ? 1 : 0.88,
                  transform: isActive ? 'scale(1.08)' : 'scale(1)',
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.filter =
                      'drop-shadow(1px 0 0 #d4a85a) drop-shadow(-1px 0 0 #d4a85a) drop-shadow(0 1px 0 #d4a85a) drop-shadow(0 -1px 0 #d4a85a) brightness(1.1)'
                    ;(e.currentTarget as HTMLElement).style.opacity = '1'
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.filter = 'drop-shadow(0 1px 1px rgba(0,0,0,0.6))'
                    ;(e.currentTarget as HTMLElement).style.opacity = '0.88'
                  }
                }}
              />
              <span
                className="text-[10px] md:text-xs font-mono mt-1 tracking-wider leading-none font-bold"
                style={{
                  color: isActive ? '#f5d878' : '#fff8e8',
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
