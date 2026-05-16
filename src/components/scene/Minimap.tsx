import { useGameStore } from '@/store/gameStore'

type RoomKey = 'desk' | 'shelf' | 'authors' | 'office' | 'study' | 'stats'

const ROOMS: { key: RoomKey; icon: string; label: string; hotkey: string }[] = [
  { key: 'desk',    icon: '✍️', label: '桌面', hotkey: '1' },
  { key: 'shelf',   icon: '📚', label: '书架', hotkey: '2' },
  { key: 'authors', icon: '✒️', label: '作者', hotkey: '3' },
  { key: 'office',  icon: '🏛️', label: '办公室', hotkey: '4' },
  { key: 'study',   icon: '📖', label: '书房', hotkey: '5' },
  { key: 'stats',   icon: '🗄️', label: '档案', hotkey: '6' },
]

/**
 * 6 房间速跳 minimap，桌面端永久浮在左下角。
 * 当前房间高亮，hover 显示房间名 + 快捷键。
 */
export function Minimap() {
  const activeTab = useGameStore(s => s.activeTab)
  const setActiveTab = useGameStore(s => s.setActiveTab)

  return (
    <div className="absolute bottom-3 left-3 z-50 bg-[#140e0a]/85 backdrop-blur-sm border-2 border-border-dark p-1.5 shadow-[2px_2px_0_#0a0806]">
      <div className="grid grid-cols-3 gap-0.5">
        {ROOMS.map(room => {
          const isActive = activeTab === room.key
          return (
            <button
              key={room.key}
              onClick={() => setActiveTab(room.key)}
              title={`${room.label}（${room.hotkey}）`}
              aria-label={room.label}
              className={`w-8 h-8 flex items-center justify-center text-base border transition-all cursor-pointer ${
                isActive
                  ? 'bg-copper border-[#f5d878] text-white scale-105'
                  : 'bg-[#3d2614] border-[#5c3a1f] hover:bg-[#5c3a1f]'
              }`}
            >
              {room.icon}
            </button>
          )
        })}
      </div>
      <div className="text-center mt-1 text-[9px] text-[#b8a48a] font-mono">永夜出版社</div>
    </div>
  )
}
