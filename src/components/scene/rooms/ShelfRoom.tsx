import { useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { PixelStage } from '@/components/scene/PixelStage'
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
    <div className="pixel-scene-room relative w-full h-full overflow-hidden bg-[#100f19]">
      <PixelStage room="shelf" state={{ books: published }}>
        <Hotspot
          label={`📚 左侧书架 (${published} 卷已出版)`}
          object="shelfLeft"
          style={{ left: '2%', top: '47%', width: '21%', height: '46%' }}
          onClick={() => setOpenPanel('library')}
        />
        <Hotspot
          label="📚 取书梯旁的书架"
          object="shelfLadder"
          style={{ left: '24%', top: '16%', width: '17%', height: '44%' }}
          onClick={() => setOpenPanel('library')}
        />
        <Hotspot
          label="📚 后排藏书"
          object="shelfBack"
          style={{ left: '60%', top: '15%', width: '23%', height: '30%' }}
          onClick={() => setOpenPanel('library')}
        />
        <Hotspot
          label="📚 右侧书架"
          object="shelfRight"
          style={{ left: '84%', top: '34%', width: '16%', height: '63%' }}
          onClick={() => setOpenPanel('library')}
        />
        <Hotspot
          label={`📕 新书展台 (${published} 卷已出版)`}
          object="display"
          style={{ left: '65%', top: '46%', width: '14%', height: '21%' }}
          onClick={() => setOpenPanel('library')}
        />
        <Hotspot
          label="📖 长桌阅览"
          object="table"
          style={{ left: '39%', top: '64%', width: '34%', height: '25%' }}
          onClick={() => setOpenPanel('library')}
        />
      </PixelStage>
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
