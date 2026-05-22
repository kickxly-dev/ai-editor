'use client'
import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Eye, Mic, MicOff, Target, Shield, AlertTriangle,
  Crosshair, X, Plus, Copy, Check, Radio,
  TrendingUp, TrendingDown, Zap,
} from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

// ─── Types ───────────────────────────────────────────────────────────────────

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

interface WeaknessReport {
  build_summary: string
  core_weaknesses: Array<{ area: string; description: string; severity: number }>
  best_counters: Array<{ build_type: string; why: string; key_stats: string }>
  badge_punishments: string[]
  kill_sequence: string
  defensive_scheme: string
  one_liner: string
}

interface MetaReport {
  tier_s: Array<{ name: string; why: string; threat: string }>
  tier_a: Array<{ name: string; why: string }>
  trending_up: string[]
  trending_down: string[]
  most_abused_badges: string[]
  current_meta_summary: string
  biggest_threat: string
  analyst_note: string
}

// ─── Threat config ────────────────────────────────────────────────────────────

const THREAT_CFG = {
  Low:   { color: '#34D399', bg: 'rgba(16,185,129,0.07)',  border: 'rgba(16,185,129,0.3)',  glow: '0 0 24px rgba(16,185,129,0.25)' },
  Medium:{ color: '#FCD34D', bg: 'rgba(245,158,11,0.07)',  border: 'rgba(245,158,11,0.3)',  glow: '0 0 24px rgba(245,158,11,0.25)' },
  High:  { color: '#FB923C', bg: 'rgba(249,115,22,0.08)',  border: 'rgba(249,115,22,0.35)', glow: '0 0 28px rgba(249,115,22,0.3)' },
  Elite: { color: '#FF2D55', bg: 'rgba(255,45,85,0.08)',   border: 'rgba(255,45,85,0.4)',   glow: '0 0 36px rgba(255,45,85,0.35)' },
}

// ─── Modes ────────────────────────────────────────────────────────────────────

type Mode = 'recon' | 'xray' | 'weakness' | 'meta'

const MODES = [
  { key: 'recon'    as Mode, label: 'TARGET RECON',   sub: 'Gamertag intel',   Icon: Crosshair   },
  { key: 'xray'    as Mode, label: 'LIVE X-RAY',      sub: 'Build decoder',    Icon: Radio       },
  { key: 'weakness'as Mode, label: 'WEAKNESS SCAN',   sub: 'Exploit finder',   Icon: AlertTriangle },
  { key: 'meta'    as Mode, label: 'META PULSE',       sub: 'Live meta scan',   Icon: TrendingUp  },
]

// ─── Scramble-decrypt text ────────────────────────────────────────────────────

const GLYPHS = '!@#$%?<>0123456789ABCDEF▓█▒░'

function ScrambleText({ text, active, className, style }: {
  text: string; active: boolean; className?: string; style?: React.CSSProperties
}) {
  const [out, setOut] = useState(''.padEnd(text.length, '█'))
  useEffect(() => {
    if (!active) return
    let frame = 0
    const TOTAL = 22
    const id = setInterval(() => {
      if (frame >= TOTAL) { setOut(text); clearInterval(id); return }
      const settled = Math.floor((frame / TOTAL) * text.length)
      const noise = Array.from({ length: text.length - settled },
        () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)]).join('')
      setOut(text.slice(0, settled) + noise)
      frame++
    }, 38)
    return () => clearInterval(id)
  }, [active, text])
  return <span className={cn('font-mono', className)} style={style}>{out}</span>
}

// ─── Radar sweep ─────────────────────────────────────────────────────────────

function RadarScan() {
  return (
    <div className="relative w-28 h-28 flex-shrink-0">
      <svg viewBox="0 0 100 100" className="w-full h-full absolute inset-0">
        <circle cx="50" cy="50" r="47" stroke="rgba(225,29,72,0.15)" strokeWidth="0.8" fill="none" />
        <circle cx="50" cy="50" r="34" stroke="rgba(225,29,72,0.1)"  strokeWidth="0.8" fill="none" />
        <circle cx="50" cy="50" r="21" stroke="rgba(225,29,72,0.07)" strokeWidth="0.8" fill="none" />
        <line x1="50" y1="3" x2="50" y2="97" stroke="rgba(255,255,255,0.04)" strokeWidth="0.6" />
        <line x1="3" y1="50" x2="97" y2="50" stroke="rgba(255,255,255,0.04)" strokeWidth="0.6" />
      </svg>
      {/* Sweep arm */}
      <motion.div className="absolute inset-0" animate={{ rotate: 360 }} transition={{ duration: 2.4, repeat: Infinity, ease: 'linear' }}>
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <defs>
            <linearGradient id="sweep" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,45,85,0.5)" />
              <stop offset="100%" stopColor="rgba(255,45,85,0)" />
            </linearGradient>
          </defs>
          <path d="M50,50 L50,4 A46,46 0 0,1 96,50 Z" fill="url(#sweep)" />
          <line x1="50" y1="50" x2="50" y2="4" stroke="#FF2D55" strokeWidth="1" strokeOpacity="0.8" />
        </svg>
      </motion.div>
      {[{ t: '28%', l: '72%', d: 0.9 }, { t: '60%', l: '38%', d: 1.7 }].map(({ t, l, d }, i) => (
        <motion.div key={i} className="absolute w-1.5 h-1.5 rounded-full"
          style={{ top: t, left: l, background: '#FF2D55', boxShadow: '0 0 6px #FF2D55' }}
          animate={{ opacity: [0, 1, 0] }} transition={{ duration: 2.2, repeat: Infinity, delay: d }} />
      ))}
    </div>
  )
}

// ─── Terminal log stream ──────────────────────────────────────────────────────

const RECON_LOGS = [
  { ms: 0,    text: 'INITIALIZING NEURAL SCAN PROTOCOL v2.6' },
  { ms: 700,  text: 'ESTABLISHING ENCRYPTED TUNNEL...' },
  { ms: 1300, text: 'ACCESSING COMMUNITY INTELLIGENCE DATABASE...' },
  { ms: 2000, text: 'SEARCHING r/NBA2k ARCHIVES [MONTH=30d]...' },
  { ms: 2700, text: 'CROSS-REFERENCING BUILD SIGNATURES...' },
  { ms: 3400, text: 'RUNNING THREAT CLASSIFICATION ALGORITHM...' },
  { ms: 4000, text: 'COMPILING CLASSIFIED INTEL REPORT...' },
]

const XRAY_LOGS = [
  { ms: 0,    text: 'LOADING SEASON 7 META DATABASE...' },
  { ms: 600,  text: 'TRIANGULATING ATTRIBUTE SIGNATURES...' },
  { ms: 1200, text: 'RUNNING BEHAVIORAL PATTERN ANALYSIS...' },
  { ms: 1900, text: 'CROSS-MATCHING BADGE COMBINATIONS...' },
  { ms: 2500, text: 'COMPUTING KILL SHOT VECTOR...' },
]

const WEAKNESS_LOGS = [
  { ms: 0,    text: 'LOADING EXPLOIT DATABASE v2.6...' },
  { ms: 600,  text: 'PARSING BUILD PARAMETERS...' },
  { ms: 1200, text: 'SCANNING ATTRIBUTE COVERAGE GAPS...' },
  { ms: 1900, text: 'CROSS-REFERENCING META COUNTERS...' },
  { ms: 2600, text: 'CALCULATING KILL SEQUENCE...' },
  { ms: 3200, text: 'RENDERING EXPLOIT REPORT...' },
]

const META_LOGS = [
  { ms: 0,    text: 'CONNECTING TO COMMUNITY INTELLIGENCE FEEDS...' },
  { ms: 800,  text: 'SCRAPING TIER LIST SOURCES...' },
  { ms: 1600, text: 'ANALYZING BUILD FREQUENCY PATTERNS...' },
  { ms: 2400, text: 'CROSS-REFERENCING PATCH ACTIVITY...' },
  { ms: 3200, text: 'GENERATING META INTELLIGENCE REPORT...' },
  { ms: 3900, text: 'COMPILING ANALYST BRIEFING...' },
]

function TermLog({ logs }: { logs: typeof RECON_LOGS }) {
  const [shown, setShown] = useState<number[]>([])
  useEffect(() => {
    setShown([])
    const timers = logs.map(({ ms }, i) =>
      setTimeout(() => setShown(p => [...p, i]), ms)
    )
    return () => timers.forEach(clearTimeout)
  }, [logs])
  return (
    <div className="space-y-1.5 text-left font-mono text-[10px] sm:text-xs">
      {logs.map(({ text }, i) => (
        <AnimatePresence key={i}>
          {shown.includes(i) && (
            <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2">
              <span className="text-emerald-400/70 flex-shrink-0">{'>'}</span>
              <span className="text-white/50">{text}</span>
              {i === Math.max(...shown) && (
                <motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.6, repeat: Infinity }}
                  className="text-rose-400 font-black">█</motion.span>
              )}
              {i < Math.max(...shown) && <span className="text-emerald-400/60 ml-auto flex-shrink-0">OK</span>}
            </motion.div>
          )}
        </AnimatePresence>
      ))}
    </div>
  )
}

// ─── ACCESS GRANTED flash ─────────────────────────────────────────────────────

function AccessFlash({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div key="flash"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          style={{ background: 'rgba(0,255,100,0.025)' }}>
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: [0.85, 1.08, 1], opacity: [0, 1, 1, 0] }}
            transition={{ duration: 1.2, times: [0, 0.2, 0.7, 1] }}
            className="font-mono font-black tracking-[0.4em] uppercase select-none"
            style={{ fontSize: 'clamp(28px, 8vw, 64px)', color: '#34D399', textShadow: '0 0 40px rgba(52,211,153,0.6), 0 0 80px rgba(52,211,153,0.3)' }}>
            ACCESS GRANTED
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─── Signal meter ─────────────────────────────────────────────────────────────

function SigMeter({ pct, color, delay = 0 }: { pct: number; color: string; delay?: number }) {
  const bars = 12
  const filled = Math.round((pct / 100) * bars)
  return (
    <div className="flex gap-0.5 items-center">
      {Array.from({ length: bars }, (_, i) => (
        <motion.div key={i} className="w-1 rounded-sm"
          style={{ background: i < filled ? color : 'rgba(255,255,255,0.06)' }}
          initial={{ height: 4 }}
          animate={{ height: i < filled ? (4 + (i / bars) * 8) : 4 }}
          transition={{ delay: delay + i * 0.025, type: 'spring', stiffness: 400, damping: 20 }} />
      ))}
    </div>
  )
}

// ─── Kill Shot card ───────────────────────────────────────────────────────────

function KillShot({ text, active }: { text: string; active: boolean }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true); toast.success('Kill shot locked'); setTimeout(() => setCopied(false), 2000)
  }
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
      className="relative overflow-hidden rounded-xl"
      style={{ background: 'rgba(255,45,85,0.06)', border: '1px solid rgba(255,45,85,0.4)', boxShadow: '0 0 40px rgba(255,45,85,0.15), inset 0 0 40px rgba(255,45,85,0.03)' }}>
      <motion.div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, #FF2D55, transparent)' }}
        animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.8, repeat: Infinity }} />
      <div className="p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-3">
          <motion.div className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(255,45,85,0.2)', border: '1px solid rgba(255,45,85,0.4)' }}
            animate={{ boxShadow: ['0 0 0px rgba(255,45,85,0)', '0 0 10px rgba(255,45,85,0.5)', '0 0 0px rgba(255,45,85,0)'] }}
            transition={{ duration: 1.6, repeat: Infinity }}>
            <Target className="w-3.5 h-3.5" style={{ color: '#FF2D55' }} />
          </motion.div>
          <span className="font-mono text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: '#FF2D55' }}>KILL SHOT</span>
          <button onClick={copy} className="ml-auto font-mono text-[10px] text-white/30 hover:text-rose-400 transition-colors flex items-center gap-1">
            {copied ? <><Check className="w-3 h-3 text-emerald-400" /><span className="text-emerald-400">LOCKED</span></> : <><Copy className="w-3 h-3" />COPY</>}
          </button>
        </div>
        <ScrambleText text={text} active={active} className="text-white/90 text-sm leading-relaxed block" />
      </div>
    </motion.div>
  )
}

// ─── Terminal window chrome ───────────────────────────────────────────────────

function TermWindow({ title, badge, children }: { title: string; badge?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
      <div className="px-4 py-2 flex items-center gap-3" style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex gap-1.5">{['#FF5F57','#FEBC2E','#28C840'].map(c => <div key={c} className="w-2 h-2 rounded-full" style={{ background: c }} />)}</div>
        <p className="font-mono text-[10px] text-white/25 tracking-widest">{title}</p>
        {badge && <span className="ml-auto font-mono text-[9px] px-2 py-0.5 rounded" style={{ background: 'rgba(255,45,85,0.1)', border: '1px solid rgba(255,45,85,0.2)', color: '#FF2D55' }}>{badge}</span>}
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

// ─── Loading block ────────────────────────────────────────────────────────────

function LoadingBlock({ label, logs }: { label: string; logs: typeof RECON_LOGS }) {
  return (
    <motion.div key="loading" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      className="rounded-xl p-5 sm:p-6 relative overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <motion.div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(225,29,72,0.6), transparent)' }}
        animate={{ x: ['-100%', '100%'] }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} />
      <div className="flex items-start gap-5 sm:gap-6">
        <RadarScan />
        <div className="flex-1 min-w-0">
          <p className="font-mono text-[10px] text-white/30 uppercase tracking-widest mb-3">{label}</p>
          <TermLog logs={logs} />
        </div>
      </div>
    </motion.div>
  )
}

// ─── Recon result ─────────────────────────────────────────────────────────────

const PLATFORMS = ['Xbox', 'PSN', 'PC']

function ReconResult({ report, gamertag }: { report: ReconReport; gamertag: string }) {
  const [revealed, setRevealed] = useState(false)
  useEffect(() => { const t = setTimeout(() => setRevealed(true), 300); return () => clearTimeout(t) }, [])
  const cfg = THREAT_CFG[report.threat_level] || THREAT_CFG.Medium
  const attrs = report.estimated_build.likely_attributes
  const attrRows = [
    { k: '3-POINT',   v: attrs.three_point,       c: '#38BDF8' },
    { k: 'SPEED',     v: attrs.speed,              c: '#F59E0B' },
    { k: 'BALL HNDL', v: attrs.ball_handle,        c: '#8B5CF6' },
    { k: 'PERIM D',   v: attrs.perimeter_defense,  c: '#34D399' },
    { k: 'INT D',     v: attrs.interior_defense,   c: '#34D399' },
    { k: 'DUNK',      v: attrs.driving_dunk,       c: '#FF2D55' },
  ]

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="font-mono text-[9px] text-white/25 tracking-[0.3em] uppercase mb-2">
            TARGET: <span className="text-white/50">{gamertag.toUpperCase()}</span>
          </p>
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono font-black text-sm tracking-widest uppercase"
            style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color, boxShadow: cfg.glow }}>
            <AlertTriangle className="w-3.5 h-3.5" />
            <ScrambleText text={`THREAT: ${report.threat_level}`} active={revealed} />
          </motion.div>
        </div>
        <div className="text-right font-mono">
          <p className="text-[9px] text-white/20 uppercase tracking-wider mb-1">BUILD CONFIDENCE</p>
          <ScrambleText text={`${report.estimated_build.confidence}%`} active={revealed}
            className="text-3xl font-black"
            style={{ color: report.estimated_build.confidence > 60 ? '#34D399' : report.estimated_build.confidence > 35 ? '#FCD34D' : '#71717A' }} />
        </div>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}>
        <div className="px-4 py-2 flex items-center gap-3" style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex gap-1.5">{['#FF5F57','#FEBC2E','#28C840'].map(c => <div key={c} className="w-2 h-2 rounded-full" style={{ background: c }} />)}</div>
          <p className="font-mono text-[10px] text-white/30 tracking-widest uppercase">build_profile.intel</p>
          <span className="ml-auto font-mono text-[9px] px-2 py-0.5 rounded" style={{ background: 'rgba(255,45,85,0.1)', border: '1px solid rgba(255,45,85,0.2)', color: '#FF2D55' }}>CLASSIFIED</span>
        </div>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3 font-mono text-xs">
            <div>
              <p className="text-white/25 text-[9px] uppercase tracking-wider mb-0.5">ARCHETYPE</p>
              <ScrambleText text={report.estimated_build.archetype.toUpperCase()} active={revealed} className="text-white/80 font-semibold text-[11px]" />
            </div>
            <div>
              <p className="text-white/25 text-[9px] uppercase tracking-wider mb-0.5">HEIGHT RANGE</p>
              <ScrambleText text={report.estimated_build.height_range} active={revealed} className="text-white/80 font-semibold text-[11px]" />
            </div>
          </div>
          <div className="space-y-2.5">
            {attrRows.map(({ k, v, c }, i) => (
              <div key={k} className="flex items-center gap-3">
                <span className="font-mono text-[9px] text-white/30 uppercase tracking-wide w-16 flex-shrink-0">{k}</span>
                <SigMeter pct={((v - 25) / 74) * 100} color={c} delay={0.2 + i * 0.06} />
                <ScrambleText text={String(v)} active={revealed}
                  className="font-mono text-[11px] font-black w-7 text-right flex-shrink-0"
                  style={{ color: c }} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <KillShot text={report.kill_shot} active={revealed} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
        {[
          { title: 'KNOWN INTEL',   items: report.known_intel,        color: '#7DD3FC', icon: Eye },
          { title: 'THEIR THREATS', items: report.primary_threats,    color: '#FF2D55', icon: AlertTriangle },
          { title: 'EXPLOIT THESE', items: report.exploit_weaknesses, color: '#34D399', icon: Crosshair },
        ].map(({ title, items, color, icon: Icon }, gi) => (
          <motion.div key={title}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + gi * 0.1 }}
            className="rounded-xl p-3.5 space-y-2"
            style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${color}18` }}>
            <p className="font-mono text-[9px] font-bold uppercase tracking-[0.25em] flex items-center gap-1.5" style={{ color }}>
              <Icon className="w-2.5 h-2.5" />{title}
            </p>
            {items.map((item, i) => (
              <motion.p key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 + gi * 0.1 + i * 0.08 }}
                className="text-[11px] text-white/50 leading-snug font-mono flex gap-1.5">
                <span className="flex-shrink-0" style={{ color: `${color}60` }}>{'>'}</span>{item}
              </motion.p>
            ))}
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
        className="rounded-xl px-4 py-3.5" style={{ background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.18)', borderLeft: '2px solid rgba(139,92,246,0.5)' }}>
        <p className="font-mono text-[9px] font-black uppercase tracking-[0.25em] text-violet-400 mb-2">PRE-GAME MINDSET</p>
        <p className="text-white/50 text-xs leading-relaxed">{report.pre_game_mindset}</p>
      </motion.div>
    </div>
  )
}

// ─── X-Ray result ─────────────────────────────────────────────────────────────

function XRayResult({ profile }: { profile: XRayProfile }) {
  const [revealed, setRevealed] = useState(false)
  useEffect(() => { const t = setTimeout(() => setRevealed(true), 200); return () => clearTimeout(t) }, [])
  const confColor = profile.confidence_overall > 70 ? '#34D399' : profile.confidence_overall > 45 ? '#FCD34D' : '#FB923C'

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="font-mono">
          <p className="text-[9px] text-white/25 uppercase tracking-wider mb-1">BUILD DECODED</p>
          <ScrambleText text={profile.archetype.toUpperCase()} active={revealed} className="text-xl sm:text-2xl font-black text-white" />
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[9px] px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }}>
              {profile.position}
            </span>
            <span className="text-[9px] text-white/30 font-mono">{profile.height_estimate}</span>
          </div>
          <p className="text-[10px] text-white/35 mt-2 max-w-sm leading-snug">{profile.updated_profile}</p>
        </div>
        <div className="text-right font-mono flex-shrink-0">
          <p className="text-[9px] text-white/20 uppercase tracking-wider mb-1">ACCURACY</p>
          <ScrambleText text={`${profile.confidence_overall}%`} active={revealed}
            className="text-3xl font-black" style={{ color: confColor }} />
        </div>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}>
        <div className="px-4 py-2 flex items-center gap-3" style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex gap-1.5">{['#FF5F57','#FEBC2E','#28C840'].map(c => <div key={c} className="w-2 h-2 rounded-full" style={{ background: c }} />)}</div>
          <p className="font-mono text-[10px] text-white/30 tracking-widest uppercase">xray_decode.output</p>
        </div>
        <div className="p-4 space-y-3">
          {profile.deduced_attributes.map(({ stat, estimated_range, confidence, evidence }, i) => (
            <motion.div key={stat} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.07 }}>
              <div className="flex items-center gap-3 mb-1">
                <span className="font-mono text-[9px] text-white/30 uppercase tracking-wide w-16 flex-shrink-0">{stat}</span>
                <SigMeter pct={confidence} color={confidence > 70 ? '#34D399' : confidence > 45 ? '#FCD34D' : '#FB923C'} delay={0.15 + i * 0.06} />
                <ScrambleText text={estimated_range} active={revealed} className="font-mono text-[10px] font-bold text-white/60 flex-shrink-0 w-16 text-right" />
                <ScrambleText text={`${confidence}%`} active={revealed}
                  className="font-mono text-[9px] flex-shrink-0 w-8 text-right"
                  style={{ color: confidence > 70 ? '#34D399' : confidence > 45 ? '#FCD34D' : '#FB923C' }} />
              </div>
              <p className="font-mono text-[9px] text-white/20 pl-20 italic leading-snug">{evidence}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <KillShot text={profile.kill_shot} active={revealed} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
        {[
          { title: 'COUNTER MOVES', color: '#FF2D55', icon: Target,  items: profile.counter_moves.map((m, i) => `${i + 1}. ${m}`) },
          { title: 'LIKELY BADGES', color: '#A78BFA', icon: Shield,  items: profile.likely_badges },
          { title: 'TENDENCIES',    color: '#7DD3FC', icon: Eye,     items: profile.identified_tendencies },
        ].map(({ title, items, color, icon: Icon }, gi) => (
          <motion.div key={title}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + gi * 0.08 }}
            className="rounded-xl p-3.5 space-y-2"
            style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${color}18` }}>
            <p className="font-mono text-[9px] font-bold uppercase tracking-[0.25em] flex items-center gap-1.5" style={{ color }}>
              <Icon className="w-2.5 h-2.5" />{title}
            </p>
            {items.map((item, i) => (
              <motion.p key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 + i * 0.07 }}
                className="text-[11px] text-white/50 leading-snug font-mono flex gap-1.5">
                <span className="flex-shrink-0" style={{ color: `${color}60` }}>{'>'}</span>{item}
              </motion.p>
            ))}
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// ─── Weakness result ──────────────────────────────────────────────────────────

function WeaknessResult({ report }: { report: WeaknessReport }) {
  const [revealed, setRevealed] = useState(false)
  useEffect(() => { const t = setTimeout(() => setRevealed(true), 200); return () => clearTimeout(t) }, [])

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Header */}
      <div>
        <p className="font-mono text-[9px] text-white/25 tracking-[0.3em] uppercase mb-2">EXPLOIT REPORT GENERATED</p>
        <p className="text-white/60 text-sm leading-relaxed font-mono">{report.build_summary}</p>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="mt-2 text-[11px] font-mono italic px-3 py-2 rounded-lg"
          style={{ background: 'rgba(255,45,85,0.05)', border: '1px solid rgba(255,45,85,0.15)', color: '#FF5F6D' }}>
          &ldquo;{report.one_liner}&rdquo;
        </motion.p>
      </div>

      {/* Core weaknesses */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}>
        <div className="px-4 py-2 flex items-center gap-3" style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex gap-1.5">{['#FF5F57','#FEBC2E','#28C840'].map(c => <div key={c} className="w-2 h-2 rounded-full" style={{ background: c }} />)}</div>
          <p className="font-mono text-[10px] text-white/30 tracking-widest uppercase">core_weaknesses.scan</p>
          <span className="ml-auto font-mono text-[9px] px-2 py-0.5 rounded" style={{ background: 'rgba(255,45,85,0.1)', border: '1px solid rgba(255,45,85,0.2)', color: '#FF2D55' }}>{report.core_weaknesses.length} GAPS FOUND</span>
        </div>
        <div className="p-4 space-y-4">
          {report.core_weaknesses.map(({ area, description, severity }, i) => {
            const sevColor = severity >= 8 ? '#FF2D55' : severity >= 5 ? '#FB923C' : '#FCD34D'
            return (
              <motion.div key={area} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.08 }}>
                <div className="flex items-center gap-3 mb-1">
                  <span className="font-mono text-[9px] text-white/30 uppercase tracking-wide w-20 flex-shrink-0">{area}</span>
                  <SigMeter pct={(severity / 10) * 100} color={sevColor} delay={0.2 + i * 0.07} />
                  <ScrambleText text={`${severity}/10`} active={revealed}
                    className="font-mono text-[11px] font-black w-10 text-right flex-shrink-0"
                    style={{ color: sevColor }} />
                </div>
                <p className="font-mono text-[10px] text-white/35 pl-24 leading-snug">{description}</p>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Kill sequence */}
      <KillShot text={report.kill_sequence} active={revealed} />

      {/* Counters + badges + defensive scheme */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="rounded-xl p-3.5 space-y-2.5 sm:col-span-1"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,45,85,0.15)' }}>
          <p className="font-mono text-[9px] font-bold uppercase tracking-[0.25em] flex items-center gap-1.5 text-rose-400">
            <Crosshair className="w-2.5 h-2.5" />BEST COUNTERS
          </p>
          {report.best_counters.map(({ build_type, why, key_stats }, i) => (
            <div key={i} className="space-y-0.5">
              <p className="font-mono text-[10px] text-white/60 font-bold">{build_type}</p>
              <p className="font-mono text-[9px] text-white/35 leading-snug">{why}</p>
              <p className="font-mono text-[9px] text-emerald-400/60">{key_stats}</p>
            </div>
          ))}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          className="rounded-xl p-3.5 space-y-2"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(167,139,250,0.15)' }}>
          <p className="font-mono text-[9px] font-bold uppercase tracking-[0.25em] flex items-center gap-1.5 text-violet-400">
            <Shield className="w-2.5 h-2.5" />BADGE PUNISHMENTS
          </p>
          {report.badge_punishments.map((b, i) => (
            <p key={i} className="text-[11px] text-white/50 font-mono flex gap-1.5">
              <span className="text-violet-400/50">{'>'}</span>{b}
            </p>
          ))}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
          className="rounded-xl p-3.5 space-y-2"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(52,211,153,0.15)' }}>
          <p className="font-mono text-[9px] font-bold uppercase tracking-[0.25em] flex items-center gap-1.5 text-emerald-400">
            <Shield className="w-2.5 h-2.5" />DEFENSIVE SCHEME
          </p>
          <p className="text-[11px] text-white/50 font-mono leading-relaxed">{report.defensive_scheme}</p>
        </motion.div>
      </div>
    </div>
  )
}

// ─── Meta result ──────────────────────────────────────────────────────────────

function MetaResult({ report }: { report: MetaReport }) {
  const [revealed, setRevealed] = useState(false)
  useEffect(() => { const t = setTimeout(() => setRevealed(true), 200); return () => clearTimeout(t) }, [])

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Biggest threat banner */}
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
        className="relative overflow-hidden rounded-xl"
        style={{ background: 'rgba(255,45,85,0.06)', border: '1px solid rgba(255,45,85,0.35)', boxShadow: '0 0 32px rgba(255,45,85,0.12)' }}>
        <motion.div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, #FF2D55, transparent)' }}
          animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.8, repeat: Infinity }} />
        <div className="p-4">
          <p className="font-mono text-[9px] font-black uppercase tracking-[0.3em] text-rose-400 mb-1.5 flex items-center gap-1.5">
            <Zap className="w-2.5 h-2.5" />BIGGEST THREAT RIGHT NOW
          </p>
          <ScrambleText text={report.biggest_threat} active={revealed} className="text-white/85 text-sm font-bold block" />
        </div>
      </motion.div>

      {/* Tier S */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,45,85,0.2)', background: 'rgba(255,45,85,0.03)' }}>
        <div className="px-4 py-2 flex items-center gap-3" style={{ background: 'rgba(255,45,85,0.06)', borderBottom: '1px solid rgba(255,45,85,0.12)' }}>
          <div className="flex gap-1.5">{['#FF5F57','#FEBC2E','#28C840'].map(c => <div key={c} className="w-2 h-2 rounded-full" style={{ background: c }} />)}</div>
          <p className="font-mono text-[10px] text-rose-400/70 tracking-widest uppercase font-black">TIER S — ELITE THREAT</p>
        </div>
        <div className="p-4 space-y-3">
          {report.tier_s.map(({ name, why }, i) => (
            <motion.div key={name} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.1 }}
              className="flex items-start gap-3">
              <span className="font-mono text-[9px] font-black text-rose-400 mt-0.5 flex-shrink-0">S</span>
              <div>
                <ScrambleText text={name} active={revealed} className="text-[12px] font-black text-white/80 block" />
                <p className="font-mono text-[9px] text-white/35 mt-0.5 leading-snug">{why}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Tier A */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(251,146,60,0.18)', background: 'rgba(251,146,60,0.02)' }}>
        <div className="px-4 py-2" style={{ background: 'rgba(251,146,60,0.05)', borderBottom: '1px solid rgba(251,146,60,0.1)' }}>
          <p className="font-mono text-[10px] text-orange-400/70 tracking-widest uppercase font-black">TIER A — SOLID PICK</p>
        </div>
        <div className="p-4 space-y-2.5">
          {report.tier_a.map(({ name, why }, i) => (
            <motion.div key={name} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.08 }}
              className="flex items-start gap-3">
              <span className="font-mono text-[9px] font-black text-orange-400 mt-0.5 flex-shrink-0">A</span>
              <div>
                <p className="text-[11px] font-bold text-white/70 font-mono">{name}</p>
                <p className="font-mono text-[9px] text-white/30 leading-snug">{why}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Trending + Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="rounded-xl p-3.5 space-y-2"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(52,211,153,0.15)' }}>
          <p className="font-mono text-[9px] font-bold uppercase tracking-[0.25em] flex items-center gap-1.5 text-emerald-400">
            <TrendingUp className="w-2.5 h-2.5" />TRENDING UP
          </p>
          {report.trending_up.map((t, i) => (
            <p key={i} className="text-[11px] text-white/50 font-mono flex gap-1.5">
              <span className="text-emerald-400/50">↑</span>{t}
            </p>
          ))}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          className="rounded-xl p-3.5 space-y-2"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,45,85,0.12)' }}>
          <p className="font-mono text-[9px] font-bold uppercase tracking-[0.25em] flex items-center gap-1.5 text-rose-400/70">
            <TrendingDown className="w-2.5 h-2.5" />FADING OUT
          </p>
          {report.trending_down.map((t, i) => (
            <p key={i} className="text-[11px] text-white/50 font-mono flex gap-1.5">
              <span className="text-rose-400/40">↓</span>{t}
            </p>
          ))}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
          className="rounded-xl p-3.5 space-y-2"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(167,139,250,0.15)' }}>
          <p className="font-mono text-[9px] font-bold uppercase tracking-[0.25em] flex items-center gap-1.5 text-violet-400">
            <Shield className="w-2.5 h-2.5" />MOST ABUSED BADGES
          </p>
          {report.most_abused_badges.map((b, i) => (
            <p key={i} className="text-[11px] text-white/50 font-mono flex gap-1.5">
              <span className="text-violet-400/50">{'>'}</span>{b}
            </p>
          ))}
        </motion.div>
      </div>

      {/* Meta summary + analyst note */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
        className="rounded-xl px-4 py-3.5 space-y-2"
        style={{ background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.18)', borderLeft: '2px solid rgba(139,92,246,0.5)' }}>
        <p className="font-mono text-[9px] font-black uppercase tracking-[0.25em] text-violet-400">ANALYST NOTE</p>
        <p className="text-white/50 text-xs leading-relaxed">{report.current_meta_summary}</p>
        <p className="text-white/35 text-xs leading-relaxed italic">{report.analyst_note}</p>
      </motion.div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function VisionPage() {
  const [mode, setMode] = useState<Mode>('recon')

  // Recon
  const [gamertag, setGamertag] = useState('')
  const [platform, setPlatform] = useState('Xbox')
  const [reconLoading, setReconLoading] = useState(false)
  const [reconResult, setReconResult] = useState<ReconReport | null>(null)

  // X-Ray
  const [observations, setObservations] = useState<string[]>([])
  const [obsInput, setObsInput] = useState('')
  const [xrayLoading, setXrayLoading] = useState(false)
  const [xrayResult, setXrayResult] = useState<XRayProfile | null>(null)
  const [isListening, setIsListening] = useState(false)
  const [voiceSupported, setVoiceSupported] = useState(false)
  const recognitionRef = useRef<{ start: () => void; stop: () => void } | null>(null)

  // Weakness
  const [weaknessInput, setWeaknessInput] = useState('')
  const [weaknessLoading, setWeaknessLoading] = useState(false)
  const [weaknessResult, setWeaknessResult] = useState<WeaknessReport | null>(null)

  // Meta
  const [metaPlatform, setMetaPlatform] = useState('All')
  const [metaLoading, setMetaLoading] = useState(false)
  const [metaResult, setMetaResult] = useState<MetaReport | null>(null)

  // Shared
  const [accessFlash, setAccessFlash] = useState(false)
  const [sessionId] = useState(() => Math.random().toString(16).slice(2, 10).toUpperCase())
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const SR = (window as unknown as Record<string, unknown>).SpeechRecognition || (window as unknown as Record<string, unknown>).webkitSpeechRecognition
    setVoiceSupported(!!SR)
  }, [])

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 2200)
    return () => clearInterval(id)
  }, [])
  const latency = ((tick * 7 + 9) % 28) + 8

  const flash = () => { setAccessFlash(true); setTimeout(() => setAccessFlash(false), 1400) }

  const addObservation = useCallback((text: string) => {
    const t = text.trim(); if (!t) return
    setObservations(p => [...p, t]); setObsInput('')
  }, [])

  const startVoice = useCallback(() => {
    const SR = ((window as unknown as Record<string, unknown>).SpeechRecognition || (window as unknown as Record<string, unknown>).webkitSpeechRecognition) as (new () => {
      continuous: boolean; interimResults: boolean; lang: string
      onresult: ((e: { results: { [k: number]: { [k: number]: { transcript: string } } } }) => void) | null
      onerror: (() => void) | null; onend: (() => void) | null
      start(): void; stop(): void
    }) | undefined
    if (!SR) return
    const r = new SR()
    r.continuous = false; r.interimResults = false; r.lang = 'en-US'
    r.onresult = (e) => {
      const t = e.results[0][0].transcript
      addObservation(t)
      toast.success(`Signal: "${t}"`, { icon: '📡', style: { fontFamily: 'monospace', fontSize: '12px' } })
    }
    r.onerror = () => setIsListening(false)
    r.onend = () => setIsListening(false)
    recognitionRef.current = r; r.start(); setIsListening(true)
  }, [addObservation])

  const stopVoice = () => { recognitionRef.current?.stop(); setIsListening(false) }

  const runRecon = async () => {
    if (!gamertag.trim()) return toast.error('Enter a target gamertag')
    setReconLoading(true); setReconResult(null)
    try {
      const res = await fetch('/api/vision', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'recon', gamertag: gamertag.trim(), platform }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setReconResult(data.report); flash()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Recon failed')
    } finally { setReconLoading(false) }
  }

  const runXRay = async () => {
    if (!observations.length) return toast.error('Add at least one signal')
    setXrayLoading(true)
    try {
      const res = await fetch('/api/vision', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'xray', observations }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setXrayResult(data.profile); flash()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'X-Ray failed')
    } finally { setXrayLoading(false) }
  }

  const runWeakness = async () => {
    if (!weaknessInput.trim()) return toast.error('Describe the build first')
    setWeaknessLoading(true); setWeaknessResult(null)
    try {
      const res = await fetch('/api/vision', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'weakness', build_description: weaknessInput.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setWeaknessResult(data.report); flash()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Weakness scan failed')
    } finally { setWeaknessLoading(false) }
  }

  const runMeta = async () => {
    setMetaLoading(true); setMetaResult(null)
    try {
      const res = await fetch('/api/vision', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'meta', platform: metaPlatform }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMetaResult(data.report); flash()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Meta scan failed')
    } finally { setMetaLoading(false) }
  }

  const isLoading = reconLoading || xrayLoading || weaknessLoading || metaLoading

  return (
    <AppLayout>
      <div className="vision-scanline" />
      <AccessFlash show={accessFlash} />

      <div className="max-w-3xl mx-auto px-3 sm:px-6 pb-24 relative">

        {/* System status bar */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="sticky top-14 md:top-0 z-20 py-2 px-3 mb-5 font-mono text-[9px] flex items-center gap-3 overflow-hidden flex-wrap"
          style={{ background: 'rgba(8,8,10,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(225,29,72,0.12)' }}>
          <span className="flex items-center gap-1.5 flex-shrink-0">
            <motion.span className="w-1.5 h-1.5 rounded-full bg-emerald-400"
              animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.4, repeat: Infinity }} />
            <span className="text-emerald-400/70">VISION v2.6</span>
          </span>
          <span className="text-white/15">|</span>
          <span className="text-white/30">SESSION: <span className="text-white/50">{sessionId}</span></span>
          <span className="text-white/15">|</span>
          <span className="text-white/30">LATENCY: <span style={{ color: latency < 20 ? '#34D399' : '#FCD34D' }}>{latency}ms</span></span>
          <span className="text-white/15">|</span>
          <span className="text-white/30">ENC: <span className="text-white/50">AES-256</span></span>
          <span className="hidden sm:inline text-white/15">|</span>
          <Radio className="hidden sm:inline w-2.5 h-2.5 text-white/20" />
          <span className="hidden sm:inline text-white/20">SIGNAL ACTIVE</span>
          {isLoading && (
            <span className="ml-auto flex items-center gap-1.5 text-rose-400 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />PROCESSING
            </span>
          )}
        </motion.div>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="mb-5 sm:mb-6">
          <div className="flex items-center gap-3 mb-3">
            <motion.div className="w-10 h-10 rounded-xl flex items-center justify-center relative"
              style={{ background: 'rgba(225,29,72,0.08)', border: '1px solid rgba(225,29,72,0.3)' }}
              animate={{ boxShadow: ['0 0 0px rgba(225,29,72,0)', '0 0 20px rgba(225,29,72,0.4)', '0 0 0px rgba(225,29,72,0)'] }}
              transition={{ duration: 2.5, repeat: Infinity }}>
              <Eye className="w-5 h-5 text-rose-400" />
            </motion.div>
            <div>
              <p className="font-mono text-[10px] font-black tracking-[0.4em] uppercase" style={{ color: '#FF2D55' }}>2K VISION</p>
              <p className="font-mono text-[9px] text-white/25 tracking-wider">INTELLIGENCE SUITE · 4 TOOLS</p>
            </div>
          </div>
          <h1 className="display text-3xl sm:text-4xl text-white font-black mb-1.5">See Through Anyone.</h1>
          <p className="font-mono text-[11px] text-white/30">
            {'>'} Recon gamertags, decode builds live, exploit any archetype, track the meta.
          </p>
        </motion.div>

        {/* Mode selector — 2x2 grid */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
          className="grid grid-cols-2 gap-1.5 mb-5 p-1.5 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
          {MODES.map(({ key, label, sub, Icon }) => (
            <button key={key} onClick={() => setMode(key)}
              className="py-2.5 px-3 rounded-lg text-center transition-all relative overflow-hidden"
              style={{ background: mode === key ? 'rgba(225,29,72,0.1)' : 'transparent', border: `1px solid ${mode === key ? 'rgba(255,45,85,0.3)' : 'rgba(255,255,255,0.04)'}` }}>
              {mode === key && (
                <motion.div layoutId="mode-active" className="absolute inset-0 rounded-lg"
                  style={{ background: 'rgba(225,29,72,0.06)' }} />
              )}
              <Icon className={cn('w-3 h-3 mx-auto mb-1 relative z-10', mode === key ? 'text-rose-400' : 'text-white/25')} />
              <p className={cn('font-mono text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] relative z-10', mode === key ? 'text-rose-400' : 'text-white/30')}>{label}</p>
              <p className="font-mono text-[8px] text-white/20 mt-0.5 relative z-10">{sub}</p>
            </button>
          ))}
        </motion.div>

        <AnimatePresence mode="wait">

          {/* ── TARGET RECON ── */}
          {mode === 'recon' && (
            <motion.div key="recon"
              initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 24 }} transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="space-y-3 sm:space-y-4">

              <TermWindow title="target_scan.sh">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-emerald-400/70 text-sm flex-shrink-0">{'>'}</span>
                    <span className="text-white/30 text-xs flex-shrink-0">TARGET_ID:</span>
                    <input
                      className="flex-1 bg-transparent text-sm text-white outline-none font-mono placeholder:text-white/15"
                      placeholder={`ENTER_GAMERTAG${gamertag ? '' : '_'}`}
                      value={gamertag}
                      onChange={e => setGamertag(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && runRecon()}
                      style={{ caretColor: '#FF2D55' }}
                    />
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-emerald-400/70 text-sm flex-shrink-0">{'>'}</span>
                    <span className="text-white/30 text-xs flex-shrink-0">PLATFORM:</span>
                    <div className="flex gap-1.5 ml-2">
                      {PLATFORMS.map(p => (
                        <button key={p} onClick={() => setPlatform(p)}
                          className={cn('px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider transition-all', platform === p ? 'text-rose-400' : 'text-white/25 hover:text-white/50')}
                          style={{ background: platform === p ? 'rgba(255,45,85,0.12)' : 'transparent', border: `1px solid ${platform === p ? 'rgba(255,45,85,0.3)' : 'rgba(255,255,255,0.06)'}` }}>
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </TermWindow>

              <motion.button onClick={runRecon} disabled={reconLoading || !gamertag.trim()} whileTap={{ scale: 0.97 }}
                className="w-full py-3 rounded-xl font-mono font-black uppercase tracking-[0.2em] text-sm transition-all disabled:opacity-40"
                style={{ background: 'rgba(255,45,85,0.12)', border: '1px solid rgba(255,45,85,0.35)', color: '#FF2D55' }}>
                {reconLoading
                  ? <><span className="w-3.5 h-3.5 rounded-full border-2 border-rose-400 border-t-transparent animate-spin inline-block mr-2" />SCANNING...</>
                  : `> INITIATE RECON — ${gamertag.toUpperCase() || 'TARGET'}`}
              </motion.button>

              <AnimatePresence>
                {reconLoading && <LoadingBlock label={`SCANNING: ${gamertag.toUpperCase()}`} logs={RECON_LOGS} />}
              </AnimatePresence>
              <AnimatePresence>
                {!reconLoading && reconResult && (
                  <motion.div key="rr" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 280, damping: 26 }}>
                    <ReconResult report={reconResult} gamertag={gamertag} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ── LIVE X-RAY ── */}
          {mode === 'xray' && (
            <motion.div key="xray"
              initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }} transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="space-y-3 sm:space-y-4">

              <TermWindow title="signal_feed.live" badge={`${observations.length} SIG${observations.length !== 1 ? 'S' : ''}`}>
                <div className="space-y-3">
                  {observations.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="font-mono text-[10px] text-white/20 mb-1">NO SIGNALS CAPTURED</p>
                      <p className="font-mono text-[9px] text-white/12">Tap mic or type what you observe in-game</p>
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {observations.map((obs, i) => (
                        <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                          className="flex items-start gap-2.5 group font-mono">
                          <span className="text-[9px] font-black text-rose-400/50 uppercase mt-0.5 flex-shrink-0 w-12">SIG {String(i + 1).padStart(2, '0')}</span>
                          <p className="text-[11px] text-white/55 flex-1 leading-snug">{obs}</p>
                          <button onClick={() => setObservations(p => p.filter((_, j) => j !== i))}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-white/15 hover:text-rose-400 mt-0.5 flex-shrink-0">
                            <X className="w-3 h-3" />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2 pt-1" style={{ borderTop: observations.length ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                    {voiceSupported && (
                      <motion.button onClick={isListening ? stopVoice : startVoice} whileTap={{ scale: 0.9 }}
                        className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 relative transition-all', isListening ? 'text-white' : 'text-white/30 hover:text-white/60')}
                        style={{ background: isListening ? 'rgba(255,45,85,0.2)' : 'rgba(255,255,255,0.04)', border: `1px solid ${isListening ? 'rgba(255,45,85,0.4)' : 'rgba(255,255,255,0.08)'}` }}>
                        {isListening && (
                          <motion.div className="absolute inset-0 rounded-lg border-2 border-rose-400"
                            animate={{ scale: [1, 1.3, 1], opacity: [0.7, 0, 0.7] }}
                            transition={{ duration: 1, repeat: Infinity }} />
                        )}
                        {isListening ? <MicOff className="w-4 h-4 relative z-10" /> : <Mic className="w-4 h-4" />}
                      </motion.button>
                    )}
                    <div className="flex-1 flex items-center gap-2 rounded-lg px-3"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <span className="font-mono text-emerald-400/60 text-sm flex-shrink-0">{'>'}</span>
                      <input
                        className="flex-1 bg-transparent font-mono text-xs text-white/80 outline-none placeholder:text-white/15 py-2"
                        placeholder={isListening ? 'Listening...' : 'drove left... hit pull-up... super fast...'}
                        value={obsInput}
                        onChange={e => setObsInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addObservation(obsInput)}
                        style={{ caretColor: '#FF2D55' }}
                      />
                    </div>
                    <button onClick={() => addObservation(obsInput)} disabled={!obsInput.trim()}
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-white/30 hover:text-white/70 disabled:opacity-20 transition-all"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  {isListening && (
                    <p className="font-mono text-[9px] text-center text-rose-400 animate-pulse">SIGNAL CAPTURE ACTIVE — SPEAK NOW</p>
                  )}
                </div>
              </TermWindow>

              <motion.button onClick={runXRay} disabled={xrayLoading || observations.length === 0} whileTap={{ scale: 0.97 }}
                className="w-full py-3 rounded-xl font-mono font-black uppercase tracking-[0.2em] text-sm transition-all disabled:opacity-40"
                style={{ background: 'rgba(255,45,85,0.12)', border: '1px solid rgba(255,45,85,0.35)', color: '#FF2D55' }}>
                {xrayLoading
                  ? <><span className="w-3.5 h-3.5 rounded-full border-2 border-rose-400 border-t-transparent animate-spin inline-block mr-2" />DECODING BUILD...</>
                  : `> DECODE BUILD — ${observations.length} SIGNAL${observations.length !== 1 ? 'S' : ''} CAPTURED`}
              </motion.button>

              {observations.length > 0 && observations.length < 3 && !xrayResult && (
                <p className="font-mono text-center text-[9px] text-white/20 uppercase tracking-wider">
                  {3 - observations.length} more signal{3 - observations.length !== 1 ? 's' : ''} = higher accuracy
                </p>
              )}

              <AnimatePresence>
                {xrayLoading && <LoadingBlock label={`DECODING ${observations.length} SIGNALS`} logs={XRAY_LOGS} />}
              </AnimatePresence>
              <AnimatePresence>
                {!xrayLoading && xrayResult && (
                  <motion.div key="xr" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 280, damping: 26 }}>
                    <XRayResult profile={xrayResult} />
                    <p className="font-mono text-center text-[9px] text-white/20 uppercase tracking-wider mt-3">
                      Add more signals and re-decode to improve accuracy
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ── WEAKNESS SCAN ── */}
          {mode === 'weakness' && (
            <motion.div key="weakness"
              initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 24 }} transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="space-y-3 sm:space-y-4">

              <TermWindow title="exploit_scanner.sh">
                <div className="space-y-3">
                  <div className="flex items-start gap-2 font-mono">
                    <span className="text-emerald-400/70 text-sm flex-shrink-0 mt-1">{'>'}</span>
                    <div className="flex-1">
                      <p className="text-white/25 text-[9px] uppercase tracking-wider mb-1.5">BUILD_DESCRIPTION:</p>
                      <textarea
                        className="w-full bg-transparent text-sm text-white outline-none font-mono placeholder:text-white/15 resize-none leading-relaxed"
                        placeholder={`Describe the build — e.g. "6'6" SG slasher, drives left every time, hits step-backs, seems slow on defense, never shoots threes"`}
                        rows={4}
                        value={weaknessInput}
                        onChange={e => setWeaknessInput(e.target.value)}
                        style={{ caretColor: '#FF2D55' }}
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {['Pure Stretch Big', 'Playmaking Shot Creator', 'Slashing PG', 'Paint Beast C', 'Lock-Down SF'].map(preset => (
                      <button key={preset} onClick={() => setWeaknessInput(weaknessInput ? weaknessInput + ', ' + preset : preset)}
                        className="font-mono text-[9px] px-2.5 py-1 rounded text-white/30 hover:text-white/60 transition-colors"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                        + {preset}
                      </button>
                    ))}
                  </div>
                </div>
              </TermWindow>

              <motion.button onClick={runWeakness} disabled={weaknessLoading || !weaknessInput.trim()} whileTap={{ scale: 0.97 }}
                className="w-full py-3 rounded-xl font-mono font-black uppercase tracking-[0.2em] text-sm transition-all disabled:opacity-40"
                style={{ background: 'rgba(255,45,85,0.12)', border: '1px solid rgba(255,45,85,0.35)', color: '#FF2D55' }}>
                {weaknessLoading
                  ? <><span className="w-3.5 h-3.5 rounded-full border-2 border-rose-400 border-t-transparent animate-spin inline-block mr-2" />SCANNING WEAKNESSES...</>
                  : '> FIND EVERY WEAKNESS'}
              </motion.button>

              <AnimatePresence>
                {weaknessLoading && <LoadingBlock label="RUNNING EXPLOIT ANALYSIS" logs={WEAKNESS_LOGS} />}
              </AnimatePresence>
              <AnimatePresence>
                {!weaknessLoading && weaknessResult && (
                  <motion.div key="wr" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 280, damping: 26 }}>
                    <WeaknessResult report={weaknessResult} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ── META PULSE ── */}
          {mode === 'meta' && (
            <motion.div key="meta"
              initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }} transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="space-y-3 sm:space-y-4">

              <TermWindow title="meta_pulse.live">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-emerald-400/70 text-sm flex-shrink-0">{'>'}</span>
                    <span className="text-white/30 text-xs flex-shrink-0">FILTER_PLATFORM:</span>
                    <div className="flex gap-1.5 ml-2">
                      {['All', 'Xbox', 'PSN', 'PC'].map(p => (
                        <button key={p} onClick={() => setMetaPlatform(p)}
                          className={cn('px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider transition-all', metaPlatform === p ? 'text-rose-400' : 'text-white/25 hover:text-white/50')}
                          style={{ background: metaPlatform === p ? 'rgba(255,45,85,0.12)' : 'transparent', border: `1px solid ${metaPlatform === p ? 'rgba(255,45,85,0.3)' : 'rgba(255,255,255,0.06)'}` }}>
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                  <p className="font-mono text-[9px] text-white/20 pl-6 leading-relaxed">
                    {'>'} AI scans community data, tier lists, and patch notes to give you a live read on the current Season 7 meta.
                  </p>
                </div>
              </TermWindow>

              <motion.button onClick={runMeta} disabled={metaLoading} whileTap={{ scale: 0.97 }}
                className="w-full py-3 rounded-xl font-mono font-black uppercase tracking-[0.2em] text-sm transition-all disabled:opacity-40"
                style={{ background: 'rgba(255,45,85,0.12)', border: '1px solid rgba(255,45,85,0.35)', color: '#FF2D55' }}>
                {metaLoading
                  ? <><span className="w-3.5 h-3.5 rounded-full border-2 border-rose-400 border-t-transparent animate-spin inline-block mr-2" />SCANNING META...</>
                  : '> RUN META INTELLIGENCE SCAN'}
              </motion.button>

              <AnimatePresence>
                {metaLoading && <LoadingBlock label="SCANNING COMMUNITY META FEEDS" logs={META_LOGS} />}
              </AnimatePresence>
              <AnimatePresence>
                {!metaLoading && metaResult && (
                  <motion.div key="mr" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 280, damping: 26 }}>
                    <MetaResult report={metaResult} />
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
