import type { GameStore } from '@/store/gameStore'

export interface ChainEffect {
  rp?: number
  prestige?: number
  royalties?: number
  qualityBonus?: number
  authorAffection?: number
  authorTerminate?: boolean
  addAuthor?: { persona?: string; genre?: string }
  toastText?: string
}

export interface ChainOption {
  label: string
  description: string
  effects?: ChainEffect
  advance?: boolean  // advance to next step (default: true)
}

export interface ChainStep {
  title: string
  description: string
  options: ChainOption[]
}

export interface EventChain {
  id: string
  condition: (state: GameStore) => boolean
  steps: ChainStep[]
}

export const EVENT_CHAINS: EventChain[] = [
  // ── Chain 1: 神秘手稿 ──
  {
    id: 'mystery-manuscript',
    condition: (s) => s.totalPublished >= 10 && [...s.authors.values()].filter(a => a.tier !== 'new').length >= 3,
    steps: [
      {
        title: '神秘手稿（第1步/3）',
        description: '你收到一份匿名手稿。没有署名、没有回信地址——只有一张纸条："请审阅。"你翻开第一页。品质惊人。这不是新人能写出来的东西。',
        options: [
          {
            label: '调查作者身份（消耗30 RP）',
            description: '让前情报官员帮你查一下笔迹和行文风格。'
          },
          {
            label: '直接出版，不管是谁写的',
            description: '好稿子不该问来处。若被发现是别家的作者，后续可能引起风波——但那是以后的事。'
          }
        ]
      },
      {
        title: '神秘手稿（第2步/3）',
        description: '情报回来了。笔迹比对显示——作者是晨曦出版社的传奇作家。他显然厌倦了原出版社的合同条款。现在怎么办？',
        options: [
          {
            label: '保密，让他成为影子作者',
            description: '不公开真名。他继续在晨曦出书，私下给我们投稿。高风险，但报酬是独一无二的。',
            effects: { prestige: 20, toastText: '你通过秘密渠道向那位作者寄了一封手写信。"永夜欢迎你。用笔名。"信寄出后，你收到了回音——只有一个字："好。"' }
          },
          {
            label: '公开身份——让整个行业震动',
            description: '曝光这件事。晨曦的声誉受损，永夜获得巨大的声望。但那位作者会被晨曦解约。',
            effects: { prestige: 80, toastText: '第二天的《永夜文学报》头版炸了。"晨曦传奇作者秘密投稿永夜！"编辑部电话被打爆。你靠在椅背上，看着窗外的满月，嘴角微微一颤（吸血鬼的笑容）。' }
          }
        ]
      },
      {
        title: '神秘手稿（第3步/3）',
        description: '那位作者找到了你。他没有生气——反而很感激。"我已经在晨曦待了十七年。他们连茶都是速溶的。"他递过来一叠稿子。"这些——以后都交给你。"',
        options: [
          {
            label: '正式签约，永夜出品',
            description: '给他一份新合同。以后就在永夜出书了。晨曦那边——让他们自己消化吧。',
            effects: { prestige: 30, royalties: 500, toastText: '你拿出一份永夜的标准合同。他看都没看就签了。"关于茶——"他说。"我们这里有纯红茶。"你回答。"不是你以为的那种红——但比速溶好。"' }
          },
          {
            label: '给他完全匿名的高额版税分成',
            description: '不签长约，只谈分成。他的身份永远不会曝光。',
            effects: { royalties: 2000, toastText: '"不用签合同。每本书你拿走四成版税，现金直接放进你楼下的信箱。没有纸面文件。没有人知道。"他沉默了很久，然后点了点头。' }
          }
        ]
      },
    ]
  },

  // ── Chain 2: 匿名举报 ──
  {
    id: 'anonymous-tip',
    condition: (s) => s.totalPublished >= 5 && s.currencies.prestige >= 100,
    steps: [
      {
        title: '匿名举报',
        description: '一封匿名信塞在门缝下方。信中声称——新纪元出版社正在系统性抄袭永夜的封面设计。"一模一样，只是改了社名。"信中附了三张对比照片。',
        options: [
          {
            label: '提交给行业工会（消耗 50 声望）',
            description: '发起正式投诉。如果赢了，新纪元会被罚款并公开道歉。但万一证据不足……'
          },
          {
            label: '直接联系新纪元的主编私了',
            description: '对方也是圈内人。一杯茶的功夫，可能有更和平的解决方式。',
            effects: { prestige: -10, royalties: 200, toastText: '你约了对方主编喝了一杯红茶。三小时后，对方同意支付"封面灵感费"并在下一次书展上公开称赞永夜的设计——作为"友好表示"。你笑着接受了。' }
          }
        ]
      },
      {
        title: '匿名举报（结果）',
        description: '行业工会的调查结果出来了——证据确凿。新纪元在三年内抄袭了十二个封面设计。罚金是象征性的，但声誉损失足够让他们收敛。',
        options: [
          {
            label: '接受裁决，得声望',
            description: '这次你赢得很干净。行业里每个人都会记住。',
            effects: { prestige: 50, toastText: '裁决书到了。新纪元被罚三千版税并强制公开道歉。永夜的市场部把这封裁决书裱起来挂在了走廊里。实习生们每次路过都要看一遍。' }
          },
          {
            label: '放弃索赔，换取新纪元的优先发行权',
            description: '这次放过他们。下次他们有什么新作者签约——你得先知道。',
            effects: { prestige: 10, royalties: 0, toastText: '"不用罚款。"你对新纪元的主编说。"下次你签新作者的时候，让我们先看一眼。"他犹豫了。然后点了点头。你举起红茶杯，没有镜子——所以你不知道自己到底笑了没有。' }
          }
        ]
      },
    ]
  },

  // ── Chain 3: 文学遗产 ──
  {
    id: 'literary-legacy',
    condition: (s) => [...s.manuscripts.values()].filter(m => m.status === 'published' && m.isBestseller).length >= 3,
    steps: [
      {
        title: '文学遗产',
        description: '律师联络了你。一位去世的收藏家——曾是永夜早期最忠实的顾客——把他的私人图书馆捐赠给了出版社。藏书共三百本，其中有一些绝版了几十年的珍本。',
        options: [
          {
            label: '开放展览，向公众收费（获得版税）',
            description: '把珍本放在玻璃箱里，卖门票。文学爱好者们会愿意为看一眼付出代价的。',
            effects: { royalties: 800, toastText: '你在出版社会客厅设了一个小型展区。第一周就来了两百人。一位老人在《白鲸极简版》的原稿前站了整整四十分钟——最后说："写得比现在好。"' }
          },
          {
            label: '整理出版珍本合集（消耗 RP，获得声望）',
            description: '这些书值得被更多人看到。尤其是绝版的那几本。',
            effects: { rp: -50, prestige: 40, toastText: '你亲自审读了那些绝版的手稿。其中有几本——说实话——品质一般。但历史价值摆在那里。你写了长篇序言，用红笔，用你那支1848年的羽毛笔。' }
          }
        ]
      },
      {
        title: '文学遗产（后续）',
        description: '珍本展览的消息传开了。一位自称是收藏家侄女的女人找上门来，声称叔父在遗嘱里写错了——这些书应该归家族所有。',
        options: [
          {
            label: '法律上据理力争（消耗版税请律师）',
            description: '永夜的律师团队可不是吃素的。虽然他们只在白天出没，但文件准备得滴水不漏。',
            effects: { royalties: -300, prestige: 30, toastText: '庭审只持续了二十分钟。永夜的法务拿出了捐赠合同原件——上面还有收藏家的亲笔签名和一个蝙蝠形状的印戳。"这章是怎么回事？"法官问。"出版社的标志。"你回答。法官决定不追问。' }
          },
          {
            label: '给她一些补偿，友好解决',
            description: '金钱和平比法院判决更优雅。毕竟她失去了一位亲人，几本书也算不了什么。',
            effects: { royalties: -150, prestige: 15, toastText: '你给了她五百版税的补偿和三本珍本作为纪念。她走的时候哭了——不是因为钱，而是因为你在扉页上写了一行字："你的叔父是一位伟大的读者。永夜会记住他。"' }
          }
        ]
      },
    ]
  },
]
