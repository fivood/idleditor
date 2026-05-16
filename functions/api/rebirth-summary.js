import { checkRateLimit, getClientIP, sanitizeForPrompt, validateLength, errorResponse, jsonResponse } from './_shared.js'

export async function onRequestPost(context) {
  const { request, env } = context

  try {
    // Rate limit: 5 summaries per 10 minutes per IP
    const ip = getClientIP(request)
    const rl = await checkRateLimit(env, `rebirth:${ip}`, 5, 600)
    if (!rl.allowed) {
      return errorResponse('Rate limit exceeded. Try again later.', 429)
    }

    const { stats } = await request.json()
    if (!stats) {
      return errorResponse('stats required')
    }

    // Validate stats length (max 1000 chars)
    const lenCheck = validateLength(stats, 1000, 'stats')
    if (!lenCheck.valid) return errorResponse(lenCheck.error)

    // Sanitize input
    const sanitized = sanitizeForPrompt(stats, 1000)
    if (!sanitized) {
      return errorResponse('stats is empty after sanitization')
    }

    // Unique cache key based on stats content
    const cacheKey = `rebirth-summary:${simpleHash(sanitized)}`

    const cached = await env.SAVE_KV.get(cacheKey)
    if (cached) {
      return jsonResponse({ text: cached, cached: true })
    }

    const apiKey = env.LLM_API_KEY
    if (!apiKey) {
      return errorResponse('LLM not configured', 500)
    }

    const provider = env.LLM_BASE_URL || 'https://api.deepseek.com'
    const model = env.LLM_MODEL || 'deepseek-chat'

    const prompt = `你是一位活了数百年的吸血鬼编辑。请用中文为以下编辑生涯写一段冷幽默的总结（3-4句话，150字以内，不要用破折号）。

${sanitized}

风格：冷幽默、略带怀念、带一点对出版行业荒谬感的吐槽。`

    const res = await fetch(`${provider}/chat/completions`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], max_tokens: 200, temperature: 0.9 }),
    })
    const data = await res.json()
    if (!res.ok) {
      return errorResponse(data.error?.message || 'LLM failed', 500)
    }

    const text = data.choices?.[0]?.message?.content?.trim()?.replace(/^["""]|["""]$/g, '') || ''

    if (text) {
      await env.SAVE_KV.put(cacheKey, text, { expirationTtl: 86400 * 90 })
    }

    return jsonResponse({ text, cached: false })
  } catch (err) {
    return errorResponse('summary failed', 500)
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
