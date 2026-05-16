import { checkRateLimit, getClientIP, sanitizeForPrompt, validateLength, errorResponse, jsonResponse } from './_shared.js'

export async function onRequestPost(context) {
  const { request, env } = context

  try {
    // Rate limit: 10 decisions per 5 minutes per IP
    const ip = getClientIP(request)
    const rl = await checkRateLimit(env, `decision:${ip}`, 10, 300)
    if (!rl.allowed) {
      return errorResponse('Rate limit exceeded. Try again later.', 429)
    }

    const { context: gameCtx } = await request.json()
    if (!gameCtx) {
      return errorResponse('context required')
    }

    // Validate context length (max 2000 chars)
    const lenCheck = validateLength(gameCtx, 2000, 'context')
    if (!lenCheck.valid) return errorResponse(lenCheck.error)

    // Sanitize user-provided context before injecting into prompt
    const sanitized = sanitizeForPrompt(gameCtx, 2000)
    if (!sanitized) {
      return errorResponse('context is empty after sanitization')
    }

    const apiKey = env.LLM_API_KEY
    if (!apiKey) {
      return errorResponse('LLM not configured', 500)
    }

    const provider = env.LLM_BASE_URL || 'https://api.deepseek.com'
    const model = env.LLM_MODEL || 'deepseek-chat'

    const prompt = `你是一家中外文出版社的游戏事件生成器。根据当前游戏状态，生成一个有趣的二选一决策事件。用中文输出。

当前游戏状态：
${sanitized}

返回一个JSON对象，格式为：
{
  "title": "决策标题（简短，吸引人）",
  "description": "决策背景描述（2-3句，有幽默感）",
  "options": [
    { "label": "选项A标签（简短）", "description": "选项A后果描述" },
    { "label": "选项B标签（简短）", "description": "选项B后果描述" }
  ]
}

规则：
- 事件要符合"出版社经营"主题
- 两个选项要有真实的权衡（不是明显的好坏）
- 后果描述简洁，包含数值或概率
- 风格偏冷幽默、吐槽感
- 不要使用破折号
- 只返回JSON，不要其他文字`

    const res = await fetch(`${provider}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 400,
        temperature: 0.95,
        response_format: { type: 'json_object' },
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      return errorResponse(data.error?.message || 'LLM failed', 500)
    }

    const text = data.choices?.[0]?.message?.content?.trim() || ''

    // Validate that the response is valid JSON with expected structure
    let parsed
    try {
      parsed = JSON.parse(text)
    } catch {
      return errorResponse('LLM returned invalid JSON', 500)
    }

    if (!parsed.title || !parsed.description || !Array.isArray(parsed.options) || parsed.options.length < 2) {
      return errorResponse('LLM returned malformed decision', 500)
    }

    // Only return the expected fields to prevent data leakage
    return jsonResponse({
      title: String(parsed.title).slice(0, 100),
      description: String(parsed.description).slice(0, 500),
      options: parsed.options.slice(0, 3).map(opt => ({
        label: String(opt.label || '').slice(0, 50),
        description: String(opt.description || '').slice(0, 200),
      })),
    })
  } catch (err) {
    return errorResponse('decision generation failed', 500)
  }
}
