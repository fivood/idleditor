# 弹窗 / 按钮 / 标题栏画框 PNG 规范（9 张独立切片）

> **v2.6.3 起规则**：每个画框拆成 9 张独立的 PNG（每张 = 9 宫格中的一格），代码会用 CSS 多层背景叠加自动拼起来。优点：
> - 单格随时可替换，不需要重切大图
> - 像素整数对齐由画师直接控制
> - 任一格缺失就退回纯色兜底，不会半截显示

---

## 1. 弹窗画框（panel）· 6 个 variant · 每个 9 张

每张 PNG 都是 **同尺寸正方形**（默认 48×48）。文件命名严格匹配。

```
public/ui/
  ├── panel-paper-tl.png       ┐
  ├── panel-paper-t-edge.png   │ 顶部一排（左上 / 顶边可平铺 / 右上）
  ├── panel-paper-tr.png       ┘
  ├── panel-paper-l-edge.png   ┐
  ├── panel-paper-center.png   │ 中部一排（左边可平铺 / 中央可平铺 / 右边可平铺）
  ├── panel-paper-r-edge.png   ┘
  ├── panel-paper-bl.png       ┐
  ├── panel-paper-b-edge.png   │ 底部一排
  └── panel-paper-br.png       ┘
```

### 6 个 variant

| variant | 用途 | 兜底色 |
|---------|------|--------|
| paper   | 通用纸张面板 | `#2a1810` |
| inbox   | 投稿池（木质托盘） | `#4a2f18` |
| belt    | 编辑流水线（铁质传送带） | `#2a1810` |
| journal | 出版日志 / 档案（羊皮日记） | `#3a2412` |
| scroll  | 猫详情 / 秘密事项（卷轴） | `#3a2418` |
| notice  | 征稿 / 公告（软木板） | `#8b6b3e` |

### 每张切片的职责

| 文件后缀 | 平铺方式 | 画什么 |
|---------|---------|--------|
| `-tl`     | 固定 1 块  | 左上角拐角装饰 |
| `-tr`     | 固定 1 块  | 右上角拐角装饰 |
| `-bl`     | 固定 1 块  | 左下角拐角装饰 |
| `-br`     | 固定 1 块  | 右下角拐角装饰 |
| `-t-edge` | 横向平铺   | 顶部边纹理（必须左右像素无缝） |
| `-b-edge` | 横向平铺   | 底部边纹理 |
| `-l-edge` | 纵向平铺   | 左边纹理（必须上下像素无缝） |
| `-r-edge` | 纵向平铺   | 右边纹理 |
| `-center` | 双向平铺   | 中央底色（纸纹 / 木纹 / 软木颗粒，必须四向接缝无痕） |

### 切片尺寸调整

默认 48×48。如果你想改成其他尺寸（比如 32×32 紧凑、64×64 精细）：
- 9 张文件统一改成新尺寸
- 修改 `src/components/scene/ScenePanel.tsx` 里 `PANEL_VARIANTS.{variant}.slice` 数值

---

## 2. 按钮画框（button）· 3 个 variant · 每个 9 张

跟 panel 完全同结构，只是默认更紧凑（**16×16 per slice**）。

```
public/ui/
  ├── button-{variant}-tl.png       (4 个角)
  ├── button-{variant}-tr.png
  ├── button-{variant}-bl.png
  ├── button-{variant}-br.png
  ├── button-{variant}-t-edge.png   (4 条边)
  ├── button-{variant}-b-edge.png
  ├── button-{variant}-l-edge.png
  ├── button-{variant}-r-edge.png
  └── button-{variant}-center.png   (中心)
```

### 3 个 variant

| variant | 用途 | 兜底主色 |
|---------|------|---------|
| default | 灰色硬质塑料（OK / 取消 / 常规） | `#a8a8a8` |
| primary | 铜色（"审稿""提交""确认出版"等主 CTA） | `#b8763b` |
| danger  | 暗红（退稿 / 撤销） | `#a04030` |

### 8-bit 立体凸起的实现建议

如果想保留经典 NES/SFC 风格的"凸起感"——
- `tl` / `t-edge` / `l-edge` 用高光带（亮一点）
- `br` / `b-edge` / `r-edge` 用阴影带（暗一点）
- 整张图最外圈 1px 黑边封装

平铺后按钮自动"立起来"。

### hover / active 状态

代码自动处理：
- **hover** → 整组 PNG `filter: brightness(1.1)`
- **active 按下** → 整组向右下 1px 偏移

你不需要画 hover/pressed 状态（除非想要更精细的反馈）。

---

## 3. 标题栏画框（titlebar，可选）· 6 个 variant · 每个 9 张

跟 button 完全同结构（16×16），文件名前缀换成 `titlebar-`。

```
public/ui/
  ├── titlebar-{variant}-tl.png
  ├── titlebar-{variant}-t-edge.png
  ├── titlebar-{variant}-tr.png
  ├── titlebar-{variant}-l-edge.png
  ├── titlebar-{variant}-center.png
  ├── titlebar-{variant}-r-edge.png
  ├── titlebar-{variant}-bl.png
  ├── titlebar-{variant}-b-edge.png
  └── titlebar-{variant}-br.png
```

**6 个 variant 同 panel 列表。完全可选**：不画就退回当前的纯色 + 1px 分割线。

---

## 通用提醒

1. **9 张全部存在才启用**——如果只画了 8 张，会自动退回纯色兜底
2. **检测方式**：代码探测 `*-center.png` 是否能加载，所以**最后画 center**比较稳
3. **所有 PNG 必须像素整数对齐**（不要在编辑器里用浮点缩放）
4. **导出时关闭抗锯齿**（PNG 直接是离散像素值）
5. **像素整数倍渲染由代码处理**（`image-rendering: pixelated`），无须你手动放大资源
6. **接缝检查**：让 t-edge 的左边一列和 r-edge 的左边一列对齐；center 必须四向都能无缝平铺
7. 兜底色已经能让游戏正常玩，所以**画一组接管一组**——不必一次画全

---

## 验证清单

放好 9 张 PNG 后开浏览器：

1. 弹窗顶部 + 底部边框看不出"接缝"（t-edge 与 corners、bl-edge 与 corners 的接缝处像素对齐）
2. 中央纹理在大尺寸面板下没有可见的重复模式（或重复但有意为之）
3. 缩放浏览器窗口至 720px 宽 → 画框依然锐利不糊
4. 跨 DPR（普通屏 + Retina）外观一致
5. 把任一切片改名（让它"消失"）→ 整个弹窗应该退回纯色兜底，而不是缺一块

如果接缝处有错位，最常见原因是 corner 文件比实际拐角块多/少了一行像素。

---

## 推荐迭代顺序

1. **panel-paper 一组（9 张）** → 立刻看到弹窗换装效果，决定整体氛围基调
2. **button-primary 一组（9 张）** → 解锁最频繁的交互反馈
3. panel + button 其余 variant 补齐
4. titlebar-paper 一组 → 看是否值得做齐 6 个 titlebar
