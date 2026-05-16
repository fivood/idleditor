import { useState, useMemo } from 'react'
import { useGameStore } from '@/store/gameStore'
import { DeskScene } from '@/assets/scenes/DeskScene'
import { Hotspot } from '@/components/scene/Hotspot'
import { ScenePanel } from '@/components/scene/ScenePanel'
import { CorridorDoor } from '@/components/scene/CorridorDoor'
import { ManuscriptCard } from '@/components/desk/ManuscriptCard'
import { CoverSelectModal } from '@/components/desk/CoverSelectModal'
import { LogPanel } from '@/components/shared/LogPanel'
import type { Manuscript } from '@/core/types'

type PanelKey = null | 'submissions' | 'pipeline' | 'log' | 'cat' | 'solicit'

const STAGE_ICONS: Record<string, string> = {
  reviewing: '👀', editing: '✍️', proofing: '🔍',
  cover_select: '🎨', publishing: '🖨️',
}

const STAGE_LABELS: Record<string, string> = {
  reviewing: '审稿', editing: '编辑', proofing: '校对',
  cover_select: '待选封面', publishing: '付印',
}

/**
 * 桌面房间：吸血鬼编辑的私人办公室。
 *
 * 场景全屏作为背景，UI 元素通过点击场景内热区弹出。
 * - 稿件堆 → 投稿池 panel
 * - 桌面中央 → 编辑流水线 panel
 * - 油灯/笔 → 出版日志 panel
 * - 黑猫 → 猫互动 panel
 * - 右侧门 → 走向办公室枢纽
 */
export function DeskRoom() {
  const manuscripts = useGameStore(s => s.manuscripts)
  const catState = useGameStore(s => s.catState)
  const catPetCooldown = useGameStore(s => s.catPetCooldown)
  const nameCat = useGameStore(s => s.nameCat)
  const petCat = useGameStore(s => s.petCat)
  const makeCatImmortal = useGameStore(s => s.makeCatImmortal)
  const currencies = useGameStore(s => s.currencies)
  const solicitCooldown = useGameStore(s => s.solicitCooldown)
  const solicitFree = useGameStore(s => s.solicitFree)
  const solicitTargeted = useGameStore(s => s.solicitTargeted)
  const solicitRush = useGameStore(s => s.solicitRush)
  const confirmCover = useGameStore(s => s.confirmCover)
  const rejectManuscript = useGameStore(s => s.rejectManuscript)

  const [openPanel, setOpenPanel] = useState<PanelKey>(null)
  const [coverModalId, setCoverModalId] = useState<string | null>(null)
  const [catNameInput, setCatNameInput] = useState('')

  const all = useMemo(() => [...manuscripts.values()], [manuscripts])
  const submitted = useMemo(() => all.filter(m => m.status === 'submitted'), [all])
  const inProgress = useMemo(() => {
    const list = all.filter(m => ['reviewing', 'editing', 'proofing', 'cover_select', 'publishing'].includes(m.status))
    return list.sort((a, b) => {
      if (a.status === 'cover_select' && b.status !== 'cover_select') return -1
      if (a.status !== 'cover_select' && b.status === 'cover_select') return 1
      return 0
    })
  }, [all])

  const stackSize: 0 | 1 | 2 | 3 =
    submitted.length === 0 ? 0 :
    submitted.length <= 2 ? 1 :
    submitted.length <= 4 ? 2 : 3

  const togglePanel = (key: PanelKey) => setOpenPanel(prev => (prev === key ? null : key))
  const modalMs = coverModalId ? manuscripts.get(coverModalId) : null

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#0a0806]">
      {/* 场景背景全屏 */}
      <div className="absolute inset-0">
        <DeskScene manuscriptStackSize={stackSize} showCat={!!catState} />
      </div>

      {/* ─── 热区层 ─── */}
      <Hotspot
        label={submitted.length > 0 ? `📥 投稿池 (${submitted.length} 份待审)` : '📥 投稿池 (暂无新稿)'}
        style={{ left: '5%', top: '49%', width: '14%', height: '22%' }}
        onClick={() => togglePanel('submissions')}
        unseen={submitted.length > 0 && openPanel !== 'submissions'}
      />
      <Hotspot
        label={inProgress.length > 0 ? `⚙️ 编辑流水线 (${inProgress.length} 件)` : '⚙️ 编辑流水线 (空闲)'}
        style={{ left: '28%', top: '58%', width: '38%', height: '12%' }}
        onClick={() => togglePanel('pipeline')}
      />
      <Hotspot
        label="📋 出版日志"
        style={{ left: '67%', top: '50%', width: '12%', height: '18%' }}
        onClick={() => togglePanel('log')}
      />
      {catState && (
        <Hotspot
          label={`🐈 ${catState.name || '黑猫'} (好感 ${catState.affection})`}
          style={{ left: '82%', top: '60%', width: '14%', height: '16%' }}
          onClick={() => togglePanel('cat')}
        />
      )}
      <Hotspot
        label="📬 征稿"
        style={{ right: '2%', top: '4%', width: '11%', height: '8%' }}
        onClick={() => togglePanel('solicit')}
      />

      {/* 右侧走廊门 → 办公室枢纽 */}
      <CorridorDoor to="office" side="right" label="通往走廊" />

      {/* ─── 弹出面板 ─── */}
      {openPanel === 'submissions' && (
        <ScenePanel title={`📥 投稿池 · ${submitted.length} 份待审`} onClose={() => setOpenPanel(null)} position="top-12 left-4 md:top-16 md:left-16" width={460}>
          {submitted.length === 0 ? (
            <p className="text-sm text-muted text-center py-6">稿件堆空了，等待新投稿……</p>
          ) : (
            <div className="space-y-2">
              {submitted.map(m => <ManuscriptCard key={m.id} manuscript={m} />)}
            </div>
          )}
        </ScenePanel>
      )}

      {openPanel === 'pipeline' && (
        <ScenePanel title={`⚙️ 编辑流水线 · ${inProgress.length} 件进行中`} onClose={() => setOpenPanel(null)} position="bottom-20 left-1/2 -translate-x-1/2" width={520}>
          {inProgress.length === 0 ? (
            <p className="text-sm text-muted text-center py-6">流水线空闲，从投稿池审稿开始</p>
          ) : (
            <div className="space-y-2">
              {inProgress.map(m => <PipelineCard key={m.id} manuscript={m} onSelectCover={() => setCoverModalId(m.id)} />)}
            </div>
          )}
        </ScenePanel>
      )}

      {openPanel === 'log' && (
        <ScenePanel title="📋 出版日志" onClose={() => setOpenPanel(null)} position="top-12 right-4 md:top-16 md:right-16" width={420}>
          <LogPanel />
        </ScenePanel>
      )}

      {openPanel === 'cat' && catState && (
        <ScenePanel title={`🐈 你的黑猫 · ${catState.name || '未命名'}`} onClose={() => setOpenPanel(null)} position="bottom-20 right-4 md:right-20" width={280}>
          {!catState.name ? (
            <div>
              <p className="text-xs text-muted mb-2 leading-relaxed">这只黑猫还没有名字。给它取一个吧（最多6字）：</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={catNameInput}
                  onChange={e => setCatNameInput(e.target.value)}
                  maxLength={6}
                  className="flex-1 px-2 py-1 text-sm border border-border-dark bg-card-inset font-mono"
                  placeholder="名字…"
                />
                <button
                  onClick={() => { if (catNameInput.trim()) { nameCat(catNameInput); setCatNameInput('') } }}
                  className="px-3 py-1 text-sm bg-copper text-white border border-border-dark cursor-pointer font-mono"
                >确认</button>
              </div>
            </div>
          ) : (
            <div className="text-sm space-y-2">
              <div>年龄：{catState.age} 岁{catState.immortal ? ' · 永生' : ''}</div>
              <div>好感：{catState.affection} / 100</div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={petCat}
                  disabled={catPetCooldown > 0}
                  className={`px-3 py-1 text-sm border border-border-dark cursor-pointer font-mono ${catPetCooldown > 0 ? 'bg-cream-dark text-muted cursor-not-allowed' : 'bg-copper text-white'}`}
                >摸摸 {catPetCooldown > 0 ? `(${catPetCooldown}s)` : ''}</button>
                {!catState.immortal && currencies.statues >= 1 && (
                  <button
                    onClick={makeCatImmortal}
                    className="px-3 py-1 text-sm bg-progress text-white border border-border-dark cursor-pointer font-mono"
                  >赐予永生 (1 铜像)</button>
                )}
              </div>
            </div>
          )}
        </ScenePanel>
      )}

      {openPanel === 'solicit' && (
        <ScenePanel title="📬 征稿渠道" onClose={() => setOpenPanel(null)} position="top-12 right-4 md:top-16 md:right-20" width={320}>
          <div className="space-y-2">
            <SolicitButton
              icon="📮" label="公开征稿" cost="免费"
              desc="2-4 份随机稿件。5 分钟冷却。"
              disabled={solicitCooldown > 0}
              cooldown={solicitCooldown}
              onClick={() => { solicitFree(); setOpenPanel(null) }}
            />
            <SolicitButton
              icon="🎯" label="定向约稿" cost="30 RP"
              desc="2-3 份高品质稿。8 分钟冷却。"
              disabled={solicitCooldown > 0 || currencies.revisionPoints < 30}
              cooldown={solicitCooldown}
              onClick={() => { solicitTargeted(); setOpenPanel(null) }}
            />
            <SolicitButton
              icon="⚡" label="加急征稿" cost="100 税"
              desc="1-2 份稿。无冷却。"
              disabled={currencies.royalties < 100}
              onClick={() => { solicitRush(); setOpenPanel(null) }}
            />
          </div>
        </ScenePanel>
      )}

      {/* 封面选择 modal（独立于 ScenePanel） */}
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

// ─── 内嵌组件 ───

function PipelineCard({ manuscript: ms, onSelectCover }: { manuscript: Manuscript; onSelectCover: () => void }) {
  const stage = ms.status
  const pct = Math.min(100, Math.round(ms.editingProgress * 100))
  const isActionable = stage === 'cover_select'
  return (
    <div className="bg-[#fff8e8] border-2 border-border-dark p-2 flex gap-2 items-center">
      <div className="w-10 text-center">
        <div className="text-lg">{STAGE_ICONS[stage]}</div>
        <div className="text-[10px] text-muted font-mono">{STAGE_LABELS[stage]}</div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-bold text-ink truncate font-mono">{ms.title}</div>
        <div className="mt-1 h-2 bg-card-inset border border-border-dark overflow-hidden">
          <div className="h-full bg-copper transition-all duration-150" style={{ width: `${pct}%` }} />
        </div>
      </div>
      {isActionable && (
        <button onClick={onSelectCover} className="text-xs px-2 py-1 bg-copper text-white border border-border-dark font-mono cursor-pointer">
          选封面
        </button>
      )}
    </div>
  )
}

function SolicitButton({ icon, label, cost, desc, disabled, cooldown, onClick }: {
  icon: string; label: string; cost: string; desc: string;
  disabled?: boolean; cooldown?: number; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full text-left p-2 border border-border-dark font-mono transition-all ${
        disabled ? 'bg-cream-dark text-muted cursor-not-allowed opacity-60' : 'bg-[#fff8e8] hover:bg-[#fff0d0] cursor-pointer'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-ink">{icon} {label}</span>
        <span className="text-xs text-copper">{cost}</span>
      </div>
      <div className="text-[11px] text-muted mt-0.5">
        {cooldown && cooldown > 0 ? `冷却中 ${Math.ceil(cooldown / 60)}分` : desc}
      </div>
    </button>
  )
}
