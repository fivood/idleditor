import { useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { OfficeScene } from '@/assets/scenes/OfficeScene'
import { Hotspot } from '@/components/scene/Hotspot'
import { ScenePanel } from '@/components/scene/ScenePanel'
import { CorridorDoor } from '@/components/scene/CorridorDoor'
import { OfficeView } from '@/components/office/OfficeView'
import type { DepartmentType } from '@/core/types'

type PanelKey = null | 'departments' | 'tearoom' | 'settings'

const DEPT_KEYS: DepartmentType[] = ['editing', 'design', 'marketing', 'rights']
const DEPT_LABELS: Record<DepartmentType, string> = {
  editing: '编辑部',
  design: '设计部',
  marketing: '市场部',
  rights: '版权部',
}

/**
 * 办公室房间：开放式部门工位 + 茶水间 + 走廊枢纽。
 *
 * 是所有房间的连接中心。
 * - 4 部门工位 → 部门升级 panel
 * - 茶水间 → 公关/装修等版税消费 panel
 * - 中央徽标 → 偏好领域 + 黑名单 + 凡间专栏 panel
 * - 左侧门 → 桌面（你的私人办公室）
 * - 右上区 → 档案
 * - 右下区 → 书房
 * - 顶部链接 → 书架 + 作者
 */
export function OfficeRoom() {
  const departments = useGameStore(s => s.departments)
  const [openPanel, setOpenPanel] = useState<PanelKey>(null)
  const activeDepts = [...departments.values()].length

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#0a0806]">
      {/* 场景背景 */}
      <div className="absolute inset-0">
        <OfficeScene activeDepts={activeDepts as 0 | 1 | 2 | 3 | 4} />
      </div>

      {/* ─── 4 部门工位热区（顶部一字排开）─── */}
      {DEPT_KEYS.map((dept, i) => (
        <Hotspot
          key={dept}
          label={DEPT_LABELS[dept] + (Array.from(departments.values()).some(d => d.type === dept) ? ' (已雇佣)' : ' (未雇佣)')}
          style={{ left: `${4.5 + i * 21.7}%`, top: '28%', width: '16%', height: '26%' }}
          onClick={() => setOpenPanel('departments')}
        />
      ))}

      {/* 茶水间热区 */}
      <Hotspot
        label="🍷 茶水间 · 版税消费"
        style={{ right: '2%', bottom: '8%', width: '20%', height: '32%' }}
        onClick={() => setOpenPanel('tearoom')}
      />

      {/* 中央徽标 → 设置 panel */}
      <Hotspot
        label="⚙️ 设置 · 偏好领域 / 凡间专栏 / 黑名单"
        style={{ left: '32%', top: '78%', width: '36%', height: '18%' }}
        onClick={() => setOpenPanel('settings')}
      />

      {/* ─── 6 房间的走廊链接（mini doors on edges）─── */}
      {/* 左门 → 桌面 */}
      <CorridorDoor to="desk" side="left" label="你的办公室" />
      {/* 右门 → 档案 */}
      <CorridorDoor to="stats" side="right" label="档案室" />
      {/* 顶部链接到书架/作者/书房（用小图标按钮）*/}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 flex gap-1.5">
        <RoomLinkBadge to="shelf" icon="📚" label="书架" />
        <RoomLinkBadge to="authors" icon="✒️" label="作者" />
        <RoomLinkBadge to="study" icon="📖" label="书房" />
      </div>

      {/* ─── 弹出面板：临时复用整个 OfficeView 内容 ─── */}
      {/* TODO v2.1: 拆成独立的 DepartmentsPanel / TearoomPanel / SettingsPanel */}
      {(openPanel === 'departments' || openPanel === 'tearoom' || openPanel === 'settings') && (
        <ScenePanel
          title={
            openPanel === 'departments' ? '🏢 部门管理' :
            openPanel === 'tearoom' ? '🍷 版税消费' : '⚙️ 设置'
          }
          onClose={() => setOpenPanel(null)}
          position="top-12 left-1/2 -translate-x-1/2"
          width={680}
        >
          <div className="max-h-[60vh] overflow-y-auto">
            <OfficeView />
          </div>
        </ScenePanel>
      )}
    </div>
  )
}

function RoomLinkBadge({ to, icon, label }: { to: 'shelf' | 'authors' | 'study'; icon: string; label: string }) {
  const setActiveTab = useGameStore(s => s.setActiveTab)
  return (
    <button
      onClick={() => setActiveTab(to)}
      title={label}
      className="bg-[#140e0a]/85 backdrop-blur-sm border-2 border-border-dark px-2.5 py-1 text-sm cursor-pointer hover:bg-[#3d2614] transition-colors font-mono text-[#d4a85a] hover:text-[#f5d878]"
    >
      {icon} {label}
    </button>
  )
}
