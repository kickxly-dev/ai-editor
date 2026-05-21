'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Heart, Bookmark, Eye, CheckCircle, Plus, Users } from 'lucide-react'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import { cn, formatNumber, timeAgo, POSITIONS, META_CATEGORIES } from '@/lib/utils'

const TIER_CLASS: Record<string, string> = { S:'tier-s', A:'tier-a', B:'tier-b', C:'tier-c', D:'tier-d' }
const POS_COLOR: Record<string, string> = { PG:'text-sky-400', SG:'text-emerald-400', SF:'text-amber-400', PF:'text-orange-400', C:'text-rose-400' }

const DEMO = [
  { id:'1', name:'Park God Guard', position:'PG', archetype:'Shot Creator', height:"6'4\"", category:'Park', likes:2847, saves:1203, views:18500, tier:'S', rating:94, comp:91, creator:'KingJosiah', verified:true, tags:['park','iso','handles'], createdAt: new Date(Date.now()-3600000).toISOString() },
  { id:'2', name:'Rim Destroyer', position:'C', archetype:'Glass Cleaner Finisher', height:"7'0\"", category:'Rec', likes:1923, saves:876, views:12400, tier:'S', rating:91, comp:93, creator:'BigManMike', verified:false, tags:['center','rim','defense'], createdAt: new Date(Date.now()-7200000).toISOString() },
  { id:'3', name:'Two-Way Lock', position:'SF', archetype:'Two-Way Slasher', height:"6'7\"", category:'Pro-Am', likes:1456, saves:654, views:9800, tier:'A', rating:88, comp:87, creator:'LockGod23', verified:true, tags:['defense','lock'], createdAt: new Date(Date.now()-86400000).toISOString() },
  { id:'4', name:'Comp Popper', position:'PF', archetype:'Stretch Four', height:"6'9\"", category:'Popper', likes:1102, saves:489, views:7200, tier:'A', rating:86, comp:84, creator:'PopperKing', verified:false, tags:['shooting','stretch'], createdAt: new Date(Date.now()-172800000).toISOString() },
  { id:'5', name:'ISO Demon SG', position:'SG', archetype:'Scoring Machine', height:"6'5\"", category:'ISO', likes:987, saves:412, views:6100, tier:'B', rating:84, comp:82, creator:'ISOFiend', verified:false, tags:['iso','scoring'], createdAt: new Date(Date.now()-259200000).toISOString() },
  { id:'6', name:'Pure Playmaker', position:'PG', archetype:'Playmaking Shot Creator', height:"6'2\"", category:'Comp Guard', likes:876, saves:334, views:5400, tier:'A', rating:89, comp:90, creator:'DimeDropper', verified:true, tags:['playmaking','assists'], createdAt: new Date(Date.now()-345600000).toISOString() },
  { id:'7', name:'Stretch & Lock', position:'SF', archetype:'3&D Wing', height:"6'8\"", category:'Hybrid Defender', likes:654, saves:280, views:4100, tier:'B', rating:83, comp:85, creator:'WingKing', verified:false, tags:['3d','wing','defense'], createdAt: new Date(Date.now()-432000000).toISOString() },
  { id:'8', name:'Paint Beast', position:'C', archetype:'Interior Finisher', height:"6'11\"", category:'Center', likes:543, saves:211, views:3200, tier:'A', rating:87, comp:86, creator:'PaintGod', verified:false, tags:['center','paint','dunk'], createdAt: new Date(Date.now()-518400000).toISOString() },
]

function BuildCard({ b, i }: { b: typeof DEMO[0]; i: number }) {
  const [liked, setLiked] = useState(false)
  const [saved, setSaved] = useState(false)

  return (
    <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay: i*0.04 }}
      className="card card-lift p-5 flex flex-col gap-4 cursor-pointer group">

      {/* Top row */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center flex-shrink-0">
            <span className={cn('text-sm font-bold mono', POS_COLOR[b.position])}>{b.position}</span>
          </div>
          <div className="min-w-0">
            <p className="text-fg font-semibold text-sm truncate group-hover:text-rose-400 transition-colors">{b.name}</p>
            <p className="text-fg-subtle text-xs truncate">{b.archetype}</p>
          </div>
        </div>
        <span className={cn('chip flex-shrink-0', TIER_CLASS[b.tier])}>{b.tier}</span>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        <span className="chip chip-muted">{b.height}</span>
        <span className="chip chip-crimson">{b.category}</span>
        {b.tags.slice(0,2).map(t => <span key={t} className="text-xs text-fg-subtle">#{t}</span>)}
      </div>

      {/* Mini stat bars */}
      <div className="space-y-2">
        {[
          { label: 'Rating', value: b.rating, color: '#E11D48' },
          { label: 'Comp',   value: b.comp,   color: '#8B5CF6' },
        ].map(({ label, value, color }) => (
          <div key={label} className="flex items-center gap-2.5">
            <span className="text-fg-subtle text-xs w-10">{label}</span>
            <div className="stat-bar flex-1">
              <div className="stat-bar-fill" style={{ background: color, width: `${value}%` }} />
            </div>
            <span className="mono text-xs text-fg w-6 text-right">{value}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <div className="flex items-center gap-1.5 text-xs text-fg-muted min-w-0">
          <span className="truncate">{b.creator}</span>
          {b.verified && <CheckCircle className="w-3 h-3 text-sky-400 flex-shrink-0" />}
          <span className="text-fg-subtle">· {timeAgo(b.createdAt)}</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={e => { e.stopPropagation(); setLiked(!liked) }}
            className={cn('flex items-center gap-1 text-xs transition-colors', liked ? 'text-rose-400' : 'text-fg-subtle hover:text-rose-400')}>
            <Heart className={cn('w-3.5 h-3.5', liked && 'fill-rose-400')} />
            {formatNumber(b.likes + (liked ? 1 : 0))}
          </button>
          <button onClick={e => { e.stopPropagation(); setSaved(!saved) }}
            className={cn('flex items-center gap-1 text-xs transition-colors', saved ? 'text-sky-400' : 'text-fg-subtle hover:text-sky-400')}>
            <Bookmark className={cn('w-3.5 h-3.5', saved && 'fill-sky-400')} />
            {formatNumber(b.saves + (saved ? 1 : 0))}
          </button>
          <span className="flex items-center gap-1 text-xs text-fg-subtle">
            <Eye className="w-3.5 h-3.5" />
            {formatNumber(b.views)}
          </span>
        </div>
      </div>
    </motion.div>
  )
}

export default function BuildsPage() {
  const [search, setSearch] = useState('')
  const [pos, setPos] = useState('')
  const [cat, setCat] = useState('')
  const [sort, setSort] = useState('likes')
  const [tier, setTier] = useState('')

  const filtered = DEMO.filter(b =>
    (!search || b.name.toLowerCase().includes(search.toLowerCase()) || b.archetype.toLowerCase().includes(search.toLowerCase())) &&
    (!pos || b.position === pos) &&
    (!cat || b.category === cat) &&
    (!tier || b.tier === tier)
  ).sort((a,b) => sort === 'likes' ? b.likes-a.likes : sort === 'views' ? b.views-a.views : new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime())

  return (
    <div className="min-h-screen bg-bg">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-16">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="display text-4xl text-fg">Build Database</h1>
            <p className="text-fg-muted text-sm mt-1">{DEMO.length} community builds — find yours</p>
          </div>
          <Link href="/analyze" className="btn btn-primary gap-2">
            <Plus className="w-4 h-4" /> Share Build
          </Link>
        </div>

        {/* Filter bar */}
        <div className="card p-4 mb-6 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-subtle pointer-events-none" />
            <input className="input pl-9" placeholder="Search builds, archetypes..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="select sm:w-32" value={pos} onChange={e => setPos(e.target.value)}>
            <option value="">All Positions</option>
            {POSITIONS.map(p => <option key={p}>{p}</option>)}
          </select>
          <select className="select sm:w-36" value={cat} onChange={e => setCat(e.target.value)}>
            <option value="">All Categories</option>
            {META_CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <select className="select sm:w-32" value={sort} onChange={e => setSort(e.target.value)}>
            <option value="likes">Most Liked</option>
            <option value="views">Most Viewed</option>
            <option value="newest">Newest</option>
          </select>
        </div>

        {/* Tier pills */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          {[['','All'],['S','S-Tier'],['A','A-Tier'],['B','B-Tier'],['C','C-Tier']].map(([v,l]) => (
            <button key={v} onClick={() => setTier(v)}
              className={cn('chip cursor-pointer transition-all hover:scale-105',
                tier === v ? (v ? TIER_CLASS[v] : 'chip-crimson') : 'chip-muted')}>
              {l}
            </button>
          ))}
          <span className="text-fg-subtle text-xs ml-2">{filtered.length} builds</span>
        </div>

        {/* Grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {filtered.map((b, i) => <BuildCard key={b.id} b={b} i={i} />)}
          </div>
        ) : (
          <div className="text-center py-20">
            <Users className="w-10 h-10 text-fg-subtle mx-auto mb-3" />
            <p className="text-fg-muted">No builds match your filters.</p>
          </div>
        )}
      </div>
    </div>
  )
}
