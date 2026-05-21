'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus, BarChart3, Star, Play, Zap } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import { cn } from '@/lib/utils'

const TIER_CLASS: Record<string,string> = { S:'tier-s', A:'tier-a', B:'tier-b', C:'tier-c', D:'tier-d' }

const DATA = {
  build: [
    { name:'Glass Cleaner Finisher', tier:'S', usage:34.2, win:62.1, trend:'rising',  desc:'Dominant rim presence. Go-to center build this season.' },
    { name:'Shot Creator Guard',     tier:'S', usage:28.7, win:58.4, trend:'stable',  desc:'Versatile guard with elite shooting and handles. Park favorite.' },
    { name:'Playmaking Shot Creator',tier:'A', usage:22.1, win:55.2, trend:'stable',  desc:'Elite playmaker with solid shooting. Comp guard standard.' },
    { name:'Two-Way Slashing Guard', tier:'A', usage:19.8, win:54.8, trend:'rising',  desc:'Defense-first guard that still threatens offensively.' },
    { name:'Stretch Big',            tier:'A', usage:17.3, win:53.1, trend:'stable',  desc:'Floor-spacing big that opens lanes for guards.' },
    { name:'Pure Lock',              tier:'B', usage:14.2, win:51.0, trend:'falling', desc:'Elite defender but limited offense in current meta.' },
  ],
  badge: [
    { name:'Limitless Range',  tier:'S', usage:67.3, win:61.2, trend:'rising',  desc:'Expands shooting range. Meta-defining badge this season.' },
    { name:'Clamps',           tier:'S', usage:71.8, win:60.8, trend:'stable',  desc:'Best perimeter defense badge. Essential for any lock.' },
    { name:'Quick First Step', tier:'S', usage:62.1, win:59.3, trend:'stable',  desc:'Enhances blow-by speed. Essential for guards.' },
    { name:'Dream Shake',      tier:'A', usage:45.2, win:57.4, trend:'rising',  desc:'Post fade is powerful in current meta.' },
    { name:'Posterizer',       tier:'A', usage:38.9, win:56.1, trend:'stable',  desc:'Activates on contact dunks. High percentage plays.' },
    { name:'Dimer',            tier:'B', usage:29.3, win:52.4, trend:'falling', desc:'Useful in team play but nerfed in 1.08.' },
  ],
  animation: [
    { name:'Dribble: Pro 3',   tier:'S', usage:58.4, win:61.0, trend:'rising',  desc:'Tightest dribble package for guards this patch.' },
    { name:'Jumpshot: Base 98',tier:'S', usage:44.7, win:62.3, trend:'rising',  desc:'Fastest release window in current meta.' },
    { name:'Post Fade: Dream', tier:'A', usage:29.3, win:57.2, trend:'stable',  desc:'Most effective post fade animation.' },
    { name:'Size Up: Pro 5',   tier:'B', usage:18.2, win:51.8, trend:'stable',  desc:'Solid size-up package for bigger guards.' },
  ],
  takeover: [
    { name:'Limitless Shooter', tier:'S', usage:39.2, win:63.1, trend:'rising',  desc:'Extends range dramatically. Pairs with any shooting build.' },
    { name:'Rim Protector',     tier:'A', usage:28.7, win:57.8, trend:'stable',  desc:'Dominant at rim when activated. Essential for centers.' },
    { name:'Floor General',     tier:'B', usage:19.4, win:52.3, trend:'stable',  desc:'Boosts teammates. Strong in Pro-Am and Rec.' },
  ],
}

const CATS = ['build','badge','animation','takeover'] as const
const ICONS = { build: BarChart3, badge: Star, animation: Play, takeover: Zap }

function TrendIcon({ t }: { t: string }) {
  if (t === 'rising')  return <TrendingUp   className="w-4 h-4 text-emerald-400" />
  if (t === 'falling') return <TrendingDown  className="w-4 h-4 text-rose-400" />
  return <Minus className="w-4 h-4 text-fg-subtle" />
}

function TierSection({ tier, items }: { tier: string; items: typeof DATA.build }) {
  const colors: Record<string,string> = { S:'border-amber-400/40 bg-amber-400/5', A:'border-emerald-400/40 bg-emerald-400/5', B:'border-sky-400/40 bg-sky-400/5', C:'border-orange-400/40 bg-orange-400/5' }
  return (
    <div className={cn('card overflow-hidden border-l-4', colors[tier] || '')}>
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-border">
        <span className={cn('chip font-bold text-sm px-3 py-1', TIER_CLASS[tier])}>{tier}</span>
        <span className="text-fg text-sm font-semibold">{tier === 'S' ? 'Elite' : tier === 'A' ? 'Competitive' : 'Solid'} Tier</span>
        <span className="text-fg-subtle text-xs ml-auto">{items.length} entries</span>
      </div>
      <div className="divide-y divide-border">
        {items.map((item, i) => (
          <motion.div key={item.name} initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }} transition={{ delay: i*0.04 }}
            className="flex items-center gap-4 px-5 py-4 hover:bg-surface/60 transition-colors group">
            <span className="text-fg-subtle mono text-xs w-5 text-right">{i+1}</span>
            <div className="flex-1 min-w-0">
              <p className="text-fg font-semibold text-sm truncate">{item.name}</p>
              <p className="text-fg-subtle text-xs truncate">{item.desc}</p>
            </div>
            {/* Usage bar */}
            <div className="hidden sm:flex items-center gap-2 w-28">
              <div className="stat-bar flex-1">
                <div className="stat-bar-fill bg-rose-500" style={{ width: `${item.usage}%` }} />
              </div>
              <span className="mono text-xs text-fg-muted w-12 text-right">{item.usage}%</span>
            </div>
            <div className="hidden md:flex items-center gap-1 w-16 justify-end">
              <span className="mono text-xs text-emerald-400 font-semibold">{item.win}%</span>
              <span className="text-fg-subtle text-2xs">WR</span>
            </div>
            <TrendIcon t={item.trend} />
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default function MetaPage() {
  const [cat, setCat] = useState<typeof CATS[number]>('build')
  const items = DATA[cat]
  const sTier = items.filter(i => i.tier === 'S')
  const aTier = items.filter(i => i.tier === 'A')
  const bTier = items.filter(i => i.tier === 'B')

  return (
    <div className="min-h-screen bg-bg">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-16">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-rose-400" />
              </div>
              <span className="text-rose-400 text-xs font-semibold tracking-widest uppercase">Meta Tracker</span>
            </div>
            <h1 className="display text-4xl text-fg">NBA 2K26 Meta</h1>
            <div className="flex items-center gap-3 mt-2">
              <span className="chip chip-muted">Patch 1.08</span>
              <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                <span className="status-online" /> Live
              </span>
            </div>
          </div>
          <div className="hidden sm:block text-right">
            <p className="text-fg-subtle text-xs">Last Updated</p>
            <p className="text-fg font-semibold text-sm">Today</p>
          </div>
        </div>

        {/* Category tabs */}
        <div className="card p-1.5 flex gap-1 w-fit mb-6">
          {CATS.map(c => {
            const Icon = ICONS[c]
            return (
              <button key={c} onClick={() => setCat(c)}
                className={cn('flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold capitalize transition-all',
                  cat === c ? 'bg-rose-500 text-white shadow-[0_2px_8px_rgba(225,29,72,0.4)]' : 'text-fg-muted hover:text-fg')}>
                <Icon className="w-3.5 h-3.5" />{c}s
              </button>
            )
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Tier lists */}
          <div className="lg:col-span-2 space-y-4">
            {sTier.length > 0 && <TierSection tier="S" items={sTier} />}
            {aTier.length > 0 && <TierSection tier="A" items={aTier} />}
            {bTier.length > 0 && <TierSection tier="B" items={bTier} />}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="card p-5 border-rose-500/15">
              <p className="text-xs font-semibold text-fg-muted uppercase tracking-wider mb-4 flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-rose-400" /> Patch 1.08 Notes
              </p>
              <div className="space-y-3">
                {[
                  { icon: TrendingUp,   color:'text-emerald-400', t:'Limitless Range HOF — easier activation' },
                  { icon: TrendingUp,   color:'text-emerald-400', t:'Glass Cleaner contact dunk % up' },
                  { icon: TrendingDown, color:'text-rose-400',    t:'Pure Lock off-ball movement nerfed' },
                  { icon: TrendingDown, color:'text-rose-400',    t:'Ankle Breaker animation exploits fixed' },
                  { icon: Minus,        color:'text-fg-subtle',   t:'Post Fade win rate unchanged' },
                ].map(({ icon: Icon, color, t }) => (
                  <div key={t} className="flex items-start gap-2.5 text-xs">
                    <Icon className={cn('w-3.5 h-3.5 flex-shrink-0 mt-0.5', color)} />
                    <span className="text-fg-muted">{t}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-5">
              <p className="text-xs font-semibold text-fg-muted uppercase tracking-wider mb-4">Quick Stats</p>
              <div className="space-y-3">
                {[
                  { label:'Most Used Build', value:'Glass Cleaner', badge:'S' },
                  { label:'Hottest Badge',   value:'Limitless Range', badge:'S' },
                  { label:'Best Jumpshot',   value:'Base 98',        badge:'S' },
                  { label:'Top Takeover',    value:'Limitless Shooter', badge:'S' },
                ].map(({ label, value, badge }) => (
                  <div key={label} className="flex items-center gap-3">
                    <span className="text-fg-subtle text-xs flex-1">{label}</span>
                    <span className="text-fg text-xs font-medium text-right truncate max-w-[100px]">{value}</span>
                    <span className={cn('chip text-xs', TIER_CLASS[badge])}>{badge}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-5">
              <p className="text-xs font-semibold text-fg-muted uppercase tracking-wider mb-4 flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Rising This Week
              </p>
              <div className="space-y-2.5">
                {[...DATA.build, ...DATA.badge].filter(i => i.trend === 'rising').slice(0,4).map(item => (
                  <div key={item.name} className="flex items-center gap-2.5 text-xs">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    <span className="text-fg-muted flex-1 truncate">{item.name}</span>
                    <span className={cn('chip', TIER_CLASS[item.tier])}>{item.tier}</span>
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
