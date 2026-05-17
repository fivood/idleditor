import { useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { ArchiveScene } from '@/assets/scenes/ArchiveScene'
import { Hotspot } from '@/components/scene/Hotspot'
import { ScenePanel } from '@/components/scene/ScenePanel'
import { CorridorDoor } from '@/components/scene/CorridorDoor'
import { StatsView } from '@/components/stats/StatsView'

type PanelKey = null | 'ledger' | 'scrolls'

/**
 * 档案室：文件柜墙 + 中央账本桌 + 蜡封卷轴。
 *
 * 主交互：
 * - 文件柜 → 出版档案 panel（StatsView）
 * - 中央账本 → 同一面板
 * - 卷轴（右）→ 同一面板（也是数据）
 */
export function ArchiveRoom() {
  const totalPublished = useGameStore(s => s.totalPublished)
  const [openPanel, setOpenPanel] = useState<PanelKey>(null)

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#0a0806]">
      <div className="absolute inset-0">
        <ArchiveScene totalPublished={totalPublished} />
      </div>

      {/* 文件柜墙 */}
      <Hotspot
        label="🗄️ 出版档案柜"
        style={{ left: '4%', top: '6%', width: '82%', height: '72%' }}
        onClick={() => setOpenPanel('ledger')}
      />
      {/* 中央账本桌 */}
      <Hotspot
        label="📒 翻阅账本"
        style={{ left: '30%', top: '70%', width: '40%', height: '18%' }}
        onClick={() => setOpenPanel('ledger')}
      />
      {/* 蜡封卷轴 */}
      <Hotspot
        label="📜 蜡封档案"
        style={{ right: '2%', top: '28%', width: '10%', height: '36%' }}
        onClick={() => setOpenPanel('scrolls')}
      />

      <CorridorDoor to="office" side="left" label="通往走廊" />

      {(openPanel === 'ledger' || openPanel === 'scrolls') && (
        <ScenePanel
          variant="journal"
          title={openPanel === 'ledger' ? '出版账本' : '蜡封档案'}
          onClose={() => setOpenPanel(null)}
          position="top-12 left-1/2 -translate-x-1/2"
          width={720}
        >
          <div className="max-h-[60vh] overflow-y-auto">
            <StatsView />
          </div>
        </ScenePanel>
      )}
    </div>
  )
}
