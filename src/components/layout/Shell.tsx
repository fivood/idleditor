import { TopBar } from './TopBar'
import { DeskView } from '@/components/desk/DeskView'
import { ShelfView } from '@/components/shelf/ShelfView'
import { AuthorView } from '@/components/author/AuthorView'
import { OfficeView } from '@/components/office/OfficeView'
import { WelcomeView } from './WelcomeView'
import { useGameStore } from '@/store/gameStore'
import { useGameLoop } from '@/hooks/useGameLoop'
import { useAutoSave } from '@/hooks/useAutoSave'
import { useEffect } from 'react'

export function Shell() {
  const isInitialized = useGameStore(s => s.isInitialized)
  const initialize = useGameStore(s => s.initialize)
  const playerName = useGameStore(s => s.playerName)
  const activeTab = useGameStore(s => s.activeTab)
  const setActiveTab = useGameStore(s => s.setActiveTab)

  useEffect(() => {
    initialize()
  }, [initialize])

  useGameLoop()
  useAutoSave()

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-dvh bg-paper">
        <p className="text-muted text-sm">出版社正在准备中……</p>
      </div>
    )
  }

  // Show welcome screen until player enters their name
  if (!playerName) {
    return <WelcomeView />
  }

  return (
    <div className="w-full h-dvh flex flex-col bg-paper shadow-xl overflow-hidden">
      <TopBar />
      <main className="flex-1 overflow-hidden flex flex-col min-h-0">
        {activeTab === 'desk' && <DeskView />}
        {activeTab === 'shelf' && <ShelfView />}
        {activeTab === 'authors' && <AuthorView />}
        {activeTab === 'office' && <OfficeView />}
      </main>
      <nav className="h-12 border-t border-border bg-card flex items-center shrink-0">
        {[
          ['desk', '桌面'],
          ['shelf', '书架'],
          ['authors', '作者'],
          ['office', '办公室'],
        ].map(([tab, label]) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as typeof activeTab)}
            className={`flex-1 h-full text-xs font-medium transition-colors cursor-pointer ${
              activeTab === tab
                ? 'text-green border-t-2 border-green -mt-px'
                : 'text-muted hover:text-ink'
            }`}
          >
            {label}
          </button>
        ))}
      </nav>
    </div>
  )
}
