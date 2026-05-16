import type { CSSProperties, ReactNode } from 'react'
import { PAPER_STYLES } from '@/assets/paperTextures'

/**
 * 拟物化纸张卡片包装器。
 *
 * 替代以前的 `border-2 border-border-dark bg-cream shadow-[...]` 模式，
 * 给卡片真正的"纸"质感。
 *
 * 特性：
 * - 做旧纸张材质背景
 * - 可选：堆叠效果（背后有 1-2 张错位的纸）
 * - 可选：四角轻微卷边（CSS clip-path）
 * - 可选：固定的微小旋转角度（避免一排卡片像复印机产品）
 *
 * @param stackBehind 背后叠几张纸（0-2，营造"一摞稿件"感）
 * @param tilt 卡片轻微旋转角度（-1.5 到 1.5 度），默认 0
 * @param variant 'paper' | 'parchment'  做旧程度
 */
interface PaperCardProps {
  children: ReactNode
  className?: string
  style?: CSSProperties
  variant?: 'paper' | 'parchment'
  stackBehind?: 0 | 1 | 2
  tilt?: number
  highlighted?: boolean   // 当前焦点卡片，更明显的阴影
  onClick?: () => void
}

export function PaperCard({
  children,
  className = '',
  style = {},
  variant = 'paper',
  stackBehind = 0,
  tilt = 0,
  highlighted = false,
  onClick,
}: PaperCardProps) {
  const bg = variant === 'parchment' ? PAPER_STYLES.parchment : PAPER_STYLES.cream

  return (
    <div className="relative" style={{ transform: tilt !== 0 ? `rotate(${tilt}deg)` : undefined }}>
      {/* 背后叠的纸（错位偏移）*/}
      {stackBehind >= 2 && (
        <div
          aria-hidden
          className="absolute inset-0 border-2 border-border-dark/60 pointer-events-none"
          style={{
            ...bg,
            transform: 'translate(4px, 4px) rotate(-1.5deg)',
            zIndex: -2,
          }}
        />
      )}
      {stackBehind >= 1 && (
        <div
          aria-hidden
          className="absolute inset-0 border-2 border-border-dark/80 pointer-events-none"
          style={{
            ...bg,
            transform: 'translate(2px, 2px) rotate(0.8deg)',
            zIndex: -1,
          }}
        />
      )}
      {/* 主卡片 */}
      <div
        onClick={onClick}
        className={`relative border-2 border-border-dark ${
          highlighted
            ? 'shadow-[4px_4px_0_#4a3728]'
            : 'shadow-[2px_2px_0_#4a3728]'
        } ${onClick ? 'cursor-pointer' : ''} ${className}`}
        style={{ ...bg, ...style }}
      >
        {children}
      </div>
    </div>
  )
}
