import { useEffect, useState } from 'react'

/**
 * 9-切片画框 PNG 组合工具。
 *
 * 支持两种画师交付模式（自动检测）：
 *
 *  A) **单图模式**（推荐给低变化的纹理，比如纯纸面/木纹/砖墙）
 *     画师提供单张 `{basePath}.png`，尺寸 = `slice × 3 × slice × 3`
 *     （比如 slice=32 → 96×96）。布局：4 角放四角、4 边放可平铺纹理、
 *     中心放可平铺底色——全画在一张图里，画师自己控制接缝。
 *     代码直接用此 PNG 喂 border-image。
 *
 *  B) **9 切片模式**（推荐给装饰丰富的画框，比如复杂拐角 / 不同纹理边）
 *     画师提供 9 张独立 PNG：
 *       `{basePath}-tl.png` `{basePath}-t-edge.png` `{basePath}-tr.png`
 *       `{basePath}-l-edge.png` `{basePath}-center.png` `{basePath}-r-edge.png`
 *       `{basePath}-bl.png` `{basePath}-b-edge.png` `{basePath}-br.png`
 *     代码运行时用 Canvas 拼成单张 dataURL 再喂 border-image。
 *
 * 检测顺序：先试单图 → 单图 404 时再试 9 切片 → 9 切片任一缺失返回 null。
 *
 * 用法（caller 无需关心实际模式）：
 *   const dataUrl = useComposedFrame('panel', 'paper', '/ui/panel-paper', 48)
 *   if (dataUrl) { ...apply border-image with dataUrl... }
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

/** 尝试加载单图 `{basePath}.png`。成功返回 src，失败返回 null。 */
function tryLoadSinglePng(basePath: string): Promise<string | null> {
  return new Promise(resolve => {
    const img = new Image()
    const src = `${basePath}.png`
    img.onload = () => resolve(src)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

/** 9 切片模式：用 Canvas 拼图。任一切片 404 返回 null。 */
function compose9TilesDataUrl(basePath: string, slice: number): Promise<string | null> {
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

/** 缓存：跨组件 / 跨次开窗共用。 */
const composedCache = new Map<string, string | null>()

/**
 * React hook：返回画框 PNG 的 URL（单图直返，9 切片返回拼好的 dataURL），
 * 或 null（两种模式都缺图 / 加载中）。
 *
 * @param kind   逻辑分组键（如 'panel' / 'titlebar' / 'manuscript-bg'）
 * @param variant 切片变体名（如 'paper' / 'inbox'）
 * @param basePath PNG 文件前缀（如 '/ui/panel-paper'）
 *                 → 先试 `${basePath}.png`，缺失再试 `${basePath}-tl.png` 等
 * @param slice 单张切片源像素尺寸（决定 border-image-slice 值）
 */
export function useComposedFrame(kind: string, variant: string, basePath: string, slice: number): string | null {
  const key = `${kind}:${variant}`
  const cached = composedCache.get(key)
  const [dataUrl, setDataUrl] = useState<string | null>(cached ?? null)
  useEffect(() => {
    if (composedCache.has(key)) return
    let cancelled = false
    // 先试单图模式
    tryLoadSinglePng(basePath).then(singleSrc => {
      if (cancelled) return
      if (singleSrc) {
        composedCache.set(key, singleSrc)
        setDataUrl(singleSrc)
        return
      }
      // 单图缺失 → 试 9 切片模式
      compose9TilesDataUrl(basePath, slice).then(url => {
        if (cancelled) return
        composedCache.set(key, url)
        setDataUrl(url)
      })
    })
    return () => { cancelled = true }
  }, [key, basePath, slice])
  return dataUrl
}
