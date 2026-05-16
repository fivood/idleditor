import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { PAPER_STYLES } from '@/assets/paperTextures'

/**
 * 场景内弹出的纸张面板。
 *
 * 位置由调用方指定（通过 className 传 anchor 类）。
 * 按 ESC 或点击关闭按钮关闭。
 * 不锁背景，可以同时打开多个不同位置的面板（如稿件堆 + 黑猫）。
 */
interface ScenePanelProps {
  title: string
  onClose: () => void
  children: ReactNode
  /** anchor 类，e.g. "top-16 left-16" 或 "bottom-20 right-16" */
  position?: string
  /** 最大宽度，默认 420px */
  width?: number
}

export function ScenePanel({ title, onClose, children, position = 'top-16 left-16', width = 420 }: ScenePanelProps) {
  // ESC 关闭
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      className={`absolute z-40 border-2 border-border-dark shadow-[6px_6px_0_#2a1810] p-3 md:p-4 font-mono text-ink ${position}`}
      style={{ ...PAPER_STYLES.cream, maxWidth: width, maxHeight: '70vh', overflowY: 'auto' }}
      role="dialog"
      aria-label={title}
    >
      <div className="flex items-center justify-between border-b border-[#c8b890] pb-2 mb-3">
        <h3 className="text-sm font-bold text-[#4a3728]">{title}</h3>
        <button
          onClick={onClose}
          aria-label="关闭"
          className="text-[#8a7a5a] hover:text-[#4a3728] text-lg leading-none cursor-pointer ml-2"
        >
          ✕
        </button>
      </div>
      {children}
    </div>
  )
}
