import { useMemo, useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { GENRE_ICONS } from '@/core/types'
import { AUTHOR_TIER_THRESHOLDS, AFFECTION_ELITE_TALENT } from '@/core/constants'
import type { Author, AuthorPersona } from '@/core/types'

const TIER_LABELS: Record<string, string> = { idol: '传奇', known: '知名', signed: '签约', new: '新人' }
const TIER_ORDER: Record<string, number> = { idol: 0, known: 1, signed: 2, new: 3 }

const PERSONA_LABELS: Record<AuthorPersona, string> = {
  'retired-professor': '退休教授', 'basement-scifi-geek': '地下室科幻宅',
  'ex-intelligence-officer': '前情报官员', 'sociology-phd': '社会学博士',
  'anxious-debut': '焦虑新人', 'reclusive-latam-writer': '隐居拉美作家',
  'nordic-crime-queen': '北欧推理女王', 'american-bestseller-machine': '美国畅销流水线',
  'japanese-lightnovel-otaku': '日本轻小说宅',
  'historical-detective-writer': '考据派历史作家',
  'fantasy-epic-writer': '奇幻史诗执笔',
  'french-literary-recluse': '法国文学隐者',
  'indian-epic-sage': '印度史诗圣者',
  'russian-doom-spiral': '俄式沉重长卷',
  'korean-webnovel-queen': '韩国网文女王',
  'nigerian-magical-realist': '尼日利亚魔幻写实',
  'australian-outback-gothic': '澳洲内陆哥特',
}

export function AuthorView() {
  const authors = useGameStore(s => s.authors)
  const playTicks = useGameStore(s => s.playTicks)
  const manuscripts = useGameStore(s => s.manuscripts)
  const signAuthor = useGameStore(s => s.signAuthor)
  const buyAuthorMeal = useGameStore(s => s.buyAuthorMeal)
  const sendAuthorGift = useGameStore(s => s.sendAuthorGift)
  const writeAuthorLetter = useGameStore(s => s.writeAuthorLetter)
  const rushAuthorCooldown = useGameStore(s => s.rushAuthorCooldown)
  const [selectedAuthor, setSelectedAuthor] = useState<Author | null>(null)

  const list = useMemo(() => [...authors.values()], [authors, playTicks])
  const sorted = [...list].sort((a, b) => (TIER_ORDER[a.tier] ?? 9) - (TIER_ORDER[b.tier] ?? 9))

  if (list.length === 0) {
    return (
      <div className="h-full overflow-y-auto p-3 md:p-5 text-center py-10 md:py-12">
        <p className="text-muted text-xs md:text-sm font-mono">还未发现任何作者。</p>
        <p className="text-muted text-[16px] md:text-xs mt-1 font-mono">当稿件出现在你的桌面上时，你会遇到作者。</p>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto p-3 md:p-4">
      <h2 className="text-xs md:text-sm font-bold text-ink mb-2 md:mb-3 font-mono">{list.length} 位作者</h2>
      <div className="grid gap-1.5 md:gap-2">
        {sorted.map(author => (
          <button
            key={author.id}
            onClick={() => setSelectedAuthor(author)}
            className="text-left bg-cream border-2 border-border-dark p-2 md:p-3 shadow-[3px_3px_0_#4a3728] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_#4a3728] transition-all w-full"
          >
            <div className="flex items-center gap-2 md:gap-3">
              <span className="text-xl md:text-2xl flex-shrink-0">
                {author.affection >= 100 ? '💖' : author.talent >= AFFECTION_ELITE_TALENT ? '💎' : '·'}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs md:text-sm font-bold text-ink font-mono">
                  {author.name}
                  <span className="text-[14px] md:text-[16px] text-muted font-normal ml-1.5">
                    {TIER_LABELS[author.tier] ?? author.tier}
                  </span>
                  {author.affection >= 100 && <span className="text-copper font-bold ml-1 text-[14px]">忠诚</span>}
                </p>
                <p className="text-[15px] md:text-xs text-muted mt-0.5 font-mono">
                  <img src={GENRE_ICONS[author.genre] ?? '/icons/misc/book.svg'} alt="" className="inline w-4 h-4 md:w-3.5 md:h-3.5 align-text-bottom" /> {author.genre} · 才华 {author.talent} · 名气 {author.fame}
                  {author.affection > 0 && <span className={`ml-1 ${author.affection >= 100 ? 'text-copper font-bold' : 'text-muted'}`}>· 好感 {author.affection}</span>}
                  {author.cooldownUntil !== null && author.cooldownUntil > 0 && (
                    <span className="text-copper font-bold ml-1">· 休息中</span>
                  )}
                  {author.poached && <span className="text-copper-dark font-bold ml-1">· 被挖走</span>}
                  <span className={`ml-1 ${author.booksWritten >= author.maxBooks ? 'text-amber-600' : 'text-muted'}`}>
                    · {author.booksWritten}/{author.maxBooks}本
                    {author.booksWritten >= author.maxBooks && ' · 封笔'}
                  </span>
                </p>
                {(author.tier === 'signed' || author.tier === 'known') && (
                  <FameBar author={author} />
                )}
              </div>
              {author.tier === 'new' && (
                <button
                  onClick={e => { e.stopPropagation(); signAuthor(author.id) }}
                  className="text-[15px] md:text-xs px-2 md:px-3 py-1 md:py-1.5 bg-copper text-white border-2 border-border-dark font-mono cursor-pointer shadow-[2px_2px_0_#4a3728] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all flex-shrink-0"
                >
                  签约
                </button>
              )}
            </div>
          </button>
        ))}
      </div>

      {selectedAuthor && (
        <AuthorDetailModal
          author={selectedAuthor}
          manuscripts={manuscripts}
          onClose={() => setSelectedAuthor(null)}
          onBuyMeal={() => { buyAuthorMeal(selectedAuthor.id); setSelectedAuthor(null); setSelectedAuthor(selectedAuthor) }}
          onSendGift={() => { sendAuthorGift(selectedAuthor.id); setSelectedAuthor(null); setSelectedAuthor(selectedAuthor) }}
          onWriteLetter={() => { writeAuthorLetter(selectedAuthor.id); setSelectedAuthor(null); setSelectedAuthor(selectedAuthor) }}
          onRushCooldown={() => { rushAuthorCooldown(selectedAuthor.id); setSelectedAuthor(null); setSelectedAuthor(selectedAuthor) }}
          currencies={useGameStore.getState().currencies}
        />
      )}
    </div>
  )
}

function FameBar({ author }: { author: Author }) {
  const nextTier = author.tier === 'signed' ? 'known' : 'idol'
  const threshold = AUTHOR_TIER_THRESHOLDS[nextTier] ?? 999
  const pct = Math.min(100, Math.round((author.fame / threshold) * 100))
  return (
    <div className="mt-1 md:mt-1.5">
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[16px] md:text-[14px] text-muted font-mono">→ {TIER_LABELS[nextTier]}</span>
        <span className="text-[16px] md:text-[14px] text-muted font-mono tabular-nums">{author.fame}/{threshold}</span>
      </div>
      <div className="h-1 md:h-1.5 bg-card-inset border border-border-dark overflow-hidden">
        <div className="h-full bg-progress transition-all duration-700" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function AuthorDetailModal({ author, manuscripts, onClose, onBuyMeal, onSendGift, onWriteLetter, onRushCooldown, currencies }: {
  author: Author; manuscripts: Map<string, unknown>; onClose: () => void; onBuyMeal: () => void; onSendGift: () => void; onWriteLetter: () => void; onRushCooldown: () => void; currencies: { revisionPoints: number }
}) {
  const isLoyal = author.affection >= 100
  const affectionPct = Math.min(100, Math.round(author.affection / 100 * 100))
  const books = [...(manuscripts as Map<string, import('@/core/types').Manuscript>).values()].filter(m => m.authorId === author.id)
  const published = books.filter(b => b.status === 'published')
  const bestsellers = published.filter(b => b.isBestseller)
  const onCooldown = author.cooldownUntil !== null && author.cooldownUntil > 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-cream border-2 border-border-dark w-full max-w-[420px] max-h-[85vh] overflow-y-auto shadow-[6px_6px_0_#4a3728]">
        <div className="flex items-center justify-between p-3 md:p-4 border-b-2 border-border-dark">
          <div>
            <h2 className="text-sm md:text-base font-bold text-ink font-mono">
              {isLoyal && <span className="text-copper mr-1">]</span>}
              {author.name}
              {isLoyal && <span className="text-copper ml-1">[</span>}
            </h2>
            <p className="text-[14px] md:text-[16px] text-muted font-mono">{TIER_LABELS[author.tier]} · {PERSONA_LABELS[author.persona]}</p>
          </div>
          <button onClick={onClose} className="text-[16px] md:text-xs px-2 py-1 border-2 border-border-dark text-muted font-mono cursor-pointer bg-cream">X</button>
        </div>

        <div className="p-3 md:p-4 space-y-3">
          {/* Signature phrase */}
          <div className="bg-cream-dark border-2 border-border-dark p-2 md:p-3">
            <p className="text-[14px] md:text-xs text-ink-light leading-relaxed font-mono italic">{author.signaturePhrase}</p>
          </div>

          {/* Stats */}
          <div className="bg-card-inset border-2 border-border-dark p-2 md:p-3">
            <div className="grid grid-cols-2 gap-1.5 text-[14px] md:text-xs font-mono">
              <div><span className="text-muted">才华</span> <span className="text-ink font-bold">{author.talent}</span></div>
              <div><span className="text-muted">可靠性</span> <span className="text-ink font-bold">{author.reliability}</span></div>
              <div><span className="text-muted">名气</span> <span className="text-ink font-bold">{author.fame}</span></div>
              <div>
                <span className="text-muted">出版</span> <span className="text-ink font-bold">{published.length} 本</span>
                {bestsellers.length > 0 && <span className="text-copper font-bold ml-1">畅销{bestsellers.length}</span>}
              </div>
            </div>
            <p className="text-[14px] text-muted font-mono mt-1.5">可靠性影响投稿间隔：{Math.round(60 * (1 - author.reliability / 200))} 秒/篇</p>
          </div>

          {/* Affection bar */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[14px] md:text-[16px] text-muted font-mono">好感度</span>
              <span className="text-[14px] md:text-[16px] text-muted font-mono tabular-nums">{author.affection}/100</span>
            </div>
            <div className="h-2 bg-card-inset border-2 border-border-dark overflow-hidden">
              <div className="h-full bg-copper transition-all" style={{ width: `${affectionPct}%` }} />
            </div>
            {isLoyal && <p className="text-[14px] text-copper font-bold font-mono mt-1">已忠诚 · 才华 +5</p>}
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-1.5 md:gap-2">
            <button
              onClick={onBuyMeal}
              disabled={currencies.revisionPoints < 20}
              className={`text-[14px] md:text-xs px-3 py-1.5 border-2 border-border-dark font-mono cursor-pointer transition-all shadow-[2px_2px_0_#4a3728] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] ${
                currencies.revisionPoints >= 20 ? 'bg-copper text-white' : 'bg-cream-dark text-muted cursor-not-allowed'
              }`}
            >
              请吃饭 · 20 RP
            </button>
            <button
              onClick={onSendGift}
              disabled={currencies.revisionPoints < 15}
              className={`text-[14px] md:text-xs px-3 py-1.5 border-2 border-border-dark font-mono cursor-pointer transition-all shadow-[2px_2px_0_#4a3728] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] ${
                currencies.revisionPoints >= 15 ? 'bg-copper text-white' : 'bg-cream-dark text-muted cursor-not-allowed'
              }`}
            >
              寄样书 · 15 RP
            </button>
            <button
              onClick={onWriteLetter}
              disabled={currencies.revisionPoints < 10}
              className={`text-[14px] md:text-xs px-3 py-1.5 border-2 border-border-dark font-mono cursor-pointer transition-all shadow-[2px_2px_0_#4a3728] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] ${
                currencies.revisionPoints >= 10 ? 'bg-copper text-white' : 'bg-cream-dark text-muted cursor-not-allowed'
              }`}
            >
              手写回信 · 10 RP
            </button>
            <button
              onClick={onRushCooldown}
              disabled={!onCooldown || currencies.revisionPoints < 30}
              className={`text-[14px] md:text-xs px-3 py-1.5 border-2 border-border-dark font-mono cursor-pointer transition-all shadow-[2px_2px_0_#4a3728] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] ${
                onCooldown && currencies.revisionPoints >= 30 ? 'bg-progress text-white' : 'bg-cream-dark text-muted cursor-not-allowed'
              }`}
            >
              催稿 · 30 RP
            </button>
          </div>

          {/* Published history */}
          {published.length > 0 && (
            <div>
              <p className="text-[14px] md:text-[16px] text-muted font-mono mb-1">出版历史</p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {published.slice(-10).reverse().map(b => (
                  <div key={b.id} className="text-[14px] md:text-xs font-mono bg-card-inset border-2 border-border-dark p-1.5 flex justify-between">
                    <span className="text-ink truncate">{b.title}</span>
                    <span className="text-muted flex-shrink-0 ml-2">Q{b.quality} · {Math.round(b.salesCount).toLocaleString()}册 {b.isBestseller ? '★' : ''}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full py-2 text-[14px] md:text-xs border-2 border-border-dark bg-copper text-white font-mono cursor-pointer shadow-[3px_3px_0_#4a3728] active:shadow-none active:translate-x-[3px] active:translate-y-[3px] transition-all"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  )
}
