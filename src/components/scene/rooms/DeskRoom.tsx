import { useState, useMemo, useEffect } from 'react'
import { useGameStore } from '@/store/gameStore'
import { DeskScene } from '@/assets/scenes/DeskScene'
import { PixelBackground, PixelButton } from '@/components/scene/PixelBackground'
import { Hotspot } from '@/components/scene/Hotspot'
import { ScenePanel } from '@/components/scene/ScenePanel'
import { CorridorDoor } from '@/components/scene/CorridorDoor'
import { ManuscriptCard } from '@/components/desk/ManuscriptCard'
import { CoverSelectModal } from '@/components/desk/CoverSelectModal'
import { LogPanel } from '@/components/shared/LogPanel'
import { PixelProgressBar } from '@/components/shared/PixelProgressBar'
import { PixelTextButton } from '@/components/shared/PixelTextButton'
import { IconReview, IconEdit, IconMagnifier, IconPalette, IconPrinter, IconEnvelope, IconTarget, IconBolt } from '@/assets/pixelIcons'
import type { Manuscript } from '@/core/types'
import type { FC } from 'react'

interface PixelIconProps { size?: number }

type PanelKey = null | 'submissions' | 'pipeline' | 'log' | 'cat' | 'solicit'

const STAGE_PIXEL: Record<string, FC<PixelIconProps>> = {
  reviewing: IconReview,
  editing: IconEdit,
  proofing: IconMagnifier,
  cover_select: IconPalette,
  publishing: IconPrinter,
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

  // 如果存在 public/scenes/desk-bg.png 就用 PNG 像素图，否则降级到 SVG DeskScene
  const [hasPngBg, setHasPngBg] = useState(false)
  useEffect(() => {
    const img = new Image()
    img.onload = () => setHasPngBg(true)
    img.onerror = () => setHasPngBg(false)
    img.src = '/scenes/desk-bg.png'
  }, [])

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#0a0806]">
      {/* 场景背景全屏（PNG 像素图优先，缺则用 SVG 兜底）*/}
      {hasPngBg ? (
        <PixelBackground src="/scenes/desk-bg.png" alt="桌面房间" />
      ) : (
        <div className="absolute inset-0">
          <DeskScene manuscriptStackSize={stackSize} showCat={!!catState} />
        </div>
      )}

      {/* ─── 桌面 PNG 按钮层 ─── */}
      {/* 视觉层级：打字机作为中心主体（最大），其余物件围绕分布
          从左到右：征稿 / 投稿池 / 【打字机·中心】 / 梦境写作 / 出版日志 / 猫 */}
      {hasPngBg ? (
        <>
          <PixelButton
            src="/scenes/desk-quill.png"
            hoverSrc="/scenes/desk-quill-hover.png"
            outlineColor={null}
            label="📬 征稿"
            position={{ left: '4%', bottom: '6%', width: '12%', height: '28%' }}
            onClick={() => togglePanel('solicit')}
          />
          <PixelButton
            src={submitted.length === 0 ? '/scenes/desk-inbox-empty.png' : '/scenes/desk-inbox.png'}
            hoverSrc={submitted.length === 0 ? '/scenes/desk-inbox-empty-hover.png' : '/scenes/desk-inbox-hover.png'}
            outlineColor={null}
            label={submitted.length > 0 ? `📥 投稿池 (${submitted.length} 份待审)` : '📥 投稿池 (暂无新稿)'}
            position={{ left: '17%', bottom: '6%', width: '12%', height: '28%' }}
            onClick={() => togglePanel('submissions')}
          />
          {/* 打字机：视觉中心，最大 */}
          <PixelButton
            src="/scenes/desk-typewriter.png"
            hoverSrc="/scenes/desk-typewriter-hover.png"
            outlineColor={null}
            label={inProgress.length > 0 ? `⚙️ 编辑流水线 (${inProgress.length} 件)` : '⚙️ 编辑流水线 (空闲)'}
            position={{ left: '37%', bottom: '4%', width: '22%', height: '46%' }}
            onClick={() => togglePanel('pipeline')}
          />
          <PixelButton
            src="/scenes/desk-tea.png"
            hoverSrc="/scenes/desk-tea-hover.png"
            outlineColor={null}
            label="🌙 入梦写作（暂未开放）"
            position={{ left: '62%', bottom: '6%', width: '9%', height: '22%' }}
            onClick={() => { /* TODO v2.x: 梦境创作机制 */ }}
          />
          {catState && (
            <PixelButton
              src="/scenes/desk-cat.png"
              hoverSrc="/scenes/desk-cat-hover.png"
              outlineColor={null}
              label={`🐈 ${catState.name || '黑猫'} (好感 ${catState.affection})`}
              position={{ left: '72%', bottom: '4%', width: '14%', height: '34%' }}
              onClick={() => togglePanel('cat')}
            />
          )}
          <PixelButton
            src="/scenes/desk-lamp.png"
            hoverSrc="/scenes/desk-lamp-hover.png"
            outlineColor={null}
            label="📋 出版日志"
            position={{ left: '87%', bottom: '6%', width: '11%', height: '30%' }}
            onClick={() => togglePanel('log')}
          />
        </>
      ) : (
        // SVG 兜底模式（无 PNG bg 时）：用旧的透明热区
        <>
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
        </>
      )}

      {/* 右侧走廊门 → 办公室枢纽 */}
      <CorridorDoor to="office" side="right" label="通往走廊" />

      {/* ─── 弹出面板 ─── */}
      {openPanel === 'submissions' && (
        <ScenePanel variant="inbox" title={`📥 投稿池 · ${submitted.length} 份待审`} onClose={() => setOpenPanel(null)} position="top-12 left-4 md:top-16 md:left-16" width={460}>
          {submitted.length === 0 ? (
            <EmptyInboxIllustration />
          ) : (
            <div className="space-y-2">
              {submitted.map(m => <ManuscriptCard key={m.id} manuscript={m} />)}
            </div>
          )}
        </ScenePanel>
      )}

      {openPanel === 'pipeline' && (
        <ScenePanel variant="belt" title={`编辑流水线 · ${inProgress.length} 件进行中`} onClose={() => setOpenPanel(null)} position="bottom-20 left-1/2 -translate-x-1/2" width={520}>
          {inProgress.length === 0 ? (
            <EmptyPipelineIllustration />
          ) : (
            <div className="space-y-2">
              {inProgress.map(m => <PipelineCard key={m.id} manuscript={m} onSelectCover={() => setCoverModalId(m.id)} />)}
            </div>
          )}
        </ScenePanel>
      )}

      {openPanel === 'log' && (
        <ScenePanel variant="journal" title="出版日志" onClose={() => setOpenPanel(null)} position="top-12 right-4 md:top-16 md:right-16" width={420}>
          <LogPanel />
        </ScenePanel>
      )}

      {openPanel === 'cat' && catState && (
        <ScenePanel variant="scroll" title={`🐈 你的黑猫 · ${catState.name || '未命名'}`} onClose={() => setOpenPanel(null)} position="bottom-20 right-4 md:right-20" width={280}>
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
        <ScenePanel variant="notice" title="征稿渠道 · 公告板" onClose={() => setOpenPanel(null)} position="top-12 right-4 md:top-16 md:right-20" width={320}>
          <div className="space-y-2">
            <SolicitButton
              Icon={IconEnvelope} label="公开征稿" cost="免费"
              desc="2-4 份随机稿件。5 分钟冷却。"
              disabled={solicitCooldown > 0}
              cooldown={solicitCooldown}
              onClick={() => { solicitFree(); setOpenPanel(null) }}
            />
            <SolicitButton
              Icon={IconTarget} label="定向约稿" cost="30 RP"
              desc="2-3 份高品质稿。8 分钟冷却。"
              disabled={solicitCooldown > 0 || currencies.revisionPoints < 30}
              cooldown={solicitCooldown}
              onClick={() => { solicitTargeted(); setOpenPanel(null) }}
            />
            <SolicitButton
              Icon={IconBolt} label="加急征稿" cost="100 税"
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

/**
 * 空投稿池插画：一个空的"待审"木质托盘，里面只有一根孤零零的羽毛笔和一片落灰。
 * 比"稿件堆空了"的文字更有氛围。
 */
function EmptyInboxIllustration() {
  const lines = [
    '稿件堆空了。',
    '编辑部三号窗户的灰尘开始在阳光下跳舞——你不喜欢这个比喻，因为这里没有阳光。',
    '考虑去公告板贴张征稿启事？',
  ]
  const quip = lines[Math.floor(Math.random() * lines.length)]
  return (
    <div className="flex flex-col items-center py-6 text-center">
      <svg viewBox="0 0 120 80" width="160" height="106" shapeRendering="crispEdges" style={{ imageRendering: 'pixelated' }}>
        {/* 木质托盘阴影 */}
        <rect x="10" y="62" width="100" height="3" fill="#1a0e08" opacity="0.4" />
        {/* 托盘底部 */}
        <rect x="6" y="42" width="108" height="22" fill="#3d2614" />
        {/* 托盘前壁 */}
        <rect x="6" y="60" width="108" height="4" fill="#2a1810" />
        {/* 侧壁 */}
        <rect x="4" y="38" width="2" height="26" fill="#2a1810" />
        <rect x="114" y="38" width="2" height="26" fill="#2a1810" />
        {/* 托盘后壁 */}
        <rect x="6" y="32" width="108" height="14" fill="#5c3a1f" />
        <rect x="6" y="30" width="108" height="2" fill="#6e4a2a" />
        {/* "待审" 铜牌 */}
        <rect x="48" y="34" width="24" height="8" fill="#b8763b" />
        <rect x="48" y="34" width="24" height="1" fill="#d49a5b" />
        <text x="60" y="40" textAnchor="middle" fontSize="5" fill="#0a0806" fontFamily="serif" fontWeight="bold">待审</text>
        {/* 灰尘 */}
        <circle cx="28" cy="52" r="0.6" fill="#8a7a5a" opacity="0.4" />
        <circle cx="44" cy="56" r="0.5" fill="#8a7a5a" opacity="0.4" />
        <circle cx="72" cy="52" r="0.7" fill="#8a7a5a" opacity="0.5" />
        <circle cx="88" cy="55" r="0.4" fill="#8a7a5a" opacity="0.3" />
        {/* 一根孤零零的羽毛笔 */}
        <g transform="rotate(-12 70 50)">
          <rect x="68" y="40" width="1.5" height="14" fill="#d4c8b0" opacity="0.7" />
          <rect x="66" y="36" width="2" height="5" fill="#f0e8d8" opacity="0.7" />
          <rect x="65" y="32" width="2" height="4" fill="#f0e8d8" opacity="0.7" />
          <rect x="66" y="40" width="3" height="0.5" fill="#a89072" opacity="0.5" />
          <rect x="66" y="42" width="3" height="0.5" fill="#a89072" opacity="0.5" />
        </g>
      </svg>
      <p className="text-[12px] text-[#5a4a38] mt-3 italic max-w-[300px] leading-relaxed">{quip}</p>
    </div>
  )
}

/**
 * 空流水线插画：传送带静止不动，齿轮蒙着灰。
 */
function EmptyPipelineIllustration() {
  return (
    <div className="flex flex-col items-center py-4 text-center">
      <svg viewBox="0 0 160 60" width="220" height="83" shapeRendering="crispEdges" style={{ imageRendering: 'pixelated' }}>
        {/* 传送带主体 */}
        <rect x="10" y="26" width="140" height="14" fill="#2a1810" />
        <rect x="10" y="26" width="140" height="2" fill="#5c4a3a" />
        <rect x="10" y="38" width="140" height="2" fill="#1a0e08" />
        {/* 滚轮（左右） */}
        <circle cx="14" cy="33" r="8" fill="#5c3a1f" stroke="#0a0806" strokeWidth="1" />
        <circle cx="14" cy="33" r="2" fill="#0a0806" />
        <circle cx="146" cy="33" r="8" fill="#5c3a1f" stroke="#0a0806" strokeWidth="1" />
        <circle cx="146" cy="33" r="2" fill="#0a0806" />
        {/* 齿轮（上方驱动） */}
        <g transform="translate(80 14)">
          <circle r="8" fill="#3d2614" stroke="#0a0806" strokeWidth="1" />
          <circle r="3" fill="#0a0806" />
          {[0, 60, 120, 180, 240, 300].map(a => (
            <rect key={a} x="-1" y="-10" width="2" height="3" fill="#5c3a1f" transform={`rotate(${a})`} />
          ))}
        </g>
        {/* 灰尘斑点 */}
        <circle cx="40" cy="33" r="0.6" fill="#8a7a5a" opacity="0.5" />
        <circle cx="68" cy="32" r="0.5" fill="#8a7a5a" opacity="0.4" />
        <circle cx="98" cy="34" r="0.6" fill="#8a7a5a" opacity="0.5" />
        <circle cx="124" cy="33" r="0.4" fill="#8a7a5a" opacity="0.4" />
        {/* "暂停"指示灯 */}
        <circle cx="14" cy="50" r="2" fill="#5c0f0f" />
        <text x="80" y="58" textAnchor="middle" fontSize="5" fill="#5c4a3a" fontFamily="serif" fontStyle="italic">— 待机中 —</text>
      </svg>
      <p className="text-[12px] text-[#b8a48a] mt-3 italic">流水线齿轮停了。从投稿池捞一份稿件审起来。</p>
    </div>
  )
}

function PipelineCard({ manuscript: ms, onSelectCover }: { manuscript: Manuscript; onSelectCover: () => void }) {
  const stage = ms.status
  const pct = Math.min(100, Math.round(ms.editingProgress * 100))
  const isActionable = stage === 'cover_select'
  const StageIcon = STAGE_PIXEL[stage]
  return (
    <div className="bg-[#fff8e8] border-2 border-border-dark p-2 flex gap-2 items-center">
      <div className="w-12 text-center">
        <div className="flex justify-center">{StageIcon && <StageIcon />}</div>
        <div className="text-[10px] text-muted font-mono mt-0.5">{STAGE_LABELS[stage]}</div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-bold text-ink truncate font-mono">{ms.title}</div>
        <div className="mt-1">
          <PixelProgressBar value={pct} height={8} />
        </div>
      </div>
      {isActionable && (
        <PixelTextButton variant="primary" size="sm" onClick={onSelectCover}>选封面</PixelTextButton>
      )}
    </div>
  )
}

function SolicitButton({ Icon, label, cost, desc, disabled, cooldown, onClick }: {
  Icon: FC<PixelIconProps>; label: string; cost: string; desc: string;
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
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-bold text-ink flex items-center gap-2">
          <Icon />
          {label}
        </span>
        <span className="text-xs text-copper">{cost}</span>
      </div>
      <div className="text-[11px] text-muted mt-0.5">
        {cooldown && cooldown > 0 ? `冷却中 ${Math.ceil(cooldown / 60)}分` : desc}
      </div>
    </button>
  )
}
