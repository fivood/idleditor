import { useState } from 'react'
import { PixelStage } from '@/components/scene/PixelStage'
import { Hotspot } from '@/components/scene/Hotspot'
import { ScenePanel } from '@/components/scene/ScenePanel'
import { CorridorDoor } from '@/components/scene/CorridorDoor'
import { StudyView } from '@/components/study/StudyView'

type PanelKey = null | 'library'

/**
 * 书房：壁炉 + 扶手椅 + 个人书架 + 落地灯 + 雨窗。
 *
 * 主交互：点击书架 / 扶手椅 → 你的私人书房 panel（上传/阅读个人书籍）
 */
export function StudyRoom() {
  const [openPanel, setOpenPanel] = useState<PanelKey>(null)

  return (
    <div className="pixel-scene-room relative w-full h-full overflow-hidden bg-[#100f19]">
      <PixelStage room="study" >

      {/* 个人书架（右侧） */}
      <Hotspot
        label="📖 你的藏书"
        style={{ right: '2%', top: '46%', width: '24%', height: '42%' }}
        onClick={() => setOpenPanel('library')}
      />
      {/* 扶手椅 */}
      <Hotspot
        label="🛋️ 阅读椅"
        style={{ left: '14%', top: '54%', width: '20%', height: '36%' }}
        onClick={() => setOpenPanel('library')}
      />
      {/* 壁炉 → 同一面板（暖意） */}
      <Hotspot
        label="🔥 壁炉边"
        style={{ left: '38%', top: '8%', width: '24%', height: '62%' }}
        onClick={() => setOpenPanel('library')}
      />

      </PixelStage>
      <CorridorDoor to="office" side="left" label="通往走廊" />

      {openPanel === 'library' && (
        <ScenePanel
          variant="journal"
          title="你的私人书房"
          onClose={() => setOpenPanel(null)}
          position="top-12 left-1/2 -translate-x-1/2"
          width={720}
        >
          <div className="max-h-[60vh] overflow-y-auto">
            <StudyView />
          </div>
        </ScenePanel>
      )}
    </div>
  )
}
