import { useGameStore } from '@/store/gameStore'

interface CorridorDoorProps {
  to: 'desk' | 'shelf' | 'authors' | 'office' | 'study' | 'stats'
  side?: 'right' | 'left'
  label: string
}

export function CorridorDoor({ to, side = 'right', label }: CorridorDoorProps) {
  const setActiveTab = useGameStore(s => s.setActiveTab)
  return <button
    onClick={() => setActiveTab(to)}
    aria-label={label}
    title={label}
    className={`px-btn px-btn--wood group absolute top-1/2 -translate-y-1/2 z-30 p-1 ${side === 'left' ? 'left-2' : 'right-2'}`}
  >
    <svg viewBox="0 0 16 16" width="28" height="28" shapeRendering="crispEdges" aria-hidden="true" style={{ transform: side === 'left' ? 'scaleX(-1)' : undefined }}>
      <path fill="currentColor" d="M8 2h2v2h2v2h2v4h-2v2h-2v2H8v-4H2V6h6z" />
    </svg>
    <span className="px-plaque absolute bottom-full mb-2 right-0 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 px-1.5 text-xs whitespace-nowrap pointer-events-none">{label}</span>
  </button>
}