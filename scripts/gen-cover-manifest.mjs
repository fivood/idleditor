// 一次性脚本：从 src/core/titlePools.ts 解析所有书名 → 生成
// public/covers/manifest.json + public/covers/README.md（书目对照表）。
//
// titlePools.ts 是唯一真相源；任何时候增删书名都先改它，再跑：
//
//   node scripts/gen-cover-manifest.mjs
//
// 脚本会扫描 public/covers 现有的 PNG，存在 `{title}.png` 即映射到该文件，
// 否则统一使用 `占位封面.png`。

import { readFileSync, readdirSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')
const coversDir = join(rootDir, 'public', 'covers')
const titlePoolsPath = join(rootDir, 'src', 'core', 'titlePools.ts')

const PLACEHOLDER = '占位封面.png'

const POOL_TO_GENRE = {
  SCI_FI_TITLES: 'sci-fi',
  MYSTERY_TITLES: 'mystery',
  SUSPENSE_TITLES: 'suspense',
  SOCIAL_TITLES: 'social-science',
  LITERARY_TITLES: 'literary',
  HYBRID_TITLES: 'hybrid',
  FANTASY_TITLES: 'fantasy',
  LIGHT_NOVEL_TITLES: 'light-novel',
}
const GENRE_LABEL = {
  'sci-fi':         '日光幻想 / 科幻',
  mystery:          '凡间悬案 / 推理',
  suspense:         '银器恐怖 / 悬疑',
  'social-science': '真实研究 / 社科',
  literary:         '凡间名著 / 经典改编',
  hybrid:           '跨种合著 / 跨界融合',
  fantasy:          '远古纪事 / 奇幻史诗',
  'light-novel':    '少年血宫 / 轻小说',
}

function titleToSlug(title) {
  return title
    .replace(/[：:]/g, '-')
    .replace(/[？?！!。，,、（）()【】\[\]《》""·]/g, '')
    .replace(/\s+/g, '-')
    .replace(/\/+/g, '-')
    .trim()
}

// ── 解析 titlePools.ts ──
const src = readFileSync(titlePoolsPath, 'utf-8')
const pools = {}
for (const arrName of Object.keys(POOL_TO_GENRE)) {
  const re = new RegExp('export const ' + arrName + '\\s*=\\s*\\[([\\s\\S]*?)\\]', 'm')
  const m = src.match(re)
  if (!m) { console.error('miss array', arrName); process.exit(1) }
  pools[arrName] = [...m[1].matchAll(/'([^']+)'/g)].map(x => x[1])
}

// ── 扫描已有 PNG ──
if (!existsSync(coversDir)) mkdirSync(coversDir, { recursive: true })
const presentPngs = new Set(readdirSync(coversDir).filter(f => f.endsWith('.png')))

// ── 组装 manifest ──
const manifest = []
const seen = new Set()
const dupes = []
for (const [arrName, titles] of Object.entries(pools)) {
  for (const title of titles) {
    if (seen.has(title)) {
      dupes.push({ title, genre: POOL_TO_GENRE[arrName] })
      continue
    }
    seen.add(title)
    const ownPng = title + '.png'
    const filename = presentPngs.has(ownPng) ? ownPng : PLACEHOLDER
    manifest.push({
      title,
      genre: POOL_TO_GENRE[arrName],
      slug: titleToSlug(title),
      filename,
    })
  }
}

if (dupes.length > 0) {
  console.warn('⚠ 跨池重复（已自动去重，保留首次出现的池）：')
  for (const d of dupes) console.warn('  -', d.title, '(in', GENRE_LABEL[d.genre] + ')')
}

// 检查 PNG 是否都被某个标题引用
const used = new Set(manifest.map(e => e.filename))
const orphanPngs = [...presentPngs].filter(f => f !== PLACEHOLDER && !used.has(f))
if (orphanPngs.length > 0) {
  console.warn('⚠ 孤儿 PNG（文件存在但 titlePools 里没有对应书名）：')
  for (const f of orphanPngs) console.warn('  -', f)
}

writeFileSync(join(coversDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf-8')

// ── 生成书目对照表 README.md ──
const total = manifest.length
const withPng = manifest.filter(e => e.filename !== PLACEHOLDER).length
const lines = [
  '# 永夜出版社 · 书目对照表',
  '',
  `共 **${total}** 本 · 已绘制封面 **${withPng}** / **${total}**（${Math.round(withPng / total * 100)}%）`,
  '',
  '> 修改 `src/core/titlePools.ts` → 跑 `node scripts/gen-cover-manifest.mjs` 自动同步本表。',
  '> 将新封面 PNG（40×56 像素艺术）放到本目录，文件名与"书名"列完全一致即可被识别。',
  '',
]

// 按 genre 分组
const byGenre = {}
for (const e of manifest) {
  if (!byGenre[e.genre]) byGenre[e.genre] = []
  byGenre[e.genre].push(e)
}

for (const [genre, label] of Object.entries(GENRE_LABEL)) {
  const list = byGenre[genre] ?? []
  const done = list.filter(e => e.filename !== PLACEHOLDER).length
  lines.push(`## ${label}（${done} / ${list.length}）`)
  lines.push('')
  lines.push('| # | 书名 | 封面状态 |')
  lines.push('|---|------|----------|')
  list.forEach((e, i) => {
    const status = e.filename === PLACEHOLDER ? '☐ 待绘' : `✓ \`${e.filename}\``
    lines.push(`| ${i + 1} | ${e.title} | ${status} |`)
  })
  lines.push('')
}

writeFileSync(join(coversDir, 'README.md'), lines.join('\n'), 'utf-8')

console.log(`\n✓ manifest.json — ${total} 个标题`)
console.log(`✓ README.md   — 已绘制 ${withPng}/${total}`)
for (const [genre, label] of Object.entries(GENRE_LABEL)) {
  const list = byGenre[genre] ?? []
  const done = list.filter(e => e.filename !== PLACEHOLDER).length
  console.log(`  ${label}: ${done}/${list.length}`)
}
