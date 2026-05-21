'use client'
import { useEffect, useRef, useState } from 'react'
import { motion, useScroll, useTransform, useInView, useMotionValue, useSpring } from 'framer-motion'
import Link from 'next/link'
import { Zap, Brain, TrendingUp, Users, BookOpen, ArrowRight, Activity, ChevronRight, Cpu, Shield, Star } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import { CourtIQLogo } from '@/components/ui/Logo'

/* ── Animated counter ─────────────────────────────────────────── */
function Counter({ end, suffix = '' }: { end: number; suffix?: string }) {
  const [val, setVal] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })
  useEffect(() => {
    if (!inView) return
    const start = Date.now(), dur = 1800
    const tick = () => {
      const t = Math.min((Date.now() - start) / dur, 1)
      setVal(Math.floor((1 - Math.pow(1 - t, 4)) * end))
      if (t < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [inView, end])
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>
}

/* ── Mouse-follow orbs ────────────────────────────────────────── */
function FloatingOrbs() {
  const mx = useMotionValue(0), my = useMotionValue(0)
  const sx = useSpring(mx, { stiffness: 35, damping: 28 })
  const sy = useSpring(my, { stiffness: 35, damping: 28 })
  useEffect(() => {
    const fn = (e: MouseEvent) => { mx.set((e.clientX - window.innerWidth / 2) * 0.018); my.set((e.clientY - window.innerHeight / 2) * 0.018) }
    window.addEventListener('mousemove', fn)
    return () => window.removeEventListener('mousemove', fn)
  }, [mx, my])
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
      <motion.div style={{ x: sx, y: sy, background: 'radial-gradient(circle, #E11D48, transparent 70%)' }}
        className="absolute top-[-15%] left-[15%] w-[700px] h-[700px] rounded-full opacity-[0.065]"
        animate={{ scale: [1, 1.06, 1] }} transition={{ duration: 9, repeat: Infinity }}
      />
    </div>
  )
}

/* ── Grid bg ──────────────────────────────────────────────────── */
function Grid() {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none select-none" aria-hidden>
      <defs>
        <pattern id="g" width="64" height="64" patternUnits="userSpaceOnUse">
          <path d="M 64 0 L 0 0 0 64" fill="none" stroke="rgba(255,255,255,0.018)" strokeWidth="1"/>
        </pattern>
        <radialGradient id="gm" cx="50%" cy="35%" r="55%">
          <stop offset="0%" stopColor="white" stopOpacity="1"/>
          <stop offset="100%" stopColor="white" stopOpacity="0"/>
        </radialGradient>
        <mask id="gmask"><rect width="100%" height="100%" fill="url(#gm)"/></mask>
      </defs>
      <rect width="100%" height="100%" fill="url(#g)" mask="url(#gmask)"/>
    </svg>
  )
}

/* ── Marquee ──────────────────────────────────────────────────── */
const ITEMS = [
  { label: 'Build Analyzer', color: '#E11D48' }, { label: 'AI Coach', color: '#38BDF8' },
  { label: 'Meta Tracker', color: '#10B981' },   { label: 'Build Database', color: '#F59E0B' },
  { label: 'Gameplay AI', color: '#8B5CF6' },    { label: 'Tutorial Hub', color: '#38BDF8' },
  { label: 'Groq Powered', color: '#E11D48' },   { label: 'NBA 2K26', color: '#FAFAFA' },
]
function Marquee() {
  const all = [...ITEMS, ...ITEMS, ...ITEMS]
  return (
    <div className="marquee-outer border-y border-white/[0.04] py-3.5 bg-white/[0.01]">
      <div className="marquee-track">
        {all.map((item, i) => (
          <div key={i} className="flex items-center gap-5 px-5">
            <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: item.color, boxShadow: `0 0 6px ${item.color}` }}/>
            <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-white/25">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Features ─────────────────────────────────────────────────── */
const FEATURES = [
  { icon: Zap, title: 'Build Analyzer', desc: 'Upload a screenshot or enter stats manually. Get archetype, tier rating, badge recs, and upgrade paths in under a second.', accent: '#E11D48', bg: 'rgba(225,29,72,0.07)', border: 'rgba(225,29,72,0.14)', href: '/analyze', tag: 'Core', span2: true },
  { icon: Brain, title: 'AI Coach', desc: "Ask anything. Get specific, actionable answers powered by Groq's fastest models.", accent: '#38BDF8', bg: 'rgba(56,189,248,0.07)', border: 'rgba(56,189,248,0.14)', href: '/coach', tag: 'Groq AI', span2: false },
  { icon: TrendingUp, title: 'Meta Tracker', desc: "Live tier lists. Know what's S-tier before everyone else.", accent: '#10B981', bg: 'rgba(16,185,129,0.07)', border: 'rgba(16,185,129,0.14)', href: '/meta', tag: 'Live', span2: false },
  { icon: Users, title: 'Build Database', desc: 'Browse and share community builds filtered by position, tier, and playstyle.', accent: '#F59E0B', bg: 'rgba(245,158,11,0.07)', border: 'rgba(245,158,11,0.14)', href: '/builds', tag: 'Community', span2: false },
  { icon: Activity, title: 'Gameplay Analyzer', desc: 'Drop a clip. AI spots spacing errors, bad shot selection, and defensive mistakes.', accent: '#8B5CF6', bg: 'rgba(139,92,246,0.07)', border: 'rgba(139,92,246,0.14)', href: '/analyze', tag: 'Vision AI', span2: false },
  { icon: BookOpen, title: 'Tutorial Hub', desc: 'AI-curated guides matched to your build and skill gaps.', accent: '#38BDF8', bg: 'rgba(56,189,248,0.07)', border: 'rgba(56,189,248,0.14)', href: '/tutorials', tag: 'Learn', span2: false },
]

function FCard({ f, i }: { f: typeof FEATURES[0]; i: number }) {
  const { icon: Icon } = f
  return (
    <motion.div
      className={f.span2 ? 'md:col-span-2 lg:col-span-2' : ''}
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ delay: i * 0.055, type: 'spring', stiffness: 180, damping: 22 }}
    >
      <Link href={f.href} className="group card card-lift block h-full p-6 relative overflow-hidden transition-[border-color,box-shadow] duration-300 hover:border-white/[0.07]">
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{ background: `radial-gradient(ellipse at 0% 0%, ${f.bg} 0%, transparent 60%)` }}/>
        <div className="relative">
          <div className="flex items-start justify-between mb-5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: f.bg, border: `1px solid ${f.border}` }}>
              <Icon className="w-5 h-5" style={{ color: f.accent }}/>
            </div>
            <span className="chip chip-muted">{f.tag}</span>
          </div>
          <h3 className="text-white font-semibold text-[15px] mb-2 group-hover:text-white transition-colors">{f.title}</h3>
          <p className="text-white/40 text-sm leading-relaxed">{f.desc}</p>
          <div className="flex items-center gap-1 mt-5 text-xs font-bold" style={{ color: f.accent }}>
            Open <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-200"/>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

/* ── Page ─────────────────────────────────────────────────────── */
export default function Page() {
  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 90])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.65], [1, 0])

  return (
    <div className="min-h-screen bg-bg overflow-x-hidden">
      <Navbar />

      {/* ── Hero ── */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        <Grid />
        {/* bg orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div className="absolute top-[-10%] left-[20%] w-[700px] h-[700px] rounded-full opacity-[0.06]"
            animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 9, repeat: Infinity }}
            style={{ background: 'radial-gradient(circle, #E11D48, transparent 70%)' }}/>
          <motion.div className="absolute top-[5%] right-[10%] w-[500px] h-[500px] rounded-full opacity-[0.04]"
            animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 11, repeat: Infinity, delay: 2 }}
            style={{ background: 'radial-gradient(circle, #7C3AED, transparent 70%)' }}/>
          <motion.div className="absolute bottom-[15%] left-[5%] w-[400px] h-[400px] rounded-full opacity-[0.035]"
            animate={{ scale: [1, 1.06, 1] }} transition={{ duration: 13, repeat: Infinity, delay: 4 }}
            style={{ background: 'radial-gradient(circle, #0EA5E9, transparent 70%)' }}/>
        </div>

        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          {/* Live badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 280, damping: 22 }}
            className="inline-flex items-center gap-2.5 px-4 py-2 mb-10 rounded-full text-xs font-semibold tracking-wide text-white/60"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <span className="status-online"/>
            NBA 2K26 Season Active — Meta Updated
            <span className="w-px h-3 bg-white/15 mx-0.5"/>
            <span className="text-rose-400 font-bold">Patch 1.08</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="display leading-[0.93] mb-6"
            style={{ fontSize: 'clamp(54px, 9vw, 100px)' }}
          >
            <span className="text-white">The AI Platform</span>
            <br />
            <span style={{ color: 'rgba(255,255,255,0.18)' }}>for&nbsp;</span>
            <span className="text-gradient">NBA 2K26</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.2 }}
            className="text-white/45 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed font-light"
          >
            Analyze your build, get coached by AI, track the meta, and dominate the park —
            powered by Groq, the fastest AI inference on the planet.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.28 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <Link href="/analyze" className="btn btn-primary btn-xl gap-2.5 group">
              <Zap className="w-5 h-5"/>
              Analyze My Build
              <ArrowRight className="w-4 h-4 opacity-60 group-hover:translate-x-1 group-hover:opacity-100 transition-all duration-200"/>
            </Link>
            <Link href="/coach" className="btn btn-secondary btn-xl gap-2">
              <Brain className="w-5 h-5 text-sky-400"/>
              Talk to AI Coach
            </Link>
          </motion.div>

          {/* Stats strip */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}
            className="mt-20 flex flex-wrap justify-center gap-x-14 gap-y-6"
          >
            {[
              { end: 50000, suffix: '+', label: 'Builds Analyzed' },
              { end: 200000, suffix: '+', label: 'AI Coach Messages' },
              { end: 15000, suffix: '+', label: 'Community Builds' },
              { end: 99, suffix: '%', label: 'Uptime' },
            ].map(({ end, suffix, label }) => (
              <div key={label} className="text-center">
                <div className="mono text-3xl font-semibold text-white"><Counter end={end} suffix={suffix}/></div>
                <div className="text-white/30 text-xs font-medium mt-1 tracking-wide uppercase">{label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll hint */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <motion.div animate={{ y: [0, 7, 0] }} transition={{ duration: 2, repeat: Infinity }}
            className="w-5 h-8 rounded-full flex items-start justify-center pt-1.5"
            style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="w-1 h-2 rounded-full bg-rose-500/70"/>
          </motion.div>
        </motion.div>
      </section>

      <Marquee/>

      {/* ── Features ── */}
      <section className="py-32 px-6 max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <p className="text-rose-400 text-[10px] font-bold tracking-[0.22em] uppercase mb-4">Platform</p>
          <h2 className="display text-5xl sm:text-6xl text-white mb-4">Six tools. Zero cap.</h2>
          <p className="text-white/35 text-lg max-w-sm mx-auto font-light">Everything you need to go from average to elite.</p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => <FCard key={f.title} f={f} i={i}/>)}
        </div>
      </section>

      {/* ── AI Showcase ── */}
      <section className="py-24 px-6 border-y border-white/[0.04]" style={{ background: 'rgba(255,255,255,0.008)' }}>
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}>
            <p className="text-rose-400 text-[10px] font-bold tracking-[0.22em] uppercase mb-5">AI Engine</p>
            <h2 className="display text-5xl sm:text-6xl text-white mb-5">
              Powered by<br/><span className="text-gradient-sky">Groq Intelligence</span>
            </h2>
            <p className="text-white/40 leading-relaxed mb-8 font-light text-lg">
              Sub-second build analysis. Vision AI reads your screenshots directly.
              Every response is build-specific, meta-aware, and immediately actionable.
            </p>
            <div className="space-y-4 mb-8">
              {[
                { icon: Cpu, label: 'Sub-second analysis', desc: 'Groq inference — not just fast, instant' },
                { icon: Shield, label: 'Meta-aware responses', desc: 'Updated after every patch automatically' },
                { icon: Activity, label: 'Vision AI support', desc: 'Drop a screenshot, get full analysis' },
              ].map(({ icon: Icon, label, desc }, i) => (
                <motion.div key={label} className="flex items-center gap-4"
                  initial={{ opacity: 0, x: -14 }} whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(225,29,72,0.07)', border: '1px solid rgba(225,29,72,0.13)' }}>
                    <Icon className="w-5 h-5 text-rose-400"/>
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">{label}</p>
                    <p className="text-white/30 text-xs">{desc}</p>
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
            transition={{ type: 'spring', stiffness: 100, damping: 20 }} className="relative">
            <div className="card card-glow p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(225,29,72,0.35), transparent)' }}/>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(225,29,72,0.1)', border: '1px solid rgba(225,29,72,0.18)' }}>
                    <Brain className="w-4 h-4 text-rose-400"/>
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">CourtIQ Analysis</p>
                    <p className="text-white/30 text-xs">Shot Creator · PG · 6&apos;4&quot;</p>
                  </div>
                </div>
                <span className="chip tier-s">S-Tier</span>
              </div>
              <p className="text-white/45 text-sm leading-relaxed mb-5 border-l-2 border-rose-500/25 pl-3 italic">
                &ldquo;Elite handles + rim pressure build. 87 ball handle unlocks HOF dribble animations while high driving layup creates consistent finishes through contact.&rdquo;
              </p>
              {[
                { label: 'Overall Rating', val: 94, color: '#E11D48' },
                { label: 'Competitiveness', val: 91, color: '#8B5CF6' },
                { label: 'Meta Viability', val: 96, color: '#38BDF8' },
              ].map(({ label, val, color }) => (
                <div key={label} className="mb-3">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-white/40">{label}</span>
                    <span className="mono font-bold text-white">{val}</span>
                  </div>
                  <div className="stat-bar">
                    <motion.div className="stat-bar-fill" style={{ background: color }}
                      initial={{ width: 0 }} whileInView={{ width: `${val}%` }}
                      viewport={{ once: true }} transition={{ duration: 1.3, delay: 0.4, ease: [0.34, 1.56, 0.64, 1] }}/>
                  </div>
                </div>
              ))}
              <div className="grid grid-cols-2 gap-2 mt-5 pt-4 border-t border-white/[0.05]">
                {[
                  { label: 'Strength', val: 'Elite handles + rim', color: '#10B981' },
                  { label: 'Weakness', val: 'Limited 3PT range', color: '#E11D48' },
                ].map(({ label, val, color }) => (
                  <div key={label} className="rounded-xl p-3" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <p className="text-white/25 text-[10px] uppercase tracking-wider font-bold mb-1">{label}</p>
                    <p className="text-xs font-semibold" style={{ color }}>{val}</p>
                  </div>
                ))}
              </div>
            </div>
            <motion.div animate={{ y: [-4, 4, -4] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-3 -right-3 glass rounded-xl px-3.5 py-2">
              <p className="text-white/30 text-[10px] font-medium">Analyzed in</p>
              <p className="mono text-sky-400 font-bold text-lg leading-none">0.4s</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-28 px-6 max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
          <h2 className="display text-4xl sm:text-5xl text-white mb-3">Trusted by top players</h2>
          <p className="text-white/30 font-light">Real players. Real results.</p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { q: "CourtIQ told me my guard build was better as a slasher than a shooter. Changed my whole playstyle — went from losing every game to top 5 in my park.", name: 'KingJosiah', role: 'Park Legend', color: '#E11D48' },
            { q: "The AI coach is actually insane. Asked it why I keep getting blocked — it pinpointed exactly which badges I was missing. Fixed it that day.", name: 'FlightTime2K', role: 'Comp Rec Player', color: '#38BDF8' },
            { q: "Meta tracker saved me VC. Found out my planned build was C-tier before I spent a dollar. Built an S-tier instead. Essential tool.", name: 'DribbleFiend', role: 'Pro-Am Starter', color: '#8B5CF6' },
          ].map(({ q, name, role, color }, i) => (
            <motion.div key={name} className="card p-6 relative overflow-hidden card-lift"
              initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.1, type: 'spring', stiffness: 200, damping: 25 }}>
              <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${color}35, transparent)` }}/>
              <div className="flex gap-0.5 mb-4">
                {[...Array(5)].map((_, j) => <Star key={j} className="w-3.5 h-3.5 fill-amber-400 text-amber-400"/>)}
              </div>
              <p className="text-white/45 text-sm leading-relaxed mb-5">&ldquo;{q}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                  style={{ background: `${color}18`, border: `1px solid ${color}25` }}>{name[0]}</div>
                <div>
                  <p className="text-white font-semibold text-sm">{name}</p>
                  <p className="text-white/25 text-xs">{role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-28 px-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full opacity-[0.055]"
            style={{ background: 'radial-gradient(ellipse, #E11D48, transparent 70%)' }}/>
        </div>
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="relative max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-8 mx-auto"
            style={{ background: 'rgba(225,29,72,0.09)', border: '1px solid rgba(225,29,72,0.15)' }}>
            <Zap className="w-8 h-8 text-rose-400"/>
          </div>
          <h2 className="display text-5xl sm:text-[64px] text-white mb-5">
            Ready to master<br/><span className="text-gradient">the meta?</span>
          </h2>
          <p className="text-white/35 text-lg mb-10 max-w-md mx-auto font-light">
            Join 50,000+ players using CourtIQ to build smarter and play better.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/analyze" className="btn btn-primary btn-xl gap-2.5">
              <Zap className="w-5 h-5"/> Start Free — No Account Needed
            </Link>
            <Link href="/builds" className="btn btn-secondary btn-xl gap-2">
              <Users className="w-5 h-5 text-white/40"/> Explore Builds
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/[0.04] py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <CourtIQLogo className="w-7 h-7"/>
            <span className="display text-lg font-bold text-white">Court<span className="text-rose-400">IQ</span></span>
          </div>
          <div className="flex flex-wrap gap-6 text-sm text-white/25">
            {['Dashboard', 'Analyze', 'Coach', 'Builds', 'Meta', 'Tutorials'].map(l => (
              <Link key={l} href={`/${l.toLowerCase()}`} className="hover:text-white/70 transition-colors">{l}</Link>
            ))}
          </div>
          <p className="text-white/15 text-xs">© 2026 CourtIQ · Not affiliated with 2K Sports</p>
        </div>
      </footer>
    </div>
  )
}
