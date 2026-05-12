import { useState } from 'react'
import { useGameStore } from '@/store/gameStore'

export function WelcomeView() {
  const [name, setName] = useState('')
  const setPlayerName = useGameStore(s => s.setPlayerName)
  const startLoop = useGameStore(s => s.startLoop)

  function handleStart() {
    const trimmed = name.trim()
    if (!trimmed) return
    setPlayerName(trimmed)
    startLoop()
  }

  return (
    <div className="flex items-center justify-center h-dvh bg-paper">
      <div className="max-w-md w-full p-8">
        {/* Vampire lore intro */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-serif font-bold text-ink mb-2">
            永夜出版社
          </h1>
          <p className="text-xs text-muted leading-relaxed">
            成立于1732年，创始人是一位活腻了的吸血鬼伯爵。
            经过三百年的发展，永夜出版社已成为不死者社群中
            最受尊敬的——或者说，唯一不倒闭的——文学机构。
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <p className="text-sm text-ink mb-4">
            你是一位在永夜出版社工作了
            <span className="text-green font-medium">217年</span>
            的编辑。永生很无聊，但审稿——审稿永远有新的惊喜。
          </p>

          <p className="text-xs text-muted mb-5">
            在开始之前，请告诉我们你的名字。
            虽然你已经用了几个世纪，但新人作者们还不知道。
          </p>

          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleStart()}
            placeholder="输入你的名字..."
            maxLength={12}
            className="w-full px-4 py-2.5 text-sm border border-border rounded-lg bg-paper text-ink placeholder:text-muted/50 focus:outline-none focus:border-green focus:ring-1 focus:ring-green/30 mb-4"
            autoFocus
          />

          <button
            onClick={handleStart}
            disabled={!name.trim()}
            className={`w-full py-2.5 text-sm rounded-lg transition-colors cursor-pointer ${
              name.trim()
                ? 'bg-green text-white hover:bg-green/90'
                : 'bg-border text-muted cursor-not-allowed'
            }`}
          >
            开始永恒的工作
          </button>
        </div>
      </div>
    </div>
  )
}
