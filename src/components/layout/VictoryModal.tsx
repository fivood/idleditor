import { COUNT_ENDING_SCENES } from '@/core/countStory'
import { useGameStore } from '@/store/gameStore'

interface Props {
  ending: string
  onDismiss: () => void
}

export function VictoryModal({ ending, onDismiss }: Props) {
  const scene = COUNT_ENDING_SCENES[ending]
  const currencies = useGameStore(s => s.currencies)
  if (!scene) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-cream border-2 border-border-dark w-full max-w-[480px] max-h-[90vh] overflow-y-auto shadow-[6px_6px_0_#4a3728]">
        <div className="bg-copper text-white p-5 md:p-6 text-center">
          <p className="text-xs text-copper-light font-mono mb-1">第 {currencies.statues} 座铜像</p>
          <h1 className="text-lg md:text-xl font-bold font-mono">{scene.title}</h1>
        </div>

        <div className="p-4 md:p-6 text-center">
          <div className="bg-cream-dark border-2 border-border-dark p-4 md:p-6 mb-5">
            {scene.text.split('\n').map((line, i) => (
              <p key={i} className="text-sm text-ink leading-relaxed font-mono mb-3 last:mb-0">
                {line || '\u00A0'}
              </p>
            ))}
          </div>

          <div className="bg-card-inset border-2 border-border-dark p-3 md:p-4 mb-5">
            <p className="text-sm font-bold text-progress font-mono">{scene.bonus}</p>
          </div>

          <div className="text-[12px] text-muted font-mono mb-5 leading-relaxed">
            永夜出版社 · 成立 {currencies.statues * 30 + 300} 年 · 出版 {useGameStore.getState().totalPublished} 本书 · 雇佣 {useGameStore.getState().authors.size} 位作者
          </div>

          <button
            onClick={onDismiss}
            className="w-full py-3 text-sm font-bold border-2 border-border-dark bg-copper text-white font-mono cursor-pointer shadow-[3px_3px_0_#4a3728] active:shadow-none active:translate-x-[3px] active:translate-y-[3px] transition-all"
          >
            继续出版
          </button>
        </div>
      </div>
    </div>
  )
}
