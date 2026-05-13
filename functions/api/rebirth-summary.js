export async function onRequestPost(context) {
  const { request, env } = context

  try {
    const { stats } = await request.json()
    if (!stats) {
      return new Response(JSON.stringify({ error: 'stats required' }), { status: 400 })
    }

    // Unique cache key based on stats content
    const cacheKey = `rebirth-summary:${simpleHash(stats)}`

    const cached = await env.SAVE_KV.get(cacheKey)
    if (cached) {
      return new Response(JSON.stringify({ text: cached, cached: true }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const apiKey = env.LLM_API_KEY
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'LLM not configured' }), { status: 500 })
    }

    const provider = env.LLM_BASE_URL || 'https://api.deepseek.com'
    const model = env.LLM_MODEL || 'deepseek-chat'

    const prompt = `你是一位活了数百年的吸血鬼编辑。请用中文为以下编辑生涯写一段冷幽默的总结（3-4句话，150字以内，不要用破折号）。

${stats}

风格：冷幽默、略带怀念、带一点对出版行业荒谬感的吐槽。`
    const res = await fetch(`${provider}/chat/completions`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], max_tokens: 200, temperature: 0.9 }),
    })
    const data = await res.json()
    if (!res.ok) {
      return new Response(JSON.stringify({ error: data.error?.message || 'LLM failed' }), { status: 500 })
    }

    const text = data.choices?.[0]?.message?.content?.trim()?.replace(/^["""]|["""]$/g, '') || ''

    if (text) {
      await env.SAVE_KV.put(cacheKey, text, { expirationTtl: 86400 * 90 })
    }

    return new Response(JSON.stringify({ text, cached: false }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: 'summary failed' }), { status: 500 })
  }
}

function simpleHash(s) {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h) + s.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h).toString(36)
}
