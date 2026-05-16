/**
 * 办公室房间像素艺术背景。
 *
 * 永夜出版社的开放式工位区——4 个部门工位 + 中央走廊 + 茶水间 + 通往各房间的门。
 * 同样 320×200 viewBox，xMidYMid slice 适配。
 */

interface OfficeSceneProps {
  /** 部门数量（0-4），影响有几张桌子上有"忙碌"指示 */
  activeDepts?: number
}

export function OfficeScene({ activeDepts = 0 }: OfficeSceneProps) {
  return (
    <svg
      viewBox="0 0 320 200"
      preserveAspectRatio="xMidYMid slice"
      shapeRendering="crispEdges"
      className="w-full h-full"
      style={{ imageRendering: 'pixelated' }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* ─── 背景：石墙 + 木地板 ─── */}
      <rect width="320" height="120" fill="#1a0e08" />
      {/* 砖石墙图案 */}
      <g fill="#2a1812">
        {[2, 28].map(y =>
          [0, 36, 72, 108, 144, 180, 216, 252, 288].map(x => (
            <rect key={`${x}-${y}`} x={x} y={y} width="34" height="24" />
          ))
        )}
        {[15].map(y =>
          [0, 18, 54, 90, 126, 162, 198, 234, 270, 306].map((x, i) => (
            <rect key={`${x}-${y}`} x={x} y={y} width={i === 0 ? 16 : 34} height="11" />
          ))
        )}
      </g>

      {/* ─── 木地板（透视带）─── */}
      <rect x="0" y="120" width="320" height="80" fill="#3d2614" />
      <g stroke="#2a1810" strokeWidth="0.5">
        {[130, 145, 160, 175, 190].map(y => (
          <line key={y} x1="0" y1={y} x2="320" y2={y} />
        ))}
      </g>
      <g stroke="#5c3a1f" strokeWidth="0.3" opacity="0.5">
        {[40, 100, 160, 220, 280].map(x => (
          <line key={x} x1={x} y1="120" x2={x} y2="200" />
        ))}
      </g>

      {/* ─── 中央地毯（暗示主走廊）─── */}
      <rect x="100" y="145" width="120" height="50" fill="#5c2018" opacity="0.6" />
      <rect x="104" y="149" width="112" height="42" fill="none" stroke="#8b3020" strokeWidth="0.5" opacity="0.7" />

      {/* ─── 4 部门工位（背墙边一字排开）─── */}
      {/* 编辑部 */}
      <g data-dept="editing">
        <rect x="14" y="60" width="50" height="32" fill="#4a2f18" />
        <rect x="14" y="58" width="50" height="3" fill="#5c3a1f" />
        <rect x="14" y="92" width="50" height="3" fill="#2a1810" />
        {/* 桌面 */}
        <rect x="18" y="68" width="20" height="14" fill="#ede0c8" />
        <rect x="40" y="70" width="12" height="6" fill="#0a0806" />
        {activeDepts >= 1 && (
          <>
            <rect x="22" y="74" width="14" height="1" fill="#5a4a38" />
            <rect x="22" y="76" width="10" height="1" fill="#5a4a38" />
          </>
        )}
      </g>

      {/* 设计部 */}
      <g data-dept="design">
        <rect x="84" y="60" width="50" height="32" fill="#4a2f18" />
        <rect x="84" y="58" width="50" height="3" fill="#5c3a1f" />
        <rect x="84" y="92" width="50" height="3" fill="#2a1810" />
        <rect x="92" y="68" width="32" height="16" fill="#a45a78" />
        {activeDepts >= 2 && (
          <rect x="96" y="72" width="24" height="8" fill="#6b1a18" />
        )}
      </g>

      {/* 市场部 */}
      <g data-dept="marketing">
        <rect x="184" y="60" width="50" height="32" fill="#4a2f18" />
        <rect x="184" y="58" width="50" height="3" fill="#5c3a1f" />
        <rect x="184" y="92" width="50" height="3" fill="#2a1810" />
        {/* 海报/喇叭 */}
        <rect x="192" y="65" width="14" height="22" fill="#d4a85a" />
        <rect x="194" y="67" width="10" height="2" fill="#0a0806" />
        <rect x="194" y="71" width="10" height="1" fill="#0a0806" />
        {activeDepts >= 3 && (
          <rect x="210" y="68" width="18" height="16" fill="#3b82f6" />
        )}
      </g>

      {/* 版权部 */}
      <g data-dept="rights">
        <rect x="254" y="60" width="50" height="32" fill="#4a2f18" />
        <rect x="254" y="58" width="50" height="3" fill="#5c3a1f" />
        <rect x="254" y="92" width="50" height="3" fill="#2a1810" />
        {/* 卷轴 */}
        <rect x="262" y="70" width="14" height="2" fill="#5c3a1f" />
        <rect x="262" y="72" width="14" height="10" fill="#ede0c8" />
        <rect x="262" y="82" width="14" height="2" fill="#5c3a1f" />
        {activeDepts >= 4 && (
          <rect x="280" y="68" width="18" height="16" fill="#78a45a" />
        )}
      </g>

      {/* ─── 茶水间（右下角）─── */}
      <g data-area="tearoom">
        {/* 柜台 */}
        <rect x="260" y="155" width="56" height="20" fill="#4a2f18" />
        <rect x="260" y="153" width="56" height="3" fill="#5c3a1f" />
        {/* 血浆温热柜 */}
        <rect x="266" y="138" width="16" height="20" fill="#0a0806" />
        <rect x="268" y="142" width="12" height="6" fill="#6b1a18" />
        <rect x="269" y="140" width="2" height="1" fill="#d4b85a" />
        {/* "可疑红茶"罐 */}
        <rect x="290" y="142" width="12" height="14" fill="#8b3020" />
        <rect x="290" y="142" width="12" height="2" fill="#a04030" />
      </g>

      {/* ─── 左侧门：通往桌面（你的办公室）─── */}
      <g data-door="desk">
        <rect x="0" y="100" width="14" height="60" fill="#0a0806" />
        <rect x="2" y="104" width="10" height="52" fill="#4a2f18" />
        <rect x="2" y="104" width="10" height="2" fill="#5c3a1f" />
        <rect x="9" y="130" width="2" height="3" fill="#d4a85a" />
      </g>

      {/* ─── 右上门：通往书架 ─── */}
      {/* 不画门，因为侧门用 CorridorDoor 组件实现 */}

      {/* ─── 中央装饰：永夜出版社标志（地毯中央）─── */}
      <g data-area="logo">
        <text
          x="160" y="180"
          textAnchor="middle"
          fill="#d4a85a"
          fontFamily="serif"
          fontSize="8"
          opacity="0.6"
        >永夜出版社</text>
      </g>

      {/* ─── 油灯（顶部吊灯，散播光晕）─── */}
      <g data-area="chandelier">
        <ellipse cx="160" cy="65" rx="80" ry="32" fill="#f5d878" opacity="0.06" />
        <ellipse cx="160" cy="65" rx="40" ry="16" fill="#f5d878" opacity="0.08" />
        <rect x="158" y="0" width="4" height="40" fill="#2a1810" />
        <rect x="152" y="40" width="16" height="6" fill="#b8763b" />
        <rect x="156" y="46" width="8" height="6" fill="#ff8c1a" />
        <rect x="158" y="44" width="4" height="3" fill="#ffd860" />
      </g>

      {/* ─── 部门名称标签 ─── */}
      <g fontFamily="serif" fontSize="7" fill="#d4a85a" opacity="0.7">
        <text x="39" y="106" textAnchor="middle">编辑部</text>
        <text x="109" y="106" textAnchor="middle">设计部</text>
        <text x="209" y="106" textAnchor="middle">市场部</text>
        <text x="279" y="106" textAnchor="middle">版权部</text>
      </g>
    </svg>
  )
}
