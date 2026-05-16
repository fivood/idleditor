import { checkRateLimit, getClientIP, validateLength, errorResponse, jsonResponse } from './_shared.js'

export async function onRequestPost(context) {
  const { request, env } = context

  try {
    // Rate limit: 10 saves per minute per IP
    const ip = getClientIP(request)
    const rl = await checkRateLimit(env, `save:${ip}`, 10, 60)
    if (!rl.allowed) {
      return errorResponse('Rate limit exceeded. Try again later.', 429)
    }

    const body = await request.json()
    const { code, data, secret } = body

    if (!code || !data) {
      return errorResponse('code and data required')
    }

    // Validate code format (alphanumeric, 4-32 chars)
    const codeCheck = validateLength(code, 32, 'code')
    if (!codeCheck.valid) return errorResponse(codeCheck.error)
    if (!/^[a-zA-Z0-9_-]{4,32}$/.test(code)) {
      return errorResponse('code must be 4-32 alphanumeric characters')
    }

    // Validate data size (max 2MB)
    const dataStr = JSON.stringify(data)
    if (dataStr.length > 2 * 1024 * 1024) {
      return errorResponse('data exceeds 2MB limit')
    }

    const key = `save:${code}`

    // Check if save already exists - if so, verify secret
    const existingMeta = await env.SAVE_KV.get(`meta:${code}`)
    if (existingMeta) {
      const meta = JSON.parse(existingMeta)
      if (meta.secret && meta.secret !== (secret || '')) {
        return errorResponse('Invalid secret for this save code', 403)
      }
    }

    // Store metadata with secret on first save
    if (!existingMeta && secret) {
      await env.SAVE_KV.put(`meta:${code}`, JSON.stringify({ secret, createdAt: Date.now() }))
    }

    await env.SAVE_KV.put(key, dataStr)
    return jsonResponse({ ok: true })
  } catch (err) {
    return errorResponse('save failed', 500)
  }
}
