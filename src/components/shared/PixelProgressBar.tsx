import type { CSSProperties } from 'react'

/**
 * 像素风进度条：用方块拼成的条，硬阴影、无圆角、整数像素位移。
 *
 * 与 v2.0 之前圆滑 div + transition 的样式做区分，
 * 强调"出版社的木质打卡机"那种工业感。
 *
 * 颜色用游戏调色板。fill 区域有微妙的内嵌"打孔"暗纹（模拟传送带链条）。
 */
interface PixelProgressBarProps {
  /** 进度百分比 0-100 */
  value: number
  /** 容器宽度（CSS 长度） */
  width?: number | string
  /** 容器高度（像素，建议 6-10 整数） */
  height?: number
  /** 填充色，默认铜色 */
  fillColor?: string
  /** 空白色，默认深木色 */
  bgColor?: string
  /** 边框色，默认黑 */
  borderColor?: string
  /** 类名 */
  className?: string
  /** 内嵌样式 */
  style?: CSSProperties
}

export function PixelProgressBar({
  value,
  width = '100%',
  height = 8,
  fillColor = '#b8763b',
  bgColor = '#2a1810',
  borderColor = '#0a0806',
  className = '',
  style = {},
}: PixelProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value))
  return (
    <div
      className={`relative ${className}`}
      style={{
        width,
        height,
        background: bgColor,
        border: `1px solid ${borderColor}`,
        boxShadow: `inset 1px 1px 0 rgba(0,0,0,0.4)`,
        overflow: 'hidden',
        imageRendering: 'pixelated',
        ...style,
      }}
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      {/* 填充区域 */}
      <div
        style={{
          width: `${clamped}%`,
          height: '100%',
          background: `linear-gradient(180deg, ${lighten(fillColor)} 0%, ${fillColor} 40%, ${darken(fillColor)} 100%)`,
          transition: 'width 200ms steps(20)',
        }}
      />
      {/* 顶部高光线（1px） */}
      {clamped > 0 && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: 1,
            width: `${clamped}%`,
            background: lighten(fillColor, 0.4),
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  )
}

// ─── 颜色辅助 ───
function lighten(hex: string, amount = 0.2): string {
  const { r, g, b } = hexToRgb(hex)
  return rgbToHex({
    r: Math.min(255, r + Math.round(255 * amount)),
    g: Math.min(255, g + Math.round(255 * amount)),
    b: Math.min(255, b + Math.round(255 * amount)),
  })
}

function darken(hex: string, amount = 0.2): string {
  const { r, g, b } = hexToRgb(hex)
  return rgbToHex({
    r: Math.max(0, r - Math.round(255 * amount)),
    g: Math.max(0, g - Math.round(255 * amount)),
    b: Math.max(0, b - Math.round(255 * amount)),
  })
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const m = hex.replace('#', '').padEnd(6, '0')
  return {
    r: parseInt(m.slice(0, 2), 16),
    g: parseInt(m.slice(2, 4), 16),
    b: parseInt(m.slice(4, 6), 16),
  }
}

function rgbToHex({ r, g, b }: { r: number; g: number; b: number }): string {
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')
}
