import type { CSSProperties } from 'react'
import type { CoverStyle, Manuscript } from '@/core/types'
import { coverDataUrl } from '@/art/covers'
import { getBaseTitle } from '@/core/titlePools'

/**
 * 像素书封显示组件。
 *
 * 源 PNG 标准尺寸：40 × 56 像素（5:7 长宽比，标准书脊比例）
 * 渲染时整数倍放大 + image-rendering: pixelated 保持锐利"马赛克"边缘。
 *
 * 推荐缩放档（保持像素清晰）：
 *  - 缩略图 size="xs"  →  80 × 112（2×）  书架上的小书
 *  - 卡片 size="sm"    → 120 × 168（3×）  投稿卡缩略图
 *  - 默认 size="md"    → 160 × 224（4×）  封面预览
 *  - 大图 size="lg"    → 200 × 280（5×）  CoverSelectModal
 *
 * 封面由 src/art/covers.ts 按书名 + 题材用代码绘制（手绘封面已内嵌为代码数据），不再加载 PNG。
 */

const SIZE_PRESETS = {
  xs: { width: 80,  height: 112 },
  sm: { width: 120, height: 168 },
  md: { width: 160, height: 224 },
  lg: { width: 200, height: 280 },
} as const

interface PixelCoverProps {
  manuscript: Manuscript
  size?: keyof typeof SIZE_PRESETS
  /** 自定义宽度（覆盖 size preset）。高度按 5:7 推算 */
  width?: number
  /** 覆盖 manuscript.coverStyle，用于选封面时预览各版本 */
  coverStyle?: CoverStyle
  className?: string
  style?: CSSProperties
}

export function PixelCover({ manuscript, size = 'md', width, coverStyle, className = '', style = {} }: PixelCoverProps) {
  const preset = SIZE_PRESETS[size]
  const w = width ?? preset.width
  const h = width ? Math.round(width * 7 / 5) : preset.height

  // v2.6: coverDesigned === false → 灰阶兜底封面（没建设计部、或还在设计中）。
  //       注意 undefined 视为"老存档默认"，按已设计处理，避免老书在 UI 上突然变灰。
  const isRaw = manuscript.coverDesigned === false

  return (
    <div
      className={`relative border-2 overflow-hidden ${className}`}
      style={{
        width: w,
        height: h,
        borderColor: isRaw ? '#3a3530' : '#0a0806',
        background: isRaw ? '#2a2724' : '#2a1810',
        imageRendering: 'pixelated',
        // 灰阶 + 略压低饱和度，让"未经设计部加工"一眼可辨
        filter: isRaw ? 'grayscale(1) brightness(0.78) contrast(0.92)' : undefined,
        ...style,
      }}
      title={isRaw ? '未经设计部加工的灰阶兜底封面（雇佣设计部以解锁专属封面设计）' : undefined}
    >
      <img
        src={coverDataUrl(getBaseTitle(manuscript.title), manuscript.genre, coverStyle ?? manuscript.coverStyle)}
        alt={manuscript.title}
        width={w}
        height={h}
        draggable={false}
        className="w-full h-full pointer-events-none select-none block"
        style={{ imageRendering: 'pixelated', objectFit: 'fill' }}
      />
    </div>
  )
}
