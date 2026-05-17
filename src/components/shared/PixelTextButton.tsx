import type { CSSProperties, ReactNode } from 'react'

/**
 * 像素文字按钮：经典 8-bit 立体凸起样式。
 *
 * 外观：
 * - 顶/左两侧高光带（亮灰）
 * - 底/右两侧阴影带（深灰/黑）
 * - 主体灰色填充
 * - 黑色外描边
 * - 文字黑色描边
 *
 * 按下时：bevel 反转 + 1px 下沉，模拟物理按下感。
 *
 * variant：
 * - default 灰色硬质塑料按钮（用于 OK/取消/确认/常规交互）
 * - primary 铜色（用于主要 CTA，如"审稿""提交"）
 * - danger 暗红（用于退稿、撤销等破坏性操作）
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

// 调色板（参考用户图片的灰色 8-bit 风格）
const PALETTE: Record<ButtonVariant, {
  bg: string         // 主体
  highlight: string  // 顶/左高光
  shadow: string     // 底/右阴影
  border: string     // 外描边
  text: string       // 文字
  textShadow: string // 文字描边
}> = {
  default: {
    bg: '#a8a8a8',
    highlight: '#e0e0e0',
    shadow: '#5a5a5a',
    border: '#0a0a0a',
    text: '#1a1a1a',
    textShadow: '#e0e0e0',
  },
  primary: {
    bg: '#b8763b',
    highlight: '#f5d878',
    shadow: '#5c3a1f',
    border: '#0a0806',
    text: '#1a0e08',
    textShadow: '#f5d878',
  },
  danger: {
    bg: '#a04030',
    highlight: '#d46060',
    shadow: '#5c1818',
    border: '#0a0606',
    text: '#fce8e8',
    textShadow: '#3a0808',
  },
}

const SIZE: Record<NonNullable<PixelTextButtonProps['size']>, { padX: number; padY: number; font: string; bevel: number }> = {
  sm: { padX: 8,  padY: 3, font: '11px', bevel: 1 },
  md: { padX: 12, padY: 5, font: '13px', bevel: 2 },
  lg: { padX: 18, padY: 7, font: '15px', bevel: 2 },
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

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`relative font-mono font-bold cursor-pointer select-none transition-none active:translate-x-[1px] active:translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      style={{
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
      }}
    >
      <span style={{ position: 'relative', zIndex: 1 }}>{children}</span>
    </button>
  )
}
