import { useCallback, useEffect, useRef, useState } from 'react'
import type { MouseEvent, PointerEvent, ReactNode } from 'react'
import { pixelLayout } from '@/art/layout'
import { CORE, objectAt } from '@/art/rooms'
import { useGameStore } from '@/store/gameStore'
import { PixelRoomCanvas } from './PixelRoomCanvas'
import { AudioToggle } from './AudioToggle'
import { weatherFor } from '@/core/weather'
import type { Frame, ObjectKey, RoomKind, RoomState } from '@/art/rooms'
import './pixel-stage.css'

/**
 * Art and hit targets use the same coordinate system and physical-pixel scale.
 * The stage is the 960×540 core room (percentage hotspots live here); the canvas extends past it to fill the screen.
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
  const [frame, setFrame] = useState<Frame>(CORE)
  useEffect(() => {
    const root = rootRef.current, stage = stageRef.current
    if (!root || !stage) return
    let timer = 0
    const apply = () => {
      const { width, height } = root.getBoundingClientRect()
      if (!width || !height) return
      const layout = pixelLayout(width, height, window.devicePixelRatio || 1, window.innerWidth < 768)
      for (const key of ['width', 'height', 'left', 'top'] as const) stage.style[key] = `${layout.stage[key]}px`
      stage.style.setProperty('--canvas-left', `${layout.canvas.left - layout.stage.left}px`)
      stage.style.setProperty('--canvas-top', `${layout.canvas.top - layout.stage.top}px`)
      stage.style.setProperty('--canvas-width', `${layout.canvas.width}px`)
      stage.style.setProperty('--canvas-height', `${layout.canvas.height}px`)
      stage.dataset.pixelScale = String(layout.scale)
      setFrame(prev => prev.width === layout.frame.width && prev.height === layout.frame.height && prev.ox === layout.frame.ox && prev.oy === layout.frame.oy ? prev : layout.frame)
    }
    // Re-rasterising the room is not free; settle the size before redrawing.
    const resize = () => { window.clearTimeout(timer); timer = window.setTimeout(apply, 90) }
    const observer = new ResizeObserver(resize)
    observer.observe(root)
    window.addEventListener('resize', resize)
    apply()
    return () => { window.clearTimeout(timer); observer.disconnect(); window.removeEventListener('resize', resize) }
  }, [])

  const button = (key: ObjectKey) => stageRef.current?.querySelector<HTMLElement>(`[data-object="${key}"]`) ?? null
  const pick = (e: { clientX: number; clientY: number }) => {
    const canvas = stageRef.current?.querySelector('canvas'), tags = tagsRef.current
    if (!canvas || !tags) return null
    const r = canvas.getBoundingClientRect()
    const key = objectAt(tags, canvas.width, Math.floor((e.clientX - r.left) / r.width * canvas.width), Math.floor((e.clientY - r.top) / r.height * canvas.height))
    return key && button(key) ? key : null
  }
  // Label and cursor follow the hovered shape.
  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    stage.querySelectorAll<HTMLElement>('[data-object]').forEach(el => { el.toggleAttribute('data-hot', el.dataset.object === hover) })
    rootRef.current!.style.cursor = hover ? 'pointer' : ''
  }, [hover])
  const onTags = useCallback((tags: Uint8Array) => { tagsRef.current = tags }, [])

  return <div
    className="pixel-room-viewport"
    ref={rootRef}
    onPointerMove={(e: PointerEvent) => { if (e.pointerType === 'mouse') setHover(pick(e)) }}
    onPointerLeave={() => setHover(null)}
    onClick={(e: MouseEvent) => {
      if ((e.target as Element).closest('button, a, input, [role=dialog]')) return
      const key = pick(e)
      if (key) button(key)?.click()
    }}
  >
    <AudioToggle />
    <div
      className="pixel-room-stage"
      ref={stageRef}
      onFocusCapture={e => { const key = (e.target as HTMLElement).dataset?.object as ObjectKey | undefined; if (key) setHover(key) }}
      onBlurCapture={() => setHover(null)}
    >
      <PixelRoomCanvas room={room} state={state} animate={animate} active={active} weather={weather} hover={hover} onTags={onTags} frame={frame} />
      {children}
    </div>
  </div>
}
