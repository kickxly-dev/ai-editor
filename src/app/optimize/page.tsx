'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Wand2, Brain, CheckCircle2, AlertTriangle, Copy, Check,
  ChevronDown, ChevronUp, Sparkles, BookmarkPlus, Bookmark, Loader2,
} from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import { cn } from '@/lib/utils'
import { OptimizedBuild } from '@/lib/groq'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'

const POSITIONS_OPTS = ['All', 'PG', 'SG', 'SF', 'PF', 'C']
const HEIGHT_RANGES = ['Any', 'Under 6\'5"', '6\'5"–6\'9"', '6\'10"+']
const GAME_MODES = ['Any', 'Park', 'Rec', 'Pro-Am']

const ATTR_GROUPS = [
  { key: 'Finishing',   color: '#E11D48', keys: ['close_shot','driving_layup','driving_dunk','standing_dunk','post_control'] },
  { key: 'Shooting',    color: '#38BDF8', keys: ['mid_range','three_point','free_throw'] },
  { key: 'Playmaking',  color: '#8B5CF6', keys: ['pass_accuracy','ball_handle','speed_with_ball'] },
  { key: 'Defense',     color: '#10B981', keys: ['interior_defense','perimeter_defense','steal','block','offensive_rebound','defensive_rebound'] },
  { key: 'Athleticism', color: '#F59E0B', keys: ['speed','agility','strength','vertical'] },
]

const TIER_CLASS: Record<string, string> = {
  S: 'tier-s', A: 'tier-a', B: 'tier-b', C: 'tier-c', D: 'tier-d',
}

function StatBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="stat-bar flex-1">
      <motion.div
        className="stat-bar-fill"
        style={{ background: color }}
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  )
}

function ScoreRing({ value, color }: { value: number; color: string }) {
  const r = 32, c = 2 * Math.PI * r
  const dash = (value / 100) * c
  return (
    <div className="relative w-20 h-20">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={r} fill="none" stroke="#27272A" strokeWidth="6" />
        <motion.circle
          cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="6"
          strokeLinecap="round" strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - dash }}
          transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="mono font-bold text-lg text-fg">{value}</span>
      </div>
    </div>
  )
}

function PillGroup({
  label, options, value, onChange,
}: { label: string; options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-fg-muted text-xs font-semibold uppercase tracking-wider w-20 flex-shrink-0">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {options.map(opt => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={cn(
              'chip cursor-pointer transition-all',
              value === opt
                ? 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                : 'chip-muted hover:border-rose-500/30 hover:text-fg'
            )}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function OptimizePage() {
  const [description, setDescription] = useState('')
  const [position, setPosition] = useState('All')
  const [heightRange, setHeightRange] = useState('Any')
  const [gameMode, setGameMode] = useState('Any')
  const [loading, setLoading] = useState(false)
  const [build, setBuild] = useState<OptimizedBuild | null>(null)
  const [expandedGroups, setExpandedGroups] = useState(['Finishing', 'Shooting'])
  const [copied, setCopied] = useState(false)
  const [capBreakers, setCapBreakers] = useState(0)
  const [saving, setSaving] = useState(false)
  const [savedId, setSavedId] = useState<number | null>(null)
  const { data: session } = useSession()

  const toggleGroup = (key: string) =>
    setExpandedGroups(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    )

  const saveOptimizedBuild = async () => {
    if (!session?.user) { toast.error('Sign in to save builds'); return }
    if (!build) return
    setSaving(true)
    try {
      const res = await fetch('/api/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: build.name,
          position: build.position,
          height: build.height,
          wingspan: build.wingspan,
          weight: build.weight,
          takeover: build.takeover,
          category: gameMode !== 'Any' ? gameMode : 'Park',
          attributes: build.attributes,
          badges: build.badges,
          isPublic: false,
          analysis: {
            archetype: build.archetype,
            strengths: build.strengths,
            weaknesses: build.weaknesses,
            overall_rating: build.overall_rating,
            meta_viability: build.meta_viability,
            playstyle_summary: build.playstyle_summary,
            takeover_recommendation: build.takeover,
          },
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSavedId(data.id)
      toast.success('Build saved to your profile!')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const generate = async () => {
    if (!description.trim()) return toast.error('Describe your player first')
    setLoading(true)
    setBuild(null)
    try {
      const res = await fetch('/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, position, heightRange, gameMode, capBreakers }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to generate build')
      setBuild(data.build)
      toast.success('Build generated!')
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Generation failed')
    } finally {
      setLoading(false)
    }
  }

  const copyBuild = () => {
    if (!build) return
    const summary = [
      `=== ${build.name} ===`,
      `${build.position} | ${build.height} | ${build.weight} lbs | Wingspan: ${build.wingspan}`,
      `Archetype: ${build.archetype}`,
      `Takeover: ${build.takeover}`,
      `Overall: ${build.overall_rating} | Meta: ${build.meta_viability}-Tier`,
      '',
      build.playstyle_summary,
      '',
      'WHY THIS BUILD:',
      build.why_this_build,
      '',
      'STRENGTHS:',
      ...build.strengths.map(s => `• ${s}`),
      '',
      'WEAKNESSES:',
      ...build.weaknesses.map(w => `• ${w}`),
      '',
      'TOP BADGES:',
      ...build.badges.slice(0, 5).map(b => `• ${b.name} (${b.level}) - ${b.category}`),
      '',
      'ANIMATIONS:',
      ...build.animations.map(a => `• ${a.type}: ${a.pick}`),
      '',
      `Best for: ${build.best_game_modes.join(', ')}`,
      '',
      'Generated by CourtIQ — courtiq.gg',
    ].join('\n')
    navigator.clipboard.writeText(summary)
    setCopied(true)
    toast.success('Build copied to clipboard!')
    setTimeout(() => setCopied(false), 2500)
  }

  const badgeLevelClass = (level: string) => {
    if (level === 'Hall of Fame') return 'badge-hof'
    if (level === 'Gold') return 'badge-gold'
    if (level === 'Silver') return 'badge-silver'
    return 'badge-bronze'
  }

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 pb-16">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
              <Wand2 className="w-5 h-5 text-rose-400" />
            </div>
            <span className="text-rose-400 text-xs font-semibold tracking-widest uppercase">Build Optimizer</span>
          </div>
          <h1 className="display text-4xl text-fg mb-1">Describe Your Player</h1>
          <p className="text-fg-muted text-sm">Describe your playstyle in plain English. The AI builds the exact attributes, badges, and animations to match — no guesswork.</p>
        </motion.div>

        {/* Input Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="card p-6 mb-6"
        >
          <textarea
            className="input min-h-[112px] resize-none leading-relaxed mb-3"
            placeholder={`Describe your ideal player... e.g. "A 6'4" slashing guard that can lock up at the park, hit open threes, and break ankles with handles"`}
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={4}
          />

          {/* Quick-start example prompts */}
          {!description.trim() && (
            <div className="mb-5">
              <p className="text-[10px] text-fg-subtle uppercase tracking-wider font-semibold mb-2">Example prompts — click to use:</p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Lockdown defender that can also score from mid',
                  'Stretch big who can shoot threes and protect the rim',
                  'High-IQ point guard with elite playmaking and handles',
                  'Athletic slasher built for park and rec',
                ].map(ex => (
                  <button key={ex} onClick={() => setDescription(ex)}
                    className="text-left text-[11px] text-white/40 hover:text-white/70 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.07] hover:border-white/[0.12] px-2.5 py-1.5 rounded-lg transition-all">
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3 mb-5">
            <PillGroup label="Position" options={POSITIONS_OPTS} value={position} onChange={setPosition} />
            <PillGroup label="Height" options={HEIGHT_RANGES} value={heightRange} onChange={setHeightRange} />
            <PillGroup label="Mode" options={GAME_MODES} value={gameMode} onChange={setGameMode} />
            <div>
              <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-2">
                Cap Breakers
                <span className="ml-2 normal-case font-normal text-white/20">(0 if none)</span>
              </p>
              <div className="flex items-center gap-3">
                <input type="range" min={0} max={20} value={capBreakers}
                  onChange={e => setCapBreakers(+e.target.value)}
                  style={{ accentColor: '#F59E0B' }} className="flex-1" />
                <span className="mono text-sm font-bold text-amber-400 w-6 text-right">{capBreakers}</span>
              </div>
              {capBreakers > 0 && (
                <p className="text-[10px] text-amber-400/60 mt-1">Build will use {capBreakers} cap breaker{capBreakers !== 1 ? 's' : ''} on primary attributes</p>
              )}
            </div>
          </div>

          <button
            onClick={generate}
            disabled={loading || !description.trim()}
            className="btn btn-primary btn-lg w-full gap-2.5"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Generating build...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate Build
              </>
            )}
          </button>
        </motion.div>

        {/* Results */}
        <AnimatePresence mode="wait">
          {loading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="card p-10 flex flex-col items-center gap-5"
            >
              <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                <Brain className="w-7 h-7 text-rose-400 animate-pulse" />
              </div>
              <div className="text-center">
                <p className="text-fg font-semibold mb-1">Building Your Player</p>
                <p className="text-fg-muted text-sm">Groq AI is crafting the perfect build...</p>
              </div>
              <div className="w-full max-w-xs space-y-2.5">
                {[80, 65, 90, 55].map((w, i) => (
                  <div key={i} className="skeleton h-3" style={{ width: `${w}%` }} />
                ))}
              </div>
            </motion.div>
          )}

          {!loading && build && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Build header */}
              <div className="card card-glow p-6">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <h2 className="display text-3xl text-fg mb-2">{build.name}</h2>
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className="chip chip-muted">{build.position}</span>
                      <span className="chip chip-muted">{build.height}</span>
                      <span className="chip chip-muted">{build.weight} lbs</span>
                      <span className="chip chip-muted">Wingspan: {build.wingspan}</span>
                      <span className="chip chip-muted">{build.archetype}</span>
                      <span className={cn('chip', TIER_CLASS[build.meta_viability] || 'tier-c')}>
                        {build.meta_viability}-Tier
                      </span>
                    </div>
                    <p className="text-fg-muted text-sm leading-relaxed italic border-l-2 border-rose-500/40 pl-3">
                      &quot;{build.playstyle_summary}&quot;
                    </p>
                  </div>
                  <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                    <ScoreRing value={build.overall_rating} color="#E11D48" />
                    <span className="text-fg-subtle text-xs">Overall</span>
                  </div>
                </div>
              </div>

              {/* Why this build */}
              <div className="card p-5 border-violet-500/20 bg-violet-500/5">
                <p className="text-violet-300 text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Wand2 className="w-3.5 h-3.5" /> Why This Build
                </p>
                <p className="text-fg-muted text-sm leading-relaxed">{build.why_this_build}</p>
              </div>

              {/* Attributes */}
              <div className="card p-5">
                <p className="text-xs font-semibold text-fg-muted uppercase tracking-wider mb-4">Attributes</p>
                <div className="space-y-2">
                  {ATTR_GROUPS.map(({ key, color, keys }) => {
                    const attrs = build.attributes as Record<string, number>
                    const relevant = keys.filter(k => attrs[k] !== undefined)
                    if (relevant.length === 0) return null
                    const isOpen = expandedGroups.includes(key)
                    return (
                      <div key={key}>
                        <button
                          onClick={() => toggleGroup(key)}
                          className="flex items-center gap-2.5 w-full py-2 hover:opacity-80 transition-opacity"
                        >
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                          <span className="text-sm font-semibold text-fg">{key}</span>
                          <div className="flex-1 h-px bg-border" />
                          {isOpen
                            ? <ChevronUp className="w-3.5 h-3.5 text-fg-subtle" />
                            : <ChevronDown className="w-3.5 h-3.5 text-fg-subtle" />
                          }
                        </button>
                        <AnimatePresence>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="grid grid-cols-2 gap-x-6 gap-y-3 pt-1 pb-3">
                                {relevant.map(k => (
                                  <div key={k}>
                                    <div className="flex justify-between items-center mb-1.5">
                                      <span className="text-fg-muted text-xs capitalize">{k.replace(/_/g, ' ')}</span>
                                      <span className="mono text-sm font-semibold text-fg">{attrs[k]}</span>
                                    </div>
                                    <StatBar value={attrs[k]} color={color} />
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Strengths and Weaknesses */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="card p-5">
                  <p className="text-emerald-400 text-xs font-semibold flex items-center gap-1.5 mb-3">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Strengths
                  </p>
                  <ul className="space-y-2">
                    {build.strengths.map((s, i) => (
                      <li key={i} className="text-fg-muted text-sm flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="card p-5">
                  <p className="text-rose-400 text-xs font-semibold flex items-center gap-1.5 mb-3">
                    <AlertTriangle className="w-3.5 h-3.5" /> Weaknesses
                  </p>
                  <ul className="space-y-2">
                    {build.weaknesses.map((w, i) => (
                      <li key={i} className="text-fg-muted text-sm flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 flex-shrink-0" />
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Badges */}
              <div className="card p-5">
                <p className="text-xs font-semibold text-fg-muted uppercase tracking-wider mb-4">Badges</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {build.badges.map((badge, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between bg-bg rounded-lg px-3 py-2.5 border border-border"
                    >
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-fg text-xs font-semibold truncate">{badge.name}</span>
                        <span className="text-fg-subtle text-2xs">{badge.category}</span>
                      </div>
                      <span className={cn('chip flex-shrink-0 ml-2', badgeLevelClass(badge.level))}>
                        {badge.level === 'Hall of Fame' ? 'HoF' : badge.level}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Animations + Takeover */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="card p-5">
                  <p className="text-xs font-semibold text-fg-muted uppercase tracking-wider mb-3">Animations</p>
                  <div className="space-y-2">
                    {build.animations.map((anim, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-fg-subtle text-xs flex-shrink-0 mt-0.5">{anim.type}:</span>
                        <span className="text-fg text-xs font-medium">{anim.pick}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="card p-5 border-violet-500/20 bg-violet-500/5">
                  <p className="text-xs font-semibold text-fg-muted uppercase tracking-wider mb-3">Takeover</p>
                  <p className="text-fg font-semibold text-sm">{build.takeover}</p>
                  <div className="mt-4">
                    <p className="text-xs font-semibold text-fg-muted uppercase tracking-wider mb-2">Best Modes</p>
                    <div className="flex flex-wrap gap-1.5">
                      {build.best_game_modes.map(mode => (
                        <span key={mode} className="chip chip-violet">{mode}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => { setBuild(null); setDescription(''); setSavedId(null) }}
                  className="btn btn-secondary"
                >
                  New Build
                </button>
                <button onClick={copyBuild} className="btn btn-secondary gap-2 flex-1">
                  {copied ? <><Check className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy</>}
                </button>
                {session?.user && (
                  <button
                    onClick={saveOptimizedBuild}
                    disabled={saving || !!savedId}
                    className={cn('btn gap-2 flex-1', savedId ? 'btn-secondary text-emerald-400' : 'btn-primary')}
                  >
                    {saving
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                      : savedId
                      ? <><Bookmark className="w-4 h-4" /> Saved!</>
                      : <><BookmarkPlus className="w-4 h-4" /> Save to Profile</>
                    }
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  )
}
