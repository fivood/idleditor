import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' })

  const { code, data } = req.body
  if (!code || !data) return res.status(400).json({ error: 'code and data required' })

  const key = `save:${code}`
  try {
    await redis.set(key, JSON.stringify(data))
    return res.json({ ok: true })
  } catch (err) {
    console.error('save error:', err)
    return res.status(500).json({ error: 'save failed' })
  }
}
