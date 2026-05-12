import { useGameStore } from '@/store/gameStore'
import type { Manuscript } from '@/core/types'
import { GENRE_ICONS } from '@/core/types'
import { useMemo } from 'react'

export function ShelfView() {
  const manuscripts = useGameStore(s => s.manuscripts)
  const playTicks = useGameStore(s => s.playTicks)

  const books = useMemo(
    () => [...manuscripts.values()].filter(m => m.status === 'published'),
    [manuscripts, playTicks],
  )

  if (books.length === 0) {
    return (
      <div className="h-full overflow-y-auto p-5">
        <p className="text-muted text-sm font-mono">还没有出版过任何书。</p>
        <p className="text-muted text-xs mt-1 font-mono">在桌面上审稿，出版你的第一本书。</p>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-ink font-mono">{books.length} 本书已出版</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {books.map(book => (
          <BookCard key={book.id} book={book} />
        ))}
      </div>
    </div>
  )
}

function BookCard({ book }: { book: Manuscript }) {
  const icon = GENRE_ICONS[book.genre] ?? '📖'

  return (
    <div className="bg-cream border-2 border-border-dark shadow-[3px_3px_0_#4a3728] overflow-hidden hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_#4a3728] transition-all">
      <div
        className="aspect-[3/4] flex items-center justify-center text-3xl border-b-2 border-border-dark"
        style={{ backgroundColor: book.cover.placeholder.bgColor + '33' }}
      >
        {icon}
      </div>
      <div className="p-2">
        <p className="text-xs font-bold text-ink truncate font-mono">{book.title}</p>
        <p className="text-[10px] text-muted mt-0.5 font-mono">
          {Math.round(book.salesCount).toLocaleString()} 册
          {book.isBestseller && <span className="text-copper font-bold ml-1">★ 畅销书</span>}
        </p>
      </div>
    </div>
  )
}
