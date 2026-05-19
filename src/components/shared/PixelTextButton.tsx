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

interface ButtonFrameSpec {
  /** 每张切片 PNG 的像素尺寸（默认 16）。 */
  slice: number
}

const BUTTON_FRAMES: Record<ButtonVariant, ButtonFrameSpec> = {
  default: { slice: 16 },
  primary: { slice: 16 },
  danger:  { slice: 16 },
}

/** 与 ScenePanel 同款：9 张切片 PNG 平铺组合 */
function buildButtonBackground(variant: ButtonVariant, slice: number): string {
  const base = `/ui/button-${variant}`
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

const SIZE: Record<NonNullable<PixelTextButtonProps['size']>, { padX: number; padY: number; font: string; bevel: number }> = {
  sm: { padX: 8,  padY: 3, font: '11px', bevel: 1 },
  md: { padX: 12, padY: 5, font: '13px', bevel: 2 },
  lg: { padX: 18, padY: 7, font: '15px', bevel: 2 },
}

// PNG 可用性探测：用 center.png 作为"9 张是否齐全"的代表。
const frameAvailability = new Map<ButtonVariant, boolean>()
function useButtonFrame(variant: ButtonVariant): boolean {
  const cached = frameAvailability.get(variant)
  const [available, setAvailable] = useState<boolean>(cached ?? false)
  const src = `/ui/button-${variant}-center.png`
  useEffect(() => {
    if (cached !== undefined) return
    const img = new Image()
    img.onload = () => { frameAvailability.set(variant, true); setAvailable(true) }
    img.onerror = () => { frameAvailability.set(variant, false); setAvailable(false) }
    img.src = src
  }, [variant, src, cached])
  return available
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
  const hasFrame = useButtonFrame(variant)

  // 9-切片模式：用 9 张独立 PNG 通过 CSS 多层背景叠加。
  //              hover 提亮 / active 1px 下沉。
  // 兜底模式：保留 inset bevel + outer drop shadow，行为完全一致。
  const buttonStyle: CSSProperties = hasFrame
    ? {
        padding: `${Math.max(s.padY, spec.slice / 2)}px ${Math.max(s.padX, spec.slice)}px`,
        fontSize: s.font,
        color: c.text,
        background: buildButtonBackground(variant, spec.slice),
        textShadow: `
          1px 0 0 ${c.textShadow},
          -1px 0 0 ${c.textShadow},
          0 1px 0 ${c.textShadow},
          0 -1px 0 ${c.textShadow}
        `,
        imageRendering: 'pixelated',
        letterSpacing: '0.5px',
        border: 'none',
        // hover / active 微反馈（不会破坏像素画框，因为只是滤镜）
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
