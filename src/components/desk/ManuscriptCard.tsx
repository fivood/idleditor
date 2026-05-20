import { useState, useEffect, useMemo } from 'react'
import type { Genre, Manuscript } from '@/core/types'
import { useGameStore } from '@/store/gameStore'
import { PaperCard } from '@/components/shared/PaperCard'
import { PixelProgressBar } from '@/components/shared/PixelProgressBar'
import { PixelTextButton } from '@/components/shared/PixelTextButton'
import { useComposedFrame } from '@/utils/composeNineSlice'

// 探测 btn-browse.png 一次（module-level 缓存）
const btnBrowseAvailability = { checked: false, has: false }
function useBtnBrowse(): boolean {
  const [hasPng, setHasPng] = useState(btnBrowseAvailability.has)
  useEffect(() => {
    if (btnBrowseAvailability.checked) return
    const img = new Image()
    img.onload = () => { btnBrowseAvailability.checked = true; btnBrowseAvailability.has = true; setHasPng(true) }
    img.onerror = () => { btnBrowseAvailability.checked = true; btnBrowseAvailability.has = false }
    img.src = '/ui/btn-browse.png'
  }, [])
  return hasPng
}

// v2.6.10: 投稿池稿件卡用 inbox 9-切片做底色（像一张投稿纸条）
// v2.6.14: 画师确认用 96×96 单图（按 3×3 切，每格 32×32）。
//          为保住像素精确（每个源像素 = 1 屏幕像素），用 1× 整数倍渲染：
//          边框 32px/边。
//          想再瘦一圈的话，画师把单图改成 48×48（每格 16×16）就行——
//          改 INBOX_SLICE=16 同步即可拿到 16px 像素精确边框。
const INBOX_SLICE = 16
const INBOX_PIXEL_SCALE = 1

// 不同题材的稿件用不同颜色的"题材带"区分（标签图 PNG 缺失时的兜底）
const GENRE_BAND_COLORS: Record<Genre, string> = {
  'sci-fi':         '#3b82f6',  // 蓝
  mystery:          '#8b5cf6',  // 紫
  suspense:         '#ef4444',  // 红
  'social-science': '#d97706',  // 琥珀
  literary:         '#b91c1c',  // 葡萄酒红
  hybrid:           '#10b981',  // 绿
  fantasy:          '#7c3aed',  // 紫罗兰
  'light-novel':    '#ec4899',  // 粉
}

// v2.6.8: 题材标签图 PNG 探测——画师后续交付到 public/ui/genre-{genre}.png
//          每个 genre 探测一次，缓存到 module-level Map 避免每张卡片都重测。
const genreTagAvailability = new Map<Genre, boolean>()
function useGenreTag(genre: Genre): boolean {
  const cached = genreTagAvailability.get(genre)
  const [available, setAvailable] = useState<boolean>(cached ?? false)
  useEffect(() => {
    if (genreTagAvailability.has(genre)) return
    const img = new Image()
    img.onload = () => { genreTagAvailability.set(genre, true); setAvailable(true) }
    img.onerror = () => { genreTagAvailability.set(genre, false); setAvailable(false) }
    img.src = `/ui/genre-${genre}.png`
  }, [genre])
  return available
}

// 基于 ID 稳定地生成是否有咖啡渍（v2.6.8 移除回形针装饰）
function deterministicNoise(id: string): { hasStain: boolean } {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0
  const hasStain = (h & 0x10) !== 0  // ~50%
  return { hasStain }
}

interface Props {
  manuscript: Manuscript
}

export function ManuscriptCard({ manuscript }: Props) {
  const startReview = useGameStore(s => s.startReview)
  const rejectManuscript = useGameStore(s => s.rejectManuscript)
  const shelveManuscript = useGameStore(s => s.shelveManuscript)
  const authors = useGameStore(s => s.authors)
  const getTalentBonuses = useGameStore(s => s.getTalentBonuses)
  const [viewed, setViewed] = useState(false)
  const [flipping, setFlipping] = useState(false)
  const [flipProgress, setFlipProgress] = useState(0)
  const [expandSynopsis, setExpandSynopsis] = useState(false)

  const noise = useMemo(() => deterministicNoise(manuscript.id), [manuscript.id])
  const bandColor = GENRE_BAND_COLORS[manuscript.genre] ?? GENRE_BAND_COLORS.hybrid
  const hasGenreTag = useGenreTag(manuscript.genre)
  const hasBtnBrowse = useBtnBrowse()
  const [browseHover, setBrowseHover] = useState(false)
  // v2.6.10: 投稿纸条底色——inbox 9-切片拼好的 dataURL（缺图 → null → 走 PaperCard 兜底）
  const inboxDataUrl = useComposedFrame('manuscript-bg', 'inbox', '/ui/panel-inbox', INBOX_SLICE)
  const hasInboxBg = inboxDataUrl !== null

  // Animate flipping progress
  useEffect(() => {
    if (!flipping) return
    const bonuses = getTalentBonuses()
    const speedMult = 1 + (bonuses.flipSpeed || 0) - (bonuses.flipSpeedPenalty || 0)
    const baseDuration = 1000 + manuscript.wordCount * 0.005
    const duration = baseDuration / Math.max(0.3, speedMult)
    const start = Date.now()
    const timer = setInterval(() => {
      const elapsed = Date.now() - start
      const pct = Math.min(100, Math.round((elapsed / duration) * 100))
      setFlipProgress(pct)
      if (pct >= 100) {
        clearInterval(timer)
        setFlipping(false)
        setViewed(true)
      }
    }, 30)
    return () => clearInterval(timer)
  }, [flipping, manuscript.wordCount, getTalentBonuses])

  const author = authors.get(manuscript.authorId)
  const isSignedAuthor = author && author.tier !== 'new'

  const impression = manuscript.marketPotential < 25 ? { text: '初筛存疑', color: 'text-amber-700' }
    : manuscript.marketPotential < 45 ? { text: '尚需斟酌', color: 'text-muted' }
    : manuscript.marketPotential < 65 ? { text: '可堪一读', color: 'text-progress' }
    : { text: '潜力之作', color: 'text-copper' }

  // 卡片内部内容——左侧题材标签 / 装饰 / 主体文字 / 右侧操作按钮
  const innerContent = (
    <>
      {/* 左侧题材标签：画师 PNG 在 public/ui/genre-{genre}.png 就用 PNG，
          缺失则退回 8px 彩色窄条作为兜底 */}
      {hasGenreTag ? (
        // 按源 PNG 原生尺寸渲染（不强制 32×32），让画师按各题材自由设计
        // 比例。代码只限制最大不超过 48×48，避免过大撑破布局。
        <img
          src={`/ui/genre-${manuscript.genre}.png`}
          alt=""
          aria-hidden
          draggable={false}
          className="self-center shrink-0 ml-1.5 md:ml-2 pointer-events-none select-none"
          style={{ imageRendering: 'pixelated', maxWidth: 48, maxHeight: 48 }}
        />
      ) : (
        <div
          aria-hidden
          className="self-stretch w-2 shrink-0"
          style={{ backgroundColor: bandColor }}
        />
      )}

      {/* 咖啡渍装饰（随机点缀）*/}
      {noise.hasStain && (
        <div
          aria-hidden
          className="absolute right-2 bottom-1 pointer-events-none opacity-60"
          style={{ width: 28, height: 28 }}
        >
          <svg viewBox="0 0 60 60" width="28" height="28">
            <ellipse cx="30" cy="30" rx="22" ry="20" fill="#8b6b3e" opacity="0.15" />
            <ellipse cx="30" cy="30" rx="18" ry="16" fill="none" stroke="#6b4f2a" strokeWidth="0.8" opacity="0.3" />
            <ellipse cx="28" cy="28" rx="12" ry="10" fill="#a08060" opacity="0.1" />
          </svg>
        </div>
      )}

      {/* 主体内容（右侧）*/}
      <div className="flex-1 min-w-0 py-1 pr-1">
        <h3 className="text-xs md:text-sm font-bold text-ink truncate font-mono">{manuscript.title}</h3>
        <p className="text-[14px] md:text-[16px] text-muted mt-0.5 font-mono">
          <span className={`font-bold mr-1 ${impression.color}`}>{impression.text}</span>·
          {' '}{manuscript.genre} · {Math.round(manuscript.wordCount / 1000)}K字
          {author && (() => {
            const tierLabel = author.tier === 'new' ? '' : author.tier === 'signed' ? '· 已签约' : author.tier === 'known' ? '· 知名作者' : '· 传奇作者'
            return <span className="text-copper font-bold ml-1">{author.name}{tierLabel}</span>
          })()}
          {!viewed && manuscript.marketPotential > 60 && <span className="text-progress ml-1">· 潜力高</span>}
        </p>

        {flipping ? (
          <div className="mt-2">
            <PixelProgressBar value={flipProgress} height={8} />
            <p className="text-[12px] text-progress font-mono mt-1">翻阅中... {flipProgress}%</p>
          </div>
        ) : viewed && manuscript.synopsis ? (
          <p
            onClick={() => setExpandSynopsis(!expandSynopsis)}
            className={`text-[14px] md:text-[16px] text-muted mt-1 leading-relaxed cursor-pointer hover:text-ink-light transition-colors ${expandSynopsis ? '' : 'line-clamp-3'}`}
          >
            {manuscript.synopsis}
            {!expandSynopsis && manuscript.synopsis.length > 60 && (
              <span className="text-progress ml-0.5">[...]</span>
            )}
          </p>
        ) : null}
      </div>

      {/* 操作按钮 */}
      <div className="flex flex-col gap-1 flex-shrink-0 py-1 pr-1 self-center">
        {viewed ? (
          <>
            <PixelTextButton variant="primary" size="sm" onClick={() => startReview(manuscript.id)}>审稿</PixelTextButton>
            <PixelTextButton variant="danger" size="sm" onClick={() => rejectManuscript(manuscript.id)}>退稿</PixelTextButton>
            <PixelTextButton variant="default" size="sm" onClick={() => shelveManuscript(manuscript.id)}>搁置</PixelTextButton>
          </>
        ) : hasBtnBrowse ? (
          // 用画师交付的 btn-browse PNG（hover 时切到 btn-browse-hover）
          <button
            onClick={() => !flipping && setFlipping(true)}
            disabled={flipping}
            onMouseEnter={() => setBrowseHover(true)}
            onMouseLeave={() => setBrowseHover(false)}
            aria-label={flipping ? '翻阅中' : '翻阅'}
            title={flipping ? '翻阅中' : '翻阅'}
            className="p-0 border-0 bg-transparent cursor-pointer disabled:cursor-wait disabled:opacity-60"
          >
            <img
              src={browseHover && !flipping ? '/ui/btn-browse-hover.png' : '/ui/btn-browse.png'}
              alt=""
              width={64}
              height={64}
              draggable={false}
              className="block pointer-events-none select-none"
              style={{ imageRendering: 'pixelated' }}
            />
          </button>
        ) : (
          <PixelTextButton
            variant="primary"
            size="sm"
            onClick={() => !flipping && setFlipping(true)}
            disabled={flipping}
          >
            {flipping ? '翻阅中' : '翻阅'}
          </PixelTextButton>
        )}
      </div>
    </>
  )

  // v2.6.10: 有 inbox PNG → 用 inbox 9-切片做卡片底色（投稿纸条样）
  if (hasInboxBg) {
    return (
      <div
        className={`relative flex gap-2 md:gap-3 items-start ${
          isSignedAuthor ? 'border-l-4 border-l-copper' : ''
        }`}
        style={{
          borderStyle: 'solid',
          borderColor: 'transparent',
          borderWidth: INBOX_SLICE * INBOX_PIXEL_SCALE,
          borderImageSource: `url('${inboxDataUrl}')`,
          borderImageSlice: `${INBOX_SLICE} fill`,
          borderImageRepeat: 'round',
          imageRendering: 'pixelated',
          filter: flipping ? 'brightness(1.05)' : undefined,
        }}
      >
        {innerContent}
      </div>
    )
  }

  // 兜底：PNG 缺失退回原 PaperCard 暗色风格
  return (
    <PaperCard
      highlighted={flipping}
      className={`flex gap-2 md:gap-3 items-start overflow-hidden ${
        isSignedAuthor ? 'border-l-4 border-l-copper' : ''
      }`}
    >
      {innerContent}
    </PaperCard>
  )
}
