'use client'
import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wand2, Lock, TrendingUp, Sparkles, ChevronDown, ChevronUp, Info } from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import { cn } from '@/lib/utils'

// Badge requirements — (attribute, [Bronze, Silver, Gold, HoF, Legend])
const BADGE_REQS: Record<string, { attr: string; reqs: number[]; cat: string }> = {
  'Deadeye':           { attr: 'three_point',        reqs: [60, 70, 80, 88, 95], cat: 'Shooting' },
  'Set Shot Specialist':{ attr: 'three_point',       reqs: [60, 70, 80, 88, 95], cat: 'Shooting' },
  'Shifty Shooter':    { attr: 'ball_handle',         reqs: [65, 73, 82, 90, 96], cat: 'Shooting' },
  'Limitless Range':   { attr: 'three_point',         reqs: [68, 76, 84, 92, 97], cat: 'Shooting' },
  'Mini Marksman':     { attr: 'three_point',         reqs: [55, 65, 75, 85, 92], cat: 'Shooting' },
  'Lightning Launch':  { attr: 'speed',               reqs: [60, 70, 78, 86, 93], cat: 'Finishing' },
  'Posterizer':        { attr: 'driving_dunk',        reqs: [70, 78, 85, 92, 97], cat: 'Finishing' },
  'Rise Up':           { attr: 'standing_dunk',       reqs: [65, 75, 83, 90, 96], cat: 'Finishing' },
  'High-Flying Denier':{ attr: 'driving_dunk',        reqs: [68, 76, 84, 91, 96], cat: 'Finishing' },
  'Float Game':        { attr: 'driving_layup',       reqs: [60, 70, 78, 86, 93], cat: 'Finishing' },
  'Layup Mixmaster':   { attr: 'driving_layup',       reqs: [55, 65, 75, 85, 92], cat: 'Finishing' },
  'Aerial Wizard':     { attr: 'driving_dunk',        reqs: [62, 72, 80, 88, 94], cat: 'Finishing' },
  'Post Up Poet':      { attr: 'post_control',        reqs: [55, 65, 75, 85, 92], cat: 'Finishing' },
  'Dimer':             { attr: 'pass_accuracy',       reqs: [65, 73, 82, 90, 96], cat: 'Playmaking' },
  'Strong Handle':     { attr: 'ball_handle',         reqs: [65, 73, 82, 90, 96], cat: 'Playmaking' },
  'Handles for Days':  { attr: 'ball_handle',         reqs: [70, 78, 86, 93, 98], cat: 'Playmaking' },
  'Break Starter':     { attr: 'pass_accuracy',       reqs: [60, 70, 78, 86, 93], cat: 'Playmaking' },
  'Versatile Visionary':{ attr: 'pass_accuracy',      reqs: [65, 75, 83, 90, 96], cat: 'Playmaking' },
  'Ankle Assassin':    { attr: 'ball_handle',         reqs: [65, 73, 82, 90, 96], cat: 'Playmaking' },
  'Unpluckable':       { attr: 'ball_handle',         reqs: [60, 70, 78, 86, 93], cat: 'Playmaking' },
  'Pick Dodger':       { attr: 'speed',               reqs: [58, 68, 76, 84, 91], cat: 'Playmaking' },
  'Challenger':        { attr: 'perimeter_defense',   reqs: [60, 70, 78, 86, 93], cat: 'Defense' },
  'Interceptor':       { attr: 'steal',               reqs: [55, 65, 75, 85, 92], cat: 'Defense' },
  'Pogo Stick':        { attr: 'block',               reqs: [65, 73, 82, 90, 96], cat: 'Defense' },
  'Rebound Chaser':    { attr: 'defensive_rebound',   reqs: [60, 70, 78, 86, 93], cat: 'Defense' },
  'On-Ball Menace':    { attr: 'perimeter_defense',   reqs: [60, 70, 78, 86, 93], cat: 'Defense' },
  'Immovable Enforcer':{ attr: 'interior_defense',    reqs: [65, 73, 82, 90, 96], cat: 'Defense' },
  'Boxout Beast':      { attr: 'defensive_rebound',   reqs: [55, 65, 75, 85, 92], cat: 'Defense' },
  'Paint Patroller':   { attr: 'interior_defense',    reqs: [60, 70, 78, 86, 93], cat: 'Defense' },
  'Brick Wall':        { attr: 'strength',            reqs: [60, 70, 78, 86, 93], cat: 'Defense' },
  'Off-Ball Pest':     { attr: 'perimeter_defense',   reqs: [55, 65, 75, 83, 90], cat: 'Defense' },
  'Glove':             { attr: 'steal',               reqs: [55, 65, 75, 85, 92], cat: 'Defense' },
}

const ATTR_LABELS: Record<string, string> = {
  three_point: 'Three-Point', ball_handle: 'Ball Handle', pass_accuracy: 'Pass Accuracy',
  driving_dunk: 'Driving Dunk', standing_dunk: 'Standing Dunk', driving_layup: 'Driving Layup',
  speed: 'Speed', acceleration: 'Acceleration', perimeter_defense: 'Perimeter Defense',
  interior_defense: 'Interior Defense', steal: 'Steal', block: 'Block',
  defensive_rebound: 'Def. Rebound', strength: 'Strength', post_control: 'Post Control',
}

const LEVELS = ['Bronze', 'Silver', 'Gold', 'HoF', 'Legend']
const LEVEL_COLORS = [
  { bg: 'bg-amber-800/40', text: 'text-amber-500', border: 'border-amber-700/40' },
  { bg: 'bg-zinc-600/40',  text: 'text-zinc-300',  border: 'border-zinc-500/40' },
  { bg: 'bg-yellow-500/20', text: 'text-yellow-300', border: 'border-yellow-500/40' },
  { bg: 'bg-violet-500/20', text: 'text-violet-300', border: 'border-violet-500/40' },
  { bg: 'bg-rose-500/20',   text: 'text-rose-300',   border: 'border-rose-500/40' },
]

const CAT_COLORS: Record<string, string> = {
  Finishing: 'text-orange-400',
  Shooting:  'text-yellow-400',
  Playmaking:'text-blue-400',
  Defense:   'text-emerald-400',
}

const CATS = ['All', 'Finishing', 'Shooting', 'Playmaking', 'Defense']

// VC cost per upgrade point (from vc-calc logic)
function vcBetween(from: number, to: number): number {
  if (to <= from) return 0
  let total = 0
  for (let i = from; i < to; i++) {
    if (i < 60) total += 100
    else if (i < 70) total += 200
    else if (i < 75) total += 350
    else if (i < 80) total += 500
    else if (i < 85) total += 750
    else if (i < 88) total += 1000
    else if (i < 90) total += 1500
    else if (i < 92) total += 2200
    else if (i < 94) total += 3000
    else if (i < 96) total += 4000
    else if (i < 98) total += 6000
    else total += 9000
  }
  return total
}

const ALL_BADGES = Object.keys(BADGE_REQS)

export default function BuildPlannerPage() {
  const [currentAttrs, setCurrentAttrs] = useState<Record<string, number>>({})
  const [selectedBadges, setSelectedBadges] = useState<string[]>([])
  const [targetLevels, setTargetLevels] = useState<Record<string, number>>({}) // 0–4 index
  const [catFilter, setCatFilter] = useState('All')
  const [expandedCat, setExpandedCat] = useState<string | null>('Shooting')

  const toggleBadge = (name: string) => {
    setSelectedBadges((prev) =>
      prev.includes(name) ? prev.filter((b) => b !== name) : [...prev, name]
    )
    if (!targetLevels[name]) {
      setTargetLevels((prev) => ({ ...prev, [name]: 2 })) // default Gold
    }
  }

  const setAttr = (key: string, val: number) => {
    setCurrentAttrs((prev) => ({ ...prev, [key]: Math.max(25, Math.min(99, val)) }))
  }

  const setTarget = (badge: string, lvl: number) => {
    setTargetLevels((prev) => ({ ...prev, [badge]: lvl }))
  }

  // For each selected badge, compute upgrade needed
  const plan = useMemo(() => {
    return selectedBadges.map((name) => {
      const req = BADGE_REQS[name]
      if (!req) return null
      const targetLvlIdx = targetLevels[name] ?? 2
      const neededAttr = req.reqs[targetLvlIdx]
      const currentVal = currentAttrs[req.attr] ?? 75
      const gap = Math.max(0, neededAttr - currentVal)
      const vc = gap > 0 ? vcBetween(currentVal, neededAttr) : 0
      const alreadyUnlocked = currentVal >= neededAttr

      // Find highest level already unlocked
      let highestUnlocked = -1
      for (let i = 4; i >= 0; i--) {
        if (currentVal >= req.reqs[i]) { highestUnlocked = i; break }
      }

      return { name, req, targetLvlIdx, neededAttr, currentVal, gap, vc, alreadyUnlocked, highestUnlocked }
    }).filter(Boolean)
  }, [selectedBadges, currentAttrs, targetLevels])

  const totalVC = plan.reduce((sum, p) => sum + (p?.vc ?? 0), 0)
  const uniqueAttrsNeeded = [...new Set(plan.filter((p) => !p?.alreadyUnlocked).map((p) => p!.req.attr))]

  const filteredBadges = ALL_BADGES.filter((b) => {
    if (catFilter !== 'All' && BADGE_REQS[b].cat !== catFilter) return false
    return true
  })

  const groupedBadges = CATS.slice(1).map((cat) => ({
    cat,
    badges: filteredBadges.filter((b) => BADGE_REQS[b].cat === cat)
  })).filter((g) => g.badges.length > 0 && (catFilter === 'All' || catFilter === g.cat))

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-16">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <Wand2 className="w-5 h-5 text-rose-400" />
            <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">Build Planner</span>
          </div>
          <h1 className="text-3xl font-bold text-fg">Badge Upgrade Planner</h1>
          <p className="text-fg-muted mt-1">Pick badges you want, set your current stats, see exactly what you need to unlock each level.</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left — Badge picker */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex gap-1.5 flex-wrap mb-2">
              {CATS.map((c) => (
                <button
                  key={c}
                  onClick={() => setCatFilter(c)}
                  className={cn(
                    'chip cursor-pointer transition-all text-xs',
                    catFilter === c ? 'text-rose-400 border-rose-500/40 bg-rose-500/15' : 'hover:border-white/20'
                  )}
                >
                  {c}
                </button>
              ))}
            </div>

            {groupedBadges.map(({ cat, badges }) => (
              <motion.div
                key={cat}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="card overflow-hidden"
              >
                <button
                  className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02]"
                  onClick={() => setExpandedCat(expandedCat === cat ? null : cat)}
                >
                  <span className={cn('font-semibold text-sm', CAT_COLORS[cat])}>{cat}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-fg-subtle">
                      {selectedBadges.filter((b) => BADGE_REQS[b]?.cat === cat).length} selected
                    </span>
                    {expandedCat === cat
                      ? <ChevronUp className="w-4 h-4 text-fg-subtle" />
                      : <ChevronDown className="w-4 h-4 text-fg-subtle" />
                    }
                  </div>
                </button>
                <AnimatePresence>
                  {expandedCat === cat && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden px-4 pb-4"
                    >
                      <div className="flex flex-wrap gap-1.5">
                        {badges.map((badge) => {
                          const selected = selectedBadges.includes(badge)
                          return (
                            <button
                              key={badge}
                              onClick={() => toggleBadge(badge)}
                              className={cn(
                                'chip cursor-pointer transition-all text-xs',
                                selected
                                  ? 'text-rose-400 border-rose-500/40 bg-rose-500/15'
                                  : 'hover:border-white/20'
                              )}
                            >
                              {badge}
                            </button>
                          )
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}

            {/* Current attribute inputs */}
            {uniqueAttrsNeeded.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Info className="w-4 h-4 text-sky-400" />
                  <h3 className="font-semibold text-fg text-sm">Your Current Attributes</h3>
                </div>
                <p className="text-xs text-fg-muted mb-4">Enter your current ratings for the attributes your target badges need.</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {uniqueAttrsNeeded.map((attr) => (
                    <div key={attr}>
                      <label className="block text-xs font-semibold text-fg-muted mb-1 uppercase tracking-wider">
                        {ATTR_LABELS[attr] || attr}
                      </label>
                      <input
                        type="number"
                        min={25}
                        max={99}
                        value={currentAttrs[attr] ?? 75}
                        onChange={(e) => setAttr(attr, parseInt(e.target.value) || 25)}
                        className="input text-center text-sm py-1.5"
                      />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Right — Upgrade plan */}
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="card p-5 sticky top-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-rose-400" />
                <h2 className="font-semibold text-fg">Upgrade Plan</h2>
              </div>

              {plan.length === 0 ? (
                <div className="text-center py-8">
                  <Lock className="w-8 h-8 text-fg-subtle mx-auto mb-2" />
                  <p className="text-sm text-fg-muted">Select badges from the left to build your upgrade plan.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3 mb-4 max-h-[400px] overflow-y-auto pr-1">
                    {plan.map((p) => {
                      if (!p) return null
                      const lvlCfg = LEVEL_COLORS[p.targetLvlIdx]
                      return (
                        <div key={p.name} className="card bg-white/[0.02] p-3 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs font-semibold text-fg">{p.name}</p>
                            <select
                              value={p.targetLvlIdx}
                              onChange={(e) => setTarget(p.name, parseInt(e.target.value))}
                              className="text-[10px] bg-transparent border border-white/10 rounded px-1 py-0.5 text-fg-muted"
                            >
                              {LEVELS.map((l, i) => (
                                <option key={l} value={i}>{l}</option>
                              ))}
                            </select>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs text-fg-subtle">{ATTR_LABELS[p.req.attr] || p.req.attr}:</span>
                            <span className="text-xs font-bold text-fg">{p.currentVal}</span>
                            {!p.alreadyUnlocked && (
                              <>
                                <span className="text-xs text-fg-subtle">→</span>
                                <span className="text-xs font-bold text-emerald-400">{p.neededAttr}</span>
                              </>
                            )}
                          </div>

                          {p.alreadyUnlocked ? (
                            <div className={cn('chip text-[10px]', lvlCfg.bg, lvlCfg.text, lvlCfg.border)}>
                              ✓ {LEVELS[p.highestUnlocked]} already unlocked
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] text-fg-muted">
                                +{p.gap} pts needed
                              </span>
                              <span className="text-[11px] font-semibold text-amber-400">
                                {p.vc.toLocaleString()} VC
                              </span>
                            </div>
                          )}

                          {/* Progress bar to target */}
                          <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                            <motion.div
                              className="h-full rounded-full bg-gradient-to-r from-rose-500 to-violet-500"
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min((p.currentVal / p.neededAttr) * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <div className="h-px bg-white/5 mb-4" />

                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-fg-muted">Total VC to upgrade</span>
                    <span className="font-bold text-lg text-amber-400">{totalVC.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-fg-subtle">Badges planned</span>
                    <span className="text-xs font-semibold text-fg">{plan.length}</span>
                  </div>

                  {totalVC > 0 && (
                    <div className="mt-4 card bg-amber-500/5 border-amber-500/20 p-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-xs font-semibold text-amber-300">Need VC?</span>
                      </div>
                      <p className="text-xs text-fg-muted">
                        Use the <a href="/vc-calc" className="text-amber-400 hover:underline">VC Calculator</a> to find the cheapest bundle.
                      </p>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
