'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Play, Search, Clock, Eye, Star, Filter } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import { Input } from '@/components/ui/input'
import { cn, formatNumber } from '@/lib/utils'

const TUTORIALS = [
  {
    id: '1', title: 'Best Dribble Moves for Guards in 2K26',
    description: 'Master the most effective dribble combos for guards this season. Break ankles every possession.',
    youtube_id: 'dQw4w9WgXcQ', category: 'Dribbling', difficulty: 'Intermediate',
    tags: ['guards', 'dribbling', 'park'], views: 145000, duration: '12:34',
    creator: 'FlightReacts2K', is_featured: true,
  },
  {
    id: '2', title: 'How to Build a 99 OVR in 2K26 FAST',
    description: 'Complete guide to reaching 99 overall rating the fastest possible way. VC farming included.',
    youtube_id: 'dQw4w9WgXcQ', category: 'Build Creation', difficulty: 'Beginner',
    tags: ['build', 'overall', 'grind'], views: 289000, duration: '18:22',
    creator: 'NBA2KLab', is_featured: true,
  },
  {
    id: '3', title: 'Best Jumpshot 2K26 — Never Miss Again',
    description: 'The statistically best jumpshot for every build type. Greenlighting guide included.',
    youtube_id: 'dQw4w9WgXcQ', category: 'Shooting', difficulty: 'Beginner',
    tags: ['jumpshot', 'shooting', 'green'], views: 421000, duration: '8:45',
    creator: 'NBA2KLab', is_featured: true,
  },
  {
    id: '4', title: 'Advanced Defense Tutorial — Stop Anyone',
    description: 'Elite defensive techniques used by top Rec and Pro-Am players. Perimeter D masterclass.',
    youtube_id: 'dQw4w9WgXcQ', category: 'Defense', difficulty: 'Advanced',
    tags: ['defense', 'lock', 'comp'], views: 98000, duration: '15:10',
    creator: 'KingJosiah2K', is_featured: false,
  },
  {
    id: '5', title: 'Park Tips for Beginners',
    description: 'Survive and thrive in NBA 2K26 Park. Learn the unwritten rules and meta strategies.',
    youtube_id: 'dQw4w9WgXcQ', category: 'Meta', difficulty: 'Beginner',
    tags: ['park', 'tips', 'beginner'], views: 67000, duration: '9:30',
    creator: 'Troydan', is_featured: false,
  },
  {
    id: '6', title: 'Post Game Masterclass — Destroy Bigs',
    description: 'Post fade, drop step, hook shot — complete post game guide for center builds.',
    youtube_id: 'dQw4w9WgXcQ', category: 'Playmaking', difficulty: 'Intermediate',
    tags: ['post', 'center', 'bigs'], views: 54000, duration: '11:20',
    creator: 'LowPostLord', is_featured: false,
  },
  {
    id: '7', title: 'Badge Tier List 2K26 — Every Badge Ranked',
    description: 'Full badge tier list with testing data. Know exactly which badges to prioritize.',
    youtube_id: 'dQw4w9WgXcQ', category: 'Build Creation', difficulty: 'Intermediate',
    tags: ['badges', 'tier list', 'optimize'], views: 312000, duration: '22:45',
    creator: 'NBA2KLab', is_featured: false,
  },
  {
    id: '8', title: 'Pro-Am Winning Strategy Guide',
    description: 'Team composition, communication, and game plans for dominating Pro-Am.',
    youtube_id: 'dQw4w9WgXcQ', category: 'Advanced', difficulty: 'Advanced',
    tags: ['pro-am', 'team', 'strategy'], views: 43000, duration: '19:00',
    creator: 'ProAmKing', is_featured: false,
  },
]

const CATEGORIES = ['All', 'Dribbling', 'Shooting', 'Defense', 'Playmaking', 'Build Creation', 'Meta', 'Advanced']
const DIFFICULTIES = ['All', 'Beginner', 'Intermediate', 'Advanced']
const DIFFICULTY_COLORS: Record<string, string> = {
  Beginner: 'text-green-400 bg-green-400/10 border-green-400/20',
  Intermediate: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  Advanced: 'text-crimson bg-crimson/10 border-crimson/20',
}

function TutorialCard({ tutorial, index }: { tutorial: typeof TUTORIALS[0]; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -4 }}
      className="glass-card overflow-hidden group cursor-pointer"
    >
      {/* Thumbnail */}
      <div className="relative bg-surface aspect-video flex items-center justify-center border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-crimson/10 to-purple-600/10" />
        <div className="w-14 h-14 rounded-full bg-crimson/20 border border-crimson/40 flex items-center justify-center group-hover:scale-110 transition-transform relative z-10">
          <Play className="w-6 h-6 text-crimson fill-crimson ml-0.5" />
        </div>
        {tutorial.is_featured && (
          <div className="absolute top-2 left-2 bg-crimson text-white text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1">
            <Star className="w-3 h-3 fill-white" />
            Featured
          </div>
        )}
        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded font-mono">
          {tutorial.duration}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className={cn('text-xs font-semibold border px-2 py-0.5 rounded-lg', DIFFICULTY_COLORS[tutorial.difficulty])}>
            {tutorial.difficulty}
          </span>
          <span className="text-xs text-text-muted bg-surface border border-border px-2 py-0.5 rounded-lg">
            {tutorial.category}
          </span>
        </div>

        <h3 className="text-sm font-bold text-text-primary mb-1.5 line-clamp-2 group-hover:text-crimson transition-colors">
          {tutorial.title}
        </h3>
        <p className="text-xs text-text-muted line-clamp-2 mb-3">{tutorial.description}</p>

        <div className="flex items-center justify-between text-xs text-text-muted">
          <span className="font-medium text-text-secondary">{tutorial.creator}</span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              {formatNumber(tutorial.views)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {tutorial.duration}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default function TutorialsPage() {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [activeDifficulty, setActiveDifficulty] = useState('All')

  const filtered = TUTORIALS.filter((t) => {
    const matchesSearch = !search || t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.tags.some((tag) => tag.includes(search.toLowerCase()))
    const matchesCategory = activeCategory === 'All' || t.category === activeCategory
    const matchesDifficulty = activeDifficulty === 'All' || t.difficulty === activeDifficulty
    return matchesSearch && matchesCategory && matchesDifficulty
  })

  const featured = filtered.filter((t) => t.is_featured)
  const rest = filtered.filter((t) => !t.is_featured)

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-crimson/10 border border-crimson/20 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-crimson" />
            </div>
            <span className="text-crimson text-sm font-semibold tracking-wider uppercase">Tutorial Hub</span>
          </div>
          <h1 className="text-4xl font-black font-display text-text-primary">Learn 2K26</h1>
          <p className="text-text-secondary mt-1">Curated tutorials from top creators. Matched to your build and skill level.</p>
        </div>

        {/* Filters */}
        <div className="glass-card p-4 mb-6 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <Input
              placeholder="Search tutorials, topics, or tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all',
                  activeCategory === cat
                    ? 'bg-crimson border-crimson text-white'
                    : 'bg-surface border-border text-text-secondary hover:text-text-primary hover:border-crimson/30'
                )}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {DIFFICULTIES.map((d) => (
              <button
                key={d}
                onClick={() => setActiveDifficulty(d)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                  activeDifficulty === d
                    ? 'bg-purple-600/20 border-purple-600/40 text-purple-400'
                    : 'bg-surface border-border text-text-secondary hover:text-text-primary'
                )}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Featured */}
        {featured.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4 flex items-center gap-2">
              <Star className="w-3.5 h-3.5 text-yellow-400" />
              Featured Tutorials
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {featured.map((t, i) => <TutorialCard key={t.id} tutorial={t} index={i} />)}
            </div>
          </div>
        )}

        {/* All tutorials */}
        {rest.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">
              All Tutorials
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {rest.map((t, i) => <TutorialCard key={t.id} tutorial={t} index={i} />)}
            </div>
          </div>
        )}

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <BookOpen className="w-12 h-12 text-text-muted mx-auto mb-4" />
            <p className="text-text-secondary">No tutorials match your search.</p>
          </div>
        )}
      </div>
    </div>
  )
}
