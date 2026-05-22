'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Swords, Brain, AlertTriangle, Target, Shield,
  ChevronRight, Crosshair,
} from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import { cn } from '@/lib/utils'
import { MatchupResult, ScoutReport } from '@/lib/groq'
import toast from 'react-hot-toast'

const POSITIONS = ['PG', 'SG', 'SF', 'PF', 'C']

type Tab = 'simulate' | 'scout'

interface BuildForm {
  name: string
  position: string
  height: string
  three_point: number
  ball_handle: number
  driving_dunk: number
  perimeter_defense: number
  speed: number
  strength: number
  badges: string
}

interface OpponentForm {
  position: string
  height: string
  three_point: number
  ball_handle: number
  driving_dunk: number
  perimeter_defense: number
  speed: number
  strength: number
  badges: string
  notes: string
}

const DEFAULT_BUILD: BuildForm = {
  name: '',
  position: 'PG',
  height: "6'4\"",
  three_point: 75,
  ball_handle: 80,
  driving_dunk: 78,
  perimeter_defense: 65,
  speed: 82,
  strength: 55,
  badges: '',
}

const DEFAULT_OPPONENT: OpponentForm = {
  position: 'PG',
  height: "6'4\"",
  three_point: 75,
  ball_handle: 80,
  driving_dunk: 78,
  perimeter_defense: 65,
  speed: 82,
  strength: 55,
  badges: '',
  notes: '',
}

const STAT_FIELDS: Array<{ key: keyof Omit<BuildForm, 'name' | 'position' | 'height' | 'badges'>; label: string }> = [
  { key: 'three_point',        label: 'Three Point' },
  { key: 'ball_handle',        label: 'Ball Handle' },
  { key: 'driving_dunk',       label: 'Driving Dunk' },
  { key: 'perimeter_defense',  label: 'Perimeter D' },
  { key: 'speed',              label: 'Speed' },
  { key: 'strength',           label: 'Strength' },
]

function buildToPayload(b: BuildForm) {
  return {
    name: b.name || 'Build',
    position: b.position,
    height: b.height,
    attributes: {
      three_point: b.three_point,
      ball_handle: b.ball_handle,
      driving_dunk: b.driving_dunk,
      perimeter_defense: b.perimeter_defense,
      speed: b.speed,
      strength: b.strength,
    },
    badges: b.badges
      .split(',')
      .map(s => s.trim())
      .filter(Boolean),
  }
}

function opponentToPayload(o: OpponentForm) {
  return {
    position: o.position,
    height: o.height,
    attributes: {
      three_point: o.three_point,
      ball_handle: o.ball_handle,
      driving_dunk: o.driving_dunk,
      perimeter_defense: o.perimeter_defense,
      speed: o.speed,
      strength: o.strength,
    },
    badges: o.badges
      .split(',')
      .map(s => s.trim())
      .filter(Boolean),
    notes: o.notes || undefined,
  }
}

function StatSlider({
  label,
  value,
  onChange,
  color = '#E11D48',
}: {
  label: string
  value: number
  onChange: (v: number) => void
  color?: string
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-fg-muted text-xs">{label}</span>
        <span className="mono text-xs font-semibold text-fg">{value}</span>
      </div>
      <input
        type="range"
        min={25}
        max={99}
        value={value}
        onChange={e => onChange(+e.target.value)}
        style={{ accentColor: color }}
        className="w-full"
      />
    </div>
  )
}

function BuildCard({
  form,
  onChange,
  label,
  color,
}: {
  form: BuildForm
  onChange: (updates: Partial<BuildForm>) => void
  label: string
  color: string
}) {
  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
        <p className="text-xs font-semibold text-fg-muted uppercase tracking-wider">{label}</p>
      </div>

      <input
        className="input"
        placeholder="Build name (e.g. Park God)"
        value={form.name}
        onChange={e => onChange({ name: e.target.value })}
      />

      <div className="grid grid-cols-2 gap-3">
        <select
          className="select"
          value={form.position}
          onChange={e => onChange({ position: e.target.value })}
        >
          {POSITIONS.map(p => <option key={p}>{p}</option>)}
        </select>
        <input
          className="input"
          placeholder='Height (e.g. 6&apos;4")'
          value={form.height}
          onChange={e => onChange({ height: e.target.value })}
        />
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold text-fg-muted uppercase tracking-wider">Key Attributes</p>
        {STAT_FIELDS.map(({ key, label: statLabel }) => (
          <StatSlider
            key={key}
            label={statLabel}
            value={form[key] as number}
            onChange={v => onChange({ [key]: v })}
            color={color}
          />
        ))}
      </div>

      <div>
        <p className="text-xs font-semibold text-fg-muted uppercase tracking-wider mb-1.5">Badges</p>
        <input
          className="input"
          placeholder="Deadeye, Shifty Shooter, Lightning Launch..."
          value={form.badges}
          onChange={e => onChange({ badges: e.target.value })}
        />
        <p className="text-fg-subtle text-2xs mt-1">Comma-separated badge names</p>
      </div>
    </div>
  )
}

function SimulatorResults({ result, build1Name, build2Name }: { result: MatchupResult; build1Name: string; build2Name: string }) {
  const p1 = result.win_probability_1
  const p2 = result.win_probability_2

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Winner banner */}
      <div className="card card-glow p-6 text-center">
        <p className="text-fg-subtle text-xs uppercase tracking-wider mb-1">Winner</p>
        <h2 className="display text-3xl text-fg mb-4">{result.winner}</h2>

        {/* Probability bar */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-rose-400 mono text-sm font-bold w-10 text-right">{p1}%</span>
          <div className="flex-1 h-3 bg-bg rounded-full overflow-hidden flex">
            <motion.div
              className="h-full bg-rose-500"
              initial={{ width: 0 }}
              animate={{ width: `${p1}%` }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            />
            <motion.div
              className="h-full bg-violet-500"
              initial={{ width: 0 }}
              animate={{ width: `${p2}%` }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            />
          </div>
          <span className="text-violet-400 mono text-sm font-bold w-10">{p2}%</span>
        </div>
        <div className="flex justify-between text-xs text-fg-subtle">
          <span>{build1Name || 'Build 1'}</span>
          <span>{build2Name || 'Build 2'}</span>
        </div>
      </div>

      {/* Summary */}
      <div className="card p-5 border-l-2 border-rose-500/40">
        <p className="text-fg-muted text-sm leading-relaxed italic">&quot;{result.matchup_summary}&quot;</p>
      </div>

      {/* Key edges */}
      <div className="card p-5">
        <p className="text-xs font-semibold text-fg-muted uppercase tracking-wider mb-3 flex items-center gap-2">
          <Target className="w-3.5 h-3.5 text-rose-400" /> Key Edges
        </p>
        <div className="space-y-2">
          {result.key_edges.map((edge, i) => (
            <div key={i} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
              <span className="chip chip-muted flex-shrink-0 mt-0.5">{edge.category}</span>
              <div className="flex-1 min-w-0">
                <span className={cn(
                  'text-xs font-semibold',
                  edge.advantage === (build1Name || 'Build 1') ? 'text-rose-400' : 'text-violet-400'
                )}>
                  {edge.advantage}
                </span>
                <p className="text-fg-subtle text-xs mt-0.5">{edge.reason}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Strategies */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card p-5">
          <p className="text-rose-400 text-xs font-semibold uppercase tracking-wider mb-3">
            {build1Name || 'Build 1'} Strategy
          </p>
          <ul className="space-y-2">
            {result.build1_strategy.map((tip, i) => (
              <li key={i} className="text-fg-muted text-xs flex items-start gap-1.5">
                <span className="text-rose-400 font-bold flex-shrink-0">{i + 1}.</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
        <div className="card p-5">
          <p className="text-violet-400 text-xs font-semibold uppercase tracking-wider mb-3">
            {build2Name || 'Build 2'} Strategy
          </p>
          <ul className="space-y-2">
            {result.build2_strategy.map((tip, i) => (
              <li key={i} className="text-fg-muted text-xs flex items-start gap-1.5">
                <span className="text-violet-400 font-bold flex-shrink-0">{i + 1}.</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Verdict */}
      <div className="card p-5 bg-surface/60 text-center">
        <p className="text-fg-subtle text-xs uppercase tracking-wider mb-2">Verdict</p>
        <p className="text-fg font-semibold leading-relaxed">{result.verdict}</p>
      </div>
    </motion.div>
  )
}

const THREAT_CONFIG: Record<string, { label: string; class: string; pulse: boolean }> = {
  Low:   { label: 'Low',   class: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/25', pulse: false },
  Medium:{ label: 'Medium',class: 'text-amber-400  bg-amber-400/10   border-amber-400/25',   pulse: false },
  High:  { label: 'High',  class: 'text-orange-400 bg-orange-400/10  border-orange-400/25',  pulse: false },
  Elite: { label: 'Elite', class: 'text-rose-400   bg-rose-500/10    border-rose-500/30',    pulse: true  },
}

function ScoutResults({ report }: { report: ScoutReport }) {
  const threatCfg = THREAT_CONFIG[report.threat_level] || THREAT_CONFIG.Medium

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Threat level */}
      <div className="card card-glow p-6 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <p className="text-fg-subtle text-xs uppercase tracking-wider mb-1">Threat Assessment</p>
          <div className="flex items-center gap-3">
            <span className={cn(
              'chip text-sm font-bold px-4 py-1.5',
              threatCfg.class,
              threatCfg.pulse && 'animate-pulse'
            )}>
              {report.threat_level}
            </span>
            <p className="text-fg font-semibold">Opponent Threat Level</p>
          </div>
        </div>
        <div className="sm:text-right">
          <p className="text-fg-muted text-xs leading-relaxed max-w-xs">{report.summary}</p>
        </div>
      </div>

      {/* Primary threats */}
      <div className="card p-5">
        <p className="text-rose-400 text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5" /> Primary Threats
        </p>
        <ul className="space-y-2">
          {report.primary_threats.map((threat, i) => (
            <li key={i} className="text-fg-muted text-sm flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0 mt-0.5" />
              {threat}
            </li>
          ))}
        </ul>
      </div>

      {/* Exploit weaknesses */}
      <div className="card p-5">
        <p className="text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
          <Crosshair className="w-3.5 h-3.5" /> Exploit These Weaknesses
        </p>
        <ul className="space-y-2">
          {report.exploit_weaknesses.map((w, i) => (
            <li key={i} className="text-fg-muted text-sm flex items-start gap-2">
              <Crosshair className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
              {w}
            </li>
          ))}
        </ul>
      </div>

      {/* Badges to equip */}
      <div className="card p-5">
        <p className="text-violet-300 text-xs font-semibold uppercase tracking-wider mb-3">Badges to Equip</p>
        <div className="flex flex-wrap gap-1.5">
          {report.badges_to_equip.map(badge => (
            <span key={badge} className="chip chip-violet">{badge}</span>
          ))}
        </div>
      </div>

      {/* Defensive keys */}
      <div className="card p-5">
        <p className="text-sky-300 text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
          <Shield className="w-3.5 h-3.5" /> Defensive Keys
        </p>
        <ul className="space-y-2">
          {report.defensive_keys.map((key, i) => (
            <li key={i} className="text-fg-muted text-sm flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 flex-shrink-0 mt-1.5" />
              {key}
            </li>
          ))}
        </ul>
      </div>

      {/* How to win */}
      <div className="card p-5">
        <p className="text-amber-300 text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
          <ChevronRight className="w-3.5 h-3.5" /> How to Win
        </p>
        <ol className="space-y-2">
          {report.how_to_win.map((step, i) => (
            <li key={i} className="text-fg-muted text-sm flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-400 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>
    </motion.div>
  )
}

export default function MatchupPage() {
  const [tab, setTab] = useState<Tab>('simulate')
  const [build1, setBuild1] = useState<BuildForm>({ ...DEFAULT_BUILD })
  const [build2, setBuild2] = useState<BuildForm>({ ...DEFAULT_BUILD })
  const [opponent, setOpponent] = useState<OpponentForm>({ ...DEFAULT_OPPONENT })
  const [loading, setLoading] = useState(false)
  const [matchupResult, setMatchupResult] = useState<MatchupResult | null>(null)
  const [scoutResult, setScoutResult] = useState<ScoutReport | null>(null)

  const runSimulate = async () => {
    if (!build1.name.trim() || !build2.name.trim()) {
      return toast.error('Name both builds first')
    }
    setLoading(true)
    setMatchupResult(null)
    try {
      const res = await fetch('/api/matchup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'simulate',
          build1: buildToPayload(build1),
          build2: buildToPayload(build2),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Simulation failed')
      setMatchupResult(data.result)
      toast.success('Matchup simulated!')
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Simulation failed')
    } finally {
      setLoading(false)
    }
  }

  const runScout = async () => {
    setLoading(true)
    setScoutResult(null)
    try {
      const res = await fetch('/api/matchup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'scout',
          opponent: opponentToPayload(opponent),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Scout failed')
      setScoutResult(data.report)
      toast.success('Scouting report ready!')
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Scout failed')
    } finally {
      setLoading(false)
    }
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
              <Swords className="w-5 h-5 text-rose-400" />
            </div>
            <span className="text-rose-400 text-xs font-semibold tracking-widest uppercase">Matchup Lab</span>
          </div>
          <h1 className="display text-4xl text-fg mb-1">1v1 Simulator</h1>
          <p className="text-fg-muted text-sm">Simulate head-to-head matchups and scout your next opponent with AI analysis.</p>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="card p-1.5 flex gap-1 w-fit mb-6"
        >
          {([
            { key: 'simulate', label: '1v1 Simulator', icon: Swords },
            { key: 'scout',    label: 'Opponent Scouter', icon: Crosshair },
          ] as const).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all',
                tab === key
                  ? 'bg-rose-500 text-white shadow-[0_2px_8px_rgba(225,29,72,0.4)]'
                  : 'text-fg-muted hover:text-fg'
              )}
            >
              <Icon className="w-3.5 h-3.5" />{label}
            </button>
          ))}
        </motion.div>

        {/* Simulate Tab */}
        <AnimatePresence mode="wait">
          {tab === 'simulate' && (
            <motion.div
              key="simulate"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
              className="space-y-5"
            >
              {/* Build inputs */}
              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-start">
                <BuildCard
                  form={build1}
                  onChange={updates => setBuild1(prev => ({ ...prev, ...updates }))}
                  label="Build 1"
                  color="#E11D48"
                />

                {/* VS divider — desktop only */}
                <div className="hidden md:flex items-center justify-center h-full pt-16">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-px h-12 bg-border" />
                    <div className="w-9 h-9 rounded-full border-2 border-border bg-bg flex items-center justify-center">
                      <span className="display text-xs font-bold text-fg-subtle">VS</span>
                    </div>
                    <div className="w-px h-12 bg-border" />
                  </div>
                </div>

                <BuildCard
                  form={build2}
                  onChange={updates => setBuild2(prev => ({ ...prev, ...updates }))}
                  label="Build 2"
                  color="#8B5CF6"
                />
              </div>

              <button
                onClick={runSimulate}
                disabled={loading}
                className="btn btn-primary btn-lg w-full gap-2.5"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Simulating Matchup...
                  </>
                ) : (
                  <>
                    <Swords className="w-5 h-5" />
                    Simulate Matchup
                  </>
                )}
              </button>

              <AnimatePresence>
                {loading && (
                  <motion.div
                    key="sim-loading"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="card p-10 flex flex-col items-center gap-5"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                      <Brain className="w-7 h-7 text-rose-400 animate-pulse" />
                    </div>
                    <div className="text-center">
                      <p className="text-fg font-semibold mb-1">Analyzing the Matchup</p>
                      <p className="text-fg-muted text-sm">AI is running the simulation...</p>
                    </div>
                    <div className="w-full max-w-xs space-y-2.5">
                      {[75, 90, 60, 85].map((w, i) => (
                        <div key={i} className="skeleton h-3" style={{ width: `${w}%` }} />
                      ))}
                    </div>
                  </motion.div>
                )}

                {!loading && matchupResult && (
                  <SimulatorResults
                    key="sim-results"
                    result={matchupResult}
                    build1Name={build1.name}
                    build2Name={build2.name}
                  />
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Scout Tab */}
          {tab === 'scout' && (
            <motion.div
              key="scout"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
              className="space-y-5"
            >
              <div className="card p-5 space-y-4">
                <p className="text-xs font-semibold text-fg-muted uppercase tracking-wider flex items-center gap-2">
                  <Crosshair className="w-3.5 h-3.5 text-rose-400" /> Opponent Build
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <select
                    className="select"
                    value={opponent.position}
                    onChange={e => setOpponent(prev => ({ ...prev, position: e.target.value }))}
                  >
                    {POSITIONS.map(p => <option key={p}>{p}</option>)}
                  </select>
                  <input
                    className="input"
                    placeholder='Height (e.g. 6&apos;4")'
                    value={opponent.height}
                    onChange={e => setOpponent(prev => ({ ...prev, height: e.target.value }))}
                  />
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-semibold text-fg-muted uppercase tracking-wider">Key Attributes</p>
                  {STAT_FIELDS.map(({ key, label }) => (
                    <StatSlider
                      key={key}
                      label={label}
                      value={opponent[key as keyof OpponentForm] as number}
                      onChange={v => setOpponent(prev => ({ ...prev, [key]: v }))}
                    />
                  ))}
                </div>

                <div>
                  <p className="text-xs font-semibold text-fg-muted uppercase tracking-wider mb-1.5">Badges</p>
                  <input
                    className="input"
                    placeholder="Challenger, Interceptor, On-Ball Menace..."
                    value={opponent.badges}
                    onChange={e => setOpponent(prev => ({ ...prev, badges: e.target.value }))}
                  />
                  <p className="text-fg-subtle text-2xs mt-1">Comma-separated badge names</p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-fg-muted uppercase tracking-wider mb-1.5">Additional Notes</p>
                  <textarea
                    className="input resize-none"
                    rows={3}
                    placeholder="e.g. this guy loves step-back threes from the corner, always goes right..."
                    value={opponent.notes}
                    onChange={e => setOpponent(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>
              </div>

              <button
                onClick={runScout}
                disabled={loading}
                className="btn btn-primary btn-lg w-full gap-2.5"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Scouting Opponent...
                  </>
                ) : (
                  <>
                    <Crosshair className="w-5 h-5" />
                    Scout Opponent
                  </>
                )}
              </button>

              <AnimatePresence>
                {loading && (
                  <motion.div
                    key="scout-loading"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="card p-10 flex flex-col items-center gap-5"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                      <Brain className="w-7 h-7 text-rose-400 animate-pulse" />
                    </div>
                    <div className="text-center">
                      <p className="text-fg font-semibold mb-1">Scouting Report</p>
                      <p className="text-fg-muted text-sm">AI is analyzing your opponent...</p>
                    </div>
                    <div className="w-full max-w-xs space-y-2.5">
                      {[80, 55, 70, 90].map((w, i) => (
                        <div key={i} className="skeleton h-3" style={{ width: `${w}%` }} />
                      ))}
                    </div>
                  </motion.div>
                )}

                {!loading && scoutResult && (
                  <ScoutResults key="scout-results" report={scoutResult} />
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  )
}
