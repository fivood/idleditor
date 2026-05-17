# 像素场景 PNG 资源

放置房间背景图。命名约定：`{room}-bg.png`，如：

- `desk-bg.png` — 桌面房间
- `office-bg.png` — 办公室
- `shelf-bg.png` — 书架
- `authors-bg.png` — 作者
- `study-bg.png` — 书房
- `archive-bg.png` — 档案

## 制作要求

- **保持原始像素分辨率**，不要预先放大（如 320×180 / 480×270 / 640×360）
- 使用 Aseprite / Pixaki 等像素艺术工具导出 PNG
- 透明区域用 alpha 通道（前景物件可分层渲染）

## 渲染原理

`<PixelBackground src="/scenes/desk-bg.png" />` 组件通过
`image-rendering: pixelated` CSS 让浏览器用 nearest-neighbor 算法
缩放，在任何高分屏上保持锐利"马赛克"边缘。

源图建议比例与 SVG 场景一致（16:10 = 320×200），便于切换。
