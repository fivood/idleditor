import { useCallback, useEffect, useRef, useState } from 'react'
import type { MouseEvent, PointerEvent, ReactNode } from 'react'
import { pixelLayout } from '@/art/layout'
import { HEIGHT, WIDTH } from '@/art/pixels'
import { objectAt } from '@/art/rooms'
import { useGameStore } from '@/store/gameStore'
import { PixelRoomCanvas } from './PixelRoomCanvas'
import { AudioToggle } from './AudioToggle'
import { weatherFor } from '@/core/weather'
import type { ObjectKey, RoomKind, RoomState } from '@/art/rooms'
import './pixel-stage.css'

/**
 * Art and hit targets use the same coordinate system and physical-pixel scale.
 * Children marked `data-object` are hit-tested against the drawn silhouette, not their box:
 * hovering outlines the object's real shape and a click anywhere on it presses the button.
 */
export function PixelStage({ room, state, animate = true, children }: {
  room: RoomKind; state?: Partial<RoomState>; animate?: boolean; children?: ReactNode
}) {
  const active = useGameStore(s => s.activeTab === room)
  const weather = useGameStore(s => weatherFor(s.calendar.totalDays))
  const rootRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const tagsRef = useRef<Uint8Array | null>(null)
  const [hover, setHover] = useState<ObjectKey | null>(null)
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

  const button = (key: ObjectKey) => stageRef.current?.querySelector<HTMLElement>(`[data-object="${key}"]`) ?? null
  const pick = (e: { clientX: number; clientY: number }) => {
    const stage = stageRef.current, tags = tagsRef.current
    if (!stage || !tags) return null
    const r = stage.getBoundingClientRect()
    const key = objectAt(tags, Math.floor((e.clientX - r.left) / r.width * WIDTH), Math.floor((e.clientY - r.top) / r.height * HEIGHT))
    return key && button(key) ? key : null
  }
  // Label and cursor follow the hovered shape.
  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    stage.querySelectorAll<HTMLElement>('[data-object]').forEach(el => { el.toggleAttribute('data-hot', el.dataset.object === hover) })
    stage.style.cursor = hover ? 'pointer' : ''
  }, [hover])
  const onTags = useCallback((tags: Uint8Array) => { tagsRef.current = tags }, [])

  return <div className="pixel-room-viewport" ref={rootRef}>
    <AudioToggle />
    <div
      className="pixel-room-stage"
      ref={stageRef}
      onPointerMove={(e: PointerEvent) => { if (e.pointerType === 'mouse') setHover(pick(e)) }}
      onPointerLeave={() => setHover(null)}
      onClick={(e: MouseEvent) => {
        if ((e.target as Element).closest('button, a, input')) return
        const key = pick(e)
        if (key) button(key)?.click()
      }}
      onFocusCapture={e => { const key = (e.target as HTMLElement).dataset?.object as ObjectKey | undefined; if (key) setHover(key) }}
      onBlurCapture={() => setHover(null)}
    >
      <PixelRoomCanvas room={room} state={state} animate={animate} active={active} weather={weather} hover={hover} onTags={onTags} />
      {children}
    </div>
  </div>
}
