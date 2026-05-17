import { useState } from 'react'
import type { CSSProperties } from 'react'

/**
 * 像素位图场景背景。
 *
 * 用于 PNG/JPG 像素艺术资源在高分屏上保持锐利的"马赛克"边缘——
 * 通过 image-rendering: pixelated 让浏览器用 nearest-neighbor 算法缩放，
 * 不会做平滑/抗锯齿模糊。
 *
 * 浏览器兼容性：
 * - Chrome/Edge/Opera: image-rendering: pixelated
 * - Firefox: image-rendering: crisp-edges (legacy) / pixelated (新版)
 * - Safari: image-rendering: pixelated (16+) / crisp-edges (fallback)
 *
 * 用法：
 * <PixelBackground src="/scenes/desk-bg.png" />
 *
 * 最佳实践：
 * - 源图保持原始像素分辨率（如 320×180），不要预先放大
 * - 容器尺寸是源图的整数倍时最清晰（如 ×4 / ×6 / ×8）
 *   非整数倍也能保持锐利，但部分像素会被拉伸成不等宽矩形
 * - 大图（如 1280×720 的"像素风"渲染图）不需要此组件，
 *   只有真正的低分辨率像素画才需要 pixelated 渲染
 */
interface PixelBackgroundProps {
  src: string
  alt?: string
  /** 默认 cover：图填充满容器（可能裁剪）；contain：完整显示带留白 */
  fit?: 'cover' | 'contain' | 'fill'
  /** 图在容器中的对齐方式（cover 时控制裁剪哪边） */
  position?: 'center' | 'top' | 'bottom' | 'left' | 'right' | string
  className?: string
  style?: CSSProperties
}

export function PixelBackground({
  src,
  alt = '',
  fit = 'cover',
  position = 'center',
  className = '',
  style,
}: PixelBackgroundProps) {
  return (
    <img
      src={src}
      alt={alt}
      className={`absolute inset-0 w-full h-full pointer-events-none select-none ${className}`}
      style={{
        objectFit: fit,
        objectPosition: position,
        imageRendering: 'pixelated',
        ...style,
      }}
      draggable={false}
    />
  )
}

/**
 * 像素按钮：放置在场景里的 PNG 按钮图标。
 * 位置用百分比，跟随场景缩放。
 *
 * 用法：
 * <PixelButton
 *   src="/buttons/desk-bookshelf.png"
 *   label="书架"
 *   position={{ left: '78%', top: '20%', width: '18%', height: '40%' }}
 *   onClick={() => navigate('shelf')}
 * />
 *
 * 默认 hover 效果：
 * - 1px 像素描边（drop-shadow 四向叠加，铜色 #f5d878）
 * - 整体提亮 110%
 * - 按下时下沉 2px
 *
 * 想要更复杂的 hover 效果（多色描边/动画/换图）：
 * - 传 hoverSrc 切换到另一张 PNG
 * - 或自定义 outlineColor / outlineWidth
 */
interface PixelButtonProps {
  src: string
  label: string
  position: Pick<CSSProperties, 'left' | 'top' | 'right' | 'bottom' | 'width' | 'height'>
  onClick: () => void
  /** hover 时是否显示文字标签 tooltip（默认 true）*/
  showLabel?: boolean
  /** hover 时切换成的另一张 PNG（可选，与 outline 二选一）*/
  hoverSrc?: string
  /** 描边颜色，默认 #f5d878（铜色光晕）。设 null 关闭描边 */
  outlineColor?: string | null
  /** 描边像素宽度，默认 1（建议 1-2，过大会模糊）*/
  outlineWidth?: number
  className?: string
}

/**
 * 生成 N 像素描边的 drop-shadow filter 字符串。
 * 4 向叠加（上下左右），width=2 时 8 向（加四个对角）。
 */
function makeOutlineFilter(color: string, width: number): string {
  const offsets: [number, number][] =
    width >= 2
      ? [
          [width, 0], [-width, 0], [0, width], [0, -width],
          [width, width], [width, -width], [-width, width], [-width, -width],
        ]
      : [[1, 0], [-1, 0], [0, 1], [0, -1]]
  return offsets.map(([x, y]) => `drop-shadow(${x}px ${y}px 0 ${color})`).join(' ')
}

export function PixelButton({
  src,
  label,
  position,
  onClick,
  showLabel = true,
  hoverSrc,
  outlineColor = '#c84040',  // v2.x 默认红色描边
  outlineWidth = 1,
  className = '',
}: PixelButtonProps) {
  const [hover, setHover] = useState(false)
  const outline = outlineColor ? makeOutlineFilter(outlineColor, outlineWidth) : ''

  // 优先 hoverSrc 切图；没的话用 CSS outline 兜底
  const currentSrc = hover && hoverSrc ? hoverSrc : src
  const currentFilter = hover && !hoverSrc && outline ? outline : ''

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      aria-label={label}
      className={`group absolute z-20 cursor-pointer bg-transparent border-0 p-0 ${className}`}
      style={{ ...position, minWidth: 44, minHeight: 44 }}
    >
      <img
        src={currentSrc}
        alt=""
        className="w-full h-full pointer-events-none select-none active:translate-y-[2px]"
        style={{
          objectFit: 'contain',
          imageRendering: 'pixelated',
          filter: currentFilter,
        }}
        draggable={false}
      />
      {showLabel && (
        <span
          className="absolute left-1/2 -translate-x-1/2 -top-7 opacity-0 group-hover:opacity-100 bg-[#f5d878] text-[#1a1410] px-2 py-0.5 text-xs font-bold font-mono border-2 border-[#4a3728] whitespace-nowrap pointer-events-none"
          style={{ zIndex: 100 }}
        >
          {label}
        </span>
      )}
    </button>
  )
}
