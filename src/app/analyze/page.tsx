'use client'
import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload, Zap, Brain, TrendingUp, Shield, Target,
  ChevronDown, ChevronUp, Plus, X, AlertTriangle,
  CheckCircle2, ArrowRight, BarChart2, RefreshCw, ImageIcon,
  BookmarkPlus, Bookmark, Globe, Lock,
} from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import { AIAnalysis, BuildAttributes } from '@/types'
import { cn, POSITIONS, META_CATEGORIES, BADGE_CATEGORIES, BADGE_LEVELS } from '@/lib/utils'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'

const DEFAULT_ATTRS: BuildAttributes = {
  close_shot: 50, driving_layup: 65, driving_dunk: 70, standing_dunk: 25, post_control: 25,
  mid_range: 70, three_point: 80, free_throw: 75,
  pass_accuracy: 75, ball_handle: 87, speed_with_ball: 80,
  interior_defense: 40, perimeter_defense: 60, steal: 50, block: 30,
  offensive_rebound: 30, defensive_rebound: 40,
  speed: 82, acceleration: 84, strength: 55, vertical: 72, stamina: 85,
}

const ATTR_GROUPS = [
  { key: 'Finishing', color: '#E11D48', keys: ['close_shot','driving_layup','driving_dunk','standing_dunk','post_control'] },
  { key: 'Shooting',  color: '#38BDF8', keys: ['mid_range','three_point','free_throw'] },
  { key: 'Playmaking',color: '#8B5CF6', keys: ['pass_accuracy','ball_handle','speed_with_ball'] },
  { key: 'Defense',   color: '#10B981', keys: ['interior_defense','perimeter_defense','steal','block','offensive_rebound','defensive_rebound'] },
  { key: 'Athleticism',color: '#F59E0B', keys: ['speed','acceleration','strength','vertical','stamina'] },
]

function StatBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="stat-bar flex-1">
      <motion.div className="stat-bar-fill" style={{ background: color, width: `${value}%` }} />
    </div>
  )
}

function ScoreRing({ value, color, label }: { value: number; color: string; label: string }) {
  const r = 32, c = 2 * Math.PI * r
  const dash = (value / 100) * c
  return (
    <div className="flex flex-col items-center gap-1.5">
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
      <span className="text-fg-subtle text-xs">{label}</span>
    </div>
  )
}

export default function AnalyzePage() {
  const [mode, setMode] = useState<'manual' | 'image'>('manual')
  const [position, setPosition] = useState('PG')
  const [height, setHeight] = useState("6'4\"")
  const [wingspan, setWingspan] = useState('Normal')
  const [takeover, setTakeover] = useState('')
  const [buildName, setBuildName] = useState('')
  const [category, setCategory] = useState('Park')
  const [attrs, setAttrs] = useState<BuildAttributes>(DEFAULT_ATTRS)
  const [badges, setBadges] = useState<{ name: string; level: string; category: string }[]>([])
  const [badgeInput, setBadgeInput] = useState({ name: '', level: 'Gold', category: 'Finishing' })
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null)
  const [expanded, setExpanded] = useState(['Finishing'])
  const [saving, setSaving] = useState(false)
  const [savedId, setSavedId] = useState<number | null>(null)
  const [isPublic, setIsPublic] = useState(false)
  const { data: session } = useSession()

  const onDrop = useCallback((files: File[]) => {
    const f = files[0]; if (!f) return
    setFile(f); setPreview(URL.createObjectURL(f))
  }, [])
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/*': ['.png','.jpg','.jpeg','.webp'] }, maxFiles: 1, maxSize: 10*1024*1024,
  })

  const setAttr = (k: keyof BuildAttributes, v: number) =>
    setAttrs(p => ({ ...p, [k]: Math.min(99, Math.max(25, v)) }))

  const addBadge = () => {
    if (!badgeInput.name.trim()) return
    setBadges(p => [...p, { ...badgeInput }])
    setBadgeInput(p => ({ ...p, name: '' }))
  }

  const analyze = async () => {
    if (mode === 'manual' && !buildName.trim()) return toast.error('Enter a build name')
    setLoading(true); setAnalysis(null)
    try {
      if (mode === 'image' && file) {
        const fd = new FormData(); fd.append('image', file)
        const r = await fetch('/api/analyze/build', { method: 'POST', body: fd })
        const d = await r.json()
        if (!r.ok) throw new Error(d.error)
        if (d.analysis) { setAnalysis(d.analysis); toast.success('Analysis complete!') }
        else toast('Image extracted — fill details for full analysis', { icon: '🎯' })
      } else {
        const r = await fetch('/api/analyze/build', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ attributes: attrs, badges, position, height, wingspan, takeover, buildName }),
        })
        const d = await r.json()
        if (!r.ok) throw new Error(d.error)
        setAnalysis(d.analysis); toast.success('Analysis complete!')
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Analysis failed')
    } finally {
      setLoading(false)
    }
  }

  const saveBuild = async () => {
    if (!session?.user) { toast.error('Sign in to save builds'); return }
    if (!analysis) return
    setSaving(true)
    try {
      const res = await fetch('/api/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: buildName || 'My Build',
          position, height, wingspan, takeover, category,
          attributes: attrs, badges, analysis, isPublic,
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

  const tierClasses: Record<string, string> = {
    S: 'tier-s', A: 'tier-a', B: 'tier-b', C: 'tier-c', D: 'tier-d',
  }
  const tier = analysis?.meta_viability || 'C'

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-16">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-rose-400" />
            </div>
            <span className="text-rose-400 text-xs font-semibold tracking-widest uppercase">AI Build Analyzer</span>
          </div>
          <h1 className="display text-4xl text-fg mb-1">Analyze Your Build</h1>
          <p className="text-fg-muted text-sm">Enter stats manually or upload a screenshot. Groq AI does the rest.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* ── Left: Input ── */}
          <div className="lg:col-span-3 space-y-4">

            {/* Mode tabs */}
            <div className="card p-1 flex gap-1">
              {(['manual', 'image'] as const).map(m => (
                <button key={m} onClick={() => setMode(m)} className={cn(
                  'flex-1 py-2.5 rounded-lg text-sm font-semibold capitalize flex items-center justify-center gap-2 transition-all',
                  mode === m ? 'bg-rose-500 text-white shadow-[0_2px_8px_rgba(225,29,72,0.4)]' : 'text-fg-muted hover:text-fg'
                )}>
                  {m === 'manual' ? <><BarChart2 className="w-3.5 h-3.5" /> Manual Entry</> : <><ImageIcon className="w-3.5 h-3.5" /> Screenshot</>}
                </button>
              ))}
            </div>

            {mode === 'image' ? (
              <div {...getRootProps()} className={cn(
                'card p-12 border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition-all rounded-xl',
                isDragActive ? 'border-rose-500/60 bg-rose-500/5' : 'border-border hover:border-rose-500/30 hover:bg-surface/60'
              )}>
                <input {...getInputProps()} />
                {preview ? (
                  <div className="relative">
                    <img src={preview} alt="preview" className="max-h-60 rounded-lg object-contain" />
                    <button onClick={e => { e.stopPropagation(); setPreview(null); setFile(null) }}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 rounded-full flex items-center justify-center hover:bg-rose-400 transition-colors">
                      <X className="w-3.5 h-3.5 text-white" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-10 h-10 text-fg-subtle mb-3" />
                    <p className="text-fg font-medium mb-1">Drop your build screenshot</p>
                    <p className="text-fg-subtle text-sm mb-4">PNG, JPG up to 10MB</p>
                    <div className="text-left bg-white/[0.03] border border-white/[0.06] rounded-lg p-3 max-w-sm">
                      <p className="text-xs font-semibold text-fg-muted mb-2 uppercase tracking-wider">Best screenshots</p>
                      <ul className="space-y-1">
                        {[
                          'MyCAREER → MyPLAYER → Attributes screen',
                          'Badge Management screen (shows all equipped)',
                          'Full build summary before confirming',
                        ].map((tip) => (
                          <li key={tip} className="flex items-start gap-1.5 text-xs text-fg-subtle">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400/60 mt-0.5 flex-shrink-0" />
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {/* Build info */}
                <div className="card p-5">
                  <p className="text-xs font-semibold text-fg-muted uppercase tracking-wider mb-4">Build Info</p>
                  <div className="grid grid-cols-2 gap-3">
                    <input className="input col-span-2" placeholder="Build name (e.g. Park God)" value={buildName} onChange={e => setBuildName(e.target.value)} />
                    <select className="select" value={position} onChange={e => setPosition(e.target.value)}>
                      {POSITIONS.map(p => <option key={p}>{p}</option>)}
                    </select>
                    <input className="input" placeholder="Height (e.g. 6'4&quot;)" value={height} onChange={e => setHeight(e.target.value)} />
                    <select className="select" value={wingspan} onChange={e => setWingspan(e.target.value)}>
                      {['Minimum','Below Average','Normal','Above Average','Maximum'].map(w => <option key={w}>{w}</option>)}
                    </select>
                    <input className="input" placeholder="Takeover ability" value={takeover} onChange={e => setTakeover(e.target.value)} />
                    <select className="select col-span-2" value={category} onChange={e => setCategory(e.target.value)}>
                      {META_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                {/* Attributes */}
                <div className="card p-5">
                  <p className="text-xs font-semibold text-fg-muted uppercase tracking-wider mb-4">Attributes</p>
                  <div className="space-y-2">
                    {ATTR_GROUPS.map(({ key, color, keys }) => (
                      <div key={key}>
                        <button onClick={() => setExpanded(p => p.includes(key) ? p.filter(s => s !== key) : [...p, key])}
                          className="flex items-center gap-2.5 w-full py-2 hover:opacity-80 transition-opacity">
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                          <span className="text-sm font-semibold text-fg">{key}</span>
                          <div className="flex-1 h-px bg-border" />
                          {expanded.includes(key) ? <ChevronUp className="w-3.5 h-3.5 text-fg-subtle" /> : <ChevronDown className="w-3.5 h-3.5 text-fg-subtle" />}
                        </button>
                        <AnimatePresence>
                          {expanded.includes(key) && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                              <div className="grid grid-cols-2 gap-x-6 gap-y-3 pt-1 pb-3">
                                {keys.map(k => (
                                  <div key={k}>
                                    <div className="flex justify-between items-center mb-1.5">
                                      <span className="text-fg-muted text-xs capitalize">{k.replace(/_/g,' ')}</span>
                                      <span className="mono text-sm font-semibold text-fg">{attrs[k as keyof BuildAttributes]}</span>
                                    </div>
                                    <input type="range" min={25} max={99}
                                      value={attrs[k as keyof BuildAttributes]}
                                      onChange={e => setAttr(k as keyof BuildAttributes, +e.target.value)}
                                      style={{ accentColor: color }} className="w-full"
                                    />
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Badges */}
                <div className="card p-5">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs font-semibold text-fg-muted uppercase tracking-wider">Badges</p>
                    <span className="chip chip-muted">{badges.length}/40</span>
                  </div>
                  <div className="flex gap-2 mb-3">
                    <input className="input flex-1" placeholder="Badge name" value={badgeInput.name}
                      onChange={e => setBadgeInput(p => ({ ...p, name: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && addBadge()} />
                    <select className="select w-28" value={badgeInput.level} onChange={e => setBadgeInput(p => ({ ...p, level: e.target.value }))}>
                      {BADGE_LEVELS.map(l => <option key={l}>{l}</option>)}
                    </select>
                    <select className="select w-28" value={badgeInput.category} onChange={e => setBadgeInput(p => ({ ...p, category: e.target.value }))}>
                      {BADGE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                    <button onClick={addBadge} className="btn btn-secondary btn-icon flex-shrink-0"><Plus className="w-4 h-4" /></button>
                  </div>
                  {badges.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {badges.map((b, i) => (
                        <span key={i} className={cn('chip flex items-center gap-1.5',
                          b.level === 'Hall of Fame' ? 'badge-hof' :
                          b.level === 'Gold' ? 'badge-gold' :
                          b.level === 'Silver' ? 'badge-silver' : 'badge-bronze'
                        )}>
                          {b.name}
                          <button onClick={() => setBadges(p => p.filter((_,j) => j !== i))} className="hover:opacity-70">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <button onClick={analyze} disabled={loading} className="btn btn-primary btn-lg w-full gap-2.5">
              {loading ? (
                <><span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> Analyzing with Groq AI...</>
              ) : (
                <><Zap className="w-5 h-5" /> Analyze Build</>
              )}
            </button>
          </div>

          {/* ── Right: Results ── */}
          <div className="lg:col-span-2 lg:sticky lg:top-24 self-start">
            <AnimatePresence mode="wait">
              {loading && (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="card p-8 flex flex-col items-center gap-5 min-h-80">
                  <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                    <Brain className="w-7 h-7 text-rose-400 animate-pulse" />
                  </div>
                  <div className="text-center">
                    <p className="text-fg font-semibold mb-1">Analyzing with Groq AI</p>
                    <p className="text-fg-muted text-sm">Processing your build...</p>
                  </div>
                  <div className="w-full space-y-2.5">
                    {[80, 60, 90].map((w, i) => <div key={i} className="skeleton h-3" style={{ width: `${w}%` }} />)}
                  </div>
                </motion.div>
              )}

              {!loading && !analysis && (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="card p-8 flex flex-col items-center gap-4 min-h-80 text-center justify-center">
                  <Zap className="w-10 h-10 text-fg-subtle" />
                  <p className="text-fg-muted text-sm max-w-xs">Fill in your build details and hit Analyze. Your AI breakdown will appear here.</p>
                </motion.div>
              )}

              {!loading && analysis && (
                <motion.div key="results" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} className="space-y-3">

                  {/* Archetype + tier */}
                  <div className="card card-glow p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-fg-subtle text-xs mb-0.5">Archetype</p>
                        <p className="text-fg font-bold">{analysis.archetype}</p>
                      </div>
                      <span className={cn('chip text-sm font-bold px-3 py-1.5', tierClasses[tier])}>{tier}-Tier</span>
                    </div>
                    <p className="text-fg-muted text-sm leading-relaxed border-l-2 border-rose-500/40 pl-3 italic">
                      &quot;{analysis.playstyle_summary}&quot;
                    </p>
                  </div>

                  {/* Score rings */}
                  <div className="card p-5">
                    <p className="text-xs font-semibold text-fg-muted uppercase tracking-wider mb-5">Performance</p>
                    <div className="flex justify-around">
                      <ScoreRing value={analysis.overall_rating} color="#E11D48" label="Overall" />
                      <ScoreRing value={analysis.competitiveness} color="#8B5CF6" label="Competitive" />
                      <ScoreRing value={analysis.skill_ceiling} color="#38BDF8" label="Ceiling" />
                    </div>
                  </div>

                  {/* Strengths + Weaknesses */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="card p-4">
                      <p className="text-emerald-400 text-xs font-semibold flex items-center gap-1.5 mb-3">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Strengths
                      </p>
                      <ul className="space-y-2">
                        {analysis.strengths.slice(0,3).map((s,i) => (
                          <li key={i} className="text-fg-muted text-xs flex items-start gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />{s}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="card p-4">
                      <p className="text-rose-400 text-xs font-semibold flex items-center gap-1.5 mb-3">
                        <AlertTriangle className="w-3.5 h-3.5" /> Weaknesses
                      </p>
                      <ul className="space-y-2">
                        {analysis.weaknesses.slice(0,3).map((w,i) => (
                          <li key={i} className="text-fg-muted text-xs flex items-start gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-rose-400 mt-1.5 flex-shrink-0" />{w}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Roles */}
                  <div className="card p-4 space-y-3">
                    <div>
                      <p className="text-fg-subtle text-xs flex items-center gap-1.5 mb-1">
                        <Target className="w-3 h-3 text-sky-400" /> Offensive Role
                      </p>
                      <p className="text-fg text-sm">{analysis.offensive_role}</p>
                    </div>
                    <div className="divider" />
                    <div>
                      <p className="text-fg-subtle text-xs flex items-center gap-1.5 mb-1">
                        <Shield className="w-3 h-3 text-emerald-400" /> Defensive Role
                      </p>
                      <p className="text-fg text-sm">{analysis.defensive_role}</p>
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="card p-4">
                    <p className="text-xs font-semibold text-fg-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                      <TrendingUp className="w-3.5 h-3.5 text-rose-400" /> AI Recommendations
                    </p>
                    <div className="space-y-2.5">
                      {analysis.upgrade_recommendations.slice(0,2).map((r,i) => (
                        <div key={i} className="flex gap-2 text-xs">
                          <span className="text-amber-400 font-semibold flex-shrink-0">Upgrade</span>
                          <span className="text-fg-muted">{r}</span>
                        </div>
                      ))}
                      {analysis.badge_recommendations.slice(0,2).map((r,i) => (
                        <div key={i} className="flex gap-2 text-xs">
                          <span className="text-violet-400 font-semibold flex-shrink-0">Badge</span>
                          <span className="text-fg-muted">{r}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Takeover */}
                  <div className="card p-4 border-violet-500/20 bg-violet-500/5">
                    <p className="text-fg-subtle text-xs mb-1">Recommended Takeover</p>
                    <p className="text-fg font-semibold text-sm">{analysis.takeover_recommendation}</p>
                  </div>

                  {/* Save to Profile */}
                  {session?.user && (
                    <div className="card p-4 space-y-3">
                      <p className="text-xs font-semibold text-fg-muted uppercase tracking-wider">Save Build</p>
                      <label className="flex items-center gap-2.5 cursor-pointer select-none">
                        <button
                          onClick={() => setIsPublic(p => !p)}
                          className={cn(
                            'w-9 h-5 rounded-full transition-colors relative flex-shrink-0',
                            isPublic ? 'bg-emerald-500' : 'bg-white/10'
                          )}
                        >
                          <span className={cn(
                            'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform',
                            isPublic ? 'translate-x-4' : 'translate-x-0.5'
                          )} />
                        </button>
                        <span className="flex items-center gap-1.5 text-xs text-fg-muted">
                          {isPublic ? <Globe className="w-3 h-3 text-emerald-400" /> : <Lock className="w-3 h-3" />}
                          {isPublic ? 'Public — visible in community builds' : 'Private — only you can see this'}
                        </span>
                      </label>
                      <button
                        onClick={saveBuild}
                        disabled={saving || !!savedId}
                        className={cn(
                          'btn w-full gap-2',
                          savedId ? 'btn-secondary text-emerald-400' : 'btn-primary'
                        )}
                      >
                        {saving ? (
                          <><span className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" /> Saving...</>
                        ) : savedId ? (
                          <><Bookmark className="w-4 h-4" /> Saved to Profile</>
                        ) : (
                          <><BookmarkPlus className="w-4 h-4" /> Save to Profile</>
                        )}
                      </button>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button onClick={() => { setAnalysis(null); setSavedId(null) }} className="btn btn-secondary flex-1 gap-2">
                      <RefreshCw className="w-4 h-4" /> Reset
                    </button>
                    <button
                      onClick={() => navigator.clipboard.writeText(window.location.href).then(() => toast.success('Link copied!'))}
                      className="btn btn-secondary flex-1 gap-2"
                    >
                      Share <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
