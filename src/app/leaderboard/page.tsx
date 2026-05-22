'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  Trophy, Heart, Eye, Zap, TrendingUp, Filter,
  Loader2, User, Crown, ChevronRight,
} from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import { cn } from '@/lib/utils'

interface LeaderBuild {
  id: number
  name: string
  position: string
  height: string | null
  archetype: string | null
  overall_rating: number
  meta_viability: string | null
  likes: number
  views: number
  author: string | null
  created_at: string
}

const TIER_COLORS: Record<string, string> = {
  S: 'text-amber-300 bg-amber-400/10 border-amber-400/30',
  A: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
  B: 'text-sky-400 bg-sky-400/10 border-sky-400/30',
  C: 'text-orange-400 bg-orange-400/10 border-orange-400/30',
  D: 'text-zinc-400 bg-zinc-400/10 border-zinc-400/30',
}

const POS_COLORS: Record<string, string> = {
  PG: 'text-sky-400', SG: 'text-emerald-400', SF: 'text-amber-400',
  PF: 'text-orange-400', C: 'text-rose-400',
}

const RANK_STYLES = [
  { bg: 'bg-amber-400/15', border: 'border-amber-400/25', text: 'text-amber-300', icon: '🥇' },
  { bg: 'bg-zinc-400/10',  border: 'border-zinc-400/20',  text: 'text-zinc-300',  icon: '🥈' },
  { bg: 'bg-orange-400/10',border: 'border-orange-400/20',text: 'text-orange-300',icon: '🥉' },
]

const POSITIONS = ['All', 'PG', 'SG', 'SF', 'PF', 'C']
const SORTS = [
  { value: 'likes',   label: 'Most Liked' },
  { value: 'views',   label: 'Most Viewed' },
  { value: 'created', label: 'Newest' },
  { value: 'rating',  label: 'Top Rated' },
]

export default function LeaderboardPage() {
  const [builds, setBuilds] = useState<LeaderBuild[]>([])
  const [loading, setLoading] = useState(true)
  const [position, setPosition] = useState('All')
  const [sort, setSort] = useState('likes')

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ limit: '50', sort })
    if (position !== 'All') params.set('position', position)
    fetch(`/api/v1/builds?${params}`)
      .then(r => r.json())
      .then(d => setBuilds(d.data || []))
      .finally(() => setLoading(false))
  }, [position, sort])

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 pb-16">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-amber-400" />
            </div>
            <span className="text-amber-400 text-xs font-semibold tracking-widest uppercase">Community</span>
          </div>
          <h1 className="display text-4xl text-fg mb-1">Build Leaderboard</h1>
          <p className="text-fg-muted text-sm">Top publicly shared builds from the CourtIQ community.</p>
        </motion.div>

        {/* Filters */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="card p-3 flex flex-wrap gap-3 mb-6 items-center">
          <Filter className="w-4 h-4 text-fg-subtle flex-shrink-0" />
          <div className="flex gap-1 flex-wrap">
            {POSITIONS.map(p => (
              <button key={p}
                onClick={() => setPosition(p)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                  position === p
                    ? 'bg-rose-500 text-white shadow-[0_2px_8px_rgba(225,29,72,0.35)]'
                    : 'text-fg-muted hover:text-fg hover:bg-white/[0.04]'
                )}
              >{p}</button>
            ))}
          </div>
          <div className="h-4 w-px bg-border hidden sm:block" />
          <div className="flex gap-1 flex-wrap">
            {SORTS.map(s => (
              <button key={s.value}
                onClick={() => setSort(s.value)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                  sort === s.value
                    ? 'bg-white/08 text-fg'
                    : 'text-fg-muted hover:text-fg hover:bg-white/[0.04]'
                )}
              >{s.label}</button>
            ))}
          </div>
        </motion.div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-rose-400" />
          </div>
        ) : builds.length === 0 ? (
          <div className="card p-16 text-center">
            <Trophy className="w-10 h-10 text-fg-subtle mx-auto mb-3" />
            <p className="text-fg-muted mb-1">No public builds yet</p>
            <p className="text-xs text-fg-subtle mb-5">Be the first to share yours!</p>
            <Link href="/analyze" className="btn btn-primary">
              <Zap className="w-4 h-4 mr-1.5" /> Analyze &amp; Save a Build
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {builds.map((build, i) => {
              const rankStyle = RANK_STYLES[i] || null
              return (
                <motion.div
                  key={build.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.4) }}
                  className={cn(
                    'card p-4 hover:bg-white/[0.02] transition-colors group',
                    rankStyle ? `border ${rankStyle.border} ${rankStyle.bg}` : ''
                  )}
                >
                  <Link href={`/builds/${build.id}`} className="flex items-center gap-3">
                    {/* Rank */}
                    <div className="w-8 flex-shrink-0 text-center">
                      {i < 3 ? (
                        <span className="text-lg">{rankStyle!.icon}</span>
                      ) : (
                        <span className="text-xs font-bold text-fg-subtle mono">{i + 1}</span>
                      )}
                    </div>

                    {/* Build info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-fg truncate">{build.name || 'Unnamed Build'}</p>
                        {build.meta_viability && (
                          <span className={cn('chip text-xs font-bold border', TIER_COLORS[build.meta_viability] || '')}>
                            {build.meta_viability}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className={cn('text-xs font-semibold', POS_COLORS[build.position] || 'text-fg-muted')}>
                          {build.position}
                        </span>
                        {build.height && <span className="text-xs text-fg-subtle">· {build.height}</span>}
                        {build.archetype && <span className="text-xs text-fg-subtle truncate">· {build.archetype}</span>}
                        {build.author && (
                          <Link href={`/user/${build.author}`}
                            onClick={e => e.stopPropagation()}
                            className="text-xs text-fg-subtle flex items-center gap-0.5 ml-1 hover:text-rose-400 transition-colors">
                            <User className="w-2.5 h-2.5" />{build.author}
                          </Link>
                        )}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 flex-shrink-0">
                      {build.overall_rating > 0 && (
                        <span className="text-xl font-black text-fg/60 mono hidden sm:block">{build.overall_rating}</span>
                      )}
                      <div className="flex flex-col items-end gap-1">
                        <span className="flex items-center gap-1 text-xs text-fg-subtle">
                          <Heart className="w-3 h-3 text-rose-400/60" />{(build.likes ?? 0).toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-fg-subtle">
                          <Eye className="w-3 h-3" />{(build.views ?? 0).toLocaleString()}
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-fg-subtle/30 group-hover:text-fg-subtle transition-colors" />
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </div>
        )}

        {/* CTA */}
        {builds.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            className="mt-8 card p-6 text-center">
            <Crown className="w-8 h-8 text-amber-400/50 mx-auto mb-3" />
            <p className="text-fg font-semibold mb-1">Want to be on the leaderboard?</p>
            <p className="text-xs text-fg-muted mb-4">Analyze a build and save it as public to appear here.</p>
            <div className="flex gap-3 justify-center">
              <Link href="/analyze" className="btn btn-primary gap-2">
                <Zap className="w-4 h-4" /> Analyze a Build
              </Link>
              <Link href="/profile" className="btn btn-secondary gap-2">
                <TrendingUp className="w-4 h-4" /> My Profile
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </AppLayout>
  )
}
