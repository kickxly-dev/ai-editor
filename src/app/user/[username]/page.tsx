'use client'
import { useState, useEffect, use } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  Crown, ShieldCheck, Shield, Zap, Eye, Heart,
  Calendar, Loader2, ChevronRight, ArrowLeft,
} from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import { cn } from '@/lib/utils'

interface PublicProfile {
  username: string
  name: string | null
  bio: string | null
  isPremium: boolean
  isVerified: boolean
  isAdmin: boolean
  totalBuilds: number
  joinedAt: string | null
}

interface Build {
  id: number
  name: string
  position: string
  height: string | null
  archetype: string | null
  overall_rating: number
  meta_viability: string | null
  likes: number
  views: number
  created_at: string
}

const TIER_COLORS: Record<string, string> = {
  S: 'text-amber-300 bg-amber-400/10 border-amber-400/30',
  A: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
  B: 'text-sky-400 bg-sky-400/10 border-sky-400/30',
  C: 'text-orange-400 bg-orange-400/10 border-orange-400/30',
  D: 'text-zinc-400 bg-zinc-400/10 border-zinc-400/30',
}

const POS_COLORS: Record<string, string> = {
  PG: 'text-sky-400', SG: 'text-emerald-400', SF: 'text-amber-400',
  PF: 'text-orange-400', C: 'text-rose-400',
}

function timeAgo(d: string): string {
  const diff = Date.now() - new Date(d).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'today'
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  if (days < 365) return `${Math.floor(days / 30)}mo ago`
  return `${Math.floor(days / 365)}y ago`
}

function joinedDate(d: string | null) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

export default function PublicProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params)
  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [builds, setBuilds] = useState<Build[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    fetch(`/api/user/${encodeURIComponent(username)}`)
      .then(r => {
        if (r.status === 404) { setNotFound(true); return null }
        return r.json()
      })
      .then(d => {
        if (!d) return
        if (d.user) setProfile(d.user)
        if (d.builds) setBuilds(d.builds)
      })
      .finally(() => setLoading(false))
  }, [username])

  const totalLikes = builds.reduce((s, b) => s + (b.likes ?? 0), 0)
  const totalViews = builds.reduce((s, b) => s + (b.views ?? 0), 0)

  if (loading) return (
    <AppLayout>
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-6 h-6 animate-spin text-rose-400" />
      </div>
    </AppLayout>
  )

  if (notFound || !profile) return (
    <AppLayout>
      <div className="max-w-xl mx-auto px-4 pt-16 text-center">
        <p className="text-4xl mb-4">👻</p>
        <p className="text-fg font-semibold mb-2">Player not found</p>
        <p className="text-fg-muted text-sm mb-6">@{username} doesn&apos;t exist or hasn&apos;t set a username yet.</p>
        <Link href="/leaderboard" className="btn btn-secondary gap-2">
          <ArrowLeft className="w-4 h-4" /> Leaderboard
        </Link>
      </div>
    </AppLayout>
  )

  const displayName = profile.username || profile.name || username

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 pb-16">

        {/* Profile header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-rose-500 to-violet-600 flex items-center justify-center text-white font-black text-3xl flex-shrink-0">
              {displayName[0].toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h1 className="text-2xl font-bold text-fg">@{profile.username || displayName}</h1>
                {profile.isPremium && (
                  <span className="chip text-xs" style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.22)', color: '#FCD34D' }}>
                    <Crown className="w-2.5 h-2.5 inline mr-1" />Pro
                  </span>
                )}
                {profile.isVerified && (
                  <span className="chip text-xs" style={{ background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)', color: '#7DD3FC' }}>
                    <ShieldCheck className="w-2.5 h-2.5 inline mr-1" />Verified
                  </span>
                )}
                {profile.isAdmin && (
                  <span className="chip text-xs" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.18)', color: '#FBBF24' }}>
                    <Shield className="w-2.5 h-2.5 inline mr-1" />Admin
                  </span>
                )}
              </div>
              {profile.bio ? (
                <p className="text-sm text-fg-muted mb-2">{profile.bio}</p>
              ) : (
                <p className="text-sm text-fg-subtle italic mb-2">No bio set</p>
              )}
              <div className="flex items-center gap-1.5 text-xs text-fg-subtle">
                <Calendar className="w-3.5 h-3.5" />
                <span>Joined {joinedDate(profile.joinedAt)}</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-3 mt-5 pt-5 border-t border-white/[0.05]">
            {[
              { label: 'Public Builds', value: builds.length },
              { label: 'Total Likes', value: totalLikes },
              { label: 'Total Views', value: totalViews },
              { label: 'Total Builds', value: profile.totalBuilds },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <p className="text-xl font-bold text-fg">{value.toLocaleString()}</p>
                <p className="text-xs text-fg-muted">{label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Builds */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h2 className="font-semibold text-fg mb-4">
            Public Builds <span className="text-fg-subtle font-normal">({builds.length})</span>
          </h2>

          {builds.length === 0 ? (
            <div className="card p-12 text-center">
              <Zap className="w-10 h-10 text-fg-subtle mx-auto mb-3" />
              <p className="text-fg-muted">No public builds yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {builds.map((build, i) => (
                <motion.div
                  key={build.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Link
                    href={`/builds/${build.id}`}
                    className="card p-4 hover:bg-white/[0.02] transition-colors group flex flex-col"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-fg truncate group-hover:text-rose-400 transition-colors">
                          {build.name}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={cn('text-xs font-semibold', POS_COLORS[build.position] || 'text-fg-muted')}>
                            {build.position}
                          </span>
                          {build.height && <span className="text-xs text-fg-subtle">· {build.height}</span>}
                          {build.archetype && <span className="text-xs text-fg-subtle truncate">· {build.archetype}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {build.meta_viability && (
                          <span className={cn('chip text-xs font-bold border', TIER_COLORS[build.meta_viability] || '')}>
                            {build.meta_viability}
                          </span>
                        )}
                        {build.overall_rating > 0 && (
                          <span className="text-lg font-black text-fg/70 mono">{build.overall_rating}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-fg-subtle mt-auto">
                      <span className="flex items-center gap-1">
                        <Heart className="w-3 h-3 text-rose-400/50" />{build.likes ?? 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />{build.views ?? 0}
                      </span>
                      <span className="ml-auto">{timeAgo(build.created_at)}</span>
                      <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </AppLayout>
  )
}
