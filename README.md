# 永夜出版社 · Idle Editor

> 一个不死编辑的日常。你是一位在永夜出版社工作了 217 年的吸血鬼编辑——审稿、出版、赚声望、熬死老板。

## 在线游玩
**[idleditor.fivood.com](https://idleditor.fivood.com)**

## 玩法概述

| 系统 | 说明 |
|------|------|
| 📥 投稿审稿 | 稿件自动涌入，玩家根据简介判断是否退稿（退掉好书扣声望） |
| ⚙️ 编辑流水线 | 审稿 → 编辑 → 校对 → 选封面 → 出版，部门升级加速流程 |
| 📚 书籍出版 | 148 种戏仿标题，出版后进入书架（书脊视图 + 详情弹窗） |
| ✍️ 作者系统 | 9 种人格（含 4 种外国作者），签约 → 知名 → 传奇三段晋升 |
| 🏢 部门管理 | 编辑/设计/市场/版权 4 部门，可雇佣和升级 |
| 💎 自动化特权 | 编辑部 Lv.3 自动审稿、声望 100 自动出版、声望 200 自动退稿 |
| 🎯 偏爱领域 | 声望解锁话语权槽位，选择偏好类型获得品质+销量加成 |
| 🔍 精校 | 编辑阶段可花 RP 提升稿件品质（轻校/深校/极校） |
| 💖 作者好感 | 隐藏数值，好感高了触发感谢信事件，满值成为忠实作者 |
| 📋 随机决策 | 每 ~10 分钟弹出二选一事件（LLM 生成 + 12 模板后备） |
| 🌍 日期事件 | 12 个月各有主题节日，对应类型书籍销量翻倍 |
| 🗞️ 随机新闻 | 25 种随机事件——被退稿作者的近况、书市花絮、出版社八卦 |
| 🦇 终极目标 | 转生积累铜像，消耗伯爵年数，年数归零成为出版社新主人 |

## 技术栈

- **前端**: React 19 + TypeScript + Vite + Tailwind v4
- **状态**: Zustand（单 store 多切片）
- **持久化**: Dexie.js (IndexedDB) + Cloudflare KV（云存档）
- **AI**: OpenAI/DeepSeek API → Cloudflare Functions → GPT 简介生成 + 决策事件生成
- **部署**: Cloudflare Pages + Functions + KV
- **PWA**: 支持离线游玩，Service Worker 自动更新

## 项目结构

```
src/
├── core/          # 游戏逻辑（loop, calendar, formulas, constants）
│   ├── humor/     # 简介/退稿理由/标题模板生成（148 标题 × 22 模板 × 30 槽位）
│   └── titlePools.ts  # 标题池（含 60+ 现实文学戏仿）
├── store/         # Zustand 状态管理
├── components/
│   ├── desk/      # 桌面（投稿池 + 编辑流水线）
│   ├── shelf/     # 书架（书脊视图）
│   ├── author/    # 作者列表
│   ├── office/    # 办公室（部门 + 话语权 + 特权 + 开发日志）
│   ├── layout/    # Shell/TopBar/WelcomeView/决策弹窗/离线报告
│   └── shared/    # LogPanel/Toast
├── db/            # IndexedDB 持久化
├── hooks/         # useGameLoop / useAutoSave / useOfflineProgress
└── utils/         # 工具函数
public/covers/     # 148 本封面（SVG + PNG）+ 提示词清单
functions/api/     # Cloudflare Functions（llm, decision, save, load）
scripts/           # 封面生成/提示词脚本
```

## 本地开发

```bash
npm install
npm run dev          # Vite + Express 后端并发启动
```

## 环境变量（服务端）

在 Cloudflare Pages Settings → Environment Variables 中设置：

| Variable | 说明 |
|----------|------|
| `LLM_API_KEY` | DeepSeek 或 OpenAI API Key |
| `LLM_BASE_URL` | API 地址（默认 `https://api.deepseek.com`） |
| `LLM_MODEL` | 模型名（默认 `deepseek-chat`） |

LLM 用于三个系统：投稿简介按钮、决策事件实时生成、书架 AI 评语。

## 封面生成脚本

```bash
# 生成 148 本 SVG 抽象封面
node scripts/gen-svg-covers.mjs

# 使用 LLM 生成英文图片提示词（需 .env 中填 Key）
node scripts/gen-covers-gemini.mjs
```

支持 Gemini / DeepSeek / Kimi，`.env` 中填哪个用哪个。

## 游戏特色

- **新拟物像素美学**：暖奶油色 + 铜色调色板、厚边框、3D 像素阴影
- **148 本戏仿标题**："四体"、"养活一只知更鸟"、"勉强还行新世界"、"绿楼梦"等
- **吸血鬼主题**：12 个月份名称、伯爵终极 BOSS、永生茶话会团建
- **英式冷幽默中文文本**：所有系统文案都在吐槽出版行业的荒谬
- **桌面端优先**，移动端可玩
