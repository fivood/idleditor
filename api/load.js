import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'method not allowed' })

  const code = req.query.code
  if (!code) return res.status(400).json({ error: 'code required' })

  const key = `save:${code}`
  try {
    const raw = await redis.get(key)
    if (!raw) return res.json(null)
    const data = typeof raw === 'string' ? JSON.parse(raw) : raw
    return res.json(data)
  } catch (err) {
    console.error('load error:', err)
    return res.status(500).json({ error: 'load failed' })
  }
}
