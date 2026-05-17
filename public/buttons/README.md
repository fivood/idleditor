# 像素按钮 PNG 资源

放置场景内可交互对象的按钮图标，如稿件堆、稿件托盘、墨水瓶等。

命名约定：`{room}-{object}.png`，如：

- `desk-inbox.png` — 桌面投稿托盘
- `desk-pipeline.png` — 编辑流水线齿轮
- `desk-cat.png` — 黑猫
- `desk-lamp.png` — 油灯
- `desk-solicit.png` — 征稿信封

## 制作要求

- 透明 PNG（alpha 通道）
- 像素分辨率与所在场景一致
- 建议尺寸 16×16 / 32×32 / 48×48（与底层场景的像素尺寸成整数倍关系）

## 用法

```tsx
<PixelButton
  src="/buttons/desk-inbox.png"
  label="📥 投稿池"
  position={{ left: '8%', top: '50%', width: '14%', height: '24%' }}
  onClick={() => openPanel('submissions')}
/>
```

hover 时整张图发铜色光晕，按下时下沉 2px。
