// Pixel-art SVG textures as base64 data URIs for CSS backgrounds.
// Keep each texture under ~400 bytes. All rendered with image-rendering: pixelated.

function svgToUri(svg: string): string {
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}

// ─── Desktop textures ────────────────────────────────────────────

// 32×32 pixel brick wall — dark red-brown bricks with dark mortar gaps
export const WALL_SVG = svgToUri(`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" shape-rendering="crispEdges">
  <rect width="32" height="32" fill="#1a1010"/>
  <rect x="0" y="0" width="14" height="6" fill="#2d1a1a"/>
  <rect x="16" y="0" width="14" height="6" fill="#2d1a1a"/>
  <rect x="8" y="8" width="6" height="6" fill="#251515"/>
  <rect x="0" y="8" width="6" height="6" fill="#2d1a1a"/>
  <rect x="16" y="8" width="14" height="6" fill="#2d1a1a"/>
  <rect x="0" y="16" width="14" height="6" fill="#2d1a1a"/>
  <rect x="16" y="16" width="14" height="6" fill="#2d1a1a"/>
  <rect x="8" y="24" width="6" height="6" fill="#251515"/>
  <rect x="0" y="24" width="6" height="6" fill="#2d1a1a"/>
  <rect x="16" y="24" width="14" height="6" fill="#2d1a1a"/>
</svg>`)

// 32×32 pixel wood desk — warm brown planks with subtle grain
export const DESK_SVG = svgToUri(`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" shape-rendering="crispEdges">
  <rect width="32" height="32" fill="#3a2a1a"/>
  <rect x="0" y="0" width="32" height="8" fill="#4a3520"/>
  <rect x="0" y="16" width="32" height="8" fill="#4a3520"/>
  <rect x="2" y="3" width="8" height="2" fill="#3d2b18"/>
  <rect x="20" y="5" width="6" height="2" fill="#524030"/>
  <rect x="8" y="19" width="10" height="2" fill="#3d2b18"/>
  <rect x="2" y="21" width="4" height="2" fill="#524030"/>
</svg>`)

// 120×80 pixel gothic window — dark blue night, crescent moon, stars, stone frame
export const WINDOW_SVG = svgToUri(`<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80" shape-rendering="crispEdges">
  <rect width="120" height="80" fill="#0a0a14"/>
  <rect x="4" y="4" width="112" height="72" fill="#0d1030"/>
  <rect x="8" y="8" width="104" height="64" fill="#0e1240"/>
  <rect x="2" y="2" width="2" height="76" fill="#1a1510"/>
  <rect x="116" y="2" width="2" height="76" fill="#1a1510"/>
  <rect x="0" y="0" width="120" height="2" fill="#1a1510"/>
  <rect x="0" y="78" width="120" height="2" fill="#1a1510"/>
  <rect x="56" y="0" width="4" height="80" fill="#1a1510"/>
  <rect x="56" y="36" width="4" height="4" fill="#0a0a14"/>
  <rect x="85" y="56" width="2" height="2" fill="#ffffff" opacity="0.7"/>
  <rect x="40" y="18" width="2" height="2" fill="#ffffff" opacity="0.5"/>
  <rect x="70" y="14" width="2" height="2" fill="#ffffff" opacity="0.6"/>
  <rect x="30" y="48" width="2" height="2" fill="#ffffff" opacity="0.4"/>
  <rect x="100" y="22" width="2" height="2" fill="#ffffff" opacity="0.5"/>
  <rect x="15" y="60" width="2" height="2" fill="#ffffff" opacity="0.3"/>
  <rect x="88" y="10" width="3" height="3" fill="#f5e6a0"/>
  <rect x="87" y="12" width="1" height="2" fill="#0e1240"/>
  <rect x="90" y="10" width="2" height="2" fill="#0e1240"/>
</svg>`)

// ─── Mobile textures ─────────────────────────────────────────────

// 8×8 pixel noise tile — warm dark texture for mobile
export const NOISE_SVG = svgToUri(`<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" shape-rendering="crispEdges">
  <rect width="8" height="8" fill="#1a1410"/>
  <rect x="1" y="1" width="1" height="1" fill="#2a1f18" opacity="0.7"/>
  <rect x="5" y="2" width="1" height="1" fill="#251a14" opacity="0.6"/>
  <rect x="3" y="4" width="1" height="1" fill="#2a1f18" opacity="0.5"/>
  <rect x="6" y="6" width="1" height="1" fill="#251a14" opacity="0.7"/>
  <rect x="0" y="5" width="1" height="1" fill="#2a1f18" opacity="0.4"/>
</svg>`)
