'use client'
import { useEffect, useRef, useState } from 'react'
import { motion, useScroll, useTransform, useInView, useMotionValue, useSpring } from 'framer-motion'
import Link from 'next/link'
import { Zap, Brain, TrendingUp, Users, BookOpen, ArrowRight, Activity, ChevronRight, Cpu, Shield, Star, Wand2, Swords } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import { CourtIQLogo } from '@/components/ui/Logo'

function Counter({ end, suffix = '' }: { end: number; suffix?: string }) {
  const [val, setVal] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })
  useEffect(() => {
    if (!inView) return
    const start = Date.now(), dur = 2000
    const tick = () => {
      const t = Math.min((Date.now() - start) / dur, 1)
      setVal(Math.floor((1 - Math.pow(1 - t, 4)) * end))
      if (t < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [inView, end])
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>
}

function Grid() {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none select-none" aria-hidden>
      <defs>
        <pattern id="g" width="72" height="72" patternUnits="userSpaceOnUse">
          <path d="M 72 0 L 0 0 0 72" fill="none" stroke="rgba(255,255,255,0.016)" strokeWidth="1"/>
        </pattern>
        <radialGradient id="gm" cx="50%" cy="30%" r="60%">
          <stop offset="0%" stopColor="white" stopOpacity="1"/>
          <stop offset="100%" stopColor="white" stopOpacity="0"/>
        </radialGradient>
        <mask id="gmask"><rect width="100%" height="100%" fill="url(#gm)"/></mask>
      </defs>
      <rect width="100%" height="100%" fill="url(#g)" mask="url(#gmask)"/>
    </svg>
  )
}

const TICKER = [
  { label: 'Build Analyzer', color: '#E11D48' }, { label: 'AI Coach', color: '#38BDF8' },
  { label: 'Meta Tracker', color: '#10B981' },   { label: 'Build Optimizer', color: '#F59E0B' },
  { label: '1v1 Simulator', color: '#8B5CF6' },  { label: 'Squad Builder', color: '#E11D48' },
  { label: 'Teammate Finder', color: '#38BDF8' }, { label: 'Groq Powered', color: '#FAFAFA' },
  { label: 'NBA 2K26', color: '#FB7185' },        { label: 'Season 5 Meta', color: '#34D399' },
]
function Ticker() {
  const all = [...TICKER, ...TICKER, ...TICKER]
  return (
    <div className="marquee-outer border-y py-4" style={{ borderColor: 'rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.012)' }}>
      <div className="marquee-track">
        {all.map((item, i) => (
          <div key={i} className="flex items-center gap-6 px-6">
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: item.color, boxShadow: `0 0 8px ${item.color}80` }}/>
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase" style={{ color: 'rgba(255,255,255,0.22)' }}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const FEATURES = [
  { icon: Zap,        title: 'Build Analyzer',   desc: 'Screenshot or manual stats → full archetype breakdown, tier rating, badge recs, and upgrade paths in under a second.',  accent: '#E11D48', href: '/analyze',  tag: 'Core',      span: 'lg:col-span-2' },
  { icon: Brain,      title: 'AI Coach',          desc: 'Ask anything. Answers powered by live web search + Groq — not stale training data.',                                      accent: '#38BDF8', href: '/coach',   tag: 'AI + Search', span: '' },
  { icon: Wand2,      title: 'Build Optimizer',   desc: 'Describe your playstyle in plain English. Get a full optimized build generated instantly.',                                accent: '#8B5CF6', href: '/optimize',tag: 'AI Gen',    span: '' },
  { icon: Swords,     title: '1v1 Simulator',     desc: 'Paste two builds and see win probability, key advantages, and exactly how to win the matchup.',                           accent: '#F59E0B', href: '/matchup', tag: 'Sim',       span: '' },
  { icon: TrendingUp, title: 'Meta Tracker',      desc: "Live tier lists. Know what's S-tier and what got nerfed before everyone else.",                                           accent: '#10B981', href: '/meta',    tag: 'Live',      span: '' },
  { icon: Users,      title: 'Squad Builder',     desc: 'Build with friends. Add your builds, get AI chemistry analysis, and dominate Pro-Am together.',                           accent: '#FB7185', href: '/squad',   tag: 'Social',    span: '' },
]

function FCard({ f, i }: { f: typeof FEATURES[0]; i: number }) {
  const { icon: Icon } = f
  return (
    <motion.div
      className={f.span}
      initial={{ opacity: 0, y: 36 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ delay: i * 0.06, type: 'spring', stiffness: 160, damping: 22 }}
    >
      <Link href={f.href} className="group card card-lift block h-full p-7 relative overflow-hidden">
        {/* hover gradient */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-[16px]"
          style={{ background: `radial-gradient(ellipse at 0% 0%, ${f.accent}12 0%, transparent 65%)` }}/>
        {/* top line */}
        <div className="absolute top-0 left-[15%] right-[15%] h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{ background: `linear-gradient(90deg, transparent, ${f.accent}55, transparent)` }}/>
        <div className="relative">
          <div className="flex items-start justify-between mb-6">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{ background: `${f.accent}12`, border: `1px solid ${f.accent}22` }}>
              <Icon className="w-5 h-5" style={{ color: f.accent }}/>
            </div>
            <span className="chip chip-muted">{f.tag}</span>
          </div>
          <h3 className="text-white font-semibold text-base mb-2.5 tracking-tight">{f.title}</h3>
          <p className="text-white/38 text-sm leading-relaxed">{f.desc}</p>
          <div className="flex items-center gap-1.5 mt-6 text-xs font-bold tracking-wide" style={{ color: f.accent }}>
            Open
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1.5 transition-transform duration-200"/>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

export default function Page() {
  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 100])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0])
  const mx = useMotionValue(0), my = useMotionValue(0)
  const sx = useSpring(mx, { stiffness: 28, damping: 30 })
  const sy = useSpring(my, { stiffness: 28, damping: 30 })
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      mx.set((e.clientX - window.innerWidth / 2) * 0.015)
      my.set((e.clientY - window.innerHeight / 2) * 0.015)
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

        {/* Background orbs */}
        <motion.div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div
            className="absolute top-[-20%] left-[10%] w-[800px] h-[800px] rounded-full"
            animate={{ scale: [1, 1.06, 1] }} transition={{ duration: 10, repeat: Infinity }}
            style={{ background: 'radial-gradient(circle, rgba(225,29,72,0.08), transparent 65%)', x: sx, y: sy }}/>
          <motion.div
            className="absolute top-[10%] right-[5%] w-[550px] h-[550px] rounded-full"
            animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 13, repeat: Infinity, delay: 3 }}
            style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.055), transparent 65%)' }}/>
          <motion.div
            className="absolute bottom-[10%] left-[0%] w-[450px] h-[450px] rounded-full"
            animate={{ scale: [1, 1.07, 1] }} transition={{ duration: 11, repeat: Infinity, delay: 6 }}
            style={{ background: 'radial-gradient(circle, rgba(14,165,233,0.045), transparent 65%)' }}/>
        </motion.div>

        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="relative z-10 max-w-5xl mx-auto px-6 text-center">

          {/* Live badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24, delay: 0.05 }}
            className="inline-flex items-center gap-2.5 px-4 py-2 mb-12 rounded-full"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}
          >
            <span className="status-online"/>
            <span className="text-xs font-medium text-white/50 tracking-wide">NBA 2K26 — Season 5 Meta Live</span>
            <span className="w-px h-3 bg-white/12 mx-0.5"/>
            <span className="text-xs font-bold text-rose-400 tracking-wide">Patch 1.08</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 36 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
            className="display leading-[0.9] mb-7"
            style={{ fontSize: 'clamp(52px, 8.5vw, 102px)' }}
          >
            <span className="text-white">The AI Platform</span>
            <br />
            <span style={{ color: 'rgba(255,255,255,0.15)' }}>built for&nbsp;</span>
            <span className="text-gradient">NBA 2K26</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.22 }}
            className="text-white/40 text-lg sm:text-xl max-w-xl mx-auto mb-12 leading-relaxed font-light tracking-tight"
          >
            Analyze builds, get AI coaching with live search, simulate matchups,
            and track the meta — all in one place.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <Link href="/analyze" className="btn btn-primary btn-xl gap-2.5 group">
              <Zap className="w-5 h-5"/>
              Analyze My Build
              <ArrowRight className="w-4 h-4 opacity-60 group-hover:translate-x-1 group-hover:opacity-100 transition-all duration-200"/>
            </Link>
            <Link href="/coach" className="btn btn-secondary btn-xl gap-2.5">
              <Brain className="w-4.5 h-4.5 text-sky-400"/>
              AI Coach
            </Link>
            <Link href="/optimize" className="btn btn-outline btn-xl gap-2.5">
              <Wand2 className="w-4.5 h-4.5 text-violet-400"/>
              Build Optimizer
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
            className="mt-24 pt-10 border-t flex flex-wrap justify-center gap-x-16 gap-y-8"
            style={{ borderColor: 'rgba(255,255,255,0.05)' }}
          >
            {[
              { end: 50000,  suffix: '+', label: 'Builds Analyzed' },
              { end: 200000, suffix: '+', label: 'Coach Messages' },
              { end: 15000,  suffix: '+', label: 'Community Builds' },
              { end: 99,     suffix: '%', label: 'Uptime' },
            ].map(({ end, suffix, label }) => (
              <div key={label} className="text-center">
                <div className="mono text-3xl font-bold text-white tracking-tight">
                  <Counter end={end} suffix={suffix}/>
                </div>
                <div className="text-white/28 text-[11px] font-semibold mt-1.5 tracking-[0.12em] uppercase">{label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.8 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2">
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            className="w-5 h-8 rounded-full flex items-start justify-center pt-1.5"
            style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="w-1 h-2 rounded-full bg-rose-500/60"/>
          </motion.div>
        </motion.div>
      </section>

      <Ticker />

      {/* ── Features ── */}
      <section className="py-40 px-6 max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="text-center mb-20">
          <p className="section-label mb-5">Platform</p>
          <h2 className="display text-white mb-5" style={{ fontSize: 'clamp(40px,6vw,68px)' }}>
            Every tool you need.<br/>
            <span style={{ color: 'rgba(255,255,255,0.22)' }}>Nothing you don&apos;t.</span>
          </h2>
          <p className="text-white/32 text-lg max-w-md mx-auto font-light leading-relaxed">
            From building to coaching to competing — one platform covers it all.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => <FCard key={f.title} f={f} i={i}/>)}
        </div>
      </section>

      {/* ── AI Section ── */}
      <section className="py-32 px-6 border-y" style={{ borderColor: 'rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.009)' }}>
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <motion.div initial={{ opacity: 0, x: -28 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
            transition={{ type: 'spring', stiffness: 90, damping: 22 }}>
            <p className="section-label mb-6">AI Engine</p>
            <h2 className="display text-white mb-6" style={{ fontSize: 'clamp(36px,5vw,60px)', lineHeight: '0.95' }}>
              Groq-powered.<br/>
              <span className="text-gradient-sky">Live search.<br/>Actual answers.</span>
            </h2>
            <p className="text-white/38 leading-relaxed mb-10 font-light text-[17px]">
              Every question goes through live web search before hitting the AI.
              No hallucinations, no outdated info — just real Season 5 answers.
            </p>
            <div className="space-y-5 mb-10">
              {[
                { icon: Cpu,      label: 'Sub-second responses',   desc: 'Groq inference — not just fast, instant' },
                { icon: Shield,   label: 'Live web search',        desc: 'Searches NBA2KW, Reddit, Operation Sports per question' },
                { icon: Activity, label: 'Vision AI support',      desc: 'Drop a screenshot, get a full build analysis' },
              ].map(({ icon: Icon, label, desc }, i) => (
                <motion.div key={label} className="flex items-center gap-4"
                  initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.12 }}>
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(225,29,72,0.08)', border: '1px solid rgba(225,29,72,0.16)' }}>
                    <Icon className="w-5 h-5 text-rose-400"/>
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
          <motion.div initial={{ opacity: 0, x: 32 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
            transition={{ type: 'spring', stiffness: 90, damping: 22 }} className="relative">
            <div className="card card-glow p-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-px"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(225,29,72,0.4), transparent)' }}/>
              <div className="flex items-center justify-between mb-7">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(225,29,72,0.1)', border: '1px solid rgba(225,29,72,0.2)' }}>
                    <Brain className="w-4.5 h-4.5 text-rose-400"/>
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm tracking-tight">CourtIQ Analysis</p>
                    <p className="text-white/28 text-xs mt-0.5">Shot Creator · PG · 6&apos;4&quot;</p>
                  </div>
                </div>
                <span className="chip tier-s">S-Tier</span>
              </div>

              <p className="text-white/40 text-sm leading-relaxed mb-6 border-l-2 border-rose-500/25 pl-4 italic">
                &ldquo;Elite ball handle + rim pressure. 87 ball handle unlocks HOF dribble animations.
                Driving layup creates consistent finishes through contact in traffic.&rdquo;
              </p>

              <div className="space-y-4 mb-6">
                {[
                  { label: 'Overall Rating',    val: 94, color: '#E11D48' },
                  { label: 'Competitiveness',   val: 91, color: '#8B5CF6' },
                  { label: 'Meta Viability',    val: 96, color: '#38BDF8' },
                ].map(({ label, val, color }) => (
                  <div key={label}>
                    <div className="flex justify-between text-xs mb-2">
                      <span className="text-white/38">{label}</span>
                      <span className="mono font-bold text-white">{val}</span>
                    </div>
                    <div className="stat-bar">
                      <motion.div className="stat-bar-fill" style={{ background: color }}
                        initial={{ width: 0 }} whileInView={{ width: `${val}%` }}
                        viewport={{ once: true }} transition={{ duration: 1.4, delay: 0.5, ease: [0.34, 1.56, 0.64, 1] }}/>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-5 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                {[
                  { label: 'Strength', val: 'Elite handles + rim', color: '#10B981' },
                  { label: 'Weakness', val: 'Limited 3PT range',  color: '#E11D48' },
                ].map(({ label, val, color }) => (
                  <div key={label} className="surface rounded-xl p-3.5">
                    <p className="text-white/22 text-[10px] uppercase tracking-wider font-bold mb-1.5">{label}</p>
                    <p className="text-xs font-semibold" style={{ color }}>{val}</p>
                  </div>
                ))}
              </div>
            </div>

            <motion.div animate={{ y: [-5, 5, -5] }} transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-4 -right-4 glass rounded-xl px-4 py-2.5">
              <p className="text-white/28 text-[10px] font-medium">Analyzed in</p>
              <p className="mono text-sky-400 font-bold text-xl leading-tight">0.4s</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-40 px-6 max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="text-center mb-16">
          <p className="section-label mb-5">Community</p>
          <h2 className="display text-white mb-4" style={{ fontSize: 'clamp(36px,5vw,58px)' }}>
            Trusted by top players
          </h2>
          <p className="text-white/28 font-light text-lg">Real players. Real results.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { q: 'CourtIQ told me my guard build was better as a slasher than a shooter. Changed my whole playstyle — went from losing every game to top 5 in my park.', name: 'KingJosiah',  role: 'Park Legend',    color: '#E11D48' },
            { q: 'The AI coach is actually insane. Asked it why I keep getting blocked — it pinpointed exactly which badges I was missing. Fixed it that day.',              name: 'FlightTime2K', role: 'Comp Rec Player', color: '#38BDF8' },
            { q: 'Meta tracker saved me VC. Found out my planned build was C-tier before I spent a dollar. Built an S-tier instead. Essential tool.',                       name: 'DribbleFiend', role: 'Pro-Am Starter',  color: '#8B5CF6' },
          ].map(({ q, name, role, color }, i) => (
            <motion.div key={name} className="card card-lift p-7 relative overflow-hidden"
              initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.12, type: 'spring', stiffness: 180, damping: 24 }}>
              <div className="absolute top-0 left-[15%] right-[15%] h-px"
                style={{ background: `linear-gradient(90deg, transparent, ${color}45, transparent)` }}/>
              <div className="flex gap-0.5 mb-5">
                {[...Array(5)].map((_, j) => <Star key={j} className="w-3.5 h-3.5 fill-amber-400 text-amber-400"/>)}
              </div>
              <p className="text-white/40 text-sm leading-relaxed mb-6">&ldquo;{q}&rdquo;</p>
              <div className="flex items-center gap-3.5 pt-5 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                  style={{ background: `${color}18`, border: `1px solid ${color}28` }}>{name[0]}</div>
                <div>
                  <p className="text-white font-semibold text-sm tracking-tight">{name}</p>
                  <p className="text-white/25 text-xs mt-0.5">{role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-36 px-6 relative overflow-hidden border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[360px] rounded-full"
            style={{ background: 'radial-gradient(ellipse, rgba(225,29,72,0.06), transparent 70%)' }}/>
        </div>
        <motion.div initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="relative max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-10 mx-auto"
            style={{ background: 'rgba(225,29,72,0.09)', border: '1px solid rgba(225,29,72,0.18)' }}>
            <Zap className="w-7 h-7 text-rose-400"/>
          </div>
          <h2 className="display text-white mb-6" style={{ fontSize: 'clamp(40px,6.5vw,72px)', lineHeight: '0.92' }}>
            Ready to master<br/><span className="text-gradient">the meta?</span>
          </h2>
          <p className="text-white/32 text-lg mb-12 max-w-sm mx-auto font-light leading-relaxed">
            Join 50,000+ players building smarter with CourtIQ.
          </p>
          <div className="flex flex-col sm:flex-row gap-3.5 justify-center">
            <Link href="/analyze" className="btn btn-primary btn-xl gap-2.5">
              <Zap className="w-5 h-5"/> Start Free — No Account Needed
            </Link>
            <Link href="/coach" className="btn btn-secondary btn-xl gap-2.5">
              <Brain className="w-5 h-5 text-sky-400"/> Talk to AI Coach
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t py-12 px-6" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-3">
            <CourtIQLogo className="w-7 h-7"/>
            <span className="display text-lg font-bold text-white tracking-tight">Court<span className="text-rose-400">IQ</span></span>
          </div>
          <div className="flex flex-wrap justify-center gap-7 text-sm text-white/22">
            {[['Dashboard','/dashboard'],['Analyze','/analyze'],['Coach','/coach'],['Optimizer','/optimize'],['Matchup','/matchup'],['Builds','/builds'],['Meta','/meta'],['Squad','/squad']].map(([l,h]) => (
              <Link key={l} href={h} className="hover:text-white/65 transition-colors duration-150">{l}</Link>
            ))}
          </div>
          <p className="text-white/14 text-xs tracking-wide">© 2026 CourtIQ · Not affiliated with 2K Sports</p>
        </div>
      </footer>
    </div>
  )
}
