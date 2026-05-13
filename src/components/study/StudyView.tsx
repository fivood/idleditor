import { useState, useEffect, useCallback, useRef } from 'react'
import { db, type PlayerNovel, type Bookmark } from '@/db/database'
import { nanoid } from '@/utils/id'
import JSZip from 'jszip'
import { type Genre } from '@/core/types'

const GENRE_LABELS: Record<string, string> = {
  'sci-fi': '科幻', mystery: '推理', suspense: '悬疑',
  'social-science': '社科', hybrid: '混合', 'light-novel': '轻小说',
}
const ALL_GENRES: Genre[] = ['sci-fi', 'mystery', 'suspense', 'social-science', 'hybrid', 'light-novel']

function BookInfoPanel({ novel, novels, onBack, onSelect }: { novel: PlayerNovel; novels: PlayerNovel[]; onBack: () => void; onSelect: (n: PlayerNovel) => void }) {
  const [showInfo, setShowInfo] = useState(true)
  return (
    <div className="border-l-2 border-border-dark bg-cream-dark overflow-y-auto flex flex-col">
      <div className="p-3 border-b-2 border-border-dark">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-[12px] font-bold text-ink truncate font-mono">{novel.title}</h3>
          <button onClick={onBack} className="text-[12px] px-2 py-0.5 bg-copper text-white border-2 border-border-dark font-mono cursor-pointer">返回</button>
        </div>
        <p className="text-[12px] text-muted font-mono">{novel.author} · {GENRE_LABELS[novel.genre] || novel.genre} · {novel.wordCount.toLocaleString()} 字</p>
      </div>
      {(novel.synopsis || novel.recommendation) && (
        <div className="border-b-2 border-border-dark">
          <button onClick={() => setShowInfo(!showInfo)} className="w-full text-left px-3 py-1.5 text-[12px] text-muted font-mono hover:text-ink cursor-pointer">{showInfo ? '收起' : '展开'}简介与推荐语</button>
          {showInfo && (
            <div className="px-3 pb-3 space-y-2">
              {novel.synopsis && <div className="bg-card-inset border-2 border-border-dark p-2"><p className="text-[12px] text-ink leading-relaxed font-mono">{novel.synopsis}</p></div>}
              {novel.recommendation && <div className="bg-cream border-2 border-border-dark p-2"><p className="text-[12px] text-ink-light leading-relaxed font-mono italic">"{novel.recommendation}"</p></div>}
            </div>
          )}
        </div>
      )}
      {((novel.bookmarks || []).length > 0) && (
        <div className="border-b-2 border-border-dark px-3 py-2">
          <p className="text-[12px] text-muted font-mono mb-1">书签 ({(novel.bookmarks || []).length})</p>
          {[...(novel.bookmarks || [])].reverse().map((bm, i) => (
            <p key={i} className="text-[12px] text-muted font-mono">{bm.name} · {Math.round(bm.position / Math.max(1, novel.content.length) * 100)}%</p>
          ))}
        </div>
      )}
      <div className="flex-1 overflow-y-auto">
        <div className="px-3 py-2 text-[12px] text-muted font-mono border-b border-border-dark">书架 ({novels.length})</div>
        {novels.map(n => {
          const isActive = n.id === novel.id
          const prog = n.wordCount > 0 ? Math.round(n.readingProgress / n.wordCount * 100) : 0
          return (
            <button key={n.id} onClick={() => onSelect(n)} className={`w-full text-left px-3 py-1.5 text-[12px] font-mono transition-colors ${isActive ? 'bg-copper text-white' : 'hover:bg-cream text-ink'}`}>
              <span className="truncate block">{n.title}</span>
              {prog > 0 && <span className="text-[12px] opacity-60">{prog}%</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

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
    <div className="h-full flex flex-col min-h-0">
      {reading ? (
        <div className="flex-1 grid grid-cols-[1fr_260px] min-h-0">
          <ReaderInline novel={reading} />
          <BookInfoPanel novel={reading} novels={novels} onBack={() => { setReading(null); loadNovels() }} onSelect={setReading} />
        </div>
      ) : (
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
                    <p className="text-[12px] md:text-xs text-muted mt-0.5 font-mono">{novel.author} · {GENRE_LABELS[novel.genre] || novel.genre} · {novel.wordCount.toLocaleString()} 字</p>
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
        </div>
      )}
    </div>
  )
}

function UploadModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [synopsis, setSynopsis] = useState('')
  const [recommendation, setRecommendation] = useState('')
  const [content, setContent] = useState('')
  const [genre, setGenre] = useState<Genre>('hybrid')

  async function handleSave() {
    if (!title.trim() || !content.trim()) return
    const novel: PlayerNovel = {
      id: nanoid(12),
      title: title.trim(),
      author: author.trim() || '佚名',
      genre,
      synopsis: synopsis.trim(),
      recommendation: recommendation.trim(),
      content: content.trim(),
      createdAt: Date.now(),
      readingProgress: 0,
      wordCount: content.trim().length,
      bookmarks: [],
    }
    await db.novels.put(novel)
    onSaved()
    onClose()
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      alert('文件不能超过 5MB')
      return
    }

    const ext = file.name.split('.').pop()?.toLowerCase()

    if (ext === 'txt' || ext === 'md') {
      const reader = new FileReader()
      reader.onload = () => {
        const text = reader.result as string
        setContent(text)
        if (!title) setTitle(file.name.replace(/\.(txt|md)$/, ''))
      }
      reader.readAsText(file)
      return
    }

    if (ext === 'epub') {
      try {
        const buffer = await file.arrayBuffer()
        const zip = await JSZip.loadAsync(buffer)
        // Find container.xml to locate the OPF file
        const containerXml = await zip.file('META-INF/container.xml')?.async('string')
        if (!containerXml) { alert('无法解析 EPUB：缺少 container.xml'); return }
        const opfMatch = containerXml.match(/full-path="([^"]+)"/)
        if (!opfMatch) { alert('无法解析 EPUB：找不到 OPF 文件路径'); return }
        const opfPath = opfMatch[1]
        const opfXml = await zip.file(opfPath)?.async('string')
        if (!opfXml) { alert('无法解析 EPUB：找不到 OPF 文件'); return }

        // Extract all spine items in order
        const itemRefs = [...opfXml.matchAll(/<itemref[^>]*idref="([^"]+)"/g)].map(m => m[1])
        const itemMap = new Map<string, string>()
        for (const m of opfXml.matchAll(/<item[^>]*id="([^"]*)"[^>]*href="([^"]*)"/g)) {
          itemMap.set(m[1], m[2])
        }

        // Read each content file and extract text
        const opfDir = opfPath.split('/').slice(0, -1).join('/')
        const chunks: string[] = []
        for (const idref of itemRefs) {
          const href = itemMap.get(idref)
          if (!href) continue
          const fullPath = opfDir ? `${opfDir}/${href}` : href
          const html = await zip.file(fullPath)?.async('string')
          if (!html) continue
          // Strip HTML tags, decode entities
          const text = html
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<p[^>]*>/gi, '\n')
            .replace(/<\/p>/gi, '')
            .replace(/<[^>]+>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/\n{3,}/g, '\n\n')
            .trim()
          if (text) chunks.push(text)
        }

        const result = chunks.join('\n\n')
        setContent(result)
        if (!title) setTitle(file.name.replace('.epub', ''))
      } catch {
        alert('EPUB 解析失败，请确认文件格式正确')
      }
      return
    }

    alert('支持格式：.txt / .md / .epub')
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
            <label className="text-[12px] md:text-xs text-muted font-mono mb-1 block">分类</label>
            <div className="grid grid-cols-3 gap-1">
              {ALL_GENRES.map(g => (
                <button
                  key={g}
                  onClick={() => setGenre(g)}
                  className={`text-[12px] px-2 py-1 border-2 border-border-dark font-mono transition-all ${
                    genre === g ? 'bg-copper text-white' : 'bg-cream text-muted hover:bg-cream-dark'
                  }`}
                >
                  {GENRE_LABELS[g]}
                </button>
              ))}
            </div>
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
            <div className="flex items-center gap-2 mb-1.5">
              <label className="text-[12px] md:text-xs text-progress font-mono cursor-pointer hover:underline">
                <input type="file" accept=".txt,.md,.epub" onChange={handleFileUpload} className="hidden" />
                上传 .txt / .md / .epub
              </label>
              <span className="text-[12px] text-muted font-mono">或直接粘贴</span>
            </div>
            <p className="text-[12px] text-muted font-mono mb-1 leading-relaxed">
              支持 .txt / .md / .epub 上传（5MB 内）。数据存储在浏览器本地，不上传服务器。
            </p>
            <textarea value={content} onChange={e => setContent(e.target.value)} rows={12} className="w-full px-3 py-1.5 text-xs border-2 border-border-dark bg-card-inset text-ink font-mono focus:outline-none focus:border-copper resize-y" placeholder="粘贴小说全文，或将 .txt 拖入上方区域..." />
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

function ReaderInline({ novel }: { novel: PlayerNovel }) {
  const [position, setPosition] = useState(novel.readingProgress)
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(novel.bookmarks || [])
  const [showBookmarks, setShowBookmarks] = useState(false)
  const [newBookmarkName, setNewBookmarkName] = useState('')
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const total = novel.content.length
  const progress = total > 0 ? Math.round(position / total * 100) : 0

  function scheduleSave(pos: number) {
    setPosition(pos)
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      db.novels.update(novel.id, { readingProgress: pos })
    }, 5000)
  }

  function handleScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget
    const pct = el.scrollTop / (el.scrollHeight - el.clientHeight)
    const newPos = Math.round(pct * total)
    scheduleSave(newPos)
  }

  async function addBookmark() {
    const name = newBookmarkName.trim() || `位置 ${progress}%`
    const bm: Bookmark = { name, position, createdAt: Date.now() }
    const updated = [...bookmarks, bm]
    setBookmarks(updated)
    setNewBookmarkName('')
    await db.novels.update(novel.id, { bookmarks: updated })
  }

  async function removeBookmark(index: number) {
    const updated = bookmarks.filter((_, i) => i !== index)
    setBookmarks(updated)
    await db.novels.update(novel.id, { bookmarks: updated })
  }

  function jumpToBookmark(bm: Bookmark) {
    const el = document.getElementById('reader-content')
    if (!el) return
    const pct = bm.position / total
    el.scrollTop = pct * (el.scrollHeight - el.clientHeight)
    setShowBookmarks(false)
  }

  useEffect(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    return () => {
      db.novels.update(novel.id, { readingProgress: position, bookmarks }).catch(() => {})
    }
  }, [])

  const paragraphs = novel.content.split('\n').filter(p => p.trim())

  function renderLine(line: string, i: number) {
    // Headings
    if (/^### (.+)/.test(line)) {
      return <h3 key={i} className="text-sm md:text-base font-bold text-ink mt-4 mb-2 font-mono">{line.replace(/^### /, '')}</h3>
    }
    if (/^## (.+)/.test(line)) {
      return <h2 key={i} className="text-base md:text-lg font-bold text-ink mt-4 mb-2 font-mono">{line.replace(/^## /, '')}</h2>
    }
    if (/^# (.+)/.test(line)) {
      return <h1 key={i} className="text-lg md:text-xl font-bold text-ink mt-4 mb-2 font-mono">{line.replace(/^# /, '')}</h1>
    }
    // Horizontal rule
    if (/^[-*_]{3,}$/.test(line.trim())) {
      return <hr key={i} className="border-border-dark my-4" />
    }
    // Bullet lists
    if (/^[-*] (.+)/.test(line)) {
      return <p key={i} className="text-sm md:text-base text-ink leading-[2] pl-4 mb-1 font-mono">- {renderInline(line.replace(/^[-*] /, ''))}</p>
    }
    // Numbered lists
    if (/^\d+\. (.+)/.test(line)) {
      return <p key={i} className="text-sm md:text-base text-ink leading-[2] pl-4 mb-1 font-mono">{renderInline(line)}</p>
    }
    // Bold and italic inline
    return (
      <p key={i} className="text-sm md:text-base text-ink leading-[2] indent-8 mb-4 font-mono">
        {renderInline(line)}
      </p>
    )
  }

  function renderInline(text: string): React.ReactNode {
    return text
      .split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g)
      .map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) return <strong key={i} className="font-bold">{part.slice(2, -2)}</strong>
        if (part.startsWith('*') && part.endsWith('*')) return <em key={i} className="italic">{part.slice(1, -1)}</em>
        if (part.startsWith('`') && part.endsWith('`')) return <code key={i} className="bg-card-inset px-1 text-xs">{part.slice(1, -1)}</code>
        return part
      })
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex items-center justify-between px-3 md:px-4 py-1.5 border-b-2 border-border-dark bg-cream-dark shrink-0">
        <span className="text-[12px] md:text-xs text-muted font-mono">{progress}%</span>
        <div className="flex items-center gap-2">
          <button onClick={() => { setShowBookmarks(!showBookmarks) }} className="text-[12px] md:text-xs border-2 border-border-dark text-muted font-mono cursor-pointer bg-cream px-2 py-0.5">
            书签 ({bookmarks.length})
          </button>
        </div>
      </div>

      {showBookmarks && (
        <div className="bg-cream-dark border-b-2 border-border-dark p-2 md:p-3">
          <div className="flex gap-2 mb-2">
            <input value={newBookmarkName} onChange={e => setNewBookmarkName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addBookmark()} placeholder="书签名..." className="flex-1 px-2 py-1 text-[12px] border-2 border-border-dark bg-card-inset text-ink font-mono focus:outline-none focus:border-copper" />
            <button onClick={addBookmark} className="text-[12px] px-3 py-1 bg-copper text-white border-2 border-border-dark font-mono cursor-pointer">添加</button>
          </div>
          {bookmarks.length > 0 ? (
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {[...bookmarks].reverse().map((bm, i) => (
                <div key={i} className="flex items-center justify-between text-[12px] font-mono">
                  <button onClick={() => jumpToBookmark(bm)} className="text-progress hover:underline text-left">{bm.name} ({Math.round(bm.position / Math.max(1, total) * 100)}%)</button>
                  <button onClick={() => removeBookmark(bookmarks.length - 1 - i)} className="text-muted">X</button>
                </div>
              ))}
            </div>
          ) : <p className="text-[12px] text-muted font-mono">暂无书签</p>}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 md:p-8" onScroll={handleScroll} id="reader-content">
        <div className="max-w-[640px] mx-auto">
          {paragraphs.map((p, i) => renderLine(p, i))}
          {paragraphs.length === 0 && (
            <p className="text-muted text-sm font-mono text-center py-20">（空文本）</p>
          )}
        </div>
      </div>
    </div>
  )
}
