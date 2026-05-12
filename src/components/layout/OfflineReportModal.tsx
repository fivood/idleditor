import { formatNumber } from '@/utils/format'

interface Props {
  offlineTicks: number
  earned: { royalties: number; published: number; rejected: number }
  events: string[]
  onDismiss: () => void
}

export function OfflineReportModal({ offlineTicks, earned, events, onDismiss }: Props) {
  const minutes = Math.round(offlineTicks / 60)
  const timeStr = minutes >= 60
    ? `${Math.floor(minutes / 60)}小时${minutes % 60 > 0 ? `${minutes % 60}分钟` : ''}`
    : `${minutes}分钟`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-cream border-2 border-border-dark w-full max-w-[400px] max-h-[85vh] overflow-y-auto shadow-[6px_6px_0_#4a3728]">
        {/* Header */}
        <div className="bg-copper text-white p-3 md:p-4 border-b-2 border-border-dark">
          <h2 className="text-sm md:text-base font-bold font-mono">你回来了</h2>
          <p className="text-[16px] md:text-xs font-mono opacity-80 mt-0.5">离开了 {timeStr}</p>
        </div>

        {/* Stats */}
        <div className="p-3 md:p-4 border-b-2 border-border-dark bg-cream-dark">
          <div className="flex justify-around text-center">
            <div>
              <p className="text-lg md:text-xl font-bold text-copper font-mono">{formatNumber(Math.floor(earned.royalties))}</p>
              <p className="text-[14px] md:text-[16px] text-muted font-mono">版税收入</p>
            </div>
            <div>
              <p className="text-lg md:text-xl font-bold text-ink font-mono">{earned.published}</p>
              <p className="text-[14px] md:text-[16px] text-muted font-mono">新出版</p>
            </div>
            <div>
              <p className="text-lg md:text-xl font-bold text-copper-dark font-mono">{earned.rejected}</p>
              <p className="text-[14px] md:text-[16px] text-muted font-mono">被退稿</p>
            </div>
          </div>
        </div>

        {/* Events */}
        <div className="p-3 md:p-4 space-y-2 md:space-y-3">
          {events.map((msg, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-copper text-sm md:text-base flex-shrink-0 mt-0.5">◆</span>
              <p className="text-[16px] md:text-xs text-ink leading-relaxed font-mono">{msg}</p>
            </div>
          ))}
        </div>

        {/* Dismiss */}
        <div className="p-3 md:p-4 pt-0">
          <button
            onClick={onDismiss}
            className="w-full py-2 md:py-2.5 text-xs md:text-sm border-2 border-border-dark bg-copper text-white font-mono cursor-pointer shadow-[3px_3px_0_#4a3728] active:shadow-none active:translate-x-[3px] active:translate-y-[3px] transition-all"
          >
            知道了，开工
          </button>
        </div>
      </div>
    </div>
  )
}
