import { TopBar } from './TopBar'
import { DeskView } from '@/components/desk/DeskView'
import { ShelfView } from '@/components/shelf/ShelfView'
import { AuthorView } from '@/components/author/AuthorView'
import { OfficeView } from '@/components/office/OfficeView'
import { StudyView } from '@/components/study/StudyView'
import { WelcomeView } from './WelcomeView'
import { OfflineReportModal } from './OfflineReportModal'
import { DecisionModal } from './DecisionModal'
import { CountSceneModal } from './CountSceneModal'
import { VictoryModal } from './VictoryModal'
import { useGameStore } from '@/store/gameStore'
import { useGameLoop } from '@/hooks/useGameLoop'
import { useAutoSave } from '@/hooks/useAutoSave'
import { useOfflineProgress } from '@/hooks/useOfflineProgress'
import { useEffect } from 'react'

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

  return (
    <div className="w-full h-dvh flex flex-col bg-cream md:border-2 md:border-border-dark md:shadow-[6px_6px_0_#4a3728] overflow-hidden">
      <TopBar />
      <main className="flex-1 overflow-hidden flex flex-col min-h-0">
        <div hidden={activeTab !== 'desk'} className="flex-1 min-h-0"><DeskView /></div>
        <div hidden={activeTab !== 'shelf'} className="flex-1 min-h-0"><ShelfView /></div>
        <div hidden={activeTab !== 'authors'} className="flex-1 min-h-0"><AuthorView /></div>
        <div hidden={activeTab !== 'office'} className="flex-1 min-h-0"><OfficeView /></div>
        <div hidden={activeTab !== 'study'} className="flex-1 min-h-0"><StudyView /></div>
      </main>
      <nav className="h-11 md:h-12 border-t-2 border-border-dark bg-cream-dark flex items-center shrink-0">
        {[
          ['desk', '桌面'],
          ['shelf', '书架'],
          ['authors', '作者'],
          ['office', '办公室'],
          ['study', '书房'],
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
  )
}
