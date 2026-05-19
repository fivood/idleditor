import type { CSSProperties, ReactNode } from 'react'
import { useEffect, useState } from 'react'

/**
 * 场景内弹出面板。
 *
 * v2.6.1：架构切换为「CSS 9-slice 像素画框」+ 纯色兜底。
 *  · 每个 variant 对应一张可平铺的画框 PNG（位于 public/ui/panel-{variant}.png）。
 *  · 画框规格见 public/ui/README.md：推荐 48×48，四角 16×16 + 四边可平铺 16×16
 *    + 中央 16×16 平铺，整数倍放大后任何分辨率都保持锐利。
 *  · 当 PNG 缺失时自动降级为该 variant 的纯色背景（仍可用，只是没有手绘画框）。
 *
 * variant 含义（视觉层面，PNG 决定实际外观）：
 *  - paper:   通用纸张面板
 *  - inbox:   木质收件托盘（投稿池）
 *  - belt:    铁质流水线带（编辑流水线）
 *  - journal: 翻开的羊皮日记（出版日志 / 档案）
 *  - scroll:  展开的卷轴（猫详情 / 秘密事项）
 *  - notice:  软木公告板（征稿 / 公告）
 */
type PanelVariant = 'paper' | 'inbox' | 'belt' | 'journal' | 'scroll' | 'notice'

interface ScenePanelProps {
  title: string
  onClose: () => void
  children: ReactNode
  position?: string
  /** 桌面端最大宽度（窄屏会按视口自动收缩）。默认 640。 */
  width?: number
  variant?: PanelVariant
}

interface VariantSpec {
  /** 画框 PNG 路径。文件不存在时自动降级为 fallbackBg 纯色。 */
  src: string
  /** border-image-slice 数值，同时作为 border 宽度。常用 16（48×48 画框）/ 12（32×32 紧凑）。 */
  slice: number
  /** 平铺策略：repeat 等距平铺 / round 整数倍缩放 / space 留缝平铺 / stretch 拉伸。
   *  像素风优先 repeat 或 round——切勿用 stretch（会模糊）。 */
  repeat: 'repeat' | 'round' | 'space' | 'stretch'
  /** 兜底背景色（PNG 还没画 / 加载失败时露出来；也作为内容背景） */
  fallbackBg: string
  /** 标题文字色 */
  titleColor: string
  /** 正文文字色 */
  textColor: string
  /** 顶栏分割线色 */
  dividerColor: string
  /** 标题前小图标（emoji 或留空） */
  titleIcon?: string
}

// ⬇️ 画师 (你) 之后画好 PNG 放到 public/ui/ 即自动接管。文件不存在时仍可玩。
const PANEL_VARIANTS: Record<PanelVariant, VariantSpec> = {
  paper:   { src: '/ui/panel-paper.png',   slice: 16, repeat: 'repeat', fallbackBg: '#2a1810', titleColor: '#f5d878', textColor: '#ede0c8', dividerColor: '#5c3a1f' },
  inbox:   { src: '/ui/panel-inbox.png',   slice: 16, repeat: 'repeat', fallbackBg: '#4a2f18', titleColor: '#f5d878', textColor: '#ede0c8', dividerColor: '#5c3a1f', titleIcon: '📥' },
  belt:    { src: '/ui/panel-belt.png',    slice: 16, repeat: 'repeat', fallbackBg: '#2a1810', titleColor: '#d4a85a', textColor: '#ede0c8', dividerColor: '#4a3728', titleIcon: '⚙' },
  journal: { src: '/ui/panel-journal.png', slice: 16, repeat: 'repeat', fallbackBg: '#3a2412', titleColor: '#f5d878', textColor: '#ede0c8', dividerColor: '#5c3a1f', titleIcon: '📖' },
  scroll:  { src: '/ui/panel-scroll.png',  slice: 16, repeat: 'repeat', fallbackBg: '#3a2418', titleColor: '#f5d878', textColor: '#ede0c8', dividerColor: '#5c3a1f' },
  notice:  { src: '/ui/panel-notice.png',  slice: 16, repeat: 'repeat', fallbackBg: '#8b6b3e', titleColor: '#fce8e8', textColor: '#1a0e08', dividerColor: '#5c3a1f', titleIcon: '📌' },
}

/** 用 Image() 探测 PNG 是否存在；存在 → 启用 border-image。否则纯色兜底。
 *  每个 variant 探测一次后用 module-level 缓存，避免每次开 panel 都重测。 */
const variantAvailability = new Map<PanelVariant, boolean>()
function useVariantHasFrame(variant: PanelVariant, src: string): boolean {
  const cached = variantAvailability.get(variant)
  const [available, setAvailable] = useState<boolean>(cached ?? false)
  useEffect(() => {
    if (cached !== undefined) return
    const img = new Image()
    img.onload = () => { variantAvailability.set(variant, true); setAvailable(true) }
    img.onerror = () => { variantAvailability.set(variant, false); setAvailable(false) }
    img.src = src
  }, [variant, src, cached])
  return available
}

export function ScenePanel({
  title,
  onClose,
  children,
  position = 'top-16 left-16',
  width = 640,
  variant = 'paper',
}: ScenePanelProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const spec = PANEL_VARIANTS[variant]
  const hasFrame = useVariantHasFrame(variant, spec.src)

  // 9-slice 模式：用 border-image；像素整数倍放大；shadow 用 box-shadow 不会糊。
  const frameStyle: CSSProperties = hasFrame
    ? {
        borderStyle: 'solid',
        borderColor: 'transparent',
        borderWidth: spec.slice,
        borderImageSource: `url('${spec.src}')`,
        borderImageSlice: `${spec.slice} fill`,
        borderImageRepeat: spec.repeat,
        backgroundColor: spec.fallbackBg,  // 防止 fill 区透明时穿底
        color: spec.textColor,
        imageRendering: 'pixelated',
        boxShadow: '4px 4px 0 #0a0806',
        maxHeight: '72vh',
        overflow: 'hidden',
      }
    : {
        // 降级：纯色 + 黑边 + 像素阴影。仍是可用 UI，只是没有手绘画框。
        border: '2px solid #0a0806',
        backgroundColor: spec.fallbackBg,
        color: spec.textColor,
        boxShadow: '4px 4px 0 #0a0806',
        maxHeight: '72vh',
        overflow: 'hidden',
      }

  // 内容区 padding 在 9-slice 模式下取 max(8, slice/2)；
  // 兜底模式直接用 12/16。
  const contentPad = hasFrame ? Math.max(8, Math.round(spec.slice / 2)) : 12
  const titleBarPad = hasFrame ? Math.max(6, Math.round(spec.slice / 2)) : 8

  return (
    <div
      className={`absolute z-40 ${position}`}
      style={{ maxWidth: `min(${width}px, calc(100vw - 32px))` }}
      role="dialog"
      aria-label={title}
    >
      <div className="font-mono" style={frameStyle}>
        {/* 标题栏：纯 HTML，不参与 9-slice。让画师专注画框；标题文字由 CSS 字体渲染保持清晰。 */}
        <div
          className="flex items-center justify-between"
          style={{
            padding: `${titleBarPad}px ${contentPad}px`,
            borderBottom: `1px solid ${spec.dividerColor}`,
          }}
        >
          <h3 className="text-sm md:text-base font-bold truncate" style={{ color: spec.titleColor }}>
            {spec.titleIcon && <span className="mr-1">{spec.titleIcon}</span>}
            {title}
          </h3>
          <CloseBtn onClose={onClose} hoverColor={spec.titleColor} />
        </div>
        {/* 内容区 */}
        <div
          className="overflow-y-auto"
          style={{
            padding: contentPad,
            maxHeight: `calc(72vh - ${titleBarPad * 2 + 24}px)`,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

function CloseBtn({ onClose, hoverColor }: { onClose: () => void; hoverColor: string }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      onClick={onClose}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      aria-label="关闭"
      className="text-lg leading-none cursor-pointer ml-2 transition-colors"
      style={{ color: hover ? hoverColor : '#b8a48a' }}
    >
      ✕
    </button>
  )
}
