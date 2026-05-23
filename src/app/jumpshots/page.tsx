'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Crosshair, PersonStanding, Sparkles, Loader2, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import { cn } from '@/lib/utils'

const POSITIONS = ['PG', 'SG', 'SF', 'PF', 'C']

/* ── Jumpshots ────────────────────────────────────────────────────── */
const JS_HEIGHT_RANGES = ["5'9\"–6'4\"", "6'5\"–6'9\"", "6'10\"+"]
const JS_THREE_RANGES = [
  { label: '75–80', min: 75, max: 80 },
  { label: '81–83', min: 81, max: 83 },
  { label: '84–86', min: 84, max: 86 },
  { label: '87–90', min: 87, max: 90 },
  { label: '91–92', min: 91, max: 92 },
]
const PLAYSTYLES = [
  { value: 'catch_shoot', label: 'Catch & Shoot' },
  { value: 'pull_up', label: 'Pull-Up / Off Dribble' },
  { value: 'mid_range', label: 'Mid-Range' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'post_fade', label: 'Post Fade' },
]

/* ── Dribble ──────────────────────────────────────────────────────── */
const DR_HEIGHT_RANGES = ["5'9\"–6'4\"", "6'5\"–6'9\"", "6'10\"+"]
const DR_BH_RANGES = [
  { label: '65+', min: 65 },
  { label: '70+', min: 70 },
  { label: '75+', min: 75 },
  { label: '80+', min: 80 },
  { label: '85+', min: 85 },
  { label: '90+', min: 90 },
]

interface JumpshotResult {
  base: string
  upper_release_1: string
  upper_release_2: string
  release_speed: string
  blending: string
  why: string
  alternatives: { name: string; reason: string }[]
  green_window_rating: string
  difficulty: string
  tips: string[]
  meta_rating: string
}

interface DribbleResult {
  primary_package: string
  size_up: string
  moving_crossover: string
  moving_behind_back: string
  moving_spin: string
  why: string
  tips: string[]
  alternatives: { name: string; reason: string }[]
  meta_rating: string
}

const META_COLORS: Record<string, string> = {
  S: 'text-amber-300', A: 'text-emerald-400', B: 'text-sky-400', C: 'text-orange-400'
}

function Chip({ active, onClick, children, color = 'rose' }: {
  active: boolean; onClick: () => void; children: React.ReactNode; color?: string
}) {
  const colorMap: Record<string, string> = {
    rose: 'text-rose-400 border-rose-500/40 bg-rose-500/15',
    violet: 'text-violet-400 border-violet-500/40 bg-violet-500/15',
    sky: 'text-sky-400 border-sky-500/40 bg-sky-500/15',
    amber: 'text-amber-400 border-amber-500/40 bg-amber-500/15',
    emerald: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/15',
  }
  return (
    <button
      onClick={onClick}
      className={cn('chip cursor-pointer transition-all text-xs', active ? colorMap[color] : 'hover:border-white/20')}
    >
      {children}
    </button>
  )
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }} className="rounded-lg p-2.5">
      <p className="text-[10px] text-white/35 mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-white">{value}</p>
    </div>
  )
}

function EmptyState({ icon: Icon, msg }: { icon: React.ElementType; msg: string }) {
  return (
    <div className="card p-8 flex flex-col items-center justify-center text-center h-full min-h-[300px]">
      <Icon className="w-12 h-12 text-white/10 mb-3" />
      <p className="text-white/30 text-sm">{msg}</p>
    </div>
  )
}

/* ── Jumpshot Tab ─────────────────────────────────────────────────── */
function JumpshotTab() {
  const [position, setPosition] = useState('PG')
  const [heightRange, setHeightRange] = useState("5'9\"–6'4\"")
  const [playstyle, setPlaystyle] = useState('balanced')
  const [threeRange, setThreeRange] = useState('84–86')
  const [result, setResult] = useState<JumpshotResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [showAlts, setShowAlts] = useState(false)

  const find = async () => {
    setLoading(true); setError(''); setResult(null)
    try {
      const res = await fetch('/api/jumpshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ position, heightRange, playstyle, threeRange }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed'); return }
      setResult(data)
    } finally { setLoading(false) }
  }

  const copy = () => {
    if (!result) return
    navigator.clipboard.writeText([
      '=== CourtIQ Jumpshot ===',
      `${position} | ${heightRange} | ${playstyle} | 3PT: ${threeRange}`,
      '',
      `BASE: ${result.base}`,
      `UPPER 1: ${result.upper_release_1}`,
      `UPPER 2: ${result.upper_release_2}`,
      `SPEED: ${result.release_speed}  BLEND: ${result.blending}`,
      '',
      result.why,
    ].join('\n'))
    setCopied(true); setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="card p-5 space-y-5">
        <h2 className="font-semibold text-white">Your Build Info</h2>

        <div>
          <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-2">Position</p>
          <div className="flex gap-1.5 flex-wrap">
            {POSITIONS.map(p => <Chip key={p} active={position === p} onClick={() => setPosition(p)} color="rose">{p}</Chip>)}
          </div>
        </div>

        <div>
          <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-2">Height Range</p>
          <div className="flex gap-1.5 flex-wrap">
            {JS_HEIGHT_RANGES.map(h => <Chip key={h} active={heightRange === h} onClick={() => setHeightRange(h)} color="violet">{h}</Chip>)}
          </div>
        </div>

        <div>
          <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-2">Three-Point Rating</p>
          <div className="flex gap-1.5 flex-wrap">
            {JS_THREE_RANGES.map(r => <Chip key={r.label} active={threeRange === r.label} onClick={() => setThreeRange(r.label)} color="amber">{r.label}</Chip>)}
          </div>
        </div>

        <div>
          <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-2">Play Style</p>
          <div className="flex gap-1.5 flex-wrap">
            {PLAYSTYLES.map(p => <Chip key={p.value} active={playstyle === p.value} onClick={() => setPlaystyle(p.value)} color="sky">{p.label}</Chip>)}
          </div>
        </div>

        {error && <p className="text-sm text-rose-400">{error}</p>}

        <button onClick={find} disabled={loading} className="btn btn-primary w-full gap-2">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Scanning meta...</> : <><Sparkles className="w-4 h-4" />Find Best Jumpshot</>}
        </button>
        <p className="text-[10px] text-white/20 text-center">Season 7 meta · CourtIQ v1</p>
      </div>

      <AnimatePresence mode="wait">
        {!result && !loading && (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <EmptyState icon={Crosshair} msg="Select your build settings and hit Find to get your personalized jumpshot." />
          </motion.div>
        )}
        {loading && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="card p-8 flex flex-col items-center justify-center text-center min-h-[300px]">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}>
              <Crosshair className="w-10 h-10 text-rose-400" />
            </motion.div>
            <p className="text-white/30 mt-3 text-sm">Scanning Season 7 meta...</p>
          </motion.div>
        )}
        {result && !loading && (
          <motion.div key="result" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="space-y-3">
            <div className="card p-5" style={{ border: '1px solid rgba(225,29,72,0.15)' }}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-[10px] font-semibold text-rose-400 uppercase tracking-widest mb-1">Recommended Base</p>
                  <p className="text-2xl font-bold text-white">{result.base}</p>
                </div>
                <span className={cn('text-3xl font-black', META_COLORS[result.meta_rating?.[0]] || 'text-white/40')}>{result.meta_rating}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-4">
                <StatBox label="Base" value={result.base} />
                <StatBox label="Upper Release 1" value={result.upper_release_1} />
                <StatBox label="Upper Release 2" value={result.upper_release_2} />
                <StatBox label="Release Speed" value={result.release_speed} />
                <StatBox label="Blending" value={result.blending} />
                <StatBox label="Green Window" value={result.green_window_rating} />
              </div>

              <p className="text-sm text-white/40 italic border-l-2 border-rose-500/30 pl-3 mb-3">{result.why}</p>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">Difficulty:</span>
                <span className="chip text-xs">{result.difficulty}</span>
              </div>
            </div>

            <div className="card p-4">
              <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-3">Timing Tips</p>
              <ul className="space-y-2">
                {result.tips?.map((tip, i) => (
                  <li key={i} className="text-xs text-white/40 flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-rose-500/15 border border-rose-500/25 text-rose-400 text-[9px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            {result.alternatives?.length > 0 && (
              <div className="card overflow-hidden">
                <button onClick={() => setShowAlts(!showAlts)}
                  className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors">
                  <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">Alternatives</p>
                  {showAlts ? <ChevronUp className="w-4 h-4 text-white/25" /> : <ChevronDown className="w-4 h-4 text-white/25" />}
                </button>
                <AnimatePresence>
                  {showAlts && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} className="overflow-hidden px-4 pb-4 space-y-2">
                      {result.alternatives.map((alt, i) => (
                        <div key={i} className="flex items-start gap-2 py-2 border-b border-white/[0.04] last:border-0">
                          <span className="text-xs font-semibold text-white w-28 flex-shrink-0">{alt.name}</span>
                          <span className="text-xs text-white/35">{alt.reason}</span>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            <button onClick={copy} className="btn btn-secondary w-full gap-1.5">
              {copied ? <><Check className="w-4 h-4 text-emerald-400" />Copied!</> : <><Copy className="w-4 h-4" />Copy Jumpshot</>}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ── Dribble Tab ──────────────────────────────────────────────────── */
function DribbleTab() {
  const [position, setPosition] = useState('PG')
  const [heightRange, setHeightRange] = useState("5'9\"–6'4\"")
  const [bhRange, setBhRange] = useState('80+')
  const [result, setResult] = useState<DribbleResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [showAlts, setShowAlts] = useState(false)

  const find = async () => {
    setLoading(true); setError(''); setResult(null)
    try {
      const res = await fetch('/api/dribble', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ position, heightRange, ballHandleRange: bhRange }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed'); return }
      setResult(data)
    } finally { setLoading(false) }
  }

  const copy = () => {
    if (!result) return
    navigator.clipboard.writeText([
      '=== CourtIQ Dribble Package ===',
      `${position} | ${heightRange} | Ball Handle: ${bhRange}`,
      '',
      `PRIMARY: ${result.primary_package}`,
      `SIZE UP: ${result.size_up}`,
      `MOVING CROSS: ${result.moving_crossover}`,
      `BEHIND BACK: ${result.moving_behind_back}`,
      `SPIN: ${result.moving_spin}`,
      '',
      result.why,
    ].join('\n'))
    setCopied(true); setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="card p-5 space-y-5">
        <h2 className="font-semibold text-white">Your Build Info</h2>

        <div>
          <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-2">Position</p>
          <div className="flex gap-1.5 flex-wrap">
            {POSITIONS.map(p => <Chip key={p} active={position === p} onClick={() => setPosition(p)} color="rose">{p}</Chip>)}
          </div>
        </div>

        <div>
          <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-2">Height Range</p>
          <div className="flex gap-1.5 flex-wrap">
            {DR_HEIGHT_RANGES.map(h => <Chip key={h} active={heightRange === h} onClick={() => setHeightRange(h)} color="violet">{h}</Chip>)}
          </div>
        </div>

        <div>
          <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-2">Ball Handle</p>
          <div className="flex gap-1.5 flex-wrap">
            {DR_BH_RANGES.map(r => <Chip key={r.label} active={bhRange === r.label} onClick={() => setBhRange(r.label)} color="emerald">{r.label}</Chip>)}
          </div>
        </div>

        {error && <p className="text-sm text-rose-400">{error}</p>}

        <button onClick={find} disabled={loading} className="btn btn-primary w-full gap-2">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Scanning meta...</> : <><Sparkles className="w-4 h-4" />Find Best Dribble Package</>}
        </button>
        <p className="text-[10px] text-white/20 text-center">Season 7 meta · CourtIQ v1</p>
      </div>

      <AnimatePresence mode="wait">
        {!result && !loading && (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <EmptyState icon={PersonStanding} msg="Select your build info and hit Find to get your ideal dribble package." />
          </motion.div>
        )}
        {loading && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="card p-8 flex flex-col items-center justify-center text-center min-h-[300px]">
            <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 0.8 }}>
              <PersonStanding className="w-10 h-10 text-emerald-400" />
            </motion.div>
            <p className="text-white/30 mt-3 text-sm">Scanning Season 7 meta...</p>
          </motion.div>
        )}
        {result && !loading && (
          <motion.div key="result" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="space-y-3">
            <div className="card p-5" style={{ border: '1px solid rgba(16,185,129,0.15)' }}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-[10px] font-semibold text-emerald-400 uppercase tracking-widest mb-1">Recommended Package</p>
                  <p className="text-2xl font-bold text-white">{result.primary_package}</p>
                </div>
                <span className={cn('text-3xl font-black', META_COLORS[result.meta_rating?.[0]] || 'text-white/40')}>{result.meta_rating}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-4">
                <StatBox label="Dribble Style" value={result.primary_package} />
                <StatBox label="Size Up" value={result.size_up} />
                <StatBox label="Moving Crossover" value={result.moving_crossover} />
                <StatBox label="Behind the Back" value={result.moving_behind_back} />
                <StatBox label="Moving Spin" value={result.moving_spin} />
              </div>

              <p className="text-sm text-white/40 italic border-l-2 border-emerald-500/30 pl-3">{result.why}</p>
            </div>

            {result.tips?.length > 0 && (
              <div className="card p-4">
                <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-3">Dribbling Tips</p>
                <ul className="space-y-2">
                  {result.tips.map((tip, i) => (
                    <li key={i} className="text-xs text-white/40 flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-[9px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.alternatives?.length > 0 && (
              <div className="card overflow-hidden">
                <button onClick={() => setShowAlts(!showAlts)}
                  className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors">
                  <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">Alternatives</p>
                  {showAlts ? <ChevronUp className="w-4 h-4 text-white/25" /> : <ChevronDown className="w-4 h-4 text-white/25" />}
                </button>
                <AnimatePresence>
                  {showAlts && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} className="overflow-hidden px-4 pb-4 space-y-2">
                      {result.alternatives.map((alt, i) => (
                        <div key={i} className="flex items-start gap-2 py-2 border-b border-white/[0.04] last:border-0">
                          <span className="text-xs font-semibold text-white w-28 flex-shrink-0">{alt.name}</span>
                          <span className="text-xs text-white/35">{alt.reason}</span>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            <button onClick={copy} className="btn btn-secondary w-full gap-1.5">
              {copied ? <><Check className="w-4 h-4 text-emerald-400" />Copied!</> : <><Copy className="w-4 h-4" />Copy Package</>}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ── Page ─────────────────────────────────────────────────────────── */
export default function JumpshotsPage() {
  const [tab, setTab] = useState<'jumpshot' | 'dribble'>('jumpshot')

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 pb-16">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <Crosshair className="w-5 h-5 text-rose-400" />
            <span className="text-[10px] font-semibold text-rose-400 uppercase tracking-widest">Animations</span>
          </div>
          <h1 className="text-[28px] md:text-[34px] font-black text-white leading-[1.05] tracking-tight">Jumpshots & Dribble Styles</h1>
          <p className="text-white/35 mt-1 text-sm">Season 7 meta recommendations based on your exact height and attributes.</p>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 p-1 rounded-xl w-fit"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          {([
            { id: 'jumpshot', label: 'Jumpshot Finder', icon: Crosshair, color: '#E11D48' },
            { id: 'dribble',  label: 'Dribble Styles',  icon: PersonStanding, color: '#10B981' },
          ] as const).map(({ id, label, icon: Icon, color }) => (
            <button key={id} onClick={() => setTab(id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                tab === id ? 'text-white' : 'text-white/35 hover:text-white/60'
              )}
              style={tab === id ? { background: `${color}18`, border: `1px solid ${color}28`, color } : {}}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {tab === 'jumpshot' ? (
            <motion.div key="jumpshot" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <JumpshotTab />
            </motion.div>
          ) : (
            <motion.div key="dribble" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <DribbleTab />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  )
}
