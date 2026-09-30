import { useSyncExternalStore } from 'react'
import { getAudioPrefs, setAudioOn, setAudioVolume, subscribeAudio } from '@/audio/ambience'

/** Ambient sound switch; sits in the corner of every room. */
export function AudioToggle() {
  const { on, volume } = useSyncExternalStore(subscribeAudio, getAudioPrefs)
  return <div className="pixel-audio">
    <button className="px-btn px-btn--wood" onClick={() => setAudioOn(!on)} aria-pressed={on} aria-label={on ? '关闭环境音' : '开启环境音'} title="环境音（雨声、雷声、炉火）">{on ? '🔊' : '🔇'}</button>
    {on && <input type="range" min={0} max={1} step={0.05} value={volume} onChange={e => setAudioVolume(Number(e.target.value))} aria-label="环境音音量" />}
  </div>
}
