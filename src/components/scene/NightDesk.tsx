import { useState } from 'react'
import type { CSSProperties } from 'react'
import { DESK_OBJECTS } from '@/art/rooms'
import { PixelStage } from './PixelStage'
import './night-desk.css'

export type DeskPanel = 'submissions' | 'pipeline' | 'log' | 'cat' | 'solicit' | 'dream'

interface NightDeskProps {
  submitted: number
  working: number
  catName: string | null
  activePanel: DeskPanel | null
  onSelect: (panel: DeskPanel) => void

}

export function NightDesk({ submitted, working, catName, activePanel, onSelect }: NightDeskProps) {
  const [showHints, setShowHints] = useState(false)
  const [motion, setMotion] = useState(true)
  const objects = DESK_OBJECTS.filter(object => object.key !== 'cat' || catName !== null)
  const label = (key: DeskPanel, text: string) => key === 'submissions' ? `${text} · ${submitted}`
    : key === 'pipeline' ? `${text} · ${working}` : key === 'cat' ? catName || '黑猫' : text

  return (
    <div className={`night-desk ${showHints ? 'night-desk--hints' : ''}`}>
      <PixelStage room="desk" state={{ submitted, working, hasCat: catName !== null }} animate={motion}>
          {objects.map(object => <button
            key={object.key}
            className="night-desk-object"
            style={{ left: `${object.x / 4.8}%`, top: `${object.y / 2.7}%`, width: `${object.w / 4.8}%`, height: `${object.h / 2.7}%` } as CSSProperties}
            aria-label={label(object.key, object.label)}
            aria-pressed={activePanel === object.key}
            onClick={() => onSelect(object.key)}
          ><span>{label(object.key, object.label)}</span><b aria-hidden="true">+</b></button>)}
      </PixelStage>
      <div className="night-desk-heading">
        <span>ETERNAL NIGHT · EDITOR'S ROOM</span>
        <h2>雨落在第两百一十七年的窗前</h2>
        <p>{submitted ? `${submitted} 份来稿等你拆阅` : '暂时没有新来稿，夜还很长。'}<span> · </span>{working ? `${working} 本书正在诞生` : '灯亮着，故事就还没结束。'}</p>
      </div>
      <div className="night-desk-controls" aria-label="场景设置">
        <button onClick={() => setShowHints(value => !value)} aria-pressed={showHints}>物件提示 {showHints ? '开' : '关'}</button>
        <button onClick={() => setMotion(value => !value)} aria-pressed={motion}>动态效果 {motion ? '开' : '关'}</button>
      </div>
      <nav className="night-desk-actions" aria-label="工作台操作">
        {objects.map(object => <button key={object.key} onClick={() => onSelect(object.key)} aria-pressed={activePanel === object.key}>
          {object.label}{object.key === 'submissions' && <small>{submitted}</small>}{object.key === 'pipeline' && <small>{working}</small>}
        </button>)}
      </nav>
    </div>
  )
}
