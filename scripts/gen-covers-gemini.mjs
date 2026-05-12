import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { GoogleGenerativeAI } from '@google/generative-ai'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ─── Config ───
const API_KEY = process.env.GEMINI_API_KEY
if (!API_KEY) {
  console.error('请设置环境变量 GEMINI_API_KEY')
  console.error('获取: https://aistudio.google.com/apikey')
  process.exit(1)
}

const DRY_RUN = process.argv.includes('--dry-run')
const BATCH_SIZE = 5    // per run to avoid rate limits
const START_INDEX = parseInt(process.argv.find(a => a.startsWith('--start='))?.split('=')[1] || '0')

const genAI = new GoogleGenerativeAI(API_KEY)
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

// ─── Utilities ───
function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

const GENRE_THEMES = {
  'sci-fi': 'futuristic space station, neon cyberpunk, scientific laboratory, distant planets, alien technology',
  mystery: 'dimly lit study, foggy victorian street, detective office with pinned clues, old library',
  suspense: 'shadowy corridor, rain-slicked alley at night, abandoned warehouse, vintage hotel lobby',
  'social-science': 'academic lecture hall, modern minimalist office, urban street scene, coffee shop sociology',
  hybrid: 'genre-blending surreal landscape, impossible architecture, dreamlike mashup of eras',
}

const MANIFEST_PATH = join(__dirname, '..', 'public', 'covers', 'manifest.json')
const PROMPTS_PATH  = join(__dirname, '..', 'public', 'covers', 'prompts.json')
const OUT_DIR       = join(__dirname, '..', 'public', 'covers')

// ─── Main ───
async function main() {
  console.log('📚 读取封面清单...')
  const entries = JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8'))

  // Load existing prompts if any
  let prompts = {}
  if (existsSync(PROMPTS_PATH)) {
    prompts = JSON.parse(readFileSync(PROMPTS_PATH, 'utf-8'))
  }

  const batch = entries.slice(START_INDEX, START_INDEX + BATCH_SIZE)
  console.log(`处理 ${START_INDEX + 1}-${Math.min(START_INDEX + BATCH_SIZE, entries.length)} / ${entries.length}`)

  for (let i = 0; i < batch.length; i++) {
    const entry = batch[i]
    const slug = entry.slug

    if (prompts[slug]) {
      console.log(`  ⏭  ${entry.title} (已有提示词)`)
      continue
    }

    const theme = GENRE_THEMES[entry.genre] || 'elegant minimalist editorial'

    const systemPrompt = `You are a book cover designer. Given a Chinese book title and genre, write a detailed English image prompt for generating a 400x560 book cover illustration.

Style: minimalist editorial design, neo-skeuomorphic, "New York Review of Books" aesthetic with subtle surreal or retro elements. No text on the cover. Use the theme keywords as inspiration.

Book: "${entry.title}"
Genre keywords: ${theme}
Author style: literary, subtle, editorial

Output ONLY the image prompt (2-3 sentences max). No explanations.`

    try {
      console.log(`  🎨 ${entry.title} (${entry.genre})...`)
      const result = await model.generateContent(systemPrompt)
      const text = result.response.text().trim()

      prompts[slug] = text
      console.log(`     → ${text.slice(0, 80)}...`)

      // Save after each to avoid losing progress
      writeFileSync(PROMPTS_PATH, JSON.stringify(prompts, null, 2), 'utf-8')

      // Sleep to avoid rate limits
      await sleep(1500)
    } catch (err) {
      console.error(`  ❌ ${entry.title} 失败:`, err.message)
      if (err.message?.includes('429') || err.message?.includes('rate')) {
        console.log('  等待30秒避免限流...')
        await sleep(30000)
      }
    }
  }

  console.log(`\n✅ 提示词已保存到 ${PROMPTS_PATH}`)
  console.log(`共 ${Object.keys(prompts).length}/${entries.length} 条`)
  console.log(`\n下一步运行: node scripts/gen-covers-gemini.mjs --start=${START_INDEX + BATCH_SIZE}`)
  console.log(`或: node scripts/gen-covers-gemini.mjs --dry-run 查看进度`)
}

main().catch(err => {
  console.error('脚本失败:', err)
  process.exit(1)
})
