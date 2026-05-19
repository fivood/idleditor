import type { CSSProperties, ReactNode } from 'react'
import { useEffect, useState } from 'react'

/**
 * 像素文字按钮。
 *
 * v2.6.1：架构切换为「CSS 9-slice 像素画框」+ 8-bit CSS 兜底。
 *  · 每个 variant 对应一张 16×16 px 的 9-slice 按钮 PNG（位于 public/ui/button-{variant}.png）。
 *  · PNG 缺失时自动降级为原来的 CSS 立体凸起样式——所有 16 处调用零改动。
 *  · 画框规格：见 public/ui/README.md「按钮画框」段。
 *
 * variant：
 *  - default 灰色硬质塑料按钮（OK / 取消 / 常规交互）
 *  - primary 铜色（"审稿""提交"等主 CTA）
 *  - danger 暗红（退稿、撤销等破坏性操作）
 */
type ButtonVariant = 'default' | 'primary' | 'danger'

interface PixelTextButtonProps {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  variant?: ButtonVariant
  /** small (px 6/4) / md (px 10/6) / lg (px 14/8) */
  size?: 'sm' | 'md' | 'lg'
  className?: string
  style?: CSSProperties
  type?: 'button' | 'submit'
  title?: string
}

// 兜底配色（PNG 缺失时回到 CSS 立体凸起样式）
const PALETTE: Record<ButtonVariant, {
  bg: string
  highlight: string
  shadow: string
  border: string
  text: string
  textShadow: string
}> = {
  default: { bg: '#a8a8a8', highlight: '#e0e0e0', shadow: '#5a5a5a', border: '#0a0a0a', text: '#1a1a1a', textShadow: '#e0e0e0' },
  primary: { bg: '#b8763b', highlight: '#f5d878', shadow: '#5c3a1f', border: '#0a0806', text: '#1a0e08', textShadow: '#f5d878' },
  danger:  { bg: '#a04030', highlight: '#d46060', shadow: '#5c1818', border: '#0a0606', text: '#fce8e8', textShadow: '#3a0808' },
}

/** v2.6.6: 按钮像素放大倍率——与场景 PNG 拉伸后的颗粒感对齐。 */
const BUTTON_PIXEL_SCALE = 2

interface ButtonFrameSpec {
  /** 每张切片 PNG 的像素尺寸（默认 16）。 */
  slice: number
}

const BUTTON_FRAMES: Record<ButtonVariant, ButtonFrameSpec> = {
  default: { slice: 16 },
  primary: { slice: 16 },
  danger:  { slice: 16 },
}

// 与 ScenePanel 共享同一套 9-slice 拼图位置定义
const BUTTON_SLICE_GRID: Array<{ suffix: string; col: number; row: number }> = [
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

/** 把 9 张独立切片拼成单张 dataURL，喂给 border-image。 */
function composeButton9Slice(variant: ButtonVariant, slice: number): Promise<string | null> {
  const base = `/ui/button-${variant}`
  return new Promise(resolve => {
    const imgs = BUTTON_SLICE_GRID.map(({ suffix }) => {
      const img = new Image()
      img.src = `${base}-${suffix}.png`
      return img
    })
    let loaded = 0
    let failed = false
    imgs.forEach(img => {
      img.onload = () => {
        loaded++
        if (failed || loaded !== BUTTON_SLICE_GRID.length) return
        const canvas = document.createElement('canvas')
        canvas.width = slice * 3
        canvas.height = slice * 3
        const ctx = canvas.getContext('2d')
        if (!ctx) { resolve(null); return }
        ctx.imageSmoothingEnabled = false
        BUTTON_SLICE_GRID.forEach(({ col, row }, i) => {
          ctx.drawImage(imgs[i], col * slice, row * slice, slice, slice)
        })
        resolve(canvas.toDataURL('image/png'))
      }
      img.onerror = () => {
        if (failed) return
        failed = true
        resolve(null)
      }
    })
  })
}

const SIZE: Record<NonNullable<PixelTextButtonProps['size']>, { padX: number; padY: number; font: string; bevel: number }> = {
  sm: { padX: 8,  padY: 3, font: '11px', bevel: 1 },
  md: { padX: 12, padY: 5, font: '13px', bevel: 2 },
  lg: { padX: 18, padY: 7, font: '15px', bevel: 2 },
}

// Canvas 拼接缓存：每个 variant 一份拼好的 dataURL（或 null = 缺图走兜底）
const composedFrameCache = new Map<ButtonVariant, string | null>()
function useButtonFrame(variant: ButtonVariant, slice: number): string | null {
  const cached = composedFrameCache.get(variant)
  const [dataUrl, setDataUrl] = useState<string | null>(cached ?? null)
  useEffect(() => {
    if (composedFrameCache.has(variant)) return
    composeButton9Slice(variant, slice).then(url => {
      composedFrameCache.set(variant, url)
      setDataUrl(url)
    })
  }, [variant, slice])
  return dataUrl
}

export function PixelTextButton({
  children,
  onClick,
  disabled,
  variant = 'default',
  size = 'md',
  className = '',
  style = {},
  type = 'button',
  title,
}: PixelTextButtonProps) {
  const c = PALETTE[variant]
  const s = SIZE[size]
  const spec = BUTTON_FRAMES[variant]
  const [hover, setHover] = useState(false)
  const frameDataUrl = useButtonFrame(variant, spec.slice)
  const hasFrame = frameDataUrl !== null

  // 9-切片模式：Canvas 拼好的 dataURL → border-image。区域不重叠，
  //              透明像素只露出元素背后。hover 提亮 / active 1px 下沉。
  // 兜底模式：保留 inset bevel + outer drop shadow，行为完全一致。
  const buttonStyle: CSSProperties = hasFrame
    ? {
        padding: `${s.padY}px ${s.padX}px`,
        fontSize: s.font,
        color: c.text,
        borderStyle: 'solid',
        borderColor: 'transparent',
        // border-width = slice × scale → 切片被放大 N 倍渲染，与场景颗粒感一致
        borderWidth: spec.slice * BUTTON_PIXEL_SCALE,
        borderImageSource: `url('${frameDataUrl}')`,
        borderImageSlice: `${spec.slice} fill`,
        borderImageRepeat: 'repeat',
        backgroundColor: 'transparent',
        textShadow: `
          1px 0 0 ${c.textShadow},
          -1px 0 0 ${c.textShadow},
          0 1px 0 ${c.textShadow},
          0 -1px 0 ${c.textShadow}
        `,
        imageRendering: 'pixelated',
        letterSpacing: '0.5px',
        filter: hover && !disabled ? 'brightness(1.1)' : undefined,
        ...style,
      }
    : {
        padding: `${s.padY}px ${s.padX}px`,
        fontSize: s.font,
        color: c.text,
        background: c.bg,
        border: `${s.bevel}px solid ${c.border}`,
        boxShadow: `
          inset ${s.bevel}px ${s.bevel}px 0 0 ${c.highlight},
          inset -${s.bevel}px -${s.bevel}px 0 0 ${c.shadow},
          ${s.bevel}px ${s.bevel}px 0 0 ${c.border}
        `,
        textShadow: `
          1px 0 0 ${c.textShadow},
          -1px 0 0 ${c.textShadow},
          0 1px 0 ${c.textShadow},
          0 -1px 0 ${c.textShadow}
        `,
        imageRendering: 'pixelated',
        letterSpacing: '0.5px',
        ...style,
      }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={`relative font-mono font-bold cursor-pointer select-none transition-none active:translate-x-[1px] active:translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      style={buttonStyle}
    >
      <span style={{ position: 'relative', zIndex: 1 }}>{children}</span>
    </button>
  )
}
