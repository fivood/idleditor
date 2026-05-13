export async function onRequestPost(context) {
  const { request, env } = context

  try {
    const { title, genre, context: scene } = await request.json()
    if (!title || !genre || !scene) {
      return new Response(JSON.stringify({ error: 'title, genre, context required' }), { status: 400 })
    }

    // KV cache key: commentary:{context}:{title}
    const slug = title.replace(/[《》\s（）()：:？?！!。，,、/\\]/g, '').slice(0, 30)
    const cacheKey = `commentary:${scene}:${slug}`

    // Check cache: array of stored commentaries
    const cached = await env.SAVE_KV.get(cacheKey)
    let pool = []
    try { pool = JSON.parse(cached || '[]') } catch { pool = [] }

    // If cache has entries, randomly pick one
    if (pool.length > 0) {
      const text = pool[Math.floor(Math.random() * pool.length)]
      return new Response(JSON.stringify({ text, cached: true, poolSize: pool.length }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Rate limit
    const apiKey = env.LLM_API_KEY
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'LLM not configured' }), { status: 500 })
    }

    const ip = request.headers.get('cf-connecting-ip') || 'unknown'
    const today = new Date().toISOString().slice(0, 10)
    const rateKey = `llm-rate:${ip}:${today}`
    const count = parseInt(await env.SAVE_KV.get(rateKey) || '0')
    if (count >= 50) {
      return new Response(JSON.stringify({ error: 'rate limit' }), { status: 429 })
    }
    await env.SAVE_KV.put(rateKey, String(count + 1), { expirationTtl: 86400 })

    // Generate
    const provider = env.LLM_BASE_URL || 'https://api.deepseek.com'
    const model = env.LLM_MODEL || 'deepseek-chat'

    const prompt = `你是一位活了两百多年的吸血鬼编辑。请用中文对以下小说发表一句吐槽式评语，风格冷幽默、刻薄但善意。1句话，30字以内。不要加引号。

书名：《${title}》
类型：${genre}
场景：${scene}`

    const res = await fetch(`${provider}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 80,
        temperature: 0.95,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      return new Response(JSON.stringify({ error: data.error?.message || 'LLM failed' }), { status: 500 })
    }

    const text = data.choices?.[0]?.message?.content?.trim()?.replace(/^["""]|["""]$/g, '') || ''
    if (text) {
      // Append to pool, cap at 5
      pool.push(text)
      if (pool.length > 5) pool.shift()
      await env.SAVE_KV.put(cacheKey, JSON.stringify(pool), { expirationTtl: 2592000 })
    }

    return new Response(JSON.stringify({ text, cached: false, poolSize: pool.length }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: 'commentary failed' }), { status: 500 })
  }
}
