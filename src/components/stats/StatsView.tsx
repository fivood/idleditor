import { useGameStore } from '@/store/gameStore'
import { useMemo } from 'react'
import { GENRE_LABELS } from '@/core/types'

export function StatsView() {
  const manuscripts = useGameStore(s => s.manuscripts)
  const authors = useGameStore(s => s.authors)
  const currencies = useGameStore(s => s.currencies)
  const totalRejections = useGameStore(s => s.totalRejections)
  const editorLevel = useGameStore(s => s.editorLevel)
  const playTicks = useGameStore(s => s.playTicks)
  const permanentBonuses = useGameStore(s => s.permanentBonuses)

  const stats = useMemo(() => {
    const all = [...manuscripts.values()]
    const published = all.filter(m => m.status === 'published')
    const bestsellers = published.filter(m => m.isBestseller)
    const byGenre: Record<string, number> = {}
    for (const m of published) byGenre[m.genre] = (byGenre[m.genre] || 0) + 1
    const maxGenre = Math.max(1, ...Object.values(byGenre))

    const authorList = [...authors.values()]
    const signed = authorList.filter(a => a.tier !== 'new')
    const idols = authorList.filter(a => a.tier === 'idol')
    const terminated = authorList.filter(a => a.terminated)
    const poached = authorList.filter(a => a.poached)
    const topAuthor = [...authorList].sort((a, b) => b.fame - a.fame)[0]

    const totalSales = published.reduce((s, m) => s + m.salesCount, 0)
    const avgQuality = published.length > 0 ? Math.round(published.reduce((s, m) => s + m.quality, 0) / published.length) : 0
    const gameDays = Math.floor(playTicks / 60)
    const hours = Math.floor(gameDays / 60)
    const minutes = gameDays % 60

    return {
      published, bestsellers, byGenre, maxGenre,
      signed, idols, terminated, poached, topAuthor,
      totalSales, avgQuality, hours, minutes,
    }
  }, [manuscripts, authors, playTicks])

  return (
    <div className="h-full overflow-y-auto p-3 md:p-4 space-y-4 font-mono">
      <h2 className="text-xs md:text-sm font-bold text-ink">📊 档案室</h2>

      {/* Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <StatCard label="总出版" value={stats.published.length} sub={`${stats.bestsellers.length} 本畅销`} />
        <StatCard label="总销量" value={Math.round(stats.totalSales).toLocaleString()} sub={`平均 Q${stats.avgQuality}`} />
        <StatCard label="退稿数" value={totalRejections} sub={`Lv.${editorLevel} 编辑`} />
        <StatCard label="游戏时长" value={stats.hours} sub={`${stats.minutes}分`} />
      </div>

      {/* Genre distribution */}
      <div className="bg-cream border-2 border-border-dark p-3 shadow-[3px_3px_0_#4a3728]">
        <h3 className="text-[13px] md:text-xs font-bold text-ink mb-2">类型分布</h3>
        <BarChart data={stats.byGenre} max={stats.maxGenre} />
      </div>

      {/* Authors */}
      <div className="bg-cream border-2 border-border-dark p-3 shadow-[3px_3px_0_#4a3728]">
        <h3 className="text-[13px] md:text-xs font-bold text-ink mb-2">作者档案</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 text-[13px] md:text-xs">
          <KV label="合作中" value={stats.signed.length - stats.terminated.length} />
          <KV label="传奇" value={stats.idols.length} />
          <KV label="已解约" value={stats.terminated.length} />
          <KV label="被挖走" value={stats.poached.length} />
        </div>
        {stats.topAuthor && (
          <div className="mt-2 text-[13px] md:text-xs text-muted">
            <span className="text-ink font-bold">最高名气</span> · {stats.topAuthor.name}（{stats.topAuthor.tier === 'idol' ? '传奇' : stats.topAuthor.tier === 'known' ? '知名' : '签约'} · 名气 {stats.topAuthor.fame}）
          </div>
        )}
      </div>

      {/* Economy */}
      <div className="bg-cream border-2 border-border-dark p-3 shadow-[3px_3px_0_#4a3728]">
        <h3 className="text-[13px] md:text-xs font-bold text-ink mb-2">永久加成</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[13px] md:text-xs">
          <KV label="品质" value={`+${permanentBonuses.manuscriptQualityBonus}`} />
          <KV label="速度" value={`+${Math.round(permanentBonuses.editingSpeedBonus * 100)}%`} />
          <KV label="版税" value={`×${permanentBonuses.royaltyMultiplier.toFixed(1)}`} />
          <KV label="才华" value={`+${permanentBonuses.authorTalentBoost}`} />
        </div>
        <div className="mt-2 grid grid-cols-2 gap-1 text-[13px] md:text-xs text-muted">
          <span>RP<span className="text-ink font-bold ml-1">{Math.round(currencies.revisionPoints)}</span></span>
          <span>声望<span className="text-ink font-bold ml-1">{Math.round(currencies.prestige)}</span></span>
          <span>版税<span className="text-ink font-bold ml-1">{Math.round(currencies.royalties)}</span></span>
          <span>铜像<span className="text-ink font-bold ml-1">{currencies.statues}</span></span>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub: string }) {
  return (
    <div className="bg-cream border-2 border-border-dark p-2 md:p-3 shadow-[3px_3px_0_#4a3728]">
      <p className="text-[13px] md:text-[16px] text-muted">{label}</p>
      <p className="text-xs md:text-sm font-bold text-ink">{value}</p>
      <p className="text-[16px] text-muted mt-0.5">{sub}</p>
    </div>
  )
}

function KV({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted">{label}</span>
      <span className="text-ink font-bold">{value}</span>
    </div>
  )
}

function BarChart({ data, max }: { data: Record<string, number>; max: number }) {
  const labels = GENRE_LABELS
  const colors: Record<string, string> = { 'sci-fi': 'bg-blue-400', mystery: 'bg-purple-400', suspense: 'bg-red-400', 'social-science': 'bg-amber-400', hybrid: 'bg-emerald-400', 'light-novel': 'bg-pink-400' }
  return (
    <div className="space-y-1">
      {Object.entries(data).map(([genre, count]) => (
        <div key={genre} className="flex items-center gap-1.5 text-[16px] md:text-[13px]">
          <span className="w-10 text-muted text-right">{labels[genre] ?? genre}</span>
          <div className="flex-1 h-3 md:h-4 bg-card-inset border border-border-dark overflow-hidden">
            <div className={`h-full ${colors[genre] ?? 'bg-copper'} transition-all`} style={{ width: `${(count / max) * 100}%` }} />
          </div>
          <span className="text-ink font-bold w-6">{count}</span>
        </div>
      ))}
    </div>
  )
}
