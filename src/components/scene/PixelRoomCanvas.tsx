import { useEffect, useRef, useState } from 'react'
import { animateRoom, EMPTY_ROOM, renderRoom } from '@/art/rooms'
import type { RoomKind, RoomState } from '@/art/rooms'
import { HEIGHT, WIDTH } from '@/art/pixels'
import { lightning, WINDOWS } from '@/art/weather'
import { armAudio, setScene, thunder } from '@/audio/ambience'
import { thunderDelay } from '@/audio/mix'
import type { Weather } from '@/core/weather'

const NAMES: Record<RoomKind, string> = { desk: '夜间主编室', office: '出版社办公室', shelf: '藏书阁', authors: '作者接待室', study: '壁炉书房', stats: '出版档案室' }

/** All six scenes are rasterized from code on one 480 × 270 grid. */
export function PixelRoomCanvas({ room, state = {}, animate = true, active = true, weather = 'clear' }: {
  room: RoomKind; state?: Partial<RoomState>; animate?: boolean; active?: boolean; weather?: Weather
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [unavailable, setUnavailable] = useState(false)
  // Weather changes hourly at most; it must not rebuild the cached static layer.
  const weatherRef = useRef(weather)
  useEffect(() => { weatherRef.current = weather }, [weather])
  // Sound follows the room you are standing in; browsers only let it start after a first click or key press.
  useEffect(() => {
    armAudio()
    if (active) setScene({ weather, room, working: (state.working ?? 0) > 0 })
  }, [active, weather, room, state.working])
  const { submitted, working, hasCat, books, authors, departments } = { ...EMPTY_ROOM, ...state }

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
    const base = renderRoom(room, current, false)
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    let tick = 0, last = -Infinity, request = 0, disposed = false
    const dynamic = room === 'desk' || room === 'study' || room in WINDOWS
    let shown = weatherRef.current, since = -Infinity
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
        context.putImageData(pixels.imageData(), 0, 0)
      }
      if (moving) request = requestAnimationFrame(paint)
    }
    const restart = () => { cancelAnimationFrame(request); last = -Infinity; paint(performance.now()) }
    restart()
    reduced.addEventListener('change', restart)
    document.addEventListener('visibilitychange', restart)
    return () => {
      disposed = true
      cancelAnimationFrame(request)
      reduced.removeEventListener('change', restart)
      document.removeEventListener('visibilitychange', restart)
    }
  }, [room, submitted, working, hasCat, books, authors, departments, animate, active])

  return <>
    <canvas ref={canvasRef} width={WIDTH} height={HEIGHT} className="pixel-room-art" role="img" aria-label={NAMES[room]} data-renderer="procedural" />
    {unavailable && <p className="pixel-room-fallback">当前浏览器无法绘制场景，请使用工作台按钮继续。</p>}
  </>
}
