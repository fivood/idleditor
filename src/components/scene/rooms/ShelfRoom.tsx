import { useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { ShelfScene } from '@/assets/scenes/ShelfScene'
import { Hotspot } from '@/components/scene/Hotspot'
import { ScenePanel } from '@/components/scene/ScenePanel'
import { CorridorDoor } from '@/components/scene/CorridorDoor'
import { ShelfView } from '@/components/shelf/ShelfView'

type PanelKey = null | 'library'

/**
 * 书架房间：永夜出版社的藏书阁。
 *
 * 主要交互：点击书墙 → 浏览已出版藏书 panel
 * 走廊门：左侧通办公室
 */
export function ShelfRoom() {
  const manuscripts = useGameStore(s => s.manuscripts)
  const [openPanel, setOpenPanel] = useState<PanelKey>(null)
  const published = [...manuscripts.values()].filter(m => m.status === 'published').length

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#0a0806]">
      <div className="absolute inset-0">
        <ShelfScene bookCount={published} />
      </div>

      {/* 左书架 → 藏书清单 */}
      <Hotspot
        label={`📚 藏书阁 (${published} 卷已出版)`}
        style={{ left: '2%', top: '20%', width: '28%', height: '65%' }}
        onClick={() => setOpenPanel('library')}
      />
      {/* 右书架 → 同一 panel（也算"藏书"区域）*/}
      <Hotspot
        label={`📚 藏书阁 (${published} 卷已出版)`}
        style={{ right: '2%', top: '20%', width: '28%', height: '65%' }}
        onClick={() => setOpenPanel('library')}
      />
      {/* 阅读桌（中央前景）也开同一面板 */}
      <Hotspot
        label="📖 翻阅藏书"
        style={{ left: '38%', top: '76%', width: '24%', height: '12%' }}
        onClick={() => setOpenPanel('library')}
      />

      <CorridorDoor to="office" side="left" label="通往走廊" />

      {openPanel === 'library' && (
        <ScenePanel
          variant="journal"
          title={`藏书阁 · ${published} 卷已出版`}
          onClose={() => setOpenPanel(null)}
          position="top-12 left-1/2 -translate-x-1/2"
          width={720}
        >
          <div className="max-h-[60vh] overflow-y-auto">
            <ShelfView />
          </div>
        </ScenePanel>
      )}
    </div>
  )
}
