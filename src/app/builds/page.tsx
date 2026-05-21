'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Search, Filter, Heart, Bookmark, Eye, Star,
  Users, Plus, TrendingUp, ChevronDown, BarChart2,
  Shield, Zap, CheckCircle,
} from 'lucide-react'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Build } from '@/types'
import { cn, formatNumber, getMetaTierColor, META_CATEGORIES, POSITIONS, timeAgo } from '@/lib/utils'
import toast from 'react-hot-toast'

// Demo builds for when Supabase is not connected
const DEMO_BUILDS: Partial<Build>[] = [
  {
    id: '1', name: 'Park God Guard', position: 'PG', archetype: 'Shot Creator',
    height: "6'4\"", wingspan: 'Maximum', category: 'Park',
    likes: 2847, saves: 1203, views: 18500,
    tags: ['park', 'iso', 'handles'],
    ai_analysis: { meta_viability: 'S', overall_rating: 94, skill_ceiling: 92, competitiveness: 91,
      archetype: 'Shot Creator', strengths: [], weaknesses: [], playstyle_summary: '',
      offensive_role: '', defensive_role: '', upgrade_recommendations: [],
      badge_recommendations: [], animation_recommendations: [], takeover_recommendation: '' },
    profiles: { username: 'KingJosiah', is_verified: true } as never,
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: '2', name: 'Rim Destroyer', position: 'C', archetype: 'Glass Cleaner Finisher',
    height: "7'0\"", wingspan: 'Maximum', category: 'Rec',
    likes: 1923, saves: 876, views: 12400,
    tags: ['center', 'rim', 'defense'],
    ai_analysis: { meta_viability: 'S', overall_rating: 91, skill_ceiling: 89, competitiveness: 93,
      archetype: 'Glass Cleaner Finisher', strengths: [], weaknesses: [], playstyle_summary: '',
      offensive_role: '', defensive_role: '', upgrade_recommendations: [],
      badge_recommendations: [], animation_recommendations: [], takeover_recommendation: '' },
    profiles: { username: 'BigManMike', is_verified: false } as never,
    created_at: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: '3', name: 'Two-Way Lock', position: 'SF', archetype: 'Two-Way Slasher',
    height: "6'7\"", wingspan: 'Maximum', category: 'Pro-Am',
    likes: 1456, saves: 654, views: 9800,
    tags: ['defense', 'lock', 'two-way'],
    ai_analysis: { meta_viability: 'A', overall_rating: 88, skill_ceiling: 90, competitiveness: 87,
      archetype: 'Two-Way Slasher', strengths: [], weaknesses: [], playstyle_summary: '',
      offensive_role: '', defensive_role: '', upgrade_recommendations: [],
      badge_recommendations: [], animation_recommendations: [], takeover_recommendation: '' },
    profiles: { username: 'LockGod23', is_verified: true } as never,
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: '4', name: 'Comp Popper 4', position: 'PF', archetype: 'Stretch Four',
    height: "6'9\"", wingspan: 'Above Average', category: 'Popper',
    likes: 1102, saves: 489, views: 7200,
    tags: ['shooting', 'popper', 'stretch'],
    ai_analysis: { meta_viability: 'A', overall_rating: 86, skill_ceiling: 88, competitiveness: 84,
      archetype: 'Stretch Four', strengths: [], weaknesses: [], playstyle_summary: '',
      offensive_role: '', defensive_role: '', upgrade_recommendations: [],
      badge_recommendations: [], animation_recommendations: [], takeover_recommendation: '' },
    profiles: { username: 'PopperKing', is_verified: false } as never,
    created_at: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: '5', name: 'ISO Demon SG', position: 'SG', archetype: 'Scoring Machine',
    height: "6'5\"", wingspan: 'Normal', category: 'ISO',
    likes: 987, saves: 412, views: 6100,
    tags: ['iso', 'scoring', 'midrange'],
    ai_analysis: { meta_viability: 'B', overall_rating: 84, skill_ceiling: 87, competitiveness: 82,
      archetype: 'Scoring Machine', strengths: [], weaknesses: [], playstyle_summary: '',
      offensive_role: '', defensive_role: '', upgrade_recommendations: [],
      badge_recommendations: [], animation_recommendations: [], takeover_recommendation: '' },
    profiles: { username: 'ISOFiend', is_verified: false } as never,
    created_at: new Date(Date.now() - 259200000).toISOString(),
  },
  {
    id: '6', name: 'Pure Playmaker', position: 'PG', archetype: 'Playmaking Shot Creator',
    height: "6'2\"", wingspan: 'Above Average', category: 'Comp Guard',
    likes: 876, saves: 334, views: 5400,
    tags: ['playmaking', 'assists', 'comp'],
    ai_analysis: { meta_viability: 'A', overall_rating: 89, skill_ceiling: 93, competitiveness: 90,
      archetype: 'Playmaking Shot Creator', strengths: [], weaknesses: [], playstyle_summary: '',
      offensive_role: '', defensive_role: '', upgrade_recommendations: [],
      badge_recommendations: [], animation_recommendations: [], takeover_recommendation: '' },
    profiles: { username: 'DimeDropper', is_verified: true } as never,
    created_at: new Date(Date.now() - 345600000).toISOString(),
  },
]

const POSITION_COLORS: Record<string, string> = {
  PG: 'text-neon-blue', SG: 'text-green-400',
  SF: 'text-yellow-400', PF: 'text-orange-400', C: 'text-crimson',
}

function BuildCard({ build, index }: { build: Partial<Build>; index: number }) {
  const [liked, setLiked] = useState(false)
  const [saved, setSaved] = useState(false)
  const tier = build.ai_analysis?.meta_viability || 'C'
  const tierClass = getMetaTierColor(tier)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -4 }}
      className="glass-card p-5 hover:border-crimson/20 transition-all duration-300 group cursor-pointer"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-crimson/20 to-purple-600/20 border border-crimson/20 flex items-center justify-center">
            <span className={`text-sm font-bold ${POSITION_COLORS[build.position || 'PG']}`}>
              {build.position}
            </span>
          </div>
          <div>
            <h3 className="text-text-primary font-bold text-sm group-hover:text-crimson transition-colors">
              {build.name}
            </h3>
            <p className="text-text-muted text-xs">{build.archetype}</p>
          </div>
        </div>
        <div className={cn('px-2 py-1 rounded-lg border text-xs font-bold', tierClass)}>
          {tier}
        </div>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="text-xs text-text-muted bg-surface border border-border px-2 py-0.5 rounded-lg">
          {build.height}
        </span>
        <span className="text-xs text-text-muted bg-surface border border-border px-2 py-0.5 rounded-lg">
          {build.wingspan} WS
        </span>
        <span className="text-xs text-crimson bg-crimson/10 border border-crimson/20 px-2 py-0.5 rounded-lg capitalize">
          {build.category}
        </span>
      </div>

      {/* Tags */}
      {build.tags && build.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {build.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="text-xs text-text-muted">#{tag}</span>
          ))}
        </div>
      )}

      {/* Score bars */}
      <div className="space-y-1.5 mb-4">
        {[
          { label: 'Rating', value: build.ai_analysis?.overall_rating || 80, color: '#DC143C' },
          { label: 'Comp', value: build.ai_analysis?.competitiveness || 75, color: '#7C3AED' },
        ].map(({ label, value, color }) => (
          <div key={label} className="flex items-center gap-2">
            <span className="text-xs text-text-muted w-10">{label}</span>
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${value}%`, background: color }} />
            </div>
            <span className="text-xs text-text-primary font-mono w-6 text-right">{value}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-border">
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">by</span>
          <span className="text-xs text-text-primary font-medium flex items-center gap-1">
            {(build.profiles as { username?: string; is_verified?: boolean })?.username}
            {(build.profiles as { username?: string; is_verified?: boolean })?.is_verified && (
              <CheckCircle className="w-3 h-3 text-neon-blue" />
            )}
          </span>
          <span className="text-xs text-text-muted">{timeAgo(build.created_at || '')}</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={(e) => { e.stopPropagation(); setLiked(!liked) }}
            className={cn('flex items-center gap-1 text-xs transition-colors', liked ? 'text-crimson' : 'text-text-muted hover:text-crimson')}
          >
            <Heart className={cn('w-3.5 h-3.5', liked && 'fill-crimson')} />
            {formatNumber((build.likes || 0) + (liked ? 1 : 0))}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setSaved(!saved) }}
            className={cn('flex items-center gap-1 text-xs transition-colors', saved ? 'text-neon-blue' : 'text-text-muted hover:text-neon-blue')}
          >
            <Bookmark className={cn('w-3.5 h-3.5', saved && 'fill-neon-blue')} />
            {formatNumber((build.saves || 0) + (saved ? 1 : 0))}
          </button>
          <span className="flex items-center gap-1 text-xs text-text-muted">
            <Eye className="w-3.5 h-3.5" />
            {formatNumber(build.views || 0)}
          </span>
        </div>
      </div>
    </motion.div>
  )
}

export default function BuildsPage() {
  const [builds, setBuilds] = useState<Partial<Build>[]>(DEMO_BUILDS)
  const [search, setSearch] = useState('')
  const [selectedPosition, setSelectedPosition] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [sortBy, setSortBy] = useState('likes')
  const [loading, setLoading] = useState(false)

  const filtered = builds.filter((b) => {
    const matchesSearch = !search || b.name?.toLowerCase().includes(search.toLowerCase()) ||
      b.archetype?.toLowerCase().includes(search.toLowerCase())
    const matchesPosition = !selectedPosition || b.position === selectedPosition
    const matchesCategory = !selectedCategory || b.category === selectedCategory
    return matchesSearch && matchesPosition && matchesCategory
  })

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'likes') return (b.likes || 0) - (a.likes || 0)
    if (sortBy === 'newest') return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    if (sortBy === 'views') return (b.views || 0) - (a.views || 0)
    return 0
  })

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-black font-display text-text-primary">Build Database</h1>
            <p className="text-text-secondary mt-1">
              {builds.length.toLocaleString()} community builds — find yours
            </p>
          </div>
          <Link href="/analyze">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Share My Build
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="glass-card p-4 mb-6 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <Input
              placeholder="Search builds, archetypes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={selectedPosition}
            onChange={(e) => setSelectedPosition(e.target.value)}
            className="input-dark w-full sm:w-32"
          >
            <option value="">All Positions</option>
            {POSITIONS.map((p) => <option key={p}>{p}</option>)}
          </select>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="input-dark w-full sm:w-36"
          >
            <option value="">All Categories</option>
            {META_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="input-dark w-full sm:w-32"
          >
            <option value="likes">Most Liked</option>
            <option value="newest">Newest</option>
            <option value="views">Most Viewed</option>
          </select>
        </div>

        {/* Tier filter pills */}
        <div className="flex flex-wrap gap-2 mb-6">
          {['S', 'A', 'B', 'C', 'D'].map((tier) => (
            <button
              key={tier}
              className={cn(
                'px-3 py-1 rounded-lg border text-xs font-bold transition-all',
                getMetaTierColor(tier),
                'hover:scale-105'
              )}
            >
              {tier}-Tier
            </button>
          ))}
          <span className="text-xs text-text-muted flex items-center px-2">
            Showing {sorted.length} builds
          </span>
        </div>

        {/* Builds Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {sorted.map((build, i) => (
            <BuildCard key={build.id} build={build} index={i} />
          ))}
        </div>

        {sorted.length === 0 && (
          <div className="text-center py-16">
            <Users className="w-12 h-12 text-text-muted mx-auto mb-4" />
            <p className="text-text-secondary">No builds match your filters.</p>
          </div>
        )}
      </div>
    </div>
  )
}
