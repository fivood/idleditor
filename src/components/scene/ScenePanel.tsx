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
  /** 切片像素尺寸——画师每张独立 PNG 的尺寸（48×48 对应 slice=48）。 */
  slice: number
  /** 兜底背景色（9 张切片任一缺失时露出） */
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

// ⬇️ 画师 (你) 之后画好 9 张切片 PNG 放到 public/ui/ 即自动接管。
// 命名约定：panel-{variant}-{tl,t-edge,tr,l-edge,center,r-edge,bl,b-edge,br}.png
// 9 张全部存在 → 启用 9-切片平铺；任一缺失 → 退回 fallbackBg 纯色 + 黑边。
const PANEL_VARIANTS: Record<PanelVariant, VariantSpec> = {
  // paper: 浅色像素纸（用户上传），需要深色文字才能看清
  paper:   { slice: 48, fallbackBg: '#e8d8b0', titleColor: '#2a1810', textColor: '#3a2412', dividerColor: '#8a7a5a' },
  // 以下 5 个 variant 暂未交付 PNG，仍是深色兜底 + 浅色文字
  inbox:   { slice: 48, fallbackBg: '#4a2f18', titleColor: '#f5d878', textColor: '#ede0c8', dividerColor: '#5c3a1f', titleIcon: '📥' },
  belt:    { slice: 48, fallbackBg: '#2a1810', titleColor: '#d4a85a', textColor: '#ede0c8', dividerColor: '#4a3728', titleIcon: '⚙' },
  journal: { slice: 48, fallbackBg: '#3a2412', titleColor: '#f5d878', textColor: '#ede0c8', dividerColor: '#5c3a1f', titleIcon: '📖' },
  scroll:  { slice: 48, fallbackBg: '#3a2418', titleColor: '#f5d878', textColor: '#ede0c8', dividerColor: '#5c3a1f' },
  notice:  { slice: 48, fallbackBg: '#8b6b3e', titleColor: '#fce8e8', textColor: '#1a0e08', dividerColor: '#5c3a1f', titleIcon: '📌' },
}

/** 9-切片组合的 CSS background：4 角固定 + 4 边平铺 + 1 中心填充。
 *  第一张图在最上层，corners 覆盖 edges 在拐角处的多余像素，edges 覆盖 center。 */
function buildPanelBackground(variant: PanelVariant, slice: number): string {
  const base = `/ui/panel-${variant}`
  return [
    `url('${base}-tl.png')     0     0     / ${slice}px ${slice}px no-repeat`,
    `url('${base}-tr.png')     100%  0     / ${slice}px ${slice}px no-repeat`,
    `url('${base}-bl.png')     0     100%  / ${slice}px ${slice}px no-repeat`,
    `url('${base}-br.png')     100%  100%  / ${slice}px ${slice}px no-repeat`,
    `url('${base}-t-edge.png') 0     0     / ${slice}px ${slice}px repeat-x`,
    `url('${base}-b-edge.png') 0     100%  / ${slice}px ${slice}px repeat-x`,
    `url('${base}-l-edge.png') 0     0     / ${slice}px ${slice}px repeat-y`,
    `url('${base}-r-edge.png') 100%  0     / ${slice}px ${slice}px repeat-y`,
    `url('${base}-center.png') 0     0     / ${slice}px ${slice}px repeat`,
  ].join(', ')
}

/** v2.6.2: 标题栏走独立 9-切片 PNG（命名同 panel，只是前缀 titlebar-{variant}-{slice}.png）。
 *  画师选择性提供：不画就用变体的 dividerColor 横条样式。 */
interface TitleBarSpec {
  /** 标题栏切片像素尺寸（默认 16，画师如果用 24 改这里）。 */
  slice: number
}
const TITLEBAR_VARIANTS: Record<PanelVariant, TitleBarSpec> = {
  paper:   { slice: 16 },
  inbox:   { slice: 16 },
  belt:    { slice: 16 },
  journal: { slice: 16 },
  scroll:  { slice: 16 },
  notice:  { slice: 16 },
}

function buildTitleBarBackground(variant: PanelVariant, slice: number): string {
  const base = `/ui/titlebar-${variant}`
  return [
    `url('${base}-tl.png')     0     0     / ${slice}px ${slice}px no-repeat`,
    `url('${base}-tr.png')     100%  0     / ${slice}px ${slice}px no-repeat`,
    `url('${base}-bl.png')     0     100%  / ${slice}px ${slice}px no-repeat`,
    `url('${base}-br.png')     100%  100%  / ${slice}px ${slice}px no-repeat`,
    `url('${base}-t-edge.png') 0     0     / ${slice}px ${slice}px repeat-x`,
    `url('${base}-b-edge.png') 0     100%  / ${slice}px ${slice}px repeat-x`,
    `url('${base}-l-edge.png') 0     0     / ${slice}px ${slice}px repeat-y`,
    `url('${base}-r-edge.png') 100%  0     / ${slice}px ${slice}px repeat-y`,
    `url('${base}-center.png') 0     0     / ${slice}px ${slice}px repeat`,
  ].join(', ')
}

/** 通用 PNG 可用性探测 hook：传 key + src，返回 image 是否加载成功。
 *  键名隔离让 panel/titlebar 互不串扰；缓存避免每次开窗重测。 */
const pngAvailability = new Map<string, boolean>()
function usePngAvailable(key: string, src: string): boolean {
  const cached = pngAvailability.get(key)
  const [available, setAvailable] = useState<boolean>(cached ?? false)
  useEffect(() => {
    if (cached !== undefined) return
    const img = new Image()
    img.onload = () => { pngAvailability.set(key, true); setAvailable(true) }
    img.onerror = () => { pngAvailability.set(key, false); setAvailable(false) }
    img.src = src
  }, [key, src, cached])
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
  const titleBarSpec = TITLEBAR_VARIANTS[variant]
  // 用 center.png 作为"9 张是否齐全"的代表（最后画的那张大概率是 center）
  const hasFrame = usePngAvailable(`panel:${variant}`, `/ui/panel-${variant}-center.png`)
  const hasTitleBar = usePngAvailable(`titlebar:${variant}`, `/ui/titlebar-${variant}-center.png`)

  // 9-切片背景叠加：corners 在最上层 → edges → center 在最底。整个面板的内边距 = slice，
  // 让标题栏 + 内容只在中央可平铺区出现，不会盖到边框纹理。
  // v2.6.4: 移除所有黑色外框 / 阴影——画框 PNG 已自带边缘，描边反而破坏像素感。
  const frameStyle: CSSProperties = hasFrame
    ? {
        background: buildPanelBackground(variant, spec.slice),
        padding: spec.slice,
        color: spec.textColor,
        imageRendering: 'pixelated',
        maxHeight: '72vh',
        overflow: 'hidden',
      }
    : {
        // 降级：纯色背景 + 无边框无阴影
        backgroundColor: spec.fallbackBg,
        color: spec.textColor,
        maxHeight: '72vh',
        overflow: 'hidden',
      }

  // 内容区 padding 在 9-切片模式下：外层已留出 slice，内部用较小 padding；兜底模式用 12/8
  const contentPad = hasFrame ? 8 : 12
  const titleBarPad = hasFrame ? 6 : 8

  return (
    <div
      className={`absolute z-40 ${position}`}
      style={{ maxWidth: `min(${width}px, calc(100vw - 32px))` }}
      role="dialog"
      aria-label={title}
    >
      <div className="font-mono" style={frameStyle}>
        {/* 标题栏：可选 9-切片 PNG。画了 → 用 9 张切片背景；没画 → 退回色块 + 底分割线。
            标题文字本身始终是 HTML 渲染，保证 CJK 像素字体清晰。 */}
        <div
          className="flex items-center justify-between"
          style={
            hasTitleBar
              ? {
                  background: buildTitleBarBackground(variant, titleBarSpec.slice),
                  padding: `${Math.max(titleBarSpec.slice / 2, titleBarPad)}px ${titleBarSpec.slice}px`,
                  imageRendering: 'pixelated',
                }
              : {
                  padding: `${titleBarPad}px ${contentPad}px`,
                  borderBottom: `1px solid ${spec.dividerColor}`,
                }
          }
        >
          <h3 className="text-sm md:text-base font-bold truncate" style={{ color: spec.titleColor }}>
            {spec.titleIcon && <span className="mr-1">{spec.titleIcon}</span>}
            {title}
          </h3>
          <CloseBtn onClose={onClose} defaultColor={spec.textColor} hoverColor={spec.titleColor} />
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

function CloseBtn({ onClose, defaultColor, hoverColor }: { onClose: () => void; defaultColor: string; hoverColor: string }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      onClick={onClose}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      aria-label="关闭"
      className="text-lg leading-none cursor-pointer ml-2 transition-colors"
      style={{ color: hover ? hoverColor : defaultColor }}
    >
      ✕
    </button>
  )
}
