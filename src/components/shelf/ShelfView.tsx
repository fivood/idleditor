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
      <div className="text-center py-12">
        <p className="text-muted text-sm">还没有出版过任何书。</p>
        <p className="text-muted text-xs mt-1">在桌面上审稿，出版你的第一本书。</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-ink">{books.length} 本书已出版</h2>
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
    <div className="bg-card border border-border rounded-lg overflow-hidden hover:border-green-border transition-colors">
      <div
        className="aspect-[3/4] flex items-center justify-center text-3xl"
        style={{ backgroundColor: book.cover.placeholder.bgColor + '33' }}
      >
        {icon}
      </div>
      <div className="p-2">
        <p className="text-xs font-medium text-ink truncate">{book.title}</p>
        <p className="text-[10px] text-muted mt-0.5">
          {Math.round(book.salesCount).toLocaleString()} 册
          {book.isBestseller && <span className="text-gold ml-1">★ 畅销书</span>}
        </p>
      </div>
    </div>
  )
}
