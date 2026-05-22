'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  User, Edit2, Check, X, Crown, ShieldCheck, Shield,
  Zap, Eye, Heart, Calendar, Loader2, ExternalLink
} from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import { cn } from '@/lib/utils'

interface UserProfile {
  id: string
  username: string | null
  name: string | null
  email: string | null
  bio: string | null
  isPremium: boolean
  isVerified: boolean
  isAdmin: boolean
  totalBuilds: number
  joinedAt: string | null
}

interface Build {
  id: string | number
  name: string
  position: string
  height: string
  archetype: string
  overall_rating: number
  meta_viability: string
  likes: number
  views: number
  is_public: boolean
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

function timeAgo(d: string | null) {
  if (!d) return ''
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

export default function ProfilePage() {
  const { data: session } = useSession()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [builds, setBuilds] = useState<Build[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editUsername, setEditUsername] = useState('')
  const [editBio, setEditBio] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    fetch('/api/profile')
      .then((r) => r.json())
      .then((d) => {
        if (d.user) {
          setProfile(d.user)
          setEditUsername(d.user.username || '')
          setEditBio(d.user.bio || '')
        }
        if (d.builds) setBuilds(d.builds)
      })
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setSaveError('')
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: editUsername, bio: editBio }),
      })
      const data = await res.json()
      if (!res.ok) {
        setSaveError(data.error || 'Failed to save')
        return
      }
      setProfile((prev) => prev ? { ...prev, username: editUsername, bio: editBio } : prev)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const displayName = profile?.username || profile?.name || session?.user?.email?.split('@')[0] || 'Player'
  const totalLikes = builds.reduce((sum, b) => sum + (b.likes || 0), 0)
  const totalViews = builds.reduce((sum, b) => sum + (b.views || 0), 0)

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 pb-16">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-rose-400" />
          </div>
        ) : (
          <>
            {/* Profile Header */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card p-6 mb-6">
              <div className="flex flex-col sm:flex-row items-start gap-5">
                {/* Avatar */}
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-rose-500 to-violet-600 flex items-center justify-center text-white font-black text-3xl flex-shrink-0">
                  {displayName[0].toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  {editing ? (
                    <div className="space-y-3 mb-3">
                      <div>
                        <label className="text-xs font-semibold text-fg-muted uppercase tracking-wider mb-1 block">Username</label>
                        <input
                          value={editUsername}
                          onChange={(e) => setEditUsername(e.target.value)}
                          className="input text-sm"
                          placeholder="your_username"
                          maxLength={30}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-fg-muted uppercase tracking-wider mb-1 block">Bio</label>
                        <textarea
                          value={editBio}
                          onChange={(e) => setEditBio(e.target.value)}
                          className="input text-sm resize-none"
                          rows={2}
                          placeholder="Park Legend | Shot Creator main..."
                          maxLength={160}
                        />
                      </div>
                      {saveError && <p className="text-xs text-rose-400">{saveError}</p>}
                      <div className="flex gap-2">
                        <button onClick={handleSave} disabled={saving} className="btn btn-primary btn-sm gap-1.5">
                          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                          Save
                        </button>
                        <button onClick={() => { setEditing(false); setSaveError('') }} className="btn btn-secondary btn-sm gap-1.5">
                          <X className="w-3.5 h-3.5" /> Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h1 className="text-2xl font-bold text-fg">{displayName}</h1>
                        <div className="flex items-center gap-1.5">
                          {profile?.isPremium && (
                            <span className="chip text-xs" style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.22)', color: '#FCD34D' }}>
                              <Crown className="w-2.5 h-2.5 inline mr-1" />Pro
                            </span>
                          )}
                          {profile?.isVerified && (
                            <span className="chip text-xs" style={{ background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)', color: '#7DD3FC' }}>
                              <ShieldCheck className="w-2.5 h-2.5 inline mr-1" />Verified
                            </span>
                          )}
                          {profile?.isAdmin && (
                            <span className="chip text-xs" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.18)', color: '#FBBF24' }}>
                              <Shield className="w-2.5 h-2.5 inline mr-1" />Admin
                            </span>
                          )}
                        </div>
                      </div>
                      {profile?.bio ? (
                        <p className="text-sm text-fg-muted mb-2">{profile.bio}</p>
                      ) : (
                        <p className="text-sm text-fg-subtle mb-2 italic">No bio set — click Edit to add one</p>
                      )}
                      <div className="flex items-center gap-1.5 text-xs text-fg-subtle">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Joined {joinedDate(profile?.joinedAt ?? null)}</span>
                      </div>
                    </>
                  )}
                </div>

                {!editing && (
                  <button
                    onClick={() => setEditing(true)}
                    className="btn btn-secondary btn-sm gap-1.5 flex-shrink-0"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit Profile
                  </button>
                )}
              </div>

              {/* Stats strip */}
              <div className="grid grid-cols-4 gap-3 mt-5 pt-5 border-t border-white/[0.05]">
                {[
                  { label: 'Builds', value: profile?.totalBuilds ?? builds.length },
                  { label: 'Total Likes', value: totalLikes },
                  { label: 'Total Views', value: totalViews },
                  { label: 'Public', value: builds.filter((b) => b.is_public).length },
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
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-fg">My Builds</h2>
                <Link href="/analyze" className="btn btn-primary btn-sm gap-1.5">
                  <Zap className="w-3.5 h-3.5" /> New Build
                </Link>
              </div>

              {builds.length === 0 ? (
                <div className="card p-12 text-center">
                  <Zap className="w-10 h-10 text-fg-subtle mx-auto mb-3" />
                  <p className="text-fg-muted mb-1">No builds yet</p>
                  <p className="text-xs text-fg-subtle mb-4">Analyze a build to save it to your profile</p>
                  <Link href="/analyze" className="btn btn-primary">Analyze a Build</Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {builds.map((build, i) => (
                    <motion.div
                      key={build.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="card p-4 hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-fg truncate">{build.name}</p>
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
                            <span className={cn('chip text-xs font-bold', TIER_COLORS[build.meta_viability] || '')}>
                              {build.meta_viability}
                            </span>
                          )}
                          {build.overall_rating > 0 && (
                            <span className="text-lg font-black text-fg/70">{build.overall_rating}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-fg-subtle">
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3" />{build.likes ?? 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />{build.views ?? 0}
                        </span>
                        <span className="ml-auto">{timeAgo(build.created_at)}</span>
                        {build.is_public && (
                          <ExternalLink className="w-3 h-3 text-emerald-400/60" />
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Quick links */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { href: '/coach', label: 'AI Coach', icon: '🧠' },
                { href: '/optimize', label: 'Build Optimizer', icon: '✨' },
                { href: '/build-planner', label: 'Badge Planner', icon: '🏆' },
                { href: '/vc-calc', label: 'VC Calculator', icon: '💰' },
              ].map(({ href, label, icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="card p-3 flex items-center gap-2 hover:bg-white/[0.03] transition-colors group"
                >
                  <span className="text-lg">{icon}</span>
                  <span className="text-xs font-semibold text-fg-muted group-hover:text-fg transition-colors">{label}</span>
                </Link>
              ))}
            </motion.div>
          </>
        )}
      </div>
    </AppLayout>
  )
}
