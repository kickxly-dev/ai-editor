'use client'
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, RefreshCw, X, ExternalLink, ChevronRight,
  TrendingUp, Shield, Zap, Activity, Target, Users
} from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import { cn } from '@/lib/utils'
import type { ScrapedBuild } from '@/lib/builds-scraper'

/* ── Constants ──────────────────────────────────────────────────── */
const POSITIONS = ['PG', 'SG', 'SF', 'PF', 'C']
const TIERS = ['S', 'A', 'B', 'C']

const TIER_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  S: { bg: 'bg-rose-500/15',    text: 'text-rose-400',    border: 'border-rose-500/30' },
  A: { bg: 'bg-amber-500/15',   text: 'text-amber-400',   border: 'border-amber-500/30' },
  B: { bg: 'bg-sky-500/15',     text: 'text-sky-400',     border: 'border-sky-500/30' },
  C: { bg: 'bg-violet-500/15',  text: 'text-violet-400',  border: 'border-violet-500/30' },
  D: { bg: 'bg-white/5',        text: 'text-white/40',    border: 'border-white/10' },
}

const POS_COLOR: Record<string, string> = {
  PG: 'text-sky-400', SG: 'text-emerald-400', SF: 'text-amber-400',
  PF: 'text-orange-400', C: 'text-rose-400',
}

const BADGE_COLORS: Record<string, { bg: string; text: string }> = {
  HOF:    { bg: 'rgba(251,191,36,0.15)',  text: '#FBB724' },
  Gold:   { bg: 'rgba(251,191,36,0.10)',  text: '#F59E0B' },
  Silver: { bg: 'rgba(148,163,184,0.15)', text: '#94A3B8' },
  Bronze: { bg: 'rgba(180,83,9,0.15)',    text: '#B45309' },
}

const ATTR_GROUPS = [
  {
    label: 'Finishing',
    icon: Zap,
    color: '#E11D48',
    keys: ['close_shot', 'driving_layup', 'driving_dunk', 'standing_dunk', 'post_control'] as const,
    labels: ['Close Shot', 'Drv Layup', 'Drv Dunk', 'Std Dunk', 'Post Ctrl'],
  },
  {
    label: 'Shooting',
    icon: Target,
    color: '#8B5CF6',
    keys: ['mid_range', 'three_point', 'free_throw'] as const,
    labels: ['Mid Range', '3-Point', 'Free Throw'],
  },
  {
    label: 'Playmaking',
    icon: TrendingUp,
    color: '#38BDF8',
    keys: ['pass_accuracy', 'ball_handle', 'speed_with_ball'] as const,
    labels: ['Pass Acc', 'Ball Handle', 'Spd w/ Ball'],
  },
  {
    label: 'Defense',
    icon: Shield,
    color: '#10B981',
    keys: ['interior_defense', 'perimeter_defense', 'steal', 'block', 'offensive_rebound', 'defensive_rebound'] as const,
    labels: ['Int Def', 'Per Def', 'Steal', 'Block', 'Off Reb', 'Def Reb'],
  },
  {
    label: 'Athleticism',
    icon: Activity,
    color: '#F59E0B',
    keys: ['speed', 'agility', 'strength', 'vertical'] as const,
    labels: ['Speed', 'Agility', 'Strength', 'Vertical'],
  },
]

/* ── Score Ring ─────────────────────────────────────────────────── */
function ScoreRing({ value, label, color }: { value: number; label: string; color: string }) {
  const r = 28
  const circ = 2 * Math.PI * r
  const pct = Math.min(value / 100, 1)
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative w-16 h-16">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
          <circle
            cx="32" cy="32" r={r} fill="none"
            stroke={color} strokeWidth="5"
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - pct)}
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white mono">
          {value}
        </span>
      </div>
      <span className="text-[10px] text-white/40 font-semibold uppercase tracking-wide">{label}</span>
    </div>
  )
}

/* ── Detail Panel ───────────────────────────────────────────────── */
function DetailPanel({ build, onClose }: { build: ScrapedBuild; onClose: () => void }) {
  const tier = TIER_COLORS[build.tier] || TIER_COLORS.D

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex justify-end"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 35 }}
          className="relative w-full max-w-lg h-full overflow-y-auto"
          style={{ background: '#141418', borderLeft: '1px solid rgba(255,255,255,0.06)' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4"
            style={{ background: '#141418', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-3 min-w-0">
              <span className={cn('w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold mono flex-shrink-0', tier.bg, tier.text, 'border', tier.border)}>
                {build.tier}
              </span>
              <div className="min-w-0">
                <p className="text-white font-bold text-sm truncate">{build.name}</p>
                <p className="text-white/40 text-xs">{build.archetype}</p>
              </div>
            </div>
            <button onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/08 transition-all flex-shrink-0 ml-3"
              style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="px-6 py-5 space-y-6">
            {/* Position + meta chips */}
            <div className="flex flex-wrap gap-2">
              <span className={cn('px-2.5 py-1 rounded-lg text-xs font-bold border', 'bg-white/05 border-white/10', POS_COLOR[build.position])}>
                {build.position}
              </span>
              <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/05 border border-white/08 text-white/60">
                {build.height}
              </span>
              <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/05 border border-white/08 text-white/60">
                {build.wingspan} Wingspan
              </span>
              <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/05 border border-white/08 text-white/60">
                {build.category}
              </span>
            </div>

            {/* Score rings */}
            <div className="flex justify-around py-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <ScoreRing value={build.overallRating} label="Overall" color="#E11D48" />
              <ScoreRing value={build.competitiveness} label="Comp" color="#8B5CF6" />
              <ScoreRing value={Math.min(build.overallRating + 3, 99)} label="Ceiling" color="#F59E0B" />
            </div>

            {/* Description */}
            <p className="text-white/60 text-sm leading-relaxed">{build.description}</p>

            {/* Strengths & Weaknesses */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-2">Strengths</p>
                <ul className="space-y-1.5">
                  {build.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs text-white/60">
                      <span className="mt-0.5 w-1 h-1 rounded-full bg-emerald-400 flex-shrink-0" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-[10px] font-bold text-rose-400 uppercase tracking-wider mb-2">Weaknesses</p>
                <ul className="space-y-1.5">
                  {build.weaknesses.map((w, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs text-white/60">
                      <span className="mt-0.5 w-1 h-1 rounded-full bg-rose-400 flex-shrink-0" />
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Attributes by group */}
            <div>
              <p className="text-[10px] font-bold text-white/25 uppercase tracking-wider mb-4">Attributes</p>
              <div className="space-y-5">
                {ATTR_GROUPS.map(({ label, icon: Icon, color, keys, labels }) => (
                  <div key={label}>
                    <div className="flex items-center gap-2 mb-2.5">
                      <Icon className="w-3.5 h-3.5" style={{ color }} />
                      <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color }}>{label}</span>
                    </div>
                    <div className="space-y-2">
                      {keys.map((key, ki) => {
                        const val = build.attributes[key]
                        return (
                          <div key={key} className="flex items-center gap-2.5">
                            <span className="text-[11px] text-white/35 w-20 flex-shrink-0">{labels[ki]}</span>
                            <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                              <div className="h-full rounded-full transition-all"
                                style={{ width: `${val}%`, background: color, opacity: val < 40 ? 0.4 : 1 }} />
                            </div>
                            <span className="mono text-xs text-white/50 w-6 text-right flex-shrink-0">{val}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Badges */}
            {build.badges.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-white/25 uppercase tracking-wider mb-3">Badges</p>
                <div className="flex flex-wrap gap-2">
                  {build.badges.map((badge, i) => {
                    const bc = BADGE_COLORS[badge.level] || BADGE_COLORS.Bronze
                    return (
                      <span key={i} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold"
                        style={{ background: bc.bg, color: bc.text, border: `1px solid ${bc.text}30` }}>
                        <span className="font-bold">{badge.level[0]}</span>
                        {badge.name}
                      </span>
                    )
                  })}
                </div>
              </div>
            )}

            {/* How to make */}
            {build.howToMake.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-white/25 uppercase tracking-wider mb-3">How To Make This Build</p>
                <ol className="space-y-3">
                  {build.howToMake.map((step, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                        style={{ background: 'rgba(225,29,72,0.15)', color: '#E11D48', border: '1px solid rgba(225,29,72,0.2)' }}>
                        {i + 1}
                      </span>
                      <p className="text-sm text-white/60 leading-relaxed">{step}</p>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Source */}
            <div className="pt-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <p className="text-[10px] font-bold text-white/20 uppercase tracking-wider mb-2">Source</p>
              <a href={build.sourceUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-white/40 hover:text-rose-400 transition-colors group">
                <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{build.sourceTitle || 'Reddit Post'}</span>
                <span className="flex-shrink-0 text-white/20">· {build.upvotes} upvotes</span>
              </a>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

/* ── Build Card ─────────────────────────────────────────────────── */
function BuildCard({ build, i, onClick }: { build: ScrapedBuild; i: number; onClick: () => void }) {
  const tier = TIER_COLORS[build.tier] || TIER_COLORS.D

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.04 }}
      onClick={onClick}
      className="card card-lift p-5 flex flex-col gap-4 cursor-pointer group"
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <span className={cn('text-sm font-bold mono', POS_COLOR[build.position])}>{build.position}</span>
          </div>
          <div className="min-w-0">
            <p className="text-white font-semibold text-sm truncate group-hover:text-rose-400 transition-colors">{build.name}</p>
            <p className="text-white/40 text-xs truncate">{build.archetype}</p>
          </div>
        </div>
        <span className={cn('px-2 py-0.5 rounded-md text-xs font-bold mono flex-shrink-0 border', tier.bg, tier.text, tier.border)}>
          {build.tier}
        </span>
      </div>

      {/* Meta chips */}
      <div className="flex flex-wrap gap-1.5">
        <span className="px-2 py-0.5 rounded-md text-[11px] font-medium text-white/40 bg-white/05 border border-white/08">{build.height}</span>
        <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/15">{build.category}</span>
        {build.badges.slice(0, 1).map(badge => (
          <span key={badge.name} className="px-2 py-0.5 rounded-md text-[11px] font-medium text-amber-400 bg-amber-500/08 border border-amber-500/15">
            {badge.name}
          </span>
        ))}
      </div>

      {/* Mini stat bars */}
      <div className="space-y-2">
        {[
          { label: 'Overall', value: build.overallRating, color: '#E11D48' },
          { label: 'Comp', value: build.competitiveness, color: '#8B5CF6' },
        ].map(({ label, value, color }) => (
          <div key={label} className="flex items-center gap-2.5">
            <span className="text-white/35 text-[11px] w-11">{label}</span>
            <div className="stat-bar flex-1">
              <div className="stat-bar-fill" style={{ background: color, width: `${value}%` }} />
            </div>
            <span className="mono text-xs text-white/50 w-6 text-right">{value}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-1.5 text-xs text-white/30">
          <span className="text-white/20">↑</span>
          <span>{build.upvotes} upvotes</span>
        </div>
        <span className="flex items-center gap-1 text-xs text-white/30 group-hover:text-rose-400 transition-colors">
          View Details <ChevronRight className="w-3 h-3" />
        </span>
      </div>
    </motion.div>
  )
}

/* ── Skeleton ───────────────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="skeleton w-10 h-10 rounded-xl" />
        <div className="flex-1 space-y-1.5">
          <div className="skeleton h-4 rounded w-3/4" />
          <div className="skeleton h-3 rounded w-1/2" />
        </div>
        <div className="skeleton w-8 h-5 rounded" />
      </div>
      <div className="flex gap-1.5">
        <div className="skeleton h-5 w-12 rounded-md" />
        <div className="skeleton h-5 w-16 rounded-md" />
      </div>
      <div className="space-y-2">
        <div className="skeleton h-3 rounded w-full" />
        <div className="skeleton h-3 rounded w-full" />
      </div>
    </div>
  )
}

/* ── Main Page ──────────────────────────────────────────────────── */
export default function BuildsPage() {
  const [builds, setBuilds] = useState<ScrapedBuild[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selected, setSelected] = useState<ScrapedBuild | null>(null)
  const [search, setSearch] = useState('')
  const [pos, setPos] = useState('')
  const [tier, setTier] = useState('')

  const fetchBuilds = useCallback(async (force = false) => {
    if (force) setRefreshing(true)
    else setLoading(true)
    try {
      const res = await fetch(`/api/builds${force ? '?refresh=1' : ''}`)
      const data = await res.json()
      if (data.builds) setBuilds(data.builds)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { fetchBuilds() }, [fetchBuilds])

  const filtered = builds.filter(b => {
    const q = search.toLowerCase()
    const matchSearch = !q || b.name.toLowerCase().includes(q) || b.archetype.toLowerCase().includes(q) || b.category.toLowerCase().includes(q)
    const matchPos = !pos || b.position === pos
    const matchTier = !tier || b.tier === tier
    return matchSearch && matchPos && matchTier
  })

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-16">

        {/* Header */}
        <div className="flex items-start justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(225,29,72,0.09)', border: '1px solid rgba(225,29,72,0.16)' }}>
                <Users className="w-5 h-5 text-rose-400" />
              </div>
              <span className="text-rose-400 text-[10px] font-bold tracking-[0.2em] uppercase">Build Database</span>
            </div>
            <h1 className="text-[28px] md:text-[34px] font-black text-white leading-[1.05] tracking-tight mb-1">Community Builds</h1>
            <p className="text-white/35 text-sm">Real builds scraped from Reddit — updated every 30 minutes</p>
          </div>
          <button onClick={() => fetchBuilds(true)} disabled={refreshing || loading}
            className="btn btn-secondary btn-sm gap-1.5 flex-shrink-0">
            <RefreshCw className={cn('w-3.5 h-3.5', refreshing && 'animate-spin')} />
            {refreshing ? 'Fetching...' : 'Refresh'}
          </button>
        </div>

        {/* Filter bar */}
        <div className="card p-4 mb-6 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
            <input
              className="input pl-10"
              placeholder="Search builds, archetypes, categories..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setPos('')}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all',
                !pos ? 'bg-rose-500 border-rose-500 text-white' : 'bg-transparent border-white/08 text-white/35 hover:text-white hover:border-white/20')}>
              All Positions
            </button>
            {POSITIONS.map(p => (
              <button key={p} onClick={() => setPos(pos === p ? '' : p)}
                className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all',
                  pos === p ? 'bg-rose-500 border-rose-500 text-white' : 'bg-transparent border-white/08 text-white/35 hover:text-white hover:border-white/20')}>
                {p}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <button onClick={() => setTier('')}
              className={cn('px-3 py-1 rounded-md text-xs font-bold border transition-all',
                !tier ? 'bg-white/10 border-white/20 text-white' : 'bg-transparent border-white/08 text-white/35 hover:text-white hover:border-white/20')}>
              All Tiers
            </button>
            {TIERS.map(t => {
              const tc = TIER_COLORS[t]
              return (
                <button key={t} onClick={() => setTier(tier === t ? '' : t)}
                  className={cn('px-3 py-1 rounded-md text-xs font-bold border transition-all',
                    tier === t ? cn(tc.bg, tc.text, tc.border) : 'bg-transparent border-white/08 text-white/35 hover:text-white hover:border-white/20')}>
                  {t}-Tier
                </button>
              )
            })}
            {!loading && (
              <span className="text-white/25 text-xs ml-1">{filtered.length} builds</span>
            )}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length > 0 ? (
          <motion.div
            key={search + pos + tier}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4"
          >
            {filtered.map((b, i) => (
              <BuildCard key={b.id} build={b} i={i} onClick={() => setSelected(b)} />
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-24">
            <Users className="w-12 h-12 text-white/15 mx-auto mb-4" />
            <p className="text-white/30 text-sm">No builds match your filters</p>
            <button onClick={() => { setSearch(''); setPos(''); setTier('') }}
              className="btn btn-ghost btn-sm mt-3 text-rose-400">
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Slide-over detail panel */}
      <AnimatePresence>
        {selected && (
          <DetailPanel build={selected} onClose={() => setSelected(null)} />
        )}
      </AnimatePresence>
    </AppLayout>
  )
}
