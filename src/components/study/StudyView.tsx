import { useState, useEffect, useCallback } from 'react'
import { db, type PlayerNovel } from '@/db/database'
import { nanoid } from '@/utils/id'

export function StudyView() {
  const [novels, setNovels] = useState<PlayerNovel[]>([])
  const [showUpload, setShowUpload] = useState(false)
  const [reading, setReading] = useState<PlayerNovel | null>(null)

  const loadNovels = useCallback(async () => {
    const list = await db.novels.orderBy('createdAt').reverse().toArray()
    setNovels(list)
  }, [])

  useEffect(() => { loadNovels() }, [loadNovels])

  return (
    <div className="h-full overflow-y-auto p-3 md:p-4">
      <div className="flex items-center justify-between mb-3 md:mb-4">
        <h2 className="text-xs md:text-sm font-bold text-ink font-mono">书房 ({novels.length})</h2>
        <button
          onClick={() => setShowUpload(true)}
          className="text-[12px] md:text-xs px-2 md:px-3 py-1 md:py-1.5 bg-copper text-white border-2 border-border-dark font-mono cursor-pointer shadow-[2px_2px_0_#4a3728] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"
        >
          + 添加
        </button>
      </div>

      {novels.length === 0 ? (
        <div className="text-center py-10 md:py-12">
          <p className="text-muted text-xs md:text-sm font-mono">书房空空如也。</p>
          <p className="text-muted text-[12px] md:text-xs mt-1 font-mono">上传你自己的小说，挂机的同时读点什么。</p>
        </div>
      ) : (
        <div className="grid gap-2">
          {novels.map(novel => {
            const progress = novel.wordCount > 0 ? Math.round(novel.readingProgress / novel.wordCount * 100) : 0
            return (
              <button
                key={novel.id}
                onClick={() => setReading(novel)}
                className="text-left bg-cream border-2 border-border-dark p-3 md:p-4 shadow-[3px_3px_0_#4a3728] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_#4a3728] transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs md:text-sm font-bold text-ink truncate font-mono">{novel.title}</p>
                    <p className="text-[12px] md:text-xs text-muted mt-0.5 font-mono">{novel.author} · {novel.wordCount.toLocaleString()} 字</p>
                    {novel.recommendation && (
                      <p className="text-[12px] md:text-xs text-ink-light mt-1.5 leading-relaxed font-mono line-clamp-2 italic">
                        "{novel.recommendation}"
                      </p>
                    )}
                  </div>
                  {progress > 0 && (
                    <span className="text-[12px] md:text-xs text-progress font-bold font-mono flex-shrink-0">{progress}%</span>
                  )}
                </div>
                {progress > 0 && (
                  <div className="h-1.5 bg-card-inset border border-border-dark overflow-hidden mt-2">
                    <div className="h-full bg-progress transition-all" style={{ width: `${progress}%` }} />
                  </div>
                )}
              </button>
            )
          })}
        </div>
      )}

      {showUpload && <UploadModal onClose={() => setShowUpload(false)} onSaved={loadNovels} />}
      {reading && <ReaderView novel={reading} onClose={() => { setReading(null); loadNovels() }} />}
    </div>
  )
}

function UploadModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [synopsis, setSynopsis] = useState('')
  const [recommendation, setRecommendation] = useState('')
  const [content, setContent] = useState('')

  async function handleSave() {
    if (!title.trim() || !content.trim()) return
    const novel: PlayerNovel = {
      id: nanoid(12),
      title: title.trim(),
      author: author.trim() || '佚名',
      synopsis: synopsis.trim(),
      recommendation: recommendation.trim(),
      content: content.trim(),
      createdAt: Date.now(),
      readingProgress: 0,
      wordCount: content.trim().length,
    }
    await db.novels.put(novel)
    onSaved()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-cream border-2 border-border-dark w-full max-w-[500px] max-h-[90vh] overflow-y-auto shadow-[6px_6px_0_#4a3728]">
        <div className="flex items-center justify-between p-3 md:p-4 border-b-2 border-border-dark">
          <h2 className="text-sm md:text-base font-bold text-ink font-mono">添加新书</h2>
          <button onClick={onClose} className="text-[14px] md:text-xs px-2 py-1 border-2 border-border-dark text-muted font-mono cursor-pointer bg-cream">X</button>
        </div>
        <div className="p-3 md:p-4 space-y-3">
          <div>
            <label className="text-[12px] md:text-xs text-muted font-mono mb-1 block">书名 *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} className="w-full px-3 py-1.5 text-xs border-2 border-border-dark bg-card-inset text-ink font-mono focus:outline-none focus:border-copper" placeholder="书名" />
          </div>
          <div>
            <label className="text-[12px] md:text-xs text-muted font-mono mb-1 block">作者</label>
            <input value={author} onChange={e => setAuthor(e.target.value)} className="w-full px-3 py-1.5 text-xs border-2 border-border-dark bg-card-inset text-ink font-mono focus:outline-none focus:border-copper" placeholder="作者署名" />
          </div>
          <div>
            <label className="text-[12px] md:text-xs text-muted font-mono mb-1 block">简介</label>
            <textarea value={synopsis} onChange={e => setSynopsis(e.target.value)} rows={2} className="w-full px-3 py-1.5 text-xs border-2 border-border-dark bg-card-inset text-ink font-mono focus:outline-none focus:border-copper resize-none" placeholder="简明扼要的介绍" />
          </div>
          <div>
            <label className="text-[12px] md:text-xs text-muted font-mono mb-1 block">推荐语</label>
            <textarea value={recommendation} onChange={e => setRecommendation(e.target.value)} rows={2} className="w-full px-3 py-1.5 text-xs border-2 border-border-dark bg-card-inset text-ink font-mono focus:outline-none focus:border-copper resize-none" placeholder="你自己的评价和推荐" />
          </div>
          <div>
            <label className="text-[12px] md:text-xs text-muted font-mono mb-1 block">正文 *</label>
            <textarea value={content} onChange={e => setContent(e.target.value)} rows={12} className="w-full px-3 py-1.5 text-xs border-2 border-border-dark bg-card-inset text-ink font-mono focus:outline-none focus:border-copper resize-y" placeholder="粘贴小说全文..." />
          </div>
          <button
            onClick={handleSave}
            disabled={!title.trim() || !content.trim()}
            className={`w-full py-2 text-xs md:text-sm border-2 border-border-dark font-mono transition-all shadow-[3px_3px_0_#4a3728] active:shadow-none active:translate-x-[3px] active:translate-y-[3px] cursor-pointer ${
              title.trim() && content.trim() ? 'bg-copper text-white' : 'bg-cream-dark text-muted cursor-not-allowed'
            }`}
          >
            保存到书房
          </button>
        </div>
      </div>
    </div>
  )
}

function ReaderView({ novel, onClose }: { novel: PlayerNovel; onClose: () => void }) {
  const [position, setPosition] = useState(novel.readingProgress)
  const total = novel.content.length
  const progress = total > 0 ? Math.round(position / total * 100) : 0

  function handleScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget
    const pct = el.scrollTop / (el.scrollHeight - el.clientHeight)
    const newPos = Math.round(pct * total)
    setPosition(newPos)
  }

  async function handleSaveProgress() {
    await db.novels.update(novel.id, { readingProgress: position })
    onClose()
  }

  // Split content into paragraphs for display
  const paragraphs = novel.content.split('\n').filter(p => p.trim())

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-cream">
      <div className="flex items-center justify-between p-3 md:p-4 border-b-2 border-border-dark bg-cream-dark shrink-0">
        <div className="min-w-0">
          <h2 className="text-sm md:text-base font-bold text-ink truncate font-mono">{novel.title}</h2>
          <p className="text-[12px] md:text-xs text-muted font-mono">{novel.author} · {total.toLocaleString()} 字 · {progress}%</p>
        </div>
        <button
          onClick={handleSaveProgress}
          className="text-[12px] md:text-xs px-3 py-1.5 bg-copper text-white border-2 border-border-dark font-mono cursor-pointer shadow-[2px_2px_0_#4a3728] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"
        >
          关闭
        </button>
      </div>

      {novel.synopsis && (
        <div className="bg-card-inset border-b-2 border-border-dark p-3 md:p-4">
          <p className="text-[12px] md:text-xs text-muted font-mono mb-1">简介</p>
          <p className="text-xs md:text-sm text-ink leading-relaxed font-mono">{novel.synopsis}</p>
        </div>
      )}

      {novel.recommendation && (
        <div className="bg-cream-dark border-b-2 border-border-dark p-3 md:p-4">
          <p className="text-[12px] md:text-xs text-muted font-mono mb-1">推荐语</p>
          <p className="text-xs md:text-sm text-ink-light leading-relaxed font-mono italic">"{novel.recommendation}"</p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 md:p-8" onScroll={handleScroll}>
        <div className="max-w-[640px] mx-auto">
          {paragraphs.map((p, i) => (
            <p key={i} className="text-sm md:text-base text-ink leading-[2] indent-8 mb-4 font-mono">
              {p}
            </p>
          ))}
          {paragraphs.length === 0 && (
            <p className="text-muted text-sm font-mono text-center py-20">（空文本）</p>
          )}
        </div>
      </div>
    </div>
  )
}
