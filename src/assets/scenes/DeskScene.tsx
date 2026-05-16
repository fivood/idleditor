/**
 * 桌面 Tab 的像素艺术背景层。
 *
 * 设计原则（详见 docs/art-spec.md）：
 * - 320×200 viewBox，整数坐标 + shape-rendering:crispEdges = 真像素画
 * - 12 色限定调色板（与游戏整体一致）
 * - 物件按 <g data-object> 分组，方便后续按状态显隐
 * - 单文件 SVG，gzip 后约 1.5KB
 *
 * 状态响应（v1.8）：
 * - manuscriptStackSize: 0-3，决定稿件堆叠层数
 * - showCat: catState 不为 null 时显示黑猫
 *
 * 替换为精修版：覆盖此组件返回的 <svg> 即可，外层不需改动。
 */

interface DeskSceneProps {
  manuscriptStackSize?: 0 | 1 | 2 | 3
  showCat?: boolean
}

export function DeskScene({ manuscriptStackSize = 2, showCat = false }: DeskSceneProps) {
  return (
    <svg
      viewBox="0 0 320 200"
      preserveAspectRatio="xMidYMid slice"
      shapeRendering="crispEdges"
      className="w-full h-full"
      style={{ imageRendering: 'pixelated' }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* ─── 砖墙背景 ─── */}
      <rect width="320" height="120" fill="#1a0e08" />
      <g data-object="bricks" fill="#2d1a14">
        {/* 4 行错砖图案 */}
        {[2, 30, 44].map(y => (
          [0, 32, 64, 96, 128, 160, 192, 224, 256, 288].map(x => (
            <rect key={`${x}-${y}`} x={x} y={y} width="30" height="12" />
          ))
        ))}
        {[16].map(y => (
          [0, 16, 48, 80, 112, 144, 176, 208, 240, 272, 304].map((x, i) => {
            const w = i === 0 ? 14 : (i === 10 ? 16 : 30)
            return <rect key={`${x}-${y}`} x={x} y={y} width={w} height="12" />
          })
        ))}
      </g>

      {/* ─── 哥特窗 ─── */}
      <g data-object="window">
        <rect x="186" y="14" width="76" height="78" fill="#0a0806" />
        <rect x="188" y="16" width="72" height="74" fill="#1a1510" />
        <rect x="192" y="20" width="64" height="66" fill="#0e1240" />
        {/* 星星 */}
        {[
          [198, 26, 1, 0.8], [208, 22, 2, 0.6], [220, 32, 1, 0.5],
          [246, 28, 2, 0.7], [232, 58, 1, 0.4], [200, 64, 2, 0.6],
        ].map(([x, y, s, o], i) => (
          <rect key={i} x={x} y={y} width={s} height={s} fill="#ffffff" opacity={o} />
        ))}
        {/* 月牙 */}
        <rect x="234" y="40" width="8" height="8" fill="#f5e6a0" />
        <rect x="232" y="42" width="2" height="4" fill="#f5e6a0" />
        <rect x="242" y="42" width="2" height="4" fill="#f5e6a0" />
        <rect x="238" y="40" width="6" height="6" fill="#0e1240" />
        {/* 月晕 */}
        <rect x="230" y="38" width="14" height="1" fill="#f5e6a0" opacity="0.15" />
        <rect x="228" y="40" width="2" height="6" fill="#f5e6a0" opacity="0.15" />
        <rect x="244" y="40" width="2" height="6" fill="#f5e6a0" opacity="0.15" />
        {/* 十字铁框 */}
        <rect x="222" y="20" width="2" height="66" fill="#0a0806" />
        <rect x="192" y="51" width="64" height="2" fill="#0a0806" />
      </g>

      {/* ─── 蝙蝠剪影 ─── */}
      <g data-object="bat" fill="#0a0806">
        <rect x="148" y="20" width="2" height="1" />
        <rect x="146" y="21" width="2" height="1" />
        <rect x="150" y="21" width="2" height="1" />
        <rect x="144" y="22" width="1" height="1" />
        <rect x="153" y="22" width="1" height="1" />
        <rect x="149" y="22" width="1" height="1" />
      </g>

      {/* ─── 桌面（45° 等距）─── */}
      <g data-object="desk">
        <rect x="0" y="120" width="320" height="48" fill="#4a2f18" />
        <rect x="20" y="128" width="60" height="2" fill="#5c3a1f" />
        <rect x="100" y="134" width="80" height="2" fill="#5c3a1f" />
        <rect x="200" y="142" width="100" height="2" fill="#5c3a1f" />
        <rect x="40" y="150" width="50" height="2" fill="#3d2614" />
        <rect x="160" y="156" width="120" height="2" fill="#3d2614" />
        <rect x="0" y="120" width="320" height="2" fill="#6e4a2a" />
        <rect x="0" y="168" width="320" height="32" fill="#2a1810" />
        <rect x="0" y="168" width="320" height="2" fill="#3d2614" />
      </g>

      {/* ─── 稿件堆（左，按数量分层显示）─── */}
      {manuscriptStackSize > 0 && (
        <g data-object="manuscripts">
          <rect x="22" y="136" width="44" height="2" fill="#1a0e08" opacity="0.4" />
          <rect x="20" y="120" width="44" height="18" fill="#ede0c8" />
          <rect x="20" y="118" width="44" height="2" fill="#f5e8d0" />
          {manuscriptStackSize >= 2 && (
            <>
              <rect x="24" y="112" width="40" height="8" fill="#e5d8c0" />
              <rect x="24" y="110" width="40" height="2" fill="#ede0c8" />
            </>
          )}
          {manuscriptStackSize >= 3 && (
            <>
              <rect x="28" y="104" width="34" height="8" fill="#f0e3c8" />
              <rect x="28" y="102" width="34" height="2" fill="#f8ecd0" />
              <rect x="30" y="106" width="20" height="1" fill="#5a4a38" />
              <rect x="30" y="109" width="24" height="1" fill="#5a4a38" />
            </>
          )}
          <rect x="24" y="115" width="28" height="1" fill="#5a4a38" opacity="0.6" />
          <rect x="24" y="117" width="24" height="1" fill="#5a4a38" opacity="0.6" />
          {/* 红绳 */}
          <rect x="38" y={manuscriptStackSize >= 3 ? 102 : (manuscriptStackSize >= 2 ? 110 : 118)} width="2" height={manuscriptStackSize >= 3 ? 36 : (manuscriptStackSize >= 2 ? 28 : 20)} fill="#8b1f1f" />
          <rect x="20" y="128" width="44" height="2" fill="#8b1f1f" />
        </g>
      )}

      {/* ─── 墨水瓶 + 鹅毛笔 ─── */}
      <g data-object="inkwell-quill">
        <rect x="92" y="118" width="16" height="20" fill="#0a0806" />
        <rect x="94" y="118" width="2" height="20" fill="#3a2a20" />
        <rect x="92" y="138" width="16" height="2" fill="#1a1410" />
        <rect x="96" y="114" width="8" height="4" fill="#5c3a1f" />
        <rect x="96" y="114" width="2" height="4" fill="#6e4a2a" />
        <rect x="102" y="112" width="2" height="2" fill="#d4c8b0" />
        <rect x="104" y="108" width="2" height="4" fill="#e8dec8" />
        <rect x="106" y="100" width="2" height="8" fill="#f0e8d8" />
        <rect x="108" y="92" width="2" height="8" fill="#f0e8d8" />
        <rect x="110" y="88" width="2" height="4" fill="#f5edd8" />
        <rect x="108" y="94" width="4" height="1" fill="#d4c8b0" />
        <rect x="108" y="96" width="4" height="1" fill="#d4c8b0" />
        <rect x="110" y="90" width="3" height="1" fill="#d4c8b0" />
      </g>

      {/* ─── 红茶 + 蒸汽 ─── */}
      <g data-object="tea">
        <rect x="138" y="138" width="28" height="3" fill="#d8d0c0" />
        <rect x="138" y="138" width="28" height="1" fill="#e8e0d0" />
        <rect x="144" y="126" width="16" height="12" fill="#e8e0d0" />
        <rect x="144" y="126" width="2" height="12" fill="#c8c0b0" />
        <rect x="158" y="126" width="2" height="12" fill="#c8c0b0" />
        <rect x="144" y="126" width="16" height="2" fill="#f0e8d0" />
        <rect x="146" y="128" width="12" height="6" fill="#6b1a18" />
        <rect x="146" y="128" width="12" height="1" fill="#8a2820" />
        <rect x="160" y="128" width="3" height="2" fill="#e8e0d0" />
        <rect x="160" y="130" width="2" height="4" fill="#e8e0d0" />
        <rect x="160" y="134" width="3" height="2" fill="#e8e0d0" />
        {/* 蒸汽 */}
        <rect x="148" y="120" width="2" height="2" fill="#a09080" opacity="0.5" />
        <rect x="150" y="116" width="2" height="2" fill="#a09080" opacity="0.4" />
        <rect x="152" y="112" width="2" height="2" fill="#a09080" opacity="0.3" />
        <rect x="154" y="118" width="2" height="2" fill="#a09080" opacity="0.4" />
        <rect x="156" y="114" width="2" height="2" fill="#a09080" opacity="0.3" />
      </g>

      {/* ─── 油灯 + 光晕 ─── */}
      <g data-object="lamp">
        <ellipse cx="230" cy="118" rx="48" ry="32" fill="#f5d878" opacity="0.08" />
        <ellipse cx="230" cy="118" rx="32" ry="20" fill="#f5d878" opacity="0.10" />
        <ellipse cx="230" cy="118" rx="18" ry="12" fill="#f5d878" opacity="0.15" />
        <rect x="222" y="134" width="16" height="4" fill="#8a5828" />
        <rect x="222" y="134" width="16" height="1" fill="#b8763b" />
        <rect x="226" y="124" width="8" height="10" fill="#b8763b" />
        <rect x="226" y="124" width="2" height="10" fill="#d49a5b" />
        <rect x="232" y="124" width="2" height="10" fill="#8a5828" />
        <rect x="224" y="108" width="12" height="16" fill="#3a2a20" opacity="0.4" />
        <rect x="224" y="108" width="12" height="2" fill="#5c3a1f" />
        <rect x="224" y="122" width="12" height="2" fill="#5c3a1f" />
        <rect x="228" y="116" width="4" height="6" fill="#ff8c1a" />
        <rect x="229" y="114" width="2" height="4" fill="#ffd860" />
        <rect x="230" y="112" width="1" height="3" fill="#fff0a8" />
        <rect x="222" y="104" width="16" height="4" fill="#8a5828" />
        <rect x="226" y="100" width="8" height="4" fill="#5c3a1f" />
      </g>

      {/* ─── 黑猫（蜷睡，仅在 catState 存在时显示）─── */}
      {showCat && (
        <g data-object="cat">
          <ellipse cx="285" cy="146" rx="20" ry="3" fill="#0a0806" opacity="0.5" />
          <rect x="266" y="130" width="38" height="16" fill="#0a0806" />
          <rect x="266" y="130" width="38" height="2" fill="#1a1410" />
          <rect x="270" y="124" width="14" height="10" fill="#0a0806" />
          <rect x="270" y="124" width="14" height="2" fill="#1a1410" />
          <rect x="270" y="120" width="4" height="4" fill="#0a0806" />
          <rect x="280" y="120" width="4" height="4" fill="#0a0806" />
          <rect x="273" y="128" width="2" height="1" fill="#d4b85a" />
          <rect x="279" y="128" width="3" height="1" fill="#5a4a38" />
          <rect x="276" y="130" width="2" height="1" fill="#3a1a18" />
          <rect x="298" y="138" width="6" height="2" fill="#1a1410" />
          <rect x="300" y="134" width="2" height="4" fill="#1a1410" />
        </g>
      )}

      {/* ─── 光照渐变叠加 ─── */}
      <defs>
        <radialGradient id="desk-vignette" cx="72%" cy="60%" r="60%">
          <stop offset="0%" stopColor="#f5d878" stopOpacity="0" />
          <stop offset="60%" stopColor="#0a0806" stopOpacity="0" />
          <stop offset="100%" stopColor="#0a0806" stopOpacity="0.6" />
        </radialGradient>
      </defs>
      <rect width="320" height="200" fill="url(#desk-vignette)" opacity="0.3" />
    </svg>
  )
}
