'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import {
  Zap, Brain, TrendingUp, Users, BookOpen, ArrowRight, ArrowUpRight,
  Wand2, Swords, Users2, Search, MessageSquare, Crown, ShieldCheck,
  BarChart3, Flame, Target, Calendar, ChevronRight, Sparkles, Trophy,
  Award, Crosshair, Gamepad2, TrendingDown, Bug, Eye,
  Radio, ExternalLink,
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
  communityBuilds: { id: number; name: string; position: string; likes: number; views: number }[]
  metaTrends: { name: string; category: string; tier: string; usage_rate: number; trend: string; description: string }[]
}

const TOOLS = [
  { href: '/vision',    icon: Eye,           label: '2K Vision',        desc: 'Gamertag recon + in-game build X-Ray', accent: '#E11D48', glow: 'rgba(225,29,72,0.18)', hot: true },
  { href: '/analyze',   icon: Zap,           label: 'Build Analyzer',   desc: 'Screenshot → instant AI breakdown',   accent: '#F59E0B', glow: 'rgba(245,158,11,0.15)' },
  { href: '/coach',     icon: Brain,         label: 'AI Coach',         desc: 'Ask anything — searches web live',    accent: '#38BDF8', glow: 'rgba(56,189,248,0.15)' },
  { href: '/optimize',  icon: Wand2,         label: 'Build Optimizer',  desc: 'Describe your playstyle, get a build', accent: '#8B5CF6', glow: 'rgba(139,92,246,0.15)' },
  { href: '/matchup',   icon: Swords,        label: '1v1 Simulator',    desc: 'AI win probability + coaching tips',  accent: '#10B981', glow: 'rgba(16,185,129,0.15)' },
  { href: '/meta',      icon: TrendingUp,    label: 'Meta Tracker',     desc: 'S-tier builds, badges, jumpshots',    accent: '#34D399', glow: 'rgba(52,211,153,0.15)' },
  { href: '/squad',     icon: Users2,        label: 'Squad Builder',    desc: 'AI chemistry report for your crew',   accent: '#FB7185', glow: 'rgba(251,113,133,0.15)' },
  { href: '/find',      icon: Search,        label: 'Find Players',     desc: 'LFG for Park, Rec, Pro-Am',           accent: '#A78BFA', glow: 'rgba(167,139,250,0.15)' },
  { href: '/messages',  icon: MessageSquare, label: 'Messages',         desc: 'Direct messages with teammates',      accent: '#7DD3FC', glow: 'rgba(125,211,252,0.15)' },
  { href: '/badges',    icon: Award,         label: 'Badge Reference',  desc: 'All Season 7 badges with tier list',  accent: '#FBBF24', glow: 'rgba(251,191,36,0.15)' },
  { href: '/jumpshots', icon: Crosshair,     label: 'Jumpshot Finder',  desc: 'Best base + releases for your build', accent: '#F472B6', glow: 'rgba(244,114,182,0.15)' },
  { href: '/leaderboard',icon: Trophy,       label: 'Leaderboard',      desc: 'Top community builds by likes',       accent: '#FCD34D', glow: 'rgba(252,211,77,0.15)' },
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
        className="group flex items-center gap-3.5 p-3.5 rounded-xl transition-all duration-200 hover:bg-white/04 border border-transparent hover:border-white/06 relative"
        style={tool.hot ? { border: `1px solid ${tool.accent}22`, background: `${tool.accent}06` } : undefined}
      >
        {tool.hot && (
          <span className="absolute top-2 right-2 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded"
            style={{ background: `${tool.accent}22`, color: tool.accent, border: `1px solid ${tool.accent}33` }}>
            NEW
          </span>
        )}
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

const PATCH_NOTES = [
  {
    icon: Gamepad2,
    color: '#38BDF8',
    label: 'Gameplay',
    text: 'Refined drive transitions from standing stepback moves to better match real-world momentum and physics — effectively patching out the small-guard left-right speed booster glitch.',
  },
  {
    icon: TrendingUp,
    color: '#10B981',
    label: 'Buff',
    text: 'Tall guards and centers receive an indirect balance buff due to the removal of small-build speed exploits. Height-based builds are now more viable in competitive modes.',
  },
  {
    icon: TrendingDown,
    color: '#F59E0B',
    label: 'Nerf',
    text: 'LeBron hotback and D-Book move physics have been heavily adjusted to limit animation chaining. Signature combos now respect stamina curves and cooldown windows.',
  },
  {
    icon: Bug,
    color: '#FB7185',
    label: 'Bug Fix',
    text: 'Resolved an NBA Cup blocker issue in MyNBA tied to non-standard user schedules. Affected saves can now progress past the Cup scheduling screen.',
  },
]

function PatchBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08, type: 'spring', stiffness: 240, damping: 26 }}
      className="card overflow-hidden"
    >
      {/* Header */}
      <div className="px-5 pt-4 pb-3 flex items-center gap-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: '#10B981' }} />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ background: '#10B981' }} />
          </span>
          <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-emerald-400">Live Update</span>
        </div>
        <div className="h-3.5 w-px bg-white/10" />
        <div className="flex items-center gap-1.5">
          <Radio className="w-3.5 h-3.5 text-white/30" />
          <p className="text-sm font-bold text-white/80">Season 7 Patch Notes</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="chip text-[10px] font-bold"
            style={{ background: 'rgba(225,29,72,0.1)', border: '1px solid rgba(225,29,72,0.2)', color: '#FB7185' }}>
            May 2026
          </span>
        </div>
      </div>

      {/* Changes */}
      <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
        {PATCH_NOTES.map(({ icon: Icon, color, label, text }) => (
          <div key={label} className="flex gap-3.5 px-5 py-3.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{ background: `${color}14`, border: `1px solid ${color}22` }}>
              <Icon className="w-3.5 h-3.5" style={{ color }} />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider mr-2" style={{ color }}>{label}</span>
              <span className="text-[13px] text-white/55 leading-relaxed">{text}</span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

function DiscordCTA() {
  return (
    <motion.a
      href="https://discord.gg/h7DQqVvwdA"
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.14, type: 'spring', stiffness: 240, damping: 26 }}
      whileHover={{ scale: 1.012 }}
      whileTap={{ scale: 0.988 }}
      className="group block w-full rounded-2xl relative overflow-hidden cursor-pointer"
      style={{
        background: '#5865F2',
        boxShadow: '0 0 0 1px rgba(88,101,242,0.4), 0 8px 32px rgba(88,101,242,0.35), 0 0 60px rgba(88,101,242,0.15)',
      }}
    >
      {/* Subtle inner highlight */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 50%)' }} />
      {/* Neon glow pulse */}
      <div className="absolute inset-0 pointer-events-none rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ boxShadow: 'inset 0 0 40px rgba(88,101,242,0.3)' }} />
      {/* Top shimmer line */}
      <div className="absolute top-0 left-[10%] right-[10%] h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)' }} />

      <div className="relative flex items-center justify-center gap-4 px-6 py-5">
        {/* Discord icon */}
        <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.25)' }}>
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white" aria-hidden>
            <path d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 0 0-.079.036c-.21.369-.444.85-.608 1.23a18.566 18.566 0 0 0-5.487 0 12.36 12.36 0 0 0-.617-1.23A.077.077 0 0 0 8.562 3c-1.714.29-3.354.8-4.885 1.491a.07.07 0 0 0-.032.027C.533 9.093-.32 13.555.099 17.961a.08.08 0 0 0 .031.055 20.03 20.03 0 0 0 5.993 2.98.078.078 0 0 0 .084-.026c.462-.62.874-1.275 1.226-1.963.021-.04.001-.088-.041-.104a13.201 13.201 0 0 1-1.872-.878.075.075 0 0 1-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 0 1 .078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 0 1 .079.009c.12.098.245.195.372.288a.075.075 0 0 1-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 0 0-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 0 0 .084.028 19.963 19.963 0 0 0 6.002-2.981.076.076 0 0 0 .032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 0 0-.031-.028zM8.02 15.278c-1.182 0-2.157-1.069-2.157-2.38 0-1.312.956-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.956 2.38-2.157 2.38zm7.975 0c-1.183 0-2.157-1.069-2.157-2.38 0-1.312.955-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.946 2.38-2.157 2.38z" />
          </svg>
        </div>

        <div className="text-center flex-1">
          <p className="text-white font-black text-lg sm:text-xl tracking-tight leading-tight">
            JOIN THE COURT IQ DISCORD SQUAD
          </p>
          <p className="text-white/60 text-xs mt-1 font-medium">Patch alerts · build drops · meta discussions · giveaways</p>
        </div>

        <ExternalLink className="w-5 h-5 text-white/50 flex-shrink-0 group-hover:text-white/80 transition-colors" />
      </div>
    </motion.a>
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

        {/* ── Patch notes + Discord ── */}
        <div className="px-6 lg:px-8 pb-6 space-y-3">
          <PatchBanner />
          <DiscordCTA />
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
                    <Link href="/leaderboard" className="text-[11px] font-semibold text-rose-400/70 hover:text-rose-400 flex items-center gap-1">
                      View all <ArrowUpRight className="w-3 h-3" />
                    </Link>
                  </div>
                  <div className="space-y-2">
                    {data.communityBuilds.map((b, i) => (
                      <Link key={i} href={`/builds/${b.id}`} className="flex items-center gap-3 py-2 border-b last:border-0 hover:bg-white/[0.02] -mx-1 px-1 rounded transition-colors group" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                        <div className="w-8 h-8 rounded-lg bg-white/04 border border-white/08 flex items-center justify-center text-[10px] font-bold text-white/40 flex-shrink-0">
                          {(b.position || 'PG').slice(0, 2)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white/80 truncate group-hover:text-white/90 transition-colors">{b.name || 'Untitled Build'}</p>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-white/30 flex-shrink-0">
                          <span className="flex items-center gap-1"><Flame className="w-3 h-3 text-rose-500/50" />{b.likes ?? 0}</span>
                        </div>
                      </Link>
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
