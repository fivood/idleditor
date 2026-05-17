/**
 * 书架房间像素艺术背景：永夜出版社的藏书阁。
 *
 * - 三面高书墙（顶天立地的书脊）
 * - 染色玻璃拱顶窗（红/金/蓝/绿四扇）
 * - 旋转梯子（左侧）
 * - 阅读桌 + 绿罩台灯（前景）
 * - 月光从窗户漏进来形成光柱
 */

interface ShelfSceneProps {
  /** 已出版书数量，0/1-10/11-30/30+ 影响书架填充密度 */
  bookCount?: number
}

export function ShelfScene({ bookCount = 0 }: ShelfSceneProps) {
  const density: 0 | 1 | 2 | 3 =
    bookCount === 0 ? 0 :
    bookCount <= 10 ? 1 :
    bookCount <= 30 ? 2 : 3

  return (
    <svg
      viewBox="0 0 320 200"
      preserveAspectRatio="xMidYMid slice"
      shapeRendering="crispEdges"
      className="w-full h-full"
      style={{ imageRendering: 'pixelated' }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* ─── 背景：深石墙 ─── */}
      <rect width="320" height="170" fill="#1a0e08" />
      <g fill="#2a1812">
        {[2, 30].map(y =>
          [0, 36, 72, 108, 144, 180, 216, 252, 288].map(x => (
            <rect key={`${x}-${y}`} x={x} y={y} width="34" height="24" />
          ))
        )}
      </g>

      {/* ─── 染色玻璃拱顶窗（中央）─── */}
      <g data-area="rose-window">
        {/* 外框（石材） */}
        <rect x="118" y="14" width="84" height="60" fill="#0a0806" />
        <rect x="120" y="16" width="80" height="56" fill="#3d2614" />
        {/* 内框 */}
        <rect x="124" y="20" width="72" height="48" fill="#0a0806" />
        {/* 四扇染色玻璃 */}
        <rect x="126" y="22" width="34" height="22" fill="#8b1f1f" />
        <rect x="162" y="22" width="34" height="22" fill="#f5d878" />
        <rect x="126" y="46" width="34" height="22" fill="#3a8a3a" />
        <rect x="162" y="46" width="34" height="22" fill="#5a78a4" />
        {/* 玻璃高光 */}
        <rect x="128" y="24" width="6" height="2" fill="#d4a85a" opacity="0.5" />
        <rect x="164" y="24" width="6" height="2" fill="#fff8e8" opacity="0.5" />
        <rect x="128" y="48" width="6" height="2" fill="#a4d478" opacity="0.4" />
        <rect x="164" y="48" width="6" height="2" fill="#a4c4d8" opacity="0.5" />
        {/* 十字框 */}
        <rect x="160" y="22" width="2" height="46" fill="#0a0806" />
        <rect x="126" y="44" width="70" height="2" fill="#0a0806" />
      </g>

      {/* ─── 月光柱（从窗户漏下来）─── */}
      <g data-area="moonbeam">
        <polygon points="124,68 196,68 230,170 90,170" fill="#f5d878" opacity="0.05" />
        <polygon points="140,68 180,68 200,170 120,170" fill="#f5d878" opacity="0.04" />
      </g>

      {/* ─── 左侧书架（背墙）─── */}
      <Bookshelf x={2} density={density} bookSeed={0} />

      {/* ─── 右侧书架 ─── */}
      <Bookshelf x={222} density={density} bookSeed={50} />

      {/* ─── 木地板 ─── */}
      <rect x="0" y="170" width="320" height="30" fill="#3d2614" />
      <g stroke="#2a1810" strokeWidth="0.5">
        {[178, 188, 198].map(y => (
          <line key={y} x1="0" y1={y} x2="320" y2={y} />
        ))}
      </g>
      <g stroke="#5c3a1f" strokeWidth="0.3" opacity="0.5">
        {[50, 120, 200, 270].map(x => (
          <line key={x} x1={x} y1="170" x2={x} y2="200" />
        ))}
      </g>

      {/* ─── 红地毯（中央甬道）─── */}
      <rect x="100" y="175" width="120" height="22" fill="#5c2018" opacity="0.7" />
      <rect x="104" y="179" width="112" height="14" fill="none" stroke="#8b3020" strokeWidth="0.5" opacity="0.6" />

      {/* ─── 阅读桌 + 绿罩台灯（前景中央）─── */}
      <g data-area="reading-desk">
        {/* 桌面 */}
        <rect x="124" y="158" width="72" height="14" fill="#4a2f18" />
        <rect x="124" y="158" width="72" height="2" fill="#6e4a2a" />
        <rect x="124" y="172" width="72" height="3" fill="#2a1810" />
        {/* 桌腿 */}
        <rect x="126" y="175" width="3" height="22" fill="#3d2614" />
        <rect x="191" y="175" width="3" height="22" fill="#3d2614" />
        {/* 一本翻开的书 */}
        <rect x="138" y="156" width="20" height="3" fill="#5c0f0f" />
        <rect x="139" y="153" width="18" height="3" fill="#ede0c8" />
        <rect x="147" y="153" width="2" height="3" fill="#5c0f0f" />
        {/* 绿罩台灯 */}
        <rect x="173" y="148" width="14" height="6" fill="#3a6b3a" />
        <rect x="173" y="146" width="14" height="2" fill="#5a8a5a" />
        <rect x="179" y="154" width="2" height="6" fill="#5c3a1f" />
        <rect x="176" y="160" width="8" height="2" fill="#5c3a1f" />
        {/* 灯光晕 */}
        <ellipse cx="180" cy="160" rx="22" ry="12" fill="#f5d878" opacity="0.18" />
      </g>

      {/* ─── 旋转梯子（左侧，木质）─── */}
      <g data-area="ladder">
        {/* 两根立柱 */}
        <rect x="60" y="60" width="2" height="110" fill="#5c3a1f" />
        <rect x="76" y="60" width="2" height="110" fill="#5c3a1f" />
        {/* 梯级 */}
        {[80, 100, 120, 140, 160].map(y => (
          <rect key={y} x="62" y={y} width="14" height="2" fill="#4a2f18" />
        ))}
        {/* 顶部滑轨 */}
        <rect x="58" y="58" width="22" height="2" fill="#8a5828" />
      </g>

      {/* ─── 烛台（角落）─── */}
      <g data-area="candle">
        <rect x="284" y="166" width="6" height="4" fill="#8a5828" />
        <rect x="285" y="158" width="4" height="8" fill="#ede0c8" />
        <rect x="286" y="154" width="2" height="4" fill="#ff8c1a" />
        <rect x="286" y="152" width="2" height="2" fill="#ffd860" />
        {/* 光晕 */}
        <ellipse cx="287" cy="156" rx="14" ry="10" fill="#f5d878" opacity="0.10" />
      </g>
    </svg>
  )
}

/**
 * 单座书架：从 x 位置开始，4 行书脊
 * density 决定每行有多少本书
 */
function Bookshelf({ x, density, bookSeed }: { x: number; density: 0 | 1 | 2 | 3; bookSeed: number }) {
  // 每行最多 8 本书的位置
  const positions: number[] = []
  for (let i = 0; i < 8; i++) positions.push(x + 6 + i * 11)
  const colors = ['#5a78a4', '#a45a78', '#78a45a', '#a47828', '#8b1f1f', '#3a6b8a', '#7a5a98', '#5c8a5c']
  const heights = [22, 24, 20, 26, 22, 24, 20, 22, 24, 22, 20, 24]

  // density: 0=空架, 1=3本/行, 2=6本/行, 3=8本/行
  const booksPerRow = density === 0 ? 0 : density === 1 ? 3 : density === 2 ? 6 : 8

  return (
    <g data-object="bookshelf">
      {/* 架子外框 */}
      <rect x={x} y="40" width="96" height="130" fill="#3d2614" />
      <rect x={x} y="40" width="96" height="2" fill="#5c3a1f" />
      {/* 4 排隔板 */}
      {[68, 96, 124, 152].map(y => (
        <rect key={y} x={x + 2} y={y} width="92" height="2" fill="#2a1810" />
      ))}
      {/* 书脊 */}
      {[42, 70, 98, 126].map((rowY, rowIdx) => {
        const visibleBooks = positions.slice(0, booksPerRow)
        return visibleBooks.map((px, i) => {
          const seed = (bookSeed + rowIdx * 10 + i) % colors.length
          const h = heights[(bookSeed + rowIdx * 10 + i) % heights.length]
          const top = rowY + (26 - h)
          return (
            <g key={`${px}-${rowIdx}`}>
              <rect x={px} y={top} width="9" height={h} fill={colors[seed]} />
              <rect x={px} y={top} width="9" height="1" fill="#0a0806" opacity="0.5" />
              {/* 烫金细线（仅高书脊） */}
              {h >= 22 && (
                <>
                  <rect x={px + 1} y={top + 4} width="7" height="1" fill="#d4a85a" opacity="0.5" />
                  <rect x={px + 1} y={top + h - 5} width="7" height="1" fill="#d4a85a" opacity="0.5" />
                </>
              )}
            </g>
          )
        })
      })}
    </g>
  )
}
