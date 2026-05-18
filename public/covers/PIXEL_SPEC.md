# 像素书封制作规范

## 尺寸

- **源 PNG：40 × 56 像素**（5:7 比例，与 Aseprite 默认书脊比例一致）
- 颜色深度：8-bit RGBA（带透明通道）

## 渲染时缩放

游戏用 `<PixelCover>` 组件 + `image-rendering: pixelated` 渲染，
原 40×56 会被整数倍放大：

| size | 显示尺寸 | 缩放倍数 | 用途 |
|------|---------|---------|------|
| xs | 80×112 | ×2 | 书架小图 |
| sm | 120×168 | ×3 | 投稿卡缩略图 |
| md | 160×224 | ×4 | 默认预览 |
| lg | 200×280 | ×5 | CoverSelectModal |

源图直接整数倍放大不会模糊（nearest-neighbor 算法）。

## 命名约定

文件名 = 书名 slug，与 `manifest.json` 对应。

```
public/covers/吸血鬼的历史.png
public/covers/银器走私集团.png
public/covers/转生成吸血鬼但只想睡觉.png
```

manifest.json 由 `scripts/gen-cover-manifest.mjs` 自动生成。

## 缺图时的兜底

`PixelCover` 在 `cover.src` 加载失败时会显示题材色背景 + 题材图标 +
书名描边文字的占位封面，不会留白。

## 调色板建议

与游戏整体一致：
- 背景：#1a0e08 / #2a1810 / #3d2614 系列
- 高亮：#f5d878 铜金
- 危险：#8b1f1f 血红
- 题材色带可选用各 genre 主色

避免过亮的纯色（如纯白 #ffffff），与暗主题整体不协调。
