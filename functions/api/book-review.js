export async function onRequestPost(context) {
  const { request, env } = context

  try {
    const { title, genre, type } = await request.json()
    if (!title || !genre) {
      return new Response(JSON.stringify({ error: 'title and genre required' }), { status: 400 })
    }

    const slug = title.replace(/[《》\s（）()：:？?！!。，,、/\\]/g, '').slice(0, 30)
    const cacheKey = `book-review:${type}:${slug}`

    // Check existing pool
    let pool = []
    const cached = await env.SAVE_KV.get(cacheKey)
    try { pool = JSON.parse(cached || '[]') } catch { pool = [] }

    // Return random existing if pool has entries
    if (pool.length > 0) {
      const text = pool[Math.floor(Math.random() * pool.length)]
      return new Response(JSON.stringify({ text, poolSize: pool.length }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Need to generate new — check rate limit
    const apiKey = env.LLM_API_KEY
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'LLM not configured' }), { status: 500 })
    }

    const ip = request.headers.get('cf-connecting-ip') || 'unknown'
    const today = new Date().toISOString().slice(0, 10)
    const rateKey = `llm-rate:${ip}:${today}`
    const count = parseInt(await env.SAVE_KV.get(rateKey) || '0')
    if (count >= 100) {
      return new Response(JSON.stringify({ error: 'rate limit' }), { status: 429 })
    }
    await env.SAVE_KV.put(rateKey, String(count + 1), { expirationTtl: 86400 })

    const provider = env.LLM_BASE_URL || 'https://api.deepseek.com'
    const model = env.LLM_MODEL || 'deepseek-chat'

    const prompts = {
      review: `你是一位口味挑剔的吸血鬼读者（活了几百年）。请为一本名叫《${title}》的${genre}小说写一条读者短评。风格：冷幽默、一句话、像豆瓣/Goodreads上的那种。15-25字。不要书名号。`,
      quote: `你是一位名叫某作者的${genre}小说作者，刚出版了《${title}》。请模仿该作者的口吻，说一句关于这本书的访谈摘录。风格：冷幽默、谦虚或自嘲。15-25字。`,
    }

    const prompt = prompts[type] || prompts.review

    const res = await fetch(`${provider}/chat/completions`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], max_tokens: 60, temperature: 0.95 }),
    })

    const data = await res.json()
    if (!res.ok) {
      return new Response(JSON.stringify({ error: data.error?.message || 'LLM failed' }), { status: 500 })
    }

    const text = data.choices?.[0]?.message?.content?.trim()?.replace(/^["""]|["""]$/g, '') || ''
    if (text) {
      pool.push(text)
      await env.SAVE_KV.put(cacheKey, JSON.stringify(pool), { expirationTtl: 86400 * 90 })
    }

    return new Response(JSON.stringify({ text, poolSize: pool.length }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: 'failed' }), { status: 500 })
  }
}
