# 像素字体

把你的像素字体文件放在这里：

## 推荐字体（开源 + 中英文覆盖）

### 1. Fusion Pixel Font（首选）
覆盖 CJK + ASCII，多种尺寸（8/10/12px），完全免费。

下载：https://github.com/TakWolf/fusion-pixel-font/releases

文件命名约定：
- `fusion-pixel-12px.woff2`（推荐 12px 等宽版）
- `fusion-pixel-12px.ttf`（兜底）

### 2. Cubic 11（备选）
繁体中文，11px。

下载：https://github.com/ACh-K/Cubic-11/releases

### 3. Press Start 2P（英文专用）
经典 8-bit 英文字体，可与中文像素体混搭。

下载：https://fonts.google.com/specimen/Press+Start+2P
文件命名：`press-start-2p.woff2`

## 字体不存在时

`src/index.css` 已声明 @font-face，缺文件时浏览器自动回退到：
`Sarasa Mono SC → Source Han Sans SC → PingFang SC → Microsoft YaHei → SimHei → monospace`

游戏不会坏，只是显示成普通等宽字体而已。
