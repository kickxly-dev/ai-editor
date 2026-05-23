'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import {
  Zap, Brain, TrendingUp, Users, BookOpen,
  Wand2, Swords, Target, Award, Crosshair,
  Users2, Search, MessageSquare, Eye,
  Trophy, ExternalLink, Crown, ShieldCheck,
  Sparkles, Activity, Clock, Calendar,
  Flame, ChevronRight, ArrowUpRight, TrendingDown, Bug,
} from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import { PageHeader, SectionLabel, Surface, MetricCard, ToolCard, Pill } from '@/components/ui/premium'

// ─── Data types ───────────────────────────────────────────────────────────────

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

// ─── Tools config ─────────────────────────────────────────────────────────────

const FEATURED = [
  { href: '/vision',   icon: Eye,   label: 'AI Vision Coach', desc: 'Live coaching while you play. Phone-at-TV.', accent: '#E11D48', badge: 'NEW' },
  { href: '/analyze',  icon: Zap,   label: 'Build Analyzer',  desc: 'Screenshot to instant AI breakdown.',        accent: '#F59E0B' },
  { href: '/coach',    icon: Brain, label: 'AI Coach',        desc: 'Ask anything. Searches the web live.',       accent: '#38BDF8' },
  { href: '/optimize', icon: Wand2, label: 'Build Optimizer', desc: 'Describe your playstyle, get a build.',      accent: '#8B5CF6' },
] as const

const COMMUNITY = [
  { href: '/matchup',       icon: Swords,        label: '1v1 Simulator',  accent: '#10B981' },
  { href: '/meta',          icon: TrendingUp,    label: 'Meta Tracker',   accent: '#34D399' },
  { href: '/builds',        icon: Users,         label: 'Builds',         accent: '#FB7185' },
  { href: '/build-planner', icon: Target,        label: 'Build Planner',  accent: '#A78BFA' },
  { href: '/badges',        icon: Award,         label: 'Badges',         accent: '#FBBF24' },
  { href: '/jumpshots',     icon: Crosshair,     label: 'Jumpshots',      accent: '#F472B6' },
  { href: '/squad',         icon: Users2,        label: 'Squad Builder',  accent: '#7DD3FC' },
  { href: '/find',          icon: Search,        label: 'Find Players',   accent: '#A78BFA' },
  { href: '/messages',      icon: MessageSquare, label: 'Messages',       accent: '#7DD3FC' },
  { href: '/leaderboard',   icon: Trophy,        label: 'Leaderboard',    accent: '#FCD34D' },
  { href: '/tutorials',     icon: BookOpen,      label: 'Learn',          accent: '#86EFAC' },
] as const

const PATCH_NOTES = [
  { icon: Zap,          color: '#38BDF8', label: 'Gameplay', text: 'Refined drive transitions from standing stepback moves — patching out the small-guard speed booster glitch.' },
  { icon: TrendingUp,   color: '#10B981', label: 'Buff',     text: 'Tall guards and centers receive an indirect balance buff. Height-based builds are more viable in competitive modes.' },
  { icon: TrendingDown, color: '#F59E0B', label: 'Nerf',     text: 'LeBron hotback and D-Book move physics adjusted. Signature combos now respect stamina curves and cooldown windows.' },
  { icon: Bug,          color: '#FB7185', label: 'Fix',      text: 'Resolved NBA Cup blocker in MyNBA tied to non-standard schedules. Affected saves can now progress normally.' },
] as const

const TIER_COLORS: Record<string, string> = {
  S: '#FB7185', A: '#FCD34D', B: '#7DD3FC', C: '#34D399', D: '#A1A1AA',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function todayLabel() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
}

// ─── Hero — greeting + status badges ──────────────────────────────────────────

function Hero({ name, profile, loading }: {
  name: string
  profile: DashboardData['profile'] | undefined
  loading: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-7 md:mb-9"
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-rose-400/70 mb-2">
        {todayLabel()}
      </p>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-[28px] md:text-[40px] font-black text-white leading-[1.02] tracking-tight">
          {getGreeting()},
          <br className="sm:hidden" />
          <span className="ml-0 sm:ml-3 bg-gradient-to-r from-white via-rose-200 to-rose-400 bg-clip-text text-transparent">
            {name}
          </span>
        </h1>

        {!loading && profile && (
          <div className="flex items-center gap-1.5">
            {profile.isAdmin && (
              <Pill accent="#FBBF24">
                <ShieldCheck className="w-2.5 h-2.5" />Admin
              </Pill>
            )}
            {profile.isPremium && (
              <Pill accent="#A78BFA">
                <Crown className="w-2.5 h-2.5" />Premium
              </Pill>
            )}
          </div>
        )}
      </div>
      <p className="text-white/40 text-[14px] mt-2.5 max-w-xl">
        Your AI playbook for NBA 2K26 — analyze, optimize, coach, and dominate.
      </p>
    </motion.div>
  )
}

// ─── Meta pulse row — top tier-S builds ───────────────────────────────────────

function MetaPulse({ trends }: { trends: DashboardData['metaTrends'] }) {
  const top = trends.filter(t => t.tier === 'S').slice(0, 3)
  if (!top.length) return null

  return (
    <Surface padding="lg" className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <SectionLabel accent="#FB7185">Live Meta Pulse</SectionLabel>
          <p className="text-white text-[18px] font-bold mt-1.5">S-Tier this week</p>
        </div>
        <Link
          href="/meta"
          className="text-[11px] font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors"
        >
          Full tier list <ArrowUpRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {top.map((t, i) => (
          <motion.div
            key={`${t.category}-${t.name}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 + i * 0.05 }}
            className="rounded-xl p-3.5"
            style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(251,113,133,0.18)' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span
                className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-black"
                style={{ background: `${TIER_COLORS[t.tier]}1f`, color: TIER_COLORS[t.tier] }}
              >
                {t.tier}
              </span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-white/35">{t.category}</span>
            </div>
            <p className="text-white text-[13px] font-semibold leading-tight truncate">{t.name}</p>
            <p className="text-white/35 text-[11px] mt-1">{t.usage_rate}% usage</p>
          </motion.div>
        ))}
      </div>
    </Surface>
  )
}

// ─── Trending community builds ────────────────────────────────────────────────

function TrendingBuilds({ builds }: { builds: DashboardData['communityBuilds'] }) {
  const top = builds.slice(0, 4)
  if (!top.length) return null

  return (
    <Surface padding="lg" className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <SectionLabel accent="#FBBF24">Trending</SectionLabel>
          <p className="text-white text-[18px] font-bold mt-1.5">Hot community builds</p>
        </div>
        <Link
          href="/builds"
          className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
        >
          Browse all <ArrowUpRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="space-y-2">
        {top.map((b, i) => (
          <motion.div
            key={b.id}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.04 + i * 0.04 }}
          >
            <Link
              href={`/builds/${b.id}`}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors hover:bg-white/[0.035]"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
            >
              <span
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0"
                style={{ background: 'rgba(251,113,133,0.12)', color: '#fda4af' }}
              >
                {b.position}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-white text-[13px] font-semibold truncate">{b.name}</p>
                <p className="text-white/30 text-[10.5px]">{b.likes} likes · {b.views} views</p>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-white/25 shrink-0" />
            </Link>
          </motion.div>
        ))}
      </div>
    </Surface>
  )
}

// ─── Patch notes ──────────────────────────────────────────────────────────────

function PatchNotes() {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <SectionLabel accent="#38BDF8">2K26 Patch Notes</SectionLabel>
          <p className="text-white text-[18px] font-bold mt-1.5">Latest from the dev team</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {PATCH_NOTES.map((p, i) => {
          const Icon = p.icon
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.04 + i * 0.04 }}
              className="rounded-2xl p-4"
              style={{ background: 'rgba(255,255,255,0.022)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `${p.color}14`, border: `1px solid ${p.color}24` }}
                >
                  <Icon className="w-4 h-4" style={{ color: p.color }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] font-bold uppercase tracking-wider mb-1.5" style={{ color: p.color }}>
                    {p.label}
                  </p>
                  <p className="text-white/65 text-[12.5px] leading-relaxed">{p.text}</p>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Discord CTA ──────────────────────────────────────────────────────────────

function DiscordCTA() {
  return (
    <motion.a
      href="https://discord.gg/h7DQqVvwdA"
      target="_blank" rel="noopener noreferrer"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="group flex items-center gap-4 rounded-2xl px-5 py-4 relative overflow-hidden cursor-pointer transition-shadow duration-300"
      style={{
        background: 'linear-gradient(135deg, #5865F2 0%, #4752C4 100%)',
        boxShadow: '0 8px 32px rgba(88,101,242,0.25)',
      }}
    >
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%)' }} />

      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.22)' }}>
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white" aria-hidden>
          <path d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 0 0-.079.036c-.21.369-.444.85-.608 1.23a18.566 18.566 0 0 0-5.487 0 12.36 12.36 0 0 0-.617-1.23A.077.077 0 0 0 8.562 3c-1.714.29-3.354.8-4.885 1.491a.07.07 0 0 0-.032.027C.533 9.093-.32 13.555.099 17.961a.08.08 0 0 0 .031.055 20.03 20.03 0 0 0 5.993 2.98.078.078 0 0 0 .084-.026c.462-.62.874-1.275 1.226-1.963.021-.04.001-.088-.041-.104a13.201 13.201 0 0 1-1.872-.878.075.075 0 0 1-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 0 1 .078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 0 1 .079.009c.12.098.245.195.372.288a.075.075 0 0 1-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 0 0-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 0 0 .084.028 19.963 19.963 0 0 0 6.002-2.981.076.076 0 0 0 .032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 0 0-.031-.028zM8.02 15.278c-1.182 0-2.157-1.069-2.157-2.38 0-1.312.956-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.956 2.38-2.157 2.38zm7.975 0c-1.183 0-2.157-1.069-2.157-2.38 0-1.312.955-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.946 2.38-2.157 2.38z" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white font-bold text-[15px] leading-tight">Join the CourtIQ Discord</p>
        <p className="text-white/60 text-[11px] mt-0.5">Patch alerts · build drops · meta discussions</p>
      </div>
      <ExternalLink className="w-4 h-4 text-white/55 group-hover:text-white transition-colors shrink-0" />
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

  return (
    <AppLayout>
      <div className="min-h-screen">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-8 pb-16">

          <Hero name={displayName} profile={profile} loading={loading} />

          {/* Metric row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-9">
            <MetricCard
              label="Builds"
              value={profile?.totalBuilds ?? '—'}
              sub="created"
              icon={Users}
              accent="#FB7185"
            />
            <MetricCard
              label="Active"
              value={profile ? `${profile.daysActive}d` : '—'}
              sub="streak"
              icon={Flame}
              accent="#F59E0B"
            />
            <MetricCard
              label="Sessions"
              value="—"
              sub="this week"
              icon={Activity}
              accent="#38BDF8"
            />
            <MetricCard
              label="Meta"
              value="LIVE"
              sub="Season 7"
              icon={Sparkles}
              accent="#A78BFA"
            />
          </div>

          {/* AI Tools */}
          <div className="mb-9">
            <div className="flex items-center justify-between mb-4">
              <div>
                <SectionLabel accent="#E11D48">AI Tools</SectionLabel>
                <p className="text-white text-[18px] font-bold mt-1.5">Your playbook</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {FEATURED.map((t, i) => (
                <ToolCard key={t.href} {...t} size="hero" index={i} />
              ))}
            </div>
          </div>

          {/* Community */}
          <div className="mb-9">
            <div className="flex items-center justify-between mb-4">
              <div>
                <SectionLabel accent="#7DD3FC">Community</SectionLabel>
                <p className="text-white text-[18px] font-bold mt-1.5">Explore & connect</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {COMMUNITY.map((t, i) => (
                <ToolCard key={t.href} {...t} size="md" index={i} />
              ))}
            </div>
          </div>

          {data?.metaTrends && <MetaPulse trends={data.metaTrends} />}
          {data?.communityBuilds && <TrendingBuilds builds={data.communityBuilds} />}

          <PatchNotes />

          <DiscordCTA />
        </div>
      </div>
    </AppLayout>
  )
}
