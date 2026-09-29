import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { pixelLayout } from '@/art/layout'
import { useGameStore } from '@/store/gameStore'
import { PixelRoomCanvas } from './PixelRoomCanvas'
import type { RoomKind, RoomState } from '@/art/rooms'
import './pixel-stage.css'

/** Art and hit targets use the same coordinate system and physical-pixel scale. */
export function PixelStage({ room, state, animate = true, children }: {
  room: RoomKind; state?: Partial<RoomState>; animate?: boolean; children?: ReactNode
}) {
  const active = useGameStore(s => s.activeTab === room)
  const rootRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const root = rootRef.current, stage = stageRef.current
    if (!root || !stage) return
    const resize = () => {
      const { width, height } = root.getBoundingClientRect()
      if (!width || !height) return
      const layout = pixelLayout(width, height, window.devicePixelRatio || 1, window.innerWidth < 768)
      for (const key of ['width', 'height', 'left', 'top'] as const) stage.style[key] = `${layout[key]}px`
      stage.dataset.pixelScale = String(layout.scale)
    }
    const observer = new ResizeObserver(resize)
    observer.observe(root)
    window.addEventListener('resize', resize)
    resize()
    return () => { observer.disconnect(); window.removeEventListener('resize', resize) }
  }, [])
  return <div className="pixel-room-viewport" ref={rootRef}>
    <div className="pixel-room-stage" ref={stageRef}>
      <PixelRoomCanvas room={room} state={state} animate={animate} active={active} />
      {children}
    </div>
  </div>
}
