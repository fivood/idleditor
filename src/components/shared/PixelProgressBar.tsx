import type { CSSProperties } from 'react'

/**
 * 像素方格进度条。
 *
 * 用 N 个独立小方格代表进度（经典 RPG HP/MP 条风格），
 * 每格之间有 1px 间隔，像素描边。比平滑 fill 更"游戏化"。
 *
 * 例：value=70, cells=10 → 7 格亮 + 3 格暗。
 */
interface PixelProgressBarProps {
  value: number               // 0-100
  /** 格子总数，默认 10（每格代表 10% 进度）*/
  cells?: number
  /** 单格宽度（px），默认 auto = 容器宽度均分 */
  cellWidth?: number
  height?: number             // 整条高度
  fillColor?: string          // 亮格颜色
  emptyColor?: string         // 暗格颜色
  borderColor?: string
  width?: number | string
  className?: string
  style?: CSSProperties
}

export function PixelProgressBar({
  value,
  cells = 10,
  cellWidth,
  height = 10,
  fillColor = '#b8763b',
  emptyColor = '#2a1810',
  borderColor = '#0a0806',
  width = '100%',
  className = '',
  style = {},
}: PixelProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value))
  const filledCells = Math.round((clamped / 100) * cells)
  // 浅色高光
  const lightColor = lighten(fillColor, 0.25)

  return (
    <div
      className={`relative inline-flex items-stretch ${className}`}
      style={{
        width,
        height,
        gap: 1,
        background: borderColor,
        padding: 1,
        border: `1px solid ${borderColor}`,
        boxShadow: 'inset 1px 1px 0 rgba(0,0,0,0.3)',
        imageRendering: 'pixelated',
        ...style,
      }}
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      {Array.from({ length: cells }).map((_, i) => {
        const isFilled = i < filledCells
        return (
          <div
            key={i}
            style={{
              flex: cellWidth ? `0 0 ${cellWidth}px` : '1 1 0',
              height: '100%',
              background: isFilled ? fillColor : emptyColor,
              boxShadow: isFilled ? `inset 0 1px 0 ${lightColor}` : 'inset 1px 1px 0 rgba(0,0,0,0.4)',
            }}
          />
        )
      })}
    </div>
  )
}

// ─── 颜色辅助 ───
function lighten(hex: string, amount: number): string {
  const m = hex.replace('#', '').padEnd(6, '0')
  const r = Math.min(255, parseInt(m.slice(0, 2), 16) + Math.round(255 * amount))
  const g = Math.min(255, parseInt(m.slice(2, 4), 16) + Math.round(255 * amount))
  const b = Math.min(255, parseInt(m.slice(4, 6), 16) + Math.round(255 * amount))
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')
}
