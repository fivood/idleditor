/**
 * 档案室像素场景。
 *
 * - 三面文件柜墙（密集排列的抽屉）
 * - 中央账本桌（开着大账本 + 鹅毛笔 + 蜡烛）
 * - 蜡封卷轴挂在右侧墙
 * - 顶部单盏吊灯
 */

interface ArchiveSceneProps {
  /** 出版总数，影响"满"档案柜的数量 */
  totalPublished?: number
}

export function ArchiveScene({ totalPublished = 0 }: ArchiveSceneProps) {
  return (
    <svg
      viewBox="0 0 320 200"
      preserveAspectRatio="xMidYMid slice"
      shapeRendering="crispEdges"
      className="w-full h-full"
      style={{ imageRendering: 'pixelated' }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 深色背墙 */}
      <rect width="320" height="170" fill="#1a0e08" />

      {/* ─── 背墙文件柜（5 列 × 5 行抽屉）─── */}
      <g data-area="back-cabinets">
        {Array.from({ length: 5 }).map((_, col) =>
          Array.from({ length: 5 }).map((_, row) => {
            const x = 14 + col * 58
            const y = 14 + row * 28
            const drawerIdx = row * 5 + col
            const isFilled = drawerIdx * 5 < totalPublished
            return (
              <g key={`${col}-${row}`}>
                {/* 抽屉外框 */}
                <rect x={x} y={y} width="54" height="24" fill="#4a2f18" />
                <rect x={x} y={y} width="54" height="2" fill="#5c3a1f" />
                <rect x={x + 1} y={y + 1} width="52" height="22" fill="#3d2614" />
                {/* 拉手（铜色） */}
                <rect x={x + 22} y={y + 12} width="10" height="3" fill="#b8763b" />
                <rect x={x + 23} y={y + 12} width="8" height="1" fill="#d4a85a" />
                {/* 标签 */}
                <rect x={x + 4} y={y + 4} width="14" height="4" fill={isFilled ? '#d4a85a' : '#5c4a3a'} />
                {/* 填充指示线 */}
                {isFilled && (
                  <>
                    <rect x={x + 5} y={y + 5} width="6" height="1" fill="#0a0806" />
                    <rect x={x + 5} y={y + 7} width="4" height="1" fill="#0a0806" />
                  </>
                )}
              </g>
            )
          })
        )}
      </g>

      {/* ─── 木地板 ─── */}
      <rect x="0" y="170" width="320" height="30" fill="#3d2614" />
      <g stroke="#2a1810" strokeWidth="0.5">
        {[178, 188, 198].map(y => (
          <line key={y} x1="0" y1={y} x2="320" y2={y} />
        ))}
      </g>

      {/* ─── 中央账本桌（前景）─── */}
      <g data-area="ledger-desk">
        {/* 桌面 */}
        <rect x="100" y="158" width="120" height="14" fill="#4a2f18" />
        <rect x="100" y="158" width="120" height="2" fill="#6e4a2a" />
        <rect x="100" y="172" width="120" height="3" fill="#2a1810" />
        {/* 桌腿 */}
        <rect x="104" y="175" width="3" height="22" fill="#3d2614" />
        <rect x="213" y="175" width="3" height="22" fill="#3d2614" />
        {/* 大账本（翻开） */}
        <rect x="124" y="148" width="32" height="10" fill="#5c0f0f" />
        <rect x="124" y="146" width="32" height="2" fill="#8b1f1f" />
        <rect x="126" y="145" width="14" height="3" fill="#ede0c8" />
        <rect x="142" y="145" width="14" height="3" fill="#ede0c8" />
        {/* 页面文字线 */}
        <rect x="128" y="146" width="10" height="1" fill="#5a4a38" opacity="0.7" />
        <rect x="144" y="146" width="10" height="1" fill="#5a4a38" opacity="0.7" />
        {/* 鹅毛笔斜放 */}
        <rect x="170" y="156" width="1" height="2" fill="#d4c8b0" />
        <rect x="171" y="152" width="1" height="4" fill="#f0e8d8" />
        <rect x="172" y="148" width="1" height="4" fill="#f0e8d8" />
        {/* 蜡烛（桌右） */}
        <rect x="200" y="150" width="4" height="8" fill="#ede0c8" />
        <rect x="201" y="146" width="2" height="4" fill="#ff8c1a" />
        <rect x="201" y="144" width="2" height="2" fill="#ffd860" />
        {/* 蜡烛底座 */}
        <rect x="198" y="158" width="8" height="3" fill="#8a5828" />
        {/* 蜡烛光晕 */}
        <ellipse cx="202" cy="152" rx="32" ry="20" fill="#f5d878" opacity="0.10" />
      </g>

      {/* ─── 蜡封卷轴（右墙挂着）─── */}
      <g data-area="hanging-scrolls">
        {[60, 86, 112].map((y, i) => (
          <g key={y}>
            {/* 挂绳 */}
            <rect x="298" y={y - 4} width="1" height="4" fill="#5c3a1f" />
            {/* 卷轴 */}
            <rect x="291" y={y} width="14" height="20" fill="#ede0c8" />
            <rect x="291" y={y} width="14" height="1" fill="#d4c8a8" />
            {/* 蜡封 */}
            <rect x="295" y={y + 8} width="6" height="6" fill={i === 0 ? '#8b1f1f' : i === 1 ? '#3a0808' : '#5c0f0f'} />
            <rect x="296" y={y + 9} width="4" height="4" fill="#5c0f0f" />
          </g>
        ))}
      </g>

      {/* ─── 吊灯（顶部正中）─── */}
      <g data-area="ceiling-lamp">
        <rect x="158" y="0" width="4" height="20" fill="#0a0806" />
        <rect x="152" y="20" width="16" height="4" fill="#3d2614" />
        <rect x="154" y="24" width="12" height="3" fill="#b8763b" />
        <rect x="156" y="27" width="8" height="3" fill="#ff8c1a" />
        {/* 光晕 */}
        <ellipse cx="160" cy="26" rx="80" ry="20" fill="#f5d878" opacity="0.08" />
      </g>
    </svg>
  )
}
