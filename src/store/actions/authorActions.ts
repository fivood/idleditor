import { nanoid } from '@/utils/id'
import type { GameStore } from '../gameStore'

export const createAuthorActions = (set: any, get: any) => ({
  signAuthor: (id: string) => {
      const state = get()
      const author = state.authors.get(id)
      if (!author || author.tier !== 'new') return
      author.tier = 'signed'
      author.affection += 10
      set({ authors: new Map(state.authors) })
    },,

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
        const res = await fetch('/api/book-review', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: `${title}（作者：${authorName}）`, genre, type: 'quote' }) })
        const data = await res.json()
        return data.text ? { text: data.text, poolSize: data.poolSize || 1 } : null
      } catch { return null }
    },

    rushAuthorCooldown: (id) => {
      const state = get()
      const author = state.authors.get(id)
      if (!author || !author.cooldownUntil || author.cooldownUntil <= 0 || state.currencies.revisionPoints < 30) return
      if (state.playTicks - author.lastInteractionAt < 120) return
      author.cooldownUntil = Math.max(0, Math.floor(author.cooldownUntil * 0.5))
      author.affection = Math.max(0, author.affection - 5)
      author.lastInteractionAt = state.playTicks
      set({
        authors: new Map(state.authors),
        currencies: { ...state.currencies, revisionPoints: state.currencies.revisionPoints - 30 },
      })
      get().addToast({ id: nanoid(), text: `催稿成功！${author.name}的冷却时间减半。好感 -5。`, type: 'info', createdAt: get().playTicks })
    },

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
        const res = await fetch('/api/book-review', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: `${title}（作者：${authorName}）`, genre, type: 'quote' }) })
        const data = await res.json()
        return data.text ? { text: data.text, poolSize: data.poolSize || 1 } : null
      } catch { return null }
    },

    rushAuthorCooldown: (id) => {
      const state = get()
      const author = state.authors.get(id)
      if (!author || !author.cooldownUntil || author.cooldownUntil <= 0 || state.currencies.revisionPoints < 30) return
      if (state.playTicks - author.lastInteractionAt < 120) return
      author.cooldownUntil = Math.max(0, Math.floor(author.cooldownUntil * 0.5))
      author.affection = Math.max(0, author.affection - 5)
      author.lastInteractionAt = state.playTicks
      set({
        authors: new Map(state.authors),
        currencies: { ...state.currencies, revisionPoints: state.currencies.revisionPoints - 30 },
      })
      get().addToast({ id: nanoid(), text: `催稿成功！${author.name}的冷却时间减半。好感 -5。`, type: 'info', createdAt: get().playTicks })
    },

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
      }),

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
    },,

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
        const res = await fetch('/api/book-review', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: `${title}（作者：${authorName}）`, genre, type: 'quote' }) })
        const data = await res.json()
        return data.text ? { text: data.text, poolSize: data.poolSize || 1 } : null
      } catch { return null }
    },

    rushAuthorCooldown: (id) => {
      const state = get()
      const author = state.authors.get(id)
      if (!author || !author.cooldownUntil || author.cooldownUntil <= 0 || state.currencies.revisionPoints < 30) return
      if (state.playTicks - author.lastInteractionAt < 120) return
      author.cooldownUntil = Math.max(0, Math.floor(author.cooldownUntil * 0.5))
      author.affection = Math.max(0, author.affection - 5)
      author.lastInteractionAt = state.playTicks
      set({
        authors: new Map(state.authors),
        currencies: { ...state.currencies, revisionPoints: state.currencies.revisionPoints - 30 },
      })
      get().addToast({ id: nanoid(), text: `催稿成功！${author.name}的冷却时间减半。好感 -5。`, type: 'info', createdAt: get().playTicks })
    },

    hirePR: () => {
      const state = get()
      if (state.prActive) return // Already active
      if (state.currencies.royalties < 200) return
      set({
        currencies: { ...state.currencies, royalties: state.currencies.royalties - 200 },
        prActive: true,
      })
      get().addToast({ id: nanoid(), text: '公关团队已就位！下一本出版的新书将自动进入热销窗口（7天，销量 ×1.5）。', type: 'milestone', createdAt: get().playTicks }),

  rushAuthorCooldown: (id) => {
      const state = get()
      const author = state.authors.get(id)
      if (!author || !author.cooldownUntil || author.cooldownUntil <= 0 || state.currencies.revisionPoints < 30) return
      if (state.playTicks - author.lastInteractionAt < 120) return
      author.cooldownUntil = Math.max(0, Math.floor(author.cooldownUntil * 0.5))
      author.affection = Math.max(0, author.affection - 5)
      author.lastInteractionAt = state.playTicks
      set({
        authors: new Map(state.authors),
        currencies: { ...state.currencies, revisionPoints: state.currencies.revisionPoints - 30 },
      })
      get().addToast({ id: nanoid(), text: `催稿成功！${author.name}的冷却时间减半。好感 -5。`, type: 'info', createdAt: get().playTicks })
    },

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
    },,

})
