'use client'
import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload, Zap, Brain, TrendingUp, Shield, Target,
  ChevronDown, ChevronUp, Plus, X, Star, AlertTriangle,
  CheckCircle2, ArrowRight, BarChart2, RefreshCw,
} from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { AIAnalysis, BuildAttributes } from '@/types'
import { cn, getMetaTierColor, POSITIONS, META_CATEGORIES, BADGE_CATEGORIES, BADGE_LEVELS } from '@/lib/utils'
import toast from 'react-hot-toast'

const DEFAULT_ATTRS: BuildAttributes = {
  close_shot: 25, driving_layup: 25, driving_dunk: 25, standing_dunk: 25, post_control: 25,
  mid_range: 25, three_point: 25, free_throw: 50,
  pass_accuracy: 25, ball_handle: 25, speed_with_ball: 25,
  interior_defense: 25, perimeter_defense: 25, steal: 25, block: 25,
  offensive_rebound: 25, defensive_rebound: 25,
  speed: 25, acceleration: 25, strength: 25, vertical: 25, stamina: 75,
}

const ATTR_GROUPS = [
  { label: 'Finishing', color: '#DC143C', keys: ['close_shot', 'driving_layup', 'driving_dunk', 'standing_dunk', 'post_control'] },
  { label: 'Shooting', color: '#00D4FF', keys: ['mid_range', 'three_point', 'free_throw'] },
  { label: 'Playmaking', color: '#7C3AED', keys: ['pass_accuracy', 'ball_handle', 'speed_with_ball'] },
  { label: 'Defense', color: '#00FF87', keys: ['interior_defense', 'perimeter_defense', 'steal', 'block', 'offensive_rebound', 'defensive_rebound'] },
  { label: 'Athleticism', color: '#FFB800', keys: ['speed', 'acceleration', 'strength', 'vertical', 'stamina'] },
]

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
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null)
  const [expandedSections, setExpandedSections] = useState<string[]>(['Finishing'])

  const onDrop = useCallback((files: File[]) => {
    const file = files[0]
    if (!file) return
    setUploadedFile(file)
    const url = URL.createObjectURL(file)
    setPreview(url)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  })

  const handleAttrChange = (key: keyof BuildAttributes, val: number) => {
    setAttrs((prev) => ({ ...prev, [key]: Math.min(99, Math.max(25, val)) }))
  }

  const addBadge = () => {
    if (!badgeInput.name.trim()) return
    setBadges((prev) => [...prev, { ...badgeInput }])
    setBadgeInput((prev) => ({ ...prev, name: '' }))
  }

  const removeBadge = (i: number) => setBadges((prev) => prev.filter((_, j) => j !== i))

  const toggleSection = (label: string) => {
    setExpandedSections((prev) =>
      prev.includes(label) ? prev.filter((s) => s !== label) : [...prev, label]
    )
  }

  const analyze = async () => {
    setLoading(true)
    setAnalysis(null)

    try {
      if (mode === 'image' && uploadedFile) {
        const fd = new FormData()
        fd.append('image', uploadedFile)
        const res = await fetch('/api/analyze/build', { method: 'POST', body: fd })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        if (data.analysis) setAnalysis(data.analysis)
        else toast('Image extracted — switch to manual mode to fine-tune.', { icon: '🎯' })
      } else {
        if (!buildName) return toast.error('Enter a build name first')
        const res = await fetch('/api/analyze/build', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ attributes: attrs, badges, position, height, wingspan, takeover, buildName }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        setAnalysis(data.analysis)
        toast.success('Analysis complete!')
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Analysis failed'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const metaTierClass = analysis ? getMetaTierColor(analysis.meta_viability) : ''

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        <div className="mb-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-crimson/10 border border-crimson/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-crimson" />
              </div>
              <span className="text-crimson text-sm font-semibold tracking-wider uppercase">AI Build Analyzer</span>
            </div>
            <h1 className="text-4xl font-black font-display text-text-primary mb-2">Analyze Your Build</h1>
            <p className="text-text-secondary">Upload a screenshot or enter your stats manually for instant AI analysis.</p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Input Panel */}
          <div className="lg:col-span-3 space-y-6">
            {/* Mode toggle */}
            <div className="glass-card p-1 flex gap-1">
              {(['manual', 'image'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={cn(
                    'flex-1 py-2.5 rounded-xl text-sm font-semibold capitalize transition-all',
                    mode === m
                      ? 'bg-crimson text-white shadow-crimson'
                      : 'text-text-secondary hover:text-text-primary'
                  )}
                >
                  {m === 'manual' ? 'Manual Entry' : 'Screenshot Upload'}
                </button>
              ))}
            </div>

            {mode === 'image' ? (
              <div
                {...getRootProps()}
                className={cn(
                  'glass-card p-12 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all',
                  isDragActive
                    ? 'border-crimson bg-crimson/5 shadow-crimson'
                    : 'border-border hover:border-crimson/40 hover:bg-surface/50'
                )}
              >
                <input {...getInputProps()} />
                {preview ? (
                  <div className="relative">
                    <img src={preview} alt="Build screenshot" className="max-h-64 rounded-xl object-contain" />
                    <button
                      onClick={(e) => { e.stopPropagation(); setPreview(null); setUploadedFile(null) }}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-crimson rounded-full flex items-center justify-center"
                    >
                      <X className="w-3.5 h-3.5 text-white" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-12 h-12 text-text-muted mb-4" />
                    <p className="text-text-primary font-semibold mb-1">Drop your build screenshot here</p>
                    <p className="text-text-muted text-sm">PNG, JPG up to 10MB</p>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Basic info */}
                <div className="glass-card p-5">
                  <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
                    <Brain className="w-4 h-4 text-crimson" /> Build Info
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      placeholder="Build name (e.g. Park God)"
                      value={buildName}
                      onChange={(e) => setBuildName(e.target.value)}
                      className="col-span-2"
                    />
                    <select
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                      className="input-dark"
                    >
                      {POSITIONS.map((p) => <option key={p}>{p}</option>)}
                    </select>
                    <Input
                      placeholder="Height (e.g. 6'4&quot;)"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                    />
                    <select
                      value={wingspan}
                      onChange={(e) => setWingspan(e.target.value)}
                      className="input-dark"
                    >
                      {['Minimum', 'Below Average', 'Normal', 'Above Average', 'Maximum'].map((w) => (
                        <option key={w}>{w}</option>
                      ))}
                    </select>
                    <Input
                      placeholder="Takeover (e.g. Limitless Shooter)"
                      value={takeover}
                      onChange={(e) => setTakeover(e.target.value)}
                    />
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="input-dark col-span-2"
                    >
                      {META_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                {/* Attributes */}
                <div className="glass-card p-5">
                  <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-crimson" /> Attributes
                  </h3>
                  <div className="space-y-3">
                    {ATTR_GROUPS.map(({ label, color, keys }) => (
                      <div key={label}>
                        <button
                          onClick={() => toggleSection(label)}
                          className="flex items-center gap-2 w-full text-left py-2"
                        >
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                          <span className="text-sm font-semibold text-text-primary">{label}</span>
                          <div className="flex-1 h-px bg-border ml-2" />
                          {expandedSections.includes(label) ? (
                            <ChevronUp className="w-3.5 h-3.5 text-text-muted" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-text-muted" />
                          )}
                        </button>
                        <AnimatePresence>
                          {expandedSections.includes(label) && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="grid grid-cols-2 gap-3 pb-3">
                                {keys.map((key) => (
                                  <div key={key}>
                                    <div className="flex justify-between text-xs mb-1">
                                      <span className="text-text-muted capitalize">{key.replace(/_/g, ' ')}</span>
                                      <span className="text-text-primary font-mono font-bold">{attrs[key as keyof BuildAttributes]}</span>
                                    </div>
                                    <input
                                      type="range"
                                      min={25}
                                      max={99}
                                      value={attrs[key as keyof BuildAttributes]}
                                      onChange={(e) => handleAttrChange(key as keyof BuildAttributes, parseInt(e.target.value))}
                                      className="w-full h-1.5 rounded-full cursor-pointer accent-crimson"
                                      style={{ accentColor: color }}
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
                <div className="glass-card p-5">
                  <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
                    <Star className="w-4 h-4 text-crimson" /> Badges
                    <span className="ml-auto text-xs text-text-muted">{badges.length}/40</span>
                  </h3>
                  <div className="flex gap-2 mb-3">
                    <Input
                      placeholder="Badge name"
                      value={badgeInput.name}
                      onChange={(e) => setBadgeInput((p) => ({ ...p, name: e.target.value }))}
                      onKeyDown={(e) => e.key === 'Enter' && addBadge()}
                      className="flex-1"
                    />
                    <select
                      value={badgeInput.level}
                      onChange={(e) => setBadgeInput((p) => ({ ...p, level: e.target.value }))}
                      className="input-dark w-28"
                    >
                      {BADGE_LEVELS.map((l) => <option key={l}>{l}</option>)}
                    </select>
                    <select
                      value={badgeInput.category}
                      onChange={(e) => setBadgeInput((p) => ({ ...p, category: e.target.value }))}
                      className="input-dark w-28"
                    >
                      {BADGE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                    </select>
                    <Button size="icon" onClick={addBadge} variant="secondary">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  {badges.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {badges.map((b, i) => (
                        <div
                          key={i}
                          className={cn(
                            'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border',
                            b.level === 'Hall of Fame' ? 'badge-hof' :
                            b.level === 'Gold' ? 'badge-gold' :
                            b.level === 'Silver' ? 'badge-silver' : 'badge-bronze'
                          )}
                        >
                          {b.name}
                          <button onClick={() => removeBadge(i)} className="ml-0.5 hover:opacity-70">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <Button
              className="w-full gap-3 text-base h-13 shadow-crimson"
              onClick={analyze}
              loading={loading}
            >
              <Zap className="w-5 h-5" />
              {loading ? 'Analyzing with Groq AI...' : 'Analyze Build'}
            </Button>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {loading && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="glass-card p-8 flex flex-col items-center justify-center gap-4 min-h-[400px]"
                >
                  <div className="w-16 h-16 rounded-2xl bg-crimson/10 border border-crimson/20 flex items-center justify-center">
                    <Brain className="w-8 h-8 text-crimson animate-pulse" />
                  </div>
                  <div className="text-center">
                    <p className="text-text-primary font-semibold mb-1">Analyzing with Groq AI</p>
                    <p className="text-text-muted text-sm">Processing build data...</p>
                  </div>
                  <div className="w-full max-w-xs">
                    <div className="shimmer h-1.5 rounded-full bg-muted" />
                  </div>
                </motion.div>
              )}

              {!loading && !analysis && (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="glass-card p-8 flex flex-col items-center justify-center gap-4 min-h-[400px] text-center"
                >
                  <Zap className="w-12 h-12 text-text-muted" />
                  <p className="text-text-secondary">Enter your build details and click Analyze to get your AI breakdown.</p>
                </motion.div>
              )}

              {!loading && analysis && (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4"
                >
                  {/* Header card */}
                  <div className="glass-card p-5 border border-crimson/20">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-xs text-text-muted mb-1">Archetype</p>
                        <p className="text-text-primary font-bold">{analysis.archetype}</p>
                      </div>
                      <div className={cn('px-3 py-1.5 rounded-xl border font-bold text-lg', metaTierClass)}>
                        {analysis.meta_viability}-Tier
                      </div>
                    </div>
                    <p className="text-text-secondary text-sm leading-relaxed italic border-l-2 border-crimson pl-3">
                      "{analysis.playstyle_summary}"
                    </p>
                  </div>

                  {/* Scores */}
                  <div className="glass-card p-5">
                    <h4 className="text-sm font-semibold text-text-primary mb-4">Performance Scores</h4>
                    <div className="space-y-3">
                      {[
                        { label: 'Overall Rating', value: analysis.overall_rating, color: '#DC143C' },
                        { label: 'Competitiveness', value: analysis.competitiveness, color: '#7C3AED' },
                        { label: 'Skill Ceiling', value: analysis.skill_ceiling, color: '#00D4FF' },
                      ].map(({ label, value, color }) => (
                        <div key={label}>
                          <div className="flex justify-between text-xs mb-1.5">
                            <span className="text-text-secondary">{label}</span>
                            <span className="text-text-primary font-mono font-bold">{value}/100</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${value}%` }}
                              transition={{ duration: 1, delay: 0.2 }}
                              className="h-full rounded-full"
                              style={{ background: color }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Strengths & Weaknesses */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="glass-card p-4">
                      <h4 className="text-xs font-semibold text-green-400 mb-3 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Strengths
                      </h4>
                      <ul className="space-y-1.5">
                        {analysis.strengths.map((s, i) => (
                          <li key={i} className="text-xs text-text-secondary flex items-start gap-1.5">
                            <div className="w-1 h-1 rounded-full bg-green-400 mt-1.5 flex-shrink-0" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="glass-card p-4">
                      <h4 className="text-xs font-semibold text-crimson mb-3 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" /> Weaknesses
                      </h4>
                      <ul className="space-y-1.5">
                        {analysis.weaknesses.map((w, i) => (
                          <li key={i} className="text-xs text-text-secondary flex items-start gap-1.5">
                            <div className="w-1 h-1 rounded-full bg-crimson mt-1.5 flex-shrink-0" />
                            {w}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Roles */}
                  <div className="glass-card p-5 space-y-3">
                    <div>
                      <p className="text-xs text-text-muted mb-1 flex items-center gap-1.5">
                        <Target className="w-3 h-3 text-neon-blue" /> Offensive Role
                      </p>
                      <p className="text-sm text-text-primary">{analysis.offensive_role}</p>
                    </div>
                    <div className="h-px bg-border" />
                    <div>
                      <p className="text-xs text-text-muted mb-1 flex items-center gap-1.5">
                        <Shield className="w-3 h-3 text-green-400" /> Defensive Role
                      </p>
                      <p className="text-sm text-text-primary">{analysis.defensive_role}</p>
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="glass-card p-5">
                    <h4 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-crimson" /> AI Recommendations
                    </h4>
                    <div className="space-y-2">
                      {[
                        ...analysis.upgrade_recommendations.map((r) => ({ type: 'Upgrade', text: r, color: 'text-yellow-400' })),
                        ...analysis.badge_recommendations.slice(0, 2).map((r) => ({ type: 'Badge', text: r, color: 'text-purple-400' })),
                      ].map(({ type, text, color }, i) => (
                        <div key={i} className="flex items-start gap-2.5 text-xs">
                          <span className={`${color} font-semibold flex-shrink-0`}>{type}</span>
                          <span className="text-text-secondary">{text}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Takeover */}
                  <div className="glass-card p-4 border border-purple-500/20">
                    <p className="text-xs text-text-muted mb-1">Recommended Takeover</p>
                    <p className="text-text-primary font-semibold text-sm">{analysis.takeover_recommendation}</p>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="secondary"
                      className="flex-1 gap-2"
                      onClick={() => setAnalysis(null)}
                    >
                      <RefreshCw className="w-4 h-4" />
                      New Analysis
                    </Button>
                    <Button className="flex-1 gap-2">
                      Share Build <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}
