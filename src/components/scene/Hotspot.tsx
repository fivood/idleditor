import type { ReactNode, CSSProperties } from 'react'

/**
 * 场景内可点击的透明热区。
 *
 * - hover 时显示虚线框 + 标签（桌面端）
 * - 移动端通过 :active 状态提供按下反馈
 * - 始终保留 44×44 最小点击区域以满足触屏可达性
 *
 * 用百分比位置布局，让热区跟随场景 SVG 的响应式缩放。
 */
interface HotspotProps {
  /** 标签文字（hover 时显示）*/
  label: string
  /** 热区位置（百分比）*/
  style: Pick<CSSProperties, 'left' | 'top' | 'width' | 'height' | 'right' | 'bottom'>
  /** 点击回调 */
  onClick: () => void
  /** 可选：未交互过时显示闪烁星标 */
  unseen?: boolean
  children?: ReactNode
}

export function Hotspot({ label, style, onClick, unseen, children }: HotspotProps) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="group absolute z-20 cursor-pointer bg-transparent border-2 border-transparent hover:border-dashed hover:border-[#f5d878] hover:bg-[#f5d87815] active:bg-[#f5d87830] transition-all duration-150"
      style={{ ...style, minWidth: 44, minHeight: 44 }}
    >
      {/* hover 标签 */}
      <span
        className="absolute left-1/2 -translate-x-1/2 -top-7 opacity-0 group-hover:opacity-100 bg-[#f5d878] text-[#1a1410] px-2 py-0.5 text-xs font-bold font-mono border-2 border-[#4a3728] whitespace-nowrap pointer-events-none transition-opacity duration-100"
        style={{ zIndex: 100 }}
      >
        {label}
      </span>
      {/* 未交互过时的闪烁星 */}
      {unseen && (
        <span
          className="absolute -top-2 -right-2 text-[#f5d878] text-lg pointer-events-none animate-pulse"
          aria-hidden
        >
          ✨
        </span>
      )}
      {children}
    </button>
  )
}
