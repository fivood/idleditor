/**
 * 作者接待室像素场景。
 *
 * - 圆桌中央（带茶具）
 * - 4 张椅子环绕
 * - 后墙挂 4 幅作家肖像（已签作家用铜框/未签灰框）
 * - 木地板 + 圆形红毯
 * - 落地烛台（角落）
 * - 暗色拱墙
 */

interface AuthorsSceneProps {
  /** 已签作者数量，影响肖像墙上"亮"的画框数 */
  signedCount?: number
}

export function AuthorsScene({ signedCount = 0 }: AuthorsSceneProps) {
  return (
    <svg
      viewBox="0 0 320 200"
      preserveAspectRatio="xMidYMid slice"
      shapeRendering="crispEdges"
      className="w-full h-full"
      style={{ imageRendering: 'pixelated' }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* ─── 背景：拱墙 ─── */}
      <rect width="320" height="140" fill="#1a0e08" />
      <g fill="#2a1812">
        {[2, 28].map(y =>
          [0, 36, 72, 108, 144, 180, 216, 252, 288].map(x => (
            <rect key={`${x}-${y}`} x={x} y={y} width="34" height="22" />
          ))
        )}
      </g>

      {/* ─── 后墙肖像画（4 幅）─── */}
      {[40, 100, 160, 220].map((x, i) => {
        const isSigned = i < signedCount
        return (
          <g key={x} data-portrait={i}>
            {/* 画框 */}
            <rect x={x} y="42" width="40" height="48" fill={isSigned ? '#b8763b' : '#5c3a1f'} />
            <rect x={x + 2} y="44" width="36" height="44" fill="#3d2614" />
            {/* 肖像背景 */}
            <rect x={x + 4} y="46" width="32" height="40" fill={isSigned ? '#5c2018' : '#2a1810'} />
            {/* 人物轮廓（简化） */}
            <rect x={x + 14} y="52" width="12" height="12" fill={isSigned ? '#d4c8b0' : '#5c4a3a'} />
            <rect x={x + 12} y="66" width="16" height="18" fill={isSigned ? '#0a0806' : '#3d2614'} />
            {/* 铜牌（仅已签） */}
            {isSigned && (
              <>
                <rect x={x + 12} y="85" width="16" height="3" fill="#d4a85a" />
                <rect x={x + 13} y="86" width="14" height="1" fill="#0a0806" />
              </>
            )}
            {/* 高光（铜框） */}
            {isSigned && <rect x={x} y="42" width="40" height="1" fill="#f5d878" opacity="0.6" />}
          </g>
        )
      })}

      {/* ─── 木地板 + 圆形红毯 ─── */}
      <rect x="0" y="140" width="320" height="60" fill="#3d2614" />
      <g stroke="#2a1810" strokeWidth="0.5">
        {[150, 165, 180, 195].map(y => (
          <line key={y} x1="0" y1={y} x2="320" y2={y} />
        ))}
      </g>
      {/* 圆形红毯 */}
      <ellipse cx="160" cy="172" rx="80" ry="22" fill="#5c2018" opacity="0.8" />
      <ellipse cx="160" cy="172" rx="70" ry="18" fill="none" stroke="#8b3020" strokeWidth="0.8" opacity="0.7" />
      <ellipse cx="160" cy="172" rx="50" ry="14" fill="none" stroke="#8b3020" strokeWidth="0.5" opacity="0.5" />

      {/* ─── 中央圆桌 + 茶具 ─── */}
      <g data-area="round-table">
        {/* 桌面（椭圆俯视）*/}
        <ellipse cx="160" cy="160" rx="38" ry="13" fill="#5c3a1f" />
        <ellipse cx="160" cy="159" rx="38" ry="13" fill="#6e4a2a" />
        <ellipse cx="160" cy="158" rx="32" ry="10" fill="#8a5828" />
        {/* 桌脚（中心立柱）*/}
        <rect x="156" y="171" width="8" height="20" fill="#3d2614" />
        <rect x="148" y="190" width="24" height="4" fill="#3d2614" />
        {/* 茶壶 */}
        <rect x="148" y="148" width="10" height="8" fill="#0a0806" />
        <rect x="146" y="152" width="2" height="3" fill="#0a0806" />
        <rect x="158" y="146" width="2" height="2" fill="#0a0806" />
        {/* 蒸汽 */}
        <rect x="151" y="142" width="1" height="2" fill="#a09080" opacity="0.5" />
        <rect x="153" y="138" width="1" height="2" fill="#a09080" opacity="0.4" />
        {/* 两个茶杯 */}
        <rect x="166" y="154" width="5" height="4" fill="#e8e0d0" />
        <rect x="167" y="154" width="3" height="2" fill="#6b1a18" />
        <rect x="178" y="154" width="5" height="4" fill="#e8e0d0" />
      </g>

      {/* ─── 4 把椅子 ─── */}
      {/* 左前椅 */}
      <Chair x={94} y={165} facing="right" />
      {/* 右前椅 */}
      <Chair x={210} y={165} facing="left" />
      {/* 后椅 1（半透明，暗示远）*/}
      <Chair x={130} y={145} facing="down" small />
      {/* 后椅 2 */}
      <Chair x={184} y={145} facing="down" small />

      {/* ─── 落地烛台（右角）─── */}
      <g data-area="candelabra">
        {/* 主杆 */}
        <rect x="296" y="98" width="2" height="80" fill="#8a5828" />
        <rect x="294" y="178" width="6" height="2" fill="#5c3a1f" />
        <rect x="292" y="180" width="10" height="2" fill="#3d2614" />
        {/* 三支蜡烛 */}
        <rect x="285" y="98" width="2" height="6" fill="#ede0c8" />
        <rect x="296" y="92" width="2" height="6" fill="#ede0c8" />
        <rect x="307" y="98" width="2" height="6" fill="#ede0c8" />
        {/* 火苗 */}
        <rect x="285" y="95" width="2" height="3" fill="#ff8c1a" />
        <rect x="296" y="89" width="2" height="3" fill="#ff8c1a" />
        <rect x="307" y="95" width="2" height="3" fill="#ff8c1a" />
        {/* 烛台横杆 */}
        <rect x="285" y="104" width="24" height="2" fill="#8a5828" />
        {/* 光晕 */}
        <ellipse cx="296" cy="98" rx="32" ry="20" fill="#f5d878" opacity="0.10" />
      </g>
    </svg>
  )
}

/**
 * 单张椅子（侧视图，high-back wooden chair）
 */
function Chair({ x, y, facing, small }: { x: number; y: number; facing: 'left' | 'right' | 'down'; small?: boolean }) {
  const w = small ? 12 : 16
  const h = small ? 18 : 24
  const opacity = small ? 0.8 : 1
  return (
    <g opacity={opacity}>
      {/* 椅背 */}
      {facing !== 'down' && (
        <rect x={facing === 'left' ? x + w - 3 : x} y={y - h + 4} width="3" height={h} fill="#3d2614" />
      )}
      {facing === 'down' && (
        <rect x={x} y={y - h + 4} width={w} height="3" fill="#3d2614" />
      )}
      {/* 座位 */}
      <rect x={x} y={y} width={w} height="3" fill="#5c3a1f" />
      <rect x={x} y={y + 3} width={w} height="2" fill="#3d2614" />
      {/* 腿 */}
      <rect x={x + 1} y={y + 5} width="2" height={h - 8} fill="#3d2614" />
      <rect x={x + w - 3} y={y + 5} width="2" height={h - 8} fill="#3d2614" />
    </g>
  )
}
