import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { PAPER_STYLES } from '@/assets/paperTextures'

/**
 * 场景内弹出面板的视觉风格。
 *
 * - paper:   做旧米黄纸（默认，通用）
 * - inbox:   木质收件托盘（用于投稿池——稿件溢出来的感觉）
 * - belt:    铁质流水线带（用于编辑流水线——稿件在传送带上）
 * - journal: 翻开的羊皮日记（用于出版日志）
 * - scroll:  展开的卷轴（用于猫详情/秘密事项）
 * - notice:  软木公告板（用于征稿——三个图钉钉着的告示）
 */
type PanelVariant = 'paper' | 'inbox' | 'belt' | 'journal' | 'scroll' | 'notice'

interface ScenePanelProps {
  title: string
  onClose: () => void
  children: ReactNode
  position?: string
  width?: number
  variant?: PanelVariant
}

export function ScenePanel({
  title,
  onClose,
  children,
  position = 'top-16 left-16',
  width = 420,
  variant = 'paper',
}: ScenePanelProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      className={`absolute z-40 ${position}`}
      style={{ maxWidth: width }}
      role="dialog"
      aria-label={title}
    >
      <PanelFrame variant={variant} title={title} onClose={onClose}>
        {children}
      </PanelFrame>
    </div>
  )
}

// ─── 各 variant 的具体视觉框架 ───

function PanelFrame({
  variant,
  title,
  onClose,
  children,
}: {
  variant: PanelVariant
  title: string
  onClose: () => void
  children: ReactNode
}) {
  switch (variant) {
    case 'inbox':   return <InboxFrame title={title} onClose={onClose}>{children}</InboxFrame>
    case 'belt':    return <BeltFrame title={title} onClose={onClose}>{children}</BeltFrame>
    case 'journal': return <JournalFrame title={title} onClose={onClose}>{children}</JournalFrame>
    case 'scroll':  return <ScrollFrame title={title} onClose={onClose}>{children}</ScrollFrame>
    case 'notice':  return <NoticeFrame title={title} onClose={onClose}>{children}</NoticeFrame>
    default:        return <PaperFrame title={title} onClose={onClose}>{children}</PaperFrame>
  }
}

function CloseBtn({ onClose, variant = 'dark' }: { onClose: () => void; variant?: 'dark' | 'light' }) {
  return (
    <button
      onClick={onClose}
      aria-label="关闭"
      className={`text-lg leading-none cursor-pointer ml-2 transition-colors ${
        variant === 'dark' ? 'text-[#8a7a5a] hover:text-[#4a3728]' : 'text-[#b8a48a] hover:text-[#f5d878]'
      }`}
    >
      ✕
    </button>
  )
}

// ── 1. 通用纸张面板 ──
function PaperFrame({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div
      className="border-2 border-border-dark shadow-[6px_6px_0_#2a1810] p-3 md:p-4 font-mono text-ink"
      style={{ ...PAPER_STYLES.cream, maxHeight: '70vh', overflowY: 'auto' }}
    >
      <div className="flex items-center justify-between border-b border-[#c8b890] pb-2 mb-3">
        <h3 className="text-sm font-bold text-[#4a3728]">{title}</h3>
        <CloseBtn onClose={onClose} />
      </div>
      {children}
    </div>
  )
}

// ── 2. 木质收件托盘（投稿池）──
function InboxFrame({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div
      className="border-2 shadow-[6px_6px_0_#0a0806] font-mono"
      style={{
        background: 'linear-gradient(180deg, #5c3a1f, #3d2614)',
        borderColor: '#0a0806',
        maxHeight: '72vh',
      }}
    >
      {/* 木质托盘顶部边沿（带钉子）*/}
      <div
        className="flex items-center justify-between px-3 py-2 border-b-2"
        style={{
          background: 'linear-gradient(180deg, #6e4a2a, #4a2f18)',
          borderColor: '#0a0806',
        }}
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: '#0a0806', boxShadow: '0 0 0 1px #b8763b' }} />
          <h3 className="text-sm font-bold" style={{ color: '#f5d878', textShadow: '0 1px 0 #0a0806' }}>{title}</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: '#0a0806', boxShadow: '0 0 0 1px #b8763b' }} />
          <CloseBtn onClose={onClose} variant="light" />
        </div>
      </div>
      {/* 内部稿件区（带做旧底色）*/}
      <div className="p-3 overflow-y-auto" style={{ ...PAPER_STYLES.cream, maxHeight: 'calc(72vh - 48px)' }}>
        {children}
      </div>
    </div>
  )
}

// ── 3. 铁质传送带（编辑流水线）──
function BeltFrame({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div
      className="border-2 shadow-[6px_6px_0_#0a0806] font-mono"
      style={{
        background: 'linear-gradient(180deg, #4a3728, #2a1810)',
        borderColor: '#0a0806',
        maxHeight: '70vh',
      }}
    >
      {/* 铁质顶梁（带螺丝钉）*/}
      <div
        className="flex items-center justify-between px-3 py-1.5 border-b-2 relative"
        style={{ background: 'linear-gradient(180deg, #5c4a3a, #3a2a1a)', borderColor: '#0a0806' }}
      >
        {/* 4 个螺丝钉装饰 */}
        <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full" style={{ background: '#0a0806' }} />
        <div className="absolute right-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full" style={{ background: '#0a0806' }} />
        <h3 className="text-sm font-bold pl-3" style={{ color: '#d4a85a' }}>⚙ {title}</h3>
        <CloseBtn onClose={onClose} variant="light" />
      </div>
      {/* 传送带纹理（条纹）*/}
      <div
        className="p-3 overflow-y-auto"
        style={{
          background: `repeating-linear-gradient(135deg, #2a1810 0px, #2a1810 8px, #1a0e08 8px, #1a0e08 16px)`,
          maxHeight: 'calc(70vh - 40px)',
        }}
      >
        {children}
      </div>
    </div>
  )
}

// ── 4. 翻开的羊皮日记（出版日志）──
function JournalFrame({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div
      className="border-2 shadow-[6px_6px_0_#2a1810] font-mono"
      style={{
        background: 'linear-gradient(180deg, #5c3a1f, #3d2614)',
        borderColor: '#2a1810',
        maxHeight: '72vh',
        padding: 8,
      }}
    >
      {/* 皮封面 inner shadow */}
      <div className="relative" style={{ ...PAPER_STYLES.parchment, padding: '10px 14px', boxShadow: 'inset 0 0 12px rgba(0,0,0,0.3)' }}>
        <div className="flex items-center justify-between border-b border-[#a89060] pb-1 mb-2">
          <h3 className="text-sm font-bold" style={{ color: '#5c3a1f', fontFamily: 'serif' }}>📖 {title}</h3>
          <CloseBtn onClose={onClose} />
        </div>
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(72vh - 80px)' }}>
          {children}
        </div>
      </div>
    </div>
  )
}

// ── 5. 展开的卷轴（猫详情）──
function ScrollFrame({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="font-mono">
      {/* 上轴 */}
      <div
        className="h-2 mx-2"
        style={{
          background: 'linear-gradient(180deg, #6e4a2a, #4a2f18)',
          borderLeft: '2px solid #2a1810',
          borderRight: '2px solid #2a1810',
          boxShadow: '0 0 0 2px #2a1810, 2px 2px 0 #0a0806',
        }}
      />
      {/* 卷轴主体 */}
      <div
        className="border-l-2 border-r-2 shadow-[3px_3px_0_#0a0806]"
        style={{
          ...PAPER_STYLES.parchment,
          borderColor: '#2a1810',
          maxHeight: '60vh',
          padding: '8px 14px',
        }}
      >
        <div className="flex items-center justify-between border-b border-[#a89060] pb-1.5 mb-2">
          <h3 className="text-sm font-bold" style={{ color: '#5c3a1f', fontFamily: 'serif' }}>{title}</h3>
          <CloseBtn onClose={onClose} />
        </div>
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(60vh - 60px)' }}>
          {children}
        </div>
      </div>
      {/* 下轴 */}
      <div
        className="h-2 mx-2"
        style={{
          background: 'linear-gradient(180deg, #6e4a2a, #4a2f18)',
          borderLeft: '2px solid #2a1810',
          borderRight: '2px solid #2a1810',
          boxShadow: '0 0 0 2px #2a1810, 2px 2px 0 #0a0806',
        }}
      />
    </div>
  )
}

// ── 6. 软木公告板（征稿）──
function NoticeFrame({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div
      className="border-2 shadow-[6px_6px_0_#0a0806] font-mono p-2"
      style={{
        background: '#8b6b3e',
        backgroundImage: 'radial-gradient(circle at 20% 30%, #a08060 0%, transparent 30%), radial-gradient(circle at 70% 60%, #6b4f2a 0%, transparent 25%), radial-gradient(circle at 40% 80%, #9a7250 0%, transparent 20%)',
        borderColor: '#3d2614',
        maxHeight: '70vh',
      }}
    >
      {/* 公告板顶部红色横栏 */}
      <div
        className="flex items-center justify-between px-3 py-1 mb-2 border"
        style={{
          background: 'linear-gradient(180deg, #8b1f1f, #5c0f0f)',
          borderColor: '#0a0806',
          color: '#fce8e8',
        }}
      >
        <h3 className="text-sm font-bold">📌 {title}</h3>
        <CloseBtn onClose={onClose} variant="light" />
      </div>
      <div className="overflow-y-auto" style={{ maxHeight: 'calc(70vh - 60px)' }}>
        {children}
      </div>
    </div>
  )
}
