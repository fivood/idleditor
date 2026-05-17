/**
 * 永夜出版社像素图标库。
 *
 * 全部 16×16 viewBox，整数坐标 + shape-rendering="crispEdges"。
 * 默认 24px 渲染（1.5x 放大），通过 size prop 覆盖。
 * 默认色板与游戏调色板一致：
 *   - copper: #b8763b（主题色，浅）
 *   - copperDark: #8a5828
 *   - copperGlow: #f5d878
 *   - ink: #2a1810
 *   - paper: #ede0c8
 *   - blood: #8b1f1f
 *   - moon: #f5e6a0
 *   - night: #0e1240
 *
 * 通过 color prop 可整体染色（替换 currentColor）。
 */
import type { CSSProperties } from 'react'

interface IconProps {
  size?: number
  className?: string
  style?: CSSProperties
  color?: string         // 覆盖 currentColor
  title?: string         // 鼠标 hover 提示
}

function Icon({ children, size = 16, className, style, title, color }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      width={size}
      height={size}
      shapeRendering="crispEdges"
      className={className}
      style={{ imageRendering: 'pixelated', display: 'inline-block', verticalAlign: 'middle', color, ...style }}
      role={title ? 'img' : undefined}
      aria-label={title}
    >
      {title && <title>{title}</title>}
      {children}
    </svg>
  )
}

// ─── 房间图标 ───

/** 桌面 — 鹅毛笔斜插在墨水瓶里 */
export const IconDesk = (p: IconProps) => (
  <Icon {...p}>
    {/* 墨水瓶 */}
    <rect x="6" y="11" width="5" height="4" fill="#0a0806" />
    <rect x="6" y="10" width="5" height="1" fill="#3a2a20" />
    {/* 鹅毛笔（斜向） */}
    <rect x="11" y="3" width="1" height="2" fill="#f0e8d8" />
    <rect x="10" y="5" width="1" height="2" fill="#f0e8d8" />
    <rect x="9" y="7" width="1" height="2" fill="#f0e8d8" />
    <rect x="8" y="9" width="1" height="2" fill="#d4c8b0" />
    {/* 羽毛纹理 */}
    <rect x="11" y="4" width="2" height="1" fill="#d4c8b0" />
    <rect x="10" y="6" width="2" height="1" fill="#d4c8b0" />
  </Icon>
)

/** 书架 — 一排彩色书脊 */
export const IconShelf = (p: IconProps) => (
  <Icon {...p}>
    {/* 顶板 */}
    <rect x="1" y="2" width="14" height="1" fill="#5c3a1f" />
    {/* 三本书 */}
    <rect x="2" y="3" width="3" height="10" fill="#5a78a4" />
    <rect x="6" y="4" width="3" height="9" fill="#a45a78" />
    <rect x="10" y="3" width="3" height="10" fill="#78a45a" />
    <rect x="13" y="5" width="1" height="8" fill="#a47828" />
    {/* 底板 */}
    <rect x="1" y="13" width="14" height="1" fill="#5c3a1f" />
  </Icon>
)

/** 作者 — 一支大鹅毛笔 */
export const IconAuthors = (p: IconProps) => (
  <Icon {...p}>
    <rect x="11" y="2" width="2" height="2" fill="#f0e8d8" />
    <rect x="10" y="4" width="2" height="2" fill="#f0e8d8" />
    <rect x="9" y="6" width="2" height="2" fill="#f0e8d8" />
    <rect x="8" y="8" width="2" height="2" fill="#e8dec8" />
    <rect x="7" y="10" width="2" height="2" fill="#d4c8b0" />
    <rect x="6" y="12" width="2" height="2" fill="#a89072" />
    {/* 羽毛纹理 */}
    <rect x="11" y="3" width="3" height="1" fill="#d4c8b0" />
    <rect x="10" y="5" width="3" height="1" fill="#d4c8b0" />
    <rect x="9" y="7" width="3" height="1" fill="#d4c8b0" />
    <rect x="8" y="9" width="3" height="1" fill="#d4c8b0" />
    {/* 笔尖墨点 */}
    <rect x="5" y="13" width="1" height="1" fill="#0a0806" />
  </Icon>
)

/** 办公室 — 一根罗马柱 */
export const IconOffice = (p: IconProps) => (
  <Icon {...p}>
    {/* 柱顶 */}
    <rect x="3" y="2" width="10" height="2" fill="#d4a85a" />
    <rect x="2" y="3" width="12" height="1" fill="#d4a85a" />
    {/* 柱身（带凹槽） */}
    <rect x="4" y="4" width="8" height="8" fill="#d4c8a8" />
    <rect x="5" y="4" width="1" height="8" fill="#a89060" />
    <rect x="8" y="4" width="1" height="8" fill="#a89060" />
    <rect x="11" y="4" width="1" height="8" fill="#a89060" />
    {/* 柱基 */}
    <rect x="3" y="12" width="10" height="1" fill="#d4a85a" />
    <rect x="2" y="13" width="12" height="2" fill="#a89060" />
  </Icon>
)

/** 书房 — 一本翻开的书 */
export const IconStudy = (p: IconProps) => (
  <Icon {...p}>
    {/* 书脊 */}
    <rect x="7" y="3" width="2" height="11" fill="#5c3a1f" />
    {/* 左页 */}
    <rect x="2" y="4" width="5" height="9" fill="#ede0c8" />
    <rect x="2" y="3" width="5" height="1" fill="#d4c8a8" />
    <rect x="3" y="6" width="3" height="1" fill="#5a4a38" />
    <rect x="3" y="8" width="4" height="1" fill="#5a4a38" />
    <rect x="3" y="10" width="3" height="1" fill="#5a4a38" />
    {/* 右页 */}
    <rect x="9" y="4" width="5" height="9" fill="#ede0c8" />
    <rect x="9" y="3" width="5" height="1" fill="#d4c8a8" />
    <rect x="10" y="6" width="4" height="1" fill="#5a4a38" />
    <rect x="10" y="8" width="3" height="1" fill="#5a4a38" />
    <rect x="10" y="10" width="4" height="1" fill="#5a4a38" />
  </Icon>
)

/** 档案 — 文件柜（带抽屉拉手） */
export const IconArchive = (p: IconProps) => (
  <Icon {...p}>
    <rect x="2" y="1" width="12" height="14" fill="#5c3a1f" />
    <rect x="2" y="1" width="12" height="1" fill="#6e4a2a" />
    {/* 抽屉 1 */}
    <rect x="3" y="3" width="10" height="3" fill="#4a2f18" />
    <rect x="7" y="4" width="2" height="1" fill="#d4a85a" />
    {/* 抽屉 2 */}
    <rect x="3" y="7" width="10" height="3" fill="#4a2f18" />
    <rect x="7" y="8" width="2" height="1" fill="#d4a85a" />
    {/* 抽屉 3 */}
    <rect x="3" y="11" width="10" height="3" fill="#4a2f18" />
    <rect x="7" y="12" width="2" height="1" fill="#d4a85a" />
  </Icon>
)

// ─── 货币图标 ───

/** RP / 修订点 — 红色羽毛笔尖 */
export const IconRP = (p: IconProps) => (
  <Icon {...p}>
    <rect x="11" y="3" width="2" height="1" fill="#d4c8b0" />
    <rect x="10" y="4" width="2" height="2" fill="#f0e8d8" />
    <rect x="8" y="6" width="2" height="2" fill="#f0e8d8" />
    <rect x="6" y="8" width="2" height="2" fill="#e8dec8" />
    <rect x="4" y="10" width="2" height="2" fill="#a89072" />
    {/* 红色墨点 */}
    <rect x="3" y="12" width="2" height="2" fill="#8b1f1f" />
    <rect x="2" y="13" width="1" height="1" fill="#8b1f1f" opacity="0.7" />
  </Icon>
)

/** 声望 — 桂冠 */
export const IconPrestige = (p: IconProps) => (
  <Icon {...p}>
    {/* 上半叶 */}
    <rect x="3" y="3" width="2" height="3" fill="#78a45a" />
    <rect x="11" y="3" width="2" height="3" fill="#78a45a" />
    <rect x="4" y="2" width="1" height="1" fill="#a4d478" />
    <rect x="11" y="2" width="1" height="1" fill="#a4d478" />
    {/* 中间叶 */}
    <rect x="2" y="6" width="2" height="3" fill="#5a8a3a" />
    <rect x="12" y="6" width="2" height="3" fill="#5a8a3a" />
    {/* 下半叶 */}
    <rect x="3" y="9" width="2" height="3" fill="#78a45a" />
    <rect x="11" y="9" width="2" height="3" fill="#78a45a" />
    {/* 中央铜星 */}
    <rect x="7" y="6" width="2" height="2" fill="#f5d878" />
    <rect x="6" y="7" width="4" height="2" fill="#f5d878" />
    <rect x="7" y="9" width="2" height="2" fill="#f5d878" />
    {/* 底部丝带 */}
    <rect x="5" y="12" width="6" height="1" fill="#8b1f1f" />
    <rect x="6" y="13" width="2" height="1" fill="#8b1f1f" />
    <rect x="9" y="13" width="2" height="1" fill="#8b1f1f" />
  </Icon>
)

/** 版税 / 金币 — 一摞金币 */
export const IconRoyalty = (p: IconProps) => (
  <Icon {...p}>
    {/* 三层金币 */}
    <ellipse cx="8" cy="13" rx="6" ry="2" fill="#8a5828" />
    <ellipse cx="8" cy="11" rx="6" ry="2" fill="#b8763b" />
    <ellipse cx="8" cy="9" rx="6" ry="2" fill="#d49a5b" />
    <ellipse cx="8" cy="7" rx="6" ry="2" fill="#f5d878" />
    <ellipse cx="8" cy="6" rx="6" ry="1.5" fill="#fff0a8" />
    {/* 顶部纹路 */}
    <rect x="7" y="5" width="2" height="1" fill="#b8763b" />
  </Icon>
)

/** 铜像 — 小奖杯/雕像 */
export const IconStatue = (p: IconProps) => (
  <Icon {...p}>
    {/* 头 */}
    <rect x="6" y="2" width="4" height="3" fill="#b8763b" />
    <rect x="6" y="2" width="4" height="1" fill="#d49a5b" />
    {/* 身体（袍） */}
    <rect x="5" y="5" width="6" height="5" fill="#8a5828" />
    <rect x="5" y="5" width="6" height="1" fill="#b8763b" />
    {/* 手柄/把手 */}
    <rect x="3" y="6" width="2" height="3" fill="#8a5828" />
    <rect x="11" y="6" width="2" height="3" fill="#8a5828" />
    {/* 基座 */}
    <rect x="3" y="10" width="10" height="2" fill="#5c3a1f" />
    <rect x="2" y="12" width="12" height="2" fill="#3d2614" />
  </Icon>
)

// ─── 桌面热区图标 ───

/** 投稿池 — 收件托盘里的纸张 */
export const IconInbox = (p: IconProps) => (
  <Icon {...p}>
    {/* 托盘后壁 */}
    <rect x="2" y="6" width="12" height="3" fill="#5c3a1f" />
    {/* 纸张 */}
    <rect x="4" y="3" width="8" height="5" fill="#ede0c8" />
    <rect x="4" y="3" width="8" height="1" fill="#f5e8d0" />
    <rect x="5" y="5" width="4" height="1" fill="#5a4a38" />
    <rect x="5" y="7" width="6" height="1" fill="#5a4a38" />
    {/* 托盘底 */}
    <rect x="1" y="9" width="14" height="4" fill="#3d2614" />
    <rect x="1" y="13" width="14" height="1" fill="#2a1810" />
  </Icon>
)

/** 流水线 — 一个齿轮 */
export const IconGears = (p: IconProps) => (
  <Icon {...p}>
    {/* 齿轮齿 */}
    <rect x="7" y="1" width="2" height="2" fill="#b8763b" />
    <rect x="7" y="13" width="2" height="2" fill="#b8763b" />
    <rect x="1" y="7" width="2" height="2" fill="#b8763b" />
    <rect x="13" y="7" width="2" height="2" fill="#b8763b" />
    <rect x="3" y="3" width="2" height="2" fill="#b8763b" />
    <rect x="11" y="3" width="2" height="2" fill="#b8763b" />
    <rect x="3" y="11" width="2" height="2" fill="#b8763b" />
    <rect x="11" y="11" width="2" height="2" fill="#b8763b" />
    {/* 齿轮主体 */}
    <rect x="4" y="4" width="8" height="8" fill="#8a5828" />
    <rect x="3" y="5" width="10" height="6" fill="#8a5828" />
    <rect x="5" y="3" width="6" height="10" fill="#8a5828" />
    {/* 中心轴孔 */}
    <rect x="6" y="6" width="4" height="4" fill="#0a0806" />
    {/* 高光 */}
    <rect x="4" y="4" width="3" height="1" fill="#b8763b" />
    <rect x="4" y="5" width="1" height="2" fill="#b8763b" />
  </Icon>
)

/** 日志 — 翻开的小本子 */
export const IconJournal = (p: IconProps) => (
  <Icon {...p}>
    {/* 书脊 */}
    <rect x="7" y="3" width="2" height="11" fill="#5c0f0f" />
    {/* 左页 */}
    <rect x="2" y="4" width="5" height="9" fill="#e8d8b0" />
    <rect x="3" y="5" width="3" height="1" fill="#5a4a38" />
    <rect x="3" y="7" width="4" height="1" fill="#5a4a38" />
    <rect x="3" y="9" width="3" height="1" fill="#5a4a38" />
    <rect x="3" y="11" width="4" height="1" fill="#5a4a38" />
    {/* 右页 */}
    <rect x="9" y="4" width="5" height="9" fill="#e8d8b0" />
    <rect x="10" y="5" width="4" height="1" fill="#5a4a38" />
    <rect x="10" y="7" width="3" height="1" fill="#5a4a38" />
    <rect x="10" y="9" width="4" height="1" fill="#5a4a38" />
    <rect x="10" y="11" width="2" height="1" fill="#5a4a38" />
    {/* 红丝带书签 */}
    <rect x="6" y="3" width="1" height="12" fill="#8b1f1f" />
  </Icon>
)

/** 黑猫 — 蜷起来的小黑猫 */
export const IconCat = (p: IconProps) => (
  <Icon {...p}>
    {/* 身体 */}
    <rect x="3" y="8" width="10" height="5" fill="#0a0806" />
    <rect x="2" y="9" width="12" height="3" fill="#0a0806" />
    {/* 头部 */}
    <rect x="9" y="5" width="5" height="4" fill="#0a0806" />
    {/* 耳朵 */}
    <rect x="9" y="3" width="2" height="2" fill="#0a0806" />
    <rect x="12" y="3" width="2" height="2" fill="#0a0806" />
    {/* 眼睛（金色） */}
    <rect x="10" y="6" width="1" height="1" fill="#f5d878" />
    <rect x="12" y="6" width="1" height="1" fill="#f5d878" />
    {/* 尾巴卷起 */}
    <rect x="13" y="10" width="2" height="1" fill="#0a0806" />
    <rect x="14" y="8" width="1" height="2" fill="#0a0806" />
  </Icon>
)

/** 公告板 / 征稿 — 钉着告示的木板 */
export const IconNotice = (p: IconProps) => (
  <Icon {...p}>
    {/* 木质背板 */}
    <rect x="1" y="2" width="14" height="12" fill="#8b6b3e" />
    <rect x="1" y="2" width="14" height="1" fill="#a08060" />
    {/* 红色顶横栏 */}
    <rect x="1" y="2" width="14" height="2" fill="#8b1f1f" />
    {/* 三张白色告示 */}
    <rect x="3" y="6" width="3" height="4" fill="#ede0c8" />
    <rect x="7" y="6" width="3" height="4" fill="#ede0c8" />
    <rect x="11" y="6" width="3" height="4" fill="#ede0c8" />
    {/* 图钉（红色） */}
    <rect x="4" y="6" width="1" height="1" fill="#5c0f0f" />
    <rect x="8" y="6" width="1" height="1" fill="#5c0f0f" />
    <rect x="12" y="6" width="1" height="1" fill="#5c0f0f" />
    {/* 告示纹理 */}
    <rect x="3" y="8" width="2" height="1" fill="#5a4a38" />
    <rect x="7" y="8" width="2" height="1" fill="#5a4a38" />
    <rect x="11" y="8" width="2" height="1" fill="#5a4a38" />
  </Icon>
)

/** 月亮 — 月牙 */
export const IconMoon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="5" y="3" width="6" height="2" fill="#f5e6a0" />
    <rect x="3" y="5" width="3" height="6" fill="#f5e6a0" />
    <rect x="6" y="5" width="3" height="6" fill="#0e1240" />
    <rect x="5" y="11" width="6" height="2" fill="#f5e6a0" />
  </Icon>
)

/** 门 — 拱顶木门 */
export const IconDoor = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3" y="4" width="10" height="11" fill="#5c3a1f" />
    <rect x="4" y="2" width="8" height="2" fill="#5c3a1f" />
    <rect x="5" y="1" width="6" height="1" fill="#5c3a1f" />
    {/* 木纹 */}
    <rect x="4" y="6" width="8" height="1" fill="#4a2f18" />
    <rect x="4" y="9" width="8" height="1" fill="#4a2f18" />
    <rect x="4" y="12" width="8" height="1" fill="#4a2f18" />
    {/* 门把手 */}
    <rect x="10" y="8" width="2" height="2" fill="#d4a85a" />
  </Icon>
)

/** 云存档 — 一朵云 */
export const IconCloud = (p: IconProps) => (
  <Icon {...p}>
    <rect x="5" y="5" width="6" height="4" fill="#e8e0d0" />
    <rect x="4" y="6" width="8" height="4" fill="#e8e0d0" />
    <rect x="3" y="7" width="10" height="3" fill="#e8e0d0" />
    <rect x="2" y="8" width="12" height="2" fill="#e8e0d0" />
    <rect x="3" y="10" width="10" height="1" fill="#a89072" />
    {/* 高光 */}
    <rect x="5" y="6" width="2" height="1" fill="#f5edd8" />
  </Icon>
)

/** 趋势 — 上升箭头 + 图表 */
export const IconTrend = (p: IconProps) => (
  <Icon {...p}>
    <rect x="2" y="11" width="2" height="2" fill="#5a78a4" />
    <rect x="5" y="9" width="2" height="4" fill="#5a78a4" />
    <rect x="8" y="7" width="2" height="6" fill="#78a45a" />
    <rect x="11" y="4" width="2" height="9" fill="#a45a78" />
    {/* 箭头 */}
    <rect x="12" y="3" width="3" height="1" fill="#f5d878" />
    <rect x="13" y="2" width="2" height="1" fill="#f5d878" />
  </Icon>
)

/** 棺木 / 纪元 */
export const IconCoffin = (p: IconProps) => (
  <Icon {...p}>
    {/* 棺木轮廓（六边形） */}
    <rect x="6" y="2" width="4" height="1" fill="#5c3a1f" />
    <rect x="5" y="3" width="6" height="2" fill="#5c3a1f" />
    <rect x="4" y="5" width="8" height="6" fill="#5c3a1f" />
    <rect x="5" y="11" width="6" height="2" fill="#5c3a1f" />
    <rect x="6" y="13" width="4" height="1" fill="#5c3a1f" />
    {/* 十字 */}
    <rect x="7" y="6" width="2" height="6" fill="#f5d878" />
    <rect x="5" y="8" width="6" height="2" fill="#f5d878" />
  </Icon>
)

/** 酒杯 / 茶水间 */
export const IconWine = (p: IconProps) => (
  <Icon {...p}>
    {/* 杯口 */}
    <rect x="4" y="2" width="8" height="1" fill="#a89060" />
    <rect x="4" y="3" width="8" height="2" fill="#e8e0d0" />
    {/* 红酒液 */}
    <rect x="5" y="3" width="6" height="2" fill="#6b1a18" />
    {/* 杯身 */}
    <rect x="4" y="5" width="8" height="3" fill="#e8e0d0" />
    <rect x="5" y="8" width="6" height="1" fill="#e8e0d0" />
    {/* 杯柄 */}
    <rect x="7" y="9" width="2" height="3" fill="#a89060" />
    {/* 底座 */}
    <rect x="3" y="12" width="10" height="1" fill="#a89060" />
    <rect x="2" y="13" width="12" height="2" fill="#5c3a1f" />
  </Icon>
)

// ─── 流水线阶段图标 ───

/** 审稿 — 眼睛 */
export const IconReview = (p: IconProps) => (
  <Icon {...p}>
    <rect x="2" y="6" width="12" height="4" fill="#ede0c8" />
    <rect x="3" y="5" width="10" height="1" fill="#ede0c8" />
    <rect x="3" y="10" width="10" height="1" fill="#ede0c8" />
    {/* 眼眶 */}
    <rect x="2" y="6" width="1" height="4" fill="#2a1810" />
    <rect x="13" y="6" width="1" height="4" fill="#2a1810" />
    <rect x="3" y="5" width="10" height="1" fill="#2a1810" />
    <rect x="3" y="10" width="10" height="1" fill="#2a1810" />
    {/* 虹膜 */}
    <rect x="6" y="6" width="4" height="4" fill="#5a78a4" />
    {/* 瞳孔 */}
    <rect x="7" y="7" width="2" height="2" fill="#0a0806" />
    {/* 高光 */}
    <rect x="7" y="7" width="1" height="1" fill="#ffffff" />
  </Icon>
)

/** 编辑 — 铅笔 */
export const IconEdit = (p: IconProps) => (
  <Icon {...p}>
    {/* 笔尖 */}
    <rect x="2" y="11" width="2" height="2" fill="#5c3a1f" />
    <rect x="3" y="10" width="2" height="2" fill="#0a0806" />
    {/* 笔杆 */}
    <rect x="4" y="9" width="2" height="2" fill="#f5d878" />
    <rect x="5" y="8" width="2" height="2" fill="#f5d878" />
    <rect x="6" y="7" width="2" height="2" fill="#f5d878" />
    <rect x="7" y="6" width="2" height="2" fill="#f5d878" />
    <rect x="8" y="5" width="2" height="2" fill="#f5d878" />
    <rect x="9" y="4" width="2" height="2" fill="#f5d878" />
    {/* 橡皮 */}
    <rect x="10" y="3" width="3" height="3" fill="#a45a78" />
    {/* 金属箍 */}
    <rect x="10" y="3" width="3" height="1" fill="#b8763b" />
  </Icon>
)

/** 校对 — 放大镜 */
export const IconMagnifier = (p: IconProps) => (
  <Icon {...p}>
    {/* 镜身 */}
    <rect x="3" y="2" width="8" height="2" fill="#5c3a1f" />
    <rect x="2" y="4" width="10" height="6" fill="#5c3a1f" />
    <rect x="3" y="10" width="8" height="2" fill="#5c3a1f" />
    {/* 玻璃 */}
    <rect x="4" y="4" width="6" height="6" fill="#a4d4f0" />
    <rect x="4" y="3" width="6" height="1" fill="#a4d4f0" />
    <rect x="4" y="10" width="6" height="1" fill="#a4d4f0" />
    {/* 高光 */}
    <rect x="5" y="4" width="2" height="1" fill="#ffffff" />
    {/* 手柄 */}
    <rect x="10" y="11" width="2" height="2" fill="#5c3a1f" />
    <rect x="11" y="12" width="2" height="2" fill="#5c3a1f" />
    <rect x="12" y="13" width="2" height="2" fill="#5c3a1f" />
  </Icon>
)

/** 封面 — 调色板 */
export const IconPalette = (p: IconProps) => (
  <Icon {...p}>
    {/* 调色板形状 */}
    <rect x="2" y="3" width="10" height="9" fill="#e8d8b0" />
    <rect x="3" y="2" width="8" height="1" fill="#e8d8b0" />
    <rect x="2" y="12" width="9" height="1" fill="#e8d8b0" />
    {/* 颜料点 */}
    <rect x="4" y="5" width="2" height="2" fill="#8b1f1f" />
    <rect x="8" y="5" width="2" height="2" fill="#3b82f6" />
    <rect x="4" y="9" width="2" height="2" fill="#78a45a" />
    <rect x="8" y="9" width="2" height="2" fill="#a45a78" />
    {/* 拇指洞 */}
    <rect x="11" y="6" width="2" height="3" fill="#0a0806" />
    {/* 画笔 */}
    <rect x="12" y="11" width="1" height="3" fill="#5c3a1f" />
    <rect x="13" y="13" width="1" height="2" fill="#8b1f1f" />
  </Icon>
)

/** 付印 — 印刷机 */
export const IconPrinter = (p: IconProps) => (
  <Icon {...p}>
    {/* 顶部 */}
    <rect x="3" y="2" width="10" height="4" fill="#5c3a1f" />
    {/* 主体 */}
    <rect x="2" y="6" width="12" height="6" fill="#8a5828" />
    <rect x="2" y="6" width="12" height="1" fill="#b8763b" />
    {/* 红色指示灯 */}
    <rect x="11" y="8" width="2" height="2" fill="#8b1f1f" />
    {/* 纸张吐出 */}
    <rect x="3" y="12" width="10" height="3" fill="#ede0c8" />
    <rect x="4" y="13" width="6" height="1" fill="#5a4a38" />
    <rect x="4" y="14" width="4" height="1" fill="#5a4a38" />
  </Icon>
)

// ─── 征稿按钮图标 ───

/** 公开征稿 — 信封 */
export const IconEnvelope = (p: IconProps) => (
  <Icon {...p}>
    <rect x="1" y="3" width="14" height="10" fill="#ede0c8" />
    <rect x="1" y="3" width="14" height="1" fill="#d4c8a8" />
    {/* 信封折线 */}
    <rect x="1" y="4" width="2" height="1" fill="#a89072" />
    <rect x="3" y="5" width="2" height="1" fill="#a89072" />
    <rect x="5" y="6" width="2" height="1" fill="#a89072" />
    <rect x="7" y="7" width="2" height="1" fill="#a89072" />
    <rect x="9" y="6" width="2" height="1" fill="#a89072" />
    <rect x="11" y="5" width="2" height="1" fill="#a89072" />
    <rect x="13" y="4" width="2" height="1" fill="#a89072" />
    {/* 蜡封 */}
    <rect x="7" y="9" width="2" height="2" fill="#8b1f1f" />
    <rect x="6" y="10" width="4" height="1" fill="#8b1f1f" />
  </Icon>
)

/** 定向约稿 — 靶心 */
export const IconTarget = (p: IconProps) => (
  <Icon {...p}>
    <rect x="2" y="6" width="12" height="4" fill="#ede0c8" />
    <rect x="3" y="4" width="10" height="2" fill="#ede0c8" />
    <rect x="3" y="10" width="10" height="2" fill="#ede0c8" />
    <rect x="4" y="3" width="8" height="1" fill="#ede0c8" />
    <rect x="4" y="12" width="8" height="1" fill="#ede0c8" />
    {/* 红色环 */}
    <rect x="4" y="5" width="8" height="6" fill="#8b1f1f" />
    <rect x="5" y="4" width="6" height="8" fill="#8b1f1f" />
    {/* 中心白点 */}
    <rect x="6" y="6" width="4" height="4" fill="#ede0c8" />
    {/* 红心 */}
    <rect x="7" y="7" width="2" height="2" fill="#8b1f1f" />
  </Icon>
)

/** 加急 — 闪电 */
export const IconBolt = (p: IconProps) => (
  <Icon {...p}>
    <rect x="8" y="1" width="4" height="1" fill="#f5d878" />
    <rect x="7" y="2" width="4" height="1" fill="#f5d878" />
    <rect x="6" y="3" width="4" height="2" fill="#f5d878" />
    <rect x="5" y="5" width="5" height="1" fill="#f5d878" />
    <rect x="4" y="6" width="6" height="2" fill="#f5d878" />
    <rect x="6" y="8" width="5" height="1" fill="#ffd860" />
    <rect x="7" y="9" width="4" height="1" fill="#ffd860" />
    <rect x="8" y="10" width="3" height="2" fill="#ff8c1a" />
    <rect x="9" y="12" width="2" height="2" fill="#ff8c1a" />
    <rect x="10" y="14" width="1" height="1" fill="#ff8c1a" />
  </Icon>
)

/** 卷轴 / 出版额度 */
export const IconScroll = (p: IconProps) => (
  <Icon {...p}>
    {/* 上轴 */}
    <rect x="1" y="3" width="14" height="1" fill="#5c3a1f" />
    <rect x="1" y="4" width="14" height="1" fill="#3d2614" />
    {/* 卷轴主体 */}
    <rect x="2" y="5" width="12" height="6" fill="#e8d8b0" />
    {/* 文字线 */}
    <rect x="3" y="6" width="6" height="1" fill="#5a4a38" />
    <rect x="3" y="8" width="8" height="1" fill="#5a4a38" />
    <rect x="3" y="10" width="5" height="1" fill="#5a4a38" />
    {/* 下轴 */}
    <rect x="1" y="11" width="14" height="1" fill="#3d2614" />
    <rect x="1" y="12" width="14" height="1" fill="#5c3a1f" />
  </Icon>
)
