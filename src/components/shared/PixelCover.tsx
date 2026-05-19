import type { CSSProperties } from 'react'
import type { Manuscript } from '@/core/types'

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
 * 找不到封面图时显示题材色 + 题材图标的占位封面（与原 Manuscript.cover.placeholder 兼容）。
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
  className?: string
  style?: CSSProperties
}

export function PixelCover({ manuscript, size = 'md', width, className = '', style = {} }: PixelCoverProps) {
  const preset = SIZE_PRESETS[size]
  const w = width ?? preset.width
  const h = width ? Math.round(width * 7 / 5) : preset.height

  const cover = manuscript.cover
  const placeholder = cover?.placeholder
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
        background: isRaw ? '#2a2724' : (placeholder?.bgColor ?? '#2a1810'),
        imageRendering: 'pixelated',
        // 灰阶 + 略压低饱和度，让"未经设计部加工"一眼可辨
        filter: isRaw ? 'grayscale(1) brightness(0.78) contrast(0.92)' : undefined,
        ...style,
      }}
      title={isRaw ? '未经设计部加工的灰阶兜底封面（雇佣设计部以解锁专属封面设计）' : undefined}
    >
      {cover?.src ? (
        <img
          src={cover.src}
          alt={manuscript.title}
          width={w}
          height={h}
          draggable={false}
          className="w-full h-full pointer-events-none select-none block"
          style={{ imageRendering: 'pixelated', objectFit: 'fill' }}
          onError={e => { (e.currentTarget as HTMLElement).style.display = 'none' }}
        />
      ) : null}
      {/* 占位层（src 加载失败也会通过 onError 显式 hide img，露出此层）*/}
      {(!cover?.src || cover?.type !== 'uploaded') && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-1 pointer-events-none"
          style={{
            background: placeholder?.bgColor ?? '#2a1810',
            color: '#ede0c8',
          }}
        >
          {placeholder?.icon && (
            <img
              src={placeholder.icon}
              alt=""
              width={Math.round(w * 0.3)}
              height={Math.round(w * 0.3)}
              style={{ imageRendering: 'pixelated', opacity: 0.6 }}
            />
          )}
          <div
            className="text-center px-1 font-mono font-bold leading-tight"
            style={{
              fontSize: Math.max(8, Math.round(w / 14)),
              color: '#ede0c8',
              textShadow: '1px 1px 0 #0a0806',
              maxWidth: '90%',
            }}
          >
            {manuscript.title}
          </div>
        </div>
      )}
    </div>
  )
}
