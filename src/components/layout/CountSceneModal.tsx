import { useState } from 'react'
import type { CountScene } from '@/core/countStory'

interface Props {
  scene: CountScene
  onChoose: (choiceIndex: number) => void
  showGenderChoice: boolean
  onChooseGender: (gender: 'male' | 'female') => void
}

export function CountSceneModal({ scene, onChoose, showGenderChoice, onChooseGender }: Props) {
  const [step, setStep] = useState<'story' | 'gender'>('story')

  if (showGenderChoice && step === 'gender') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-cream border-2 border-border-dark w-full max-w-[420px] max-h-[90vh] overflow-y-auto shadow-[6px_6px_0_#4a3728]">
          <div className="bg-copper-dark text-white p-4">
            <h2 className="text-sm font-bold font-mono">一个细节</h2>
            <p className="text-xs mt-1 font-mono opacity-80">你注意到伯爵的档案上有一个被涂改过的条目。性别那一栏。</p>
          </div>
          <div className="p-4 space-y-3">
            <button
              onClick={() => onChooseGender('male')}
              className="w-full text-left p-3 border-2 border-border-dark bg-cream hover:bg-cream-dark transition-all cursor-pointer shadow-[2px_2px_0_#4a3728] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
            >
              <span className="text-lg mr-2">[M]</span>
              <span className="text-sm font-bold text-ink font-mono">伯爵</span>
              <p className="text-xs text-muted mt-0.5 font-mono">延续现有的称呼和形象。</p>
            </button>
            <button
              onClick={() => onChooseGender('female')}
              className="w-full text-left p-3 border-2 border-border-dark bg-cream hover:bg-cream-dark transition-all cursor-pointer shadow-[2px_2px_0_#4a3728] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
            >
              <span className="text-lg mr-2">[F]</span>
              <span className="text-sm font-bold text-ink font-mono">女伯爵</span>
              <p className="text-xs text-muted mt-0.5 font-mono">伯爵的性别档案被修正为女伯爵。此前章节中的"他"将被重新理解为"她"。</p>
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-cream border-2 border-border-dark w-full max-w-[440px] max-h-[90vh] overflow-y-auto shadow-[6px_6px_0_#4a3728]">
        <div className="bg-copper-dark text-white p-4">
          <h2 className="text-sm font-bold font-mono">{scene.title}</h2>
          <p className="text-[12px] mt-1 font-mono opacity-60">第 {scene.rebirth} 次转生</p>
        </div>

        <div className="p-4">
          <div className="bg-cream-dark border-2 border-border-dark p-3 md:p-4 mb-4">
            {scene.text.split('\n').map((line, i) => (
              <p key={i} className="text-sm text-ink leading-relaxed font-mono mb-2 last:mb-0">
                {line || '\u00A0'}
              </p>
            ))}
          </div>

          <div className="space-y-2">
            {scene.choices.map((choice, i) => (
              <button
                key={i}
                onClick={() => {
                  if (showGenderChoice && !step) {
                    setStep('gender')
                    return
                  }
                  onChoose(i)
                }}
                className="w-full text-left p-3 border-2 border-border-dark bg-cream hover:bg-cream-dark transition-all cursor-pointer shadow-[2px_2px_0_#4a3728] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
              >
                <span className="text-lg mr-2">{i === 0 ? 'A' : i === 1 ? 'B' : 'C'}</span>
                <span className="text-sm font-bold text-ink font-mono">{choice.label}</span>
                <p className="text-xs text-muted mt-0.5 font-mono">{choice.effect}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
