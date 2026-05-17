/**
 * 书房像素场景：私人阅读厅。
 *
 * - 高背皮质扶手椅（中央偏左）
 * - 壁炉（背墙中央，带跳动的火）
 * - 落地灯（椅旁）
 * - 个人书架（右侧，矮一些）
 * - 窗户（带雨滴效果）
 * - 旧地毯
 */

interface StudySceneProps {
  /** 是否有炉火（可与某种"舒适度"或时间挂钩，默认 true）*/
  fireBurning?: boolean
}

export function StudyScene({ fireBurning = true }: StudySceneProps) {
  return (
    <svg
      viewBox="0 0 320 200"
      preserveAspectRatio="xMidYMid slice"
      shapeRendering="crispEdges"
      className="w-full h-full"
      style={{ imageRendering: 'pixelated' }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 暖色墙面（与其他房间区分） */}
      <rect width="320" height="140" fill="#2a1812" />
      <g fill="#3d241a">
        {[2, 28].map(y =>
          [0, 36, 72, 108, 144, 180, 216, 252, 288].map(x => (
            <rect key={`${x}-${y}`} x={x} y={y} width="34" height="22" />
          ))
        )}
      </g>

      {/* ─── 窗户（左上，带雨滴）─── */}
      <g data-area="rain-window">
        <rect x="22" y="22" width="50" height="50" fill="#0a0806" />
        <rect x="24" y="24" width="46" height="46" fill="#1a1510" />
        <rect x="26" y="26" width="42" height="42" fill="#1a1f3a" />
        {/* 雨滴斜线 */}
        <g stroke="#a4c4d8" strokeWidth="0.5" opacity="0.5">
          <line x1="28" y1="28" x2="30" y2="34" />
          <line x1="36" y1="30" x2="38" y2="36" />
          <line x1="46" y1="28" x2="48" y2="34" />
          <line x1="56" y1="32" x2="58" y2="38" />
          <line x1="32" y1="42" x2="34" y2="48" />
          <line x1="50" y1="44" x2="52" y2="50" />
          <line x1="42" y1="52" x2="44" y2="58" />
          <line x1="60" y1="48" x2="62" y2="54" />
        </g>
        {/* 十字框 */}
        <rect x="46" y="22" width="2" height="50" fill="#0a0806" />
        <rect x="22" y="46" width="50" height="2" fill="#0a0806" />
      </g>

      {/* ─── 壁炉（背墙中央）─── */}
      <g data-area="fireplace">
        {/* 烟囱 */}
        <rect x="138" y="20" width="44" height="20" fill="#3d2614" />
        <rect x="136" y="40" width="48" height="6" fill="#5c3a1f" />
        {/* 炉膛外壳 */}
        <rect x="130" y="46" width="60" height="50" fill="#3d2614" />
        <rect x="130" y="46" width="60" height="3" fill="#5c3a1f" />
        {/* 炉膛内壁 */}
        <rect x="138" y="54" width="44" height="38" fill="#0a0806" />
        {/* 木柴 */}
        <rect x="144" y="80" width="32" height="4" fill="#5c3a1f" />
        <rect x="148" y="76" width="6" height="4" fill="#5c3a1f" />
        <rect x="158" y="74" width="8" height="6" fill="#5c3a1f" />
        <rect x="166" y="78" width="6" height="2" fill="#5c3a1f" />
        {/* 火焰 */}
        {fireBurning && (
          <>
            <rect x="150" y="68" width="20" height="10" fill="#ff8c1a" />
            <rect x="152" y="64" width="16" height="6" fill="#ffd860" />
            <rect x="156" y="60" width="8" height="6" fill="#fff0a8" />
            <rect x="158" y="56" width="4" height="6" fill="#ffd860" />
            {/* 火星 */}
            <rect x="151" y="56" width="1" height="1" fill="#ffd860" opacity="0.8" />
            <rect x="168" y="58" width="1" height="1" fill="#ffd860" opacity="0.8" />
            {/* 光晕 */}
            <ellipse cx="160" cy="74" rx="60" ry="30" fill="#ff8c1a" opacity="0.10" />
            <ellipse cx="160" cy="74" rx="38" ry="20" fill="#f5d878" opacity="0.12" />
          </>
        )}
        {/* 壁炉架 */}
        <rect x="124" y="42" width="72" height="4" fill="#5c3a1f" />
        <rect x="124" y="42" width="72" height="1" fill="#6e4a2a" />
        {/* 架上摆件 */}
        <rect x="132" y="36" width="4" height="6" fill="#b8763b" />
        <rect x="184" y="36" width="4" height="6" fill="#b8763b" />
        {/* 中央壁挂烛台 */}
        <rect x="158" y="32" width="4" height="10" fill="#8a5828" />
        <rect x="159" y="28" width="2" height="4" fill="#ede0c8" />
        <rect x="159" y="26" width="2" height="2" fill="#ff8c1a" />
      </g>

      {/* ─── 木地板 ─── */}
      <rect x="0" y="140" width="320" height="60" fill="#3d2614" />
      <g stroke="#2a1810" strokeWidth="0.5">
        {[150, 165, 180, 195].map(y => (
          <line key={y} x1="0" y1={y} x2="320" y2={y} />
        ))}
      </g>

      {/* ─── 旧波斯地毯（壁炉前）─── */}
      <rect x="100" y="150" width="120" height="40" fill="#5c2018" opacity="0.85" />
      <rect x="104" y="154" width="112" height="32" fill="none" stroke="#8b3020" strokeWidth="0.7" />
      <rect x="108" y="158" width="104" height="24" fill="none" stroke="#3a0808" strokeWidth="0.5" />
      {/* 地毯纹路 */}
      {[120, 140, 160, 180, 200].map(x => (
        <rect key={x} x={x} y="168" width="3" height="3" fill="#8b3020" opacity="0.5" />
      ))}

      {/* ─── 高背扶手椅（左中）─── */}
      <g data-area="armchair">
        {/* 阴影 */}
        <rect x="48" y="192" width="50" height="3" fill="#0a0806" opacity="0.3" />
        {/* 椅背 */}
        <rect x="58" y="110" width="32" height="56" fill="#5c2018" />
        <rect x="58" y="110" width="32" height="3" fill="#8b3020" />
        <rect x="58" y="110" width="3" height="56" fill="#3a0808" />
        {/* 扶手 */}
        <rect x="48" y="140" width="12" height="32" fill="#5c2018" />
        <rect x="88" y="140" width="12" height="32" fill="#5c2018" />
        <rect x="48" y="140" width="12" height="3" fill="#8b3020" />
        <rect x="88" y="140" width="12" height="3" fill="#8b3020" />
        {/* 坐垫 */}
        <rect x="50" y="160" width="48" height="14" fill="#6c2820" />
        <rect x="50" y="160" width="48" height="2" fill="#8b3020" />
        {/* 腿 */}
        <rect x="50" y="174" width="3" height="18" fill="#3d2614" />
        <rect x="95" y="174" width="3" height="18" fill="#3d2614" />
        {/* 椅面上一本翻开的书 */}
        <rect x="68" y="158" width="12" height="3" fill="#ede0c8" />
        <rect x="73" y="158" width="2" height="3" fill="#5c0f0f" />
      </g>

      {/* ─── 落地灯（椅旁右侧）─── */}
      <g data-area="floor-lamp">
        {/* 底座 */}
        <rect x="110" y="186" width="10" height="3" fill="#5c3a1f" />
        <rect x="108" y="189" width="14" height="3" fill="#3d2614" />
        {/* 灯柱 */}
        <rect x="114" y="118" width="2" height="68" fill="#5c3a1f" />
        {/* 灯罩 */}
        <rect x="106" y="106" width="18" height="12" fill="#b8763b" />
        <rect x="104" y="108" width="22" height="2" fill="#8a5828" />
        <rect x="108" y="118" width="14" height="2" fill="#8a5828" />
        {/* 灯泡 */}
        <rect x="113" y="116" width="4" height="3" fill="#fff0a8" />
        {/* 光晕 */}
        <ellipse cx="115" cy="116" rx="40" ry="22" fill="#f5d878" opacity="0.15" />
      </g>

      {/* ─── 个人书架（右侧，矮架）─── */}
      <g data-area="personal-shelf">
        <rect x="244" y="100" width="60" height="80" fill="#3d2614" />
        <rect x="244" y="100" width="60" height="2" fill="#5c3a1f" />
        {[124, 148, 172].map(y => (
          <rect key={y} x="246" y={y} width="56" height="2" fill="#2a1810" />
        ))}
        {/* 书脊 */}
        {[252, 263, 274, 285, 296].map((x, i) => (
          <rect key={x} x={x} y={104 + (i % 2) * 2} width="9" height={18 + (i % 3) * 2} fill={['#5a78a4', '#a45a78', '#78a45a', '#a47828', '#8b1f1f'][i]} />
        ))}
        {[252, 263, 274, 285, 296].map((x, i) => (
          <rect key={`b-${x}`} x={x} y={128 + (i % 2) * 2} width="9" height={18} fill={['#a47828', '#8b1f1f', '#5a78a4', '#a45a78', '#78a45a'][i]} />
        ))}
        {/* 最下排：装饰品 */}
        <rect x="252" y="156" width="14" height="14" fill="#0a0806" />
        <rect x="254" y="158" width="10" height="2" fill="#d4a85a" />
        <rect x="280" y="156" width="18" height="14" fill="#b8763b" />
      </g>
    </svg>
  )
}
