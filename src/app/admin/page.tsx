'use client'
import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, BarChart3, Shield, Trash2, Crown, CheckCircle,
  Search, RefreshCw, Database, TrendingUp, MessageSquare,
  Layers, Eye, EyeOff, ChevronLeft, ChevronRight, Zap,
  AlertTriangle, ToggleLeft, ToggleRight, Swords
} from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import toast from 'react-hot-toast'

type User = {
  id: string
  email: string
  name: string
  username: string
  is_admin: boolean
  is_premium: boolean
  is_verified: boolean
  total_builds: number
  created_at: string
}

type Build = {
  id: string
  name: string
  position: string
  category: string
  likes: number
  views: number
  is_public: boolean
  created_at: string
  user_email: string
  user_name: string
}

type Stats = {
  users: number
  builds: number
  coachSessions: number
  messages: number
  lfgPosts: number
  squads: number
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: React.ComponentType<{ className?: string }>; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-5"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-white/35 font-medium uppercase tracking-wider mb-1">{label}</p>
          <p className="text-3xl font-bold text-white tabular-nums">{value.toLocaleString()}</p>
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </motion.div>
  )
}

function Toggle({ value, onChange, disabled }: { value: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      onClick={() => !disabled && onChange(!value)}
      disabled={disabled}
      className={`transition-colors ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      {value
        ? <ToggleRight className="w-5 h-5 text-emerald-400" />
        : <ToggleLeft className="w-5 h-5 text-white/25" />
      }
    </button>
  )
}

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const isAdmin = (session?.user as { isAdmin?: boolean })?.isAdmin

  const [tab, setTab] = useState<'stats' | 'users' | 'builds'>('stats')
  const [stats, setStats] = useState<Stats | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [builds, setBuilds] = useState<Build[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [toggling, setToggling] = useState<string | null>(null)

  // Auth guard
  useEffect(() => {
    if (status === 'loading') return
    if (!session?.user || !isAdmin) {
      router.replace('/dashboard')
    }
  }, [session, status, isAdmin, router])

  const fetchStats = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin?action=stats')
      if (res.ok) setStats(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin?action=users&page=${page}&q=${encodeURIComponent(search)}`)
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users)
        setTotal(data.total)
      }
    } finally {
      setLoading(false)
    }
  }, [page, search])

  const fetchBuilds = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin?action=builds')
      if (res.ok) {
        const data = await res.json()
        setBuilds(data.builds)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isAdmin) return
    if (tab === 'stats') fetchStats()
    else if (tab === 'users') fetchUsers()
    else if (tab === 'builds') fetchBuilds()
  }, [tab, isAdmin, fetchStats, fetchUsers, fetchBuilds])

  // Debounced search
  useEffect(() => {
    if (tab !== 'users') return
    const t = setTimeout(() => { setPage(1); fetchUsers() }, 350)
    return () => clearTimeout(t)
  }, [search, tab, fetchUsers])

  async function adminAction(payload: Record<string, unknown>, successMsg: string, key?: string) {
    if (key) setToggling(key)
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        toast.success(successMsg)
        if (tab === 'users') fetchUsers()
        else if (tab === 'builds') fetchBuilds()
        else fetchStats()
      } else {
        toast.error('Action failed')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setToggling(null)
    }
  }

  async function seedMeta() {
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'seed_meta' }),
    })
    const data = await res.json()
    if (res.ok) toast.success(`Seeded ${data.seeded} meta trends`)
    else toast.error('Seed failed')
  }

  async function deleteUser(userId: string, email: string) {
    if (!confirm(`Delete user ${email}? This cannot be undone.`)) return
    await adminAction({ action: 'delete_user', userId }, 'User deleted')
  }

  async function deleteBuild(buildId: string, name: string) {
    if (!confirm(`Delete build "${name}"? This cannot be undone.`)) return
    await adminAction({ action: 'delete_build', buildId }, 'Build deleted')
  }

  if (status === 'loading' || !isAdmin) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-white/40 text-sm">Verifying access…</div>
        </div>
      </AppLayout>
    )
  }

  const tabs = [
    { id: 'stats', label: 'Overview', icon: BarChart3 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'builds', label: 'Builds', icon: Layers },
  ] as const

  const totalPages = Math.ceil(total / 25)

  return (
    <AppLayout>
      <div className="min-h-screen">
        {/* Header */}
        <div className="sticky top-0 z-30 px-8 py-4 flex items-center justify-between"
          style={{ background: 'rgba(8,8,10,0.85)', backdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/20 flex items-center justify-center">
              <Shield className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h1 className="text-[15px] font-bold text-white">Admin Panel</h1>
              <p className="text-[11px] text-white/35">God-mode controls</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { if (tab === 'stats') fetchStats(); else if (tab === 'users') fetchUsers(); else fetchBuilds() }}
              className="btn btn-ghost btn-sm gap-1.5 text-white/40"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button onClick={seedMeta} className="btn btn-sm gap-1.5" style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.2)', color: '#FCD34D' }}>
              <Database className="w-3.5 h-3.5" />
              Seed Meta
            </button>
          </div>
        </div>

        <div className="px-8 py-6">
          {/* Tabs */}
          <div className="flex gap-1 mb-6 p-1 rounded-xl w-fit" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-all ${
                  tab === id
                    ? 'bg-white/08 text-white'
                    : 'text-white/35 hover:text-white/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* STATS TAB */}
            {tab === 'stats' && (
              <motion.div key="stats" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {stats ? (
                  <>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                      <StatCard label="Total Users" value={stats.users} icon={Users} color="bg-rose-500/12 text-rose-400" />
                      <StatCard label="Total Builds" value={stats.builds} icon={Layers} color="bg-violet-500/12 text-violet-400" />
                      <StatCard label="Coach Sessions" value={stats.coachSessions} icon={Zap} color="bg-sky-500/12 text-sky-400" />
                      <StatCard label="Messages" value={stats.messages} icon={MessageSquare} color="bg-emerald-500/12 text-emerald-400" />
                      <StatCard label="LFG Posts" value={stats.lfgPosts} icon={Swords} color="bg-amber-500/12 text-amber-400" />
                      <StatCard label="Squads" value={stats.squads} icon={Users} color="bg-pink-500/12 text-pink-400" />
                    </div>

                    <div className="card p-6">
                      <h3 className="text-sm font-semibold text-white/70 mb-4 uppercase tracking-wider">Quick Actions</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <button onClick={seedMeta} className="flex flex-col items-start gap-2 p-4 rounded-xl text-left transition-colors hover:bg-white/04"
                          style={{ border: '1px solid rgba(245,158,11,0.15)' }}>
                          <Database className="w-5 h-5 text-amber-400" />
                          <div>
                            <p className="text-sm font-medium text-white">Seed Meta Trends</p>
                            <p className="text-xs text-white/40">Reset & seed Season 5 data</p>
                          </div>
                        </button>
                        <button onClick={() => setTab('users')} className="flex flex-col items-start gap-2 p-4 rounded-xl text-left transition-colors hover:bg-white/04"
                          style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                          <Users className="w-5 h-5 text-rose-400" />
                          <div>
                            <p className="text-sm font-medium text-white">Manage Users</p>
                            <p className="text-xs text-white/40">{stats.users} registered users</p>
                          </div>
                        </button>
                        <button onClick={() => setTab('builds')} className="flex flex-col items-start gap-2 p-4 rounded-xl text-left transition-colors hover:bg-white/04"
                          style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                          <Layers className="w-5 h-5 text-violet-400" />
                          <div>
                            <p className="text-sm font-medium text-white">Manage Builds</p>
                            <p className="text-xs text-white/40">{stats.builds} public builds</p>
                          </div>
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-48 text-white/30 text-sm">
                    {loading ? 'Loading stats…' : 'No data'}
                  </div>
                )}
              </motion.div>
            )}

            {/* USERS TAB */}
            {tab === 'users' && (
              <motion.div key="users" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {/* Search */}
                <div className="relative mb-4 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                  <input
                    type="text"
                    placeholder="Search users…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="input w-full pl-9 text-sm"
                  />
                </div>

                <div className="card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                          {['User', 'Admin', 'Premium', 'Verified', 'Builds', 'Joined', 'Actions'].map(h => (
                            <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-white/35 uppercase tracking-wider">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((u, i) => (
                          <motion.tr
                            key={u.id}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03 }}
                            className="group hover:bg-white/02 transition-colors"
                            style={{ borderBottom: '1px solid rgba(255,255,255,0.035)' }}
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-rose-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                  {(u.name || u.email || '?')[0].toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-medium text-white/85 truncate">{u.username || u.name || '—'}</p>
                                  <p className="text-xs text-white/35 truncate">{u.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <Toggle
                                value={u.is_admin}
                                disabled={toggling === `admin-${u.id}` || u.email === session?.user?.email}
                                onChange={v => adminAction({ action: 'toggle_admin', userId: u.id, value: v }, `Admin ${v ? 'granted' : 'revoked'}`, `admin-${u.id}`)}
                              />
                            </td>
                            <td className="px-4 py-3">
                              <Toggle
                                value={u.is_premium}
                                disabled={toggling === `premium-${u.id}`}
                                onChange={v => adminAction({ action: 'toggle_premium', userId: u.id, value: v }, `Premium ${v ? 'granted' : 'revoked'}`, `premium-${u.id}`)}
                              />
                            </td>
                            <td className="px-4 py-3">
                              <Toggle
                                value={u.is_verified}
                                disabled={toggling === `verified-${u.id}`}
                                onChange={v => adminAction({ action: 'toggle_verified', userId: u.id, value: v }, `Verified ${v ? 'granted' : 'revoked'}`, `verified-${u.id}`)}
                              />
                            </td>
                            <td className="px-4 py-3 text-white/50 tabular-nums">{u.total_builds ?? 0}</td>
                            <td className="px-4 py-3 text-white/35 text-xs tabular-nums">
                              {new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                            </td>
                            <td className="px-4 py-3">
                              {u.email !== session?.user?.email && (
                                <button
                                  onClick={() => deleteUser(u.id, u.email)}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-red-500/60 hover:text-red-400 hover:bg-red-500/08"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </td>
                          </motion.tr>
                        ))}
                        {users.length === 0 && !loading && (
                          <tr>
                            <td colSpan={7} className="px-4 py-12 text-center text-white/30 text-sm">
                              {search ? 'No users match your search' : 'No users found'}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      <p className="text-xs text-white/35">{total} users total</p>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setPage(p => Math.max(1, p - 1))}
                          disabled={page === 1}
                          className="btn btn-ghost btn-sm p-1.5 disabled:opacity-30"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-xs text-white/50 px-2">
                          {page} / {totalPages}
                        </span>
                        <button
                          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                          disabled={page === totalPages}
                          className="btn btn-ghost btn-sm p-1.5 disabled:opacity-30"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* BUILDS TAB */}
            {tab === 'builds' && (
              <motion.div key="builds" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                          {['Build', 'Position', 'Creator', 'Likes', 'Views', 'Public', 'Actions'].map(h => (
                            <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-white/35 uppercase tracking-wider">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {builds.map((b, i) => (
                          <motion.tr
                            key={b.id}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.02 }}
                            className="group hover:bg-white/02 transition-colors"
                            style={{ borderBottom: '1px solid rgba(255,255,255,0.035)' }}
                          >
                            <td className="px-4 py-3">
                              <p className="font-medium text-white/85">{b.name || 'Untitled'}</p>
                              <p className="text-xs text-white/35">{b.category}</p>
                            </td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-white/06 text-white/60">{b.position || '—'}</span>
                            </td>
                            <td className="px-4 py-3 text-white/40 text-xs">{b.user_name || b.user_email || '—'}</td>
                            <td className="px-4 py-3 text-white/50 tabular-nums">{b.likes ?? 0}</td>
                            <td className="px-4 py-3 text-white/50 tabular-nums">{b.views ?? 0}</td>
                            <td className="px-4 py-3">
                              <Toggle
                                value={b.is_public}
                                onChange={v => adminAction({ action: 'toggle_build_public', buildId: b.id, value: v }, `Build ${v ? 'published' : 'hidden'}`)}
                              />
                            </td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => deleteBuild(b.id, b.name)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-red-500/60 hover:text-red-400 hover:bg-red-500/08"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </motion.tr>
                        ))}
                        {builds.length === 0 && !loading && (
                          <tr>
                            <td colSpan={7} className="px-4 py-12 text-center text-white/30 text-sm">No builds found</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </AppLayout>
  )
}
