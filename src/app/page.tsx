'use client'
import { useEffect, useRef, useState } from 'react'
import { motion, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion'
import Link from 'next/link'
import {
  Zap, Brain, TrendingUp, Users, ArrowRight, Cpu,
  Shield, Activity, ChevronRight, Wand2, Swords, Users2, Star
} from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import { CourtIQLogo } from '@/components/ui/Logo'

/* ── Utilities ── */
function Counter({ end, suffix = '' }: { end: number; suffix?: string }) {
  const [val, setVal] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const [triggered, setTriggered] = useState(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setTriggered(true) }, { threshold: 0.4 })
    obs.observe(el); return () => obs.disconnect()
  }, [])
  useEffect(() => {
    if (!triggered) return
    const start = Date.now(), dur = 1800
    const tick = () => {
      const t = Math.min((Date.now() - start) / dur, 1)
      setVal(Math.floor((1 - Math.pow(1 - t, 4)) * end))
      if (t < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [triggered, end])
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>
}

function Grid() {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none select-none" aria-hidden>
      <defs>
        <pattern id="g" width="64" height="64" patternUnits="userSpaceOnUse">
          <path d="M 64 0 L 0 0 0 64" fill="none" stroke="rgba(255,255,255,0.018)" strokeWidth="1"/>
        </pattern>
        <radialGradient id="gm" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="white" stopOpacity="1"/>
          <stop offset="100%" stopColor="white" stopOpacity="0"/>
        </radialGradient>
        <mask id="gmask"><rect width="100%" height="100%" fill="url(#gm)"/></mask>
      </defs>
      <rect width="100%" height="100%" fill="url(#g)" mask="url(#gmask)"/>
    </svg>
  )
}

const TICKER_ITEMS = [
  { label: 'Build Analyzer', color: '#E11D48' }, { label: 'AI Coach', color: '#38BDF8' },
  { label: 'Meta Tracker', color: '#10B981' }, { label: 'Build Optimizer', color: '#8B5CF6' },
  { label: '1v1 Simulator', color: '#F59E0B' }, { label: 'Squad Builder', color: '#FB7185' },
  { label: 'Teammate Finder', color: '#34D399' }, { label: 'Groq Powered', color: '#FAFAFA' },
  { label: 'NBA 2K26', color: '#FB7185' }, { label: 'Season 5 Meta', color: '#34D399' },
]
function Ticker() {
  const all = [...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS]
  return (
    <div className="marquee-outer border-y py-4" style={{ borderColor: 'rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)' }}>
      <div className="marquee-track">
        {all.map((item, i) => (
          <div key={i} className="flex items-center gap-6 px-6">
            <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: item.color, boxShadow: `0 0 6px ${item.color}` }}/>
            <span className="text-[10px] font-bold tracking-[0.22em] uppercase" style={{ color: 'rgba(255,255,255,0.2)' }}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Feature Bento cards ── */
const FEATURES = [
  {
    icon: Zap, title: 'Build Analyzer', accent: '#E11D48',
    desc: 'Screenshot or manual stats → full archetype breakdown, tier rating, badge recs, and upgrade paths. Powered by vision AI.',
    href: '/analyze', tag: 'Core Feature', size: 'large',
  },
  {
    icon: Brain, title: 'AI Coach', accent: '#38BDF8',
    desc: 'Ask anything. Answers from live web search + Groq — not stale training data.',
    href: '/coach', tag: 'AI + Search', size: 'normal',
  },
  {
    icon: Wand2, title: 'Build Optimizer', accent: '#8B5CF6',
    desc: 'Describe your playstyle. Get a full optimized build generated instantly.',
    href: '/optimize', tag: 'AI Gen', size: 'normal',
  },
  {
    icon: Swords, title: '1v1 Simulator', accent: '#F59E0B',
    desc: 'Paste two builds — get win probability, key advantages, and exactly how to win.',
    href: '/matchup', tag: 'Sim', size: 'normal',
  },
  {
    icon: TrendingUp, title: 'Meta Tracker', accent: '#10B981',
    desc: "Live tier lists. Know what's S-tier before everyone else.",
    href: '/meta', tag: 'Live Data', size: 'normal',
  },
  {
    icon: Users2, title: 'Squad Builder', accent: '#FB7185',
    desc: 'Build with friends. AI chemistry analysis. Dominate Pro-Am.',
    href: '/squad', tag: 'Social', size: 'normal',
  },
]

function BentoCard({ f, i }: { f: typeof FEATURES[0]; i: number }) {
  const { icon: Icon } = f
  const isLarge = f.size === 'large'
  return (
    <motion.div
      className={isLarge ? 'md:col-span-2 md:row-span-2' : ''}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ delay: i * 0.07, type: 'spring', stiffness: 160, damping: 22 }}
    >
      <Link href={f.href} className="group card card-lift block h-full relative overflow-hidden"
        style={{ padding: isLarge ? '2rem' : '1.5rem', minHeight: isLarge ? '280px' : undefined }}>
        {/* Background hover glow */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"
          style={{ background: `radial-gradient(ellipse at 10% 10%, ${f.accent}14 0%, transparent 60%)` }}/>
        {/* Top shimmer */}
        <div className="absolute top-0 left-[15%] right-[15%] h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{ background: `linear-gradient(90deg, transparent, ${f.accent}60, transparent)` }}/>

        <div className="relative h-full flex flex-col">
          <div className="flex items-start justify-between mb-5">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: `${f.accent}14`, border: `1px solid ${f.accent}22` }}>
              <Icon className="w-5.5 h-5.5" style={{ color: f.accent }} />
            </div>
            <span className="chip chip-muted text-[10px]">{f.tag}</span>
          </div>

          <h3 className={`font-bold text-white tracking-tight mb-2.5 ${isLarge ? 'text-xl' : 'text-base'}`}>{f.title}</h3>
          <p className={`text-white/38 leading-relaxed flex-1 ${isLarge ? 'text-[15px] max-w-sm' : 'text-sm'}`}>{f.desc}</p>

          {isLarge && (
            <div className="mt-6 flex gap-2.5">
              <Link href={f.href} className="btn btn-primary gap-2" onClick={e => e.stopPropagation()}>
                <Zap className="w-4 h-4" /> Try Analyzer
              </Link>
              <Link href="/signup" className="btn btn-secondary gap-2" onClick={e => e.stopPropagation()}>
                Get Started Free
              </Link>
            </div>
          )}

          {!isLarge && (
            <div className="flex items-center gap-1.5 mt-5 text-xs font-bold tracking-wide" style={{ color: f.accent }}>
              Open <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-200"/>
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  )
}

/* ── How it works ── */
const STEPS = [
  { n: '01', title: 'Input Your Build', desc: 'Screenshot, type stats manually, or describe your playstyle in plain English.', color: '#E11D48' },
  { n: '02', title: 'AI Analyzes', desc: 'Groq processes your build, searches live 2K sites for current meta data, and reasons from real sources.', color: '#8B5CF6' },
  { n: '03', title: 'Get Real Answers', desc: 'Tier rating, badge priorities, upgrade paths, matchup tips — all based on Season 5 facts.', color: '#38BDF8' },
]

export default function Page() {
  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 90])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.65], [1, 0])
  const mx = useMotionValue(0), my = useMotionValue(0)
  const sx = useSpring(mx, { stiffness: 25, damping: 28 })
  const sy = useSpring(my, { stiffness: 25, damping: 28 })
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      mx.set((e.clientX - window.innerWidth / 2) * 0.012)
      my.set((e.clientY - window.innerHeight / 2) * 0.012)
    }
    window.addEventListener('mousemove', fn)
    return () => window.removeEventListener('mousemove', fn)
  }, [mx, my])

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: '#08080A' }}>
      <Navbar />

      {/* ── Hero ── */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        <Grid />

        {/* Orbs */}
        <motion.div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div className="absolute top-[-15%] left-[8%] w-[900px] h-[900px] rounded-full"
            animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 12, repeat: Infinity }}
            style={{ background: 'radial-gradient(circle, rgba(225,29,72,0.07), transparent 65%)', x: sx, y: sy }}/>
          <motion.div className="absolute top-[20%] right-[-5%] w-[600px] h-[600px] rounded-full"
            animate={{ scale: [1, 1.07, 1] }} transition={{ duration: 15, repeat: Infinity, delay: 4 }}
            style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.05), transparent 65%)' }}/>
          <motion.div className="absolute bottom-[5%] left-[-5%] w-[500px] h-[500px] rounded-full"
            animate={{ scale: [1, 1.06, 1] }} transition={{ duration: 11, repeat: Infinity, delay: 7 }}
            style={{ background: 'radial-gradient(circle, rgba(56,189,248,0.04), transparent 65%)' }}/>
        </motion.div>

        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          {/* Pill badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22, delay: 0.05 }}
            className="inline-flex items-center gap-2.5 px-4 py-2 mb-10 rounded-full cursor-default"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <span className="status-online"/>
            <span className="text-xs font-medium text-white/45 tracking-wide">NBA 2K26 · Season 5 Meta</span>
            <span className="w-px h-3 bg-white/10"/>
            <span className="text-xs font-bold text-rose-400">Patch 1.08 Live</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="display leading-[0.88] mb-8"
            style={{ fontSize: 'clamp(54px, 9vw, 108px)' }}
          >
            <span className="text-white">The AI Platform</span>
            <br />
            <span style={{ color: 'rgba(255,255,255,0.12)' }}>built for&nbsp;</span>
            <span className="text-gradient">NBA 2K26</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-white/38 text-lg sm:text-xl max-w-lg mx-auto mb-12 leading-relaxed font-light"
          >
            Analyze builds. Get coached by AI with live search. Simulate matchups.
            Track the meta. One platform — actually accurate.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.28 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <Link href="/analyze" className="btn btn-primary btn-xl gap-2.5 group">
              <Zap className="w-5 h-5"/>
              Analyze My Build
              <ArrowRight className="w-4 h-4 opacity-55 group-hover:translate-x-1 group-hover:opacity-100 transition-all duration-200"/>
            </Link>
            <Link href="/coach" className="btn btn-secondary btn-xl gap-2.5">
              <Brain className="w-4.5 h-4.5 text-sky-400"/>
              AI Coach
            </Link>
            <Link href="/signup" className="btn btn-ghost btn-xl gap-2 text-white/45">
              Create Account
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65 }}
            className="mt-20 pt-10 border-t flex flex-wrap justify-center gap-x-14 gap-y-8"
            style={{ borderColor: 'rgba(255,255,255,0.05)' }}
          >
            {[
              { end: 50000,  suffix: '+', label: 'Builds Analyzed' },
              { end: 200000, suffix: '+', label: 'Coach Messages' },
              { end: 15000,  suffix: '+', label: 'Community Builds' },
              { end: 99,     suffix: '%', label: 'Uptime' },
            ].map(({ end, suffix, label }) => (
              <div key={label} className="text-center">
                <div className="mono text-[28px] font-bold text-white tracking-tight leading-none">
                  <Counter end={end} suffix={suffix}/>
                </div>
                <div className="text-white/25 text-[10px] font-semibold mt-2 tracking-[0.14em] uppercase">{label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <motion.div animate={{ y: [0, 7, 0] }} transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            className="w-5 h-8 rounded-full flex items-start justify-center pt-1.5"
            style={{ border: '1px solid rgba(255,255,255,0.09)' }}>
            <div className="w-1 h-2 rounded-full bg-rose-500/50"/>
          </motion.div>
        </motion.div>
      </section>

      <Ticker />

      {/* ── Features Bento ── */}
      <section className="py-36 px-6 max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="text-center mb-16">
          <p className="section-label mb-5">Platform</p>
          <h2 className="display text-white mb-5" style={{ fontSize: 'clamp(38px, 6vw, 68px)' }}>
            Every tool you need.<br/>
            <span style={{ color: 'rgba(255,255,255,0.18)' }}>Nothing you don&apos;t.</span>
          </h2>
          <p className="text-white/30 text-lg max-w-sm mx-auto font-light leading-relaxed">
            From building to coaching to competing — one platform.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-fr">
          {FEATURES.map((f, i) => <BentoCard key={f.title} f={f} i={i} />)}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-24 px-6 border-y" style={{ borderColor: 'rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.008)' }}>
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center mb-16">
            <p className="section-label mb-5">How it works</p>
            <h2 className="display text-white" style={{ fontSize: 'clamp(32px, 5vw, 52px)' }}>
              From screenshot to S-tier<br/><span style={{ color: 'rgba(255,255,255,0.2)' }}>in under 2 seconds</span>
            </h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-8 left-[20%] right-[20%] h-px"
              style={{ background: 'linear-gradient(90deg, rgba(225,29,72,0.3), rgba(56,189,248,0.3))' }}/>
            {STEPS.map((s, i) => (
              <motion.div key={s.n}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, type: 'spring', stiffness: 180, damping: 24 }}
                className="text-center relative"
              >
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 relative"
                  style={{ background: `${s.color}12`, border: `1px solid ${s.color}22` }}>
                  <span className="mono text-lg font-black" style={{ color: s.color }}>{s.n}</span>
                  <div className="absolute inset-0 rounded-2xl opacity-30"
                    style={{ background: `radial-gradient(circle at center, ${s.color}20, transparent 70%)` }}/>
                </div>
                <h3 className="font-bold text-white text-base mb-2.5 tracking-tight">{s.title}</h3>
                <p className="text-white/35 text-sm leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI Engine demo ── */}
      <section className="py-36 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <motion.div initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
            transition={{ type: 'spring', stiffness: 90, damping: 22 }}>
            <p className="section-label mb-6">AI Engine</p>
            <h2 className="display text-white mb-6" style={{ fontSize: 'clamp(34px, 5vw, 58px)', lineHeight: '0.95' }}>
              Groq-powered.<br/>
              <span className="text-gradient-sky">Live search.<br/>Real answers.</span>
            </h2>
            <p className="text-white/38 leading-relaxed mb-10 font-light text-[17px]">
              Every question searches live 2K sites before hitting the AI.
              No hallucinations. No training cutoff. Just accurate Season 5 data.
            </p>
            <div className="space-y-5 mb-10">
              {[
                { icon: Cpu,      label: 'Sub-second responses',  desc: 'Groq inference — not just fast, instant' },
                { icon: Shield,   label: 'Live web search',       desc: 'Searches NBA2KW, Reddit, Operation Sports per query' },
                { icon: Activity, label: 'Vision AI support',     desc: 'Drop a screenshot → full build analysis' },
              ].map(({ icon: Icon, label, desc }, i) => (
                <motion.div key={label} className="flex items-center gap-4"
                  initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(225,29,72,0.08)', border: '1px solid rgba(225,29,72,0.15)' }}>
                    <Icon className="w-4.5 h-4.5 text-rose-400"/>
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm tracking-tight">{label}</p>
                    <p className="text-white/28 text-xs mt-0.5">{desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
            <Link href="/analyze" className="btn btn-primary btn-lg gap-2">
              Try the Analyzer <ArrowRight className="w-4 h-4"/>
            </Link>
          </motion.div>

          {/* Demo card */}
          <motion.div initial={{ opacity: 0, x: 28 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
            transition={{ type: 'spring', stiffness: 90, damping: 22 }} className="relative">
            <div className="card card-glow p-7 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-px"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(225,29,72,0.45), transparent)' }}/>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(225,29,72,0.1)', border: '1px solid rgba(225,29,72,0.2)' }}>
                    <Brain className="w-5 h-5 text-rose-400"/>
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">CourtIQ Analysis</p>
                    <p className="text-white/28 text-xs">Shot Creator · PG · 6&apos;4&quot;</p>
                  </div>
                </div>
                <span className="chip tier-s">S-Tier</span>
              </div>

              <p className="text-white/40 text-sm leading-relaxed mb-6 border-l-2 border-rose-500/30 pl-4 italic">
                &ldquo;Elite ball handle with rim pressure. 87 ball handle unlocks HOF dribble animations.
                Driving layup creates consistent finishes through contact.&rdquo;
              </p>

              <div className="space-y-4 mb-6">
                {[
                  { label: 'Overall Rating',  val: 94, color: '#E11D48' },
                  { label: 'Competitiveness', val: 91, color: '#8B5CF6' },
                  { label: 'Meta Viability',  val: 96, color: '#38BDF8' },
                ].map(({ label, val, color }) => (
                  <div key={label}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-white/38">{label}</span>
                      <span className="mono font-bold text-white">{val}</span>
                    </div>
                    <div className="stat-bar">
                      <motion.div className="stat-bar-fill" style={{ background: color }}
                        initial={{ width: 0 }} whileInView={{ width: `${val}%` }}
                        viewport={{ once: true }} transition={{ duration: 1.2, delay: 0.4, ease: [0.34, 1.56, 0.64, 1] }}/>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-5 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                {[
                  { label: 'Strength', val: 'Elite handles + rim', color: '#10B981' },
                  { label: 'Weakness', val: 'Limited 3PT range', color: '#E11D48' },
                ].map(({ label, val, color }) => (
                  <div key={label} className="surface rounded-xl p-3.5">
                    <p className="text-white/22 text-[10px] uppercase tracking-wider font-bold mb-1.5">{label}</p>
                    <p className="text-xs font-semibold" style={{ color }}>{val}</p>
                  </div>
                ))}
              </div>
            </div>

            <motion.div animate={{ y: [-5, 5, -5] }} transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-4 -right-4 glass rounded-xl px-4 py-2.5 border"
              style={{ borderColor: 'rgba(56,189,248,0.15)' }}>
              <p className="text-white/28 text-[10px] font-medium">Analyzed in</p>
              <p className="mono text-sky-400 font-bold text-2xl leading-tight">0.4s</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-32 px-6 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center mb-14">
            <p className="section-label mb-5">Community</p>
            <h2 className="display text-white mb-3" style={{ fontSize: 'clamp(32px, 5vw, 54px)' }}>
              Trusted by top players
            </h2>
            <p className="text-white/28 font-light">Real players. Real results.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { q: 'CourtIQ told me my guard build was better as a slasher. Changed my whole playstyle — went from losing every game to top 5 in my park.', name: 'KingJosiah',  role: 'Park Legend',    color: '#E11D48' },
              { q: "The AI coach is actually insane. Asked why I keep getting blocked — it pinpointed exactly which badges I was missing. Fixed it that day.", name: 'FlightTime2K', role: 'Comp Rec Player', color: '#38BDF8' },
              { q: "Meta tracker saved me VC. Found out my planned build was C-tier before I spent a dollar. Built an S-tier instead. Essential.", name: 'DribbleFiend', role: 'Pro-Am Starter',  color: '#8B5CF6' },
            ].map(({ q, name, role, color }, i) => (
              <motion.div key={name} className="card card-lift p-6 relative overflow-hidden"
                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1, type: 'spring', stiffness: 180, damping: 24 }}>
                <div className="absolute top-0 left-[12%] right-[12%] h-px"
                  style={{ background: `linear-gradient(90deg, transparent, ${color}40, transparent)` }}/>
                <div className="flex gap-0.5 mb-5">
                  {[...Array(5)].map((_, j) => <Star key={j} className="w-3.5 h-3.5 fill-amber-400 text-amber-400"/>)}
                </div>
                <p className="text-white/40 text-sm leading-relaxed mb-6">&ldquo;{q}&rdquo;</p>
                <div className="flex items-center gap-3 pt-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
                    style={{ background: `${color}18`, border: `1px solid ${color}25` }}>{name[0]}</div>
                  <div>
                    <p className="text-white font-semibold text-sm tracking-tight">{name}</p>
                    <p className="text-white/25 text-xs">{role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-36 px-6 relative overflow-hidden border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full"
            style={{ background: 'radial-gradient(ellipse, rgba(225,29,72,0.055), transparent 70%)' }}/>
        </div>
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="relative max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-10 mx-auto"
            style={{ background: 'rgba(225,29,72,0.09)', border: '1px solid rgba(225,29,72,0.18)' }}>
            <Zap className="w-6 h-6 text-rose-400"/>
          </div>
          <h2 className="display text-white mb-5" style={{ fontSize: 'clamp(38px, 6vw, 70px)', lineHeight: '0.92' }}>
            Ready to master<br/><span className="text-gradient">the meta?</span>
          </h2>
          <p className="text-white/30 text-lg mb-12 max-w-sm mx-auto font-light leading-relaxed">
            Join 50,000+ players building smarter with CourtIQ.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/analyze" className="btn btn-primary btn-xl gap-2.5">
              <Zap className="w-5 h-5"/> Start Free — No Account Needed
            </Link>
            <Link href="/signup" className="btn btn-secondary btn-xl">
              Create Account
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t py-12 px-6" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-start justify-between gap-10 mb-12">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <CourtIQLogo className="w-7 h-7"/>
                <span className="display text-lg font-bold text-white">Court<span className="text-rose-400">IQ</span></span>
              </div>
              <p className="text-white/25 text-sm max-w-[200px] leading-relaxed">The AI platform built for NBA 2K26 players.</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-16 gap-y-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/25 mb-3">Tools</p>
                <div className="space-y-2.5">
                  {[['Analyzer','/analyze'],['AI Coach','/coach'],['Optimizer','/optimize'],['Matchup','/matchup']].map(([l,h]) => (
                    <Link key={l} href={h} className="block text-sm text-white/35 hover:text-white/70 transition-colors">{l}</Link>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/25 mb-3">Community</p>
                <div className="space-y-2.5">
                  {[['Builds','/builds'],['Meta','/meta'],['Squad','/squad'],['Find Players','/find']].map(([l,h]) => (
                    <Link key={l} href={h} className="block text-sm text-white/35 hover:text-white/70 transition-colors">{l}</Link>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/25 mb-3">Account</p>
                <div className="space-y-2.5">
                  {[['Dashboard','/dashboard'],['Sign In','/login'],['Sign Up','/signup']].map(([l,h]) => (
                    <Link key={l} href={h} className="block text-sm text-white/35 hover:text-white/70 transition-colors">{l}</Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="divider mb-8"/>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-white/18 text-xs">© 2026 CourtIQ. For NBA 2K26 players.</p>
            <div className="flex items-center gap-1.5">
              <span className="status-online"/>
              <span className="text-white/20 text-xs">All systems operational</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
