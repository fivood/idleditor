import { checkRateLimit, getClientIP, validateLength, errorResponse, jsonResponse, hashSecret, checkFailedAttempts, recordFailedAttempt, clearFailedAttempts } from './_shared.js'

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

    // Validate secret strength if provided
    if (secret && secret.length < 6) {
      return errorResponse('secret must be at least 6 characters')
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
      if (meta.secretHash) {
        // Check lockout first
        const lockout = await checkFailedAttempts(env, code, ip)
        if (lockout.locked) {
          return errorResponse('Too many failed attempts. Locked for 15 minutes.', 423)
        }

        // Verify hashed secret
        const inputHash = await hashSecret(secret || '', meta.salt)
        if (inputHash !== meta.secretHash) {
          await recordFailedAttempt(env, code, ip)
          // Don't reveal whether code exists or secret is wrong
          return errorResponse('Invalid credentials', 403)
        }

        // Auth success - clear lockout
        await clearFailedAttempts(env, code, ip)
      }
    } else if (secret) {
      // First save: store hashed secret with random salt
      const salt = crypto.randomUUID()
      const secretHash = await hashSecret(secret, salt)
      await env.SAVE_KV.put(`meta:${code}`, JSON.stringify({
        secretHash,
        salt,
        createdAt: Date.now(),
        creatorIP: ip,
      }))
    }

    await env.SAVE_KV.put(key, dataStr)
    return jsonResponse({ ok: true })
  } catch (err) {
    return errorResponse('save failed', 500)
  }
}
