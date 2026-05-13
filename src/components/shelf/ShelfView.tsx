import { useState, useMemo } from 'react'
import { useGameStore } from '@/store/gameStore'
import type { Manuscript } from '@/core/types'
import { GENRE_ICONS } from '@/core/types'
import { GENRE_COVER_COLORS } from '@/core/constants'

export function ShelfView() {
  const manuscripts = useGameStore(s => s.manuscripts)

  const books = useMemo(
    () => [...manuscripts.values()].filter(m => m.status === 'published'),
    [manuscripts],
  )

  const [selectedBook, setSelectedBook] = useState<Manuscript | null>(null)

  if (books.length === 0) {
    return (
      <div className="h-full overflow-y-auto p-3 md:p-5">
        <p className="text-muted text-xs md:text-sm font-mono">还没有出版过任何书。</p>
        <p className="text-muted text-[16px] md:text-xs mt-1 font-mono">在桌面上审稿，出版你的第一本书。</p>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto p-3 md:p-4">
      <div className="flex items-center justify-between mb-2 md:mb-3">
        <h2 className="text-xs md:text-sm font-bold text-ink font-mono">{books.length} 本书已出版</h2>
      </div>

      {/* Book spines */}
      <div className="flex flex-wrap gap-1.5 md:gap-2 items-end">
        {books.map(book => (
          <BookSpine key={book.id} book={book} onClick={() => setSelectedBook(book)} />
        ))}
      </div>

      {/* Book detail modal */}
      {selectedBook && (
        <BookDetailModal book={selectedBook} onClose={() => setSelectedBook(null)} />
      )}
    </div>
  )
}

function BookSpine({ book, onClick }: { book: Manuscript; onClick: () => void }) {
  const spineColor = GENRE_COVER_COLORS[book.genre] ?? '#1a1a2e'
  const spineH = 90 + Math.random() * 30 // varied spine heights for realism
  const spineW = 16

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center cursor-pointer hover:translate-x-[1px] hover:-translate-y-[2px] transition-all shrink-0"
      style={{ width: `${spineW + 8}px` }}
    >
      <div
        className="border-2 border-border-dark shadow-[2px_2px_0_#4a3728] overflow-hidden"
        style={{
          width: `${spineW}px`,
          height: `${spineH}px`,
          backgroundColor: spineColor + '88',
        }}
      >
        {book.cover.src ? (
          <img
            src={book.cover.src}
            alt=""
            className="w-full h-full object-cover"
            style={{ objectPosition: '20% 50%' }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center opacity-60">
            <span className="text-[14px]" style={{ writingMode: 'vertical-rl' }}>
              {book.title.slice(0, 3)}
            </span>
          </div>
        )}
        {book.isBestseller && (
          <div className="absolute -top-1 -right-1 text-[14px]">★</div>
        )}
      </div>
      <span className="text-[16px] md:text-[14px] text-muted font-mono mt-1 text-center leading-tight truncate" style={{ width: `${spineW + 6}px` }}>
        {book.title.slice(0, 4)}
      </span>
    </button>
  )
}

function BookDetailModal({ book, onClose }: { book: Manuscript; onClose: () => void }) {
  const icon = GENRE_ICONS[book.genre] ?? '/icons/misc/book.svg'
  const spineColor = GENRE_COVER_COLORS[book.genre] ?? '#1a1a2e'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-cream border-2 border-border-dark w-full max-w-[420px] max-h-[90vh] overflow-y-auto shadow-[6px_6px_0_#4a3728]">
        <div className="flex items-center justify-between p-3 md:p-4 border-b-2 border-border-dark">
          <h2 className="text-sm md:text-base font-bold text-ink font-mono truncate">{book.title}</h2>
          <button
            onClick={onClose}
            className="text-[16px] md:text-xs px-2 py-1 border-2 border-border-dark text-muted font-mono cursor-pointer bg-cream shadow-[2px_2px_0_#4a3728] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"
          >
            ✕
          </button>
        </div>

        <div className="p-3 md:p-4">
          {/* Cover */}
          <div className="border-2 border-border-dark bg-card-inset mb-3 md:mb-4" style={{ width: 200, height: 280, margin: '0 auto' }}>
            {book.cover.src ? (
              <img src={book.cover.src} alt="" className="w-full h-full object-cover" />
            ) : (
              <div
                className="w-full h-full flex flex-col items-center justify-center gap-2"
                style={{ backgroundColor: spineColor + '33' }}
              >
                <img src={icon} alt="" className="w-12 h-12 opacity-60" />
                <span className="text-[16px] md:text-xs text-muted font-mono px-2 text-center">{book.title}</span>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="bg-card-inset border-2 border-border-dark p-2 md:p-3 mb-3 md:mb-4">
            <div className="grid grid-cols-2 gap-1.5 text-[16px] md:text-xs font-mono">
              <div><span className="text-muted">类型</span> <span className="text-ink font-bold">{book.genre}</span></div>
              <div><span className="text-muted">品质</span> <span className="text-ink font-bold">Q{book.quality}</span></div>
              <div><span className="text-muted">字数</span> <span className="text-ink font-bold">{Math.round(book.wordCount / 1000)}K</span></div>
              <div><span className="text-muted">销量</span> <span className="text-ink font-bold">{Math.round(book.salesCount).toLocaleString()} 册</span></div>
            </div>
            {book.isBestseller && (
              <p className="text-[16px] md:text-xs text-copper font-bold mt-1.5 font-mono">★ 畅销书</p>
            )}
            {book.awards.length > 0 && (
              <p className="text-[16px] md:text-xs text-copper font-bold mt-1 font-mono">
                🏆 {book.awards.join(' · ')}
              </p>
            )}
          </div>

          {/* Synopsis */}
          <div className="bg-cream-dark border-2 border-border-dark p-2 md:p-3 mb-3 md:mb-4">
            <p className="text-[16px] md:text-xs text-ink leading-relaxed font-mono">{book.synopsis}</p>
          </div>

          {/* Editor notes */}
          <div className="bg-card-inset border-2 border-border-dark p-2 md:p-3 mb-3 md:mb-4">
            <p className="text-[14px] md:text-[16px] text-muted font-mono mb-1">编辑批语：</p>
            <p className="text-[16px] md:text-xs text-ink-light leading-relaxed font-mono italic">
              {generateEditorNote(book)}
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-full py-2 md:py-2.5 text-xs md:text-sm border-2 border-border-dark bg-copper text-white font-mono cursor-pointer shadow-[3px_3px_0_#4a3728] active:shadow-none active:translate-x-[3px] active:translate-y-[3px] transition-all"
          >
            放回书架
          </button>
        </div>
      </div>
    </div>
  )
}

function generateEditorNote(book: Manuscript): string {
  const notes = [
    `审稿的时候喝了三杯茶。看到第${Math.floor(book.quality * 0.6)}页时差点把茶喷出来——不是贬义。只是太意外了。`,
    `作者在致谢里感谢了"永夜出版社那位永远年轻的编辑"。他知道得太多了。`,
    `这本书的初稿有${Math.round(book.wordCount * 1.4 / 1000)}K字。我们删掉了其中四十页关于天气的描写。作者至今在社交媒体上抱怨这件事。`,
    `市场部说这本书的读者画像很精准——"喜欢在深夜独处并怀疑所有社交关系的人"。编辑部对此未置可否。`,
    `排版的时候发现一个小问题：第${Math.floor(Math.random() * 300 + 10)}页的页码印成了emoji。我们决定不修改——当作彩蛋。`,
    `这是作者写的最好的书。他自己也是这么认为的。他寄来的感谢信长达七页——我们只读了前两页。`,
    `编辑部曾就是否给这本书加腰封争论了四十分钟。最后决定：不加。好书不需要在肚子上缠一圈广告。`,
    `版权部把这本书推荐给了一个影视机构。对方回复说"很有深度但暂时不好改编"。翻译：主角内心独白太多。`,
  ]
  return notes[Math.floor(notes.length * ((book.quality % 10) / 10 * 0.99)) % notes.length]
}
