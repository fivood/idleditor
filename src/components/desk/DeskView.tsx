import { useState, useMemo } from 'react'
import { useGameStore } from '@/store/gameStore'
import { ManuscriptCard } from './ManuscriptCard'
import { LogPanel } from '@/components/shared/LogPanel'
import { CoverSelectModal } from './CoverSelectModal'
import type { Manuscript } from '@/core/types'

const STAGE_ICONS: Record<string, string> = {
  reviewing: '👀', editing: '✍️', proofing: '🔍',
  cover_select: '🎨', publishing: '🖨️',
}

const STAGE_LABELS: Record<string, string> = {
  reviewing: '审稿', editing: '编辑', proofing: '校对',
  cover_select: '待选封面', publishing: '付印',
}

export function DeskView() {
  const manuscripts = useGameStore(s => s.manuscripts)
  const currencies = useGameStore(s => s.currencies)
  const catState = useGameStore(s => s.catState)
  const catPetCooldown = useGameStore(s => s.catPetCooldown)
  const nameCat = useGameStore(s => s.nameCat)
  const petCat = useGameStore(s => s.petCat)
  const makeCatImmortal = useGameStore(s => s.makeCatImmortal)
  const solicitCooldown = useGameStore(s => s.solicitCooldown)
  const solicitFree = useGameStore(s => s.solicitFree)
  const solicitTargeted = useGameStore(s => s.solicitTargeted)
  const solicitRush = useGameStore(s => s.solicitRush)
  const confirmCover = useGameStore(s => s.confirmCover)
  const rejectManuscript = useGameStore(s => s.rejectManuscript)
  const [coverModalId, setCoverModalId] = useState<string | null>(null)
  const [showLog, setShowLog] = useState(false)
  const [solicitOpen, setSolicitOpen] = useState(false)
  const [catNameInput, setCatNameInput] = useState('')
  const [showCatInfo, setShowCatInfo] = useState(false)

  const all = useMemo(() => [...manuscripts.values()], [manuscripts])
  const submitted = useMemo(() => all.filter(m => m.status === 'submitted'), [all])
  const inProgress = useMemo(() => {
    const list = all.filter(m => ['reviewing', 'editing', 'proofing', 'cover_select', 'publishing'].includes(m.status))
    // Pin cover_select manuscripts to top
    return list.sort((a, b) => {
      if (a.status === 'cover_select' && b.status !== 'cover_select') return -1
      if (a.status !== 'cover_select' && b.status === 'cover_select') return 1
      return 0
    })
  }, [all])

  const modalMs = coverModalId ? manuscripts.get(coverModalId) : null

  return (
    <div className="flex flex-col md:grid md:grid-cols-[3fr_1.2fr] gap-2 md:gap-4 h-full p-2 md:p-4">
      <div className="flex flex-col gap-2 md:gap-3 min-h-0">
        <div className="flex items-center gap-2 text-[15px] md:text-xs text-muted shrink-0 font-mono">
          <span className="text-ink font-bold border border-border-dark px-1.5 md:px-2 py-0.5 bg-cream">📥 {submitted.length}</span>
          <span className="text-ink font-bold border border-border-dark px-1.5 md:px-2 py-0.5 bg-cream">⚙️ {inProgress.length}</span>
          {catState && <span className="text-base animate-bounce" title={catState.name || '你的猫'}>🐈</span>}
          <div className="flex-1" />
          <div className="relative">
            <button
              onClick={() => setSolicitOpen(!solicitOpen)}
              className="text-ink font-bold border-2 border-border-dark px-1.5 md:px-2 py-0.5 bg-cream cursor-pointer hover:bg-copper hover:text-white transition-all shadow-[2px_2px_0_#4a3728] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] font-mono text-xs"
            >
              📬 征稿
            </button>
            {solicitOpen && (
              <div className="absolute right-0 top-full mt-1 w-64 bg-cream border-2 border-border-dark shadow-[3px_3px_0_#4a3728] z-50">
                <div className="p-2 space-y-2">
                  <SolicitOption
                    icon="📮" label="公开征稿" cost="免费"
                    cooldown={solicitCooldown}
                    desc="向出版业界发布匿名征稿函。2-4份稿件，品质随机。"
                    onClick={() => { solicitFree(); setSolicitOpen(false) }}
                  />
                  <SolicitOption
                    icon="🎯" label="定向约稿" cost={`30 RP`}
                    cooldown={solicitCooldown}
                    disabled={currencies.revisionPoints < 30}
                    desc="向偏好领域约稿。2-3份稿件，品质+10。"
                    onClick={() => { solicitTargeted(); setSolicitOpen(false) }}
                  />
                  <SolicitOption
                    icon="⚡" label="加急征稿" cost={`100 💰`}
                    cooldown={0}
                    disabled={currencies.royalties < 100}
                    desc="动用预算紧急征稿。1-2份稿件，无冷却。"
                    onClick={() => { solicitRush(); setSolicitOpen(false) }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Cat */}
        {catState && !catState.name && (
          <CatNamingPrompt
            value={catNameInput}
            onChange={setCatNameInput}
            onSubmit={() => { nameCat(catNameInput); setCatNameInput('') }}
            visible={true}
          />
        )}
        {catState && catState.name && (
          <div className="flex items-center gap-2 text-xs font-mono bg-cream border border-border-medium px-2 py-1 shrink-0">
            <button onClick={() => setShowCatInfo(!showCatInfo)} className="flex items-center gap-1.5 hover:text-copper transition-colors cursor-pointer">
              <span className="text-base">🐈</span>
              <span className="text-ink font-bold">{catState.name}</span>
              {catState.immortal && <span className="text-copper text-[16px]">✦</span>}
            </button>
            <span className="text-muted text-[16px]">{catState.age}岁</span>
            <div className="w-16 h-1.5 bg-card-inset border border-border-dark ml-1">
              <div className="h-full bg-copper transition-all" style={{ width: `${catState.affection}%` }} />
            </div>
            <button
              onClick={petCat}
              disabled={catPetCooldown > 0}
              className={`text-[14px] px-1 border border-border-dark font-mono transition-all ${catPetCooldown > 0 ? 'text-muted bg-card-inset cursor-not-allowed' : 'bg-cream hover:bg-amber-50 cursor-pointer'}`}
              title="摸猫"
            >
              {catPetCooldown > 0 ? `${catPetCooldown}s` : '✋'}
            </button>
            {showCatInfo && (
              <div className="absolute left-0 top-full mt-1 w-48 bg-cream border-2 border-border-dark shadow-[3px_3px_0_#4a3728] z-50 p-2 text-[16px] font-mono">
                <p className="text-ink font-bold">{catState.name}</p>
                <p className="text-muted">{catState.age}岁 · 好感 {catState.affection}/100</p>
                {catState.immortal ? (
                  <p className="text-copper">永生 · 将伴你无尽轮回</p>
                ) : (
                  <>
                    <p className="text-muted mt-1">猫的寿命有限。好感 ≥ 80 后有机会让它永生，消耗一座铜像。</p>
                    {catState.immortalityPrompted && currencies.statues < 1 && <p className="text-amber-600 mt-0.5">铜像不足，当前 {currencies.statues} 座</p>}
                    {catState.immortalityPrompted && currencies.statues >= 1 && (
                      <button onClick={() => { makeCatImmortal(); setShowCatInfo(false) }} className="mt-1 w-full text-[14px] px-2 py-1 bg-copper text-white border-2 border-border-dark font-mono cursor-pointer shadow-[2px_2px_0_#4a3728] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all">
                        赐予永生（消耗1铜像）
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {currencies.revisionPoints === 0 && submitted.length === 0 && (
          <div className="bg-cream border-2 border-border-dark p-3 md:p-4 text-xs shrink-0 shadow-[3px_3px_0_#4a3728]">
            <p className="font-bold text-ink mb-1 font-mono">欢迎来到永夜出版社。</p>
            <p className="text-muted text-[16px] md:text-xs leading-relaxed">
              稿件即将出现在你的书桌上。审读稿件来赚取修订点数，
              然后招募部门来让一切自动化。
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3 flex-1 min-h-0">
          <div className="flex flex-col min-h-0">
            <h2 className="text-[16px] md:text-xs font-bold text-muted uppercase tracking-wider mb-1 md:mb-2 shrink-0 font-mono">📥 投稿池</h2>
            <div className="flex-1 overflow-y-auto space-y-1.5 md:space-y-2 pr-1">
              {submitted.length === 0 && (
                <div className="text-center py-6 md:py-8 text-muted text-[16px] md:text-xs font-mono">
                  <p>稿件堆空了</p><p className="mt-1">等待新投稿……</p>
                </div>
              )}
              {submitted.map(ms => <ManuscriptCard key={ms.id} manuscript={ms} />)}
            </div>
          </div>

          <div className="flex flex-col min-h-0">
            <h2 className="text-[16px] md:text-xs font-bold text-muted uppercase tracking-wider mb-1 md:mb-2 shrink-0 font-mono">⚙️ 编辑流水线</h2>
            <div className="flex-1 overflow-y-auto space-y-1.5 md:space-y-2 pr-1">
              {inProgress.length === 0 && (
                <div className="text-center py-6 md:py-8 text-muted text-[16px] md:text-xs font-mono">
                  <p>流水线空闲</p><p className="mt-1">从投稿池审稿开始</p>
                </div>
              )}
              {inProgress.map(ms => (
                <PipelineCard key={ms.id} manuscript={ms} onSelectCover={() => setCoverModalId(ms.id)} />
              ))}
            </div>
          </div>
        </div>

        {/* Mobile log toggle */}
        <button
          onClick={() => setShowLog(!showLog)}
          className="md:hidden text-[16px] text-muted font-mono text-center py-1 border border-border-dark bg-cream-dark"
        >
          {showLog ? '收起日志 ▲' : '出版日志 ▼'}
        </button>
      </div>

      {/* Desktop log always visible, mobile collapsible */}
      <div className={`${showLog ? 'block' : 'hidden'} md:block min-h-0`}>
        <LogPanel />
      </div>

      {modalMs && modalMs.status === 'cover_select' && (
        <CoverSelectModal
          manuscript={modalMs}
          onConfirm={() => { confirmCover(modalMs.id); setCoverModalId(null) }}
          onReject={() => { rejectManuscript(modalMs.id); setCoverModalId(null) }}
          onCancel={() => setCoverModalId(null)}
        />
      )}
    </div>
  )
}

function PipelineCard({ manuscript: ms, onSelectCover }: { manuscript: Manuscript; onSelectCover: () => void }) {
  const stage = ms.status
  const pct = Math.min(100, Math.round(ms.editingProgress * 100))
  const meticulousEdit = useGameStore(s => s.meticulousEdit)

  if (stage === 'cover_select') {
    return (
      <div className="bg-cream border-2 border-border-dark p-2 md:p-3 shadow-[3px_3px_0_#4a3728]">
        <div className="flex items-center gap-1.5 md:gap-2 mb-1.5 md:mb-2">
          <span className="text-sm md:text-base">{STAGE_ICONS[stage]}</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs md:text-sm font-bold text-ink truncate font-mono">{ms.title}</p>
            <p className="text-[15px] md:text-xs text-copper font-bold">待选封面</p>
          </div>
        </div>
        <button
          onClick={onSelectCover}
          className="w-full text-[16px] md:text-xs px-2 md:px-3 py-1.5 md:py-2 bg-copper text-white border-2 border-border-dark font-mono cursor-pointer shadow-[2px_2px_0_#4a3728] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"
        >
          查看封面
        </button>
      </div>
  )
  }

  return (
    <div className="bg-cream border-2 border-border-dark p-2 md:p-3 shadow-[3px_3px_0_#4a3728]">
      <div className="flex items-start justify-between mb-1.5 md:mb-2">
        <div className="flex items-center gap-1.5 md:gap-2 min-w-0">
          <span className="text-sm md:text-base flex-shrink-0">{STAGE_ICONS[stage] ?? '📖'}</span>
          <div className="min-w-0">
            <p className="text-xs md:text-sm font-bold text-ink truncate font-mono">{ms.title}</p>
            <p className="text-[15px] md:text-xs text-muted">{STAGE_LABELS[stage] ?? stage}</p>
          </div>
        </div>
        <span className="text-xs md:text-sm font-mono font-bold text-copper tabular-nums flex-shrink-0 ml-1 md:ml-2">{pct}%</span>
      </div>
      <div className="h-2 md:h-3 bg-card-inset border-2 border-border-dark overflow-hidden">
        <div
          className="h-full bg-progress border-r-2 border-border-dark transition-all duration-700"
          style={{ width: `${pct}%`, backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 4px, rgba(0,0,0,0.15) 4px, rgba(0,0,0,0.15) 8px)' }}
        />
      </div>
      {stage === 'editing' && !ms.meticulouslyEdited && (
        <div className="mt-1.5 flex gap-1">
          <button onClick={() => meticulousEdit(ms.id, 'light')} className="text-[14px] md:text-[16px] px-1.5 py-0.5 border-2 border-border-dark bg-cream text-progress font-mono cursor-pointer shadow-[2px_2px_0_#3a6491] active:shadow-none active:translate-x-[1px] active:translate-y-[1px] transition-all" title="10 RP · 品质+3">轻校</button>
          <button onClick={() => meticulousEdit(ms.id, 'deep')} className="text-[14px] md:text-[16px] px-1.5 py-0.5 border-2 border-border-dark bg-progress text-white font-mono cursor-pointer shadow-[2px_2px_0_#3a6491] active:shadow-none active:translate-x-[1px] active:translate-y-[1px] transition-all" title="30 RP · 品质+8">深校</button>
          <button onClick={() => meticulousEdit(ms.id, 'extreme')} className="text-[14px] md:text-[16px] px-1.5 py-0.5 border-2 border-border-dark bg-progress-dark text-white font-mono cursor-pointer shadow-[2px_2px_0_#3a6491] active:shadow-none active:translate-x-[1px] active:translate-y-[1px] transition-all" title="60 RP · 品质+15">极校</button>
        </div>
      )}
      <p className="text-[14px] md:text-[16px] text-muted mt-1 text-right font-mono">{pct < 100 ? '处理中...' : '完成'}</p>
    </div>
  )
}

function SolicitOption({ icon, label, cost, cooldown, desc, disabled, onClick }: {
  icon: string
  label: string
  cost: string
  cooldown: number
  desc: string
  disabled?: boolean
  onClick: () => void
}) {
  const blocked = !!disabled || cooldown > 0
  return (
    <button
      disabled={blocked}
      onClick={onClick}
      className={`w-full text-left p-2 border-2 font-mono transition-all text-xs ${
        blocked
          ? 'bg-card-inset border-border-medium text-muted cursor-not-allowed'
          : 'bg-cream border-border-dark cursor-pointer hover:bg-amber-50 shadow-[2px_2px_0_#4a3728] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]'
      }`}
    >
      <div className="flex items-center gap-1.5">
        <span className="text-sm">{icon}</span>
        <span className="font-bold text-ink">{label}</span>
        <div className="flex-1" />
        <span className="text-[16px] text-muted">{cost}</span>
        {cooldown > 0 && <span className="text-[16px] text-copper">CD {cooldown}s</span>}
      </div>
      <p className="text-[16px] text-muted mt-0.5">{desc}</p>
     </button>
  )
}

function CatNamingPrompt({ value, onChange, onSubmit, visible }: {
  value: string
  onChange: (v: string) => void
  onSubmit: () => void
  visible: boolean
}) {
  if (!visible) return null
  return (
    <div className="flex items-center gap-2 text-xs font-mono bg-cream border-2 border-border-dark px-2 py-1.5 shrink-0 shadow-[2px_2px_0_#4a3728]">
      <span className="text-base">🐈</span>
      <input
        autoFocus
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') onSubmit() }}
        placeholder="给猫取名（最多6字）"
        maxLength={6}
        className="text-xs bg-cream border border-border-medium px-1.5 py-0.5 w-28 font-mono outline-none focus:border-copper"
      />
      <button onClick={onSubmit} disabled={!value.trim()} className="text-[14px] px-2 py-0.5 bg-copper text-white border-2 border-border-dark font-mono cursor-pointer shadow-[2px_2px_0_#4a3728] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all disabled:bg-card-inset disabled:text-muted disabled:cursor-not-allowed">
        确定
      </button>
    </div>
  )
}
