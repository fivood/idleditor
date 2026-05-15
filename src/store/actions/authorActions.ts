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
        text: `鍚堢害瑙ｉ櫎銆?{author.name}浠庢案澶滃嚭鐗堢ぞ鐨勪綔鑰呭悕鍗曚腑鍒掑幓銆備粬鐨勪功杩樺湪涔︽灦涓娾€斺€斾絾鏂颁綔涓嶄細鍐嶅嚭鐜板湪浣犳涓婁簡銆俙,
        type: 'info',
        createdAt: get().playTicks,
      })
    },
  
    // 鈹€鈹€鈹€鈹€ Department actions 鈹€鈹€鈹€鈹€
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
  
    // 鈹€鈹€鈹€鈹€ UI actions 鈹€鈹€鈹€鈹€
    setPlayerName: (name) => set({ playerName: name }),
    setTrait: (trait) => set({ trait }),
    setActiveTab: (tab) => set({ activeTab: tab }),
    dismissToast: (id) => {
      set(state => ({ toasts: state.toasts.filter(t => t.id !== id) }))
    },
    addToast: (toast) => {
      set(state => ({ toasts: [...state.toasts, toast].slice(-100) }))
    },
  
    // 鈹€鈹€鈹€鈹€ Cloud save 鈹€鈹€鈹€鈹€
    setCloudSaveCode: (code) => set({ cloudSaveCode: code }),
  
    llmCommentary: async (title: string, genre: string, context: string) => {
      const state = get()
      if (state.llmCallsRemaining <= 0) return
      try {
        const res = await fetch('/api/commentary', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, genre, context }) })
        const data = await res.json()
        if (data.text) {
          if (!data.cached) set({ llmCallsRemaining: state.llmCallsRemaining - 1 })
          get().addToast({ id: nanoid(), text: `[缂栬緫鍚愭Ы] ${data.text}`, type: 'info', createdAt: get().playTicks })
        }
      } catch { /* ignore */ }
    },
  
    generateLlmEditorNote: async (id: string) => {
      const state = get()
      if (state.llmCallsRemaining <= 0) return null
      const ms = state.manuscripts.get(id)
      if (!ms) return null
  
      const prompt = `浣犳槸涓€瀹跺惛琛€楝煎嚭鐗堢ぞ鐨勭紪杈戙€傝鐢ㄤ腑鏂囧啓涓€娈靛宸插嚭鐗堜功绫嶃€?{ms.title}銆嬬殑缂栬緫鎵硅銆傞鏍硷細鍐峰菇榛樸€佸悙妲芥劅銆?-2鍙ヨ瘽銆備笉瑕佸墽閫忋€俙
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
            get().addToast({ id: nanoid(), text: '榛戠尗璺充笂浜嗕功妗屻€傚畠鍦ㄤ竴鍙犵浠朵笂韪╀簡韪╋紝鎵惧埌浜嗘渶鑸掓湇鐨勪綅缃€備綘闇€瑕佺粰瀹冨彇涓悕瀛椼€?, type: 'milestone', createdAt: get().playTicks })
          } else {
            get().addToast({ id: nanoid(), text: '浣犵炕閬嶄簡鎶藉眽鈥斺€旂増绋庝笉澶熴€傜尗鐪嬬潃浣狅紝灏惧反灏栬交杞绘憜浜嗕竴涓嬶紝鐒跺悗璺冲洖浜嗙獥澶栥€傚畠鏄剧劧涓嶆兂缁欒传绌风殑浜烘墦宸ャ€?, type: 'info', createdAt: get().playTicks })
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
        text: `姣忔湀鍑虹増棰濆害 +1锛佺幇鍦ㄤ负 ${10 + (state.publishingQuotaUpgrades || 0) + 1} 鏈?鏈堛€俙,
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
        get().addToast({ id: nanoid(), text: `鍐嶇増闇€瑕?${cost} 鐗堢◣锛屽綋鍓嶄笉瓒炽€俙, type: 'info', createdAt: get().playTicks })
        return
      }
      ms.quality = Math.min(100, ms.quality + 3)
      ms.meticulouslyEdited = true
      ms.reissueBoostUntil = state.playTicks + 420 // 7 game-day marketing window
      set({
        manuscripts: new Map(state.manuscripts),
        currencies: { ...state.currencies, royalties: state.currencies.royalties - cost },
      })
      get().addToast({ id: nanoid(), text: `"${ms.title}" 宸插啀鐗堬紒鍝佽川 +3锛岃繘鍏?澶╄惀閿€绐楀彛鏈熴€俙, type: 'milestone', createdAt: get().playTicks })
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
      const meals = ['涓€璧峰悆浜嗛】娣卞鎷夐潰锛岃亰浜嗚亰涓嬩竴鏈功鐨勬瀯鎬濄€?, '鍦ㄥ嚭鐗堢ぞ瀵归潰鐨勮尪棣嗗枬浜嗘澂鑼讹紝璁ㄨ浜嗘埅绋挎棩鏈熲€斺€斿弻鏂归兘榛樺鍦版病鏈夋彁鍏蜂綋鐨勬暟瀛椼€?, '鍘讳簡瀹堕殣钘忓湪灏忓贩閲岀殑灞呴厭灞嬶紝鍠濆埌绗簩鏉殑鏃跺€欎綔鑰呯粓浜庢壙璁ょ涓夌珷鍐欏緱涓嶅ソ銆?]
      get().addToast({ id: nanoid(), text: `璇?{author.name}${meals[Math.floor(Math.random() * meals.length)]}濂芥劅 +15銆俙, type: 'info', createdAt: get().playTicks })
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
      const gifts = ['瀵勪簡涓€鏈案澶滃嚭鐗堢ぞ鐨勭粡鍏告牱涔︹€斺€旀墘椤典笂鍙啓浜?璇风户缁啓"銆?, '閫佷簡涓€鏀棫缇芥瘺绗旓紝鎹鏄?9涓栫邯鐨勩€傞檮瑷€锛?杩欐敮绗斿啓杩囨洿绯熺殑绋垮瓙銆傚埆鎷呭績銆?', '鎶婃渶鏂颁竴鏈熺殑銆婃案澶滄枃瀛︽姤銆嬪す鍦ㄤ竴鏈柊涔﹂噷瀵勪簡杩囧幓銆傛姤绾镐笂鏈変竴绡囧尶鍚嶄功璇勨€斺€斾綔鑰呯湅瀹屽悗鍝簡銆?, '瀵勪簡涓€鐩掔孩鑼垛€斺€斾笉鏄綘浠ヤ负鐨勯偅绉嶇孩銆傛櫘閫氱殑鑻卞紡绾㈣尪銆傞檮鍗＄墖锛?浼戞伅涓€涓嬨€備綘鍐欏緱澶浜嗐€?']
      get().addToast({ id: nanoid(), text: `${author.name}${gifts[Math.floor(Math.random() * gifts.length)]}濂芥劅 +10銆俙, type: 'info', createdAt: get().playTicks })
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
      const letters = ['鍐欎簡涓€灏佹墜鍐欏洖淇★紝鎺緸璁ょ湡鍒拌繛鏍囩偣绗﹀彿閮芥鏌ヤ簡涓夐亶銆?, '鍥炰簡灏佺煭淇♀€斺€斿彧鏈変簲琛屽瓧銆備絾浣滆€呰浜嗕箣鍚庡湪宸ヤ綔瀹ら噷韪辨浜嗗崐灏忔椂銆?, '鍦ㄥ洖淇＄殑鏈熬鐢讳簡涓€鍙潤铦犮€備綔鑰呭洖浜嗕竴灏侀偖浠讹細鍙湁涓€涓棶鍙枫€備絾ta鏄剧劧琚€楃瑧浜嗐€?]
      get().addToast({ id: nanoid(), text: `${author.name}${letters[Math.floor(Math.random() * letters.length)]}濂芥劅 +8銆俙, type: 'info', createdAt: get().playTicks })
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
        const res = await fetch('/api/book-review', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: `${title}锛堜綔鑰咃細${authorName}锛塦, genre, type: 'quote' }) })
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
      get().addToast({ id: nanoid(), text: `鍌鎴愬姛锛?{author.name}鐨勫喎鍗存椂闂村噺鍗娿€傚ソ鎰?-5銆俙, type: 'info', createdAt: get().playTicks })
    },
  
    hirePR: () => {
      const state = get()
      if (state.prActive) return // Already active
      if (state.currencies.royalties < 200) return
      set({
        currencies: { ...state.currencies, royalties: state.currencies.royalties - 200 },
        prActive: true,
      })
      get().addToast({ id: nanoid(), text: '鍏叧鍥㈤槦宸插氨浣嶏紒涓嬩竴鏈嚭鐗堢殑鏂颁功灏嗚嚜鍔ㄨ繘鍏ョ儹閿€绐楀彛锛?澶╋紝閿€閲?脳1.5锛夈€?, type: 'milestone', createdAt: get().playTicks })
    },
  
    renovateReadingRoom: () => {
      const state = get()
      if (state.readingRoomRenovated) return // Already renovated
      if (state.currencies.royalties < 500) return
      set({
        currencies: { ...state.currencies, royalties: state.currencies.royalties - 500 },
        readingRoomRenovated: true,
      })
      get().addToast({ id: nanoid(), text: '闃呰瀹ょ剷鐒朵竴鏂帮紒浣滆€呭ソ鎰熻幏鍙栨案涔?+20%銆?, type: 'milestone', createdAt: get().playTicks })
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
      get().addToast({ id: nanoid(), text: `璧炲姪鏂囧濂栵紒銆?{book.title}銆嬭幏寰?+50 澹版湜銆俙, type: 'milestone', createdAt: get().playTicks })
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
        text: '浣犲湪鍦颁笅瀹ょ殑铚＄儧鍦嗘涓婁妇鍔炰簡涓€鍦烘枃瀛︽矙榫欍€傚嚑浣嶄綔瀹朵妇鐫€绾㈤厭鏉璁轰簡涓変釜灏忔椂鐨?鐏垫劅鏉ユ簮"鈥斺€斿疄闄呭唴瀹规槸璋佺殑缁忕邯浜烘洿绂昏氨銆傛湭鏉?鏈嚭鐗堢殑鍝佽川 +5銆?,
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
      const meals = ['涓€璧峰悆浜嗛】娣卞鎷夐潰锛岃亰浜嗚亰涓嬩竴鏈功鐨勬瀯鎬濄€?, '鍦ㄥ嚭鐗堢ぞ瀵归潰鐨勮尪棣嗗枬浜嗘澂鑼讹紝璁ㄨ浜嗘埅绋挎棩鏈熲€斺€斿弻鏂归兘榛樺鍦版病鏈夋彁鍏蜂綋鐨勬暟瀛椼€?, '鍘讳簡瀹堕殣钘忓湪灏忓贩閲岀殑灞呴厭灞嬶紝鍠濆埌绗簩鏉殑鏃跺€欎綔鑰呯粓浜庢壙璁ょ涓夌珷鍐欏緱涓嶅ソ銆?]
      get().addToast({ id: nanoid(), text: `璇?{author.name}${meals[Math.floor(Math.random() * meals.length)]}濂芥劅 +15銆俙, type: 'info', createdAt: get().playTicks })
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
      const gifts = ['瀵勪簡涓€鏈案澶滃嚭鐗堢ぞ鐨勭粡鍏告牱涔︹€斺€旀墘椤典笂鍙啓浜?璇风户缁啓"銆?, '閫佷簡涓€鏀棫缇芥瘺绗旓紝鎹鏄?9涓栫邯鐨勩€傞檮瑷€锛?杩欐敮绗斿啓杩囨洿绯熺殑绋垮瓙銆傚埆鎷呭績銆?', '鎶婃渶鏂颁竴鏈熺殑銆婃案澶滄枃瀛︽姤銆嬪す鍦ㄤ竴鏈柊涔﹂噷瀵勪簡杩囧幓銆傛姤绾镐笂鏈変竴绡囧尶鍚嶄功璇勨€斺€斾綔鑰呯湅瀹屽悗鍝簡銆?, '瀵勪簡涓€鐩掔孩鑼垛€斺€斾笉鏄綘浠ヤ负鐨勯偅绉嶇孩銆傛櫘閫氱殑鑻卞紡绾㈣尪銆傞檮鍗＄墖锛?浼戞伅涓€涓嬨€備綘鍐欏緱澶浜嗐€?']
      get().addToast({ id: nanoid(), text: `${author.name}${gifts[Math.floor(Math.random() * gifts.length)]}濂芥劅 +10銆俙, type: 'info', createdAt: get().playTicks })
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
      const letters = ['鍐欎簡涓€灏佹墜鍐欏洖淇★紝鎺緸璁ょ湡鍒拌繛鏍囩偣绗﹀彿閮芥鏌ヤ簡涓夐亶銆?, '鍥炰簡灏佺煭淇♀€斺€斿彧鏈変簲琛屽瓧銆備絾浣滆€呰浜嗕箣鍚庡湪宸ヤ綔瀹ら噷韪辨浜嗗崐灏忔椂銆?, '鍦ㄥ洖淇＄殑鏈熬鐢讳簡涓€鍙潤铦犮€備綔鑰呭洖浜嗕竴灏侀偖浠讹細鍙湁涓€涓棶鍙枫€備絾ta鏄剧劧琚€楃瑧浜嗐€?]
      get().addToast({ id: nanoid(), text: `${author.name}${letters[Math.floor(Math.random() * letters.length)]}濂芥劅 +8銆俙, type: 'info', createdAt: get().playTicks })
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
        const res = await fetch('/api/book-review', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: `${title}锛堜綔鑰咃細${authorName}锛塦, genre, type: 'quote' }) })
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
      get().addToast({ id: nanoid(), text: `鍌鎴愬姛锛?{author.name}鐨勫喎鍗存椂闂村噺鍗娿€傚ソ鎰?-5銆俙, type: 'info', createdAt: get().playTicks })
    },
  
    hirePR: () => {
      const state = get()
      if (state.prActive) return // Already active
      if (state.currencies.royalties < 200) return
      set({
        currencies: { ...state.currencies, royalties: state.currencies.royalties - 200 },
        prActive: true,
      })
      get().addToast({ id: nanoid(), text: '鍏叧鍥㈤槦宸插氨浣嶏紒涓嬩竴鏈嚭鐗堢殑鏂颁功灏嗚嚜鍔ㄨ繘鍏ョ儹閿€绐楀彛锛?澶╋紝閿€閲?脳1.5锛夈€?, type: 'milestone', createdAt: get().playTicks })
    },
  
    renovateReadingRoom: () => {
      const state = get()
      if (state.readingRoomRenovated) return // Already renovated
      if (state.currencies.royalties < 500) return
      set({
        currencies: { ...state.currencies, royalties: state.currencies.royalties - 500 },
        readingRoomRenovated: true,
      })
      get().addToast({ id: nanoid(), text: '闃呰瀹ょ剷鐒朵竴鏂帮紒浣滆€呭ソ鎰熻幏鍙栨案涔?+20%銆?, type: 'milestone', createdAt: get().playTicks })
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
      get().addToast({ id: nanoid(), text: `璧炲姪鏂囧濂栵紒銆?{book.title}銆嬭幏寰?+50 澹版湜銆俙, type: 'milestone', createdAt: get().playTicks })
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
        text: '浣犲湪鍦颁笅瀹ょ殑铚＄儧鍦嗘涓婁妇鍔炰簡涓€鍦烘枃瀛︽矙榫欍€傚嚑浣嶄綔瀹朵妇鐫€绾㈤厭鏉璁轰簡涓変釜灏忔椂鐨?鐏垫劅鏉ユ簮"鈥斺€斿疄闄呭唴瀹规槸璋佺殑缁忕邯浜烘洿绂昏氨銆傛湭鏉?鏈嚭鐗堢殑鍝佽川 +5銆?,
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
      const gifts = ['瀵勪簡涓€鏈案澶滃嚭鐗堢ぞ鐨勭粡鍏告牱涔︹€斺€旀墘椤典笂鍙啓浜?璇风户缁啓"銆?, '閫佷簡涓€鏀棫缇芥瘺绗旓紝鎹鏄?9涓栫邯鐨勩€傞檮瑷€锛?杩欐敮绗斿啓杩囨洿绯熺殑绋垮瓙銆傚埆鎷呭績銆?', '鎶婃渶鏂颁竴鏈熺殑銆婃案澶滄枃瀛︽姤銆嬪す鍦ㄤ竴鏈柊涔﹂噷瀵勪簡杩囧幓銆傛姤绾镐笂鏈変竴绡囧尶鍚嶄功璇勨€斺€斾綔鑰呯湅瀹屽悗鍝簡銆?, '瀵勪簡涓€鐩掔孩鑼垛€斺€斾笉鏄綘浠ヤ负鐨勯偅绉嶇孩銆傛櫘閫氱殑鑻卞紡绾㈣尪銆傞檮鍗＄墖锛?浼戞伅涓€涓嬨€備綘鍐欏緱澶浜嗐€?']
      get().addToast({ id: nanoid(), text: `${author.name}${gifts[Math.floor(Math.random() * gifts.length)]}濂芥劅 +10銆俙, type: 'info', createdAt: get().playTicks })
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
      const letters = ['鍐欎簡涓€灏佹墜鍐欏洖淇★紝鎺緸璁ょ湡鍒拌繛鏍囩偣绗﹀彿閮芥鏌ヤ簡涓夐亶銆?, '鍥炰簡灏佺煭淇♀€斺€斿彧鏈変簲琛屽瓧銆備絾浣滆€呰浜嗕箣鍚庡湪宸ヤ綔瀹ら噷韪辨浜嗗崐灏忔椂銆?, '鍦ㄥ洖淇＄殑鏈熬鐢讳簡涓€鍙潤铦犮€備綔鑰呭洖浜嗕竴灏侀偖浠讹細鍙湁涓€涓棶鍙枫€備絾ta鏄剧劧琚€楃瑧浜嗐€?]
      get().addToast({ id: nanoid(), text: `${author.name}${letters[Math.floor(Math.random() * letters.length)]}濂芥劅 +8銆俙, type: 'info', createdAt: get().playTicks })
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
      const letters = ['鍐欎簡涓€灏佹墜鍐欏洖淇★紝鎺緸璁ょ湡鍒拌繛鏍囩偣绗﹀彿閮芥鏌ヤ簡涓夐亶銆?, '鍥炰簡灏佺煭淇♀€斺€斿彧鏈変簲琛屽瓧銆備絾浣滆€呰浜嗕箣鍚庡湪宸ヤ綔瀹ら噷韪辨浜嗗崐灏忔椂銆?, '鍦ㄥ洖淇＄殑鏈熬鐢讳簡涓€鍙潤铦犮€備綔鑰呭洖浜嗕竴灏侀偖浠讹細鍙湁涓€涓棶鍙枫€備絾ta鏄剧劧琚€楃瑧浜嗐€?]
      get().addToast({ id: nanoid(), text: `${author.name}${letters[Math.floor(Math.random() * letters.length)]}濂芥劅 +8銆俙, type: 'info', createdAt: get().playTicks })
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
        const res = await fetch('/api/book-review', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: `${title}锛堜綔鑰咃細${authorName}锛塦, genre, type: 'quote' }) })
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
      get().addToast({ id: nanoid(), text: `鍌鎴愬姛锛?{author.name}鐨勫喎鍗存椂闂村噺鍗娿€傚ソ鎰?-5銆俙, type: 'info', createdAt: get().playTicks })
    },
  
    hirePR: () => {
      const state = get()
      if (state.prActive) return // Already active
      if (state.currencies.royalties < 200) return
      set({
        currencies: { ...state.currencies, royalties: state.currencies.royalties - 200 },
        prActive: true,
      })
      get().addToast({ id: nanoid(), text: '鍏叧鍥㈤槦宸插氨浣嶏紒涓嬩竴鏈嚭鐗堢殑鏂颁功灏嗚嚜鍔ㄨ繘鍏ョ儹閿€绐楀彛锛?澶╋紝閿€閲?脳1.5锛夈€?, type: 'milestone', createdAt: get().playTicks }),

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
      get().addToast({ id: nanoid(), text: `鍌鎴愬姛锛?{author.name}鐨勫喎鍗存椂闂村噺鍗娿€傚ソ鎰?-5銆俙, type: 'info', createdAt: get().playTicks })
    },
  
    hirePR: () => {
      const state = get()
      if (state.prActive) return // Already active
      if (state.currencies.royalties < 200) return
      set({
        currencies: { ...state.currencies, royalties: state.currencies.royalties - 200 },
        prActive: true,
      })
      get().addToast({ id: nanoid(), text: '鍏叧鍥㈤槦宸插氨浣嶏紒涓嬩竴鏈嚭鐗堢殑鏂颁功灏嗚嚜鍔ㄨ繘鍏ョ儹閿€绐楀彛锛?澶╋紝閿€閲?脳1.5锛夈€?, type: 'milestone', createdAt: get().playTicks })
    },
  
    renovateReadingRoom: () => {
      const state = get()
      if (state.readingRoomRenovated) return // Already renovated
      if (state.currencies.royalties < 500) return
      set({
        currencies: { ...state.currencies, royalties: state.currencies.royalties - 500 },
        readingRoomRenovated: true,
      })
      get().addToast({ id: nanoid(), text: '闃呰瀹ょ剷鐒朵竴鏂帮紒浣滆€呭ソ鎰熻幏鍙栨案涔?+20%銆?, type: 'milestone', createdAt: get().playTicks })
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
      get().addToast({ id: nanoid(), text: `璧炲姪鏂囧濂栵紒銆?{book.title}銆嬭幏寰?+50 澹版湜銆俙, type: 'milestone', createdAt: get().playTicks })
    },,

})
