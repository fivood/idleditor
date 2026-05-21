import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { useComposedFrame } from '@/utils/composeNineSlice'

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
  /** v2.6.9: 内层底图变体（可选）。指定后内容区域会用该 variant 的 9 切片做内框背景。
   *  典型用法：外层 variant="paper" + innerVariant="inbox"，让 paper 弹窗有 inbox 内纹理。 */
  innerVariant?: PanelVariant
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

/**
 * v2.6.6: 像素放大倍率。
 * 场景 PNG（desk-bg 320×180 等）被拉伸到屏幕大小，等效放大 3-4×。
 * 弹窗 PNG 用 border-image 时，border-width = slice × scale，浏览器会
 * 用 nearest-neighbor 把切片放大 N 倍渲染，让 UI 与场景颗粒感统一。
 * 数值可以独立调：标题栏 + 按钮通常用更小的倍数。
 */
const PANEL_PIXEL_SCALE = 2
const TITLEBAR_PIXEL_SCALE = 2
const INNER_PIXEL_SCALE = 2  // 内层底图（如 inbox 嵌入 paper）的放大倍率
/**
 * v2.6.7: 画框可视厚度——内容沿着这个距离从外缘内缩。
 * 画框 PNG 全宽 = 48 × 2 = 96px（每边），但视觉上"装饰边缘"通常只占 PNG
 * 内侧的几像素；剩下大半是可平铺的纸张纹理。让内容仅内缩到"装饰边缘
 * 之后"，剩余画框区域（纸张纹理部分）则被内容覆盖——形成"内容铺在纸
 * 面上"的视觉，而不是"内容被画框挤到中央"。
 *
 * 数值 < panelBorder (96) → 内容向外溢入画框可平铺区。
 * 想看到的层级：从外到内
 *   [0 ~ PANEL_DECOR_INSET]      装饰边缘（不被遮挡）
 *   [PANEL_DECOR_INSET ~ 96]     纸张纹理（被内容覆盖）
 *   [96+]                         画框本身已结束
 */
const PANEL_DECOR_INSET = 20
// BUTTON_PIXEL_SCALE 在 PixelTextButton.tsx 内独立定义，不需要这里重复

// ⬇️ 画师 (你) 之后画好 9 张切片 PNG 放到 public/ui/ 即自动接管。
// 命名约定：panel-{variant}-{tl,t-edge,tr,l-edge,center,r-edge,bl,b-edge,br}.png
// 9 张全部存在 → 启用 9-切片平铺；任一缺失 → 退回 fallbackBg 纯色 + 黑边。
// v2.6.15: 画师统一约定单图 96×96，3×3 切片 → 每格 32×32 → slice = 32
const PANEL_VARIANTS: Record<PanelVariant, VariantSpec> = {
  // paper: 浅色像素纸（用户上传），需要深色文字才能看清
  paper:   { slice: 32, fallbackBg: '#e8d8b0', titleColor: '#2a1810', textColor: '#3a2412', dividerColor: '#8a7a5a' },
  inbox:   { slice: 32, fallbackBg: '#4a2f18', titleColor: '#f5d878', textColor: '#ede0c8', dividerColor: '#5c3a1f', titleIcon: '📥' },
  belt:    { slice: 32, fallbackBg: '#2a1810', titleColor: '#d4a85a', textColor: '#ede0c8', dividerColor: '#4a3728', titleIcon: '⚙' },
  journal: { slice: 32, fallbackBg: '#3a2412', titleColor: '#f5d878', textColor: '#ede0c8', dividerColor: '#5c3a1f', titleIcon: '📖' },
  scroll:  { slice: 32, fallbackBg: '#3a2418', titleColor: '#f5d878', textColor: '#ede0c8', dividerColor: '#5c3a1f' },
  notice:  { slice: 32, fallbackBg: '#8b6b3e', titleColor: '#fce8e8', textColor: '#1a0e08', dividerColor: '#5c3a1f', titleIcon: '📌' },
}

/** v2.6.2: 标题栏走独立 9-切片 PNG（命名同 panel，只是前缀 titlebar-{variant}-{slice}.png）。
 *  画师选择性提供：不画就用变体的 dividerColor 横条样式。 */
interface TitleBarSpec {
  /** 标题栏切片像素尺寸（默认 16，画师如果用 24 改这里）。 */
  slice: number
}
// v2.6.15: 同步到 96×96 单图约定（如果画师后续画标题栏的话也是 96×96）
const TITLEBAR_VARIANTS: Record<PanelVariant, TitleBarSpec> = {
  paper:   { slice: 32 },
  inbox:   { slice: 32 },
  belt:    { slice: 32 },
  journal: { slice: 32 },
  scroll:  { slice: 32 },
  notice:  { slice: 32 },
}


export function ScenePanel({
  title,
  onClose,
  children,
  position = 'top-16 left-16',
  width = 640,
  variant = 'paper',
  innerVariant,
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
  // v2.6.5: 用 Canvas 把 9 张切片拼成单张 dataURL → 给 border-image
  //          → 真正的 9-slice 行为（区域不重叠，透明像素只露出元素背后）
  const panelDataUrl = useComposedFrame('panel', variant, `/ui/panel-${variant}`, spec.slice)
  const titleBarDataUrl = useComposedFrame('titlebar', variant, `/ui/titlebar-${variant}`, titleBarSpec.slice)
  // v2.6.9: 内层底图（可选）。Hook 必须无条件调用，缺 innerVariant 时塞个不存在的路径返回 null
  const innerSpec = innerVariant ? PANEL_VARIANTS[innerVariant] : spec
  const innerDataUrl = useComposedFrame(
    'inner',
    innerVariant ?? 'none' as PanelVariant,
    innerVariant ? `/ui/panel-${innerVariant}` : '/ui/__none__',
    innerSpec.slice,
  )
  const hasFrame = panelDataUrl !== null
  const hasTitleBar = titleBarDataUrl !== null
  const hasInner = innerVariant !== undefined && innerDataUrl !== null

  const panelBorder = spec.slice * PANEL_PIXEL_SCALE
  const innerBorder = innerSpec.slice * INNER_PIXEL_SCALE
  // v2.6.7: 画框做绝对定位底层，内容用 PANEL_DECOR_INSET 小内边距浮在上层，
  //          自然覆盖画框中"纸张纹理"区，只让外缘装饰露出来。
  const contentInset = hasFrame ? PANEL_DECOR_INSET : 12
  const titleBarPad = hasFrame ? 6 : 8

  return (
    <div
      className={`absolute z-40 ${position}`}
      style={{ maxWidth: `min(${width}px, calc(100vw - 32px))` }}
      role="dialog"
      aria-label={title}
    >
      <div
        className="font-mono relative"
        style={{
          color: spec.textColor,
          maxHeight: '72vh',
          overflow: 'hidden',
          // 兜底模式（缺图）直接用纯色背景
          backgroundColor: hasFrame ? 'transparent' : spec.fallbackBg,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* ── 画框底层（绝对定位，pointer-events: none） ── */}
        {hasFrame && (
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              borderStyle: 'solid',
              borderColor: 'transparent',
              borderWidth: panelBorder,
              borderImageSource: `url('${panelDataUrl}')`,
              borderImageSlice: `${spec.slice} fill`,
              borderImageRepeat: 'round',
              imageRendering: 'pixelated',
              pointerEvents: 'none',
            }}
          />
        )}

        {/* ── 标题栏：直接做 panel root 的子元素，full-width 不需要负 margin
              叠在画框上层（DOM 后于 frame layer，自动 stacking 在上）── */}
        <div
          className="relative flex items-center justify-between shrink-0"
          style={
            hasTitleBar
              ? {
                  borderStyle: 'solid',
                  borderColor: 'transparent',
                  borderWidth: titleBarSpec.slice * TITLEBAR_PIXEL_SCALE,
                  borderImageSource: `url('${titleBarDataUrl}')`,
                  borderImageSlice: `${titleBarSpec.slice} fill`,
                  borderImageRepeat: 'round',
                  padding: 0,
                  imageRendering: 'pixelated',
                  zIndex: 1,
                }
              : {
                  padding: `${titleBarPad}px ${contentInset}px`,
                  zIndex: 1,
                }
          }
        >
          <h3 className="text-sm md:text-base font-bold truncate" style={{ color: spec.titleColor }}>
            {spec.titleIcon && <span className="mr-1">{spec.titleIcon}</span>}
            {title}
          </h3>
          <CloseBtn onClose={onClose} defaultColor={spec.textColor} hoverColor={spec.titleColor} />
        </div>

        {/* ── 内容区：直接做 panel root 的子元素，独立 padding 控制
              可选 innerVariant 9-切片做内层底图 ── */}
        <div
          className="relative overflow-y-auto"
          style={
            hasInner
              ? {
                  margin: contentInset,
                  marginTop: 0,
                  borderStyle: 'solid',
                  borderColor: 'transparent',
                  borderWidth: innerBorder,
                  borderImageSource: `url('${innerDataUrl}')`,
                  borderImageSlice: `${innerSpec.slice} fill`,
                  borderImageRepeat: 'round',
                  imageRendering: 'pixelated',
                  zIndex: 1,
                  flex: 1,
                  minHeight: 0,
                }
              : {
                  padding: `0 ${contentInset}px ${contentInset}px`,
                  zIndex: 1,
                  flex: 1,
                  minHeight: 0,
                }
          }
        >
          {children}
        </div>
      </div>
    </div>
  )
}

// 探测 btn-close.png 一次（module-level 缓存）
const btnCloseAvailability = { checked: false, has: false }

function CloseBtn({ onClose, defaultColor, hoverColor }: { onClose: () => void; defaultColor: string; hoverColor: string }) {
  const [hover, setHover] = useState(false)
  const [hasPng, setHasPng] = useState(btnCloseAvailability.has)

  useEffect(() => {
    if (btnCloseAvailability.checked) return
    const img = new Image()
    img.onload = () => { btnCloseAvailability.checked = true; btnCloseAvailability.has = true; setHasPng(true) }
    img.onerror = () => { btnCloseAvailability.checked = true; btnCloseAvailability.has = false }
    img.src = '/ui/btn-close.png'
  }, [])

  if (hasPng) {
    return (
      <button
        onClick={onClose}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        aria-label="关闭"
        className="ml-2 cursor-pointer leading-none p-0 border-0 bg-transparent"
      >
        <img
          src={hover ? '/ui/btn-close-hover.png' : '/ui/btn-close.png'}
          alt="关闭"
          width={32}
          height={32}
          draggable={false}
          className="block pointer-events-none select-none"
          style={{ imageRendering: 'pixelated' }}
        />
      </button>
    )
  }

  // 兜底：还是用 ✕ 字符
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
