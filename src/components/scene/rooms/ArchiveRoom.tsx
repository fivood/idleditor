import { useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { ArchiveScene } from '@/assets/scenes/ArchiveScene'
import { Hotspot } from '@/components/scene/Hotspot'
import { ScenePanel } from '@/components/scene/ScenePanel'
import { CorridorDoor } from '@/components/scene/CorridorDoor'
import { StatsView } from '@/components/stats/StatsView'
import { ArchivedLogsView } from '@/components/stats/ArchivedLogsView'
import { AwardsView } from '@/components/stats/AwardsView'
import { MemoriesView } from '@/components/stats/MemoriesView'

type PanelKey = null | 'ledger' | 'scrolls' | 'logs' | 'awards' | 'memories'

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
  const memoryCount = useGameStore(s => {
    const pools = s.memories ?? { current: [], heirloom: [] }
    return pools.current.length + pools.heirloom.length
  })
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
      {/* 装订日志册 */}
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
      {/* 蜡封卷轴 → 文学奖名录（v2.4 接管此热点） */}
      <Hotspot
        label={`🏆 永夜文学奖${awardCount > 0 ? `（${awardCount} 项）` : ''}`}
        style={{ right: '2%', top: '28%', width: '10%', height: '36%' }}
        onClick={() => setOpenPanel('awards')}
      />
      {/* 记忆碎片柜（v0.11）：放在右下角，靠近主编自己的桌椅位置 */}
      <Hotspot
        label={`🧠 记忆碎片柜${memoryCount > 0 ? `（${memoryCount} 片）` : ''}`}
        style={{ right: '2%', bottom: '8%', width: '10%', height: '20%' }}
        onClick={() => setOpenPanel('memories')}
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

      {openPanel === 'memories' && (
        <ScenePanel
          variant="journal"
          title="记忆碎片柜"
          onClose={() => setOpenPanel(null)}
          position="top-12 left-1/2 -translate-x-1/2"
          width={780}
        >
          <MemoriesView />
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
