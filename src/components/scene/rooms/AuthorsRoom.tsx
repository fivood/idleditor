import { useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { PixelStage } from '@/components/scene/PixelStage'
import { Hotspot } from '@/components/scene/Hotspot'
import { ScenePanel } from '@/components/scene/ScenePanel'
import { CorridorDoor } from '@/components/scene/CorridorDoor'
import { AuthorView } from '@/components/author/AuthorView'

type PanelKey = null | 'roster'

/**
 * 作者接待室：圆桌 + 肖像墙 + 烛台。
 *
 * 主交互：点击肖像墙 / 圆桌 → 作者名册 panel
 */
export function AuthorsRoom() {
  const authors = useGameStore(s => s.authors)
  const [openPanel, setOpenPanel] = useState<PanelKey>(null)
  const signed = [...authors.values()].filter(a => a.tier !== 'new' && !a.terminated && !a.poached).length

  return (
    <div className="pixel-scene-room relative w-full h-full overflow-hidden bg-[#100f19]">
      <PixelStage room="authors" state={{ authors: signed }}>

      {/* 肖像墙（后墙 4 幅）→ 作者面板 */}
      <Hotspot
        label={`✒️ 肖像墙 · ${signed} 位签约作家`}
        style={{ left: '8%', top: '18%', width: '84%', height: '32%' }}
        onClick={() => setOpenPanel('roster')}
      />
      {/* 圆桌 → 作者面板（同一入口）*/}
      <Hotspot
        label="🪑 圆桌会议（接待作者）"
        style={{ left: '36%', top: '64%', width: '28%', height: '18%' }}
        onClick={() => setOpenPanel('roster')}
      />

      </PixelStage>
      <CorridorDoor to="office" side="left" label="通往走廊" />

      {openPanel === 'roster' && (
        <ScenePanel
          variant="scroll"
          title={`作家名册 · ${signed} 位签约`}
          onClose={() => setOpenPanel(null)}
          position="top-12 left-1/2 -translate-x-1/2"
          width={720}
        >
          <div className="max-h-[60vh] overflow-y-auto">
            <AuthorView />
          </div>
        </ScenePanel>
      )}
    </div>
  )
}
