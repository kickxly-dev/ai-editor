'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Crosshair, Sparkles, Loader2, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import { cn } from '@/lib/utils'

const POSITIONS = ['PG', 'SG', 'SF', 'PF', 'C']
const HEIGHT_RANGES = [
  "5'7\"–5'9\"", "5'10\"–6'0\"", "6'1\"–6'3\"", "6'4\"–6'5\"",
  "6'6\"–6'8\"", "6'9\"–6'11\"", "7'0\"–7'3\""
]
const PLAYSTYLES = [
  { value: 'catch_shoot', label: 'Catch & Shoot' },
  { value: 'pull_up', label: 'Pull-Up / Off Dribble' },
  { value: 'mid_range', label: 'Mid-Range' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'post_fade', label: 'Post Fade' },
]
const THREE_RANGES = [
  { label: '60–74', min: 60, max: 74 },
  { label: '75–84', min: 75, max: 84 },
  { label: '85–92', min: 85, max: 92 },
  { label: '93+', min: 93, max: 99 },
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

export default function JumpshotsPage() {
  const [position, setPosition] = useState('PG')
  const [heightRange, setHeightRange] = useState("6'1\"–6'3\"")
  const [playstyle, setPlaystyle] = useState('balanced')
  const [threeRange, setThreeRange] = useState('75–84')
  const [result, setResult] = useState<JumpshotResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [showAlts, setShowAlts] = useState(false)

  const find = async () => {
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await fetch('/api/jumpshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ position, heightRange, playstyle, threeRange }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to find jumpshot')
        return
      }
      setResult(data)
    } finally {
      setLoading(false)
    }
  }

  const copyResult = () => {
    if (!result) return
    const text = [
      `=== CourtIQ Jumpshot Recommendation ===`,
      `Position: ${position} | Height: ${heightRange} | Style: ${playstyle}`,
      ``,
      `BASE: ${result.base}`,
      `UPPER 1: ${result.upper_release_1}`,
      `UPPER 2: ${result.upper_release_2}`,
      `SPEED: ${result.release_speed}`,
      `BLENDING: ${result.blending}`,
      ``,
      `WHY: ${result.why}`,
      ``,
      `META RATING: ${result.meta_rating}`,
      `GREEN WINDOW: ${result.green_window_rating}`,
      `DIFFICULTY: ${result.difficulty}`,
      ``,
      `TIPS:`,
      ...result.tips.map((t) => `• ${t}`),
      ``,
      `courtiq.gg — Season 5 Jumpshot Finder`,
    ].join('\n')
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const metaColors: Record<string, string> = {
    S: 'text-amber-300', A: 'text-emerald-400', B: 'text-sky-400', C: 'text-orange-400'
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 pb-16">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <Crosshair className="w-5 h-5 text-rose-400" />
            <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">Jumpshot Finder</span>
          </div>
          <h1 className="text-3xl font-bold text-fg">Best Jumpshot for Your Build</h1>
          <p className="text-fg-muted mt-1">Get the #1 recommended jumpshot base, releases, and settings for your exact build in Season 5.</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <div className="card p-5 space-y-5">
              <h2 className="font-semibold text-fg">Your Build Info</h2>

              <div>
                <label className="block text-xs font-semibold text-fg-muted mb-2 uppercase tracking-wider">Position</label>
                <div className="flex gap-1.5 flex-wrap">
                  {POSITIONS.map((p) => (
                    <button
                      key={p}
                      onClick={() => setPosition(p)}
                      className={cn(
                        'chip cursor-pointer transition-all',
                        position === p ? 'text-rose-400 border-rose-500/40 bg-rose-500/15' : 'hover:border-white/20'
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-fg-muted mb-2 uppercase tracking-wider">Height Range</label>
                <div className="flex gap-1.5 flex-wrap">
                  {HEIGHT_RANGES.map((h) => (
                    <button
                      key={h}
                      onClick={() => setHeightRange(h)}
                      className={cn(
                        'chip cursor-pointer transition-all text-xs',
                        heightRange === h ? 'text-violet-400 border-violet-500/40 bg-violet-500/15' : 'hover:border-white/20'
                      )}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-fg-muted mb-2 uppercase tracking-wider">Play Style</label>
                <div className="flex gap-1.5 flex-wrap">
                  {PLAYSTYLES.map((p) => (
                    <button
                      key={p.value}
                      onClick={() => setPlaystyle(p.value)}
                      className={cn(
                        'chip cursor-pointer transition-all text-xs',
                        playstyle === p.value ? 'text-sky-400 border-sky-500/40 bg-sky-500/15' : 'hover:border-white/20'
                      )}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-fg-muted mb-2 uppercase tracking-wider">Three-Point Rating</label>
                <div className="flex gap-1.5 flex-wrap">
                  {THREE_RANGES.map((r) => (
                    <button
                      key={r.label}
                      onClick={() => setThreeRange(r.label)}
                      className={cn(
                        'chip cursor-pointer transition-all text-xs',
                        threeRange === r.label ? 'text-yellow-400 border-yellow-500/40 bg-yellow-500/15' : 'hover:border-white/20'
                      )}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {error && <p className="text-sm text-rose-400">{error}</p>}

              <button onClick={find} disabled={loading} className="btn btn-primary w-full gap-2">
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing meta...</>
                  : <><Sparkles className="w-4 h-4" /> Find Best Jumpshot</>
                }
              </button>

              <p className="text-xs text-fg-subtle text-center">
                Uses Season 5 meta data + Groq AI — only recommends 2K26 jumpshots
              </p>
            </div>
          </motion.div>

          {/* Result */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <AnimatePresence mode="wait">
              {!result && !loading && (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="card p-8 flex flex-col items-center justify-center text-center h-full min-h-[300px]">
                  <Crosshair className="w-12 h-12 text-fg-subtle/40 mb-3" />
                  <p className="text-fg-muted">Select your build settings and hit Find to get your personalized jumpshot recommendation.</p>
                </motion.div>
              )}

              {loading && (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="card p-8 flex flex-col items-center justify-center text-center h-full min-h-[300px]">
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}>
                    <Crosshair className="w-10 h-10 text-rose-400 mb-3" />
                  </motion.div>
                  <p className="text-fg-muted mt-3">Searching Season 5 meta...</p>
                </motion.div>
              )}

              {result && !loading && (
                <motion.div key="result" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                  className="space-y-3">

                  {/* Main recommendation */}
                  <div className="card p-5 card-glow">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="text-xs font-semibold text-rose-400 uppercase tracking-wider mb-1">Recommended Jumpshot</p>
                        <p className="text-2xl font-bold text-fg">{result.base}</p>
                      </div>
                      <span className={cn('text-3xl font-black', metaColors[result.meta_rating[0]] || 'text-fg-muted')}>
                        {result.meta_rating}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {[
                        { label: 'Base', val: result.base },
                        { label: 'Upper Release 1', val: result.upper_release_1 },
                        { label: 'Upper Release 2', val: result.upper_release_2 },
                        { label: 'Release Speed', val: result.release_speed },
                        { label: 'Blending', val: result.blending },
                        { label: 'Green Window', val: result.green_window_rating },
                      ].map(({ label, val }) => (
                        <div key={label} className="bg-white/[0.03] rounded-lg p-2.5">
                          <p className="text-xs text-fg-subtle mb-0.5">{label}</p>
                          <p className="text-sm font-semibold text-fg">{val}</p>
                        </div>
                      ))}
                    </div>

                    <p className="text-sm text-fg-muted italic border-l-2 border-rose-500/30 pl-3 mb-4">
                      {result.why}
                    </p>

                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-xs font-semibold text-fg-muted uppercase tracking-wider">Difficulty:</span>
                      <span className="chip text-xs">{result.difficulty}</span>
                    </div>
                  </div>

                  {/* Tips */}
                  <div className="card p-4">
                    <p className="text-xs font-semibold text-fg-muted uppercase tracking-wider mb-3">Timing Tips</p>
                    <ul className="space-y-2">
                      {result.tips.map((tip, i) => (
                        <li key={i} className="text-xs text-fg-muted flex items-start gap-2">
                          <span className="w-4 h-4 rounded-full bg-rose-500/15 border border-rose-500/25 text-rose-400 text-[9px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Alternatives */}
                  {result.alternatives?.length > 0 && (
                    <div className="card overflow-hidden">
                      <button
                        onClick={() => setShowAlts(!showAlts)}
                        className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
                      >
                        <p className="text-xs font-semibold text-fg-muted uppercase tracking-wider">Alternative Jumpshots</p>
                        {showAlts ? <ChevronUp className="w-4 h-4 text-fg-subtle" /> : <ChevronDown className="w-4 h-4 text-fg-subtle" />}
                      </button>
                      <AnimatePresence>
                        {showAlts && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden px-4 pb-4 space-y-2"
                          >
                            {result.alternatives.map((alt, i) => (
                              <div key={i} className="flex items-start gap-2 py-2 border-b border-white/[0.04] last:border-0">
                                <span className="text-xs font-semibold text-fg w-28 flex-shrink-0">{alt.name}</span>
                                <span className="text-xs text-fg-muted">{alt.reason}</span>
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  <button onClick={copyResult} className="btn btn-secondary w-full gap-1.5">
                    {copied ? <><Check className="w-4 h-4 text-emerald-400" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy Recommendation</>}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </AppLayout>
  )
}
