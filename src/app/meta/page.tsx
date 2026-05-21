'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp, TrendingDown, Minus, BarChart3, Star,
  Zap, Shield, Play, ChevronRight, RefreshCw,
} from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import { MetaTrend } from '@/types'
import { cn, getMetaTierColor, formatNumber } from '@/lib/utils'

const DEMO_TRENDS: MetaTrend[] = [
  { id: '1', category: 'build', name: 'Glass Cleaner Finisher', tier: 'S', usage_rate: 34.2, win_rate: 62.1, trend: 'rising', description: 'Dominant rim presence with elite finishing. The go-to center build this season.', updated_at: new Date().toISOString() },
  { id: '2', category: 'build', name: 'Shot Creator Guard', tier: 'S', usage_rate: 28.7, win_rate: 58.4, trend: 'stable', description: 'Versatile guard with elite shooting and ball handling. Park favorite.', updated_at: new Date().toISOString() },
  { id: '3', category: 'build', name: 'Playmaking Shot Creator', tier: 'A', usage_rate: 22.1, win_rate: 55.2, trend: 'stable', description: 'Elite playmaker with solid shooting. The comp guard standard.', updated_at: new Date().toISOString() },
  { id: '4', category: 'build', name: 'Two-Way Slashing Guard', tier: 'A', usage_rate: 19.8, win_rate: 54.8, trend: 'rising', description: 'Defense-first guard that still threatens offensively.', updated_at: new Date().toISOString() },
  { id: '5', category: 'build', name: 'Stretch Big', tier: 'A', usage_rate: 17.3, win_rate: 53.1, trend: 'stable', description: 'Floor-spacing big that opens lanes for guards.', updated_at: new Date().toISOString() },
  { id: '6', category: 'build', name: 'Pure Lock', tier: 'B', usage_rate: 14.2, win_rate: 51.0, trend: 'falling', description: 'Elite defender but limited offensive threats in current meta.', updated_at: new Date().toISOString() },
  { id: '7', category: 'badge', name: 'Limitless Range', tier: 'S', usage_rate: 67.3, win_rate: 61.2, trend: 'rising', description: 'Expands shooting range significantly. Meta-defining badge.', updated_at: new Date().toISOString() },
  { id: '8', category: 'badge', name: 'Clamps', tier: 'S', usage_rate: 71.8, win_rate: 60.8, trend: 'stable', description: 'Best perimeter defense badge. Essential for any lock.', updated_at: new Date().toISOString() },
  { id: '9', category: 'badge', name: 'Quick First Step', tier: 'S', usage_rate: 62.1, win_rate: 59.3, trend: 'stable', description: 'Enhances blow-by speed. Essential for guards.', updated_at: new Date().toISOString() },
  { id: '10', category: 'badge', name: 'Dream Shake', tier: 'A', usage_rate: 45.2, win_rate: 57.4, trend: 'rising', description: 'Post fade is powerful in current meta.', updated_at: new Date().toISOString() },
  { id: '11', category: 'badge', name: 'Posterizer', tier: 'A', usage_rate: 38.9, win_rate: 56.1, trend: 'stable', description: 'Activates on contact dunks. High percentage plays.', updated_at: new Date().toISOString() },
  { id: '12', category: 'animation', name: 'Dribble: Pro 3', tier: 'S', usage_rate: 58.4, win_rate: 61.0, trend: 'rising', description: 'Tightest dribble package for guards this patch.', updated_at: new Date().toISOString() },
  { id: '13', category: 'animation', name: 'Jumpshot: Base 98', tier: 'S', usage_rate: 44.7, win_rate: 62.3, trend: 'rising', description: 'Fastest release window in current meta.', updated_at: new Date().toISOString() },
  { id: '14', category: 'animation', name: 'Post Fade: Dream', tier: 'A', usage_rate: 29.3, win_rate: 57.2, trend: 'stable', description: 'Most effective post fade animation.', updated_at: new Date().toISOString() },
  { id: '15', category: 'takeover', name: 'Limitless Shooter', tier: 'S', usage_rate: 39.2, win_rate: 63.1, trend: 'rising', description: 'Extends range dramatically. Pairs with any shooting build.', updated_at: new Date().toISOString() },
  { id: '16', category: 'takeover', name: 'Rim Protector', tier: 'A', usage_rate: 28.7, win_rate: 57.8, trend: 'stable', description: 'Dominant at the rim when activated. Essential for centers.', updated_at: new Date().toISOString() },
]

const CATEGORIES = ['build', 'badge', 'animation', 'takeover'] as const
const CATEGORY_ICONS: Record<string, React.ElementType> = {
  build: BarChart3, badge: Star, animation: Play, takeover: Zap,
}
const CATEGORY_COLORS: Record<string, string> = {
  build: 'text-crimson', badge: 'text-yellow-400', animation: 'text-neon-blue', takeover: 'text-purple-400',
}

function TrendIcon({ trend }: { trend: string }) {
  if (trend === 'rising') return <TrendingUp className="w-3.5 h-3.5 text-green-400" />
  if (trend === 'falling') return <TrendingDown className="w-3.5 h-3.5 text-red-400" />
  return <Minus className="w-3.5 h-3.5 text-text-muted" />
}

function TrendRow({ item, index }: { item: MetaTrend; index: number }) {
  const tierClass = getMetaTierColor(item.tier)
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
      className="flex items-center gap-4 p-4 rounded-xl hover:bg-surface transition-colors group cursor-default"
    >
      <div className="text-sm font-bold text-text-muted w-5">{index + 1}</div>
      <div className={cn('px-2 py-0.5 rounded-lg border text-xs font-bold', tierClass)}>
        {item.tier}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-text-primary truncate">{item.name}</p>
        <p className="text-xs text-text-muted truncate">{item.description}</p>
      </div>
      <div className="flex items-center gap-4 text-xs text-text-muted flex-shrink-0">
        <div className="text-right">
          <p className="text-text-primary font-mono font-semibold">{item.usage_rate}%</p>
          <p>Usage</p>
        </div>
        <div className="text-right">
          <p className="text-green-400 font-mono font-semibold">{item.win_rate}%</p>
          <p>Win Rate</p>
        </div>
        <TrendIcon trend={item.trend} />
      </div>
    </motion.div>
  )
}

export default function MetaPage() {
  const [activeCategory, setActiveCategory] = useState<typeof CATEGORIES[number]>('build')
  const [patchVersion] = useState('1.08')

  const filtered = DEMO_TRENDS.filter((t) => t.category === activeCategory)
  const sTier = filtered.filter((t) => t.tier === 'S')
  const aTier = filtered.filter((t) => t.tier === 'A')
  const bTier = filtered.filter((t) => t.tier === 'B')

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 rounded-xl bg-crimson/10 border border-crimson/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-crimson" />
              </div>
              <span className="text-crimson text-sm font-semibold tracking-wider uppercase">Meta Tracker</span>
            </div>
            <h1 className="text-4xl font-black font-display text-text-primary">NBA 2K26 Meta</h1>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-xs text-text-muted bg-surface border border-border px-3 py-1 rounded-full">
                Patch {patchVersion}
              </span>
              <span className="text-xs text-green-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                Live
              </span>
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-xs text-text-muted mb-1">Last Updated</p>
            <p className="text-sm text-text-primary font-semibold">Today, 9:00 AM ET</p>
          </div>
        </div>

        {/* Category tabs */}
        <div className="glass-card p-1.5 flex gap-1 mb-6 w-fit">
          {CATEGORIES.map((cat) => {
            const Icon = CATEGORY_ICONS[cat]
            const isActive = activeCategory === cat
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold capitalize transition-all',
                  isActive ? 'bg-crimson text-white shadow-crimson' : 'text-text-secondary hover:text-text-primary'
                )}
              >
                <Icon className="w-4 h-4" />
                {cat}s
              </button>
            )
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main tier list */}
          <div className="lg:col-span-2 space-y-4">
            {/* S-Tier */}
            {sTier.length > 0 && (
              <div className="glass-card overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-yellow-400/5">
                  <div className="px-2.5 py-1 rounded-lg border border-yellow-400/30 bg-yellow-400/10 text-yellow-400 text-sm font-bold">S</div>
                  <span className="text-sm font-semibold text-text-primary">Elite Tier</span>
                  <span className="text-xs text-text-muted">{sTier.length} entries</span>
                </div>
                <div className="divide-y divide-border">
                  {sTier.map((item, i) => <TrendRow key={item.id} item={item} index={i} />)}
                </div>
              </div>
            )}

            {/* A-Tier */}
            {aTier.length > 0 && (
              <div className="glass-card overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-green-400/5">
                  <div className="px-2.5 py-1 rounded-lg border border-green-400/30 bg-green-400/10 text-green-400 text-sm font-bold">A</div>
                  <span className="text-sm font-semibold text-text-primary">Competitive Tier</span>
                  <span className="text-xs text-text-muted">{aTier.length} entries</span>
                </div>
                <div className="divide-y divide-border">
                  {aTier.map((item, i) => <TrendRow key={item.id} item={item} index={i} />)}
                </div>
              </div>
            )}

            {/* B-Tier */}
            {bTier.length > 0 && (
              <div className="glass-card overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-blue-400/5">
                  <div className="px-2.5 py-1 rounded-lg border border-blue-400/30 bg-blue-400/10 text-blue-400 text-sm font-bold">B</div>
                  <span className="text-sm font-semibold text-text-primary">Solid Tier</span>
                  <span className="text-xs text-text-muted">{bTier.length} entries</span>
                </div>
                <div className="divide-y divide-border">
                  {bTier.map((item, i) => <TrendRow key={item.id} item={item} index={i} />)}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Patch notes teaser */}
            <div className="glass-card p-5 border border-crimson/20">
              <h3 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4 text-crimson" />
                Patch {patchVersion} Changes
              </h3>
              <div className="space-y-3 text-xs">
                {[
                  { icon: TrendingUp, color: 'text-green-400', text: 'Limitless Range HOF buffed — easier activation' },
                  { icon: TrendingUp, color: 'text-green-400', text: 'Glass Cleaner contact dunk %  increased' },
                  { icon: TrendingDown, color: 'text-red-400', text: 'Pure Lock off-ball movement nerfed' },
                  { icon: TrendingDown, color: 'text-red-400', text: 'Ankle Breaker animation exploits patched' },
                  { icon: Minus, color: 'text-text-muted', text: 'Post Fade win % unchanged' },
                ].map(({ icon: Icon, color, text }, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <Icon className={`w-3.5 h-3.5 ${color} mt-0.5 flex-shrink-0`} />
                    <span className="text-text-secondary">{text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick stats */}
            <div className="glass-card p-5">
              <h3 className="text-sm font-bold text-text-primary mb-4">Quick Stats</h3>
              <div className="space-y-3">
                {[
                  { label: 'Most Used Build', value: 'Glass Cleaner Finisher', badge: 'S' },
                  { label: 'Hottest Badge', value: 'Limitless Range', badge: 'S' },
                  { label: 'Best Jumpshot', value: 'Base 98', badge: 'S' },
                  { label: 'Top Takeover', value: 'Limitless Shooter', badge: 'S' },
                ].map(({ label, value, badge }) => (
                  <div key={label} className="flex items-center justify-between gap-3">
                    <span className="text-xs text-text-muted">{label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-primary font-medium text-right">{value}</span>
                      <span className="text-xs font-bold text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 px-1.5 py-0.5 rounded">
                        {badge}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Trend movers */}
            <div className="glass-card p-5">
              <h3 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-400" />
                Rising This Week
              </h3>
              <div className="space-y-2">
                {DEMO_TRENDS.filter((t) => t.trend === 'rising').slice(0, 4).map((item) => (
                  <div key={item.id} className="flex items-center gap-3 text-xs">
                    <TrendingUp className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                    <span className="text-text-secondary flex-1 truncate">{item.name}</span>
                    <span className={cn('font-bold px-1.5 py-0.5 rounded text-xs border', getMetaTierColor(item.tier))}>
                      {item.tier}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
