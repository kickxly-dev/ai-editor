'use client'
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, Play, Search, Clock, Eye, Star, RefreshCw, ExternalLink } from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import { cn } from '@/lib/utils'
import type { TutorialVideo } from '@/lib/youtube-scraper'

const CATEGORIES = ['All', 'Shooting', 'Dribbling', 'Build', 'Defense', 'Badges', 'Playmaking', 'Meta', 'Park']
const DIFFICULTIES = ['All', 'Beginner', 'Intermediate', 'Advanced']

const DIFF_STYLE: Record<string, string> = {
  Beginner:     'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Intermediate: 'bg-amber-500/10  text-amber-400  border-amber-500/20',
  Advanced:     'bg-rose-500/10   text-rose-400   border-rose-500/20',
}

function ThumbnailImage({ id, title }: { id: string; title: string }) {
  const [err, setErr] = useState(false)
  if (err) {
    return (
      <div className="absolute inset-0 flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, rgba(225,29,72,0.15), rgba(139,92,246,0.1))' }}>
        <Play className="w-10 h-10 text-white/30" />
      </div>
    )
  }
  return (
    <img
      src={`https://img.youtube.com/vi/${id}/hqdefault.jpg`}
      alt={title}
      className="absolute inset-0 w-full h-full object-cover"
      onError={() => setErr(true)}
    />
  )
}

function VideoCard({ v, i }: { v: TutorialVideo; i: number }) {
  return (
    <motion.a
      href={v.url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.04, type: 'spring', stiffness: 200, damping: 25 }}
      whileHover={{ y: -4, transition: { type: 'spring', stiffness: 400, damping: 20 } }}
      className="card card-lift block overflow-hidden group"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-surface overflow-hidden">
        <ThumbnailImage id={v.id} title={v.title} />

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-rose-500/90 flex items-center justify-center backdrop-blur-sm">
            <Play className="w-6 h-6 text-white fill-white ml-0.5" />
          </div>
        </div>

        {/* Featured badge */}
        {v.featured && (
          <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold text-white"
            style={{ background: 'rgba(225,29,72,0.9)', backdropFilter: 'blur(8px)' }}>
            <Star className="w-2.5 h-2.5 fill-white" /> Featured
          </div>
        )}

        {/* Duration */}
        {v.duration && (
          <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-bold text-white mono"
            style={{ background: 'rgba(0,0,0,0.8)' }}>
            {v.duration}
          </div>
        )}

        {/* YouTube icon */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <ExternalLink className="w-4 h-4 text-white/70" />
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2.5">
          <span className={cn('text-[10px] font-bold border px-2 py-0.5 rounded-full', DIFF_STYLE[v.difficulty] || '')}>
            {v.difficulty}
          </span>
          <span className="text-[10px] font-semibold text-white/30 uppercase tracking-wide">{v.category}</span>
        </div>

        <h3 className="text-sm font-semibold text-white mb-1.5 line-clamp-2 group-hover:text-rose-400 transition-colors leading-snug">
          {v.title}
        </h3>

        <div className="flex items-center justify-between text-xs text-white/30 mt-3">
          <span className="font-medium text-white/50 truncate max-w-[120px]">{v.channel}</span>
          <div className="flex items-center gap-3 flex-shrink-0">
            {v.views && (
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />{v.views.replace(' views', '')}
              </span>
            )}
            {v.publishedAt && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />{v.publishedAt}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.a>
  )
}

function SkeletonCard() {
  return (
    <div className="card overflow-hidden">
      <div className="aspect-video skeleton" />
      <div className="p-4 space-y-2.5">
        <div className="flex gap-2">
          <div className="skeleton h-4 w-20 rounded-full" />
          <div className="skeleton h-4 w-16 rounded-full" />
        </div>
        <div className="skeleton h-4 rounded w-full" />
        <div className="skeleton h-4 rounded w-3/4" />
        <div className="skeleton h-3 rounded w-1/2 mt-3" />
      </div>
    </div>
  )
}

export default function TutorialsPage() {
  const [tutorials, setTutorials] = useState<TutorialVideo[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [cat, setCat] = useState('All')
  const [diff, setDiff] = useState('All')

  const fetchTutorials = useCallback(async (force = false) => {
    if (force) setRefreshing(true)
    else setLoading(true)
    try {
      const res = await fetch(`/api/tutorials${force ? '?refresh=1' : ''}`)
      const data = await res.json()
      if (data.tutorials) setTutorials(data.tutorials)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { fetchTutorials() }, [fetchTutorials])

  const filtered = tutorials.filter(t => {
    const q = search.toLowerCase()
    const matchSearch = !q || t.title.toLowerCase().includes(q) || t.channel.toLowerCase().includes(q) || t.category.toLowerCase().includes(q)
    const matchCat = cat === 'All' || t.category === cat
    const matchDiff = diff === 'All' || t.difficulty === diff
    return matchSearch && matchCat && matchDiff
  })

  const featured = filtered.filter(t => t.featured)
  const rest = filtered.filter(t => !t.featured)

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-16">

        {/* Header */}
        <div className="flex items-start justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(225,29,72,0.09)', border: '1px solid rgba(225,29,72,0.16)' }}>
                <BookOpen className="w-5 h-5 text-rose-400" />
              </div>
              <span className="text-rose-400 text-[10px] font-bold tracking-[0.2em] uppercase">Tutorial Hub</span>
            </div>
            <h1 className="display text-4xl text-white mb-1">Learn 2K26</h1>
            <p className="text-white/35 text-sm">Real videos from top creators — scraped fresh from YouTube</p>
          </div>
          <button onClick={() => fetchTutorials(true)} disabled={refreshing || loading}
            className="btn btn-secondary btn-sm gap-1.5 flex-shrink-0">
            <RefreshCw className={cn('w-3.5 h-3.5', refreshing && 'animate-spin')} />
            {refreshing ? 'Fetching...' : 'Refresh'}
          </button>
        </div>

        {/* Filters */}
        <div className="card p-4 mb-6 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
            <input
              className="input pl-10"
              placeholder="Search tutorials, creators, topics..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setCat(c)}
                className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all',
                  cat === c
                    ? 'bg-rose-500 border-rose-500 text-white'
                    : 'bg-transparent border-white/08 text-white/35 hover:text-white hover:border-white/20'
                )}>
                {c}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {DIFFICULTIES.map(d => (
              <button key={d} onClick={() => setDiff(d)}
                className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all',
                  diff === d
                    ? 'bg-violet-500/20 border-violet-500/40 text-violet-400'
                    : 'bg-transparent border-white/08 text-white/30 hover:text-white hover:border-white/20'
                )}>
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {!loading && (
          <AnimatePresence mode="wait">
            <motion.div key={cat + diff + search} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {/* Featured */}
              {featured.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-[10px] font-bold text-white/25 uppercase tracking-[0.18em] mb-4 flex items-center gap-2">
                    <Star className="w-3.5 h-3.5 text-amber-400" /> Featured
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {featured.map((v, i) => <VideoCard key={v.id} v={v} i={i} />)}
                  </div>
                </div>
              )}

              {/* All */}
              {rest.length > 0 && (
                <div>
                  {featured.length > 0 && (
                    <h2 className="text-[10px] font-bold text-white/25 uppercase tracking-[0.18em] mb-4">
                      More Tutorials
                    </h2>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {rest.map((v, i) => <VideoCard key={v.id} v={v} i={i} />)}
                  </div>
                </div>
              )}

              {filtered.length === 0 && !loading && (
                <div className="text-center py-20">
                  <BookOpen className="w-12 h-12 text-white/15 mx-auto mb-4" />
                  <p className="text-white/30 text-sm">No tutorials match your search</p>
                  <button onClick={() => { setSearch(''); setCat('All'); setDiff('All') }}
                    className="btn btn-ghost btn-sm mt-3 text-rose-400">Clear filters</button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </AppLayout>
  )
}
