import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const PROMPTS_PATH = join(__dirname, '..', 'public', 'covers', 'prompts.json')
const OUT_DIR      = join(__dirname, '..', 'public', 'covers')

const GENRE_PALETTES = {
  'sci-fi':    { bg: '#0f1729', fg: '#4fc3f7', accent: '#81d4fa' },
  mystery:     { bg: '#1a1a0f', fg: '#c9a84c', accent: '#e6c97a' },
  suspense:    { bg: '#121212', fg: '#cf6679', accent: '#ef9a9a' },
  'social-science': { bg: '#1a1212', fg: '#a5d6a7', accent: '#c8e6c9' },
  hybrid:      { bg: '#121a1a', fg: '#ce93d8', accent: '#e1bee7' },
  'light-novel': { bg: '#1a1230', fg: '#f8bbd0', accent: '#f48fb1' },
}

function hashString(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h) + str.charCodeAt(i)
  return Math.abs(h)
}

function generateSvgCover(title, genre, prompt) {
  const palette = GENRE_PALETTES[genre] || GENRE_PALETTES.hybrid
  const h = hashString(title)
  const patternType = h % 3

  let patternSvg = ''
  if (patternType === 0) {
    // Diagonal stripes
    patternSvg = `<defs><pattern id="p" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="10" height="20" fill="${palette.accent}" opacity="0.06"/><rect x="10" width="10" height="20" fill="none"/></pattern><rect width="400" height="560" fill="url(#p)"/></defs>`
  } else if (patternType === 1) {
    // Dots
    patternSvg = `<defs><pattern id="p" width="16" height="16" patternUnits="userSpaceOnUse"><circle cx="8" cy="8" r="1.5" fill="${palette.accent}" opacity="0.15"/></pattern><rect width="400" height="560" fill="url(#p)"/></defs>`
  } else {
    // Vertical lines
    patternSvg = `<defs><pattern id="p" width="40" height="560" patternUnits="userSpaceOnUse"><rect width="1" height="560" fill="${palette.accent}" opacity="0.08"/></pattern><rect width="400" height="560" fill="url(#p)"/></defs>`
  }

  // Truncate title for display
  const displayTitle = title.length > 8 ? title.slice(0, 8) + '...' : title

  // Generate a simple abstract shape based on title hash
  const shapeH = h % 5
  const shapes = [
    `<circle cx="200" cy="230" r="${30 + h % 100}" fill="${palette.accent}" opacity="0.12"/>`,
    `<rect x="${100 + h % 100}" y="${150 + (h * 7) % 100}" width="${60 + h % 100}" height="${60 + h % 100}" fill="${palette.accent}" opacity="0.1" transform="rotate(${h % 45})"/>`,
    `<polygon points="200,${120 + h % 40} ${260 + h % 40},${280 + h % 40} ${140 - h % 40},${280 + h % 40}" fill="${palette.accent}" opacity="0.1"/>`,
    `<ellipse cx="200" cy="240" rx="${80 + h % 60}" ry="${60 + h % 40}" fill="${palette.accent}" opacity="0.1" transform="rotate(${h % 30})"/>`,
    `<rect x="${80 + h % 80}" y="${120 + h % 80}" rx="10" width="${80 + h % 80}" height="${80 + h % 80}" fill="${palette.accent}" opacity="0.1" transform="rotate(${h % 60})"/>`,
  ]

  const accentLine = h % 2 === 0
    ? `<line x1="40" y1="${520 + h % 20}" x2="${200 + h % 100}" y2="${520 + h % 20}" stroke="${palette.fg}" stroke-width="2" opacity="0.4"/>`
    : ''

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="560" viewBox="0 0 400 560">
  <rect width="400" height="560" fill="${palette.bg}"/>
  ${patternSvg}
  ${shapes[shapeH]}
  <rect x="40" y="60" width="320" height="2" fill="${palette.fg}" opacity="0.5"/>
  <rect x="40" y="68" width="320" height="1" fill="${palette.fg}" opacity="0.2"/>
  ${accentLine}
  <rect x="40" y="490" width="320" height="1" fill="${palette.fg}" opacity="0.2"/>
  <rect x="40" y="498" width="320" height="2" fill="${palette.fg}" opacity="0.5"/>
</svg>`
}

async function main() {
  const entries = JSON.parse(readFileSync(join(OUT_DIR, 'manifest.json'), 'utf-8'))

  let prompts = {}
  if (existsSync(PROMPTS_PATH)) {
    prompts = JSON.parse(readFileSync(PROMPTS_PATH, 'utf-8'))
  }

  let generated = 0
  let skipped = 0

  for (const entry of entries) {
    const filename = entry.filename
    const outPath = join(OUT_DIR, filename)

    if (existsSync(outPath)) {
      skipped++
      continue
    }

    const prompt = prompts[entry.slug] || ''
    const svg = generateSvgCover(entry.title, entry.genre, prompt)
    writeFileSync(outPath, svg, 'utf-8')
    generated++
  }

  console.log(`✅ 已生成 ${generated} 个SVG封面 (跳过 ${skipped} 个已存在的)`)
  console.log('提示: SVG可用于预览，正式发布时用AI工具转为PNG')
}

main().catch(err => {
  console.error('脚本失败:', err)
  process.exit(1)
})
