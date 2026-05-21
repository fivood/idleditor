# 永夜出版社 · 像素美术资源全景图（画师备忘录）

> 这份文档列出**全部可改造为像素艺术的地方**，按优先级 + 改造难度排序。每一项都标了：
> - 当前状态（已 PNG / SVG 占位 / emoji / CSS）
> - 改造路径（直接画 → 丢文件即接管 / 需要小幅改代码）
> - 文件位置 + 命名规范
> - 数量
>
> 总量目标：约 600 张像素图（含 502 本书封）。**不必一次画全**——架构已支持"画一张接管一张"的渐进路径。

---

## 改造进度总览

| 区块 | 状态 | 已绘 / 总数 |
|------|------|------------|
| 书籍封面 | ✅ 已上传基础设施 + 持续填充 | **37 / 502**（7%） |
| 桌面场景物件 | ✅ 完成 | 6 / 6（含 hover 态共 13 张） |
| 房间背景图 | ⚠️ 仅 desk 有 PNG，其余 5 个房间是 SVG 占位 | 1 / 6 |
| 房间导航图标（Minimap） | ✅ 完成 | 6 / 6 |
| 走廊门 | ✅ 完成 | 1 / 1（带 hover） |
| **弹窗画框（panel）** | ⏳ 架构就绪等画 | **0 / 6** |
| **标题栏画框（titlebar，可选）** | ⏳ 架构就绪等画 | **0 / 6** |
| **按钮画框** | ⏳ 架构就绪等画 | **0 / 3** |
| 题材图标 | ⚠️ 6 个 SVG，缺 2 个新题材 | 6 / 8 |
| 部门图标 | ✅ SVG 完成（可替换 PNG） | 4 / 4 |
| 阶段图标 | ⚠️ SVG 完成但缺 cover_designing | 5 / 6 |
| 顶栏货币 / 状态图标 | ⚠️ 内联 SVG，可换 PNG | 0 / 9 |
| 作者人格头像 | ❌ 未实现 | 0 / 21 |
| 奖项徽章 | ❌ 用 emoji（🏆🌟💰🎭） | 0 / 4 |
| 进度条 | ❌ 纯 CSS | 0 / 1 |
| NPC（伯爵 / 实习生 / 部门员工） | ❌ 未实现 | 0 / N |

---

## P0 — 优先级最高（架构已就绪，画完立刻生效）

### 1. 弹窗画框（panel）· 6 张 · 48×48

放到 `public/ui/`，文件名严格匹配。详细规格见本目录 `README.md`。

| 文件 | 用途 |
|------|------|
| `panel-paper.png`   | 通用纸张面板 |
| `panel-inbox.png`   | 投稿池（木质托盘） |
| `panel-belt.png`    | 编辑流水线（铁质传送带） |
| `panel-journal.png` | 出版日志 / 档案（羊皮日记） |
| `panel-scroll.png`  | 猫详情 / 秘密事项（卷轴） |
| `panel-notice.png`  | 征稿 / 公告（软木板） |

### 2. 按钮画框 · 3 张 · 16×16

| 文件 | 用途 |
|------|------|
| `button-default.png` | 灰色硬质塑料（OK / 取消 / 常规） |
| `button-primary.png` | 铜色（"审稿""提交""确认出版"等主 CTA） |
| `button-danger.png`  | 暗红（退稿 / 撤销） |

### 3. 标题栏画框（可选）· 6 张 · 16×16

不画就退回纯色 + 1px 分割线。

| 文件 |
|------|
| `titlebar-paper.png` `titlebar-inbox.png` `titlebar-belt.png` `titlebar-journal.png` `titlebar-scroll.png` `titlebar-notice.png` |

**P0 合计：6 + 3 + 6 = 15 张**

---

## P1 — 高影响（持续填充中）

### 4. 书籍封面 · 502 张 · 40×56

放到 `public/covers/`，文件名 = 书名（含括号 / 空格按 titlePools.ts 原样）。

- 当前 **37 / 502**（科幻类领先，14/68）
- 完整书单见 `public/covers/README.md`，按 8 题材分组
- 缺失的书自动用 `占位封面.png`，无需特殊处理
- 改 `src/core/titlePools.ts` → 跑 `node scripts/gen-cover-manifest.mjs` 自动同步对照表

### 5. 缺失的题材图标 · 2 张 · 16×16 SVG（或 PNG）

v2.5 拆分新增的 2 个题材没有图标：

| 文件 | 题材 |
|------|------|
| `public/icons/genre/literary.svg`  | 凡间名著 / 经典改编 |
| `public/icons/genre/fantasy.svg`   | 远古纪事 / 奇幻史诗 |

修改 `src/core/types.ts` 的 `GENRE_ICONS` 指向新文件即可。

### 6. 缺失的阶段图标 · 1 张 · 16×16

v2.6 新增了 `cover_designing` 阶段但没图：

| 文件 |
|------|
| `public/icons/stage/cover_designing.svg`（设计部画家在写写画画的样子） |

---

## P2 — 视觉一致性（中等优先级）

### 7. 房间背景图 · 5 张待补

`public/scenes/` 目前只有 `desk-bg.png`。其余 5 间房用 SVG 占位（在 `src/assets/scenes/*.tsx`）。

| 文件 | 房间用途 |
|------|----------|
| `office-bg.png`   | 办公室（部门 + 偏好 + 设置入口） |
| `shelf-bg.png`    | 书架（出版作品三分区：签约 / 我的 / 书店） |
| `authors-bg.png`  | 作者名单房间 |
| `study-bg.png`    | 书房（内置阅读器 + 火炉） |
| `archive-bg.png`  | 档案室（文件柜 + 账本 + 文学奖卷轴） |

**尺寸建议**：与 `desk-bg.png` 一致——参考它的分辨率。每张房间背景配套画 4-8 个"hotspot 物件"（参考 desk 的 6 个 desk-* 物件 + hover 态）。

### 8. 顶栏货币 / 状态图标 · 9 张 · 16×16

目前在 `src/assets/pixelIcons.tsx`（589 行内联 SVG），可以换成 PNG sprite 或保留 SVG。

| 当前导出 | 用途 |
|----------|------|
| IconRP        | 修订点 |
| IconPrestige  | 声望 |
| IconRoyalty   | 版税 |
| IconStatue    | 铜像 |
| IconMoon      | 灵感（梦境创作） |
| IconScroll    | 出版额度 |
| IconTrend     | 市场风向 |
| IconCloud     | 云存档 |
| IconCoffin    | 纪元（铸造铜像按钮） |

**保留 SVG 也行**——它们当前已经是"像素感"的 SVG（基于网格绘制）。如果想换 PNG 视觉更统一，画 16×16 PNG 替换 + 改 `src/assets/pixelIcons.tsx` 导出方式即可。

---

## P3 — 深度氛围（增加游戏识别度）

### 9. 作者人格头像 · 21 张 · 24×24 或 32×32

21 个 persona 当前没有头像，作者卡片显示文字。补头像后作者名单/详情视觉跃然纸上。

`public/portraits/`（新目录）：

```
vampire-aristocrat-historian.png     血族贵族编年史家
vampire-decadent-poet.png            颓废派血族诗人
vampire-young-rebel.png              血族新生代叛逆
vampire-amateur-detective.png        血族业余侦探小说家
werewolf-pack-bard.png               狼群游吟诗人
werewolf-suburban-novelist.png       郊区狼人家庭小说家
werewolf-frontier-survivor.png       边境拓荒狼人
witch-grimoire-keeper.png            古魔典守护人
witch-kitchen-novelist.png           厨房女巫小说家
witch-storm-prophetess.png           风暴预言女巫
lich-archive-curator.png             巫妖档案馆长
banshee-mourning-poet.png            哀嚎妖挽歌诗人
ghoul-cemetery-historian.png         墓园食尸鬼地志学家
mortal-investigative-journalist.png  凡间调查记者
mortal-bestseller-hustler.png        凡间畅销快枪手
fae-changeling-fabulist.png          换生灵寓言家
demon-bureaucrat.png                 魔裔官僚作家
ghost-gothic-poet.png                幽灵哥特诗人
mummy-chronicle-scholar.png          木乃伊编年史家
noir-pulp-novelist.png               黑色小说快手
ancient-dragon-epic.png              始祖龙史诗作者
```

需要小幅代码改造（AuthorCard 组件加 `<img src={`/portraits/${persona}.png`} />`）。

### 10. 永夜文学奖徽章 · 4 张 · 24×24 或 32×32

当前 emoji 占位（🏆🌟💰🎭）。

`public/ui/award-{category}.png`：

| 文件 | 奖项 |
|------|------|
| `award-best-novel.png`     | 🏆 最佳小说（铜质金边徽章） |
| `award-best-newcomer.png`  | 🌟 最佳新人（银质带星） |
| `award-best-seller.png`    | 💰 商业奇迹（金币堆叠） |
| `award-jury-special.png`   | 🎭 评审团特别奖（戏剧面具） |

需要改 `src/core/awards.ts` 的 `AWARD_LABELS` 引用 PNG。

### 11. 走廊导航 / 房间过场 · 装饰物件

`public/scenes/icon-{room}.png` 已有，但是房间间的"过渡墙"或"走廊"目前是单一 PNG（move + hover）。可以为每个房间方向画专属过渡（左走廊 / 右走廊 / 楼上 / 楼下）。

---

## P4 — 锦上添花（不影响体验，但提升精致度）

### 12. 进度条 9-slice · 2 张（边框 + 填充）· 8×8

当前 `PixelProgressBar` 用 CSS 渐变。可换成两张 8×8 PNG（border-image 同款 9-slice）：

```
public/ui/
  ├── progressbar-frame.png   外框
  └── progressbar-fill.png    填充纹理（铜色横纹）
```

### 13. 状态标记图标 · 6 张 · 8×8 或 12×12

替代日志面板里的 unicode 符号（◆ ★ ✗ ⬆ · 📘）：

| 文件 | 用途 |
|------|------|
| `marker-milestone.png` | 里程碑（铜色菱形） |
| `marker-award.png`     | 获奖（金星） |
| `marker-rejection.png` | 退稿（红 X） |
| `marker-levelup.png`   | 升级（向上箭头） |
| `marker-info.png`      | 普通信息（圆点） |
| `marker-humor.png`     | 冷笑话（笑脸） |

### 14. NPC 立绘 · 3-5 张 · 64×96 或更大

- 伯爵（vampire count，出现在纪元剧情）
- 伯爵女版（player 选了女版伯爵）
- 实习生（轮换 4-5 张）
- 主编自己（可选——player 头像）

需要 modal 改造适配立绘位置。

### 15. 装饰小物 · 桌面 / 办公室细节物

- 茶杯（已有 desk-tea）的不同状态：满 / 半 / 空
- 灯的不同状态：亮 / 暗 / 熄灭
- 桌上稿件堆叠层数（已有 1/2/3 层 PNG 切换逻辑——但 PNG 还没全画）

---

## 文件命名与代码挂钩规则（参考）

| 区块 | 文件目录 | 命名规则 |
|------|---------|---------|
| 弹窗画框 | `public/ui/`     | `panel-{variant}.png` |
| 按钮画框 | `public/ui/`     | `button-{variant}.png` |
| 标题栏 | `public/ui/`     | `titlebar-{variant}.png` |
| 书籍封面 | `public/covers/` | `{书名}.png`（titlePools.ts 原样） |
| 场景背景 | `public/scenes/` | `{room}-bg.png` |
| 场景物件 | `public/scenes/` | `{room}-{obj}.png` + `{room}-{obj}-hover.png` |
| 房间图标 | `public/scenes/` | `icon-{room}.png` |
| 通用 SVG | `public/icons/`  | `{category}/{name}.svg` |
| 作者头像（待建） | `public/portraits/` | `{persona-id}.png` |
| 奖项徽章（待建） | `public/ui/`     | `award-{category}.png` |

**全部 PNG 都默认走 `image-rendering: pixelated`**，整数倍放大不糊。

---

## 推荐迭代顺序

1. **panel-paper.png**（1 张 48×48）→ 立刻看到弹窗换装效果，决定整体氛围基调
2. **button-primary.png**（1 张 16×16）→ 解锁最频繁的交互反馈
3. **panel + button 各 variant 补齐**（再 5+2 = 7 张）→ 弹窗系统一致性
4. **titlebar-paper.png**（1 张）→ 看是否值得做齐 6 个 titlebar
5. **奖项徽章 4 张 + 阶段图标 1 张**（小图标但出现频次高）
6. **作者头像 4-5 张主力 persona**（vampire-aristocrat-historian / werewolf-pack-bard 等高频出现的）→ 加代码改造
7. **房间背景 office → archive**（其余 5 间房逐个上色）
8. **书籍封面继续填充**（按题材批量来）

---

## 兜底与不破坏原则

每一项改造都遵循**"丢文件接管，缺失走兜底"**：
- 弹窗 / 按钮 / 标题栏 / 封面：缺图自动用纯色 + CSS 凸起 / 占位封面
- 房间背景：缺 PNG 用 SVG 占位（已在 `src/assets/scenes/` 实现）
- 头像 / 徽章 / 立绘（待加代码改造时）：缺图用 emoji / 文字 fallback

所以**这份 roadmap 上的任何一项都可以单独完成**，不会让其他部分挂掉。
