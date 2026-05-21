import { checkRateLimit, getClientIP, sanitizeForPrompt, errorResponse, jsonResponse } from './_shared.js'

/**
 * 把玩家记忆碎片 + 书名 + 题材送给 LLM，返回梦境创作书的简介 + 可选章节摘录。
 *
 * 入参：
 *   memories: PlayerMemory[]   1-5 条玩家记忆
 *   title:    string           书名
 *   genre:    Genre            题材（决定文风）
 *   tier:     'sketch' | 'short' | 'novella' | 'novel' | 'magnum'  梦境投入档位
 *   playerName: string         玩家名（"217 岁吸血鬼编辑 XX"）
 *   currentEpoch: number       当前第几次纪元
 *
 * 出参：
 *   { synopsis: string, excerpts?: string[] }
 *
 * 服务端环境变量（任一可工作）：
 *   - LLM_BASE_URL + LLM_API_KEY + LLM_MODEL（OpenAI / DeepSeek 风格 chat/completions）
 *   - LLM_BASE_URL 单独设置（例如本地 Ollama: http://localhost:11434）+ LLM_MODEL，
 *     不需要 API key 时也能工作（Ollama 没有鉴权）
 *
 * 缺所有配置时返回本地模板兜底，离线也能玩。
 */
export async function onRequestPost(context) {
  const { request, env } = context

  try {
    const ip = getClientIP(request)
    const rl = await checkRateLimit(env, `dream-memories:${ip}`, 20, 600)
    if (!rl.allowed) {
      return errorResponse('Rate limit exceeded. Try again later.', 429)
    }

    const body = await request.json()
    const memories = Array.isArray(body.memories) ? body.memories.slice(0, 5) : []
    const title = String(body.title || '').slice(0, 60)
    const genre = String(body.genre || 'hybrid').slice(0, 30)
    const tier = String(body.tier || 'short').slice(0, 16)
    const playerName = String(body.playerName || '主编').slice(0, 30)
    const currentEpoch = Number.isFinite(body.currentEpoch) ? body.currentEpoch : 1

    if (!title || memories.length === 0) {
      return errorResponse('title 与 memories 必填', 400)
    }

    // 把记忆数组格式化成给 LLM 的 prompt 段落
    const memoryLines = memories.map((m, i) => {
      const raw = String(m?.text ?? '').slice(0, 200)
      const text = sanitizeForPrompt(raw, 200)
      const year = Number.isFinite(m?.capturedYear) ? m.capturedYear : 0
      const epoch = Number.isFinite(m?.capturedEpoch) ? m.capturedEpoch : currentEpoch
      const epochTag = epoch !== currentEpoch ? `（第${epoch}次纪元 · 距今${currentEpoch - epoch}世）` : ''
      return `[记忆 ${i + 1}${epochTag}] 第${year}年：${text}`
    }).join('\n')

    const cleanTitle = sanitizeForPrompt(title, 60) || '梦境之书'
    const cleanGenre = sanitizeForPrompt(genre, 30) || 'hybrid'
    const cleanPlayer = sanitizeForPrompt(playerName, 30) || '主编'

    // 缓存键基于记忆 + 标题 + 题材 → 同样的输入永远拿同样的输出
    const cacheSeed = `${cleanTitle}|${cleanGenre}|${tier}|${memoryLines}`
    const cacheKey = `dream-memories:${simpleHash(cacheSeed)}`
    const cached = await env.SAVE_KV.get(cacheKey)
    if (cached) {
      try {
        return jsonResponse({ ...JSON.parse(cached), cached: true })
      } catch {
        // 缓存损坏 → 重新生成
      }
    }

    // 本地模板兜底（无 LLM 配置时）
    const baseUrl = env.LLM_BASE_URL
    if (!baseUrl) {
      const localResult = localFallback(cleanTitle, cleanGenre, memoryLines, cleanPlayer, currentEpoch)
      return jsonResponse({ ...localResult, cached: false, fallback: 'local' })
    }

    const model = env.LLM_MODEL || 'deepseek-chat'
    const apiKey = env.LLM_API_KEY  // 可选——Ollama 类本地服务无需 key

    // 大档位多输出一段章节摘录
    const wantExcerpts = tier === 'novel' || tier === 'magnum'
    const excerptHint = wantExcerpts
      ? '\n3. excerpts: 2 段第一章节的开头摘录，每段 100-150 字，第一人称视角'
      : ''

    const prompt = `你是 ${cleanPlayer}——一位活过 ${currentEpoch} 个纪元（${currentEpoch * 10} 年以上）的吸血鬼主编。永夜出版社的工作让你阅尽过百本书的命运。现在你陷入了"梦境写作"的状态，准备把自己的真实经历熔铸成一本小说。

【你过往的经历片段】
${memoryLines}

【你打算写的书】
- 标题：《${cleanTitle}》
- 题材：${cleanGenre}
- 体量档位：${tier}（${tierLabel(tier)}）

请你以"作者前言"的口吻写：
1. synopsis: 一段约 180 字的简介（不要超过 250 字），把上面记忆里至少 2-3 条提炼或暗示进去，但不要直接复述
   风格：冷幽默 + 怀旧感 + 永夜世界的吸血鬼视角；避免说教
   不要破折号 — 用句号或分号代替${excerptHint}

只输出 JSON：{"synopsis": "...", "excerpts": ${wantExcerpts ? '["...", "..."]' : '[]'}}`

    const headers = { 'Content-Type': 'application/json' }
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`

    // Try OpenAI/DeepSeek-style chat/completions; fallback to Ollama /api/chat if 404
    let res
    let data
    try {
      res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: wantExcerpts ? 800 : 400,
          temperature: 0.85,
          response_format: { type: 'json_object' },
        }),
      })
      data = await res.json()
    } catch (e) {
      const localResult = localFallback(cleanTitle, cleanGenre, memoryLines, cleanPlayer, currentEpoch)
      return jsonResponse({ ...localResult, cached: false, fallback: 'network-error' })
    }

    if (!res.ok) {
      // 试 Ollama /api/chat 兼容形态
      try {
        const res2 = await fetch(`${baseUrl}/api/chat`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: prompt }],
            stream: false,
            options: { temperature: 0.85 },
            format: 'json',
          }),
        })
        if (res2.ok) {
          data = await res2.json()
          // Ollama 返回结构是 { message: { content: "..." } }
          if (data.message?.content && !data.choices) {
            data.choices = [{ message: { content: data.message.content } }]
          }
        } else {
          const localResult = localFallback(cleanTitle, cleanGenre, memoryLines, cleanPlayer, currentEpoch)
          return jsonResponse({ ...localResult, cached: false, fallback: 'llm-error' })
        }
      } catch {
        const localResult = localFallback(cleanTitle, cleanGenre, memoryLines, cleanPlayer, currentEpoch)
        return jsonResponse({ ...localResult, cached: false, fallback: 'llm-error' })
      }
    }

    const raw = data.choices?.[0]?.message?.content || data.message?.content || ''
    let parsed
    try {
      parsed = JSON.parse(raw)
    } catch {
      // 简单提取 JSON 块
      const m = raw.match(/\{[\s\S]*\}/)
      if (m) {
        try { parsed = JSON.parse(m[0]) } catch { parsed = null }
      }
    }

    if (!parsed?.synopsis) {
      const localResult = localFallback(cleanTitle, cleanGenre, memoryLines, cleanPlayer, currentEpoch)
      return jsonResponse({ ...localResult, cached: false, fallback: 'parse-error' })
    }

    const synopsis = String(parsed.synopsis).slice(0, 600).trim()
    const excerpts = Array.isArray(parsed.excerpts) ? parsed.excerpts.slice(0, 3).map(e => String(e).slice(0, 400).trim()) : []
    const result = { synopsis, excerpts }

    await env.SAVE_KV.put(cacheKey, JSON.stringify(result), { expirationTtl: 86400 * 90 })

    return jsonResponse({ ...result, cached: false })
  } catch (err) {
    return errorResponse('dream-from-memories failed', 500)
  }
}

function tierLabel(tier) {
  return ({
    sketch:  '速写（约 12K 字）',
    short:   '短篇（约 20K 字）',
    novella: '中篇（约 50K 字）',
    novel:   '长篇（约 80K 字）',
    magnum:  '巨著（约 150K 字）',
  })[tier] || '短篇'
}

function localFallback(title, genre, memoryLines, playerName, currentEpoch) {
  return {
    synopsis: `《${title}》——${playerName} 在永夜出版社的第 ${currentEpoch} 个纪元写下的 ${genre} 作品。书里那些被换名重写的角色，原型都来自编辑部里见过的真实人物。不必猜谁是谁，重要的是这些事真的发生过——只是发生在另一个名字、另一个抬头、另一个不太一样的早晨。`,
    excerpts: [],
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
