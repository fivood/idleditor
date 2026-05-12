import { useState } from 'react'
import type { Manuscript } from '@/core/types'
import { GENRE_ICONS } from '@/core/types'

interface Props {
  manuscript: Manuscript
  onConfirm: () => void
  onCancel: () => void
}

export function CoverSelectModal({ manuscript, onConfirm, onCancel }: Props) {
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(
    manuscript.cover.type === 'uploaded' ? manuscript.cover.src : null,
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const icon = GENRE_ICONS[manuscript.genre] ?? '📖'

  async function handleGenerate() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/generate-cover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: manuscript.synopsis }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setGeneratedUrl(data.imageUrl)
    } catch (e) {
      setError(e instanceof Error ? e.message : '生成失败')
    } finally {
      setLoading(false)
    }
  }

  const displayCover = generatedUrl
    ? generatedUrl
    : manuscript.cover.src
      ? manuscript.cover.src
      : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-card rounded-xl shadow-2xl w-[520px] max-h-[90vh] overflow-y-auto p-6">
        <h2 className="text-base font-serif font-bold text-ink mb-1">选择封面</h2>
        <p className="text-xs text-muted mb-4">
          《{manuscript.title}》· {manuscript.genre}
        </p>

        {/* Synopsis preview */}
        <div className="bg-paper rounded-lg p-3 mb-4">
          <p className="text-xs text-muted leading-relaxed">{manuscript.synopsis}</p>
        </div>

        {/* Cover preview */}
        <div className="mb-4">
          <div
            className="w-full aspect-[3/4] rounded-lg border border-border flex items-center justify-center overflow-hidden bg-paper"
          >
            {displayCover ? (
              <img
                src={displayCover}
                alt="封面预览"
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.currentTarget
                  target.style.display = 'none'
                  target.parentElement!.querySelector('.fallback')!.classList.remove('hidden')
                }}
              />
            ) : null}
            <div className={`fallback flex flex-col items-center gap-2 ${displayCover ? 'hidden' : ''}`}>
              <span className="text-4xl">{icon}</span>
              <span className="text-xs text-muted">等待生成封面</span>
            </div>
          </div>
        </div>

        {error && (
          <p className="text-xs text-red-500 mb-3">{error}</p>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleGenerate}
            disabled={loading}
            className={`flex-1 text-sm px-4 py-2 rounded-lg border transition-colors cursor-pointer ${
              loading
                ? 'bg-border text-muted border-border cursor-wait'
                : 'bg-green-bg text-green border-green-border hover:bg-green hover:text-white'
            }`}
          >
            {loading ? '生成中...' : generatedUrl ? '重新生成' : 'AI 生成封面'}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 text-sm px-4 py-2 rounded-lg bg-green text-white border border-green hover:bg-green/90 transition-colors cursor-pointer"
          >
            确认出版
          </button>
          <button
            onClick={onCancel}
            className="text-sm px-4 py-2 rounded-lg border border-border text-muted hover:text-ink transition-colors cursor-pointer"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  )
}
