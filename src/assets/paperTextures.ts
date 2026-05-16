// ──── 拟物化纸张材质系统 ────
// 提供做旧纸张、皮革、蜡封等 SVG 材质，作为 CSS background-image 使用。
// 所有材质都是 base64 编码的 SVG，无外部资源依赖。
//
// 设计原则：
// - 单个 tile < 500 bytes
// - 颜色与游戏调色板（cream/copper/ink）协调
// - 使用 image-rendering: auto（不是 pixelated，因为是有机纹理）

function svgToUri(svg: string): string {
  return `url("data:image/svg+xml,${encodeURIComponent(svg.replace(/\s+/g, ' ').trim())}")`
}

// ─── 做旧纸张（米黄色，带 fiber 纹理）───
export const PAPER_CREAM = svgToUri(`<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80">
  <rect width="80" height="80" fill="#f4ebd4"/>
  <g fill="#d4c8a8" opacity="0.4">
    <circle cx="12" cy="18" r="0.5"/>
    <circle cx="34" cy="9" r="0.4"/>
    <circle cx="58" cy="22" r="0.5"/>
    <circle cx="71" cy="44" r="0.4"/>
    <circle cx="22" cy="51" r="0.5"/>
    <circle cx="45" cy="63" r="0.4"/>
    <circle cx="68" cy="71" r="0.5"/>
    <circle cx="8" cy="73" r="0.4"/>
  </g>
  <g stroke="#c4b58c" stroke-width="0.3" opacity="0.3" fill="none">
    <path d="M 0 24 Q 20 22 40 25 T 80 24"/>
    <path d="M 0 56 Q 30 54 50 57 T 80 55"/>
  </g>
</svg>`)

// ─── 旧羊皮纸（更深的黄色，适合作者卡/日记）───
export const PAPER_PARCHMENT = svgToUri(`<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80">
  <rect width="80" height="80" fill="#e8d8b0"/>
  <g fill="#a89060" opacity="0.25">
    <circle cx="15" cy="12" r="0.6"/>
    <circle cx="38" cy="28" r="0.5"/>
    <circle cx="61" cy="18" r="0.7"/>
    <circle cx="25" cy="42" r="0.5"/>
    <circle cx="52" cy="55" r="0.6"/>
    <circle cx="72" cy="65" r="0.5"/>
    <circle cx="10" cy="68" r="0.6"/>
  </g>
  <g stroke="#9a7e4a" stroke-width="0.4" opacity="0.2" fill="none">
    <path d="M 0 18 Q 25 15 50 20 T 80 17"/>
    <path d="M 0 48 Q 35 50 55 47 T 80 50"/>
  </g>
</svg>`)

// ─── 暗色木质（适合 banner/边框/装饰）───
export const WOOD_DARK = svgToUri(`<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48">
  <rect width="48" height="48" fill="#3d2614"/>
  <rect x="0" y="8" width="48" height="2" fill="#4a2f18"/>
  <rect x="0" y="22" width="48" height="3" fill="#2a1810"/>
  <rect x="0" y="34" width="48" height="2" fill="#4a2f18"/>
  <g stroke="#5c3a1f" stroke-width="0.5" opacity="0.4" fill="none">
    <path d="M 0 4 Q 20 5 48 3"/>
    <path d="M 0 16 Q 30 18 48 16"/>
    <path d="M 0 30 Q 24 32 48 30"/>
    <path d="M 0 42 Q 28 44 48 42"/>
  </g>
</svg>`)

// ─── 红色蜡封（用于状态印章）───
export function waxSealSvg(text: string, color: string = '#8b1f1f'): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
    <circle cx="20" cy="20" r="17" fill="${color}" stroke="#5c0f0f" stroke-width="1"/>
    <circle cx="20" cy="20" r="14" fill="none" stroke="#5c0f0f" stroke-width="0.5" opacity="0.6"/>
    <text x="20" y="25" text-anchor="middle" font-size="10" font-weight="bold" fill="#fce8e8" font-family="serif">${text}</text>
  </svg>`
}

// ─── 回形针（用于"未阅"标记）───
export const PAPERCLIP_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="40" viewBox="0 0 20 40">
  <path d="M 10 4 Q 4 4 4 10 L 4 30 Q 4 36 10 36 Q 16 36 16 30 L 16 14 Q 16 10 12 10 Q 8 10 8 14 L 8 28"
    stroke="#a89072" stroke-width="1.8" fill="none" stroke-linecap="round"/>
</svg>`

// ─── 咖啡渍（随机装饰）───
export const COFFEE_STAIN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60">
  <ellipse cx="30" cy="30" rx="22" ry="20" fill="#8b6b3e" opacity="0.15"/>
  <ellipse cx="30" cy="30" rx="18" ry="16" fill="none" stroke="#6b4f2a" stroke-width="0.8" opacity="0.3"/>
  <ellipse cx="28" cy="28" rx="12" ry="10" fill="#a08060" opacity="0.1"/>
</svg>`

// CSS 类辅助（直接 inline 用，不需要全局样式）
export const PAPER_STYLES = {
  cream: {
    backgroundImage: PAPER_CREAM,
    backgroundColor: '#f4ebd4',
    backgroundRepeat: 'repeat',
  },
  parchment: {
    backgroundImage: PAPER_PARCHMENT,
    backgroundColor: '#e8d8b0',
    backgroundRepeat: 'repeat',
  },
  wood: {
    backgroundImage: WOOD_DARK,
    backgroundColor: '#3d2614',
    backgroundRepeat: 'repeat',
  },
} as const
