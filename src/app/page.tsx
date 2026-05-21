'use client'
import { motion, useScroll, useTransform } from 'framer-motion'
import Link from 'next/link'
import {
  Zap, Brain, BarChart3, Users, TrendingUp, BookOpen,
  ArrowRight, Star, Shield, Target, ChevronRight,
  Activity, Cpu, Globe, Award,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import Navbar from '@/components/layout/Navbar'
import { useRef } from 'react'

const features = [
  {
    icon: Zap,
    title: 'Build Analyzer',
    description: 'Upload your build screenshot and get instant AI analysis — strengths, weaknesses, upgrade paths, and meta viability.',
    color: 'text-crimson',
    bg: 'bg-crimson/10',
    border: 'border-crimson/20',
    glow: 'hover:shadow-crimson',
  },
  {
    icon: Brain,
    title: 'AI Coach',
    description: 'Chat with your personal 2K AI coach. Ask anything — from badge priority to how to stop getting cooked on defense.',
    color: 'text-neon-blue',
    bg: 'bg-neon-blue/10',
    border: 'border-neon-blue/20',
    glow: 'hover:glow-blue',
  },
  {
    icon: Activity,
    title: 'Gameplay Analyzer',
    description: 'Upload your clips. AI breaks down spacing, shot selection, defensive mistakes, and gives you coaching notes.',
    color: 'text-purple-400',
    bg: 'bg-purple-400/10',
    border: 'border-purple-400/20',
    glow: 'hover:shadow-purple',
  },
  {
    icon: TrendingUp,
    title: 'Meta Tracker',
    description: 'Stay ahead of every patch. Track the strongest builds, top badges, jumpshot trends, and tier lists in real time.',
    color: 'text-green-400',
    bg: 'bg-green-400/10',
    border: 'border-green-400/20',
    glow: '',
  },
  {
    icon: Users,
    title: 'Build Database',
    description: 'Browse thousands of community builds. Filter by position, category, tier, and meta viability. Share your own.',
    color: 'text-yellow-400',
    bg: 'bg-yellow-400/10',
    border: 'border-yellow-400/20',
    glow: '',
  },
  {
    icon: BookOpen,
    title: 'Tutorial Hub',
    description: 'AI-curated tutorials matched to your build. Dribble guides, jumpshot tutorials, defense breakdowns — all in one place.',
    color: 'text-orange-400',
    bg: 'bg-orange-400/10',
    border: 'border-orange-400/20',
    glow: '',
  },
]

const stats = [
  { value: '50K+', label: 'Builds Analyzed' },
  { value: '200K+', label: 'AI Coaching Chats' },
  { value: '15K+', label: 'Community Builds' },
  { value: '99.2%', label: 'Uptime' },
]

const testimonials = [
  {
    quote: "CourtIQ told me my guard build was better as a slasher than a shooter. Changed my whole playstyle — went from losing to top 5 in my park.",
    name: 'KingJosiah',
    role: 'Park Legend',
    avatar: 'K',
    color: 'from-crimson to-purple-600',
  },
  {
    quote: "The AI coach is actually insane. Asked it why I keep getting blocked going to the rim — it analyzed my build and told me exactly which badges I was missing.",
    name: 'FlightTime2K',
    role: 'Comp Rec Player',
    avatar: 'F',
    color: 'from-blue-500 to-purple-600',
  },
  {
    quote: "Meta tracker is the most useful tool I've used this season. Found out my build was C-tier before wasting VC. Built an S-tier instead.",
    name: 'DribbleFiend',
    role: 'Pro-Am Starter',
    avatar: 'D',
    color: 'from-green-500 to-blue-600',
  },
]

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll()
  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0])
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -50])

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />

      {/* Hero */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center hero-bg grid-bg pt-16">
        {/* Animated orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 8, repeat: Infinity }}
            className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-crimson/10 blur-3xl"
          />
          <motion.div
            animate={{ scale: [1.1, 1, 1.1], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 10, repeat: Infinity }}
            className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-purple-600/10 blur-3xl"
          />
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.3, 0.15] }}
            transition={{ duration: 12, repeat: Infinity }}
            className="absolute top-1/2 right-1/3 w-64 h-64 rounded-full bg-neon-blue/8 blur-3xl"
          />
        </div>

        <motion.div
          style={{ opacity: heroOpacity, y: heroY }}
          className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 text-center"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-crimson/10 border border-crimson/20 text-crimson text-sm font-medium mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-crimson animate-pulse" />
            NBA 2K26 Season Live — Meta Updated
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl sm:text-6xl lg:text-8xl font-black tracking-tight font-display mb-6 leading-none"
          >
            <span className="text-text-primary">Build Smarter.</span>
            <br />
            <span className="bg-gradient-to-r from-crimson via-red-400 to-purple-500 bg-clip-text text-transparent">
              Play Better.
            </span>
          </motion.h1>

          {/* Sub */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg sm:text-xl text-text-secondary max-w-3xl mx-auto mb-10 leading-relaxed"
          >
            CourtIQ is the AI-powered NBA 2K26 platform trusted by elite players.
            Analyze builds, get AI coached, track the meta, and dominate your competition.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link href="/analyze">
              <Button size="xl" className="group text-base gap-3 shadow-crimson">
                <Zap className="w-5 h-5" />
                Analyze My Build Free
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/builds">
              <Button variant="secondary" size="xl" className="text-base gap-2">
                <Users className="w-5 h-5" />
                Explore Builds
              </Button>
            </Link>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-12 flex flex-wrap justify-center gap-8 text-sm text-text-muted"
          >
            {stats.map(({ value, label }) => (
              <div key={label} className="flex flex-col items-center">
                <span className="text-2xl font-bold text-text-primary font-display">{value}</span>
                <span>{label}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-xs text-text-muted">Scroll to explore</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-5 h-8 rounded-full border border-border flex items-start justify-center pt-1"
          >
            <div className="w-1 h-2 rounded-full bg-crimson" />
          </motion.div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-crimson text-sm font-semibold tracking-wider uppercase">Platform Features</span>
            <h2 className="text-4xl sm:text-5xl font-black font-display mt-3 mb-4 text-text-primary">
              Everything You Need to
              <span className="text-gradient"> Level Up</span>
            </h2>
            <p className="text-text-secondary text-lg max-w-2xl mx-auto">
              Six powerful AI-driven tools designed to take your 2K game from average to elite.
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, title, description, color, bg, border, glow }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ y: -4 }}
              className={`glass-card p-6 border ${border} transition-all duration-300 ${glow} cursor-default group`}
            >
              <div className={`${bg} ${border} border rounded-xl w-12 h-12 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <Icon className={`w-6 h-6 ${color}`} />
              </div>
              <h3 className="text-lg font-bold text-text-primary mb-2">{title}</h3>
              <p className="text-text-secondary text-sm leading-relaxed">{description}</p>
              <div className={`mt-4 flex items-center gap-1 text-xs font-medium ${color}`}>
                Learn more <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* AI Showcase Section */}
      <section className="py-24 bg-surface/50 border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="text-crimson text-sm font-semibold tracking-wider uppercase">AI Analysis</span>
              <h2 className="text-4xl sm:text-5xl font-black font-display mt-3 mb-6 text-text-primary">
                Powered by
                <span className="text-gradient-blue"> Groq AI</span>
              </h2>
              <p className="text-text-secondary text-lg mb-8 leading-relaxed">
                Our AI analyzes your builds in seconds using Groq's ultra-fast inference. Get detailed archetype breakdowns, badge recommendations, and meta comparisons that would take a pro coach hours to compile.
              </p>
              <div className="space-y-4">
                {[
                  { icon: Cpu, label: 'Instant Analysis', desc: 'Sub-second AI responses via Groq' },
                  { icon: Target, label: 'Precision Insights', desc: 'Build-specific, not generic advice' },
                  { icon: Shield, label: 'Meta Aware', desc: 'Updated with every patch' },
                  { icon: Globe, label: 'Vision AI', desc: 'Analyze screenshots directly' },
                ].map(({ icon: Icon, label, desc }) => (
                  <div key={label} className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-crimson/10 border border-crimson/20 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-crimson" />
                    </div>
                    <div>
                      <p className="text-text-primary font-semibold text-sm">{label}</p>
                      <p className="text-text-muted text-xs">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8">
                <Link href="/analyze">
                  <Button className="gap-2">
                    Try the Analyzer <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </motion.div>

            {/* Mock AI Analysis Card */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="glass-card border border-crimson/20 p-6 rounded-2xl shadow-crimson">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-crimson/10 border border-crimson/20 flex items-center justify-center">
                    <Brain className="w-5 h-5 text-crimson" />
                  </div>
                  <div>
                    <p className="text-text-primary font-bold">CourtIQ Analysis</p>
                    <p className="text-text-muted text-xs">PG • Shot Creator • 6&apos;4&quot;</p>
                  </div>
                  <div className="ml-auto px-2.5 py-1 rounded-lg bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 text-xs font-bold">S-Tier</div>
                </div>

                <p className="text-text-secondary text-sm mb-5 italic border-l-2 border-crimson pl-4">
                  "This build performs best as a rim-pressure shot creator rather than a pure perimeter scorer due to stronger finishing consistency. The 87 ball handle enables elite dribble packages."
                </p>

                <div className="space-y-3">
                  {[
                    { label: 'Competitiveness', value: 88, color: '#DC143C' },
                    { label: 'Skill Ceiling', value: 92, color: '#7C3AED' },
                    { label: 'Meta Viability', value: 95, color: '#00D4FF' },
                  ].map(({ label, value, color }) => (
                    <div key={label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-text-secondary">{label}</span>
                        <span className="text-text-primary font-mono font-bold">{value}</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${value}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, delay: 0.3 }}
                          className="h-full rounded-full"
                          style={{ background: color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="bg-surface rounded-xl p-3 border border-border">
                    <p className="text-xs text-text-muted mb-1">Top Strength</p>
                    <p className="text-xs text-green-400 font-medium">Elite ball handling + finishing combo</p>
                  </div>
                  <div className="bg-surface rounded-xl p-3 border border-border">
                    <p className="text-xs text-text-muted mb-1">Weakness</p>
                    <p className="text-xs text-crimson font-medium">Limited 3PT range</p>
                  </div>
                </div>
              </div>

              {/* Floating badge */}
              <motion.div
                animate={{ y: [-4, 4, -4] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute -top-4 -right-4 bg-card border border-border rounded-2xl px-4 py-2 shadow-card"
              >
                <p className="text-xs text-text-muted">Analyzed in</p>
                <p className="text-lg font-bold text-neon-blue font-mono">0.4s</p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <span className="text-crimson text-sm font-semibold tracking-wider uppercase">Community</span>
            <h2 className="text-4xl sm:text-5xl font-black font-display mt-3 text-text-primary">
              Trusted by Top Players
            </h2>
          </motion.div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map(({ quote, name, role, avatar, color }, i) => (
            <motion.div
              key={name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-6"
            >
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-text-secondary text-sm leading-relaxed mb-6 italic">"{quote}"</p>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${color} flex items-center justify-center font-bold text-white`}>
                  {avatar}
                </div>
                <div>
                  <p className="text-text-primary font-semibold text-sm">{name}</p>
                  <p className="text-text-muted text-xs">{role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-crimson/5 via-purple-600/5 to-neon-blue/5" />
        <div className="absolute inset-0 grid-bg opacity-50" />
        <div className="relative max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <Award className="w-16 h-16 text-crimson mx-auto mb-6" />
            <h2 className="text-4xl sm:text-6xl font-black font-display mb-6 text-text-primary">
              Ready to
              <span className="text-gradient"> Master the Meta?</span>
            </h2>
            <p className="text-text-secondary text-xl mb-10 max-w-2xl mx-auto">
              Join 50,000+ players using CourtIQ to build smarter, play better, and dominate the competition.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/analyze">
                <Button size="xl" className="text-base gap-3 shadow-crimson">
                  <Zap className="w-5 h-5" />
                  Start Free — No Account Needed
                </Button>
              </Link>
              <Link href="/coach">
                <Button variant="secondary" size="xl" className="text-base gap-2">
                  <Brain className="w-5 h-5" />
                  Talk to AI Coach
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-crimson to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">C</span>
              </div>
              <span className="text-xl font-bold font-display">Court<span className="text-crimson">IQ</span></span>
            </div>
            <div className="flex flex-wrap gap-6 text-sm text-text-muted">
              {['Dashboard', 'Analyzer', 'AI Coach', 'Builds', 'Meta', 'Tutorials'].map(link => (
                <Link key={link} href={`/${link.toLowerCase().replace(' ', '-')}`} className="hover:text-text-primary transition-colors">
                  {link}
                </Link>
              ))}
            </div>
            <p className="text-text-muted text-sm">
              © {new Date().getFullYear()} CourtIQ. Not affiliated with NBA 2K or 2K Sports.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
