import { useEffect, useState } from 'react'

/**
 * 9-切片画框 PNG 组合工具。
 *
 * 画师交付 9 张独立切片（tl / t-edge / tr / l-edge / center / r-edge / bl / b-edge / br），
 * 本工具在运行时把它们用 Canvas 拼成单张 (slice×3)×(slice×3) 的 dataURL，
 * 喂给 CSS border-image 才能拿到真正的 9-slice 行为：
 *   - 四区域不重叠
 *   - 透明像素只露出元素背后（不会被其他切片填充）
 *
 * 任一切片 404 → 整体返回 null → 调用方走兜底色 / 兜底样式。
 *
 * 用法：
 *   const dataUrl = useComposedFrame('panel', 'paper', '/ui/panel-paper', 48)
 *   if (dataUrl) {
 *     // apply border-image with dataUrl
 *   }
 */

/** 9-slice 拼图位置（按 3×3 网格） */
const SLICE_GRID: Array<{ suffix: string; col: number; row: number }> = [
  { suffix: 'tl',     col: 0, row: 0 },
  { suffix: 't-edge', col: 1, row: 0 },
  { suffix: 'tr',     col: 2, row: 0 },
  { suffix: 'l-edge', col: 0, row: 1 },
  { suffix: 'center', col: 1, row: 1 },
  { suffix: 'r-edge', col: 2, row: 1 },
  { suffix: 'bl',     col: 0, row: 2 },
  { suffix: 'b-edge', col: 1, row: 2 },
  { suffix: 'br',     col: 2, row: 2 },
]

/** 把 9 张独立切片 PNG 拼成一张 (slice×3)×(slice×3) 的大图（dataURL）。
 *  失败（任一切片 404）返回 null。 */
function composeNineSliceDataUrl(basePath: string, slice: number): Promise<string | null> {
  return new Promise(resolve => {
    const imgs = SLICE_GRID.map(({ suffix }) => {
      const img = new Image()
      img.src = `${basePath}-${suffix}.png`
      return img
    })
    let loaded = 0
    let failed = false
    imgs.forEach(img => {
      img.onload = () => {
        loaded++
        if (failed || loaded !== SLICE_GRID.length) return
        const canvas = document.createElement('canvas')
        canvas.width = slice * 3
        canvas.height = slice * 3
        const ctx = canvas.getContext('2d')
        if (!ctx) { resolve(null); return }
        ctx.imageSmoothingEnabled = false
        SLICE_GRID.forEach(({ col, row }, i) => {
          ctx.drawImage(imgs[i], col * slice, row * slice, slice, slice)
        })
        resolve(canvas.toDataURL('image/png'))
      }
      img.onerror = () => {
        if (failed) return
        failed = true
        resolve(null)
      }
    })
  })
}

/** 缓存：每个 (kind, variant) 对应一张拼好的 dataURL（或 null = 缺图）。
 *  跨组件 / 跨次开窗共用，避免重复 Canvas 操作。 */
const composedCache = new Map<string, string | null>()

/**
 * React hook：返回拼好的 dataURL，或 null（缺图 / 加载中）。
 *
 * @param kind   逻辑分组键（如 'panel' / 'titlebar' / 'manuscript-bg'）
 * @param variant 切片变体名（如 'paper' / 'inbox'）
 * @param basePath PNG 文件前缀（如 '/ui/panel-paper'，会加 '-tl.png' 等后缀加载）
 * @param slice 单张切片源像素尺寸
 */
export function useComposedFrame(kind: string, variant: string, basePath: string, slice: number): string | null {
  const key = `${kind}:${variant}`
  const cached = composedCache.get(key)
  const [dataUrl, setDataUrl] = useState<string | null>(cached ?? null)
  useEffect(() => {
    if (composedCache.has(key)) return
    composeNineSliceDataUrl(basePath, slice).then(url => {
      composedCache.set(key, url)
      setDataUrl(url)
    })
  }, [key, basePath, slice])
  return dataUrl
}
