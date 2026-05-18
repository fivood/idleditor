import { useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { ArchiveScene } from '@/assets/scenes/ArchiveScene'
import { Hotspot } from '@/components/scene/Hotspot'
import { ScenePanel } from '@/components/scene/ScenePanel'
import { CorridorDoor } from '@/components/scene/CorridorDoor'
import { StatsView } from '@/components/stats/StatsView'
import { ArchivedLogsView } from '@/components/stats/ArchivedLogsView'

type PanelKey = null | 'ledger' | 'scrolls' | 'logs'

/**
 * 档案室：文件柜墙 + 中央账本桌 + 蜡封卷轴 + 装订日志册。
 *
 * 主交互：
 * - 文件柜 → 出版档案 panel（StatsView）
 * - 中央账本 → 同一面板
 * - 卷轴（右）→ 同一面板（也是数据）
 * - 装订日志（中央账本旁）→ 出版日志档案（按年份翻阅溢出的旧日志）
 */
export function ArchiveRoom() {
  const totalPublished = useGameStore(s => s.totalPublished)
  const archivedYearCount = useGameStore(s => Object.keys(s.archivedLogsByYear ?? {}).length)
  const [openPanel, setOpenPanel] = useState<PanelKey>(null)

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#0a0806]">
      <div className="absolute inset-0">
        <ArchiveScene totalPublished={totalPublished} />
      </div>

      {/* 文件柜墙 */}
      <Hotspot
        label="🗄️ 出版档案柜"
        style={{ left: '4%', top: '6%', width: '50%', height: '72%' }}
        onClick={() => setOpenPanel('ledger')}
      />
      {/* 装订日志册（柜子右侧、紧贴中央桌的旧日志墙） */}
      <Hotspot
        label={`📚 出版日志档案${archivedYearCount > 0 ? `（${archivedYearCount} 卷）` : ''}`}
        style={{ left: '56%', top: '6%', width: '30%', height: '72%' }}
        onClick={() => setOpenPanel('logs')}
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

      {openPanel === 'logs' && (
        <ScenePanel
          variant="journal"
          title="出版日志档案"
          onClose={() => setOpenPanel(null)}
          position="top-12 left-1/2 -translate-x-1/2"
          width={780}
        >
          <ArchivedLogsView />
        </ScenePanel>
      )}

      {(openPanel === 'ledger' || openPanel === 'scrolls') && (
        <ScenePanel
          variant="journal"
          title={openPanel === 'ledger' ? '出版账本' : '蜡封档案'}
          onClose={() => setOpenPanel(null)}
          position="top-12 left-1/2 -translate-x-1/2"
          width={780}
        >
          <div className="max-h-[60vh] overflow-y-auto">
            <StatsView />
          </div>
        </ScenePanel>
      )}
    </div>
  )
}
