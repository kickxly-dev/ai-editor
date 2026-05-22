'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import {
  Zap, Brain, TrendingUp, Users, BookOpen, ArrowUpRight,
  Wand2, Swords, Users2, Search, MessageSquare,
  BarChart3, Flame, Target, Calendar, ChevronRight,
  Trophy, Award, Crosshair, TrendingDown, Bug,
  Eye, Radio, ExternalLink, Crown, ShieldCheck,
} from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Featured tools (primary) ─────────────────────────────────────────────────

const FEATURED = [
  { href: '/vision',   icon: Eye,   label: '2K Vision',   desc: 'Pre-game recon. In-game intelligence.',  accent: '#E11D48', badge: 'NEW' },
  { href: '/analyze',  icon: Zap,   label: 'Analyzer',    desc: 'Screenshot → instant AI breakdown.',     accent: '#F59E0B' },
  { href: '/coach',    icon: Brain, label: 'AI Coach',    desc: 'Ask anything. Searches the web live.',   accent: '#38BDF8' },
  { href: '/optimize', icon: Wand2, label: 'Optimizer',   desc: 'Describe your playstyle, get a build.',  accent: '#8B5CF6' },
]

// ─── Secondary tools ──────────────────────────────────────────────────────────

const SECONDARY = [
  { href: '/matchup',      icon: Swords,       label: '1v1 Simulator',  accent: '#10B981' },
  { href: '/meta',         icon: TrendingUp,   label: 'Meta Tracker',   accent: '#34D399' },
  { href: '/builds',       icon: Users,        label: 'Builds',         accent: '#FB7185' },
  { href: '/build-planner',icon: Target,       label: 'Build Planner',  accent: '#A78BFA' },
  { href: '/badges',       icon: Award,        label: 'Badges',         accent: '#FBBF24' },
  { href: '/jumpshots',    icon: Crosshair,    label: 'Jumpshots',      accent: '#F472B6' },
  { href: '/squad',        icon: Users2,       label: 'Squad Builder',  accent: '#7DD3FC' },
  { href: '/find',         icon: Search,       label: 'Find Players',   accent: '#A78BFA' },
  { href: '/messages',     icon: MessageSquare,label: 'Messages',       accent: '#7DD3FC' },
  { href: '/leaderboard',  icon: Trophy,       label: 'Leaderboard',   accent: '#FCD34D' },
  { href: '/tutorials',    icon: BookOpen,     label: 'Learn',          accent: '#86EFAC' },
]

// ─── Patch notes ──────────────────────────────────────────────────────────────

const PATCH_NOTES = [
  { icon: Zap,         color: '#38BDF8', label: 'Gameplay', text: 'Refined drive transitions from standing stepback moves — effectively patching out the small-guard speed booster glitch.' },
  { icon: TrendingUp,  color: '#10B981', label: 'Buff',     text: 'Tall guards and centers receive an indirect balance buff. Height-based builds are now more viable in competitive modes.' },
  { icon: TrendingDown,color: '#F59E0B', label: 'Nerf',     text: 'LeBron hotback and D-Book move physics adjusted. Signature combos now respect stamina curves and cooldown windows.' },
  { icon: Bug,         color: '#FB7185', label: 'Fix',       text: 'Resolved NBA Cup blocker in MyNBA tied to non-standard schedules. Affected saves can now progress normally.' },
]

const TIER_COLORS: Record<string, string> = {
  S: '#FB7185', A: '#FCD34D', B: '#7DD3FC', C: '#34D399', D: '#A1A1AA',
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold text-white/25 uppercase tracking-[0.18em] mb-3 select-none">
      {children}
    </p>
  )
}

// ─── Featured tool card ───────────────────────────────────────────────────────

function FeaturedCard({ tool, i }: { tool: typeof FEATURED[0]; i: number }) {
  const Icon = tool.icon
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.06 + i * 0.05, type: 'spring', stiffness: 280, damping: 26 }}
    >
      <Link href={tool.href}
        className="group relative flex flex-col h-full min-h-[110px] p-4 rounded-2xl transition-all duration-200 overflow-hidden"
        style={{
          background: '#111118',
          border: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        {/* Hover glow */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl"
          style={{ background: `radial-gradient(ellipse at 0% 100%, ${tool.accent}0D 0%, transparent 65%)` }} />
        {/* Hover border tint */}
        <div className="absolute inset-0 rounded-2xl transition-opacity duration-200 opacity-0 group-hover:opacity-100 pointer-events-none"
          style={{ boxShadow: `inset 0 0 0 1px ${tool.accent}18` }} />

        <div className="flex items-start justify-between mb-auto">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: `${tool.accent}14`, border: `1px solid ${tool.accent}22` }}>
            <Icon className="w-4 h-4" style={{ color: tool.accent }} />
          </div>
          {tool.badge && (
            <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded"
              style={{ background: `${tool.accent}18`, color: tool.accent, border: `1px solid ${tool.accent}28` }}>
              {tool.badge}
            </span>
          )}
        </div>

        <div className="mt-3">
          <p className="text-[14px] font-semibold text-white/90 leading-tight mb-1 group-hover:text-white transition-colors">
            {tool.label}
          </p>
          <p className="text-[11px] text-white/35 leading-snug">{tool.desc}</p>
        </div>

        <ChevronRight className="absolute bottom-3.5 right-3.5 w-3.5 h-3.5 text-white/15 group-hover:text-white/40 group-hover:translate-x-0.5 transition-all" />
      </Link>
    </motion.div>
  )
}

// ─── Secondary tool row ───────────────────────────────────────────────────────

function SecondaryTool({ tool, i }: { tool: typeof SECONDARY[0]; i: number }) {
  const Icon = tool.icon
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.18 + i * 0.025 }}
    >
      <Link href={tool.href}
        className="group flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all duration-150 hover:bg-white/[0.035] border border-transparent hover:border-white/[0.06]">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${tool.accent}12`, border: `1px solid ${tool.accent}1C` }}>
          <Icon className="w-3.5 h-3.5" style={{ color: tool.accent }} />
        </div>
        <span className="text-[13px] font-medium text-white/60 group-hover:text-white/85 transition-colors flex-1">{tool.label}</span>
        <ChevronRight className="w-3 h-3 text-white/10 group-hover:text-white/35 group-hover:translate-x-0.5 transition-all" />
      </Link>
    </motion.div>
  )
}

// ─── Stat strip ───────────────────────────────────────────────────────────────

function StatStrip({ profile, loading }: { profile: DashboardData['profile'] | undefined; loading: boolean }) {
  const stats = [
    { label: 'Builds', value: loading ? '—' : String(profile?.totalBuilds ?? 0), icon: BarChart3, color: '#E11D48' },
    { label: 'Days Active', value: loading ? '—' : String(profile?.daysActive ?? 1), icon: Calendar, color: '#38BDF8' },
    { label: 'AI Sessions', value: '∞', icon: Brain, color: '#8B5CF6' },
    { label: 'Status', value: loading ? '—' : (profile?.isPremium ? 'Pro' : 'Free'), icon: Trophy, color: '#F59E0B' },
  ]
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}
      className="grid grid-cols-2 sm:grid-cols-4 divide-x"
      style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, overflow: 'hidden' }}>
      {stats.map(({ label, value, icon: Icon, color }) => (
        <div key={label} className="flex items-center gap-3 px-4 py-3.5 sm:py-4">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 hidden sm:flex"
            style={{ background: `${color}12`, border: `1px solid ${color}1C` }}>
            <Icon className="w-3.5 h-3.5" style={{ color }} />
          </div>
          <div>
            <p className="text-[18px] font-bold text-white leading-none tabular-nums">{value}</p>
            <p className="text-[10px] text-white/30 font-medium mt-0.5">{label}</p>
          </div>
        </div>
      ))}
    </motion.div>
  )
}

// ─── Patch banner ─────────────────────────────────────────────────────────────

function PatchBanner() {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
      className="rounded-2xl overflow-hidden"
      style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="px-4 py-3 flex items-center gap-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <span className="relative flex h-2 w-2 flex-shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: '#10B981' }} />
          <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: '#10B981' }} />
        </span>
        <div className="flex items-center gap-2">
          <Radio className="w-3 h-3 text-white/25" />
          <p className="text-[13px] font-semibold text-white/80">Season 7 Patch Notes</p>
        </div>
        <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full"
          style={{ background: 'rgba(225,29,72,0.1)', border: '1px solid rgba(225,29,72,0.18)', color: '#FB7185' }}>
          May 2026
        </span>
      </div>
      <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
        {PATCH_NOTES.map(({ icon: Icon, color, label, text }) => (
          <div key={label} className="flex gap-3 px-4 py-3">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{ background: `${color}12`, border: `1px solid ${color}1E` }}>
              <Icon className="w-3 h-3" style={{ color }} />
            </div>
            <div>
              <span className="text-[9px] font-bold uppercase tracking-wider mr-2" style={{ color }}>{label}</span>
              <span className="text-[12px] text-white/45 leading-relaxed">{text}</span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

// ─── Meta snapshot ────────────────────────────────────────────────────────────

function MetaSnapshot({ trends, loading }: { trends: DashboardData['metaTrends'] | undefined; loading: boolean }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.16 }}
      className="rounded-2xl overflow-hidden"
      style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div>
          <p className="text-[13px] font-semibold text-white/80">Meta Snapshot</p>
          <p className="text-[10px] text-white/25">Season 7 · Patch 1.08</p>
        </div>
        <Link href="/meta" className="text-[11px] font-semibold text-emerald-400/60 hover:text-emerald-400 flex items-center gap-1 transition-colors">
          Full meta <ArrowUpRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="p-1">
        {loading ? (
          <div className="space-y-1 p-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton h-10 rounded-xl" />
            ))}
          </div>
        ) : trends && trends.length > 0 ? trends.map((t, i) => {
          const tierColor = TIER_COLORS[t.tier] || '#A1A1AA'
          return (
            <div key={t.name} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.025] transition-colors">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 text-[9px] font-black"
                style={{ background: `${tierColor}14`, border: `1px solid ${tierColor}22`, color: tierColor }}>
                {t.tier}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-white/80 truncate">{t.name}</p>
                <p className="text-[10px] text-white/25">{t.category} · {t.usage_rate}%</p>
              </div>
              {t.trend === 'up' && <Flame className="w-3 h-3 text-rose-400 flex-shrink-0" />}
              {t.trend === 'stable' && <Target className="w-3 h-3 text-white/20 flex-shrink-0" />}
            </div>
          )
        }) : (
          <div className="text-center py-8">
            <p className="text-xs text-white/25 mb-2">No meta data yet</p>
            <Link href="/admin" className="text-xs text-amber-400/60 hover:text-amber-400">Seed meta →</Link>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ─── Discord CTA ──────────────────────────────────────────────────────────────

function DiscordCTA() {
  return (
    <motion.a
      href="https://discord.gg/h7DQqVvwdA"
      target="_blank" rel="noopener noreferrer"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.22 }}
      whileHover={{ scale: 1.012 }} whileTap={{ scale: 0.988 }}
      className="group flex items-center gap-4 w-full rounded-2xl px-5 py-4 relative overflow-hidden cursor-pointer"
      style={{
        background: '#5865F2',
        boxShadow: '0 0 0 1px rgba(88,101,242,0.4), 0 8px 32px rgba(88,101,242,0.3)',
      }}
    >
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%)' }} />
      <div className="absolute top-0 left-[10%] right-[10%] h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)' }} />

      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.22)' }}>
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white" aria-hidden>
          <path d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 0 0-.079.036c-.21.369-.444.85-.608 1.23a18.566 18.566 0 0 0-5.487 0 12.36 12.36 0 0 0-.617-1.23A.077.077 0 0 0 8.562 3c-1.714.29-3.354.8-4.885 1.491a.07.07 0 0 0-.032.027C.533 9.093-.32 13.555.099 17.961a.08.08 0 0 0 .031.055 20.03 20.03 0 0 0 5.993 2.98.078.078 0 0 0 .084-.026c.462-.62.874-1.275 1.226-1.963.021-.04.001-.088-.041-.104a13.201 13.201 0 0 1-1.872-.878.075.075 0 0 1-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 0 1 .078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 0 1 .079.009c.12.098.245.195.372.288a.075.075 0 0 1-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 0 0-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 0 0 .084.028 19.963 19.963 0 0 0 6.002-2.981.076.076 0 0 0 .032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 0 0-.031-.028zM8.02 15.278c-1.182 0-2.157-1.069-2.157-2.38 0-1.312.956-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.956 2.38-2.157 2.38zm7.975 0c-1.183 0-2.157-1.069-2.157-2.38 0-1.312.955-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.946 2.38-2.157 2.38z" />
        </svg>
      </div>
      <div className="flex-1">
        <p className="text-white font-bold text-[15px] leading-tight">Join the CourtIQ Discord</p>
        <p className="text-white/55 text-[11px] mt-0.5">Patch alerts · build drops · meta discussions</p>
      </div>
      <ExternalLink className="w-4 h-4 text-white/40 group-hover:text-white/70 transition-colors flex-shrink-0" />
    </motion.a>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

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
        <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-8 pb-16 space-y-6">

          {/* ── Hero ── */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-start justify-between gap-4 flex-wrap pb-2">
            <div>
              <p className="text-[13px] text-white/30 mb-1.5">{getGreeting()}</p>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="display text-3xl sm:text-4xl font-bold text-white tracking-tight">{displayName}</h1>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {profile?.isPremium && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider"
                      style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', color: '#FCD34D' }}>
                      <Crown className="w-2.5 h-2.5" /> Pro
                    </span>
                  )}
                  {profile?.isVerified && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider"
                      style={{ background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.18)', color: '#7DD3FC' }}>
                      <ShieldCheck className="w-2.5 h-2.5" /> Verified
                    </span>
                  )}
                  {isAdmin && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider"
                      style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)', color: '#FBBF24' }}>
                      Admin
                    </span>
                  )}
                </div>
              </div>
              <p className="text-[13px] text-white/25 mt-1.5">Your NBA 2K26 command center.</p>
            </div>
            <Link href="/analyze"
              className="btn btn-primary btn-sm gap-1.5 flex-shrink-0 mt-1">
              <Zap className="w-3.5 h-3.5" /> Analyze Build
            </Link>
          </motion.div>

          {/* ── Stats strip ── */}
          <StatStrip profile={profile} loading={loading} />

          {/* ── Main grid ── */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

            {/* Left — tools */}
            <div className="xl:col-span-2 space-y-5">

              {/* Featured 4 */}
              <div>
                <SectionLabel>Quick Access</SectionLabel>
                <div className="grid grid-cols-2 gap-3">
                  {FEATURED.map((tool, i) => <FeaturedCard key={tool.href} tool={tool} i={i} />)}
                </div>
              </div>

              {/* All tools compact */}
              <div>
                <SectionLabel>All Tools</SectionLabel>
                <div className="rounded-2xl overflow-hidden"
                  style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 p-1.5 gap-0.5">
                    {SECONDARY.map((tool, i) => <SecondaryTool key={tool.href} tool={tool} i={i} />)}
                  </div>
                </div>
              </div>

              {/* Community builds */}
              {data?.communityBuilds && data.communityBuilds.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}>
                  <SectionLabel>Top Community Builds</SectionLabel>
                  <div className="rounded-2xl overflow-hidden"
                    style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <div className="p-1.5 space-y-px">
                      {data.communityBuilds.map((b) => (
                        <Link key={b.id} href={`/builds/${b.id}`}
                          className="group flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.03] transition-colors">
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-bold text-white/35 flex-shrink-0"
                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                            {(b.position || 'PG').slice(0, 2)}
                          </div>
                          <p className="text-[13px] font-medium text-white/70 flex-1 truncate group-hover:text-white/90 transition-colors">
                            {b.name || 'Untitled Build'}
                          </p>
                          <span className="flex items-center gap-1 text-[11px] text-white/25 flex-shrink-0">
                            <Flame className="w-3 h-3 text-rose-500/40" />{b.likes ?? 0}
                          </span>
                        </Link>
                      ))}
                    </div>
                    <div className="px-4 py-2.5" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <Link href="/leaderboard" className="text-[11px] font-semibold text-white/30 hover:text-white/60 flex items-center gap-1 transition-colors">
                        View leaderboard <ArrowUpRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Right — feed */}
            <div className="space-y-4">
              <PatchBanner />
              <MetaSnapshot trends={data?.metaTrends} loading={loading} />
            </div>
          </div>

          {/* ── Discord ── */}
          <DiscordCTA />

        </div>
      </div>
    </AppLayout>
  )
}
