import { describe, expect, it } from 'vitest'
import { sceneMix, thunderDelay } from '../mix'
import { armAudio, getAudioPrefs, setAudioOn, setScene, thunder } from '../ambience'

describe('ambience mix', () => {
  it('rain and thunder weather sound like rain; clear nights do not', () => {
    expect(sceneMix({ weather: 'storm', room: 'desk', working: false }).rain).toBeGreaterThan(sceneMix({ weather: 'drizzle', room: 'desk', working: false }).rain)
    expect(sceneMix({ weather: 'clear', room: 'desk', working: false }).rain).toBe(0)
    expect(sceneMix({ weather: 'clear', room: 'desk', working: false }).crickets).toBeGreaterThan(0)
  })
  it('rooms without a window hear the weather through the wall', () => {
    const open = sceneMix({ weather: 'storm', room: 'office', working: false }), wall = sceneMix({ weather: 'storm', room: 'authors', working: false })
    expect(wall.rain).toBeLessThan(open.rain / 2)
    expect(wall.muffle).toBeLessThan(open.muffle)
  })
  it('room sounds belong to their rooms', () => {
    expect(sceneMix({ weather: 'clear', room: 'study', working: false }).fire).toBeGreaterThan(0)
    expect(sceneMix({ weather: 'clear', room: 'desk', working: false }).fire).toBe(0)
    expect(sceneMix({ weather: 'clear', room: 'desk', working: true }).typing).toBeGreaterThan(0)
    expect(sceneMix({ weather: 'clear', room: 'desk', working: false }).typing).toBe(0)
  })
  it('thunder delay is deterministic and within a few seconds', () => {
    expect(thunderDelay(9)).toBe(thunderDelay(9))
    for (let s = 0; s < 50; s++) expect(thunderDelay(s)).toBeGreaterThan(.3)
    for (let s = 0; s < 50; s++) expect(thunderDelay(s)).toBeLessThan(2.6)
  })
})

describe('audio engine without Web Audio', () => {
  it('is a safe no-op and remembers the switch', () => {
    armAudio()
    setScene({ weather: 'storm', room: 'desk', working: true })
    thunder(1)
    setAudioOn(false)
    expect(getAudioPrefs().on).toBe(false)
    setAudioOn(true)
    expect(getAudioPrefs().on).toBe(true)
  })
})
