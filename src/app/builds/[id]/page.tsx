'use client'
import { useState, useEffect, use } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  Heart, Eye, User, Calendar, ArrowLeft, Zap, Brain,
  TrendingUp, Shield, Target, CheckCircle2, AlertTriangle,
  Loader2, Globe, Lock, Star, Share2, Check,
} from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import { cn } from '@/lib/utils'

interface BuildDetail {
  id: number
  name: string
  position: string
  height: string | null
  wingspan: string | null
  archetype: string | null
  overall_rating: number
  meta_viability: string | null
  attributes: Record<string, number> | null
  badges: { name: string; level: string; category: string }[] | null
  takeover: string | null
  category: string | null
  likes: number
  views: number
  is_public: boolean
  ai_analysis: {
    archetype?: string
    strengths?: string[]
    weaknesses?: string[]
    skill_ceiling?: number
    competitiveness?: number
    playstyle_summary?: string
    offensive_role?: string
    defensive_role?: string
    upgrade_recommendations?: string[]
    badge_recommendations?: string[]
    takeover_recommendation?: string
    overall_rating?: number
    meta_viability?: string
  } | null
  author: string | null
  user_id: string
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

const BADGE_LEVEL_COLORS: Record<string, string> = {
  Legend: 'bg-rose-500/20 text-rose-300 border border-rose-500/30',
  'Hall of Fame': 'bg-amber-400/15 text-amber-300 border border-amber-400/25',
  Gold:   'bg-yellow-500/15 text-yellow-300 border border-yellow-500/20',
  Silver: 'bg-zinc-400/15 text-zinc-300 border border-zinc-400/20',
  Bronze: 'bg-orange-900/20 text-orange-400 border border-orange-900/25',
}

const ATTR_GROUPS = [
  { label: 'Finishing',    color: '#E11D48', keys: ['close_shot','driving_layup','driving_dunk','standing_dunk','post_control'] },
  { label: 'Shooting',     color: '#38BDF8', keys: ['mid_range','three_point','free_throw'] },
  { label: 'Playmaking',   color: '#8B5CF6', keys: ['pass_accuracy','ball_handle','speed_with_ball'] },
  { label: 'Defense',      color: '#10B981', keys: ['interior_defense','perimeter_defense','steal','block','offensive_rebound','defensive_rebound'] },
  { label: 'Athleticism',  color: '#F59E0B', keys: ['speed','acceleration','strength','vertical','stamina'] },
]

function StatBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-2 flex-1">
      <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
      <span className="mono text-xs font-semibold text-fg w-6 text-right flex-shrink-0">{value}</span>
    </div>
  )
}

function ScoreRing({ value, color, label }: { value: number; color: string; label: string }) {
  const r = 28, c = 2 * Math.PI * r
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative w-16 h-16">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
          <motion.circle cx="32" cy="32" r={r} fill="none" stroke={color} strokeWidth="5"
            strokeLinecap="round" strokeDasharray={c}
            initial={{ strokeDashoffset: c }}
            animate={{ strokeDashoffset: c - (value / 100) * c }}
            transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="mono font-bold text-sm text-fg">{value}</span>
        </div>
      </div>
      <span className="text-[10px] text-fg-subtle uppercase tracking-wider">{label}</span>
    </div>
  )
}

export default function BuildDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [build, setBuild] = useState<BuildDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [liked, setLiked] = useState(false)
  const [liking, setLiking] = useState(false)
  const [localLikes, setLocalLikes] = useState(0)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetch(`/api/build/${id}`)
      .then(r => r.json())
      .then(d => {
        if (d.build) {
          setBuild(d.build)
          setLocalLikes(d.build.likes ?? 0)
        }
      })
      .finally(() => setLoading(false))
  }, [id])

  const handleLike = async () => {
    if (liking || liked) return
    setLiking(true)
    try {
      const res = await fetch(`/api/build/${id}/like`, { method: 'POST' })
      if (res.ok) {
        setLiked(true)
        setLocalLikes(l => l + 1)
      }
    } finally {
      setLiking(false)
    }
  }

  if (loading) return (
    <AppLayout>
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-6 h-6 animate-spin text-rose-400" />
      </div>
    </AppLayout>
  )

  if (!build) return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-4 pt-16 text-center">
        <p className="text-fg-muted mb-4">Build not found.</p>
        <Link href="/leaderboard" className="btn btn-secondary gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Leaderboard
        </Link>
      </div>
    </AppLayout>
  )

  const tier = build.meta_viability || build.ai_analysis?.meta_viability || 'C'
  const analysis = build.ai_analysis

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 pb-16">

        {/* Back + header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <Link href="/leaderboard" className="inline-flex items-center gap-1.5 text-xs text-fg-muted hover:text-fg transition-colors mb-5">
            <ArrowLeft className="w-3.5 h-3.5" /> Leaderboard
          </Link>

          <div className="card p-6">
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <h1 className="text-2xl font-bold text-fg">{build.name || 'Unnamed Build'}</h1>
                  {tier && (
                    <span className={cn('chip text-xs font-bold border', TIER_COLORS[tier] || '')}>
                      {tier}-Tier
                    </span>
                  )}
                  {build.overall_rating > 0 && (
                    <span className="text-2xl font-black text-fg/50 mono">{build.overall_rating}</span>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap text-xs text-fg-muted mb-3">
                  <span className={cn('font-semibold', POS_COLORS[build.position] || '')}>{build.position}</span>
                  {build.height && <span>· {build.height}</span>}
                  {build.wingspan && <span>· {build.wingspan} wingspan</span>}
                  {build.archetype && <span>· {build.archetype}</span>}
                  {build.category && <span>· {build.category}</span>}
                </div>

                {build.takeover && (
                  <p className="text-xs text-fg-subtle">
                    <span className="text-violet-400 font-semibold">Takeover:</span> {build.takeover}
                  </p>
                )}
              </div>

              <div className="flex flex-col items-end gap-3 flex-shrink-0">
                {/* Like button */}
                {build.is_public && (
                  <button
                    onClick={handleLike}
                    disabled={liking || liked}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all border',
                      liked
                        ? 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                        : 'bg-white/[0.04] border-white/[0.08] text-fg-muted hover:text-rose-400 hover:border-rose-500/20'
                    )}
                  >
                    <Heart className={cn('w-4 h-4', liked && 'fill-rose-400')} />
                    {localLikes.toLocaleString()}
                  </button>
                )}

                <div className="flex items-center gap-3 text-xs text-fg-subtle">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />{(build.views ?? 0).toLocaleString()}
                  </span>
                  {build.is_public
                    ? <span className="flex items-center gap-1 text-emerald-400/60"><Globe className="w-3 h-3" />Public</span>
                    : <span className="flex items-center gap-1"><Lock className="w-3 h-3" />Private</span>
                  }
                </div>

                <div className="flex items-center gap-1.5 text-xs text-fg-subtle">
                  {build.author && (
                    <Link href={`/user/${build.author}`}
                      className="flex items-center gap-1 hover:text-rose-400 transition-colors">
                      <User className="w-3 h-3" />{build.author}
                    </Link>
                  )}
                  <Calendar className="w-3 h-3 ml-1" />
                  {build.created_at ? new Date(build.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

          {/* Left: attributes + badges */}
          <div className="lg:col-span-3 space-y-4">

            {/* Attributes */}
            {build.attributes && Object.keys(build.attributes).length > 0 && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="card p-5">
                <p className="text-xs font-semibold text-fg-muted uppercase tracking-wider mb-5">Attributes</p>
                <div className="space-y-4">
                  {ATTR_GROUPS.map(({ label, color, keys }) => {
                    const vals = keys.map(k => ({ k, v: build.attributes?.[k] ?? 0 })).filter(x => x.v > 0)
                    if (!vals.length) return null
                    return (
                      <div key={label}>
                        <div className="flex items-center gap-2 mb-2.5">
                          <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                          <span className="text-xs font-semibold text-fg-muted">{label}</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                          {vals.map(({ k, v }) => (
                            <div key={k} className="flex items-center gap-2">
                              <span className="text-xs text-fg-subtle capitalize w-28 flex-shrink-0">{k.replace(/_/g, ' ')}</span>
                              <StatBar value={v} color={color} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </motion.div>
            )}

            {/* Badges */}
            {build.badges && build.badges.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                className="card p-5">
                <p className="text-xs font-semibold text-fg-muted uppercase tracking-wider mb-4">
                  Badges <span className="text-fg-subtle font-normal">({build.badges.length})</span>
                </p>
                <div className="space-y-3">
                  {['Finishing', 'Shooting', 'Playmaking', 'Defense'].map(cat => {
                    const catBadges = build.badges!.filter(b => b.category === cat)
                    if (!catBadges.length) return null
                    return (
                      <div key={cat}>
                        <p className="text-xs text-fg-subtle mb-2">{cat}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {catBadges.map((b, i) => (
                            <span key={i} className={cn('chip text-xs', BADGE_LEVEL_COLORS[b.level] || 'bg-white/05 text-fg-muted')}>
                              {b.name}
                              <span className="ml-1 opacity-60 text-[10px]">{b.level[0]}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </motion.div>
            )}
          </div>

          {/* Right: AI analysis */}
          <div className="lg:col-span-2 space-y-4">
            {analysis ? (
              <>
                {/* Score rings */}
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                  className="card p-5">
                  <p className="text-xs font-semibold text-fg-muted uppercase tracking-wider mb-4">AI Score</p>
                  <div className="flex justify-around">
                    <ScoreRing value={analysis.overall_rating ?? 0} color="#E11D48" label="Overall" />
                    <ScoreRing value={analysis.competitiveness ?? 0} color="#8B5CF6" label="Comp" />
                    <ScoreRing value={analysis.skill_ceiling ?? 0} color="#38BDF8" label="Ceiling" />
                  </div>
                </motion.div>

                {/* Summary */}
                {analysis.playstyle_summary && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
                    className="card p-4 border-l-2 border-rose-500/40">
                    <p className="text-sm text-fg-muted leading-relaxed italic">&quot;{analysis.playstyle_summary}&quot;</p>
                  </motion.div>
                )}

                {/* Strengths + Weaknesses */}
                {(analysis.strengths?.length || analysis.weaknesses?.length) && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="grid grid-cols-2 gap-3">
                    {analysis.strengths?.length && (
                      <div className="card p-4">
                        <p className="text-emerald-400 text-xs font-semibold flex items-center gap-1.5 mb-3">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Strengths
                        </p>
                        <ul className="space-y-1.5">
                          {analysis.strengths.slice(0, 4).map((s, i) => (
                            <li key={i} className="text-fg-muted text-xs flex items-start gap-1.5">
                              <span className="w-1 h-1 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />{s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {analysis.weaknesses?.length && (
                      <div className="card p-4">
                        <p className="text-rose-400 text-xs font-semibold flex items-center gap-1.5 mb-3">
                          <AlertTriangle className="w-3.5 h-3.5" /> Weaknesses
                        </p>
                        <ul className="space-y-1.5">
                          {analysis.weaknesses.slice(0, 4).map((w, i) => (
                            <li key={i} className="text-fg-muted text-xs flex items-start gap-1.5">
                              <span className="w-1 h-1 rounded-full bg-rose-400 mt-1.5 flex-shrink-0" />{w}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Roles */}
                {(analysis.offensive_role || analysis.defensive_role) && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
                    className="card p-4 space-y-3">
                    {analysis.offensive_role && (
                      <div>
                        <p className="text-fg-subtle text-xs flex items-center gap-1.5 mb-1">
                          <Target className="w-3 h-3 text-sky-400" /> Offensive Role
                        </p>
                        <p className="text-fg text-sm">{analysis.offensive_role}</p>
                      </div>
                    )}
                    {analysis.offensive_role && analysis.defensive_role && <div className="divider" />}
                    {analysis.defensive_role && (
                      <div>
                        <p className="text-fg-subtle text-xs flex items-center gap-1.5 mb-1">
                          <Shield className="w-3 h-3 text-emerald-400" /> Defensive Role
                        </p>
                        <p className="text-fg text-sm">{analysis.defensive_role}</p>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Recommendations */}
                {(analysis.upgrade_recommendations?.length || analysis.badge_recommendations?.length) && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}
                    className="card p-4">
                    <p className="text-xs font-semibold text-fg-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                      <TrendingUp className="w-3.5 h-3.5 text-rose-400" /> AI Recommendations
                    </p>
                    <div className="space-y-2">
                      {analysis.upgrade_recommendations?.slice(0, 2).map((r, i) => (
                        <div key={i} className="flex gap-2 text-xs">
                          <span className="text-amber-400 font-semibold flex-shrink-0">Upgrade</span>
                          <span className="text-fg-muted">{r}</span>
                        </div>
                      ))}
                      {analysis.badge_recommendations?.slice(0, 2).map((r, i) => (
                        <div key={i} className="flex gap-2 text-xs">
                          <span className="text-violet-400 font-semibold flex-shrink-0">Badge</span>
                          <span className="text-fg-muted">{r}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {analysis.takeover_recommendation && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}
                    className="card p-4 border-violet-500/20 bg-violet-500/5">
                    <p className="text-fg-subtle text-xs mb-1">Recommended Takeover</p>
                    <p className="text-fg font-semibold text-sm">{analysis.takeover_recommendation}</p>
                  </motion.div>
                )}
              </>
            ) : (
              <div className="card p-8 text-center">
                <Brain className="w-8 h-8 text-fg-subtle mx-auto mb-3" />
                <p className="text-fg-muted text-sm">No AI analysis available</p>
                <p className="text-xs text-fg-subtle mt-1">This build was saved without analysis</p>
              </div>
            )}

            {/* CTA */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
              className="flex gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href)
                  setCopied(true)
                  setTimeout(() => setCopied(false), 2000)
                }}
                className="btn btn-secondary gap-2 text-sm flex-1"
              >
                {copied ? <><Check className="w-3.5 h-3.5 text-emerald-400" /> Copied!</> : <><Share2 className="w-3.5 h-3.5" /> Share</>}
              </button>
              <Link href="/analyze" className="btn btn-secondary flex-1 gap-2 text-sm">
                <Zap className="w-3.5 h-3.5" /> Analyze Mine
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
