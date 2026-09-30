import type { CSSProperties, ReactNode } from 'react'

/**
 * 像素文字按钮：九宫格像素框（src/art/ui.ts 绘制，样式见 index.css 的 .px-btn）。
 *
 * variant：
 * - default 铁灰（常规交互：OK / 取消 / 确认）
 * - primary 黄铜（主要操作：审稿、提交）
 * - danger  红漆（退稿、撤销等破坏性操作）
 *
 * 悬停提亮、按下时斜面反转并下沉 1px。
 */
type ButtonVariant = 'default' | 'primary' | 'danger'

interface PixelTextButtonProps {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  variant?: ButtonVariant
  /** small / md / lg */
  size?: 'sm' | 'md' | 'lg'
  className?: string
  style?: CSSProperties
  type?: 'button' | 'submit'
  title?: string
}

const TONE: Record<ButtonVariant, string> = { default: 'px-btn--iron', primary: '', danger: 'px-btn--lacquer' }
const SIZE: Record<NonNullable<PixelTextButtonProps['size']>, { pad: string; font: string }> = {
  sm: { pad: '1px 4px', font: '11px' },
  md: { pad: '2px 7px', font: '13px' },
  lg: { pad: '4px 12px', font: '15px' },
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
  const s = SIZE[size]
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`px-btn ${TONE[variant]} relative font-mono font-bold select-none ${className}`}
      style={{ padding: s.pad, fontSize: s.font, letterSpacing: '0.5px', ...style }}
    >
      <span style={{ position: 'relative', zIndex: 1 }}>{children}</span>
    </button>
  )
}
