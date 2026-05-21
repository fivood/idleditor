import { useMemo, useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { sortMemoriesForBrowsing } from '@/core/memories'
import type { MemoryType } from '@/core/memories'

const TYPE_LABELS: Record<MemoryType, string> = {
  publish:   '📘 出版',
  review:    '👀 审稿',
  rejection: '✗ 退稿',
  random:    '🎲 偶遇',
  decision:  '⚖ 抉择',
  author:    '✍️ 作者',
  milestone: '🏆 里程碑',
}

const TYPE_FILTER_ORDER: Array<MemoryType | 'all'> = ['all', 'publish', 'milestone', 'author', 'decision', 'rejection', 'random', 'review']

/**
 * 档案室「记忆碎片柜」浏览面板。
 * 上方筛选 tab（全部 / 本世 / 历世 / 按类型），下方列表。
 * 被书引用过的记忆会标注"已被《XX》引用 N 次"。
 */
export function MemoriesView() {
  const memories = useGameStore(s => s.memories ?? { current: [], heirloom: [] })
  const books = useGameStore(s => {
    const list: Array<{ id: string; title: string; inspirationMemoryIds?: string[] }> = []
    for (const m of s.manuscripts.values()) {
      if (m.isPlayerCreated && m.inspirationMemoryIds?.length) {
        list.push({ id: m.id, title: m.title, inspirationMemoryIds: m.inspirationMemoryIds })
      }
    }
    return list
  })

  const [scope, setScope] = useState<'all' | 'current' | 'heirloom'>('all')
  const [typeFilter, setTypeFilter] = useState<MemoryType | 'all'>('all')

  // 记忆 → 引用它的书 列表（反向索引）
  const referenceMap = useMemo(() => {
    const map = new Map<string, string[]>()
    for (const b of books) {
      for (const mid of b.inspirationMemoryIds ?? []) {
        if (!map.has(mid)) map.set(mid, [])
        map.get(mid)!.push(b.title)
      }
    }
    return map
  }, [books])

  const list = useMemo(() => {
    let base = scope === 'current' ? memories.current
      : scope === 'heirloom' ? memories.heirloom
      : [...memories.current, ...memories.heirloom]
    if (typeFilter !== 'all') {
      base = base.filter(m => m.type === typeFilter)
    }
    return sortMemoriesForBrowsing(base)
  }, [memories, scope, typeFilter])

  const heirloomIds = useMemo(() => new Set(memories.heirloom.map(m => m.id)), [memories.heirloom])

  if (memories.current.length + memories.heirloom.length === 0) {
    return (
      <div className="font-mono text-[14px] text-center py-6 space-y-2" style={{ color: '#b8a48a' }}>
        <p>档案柜里还没有记忆碎片。</p>
        <p className="opacity-70">出版书 / 退掉好稿 / 作者晋升 / 获奖 / 重大决策——这些都会被自动收集到这里。</p>
        <p className="opacity-70">玩家进入梦境创作时可挑选记忆作为灵感原型，喂给 LLM 编织成专属的书。</p>
      </div>
    )
  }

  return (
    <div className="font-mono text-[13px] md:text-[14px] space-y-2">
      {/* 范围 tab */}
      <div className="flex gap-1.5">
        {([['all', '全部'], ['current', '本世'], ['heirloom', '历世传家']] as const).map(([k, label]) => {
          const count = k === 'all' ? memories.current.length + memories.heirloom.length
            : k === 'current' ? memories.current.length
            : memories.heirloom.length
          const active = scope === k
          return (
            <button
              key={k}
              onClick={() => setScope(k)}
              className="px-2 py-1 border-2 cursor-pointer transition-none"
              style={{
                background: active ? '#5c3a1f' : '#1a0e08',
                borderColor: active ? '#b8763b' : '#5c3a1f',
                color: active ? '#f5d878' : '#d4a85a',
              }}
            >
              {label} <span className="opacity-70">({count})</span>
            </button>
          )
        })}
      </div>

      {/* 类型筛选 */}
      <div className="flex flex-wrap gap-1">
        {TYPE_FILTER_ORDER.map(t => {
          const active = typeFilter === t
          const label = t === 'all' ? '所有类型' : TYPE_LABELS[t]
          return (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className="px-1.5 py-0.5 border-2 cursor-pointer text-[12px]"
              style={{
                background: active ? '#3a2412' : '#1a0e08',
                borderColor: active ? '#b8763b' : '#3a2412',
                color: active ? '#f5d878' : '#8a7a5a',
              }}
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* 列表 */}
      <div className="max-h-[55vh] overflow-y-auto pr-1 space-y-1.5">
        {list.length === 0 ? (
          <div className="text-center py-6 italic" style={{ color: '#8a7a5a' }}>当前筛选无记忆</div>
        ) : list.map(m => {
          const refs = referenceMap.get(m.id) ?? []
          const isHeirloom = heirloomIds.has(m.id)
          return (
            <div
              key={m.id}
              className="p-2 border-2"
              style={{
                background: isHeirloom ? '#2a1810' : '#1a0e08',
                borderColor: isHeirloom ? '#5c3a1f' : '#3a2412',
              }}
            >
              <div className="leading-relaxed" style={{ color: '#ede0c8' }}>{m.text}</div>
              <div className="text-[11px] mt-1 flex gap-2 flex-wrap" style={{ color: isHeirloom ? '#b8763b' : '#8a7a5a' }}>
                <span>{TYPE_LABELS[m.type]}</span>
                <span>·</span>
                <span>第{m.capturedYear}年</span>
                <span>·</span>
                <span>第{m.capturedEpoch}次纪元</span>
                <span>·</span>
                <span>重要度 {m.importance}</span>
                {isHeirloom && <span style={{ color: '#f5d878' }}>· 历世传家</span>}
              </div>
              {refs.length > 0 && (
                <div className="text-[11px] mt-1 italic" style={{ color: '#d4a85a' }}>
                  已被{refs.length === 1 ? `《${refs[0]}》` : `${refs.length} 本梦境作品`}引用
                  {refs.length > 1 && `：${refs.map(t => `《${t}》`).join('、')}`}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
