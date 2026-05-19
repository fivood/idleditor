import type { ReactNode } from 'react'
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

/**
 * v2.6.6: 像素放大倍率。
 * 场景 PNG（desk-bg 320×180 等）被拉伸到屏幕大小，等效放大 3-4×。
 * 弹窗 PNG 用 border-image 时，border-width = slice × scale，浏览器会
 * 用 nearest-neighbor 把切片放大 N 倍渲染，让 UI 与场景颗粒感统一。
 * 数值可以独立调：标题栏 + 按钮通常用更小的倍数。
 */
const PANEL_PIXEL_SCALE = 2
const TITLEBAR_PIXEL_SCALE = 2
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

/** 9-slice 拼图位置（按 3×3 网格） */
const SLICE_GRID: Array<{ suffix: string; col: number; row: number }> = [
  { suffix: 'tl',     col: 0, row: 0 },
  { suffix: 't-edge', col: 1, row: 0 },
  { suffix: 'tr',     col: 2, row: 0 },
  { suffix: 'l-edge', col: 0, row: 1 },
  { suffix: 'center', col: 1, row: 1 },
  { suffix: 'r-edge', col: 2, row: 1 },
  { suffix: 'bl',     col: 0, row: 2 },
  { suffix: 'b-edge', col: 1, row: 2 },
  { suffix: 'br',     col: 2, row: 2 },
]

/** 把 9 张独立切片 PNG 拼成一张 (slice×3)×(slice×3) 的大图（dataURL）。
 *  这样喂给 CSS border-image 才能拿到真正的 9-slice 行为——
 *  四角的透明像素只露出"元素背后"，而不是被另一张图填上。
 *  失败（任一切片 404）返回 null；调用方据此走兜底色。 */
function composeNineSliceDataUrl(basePath: string, slice: number): Promise<string | null> {
  return new Promise(resolve => {
    const imgs = SLICE_GRID.map(({ suffix }) => {
      const img = new Image()
      img.src = `${basePath}-${suffix}.png`
      return img
    })
    let loaded = 0
    let failed = false
    const settle = () => {
      if (failed) return
      const canvas = document.createElement('canvas')
      canvas.width = slice * 3
      canvas.height = slice * 3
      const ctx = canvas.getContext('2d')
      if (!ctx) { resolve(null); return }
      // 关闭图像平滑，保持像素清晰
      ctx.imageSmoothingEnabled = false
      SLICE_GRID.forEach(({ col, row }, i) => {
        ctx.drawImage(imgs[i], col * slice, row * slice, slice, slice)
      })
      resolve(canvas.toDataURL('image/png'))
    }
    imgs.forEach(img => {
      img.onload = () => {
        loaded++
        if (loaded === SLICE_GRID.length) settle()
      }
      img.onerror = () => {
        if (failed) return
        failed = true
        resolve(null)
      }
    })
  })
}

/** 缓存：每个 (kind, variant) 对应一张拼好的 dataURL（或 null = 缺图）。 */
const composedCache = new Map<string, string | null>()
function useComposedFrame(kind: string, variant: string, basePath: string, slice: number): string | null {
  const key = `${kind}:${variant}`
  const cached = composedCache.get(key)
  const [dataUrl, setDataUrl] = useState<string | null>(cached ?? null)
  useEffect(() => {
    if (composedCache.has(key)) return
    composeNineSliceDataUrl(basePath, slice).then(url => {
      composedCache.set(key, url)
      setDataUrl(url)
    })
  }, [key, basePath, slice])
  return dataUrl
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
  // v2.6.5: 用 Canvas 把 9 张切片拼成单张 dataURL → 给 border-image
  //          → 真正的 9-slice 行为（区域不重叠，透明像素只露出元素背后）
  const panelDataUrl = useComposedFrame('panel', variant, `/ui/panel-${variant}`, spec.slice)
  const titleBarDataUrl = useComposedFrame('titlebar', variant, `/ui/titlebar-${variant}`, titleBarSpec.slice)
  const hasFrame = panelDataUrl !== null
  const hasTitleBar = titleBarDataUrl !== null

  const panelBorder = spec.slice * PANEL_PIXEL_SCALE
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
              borderImageRepeat: 'repeat',
              imageRendering: 'pixelated',
              pointerEvents: 'none',
            }}
          />
        )}

        {/* ── 内容层（浮在画框上） ── */}
        <div className="relative" style={{ padding: contentInset }}>
          {/* 标题栏 */}
          <div
            className="flex items-center justify-between"
            style={
              hasTitleBar
                ? {
                    borderStyle: 'solid',
                    borderColor: 'transparent',
                    borderWidth: titleBarSpec.slice * TITLEBAR_PIXEL_SCALE,
                    borderImageSource: `url('${titleBarDataUrl}')`,
                    borderImageSlice: `${titleBarSpec.slice} fill`,
                    borderImageRepeat: 'repeat',
                    padding: 0,
                    imageRendering: 'pixelated',
                  }
                : {
                    padding: `${titleBarPad}px ${contentInset}px`,
                    margin: `-${contentInset}px -${contentInset}px 0`,
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

          {/* 正文 */}
          <div
            className="overflow-y-auto"
            style={{
              paddingTop: titleBarPad * 2,
              maxHeight: `calc(72vh - ${titleBarPad * 2 + contentInset * 2 + 24}px)`,
            }}
          >
            {children}
          </div>
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
