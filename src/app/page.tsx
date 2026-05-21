'use client'
import { useEffect, useRef, useState } from 'react'
import { motion, useScroll, useTransform, useInView } from 'framer-motion'
import Link from 'next/link'
import {
  Zap, Brain, TrendingUp, Users, BookOpen, Shield,
  ArrowRight, Star, ChevronRight, Activity, Cpu,
} from 'lucide-react'
import Navbar from '@/components/layout/Navbar'

/* ── Animated counter ─────────────────────────────────────────── */
function Counter({ end, suffix = '' }: { end: number; suffix?: string }) {
  const [val, setVal] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })

  useEffect(() => {
    if (!inView) return
    const start = Date.now()
    const duration = 1600
    const tick = () => {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setVal(Math.floor(eased * end))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [inView, end])

  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>
}

/* ── Grid line background ─────────────────────────────────────── */
function GridLines() {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none select-none" aria-hidden>
      <defs>
        <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
          <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(255,255,255,0.025)" strokeWidth="1" />
        </pattern>
        <radialGradient id="grid-fade" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="white" stopOpacity="1" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
        <mask id="grid-mask">
          <rect width="100%" height="100%" fill="url(#grid-fade)" />
        </mask>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" mask="url(#grid-mask)" />
    </svg>
  )
}

/* ── Feature card ─────────────────────────────────────────────── */
const features = [
  {
    icon: Zap, title: 'Build Analyzer',
    desc: 'Upload your build or enter stats manually. AI breaks down archetype, strengths, weaknesses, and exact upgrade paths.',
    accent: 'crimson', href: '/analyze',
  },
  {
    icon: Brain, title: 'AI Coach',
    desc: 'Your personal Groq-powered 2K coach. Ask anything — badges, animations, meta reads, how to stop getting scored on.',
    accent: 'sky', href: '/coach',
  },
  {
    icon: TrendingUp, title: 'Meta Tracker',
    desc: 'Real-time tier lists updated after every patch. Know the strongest builds, hottest badges, and best jumpshots.',
    accent: 'emerald', href: '/meta',
  },
  {
    icon: Users, title: 'Build Database',
    desc: 'Browse thousands of community builds filtered by position, category, and tier. Share yours in one click.',
    accent: 'amber', href: '/builds',
  },
  {
    icon: Activity, title: 'Gameplay Analyzer',
    desc: 'Upload your clips. AI detects spacing issues, shot selection mistakes, and defensive breakdowns frame by frame.',
    accent: 'violet', href: '/analyze',
  },
  {
    icon: BookOpen, title: 'Tutorial Hub',
    desc: 'AI-curated tutorials matched to your build. Dribble guides, jumpshot breakdowns, and comp strategy videos.',
    accent: 'sky', href: '/tutorials',
  },
]

const accentMap: Record<string, { text: string; bg: string; border: string; glow: string }> = {
  crimson: { text: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20', glow: 'hover:border-rose-500/30 hover:shadow-[0_8px_24px_rgba(225,29,72,0.12)]' },
  sky:     { text: 'text-sky-400',  bg: 'bg-sky-500/10',  border: 'border-sky-500/20',  glow: 'hover:border-sky-400/30 hover:shadow-[0_8px_24px_rgba(56,189,248,0.1)]' },
  emerald: { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', glow: 'hover:border-emerald-400/30 hover:shadow-[0_8px_24px_rgba(16,185,129,0.1)]' },
  amber:   { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', glow: 'hover:border-amber-400/30 hover:shadow-[0_8px_24px_rgba(245,158,11,0.1)]' },
  violet:  { text: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20', glow: 'hover:border-violet-400/30 hover:shadow-[0_8px_24px_rgba(139,92,246,0.1)]' },
}

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 80])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0])

  return (
    <div className="min-h-screen bg-bg overflow-x-hidden">
      <Navbar />

      {/* ── Hero ── */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        <GridLines />

        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-crimson-radial opacity-60" />
          <div className="absolute top-1/3 left-1/4 w-96 h-96 rounded-full bg-rose-500/5 blur-3xl" />
          <div className="absolute top-1/4 right-1/4 w-72 h-72 rounded-full bg-violet-500/4 blur-3xl" />
        </div>

        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          {/* Pill badge */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/8 border border-rose-500/20 text-rose-400 text-xs font-semibold tracking-wide mb-10"
          >
            <span className="status-online" />
            NBA 2K26 Season Active — Meta Updated Patch 1.08
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.08 }}
            className="display text-6xl sm:text-7xl lg:text-[88px] leading-none mb-6"
          >
            <span className="text-fg">Build Smarter.</span>
            <br />
            <span className="text-gradient">Play Better.</span>
          </motion.h1>

          {/* Sub */}
          <motion.p
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15 }}
            className="text-fg-muted text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            CourtIQ is the AI-powered NBA 2K26 companion for elite players.
            Analyze builds instantly, get AI coached, and dominate the meta.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.22 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <Link href="/analyze" className="btn btn-primary btn-xl gap-2.5 group">
              <Zap className="w-5 h-5" />
              Analyze My Build — Free
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link href="/coach" className="btn btn-secondary btn-xl gap-2">
              <Brain className="w-5 h-5 text-sky-400" />
              Talk to AI Coach
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            className="mt-16 flex flex-wrap justify-center gap-12"
          >
            {[
              { end: 50000, suffix: '+', label: 'Builds Analyzed' },
              { end: 200000, suffix: '+', label: 'AI Coach Messages' },
              { end: 15000, suffix: '+', label: 'Community Builds' },
              { end: 99, suffix: '.2%', label: 'Uptime' },
            ].map(({ end, suffix, label }) => (
              <div key={label} className="text-center">
                <div className="mono text-3xl font-semibold text-fg">
                  <Counter end={end} suffix={suffix} />
                </div>
                <div className="text-fg-subtle text-sm mt-1">{label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <motion.div
            animate={{ y: [0, 6, 0] }} transition={{ duration: 1.8, repeat: Infinity }}
            className="w-5 h-8 rounded-full border border-border flex items-start justify-center pt-1.5"
          >
            <div className="w-1 h-2 rounded-full bg-rose-500" />
          </motion.div>
        </motion.div>
      </section>

      {/* ── Features ── */}
      <section className="py-28 px-6 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} className="text-center mb-16"
        >
          <p className="text-rose-400 text-sm font-semibold tracking-widest uppercase mb-3">Platform</p>
          <h2 className="display text-4xl sm:text-5xl text-fg mb-4">
            Six tools. One platform.<br />
            <span className="text-gradient-sky">Zero cap.</span>
          </h2>
          <p className="text-fg-muted text-lg max-w-xl mx-auto">
            Everything you need to go from average to elite — powered by Groq AI.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map(({ icon: Icon, title, desc, accent, href }, i) => {
            const a = accentMap[accent]
            return (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                whileHover={{ y: -4 }}
              >
                <Link href={href} className={`card block p-6 h-full border ${a.border} ${a.glow} transition-all duration-300 cursor-pointer group`}>
                  <div className={`w-11 h-11 rounded-lg ${a.bg} border ${a.border} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-200`}>
                    <Icon className={`w-5 h-5 ${a.text}`} />
                  </div>
                  <h3 className="text-fg font-semibold text-base mb-2">{title}</h3>
                  <p className="text-fg-muted text-sm leading-relaxed">{desc}</p>
                  <div className={`flex items-center gap-1 text-xs font-semibold mt-5 ${a.text}`}>
                    Explore <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* ── AI Showcase ── */}
      <section className="border-y border-border bg-surface/40 py-24 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <p className="text-rose-400 text-sm font-semibold tracking-widest uppercase mb-4">AI Engine</p>
            <h2 className="display text-4xl sm:text-5xl text-fg mb-5">
              Powered by<br />
              <span className="text-gradient-sky">Groq Intelligence</span>
            </h2>
            <p className="text-fg-muted leading-relaxed mb-8">
              Ultra-fast inference via Groq. Build analysis in under a second.
              Vision AI reads your screenshots directly. Every response is
              build-specific, meta-aware, and immediately actionable.
            </p>
            <div className="space-y-4">
              {[
                { icon: Cpu, label: 'Sub-second analysis', desc: 'Groq inference — not just fast, instant' },
                { icon: Shield, label: 'Meta-aware responses', desc: 'Updated after every patch automatically' },
                { icon: Activity, label: 'Vision AI support', desc: 'Drop a screenshot, get full analysis' },
              ].map(({ icon: Icon, label, desc }) => (
                <div key={label} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-rose-400" />
                  </div>
                  <div>
                    <p className="text-fg font-medium text-sm">{label}</p>
                    <p className="text-fg-subtle text-xs">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8">
              <Link href="/analyze" className="btn btn-primary gap-2">
                Try the Analyzer <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>

          {/* Demo analysis card */}
          <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="relative">
            <div className="card card-glow p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                    <Brain className="w-4 h-4 text-rose-400" />
                  </div>
                  <div>
                    <p className="text-fg font-semibold text-sm">CourtIQ Analysis</p>
                    <p className="text-fg-subtle text-xs">Shot Creator · PG · 6&apos;4&quot;</p>
                  </div>
                </div>
                <span className="chip tier-s">S-Tier</span>
              </div>

              <p className="text-fg-muted text-sm leading-relaxed mb-5 italic border-l-2 border-rose-500/40 pl-3">
                &quot;This build performs best as a rim-pressure shot creator. The 87 ball handle unlocks elite dribble packages while high driving layup enables consistent finishes through contact.&quot;
              </p>

              {[
                { label: 'Overall Rating', value: 94, color: '#E11D48' },
                { label: 'Competitiveness', value: 91, color: '#8B5CF6' },
                { label: 'Meta Viability', value: 96, color: '#38BDF8' },
              ].map(({ label, value, color }) => (
                <div key={label} className="mb-3">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-fg-muted">{label}</span>
                    <span className="mono font-semibold text-fg">{value}</span>
                  </div>
                  <div className="stat-bar">
                    <motion.div
                      className="stat-bar-fill" style={{ background: color }}
                      initial={{ width: 0 }} whileInView={{ width: `${value}%` }}
                      viewport={{ once: true }} transition={{ duration: 1, delay: 0.3 }}
                    />
                  </div>
                </div>
              ))}

              <div className="grid grid-cols-2 gap-2.5 mt-4 pt-4 border-t border-border">
                <div className="bg-bg rounded-lg p-3 border border-border">
                  <p className="text-fg-subtle text-2xs uppercase tracking-wider mb-1">Strength</p>
                  <p className="text-emerald-400 text-xs font-medium">Elite handles + rim finishing</p>
                </div>
                <div className="bg-bg rounded-lg p-3 border border-border">
                  <p className="text-fg-subtle text-2xs uppercase tracking-wider mb-1">Weakness</p>
                  <p className="text-rose-400 text-xs font-medium">Limited 3PT range</p>
                </div>
              </div>
            </div>

            <motion.div
              animate={{ y: [-4, 4, -4] }} transition={{ duration: 3, repeat: Infinity }}
              className="absolute -top-4 -right-3 card px-3.5 py-2 shadow-md"
            >
              <p className="text-fg-subtle text-2xs">Analyzed in</p>
              <p className="mono text-sky-400 font-bold text-base">0.4s</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-24 px-6 max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <h2 className="display text-4xl text-fg">Trusted by Top Players</h2>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { q: "CourtIQ told me my guard build was better as a slasher than a shooter. Changed my whole playstyle — went from losing every game to top 5 in my park.", name: 'KingJosiah', role: 'Park Legend', init: 'K', color: 'bg-rose-500' },
            { q: "The AI coach is actually insane. Asked it why I keep getting blocked going to the rim — it pinpointed exactly which badges I was missing. Fixed it that day.", name: 'FlightTime2K', role: 'Comp Rec Player', init: 'F', color: 'bg-sky-500' },
            { q: "Meta tracker saved me VC. Found out my planned build was C-tier before I spent a dollar. Built an S-tier instead. This tool is essential.", name: 'DribbleFiend', role: 'Pro-Am Starter', init: 'D', color: 'bg-violet-500' },
          ].map(({ q, name, role, init, color }, i) => (
            <motion.div key={name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="card p-6">
              <div className="flex gap-0.5 mb-4">
                {[...Array(5)].map((_, j) => <Star key={j} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}
              </div>
              <p className="text-fg-muted text-sm leading-relaxed mb-5">&quot;{q}&quot;</p>
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full ${color} flex items-center justify-center font-bold text-sm text-white flex-shrink-0`}>{init}</div>
                <div>
                  <p className="text-fg font-semibold text-sm">{name}</p>
                  <p className="text-fg-subtle text-xs">{role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-crimson-radial opacity-40" />
        <div className="relative max-w-3xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-6">
              <Zap className="w-7 h-7 text-rose-400" />
            </div>
            <h2 className="display text-5xl sm:text-6xl text-fg mb-5">
              Ready to<br /><span className="text-gradient">Master the Meta?</span>
            </h2>
            <p className="text-fg-muted text-lg mb-8 max-w-lg mx-auto">
              Join 50,000+ players using CourtIQ to build smarter and play better.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/analyze" className="btn btn-primary btn-xl gap-2.5">
                <Zap className="w-5 h-5" />
                Start Free — No Account Needed
              </Link>
              <Link href="/builds" className="btn btn-secondary btn-xl gap-2">
                <Users className="w-5 h-5" />
                Explore Builds
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-violet-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm display">C</span>
            </div>
            <span className="display text-lg font-bold text-fg">Court<span className="text-rose-400">IQ</span></span>
          </div>
          <div className="flex flex-wrap gap-6 text-sm text-fg-muted">
            {['Dashboard', 'Analyze', 'Coach', 'Builds', 'Meta', 'Tutorials'].map(l => (
              <Link key={l} href={`/${l.toLowerCase()}`} className="hover:text-fg transition-colors">{l}</Link>
            ))}
          </div>
          <p className="text-fg-subtle text-xs text-center">
            © {new Date().getFullYear()} CourtIQ · Not affiliated with 2K Sports
          </p>
        </div>
      </footer>
    </div>
  )
}
