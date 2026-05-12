const DAILY_LIMIT = 50
const MODEL = 'gpt-4o-mini'

export async function onRequestPost(context) {
  const { request, env } = context

  try {
    const { prompt } = await request.json()
    if (!prompt) {
      return new Response(JSON.stringify({ error: 'prompt required' }), { status: 400 })
    }

    // Rate limiting by IP (daily)
    const ip = request.headers.get('cf-connecting-ip') || 'unknown'
    const today = new Date().toISOString().slice(0, 10)
    const rateKey = `llm-rate:${ip}:${today}`

    const count = parseInt(await env.SAVE_KV.get(rateKey) || '0')
    if (count >= DAILY_LIMIT) {
      return new Response(JSON.stringify({ error: `今日调用已达上限（${DAILY_LIMIT}次）` }), { status: 429 })
    }
    await env.SAVE_KV.put(rateKey, String(count + 1), { expirationTtl: 86400 })

    // Server-side API key
    const apiKey = env.LLM_API_KEY
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'LLM not configured' }), { status: 500 })
    }

    // Try DeepSeek first, then fallback to OpenAI format
    const provider = env.LLM_BASE_URL || 'https://api.deepseek.com'
    const model = env.LLM_MODEL || 'deepseek-chat'

    const res = await fetch(`${provider}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: '你是一家中外文出版社的编辑，为投稿的小说写简介。用中文输出，风格偏冷幽默、带吐槽感。2-3句话，不要剧透结尾。',
          },
          { role: 'user', content: prompt },
        ],
        max_tokens: 150,
        temperature: 0.9,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      console.error('LLM error:', data.error?.message)
      return new Response(JSON.stringify({ error: data.error?.message || 'LLM failed' }), { status: 500 })
    }

    const text = data.choices?.[0]?.message?.content?.trim() || ''
    return new Response(JSON.stringify({ text }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: 'LLM failed' }), { status: 500 })
  }
}
