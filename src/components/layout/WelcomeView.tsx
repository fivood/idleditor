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
  const [gender, setGender] = useState<'male' | 'female'>('male')
  const setPlayerName = useGameStore(s => s.setPlayerName)
  const setPlayerGender = useGameStore(s => s.setPlayerGender)
  const setTrait = useGameStore(s => s.setTrait)
  const startLoop = useGameStore(s => s.startLoop)
  const loadFromCloud = useGameStore(s => s.loadFromCloud)

  async function handleLoadCloud() {
    const code = cloudCode.trim()
    if (!code) return
    setLoading(true)
    setCloudMsg(null)
    const ok = await loadFromCloud(code)
    setLoading(false)
    if (ok) {
      setCloudMsg('存档已加载！正在进入出版社……')
      setTimeout(() => {
        startLoop()
      }, 800)
    } else {
      setCloudMsg('未找到存档，请检查存档码或先在此设备上保存过。')
    }
  }

  function handleNext() {
    if (!name.trim()) return
    setStep('trait')
  }

  async function handleStart(trait: EditorTrait) {
    setLoading(true)
    setPlayerGender(gender)
    const code = cloudCode.trim()
    if (code) {
      const ok = await loadFromCloud(code)
      if (ok) {
        setPlayerName(name.trim())
        setTrait(trait)
        startLoop()
        return
      }
    }
    // New game with optional cloud code
    setPlayerName(name.trim())
    setTrait(trait)
    startLoop()
    setLoading(false)
  }

  return (
    <div className="flex items-center justify-center h-dvh bg-cream">
      <div className="max-w-md w-full p-8">
        <div className="text-center mb-8">
          <img src="/favicon.svg" alt="" className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4" />
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
              <p className="text-sm text-ink mb-4 font-mono leading-relaxed">
                你是一位活了<span className="text-copper font-bold">217年</span>的吸血鬼。
                永夜出版社——你的同类创办——聘请你来当编辑，他们觉得反正你闲着也是闲着。
                出版社的茶水间里没有镜子、红茶配方可疑、实习生被一代又一代换掉，但你从来没变过。
              </p>

              <div className="flex gap-2 mb-3">
                <button onClick={() => setGender('male')} className={`flex-1 text-sm py-1.5 border-2 border-border-dark font-mono transition-all ${gender === 'male' ? 'bg-copper text-white' : 'bg-cream text-muted hover:bg-cream-dark'}`}>他</button>
                <button onClick={() => setGender('female')} className={`flex-1 text-sm py-1.5 border-2 border-border-dark font-mono transition-all ${gender === 'female' ? 'bg-copper text-white' : 'bg-cream text-muted hover:bg-cream-dark'}`}>她</button>
              </div>

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

              {/* Cloud save section */}
              <div className="border-2 border-border-dark bg-cream p-3 mb-4">
                <p className="text-xs text-ink font-bold font-mono mb-2">云存档</p>
                <p className="text-[12px] text-muted mb-2 font-mono leading-relaxed">
                  输入存档码，可从其他设备恢复进度。存档每5分钟自动同步。
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={cloudCode}
                    onChange={e => setCloudCode(e.target.value)}
                    placeholder="存档码..."
                    maxLength={32}
                    className="flex-1 px-3 py-1.5 text-xs border-2 border-border-dark bg-card-inset text-ink placeholder:text-muted/50 font-mono focus:outline-none focus:border-copper"
                  />
                  <button
                    onClick={handleLoadCloud}
                    disabled={loading || !cloudCode.trim()}
                    className={`text-xs px-3 py-1.5 border-2 border-border-dark font-mono transition-all cursor-pointer ${
                      loading || !cloudCode.trim()
                        ? 'bg-cream-dark text-muted cursor-not-allowed'
                        : 'bg-progress text-white shadow-[2px_2px_0_#3a6491] active:shadow-none active:translate-x-[1px] active:translate-y-[1px]'
                    }`}
                  >
                    {loading ? '加载中...' : '加载存档'}
                  </button>
                </div>
                {cloudMsg && (
                  <p className={`text-[12px] font-mono mt-2 ${cloudMsg.includes('已加载') || cloudMsg.includes('恢复') ? 'text-green-600' : 'text-copper'}`}>
                    {cloudMsg}
                  </p>
                )}
              </div>

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
                 一旦选定不可更改，但纪元更迭后可重新选择。
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
                    <p className="text-[12px] text-muted font-mono">{t.desc}</p>
                    <p className="text-[12px] text-copper font-bold font-mono mt-0.5">{t.effects}</p>
                  </button>
                ))}
              </div>

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
