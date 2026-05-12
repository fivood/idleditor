import { useState } from 'react'
import { useGameStore } from '@/store/gameStore'

export function WelcomeView() {
  const [name, setName] = useState('')
  const [cloudCode, setCloudCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [cloudMsg, setCloudMsg] = useState<string | null>(null)
  const setPlayerName = useGameStore(s => s.setPlayerName)
  const startLoop = useGameStore(s => s.startLoop)
  const loadFromCloud = useGameStore(s => s.loadFromCloud)

  async function handleStart() {
    const trimmed = name.trim()
    if (!trimmed) return

    setLoading(true)
    setCloudMsg(null)

    const code = cloudCode.trim()
    if (code) {
      const ok = await loadFromCloud(code)
      if (ok) {
        setCloudMsg('已从云端恢复存档')
        setTimeout(() => {
          setPlayerName(trimmed)
          startLoop()
        }, 800)
        return
      } else {
        setCloudMsg('未找到存档，将创建新存档')
        setTimeout(() => setCloudMsg(null), 2000)
      }
    }

    setPlayerName(trimmed)
    startLoop()
    setLoading(false)
  }

  return (
    <div className="flex items-center justify-center h-dvh bg-cream">
      <div className="max-w-md w-full p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-ink mb-2 font-mono">永夜出版社</h1>
          <p className="text-xs text-muted leading-relaxed font-mono">
            成立于1732年，创始人是一位活腻了的吸血鬼伯爵。
            经过三百年的发展，永夜出版社已成为不死者社群中
            最受尊敬的——或者说，唯一不倒闭的——文学机构。
          </p>
        </div>

        <div className="bg-cream-dark border-2 border-border-dark p-6 shadow-[4px_4px_0_#4a3728]">
          <p className="text-sm text-ink mb-4 font-mono">
            你是一位在永夜出版社工作了
            <span className="text-copper font-bold">217年</span>
            的编辑。永生很无聊，但审稿——审稿永远有新的惊喜。
          </p>

          <p className="text-xs text-muted mb-4 font-mono">
            在开始之前，请告诉我们你的名字。
          </p>

          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleStart()}
            placeholder="输入你的名字..."
            maxLength={12}
            className="w-full px-4 py-2.5 text-sm border-2 border-border-dark bg-card-inset text-ink placeholder:text-muted/50 focus:outline-none focus:border-copper mb-3 font-mono"
            autoFocus
          />

          <details className="mb-4">
            <summary className="text-[10px] text-muted font-mono cursor-pointer hover:text-ink-light">
              云存档（可选）
            </summary>
            <div className="mt-2">
              <p className="text-[10px] text-muted mb-1.5 font-mono leading-relaxed">
                输入一个只有你知道的码（如"yongye2024"），你的存档会自动同步到云端。换个设备输入同样的码就能继续玩。
              </p>
              <input
                type="text"
                value={cloudCode}
                onChange={e => setCloudCode(e.target.value)}
                placeholder="存档码..."
                maxLength={32}
                className="w-full px-3 py-2 text-xs border-2 border-border-dark bg-card-inset text-ink placeholder:text-muted/50 focus:outline-none focus:border-copper font-mono"
              />
            </div>
          </details>

          {cloudMsg && (
            <p className={`text-[10px] font-mono mb-3 ${cloudMsg.includes('恢复') ? 'text-green-600' : 'text-copper'}`}>
              {cloudMsg}
            </p>
          )}

          <button
            onClick={handleStart}
            disabled={!name.trim() || loading}
            className={`w-full py-2.5 text-sm border-2 border-border-dark font-mono transition-all shadow-[3px_3px_0_#4a3728] active:shadow-none active:translate-x-[3px] active:translate-y-[3px] cursor-pointer ${
              name.trim() && !loading
                ? 'bg-copper text-white'
                : 'bg-cream-dark text-muted cursor-not-allowed'
            }`}
          >
            {loading ? '加载中...' : '开始永恒的工作'}
          </button>
        </div>
      </div>
    </div>
  )
}
