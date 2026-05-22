'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion'
import {
  Swords, Brain, AlertTriangle, Target, Shield, Crosshair, ChevronDown,
} from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import { cn } from '@/lib/utils'
import { MatchupResult, ScoutReport } from '@/lib/groq'
import toast from 'react-hot-toast'

// ─── Types ────────────────────────────────────────────────────────────────────

const POSITIONS = ['PG', 'SG', 'SF', 'PF', 'C']
type Tab = 'simulate' | 'scout'

interface BuildForm {
  name: string; position: string; height: string
  three_point: number; mid_range: number; driving_dunk: number
  driving_layup: number; close_shot: number; standing_dunk: number; post_control: number
  ball_handle: number; speed_with_ball: number; pass_accuracy: number
  perimeter_defense: number; interior_defense: number; steal: number; block: number; defensive_rebound: number
  speed: number; acceleration: number; strength: number; vertical: number; offensive_rebound: number
  badges: string
}

interface OpponentForm {
  position: string; height: string
  three_point: number; mid_range: number; driving_dunk: number
  driving_layup: number; close_shot: number; standing_dunk: number; post_control: number
  ball_handle: number; speed_with_ball: number; pass_accuracy: number
  perimeter_defense: number; interior_defense: number; steal: number; block: number; defensive_rebound: number
  speed: number; acceleration: number; strength: number; vertical: number; offensive_rebound: number
  badges: string; notes: string
}

// ─── Client-side matrix (mirrors MATCHUP_WEIGHTS in groq.ts) ──────────────────

const MATRIX_ROWS: Array<{
  offense: keyof BuildForm; defense: keyof BuildForm
  category: string; offLabel: string; defLabel: string; weight: number
}> = [
  { offense:'three_point',      defense:'perimeter_defense', category:'Perimeter Shooting', offLabel:'3-Point',        defLabel:'Perimeter D',  weight:1.5 },
  { offense:'driving_dunk',     defense:'interior_defense',  category:'Paint Attack',       offLabel:'Driving Dunk',   defLabel:'Interior D',   weight:1.3 },
  { offense:'speed_with_ball',  defense:'perimeter_defense', category:'Drive Penetration',  offLabel:'Speed w/ Ball',  defLabel:'Perimeter D',  weight:1.2 },
  { offense:'driving_layup',    defense:'interior_defense',  category:'Layup vs Paint',     offLabel:'Driving Layup',  defLabel:'Interior D',   weight:1.1 },
  { offense:'acceleration',     defense:'perimeter_defense', category:'First Step',         offLabel:'Acceleration',   defLabel:'Perimeter D',  weight:1.1 },
  { offense:'standing_dunk',    defense:'interior_defense',  category:'Standing Dunk',      offLabel:'Standing Dunk',  defLabel:'Interior D',   weight:1.0 },
  { offense:'speed',            defense:'speed',             category:'Speed Matchup',      offLabel:'Speed',          defLabel:'Speed',        weight:1.0 },
  { offense:'mid_range',        defense:'perimeter_defense', category:'Mid-Range',          offLabel:'Mid-Range',      defLabel:'Perimeter D',  weight:0.9 },
  { offense:'vertical',         defense:'block',             category:'Vertical vs Block',  offLabel:'Vertical',       defLabel:'Block',        weight:0.8 },
  { offense:'ball_handle',      defense:'steal',             category:'Ball Security',      offLabel:'Ball Handle',    defLabel:'Steal',        weight:0.8 },
  { offense:'post_control',     defense:'interior_defense',  category:'Post Game',          offLabel:'Post Control',   defLabel:'Interior D',   weight:0.7 },
  { offense:'strength',         defense:'strength',          category:'Physical Battle',    offLabel:'Strength',       defLabel:'Strength',     weight:0.7 },
  { offense:'offensive_rebound',defense:'defensive_rebound', category:'Rebounding',        offLabel:'Off. Reb',       defLabel:'Def. Reb',     weight:0.7 },
  { offense:'pass_accuracy',    defense:'steal',             category:'Passing Lanes',      offLabel:'Pass Accuracy',  defLabel:'Steal',        weight:0.6 },
  { offense:'close_shot',       defense:'interior_defense',  category:'Paint Finishing',    offLabel:'Close Shot',     defLabel:'Interior D',   weight:0.6 },
]

function parseHeightInches(h: string) {
  const m = h.match(/(\d+)'(\d+)"?/)
  return m ? parseInt(m[1]) * 12 + parseInt(m[2]) : 72
}

function computeMatrix(b1: BuildForm | OpponentForm, b2: BuildForm | OpponentForm) {
  let b1Total = 0, b2Total = 0
  const edges = MATRIX_ROWS.map(({ offense, defense, weight }) => {
    const b1Off = (b1[offense as keyof typeof b1] as number) ?? 50
    const b2Def = (b2[defense as keyof typeof b2] as number) ?? 50
    const b2Off = (b2[offense as keyof typeof b2] as number) ?? 50
    const b1Def = (b1[defense as keyof typeof b1] as number) ?? 50
    const net = (b1Off - b2Def) - (b2Off - b1Def)
    const score = net * weight
    if (score > 0) b1Total += score; else b2Total += Math.abs(score)
    return { b1Off, b2Def, b2Off, b1Def, net, score }
  })
  const heightBonus = (parseHeightInches(b1.height) - parseHeightInches(b2.height)) * 2.5
  const netTotal = (b1Total - b2Total) + heightBonus
  const p1 = Math.round(Math.min(Math.max(50 + 50 * Math.tanh((netTotal / 200) * 1.8), 15), 85))
  return { edges, p1, p2: 100 - p1, heightDiff: parseHeightInches(b1.height) - parseHeightInches(b2.height) }
}

// ─── Animation spring presets ─────────────────────────────────────────────────

const SPRING_SNAP = { type: 'spring' as const, stiffness: 400, damping: 28, mass: 0.6 }
const SPRING_SOFT = { type: 'spring' as const, stiffness: 200, damping: 22 }

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
}
const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: SPRING_SNAP },
}

// ─── Rolling number — elastic overshoot via spring ────────────────────────────

function RollingNumber({ value, suffix = '', color = '#FAFAFA', size = 'text-4xl' }: {
  value: number; suffix?: string; color?: string; size?: string
}) {
  const mv = useMotionValue(0)
  const spring = useSpring(mv, { stiffness: 80, damping: 10, mass: 0.7 })
  const rounded = useTransform(spring, v => Math.round(v))
  useEffect(() => { mv.set(value) }, [value, mv])
  return (
    <span className={cn('mono font-black tabular-nums', size)} style={{ color }}>
      <motion.span>{rounded}</motion.span>{suffix}
    </span>
  )
}

// ─── Kinetic button — 0.97 compress → spring overshoot release ───────────────

function KineticBtn({ onClick, disabled, children, className }: {
  onClick: () => void; disabled?: boolean; children: React.ReactNode; className?: string
}) {
  return (
    <motion.button
      onClick={onClick} disabled={disabled}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 500, damping: 17 }}
      className={className}
    >
      {children}
    </motion.button>
  )
}

// ─── Stat slider ──────────────────────────────────────────────────────────────

function StatSlider({ label, value, onChange, color = '#E11D48', onTouch }: {
  label: string; value: number; onChange: (v: number) => void; color?: string; onTouch?: () => void
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-0.5 sm:mb-1">
        <span className="text-white/35 text-[9px] sm:text-[11px] leading-none">{label}</span>
        <span className="mono text-[9px] sm:text-[11px] font-bold leading-none" style={{ color }}>{value}</span>
      </div>
      <input
        type="range" min={25} max={99} value={value}
        onChange={e => { onChange(+e.target.value); onTouch?.() }}
        style={{ accentColor: color }} className="w-full h-1 sm:h-1.5 cursor-pointer"
      />
    </div>
  )
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const BASE_ATTRS = {
  three_point: 80, mid_range: 72, driving_dunk: 78, driving_layup: 75, close_shot: 55,
  standing_dunk: 30, post_control: 35, ball_handle: 82, speed_with_ball: 78, pass_accuracy: 75,
  perimeter_defense: 65, interior_defense: 45, steal: 50, block: 35, defensive_rebound: 42,
  speed: 82, acceleration: 84, strength: 55, vertical: 72, offensive_rebound: 32,
}
const DEFAULT_BUILD: BuildForm = { name: '', position: 'PG', height: "6'4\"", ...BASE_ATTRS, badges: '' }
const DEFAULT_OPP: OpponentForm = { position: 'PG', height: "6'4\"", ...BASE_ATTRS, badges: '', notes: '' }

const ATTR_GROUPS: Array<{ label: string; color: string; fields: Array<{ key: keyof BuildForm; label: string }> }> = [
  { label: 'Shooting',   color: '#38BDF8', fields: [{ key:'three_point', label:'3-Point' }, { key:'mid_range', label:'Mid-Range' }] },
  { label: 'Finishing',  color: '#E11D48', fields: [{ key:'driving_dunk', label:'Driving Dunk' }, { key:'driving_layup', label:'Driving Layup' }, { key:'standing_dunk', label:'Standing Dunk' }, { key:'close_shot', label:'Close Shot' }, { key:'post_control', label:'Post Control' }] },
  { label: 'Playmaking', color: '#8B5CF6', fields: [{ key:'ball_handle', label:'Ball Handle' }, { key:'speed_with_ball', label:'Speed w/ Ball' }, { key:'pass_accuracy', label:'Pass Accuracy' }] },
  { label: 'Defense',    color: '#10B981', fields: [{ key:'perimeter_defense', label:'Perimeter D' }, { key:'interior_defense', label:'Interior D' }, { key:'steal', label:'Steal' }, { key:'block', label:'Block' }, { key:'defensive_rebound', label:'Def. Reb' }] },
  { label: 'Athleticism',color: '#F59E0B', fields: [{ key:'speed', label:'Speed' }, { key:'acceleration', label:'Acceleration' }, { key:'strength', label:'Strength' }, { key:'vertical', label:'Vertical' }, { key:'offensive_rebound', label:'Off. Reb' }] },
]

function buildToPayload(b: BuildForm) {
  const { name, position, height, badges, ...attrs } = b
  return { name: name || 'Build', position, height, attributes: attrs as Record<string, number>, badges: badges.split(',').map(s => s.trim()).filter(Boolean) }
}
function oppToPayload(o: OpponentForm) {
  const { position, height, badges, notes, ...attrs } = o
  return { position, height, attributes: attrs as Record<string, number>, badges: badges.split(',').map(s => s.trim()).filter(Boolean), notes: notes || undefined }
}

// ─── Build card (50% width, full attribute form) ──────────────────────────────

function BuildCard({ form, onChange, label, color, onSliderTouch }: {
  form: BuildForm; onChange: (u: Partial<BuildForm>) => void
  label: string; color: string; onSliderTouch: () => void
}) {
  return (
    <div className="flex flex-col gap-2 sm:gap-4">
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        <motion.span
          className="w-1.5 h-1.5 sm:w-2.5 sm:h-2.5 rounded-full flex-shrink-0"
          style={{ background: color }}
          animate={{ boxShadow: [`0 0 4px ${color}60`, `0 0 10px ${color}cc`, `0 0 4px ${color}60`] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        />
        <span className="text-[9px] sm:text-[11px] font-bold text-white/40 uppercase tracking-widest">{label}</span>
      </div>

      <input className="input build-input" placeholder="Name"
        value={form.name} onChange={e => onChange({ name: e.target.value })} />

      <div className="grid grid-cols-2 gap-1 sm:gap-2">
        <select className="select build-input" value={form.position} onChange={e => onChange({ position: e.target.value })}>
          {POSITIONS.map(p => <option key={p}>{p}</option>)}
        </select>
        <input className="input build-input" placeholder="Ht (6'4&quot;)" value={form.height}
          onChange={e => onChange({ height: e.target.value })} />
      </div>

      {ATTR_GROUPS.map(({ label: grpLabel, color: grpColor, fields }) => (
        <div key={grpLabel}>
          <p className="text-[8px] sm:text-[10px] font-bold uppercase tracking-widest mb-1 sm:mb-2" style={{ color: grpColor }}>{grpLabel}</p>
          <div className="space-y-1 sm:space-y-2.5">
            {fields.map(({ key, label: fLabel }) => (
              <StatSlider key={key} label={fLabel} value={form[key] as number} color={grpColor}
                onChange={v => onChange({ [key]: v })} onTouch={onSliderTouch} />
            ))}
          </div>
        </div>
      ))}

      <div>
        <p className="text-[8px] sm:text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1 sm:mb-1.5">Badges</p>
        <input className="input build-input" placeholder="Deadeye, Shifty..."
          value={form.badges} onChange={e => onChange({ badges: e.target.value })} />
        <p className="text-white/20 text-[8px] sm:text-[10px] mt-0.5">Comma-separated</p>
      </div>
    </div>
  )
}

// ─── Tug-of-war grid ──────────────────────────────────────────────────────────

function TugRow({ row, b1Off, b2Def, b2Off, b1Def, net, b1Color, b2Color, aiEdge, index }: {
  row: typeof MATRIX_ROWS[0]; b1Off: number; b2Def: number; b2Off: number; b1Def: number
  net: number; b1Color: string; b2Color: string
  aiEdge?: { category: string; advantage: string; reason: string }
  index: number
}) {
  const [expanded, setExpanded] = useState(false)
  // bar: center = 50, b1 wins → right of center, b2 wins → left of center
  const maxNet = 148
  const pct = Math.min(Math.max(50 + (net / maxNet) * 50, 2), 98)
  const b1Wins = net > 0
  const diff = Math.abs(net)

  return (
    <motion.div variants={fadeUp} className="group">
      <button
        className="w-full text-left"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="flex items-center gap-3 py-2 hover:bg-white/[0.02] rounded-lg px-1 transition-colors">
          {/* Left label */}
          <div className="w-[88px] flex-shrink-0 text-right">
            <span className={cn('text-[11px] font-semibold', b1Wins ? 'text-white/80' : 'text-white/30')}>
              {row.offLabel}
            </span>
          </div>

          {/* Track bar */}
          <div className="flex-1 relative">
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
              {/* Center marker */}
              <div className="absolute top-0 left-1/2 w-px h-full bg-white/15 z-10" />
              {/* Fill */}
              <motion.div
                className="absolute top-0 h-full rounded-full"
                style={{ [b1Wins ? 'left' : 'right']: '50%' }}
                animate={{ width: `${Math.abs(pct - 50)}%` }}
                transition={SPRING_SOFT}
                initial={{ width: 0 }}
              >
                <div className="h-full w-full rounded-full"
                  style={{ background: b1Wins ? b1Color : b2Color, opacity: 0.75 }} />
              </motion.div>
            </div>
            <div className="flex justify-between mt-0.5">
              <span className="text-[9px] text-white/15 font-mono">{b1Off}</span>
              <span className="text-[9px] text-white/35 font-medium">{row.category}</span>
              <span className="text-[9px] text-white/15 font-mono">{b2Def}</span>
            </div>
          </div>

          {/* Right label */}
          <div className="w-[88px] flex-shrink-0">
            <span className={cn('text-[11px] font-semibold', !b1Wins ? 'text-white/80' : 'text-white/30')}>
              {row.defLabel}
            </span>
          </div>

          <ChevronDown className={cn('w-3 h-3 text-white/20 flex-shrink-0 transition-transform duration-200', expanded && 'rotate-180')} />
        </div>
      </button>

      {/* Expanded math detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ ...SPRING_SNAP, damping: 32 }}
            className="overflow-hidden"
          >
            <div className="mx-1 mb-2 rounded-xl px-4 py-3 space-y-2"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-white/35">Your {row.offLabel}:</span>
                  <span className="mono font-bold" style={{ color: b1Color }}>{b1Off}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/35">Their {row.defLabel}:</span>
                  <span className="mono font-bold" style={{ color: b2Color }}>{b2Def}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/35">Their {row.offLabel}:</span>
                  <span className="mono font-bold" style={{ color: b2Color }}>{b2Off}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/35">Your {row.defLabel}:</span>
                  <span className="mono font-bold" style={{ color: b1Color }}>{b1Def}</span>
                </div>
              </div>
              <div className="pt-1.5 border-t border-white/[0.05] flex items-center justify-between text-[11px]">
                <span className="text-white/35">Net advantage</span>
                <span className="mono font-bold" style={{ color: b1Wins ? b1Color : b2Color }}>
                  {b1Wins ? '+' : '−'}{diff.toFixed(0)} pts → weight ×{row.weight}
                </span>
              </div>
              {aiEdge && (
                <div className="pt-1.5 border-t border-white/[0.05] text-[11px] text-white/50 italic">
                  AI: &quot;{aiEdge.reason}&quot;
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function TugOfWarGrid({ b1, b2, b1Name, b2Name, aiResult }: {
  b1: BuildForm; b2: BuildForm; b1Name: string; b2Name: string; aiResult: MatchupResult | null
}) {
  const matrix = useMemo(() => computeMatrix(b1, b2), [b1, b2])
  const b1Color = '#E11D48'; const b2Color = '#8B5CF6'

  return (
    <div className="card overflow-hidden">
      <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-white/[0.05]">
        <div>
          <p className="text-[11px] font-bold text-white/30 uppercase tracking-widest">Attribute Matrix</p>
          <p className="text-[9px] text-white/20 mt-0.5">Tap any row to see the math</p>
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: b1Color }} />
            <span className="text-white/50">{b1Name || 'Build 1'}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: b2Color }} />
            <span className="text-white/50">{b2Name || 'Build 2'}</span>
          </span>
        </div>
      </div>
      <motion.div className="px-4 py-3 space-y-0.5" variants={stagger} initial="hidden" animate="visible">
        {MATRIX_ROWS.map((row, i) => {
          const e = matrix.edges[i]
          const aiEdge = aiResult?.key_edges.find(k => k.category === row.category)
          return (
            <TugRow key={row.category} row={row} index={i}
              b1Off={e.b1Off} b2Def={e.b2Def} b2Off={e.b2Off} b1Def={e.b1Def} net={e.net}
              b1Color={b1Color} b2Color={b2Color} aiEdge={aiEdge}
            />
          )
        })}
      </motion.div>
    </div>
  )
}

// ─── Rolling scoreboard ───────────────────────────────────────────────────────

function Scoreboard({ b1, b2, b1Name, b2Name, aiResult }: {
  b1: BuildForm; b2: BuildForm; b1Name: string; b2Name: string; aiResult: MatchupResult | null
}) {
  const matrix = useMemo(() => computeMatrix(b1, b2), [b1, b2])
  const p1 = aiResult?.win_probability_1 ?? matrix.p1
  const p2 = aiResult?.win_probability_2 ?? matrix.p2

  const b1Badges = b1.badges.split(',').filter(Boolean).length
  const b2Badges = b2.badges.split(',').filter(Boolean).length
  const heightDiff = matrix.heightDiff

  return (
    <div className="card overflow-hidden relative">
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, #E11D48, #8B5CF6)' }} />
      <div className="px-5 py-4">
        {/* Main probability row */}
        <div className="flex items-center gap-4 mb-3">
          {/* Build 1 prob */}
          <div className="flex flex-col items-start gap-0.5 w-20 flex-shrink-0">
            <RollingNumber value={p1} suffix="%" color="#E11D48" size="text-3xl" />
            <span className="text-[10px] text-white/30 truncate max-w-full">{b1Name || 'Build 1'}</span>
          </div>

          {/* Probability bar */}
          <div className="flex-1 relative">
            <div className="h-3 rounded-full overflow-hidden flex" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <motion.div className="h-full" style={{ background: '#E11D48' }}
                animate={{ width: `${p1}%` }} transition={SPRING_SOFT} />
              <motion.div className="h-full" style={{ background: '#8B5CF6' }}
                animate={{ width: `${p2}%` }} transition={{ ...SPRING_SOFT, delay: 0.08 }} />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[9px] font-black text-white/60 tracking-widest uppercase">WIN %</span>
            </div>
          </div>

          {/* Build 2 prob */}
          <div className="flex flex-col items-end gap-0.5 w-20 flex-shrink-0">
            <RollingNumber value={p2} suffix="%" color="#8B5CF6" size="text-3xl" />
            <span className="text-[10px] text-white/30 truncate max-w-full text-right">{b2Name || 'Build 2'}</span>
          </div>
        </div>

        {!aiResult && (
          <p className="text-center text-[9px] text-white/20 mt-1.5 mb-0.5">Live math estimate — hit Simulate for full AI analysis</p>
        )}

        {/* Auxiliary counters */}
        <div className="grid grid-cols-3 gap-3 pt-3 border-t border-white/[0.05]">
          <div className="text-center">
            <p className="text-[10px] text-white/25 uppercase tracking-wider mb-0.5">Height Adv.</p>
            <span className="mono font-bold text-sm" style={{ color: heightDiff === 0 ? '#52525B' : heightDiff > 0 ? '#E11D48' : '#8B5CF6' }}>
              {heightDiff === 0 ? 'Even' : `${Math.abs(heightDiff)}" – ${heightDiff > 0 ? (b1Name || 'Your Build') : (b2Name || 'Opponent')}`}
            </span>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-white/25 uppercase tracking-wider mb-0.5">Verdict</p>
            <span className="text-[11px] font-semibold text-white/60">
              {Math.abs(p1 - 50) < 5 ? 'Coin flip' : p1 > p2 ? (b1Name || 'Your Build') + ' wins' : (b2Name || 'Opponent') + ' wins'}
            </span>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-white/25 uppercase tracking-wider mb-0.5">Badge Edge</p>
            <span className="mono font-bold text-sm" style={{ color: b1Badges === b2Badges ? '#52525B' : b1Badges > b2Badges ? '#E11D48' : '#8B5CF6' }}>
              {b1Badges === b2Badges ? 'Even' : `${Math.abs(b1Badges - b2Badges)} – ${b1Badges > b2Badges ? (b1Name || 'Your Build') : (b2Name || 'Opponent')}`}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Scouting report cascade ──────────────────────────────────────────────────

function ScoutingCascade({ result, b1Name, b2Name }: {
  result: MatchupResult; b1Name: string; b2Name: string
}) {
  const offEdges  = result.key_edges.filter(e => e.advantage === (b1Name || 'Build 1') || e.advantage?.includes('1'))
  const defEdges  = result.key_edges.filter(e => e.advantage === (b2Name || 'Build 2') || e.advantage?.includes('2'))

  return (
    <div className="space-y-4">
      {/* Summary quote */}
      <motion.div variants={fadeUp}
        className="card px-5 py-4 border-l-2" style={{ borderLeftColor: '#E11D48' }}>
        <p className="text-white/55 text-sm leading-relaxed italic">&ldquo;{result.matchup_summary}&rdquo;</p>
      </motion.div>

      {/* Two-column cascade */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Offensive plays */}
        <motion.div className="card p-5" variants={fadeUp}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(225,29,72,0.12)', border: '1px solid rgba(225,29,72,0.2)' }}>
              <Target className="w-3 h-3 text-rose-400" />
            </div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-rose-400">{b1Name ? `${b1Name}'s Attack Plan` : 'Attack Plan'}</p>
          </div>
          <motion.ul className="space-y-2.5" variants={stagger} initial="hidden" animate="visible">
            {result.build1_strategy.map((tip, i) => (
              <motion.li key={i} variants={fadeUp} className="flex items-start gap-2.5 text-xs text-white/55">
                <span className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center text-[9px] font-black mt-0.5"
                  style={{ background: 'rgba(225,29,72,0.12)', border: '1px solid rgba(225,29,72,0.18)', color: '#FB7185' }}>
                  {i + 1}
                </span>
                {tip}
              </motion.li>
            ))}
            {offEdges.map((e, i) => (
              <motion.li key={`e-${i}`} variants={fadeUp}
                className="flex items-start gap-2 text-xs text-white/40 border-t border-white/[0.04] pt-2">
                <span className="chip text-[9px] flex-shrink-0" style={{ background: 'rgba(225,29,72,0.08)', border: '1px solid rgba(225,29,72,0.15)', color: '#FB7185' }}>
                  {e.category}
                </span>
                {e.reason}
              </motion.li>
            ))}
          </motion.ul>
        </motion.div>

        {/* Defensive adjustments */}
        <motion.div className="card p-5" variants={fadeUp}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.2)' }}>
              <Shield className="w-3 h-3 text-violet-400" />
            </div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-violet-400">{b2Name ? `Stopping ${b2Name}` : 'Defensive Keys'}</p>
          </div>
          <motion.ul className="space-y-2.5" variants={stagger} initial="hidden" animate="visible">
            {result.build2_strategy.map((tip, i) => (
              <motion.li key={i} variants={fadeUp} className="flex items-start gap-2.5 text-xs text-white/55">
                <span className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center text-[9px] font-black mt-0.5"
                  style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.18)', color: '#A78BFA' }}>
                  {i + 1}
                </span>
                {tip}
              </motion.li>
            ))}
            {defEdges.map((e, i) => (
              <motion.li key={`e-${i}`} variants={fadeUp}
                className="flex items-start gap-2 text-xs text-white/40 border-t border-white/[0.04] pt-2">
                <span className="chip text-[9px] flex-shrink-0" style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)', color: '#A78BFA' }}>
                  {e.category}
                </span>
                {e.reason}
              </motion.li>
            ))}
          </motion.ul>
        </motion.div>
      </div>

      {/* Verdict */}
      <motion.div variants={fadeUp} className="card p-4 text-center">
        <p className="text-[10px] text-white/25 uppercase tracking-widest mb-1">Final Verdict</p>
        <p className="text-white/80 font-semibold text-sm leading-relaxed">{result.verdict}</p>
      </motion.div>
    </div>
  )
}

// ─── Scout results (staggered) ────────────────────────────────────────────────

const THREAT_STYLES: Record<string, { color: string; bg: string; border: string }> = {
  Low:   { color: '#34D399', bg: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.2)' },
  Medium:{ color: '#FCD34D', bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.2)' },
  High:  { color: '#FB923C', bg: 'rgba(249,115,22,0.1)',   border: 'rgba(249,115,22,0.22)' },
  Elite: { color: '#FB7185', bg: 'rgba(225,29,72,0.1)',    border: 'rgba(225,29,72,0.25)' },
}

function ScoutResults({ report }: { report: ScoutReport }) {
  const style = THREAT_STYLES[report.threat_level] || THREAT_STYLES.Medium
  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-4">
      <motion.div variants={fadeUp} className="card p-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: style.bg, border: `1px solid ${style.border}` }}>
          <span className="mono text-lg font-black" style={{ color: style.color }}>{report.threat_level[0]}</span>
        </div>
        <div>
          <p className="text-white/30 text-xs uppercase tracking-wider mb-0.5">Threat Level</p>
          <p className="font-bold text-white text-lg">{report.threat_level}</p>
          <p className="text-white/45 text-xs mt-0.5 leading-relaxed max-w-sm">{report.summary}</p>
        </div>
      </motion.div>

      {[
        { title: 'Primary Threats', items: report.primary_threats, color: '#FB7185', icon: AlertTriangle },
        { title: 'Exploit These Weaknesses', items: report.exploit_weaknesses, color: '#34D399', icon: Crosshair },
        { title: 'Defensive Keys', items: report.defensive_keys, color: '#7DD3FC', icon: Shield },
        { title: 'How to Win', items: report.how_to_win, color: '#FCD34D', icon: Target },
      ].map(({ title, items, color, icon: Icon }) => (
        <motion.div key={title} variants={fadeUp} className="card p-5">
          <p className="text-[11px] font-bold uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color }}>
            <Icon className="w-3.5 h-3.5" />{title}
          </p>
          <motion.ul className="space-y-2" variants={stagger} initial="hidden" animate="visible">
            {items.map((item, i) => (
              <motion.li key={i} variants={fadeUp} className="text-white/55 text-sm flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5" style={{ background: color }} />
                {item}
              </motion.li>
            ))}
          </motion.ul>
        </motion.div>
      ))}

      <motion.div variants={fadeUp} className="card p-4">
        <p className="text-[10px] text-white/25 uppercase tracking-widest mb-2">Badges to Equip</p>
        <motion.div className="flex flex-wrap gap-1.5" variants={stagger} initial="hidden" animate="visible">
          {report.badges_to_equip.map(badge => (
            <motion.span key={badge} variants={fadeUp}
              className="chip text-xs" style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', color: '#A78BFA' }}>
              {badge}
            </motion.span>
          ))}
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function MatchupPage() {
  const [tab, setTab] = useState<Tab>('simulate')
  const [tabDir, setTabDir] = useState(1)
  const [build1, setBuild1] = useState<BuildForm>({ ...DEFAULT_BUILD })
  const [build2, setBuild2] = useState<BuildForm>({ ...DEFAULT_BUILD })
  const [opponent, setOpponent] = useState<OpponentForm>({ ...DEFAULT_OPP })
  const [loading, setLoading] = useState(false)
  const [matchupResult, setMatchupResult] = useState<MatchupResult | null>(null)
  const [scoutResult, setScoutResult] = useState<ScoutReport | null>(null)
  const [ripple, setRipple] = useState<{ from: 'left' | 'right'; key: number } | null>(null)

  const TABS: { key: Tab; label: string; icon: typeof Swords }[] = [
    { key: 'simulate', label: '1v1 Simulator', icon: Swords },
    { key: 'scout',    label: 'Opponent Scouter', icon: Crosshair },
  ]

  const switchTab = useCallback((t: Tab) => {
    const dir = TABS.findIndex(x => x.key === t) > TABS.findIndex(x => x.key === tab) ? 1 : -1
    setTabDir(dir)
    setTab(t)
  }, [tab, TABS])

  const triggerRipple = useCallback((from: 'left' | 'right') => {
    setRipple(prev => ({ from, key: (prev?.key ?? 0) + 1 }))
    setTimeout(() => setRipple(null), 700)
  }, [])

  const runSimulate = async () => {
    if (!build1.name.trim() || !build2.name.trim()) return toast.error('Name both builds first')
    setLoading(true); setMatchupResult(null)
    try {
      const res = await fetch('/api/matchup', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'simulate', build1: buildToPayload(build1), build2: buildToPayload(build2) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Simulation failed')
      setMatchupResult(data.result)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Simulation failed')
    } finally {
      setLoading(false)
    }
  }

  const runScout = async () => {
    setLoading(true); setScoutResult(null)
    try {
      const res = await fetch('/api/matchup', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'scout', opponent: oppToPayload(opponent) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Scout failed')
      setScoutResult(data.report)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Scout failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-3 sm:px-6 pt-6 sm:pt-8 pb-24">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={SPRING_SNAP} className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2.5 sm:gap-3 mb-2 sm:mb-3">
            <motion.div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(225,29,72,0.1)', border: '1px solid rgba(225,29,72,0.2)' }}
              whileHover={{ scale: 1.08 }} transition={SPRING_SNAP}>
              <Swords className="w-4 h-4 sm:w-5 sm:h-5 text-rose-400" />
            </motion.div>
            <span className="text-rose-400 text-[9px] sm:text-[10px] font-bold tracking-[0.2em] uppercase">Matchup Lab</span>
          </div>
          <h1 className="display text-3xl sm:text-4xl text-white mb-1">1v1 Simulator</h1>
          <p className="text-white/35 text-xs sm:text-sm">Compare two builds head-to-head. Get AI win probability, attribute breakdown, and coaching tips.</p>
        </motion.div>

        {/* Tab switcher — kinetic */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING_SNAP, delay: 0.04 }} className="card p-1 sm:p-1.5 flex gap-0.5 sm:gap-1 w-fit mb-4 sm:mb-6">
          {TABS.map(({ key, label, icon: Icon }) => (
            <KineticBtn key={key} onClick={() => switchTab(key)}
              className={cn('flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors',
                tab === key ? 'bg-rose-500 text-white shadow-[0_2px_10px_rgba(225,29,72,0.4)]' : 'text-white/40 hover:text-white/70'
              )}>
              <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />{label}
            </KineticBtn>
          ))}
        </motion.div>

        {/* Tab content — directional slide transition */}
        <AnimatePresence mode="wait" custom={tabDir}>
          {tab === 'simulate' && (
            <motion.div key="simulate" custom={tabDir}
              initial={{ x: tabDir * 48, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
              exit={{ x: tabDir * -48, opacity: 0 }} transition={SPRING_SOFT}
              className="space-y-3 sm:space-y-5">

              {/* 3-step guide */}
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
                className="flex items-center justify-center gap-2 sm:gap-4 flex-wrap"
              >
                {[
                  { n: '1', text: 'Fill in both builds' },
                  { n: '2', text: 'Hit Simulate' },
                  { n: '3', text: 'Read the AI breakdown' },
                ].map(({ n, text }, i) => (
                  <div key={n} className="flex items-center gap-1.5 sm:gap-2">
                    {i > 0 && <span className="text-white/10 text-xs">→</span>}
                    <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black flex-shrink-0"
                      style={{ background: 'rgba(225,29,72,0.15)', border: '1px solid rgba(225,29,72,0.2)', color: '#FB7185' }}>
                      {n}
                    </span>
                    <span className="text-[10px] text-white/30">{text}</span>
                  </div>
                ))}
              </motion.div>

              {/* Rolling scoreboard */}
              <Scoreboard b1={build1} b2={build2} b1Name={build1.name} b2Name={build2.name} aiResult={matchupResult} />

              {/* Dual input collision — always side by side */}
              <div className="relative" style={{ display: 'grid', gridTemplateColumns: '1fr 2px 1fr' }}>
                {/* Build 1 — slides in from left */}
                <motion.div
                  className="card rounded-r-none p-3 sm:p-5"
                  style={{ borderRight: 'none' }}
                  initial={{ opacity: 0, x: -40 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ ...SPRING_SNAP, delay: 0.06 }}>
                  <BuildCard form={build1} onChange={u => setBuild1(p => ({ ...p, ...u }))}
                    label="Your Build" color="#E11D48" onSliderTouch={() => triggerRipple('left')} />
                </motion.div>

                {/* VS + ripple divider — always visible */}
                <div className="relative" style={{ zIndex: 10 }}>
                  <div className="absolute inset-0" style={{ background: 'rgba(255,255,255,0.06)' }} />
                  <div className="absolute top-8 sm:top-10 left-1/2 -translate-x-1/2 z-10">
                    <motion.div
                      className="w-6 h-6 sm:w-9 sm:h-9 rounded-full flex items-center justify-center"
                      style={{ background: '#0C0C10', border: '1px solid rgba(255,255,255,0.1)' }}
                      initial={{ scale: 0, rotate: -90 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ ...SPRING_SNAP, delay: 0.15 }}>
                      <span className="display text-[8px] sm:text-xs font-black text-white/40">VS</span>
                    </motion.div>
                  </div>
                  {/* Ripple wave */}
                  <AnimatePresence>
                    {ripple && (
                      <motion.div key={ripple.key}
                        className="absolute left-1/2 -translate-x-1/2 w-1 rounded-full pointer-events-none"
                        style={{ background: ripple.from === 'left' ? '#E11D48' : '#8B5CF6' }}
                        initial={{ height: 0, opacity: 0.9, top: '50%' }}
                        animate={{ height: '55%', opacity: 0, top: '22%' }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                      />
                    )}
                  </AnimatePresence>
                </div>

                {/* Build 2 — slides in from right */}
                <motion.div
                  className="card rounded-l-none p-3 sm:p-5"
                  style={{ borderLeft: 'none' }}
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ ...SPRING_SNAP, delay: 0.08 }}>
                  <BuildCard form={build2} onChange={u => setBuild2(p => ({ ...p, ...u }))}
                    label="Opponent" color="#8B5CF6" onSliderTouch={() => triggerRipple('right')} />
                </motion.div>
              </div>

              {/* Simulate button — kinetic */}
              <KineticBtn onClick={runSimulate} disabled={loading}
                className="btn btn-primary btn-lg w-full gap-2.5 disabled:opacity-60">
                {loading
                  ? <><span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />Simulating...</>
                  : <><Swords className="w-5 h-5" />Simulate Matchup</>}
              </KineticBtn>

              {/* Loading skeleton */}
              <AnimatePresence>
                {loading && (
                  <motion.div key="loading"
                    initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                    transition={SPRING_SNAP}
                    className="card p-10 flex flex-col items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                      style={{ background: 'rgba(225,29,72,0.1)', border: '1px solid rgba(225,29,72,0.2)' }}>
                      <Brain className="w-7 h-7 text-rose-400 animate-pulse" />
                    </div>
                    <div className="text-center">
                      <p className="text-white font-semibold mb-1">Running Matrix Analysis</p>
                      <p className="text-white/35 text-sm">15-attribute comparison + AI coaching...</p>
                    </div>
                    <motion.div className="w-full max-w-xs space-y-2.5" variants={stagger} initial="hidden" animate="visible">
                      {[75, 90, 60, 85, 70].map((w, i) => (
                        <motion.div key={i} variants={fadeUp} className="skeleton h-2.5 rounded-full" style={{ width: `${w}%` }} />
                      ))}
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Tug-of-war grid — always visible, enriched after sim */}
              <TugOfWarGrid b1={build1} b2={build2} b1Name={build1.name} b2Name={build2.name} aiResult={matchupResult} />

              {/* Scouting cascade — appears after sim */}
              <AnimatePresence>
                {!loading && matchupResult && (
                  <motion.div key="results"
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    transition={{ ...SPRING_SNAP, delay: 0.1 }}>
                    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-4">
                      <ScoutingCascade result={matchupResult} b1Name={build1.name} b2Name={build2.name} />
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {tab === 'scout' && (
            <motion.div key="scout" custom={tabDir}
              initial={{ x: tabDir * 48, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
              exit={{ x: tabDir * -48, opacity: 0 }} transition={SPRING_SOFT}
              className="space-y-5">

              <div className="card p-5 space-y-5">
                <p className="text-[11px] font-bold text-white/30 uppercase tracking-widest flex items-center gap-2">
                  <Crosshair className="w-3.5 h-3.5 text-rose-400" />Opponent Build
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <select className="select" value={opponent.position} onChange={e => setOpponent(p => ({ ...p, position: e.target.value }))}>
                    {POSITIONS.map(p => <option key={p}>{p}</option>)}
                  </select>
                  <input className="input" placeholder="Height (e.g. 6'4&quot;)"
                    value={opponent.height} onChange={e => setOpponent(p => ({ ...p, height: e.target.value }))} />
                </div>
                {ATTR_GROUPS.map(({ label, color, fields }) => (
                  <div key={label}>
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color }}>{label}</p>
                    <div className="space-y-2.5">
                      {fields.map(({ key, label: fl }) => (
                        <StatSlider key={key} label={fl} color={color}
                          value={opponent[key as keyof OpponentForm] as number}
                          onChange={v => setOpponent(p => ({ ...p, [key]: v }))} />
                      ))}
                    </div>
                  </div>
                ))}
                <div>
                  <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1.5">Badges</p>
                  <input className="input" placeholder="Challenger, Interceptor..." value={opponent.badges}
                    onChange={e => setOpponent(p => ({ ...p, badges: e.target.value }))} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1.5">Notes</p>
                  <textarea className="input resize-none" rows={3}
                    placeholder="e.g. always goes right, loves step-back threes from the corner..."
                    value={opponent.notes} onChange={e => setOpponent(p => ({ ...p, notes: e.target.value }))} />
                </div>
              </div>

              <KineticBtn onClick={runScout} disabled={loading}
                className="btn btn-primary btn-lg w-full gap-2.5 disabled:opacity-60">
                {loading
                  ? <><span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />Scouting...</>
                  : <><Crosshair className="w-5 h-5" />Scout Opponent</>}
              </KineticBtn>

              <AnimatePresence>
                {!loading && scoutResult && (
                  <motion.div key="scout-results"
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ ...SPRING_SNAP, delay: 0.05 }}>
                    <ScoutResults report={scoutResult} />
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
