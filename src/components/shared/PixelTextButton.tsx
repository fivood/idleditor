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
  src: string
  /** border-image-slice 数值，同时也作为 border 宽度。16×16 PNG → slice=4。 */
  slice: number
}

const BUTTON_FRAMES: Record<ButtonVariant, ButtonFrameSpec> = {
  default: { src: '/ui/button-default.png', slice: 4 },
  primary: { src: '/ui/button-primary.png', slice: 4 },
  danger:  { src: '/ui/button-danger.png',  slice: 4 },
}

const SIZE: Record<NonNullable<PixelTextButtonProps['size']>, { padX: number; padY: number; font: string; bevel: number }> = {
  sm: { padX: 8,  padY: 3, font: '11px', bevel: 1 },
  md: { padX: 12, padY: 5, font: '13px', bevel: 2 },
  lg: { padX: 18, padY: 7, font: '15px', bevel: 2 },
}

// PNG 可用性探测：每个 variant 探测一次，缓存到 module-level Map。
const frameAvailability = new Map<ButtonVariant, boolean>()
function useButtonFrame(variant: ButtonVariant, src: string): boolean {
  const cached = frameAvailability.get(variant)
  const [available, setAvailable] = useState<boolean>(cached ?? false)
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
  const hasFrame = useButtonFrame(variant, spec.src)

  // 9-slice 模式：用 border-image + 透明 border 占位。
  //                hover 提亮 / active 1px 下沉。
  // 兜底模式：保留 inset bevel + outer drop shadow，行为完全一致。
  const buttonStyle: CSSProperties = hasFrame
    ? {
        padding: `${s.padY}px ${s.padX}px`,
        fontSize: s.font,
        color: c.text,
        borderStyle: 'solid',
        borderColor: 'transparent',
        borderWidth: spec.slice,
        borderImageSource: `url('${spec.src}')`,
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
