'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Award, Search, Filter, Lock } from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import { cn } from '@/lib/utils'

// Badge attribute thresholds (Bronze / Silver / Gold / HoF / Legend)
const BADGE_THRESHOLDS = [
  { name: 'Deadeye', attr: 'Three-Point', thresholds: [60, 70, 80, 88, 95], cat: 'Shooting' },
  { name: 'Set Shot Specialist', attr: 'Three-Point', thresholds: [60, 70, 80, 88, 95], cat: 'Shooting' },
  { name: 'Shifty Shooter', attr: 'Ball Handle + 3PT', thresholds: [65, 73, 82, 90, 96], cat: 'Shooting' },
  { name: 'Limitless Range', attr: 'Three-Point', thresholds: [68, 76, 84, 92, 97], cat: 'Shooting' },
  { name: 'Mini Marksman', attr: 'Three-Point', thresholds: [55, 65, 75, 85, 92], cat: 'Shooting' },
  { name: 'Lightning Launch', attr: 'Speed + Acc.', thresholds: [60, 70, 78, 86, 93], cat: 'Finishing' },
  { name: 'Posterizer', attr: 'Driving Dunk', thresholds: [70, 78, 85, 92, 97], cat: 'Finishing' },
  { name: 'Rise Up', attr: 'Standing Dunk', thresholds: [65, 75, 83, 90, 96], cat: 'Finishing' },
  { name: 'Float Game', attr: 'Driving Layup', thresholds: [60, 70, 78, 86, 93], cat: 'Finishing' },
  { name: 'Layup Mixmaster', attr: 'Driving Layup', thresholds: [55, 65, 75, 85, 92], cat: 'Finishing' },
  { name: 'Dimer', attr: 'Pass Accuracy', thresholds: [65, 73, 82, 90, 96], cat: 'Playmaking' },
  { name: 'Strong Handle', attr: 'Ball Handle', thresholds: [65, 73, 82, 90, 96], cat: 'Playmaking' },
  { name: 'Handles for Days', attr: 'Ball Handle', thresholds: [70, 78, 86, 93, 98], cat: 'Playmaking' },
  { name: 'Break Starter', attr: 'Pass Accuracy', thresholds: [60, 70, 78, 86, 93], cat: 'Playmaking' },
  { name: 'Versatile Visionary', attr: 'Pass Accuracy', thresholds: [65, 75, 83, 90, 96], cat: 'Playmaking' },
  { name: 'Ankle Assassin', attr: 'Ball Handle', thresholds: [65, 73, 82, 90, 96], cat: 'Playmaking' },
  { name: 'Challenger', attr: 'Perimeter Def', thresholds: [60, 70, 78, 86, 93], cat: 'Defense' },
  { name: 'Interceptor', attr: 'Steal', thresholds: [55, 65, 75, 85, 92], cat: 'Defense' },
  { name: 'Pogo Stick', attr: 'Block + Vertical', thresholds: [65, 73, 82, 90, 96], cat: 'Defense' },
  { name: 'Rebound Chaser', attr: 'Def. Rebound', thresholds: [60, 70, 78, 86, 93], cat: 'Defense' },
  { name: 'On-Ball Menace', attr: 'Perimeter Def', thresholds: [60, 70, 78, 86, 93], cat: 'Defense' },
  { name: 'Immovable Enforcer', attr: 'Interior Def + Str', thresholds: [65, 73, 82, 90, 96], cat: 'Defense' },
  { name: 'Boxout Beast', attr: 'Def. Rebound', thresholds: [55, 65, 75, 85, 92], cat: 'Defense' },
  { name: 'Brick Wall', attr: 'Strength', thresholds: [60, 70, 78, 86, 93], cat: 'Defense' },
]

const LEVEL_LABELS = ['Bronze', 'Silver', 'Gold', 'HoF', 'Legend']
const LEVEL_COLORS = [
  'bg-amber-700/40 text-amber-400',
  'bg-zinc-500/40 text-zinc-300',
  'bg-yellow-500/40 text-yellow-300',
  'bg-violet-500/40 text-violet-300',
  'bg-rose-500/40 text-rose-300',
]

const BADGES = [
  // FINISHING
  { name: 'Lightning Launch', tier: 'S', cat: 'Finishing', desc: 'Explosive first step out of triple threat and off the dribble. Must-have for all scoring builds.', role: 'Scoring' },
  { name: 'Posterizer', tier: 'A', cat: 'Finishing', desc: 'Dunk over and through defenders. Expands dunk green window at Legend tier.', role: 'Finishing' },
  { name: 'Rise Up', tier: 'A', cat: 'Finishing', desc: 'Standing dunks and posterizing attempts in the paint.', role: 'Finishing' },
  { name: 'High-Flying Denier', tier: 'A', cat: 'Finishing', desc: 'Explosive dunk attempts over and around defenders in the paint.', role: 'Finishing' },
  { name: 'Float Game', tier: 'B', cat: 'Finishing', desc: 'Floaters and runners. Essential for guards attacking the paint against shot blockers.', role: 'Finishing' },
  { name: 'Layup Mixmaster', tier: 'B', cat: 'Finishing', desc: 'Varied layup packages — off-balance and leaning finishes through contact.', role: 'Finishing' },
  { name: 'Aerial Wizard', tier: 'B', cat: 'Finishing', desc: 'Alley-oops and put-back finishes off offensive boards.', role: 'Finishing' },
  { name: 'Post Up Poet', tier: 'B', cat: 'Finishing', desc: 'Post up scoring and faking from the block. Great for post scorers.', role: 'Post' },
  { name: 'Post Fade Phenom', tier: 'B', cat: 'Finishing', desc: 'Post fade-away shots and step-through moves from the post.', role: 'Post' },
  { name: 'Post Powerhouse', tier: 'B', cat: 'Finishing', desc: 'Power post moves and drop steps. For bigs who bully in the paint.', role: 'Post' },
  { name: 'Physical Finisher', tier: 'C', cat: 'Finishing', desc: 'Contact layups and dunks through physical defenders.', role: 'Finishing' },
  { name: 'Post Prodigy', tier: 'C', cat: 'Finishing', desc: 'Overall post game effectiveness — scoring and faking from the block.', role: 'Post' },
  { name: 'Hook Specialist', tier: 'C', cat: 'Finishing', desc: 'Hook shots from the post — right and left hand.', role: 'Post' },
  { name: 'Slippery Off-Ball', tier: 'C', cat: 'Finishing', desc: 'Off-ball movement to get open cuts and exploit passing lanes.', role: 'Scoring' },
  { name: 'Paint Prodigy', tier: 'D', cat: 'Finishing', desc: 'General paint finishing boost. Weakest tier — invest VC elsewhere.', role: 'Finishing' },
  // SHOOTING
  { name: 'Deadeye', tier: 'S', cat: 'Shooting', desc: 'Reduces shot contest penalty on jumpers. MUST-HAVE for all shooting builds — every shooter needs this at HoF+.', role: 'Shooting' },
  { name: 'Set Shot Specialist', tier: 'S', cat: 'Shooting', desc: 'Standstill and catch-and-shoot jumpers. S-tier for spot-up shooters and PGs in catch-and-shoot situations.', role: 'Shooting' },
  { name: 'Shifty Shooter', tier: 'S', cat: 'Shooting', desc: 'Off-the-dribble difficult shots, fading, step-back pull-ups. S-tier for guards — best dribbling shooter badge.', role: 'Shooting' },
  { name: 'Limitless Range', tier: 'A', cat: 'Shooting', desc: 'Extends 3PT range beyond the arc. Essential for shooting builds — pairs perfectly with Deadeye.', role: 'Shooting' },
  { name: 'Mini Marksman', tier: 'A', cat: 'Shooting', desc: 'Shooting boost specifically for shorter/smaller builds. A-tier for undersized PGs and SGs.', role: 'Shooting' },
  // PLAYMAKING
  { name: 'Dimer', tier: 'S', cat: 'Playmaking', desc: 'Passing boosts to open teammates. S-tier for pass-first PGs — makes your shooters significantly better.', role: 'Playmaking' },
  { name: 'Strong Handle', tier: 'A', cat: 'Playmaking', desc: 'Tight ball control under defensive pressure. Prevents turnovers when defenders reach in.', role: 'Playmaking' },
  { name: 'Versatile Visionary', tier: 'A', cat: 'Playmaking', desc: 'Playmaking vision — boosts passing in multiple situations including no-look and skip passes.', role: 'Playmaking' },
  { name: 'Break Starter', tier: 'A', cat: 'Playmaking', desc: 'Outlet passes in transition. A-tier for PGs who push pace and kick ahead.', role: 'Playmaking' },
  { name: 'Handles for Days', tier: 'A', cat: 'Playmaking', desc: 'Reduces stamina drain on dribble moves. Must-have for handles builds doing multi-move combos.', role: 'Playmaking' },
  { name: 'Pick Dodger', tier: 'A', cat: 'Playmaking', desc: 'Navigating through and around screens on offense — gets you open off the ball.', role: 'Playmaking' },
  { name: 'Bail Out', tier: 'B', cat: 'Playmaking', desc: 'Passing out of the air and skip passes. Good for players who attack and kick.', role: 'Playmaking' },
  { name: 'Ankle Assassin', tier: 'B', cat: 'Playmaking', desc: 'Ankle-breaking dribble moves that cause defenders to stumble.', role: 'Playmaking' },
  { name: 'Unpluckable', tier: 'B', cat: 'Playmaking', desc: 'Reduces steal success against you when dribbling. Useful at the park against aggressive hands.', role: 'Playmaking' },
  // DEFENSE
  { name: 'Challenger', tier: 'S', cat: 'Defense', desc: 'Improved shot contest quality and timing. S-tier for perimeter defenders — the best on-ball shooting contest badge.', role: 'Defense' },
  { name: 'Interceptor', tier: 'S', cat: 'Defense', desc: 'Pass deflections and interceptions. S-tier for locks who gamble in passing lanes.', role: 'Defense' },
  { name: 'Pogo Stick', tier: 'S', cat: 'Defense', desc: 'Quick successive jumps for shot blocks and offensive rebounds. Top big-man badge — essential for rim protectors.', role: 'Defense' },
  { name: 'Rebound Chaser', tier: 'S', cat: 'Defense', desc: 'Tracking and chasing down missed shots. S-tier for rebounders — pairs with Pogo Stick for elite boards.', role: 'Defense' },
  { name: 'On-Ball Menace', tier: 'A', cat: 'Defense', desc: 'On-ball defensive pressure — reduces opponent attributes when guarding up close.', role: 'Defense' },
  { name: 'Immovable Enforcer', tier: 'A', cat: 'Defense', desc: 'Interior defense — hard to back down or move in the post.', role: 'Defense' },
  { name: 'Boxout Beast', tier: 'A', cat: 'Defense', desc: 'Boxing out opponents on rebounds. Essential for bigs and stretch 4s who need boards.', role: 'Defense' },
  { name: 'Paint Patroller', tier: 'A', cat: 'Defense', desc: 'Protecting the paint — improves shot contests inside the arc.', role: 'Defense' },
  { name: 'Brick Wall', tier: 'A', cat: 'Defense', desc: 'Setting physical screens and being harder to move through on defense.', role: 'Defense' },
  { name: 'Off-Ball Pest', tier: 'A', cat: 'Defense', desc: 'Bothering off-ball offensive players — denying passes and cutting lanes.', role: 'Defense' },
  { name: 'Glove', tier: 'B', cat: 'Defense', desc: 'Stealing the ball from ball-handlers. For locks who play aggressive defense.', role: 'Defense' },
  { name: 'Post Lockdown', tier: 'B', cat: 'Defense', desc: 'Defending in the post against post scorers. Good for PFs/Cs who face post players.', role: 'Defense' },
]

const TIERS = ['S', 'A', 'B', 'C', 'D']
const CATS = ['All', 'Finishing', 'Shooting', 'Playmaking', 'Defense']

const TIER_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  S: { label: 'S-Tier', color: 'text-amber-300', bg: 'bg-amber-400/10', border: 'border-amber-400/30' },
  A: { label: 'A-Tier', color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/30' },
  B: { label: 'B-Tier', color: 'text-sky-400', bg: 'bg-sky-400/10', border: 'border-sky-400/30' },
  C: { label: 'C-Tier', color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/30' },
  D: { label: 'D-Tier', color: 'text-zinc-400', bg: 'bg-zinc-400/10', border: 'border-zinc-400/30' },
}

const CAT_COLORS: Record<string, string> = {
  Finishing: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  Shooting: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  Playmaking: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  Defense: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
}

type PageTab = 'tier-list' | 'thresholds'

export default function BadgesPage() {
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('All')
  const [tab, setTab] = useState<PageTab>('tier-list')

  const filtered = BADGES.filter((b) => {
    if (catFilter !== 'All' && b.cat !== catFilter) return false
    if (search && !b.name.toLowerCase().includes(search.toLowerCase()) &&
        !b.desc.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const byTier = TIERS.map((t) => ({ tier: t, badges: filtered.filter((b) => b.tier === t) }))
    .filter((g) => g.badges.length > 0)

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 pb-16">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(225,29,72,0.1)', border: '1px solid rgba(225,29,72,0.2)' }}>
              <Award className="w-5 h-5" style={{ color: '#E11D48' }} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] mb-1.5"
                style={{ color: 'rgba(225,29,72,0.8)' }}>Badge Reference</p>
              <h1 className="text-[28px] md:text-[34px] font-black text-white leading-[1.05] tracking-tight">Season 5 Badges</h1>
              <p className="text-white/40 text-[14px] mt-1.5">All verified NBA 2K26 Season 5 badges — tier rankings, categories, and coaching notes.</p>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 }} className="card p-1.5 flex gap-1 w-fit mb-6">
          {([
            { key: 'tier-list', label: 'Tier List' },
            { key: 'thresholds', label: 'Attr. Thresholds' },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all',
                tab === key
                  ? 'bg-rose-500 text-white shadow-[0_2px_8px_rgba(225,29,72,0.35)]'
                  : 'text-fg-muted hover:text-fg'
              )}
            >
              {label}
            </button>
          ))}
        </motion.div>

        {tab === 'tier-list' && (
          <>
            {/* Stats */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="grid grid-cols-5 gap-2 mb-6">
              {TIERS.map((t) => {
                const count = BADGES.filter((b) => b.tier === t).length
                const cfg = TIER_CONFIG[t]
                return (
                  <div key={t} className={cn('card p-3 text-center border', cfg.border, cfg.bg)}>
                    <p className={cn('text-xl font-black', cfg.color)}>{t}</p>
                    <p className="text-xs text-fg-muted mt-0.5">{count} badges</p>
                  </div>
                )
              })}
            </motion.div>

            {/* Filters */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="flex flex-wrap gap-3 mb-6">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-subtle" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search badges..."
                  className="input pl-9"
                />
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <Filter className="w-4 h-4 text-fg-subtle" />
                {CATS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCatFilter(c)}
                    className={cn(
                      'chip cursor-pointer transition-all text-xs',
                      catFilter === c
                        ? 'text-rose-400 border-rose-500/40 bg-rose-500/15'
                        : 'hover:border-white/20'
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Tier groups */}
            <div className="space-y-5">
              {byTier.map(({ tier, badges }, gi) => {
                const cfg = TIER_CONFIG[tier]
                return (
                  <motion.div
                    key={tier}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: gi * 0.07 }}
                    className={cn('card overflow-hidden border-l-[3px]', cfg.border)}
                  >
                    <div className={cn('flex items-center gap-3 px-5 py-3 border-b border-white/[0.04]', cfg.bg)}>
                      <span className={cn('text-2xl font-black', cfg.color)}>{tier}</span>
                      <span className="font-semibold text-fg">{cfg.label}</span>
                      <span className="text-fg-subtle text-xs ml-auto">{badges.length} badges</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-0">
                      {badges.map((badge, i) => (
                        <motion.div
                          key={badge.name}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.04 }}
                          className="p-4 hover:bg-white/[0.02] transition-colors border-b border-r border-white/[0.04]"
                        >
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <p className="font-semibold text-sm text-fg">{badge.name}</p>
                            <span className={cn('chip text-2xs flex-shrink-0', CAT_COLORS[badge.cat])}>
                              {badge.cat}
                            </span>
                          </div>
                          <p className="text-xs text-fg-muted leading-relaxed">{badge.desc}</p>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )
              })}
            </div>

            {filtered.length === 0 && (
              <div className="text-center py-20">
                <Award className="w-10 h-10 text-fg-subtle mx-auto mb-3" />
                <p className="text-fg-muted">No badges match your search.</p>
              </div>
            )}
          </>
        )}

        {tab === 'thresholds' && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <div className="card overflow-hidden mb-4">
              <div className="flex items-center gap-3 px-5 py-3 border-b border-white/[0.04] bg-violet-500/5">
                <Lock className="w-4 h-4 text-violet-400" />
                <span className="text-sm font-semibold text-fg">Badge Unlock Thresholds</span>
                <span className="text-xs text-fg-muted ml-auto">Approximate Season 5 requirements</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.04]">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wider w-44">Badge</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wider w-32">Attribute</th>
                      {LEVEL_LABELS.map((l, i) => (
                        <th key={l} className="text-center px-3 py-3 text-xs font-semibold uppercase tracking-wider">
                          <span className={cn('chip text-2xs', LEVEL_COLORS[i])}>{l}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {BADGE_THRESHOLDS.map((b, i) => (
                      <motion.tr
                        key={b.name}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.02 }}
                        className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="px-4 py-3">
                          <p className="font-semibold text-fg text-xs">{b.name}</p>
                          <span className={cn('chip text-2xs mt-0.5', CAT_COLORS[b.cat])}>{b.cat}</span>
                        </td>
                        <td className="px-4 py-3 text-xs text-fg-muted">{b.attr}</td>
                        {b.thresholds.map((val, li) => (
                          <td key={li} className="px-3 py-3 text-center">
                            <span className="font-bold text-xs text-fg">{val}+</span>
                          </td>
                        ))}
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <p className="text-xs text-fg-subtle text-center mt-2">
              Thresholds are approximate. Exact values may vary by height and position. Check NBA2KLab for precise caps.
            </p>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-8 card p-4 bg-amber-500/5 border-amber-500/20">
          <p className="text-xs text-amber-300/70 text-center">
            Season 5 data verified from TierMaker community tier list — May 2026.
            Badge effectiveness may shift with future patches.
          </p>
        </motion.div>
      </div>
    </AppLayout>
  )
}
