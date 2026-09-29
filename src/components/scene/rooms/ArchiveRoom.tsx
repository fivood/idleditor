import { useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { PixelStage } from '@/components/scene/PixelStage'
import { Hotspot } from '@/components/scene/Hotspot'
import { ScenePanel } from '@/components/scene/ScenePanel'
import { CorridorDoor } from '@/components/scene/CorridorDoor'
import { StatsView } from '@/components/stats/StatsView'
import { ArchivedLogsView } from '@/components/stats/ArchivedLogsView'
import { AwardsView } from '@/components/stats/AwardsView'

type PanelKey = null | 'ledger' | 'scrolls' | 'logs' | 'awards'

/**
 * 档案室：文件柜墙 + 中央账本桌 + 蜡封卷轴 + 装订日志册 + 永夜文学奖名录。
 *
 * 主交互：
 * - 文件柜 / 中央账本 / 蜡封档案 → 出版数据（StatsView）
 * - 装订日志 → 出版日志档案（按年份翻阅）
 * - 蜡封卷轴 → 永夜文学奖名录（v2.4 新增）
 */
export function ArchiveRoom() {
  const totalPublished = useGameStore(s => s.totalPublished)
  const archivedYearCount = useGameStore(s => Object.keys(s.archivedLogsByYear ?? {}).length)
  const awardCount = useGameStore(s => (s.awardHistory ?? []).length)
  const [openPanel, setOpenPanel] = useState<PanelKey>(null)

  return (
    <div className="pixel-scene-room relative w-full h-full overflow-hidden bg-[#100f19]">
      <PixelStage room="stats" state={{ books: totalPublished }}>

      {/* 文件柜墙 */}
      <Hotspot
        label="🗄️ 出版档案柜"
        object="cabinet"
        style={{ left: '4%', top: '6%', width: '50%', height: '72%' }}
        onClick={() => setOpenPanel('ledger')}
      />
      {/* 装订日志册 */}
      <Hotspot
        label={`📚 出版日志档案${archivedYearCount > 0 ? `（${archivedYearCount} 卷）` : ''}`}
        object="logs"
        style={{ left: '56%', top: '6%', width: '30%', height: '72%' }}
        onClick={() => setOpenPanel('logs')}
      />
      {/* 中央账本桌 */}
      <Hotspot
        label="📒 翻阅账本"
        object="ledger"
        style={{ left: '30%', top: '70%', width: '40%', height: '18%' }}
        onClick={() => setOpenPanel('ledger')}
      />
      {/* 蜡封卷轴 → 文学奖名录（v2.4 接管此热点） */}
      <Hotspot
        label={`🏆 永夜文学奖${awardCount > 0 ? `（${awardCount} 项）` : ''}`}
        object="awards"
        style={{ right: '2%', top: '28%', width: '10%', height: '36%' }}
        onClick={() => setOpenPanel('awards')}
      />

      </PixelStage>
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

      {openPanel === 'awards' && (
        <ScenePanel
          variant="journal"
          title="永夜文学奖 · 历届名录"
          onClose={() => setOpenPanel(null)}
          position="top-12 left-1/2 -translate-x-1/2"
          width={780}
        >
          <AwardsView />
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
