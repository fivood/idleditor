# [永夜出版社](https://idleditor.fivood.com) · Idle Editor

> 一个活了 217 年的吸血鬼编辑的日常。审稿、出版、养猫、熬死伯爵——挂机为辅，经营为主。

## 你做什么

你是一位夜班主编。每天日落到日出之间，桌上会出现一堆稿件，你只能做三件事：**审稿**、**退稿**、**搁置**。

- 通过的稿子进入流水线：审稿 → 编辑 → 校对 → 选封面 → 付印。
- 退掉的烂稿赚修订点和声望。退掉好书扣声望，签约作家可能被竞争对手挖走。
- 闲下来时可以雇佣部门、签约作家、开书店、办签售。

游戏里有很多冷幽默和未写明的设定，**故事藏在作者的语录、书的简介、随机事件、伯爵的剧情里**——读到就读到了，没读到也无所谓。

## 几个独特机制

- **梦境创作**：到达编辑等级 3 后解锁。白天睡觉时投入"灵感"（审稿/出版获取），意识沉入梦境写出自己的书，进"我的创作"分区。
- **纪元系统**：满足条件后可以铸造铜像、保留永久加成、重置进度。第 1/3/5/7 次纪元会触发伯爵剧情，第 10 次有专属结局。
- **凡间专栏**：完成第 1 次纪元后可开启，决定是否接受人类作家投稿（约 30% 概率收到 200+ 现实戏仿稿件——《四体》《祈尔摩斯》《修道院物管疑云》等）。
- **空间化导航**：游戏不是抽象 Tab，是一栋可走访的出版社。6 个房间各有像素艺术场景，点击场景里的物件（稿件堆 / 打字机 / 油灯 / 黑猫 / 茶杯）弹出对应面板。

## 渐进解锁

避免开局被复杂度淹没，许多内容按里程碑解锁：

- 题材：默认仅「少年血宫」和「跨种合著」；出版 3/7/12/18 本逐步解锁其余 4 个题材。
- 部门：编辑部默认；设计部 / 市场部 / 版权部 在 5 / 10 / 20 本出版后开放。
- 系统：书店、再版、梦境创作、凡间专栏、3 档自动化各有专属里程碑。

## 项目结构

```
.
├── public/
│   ├── covers/     # 书封 40×56 PNG（按书名命名 + manifest.json 索引）
│   ├── scenes/     # 房间背景 + 物件按钮 PNG（hover 变体配 -hover.png）
│   ├── icons/      # 旧版 emoji 风 SVG 图标（兼容保留）
│   ├── authors/    # AI 预生成的作者名池
│   ├── synopses/   # AI 预生成的简介池（v2.2.1 起仅 loading 不参与生成）
│   └── fonts/      # 像素字体（Fusion Pixel 12px 等）
│
├── src/
│   ├── assets/
│   │   ├── pixelIcons.tsx    # 25 个 16×16 像素 SVG 图标
│   │   ├── paperTextures.ts  # 做旧纸/羊皮/木纹 SVG data-URI
│   │   └── scenes/           # 6 个房间的 SVG 占位场景（PNG 渲染失败兜底）
│   │
│   ├── components/
│   │   ├── layout/   # Shell / TopBar / WelcomeView / 各种 Modal
│   │   ├── scene/    # 空间导航基础设施（Hotspot/ScenePanel/Minimap/CorridorDoor）+ rooms/
│   │   ├── desk/     # 投稿卡 / 封面选择 / 梦境创作 panel
│   │   ├── shelf/    # 书架视图（签约 / 我的 / 书店三分区）
│   │   ├── author/   # 作者名单与详情
│   │   ├── office/   # 部门 + 偏好 + 设置面板
│   │   ├── study/    # 内置阅读器（.txt/.md/.epub）
│   │   ├── stats/    # 数据图表
│   │   └── shared/   # PaperCard / PixelCover / PixelProgressBar / PixelTextButton / LogPanel
│   │
│   ├── core/         # 业务逻辑（不依赖 UI）
│   │   ├── types.ts           # 核心类型
│   │   ├── constants.ts       # 数值平衡常数
│   │   ├── calendar.ts        # 游戏历法（1 月 = 60 游戏日 = 60 现实分钟）
│   │   ├── formulas.ts        # 收益/成本/品质公式
│   │   ├── progression.ts     # 渐进解锁系统（题材 + 部门 + 主要系统）
│   │   ├── tick/              # 7 个 tick phase（calendar/spawn/pipeline/...）
│   │   ├── factories/         # createManuscript / createAuthor
│   │   ├── data/              # 17 种作者人格（按种族）+ 姓名池 + 签名语录
│   │   ├── humor/             # 简介池（固定模板）+ 退稿理由 + toast 池
│   │   ├── dream/             # 梦境创作（灵感系统 + 项目工厂）
│   │   └── lore/              # 世界设定圣经（仅作内容生成锚点，不直接驱动逻辑）
│   │
│   ├── engine/       # 纯函数游戏引擎
│   │   ├── index.ts           # runTick(world, { rng }) 入口
│   │   └── tick/              # 9 个 phase（含 dream + unlock 新加）
│   │
│   ├── store/        # Zustand + Immer 主 store
│   ├── db/           # Dexie.js (IndexedDB) 存档
│   ├── hooks/        # useGameLoop / useAutoSave / useOfflineProgress / useRoomNav
│   └── utils/        # nanoid / random / format
│
├── functions/api/    # Cloudflare Pages Functions（云存档 + AI 接口 + 速率限制）
├── scripts/          # 一次性内容生成脚本（手工跑）
└── CLAUDE.md · AGENTS.md   # AI 助手协作说明
```

## 技术栈

React 19 + TypeScript + Vite + Tailwind v4 · Zustand (Slice Pattern + Immer) · Dexie.js · Cloudflare Pages + Functions + KV · 全部场景与图标 inline SVG / pixel PNG

## 本地开发

```bash
npm install && npm run dev
```

## 环境变量（Cloudflare Pages）

- `LLM_API_KEY` · `LLM_BASE_URL` · `LLM_MODEL` — AI 决策/吐槽生成
- `SAVE_KV` binding — 云存档 + 速率限制

## 许可

MIT
