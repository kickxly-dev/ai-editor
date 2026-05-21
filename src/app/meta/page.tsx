'use client'
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus, BarChart3, Star, Play, Zap, RefreshCw, ExternalLink, Clock } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import { cn } from '@/lib/utils'
import type { ScrapedMeta, MetaEntry } from '@/lib/scraper'

const TIER_CLASS: Record<string, string> = { S: 'tier-s', A: 'tier-a', B: 'tier-b', C: 'tier-c', D: 'tier-d' }
const TIER_LABEL: Record<string, string> = { S: 'Elite', A: 'Competitive', B: 'Solid', C: 'Situational', D: 'Avoid' }
const TIER_BORDER: Record<string, string> = {
  S: 'border-amber-400/30',
  A: 'border-emerald-400/30',
  B: 'border-sky-400/30',
  C: 'border-orange-400/30',
  D: 'border-zinc-600/30',
}

function TrendIcon({ t }: { t: string }) {
  if (t === 'rising') return <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
  if (t === 'falling') return <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
  return <Minus className="w-3.5 h-3.5 text-white/25" />
}

function TierSection({ tier, items, i: sectionIdx }: { tier: string; items: MetaEntry[]; i: number }) {
  if (!items.length) return null
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: sectionIdx * 0.08, type: 'spring', stiffness: 200, damping: 25 }}
      className={cn('card overflow-hidden border-l-[3px]', TIER_BORDER[tier])}
    >
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-white/[0.04]">
        <span className={cn('chip font-bold', TIER_CLASS[tier])}>{tier}</span>
        <span className="text-white font-semibold text-sm">{TIER_LABEL[tier]} Tier</span>
        <span className="text-white/25 text-xs ml-auto">{items.length} {items.length === 1 ? 'entry' : 'entries'}</span>
      </div>
      <div className="divide-y divide-white/[0.04]">
        {items.map((item, i) => (
          <motion.div
            key={`${item.name}-${i}`}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03 }}
            className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors group"
          >
            <span className="text-white/20 mono text-xs w-5 text-right flex-shrink-0">{i + 1}</span>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm truncate">{item.name}</p>
              <p className="text-white/35 text-xs truncate mt-0.5">{item.description}</p>
            </div>
            <div className="hidden sm:flex items-center gap-2 w-32 flex-shrink-0">
              <div className="stat-bar flex-1">
                <motion.div className="stat-bar-fill bg-rose-500"
                  initial={{ width: 0 }} animate={{ width: `${item.usage}%` }}
                  transition={{ duration: 0.8, delay: i * 0.05 }}/>
              </div>
              <span className="mono text-xs text-white/35 w-10 text-right flex-shrink-0">{item.usage}%</span>
            </div>
            <div className="hidden md:flex items-center gap-1 w-16 justify-end flex-shrink-0">
              <span className="mono text-xs text-emerald-400 font-bold">{item.winRate}%</span>
              <span className="text-white/20 text-[10px]">WR</span>
            </div>
            <TrendIcon t={item.trend} />
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="card overflow-hidden">
          <div className="px-5 py-3.5 border-b border-white/[0.04] flex items-center gap-3">
            <div className="skeleton w-8 h-5 rounded-full" />
            <div className="skeleton w-24 h-4 rounded" />
          </div>
          {[1, 2, 3].map(j => (
            <div key={j} className="px-5 py-4 flex items-center gap-4 border-b border-white/[0.04]">
              <div className="skeleton w-4 h-4 rounded" />
              <div className="flex-1 space-y-1.5">
                <div className="skeleton h-3.5 rounded w-3/4" />
                <div className="skeleton h-2.5 rounded w-1/2" />
              </div>
              <div className="skeleton w-24 h-2 rounded-full" />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

const CATS = [
  { key: 'builds', label: 'Builds', icon: BarChart3 },
  { key: 'badges', label: 'Badges', icon: Star },
  { key: 'animations', label: 'Animations', icon: Play },
  { key: 'takeovers', label: 'Takeovers', icon: Zap },
] as const

type CatKey = typeof CATS[number]['key']

export default function MetaPage() {
  const [cat, setCat] = useState<CatKey>('builds')
  const [meta, setMeta] = useState<ScrapedMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchMeta = useCallback(async (force = false) => {
    if (force) setRefreshing(true)
    else setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/meta${force ? '?refresh=1' : ''}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load meta')
      setMeta(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load meta')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { fetchMeta() }, [fetchMeta])

  const items: MetaEntry[] = meta ? (meta[cat] || []) : []
  const tiers = ['S', 'A', 'B', 'C', 'D']
  const rising = meta
    ? [...(meta.builds || []), ...(meta.badges || [])].filter(i => i.trend === 'rising').slice(0, 5)
    : []

  const lastUpdated = meta?.scrapedAt
    ? new Date(meta.scrapedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <div className="min-h-screen bg-bg">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-16">

        {/* Header */}
        <div className="flex items-start justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(225,29,72,0.09)', border: '1px solid rgba(225,29,72,0.16)' }}>
                <TrendingUp className="w-5 h-5 text-rose-400" />
              </div>
              <span className="text-rose-400 text-[10px] font-bold tracking-[0.2em] uppercase">Meta Tracker</span>
            </div>
            <h1 className="display text-4xl text-white mb-2">NBA 2K26 Meta</h1>
            <div className="flex items-center gap-3 flex-wrap">
              {meta?.sources?.map(s => (
                <span key={s} className="chip chip-muted flex items-center gap-1">
                  <ExternalLink className="w-2.5 h-2.5" />{s}
                </span>
              ))}
              {!loading && (
                <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                  <span className="status-online" /> Live scraped data
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {lastUpdated && (
              <div className="hidden sm:flex items-center gap-1.5 text-white/30 text-xs">
                <Clock className="w-3 h-3" /> {lastUpdated}
              </div>
            )}
            <button
              onClick={() => fetchMeta(true)}
              disabled={refreshing || loading}
              className="btn btn-secondary btn-sm gap-1.5"
            >
              <RefreshCw className={cn('w-3.5 h-3.5', refreshing && 'animate-spin')} />
              {refreshing ? 'Scraping...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div className="card p-4 mb-6 border-rose-500/20 bg-rose-500/5 flex items-center gap-3">
            <span className="text-rose-400 text-sm">{error}</span>
            <button onClick={() => fetchMeta()} className="btn btn-sm btn-ghost ml-auto text-rose-400">Retry</button>
          </div>
        )}

        {/* Category tabs */}
        <div className="card p-1.5 flex gap-1 w-fit mb-6 flex-wrap">
          {CATS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setCat(key)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all',
                cat === key
                  ? 'bg-rose-500 text-white'
                  : 'text-white/40 hover:text-white hover:bg-white/05'
              )}>
              <Icon className="w-3.5 h-3.5" />{label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Tier list */}
          <div className="lg:col-span-2 space-y-4">
            {loading ? (
              <LoadingSkeleton />
            ) : (
              <AnimatePresence mode="wait">
                <motion.div key={cat} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                  {tiers.map((tier, i) => {
                    const tierItems = items.filter(it => it.tier === tier)
                    return tierItems.length > 0
                      ? <TierSection key={tier} tier={tier} items={tierItems} i={i} />
                      : null
                  })}
                  {!items.length && !loading && (
                    <div className="card p-12 text-center">
                      <p className="text-white/30 text-sm">No data — hit Refresh to scrape latest meta</p>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Patch notes from scraper */}
            <div className="card p-5">
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.18em] mb-4 flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-rose-400" /> Latest Patch Notes
              </p>
              {loading ? (
                <div className="space-y-2.5">
                  {[1,2,3,4].map(i => <div key={i} className="skeleton h-3 rounded w-full" />)}
                </div>
              ) : (
                <div className="space-y-3">
                  {(meta?.patchNotes || []).slice(0, 6).map((note, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs">
                      <span className="w-1 h-1 rounded-full bg-rose-400 flex-shrink-0 mt-1.5" />
                      <span className="text-white/45 leading-relaxed">{note}</span>
                    </div>
                  ))}
                  {!meta?.patchNotes?.length && (
                    <p className="text-white/20 text-xs">Refresh to load patch notes</p>
                  )}
                </div>
              )}
            </div>

            {/* Quick stats */}
            <div className="card p-5">
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.18em] mb-4">Quick Stats</p>
              {loading ? (
                <div className="space-y-3">
                  {[1,2,3,4].map(i => <div key={i} className="flex gap-3"><div className="skeleton h-3 rounded flex-1" /><div className="skeleton h-3 rounded w-16" /></div>)}
                </div>
              ) : (
                <div className="space-y-3">
                  {[
                    { label: 'Top Build', value: meta?.builds?.find(b => b.tier === 'S')?.name },
                    { label: 'Hottest Badge', value: meta?.badges?.find(b => b.trend === 'rising')?.name },
                    { label: 'Best Animation', value: meta?.animations?.[0]?.name },
                    { label: 'Top Takeover', value: meta?.takeovers?.find(t => t.tier === 'S')?.name },
                  ].map(({ label, value }) => value ? (
                    <div key={label} className="flex items-center gap-3">
                      <span className="text-white/30 text-xs flex-1">{label}</span>
                      <span className="text-white text-xs font-medium text-right truncate max-w-[120px]">{value}</span>
                    </div>
                  ) : null)}
                </div>
              )}
            </div>

            {/* Rising this week */}
            <div className="card p-5">
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.18em] mb-4 flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Rising This Week
              </p>
              {loading ? (
                <div className="space-y-2.5">
                  {[1,2,3,4].map(i => <div key={i} className="skeleton h-4 rounded" />)}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {rising.map((item, i) => (
                    <div key={i} className="flex items-center gap-2.5 text-xs">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      <span className="text-white/40 flex-1 truncate">{item.name}</span>
                      <span className={cn('chip', TIER_CLASS[item.tier])}>{item.tier}</span>
                    </div>
                  ))}
                  {!rising.length && <p className="text-white/20 text-xs">Refresh to load trends</p>}
                </div>
              )}
            </div>

            {/* Sources */}
            {meta?.sources && meta.sources.length > 0 && (
              <div className="card p-4">
                <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.18em] mb-3">Data Sources</p>
                <div className="space-y-1.5">
                  {meta.sources.map(s => (
                    <div key={s} className="flex items-center gap-2 text-xs text-white/25">
                      <ExternalLink className="w-3 h-3 flex-shrink-0" /> {s}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
