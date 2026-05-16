import { TopBar } from './TopBar'
import { DeskRoom } from '@/components/scene/rooms/DeskRoom'
import { OfficeRoom } from '@/components/scene/rooms/OfficeRoom'
import { ShelfView } from '@/components/shelf/ShelfView'
import { AuthorView } from '@/components/author/AuthorView'
import { StudyView } from '@/components/study/StudyView'
import { StatsView } from '@/components/stats/StatsView'
import { WelcomeView } from './WelcomeView'
import { OfflineReportModal } from './OfflineReportModal'
import { DecisionModal } from './DecisionModal'
import { CountSceneModal } from './CountSceneModal'
import { VictoryModal } from './VictoryModal'
import { Minimap } from '@/components/scene/Minimap'
import { useGameStore } from '@/store/gameStore'
import { useGameLoop } from '@/hooks/useGameLoop'
import { useAutoSave } from '@/hooks/useAutoSave'
import { useOfflineProgress } from '@/hooks/useOfflineProgress'
import { useRoomNav } from '@/hooks/useRoomNav'
import { useEffect } from 'react'

// 哪些 Tab 已经升级为"房间"（沉浸式场景视图）。
// 其他 Tab 在桌面端使用旧的卡片视图（在 Minimap 跳转后包裹在简易容器里），
// 在移动端使用底部 Tab 栏切换。
const SCENE_ROOMS = new Set(['desk', 'office'])

export function Shell() {
  const isInitialized = useGameStore(s => s.isInitialized)
  const initialize = useGameStore(s => s.initialize)
  const playerName = useGameStore(s => s.playerName)
  const activeTab = useGameStore(s => s.activeTab)
  const pendingDecision = useGameStore(s => s.pendingDecision)
  const activeCountScene = useGameStore(s => s.activeCountScene)
  const countEnding = useGameStore(s => s.countEnding)
  const onCountSceneChoice = useGameStore(s => s.onCountSceneChoice)
  const onCountGenderChoice = useGameStore(s => s.onCountGenderChoice)
  const dismissEnding = useGameStore(s => s.dismissEnding)
  const setActiveTab = useGameStore(s => s.setActiveTab)

  useEffect(() => {
    initialize()
  }, [initialize])

  useGameLoop()
  useAutoSave()
  useRoomNav() // 1-6 键切换房间，Esc 回办公室
  const { showReport, offlineTicks, earned, events, checkOfflineProgress, dismiss } = useOfflineProgress()

  // Check offline progress when initialized
  useEffect(() => {
    if (isInitialized && playerName) {
      checkOfflineProgress()
    }
  }, [isInitialized, playerName, checkOfflineProgress])

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-dvh bg-cream">
        <p className="text-muted text-xs sm:text-sm font-mono">出版社正在准备中……</p>
      </div>
    )
  }

  if (!playerName) {
    return <WelcomeView />
  }

  const isInSceneRoom = SCENE_ROOMS.has(activeTab)

  return (
    <div className="w-full h-dvh overflow-hidden bg-[#1a1410] md:p-2 lg:p-4">
      <div className="w-full h-full flex flex-col bg-cream md:border-2 md:border-border-dark md:shadow-[6px_6px_0_#4a3728] overflow-hidden relative">
        <TopBar />
        <main className="flex-1 overflow-hidden flex flex-col min-h-0 relative">
          {/* 场景化房间 */}
          <div hidden={activeTab !== 'desk'} className="flex-1 min-h-0"><DeskRoom /></div>
          <div hidden={activeTab !== 'office'} className="flex-1 min-h-0"><OfficeRoom /></div>
          {/* 未场景化的 Tab（沿用旧布局，外层加 cream 背景以与场景房间区分）*/}
          <div hidden={activeTab !== 'shelf'} className="flex-1 min-h-0 bg-cream"><ShelfView /></div>
          <div hidden={activeTab !== 'authors'} className="flex-1 min-h-0 bg-cream"><AuthorView /></div>
          <div hidden={activeTab !== 'study'} className="flex-1 min-h-0 bg-cream"><StudyView /></div>
          <div hidden={activeTab !== 'stats'} className="flex-1 min-h-0 bg-cream"><StatsView /></div>

          {/* 桌面端：场景房间内显示 minimap 浮在左下角；非场景房间不显示（用底部 Tab） */}
          {isInSceneRoom && (
            <div className="hidden md:block">
              <Minimap />
            </div>
          )}
        </main>

        {/* 移动端始终显示 Tab 栏；桌面端只有在非场景房间时显示 */}
        <nav className={`h-11 md:h-12 border-t-2 border-border-dark bg-cream-dark items-center shrink-0 flex ${
          isInSceneRoom ? 'md:hidden' : ''
        }`}>
          {[
            ['desk', '桌面'],
            ['shelf', '书架'],
            ['authors', '作者'],
            ['office', '办公室'],
            ['study', '书房'],
            ['stats', '档案'],
          ].map(([tab, label]) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as typeof activeTab)}
              className={`flex-1 h-full text-[13px] md:text-xs font-medium transition-all cursor-pointer border-r-2 border-border-dark last:border-r-0 ${
                activeTab === tab
                  ? 'bg-copper text-white border-b-0'
                  : 'bg-cream-dark text-ink-light hover:bg-cream'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>

        {showReport && (
          <OfflineReportModal
            offlineTicks={offlineTicks}
            earned={earned}
            events={events}
            onDismiss={dismiss}
          />
        )}

        {pendingDecision && <DecisionModal decision={pendingDecision} />}

        {activeCountScene && (
          <CountSceneModal
            scene={activeCountScene}
            onChoose={onCountSceneChoice}
            showGenderChoice={activeCountScene.rebirth === -1}
            onChooseGender={onCountGenderChoice}
          />
        )}

        {countEnding && (
          <VictoryModal ending={countEnding} onDismiss={dismissEnding} />
        )}
      </div>
    </div>
  )
}
