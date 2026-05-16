import { useState, useMemo, useRef, useEffect } from 'react'
import { useGameStore } from '@/store/gameStore'
import type { Manuscript } from '@/core/types'
import { GENRE_LABELS } from '@/core/types'

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
  const bookstores = useGameStore(s => s.bookstores)
  const currencies = useGameStore(s => s.currencies)
  const openBookstore = useGameStore(s => s.openBookstore)
  const stockBook = useGameStore(s => s.stockBook)
  const unstockBook = useGameStore(s => s.unstockBook)
  const hostSigning = useGameStore(s => s.hostSigning)

  const books = useMemo(
    () => [...manuscripts.values()].filter(m => m.status === 'published'),
    [manuscripts],
  )

  const [selectedBook, setSelectedBook] = useState<Manuscript | null>(null)
  const [sortBy, setSortBy] = useState<'sales' | 'quality' | 'recent'>('recent')
  const [filterGenre, setFilterGenre] = useState<string | null>(null)
  const [showGenreLabels, setShowGenreLabels] = useState(true)
  const [storeTab, setStoreTab] = useState<boolean>(true)

  // Books stocked in any store
  const stockedIds = useMemo(() => {
    const ids = new Set<string>()
    for (const store of bookstores) for (const id of store.shelf) ids.add(id)
    return ids
  }, [bookstores])

  const sorted = useMemo(() => {
    let list = [...books]
    if (filterGenre) list = list.filter(b => b.genre === filterGenre)
    if (sortBy === 'sales') list.sort((a, b) => b.salesCount - a.salesCount)
    else if (sortBy === 'quality') list.sort((a, b) => b.quality - a.quality)
    else list.sort((a, b) => (b.publishTime || 0) - (a.publishTime || 0))
    return list
  }, [books, sortBy, filterGenre])

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

  const shelves = useMemo(() => {
    const rows: { genre: string | null; books: Manuscript[] }[] = []
    if (showGenreLabels && !filterGenre) {
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
        <div className="flex items-center gap-2">
          <h2 className="text-xs md:text-sm font-bold text-ink font-mono">{sorted.length} 本书</h2>
          <button onClick={() => setStoreTab(!storeTab)} className={`text-[14px] md:text-xs px-2 py-0.5 border-2 border-border-dark font-mono cursor-pointer transition-all ${storeTab ? 'bg-copper text-white' : 'bg-cream text-muted'}`}>
            🏪 {bookstores.length}
          </button>
        </div>
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

      {/* Bookstore panel */}
      {storeTab && (
        <div className="shrink-0 border-b-2 border-border-dark px-3 md:px-4 py-2 bg-cream-dark">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] md:text-xs font-bold text-ink font-mono">🏪 书店经营</span>
            {bookstores.length < 3 && (
              <OpenStoreButton
                tier={bookstores.length + 1}
                royalties={currencies.royalties}
                onOpen={openBookstore}
              />
            )}
          </div>
          {bookstores.map(store => (
            <StoreShelf
              key={store.id}
              store={store}
              manuscripts={manuscripts}
              prestige={currencies.prestige}
              onStock={(id) => stockBook(store.id, id)}
              onUnstock={(id) => unstockBook(store.id, id)}
              onSigning={() => hostSigning(store.id)}
              onSelectBook={setSelectedBook}
            />
          ))}
          {bookstores.length === 0 && (
            <p className="text-[13px] md:text-xs text-muted font-mono">尚未开设书店。开设后可以把已出版的书上架，获得销量加成。</p>
          )}
        </div>
      )}

      {/* Inventory bookshelf (not stocked) */}
      <div className="shrink-0 py-1 px-3 md:px-4 text-[13px] md:text-xs text-muted font-mono">
        库存 · {Math.max(0, sorted.length - stockedIds.size)} 本未上架
      </div>

      {/* Bookshelf */}
      <div className="flex-1 overflow-y-auto" style={{ background: 'linear-gradient(180deg, #3d2b1f 0%, #4a3728 2px, #3d2b1f 4px, #3d2b1f 100%)', backgroundSize: '100% 8px' }}>
        {shelves.map((row, rowIdx) => (
          <div key={rowIdx} className="relative">
            {row.genre && (
              <div className="px-3 md:px-4 pt-2 pb-0">
                <span className="text-xs md:text-sm font-bold text-cream font-mono bg-copper/80 px-3 py-1 border-2 border-border-dark shadow-[2px_2px_0_#4a3728]">{GENRE_LABELS[row.genre]}</span>
              </div>
            )}
            <div className="flex items-end gap-0.5 md:gap-1 px-2 md:px-3 py-1" style={{ minHeight: 110 }}>
              {row.books.map(book => (
                <BookSpine
                  key={book.id}
                  book={book}
                  stocked={stockedIds.has(book.id)}
                  onClick={() => setSelectedBook(book)}
                />
              ))}
            </div>
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

function BookSpine({ book, stocked, onClick }: { book: Manuscript; stocked?: boolean; onClick: () => void }) {
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
          background: stocked ? '#e8f5e9' : '#f5f0e8',
          borderBottom: '2px solid rgba(0,0,0,0.15)',
          borderLeft: stocked ? '3px solid #4caf50' : undefined,
        }}
      >
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

function OpenStoreButton({ tier, royalties, onOpen }: { tier: number; royalties: number; onOpen: () => void }) {
  const costs = [300, 800, 2000]
  const slots = [4, 6, 8]
  const mults = ['×1.2', '×1.5', '×2.0']
  const canAfford = royalties >= costs[tier - 1]
  return (
    <button onClick={onOpen} disabled={!canAfford} className={`text-[12px] md:text-xs px-2 py-1 border-2 border-border-dark font-mono transition-all shadow-[2px_2px_0_#4a3728] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] ${canAfford ? 'bg-progress text-white cursor-pointer' : 'bg-cream-dark text-muted cursor-not-allowed'}`}>
      {canAfford ? `${costs[tier - 1]}税 开T${tier}店(${slots[tier-1]}位·${mults[tier-1]})` : `${costs[tier - 1]}税 开T${tier}店`}
    </button>
  )
}

function StoreShelf({ store, manuscripts, prestige, onStock, onUnstock, onSigning, onSelectBook }: {
  store: import('@/core/types').Bookstore
  manuscripts: Map<string, Manuscript>
  prestige: number
  onStock: (id: string) => void
  onUnstock: (id: string) => void
  onSigning: () => void
  onSelectBook: (b: Manuscript) => void
}) {
  const published = [...manuscripts.values()].filter(m => m.status === 'published')
  const [adding, setAdding] = useState(false)
  return (
    <div className="mb-2 border-2 border-border-dark bg-cream p-2 shadow-[2px_2px_0_#4a3728]">
      <div className="flex items-center justify-between mb-1 text-[13px] md:text-xs">
        <span className="font-bold text-ink font-mono">{store.name} · T{store.tier}</span>
        <div className="flex gap-0.5">
          {!store.signingUntil && prestige >= 50 && (
            <button onClick={onSigning} className="text-[12px] px-1.5 py-0.5 border border-border-dark bg-cream text-progress font-mono cursor-pointer">签售</button>
          )}
          <button onClick={() => setAdding(!adding)} className="text-[12px] px-1.5 py-0.5 border-2 border-border-dark bg-copper text-white font-mono cursor-pointer shadow-[1px_1px_0_#4a3728]">+上架</button>
        </div>
      </div>
      {store.shelf.length > 0 ? (
        <div className="flex gap-1 overflow-x-auto pb-1">
          {store.shelf.map(id => {
            const book = manuscripts.get(id)
            return book ? (
              <button key={id} onClick={() => onSelectBook(book)}
                className="flex-shrink-0 w-12 h-16 border border-border-dark bg-[#e8f5e9] cursor-pointer hover:-translate-y-[1px] transition-all relative"
              >
                <span className="text-[11px] text-ink-light font-mono block mt-1 px-0.5 truncate">{book.title.slice(0, 6)}</span>
                <button onClick={e => { e.stopPropagation(); onUnstock(id) }} className="absolute -top-1 -right-1 text-[11px] bg-cream border border-border-dark px-0.5 hover:text-copper-dark">✕</button>
              </button>
            ) : null
          })}
        </div>
      ) : (
        <p className="text-[12px] text-muted font-mono">货架空着 · 点击 +上架</p>
      )}
      {store.signingUntil && (
        <p className="text-[12px] text-progress font-mono mt-0.5">签售进行中 · 销量 ×2</p>
      )}
      {adding && (
        <div className="mt-1 border-t border-border-medium pt-1 max-h-28 overflow-y-auto space-y-0.5">
          {published.filter(b => !store.shelf.includes(b.id)).slice(0, 12).map(b => (
            <button key={b.id} onClick={() => { onStock(b.id); setAdding(false) }}
              className="block w-full text-left text-[12px] text-muted font-mono px-1 hover:text-ink truncate"
            >
              {b.title}
            </button>
          ))}
        </div>
      )}
    </div>
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
