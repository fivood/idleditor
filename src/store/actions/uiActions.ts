import { nanoid } from '@/utils/id'
import type { GameStore } from '../gameStore'
import { TALENTS, TALENT_UNLOCK_LEVELS } from '@/core/talents'
import type { CountScene } from '@/core/countStory'

export const createUiActions = (set: any, get: any) => ({
  setPlayerName: (name) => set({ playerName: name }),,

  setTrait: (trait) => set({ trait }),,

  setActiveTab: (tab) => set({ activeTab: tab }),,

  dismissToast: (id) => {
      set(state => ({ toasts: state.toasts.filter(t => t.id !== id) }))
    },,

  addToast: (toast) => {
      set(state => ({ toasts: [...state.toasts, toast].slice(-100) }))
    },,

  setCloudSaveCode: (code) => set({ cloudSaveCode: code }),,

  upgradePublishingQuota: () => {
      const state = get()
      const cost = 100 * Math.pow(2, state.publishingQuotaUpgrades || 0)
      if (state.currencies.royalties < cost) return
      set({
        publishingQuotaUpgrades: (state.publishingQuotaUpgrades || 0) + 1,
        currencies: {
          ...state.currencies,
          royalties: state.currencies.royalties - cost,
        },
      })
      get().addToast({
        id: nanoid(),
        text: `每月出版额度 +1！现在为 ${10 + (state.publishingQuotaUpgrades || 0) + 1} 本/月。`,
        type: 'milestone',
        createdAt: get().playTicks,
      })
    },

    toggleAutoReview: () => set(s => ({ autoReviewEnabled: !s.autoReviewEnabled })),
    toggleAutoCover: () => set(s => ({ autoCoverEnabled: !s.autoCoverEnabled })),
    toggleAutoReject: () => set(s => ({ autoRejectEnabled: !s.autoRejectEnabled })),

    reissueBook: (id) => {
      const state = get()
      const ms = state.manuscripts.get(id)
      if (!ms || ms.status !== 'published') return
      const cost = 200 + Math.floor(ms.quality * 5)
      if (state.currencies.royalties < cost) {
        get().addToast({ id: nanoid(), text: `再版需要 ${cost} 版税，当前不足。`, type: 'info', createdAt: get().playTicks })
        return
      },

  toggleAutoReview: () => set(s => ({ autoReviewEnabled: !s.autoReviewEnabled })),,

  toggleAutoCover: () => set(s => ({ autoCoverEnabled: !s.autoCoverEnabled })),,

  toggleAutoReject: () => set(s => ({ autoRejectEnabled: !s.autoRejectEnabled })),,

  hirePR: () => {
      const state = get()
      if (state.prActive) return // Already active
      if (state.currencies.royalties < 200) return
      set({
        currencies: { ...state.currencies, royalties: state.currencies.royalties - 200 },
        prActive: true,
      })
      get().addToast({ id: nanoid(), text: '公关团队已就位！下一本出版的新书将自动进入热销窗口（7天，销量 ×1.5）。', type: 'milestone', createdAt: get().playTicks })
    },

    renovateReadingRoom: () => {
      const state = get()
      if (state.readingRoomRenovated) return // Already renovated
      if (state.currencies.royalties < 500) return
      set({
        currencies: { ...state.currencies, royalties: state.currencies.royalties - 500 },
        readingRoomRenovated: true,
      })
      get().addToast({ id: nanoid(), text: '阅读室焕然一新！作者好感获取永久 +20%。', type: 'milestone', createdAt: get().playTicks })
    },,

  renovateReadingRoom: () => {
      const state = get()
      if (state.readingRoomRenovated) return // Already renovated
      if (state.currencies.royalties < 500) return
      set({
        currencies: { ...state.currencies, royalties: state.currencies.royalties - 500 },
        readingRoomRenovated: true,
      })
      get().addToast({ id: nanoid(), text: '阅读室焕然一新！作者好感获取永久 +20%。', type: 'milestone', createdAt: get().playTicks })
    },

    sponsorAward: () => {
      const state = get()
      if (state.currencies.royalties < 1000) return
      const bestsellers = [...state.manuscripts.values()].filter(m => m.status === 'published' && m.isBestseller)
      if (bestsellers.length === 0) return
      const book = bestsellers[Math.floor(Math.random() * bestsellers.length)]
      set({
        currencies: { ...state.currencies, royalties: state.currencies.royalties - 1000, prestige: state.currencies.prestige + 50 },
      })
      get().addToast({ id: nanoid(), text: `赞助文学奖！《${book.title}》获得 +50 声望。`, type: 'milestone', createdAt: get().playTicks })
    },

    hostSalon: () => {
      const state = get()
      if (state.currencies.prestige < 200) return
      set(draft => {
        draft.currencies.prestige -= 200
        draft.salonBooksRemaining = 5
      })
      get().addToast({
        id: nanoid(),
        text: '你在地下室的蜡烛圆桌上举办了一场文学沙龙。几位作家举着红酒杯讨论了三个小时的"灵感来源"——实际内容是谁的经纪人更离谱。未来5本出版的品质 +5。',
        type: 'milestone',
        createdAt: get().playTicks,
      })
    },

    setPreferredGenre: (genre) => {
      const state = get()
      const maxSlots = getPreferenceSlots(state.currencies.prestige)
      if (state.preferredGenres.length >= maxSlots) return
      set({ preferredGenres: [...state.preferredGenres, genre as never] })
    },

    removePreferredGenre: (genre) => {
      set(state => ({
        preferredGenres: state.preferredGenres.filter(g => g !== genre),
      }))
    },,

  sponsorAward: () => {
      const state = get()
      if (state.currencies.royalties < 1000) return
      const bestsellers = [...state.manuscripts.values()].filter(m => m.status === 'published' && m.isBestseller)
      if (bestsellers.length === 0) return
      const book = bestsellers[Math.floor(Math.random() * bestsellers.length)]
      set({
        currencies: { ...state.currencies, royalties: state.currencies.royalties - 1000, prestige: state.currencies.prestige + 50 },
      })
      get().addToast({ id: nanoid(), text: `赞助文学奖！《${book.title}》获得 +50 声望。`, type: 'milestone', createdAt: get().playTicks })
    },

    hostSalon: () => {
      const state = get()
      if (state.currencies.prestige < 200) return
      set(draft => {
        draft.currencies.prestige -= 200
        draft.salonBooksRemaining = 5
      })
      get().addToast({
        id: nanoid(),
        text: '你在地下室的蜡烛圆桌上举办了一场文学沙龙。几位作家举着红酒杯讨论了三个小时的"灵感来源"——实际内容是谁的经纪人更离谱。未来5本出版的品质 +5。',
        type: 'milestone',
        createdAt: get().playTicks,
      })
    },

    setPreferredGenre: (genre) => {
      const state = get()
      const maxSlots = getPreferenceSlots(state.currencies.prestige)
      if (state.preferredGenres.length >= maxSlots) return
      set({ preferredGenres: [...state.preferredGenres, genre as never] })
    },

    removePreferredGenre: (genre) => {
      set(state => ({
        preferredGenres: state.preferredGenres.filter(g => g !== genre),
      }))
    },,

  setQualityThreshold: (val) => {
      const clamped = Math.max(0, Math.min(100, Math.round(val)))
      set({ qualityThreshold: clamped })
    },,

  adoptCat: () => {
      const state = get()
      if (state.catState) return
      if (state.currencies.royalties < 300) return
      set({
        catState: { name: '', affection: 20, age: 0, immortal: false, alive: true, immortalityPrompted: false },
        currencies: { ...state.currencies, royalties: state.currencies.royalties - 300 },
      })
      get().addToast({
        id: nanoid(),
        text: '一只黑猫从窗台跳了进来。它在你桌上转了一圈，闻了闻咖啡杯，然后蜷在稿件堆上发出了咕噜声。它还没有名字——点击猫来为它取名。',
        type: 'milestone',
        createdAt: get().playTicks,
      })
    },

    nameCat: (name: string) => {
      const state = get()
      if (!state.catState && state.currencies.royalties >= 300) return // adoption in progress, catState still null
      const trimmed = name.trim().slice(0, 6)
      if (!trimmed) return
      set({
        catState: {
          name: trimmed,
          affection: 20,
          age: 0,
          immortal: false,
          alive: true,
          immortalityPrompted: false,
        },
      })
      get().addToast({
        id: nanoid(),
        text: `"${trimmed}"——猫抬起头，似乎对这个名字略有不满，但最后还是打了个哈欠默认了。`,
        type: 'info',
        createdAt: get().playTicks,
      })
    },

    petCat: () => {
      const state = get()
      if (!state.catState || !state.catState.alive || state.catPetCooldown > 0) return
      const cat = { ...state.catState }
      cat.affection = Math.min(100, cat.affection + 3)
      set({ catState: cat, catPetCooldown: 60 })
      const reactions = [
        `${cat.name}发出咕噜声，用头蹭了蹭你的手。`,
        `${cat.name}翻了个身，把肚子暴露在灯光下。这是最高级别的信任。`,
        `${cat.name}懒洋洋地甩了甩尾巴，在半空中画了个弧——大概是满意。`,
        `${cat.name}打了个哈欠，然后若无其事地走开了。被摸够了。`,
      ]
      get().addToast({ id: nanoid(), text: reactions[Math.floor(Math.random() * reactions.length)] + ' 好感 +3。', type: 'info', createdAt: get().playTicks })
    },,

  nameCat: (name: string) => {
      const state = get()
      if (!state.catState && state.currencies.royalties >= 300) return // adoption in progress, catState still null
      const trimmed = name.trim().slice(0, 6)
      if (!trimmed) return
      set({
        catState: {
          name: trimmed,
          affection: 20,
          age: 0,
          immortal: false,
          alive: true,
          immortalityPrompted: false,
        },
      })
      get().addToast({
        id: nanoid(),
        text: `"${trimmed}"——猫抬起头，似乎对这个名字略有不满，但最后还是打了个哈欠默认了。`,
        type: 'info',
        createdAt: get().playTicks,
      })
    },

    petCat: () => {
      const state = get()
      if (!state.catState || !state.catState.alive || state.catPetCooldown > 0) return
      const cat = { ...state.catState }
      cat.affection = Math.min(100, cat.affection + 3)
      set({ catState: cat, catPetCooldown: 60 })
      const reactions = [
        `${cat.name}发出咕噜声，用头蹭了蹭你的手。`,
        `${cat.name}翻了个身，把肚子暴露在灯光下。这是最高级别的信任。`,
        `${cat.name}懒洋洋地甩了甩尾巴，在半空中画了个弧——大概是满意。`,
        `${cat.name}打了个哈欠，然后若无其事地走开了。被摸够了。`,
      ]
      get().addToast({ id: nanoid(), text: reactions[Math.floor(Math.random() * reactions.length)] + ' 好感 +3。', type: 'info', createdAt: get().playTicks })
    },

    makeCatImmortal: () => {
      const state = get()
      if (!state.catState || !state.catState.alive || state.catState.immortal) return
      if (state.currencies.statues < 1) return
      const cat = { ...state.catState, immortal: true }
      set({
        catState: cat,
        currencies: { ...state.currencies, statues: state.currencies.statues - 1 },
      })
      get().addToast({
        id: nanoid(),
        text: `你在满月之夜将一座铜像浸入泉水。${cat.name}舔了舔那水——然后它的眼睛里映出了永恒。从此以后，它将与你共享无尽的夜晚。`,
        type: 'milestone',
        createdAt: get().playTicks,
      })
    },,

  petCat: () => {
      const state = get()
      if (!state.catState || !state.catState.alive || state.catPetCooldown > 0) return
      const cat = { ...state.catState }
      cat.affection = Math.min(100, cat.affection + 3)
      set({ catState: cat, catPetCooldown: 60 })
      const reactions = [
        `${cat.name}发出咕噜声，用头蹭了蹭你的手。`,
        `${cat.name}翻了个身，把肚子暴露在灯光下。这是最高级别的信任。`,
        `${cat.name}懒洋洋地甩了甩尾巴，在半空中画了个弧——大概是满意。`,
        `${cat.name}打了个哈欠，然后若无其事地走开了。被摸够了。`,
      ]
      get().addToast({ id: nanoid(), text: reactions[Math.floor(Math.random() * reactions.length)] + ' 好感 +3。', type: 'info', createdAt: get().playTicks })
    },

    makeCatImmortal: () => {
      const state = get()
      if (!state.catState || !state.catState.alive || state.catState.immortal) return
      if (state.currencies.statues < 1) return
      const cat = { ...state.catState, immortal: true }
      set({
        catState: cat,
        currencies: { ...state.currencies, statues: state.currencies.statues - 1 },
      })
      get().addToast({
        id: nanoid(),
        text: `你在满月之夜将一座铜像浸入泉水。${cat.name}舔了舔那水——然后它的眼睛里映出了永恒。从此以后，它将与你共享无尽的夜晚。`,
        type: 'milestone',
        createdAt: get().playTicks,
      })
    },

    shooCat: () => {
      const state = get()
      set({ catRejectedUntilYear: state.calendar.year })
      get().addToast({
        id: nanoid(),
        text: '你把窗关上了。猫发出一声不满的"喵"，跳回了夜色中。在你把窗锁修好之前——至少到明年——不会有东西打扰你了。',
        type: 'info',
        createdAt: get().playTicks,
      })
    },

    generateEditorNote: async (id: string) => {
      const state = get()
      const ms = state.manuscripts.get(id)
      if (!ms) return
      if (state.llmCallsRemaining <= 0) {
        get().addToast({ id: nanoid(), text: '你什么都想不出来，以后再说吧。', type: 'humor', createdAt: get().playTicks })
        return
      }
      try {
        const res = await fetch('/api/llm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: `你是一家吸血鬼出版社的编辑。请为已出版书籍《${ms.title}》写一句简短的编辑批注（30字以内）。风格：冷幽默、调侃、吸血鬼视角吐槽。不要剧透。` }),
        })
        const data = await res.json()
        if (data.text) {
          const s = get()
          const m = s.manuscripts.get(id)
          if (m) {
            m.editorNote = data.text.replace(/——/g, '--').replace(/—/g, '-')
            set({ manuscripts: new Map(s.manuscripts), llmCallsRemaining: s.llmCallsRemaining - 1 })
            const adverbs = ['心血来潮', '思前想后', '闲得没事']
            get().addToast({
              id: nanoid(),
              text: `${s.playerName}${adverbs[Math.floor(Math.random() * adverbs.length)]}，给《${ms.title}》重写了一条评论：${m.editorNote}`,
              type: 'info',
              createdAt: s.playTicks,
            })
          }
        }
      } catch { /* ignore */ }
    },

    updateCustomNote: (id: string, note: string) => {
      const state = get()
      const ms = state.manuscripts.get(id)
      if (!ms) return
      ms.customNote = note.trim().slice(0, 120)
      set({ manuscripts: new Map(state.manuscripts) })
    },

    solicitFree: () => {
      set(draft => {
        if (draft.solicitCooldown > 0) return
        const count = 2 + Math.floor(Math.random() * 3)
        const spawned: string[] = []
        for (let i = 0; i < count; i++) {
          const ms = createManuscript(draft)
          draft.manuscripts.set(ms.id, ms)
          spawned.push(ms.title)
        }
        draft.solicitCooldown = 300
        get().addToast({
          id: nanoid(),
          text: `向出版业界发布了匿名征稿函。${count}份稿件应声而至：${spawned.join('、')}`,
          type: 'info',
          createdAt: draft.playTicks,
        })
      })
    },

    solicitTargeted: () => {
      set(draft => {
        if (draft.solicitCooldown > 0) return
        if (draft.currencies.revisionPoints < 30) return
        draft.currencies.revisionPoints -= 30
        const count = 2 + Math.floor(Math.random() * 2)
        const spawned: string[] = []
        for (let i = 0; i < count; i++) {
          const ms = createManuscript(draft, 10)
          draft.manuscripts.set(ms.id, ms)
          spawned.push(ms.title)
        }
        draft.solicitCooldown = 480
        get().addToast({
          id: nanoid(),
          text: `向${draft.preferredGenres.length > 0 ? draft.preferredGenres.map(g => ({'sci-fi':'科幻','mystery':'推理','suspense':'悬疑','social-science':'社科','hybrid':'混合','light-novel':'轻小说'}[g] ?? g)).join('、') + '领域' : '各领域'}定向约稿。${count}份高质量稿件已到：${spawned.join('、')}`,
          type: 'info',
          createdAt: draft.playTicks,
        })
      })
    },

    solicitRush: () => {
      set(draft => {
        if (draft.currencies.royalties < 100) return
        draft.currencies.royalties -= 100
        const count = 1 + Math.floor(Math.random() * 2)
        const spawned: string[] = []
        for (let i = 0; i < count; i++) {
          const ms = createManuscript(draft)
          draft.manuscripts.set(ms.id, ms)
          spawned.push(ms.title)
        }
        draft.solicitCooldown = 120
        get().addToast({
          id: nanoid(),
          text: `动用宣传预算紧急征稿。${count}份稿件火速抵达：${spawned.join('、')}`,
          type: 'info',
          createdAt: draft.playTicks,
        })
      })
    },

    selectTalent: (talentId: string) => {
      const talent = TALENTS.find(t => t.id === talentId)
      if (!talent) return
      const state = get()
      if (state.editorLevel < (TALENT_UNLOCK_LEVELS[talent.tier] ?? 99)) return
      if (state.selectedTalents[talent.tier]) return // Already picked this tier
      set({ selectedTalents: { ...state.selectedTalents, [talent.tier]: talentId } })
      get().addToast({ id: nanoid(), text: `天赋解锁：${talent.label}！${talent.desc.slice(0, 20)}...`, type: 'milestone', createdAt: get().playTicks })
    },

    getTalentBonuses: () => {
      const state = get()
      const bonuses: Talent['effects'] = {}
      for (const talentId of Object.values(state.selectedTalents)) {
        const t = TALENTS.find(t => t.id === talentId)
        if (!t) continue
        for (const [k, v] of Object.entries(t.effects)) {
          (bonuses as Record<string, number>)[k] = ((bonuses as Record<string, number>)[k] || 0) + (v as number)
        }
      }
      return bonuses
    },

    // ──── Manuscript actions ────
    startReview: (id: string) => {
      const state = get()
      const ms = state.manuscripts.get(id)
      if (!ms || ms.status !== 'submitted') return
      ms.status = 'reviewing'
      ms.editingProgress = 0
      set({ manuscripts: new Map(state.manuscripts) })
    },

    rejectManuscript: (id: string) => {
      const state = get()
      const ms = state.manuscripts.get(id)
      if (!ms || (ms.status !== 'submitted' && ms.status !== 'cover_select')) return
      ms.status = 'rejected'
      const wasUnsuitable = ms.isUnsuitable
      let rpReward = 0
      let prestigeReward = 0

      if (wasUnsuitable) {
        rpReward = 8
        prestigeReward = 3
      } else {
        // Rejecting a good manuscript: prestige penalty
        prestigeReward = -5
      }

      const author = state.authors.get(ms.authorId)
      if (author) {
        author.rejectedCount++
        author.cooldownUntil = 1800 + author.rejectedCount * 300
        author.affection += -10
        // Poached probability based on affection
        if (!wasUnsuitable) {
          const poachChance = author.affection >= 50 ? 0.1 : author.affection >= 20 ? 0.25 : 0.5
          if (Math.random() < poachChance) {
            author.poached = true
          }
        }
      }
      set({
        manuscripts: new Map(state.manuscripts),
        authors: new Map(state.authors),
        totalRejections: state.totalRejections + 1,
        editorXP: state.editorXP + 2,
        currencies: {
          ...state.currencies,
          revisionPoints: state.currencies.revisionPoints + rpReward,
          prestige: state.currencies.prestige + prestigeReward,
        },
      })
      const state2 = get()
      if (wasUnsuitable) {
        const authorNote = author?.tier !== 'new' && author ? ` · ${author.name}好感 -10` : ''
        const quips = [
          `"${ms.title}" 被果断退回。编辑的眼光又救了一次出版社。+${rpReward} 修订点 +${prestigeReward} 声誉${authorNote}`,
          `退稿："${ms.title}"。读者不需要这本书。说实话，作者可能也不太需要。+${rpReward} RP`,
          `又一本稿子进了退稿箱。"${ms.title}"的封面设计其实不错——可惜内容没跟上。+${rpReward} RP +${prestigeReward} 声望`,
          `${ms.title}——退。理由很充分：写得不好。具体哪里不好？全部。+${rpReward} RP`,
          `退稿《${ms.title}》。看完后你沉默了三秒，然后拿起了下一本。永生者的耐心也不是无限的。+${rpReward} RP`,
          `"${ms.title}"被退回作者手中。希望ta下本写得更好。或者至少更短。+${rpReward} RP`,
        ]
        state2.addToast({
          id: nanoid(),
          text: quips[Math.floor(Math.random() * quips.length)],
          type: 'info',
          createdAt: get().playTicks,
        })
        // LLM rejection commentary
        state2.llmCommentary(ms.title, ms.genre, '被退稿')
      } else {
        const authorNote = author?.tier !== 'new' && author ? ` · ${author.name}好感 -10` : ''
        const quips = [
          `"${ms.title}" 已被退回。作者面露不悦——这本书本来还不错。声望 -5${authorNote}`,
          `退稿："${ms.title}"。说实话，写得还行——但还行不够。在永夜出版社，"还行"和"不够"之间只差一封退稿信。声望 -5`,
          `你退回了《${ms.title}》。作者大概会生一阵气——但一个活了两百年的人对"一阵"的定义和别人不太一样。声望 -5`,
          `退稿决定：${ms.title}。不是因为写得差，是因为可以写得更好。至少编辑是这么告诉自己的。声望 -5`,
          `你合上《${ms.title}》，在退稿理由栏写了一个字："否"。实习生说是不是太简短了。你说这个字花了你两百年才学会。声望 -5`,
          `"${ms.title}"退回。作者可能会写一篇愤怒的博客，也可能从此发愤图强。你赌后者——因为你的投资回报率一直不错。声望 -5`,
        ]
        state2.addToast({
          id: nanoid(),
          text: quips[Math.floor(Math.random() * quips.length)] + (authorNote ? authorNote : ''),
          type: 'rejection',
          createdAt: get().playTicks,
        })
      }
    },

    shelveManuscript: (id: string) => {
      const state = get()
      const ms = state.manuscripts.get(id)
      if (!ms || ms.status !== 'submitted') return
      ms.status = 'shelved'
      ms.shelvedAt = state.playTicks
      set({ manuscripts: new Map(state.manuscripts) })
      get().addToast({
        id: nanoid(),
        text: `"${ms.title}" 已搁置。作者可能会修改后重新投稿。`,
        type: 'info',
        createdAt: get().playTicks,
      })
    },

    meticulousEdit: (id: string, level: 'light' | 'deep' | 'extreme') => {
      const state = get()
      const ms = state.manuscripts.get(id)
      if (!ms || ms.status !== 'editing' || ms.meticulouslyEdited) return

      const costs: Record<string, { rp: number; quality: number; label: string }> = {
        light: { rp: 10, quality: 3, label: '轻度精校' },
        deep: { rp: 30, quality: 8, label: '深度精校' },
        extreme: { rp: 60, quality: 15, label: '极限精校' },
      }
      const option = costs[level]
      if (!option || state.currencies.revisionPoints < option.rp) return

      ms.quality = Math.min(100, ms.quality + option.quality)
      ms.meticulouslyEdited = true
      const author = state.authors.get(ms.authorId)
      if (author) author.affection += 3
      set({
        manuscripts: new Map(state.manuscripts),
        currencies: {
          ...state.currencies,
          revisionPoints: state.currencies.revisionPoints - option.rp,
        },
      })
      get().addToast({
        id: nanoid(),
        text: `🔍 ${option.label}：《${ms.title}》品质 +${option.quality}（花费 ${option.rp} RP）`,
        type: 'info',
        createdAt: get().playTicks,
      })
    },

    confirmCover: (id: string) => {
      const state = get()
      const ms = state.manuscripts.get(id)
      if (!ms || ms.status !== 'cover_select') return
      if (state.booksPublishedThisMonth >= 10 + (state.publishingQuotaUpgrades || 0)) {
        state.addToast({
          id: nanoid(),
          text: '本月出版额度已用完！下个月再来吧。',
          type: 'info',
          createdAt: get().playTicks,
        })
        return
      }
      ms.status = 'publishing'
      ms.editingProgress = 0
      set({ manuscripts: new Map(state.manuscripts) })
    },

    getSubmittedManuscripts: () => {
      return [...get().manuscripts.values()].filter(m => m.status === 'submitted')
    },

    getPublishedBooks: () => {
      return [...get().manuscripts.values()].filter(m => m.status === 'published')
    },

    getInProgressManuscripts: () => {
      const state = get()
      return [...state.manuscripts.values()].filter(
        m => ['reviewing', 'editing', 'proofing', 'cover_select', 'publishing'].includes(m.status)
      )
    },

    // ──── Author actions ────
    signAuthor: (id: string) => {
      const state = get()
      const author = state.authors.get(id)
      if (!author || author.tier !== 'new') return
      author.tier = 'signed'
      author.affection += 10
      set({ authors: new Map(state.authors) })
    },

    terminateAuthor: (id: string) => {
      const state = get()
      const author = state.authors.get(id)
      if (!author || author.tier === 'new') return
      author.terminated = true
      author.cooldownUntil = null
      set({ authors: new Map(state.authors) })
      get().addToast({
        id: nanoid(),
        text: `合约解除。${author.name}从永夜出版社的作者名单中划去。他的书还在书架上——但新作不会再出现在你桌上了。`,
        type: 'info',
        createdAt: get().playTicks,
      })
    },

    // ──── Department actions ────
    createDepartment: (type) => {
      const state = get()
      const exists = [...state.departments.values()].some(d => d.type === type)
      if (exists) return
      const cost = 50
      if (state.currencies.revisionPoints < cost) return
      const dept: Department = {
        id: nanoid(),
        type,
        level: 1,
        upgradeCostRP: 75,
        upgradeCostPrestige: 0,
        upgradeTicks: 600,
        upgradingUntil: null,
      }
      const newDepts = new Map(state.departments)
      newDepts.set(dept.id, dept)
      set({
        departments: newDepts,
        currencies: {
          ...state.currencies,
          revisionPoints: state.currencies.revisionPoints - cost,
        },
      })
    },

    upgradeDepartment: (id: string) => {
      const state = get()
      const dept = state.departments.get(id)
      if (!dept || dept.upgradingUntil !== null) return
      if (state.currencies.revisionPoints < dept.upgradeCostRP) return
      if (state.currencies.prestige < dept.upgradeCostPrestige) return
      dept.upgradingUntil = state.playTicks + dept.upgradeTicks
      set({
        departments: new Map(state.departments),
        currencies: {
          ...state.currencies,
          revisionPoints: state.currencies.revisionPoints - dept.upgradeCostRP,
          prestige: state.currencies.prestige - dept.upgradeCostPrestige,
        },
      })
    },

    // ──── UI actions ────
    setPlayerName: (name) => set({ playerName: name }),
    setTrait: (trait) => set({ trait }),
    setActiveTab: (tab) => set({ activeTab: tab }),
    dismissToast: (id) => {
      set(state => ({ toasts: state.toasts.filter(t => t.id !== id) }))
    },
    addToast: (toast) => {
      set(state => ({ toasts: [...state.toasts, toast].slice(-100) }))
    },

    // ──── Cloud save ────
    setCloudSaveCode: (code) => set({ cloudSaveCode: code }),

    llmCommentary: async (title: string, genre: string, context: string) => {
      const state = get()
      if (state.llmCallsRemaining <= 0) return
      try {
        const res = await fetch('/api/commentary', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, genre, context }) })
        const data = await res.json()
        if (data.text) {
          if (!data.cached) set({ llmCallsRemaining: state.llmCallsRemaining - 1 })
          get().addToast({ id: nanoid(), text: `[编辑吐槽] ${data.text}`, type: 'info', createdAt: get().playTicks })
        }
      } catch { /* ignore */ }
    },

    generateLlmEditorNote: async (id: string) => {
      const state = get()
      if (state.llmCallsRemaining <= 0) return null
      const ms = state.manuscripts.get(id)
      if (!ms) return null

      const prompt = `你是一家吸血鬼出版社的编辑。请用中文写一段对已出版书籍《${ms.title}》的编辑批注。风格：冷幽默、吐槽感。1-2句话。不要剧透。`
      try {
        const res = await fetch('/api/llm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt }),
        })
        const data = await res.json()
        if (data.text) {
          set({ llmCallsRemaining: state.llmCallsRemaining - 1 })
          return data.text
        }
      } catch { /* ignore */ }
      return null
    },

    resolveDecision: (optionIndex: number) => {
      const state = get()
      if (!state.pendingDecision) return

      const decision = state.pendingDecision
      const choice = decision.options[optionIndex]
      if (!choice) return

      // Handle cat arrival decision
      if (decision.id === 'cat-arrival') {
        if (optionIndex === 0) {
          // Adopt
          if (state.currencies.royalties >= 300) {
            set({
              pendingDecision: null,
              decisionCooldown: 900,
              catState: { name: '', affection: 20, age: 0, immortal: false, alive: true, immortalityPrompted: false },
              currencies: { ...state.currencies, royalties: state.currencies.royalties - 300 },
            })
            get().addToast({ id: nanoid(), text: '黑猫跳上了书桌。它在一叠稿件上踩了踩，找到了最舒服的位置。你需要给它取个名字。', type: 'milestone', createdAt: get().playTicks })
          } else {
            get().addToast({ id: nanoid(), text: '你翻遍了抽屉——版税不够。猫看着你，尾巴尖轻轻摆了一下，然后跳回了窗外。它显然不想给贫穷的人打工。', type: 'info', createdAt: get().playTicks })
            set({ pendingDecision: null, decisionCooldown: 900 })
          }
        } else {
          // Shoo
          get().shooCat()
          set({ pendingDecision: null, decisionCooldown: 900 })
        }
        return
      }

      // Dispatch effect by effectId (replaces old title-matching)
      if (decision.effectId && DECISION_EFFECTS[decision.effectId]) {
        DECISION_EFFECTS[decision.effectId](state, optionIndex)
      } else {
        // Fallback for LLM-generated decisions without effectId
        applyLLMEffects(choice.description, state)
      }

      set({
        pendingDecision: null,
        decisionCooldown: 900,
      })
    },

    upgradePublishingQuota: () => {
      const state = get()
      const cost = 100 * Math.pow(2, state.publishingQuotaUpgrades || 0)
      if (state.currencies.royalties < cost) return
      set({
        publishingQuotaUpgrades: (state.publishingQuotaUpgrades || 0) + 1,
        currencies: {
          ...state.currencies,
          royalties: state.currencies.royalties - cost,
        },
      })
      get().addToast({
        id: nanoid(),
        text: `每月出版额度 +1！现在为 ${10 + (state.publishingQuotaUpgrades || 0) + 1} 本/月。`,
        type: 'milestone',
        createdAt: get().playTicks,
      })
    },

    toggleAutoReview: () => set(s => ({ autoReviewEnabled: !s.autoReviewEnabled })),
    toggleAutoCover: () => set(s => ({ autoCoverEnabled: !s.autoCoverEnabled })),
    toggleAutoReject: () => set(s => ({ autoRejectEnabled: !s.autoRejectEnabled })),

    reissueBook: (id) => {
      const state = get()
      const ms = state.manuscripts.get(id)
      if (!ms || ms.status !== 'published') return
      const cost = 200 + Math.floor(ms.quality * 5)
      if (state.currencies.royalties < cost) {
        get().addToast({ id: nanoid(), text: `再版需要 ${cost} 版税，当前不足。`, type: 'info', createdAt: get().playTicks })
        return
      }
      ms.quality = Math.min(100, ms.quality + 3)
      ms.meticulouslyEdited = true
      ms.reissueBoostUntil = state.playTicks + 420 // 7 game-day marketing window
      set({
        manuscripts: new Map(state.manuscripts),
        currencies: { ...state.currencies, royalties: state.currencies.royalties - cost },
      })
      get().addToast({ id: nanoid(), text: `"${ms.title}" 已再版！品质 +3，进入7天营销窗口期。`, type: 'milestone', createdAt: get().playTicks })
    },

    buyAuthorMeal: (id) => {
      const state = get()
      const author = state.authors.get(id)
      if (!author || state.currencies.revisionPoints < 20) return
      if (state.playTicks - author.lastInteractionAt < 120) return // 2 min cooldown
      author.affection = Math.min(100, author.affection + 15)
      author.lastInteractionAt = state.playTicks
      set({
        authors: new Map(state.authors),
        currencies: { ...state.currencies, revisionPoints: state.currencies.revisionPoints - 20 },
      })
      const meals = ['一起吃了顿深夜拉面，聊了聊下一本书的构思。', '在出版社对面的茶馆喝了杯茶，讨论了截稿日期——双方都默契地没有提具体的数字。', '去了家隐藏在小巷里的居酒屋，喝到第二杯的时候作者终于承认第三章写得不好。']
      get().addToast({ id: nanoid(), text: `请${author.name}${meals[Math.floor(Math.random() * meals.length)]}好感 +15。`, type: 'info', createdAt: get().playTicks })
    },

    sendAuthorGift: (id) => {
      const state = get()
      const author = state.authors.get(id)
      if (!author || state.currencies.revisionPoints < 15) return
      if (state.playTicks - author.lastInteractionAt < 120) return
      author.affection = Math.min(100, author.affection + 10)
      author.lastInteractionAt = state.playTicks
      set({
        authors: new Map(state.authors),
        currencies: { ...state.currencies, revisionPoints: state.currencies.revisionPoints - 15 },
      })
      const gifts = ['寄了一本永夜出版社的经典样书——扉页上只写了"请继续写"。', '送了一支旧羽毛笔，据说是19世纪的。附言："这支笔写过更糟的稿子。别担心。"', '把最新一期的《永夜文学报》夹在一本新书里寄了过去。报纸上有一篇匿名书评——作者看完后哭了。', '寄了一盒红茶——不是你们以为的那种红。普通的英式红茶。附卡片："休息一下。你写得太多了。"']
      get().addToast({ id: nanoid(), text: `${author.name}${gifts[Math.floor(Math.random() * gifts.length)]}好感 +10。`, type: 'info', createdAt: get().playTicks })
    },

    writeAuthorLetter: (id) => {
      const state = get()
      const author = state.authors.get(id)
      if (!author || state.currencies.revisionPoints < 10) return
      if (state.playTicks - author.lastInteractionAt < 120) return
      author.affection = Math.min(100, author.affection + 8)
      author.lastInteractionAt = state.playTicks
      set({
        authors: new Map(state.authors),
        currencies: { ...state.currencies, revisionPoints: state.currencies.revisionPoints - 10 },
      })
      const letters = ['写了一封手写回信，措辞认真到连标点符号都检查了三遍。', '回了封短信——只有五行字。但作者看了之后在工作室里踱步了半小时。', '在回信的末尾画了一只蝙蝠。作者回了一封邮件：只有一个问号。但ta显然被逗笑了。']
      get().addToast({ id: nanoid(), text: `${author.name}${letters[Math.floor(Math.random() * letters.length)]}好感 +8。`, type: 'info', createdAt: get().playTicks })
    },

    generateBookReview: async (title, genre) => {
      try {
        const res = await fetch('/api/book-review', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, genre, type: 'review' }) })
        const data = await res.json()
        return data.text ? { text: data.text, poolSize: data.poolSize || 1 } : null
      } catch { return null }
    },

    generateAuthorQuote: async (title, authorName, genre) => {
      try {
        const res = await fetch('/api/book-review', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: `${title}（作者：${authorName}）`, genre, type: 'quote' }) }),

  makeCatImmortal: () => {
      const state = get()
      if (!state.catState || !state.catState.alive || state.catState.immortal) return
      if (state.currencies.statues < 1) return
      const cat = { ...state.catState, immortal: true }
      set({
        catState: cat,
        currencies: { ...state.currencies, statues: state.currencies.statues - 1 },
      })
      get().addToast({
        id: nanoid(),
        text: `你在满月之夜将一座铜像浸入泉水。${cat.name}舔了舔那水——然后它的眼睛里映出了永恒。从此以后，它将与你共享无尽的夜晚。`,
        type: 'milestone',
        createdAt: get().playTicks,
      })
    },

    shooCat: () => {
      const state = get()
      set({ catRejectedUntilYear: state.calendar.year })
      get().addToast({
        id: nanoid(),
        text: '你把窗关上了。猫发出一声不满的"喵"，跳回了夜色中。在你把窗锁修好之前——至少到明年——不会有东西打扰你了。',
        type: 'info',
        createdAt: get().playTicks,
      })
    },

    generateEditorNote: async (id: string) => {
      const state = get()
      const ms = state.manuscripts.get(id)
      if (!ms) return
      if (state.llmCallsRemaining <= 0) {
        get().addToast({ id: nanoid(), text: '你什么都想不出来，以后再说吧。', type: 'humor', createdAt: get().playTicks })
        return
      }
      try {
        const res = await fetch('/api/llm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: `你是一家吸血鬼出版社的编辑。请为已出版书籍《${ms.title}》写一句简短的编辑批注（30字以内）。风格：冷幽默、调侃、吸血鬼视角吐槽。不要剧透。` }),
        })
        const data = await res.json()
        if (data.text) {,

  shooCat: () => {
      const state = get()
      set({ catRejectedUntilYear: state.calendar.year })
      get().addToast({
        id: nanoid(),
        text: '你把窗关上了。猫发出一声不满的"喵"，跳回了夜色中。在你把窗锁修好之前——至少到明年——不会有东西打扰你了。',
        type: 'info',
        createdAt: get().playTicks,
      })
    },

    generateEditorNote: async (id: string) => {
      const state = get()
      const ms = state.manuscripts.get(id)
      if (!ms) return
      if (state.llmCallsRemaining <= 0) {
        get().addToast({ id: nanoid(), text: '你什么都想不出来，以后再说吧。', type: 'humor', createdAt: get().playTicks })
        return
      },

  onCountSceneChoice: (choiceIndex: number) => {
      const state = get()
      const scene = state.activeCountScene
      if (!scene) return
      const choice = scene.choices[choiceIndex]
      if (!choice) return
      const newRelation = state.permanentBonuses.countRelation + choice.loyaltyChange
      set({
        permanentBonuses: { ...state.permanentBonuses, countRelation: newRelation },
        activeCountScene: null,
      })
      get().addToast({ id: nanoid(), text: choice.toastText, type: 'milestone', createdAt: get().playTicks })
      // Gender choice after first scene
      if (scene.rebirth === 1) {
        set({ activeCountScene: { ...scene, rebirth: -1 } as CountScene }) // Signal gender choice
      }
    },,

  onCountGenderChoice: (gender: 'male' | 'female') => {
      set(s => ({
        permanentBonuses: { ...s.permanentBonuses, countGender: gender },
        activeCountScene: null,
      }))
      const label = gender === 'female' ? '女伯爵' : '伯爵'
      get().addToast({ id: nanoid(), text: `伯爵称号已更新。此后称呼为：${label}。`, type: 'milestone', createdAt: get().playTicks })
    },

    dismissEnding: () => set({ countEnding: null }),

    setPlayerGender: (gender) => set({ playerGender: gender }),

    setQualityThreshold: (val) => {
      const clamped = Math.max(0, Math.min(100, Math.round(val)))
      set({ qualityThreshold: clamped })
    },

    adoptCat: () => {
      const state = get()
      if (state.catState) return
      if (state.currencies.royalties < 300) return
      set({
        catState: { name: '', affection: 20, age: 0, immortal: false, alive: true, immortalityPrompted: false },
        currencies: { ...state.currencies, royalties: state.currencies.royalties - 300 },
      })
      get().addToast({
        id: nanoid(),
        text: '一只黑猫从窗台跳了进来。它在你桌上转了一圈，闻了闻咖啡杯，然后蜷在稿件堆上发出了咕噜声。它还没有名字——点击猫来为它取名。',
        type: 'milestone',
        createdAt: get().playTicks,
      })
    },

    nameCat: (name: string) => {
      const state = get()
      if (!state.catState && state.currencies.royalties >= 300) return // adoption in progress, catState still null
      const trimmed = name.trim().slice(0, 6),

  dismissEnding: () => set({ countEnding: null }),,

  setPlayerGender: (gender) => set({ playerGender: gender }),,

  selectTalent: (talentId: string) => {
      const talent = TALENTS.find(t => t.id === talentId)
      if (!talent) return
      const state = get()
      if (state.editorLevel < (TALENT_UNLOCK_LEVELS[talent.tier] ?? 99)) return
      if (state.selectedTalents[talent.tier]) return // Already picked this tier
      set({ selectedTalents: { ...state.selectedTalents, [talent.tier]: talentId } })
      get().addToast({ id: nanoid(), text: `天赋解锁：${talent.label}！${talent.desc.slice(0, 20)}...`, type: 'milestone', createdAt: get().playTicks })
    },,

  getTalentBonuses: () => {
      const state = get()
      const bonuses: Talent['effects'] = {}
      for (const talentId of Object.values(state.selectedTalents)) {
        const t = TALENTS.find(t => t.id === talentId)
        if (!t) continue
        for (const [k, v] of Object.entries(t.effects)) {
          (bonuses as Record<string, number>)[k] = ((bonuses as Record<string, number>)[k] || 0) + (v as number)
        }
      }
      return bonuses
    },,

})
