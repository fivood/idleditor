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
    },,

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
        text: '涓€鍙粦鐚粠绐楀彴璺充簡杩涙潵銆傚畠鍦ㄤ綘妗屼笂杞簡涓€鍦堬紝闂讳簡闂诲挅鍟℃澂锛岀劧鍚庤湻鍦ㄧ浠跺爢涓婂彂鍑轰簡鍜曞櫆澹般€傚畠杩樻病鏈夊悕瀛椻€斺€旂偣鍑荤尗鏉ヤ负瀹冨彇鍚嶃€?,
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
        text: `"${trimmed}"鈥斺€旂尗鎶捣澶达紝浼间箮瀵硅繖涓悕瀛楃暐鏈変笉婊★紝浣嗘渶鍚庤繕鏄墦浜嗕釜鍝堟瑺榛樿浜嗐€俙,
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
        `${cat.name}鍙戝嚭鍜曞櫆澹帮紝鐢ㄥご韫簡韫綘鐨勬墜銆俙,
        `${cat.name}缈讳簡涓韩锛屾妸鑲氬瓙鏆撮湶鍦ㄧ伅鍏変笅銆傝繖鏄渶楂樼骇鍒殑淇′换銆俙,
        `${cat.name}鎳掓磱娲嬪湴鐢╀簡鐢╁熬宸达紝鍦ㄥ崐绌轰腑鐢讳簡涓姬鈥斺€斿ぇ姒傛槸婊℃剰銆俙,
        `${cat.name}鎵撲簡涓搱娆狅紝鐒跺悗鑻ユ棤鍏朵簨鍦拌蛋寮€浜嗐€傝鎽稿浜嗐€俙,
      ]
      get().addToast({ id: nanoid(), text: reactions[Math.floor(Math.random() * reactions.length)] + ' 濂芥劅 +3銆?, type: 'info', createdAt: get().playTicks })
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
        text: `"${trimmed}"鈥斺€旂尗鎶捣澶达紝浼间箮瀵硅繖涓悕瀛楃暐鏈変笉婊★紝浣嗘渶鍚庤繕鏄墦浜嗕釜鍝堟瑺榛樿浜嗐€俙,
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
        `${cat.name}鍙戝嚭鍜曞櫆澹帮紝鐢ㄥご韫簡韫綘鐨勬墜銆俙,
        `${cat.name}缈讳簡涓韩锛屾妸鑲氬瓙鏆撮湶鍦ㄧ伅鍏変笅銆傝繖鏄渶楂樼骇鍒殑淇′换銆俙,
        `${cat.name}鎳掓磱娲嬪湴鐢╀簡鐢╁熬宸达紝鍦ㄥ崐绌轰腑鐢讳簡涓姬鈥斺€斿ぇ姒傛槸婊℃剰銆俙,
        `${cat.name}鎵撲簡涓搱娆狅紝鐒跺悗鑻ユ棤鍏朵簨鍦拌蛋寮€浜嗐€傝鎽稿浜嗐€俙,
      ]
      get().addToast({ id: nanoid(), text: reactions[Math.floor(Math.random() * reactions.length)] + ' 濂芥劅 +3銆?, type: 'info', createdAt: get().playTicks })
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
        text: `浣犲湪婊℃湀涔嬪灏嗕竴搴ч摐鍍忔蹈鍏ユ硥姘淬€?{cat.name}鑸斾簡鑸旈偅姘粹€斺€旂劧鍚庡畠鐨勭溂鐫涢噷鏄犲嚭浜嗘案鎭掋€備粠姝や互鍚庯紝瀹冨皢涓庝綘鍏变韩鏃犲敖鐨勫鏅氥€俙,
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
        `${cat.name}鍙戝嚭鍜曞櫆澹帮紝鐢ㄥご韫簡韫綘鐨勬墜銆俙,
        `${cat.name}缈讳簡涓韩锛屾妸鑲氬瓙鏆撮湶鍦ㄧ伅鍏変笅銆傝繖鏄渶楂樼骇鍒殑淇′换銆俙,
        `${cat.name}鎳掓磱娲嬪湴鐢╀簡鐢╁熬宸达紝鍦ㄥ崐绌轰腑鐢讳簡涓姬鈥斺€斿ぇ姒傛槸婊℃剰銆俙,
        `${cat.name}鎵撲簡涓搱娆狅紝鐒跺悗鑻ユ棤鍏朵簨鍦拌蛋寮€浜嗐€傝鎽稿浜嗐€俙,
      ]
      get().addToast({ id: nanoid(), text: reactions[Math.floor(Math.random() * reactions.length)] + ' 濂芥劅 +3銆?, type: 'info', createdAt: get().playTicks })
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
        text: `浣犲湪婊℃湀涔嬪灏嗕竴搴ч摐鍍忔蹈鍏ユ硥姘淬€?{cat.name}鑸斾簡鑸旈偅姘粹€斺€旂劧鍚庡畠鐨勭溂鐫涢噷鏄犲嚭浜嗘案鎭掋€備粠姝や互鍚庯紝瀹冨皢涓庝綘鍏变韩鏃犲敖鐨勫鏅氥€俙,
        type: 'milestone',
        createdAt: get().playTicks,
      })
    },
  
    shooCat: () => {
      const state = get()
      set({ catRejectedUntilYear: state.calendar.year })
      get().addToast({
        id: nanoid(),
        text: '浣犳妸绐楀叧涓婁簡銆傜尗鍙戝嚭涓€澹颁笉婊＄殑"鍠?锛岃烦鍥炰簡澶滆壊涓€傚湪浣犳妸绐楅攣淇ソ涔嬪墠鈥斺€旇嚦灏戝埌鏄庡勾鈥斺€斾笉浼氭湁涓滆タ鎵撴壈浣犱簡銆?,
        type: 'info',
        createdAt: get().playTicks,
      })
    },
  
    generateEditorNote: async (id: string) => {
      const state = get()
      const ms = state.manuscripts.get(id)
      if (!ms) return
      if (state.llmCallsRemaining <= 0) {
        get().addToast({ id: nanoid(), text: '浣犱粈涔堥兘鎯充笉鍑烘潵锛屼互鍚庡啀璇村惂銆?, type: 'humor', createdAt: get().playTicks })
        return
      }
      try {
        const res = await fetch('/api/llm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: `浣犳槸涓€瀹跺惛琛€楝煎嚭鐗堢ぞ鐨勭紪杈戙€傝涓哄凡鍑虹増涔︾睄銆?{ms.title}銆嬪啓涓€鍙ョ畝鐭殑缂栬緫鎵硅锛?0瀛椾互鍐咃級銆傞鏍硷細鍐峰菇榛樸€佽皟渚冦€佸惛琛€楝艰瑙掑悙妲姐€備笉瑕佸墽閫忋€俙 }),
        })
        const data = await res.json()
        if (data.text) {
          const s = get()
          const m = s.manuscripts.get(id)
          if (m) {
            m.editorNote = data.text.replace(/鈥斺€?g, '--').replace(/鈥?g, '-')
            set({ manuscripts: new Map(s.manuscripts), llmCallsRemaining: s.llmCallsRemaining - 1 })
            const adverbs = ['蹇冭鏉ユ疆', '鎬濆墠鎯冲悗', '闂插緱娌′簨']
            get().addToast({
              id: nanoid(),
              text: `${s.playerName}${adverbs[Math.floor(Math.random() * adverbs.length)]}锛岀粰銆?{ms.title}銆嬮噸鍐欎簡涓€鏉¤瘎璁猴細${m.editorNote}`,
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
          text: `鍚戝嚭鐗堜笟鐣屽彂甯冧簡鍖垮悕寰佺鍑姐€?{count}浠界浠跺簲澹拌€岃嚦锛?{spawned.join('銆?)}`,
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
          text: `鍚?{draft.preferredGenres.length > 0 ? draft.preferredGenres.map(g => ({'sci-fi':'绉戝够','mystery':'鎺ㄧ悊','suspense':'鎮枒','social-science':'绀剧','hybrid':'娣疯','light-novel':'杞诲皬璇?}[g] ?? g)).join('銆?) + '棰嗗煙' : '鍚勯鍩?}瀹氬悜绾︾銆?{count}浠介珮璐ㄩ噺绋夸欢宸插埌锛?{spawned.join('銆?)}`,
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
          text: `鍔ㄧ敤瀹ｄ紶棰勭畻绱ф€ュ緛绋裤€?{count}浠界浠剁伀閫熸姷杈撅細${spawned.join('銆?)}`,
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
      get().addToast({ id: nanoid(), text: `澶╄祴瑙ｉ攣锛?{talent.label}锛?{talent.desc.slice(0, 20)}...`, type: 'milestone', createdAt: get().playTicks })
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
  
    // 鈹€鈹€鈹€鈹€ Manuscript actions 鈹€鈹€鈹€鈹€
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
        const authorNote = author?.tier !== 'new' && author ? ` 路 ${author.name}濂芥劅 -10` : ''
        const quips = [
          `"${ms.title}" 琚灉鏂€€鍥炪€傜紪杈戠殑鐪煎厜鍙堟晳浜嗕竴娆″嚭鐗堢ぞ銆?${rpReward} 淇鐐?+${prestigeReward} 澹拌獕${authorNote}`,
          `閫€绋匡細"${ms.title}"銆傝鑰呬笉闇€瑕佽繖鏈功銆傝瀹炶瘽锛屼綔鑰呭彲鑳戒篃涓嶅お闇€瑕併€?${rpReward} RP`,
          `鍙堜竴鏈瀛愯繘浜嗛€€绋跨銆?${ms.title}"鐨勫皝闈㈣璁″叾瀹炰笉閿欌€斺€斿彲鎯滃唴瀹规病璺熶笂銆?${rpReward} RP +${prestigeReward} 澹版湜`,
          `${ms.title}鈥斺€旈€€銆傜悊鐢卞緢鍏呭垎锛氬啓寰椾笉濂姐€傚叿浣撳摢閲屼笉濂斤紵鍏ㄩ儴銆?${rpReward} RP`,
          `閫€绋裤€?{ms.title}銆嬨€傚瀹屽悗浣犳矇榛樹簡涓夌锛岀劧鍚庢嬁璧蜂簡涓嬩竴鏈€傛案鐢熻€呯殑鑰愬績涔熶笉鏄棤闄愮殑銆?${rpReward} RP`,
          `"${ms.title}"琚€€鍥炰綔鑰呮墜涓€傚笇鏈泃a涓嬫湰鍐欏緱鏇村ソ銆傛垨鑰呰嚦灏戞洿鐭€?${rpReward} RP`,
        ]
        state2.addToast({
          id: nanoid(),
          text: quips[Math.floor(Math.random() * quips.length)],
          type: 'info',
          createdAt: get().playTicks,
        })
        // LLM rejection commentary
        state2.llmCommentary(ms.title, ms.genre, '琚€€绋?)
      } else {
        const authorNote = author?.tier !== 'new' && author ? ` 路 ${author.name}濂芥劅 -10` : ''
        const quips = [
          `"${ms.title}" 宸茶閫€鍥炪€備綔鑰呴潰闇蹭笉鎮︹€斺€旇繖鏈功鏈潵杩樹笉閿欍€傚０鏈?-5${authorNote}`,
          `閫€绋匡細"${ms.title}"銆傝瀹炶瘽锛屽啓寰楄繕琛屸€斺€斾絾杩樿涓嶅銆傚湪姘稿鍑虹増绀撅紝"杩樿"鍜?涓嶅"涔嬮棿鍙樊涓€灏侀€€绋夸俊銆傚０鏈?-5`,
          `浣犻€€鍥炰簡銆?{ms.title}銆嬨€備綔鑰呭ぇ姒備細鐢熶竴闃垫皵鈥斺€斾絾涓€涓椿浜嗕袱鐧惧勾鐨勪汉瀵?涓€闃?鐨勫畾涔夊拰鍒汉涓嶅お涓€鏍枫€傚０鏈?-5`,
          `閫€绋垮喅瀹氾細${ms.title}銆備笉鏄洜涓哄啓寰楀樊锛屾槸鍥犱负鍙互鍐欏緱鏇村ソ銆傝嚦灏戠紪杈戞槸杩欎箞鍛婅瘔鑷繁鐨勩€傚０鏈?-5`,
          `浣犲悎涓娿€?{ms.title}銆嬶紝鍦ㄩ€€绋跨悊鐢辨爮鍐欎簡涓€涓瓧锛?涓?銆傚疄涔犵敓璇存槸涓嶆槸澶畝鐭簡銆備綘璇磋繖涓瓧鑺变簡浣犱袱鐧惧勾鎵嶅浼氥€傚０鏈?-5`,
          `"${ms.title}"閫€鍥炪€備綔鑰呭彲鑳戒細鍐欎竴绡囨劋鎬掔殑鍗氬锛屼篃鍙兘浠庢鍙戞劋鍥惧己銆備綘璧屽悗鑰呪€斺€斿洜涓轰綘鐨勬姇璧勫洖鎶ョ巼涓€鐩翠笉閿欍€傚０鏈?-5`,
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
        text: `"${ms.title}" 宸叉悂缃€備綔鑰呭彲鑳戒細淇敼鍚庨噸鏂版姇绋裤€俙,
        type: 'info',
        createdAt: get().playTicks,
      })
    },
  
    meticulousEdit: (id: string, level: 'light' | 'deep' | 'extreme') => {
      const state = get()
      const ms = state.manuscripts.get(id)
      if (!ms || ms.status !== 'editing' || ms.meticulouslyEdited) return
  
      const costs: Record<string, { rp: number; quality: number; label: string }> = {
        light: { rp: 10, quality: 3, label: '杞诲害绮炬牎' },
        deep: { rp: 30, quality: 8, label: '娣卞害绮炬牎' },
        extreme: { rp: 60, quality: 15, label: '鏋侀檺绮炬牎' },
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
        text: `馃攳 ${option.label}锛氥€?{ms.title}銆嬪搧璐?+${option.quality}锛堣姳璐?${option.rp} RP锛塦,
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
          text: '鏈湀鍑虹増棰濆害宸茬敤瀹岋紒涓嬩釜鏈堝啀鏉ュ惂銆?,
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
  
    // 鈹€鈹€鈹€鈹€ Author actions 鈹€鈹€鈹€鈹€
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
        const res = await fetch('/api/book-review', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: `${title}锛堜綔鑰咃細${authorName}锛塦, genre, type: 'quote' }) }),

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
        text: `浣犲湪婊℃湀涔嬪灏嗕竴搴ч摐鍍忔蹈鍏ユ硥姘淬€?{cat.name}鑸斾簡鑸旈偅姘粹€斺€旂劧鍚庡畠鐨勭溂鐫涢噷鏄犲嚭浜嗘案鎭掋€備粠姝や互鍚庯紝瀹冨皢涓庝綘鍏变韩鏃犲敖鐨勫鏅氥€俙,
        type: 'milestone',
        createdAt: get().playTicks,
      })
    },
  
    shooCat: () => {
      const state = get()
      set({ catRejectedUntilYear: state.calendar.year })
      get().addToast({
        id: nanoid(),
        text: '浣犳妸绐楀叧涓婁簡銆傜尗鍙戝嚭涓€澹颁笉婊＄殑"鍠?锛岃烦鍥炰簡澶滆壊涓€傚湪浣犳妸绐楅攣淇ソ涔嬪墠鈥斺€旇嚦灏戝埌鏄庡勾鈥斺€斾笉浼氭湁涓滆タ鎵撴壈浣犱簡銆?,
        type: 'info',
        createdAt: get().playTicks,
      })
    },
  
    generateEditorNote: async (id: string) => {
      const state = get()
      const ms = state.manuscripts.get(id)
      if (!ms) return
      if (state.llmCallsRemaining <= 0) {
        get().addToast({ id: nanoid(), text: '浣犱粈涔堥兘鎯充笉鍑烘潵锛屼互鍚庡啀璇村惂銆?, type: 'humor', createdAt: get().playTicks })
        return
      }
      try {
        const res = await fetch('/api/llm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: `浣犳槸涓€瀹跺惛琛€楝煎嚭鐗堢ぞ鐨勭紪杈戙€傝涓哄凡鍑虹増涔︾睄銆?{ms.title}銆嬪啓涓€鍙ョ畝鐭殑缂栬緫鎵硅锛?0瀛椾互鍐咃級銆傞鏍硷細鍐峰菇榛樸€佽皟渚冦€佸惛琛€楝艰瑙掑悙妲姐€備笉瑕佸墽閫忋€俙 }),
        })
        const data = await res.json()
        if (data.text) {,

  shooCat: () => {
      const state = get()
      set({ catRejectedUntilYear: state.calendar.year })
      get().addToast({
        id: nanoid(),
        text: '浣犳妸绐楀叧涓婁簡銆傜尗鍙戝嚭涓€澹颁笉婊＄殑"鍠?锛岃烦鍥炰簡澶滆壊涓€傚湪浣犳妸绐楅攣淇ソ涔嬪墠鈥斺€旇嚦灏戝埌鏄庡勾鈥斺€斾笉浼氭湁涓滆タ鎵撴壈浣犱簡銆?,
        type: 'info',
        createdAt: get().playTicks,
      })
    },
  
    generateEditorNote: async (id: string) => {
      const state = get()
      const ms = state.manuscripts.get(id)
      if (!ms) return
      if (state.llmCallsRemaining <= 0) {
        get().addToast({ id: nanoid(), text: '浣犱粈涔堥兘鎯充笉鍑烘潵锛屼互鍚庡啀璇村惂銆?, type: 'humor', createdAt: get().playTicks })
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
      const label = gender === 'female' ? '濂充集鐖? : '浼埖'
      get().addToast({ id: nanoid(), text: `浼埖妗ｆ宸叉洿鏂般€傛鍚庣О鍛间负锛?{label}銆俙, type: 'milestone', createdAt: get().playTicks })
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
        text: '涓€鍙粦鐚粠绐楀彴璺充簡杩涙潵銆傚畠鍦ㄤ綘妗屼笂杞簡涓€鍦堬紝闂讳簡闂诲挅鍟℃澂锛岀劧鍚庤湻鍦ㄧ浠跺爢涓婂彂鍑轰簡鍜曞櫆澹般€傚畠杩樻病鏈夊悕瀛椻€斺€旂偣鍑荤尗鏉ヤ负瀹冨彇鍚嶃€?,
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
      get().addToast({ id: nanoid(), text: `澶╄祴瑙ｉ攣锛?{talent.label}锛?{talent.desc.slice(0, 20)}...`, type: 'milestone', createdAt: get().playTicks })
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
