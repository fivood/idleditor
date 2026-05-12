import type { Decision } from '@/core/decisions'
import { useGameStore } from '@/store/gameStore'

interface Props {
  decision: Decision
}

export function DecisionModal({ decision }: Props) {
  const resolveDecision = useGameStore(s => s.resolveDecision)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-cream border-2 border-border-dark w-full max-w-[420px] max-h-[90vh] overflow-y-auto shadow-[6px_6px_0_#4a3728]">
        <div className="bg-copper-dark text-white p-3 md:p-4 border-b-2 border-border-dark">
          <h2 className="text-sm md:text-base font-bold font-mono">📋 编辑决策</h2>
          <p className="text-xs md:text-sm font-bold mt-1 font-mono">{decision.title}</p>
        </div>

        <div className="p-3 md:p-4">
          <div className="bg-card-inset border-2 border-border-dark p-3 md:p-4 mb-4">
            <p className="text-sm md:text-base text-ink leading-relaxed font-mono">
              {decision.description}
            </p>
          </div>

          <div className="space-y-2 md:space-y-3">
            {decision.options.map((option, i) => (
              <button
                key={i}
                onClick={() => resolveDecision(i)}
                className="w-full text-left p-3 md:p-4 border-2 border-border-dark bg-cream hover:bg-cream-dark transition-all cursor-pointer shadow-[2px_2px_0_#4a3728] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
              >
                <div className="flex items-start gap-2 md:gap-3">
                  <span className="text-lg md:text-xl flex-shrink-0 mt-0.5">
                    {i === 0 ? '🅰' : i === 1 ? '🅱' : '🅲'}
                  </span>
                  <div>
                    <p className="text-sm md:text-base font-bold text-ink font-mono">{option.label}</p>
                    <p className="text-xs md:text-sm text-muted mt-0.5 font-mono">{option.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
