'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  User, Star, Heart, Bookmark, BarChart3, TrendingUp,
  Settings, Share2, CheckCircle, Zap, Brain,
} from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import { formatNumber } from '@/lib/utils'

const MOCK_BUILDS = [
  { id: '1', name: 'Park God', position: 'PG', category: 'Park', likes: 234, tier: 'S', archetype: 'Shot Creator' },
  { id: '2', name: 'Two-Way SF', position: 'SF', category: 'Pro-Am', likes: 87, tier: 'A', archetype: 'Two-Way Slasher' },
]

const TIER_COLORS: Record<string, string> = {
  S: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
  A: 'text-green-400 bg-green-400/10 border-green-400/30',
  B: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
}

export default function ProfilePage() {
  const user = {
    username: 'MyPlayer',
    bio: 'Park Legend | Shot Creator main | 2K since 2K17',
    is_verified: false,
    is_premium: false,
    total_builds: 2,
    total_likes: 321,
    followers: 48,
    following: 23,
    created_at: '2024-01-15',
  }

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 pb-16">
        {/* Profile header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 mb-6"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Avatar */}
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-crimson to-purple-600 flex items-center justify-center">
                <User className="w-10 h-10 text-white" />
              </div>
              {user.is_verified && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-neon-blue rounded-full flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-black font-display text-text-primary">{user.username}</h1>
                {user.is_premium && (
                  <span className="text-xs font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent border border-yellow-400/30 px-2 py-0.5 rounded-full">
                    PRO
                  </span>
                )}
              </div>
              <p className="text-text-secondary text-sm mb-3">{user.bio}</p>
              <div className="flex flex-wrap gap-4 text-sm">
                {[
                  { label: 'Builds', value: user.total_builds },
                  { label: 'Likes', value: user.total_likes },
                  { label: 'Followers', value: user.followers },
                  { label: 'Following', value: user.following },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <span className="font-bold text-text-primary">{formatNumber(value)}</span>
                    <span className="text-text-muted ml-1">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" className="gap-1.5">
                <Share2 className="w-3.5 h-3.5" />
                Share
              </Button>
              <Button variant="secondary" size="icon-sm">
                <Settings className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { icon: BarChart3, label: 'Analyses Run', value: '7', color: 'text-crimson' },
            { icon: Brain, label: 'Coach Sessions', value: '12', color: 'text-neon-blue' },
            { icon: Bookmark, label: 'Saved Builds', value: '24', color: 'text-purple-400' },
            { icon: TrendingUp, label: 'Days Active', value: '47', color: 'text-green-400' },
          ].map(({ icon: Icon, label, value, color }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="glass-card p-4"
            >
              <Icon className={`w-5 h-5 ${color} mb-2`} />
              <p className="text-2xl font-black font-display text-text-primary">{value}</p>
              <p className="text-xs text-text-muted">{label}</p>
            </motion.div>
          ))}
        </div>

        {/* My Builds */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-text-primary">My Builds</h2>
            <Link href="/analyze">
              <Button size="sm" className="gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                New Build
              </Button>
            </Link>
          </div>

          {MOCK_BUILDS.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {MOCK_BUILDS.map((build, i) => (
                <motion.div
                  key={build.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="glass-card p-5 hover:border-crimson/20 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-bold text-text-primary group-hover:text-crimson transition-colors">{build.name}</p>
                      <p className="text-xs text-text-muted">{build.archetype} · {build.position}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-lg border text-xs font-bold ${TIER_COLORS[build.tier]}`}>
                      {build.tier}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-text-muted">
                    <span className="bg-surface border border-border px-2 py-0.5 rounded-lg capitalize">{build.category}</span>
                    <span className="flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5 text-crimson" />
                      {formatNumber(build.likes)}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="glass-card p-12 text-center">
              <Zap className="w-10 h-10 text-text-muted mx-auto mb-4" />
              <p className="text-text-secondary mb-4">No builds yet. Analyze your first build!</p>
              <Link href="/analyze">
                <Button>Analyze Build</Button>
              </Link>
            </div>
          )}
        </div>

        {/* Upgrade CTA */}
        {!user.is_premium && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 border border-yellow-400/20 bg-yellow-400/5"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center flex-shrink-0">
                <Star className="w-6 h-6 text-yellow-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-text-primary">Upgrade to Pro</h3>
                <p className="text-text-muted text-sm">Unlock unlimited analyses, video analysis, priority AI coaching, and exclusive meta insights.</p>
              </div>
              <Button className="flex-shrink-0 gap-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 border-0">
                <Star className="w-4 h-4" />
                Upgrade — $9.99/mo
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </AppLayout>
  )
}
