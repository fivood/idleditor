import { act, cleanup, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PixelRoomCanvas } from '../PixelRoomCanvas'

const put = vi.fn()
const request = vi.fn(() => 1)
const cancel = vi.fn()
const mediaListeners = new Set<() => void>()
let reduced = false

beforeEach(() => {
  vi.clearAllMocks()
  reduced = false
  mediaListeners.clear()
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ imageSmoothingEnabled: true, putImageData: put } as unknown as CanvasRenderingContext2D)
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(false)
  vi.stubGlobal('requestAnimationFrame', request)
  vi.stubGlobal('cancelAnimationFrame', cancel)
  vi.stubGlobal('ImageData', class {
    data: Uint8ClampedArray
    width: number
    height: number
    constructor(width: number, height: number) { this.width = width; this.height = height; this.data = new Uint8ClampedArray(width * height * 4) }
  })
  vi.stubGlobal('matchMedia', () => ({
    get matches() { return reduced },
    addEventListener: (_: string, listener: () => void) => mediaListeners.add(listener),
    removeEventListener: (_: string, listener: () => void) => mediaListeners.delete(listener),
  }))
})
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals() })

describe('pixel scene lifecycle', () => {
  it('updates game state while animation is disabled', () => {
    const view = render(<PixelRoomCanvas room="desk" animate={false} state={{ submitted: 0 }} />)
    const first = put.mock.calls.at(-1)![0].data.slice()
    view.rerender(<PixelRoomCanvas room="desk" animate={false} state={{ submitted: 8 }} />)
    expect(put.mock.calls.at(-1)![0].data).not.toEqual(first)
    expect(request).not.toHaveBeenCalled()
  })
  it('stops scheduling frames when hidden or reduced motion is requested', () => {
    render(<PixelRoomCanvas room="desk" />)
    expect(request).toHaveBeenCalledOnce()
    request.mockClear()
    reduced = true
    act(() => mediaListeners.forEach(listener => listener()))
    expect(request).not.toHaveBeenCalled()
    reduced = false
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(true)
    act(() => document.dispatchEvent(new Event('visibilitychange')))
    expect(request).not.toHaveBeenCalled()
  })
  it('does no rendering for a hidden room and releases animation on unmount', () => {
    const view = render(<PixelRoomCanvas room="desk" active={false} />)
    expect(put).not.toHaveBeenCalled()
    view.rerender(<PixelRoomCanvas room="desk" active />)
    expect(put).toHaveBeenCalledOnce()
    view.unmount()
    expect(cancel).toHaveBeenCalledWith(1)
    expect(mediaListeners.size).toBe(0)
  })
  it('renders a static room once without starting a needless animation loop', () => {
    render(<PixelRoomCanvas room="shelf" />)
    expect(put).toHaveBeenCalledOnce()
    expect(request).not.toHaveBeenCalled()
  })
})
