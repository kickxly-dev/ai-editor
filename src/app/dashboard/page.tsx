'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import {
  Zap, Brain, TrendingUp, Users, BookOpen, ArrowRight, ArrowUpRight,
  Wand2, Swords, Users2, Search, MessageSquare, Crown, ShieldCheck,
  BarChart3, Flame, Target, Calendar, ChevronRight, Sparkles, Trophy,
  Calculator, Award, Crosshair
} from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'

type DashboardData = {
  profile: {
    username: string | null
    totalBuilds: number
    isPremium: boolean
    isVerified: boolean
    isAdmin: boolean
    daysActive: number
    joinedAt: string
  }
  communityBuilds: { name: string; position: string; likes: number; views: number }[]
  metaTrends: { name: string; category: string; tier: string; usage_rate: number; trend: string; description: string }[]
}

const TOOLS = [
  { href: '/analyze',   icon: Zap,          label: 'Build Analyzer',   desc: 'Screenshot → instant AI breakdown',   accent: '#E11D48', glow: 'rgba(225,29,72,0.15)' },
  { href: '/coach',     icon: Brain,         label: 'AI Coach',         desc: 'Live search + Groq answers',          accent: '#38BDF8', glow: 'rgba(56,189,248,0.15)' },
  { href: '/optimize',  icon: Wand2,         label: 'Build Optimizer',  desc: 'Describe style, get full build',      accent: '#8B5CF6', glow: 'rgba(139,92,246,0.15)' },
  { href: '/matchup',   icon: Swords,        label: '1v1 Simulator',    desc: 'Win probability + key matchup tips',  accent: '#F59E0B', glow: 'rgba(245,158,11,0.15)' },
  { href: '/meta',      icon: TrendingUp,    label: 'Meta Tracker',     desc: "S-tier builds, badges, jumpshots",    accent: '#10B981', glow: 'rgba(16,185,129,0.15)' },
  { href: '/squad',     icon: Users2,        label: 'Squad Builder',    desc: 'AI chemistry report for your crew',   accent: '#FB7185', glow: 'rgba(251,113,133,0.15)' },
  { href: '/find',      icon: Search,        label: 'Find Players',     desc: 'LFG for Park, Rec, Pro-Am',           accent: '#34D399', glow: 'rgba(52,211,153,0.15)' },
  { href: '/messages',  icon: MessageSquare, label: 'Messages',         desc: 'Direct messages with teammates',      accent: '#A78BFA', glow: 'rgba(167,139,250,0.15)' },
  { href: '/vc-calc',   icon: Calculator,    label: 'VC Calculator',    desc: 'Exact upgrade cost to hit your stats', accent: '#F97316', glow: 'rgba(249,115,22,0.15)' },
  { href: '/badges',    icon: Award,         label: 'Badge Reference',  desc: 'All Season 5 badges with tier list',  accent: '#FBBF24', glow: 'rgba(251,191,36,0.15)' },
  { href: '/roast',     icon: Flame,         label: 'Roast My Build',   desc: 'AI roasts + shareable PNG card',      accent: '#EF4444', glow: 'rgba(239,68,68,0.15)' },
  { href: '/jumpshots', icon: Crosshair,     label: 'Jumpshot Finder',  desc: 'Best base + releases for your build',  accent: '#F472B6', glow: 'rgba(244,114,182,0.15)' },
]

const TIER_COLORS: Record<string, string> = {
  S: '#FB7185', A: '#FCD34D', B: '#7DD3FC', C: '#34D399', D: '#A1A1AA',
}

function SkeletonBar({ w = 'w-full' }: { w?: string }) {
  return <div className={`skeleton h-3 rounded-full ${w}`} />
}

function StatCard({
  label, value, icon: Icon, color, sub, delay = 0
}: {
  label: string; value: string | number; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  color: string; sub?: string; delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: 'spring', stiffness: 260, damping: 24 }}
      className="card p-5 relative overflow-hidden group"
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"
        style={{ background: `radial-gradient(ellipse at 0% 100%, ${color}10 0%, transparent 60%)` }} />
      <div className="flex items-start justify-between mb-4">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
      </div>
      <p className="mono text-2xl font-bold text-white tracking-tight mb-0.5">{value}</p>
      <p className="text-[11px] font-semibold text-white/35 uppercase tracking-wider">{label}</p>
      {sub && <p className="text-[10px] text-white/20 mt-0.5">{sub}</p>}
    </motion.div>
  )
}

function ToolCard({ tool, i }: { tool: typeof TOOLS[0]; i: number }) {
  const { icon: Icon } = tool
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 + i * 0.04, type: 'spring', stiffness: 260, damping: 26 }}
    >
      <Link href={tool.href}
        className="group flex items-center gap-3.5 p-3.5 rounded-xl transition-all duration-200 hover:bg-white/04 border border-transparent hover:border-white/06"
      >
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-110"
          style={{ background: `${tool.accent}14`, border: `1px solid ${tool.accent}20` }}>
          <Icon className="w-4 h-4" style={{ color: tool.accent }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white/85 tracking-tight">{tool.label}</p>
          <p className="text-[11px] text-white/35 truncate">{tool.desc}</p>
        </div>
        <ChevronRight className="w-3.5 h-3.5 text-white/15 group-hover:text-white/50 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
      </Link>
    </motion.div>
  )
}

function TrendRow({ t, i }: { t: DashboardData['metaTrends'][0]; i: number }) {
  const tierColor = TIER_COLORS[t.tier] || '#A1A1AA'
  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 + i * 0.06 }}
      className="flex items-center gap-3 py-3 border-b last:border-0"
      style={{ borderColor: 'rgba(255,255,255,0.055)' }}
    >
      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-[10px] font-black"
        style={{ background: `${tierColor}15`, border: `1px solid ${tierColor}25`, color: tierColor }}>
        {t.tier}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-white/85 truncate">{t.name}</p>
        <p className="text-[10px] text-white/30">{t.category} · {t.usage_rate}% usage</p>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        {t.trend === 'up' && <Flame className="w-3 h-3 text-rose-400" />}
        {t.trend === 'stable' && <Target className="w-3 h-3 text-white/25" />}
        {t.trend === 'down' && <TrendingUp className="w-3 h-3 text-white/20 rotate-180" />}
      </div>
    </motion.div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setData(d) })
      .finally(() => setLoading(false))
  }, [])

  const profile = data?.profile
  const displayName = profile?.username || session?.user?.name || session?.user?.email?.split('@')[0] || 'Player'
  const isAdmin = profile?.isAdmin || (session?.user as { isAdmin?: boolean })?.isAdmin

  return (
    <AppLayout>
      <div className="min-h-screen">

        {/* ── Top header band ── */}
        <div className="px-6 lg:px-8 pt-8 pb-6">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-white/35 text-sm mb-1.5">{getGreeting()}</p>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="display text-3xl sm:text-4xl text-white">{displayName}</h1>
                <div className="flex items-center gap-1.5">
                  {profile?.isPremium && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                      style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.22)', color: '#FCD34D' }}>
                      <Crown className="w-2.5 h-2.5" /> Pro
                    </span>
                  )}
                  {profile?.isVerified && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                      style={{ background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)', color: '#7DD3FC' }}>
                      <ShieldCheck className="w-2.5 h-2.5" /> Verified
                    </span>
                  )}
                  {isAdmin && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                      style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.18)', color: '#FBBF24' }}>
                      Admin
                    </span>
                  )}
                </div>
              </div>
            </div>
            <Link href="/analyze" className="btn btn-primary btn-sm gap-1.5 flex-shrink-0">
              <Zap className="w-3.5 h-3.5" /> Analyze Build
            </Link>
          </motion.div>
        </div>

        {/* ── Stats strip ── */}
        <div className="px-6 lg:px-8 pb-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="card p-5">
                  <div className="skeleton w-9 h-9 rounded-xl mb-4" />
                  <SkeletonBar w="w-14" />
                  <div className="mt-2"><SkeletonBar w="w-20" /></div>
                </div>
              ))
            ) : (
              <>
                <StatCard label="Builds Saved" value={profile?.totalBuilds ?? 0} icon={BarChart3} color="#E11D48" delay={0} />
                <StatCard label="Days Active" value={profile?.daysActive ?? 1} icon={Calendar} color="#38BDF8" sub="since joined" delay={0.06} />
                <StatCard label="Coach Sessions" value="∞" icon={Brain} color="#8B5CF6" sub="AI powered" delay={0.12} />
                <StatCard label="Meta Rank" value={profile?.isPremium ? 'Pro' : 'Free'} icon={Trophy} color="#F59E0B" delay={0.18} />
              </>
            )}
          </div>
        </div>

        {/* ── Main grid ── */}
        <div className="px-6 lg:px-8 pb-10">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

            {/* LEFT — Tools grid */}
            <div className="xl:col-span-2 space-y-5">

              {/* Tool launcher */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="card p-1.5">
                <div className="px-4 pt-3 pb-1 flex items-center justify-between">
                  <p className="text-[11px] font-bold text-white/30 uppercase tracking-[0.15em]">All Tools</p>
                  <Sparkles className="w-3.5 h-3.5 text-white/15" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-0.5 p-1">
                  {TOOLS.map((tool, i) => <ToolCard key={tool.href} tool={tool} i={i} />)}
                </div>
              </motion.div>

              {/* Community builds */}
              {data?.communityBuilds && data.communityBuilds.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card p-5">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[11px] font-bold text-white/30 uppercase tracking-[0.15em]">Top Community Builds</p>
                    <Link href="/builds" className="text-[11px] font-semibold text-rose-400/70 hover:text-rose-400 flex items-center gap-1">
                      View all <ArrowUpRight className="w-3 h-3" />
                    </Link>
                  </div>
                  <div className="space-y-2">
                    {data.communityBuilds.map((b, i) => (
                      <div key={i} className="flex items-center gap-3 py-2 border-b last:border-0" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                        <div className="w-8 h-8 rounded-lg bg-white/04 border border-white/08 flex items-center justify-center text-[10px] font-bold text-white/40 flex-shrink-0">
                          {(b.position || 'PG').slice(0, 2)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white/80 truncate">{b.name || 'Untitled Build'}</p>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-white/30 flex-shrink-0">
                          <span className="flex items-center gap-1"><Flame className="w-3 h-3 text-rose-500/50" />{b.likes ?? 0}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* RIGHT — Meta + CTA */}
            <div className="space-y-4">

              {/* Meta snapshot */}
              <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} className="card p-5">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[11px] font-bold text-white/30 uppercase tracking-[0.15em]">Meta Snapshot</p>
                  <Link href="/meta" className="text-[11px] font-semibold text-emerald-400/60 hover:text-emerald-400 flex items-center gap-1">
                    Full meta <ArrowUpRight className="w-3 h-3" />
                  </Link>
                </div>
                <p className="text-[10px] text-white/20 mb-4">Season 5 · Patch 1.08</p>
                {loading ? (
                  <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <SkeletonBar key={i} />)}</div>
                ) : data?.metaTrends && data.metaTrends.length > 0 ? (
                  data.metaTrends.map((t, i) => <TrendRow key={t.name} t={t} i={i} />)
                ) : (
                  <div className="text-center py-6">
                    <p className="text-xs text-white/25 mb-3">No meta data yet</p>
                    <Link href="/admin" className="text-xs text-amber-400/70 hover:text-amber-400">Seed meta →</Link>
                  </div>
                )}
              </motion.div>

              {/* AI Coach CTA */}
              <motion.div
                initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.22 }}
                className="card p-5 relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, rgba(56,189,248,0.06) 0%, rgba(17,17,22,1) 60%)' }}
              >
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full pointer-events-none"
                  style={{ background: 'radial-gradient(circle, rgba(56,189,248,0.08) 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 relative"
                  style={{ background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)' }}>
                  <Brain className="w-5 h-5 text-sky-400" />
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full" style={{ boxShadow: '0 0 6px rgba(16,185,129,0.6)' }} />
                </div>
                <p className="font-bold text-white mb-1">AI Coach is online</p>
                <p className="text-xs text-white/40 leading-relaxed mb-4">Live web search + Groq. Ask anything about 2K26 builds, badges, or meta.</p>
                <Link href="/coach" className="btn btn-sm w-full justify-center gap-1.5"
                  style={{ background: 'rgba(56,189,248,0.12)', border: '1px solid rgba(56,189,248,0.2)', color: '#7DD3FC' }}>
                  <Brain className="w-3.5 h-3.5" /> Start Session
                  <ArrowRight className="w-3 h-3 ml-auto" />
                </Link>
              </motion.div>

              {/* Analyze CTA */}
              <motion.div
                initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.28 }}
                className="card p-5 relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, rgba(225,29,72,0.07) 0%, rgba(17,17,22,1) 60%)' }}
              >
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full pointer-events-none"
                  style={{ background: 'radial-gradient(circle, rgba(225,29,72,0.08) 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
                <p className="chip chip-crimson mb-4 w-fit">Screenshot Analysis</p>
                <p className="font-bold text-white mb-1">Drop your build screenshot</p>
                <p className="text-xs text-white/40 leading-relaxed mb-4">AI extracts every stat, rates your build, and gives upgrade recommendations.</p>
                <Link href="/analyze" className="btn btn-primary btn-sm w-full justify-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" /> Analyze Now
                </Link>
              </motion.div>

              {/* Quick find */}
              <motion.div
                initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.32 }}
                className="card p-4 flex items-center gap-3"
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.18)' }}>
                  <Users className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white/80">Find Teammates</p>
                  <p className="text-[11px] text-white/30">LFG · Park, Rec, Pro-Am</p>
                </div>
                <Link href="/find" className="btn btn-ghost btn-sm p-2">
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
