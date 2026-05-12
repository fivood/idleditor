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

  const displayCover = generatedUrl ?? manuscript.cover.src ?? null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-cream border-2 border-border-dark w-full max-w-[420px] max-h-[90vh] overflow-y-auto p-4 md:p-6 shadow-[6px_6px_0_#4a3728]">
        <h2 className="text-sm md:text-base font-bold text-ink mb-1 font-mono">选择封面</h2>
        <p className="text-[9px] md:text-[10px] text-muted mb-3 md:mb-4 font-mono">《{manuscript.title}》· {manuscript.genre}</p>

        <div className="bg-card-inset border-2 border-border-dark p-2 md:p-3 mb-3 md:mb-4">
          <p className="text-[10px] md:text-xs text-muted leading-relaxed font-mono">{manuscript.synopsis}</p>
        </div>

        <div className="mb-3 md:mb-4 border-2 border-border-dark bg-card-inset">
          <div className="w-full aspect-[3/4] flex items-center justify-center overflow-hidden">
            {displayCover ? (
              <img
                src={displayCover}
                alt="封面预览"
                className="w-full h-full object-cover"
                onError={(e) => { e.currentTarget.style.display = 'none' }}
              />
            ) : (
              <div className="flex flex-col items-center gap-1 md:gap-2">
                <span className="text-3xl md:text-4xl">{icon}</span>
                <span className="text-[10px] md:text-xs text-muted font-mono">等待生成封面</span>
              </div>
            )}
          </div>
        </div>

        {error && <p className="text-xs text-copper-dark mb-3 font-mono font-bold">{error}</p>}

        <div className="flex gap-1.5 md:gap-2">
          <button
            onClick={handleGenerate}
            disabled={loading}
            className={`flex-1 text-[10px] md:text-xs px-3 md:px-4 py-1.5 md:py-2 border-2 border-border-dark font-mono cursor-pointer transition-all shadow-[2px_2px_0_#4a3728] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] ${
              loading ? 'bg-cream-dark text-muted cursor-wait' : 'bg-copper text-white'
            }`}
          >
            {loading ? '生成中...' : 'AI 生成'}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 text-[10px] md:text-xs px-3 md:px-4 py-1.5 md:py-2 bg-copper text-white border-2 border-border-dark font-mono cursor-pointer shadow-[2px_2px_0_#4a3728] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"
          >
            确认出版
          </button>
          <button
            onClick={onCancel}
            className="text-[10px] md:text-xs px-2 md:px-4 py-1.5 md:py-2 border-2 border-border-dark text-muted font-mono cursor-pointer bg-cream shadow-[2px_2px_0_#4a3728] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  )
}
