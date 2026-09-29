import { useEffect, useRef, useState } from 'react'
import { animateRoom, CORE, EMPTY_ROOM, OBJECTS, renderRoom } from '@/art/rooms'
import type { Frame, ObjectKey, RoomKind, RoomState } from '@/art/rooms'
import { packColor } from '@/art/pixels'
import { silhouette } from '@/art/outline'
import { lightning, WINDOWS } from '@/art/weather'
import { armAudio, setScene, thunder } from '@/audio/ambience'
import { thunderDelay } from '@/audio/mix'
import type { Weather } from '@/core/weather'

const NAMES: Record<RoomKind, string> = { desk: '夜间主编室', office: '出版社办公室', shelf: '藏书阁', authors: '作者接待室', study: '壁炉书房', stats: '出版档案室' }
const RING_LIGHT = packColor('#f5d878'), RING_DARK = packColor('#120e14')

/** All six scenes are rasterized from code; layout on a 480×270 grid, pixels at 960×540, extended to fill the frame. */
export function PixelRoomCanvas({ room, state = {}, animate = true, active = true, weather = 'clear', hover = null, onTags, frame = CORE }: {
  room: RoomKind; state?: Partial<RoomState>; animate?: boolean; active?: boolean; weather?: Weather
  /** Object to outline along its silhouette. */
  hover?: ObjectKey | null
  /** Receives the object-per-pixel map whenever the static layer is rebuilt. */
  onTags?: (tags: Uint8Array) => void
  /** Canvas size and where the core room sits on it. */
  frame?: Frame
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [unavailable, setUnavailable] = useState(false)
  // Weather changes hourly at most; it must not rebuild the cached static layer.
  const weatherRef = useRef(weather)
  useEffect(() => { weatherRef.current = weather }, [weather])
  const hoverRef = useRef(hover), repaintRef = useRef<(() => void) | null>(null), onTagsRef = useRef(onTags)
  useEffect(() => { onTagsRef.current = onTags }, [onTags])
  useEffect(() => { hoverRef.current = hover; repaintRef.current?.() }, [hover])
  // Sound follows the room you are standing in; browsers only let it start after a first click or key press.
  useEffect(() => {
    armAudio()
    if (active) setScene({ weather, room, working: (state.working ?? 0) > 0 })
  }, [active, weather, room, state.working])
  const { submitted, working, hasCat, books, authors, departments } = { ...EMPTY_ROOM, ...state }
  const { width, height, ox, oy } = frame

  useEffect(() => {
    if (!active) return
    const context = canvasRef.current?.getContext('2d', { alpha: false })
    if (!context) {
      // Deferred notification avoids a synchronous effect state update.
      const timer = window.setTimeout(() => setUnavailable(true), 0)
      return () => window.clearTimeout(timer)
    }
    context.imageSmoothingEnabled = false
    const current = { submitted, working, hasCat, books, authors, departments }
    const base = renderRoom(room, current, false, { width, height, ox, oy })
    if (base.tags) onTagsRef.current?.(base.tags)
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    let tick = 0, last = -Infinity, request = 0, disposed = false
    const dynamic = room === 'desk' || room === 'study' || room in WINDOWS
    let shown = weatherRef.current, since = -Infinity
    let traced: ObjectKey | null = null, ring = { inner: new Int32Array(0), outer: new Int32Array(0) }
    const paint = (now: number) => {
      if (disposed) return
      const moving = animate && dynamic && !reduced.matches && !document.hidden
      if (now - last >= 100 || !moving) {
        last = now
        // The still frame also contains fire. Disabling animation never extinguishes it.
        if (weatherRef.current !== shown) { shown = weatherRef.current; since = tick } // new weather fades in over 3 s
        const frame = moving ? tick++ : 0
        if (moving && shown === 'storm' && room in WINDOWS && frame % 14 === 0) {
          const flash = lightning(frame)
          if (flash.level === 2) thunder(thunderDelay(flash.slot))
        }
        const pixels = animateRoom(base, room, current, frame, shown, Math.min(1, (tick - since) / 30))
        if (hoverRef.current !== traced) {
          traced = hoverRef.current
          ring = traced && base.tags ? silhouette(base.tags, OBJECTS.indexOf(traced) + 1, base.width, base.height) : { inner: new Int32Array(0), outer: new Int32Array(0) }
        }
        for (const i of ring.outer) pixels.data[i] = RING_DARK
        for (const i of ring.inner) pixels.data[i] = RING_LIGHT
        context.putImageData(pixels.imageData(), 0, 0)
      }
      if (moving) request = requestAnimationFrame(paint)
    }
    const restart = () => { cancelAnimationFrame(request); last = -Infinity; paint(performance.now()) }
    repaintRef.current = restart
    restart()
    reduced.addEventListener('change', restart)
    document.addEventListener('visibilitychange', restart)
    return () => {
      disposed = true
      repaintRef.current = null
      cancelAnimationFrame(request)
      reduced.removeEventListener('change', restart)
      document.removeEventListener('visibilitychange', restart)
    }
  }, [room, submitted, working, hasCat, books, authors, departments, animate, active, width, height, ox, oy])

  return <>
    <canvas ref={canvasRef} width={width} height={height} className="pixel-room-art" role="img" aria-label={NAMES[room]} data-renderer="procedural" />
    {unavailable && <p className="pixel-room-fallback">当前浏览器无法绘制场景，请使用工作台按钮继续。</p>}
  </>
}
