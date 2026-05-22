'use client'
import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion'
import {
  Eye, Mic, MicOff, Search, Target, Shield, AlertTriangle,
  Crosshair, Brain, X, Plus, Zap, ChevronRight, Copy, Check,
} from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ReconReport {
  threat_level: 'Low' | 'Medium' | 'High' | 'Elite'
  estimated_build: {
    archetype: string; position: string; height_range: string
    likely_attributes: { three_point: number; speed: number; ball_handle: number; perimeter_defense: number; interior_defense: number; driving_dunk: number }
    confidence: number
  }
  known_intel: string[]
  primary_threats: string[]
  exploit_weaknesses: string[]
  kill_shot: string
  pre_game_mindset: string
}

interface XRayProfile {
  archetype: string; position: string; height_estimate: string
  confidence_overall: number
  deduced_attributes: Array<{ stat: string; estimated_range: string; confidence: number; evidence: string }>
  likely_badges: string[]
  identified_tendencies: string[]
  kill_shot: string
  counter_moves: string[]
  updated_profile: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const THREAT_CONFIG = {
  Low:   { color: '#34D399', bg: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.25)',  glow: '0 0 20px rgba(16,185,129,0.2)' },
  Medium:{ color: '#FCD34D', bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.25)',  glow: '0 0 20px rgba(245,158,11,0.2)' },
  High:  { color: '#FB923C', bg: 'rgba(249,115,22,0.1)',   border: 'rgba(249,115,22,0.3)',   glow: '0 0 20px rgba(249,115,22,0.25)' },
  Elite: { color: '#FB7185', bg: 'rgba(225,29,72,0.1)',    border: 'rgba(225,29,72,0.35)',   glow: '0 0 28px rgba(225,29,72,0.3)' },
}

const SPRING = { type: 'spring' as const, stiffness: 360, damping: 28, mass: 0.6 }
const SOFT   = { type: 'spring' as const, stiffness: 180, damping: 22 }
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } } }
const fadeUp  = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: SPRING } }

// ─── Confidence bar ───────────────────────────────────────────────────────────

function ConfBar({ pct, color = '#E11D48', delay = 0 }: { pct: number; color?: string; delay?: number }) {
  return (
    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
      <motion.div className="h-full rounded-full"
        style={{ background: color }}
        initial={{ width: 0 }} animate={{ width: `${pct}%` }}
        transition={{ ...SOFT, delay }} />
    </div>
  )
}

// ─── Threat level badge ───────────────────────────────────────────────────────

function ThreatBadge({ level }: { level: ReconReport['threat_level'] }) {
  const cfg = THREAT_CONFIG[level] || THREAT_CONFIG.Medium
  return (
    <motion.div
      initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={SPRING}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-black tracking-widest uppercase text-sm"
      style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color, boxShadow: cfg.glow }}>
      <AlertTriangle className="w-4 h-4" />
      THREAT: {level}
    </motion.div>
  )
}

// ─── Kill shot card ───────────────────────────────────────────────────────────

function KillShotCard({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
    toast.success('Kill shot copied')
  }
  return (
    <motion.div variants={fadeUp}
      className="relative overflow-hidden rounded-2xl p-5"
      style={{ background: 'rgba(225,29,72,0.07)', border: '1px solid rgba(225,29,72,0.3)', boxShadow: '0 0 32px rgba(225,29,72,0.12)' }}>
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, #E11D48, transparent)' }} />
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'rgba(225,29,72,0.2)', border: '1px solid rgba(225,29,72,0.3)' }}>
          <Target className="w-3.5 h-3.5 text-rose-400" />
        </div>
        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-rose-400">Kill Shot</span>
        <button onClick={copy} className="ml-auto flex items-center gap-1 text-[10px] text-white/30 hover:text-rose-400 transition-colors">
          {copied ? <><Check className="w-3 h-3 text-emerald-400" /><span className="text-emerald-400">Copied</span></> : <><Copy className="w-3 h-3" />Copy</>}
        </button>
      </div>
      <p className="text-white/85 text-sm leading-relaxed font-medium">{text}</p>
    </motion.div>
  )
}

// ─── Recon result ─────────────────────────────────────────────────────────────

function ReconResult({ report, gamertag }: { report: ReconReport; gamertag: string }) {
  const attrs = report.estimated_build.likely_attributes
  const attrList = [
    { label: '3-Point',  value: attrs.three_point,       color: '#38BDF8' },
    { label: 'Speed',    value: attrs.speed,              color: '#F59E0B' },
    { label: 'Ball Handle', value: attrs.ball_handle,     color: '#8B5CF6' },
    { label: 'Perim D',  value: attrs.perimeter_defense,  color: '#10B981' },
    { label: 'Int D',    value: attrs.interior_defense,   color: '#10B981' },
    { label: 'Dunk',     value: attrs.driving_dunk,       color: '#E11D48' },
  ]

  return (
    <motion.div className="space-y-4" variants={stagger} initial="hidden" animate="visible">
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[10px] font-bold tracking-[0.25em] text-white/25 uppercase mb-1">Intel Report — {gamertag}</p>
          <ThreatBadge level={report.threat_level} />
        </div>
        <div className="text-right">
          <p className="text-[10px] text-white/25 uppercase tracking-wider mb-1">Build Confidence</p>
          <p className="mono font-black text-2xl" style={{ color: report.estimated_build.confidence > 60 ? '#34D399' : report.estimated_build.confidence > 35 ? '#FCD34D' : '#71717A' }}>
            {report.estimated_build.confidence}%
          </p>
        </div>
      </motion.div>

      {/* Estimated build */}
      <motion.div variants={fadeUp} className="card p-5 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-white/[0.06]">
          <Brain className="w-3.5 h-3.5 text-white/30" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Estimated Build Profile</p>
          <span className="ml-auto chip chip-muted">{report.estimated_build.position}</span>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
          <div>
            <p className="text-[10px] text-white/30 uppercase tracking-wider">Archetype</p>
            <p className="font-semibold text-white/85 text-sm">{report.estimated_build.archetype}</p>
          </div>
          <div>
            <p className="text-[10px] text-white/30 uppercase tracking-wider">Height Range</p>
            <p className="font-semibold text-white/85 text-sm">{report.estimated_build.height_range}</p>
          </div>
        </div>
        <div className="space-y-2.5">
          {attrList.map(({ label, value, color }, i) => (
            <div key={label} className="flex items-center gap-3">
              <span className="text-[10px] text-white/40 w-16 flex-shrink-0">{label}</span>
              <ConfBar pct={((value - 25) / 74) * 100} color={color} delay={i * 0.07} />
              <span className="mono text-[11px] font-bold flex-shrink-0 w-6 text-right" style={{ color }}>{value}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Kill shot */}
      <KillShotCard text={report.kill_shot} />

      {/* Intel + threats + exploits */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { title: 'Known Intel', items: report.known_intel, color: '#7DD3FC', icon: Eye },
          { title: 'Their Threats', items: report.primary_threats, color: '#FB7185', icon: AlertTriangle },
          { title: 'Exploit These', items: report.exploit_weaknesses, color: '#34D399', icon: Crosshair },
        ].map(({ title, items, color, icon: Icon }) => (
          <motion.div key={title} variants={fadeUp} className="card p-4">
            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color }}>
              <Icon className="w-3 h-3" />{title}
            </p>
            <ul className="space-y-2">
              {items.map((item, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-white/55">
                  <span className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0" style={{ background: color }} />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>

      {/* Pre-game mindset */}
      <motion.div variants={fadeUp} className="card px-5 py-4 border-l-2" style={{ borderLeftColor: '#8B5CF6' }}>
        <p className="text-[10px] font-bold uppercase tracking-widest text-violet-400 mb-2">Pre-Game Mindset</p>
        <p className="text-white/55 text-sm leading-relaxed">{report.pre_game_mindset}</p>
      </motion.div>
    </motion.div>
  )
}

// ─── X-Ray result ─────────────────────────────────────────────────────────────

function XRayResult({ profile }: { profile: XRayProfile }) {
  const confColor = profile.confidence_overall > 70 ? '#34D399' : profile.confidence_overall > 45 ? '#FCD34D' : '#FB923C'
  return (
    <motion.div className="space-y-4" variants={stagger} initial="hidden" animate="visible">
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] text-white/25 uppercase tracking-wider mb-1">Build Decoded</p>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="display text-xl text-white font-bold">{profile.archetype}</span>
            <span className="chip chip-muted">{profile.position}</span>
            <span className="text-white/30 text-sm">{profile.height_estimate}</span>
          </div>
          <p className="text-xs text-white/40 mt-1 leading-relaxed">{profile.updated_profile}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-[10px] text-white/25 uppercase tracking-wider mb-1">Accuracy</p>
          <p className="mono font-black text-3xl" style={{ color: confColor }}>{profile.confidence_overall}%</p>
        </div>
      </motion.div>

      {/* Decoded attributes */}
      <motion.div variants={fadeUp} className="card p-5 space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 pb-2 border-b border-white/[0.06]">Decoded Attributes</p>
        {profile.deduced_attributes.map(({ stat, estimated_range, confidence, evidence }, i) => (
          <div key={stat}>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-[10px] text-white/40 w-20 flex-shrink-0">{stat}</span>
              <ConfBar pct={confidence} color={confidence > 70 ? '#34D399' : confidence > 45 ? '#FCD34D' : '#FB923C'} delay={i * 0.06} />
              <span className="mono text-[10px] font-bold text-white/60 flex-shrink-0 w-14 text-right">{estimated_range}</span>
              <span className="mono text-[10px] text-white/25 flex-shrink-0 w-8 text-right">{confidence}%</span>
            </div>
            <p className="text-[9px] text-white/25 pl-24 leading-snug italic">{evidence}</p>
          </div>
        ))}
      </motion.div>

      {/* Kill shot */}
      <KillShotCard text={profile.kill_shot} />

      {/* Counter moves + badges + tendencies */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <motion.div variants={fadeUp} className="card p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-rose-400 mb-3 flex items-center gap-1.5">
            <Zap className="w-3 h-3" />Counter Moves
          </p>
          <ol className="space-y-2">
            {profile.counter_moves.map((m, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-white/55">
                <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black flex-shrink-0 mt-0.5"
                  style={{ background: 'rgba(225,29,72,0.12)', border: '1px solid rgba(225,29,72,0.2)', color: '#FB7185' }}>
                  {i + 1}
                </span>
                {m}
              </li>
            ))}
          </ol>
        </motion.div>

        <motion.div variants={fadeUp} className="card p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-violet-400 mb-3 flex items-center gap-1.5">
            <Shield className="w-3 h-3" />Likely Badges
          </p>
          <div className="flex flex-wrap gap-1.5">
            {profile.likely_badges.map(b => (
              <span key={b} className="chip text-[10px]"
                style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', color: '#A78BFA' }}>
                {b}
              </span>
            ))}
          </div>
        </motion.div>

        <motion.div variants={fadeUp} className="card p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400 mb-3 flex items-center gap-1.5">
            <Eye className="w-3 h-3" />Tendencies
          </p>
          <ul className="space-y-2">
            {profile.identified_tendencies.map((t, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs text-white/55">
                <span className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0 bg-amber-400/60" />
                {t}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </motion.div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

type Mode = 'recon' | 'xray'

const PLATFORMS = ['Xbox', 'PlayStation', 'PC']

export default function VisionPage() {
  const [mode, setMode] = useState<Mode>('recon')

  // Recon state
  const [gamertag, setGamertag] = useState('')
  const [platform, setPlatform] = useState('Xbox')
  const [reconLoading, setReconLoading] = useState(false)
  const [reconResult, setReconResult] = useState<ReconReport | null>(null)

  // X-Ray state
  const [observations, setObservations] = useState<string[]>([])
  const [obsInput, setObsInput] = useState('')
  const [xrayLoading, setXrayLoading] = useState(false)
  const [xrayResult, setXrayResult] = useState<XRayProfile | null>(null)
  const [isListening, setIsListening] = useState(false)
  const [voiceSupported, setVoiceSupported] = useState(false)
  const recognitionRef = useRef<{ start: () => void; stop: () => void; abort: () => void } | null>(null)
  const obsEndRef = useRef<HTMLDivElement>(null)

  // Scan animation for active listening
  const scanY = useMotionValue(0)
  const scanSpring = useSpring(scanY, { stiffness: 60, damping: 15 })

  useEffect(() => {
    const SR = (window as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).SpeechRecognition
      || (window as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).webkitSpeechRecognition
    setVoiceSupported(!!SR)
  }, [])

  useEffect(() => {
    if (isListening) {
      const interval = setInterval(() => {
        scanY.set(Math.random() * 100)
      }, 800)
      return () => clearInterval(interval)
    }
  }, [isListening, scanY])

  useEffect(() => {
    obsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [observations])

  const addObservation = useCallback((text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return
    setObservations(prev => [...prev, trimmed])
    setObsInput('')
  }, [])

  const startVoice = useCallback(() => {
    const SR = (window as { SpeechRecognition?: new () => { continuous: boolean; interimResults: boolean; lang: string; onresult: ((e: { results: { [key: number]: { [key: number]: { transcript: string } } } }) => void); onerror: () => void; onend: () => void; start: () => void; stop: () => void; abort: () => void }; webkitSpeechRecognition?: new () => { continuous: boolean; interimResults: boolean; lang: string; onresult: ((e: { results: { [key: number]: { [key: number]: { transcript: string } } } }) => void); onerror: () => void; onend: () => void; start: () => void; stop: () => void; abort: () => void } }).SpeechRecognition
      || (window as { SpeechRecognition?: new () => { continuous: boolean; interimResults: boolean; lang: string; onresult: ((e: { results: { [key: number]: { [key: number]: { transcript: string } } } }) => void); onerror: () => void; onend: () => void; start: () => void; stop: () => void; abort: () => void }; webkitSpeechRecognition?: new () => { continuous: boolean; interimResults: boolean; lang: string; onresult: ((e: { results: { [key: number]: { [key: number]: { transcript: string } } } }) => void); onerror: () => void; onend: () => void; start: () => void; stop: () => void; abort: () => void } }).webkitSpeechRecognition
    if (!SR) return
    const r = new SR()
    r.continuous = false; r.interimResults = false; r.lang = 'en-US'
    r.onresult = (e: { results: { [key: number]: { [key: number]: { transcript: string } } } }) => {
      const t = e.results[0][0].transcript
      addObservation(t)
      toast.success(`Signal acquired: "${t}"`, { icon: '📡' })
    }
    r.onerror = () => setIsListening(false)
    r.onend = () => setIsListening(false)
    recognitionRef.current = r
    r.start()
    setIsListening(true)
  }, [addObservation])

  const stopVoice = useCallback(() => {
    recognitionRef.current?.stop()
    setIsListening(false)
  }, [])

  const runRecon = async () => {
    if (!gamertag.trim()) return toast.error('Enter a gamertag first')
    setReconLoading(true); setReconResult(null)
    try {
      const res = await fetch('/api/vision', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'recon', gamertag: gamertag.trim(), platform }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setReconResult(data.report)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Recon failed')
    } finally {
      setReconLoading(false)
    }
  }

  const runXRay = async () => {
    if (observations.length === 0) return toast.error('Add at least one observation first')
    setXrayLoading(true)
    try {
      const res = await fetch('/api/vision', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'xray', observations }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setXrayResult(data.profile)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'X-Ray failed')
    } finally {
      setXrayLoading(false)
    }
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-3 sm:px-6 pt-6 sm:pt-8 pb-24 relative">

        {/* Ambient glow */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full blur-[120px] opacity-[0.06]"
            style={{ background: 'radial-gradient(ellipse, #E11D48 0%, transparent 70%)' }} />
        </div>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={SPRING} className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2.5 mb-3">
            <motion.div
              className="w-10 h-10 rounded-xl flex items-center justify-center relative overflow-hidden"
              style={{ background: 'rgba(225,29,72,0.1)', border: '1px solid rgba(225,29,72,0.25)' }}
              animate={{ boxShadow: ['0 0 0px rgba(225,29,72,0)', '0 0 18px rgba(225,29,72,0.35)', '0 0 0px rgba(225,29,72,0)'] }}
              transition={{ duration: 2.5, repeat: Infinity }}>
              <Eye className="w-5 h-5 text-rose-400" />
            </motion.div>
            <div>
              <span className="text-rose-400 text-[10px] font-black tracking-[0.3em] uppercase">2K Vision</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <motion.span className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                  animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.8, repeat: Infinity }} />
                <span className="text-[9px] text-white/30 uppercase tracking-wider">Intelligence Active</span>
              </div>
            </div>
          </div>
          <h1 className="display text-3xl sm:text-4xl text-white mb-1">See Through Anyone</h1>
          <p className="text-white/35 text-xs sm:text-sm">Recon any gamertag before a game. Or describe what you see live — AI decodes their build in real time.</p>
        </motion.div>

        {/* Mode tabs */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING, delay: 0.05 }}
          className="card p-1 flex gap-1 mb-5">
          {([
            { key: 'recon' as Mode, label: 'Pre-Game Recon', icon: Search, desc: 'Gamertag lookup' },
            { key: 'xray'  as Mode, label: 'In-Game X-Ray',  icon: Crosshair, desc: 'Voice + build decode' },
          ] as const).map(({ key, label, icon: Icon, desc }) => (
            <button key={key} onClick={() => setMode(key)}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all',
                mode === key
                  ? 'bg-rose-500 text-white shadow-[0_2px_12px_rgba(225,29,72,0.4)]'
                  : 'text-white/35 hover:text-white/60'
              )}>
              <Icon className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">{desc}</span>
            </button>
          ))}
        </motion.div>

        <AnimatePresence mode="wait">

          {/* ── PRE-GAME RECON ── */}
          {mode === 'recon' && (
            <motion.div key="recon"
              initial={{ opacity: 0, x: -32 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 32 }}
              transition={SOFT} className="space-y-4">

              <div className="card p-5 space-y-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 flex items-center gap-2">
                  <Search className="w-3 h-3 text-rose-400" />Enter Target
                </p>

                <div className="flex gap-2">
                  <input
                    className="input flex-1 font-mono"
                    placeholder="Opponent gamertag..."
                    value={gamertag}
                    onChange={e => setGamertag(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && runRecon()}
                  />
                  <div className="flex gap-1">
                    {PLATFORMS.map(p => (
                      <button key={p} onClick={() => setPlatform(p)}
                        className={cn('px-2.5 py-2 rounded-lg text-[11px] font-semibold transition-all border',
                          platform === p
                            ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                            : 'border-white/08 text-white/30 hover:text-white/60 hover:border-white/15'
                        )}>
                        {p === 'PlayStation' ? 'PSN' : p}
                      </button>
                    ))}
                  </div>
                </div>

                <motion.button
                  onClick={runRecon} disabled={reconLoading || !gamertag.trim()}
                  whileTap={{ scale: 0.97 }} transition={{ type: 'spring', stiffness: 500, damping: 17 }}
                  className="btn btn-primary w-full gap-2.5 disabled:opacity-50">
                  {reconLoading
                    ? <><span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />Scanning intel...</>
                    : <><Eye className="w-4 h-4" />Run Recon</>}
                </motion.button>
              </div>

              {/* Recon loading */}
              <AnimatePresence>
                {reconLoading && (
                  <motion.div key="recon-load"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="card p-8 flex flex-col items-center gap-4 overflow-hidden relative">
                    {/* Scan line */}
                    <motion.div className="absolute left-0 right-0 h-px pointer-events-none"
                      style={{ background: 'linear-gradient(90deg, transparent, rgba(225,29,72,0.6), transparent)' }}
                      animate={{ top: ['0%', '100%', '0%'] }}
                      transition={{ duration: 2.4, repeat: Infinity, ease: 'linear' }} />
                    <div className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(225,29,72,0.1)', border: '1px solid rgba(225,29,72,0.25)' }}>
                      <Eye className="w-6 h-6 text-rose-400 animate-pulse" />
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-white mb-1">Running Recon on <span className="text-rose-400 font-mono">{gamertag}</span></p>
                      <p className="text-white/35 text-sm">Searching Reddit, 2K forums, and community data...</p>
                    </div>
                    <div className="w-full max-w-xs space-y-2">
                      {['Scanning Reddit r/NBA2k...', 'Checking 2K forums...', 'Generating intel report...'].map((s, i) => (
                        <motion.div key={s}
                          initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.6 }}
                          className="flex items-center gap-2 text-xs text-white/30">
                          <motion.span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ background: '#E11D48' }}
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 1.2, delay: i * 0.6, repeat: Infinity }} />
                          {s}
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Recon results */}
              <AnimatePresence>
                {!reconLoading && reconResult && (
                  <motion.div key="recon-result"
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    transition={{ ...SPRING, delay: 0.05 }}>
                    <ReconResult report={reconResult} gamertag={gamertag} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ── IN-GAME X-RAY ── */}
          {mode === 'xray' && (
            <motion.div key="xray"
              initial={{ opacity: 0, x: 32 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -32 }}
              transition={SOFT} className="space-y-4">

              {/* Signal collector */}
              <div className="card p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 flex items-center gap-2">
                    <Crosshair className="w-3 h-3 text-rose-400" />Observation Feed
                  </p>
                  <span className="chip chip-crimson">{observations.length} signal{observations.length !== 1 ? 's' : ''}</span>
                </div>

                {/* Observations list */}
                {observations.length > 0 && (
                  <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                    {observations.map((obs, i) => (
                      <motion.div key={i}
                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                        className="flex items-start gap-2.5 group">
                        <span className="text-[9px] font-black text-rose-400/60 uppercase tracking-wider mt-1 flex-shrink-0 w-12">
                          SIG {String(i + 1).padStart(2, '0')}
                        </span>
                        <p className="text-xs text-white/60 flex-1 font-mono leading-snug">{obs}</p>
                        <button onClick={() => setObservations(prev => prev.filter((_, j) => j !== i))}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-white/20 hover:text-rose-400 mt-0.5 flex-shrink-0">
                          <X className="w-3 h-3" />
                        </button>
                      </motion.div>
                    ))}
                    <div ref={obsEndRef} />
                  </div>
                )}

                {observations.length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-white/20 text-xs">No signals yet. Tap the mic or type what you see.</p>
                    <p className="text-white/15 text-[10px] mt-1">Examples: "drove left twice", "hit three from the corner", "super fast"</p>
                  </div>
                )}

                {/* Input row */}
                <div className="flex gap-2">
                  {voiceSupported && (
                    <motion.button
                      onClick={isListening ? stopVoice : startVoice}
                      whileTap={{ scale: 0.92 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 17 }}
                      className={cn(
                        'w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all relative',
                        isListening
                          ? 'bg-rose-500 text-white'
                          : 'border border-white/10 text-white/40 hover:text-white/70 hover:border-white/20'
                      )}>
                      {isListening && (
                        <motion.div className="absolute inset-0 rounded-xl border-2 border-rose-400"
                          animate={{ scale: [1, 1.25, 1], opacity: [0.6, 0, 0.6] }}
                          transition={{ duration: 1.2, repeat: Infinity }} />
                      )}
                      {isListening ? <MicOff className="w-4 h-4 relative z-10" /> : <Mic className="w-4 h-4" />}
                    </motion.button>
                  )}
                  <input
                    className="input flex-1 text-sm font-mono"
                    placeholder={voiceSupported ? 'Or type what you see...' : 'Type what you observe...'}
                    value={obsInput}
                    onChange={e => setObsInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { addObservation(obsInput); } }}
                  />
                  <button onClick={() => addObservation(obsInput)} disabled={!obsInput.trim()}
                    className="btn btn-secondary btn-icon disabled:opacity-30">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {isListening && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="text-center text-xs text-rose-400 animate-pulse">
                    Listening... speak what you see
                  </motion.p>
                )}
              </div>

              {/* Scan button */}
              <motion.button
                onClick={runXRay} disabled={xrayLoading || observations.length === 0}
                whileTap={{ scale: 0.97 }} transition={{ type: 'spring', stiffness: 500, damping: 17 }}
                className="btn btn-primary btn-lg w-full gap-2.5 disabled:opacity-40">
                {xrayLoading
                  ? <><span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />Decoding build...</>
                  : <><Crosshair className="w-5 h-5" />Run X-Ray Scan {observations.length > 0 && `(${observations.length} signals)`}</>}
              </motion.button>

              {observations.length > 0 && observations.length < 3 && !xrayResult && (
                <p className="text-center text-[10px] text-white/25">Add {3 - observations.length} more signal{3 - observations.length !== 1 ? 's' : ''} for a more accurate decode</p>
              )}

              {/* X-Ray loading */}
              <AnimatePresence>
                {xrayLoading && (
                  <motion.div key="xray-load"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="card p-8 flex flex-col items-center gap-4 overflow-hidden relative">
                    <motion.div className="absolute left-0 right-0 h-px pointer-events-none"
                      style={{ background: 'linear-gradient(90deg, transparent, rgba(225,29,72,0.6), transparent)' }}
                      animate={{ top: ['0%', '100%', '0%'] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} />
                    <div className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(225,29,72,0.1)', border: '1px solid rgba(225,29,72,0.25)' }}>
                      <Crosshair className="w-6 h-6 text-rose-400 animate-spin" style={{ animationDuration: '3s' }} />
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-white mb-1">Decoding Build from {observations.length} Signals</p>
                      <p className="text-white/35 text-sm">Cross-referencing Season 7 meta database...</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* X-Ray results */}
              <AnimatePresence>
                {!xrayLoading && xrayResult && (
                  <motion.div key="xray-result"
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    transition={{ ...SPRING, delay: 0.05 }}>
                    <XRayResult profile={xrayResult} />
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                      className="text-center text-[10px] text-white/20 mt-3">
                      Add more observations and re-scan to improve accuracy
                    </motion.p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </AppLayout>
  )
}
