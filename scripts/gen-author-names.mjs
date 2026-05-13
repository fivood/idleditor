import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { config } from 'dotenv'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: join(__dirname, '..', '.env') })

const apiKey = process.env.DEEPSEEK_API_KEY
if (!apiKey) { console.error('Need DEEPSEEK_API_KEY in .env'); process.exit(1) }

const baseUrl = 'https://api.deepseek.com'
const model = 'deepseek-chat'

const PERSONAS = {
  'retired-professor': '中国退休老教授，名字古雅有书卷气，2-3个汉字。如沈默然、林怀瑾。只输出名字，不要解释。',
  'basement-scifi-geek': '中国科幻迷/技术宅，名字偏赛博/星际感，可带罕见姓。如星野零、端木奇。只输出名字。',
  'ex-intelligence-officer': '前情报人员，名字冷峻神秘，有武侠或谍战感。如陈深、冷无言。只输出名字。',
  'sociology-phd': '社会学博士，名字文质彬彬带博士头衔。如周知行博士、司马见微博士。只输出名字。',
  'anxious-debut': '焦虑新人作者，名字带怯弱、不安、迟疑感。如小透明、沈惴惴。只输出名字。',
  'reclusive-latam-writer': '隐居拉美作家，英文名配中文括号翻译（搞笑风）。如Gabriel·Manana（加布里埃尔·明日复明日）。只输出名字。',
  'nordic-crime-queen': '北欧推理女王，英文名配中文括号翻译（冷感）。如Ingrid·Frost（英格丽·冷飕飕）。只输出名字。',
  'american-bestseller-machine': '美国畅销作家，英文名配中文括号（商业化风格）。如Jack·Bestsell（杰克·畅销王）。只输出名字。',
  'japanese-lightnovel-otaku': '日本轻小说作者，日文罗马音配中文括号（二次元感）。如Tanaka Light（田中·亮得耀眼）。只输出名字。',
}

const COUNT = 30
const SLEEP = 200
const OUT_DIR = join(__dirname, '..', 'public', 'authors')
const OUT_FILE = join(OUT_DIR, 'names.json')

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function generate(persona, prompt) {
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model, messages: [{ role: 'user', content: `生成一个${prompt}` }],
      max_tokens: 30, temperature: 0.95,
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error?.message || res.status)
  const name = data.choices[0].message.content.trim()
  // Remove quotes and truncate
  return name.replace(/["""]/g, '').replace(/\n/g, '').slice(0, 40)
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true })
  let pool = {}
  if (existsSync(OUT_FILE)) pool = JSON.parse(readFileSync(OUT_FILE, 'utf-8'))

  let total = 0
  for (const [key, prompt] of Object.entries(PERSONAS)) {
    pool[key] = pool[key] || []
    for (let i = pool[key].length; i < COUNT; i++) {
      try {
        const name = await generate(key, prompt)
        pool[key].push(name)
        writeFileSync(OUT_FILE, JSON.stringify(pool, null, 2), 'utf-8')
        console.log(`  ${key} #${i + 1}: ${name}`)
        total++
        await sleep(SLEEP)
      } catch (err) {
        console.log(`  FAIL: ${err.message}`)
        await sleep(5000)
      }
    }
  }
  console.log(`\nGenerated ${total} names. ${OUT_FILE}`)
}

main().catch(err => { console.error(err); process.exit(1) })
