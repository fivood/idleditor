import { useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import type { EditorTrait } from '@/core/types'

const TRAITS: { id: EditorTrait; label: string; icon: string; desc: string; effects: string }[] = [
  { id: 'decisive', label: '果断', icon: '⚡', desc: '你活了217年，学会了不拖延。', effects: '收入 +20% · 编辑速度 +15%' },
  { id: 'meticulous', label: '细致', icon: '🔍', desc: '你见过太多错别字毁掉一本书。', effects: '稿件质量 +10%' },
  { id: 'visionary', label: '远见', icon: '🔮', desc: '你在1732年就预言了电子书。没人信。', effects: '收入 +10% · 质量 +5% · 速度 +5%' },
]

export function WelcomeView() {
  const [step, setStep] = useState<'name' | 'trait'>('name')
  const [name, setName] = useState('')
  const [cloudCode, setCloudCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [cloudMsg, setCloudMsg] = useState<string | null>(null)
  const setPlayerName = useGameStore(s => s.setPlayerName)
  const setTrait = useGameStore(s => s.setTrait)
  const startLoop = useGameStore(s => s.startLoop)
  const loadFromCloud = useGameStore(s => s.loadFromCloud)

  function handleNext() {
    if (!name.trim()) return
    setStep('trait')
  }

  async function handleStart(trait: EditorTrait) {
    setLoading(true)
    setCloudMsg(null)

    const code = cloudCode.trim()
    if (code) {
      const ok = await loadFromCloud(code)
      if (ok) {
        setCloudMsg('已从云端恢复存档')
        setTimeout(() => {
          setPlayerName(name.trim())
          setTrait(trait)
          startLoop()
        }, 600)
        return
      } else {
        setCloudMsg('未找到存档，将创建新存档')
        setTimeout(() => setCloudMsg(null), 2000)
      }
    }

    setPlayerName(name.trim())
    setTrait(trait)
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
          {step === 'name' ? (
            <>
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
                onKeyDown={e => e.key === 'Enter' && handleNext()}
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
                    输入一个只有你知道的码，存档自动同步到云端。
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

              <button
                onClick={handleNext}
                disabled={!name.trim()}
                className={`w-full py-2.5 text-sm border-2 border-border-dark font-mono transition-all shadow-[3px_3px_0_#4a3728] active:shadow-none active:translate-x-[3px] active:translate-y-[3px] cursor-pointer ${
                  name.trim() ? 'bg-copper text-white' : 'bg-cream-dark text-muted cursor-not-allowed'
                }`}
              >
                继续
              </button>
            </>
          ) : (
            <>
              <p className="text-sm text-ink mb-1 font-mono">
                {name.trim()}，你在永夜出版社的风格是——
              </p>
              <p className="text-xs text-muted mb-4 font-mono">
                一旦选定不可更改，但转生后可以重新选择。
              </p>

              <div className="grid gap-2 mb-4">
                {TRAITS.map(t => (
                  <button
                    key={t.id}
                    onClick={() => handleStart(t.id)}
                    disabled={loading}
                    className={`text-left p-3 border-2 border-border-dark transition-all cursor-pointer shadow-[2px_2px_0_#4a3728] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] ${
                      loading ? 'bg-cream-dark text-muted cursor-wait' : 'bg-cream hover:bg-cream-dark'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-lg">{t.icon}</span>
                      <span className="text-sm font-bold text-ink font-mono">{t.label}</span>
                    </div>
                    <p className="text-[10px] text-muted font-mono">{t.desc}</p>
                    <p className="text-[10px] text-copper font-bold font-mono mt-0.5">{t.effects}</p>
                  </button>
                ))}
              </div>

              {cloudMsg && (
                <p className={`text-[10px] font-mono ${cloudMsg.includes('恢复') ? 'text-green-600' : 'text-copper'}`}>
                  {cloudMsg}
                </p>
              )}

              <button
                onClick={() => setStep('name')}
                disabled={loading}
                className="w-full text-xs py-2 border-2 border-border-dark text-muted font-mono cursor-pointer bg-cream shadow-[2px_2px_0_#4a3728] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"
              >
                ← 返回
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
