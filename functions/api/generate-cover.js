import { checkRateLimit, getClientIP, sanitizeForPrompt, validateLength, errorResponse, jsonResponse } from './_shared.js'

export async function onRequestPost(context) {
  const { request, env } = context

  try {
    // Rate limit: 5 cover generations per 10 minutes per IP (DALL-E is expensive)
    const ip = getClientIP(request)
    const rl = await checkRateLimit(env, `cover:${ip}`, 5, 600)
    if (!rl.allowed) {
      return errorResponse('Rate limit exceeded. Max 5 covers per 10 minutes.', 429)
    }

    const { prompt } = await request.json()
    if (!prompt) {
      return errorResponse('prompt required')
    }

    // Validate prompt length (max 500 chars for cover description)
    const lenCheck = validateLength(prompt, 500, 'prompt')
    if (!lenCheck.valid) return errorResponse(lenCheck.error)

    // Sanitize prompt to prevent injection
    const sanitized = sanitizeForPrompt(prompt, 500)
    if (!sanitized) {
      return errorResponse('prompt is empty after sanitization')
    }

    const fullPrompt = `A book cover illustration for a Chinese novel. Style: minimalist, elegant, editorial design with subtle surreal elements. No text on the cover. Novel synopsis: ${sanitized}`

    if (!env.OPENAI_API_KEY) {
      const hash = sanitized.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
      const hue = Math.abs(hash) % 360
      const placeholderUrl = `https://placehold.co/400x560/${hue.toString(16).padStart(2, '0')}5070/${(hue + 180) % 360}${hue % 50 + 30}/svg?text=cover`
      return jsonResponse({ imageUrl: placeholderUrl, placeholder: true })
    }

    const openaiRes = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: fullPrompt,
        n: 1,
        size: '1024x1024',
      }),
    })

    const data = await openaiRes.json()
    if (!openaiRes.ok) {
      return errorResponse(data.error?.message || 'generation failed', 500)
    }

    const imageUrl = data.data?.[0]?.url
    if (!imageUrl) {
      return errorResponse('no image returned', 500)
    }

    return jsonResponse({ imageUrl })
  } catch (err) {
    return errorResponse('generation failed', 500)
  }
}
