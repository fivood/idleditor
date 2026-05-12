import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { config } from 'dotenv'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: join(__dirname, '..', '.env') })

// ─── Provider config ───
// GEMINI_API_KEY  → 用 Gemini
// DEEPSEEK_API_KEY → 用 DeepSeek (https://api.deepseek.com)
// KIMI_API_KEY     → 用 Kimi (https://api.moonshot.cn/v1)

const providers = {
  gemini:   { key: process.env.GEMINI_API_KEY,   base: 'https://generativelanguage.googleapis.com', isGemini: true },
  deepseek: { key: process.env.DEEPSEEK_API_KEY,  base: 'https://api.deepseek.com',                 model: 'deepseek-chat' },
  kimi:     { key: process.env.KIMI_API_KEY,      base: 'https://api.moonshot.cn/v1',               model: 'moonshot-v1-8k' },
}

const active = Object.entries(providers).find(([, p]) => p.key)
if (!active) {
  console.error('请在 .env 中设置 GEMINI_API_KEY / DEEPSEEK_API_KEY / KIMI_API_KEY 之一')
  console.error('获取: https://platform.deepseek.com 或 https://platform.moonshot.cn')
  process.exit(1)
}

const [providerName, provider] = active
console.log(`🤖 使用 ${providerName.toUpperCase()} (${provider.model || 'gemini-2.0-flash'})`)

const DRY_RUN = process.argv.includes('--dry-run')
const BATCH_SIZE = 10
const START_INDEX = parseInt(process.argv.find(a => a.startsWith('--start='))?.split('=')[1] || '0')

const GENRE_THEMES = {
  'sci-fi': 'futuristic space station, neon cyberpunk, scientific laboratory, distant planets, alien technology',
  mystery: 'dimly lit study, foggy victorian street, detective office with pinned clues, old library',
  suspense: 'shadowy corridor, rain-slicked alley at night, abandoned warehouse, vintage hotel lobby',
  'social-science': 'academic lecture hall, modern minimalist office, urban street scene, coffee shop sociology',
  hybrid: 'genre-blending surreal landscape, impossible architecture, dreamlike mashup of eras',
}

const MANIFEST_PATH = join(__dirname, '..', 'public', 'covers', 'manifest.json')
const PROMPTS_PATH  = join(__dirname, '..', 'public', 'covers', 'prompts.json')

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function callGemini(model, prompt) {
  const { GoogleGenerativeAI } = await import('@google/generative-ai')
  const genAI = new GoogleGenerativeAI(provider.key)
  const m = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
  const result = await m.generateContent(prompt)
  return result.response.text().trim()
}

async function callOpenAI(prompt) {
  const res = await fetch(`${provider.base}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${provider.key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: provider.model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 200,
      temperature: 0.9,
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error?.message || `${res.status}`)
  return data.choices[0].message.content.trim()
}

async function main() {
  const entries = JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8'))
  let prompts = {}
  if (existsSync(PROMPTS_PATH)) {
    prompts = JSON.parse(readFileSync(PROMPTS_PATH, 'utf-8'))
  }

  const batch = entries.slice(START_INDEX, START_INDEX + BATCH_SIZE)
  console.log(`处理 ${START_INDEX + 1}-${Math.min(START_INDEX + BATCH_SIZE, entries.length)} / ${entries.length}`)

  let success = 0
  for (const entry of batch) {
    const slug = entry.slug

    if (prompts[slug]) {
      console.log(`  ⏭  ${entry.title}`)
      continue
    }

    const theme = GENRE_THEMES[entry.genre] || 'elegant minimalist editorial'
    const systemPrompt = `You are a book cover designer. Given a Chinese book title, write a detailed English image prompt for generating a 400x560 book cover illustration. Style: minimalist editorial, neo-skeuomorphic, "New York Review of Books" aesthetic with subtle surreal elements. No text on cover.

Book: "${entry.title}"
Genre: ${theme}

Output ONLY the prompt (2-3 sentences).`

    try {
      const text = provider.isGemini
        ? await callGemini(systemPrompt)
        : await callOpenAI(systemPrompt)

      prompts[slug] = text
      success++
      console.log(`  ✅ ${entry.title} → ${text.slice(0, 80)}...`)
      writeFileSync(PROMPTS_PATH, JSON.stringify(prompts, null, 2), 'utf-8')

      if (!provider.isGemini) await sleep(200) // OpenAI-compatible rate limits are usually looser
    } catch (err) {
      console.error(`  ❌ ${entry.title}: ${err.message}`)
      if (err.message?.includes('429') || err.message?.includes('rate')) {
        console.log('  等待10秒...')
        await sleep(10000)
      }
    }
  }

  const total = Object.keys(prompts).length
  console.log(`\n✅ ${success} new  |  📝 ${total}/${entries.length} total → ${PROMPTS_PATH}`)
  if (total < entries.length) {
    console.log(`下一步: node scripts/gen-covers-gemini.mjs --start=${START_INDEX + BATCH_SIZE}`)
  }
}

main().catch(err => { console.error('失败:', err); process.exit(1) })
