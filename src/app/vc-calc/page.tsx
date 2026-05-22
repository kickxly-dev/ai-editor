'use client'
import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calculator, ChevronDown, ChevronUp, Sparkles, DollarSign, TrendingUp, Info } from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'

const ATTRIBUTES = [
  { key: 'close_shot', label: 'Close Shot', cat: 'Finishing' },
  { key: 'driving_layup', label: 'Driving Layup', cat: 'Finishing' },
  { key: 'driving_dunk', label: 'Driving Dunk', cat: 'Finishing' },
  { key: 'standing_dunk', label: 'Standing Dunk', cat: 'Finishing' },
  { key: 'post_control', label: 'Post Control', cat: 'Finishing' },
  { key: 'mid_range', label: 'Mid-Range', cat: 'Shooting' },
  { key: 'three_point', label: 'Three-Point', cat: 'Shooting' },
  { key: 'free_throw', label: 'Free Throw', cat: 'Shooting' },
  { key: 'pass_accuracy', label: 'Pass Accuracy', cat: 'Playmaking' },
  { key: 'ball_handle', label: 'Ball Handle', cat: 'Playmaking' },
  { key: 'speed_with_ball', label: 'Speed with Ball', cat: 'Playmaking' },
  { key: 'interior_defense', label: 'Interior Defense', cat: 'Defense' },
  { key: 'perimeter_defense', label: 'Perimeter Defense', cat: 'Defense' },
  { key: 'steal', label: 'Steal', cat: 'Defense' },
  { key: 'block', label: 'Block', cat: 'Defense' },
  { key: 'offensive_rebound', label: 'Off. Rebound', cat: 'Athleticism' },
  { key: 'defensive_rebound', label: 'Def. Rebound', cat: 'Athleticism' },
  { key: 'speed', label: 'Speed', cat: 'Athleticism' },
  { key: 'acceleration', label: 'Acceleration', cat: 'Athleticism' },
  { key: 'strength', label: 'Strength', cat: 'Athleticism' },
  { key: 'vertical', label: 'Vertical', cat: 'Athleticism' },
  { key: 'stamina', label: 'Stamina', cat: 'Athleticism' },
]

const CATEGORIES = ['Finishing', 'Shooting', 'Playmaking', 'Defense', 'Athleticism']
const CAT_COLORS: Record<string, string> = {
  Finishing: 'text-orange-400',
  Shooting: 'text-yellow-400',
  Playmaking: 'text-blue-400',
  Defense: 'text-emerald-400',
  Athleticism: 'text-violet-400',
}
const CAT_BG: Record<string, string> = {
  Finishing: 'bg-orange-500/10 border-orange-500/20',
  Shooting: 'bg-yellow-500/10 border-yellow-500/20',
  Playmaking: 'bg-blue-500/10 border-blue-500/20',
  Defense: 'bg-emerald-500/10 border-emerald-500/20',
  Athleticism: 'bg-violet-500/10 border-violet-500/20',
}

// VC cost per upgrade point — approximate 2K26 cost curve
function vcCostForPoint(fromLevel: number): number {
  if (fromLevel < 60) return 100
  if (fromLevel < 70) return 200
  if (fromLevel < 75) return 350
  if (fromLevel < 80) return 500
  if (fromLevel < 85) return 750
  if (fromLevel < 88) return 1000
  if (fromLevel < 90) return 1500
  if (fromLevel < 92) return 2200
  if (fromLevel < 94) return 3000
  if (fromLevel < 96) return 4000
  if (fromLevel < 98) return 6000
  return 9000
}

function calcVCBetween(from: number, to: number): number {
  if (to <= from) return 0
  let total = 0
  for (let i = from; i < to; i++) {
    total += vcCostForPoint(i)
  }
  return total
}

// VC bundles from PSN/Xbox store (approximate)
const VC_BUNDLES = [
  { vc: 5000, price: 1.99, label: '5K VC' },
  { vc: 15000, price: 4.99, label: '15K VC' },
  { vc: 35000, price: 9.99, label: '35K VC' },
  { vc: 75000, price: 19.99, label: '75K VC' },
  { vc: 200000, price: 49.99, label: '200K VC' },
  { vc: 450000, price: 99.99, label: '450K VC' },
]

function cheapestBundle(vcNeeded: number): { label: string; price: number; qty: number; vc: number } | null {
  if (vcNeeded <= 0) return null
  let best: { label: string; price: number; qty: number; vc: number } | null = null
  let bestCost = Infinity
  for (let qty = 1; qty <= 20; qty++) {
    for (const b of VC_BUNDLES) {
      if (b.vc * qty >= vcNeeded) {
        const cost = b.price * qty
        if (cost < bestCost) {
          bestCost = cost
          best = { label: b.label, price: b.price, qty, vc: b.vc }
        }
      }
    }
  }
  return best
}

interface AttrState {
  current: number
  target: number
}

export default function VCCalcPage() {
  const [attrs, setAttrs] = useState<Record<string, AttrState>>(
    Object.fromEntries(ATTRIBUTES.map((a) => [a.key, { current: 75, target: 75 }]))
  )
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>(
    Object.fromEntries(CATEGORIES.map((c) => [c, true]))
  )

  const update = useCallback((key: string, field: 'current' | 'target', val: number) => {
    setAttrs((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: Math.max(25, Math.min(99, val)),
      },
    }))
  }, [])

  const totalVC = Object.entries(attrs).reduce((sum, [key, { current, target }]) => {
    return sum + calcVCBetween(current, target)
  }, 0)

  const upgradeCount = Object.values(attrs).filter((a) => a.target > a.current).length
  const bestBundle = cheapestBundle(totalVC)
  const vcPerDollar = bestBundle ? Math.round((bestBundle.vc * bestBundle.qty) / (bestBundle.price * bestBundle.qty)) : 0

  const resetAll = () => {
    setAttrs(Object.fromEntries(ATTRIBUTES.map((a) => [a.key, { current: 75, target: 75 }])))
  }

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 pb-16">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <Calculator className="w-5 h-5 text-rose-400" />
            <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">VC Calculator</span>
          </div>
          <h1 className="text-3xl font-bold text-fg">VC Cost Calculator</h1>
          <p className="text-fg-muted mt-1">Set your current and target attribute levels — see exactly how much VC you need.</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: attribute sliders */}
          <div className="lg:col-span-2 space-y-4">
            {CATEGORIES.map((cat) => {
              const catAttrs = ATTRIBUTES.filter((a) => a.cat === cat)
              const catVC = catAttrs.reduce((sum, a) => sum + calcVCBetween(attrs[a.key].current, attrs[a.key].target), 0)
              const isOpen = expandedCats[cat]

              return (
                <motion.div
                  key={cat}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`card border ${CAT_BG[cat]} overflow-hidden`}
                >
                  <button
                    className="w-full flex items-center justify-between p-4"
                    onClick={() => setExpandedCats((prev) => ({ ...prev, [cat]: !prev[cat] }))}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold ${CAT_COLORS[cat]}`}>{cat}</span>
                      {catVC > 0 && (
                        <span className="chip text-xs">{catVC.toLocaleString()} VC</span>
                      )}
                    </div>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-fg-muted" /> : <ChevronDown className="w-4 h-4 text-fg-muted" />}
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 space-y-3">
                          {catAttrs.map((attr) => {
                            const { current, target } = attrs[attr.key]
                            const cost = calcVCBetween(current, target)
                            const hasUpgrade = target > current
                            return (
                              <div key={attr.key}>
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="text-sm font-medium text-fg">{attr.label}</span>
                                  {hasUpgrade && (
                                    <span className="text-xs font-semibold text-emerald-400">
                                      +{target - current} pts · {cost.toLocaleString()} VC
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="flex-1 flex items-center gap-2">
                                    <span className="text-xs text-fg-muted w-12">Current</span>
                                    <input
                                      type="number"
                                      min={25}
                                      max={99}
                                      value={current}
                                      onChange={(e) => update(attr.key, 'current', parseInt(e.target.value) || 25)}
                                      className="input text-center text-sm w-16 px-2 py-1"
                                    />
                                  </div>
                                  <TrendingUp className={`w-4 h-4 flex-shrink-0 ${hasUpgrade ? 'text-emerald-400' : 'text-fg-subtle'}`} />
                                  <div className="flex-1 flex items-center gap-2">
                                    <span className="text-xs text-fg-muted w-12">Target</span>
                                    <input
                                      type="number"
                                      min={25}
                                      max={99}
                                      value={target}
                                      onChange={(e) => update(attr.key, 'target', parseInt(e.target.value) || 25)}
                                      className={`input text-center text-sm w-16 px-2 py-1 ${hasUpgrade ? 'border-emerald-500/40' : ''}`}
                                    />
                                  </div>
                                </div>
                                {hasUpgrade && (
                                  <div className="mt-1.5 h-1 rounded-full bg-white/5 overflow-hidden">
                                    <motion.div
                                      initial={{ width: 0 }}
                                      animate={{ width: `${((target - current) / (99 - current)) * 100}%` }}
                                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                                    />
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}

            <button onClick={resetAll} className="btn btn-secondary w-full">
              Reset All
            </button>
          </div>

          {/* Right: cost summary */}
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="card p-5 sticky top-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="w-5 h-5 text-rose-400" />
                <h2 className="font-semibold text-fg">Cost Summary</h2>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-fg-muted">Total VC Needed</span>
                  <span className="font-bold text-2xl text-fg">{totalVC.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-fg-muted">Attributes Upgraded</span>
                  <span className="font-semibold text-fg">{upgradeCount}</span>
                </div>
              </div>

              {totalVC > 0 ? (
                <>
                  <div className="h-px bg-white/5 mb-4" />
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm font-semibold text-fg">Best Bundle Deal</span>
                  </div>
                  {bestBundle ? (
                    <div className="card bg-yellow-500/5 border-yellow-500/20 p-3 mb-3">
                      <p className="font-bold text-yellow-400 text-lg">${(bestBundle.price * bestBundle.qty).toFixed(2)}</p>
                      <p className="text-sm text-fg-muted mt-0.5">{bestBundle.qty}× {bestBundle.label} bundle</p>
                      <p className="text-xs text-fg-subtle mt-1">{(bestBundle.vc * bestBundle.qty).toLocaleString()} VC total</p>
                    </div>
                  ) : null}

                  <div className="h-px bg-white/5 mb-4" />
                  <div className="flex items-center gap-1.5 mb-3">
                    <Info className="w-4 h-4 text-fg-subtle" />
                    <span className="text-xs text-fg-muted font-semibold">By Category</span>
                  </div>
                  <div className="space-y-2">
                    {CATEGORIES.map((cat) => {
                      const catAttrs = ATTRIBUTES.filter((a) => a.cat === cat)
                      const catVC = catAttrs.reduce((sum, a) => sum + calcVCBetween(attrs[a.key].current, attrs[a.key].target), 0)
                      if (catVC === 0) return null
                      const pct = Math.round((catVC / totalVC) * 100)
                      return (
                        <div key={cat}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className={CAT_COLORS[cat]}>{cat}</span>
                            <span className="text-fg-muted">{catVC.toLocaleString()} VC ({pct}%)</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              className="h-full rounded-full bg-gradient-to-r from-rose-500 to-violet-500"
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <div className="h-px bg-white/5 my-4" />
                  <p className="text-xs text-fg-subtle">
                    Prices approximate PSN/Xbox store prices. Costs may vary by region.
                    VC cost curve matches 2K26 Season 5 upgrade pricing.
                  </p>
                </>
              ) : (
                <div className="text-center py-6">
                  <Calculator className="w-8 h-8 text-fg-subtle mx-auto mb-2" />
                  <p className="text-sm text-fg-muted">Set target attributes higher than current to see the VC cost.</p>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
