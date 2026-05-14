import { useState, useMemo, useRef, useEffect } from 'react'
import { useGameStore } from '@/store/gameStore'
import type { Manuscript } from '@/core/types'
import { GENRE_ICONS } from '@/core/types'

const GENRE_LABELS: Record<string, string> = {
  'sci-fi': '科幻', mystery: '推理', suspense: '悬疑',
  'social-science': '社科', hybrid: '混合', 'light-novel': '轻小说',
}

// Light grayscale spine palette
const SPINE_GRAYS = ['#e8e8e4', '#e0e0dc', '#dcdcd8', '#d6d6d2', '#d0d0cc', '#ccccca', '#c6c6c4', '#c0c0be']

function spineGrayForBook(book: Manuscript): string {
  // Hash-based stable assignment
  let h = 0
  for (let i = 0; i < book.id.length; i++) h = ((h << 5) - h) + book.id.charCodeAt(i)
  // Age factor: older books get slightly darker/warmer tone
  const age = (book.publishTime || 0) > 0 ? 1 : 0
  const idx = (Math.abs(h) + age * 2) % SPINE_GRAYS.length
  return SPINE_GRAYS[idx]
}

export function ShelfView() {
  const manuscripts = useGameStore(s => s.manuscripts)

  const books = useMemo(
    () => [...manuscripts.values()].filter(m => m.status === 'published'),
    [manuscripts],
  )

  const [selectedBook, setSelectedBook] = useState<Manuscript | null>(null)
  const [sortBy, setSortBy] = useState<'sales' | 'quality' | 'recent'>('recent')
  const [filterGenre, setFilterGenre] = useState<string | null>(null)
  const [showGenreLabels, setShowGenreLabels] = useState(true)

  const sorted = useMemo(() => {
    let list = [...books]
    if (filterGenre) list = list.filter(b => b.genre === filterGenre)
    if (sortBy === 'sales') list.sort((a, b) => b.salesCount - a.salesCount)
    else if (sortBy === 'quality') list.sort((a, b) => b.quality - a.quality)
    else list.sort((a, b) => (b.publishTime || 0) - (a.publishTime || 0))
    return list
  }, [books, sortBy, filterGenre])

  const stats = useMemo(() => {
    const totalSales = books.reduce((s, b) => s + b.salesCount, 0)
    const bestseller = books.reduce((best, b) => b.salesCount > (best?.salesCount || 0) ? b : best, books[0] || null)
    return { totalSales, bestseller, total: books.length }
  }, [books])

  // Newest books (last 3 published)
  const newest = useMemo(() => {
    return [...books].sort((a, b) => (b.publishTime || 0) - (a.publishTime || 0)).slice(0, 3)
  }, [books])

  // Books per shelf row
  const containerRef = useRef<HTMLDivElement>(null)
  const [booksPerRow, setBooksPerRow] = useState(10)
  useEffect(() => {
    function update() {
      const w = containerRef.current?.clientWidth || 400
      setBooksPerRow(Math.max(4, Math.floor((w - 32) / 24)))
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  // Group into shelves, with optional genre labels
  const shelves = useMemo(() => {
    const rows: { genre: string | null; books: Manuscript[] }[] = []
    if (showGenreLabels && !filterGenre) {
      // Group by genre
      const groups: Record<string, Manuscript[]> = {}
      for (const b of sorted) {
        groups[b.genre] = groups[b.genre] || []
        groups[b.genre].push(b)
      }
      for (const [genre, genreBooks] of Object.entries(groups)) {
        for (let i = 0; i < genreBooks.length; i += booksPerRow) {
          rows.push({ genre: i === 0 ? genre : null, books: genreBooks.slice(i, i + booksPerRow) })
        }
      }
    } else {
      for (let i = 0; i < sorted.length; i += booksPerRow) {
        rows.push({ genre: null, books: sorted.slice(i, i + booksPerRow) })
      }
    }
    return rows
  }, [sorted, booksPerRow, showGenreLabels, filterGenre])

  if (books.length === 0) {
    return (
      <div className="h-full overflow-y-auto p-3 md:p-5">
        <p className="text-muted text-xs md:text-sm font-mono">还没有出版过任何书。</p>
        <p className="text-muted text-[16px] md:text-xs mt-1 font-mono">在桌面上审稿，出版你的第一本书。</p>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto flex flex-col" ref={containerRef}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 md:px-4 py-2 md:py-3 shrink-0">
        <h2 className="text-xs md:text-sm font-bold text-ink font-mono">{sorted.length} 本书</h2>
        <div className="flex gap-1 items-center">
          <button onClick={() => setShowGenreLabels(!showGenreLabels)} className={`text-[14px] md:text-xs px-2 py-0.5 border-2 border-border-dark font-mono cursor-pointer transition-all ${showGenreLabels ? 'bg-copper text-white' : 'bg-cream text-muted'}`}>
            分类
          </button>
          <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)} className="text-[14px] md:text-xs px-2 py-0.5 border-2 border-border-dark bg-cream text-ink font-mono cursor-pointer">
            <option value="recent">最近</option>
            <option value="sales">销量</option>
            <option value="quality">品质</option>
          </select>
          <select value={filterGenre || ''} onChange={e => setFilterGenre(e.target.value || null)} className="text-[14px] md:text-xs px-2 py-0.5 border-2 border-border-dark bg-cream text-ink font-mono cursor-pointer">
            <option value="">全部</option>
            {Object.entries(GENRE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-3 md:gap-4 px-3 md:px-4 py-1.5 text-[14px] md:text-xs font-mono text-muted bg-card-inset border-t-2 border-b-2 border-border-dark shrink-0">
        <span>总销量 {Math.round(stats.totalSales).toLocaleString()} 册</span>
        {stats.bestseller && <span>畅销王 《{stats.bestseller.title.slice(0, 6)}》</span>}
      </div>

      {/* Featured new arrivals strip */}
      {newest.length > 0 && (
        <div className="shrink-0 border-b-2 border-border-dark px-3 md:px-4 py-2" style={{ background: 'linear-gradient(180deg, #f0ece4 0%, #e8e4dc 100%)' }}>
          <p className="text-[14px] md:text-xs text-muted font-mono mb-1.5">新鲜出炉</p>
          <div className="flex gap-2 md:gap-3 overflow-x-auto">
            {newest.map(book => (
              <button key={book.id} onClick={() => setSelectedBook(book)} className="flex items-center gap-2 border-2 border-border-dark bg-cream p-1.5 shadow-[2px_2px_0_#4a3728] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0_#4a3728] transition-all cursor-pointer">
                <div className="w-10 h-14 md:w-12 md:h-16 border border-border-dark overflow-hidden flex-shrink-0" style={{ backgroundColor: spineGrayForBook(book) + '44' }}>
                  {book.cover.src ? (
                    <img src={book.cover.src} alt="" className="w-full h-full object-cover" onError={(e) => { const el = e.currentTarget; if (el.src.endsWith('.png')) el.src = el.src.replace('.png', '.svg'); else el.style.display = 'none' }} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-lg opacity-40">{GENRE_ICONS[book.genre] ?? '📖'}</div>
                  )}
                </div>
                <div className="text-left min-w-0">
                  <p className="text-[12px] md:text-xs font-bold text-ink font-mono truncate" style={{ maxWidth: 120 }}>{book.title}</p>
                  <p className="text-[12px] text-muted font-mono">Q{book.quality} · {Math.round(book.salesCount).toLocaleString()}册</p>
                  {book.isBestseller && <p className="text-[12px] text-copper font-bold font-mono">★ 畅销</p>}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bookshelf */}
      <div className="flex-1 overflow-y-auto" style={{ background: 'linear-gradient(180deg, #3d2b1f 0%, #4a3728 2px, #3d2b1f 4px, #3d2b1f 100%)', backgroundSize: '100% 8px' }}>
        {shelves.map((row, rowIdx) => (
          <div key={rowIdx} className="relative">
            {/* Genre label */}
            {row.genre && (
              <div className="px-3 md:px-4 pt-2 pb-0">
                <span className="text-xs md:text-sm font-bold text-cream font-mono bg-copper/80 px-3 py-1 border-2 border-border-dark shadow-[2px_2px_0_#4a3728]">{GENRE_LABELS[row.genre]}</span>
              </div>
            )}
            {/* Books on this shelf */}
            <div className="flex items-end gap-0.5 md:gap-1 px-2 md:px-3 py-1" style={{ minHeight: 110 }}>
              {row.books.map(book => (
                <BookSpine key={book.id} book={book} onClick={() => setSelectedBook(book)} />
              ))}
            </div>
            {/* Shelf board */}
            <div className="h-3 md:h-4 w-full"
              style={{ background: 'linear-gradient(180deg, #6b4c30 0%, #8b6914 1px, #5a3d22 2px, #3d2b1f 3px, #4a3728 100%)', borderTop: '2px solid #8b6914', boxShadow: '0 2px 4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)' }}
            />
          </div>
        ))}
      </div>

      {selectedBook && <BookDetailModal book={selectedBook} onClose={() => setSelectedBook(null)} />}
    </div>
  )
}

function BookSpine({ book, onClick }: { book: Manuscript; onClick: () => void }) {
  const spineColor = spineGrayForBook(book)
  const spineW = 24
  const spineH = 90 + (Math.abs(book.id.charCodeAt(0) || 0) % 30)
  const [showTitle, setShowTitle] = useState(false)

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setShowTitle(true)}
      onMouseLeave={() => setShowTitle(false)}
      className="flex flex-col items-center cursor-pointer hover:-translate-y-[2px] transition-all shrink-0 group relative"
      style={{ width: `${spineW + 6}px` }}
    >
      <div
        className="border border-border-medium overflow-hidden transition-all group-hover:shadow-[3px_3px_0_#4a3728]"
        style={{
          width: `${spineW}px`,
          height: `${spineH}px`,
          background: `linear-gradient(135deg, ${spineColor} 0%, ${spineColor}dd 50%, ${spineColor}aa 100%)`,
          borderBottom: '2px solid rgba(0,0,0,0.15)',
        }}
      >
        {book.cover.src ? (
          <img src={book.cover.src} alt="" className="w-full h-full object-cover opacity-40"
            style={{ objectPosition: '20% 50%' }}
            onError={(e) => { const el = e.currentTarget; if (el.src.endsWith('.png')) el.src = el.src.replace('.png', '.svg'); else el.style.display = 'none' }}
          />
        ) : null}
        {/* Spine title (vertical) */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs text-ink-light opacity-60 font-mono" style={{ writingMode: 'vertical-rl', letterSpacing: '2px' }}>
            {book.title.slice(0, 8)}
          </span>
        </div>
        {book.isBestseller && (
          <div className="absolute -top-1 -right-1 text-[12px]">★</div>
        )}
      </div>
      {/* Hover tooltip */}
      {showTitle && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-ink text-cream text-[12px] font-mono px-2 py-0.5 border border-border-dark whitespace-nowrap z-10 pointer-events-none shadow-[2px_2px_0_#4a3728]">
          {book.title}
        </div>
      )}
      <span className="text-[12px] md:text-xs text-muted font-mono mt-1 text-center leading-tight truncate" style={{ width: `${spineW + 4}px` }}>
        {book.title.slice(0, 3)}
      </span>
    </button>
  )
}

function BookDetailModal({ book, onClose }: { book: Manuscript; onClose: () => void }) {
  const reissueBook = useGameStore(s => s.reissueBook)
  const generateBookReview = useGameStore(s => s.generateBookReview)
  const generateEditorNote = useGameStore(s => s.generateEditorNote)
  const llmCallsRemaining = useGameStore(s => s.llmCallsRemaining)
  const authors = useGameStore(s => s.authors)
  const greyColor = spineGrayForBook(book)
  const authorName = authors.get(book.authorId)?.name || '某作者'

  const [peerReview, setPeerReview] = useState<{ text: string; poolSize: number } | null>(null)
  const [reviewLoading, setReviewLoading] = useState(false)
  const [noteLoading, setNoteLoading] = useState(false)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-cream border-2 border-border-dark w-full max-w-[420px] max-h-[90vh] overflow-y-auto shadow-[6px_6px_0_#4a3728]">
        <div className="flex items-center justify-between p-3 md:p-4 border-b-2 border-border-dark">
          <h2 className="text-sm md:text-base font-bold text-ink font-mono truncate">{book.title}</h2>
          <button onClick={onClose} className="text-xs md:text-xs px-2 py-1 border-2 border-border-dark text-muted font-mono cursor-pointer bg-cream">X</button>
        </div>
        <div className="p-3 md:p-4">
          <div className="border-2 border-border-dark bg-card-inset mb-3 md:mb-4 mx-auto" style={{ width: 'min(200px, 50vw)', height: 'min(280px, 70vw)' }}>
            {book.cover.src ? (
              <img src={book.cover.src} alt="" className="w-full h-full object-cover" onError={(e) => { const el = e.currentTarget; if (el.src.endsWith('.png')) el.src = el.src.replace('.png', '.svg'); else el.style.display = 'none' }} />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2" style={{ backgroundColor: greyColor + '33' }}>
                <span className="text-[13px] md:text-xs text-muted font-mono px-2 text-center">{book.title}</span>
              </div>
            )}
          </div>
          <div className="bg-card-inset border-2 border-border-dark p-2 md:p-3 mb-3 md:mb-4">
            <div className="grid grid-cols-2 gap-1.5 text-[13px] md:text-xs font-mono">
              <div><span className="text-muted">类型</span> <span className="text-ink font-bold">{book.genre}</span></div>
              <div><span className="text-muted">品质</span> <span className="text-ink font-bold">Q{book.quality}</span></div>
              <div><span className="text-muted">字数</span> <span className="text-ink font-bold">{Math.round(book.wordCount / 1000)}K</span></div>
              <div><span className="text-muted">销量</span> <span className="text-ink font-bold">{Math.round(book.salesCount).toLocaleString()} 册</span></div>
              <div className="col-span-2"><span className="text-muted">作者</span> <span className="text-ink font-bold">{authorName}</span></div>
            </div>
            {book.isBestseller && <p className="text-[13px] md:text-xs text-copper font-bold mt-1.5 font-mono">★ 畅销书</p>}
          </div>
          <div className="bg-cream-dark border-2 border-border-dark p-2 md:p-3 mb-3 md:mb-4">
            <p className="text-[13px] md:text-xs text-ink leading-relaxed font-mono">{book.synopsis}</p>
          </div>

          {/* Editor's note */}
          <div className="bg-card-inset border-2 border-border-dark p-2 md:p-3 mb-3 md:mb-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[13px] md:text-[16px] text-muted font-mono">编辑批语</p>
              {!book.editorNote && (
                <button
                  onClick={async () => { setNoteLoading(true); await generateEditorNote(book.id); setNoteLoading(false) }}
                  disabled={noteLoading}
                  className="text-[15px] md:text-xs px-2 py-0.5 border-2 border-border-dark text-muted font-mono cursor-pointer bg-cream hover:bg-cream-dark transition-all disabled:opacity-50"
                >
                  {noteLoading ? '...' : '写批语'}
                </button>
              )}
            </div>
            {book.editorNote ? (
              <p className="text-[13px] md:text-xs text-ink-light leading-relaxed font-mono italic">{book.editorNote}</p>
            ) : (
              <p className="text-[13px] md:text-xs text-muted leading-relaxed font-mono italic">暂无批语。点击 🔄 用LLM生成一段调侃。</p>
            )}
          </div>

          {/* Peer recommendation (was reader review) */}
          {peerReview ? (
            <div className="bg-cream-dark border-2 border-progress p-2 md:p-3 mb-2">
              <p className="text-[13px] md:text-[16px] text-progress font-mono mb-0.5">同行推荐语 ×{peerReview.poolSize}</p>
              <p className="text-[13px] md:text-xs text-ink leading-relaxed font-mono italic">"{peerReview.text}"</p>
            </div>
          ) : (
            <button
              onClick={async () => { setReviewLoading(true); const r = await generateBookReview(book.title, book.genre); if (r) setPeerReview(r); setReviewLoading(false) }}
              disabled={reviewLoading}
              className="w-full text-[13px] md:text-xs px-3 py-1.5 border-2 border-border-dark text-progress font-mono cursor-pointer bg-cream hover:bg-cream-dark transition-all mb-2 disabled:opacity-50"
            >
              {reviewLoading ? '生成中...' : llmCallsRemaining <= 0 ? '同行推荐语（已达上限）' : '同行推荐语'}
            </button>
          )}

          {book.reissueBoostUntil && <p className="text-[13px] md:text-[16px] text-progress font-mono mb-2">营销窗口期中 · 销量 ×1.5</p>}
          <div className="flex gap-1.5 md:gap-2">
            <button onClick={() => reissueBook(book.id)} disabled={book.meticulouslyEdited} className={`flex-1 text-[13px] md:text-xs px-3 md:px-4 py-1.5 md:py-2 border-2 border-border-dark font-mono cursor-pointer transition-all shadow-[2px_2px_0_#4a3728] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] ${book.meticulouslyEdited ? 'bg-cream-dark text-muted cursor-not-allowed' : 'bg-progress text-white'}`}>
              {book.meticulouslyEdited ? '已再版' : `再版 (${200 + Math.floor(book.quality * 5)} 税)`}
            </button>
            <button onClick={onClose} className="flex-1 text-[13px] md:text-xs px-3 md:px-4 py-1.5 md:py-2 border-2 border-border-dark bg-copper text-white font-mono cursor-pointer shadow-[3px_3px_0_#4a3728] active:shadow-none active:translate-x-[3px] active:translate-y-[3px] transition-all">放回书架</button>
          </div>
        </div>
      </div>
    </div>
  )
}
