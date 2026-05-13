import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { config } from 'dotenv'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: join(__dirname, '..', '.env') })

// Provider detection
const apiKey = process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY || process.env.KIMI_API_KEY
if (!apiKey) { console.error('Need DEEPSEEK_API_KEY/OPENAI_API_KEY/KIMI_API_KEY in .env'); process.exit(1) }

const baseUrl = process.env.LLM_BASE_URL || (process.env.DEEPSEEK_API_KEY ? 'https://api.deepseek.com' : process.env.OPENAI_API_KEY ? 'https://api.openai.com/v1' : 'https://api.moonshot.cn/v1')
const model = process.env.LLM_MODEL || 'deepseek-chat'

const GENRES = {
  'sci-fi':        '科幻小说（space opera, cyberpunk, speculative）',
  mystery:         '推理小说（detective, whodunit, noir）',
  suspense:        '悬疑小说（psychological thriller, crime）',
  'social-science': '社科/社会观察类（academic satire, pop sociology）',
  hybrid:          '混合类型（genre-bending, magical realism, surreal）',
  'light-novel':   '轻小说（isekai, school, fantasy romance, comedy）',
}

const STYLES = [
  'narrative',  // traditional narrative synopsis
  'excerpt',    // fake excerpt from the book
  'review',     // fake review/blurb
  'blurb',      // back-cover marketing blurb
]

const COUNT_PER_GENRE = 50
const SLEEP_MS = 300

const OUT_DIR = join(__dirname, '..', 'public', 'synopses')
const OUT_FILE = join(OUT_DIR, 'pool.json')

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function generate(genre, style) {
  const stylePrompts = {
    narrative: '写一段中文简介（2-3句话，冷幽默吐槽风，不要剧透结尾）。',
    excerpt: '写一段"书中摘录"（2-3句话，像从前言或第一章摘出来的，有悬念感，冷幽默）。',
    review: '写一段"编辑评语"（1-2句话，冷幽默，带一点刻薄，像在豆瓣书评里看到的）。',
    blurb: '写一段"腰封推荐语"（1-2句话，夸张营销风，冷幽默反讽，像出版社会写的那种）。',
  }

  const prompt = `你为一款挂机出版社游戏生成简介内容。这是一个${GENRES[genre]}的简介。${stylePrompts[style]}
要求：
- 2-3句话
- 冷幽默、吐槽感
- 不要使用真实书名或真实作者名
- 不要使用"林远""苏晚""陈深"这类中国网文常用名（可以用英文名、中性名、或无具体人名）
- 只输出简介内容，不要标题、不要编号、不要额外说明`

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], max_tokens: 200, temperature: 0.95 }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error?.message || `${res.status}`)
  return data.choices[0].message.content.trim()
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true })

  let pool = {}
  if (existsSync(OUT_FILE)) {
    pool = JSON.parse(readFileSync(OUT_FILE, 'utf-8'))
  }

  let total = 0
  for (const [genre] of Object.entries(GENRES)) {
    pool[genre] = pool[genre] || []
    for (let i = pool[genre].length; i < COUNT_PER_GENRE; i++) {
      const style = STYLES[i % STYLES.length]
      try {
        process.stdout.write(`  ${genre} #${i + 1}/${COUNT_PER_GENRE} [${style}]...`)
        const text = await generate(genre, style)
        pool[genre].push(text)
        writeFileSync(OUT_FILE, JSON.stringify(pool, null, 2), 'utf-8')
        console.log(` OK (${text.slice(0, 40)}...)`)
        total++
        await sleep(SLEEP_MS)
      } catch (err) {
        console.log(` FAIL: ${err.message}`)
        await sleep(5000)
      }
    }
  }

  console.log(`\nGenerated ${total} new synopses. Pool: ${OUT_FILE}`)
  console.log(`Total entries: ${Object.values(pool).flat().length}`)
}

main().catch(err => { console.error('Fatal:', err); process.exit(1) })
