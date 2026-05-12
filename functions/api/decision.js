export async function onRequestPost(context) {
  const { request, env } = context

  try {
    const { context: gameCtx } = await request.json()
    if (!gameCtx) {
      return new Response(JSON.stringify({ error: 'context required' }), { status: 400 })
    }

    const apiKey = env.LLM_API_KEY
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'LLM not configured' }), { status: 500 })
    }

    const provider = env.LLM_BASE_URL || 'https://api.deepseek.com'
    const model = env.LLM_MODEL || 'deepseek-chat'

    const prompt = `你是一家中外文出版社的游戏事件生成器。根据当前游戏状态，生成一个有趣的二选一决策事件。用中文输出。

当前游戏状态：
${gameCtx}

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
      return new Response(JSON.stringify({ error: data.error?.message || 'LLM failed' }), { status: 500 })
    }

    const text = data.choices?.[0]?.message?.content?.trim() || ''
    const parsed = JSON.parse(text)
    return new Response(JSON.stringify(parsed), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: 'decision generation failed' }), { status: 500 })
  }
}
