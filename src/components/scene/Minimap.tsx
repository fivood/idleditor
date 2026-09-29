import { useGameStore } from '@/store/gameStore'

const ROOMS = [
  { key: 'desk', label: '桌面', hotkey: '1' },
  { key: 'shelf', label: '书架', hotkey: '2' },
  { key: 'authors', label: '作者', hotkey: '3' },
  { key: 'office', label: '办公室', hotkey: '4' },
  { key: 'study', label: '书房', hotkey: '5' },
  { key: 'stats', label: '档案', hotkey: '6' },
] as const

export function Minimap() {
  const activeTab = useGameStore(s => s.activeTab)
  const setActiveTab = useGameStore(s => s.setActiveTab)
  return <nav aria-label="出版社房间" className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex border border-[#a9987644] bg-[#14121ae8] px-2 py-1">
    {ROOMS.map(room => <button
      key={room.key}
      onClick={() => setActiveTab(room.key)}
      aria-current={activeTab === room.key ? 'page' : undefined}
      title={`${room.label}（按 ${room.hotkey}）`}
      className={`px-4 py-2 text-xs cursor-pointer whitespace-nowrap focus-visible:outline-2 focus-visible:outline-[#edca86] ${activeTab === room.key ? 'text-[#edca86] border-b border-[#edca86]' : 'text-[#b7aba0] hover:text-[#fff0cd]'}`}
    >{room.label}</button>)}
  </nav>
}