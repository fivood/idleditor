# 开发日志 (Devlog)

## [v2.0.1 引擎解耦与决策按钮修复] - 2026-05-17

### 引擎架构重构 (Engine Extraction)
- **引擎独立为纯函数层**：游戏模拟从 `src/core/tick/*` 提取至 `src/engine/tick/*`。每个 phase 接收克隆后的 world，返回 `{world, result}`，不再直接依赖 Zustand/Immer/浏览器环境。
- **runTick 管道**：`src/engine/index.ts` 提供 `runTick(world, { rng })` 入口，clone 输入 → 顺序执行 7 个 phase → 返回新 world。Phase 注册从 `gameLoop.ts` 移至 `TICK_PHASES` 数组。
- **可播种 RNG**：支持 `options.rng` 种子随机数，引擎 phase 内部通过 `Math.random` monkey-patch 获取确定性。
- **Phase 模板**：`src/engine/tick/_template.ts` 供新机制参考——拷贝文件、实现逻辑、在 `index.ts` 注册即可。
- **工厂纯化**：新增 `createManuscriptWithWorld()` / `createManuscriptForAuthorWithWorld()` 纯函数包装，引擎 phase 不再直接调用会修改输入 world 的旧工厂。

### Store 集成
- **extractWorldFromState**：引擎执行前从 Zustand state 剥离纯世界数据，避免 `structuredClone` 复制 action 函数导致异常。
- **applyWorldToDraft**：引擎执行后将新 world 显式写回 Immer draft（Map 逐条 set + 属性赋值），开发模式断言 Map 数量一致性防数据丢失。
- **错误边界**：`runTick()` 的 phase 循环带 `try/catch`，异常时抛带 phase 名称的 Error；Store `tick()` 外层 catch 并通过 toast 提示用户状态已回滚。

### Bug 修复
- **决策按钮无响应**：修复 `personal-favor`、`genre-change`、`deadline-conflict` 等决策 effect 直接修改 Immer 冻结对象的问题。现在先 clone Author/Manuscript 再写回 Map，解决了点击按钮后静默抛异常导致 UI 无反馈的 Bug。

### 文档
- 更新 `AGENTS.md` 引擎架构说明，新增 phase 注册指引和 `applyWorldToDraft` 风险提示。
- 新增 `CLAUDE.md`（Claude Code 用户的上下文文件，fivood 的 AI 工具读取此文件）。

## [v1.7 投稿池优化] - 2026-05-15

### 投稿池机制优化 (Submission Pool Optimization)
- **动态市场风向**：每 2 游戏年自动轮转一次"市场热潮"题材（TopBar 实时展示📈标签）。风向题材的自然投稿概率大幅提升，已出版的相关书籍销量 ×1.3。
- **偏好引导生成**：玩家在办公室设置的"偏爱领域"现在直接影响自然投稿池的类型分布——偏好题材的投稿概率显著提高，不再只是销量和品质的被动加成。
- **题材黑名单**：办公室新增"投稿黑名单"面板。将不想要的题材加入黑名单后，配合"自动退稿"特权，这些题材的稿件会被立刻退回（并显示专属退稿文案）。
- **传奇作者特权**：`idol` 段位的作者稿件无视 7 份投稿上限强制进入投稿池，且不会被闲置超时清理机制自动删除——大神的新书绝不会被错过。
- **存档兼容**：`currentTrend`、`trendTimer`、`blacklistedGenres` 已加入 IndexedDB 本地存档和云存档的 save/load 流程，旧存档自动兼容默认值。

## [Phase 1 完成版] - 2026-05-15

### 引擎重构与代码治理 (Engine Refactor)
- **游戏循环切片化 (Phase 1.2)**：将冗长的近千行 `gameLoop.ts` 完美重构为不到 200 行的干净调度器。原有的生命周期按业务完全拆分至 `src/core/tick/` 目录下（包括日历、生成稿件、工业流水线、经济计算、作者逻辑、自动化和随机事件等 7 个独立 Phase）。
- **决策系统升级 (Phase 1.3)**：废弃了原本脆弱的标题字符串匹配，重构为基于 `effectId` 分发的安全架构 (`decisionEffects.ts`)。
- **Store 模块化 (Phase 1.4)**：修复了严重的代码截断 Bug，找回并成功剥离了 600+ 行庞杂的 `gameStore.ts` 状态逻辑，将其通过 Zustand 的 Slice Pattern 拆分至 `src/store/actions/` 目录下的 4 个独立状态管理器中（`manuscriptActions`, `authorActions`, `departmentActions`, `miscActions`）。
- **数据解耦 (Phase 1.1)**：将作者名言、设定集、文本池彻底脱离核心代码，沉淀至 `src/core/data/` 目录。

### 新增核心玩法与系统 (Phase 2 & 3)
- **书店经营系统**：解锁并经营实体书店（货架管理、作者签售、多级别店铺扩张），进一步拉升后期版税。
- **事件链系统**：引入连环神秘事件（神秘手稿追查、午夜钟声等），剧情连续触发。
- **数据统计面板**：新增档案室页面，直观展示出版历程、经济图表与各类型销量分布图。
- **作者人格与被动羁绊**：实装 17 种差异化作者被动（如退稿必出精品、特定类型畅销等），提高作者维系策略深度。
- **纪元路线**：重生/纪元可选择三条不同加成路线（学者/商人/名流），影响整局的侧重收益。
- **经济系统再平衡**：调整了后期通胀问题，增加沙龙的消耗和 RP（修改点数）的衰减。
