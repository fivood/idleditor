// ──── Decision Effect Handlers ────
// Each handler corresponds to a DecisionTemplate effectId.
// Effects are co-located with their template definitions for maintainability.

import type { GameStore } from '@/store/gameStore'
import { nanoid } from '../utils/id'

type EffectFn = (state: GameStore, optionIndex: number) => void

function getSet(_state: GameStore) {
  const set = (partial: Partial<GameStore>) => {
    // Access the store's setState via the module-level import
    const { useGameStore } = require('@/store/gameStore')
    useGameStore.setState(partial)
  }
  const addToast = (text: string, type: 'milestone' | 'info' = 'milestone') => {
    const { useGameStore } = require('@/store/gameStore')
    const s = useGameStore.getState()
    useGameStore.setState({ toasts: [...s.toasts, { id: nanoid(), text, type, createdAt: s.playTicks }].slice(-100) })
  }
  return { set, addToast }
}

export const DECISION_EFFECTS: Record<string, EffectFn> = {
  'critic-preview': (state, optionIndex) => {
    const { set, addToast } = getSet(state)
    if (optionIndex === 0) {
      const submitted = [...state.manuscripts.values()].filter(m => m.status === 'submitted')
      const ms = submitted[Math.floor(Math.random() * submitted.length)]
      if (ms) {
        ms.quality = Math.max(0, ms.quality - 10)
        ms.status = 'publishing'
        ms.editingProgress = 0
        set({ manuscripts: new Map(state.manuscripts) })
        addToast(`"${ms.title}" 跳过编辑，直接出版！品质 -10。`)
      }
    }
  },

  'rush-publish': (state, optionIndex) => {
    const { set, addToast } = getSet(state)
    if (optionIndex === 0) {
      const submitted = [...state.manuscripts.values()].filter(m => m.status === 'submitted')
      const ms = submitted[Math.floor(Math.random() * submitted.length)]
      if (ms) {
        ms.quality = Math.max(0, ms.quality - 5)
        ms.status = 'publishing'
        set({ manuscripts: new Map(state.manuscripts) })
        addToast(`"${ms.title}" 加急出版！品质 -5。`)
      }
    }
  },

  'anonymous-report': (state, optionIndex) => {
    const { set, addToast } = getSet(state)
    if (optionIndex === 0) {
      const authors = [...state.authors.values()].filter(a => a.tier !== 'new')
      if (authors.length > 0) {
        const a = authors[Math.floor(Math.random() * authors.length)]
        a.cooldownUntil = 1800
        set({ authors: new Map(state.authors) })
      }
      set({ currencies: { ...state.currencies, prestige: state.currencies.prestige + 15 } })
      addToast('调查结束。一位作者被暂时停职。声望 +15。')
    } else {
      set({ currencies: { ...state.currencies, prestige: Math.max(0, state.currencies.prestige - 5) } })
      addToast('搁置举报。声望 -5。')
    }
  },

  'book-fair': (state, optionIndex) => {
    const { set, addToast } = getSet(state)
    if (optionIndex === 0) {
      const cost = Math.min(state.currencies.revisionPoints, 50)
      const success = Math.random() < 0.7
      set({
        currencies: {
          ...state.currencies,
          revisionPoints: state.currencies.revisionPoints - cost,
          prestige: state.currencies.prestige + (success ? 30 : 3),
        },
      })
      addToast(success ? '参展大获成功！声望 +30。' : '效果平平，但茶歇点心不错。+3 声望。')
    }
  },

  'film-adaptation': (state, optionIndex) => {
    const { set, addToast } = getSet(state)
    if (optionIndex === 0) {
      set({ currencies: { ...state.currencies, revisionPoints: state.currencies.revisionPoints + 200 } })
      addToast('买断成交！200 RP 到账。')
    }
  },

  'advance-payment': (state, optionIndex) => {
    const { set, addToast } = getSet(state)
    if (optionIndex === 0) {
      set({ currencies: { ...state.currencies, revisionPoints: state.currencies.revisionPoints - 50 } })
      addToast('预支 50 RP。作者承诺下本品质 +15。')
    } else {
      if (Math.random() < 0.5) {
        const authors = [...state.authors.values()].filter(a => a.tier !== 'new')
        if (authors.length > 0) {
          const a = authors[Math.floor(Math.random() * authors.length)]
          a.cooldownUntil = 1200
          set({ authors: new Map(state.authors) })
          addToast(`${a.name} 被拒后进入冷却。`)
        }
      }
    }
  },

  'newcomer-award': (state, optionIndex) => {
    const { set, addToast } = getSet(state)
    if (optionIndex === 0) {
      const newcomers = [...state.authors.values()].filter(a => a.tier === 'new')
      if (newcomers.length > 0) {
        const a = newcomers[Math.floor(Math.random() * newcomers.length)]
        a.tier = 'signed'
        set({ authors: new Map(state.authors) })
        addToast(`${a.name} 签约成功！${Math.random() < 0.5 ? '入选新人奖！声望 +30。' : ''}`)
        if (Math.random() < 0.5) {
          set({ currencies: { ...state.currencies, prestige: state.currencies.prestige + 30 } })
        }
      }
    }
  },

  'printing-strike': (state, optionIndex) => {
    const { set, addToast } = getSet(state)
    if (optionIndex === 0) {
      set({ currencies: { ...state.currencies, revisionPoints: Math.max(0, state.currencies.revisionPoints - 30) } })
      addToast('涨薪同意。印刷继续。')
    } else {
      for (const m of state.manuscripts.values()) {
        if (m.status === 'publishing') m.editingProgress = 0
      }
      set({ manuscripts: new Map(state.manuscripts) })
      addToast('拒绝涨薪。印刷进度归零。')
    }
  },

  'negative-review': (state, optionIndex) => {
    const { set, addToast } = getSet(state)
    if (optionIndex === 0) {
      set({ currencies: { ...state.currencies, prestige: Math.max(0, state.currencies.prestige - 10) } })
      addToast('公开回应。声望 -10。')
    } else if (optionIndex === 1) {
      set({ currencies: { ...state.currencies, revisionPoints: Math.max(0, state.currencies.revisionPoints - 20) } })
      addToast('私下摆平。花了 20 RP。')
    }
  },

  'branch-office': (state, _optionIndex) => {
    const { set, addToast } = getSet(state)
    if (_optionIndex === 0) {
      if (Math.random() < 0.4) {
        addToast('分社开业！作者提交速度 +30%。')
      } else {
        set({ currencies: { ...state.currencies, revisionPoints: Math.max(0, state.currencies.revisionPoints - 500), prestige: Math.max(0, state.currencies.prestige - 100) } })
        addToast('分社失败。500 RP 和 100 声望打水漂。')
      }
    }
  },

  'editor-memoir': (state, optionIndex) => {
    const { set, addToast } = getSet(state)
    if (optionIndex === 0) {
      const signed = [...state.authors.values()].filter(a => a.tier !== 'new')
      for (let i = 0; i < Math.min(3, signed.length); i++) signed[i].cooldownUntil = 1200
      set({ authors: new Map(state.authors), currencies: { ...state.currencies, prestige: state.currencies.prestige + 50 } })
      addToast('回忆录出版！声望 +50。三位作者不满。')
    } else {
      set({ currencies: { ...state.currencies, prestige: state.currencies.prestige + 10 } })
      addToast('劝阻成功。声望 +10。')
    }
  },

  'tea-room-budget': (state, optionIndex) => {
    const { set, addToast } = getSet(state)
    if (optionIndex === 0) {
      set({ currencies: { ...state.currencies, revisionPoints: state.currencies.revisionPoints + 20 } })
      addToast('省下 20 RP。编辑们不开心。')
    } else {
      set({ currencies: { ...state.currencies, revisionPoints: Math.max(0, state.currencies.revisionPoints - 20) } })
      addToast('继续供应。消耗 20 RP。编辑们满意。')
    }
  },

  'genre-change': (state, optionIndex) => {
    const { set, addToast } = getSet(state)
    const author = [...state.authors.values()].find(a => a.tier !== 'new' && a.tier !== 'idol')
    if (author) {
      if (optionIndex === 0) { author.affection = Math.min(100, author.affection + 10); addToast(`${author.name}很感激你的支持。好感 +10。`) }
      else { author.affection = Math.max(0, author.affection - 5); addToast(`${author.name}表示理解。好感 -5。`) }
      set({ authors: new Map(state.authors) })
    }
  },

  'deadline-conflict': (state, optionIndex) => {
    const { set, addToast } = getSet(state)
    const author = [...state.authors.values()].find(a => a.tier !== 'new')
    if (author) {
      if (optionIndex === 0) { author.affection = Math.min(100, author.affection + 8); addToast(`再给两周。好感 +8。`) }
      else { author.affection = Math.max(0, author.affection - 8); author.cooldownUntil = 600; addToast(`勉强接受。好感 -8。`) }
      set({ authors: new Map(state.authors) })
    }
  },

  'personal-favor': (state, optionIndex) => {
    const { set, addToast } = getSet(state)
    const author = [...state.authors.values()].find(a => a.affection >= 50)
    if (author) {
      if (optionIndex === 0) { author.affection = Math.min(100, author.affection + 5); addToast(`帮忙看了稿子。好感 +5。`) }
      else { author.affection = Math.max(0, author.affection - 5); addToast(`拒绝了。好感 -5。`) }
      set({ authors: new Map(state.authors) })
    }
  },

  'social-media': (state, optionIndex) => {
    const { set, addToast } = getSet(state)
    const author = [...state.authors.values()].find(a => a.tier === 'signed' || a.tier === 'known')
    if (author) {
      if (optionIndex === 0) {
        const prestige = Math.random() < 0.5 ? 15 : -5
        set({ currencies: { ...state.currencies, prestige: state.currencies.prestige + prestige } })
        addToast(`公开支持。舆论：${prestige > 0 ? '正面' : '翻车'}。`)
      } else {
        author.affection = Math.max(0, author.affection - 5)
        set({ authors: new Map(state.authors) })
        addToast(`保持沉默。好感 -5。`)
      }
    }
  },
}
