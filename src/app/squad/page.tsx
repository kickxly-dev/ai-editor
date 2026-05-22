'use client'
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Users2, Copy, Check, RefreshCw, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'

// ─── Synergy Radar Chart ─────────────────────────────────────────────────────

const RADAR_DIMS = ['Scoring', 'Defense', 'Playmaking', 'Rebounding', 'Versatility', 'Athleticism']

function computeSynergyScores(members: SquadMemberData[]): number[] {
  if (!members.length) return [0, 0, 0, 0, 0, 0]
  let scoring = 0, defense = 0, playmaking = 0, rebounding = 0, versatility = 0, athleticism = 0
  const n = members.length

  for (const m of members) {
    const pos = m.build?.position?.toUpperCase() || ''
    const arch = (m.build?.archetype || '').toLowerCase()
    const badges = (m.build?.badges || []).map((b) => b.toLowerCase())

    // Scoring
    if (['SG', 'SF', 'PG'].includes(pos)) scoring += 70
    if (arch.includes('shot') || arch.includes('scorer') || arch.includes('slash')) scoring += 20
    if (badges.some((b) => b.includes('deadeye') || b.includes('shifty') || b.includes('set shot'))) scoring += 10

    // Defense
    if (['PF', 'C', 'SF'].includes(pos)) defense += 60
    if (arch.includes('lock') || arch.includes('two-way') || arch.includes('defender')) defense += 25
    if (badges.some((b) => b.includes('challenger') || b.includes('interceptor') || b.includes('menace'))) defense += 15

    // Playmaking
    if (pos === 'PG') playmaking += 80
    if (arch.includes('playmaker') || arch.includes('pass') || arch.includes('point')) playmaking += 20
    if (badges.some((b) => b.includes('dimer') || b.includes('visionary') || b.includes('handle'))) playmaking += 10

    // Rebounding
    if (['C', 'PF'].includes(pos)) rebounding += 75
    if (arch.includes('glass') || arch.includes('rebound') || arch.includes('stretch')) rebounding += 20
    if (badges.some((b) => b.includes('rebound') || b.includes('pogo') || b.includes('boxout'))) rebounding += 15

    // Versatility
    if (arch.includes('two-way') || arch.includes('versatile') || arch.includes('forward')) versatility += 60
    if (['SF', 'PF'].includes(pos)) versatility += 25
    if (badges.length >= 4) versatility += 15

    // Athleticism
    if (['PG', 'SG', 'SF'].includes(pos)) athleticism += 70
    if (arch.includes('athletic') || arch.includes('slasher') || arch.includes('dunk')) athleticism += 20
    if (badges.some((b) => b.includes('lightning') || b.includes('posterizer') || b.includes('rise up'))) athleticism += 10
  }

  const cap = (v: number) => Math.min(Math.round(v / n), 100)
  return [cap(scoring), cap(defense), cap(playmaking), cap(rebounding), cap(versatility), cap(athleticism)]
}

function SynergyRadar({ members }: { members: SquadMemberData[] }) {
  const scores = computeSynergyScores(members)
  const size = 220
  const cx = size / 2
  const cy = size / 2
  const r = 80
  const n = RADAR_DIMS.length

  const points = (values: number[], radius: number) =>
    values.map((v, i) => {
      const angle = (Math.PI * 2 * i) / n - Math.PI / 2
      const dist = (v / 100) * radius
      return { x: cx + dist * Math.cos(angle), y: cy + dist * Math.sin(angle) }
    })

  const toPath = (pts: { x: number; y: number }[]) =>
    pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') + ' Z'

  const gridLevels = [25, 50, 75, 100]
  const dataPts = points(scores, r)
  const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / n)

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Grid rings */}
        {gridLevels.map((lvl) => {
          const gPts = points(Array(n).fill(lvl), r)
          return (
            <path
              key={lvl}
              d={toPath(gPts)}
              fill="none"
              stroke="rgba(255,255,255,0.07)"
              strokeWidth="1"
            />
          )
        })}

        {/* Spokes */}
        {RADAR_DIMS.map((_, i) => {
          const angle = (Math.PI * 2 * i) / n - Math.PI / 2
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={cx + r * Math.cos(angle)}
              y2={cy + r * Math.sin(angle)}
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="1"
            />
          )
        })}

        {/* Data fill */}
        <motion.path
          d={toPath(dataPts)}
          fill="rgba(225,29,72,0.15)"
          stroke="rgba(225,29,72,0.6)"
          strokeWidth="1.5"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ transformOrigin: `${cx}px ${cy}px` }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        />

        {/* Data points */}
        {dataPts.map((p, i) => (
          <motion.circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="3.5"
            fill="#E11D48"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 + i * 0.05 }}
          />
        ))}

        {/* Labels */}
        {RADAR_DIMS.map((dim, i) => {
          const angle = (Math.PI * 2 * i) / n - Math.PI / 2
          const labelR = r + 18
          const lx = cx + labelR * Math.cos(angle)
          const ly = cy + labelR * Math.sin(angle)
          const anchor = Math.abs(lx - cx) < 5 ? 'middle' : lx > cx ? 'start' : 'end'
          return (
            <text
              key={i}
              x={lx}
              y={ly + 4}
              textAnchor={anchor}
              fontSize="9"
              fill="rgba(255,255,255,0.45)"
              fontFamily="system-ui, sans-serif"
            >
              {dim}
            </text>
          )
        })}

        {/* Center score */}
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="18" fontWeight="bold" fill="white" fontFamily="system-ui, sans-serif">
          {avgScore}
        </text>
        <text x={cx} y={cy + 10} textAnchor="middle" fontSize="8" fill="rgba(255,255,255,0.35)" fontFamily="system-ui, sans-serif">
          AVG
        </text>
      </svg>
      <div className="grid grid-cols-3 gap-x-4 gap-y-1 mt-1 w-full max-w-[200px]">
        {RADAR_DIMS.map((dim, i) => (
          <div key={dim} className="flex items-center gap-1">
            <span className="text-[9px] text-fg-subtle truncate">{dim.slice(0, 4)}</span>
            <span className="text-[9px] font-bold text-rose-400 ml-auto">{scores[i]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

interface SquadMemberData {
  userId: string
  name: string | null
  username: string | null
  image: string | null
  role: string | null
  build: {
    position?: string
    height?: string
    archetype?: string
    badges?: string[]
  } | null
  joinedAt: string | null
}

interface SquadData {
  id: string
  name: string
  gameMode: string | null
  description: string | null
  inviteCode: string | null
  isOpen: boolean | null
  maxMembers: number | null
  aiAnalysis: {
    chemistry_score?: number
    roles_covered?: string[]
    gaps?: string[]
    strengths?: string[]
    weaknesses?: string[]
    game_plan?: string
    verdict?: string
  } | null
  createdAt: string | null
  ownerId: string
  memberCount?: number
}

const POSITIONS = ['PG', 'SG', 'SF', 'PF', 'C']
const GAME_MODES = ['Park', 'Rec', 'Pro-Am']

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 text-xs text-fg-muted hover:text-fg transition-colors px-2 py-1 rounded bg-white/05 hover:bg-white/10"
    >
      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
      {copied ? 'Copied!' : text}
    </button>
  )
}

function BuildUpdateForm({ squadId, userId, currentBuild, onUpdated }: {
  squadId: string
  userId: string
  currentBuild: SquadMemberData['build']
  onUpdated: () => void
}) {
  const [position, setPosition] = useState(currentBuild?.position || '')
  const [archetype, setArchetype] = useState(currentBuild?.archetype || '')
  const [height, setHeight] = useState(currentBuild?.height || '')
  const [badges, setBadges] = useState((currentBuild?.badges || []).join(', '))
  const [saving, setSaving] = useState(false)
  const [open, setOpen] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await fetch(`/api/squad/${squadId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateBuild',
          build: {
            position,
            height,
            archetype,
            badges: badges.split(',').map((b) => b.trim()).filter(Boolean),
          },
        }),
      })
      onUpdated()
      setOpen(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen(!open)}
        className="text-xs text-rose-400 hover:underline flex items-center gap-1"
      >
        Update My Build {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-2 space-y-2 p-3 rounded-lg bg-white/03 border border-white/08">
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="input text-sm"
              >
                <option value="">Position</option>
                {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              <input
                type="text"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="Height (e.g. 6'4&quot;)"
                className="input text-sm"
              />
              <input
                type="text"
                value={archetype}
                onChange={(e) => setArchetype(e.target.value)}
                placeholder="Archetype (e.g. Shot Creator)"
                className="input text-sm"
              />
              <input
                type="text"
                value={badges}
                onChange={(e) => setBadges(e.target.value)}
                placeholder="Key badges, comma separated"
                className="input text-sm"
              />
              <button onClick={handleSave} disabled={saving} className="btn btn-primary btn-sm w-full">
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save Build'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function AIAnalysisPanel({ analysis, onAnalyze, analyzing, members }: {
  analysis: SquadData['aiAnalysis']
  onAnalyze: () => void
  analyzing: boolean
  members: SquadMemberData[]
}) {
  const score = analysis?.chemistry_score ?? 0

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-fg">Squad Synergy</h3>
        <button onClick={onAnalyze} disabled={analyzing} className="btn btn-primary btn-sm gap-1.5">
          {analyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          {analyzing ? 'Analyzing...' : 'Run AI Analysis'}
        </button>
      </div>

      {/* Radar chart always visible when members have builds */}
      {members.some((m) => m.build?.position) && (
        <div className="flex justify-center mb-4">
          <SynergyRadar members={members} />
        </div>
      )}

      {analysis ? (
        <div className="space-y-4">
          {/* Chemistry Score */}
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 flex-shrink-0">
              <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
                <circle
                  cx="32" cy="32" r="26" fill="none"
                  stroke={score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444'}
                  strokeWidth="6"
                  strokeDasharray={`${(score / 100) * 163} 163`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-fg">{score}</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-fg">Chemistry Score</p>
              <p className="text-xs text-fg-muted">{score >= 80 ? 'Elite squad chemistry' : score >= 60 ? 'Good chemistry' : 'Needs improvement'}</p>
            </div>
          </div>

          {/* Roles Covered */}
          {analysis.roles_covered && analysis.roles_covered.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-fg-muted uppercase tracking-wider mb-1.5">Roles Covered</p>
              <div className="flex flex-wrap gap-1.5">
                {analysis.roles_covered.map((r) => (
                  <span key={r} className="chip text-emerald-400 border-emerald-500/30 bg-emerald-500/10">{r}</span>
                ))}
              </div>
            </div>
          )}

          {/* Gaps */}
          {analysis.gaps && analysis.gaps.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-fg-muted uppercase tracking-wider mb-1.5">Gaps</p>
              <div className="flex flex-wrap gap-1.5">
                {analysis.gaps.map((g) => (
                  <span key={g} className="chip text-rose-400 border-rose-500/30 bg-rose-500/10">{g}</span>
                ))}
              </div>
            </div>
          )}

          {/* Strengths / Weaknesses */}
          <div className="grid grid-cols-2 gap-3">
            {analysis.strengths && analysis.strengths.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-fg-muted uppercase tracking-wider mb-1.5">Strengths</p>
                <ul className="space-y-1">
                  {analysis.strengths.map((s) => (
                    <li key={s} className="text-xs text-fg-muted flex items-start gap-1.5">
                      <span className="text-emerald-400 mt-0.5">+</span>{s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {analysis.weaknesses && analysis.weaknesses.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-fg-muted uppercase tracking-wider mb-1.5">Weaknesses</p>
                <ul className="space-y-1">
                  {analysis.weaknesses.map((w) => (
                    <li key={w} className="text-xs text-fg-muted flex items-start gap-1.5">
                      <span className="text-rose-400 mt-0.5">-</span>{w}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Game Plan */}
          {analysis.game_plan && (
            <div>
              <p className="text-xs font-semibold text-fg-muted uppercase tracking-wider mb-1.5">Game Plan</p>
              <p className="text-sm text-fg-muted">{analysis.game_plan}</p>
            </div>
          )}

          {/* Verdict */}
          {analysis.verdict && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20">
              <p className="text-sm text-fg font-medium">{analysis.verdict}</p>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-fg-muted text-center py-6">Run AI analysis to see squad chemistry breakdown</p>
      )}
    </div>
  )
}

export default function SquadPage() {
  const { data: session, status } = useSession()
  const [mySquads, setMySquads] = useState<SquadData[]>([])
  const [selectedSquad, setSelectedSquad] = useState<SquadData | null>(null)
  const [selectedMembers, setSelectedMembers] = useState<SquadMemberData[]>([])
  const [loadingSquads, setLoadingSquads] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)

  // Create squad form
  const [squadName, setSquadName] = useState('')
  const [squadMode, setSquadMode] = useState('Park')
  const [squadDesc, setSquadDesc] = useState('')
  const [squadMax, setSquadMax] = useState(5)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  const fetchMySquads = useCallback(async () => {
    if (!session?.user) return
    setLoadingSquads(true)
    try {
      const res = await fetch('/api/squad?mine=1')
      const data = await res.json()
      setMySquads(data.squads || [])
    } finally {
      setLoadingSquads(false)
    }
  }, [session?.user])

  useEffect(() => {
    fetchMySquads()
  }, [fetchMySquads])

  const fetchSquadDetail = useCallback(async (id: string) => {
    const res = await fetch(`/api/squad/${id}`)
    const data = await res.json()
    if (data.squad) setSelectedSquad(data.squad)
    if (data.members) setSelectedMembers(data.members)
  }, [])

  const handleSelectSquad = (squad: SquadData) => {
    fetchSquadDetail(squad.id)
  }

  const handleCreateSquad = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateError('')
    setCreating(true)
    try {
      const res = await fetch('/api/squad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: squadName, gameMode: squadMode, description: squadDesc, maxMembers: squadMax }),
      })
      const data = await res.json()
      if (!res.ok) {
        setCreateError(data.error || 'Failed to create squad.')
        return
      }
      setSquadName('')
      setSquadDesc('')
      await fetchMySquads()
      if (data.squad) handleSelectSquad(data.squad)
    } finally {
      setCreating(false)
    }
  }

  const handleAnalyze = async () => {
    if (!selectedSquad) return
    setAnalyzing(true)
    try {
      const res = await fetch(`/api/squad/${selectedSquad.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'analyze' }),
      })
      const data = await res.json()
      if (data.aiAnalysis) {
        setSelectedSquad((prev) => prev ? { ...prev, aiAnalysis: data.aiAnalysis } : prev)
        // Refresh squad list too
        fetchMySquads()
      }
    } finally {
      setAnalyzing(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-rose-400" />
      </div>
    )
  }

  if (!session?.user) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Users2 className="w-12 h-12 text-rose-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-fg mb-2">Sign in to use Squad Builder</h2>
            <p className="text-fg-muted mb-6">Build and analyze your squad with AI-powered chemistry reports.</p>
            <Link href="/login" className="btn btn-primary">Sign In</Link>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-16">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <Users2 className="w-5 h-5 text-rose-400" />
            <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">Squad Builder</span>
          </div>
          <h1 className="text-3xl font-bold text-fg">Build Your Squad</h1>
          <p className="text-fg-muted mt-1">Create, manage, and analyze your NBA 2K26 squad chemistry.</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: My Squads + Create */}
          <div className="space-y-6">
            {/* My Squads */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-fg">My Squads</h2>
                <button onClick={fetchMySquads} disabled={loadingSquads} className="text-fg-muted hover:text-fg transition-colors">
                  <RefreshCw className={`w-4 h-4 ${loadingSquads ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {mySquads.length === 0 ? (
                <div className="card p-5 text-center">
                  <p className="text-sm text-fg-muted mb-3">No squads yet.</p>
                  <p className="text-xs text-fg-subtle">Use the form below to create your first squad.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {mySquads.map((squad) => (
                    <motion.div
                      key={squad.id}
                      whileHover={{ scale: 1.01 }}
                      onClick={() => handleSelectSquad(squad)}
                      className={`card p-4 cursor-pointer transition-all ${
                        selectedSquad?.id === squad.id ? 'border-rose-500/40 bg-rose-500/05' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-fg text-sm truncate">{squad.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="chip">{squad.gameMode}</span>
                            <span className="text-xs text-fg-muted">
                              {squad.memberCount ?? 0}/{squad.maxMembers ?? 5} members
                            </span>
                          </div>
                        </div>
                      </div>
                      {squad.inviteCode && (
                        <div className="mt-2">
                          <CopyButton text={squad.inviteCode} />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Create Squad */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <h2 className="font-semibold text-fg mb-3">Create Squad</h2>
              <div className="card p-5">
                <form onSubmit={handleCreateSquad} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-fg-muted mb-1.5 uppercase tracking-wider">Squad Name</label>
                    <input
                      type="text"
                      value={squadName}
                      onChange={(e) => setSquadName(e.target.value)}
                      placeholder="e.g. Park Gods"
                      className="input"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-fg-muted mb-1.5 uppercase tracking-wider">Game Mode</label>
                    <select value={squadMode} onChange={(e) => setSquadMode(e.target.value)} className="input">
                      {GAME_MODES.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-fg-muted mb-1.5 uppercase tracking-wider">Description</label>
                    <textarea
                      value={squadDesc}
                      onChange={(e) => setSquadDesc(e.target.value)}
                      placeholder="What's your squad about?"
                      className="input min-h-[72px] resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-fg-muted mb-1.5 uppercase tracking-wider">Max Members</label>
                    <select value={squadMax} onChange={(e) => setSquadMax(Number(e.target.value))} className="input">
                      <option value={3}>3</option>
                      <option value={5}>5</option>
                    </select>
                  </div>
                  {createError && (
                    <p className="text-xs text-rose-400">{createError}</p>
                  )}
                  <button type="submit" disabled={creating} className="btn btn-primary w-full gap-1.5">
                    {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users2 className="w-4 h-4" />}
                    Create Squad
                  </button>
                </form>
              </div>
            </motion.div>
          </div>

          {/* Right column: Squad detail */}
          <div className="lg:col-span-2">
            {selectedSquad ? (
              <motion.div
                key={selectedSquad.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-5"
              >
                {/* Squad header */}
                <div className="card p-5">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <h2 className="text-xl font-bold text-fg">{selectedSquad.name}</h2>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="chip">{selectedSquad.gameMode}</span>
                        <span className="text-xs text-fg-muted">
                          {selectedMembers.length}/{selectedSquad.maxMembers ?? 5} members
                        </span>
                        {selectedSquad.isOpen && <span className="chip text-emerald-400 border-emerald-500/30 bg-emerald-500/10">Open</span>}
                      </div>
                      {selectedSquad.description && (
                        <p className="text-sm text-fg-muted mt-2">{selectedSquad.description}</p>
                      )}
                    </div>
                    {selectedSquad.inviteCode && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-fg-muted">Invite Code:</span>
                        <CopyButton text={selectedSquad.inviteCode} />
                      </div>
                    )}
                  </div>
                </div>

                {/* Members */}
                <div className="card p-5">
                  <h3 className="font-semibold text-fg mb-4">Members</h3>
                  <div className="space-y-3">
                    {selectedMembers.map((member) => (
                      <div key={member.userId} className="flex items-start gap-3 p-3 rounded-lg bg-white/03 border border-white/06">
                        {/* Avatar */}
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {(member.username || member.name || '?')[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-fg truncate">{member.username || member.name || 'Unknown'}</span>
                            {member.role === 'owner' && <span className="chip text-amber-400 border-amber-500/30 bg-amber-500/10 text-xs">Owner</span>}
                          </div>
                          {member.build ? (
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                              {member.build.position && <span className="chip text-xs">{member.build.position}</span>}
                              {member.build.archetype && <span className="text-xs text-fg-muted">{member.build.archetype}</span>}
                              {member.build.height && <span className="text-xs text-fg-subtle">{member.build.height}</span>}
                            </div>
                          ) : (
                            <p className="text-xs text-fg-subtle mt-1">No build set</p>
                          )}
                          {/* Show update form only for own entry */}
                          {member.userId === session.user?.id && (
                            <BuildUpdateForm
                              squadId={selectedSquad.id}
                              userId={member.userId}
                              currentBuild={member.build}
                              onUpdated={() => fetchSquadDetail(selectedSquad.id)}
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI Analysis */}
                <AIAnalysisPanel
                  analysis={selectedSquad.aiAnalysis}
                  onAnalyze={handleAnalyze}
                  analyzing={analyzing}
                  members={selectedMembers}
                />
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="card p-12 text-center"
              >
                <Users2 className="w-12 h-12 text-fg-subtle mx-auto mb-4" />
                <p className="text-fg-muted">Select a squad from the left to view details, or create a new one.</p>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
