import { CHANGELOG } from '@/core/changelog'

interface Props {
  onClose: () => void
}

export function ChangelogModal({ onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-cream border-2 border-border-dark w-full max-w-[480px] max-h-[85vh] overflow-y-auto shadow-[6px_6px_0_#4a3728]">
        <div className="bg-copper text-white p-3 md:p-4 border-b-2 border-border-dark flex items-center justify-between sticky top-0 z-10">
          <h2 className="text-sm md:text-base font-bold font-mono">开发日志</h2>
          <button
            onClick={onClose}
            className="text-[10px] md:text-xs px-2 py-1 border-2 border-white/30 font-mono cursor-pointer hover:bg-white/10 transition-all"
          >
            ✕
          </button>
        </div>

        <div className="p-3 md:p-4 space-y-4 md:space-y-5">
          {CHANGELOG.map(entry => (
            <div key={entry.version}>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-xs md:text-sm font-bold text-copper font-mono">{entry.version}</span>
                <span className="text-[10px] md:text-xs text-muted font-mono">{entry.date}</span>
                <span className="text-xs md:text-sm font-bold text-ink font-mono">— {entry.title}</span>
              </div>
              <ul className="space-y-1.5 md:space-y-2 pl-3">
                {entry.items.map((item, i) => (
                  <li key={i} className="text-[10px] md:text-xs text-ink-light leading-relaxed font-mono flex items-start gap-2">
                    <span className="text-copper flex-shrink-0 mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="p-3 md:p-4 pt-0">
          <button
            onClick={onClose}
            className="w-full py-2 md:py-2.5 text-xs md:text-sm border-2 border-border-dark bg-copper text-white font-mono cursor-pointer shadow-[3px_3px_0_#4a3728] active:shadow-none active:translate-x-[3px] active:translate-y-[3px] transition-all"
          >
            回到工作
          </button>
        </div>
      </div>
    </div>
  )
}
