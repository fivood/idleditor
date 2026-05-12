export async function onRequestPost(context) {
  const { request } = context

  try {
    const { apiKey, prompt } = await request.json()
    if (!apiKey || !prompt) {
      return new Response(JSON.stringify({ error: 'apiKey and prompt required' }), { status: 400 })
    }

    // Truncate API key for safety (first 8 chars)
    const keyPreview = apiKey.slice(0, 8)

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: '你是一家中外文出版社的编辑，为投稿的小说写简介。用中文输出，风格偏冷幽默、带吐槽感。2-3句话。不要书名号，不要剧透结尾。',
          },
          { role: 'user', content: prompt },
        ],
        max_tokens: 150,
        temperature: 0.9,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      console.error(`LLM error for key ${keyPreview}...:`, data.error?.message)
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
