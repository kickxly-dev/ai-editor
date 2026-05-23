'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Zap, Brain, TrendingUp, Users, BookOpen, LayoutDashboard,
  Wand2, Swords, Users2, Search, MessageSquare, LogOut,
  ChevronLeft, ChevronRight, Shield, Award, Crosshair,
  ClipboardList, Trophy, X, Eye,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { CourtIQLogo } from '@/components/ui/Logo'
import { useSession, signOut } from 'next-auth/react'

// ─── Grouped navigation ───────────────────────────────────────────────────────

const NAV_GROUPS = [
  {
    id: 'core',
    items: [{ href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    id: 'ai',
    label: 'AI Tools',
    items: [
      { href: '/vision',    label: 'Vision Coach', icon: Eye },
      { href: '/analyze',   label: 'Analyzer',     icon: Zap },
      { href: '/optimize',  label: 'Optimizer',    icon: Wand2 },
      { href: '/matchup',   label: 'Matchup',      icon: Swords },
      { href: '/coach',     label: 'AI Coach',     icon: Brain },
      { href: '/jumpshots', label: 'Jumpshots',    icon: Crosshair },
    ],
  },
  {
    id: 'builds',
    label: 'Builds',
    items: [
      { href: '/builds',        label: 'Builds',        icon: Users },
      { href: '/build-planner', label: 'Build Planner', icon: ClipboardList },
      { href: '/meta',          label: 'Meta',          icon: TrendingUp },
      { href: '/badges',        label: 'Badges',        icon: Award },
    ],
  },
  {
    id: 'community',
    label: 'Community',
    items: [
      { href: '/squad',        label: 'Squad',       icon: Users2 },
      { href: '/find',         label: 'Find',        icon: Search },
      { href: '/messages',     label: 'Messages',    icon: MessageSquare },
      { href: '/leaderboard',  label: 'Leaderboard', icon: Trophy },
      { href: '/tutorials',    label: 'Learn',       icon: BookOpen },
    ],
  },
]

interface Props {
  collapsed: boolean
  onCollapse: (v: boolean) => void
  mobileOpen: boolean
  onMobileClose: () => void
  isMobile: boolean
}

export default function Sidebar({ collapsed, onCollapse, mobileOpen, onMobileClose, isMobile }: Props) {
  const path = usePathname()
  const { data: session } = useSession()
  const isAdmin = (session?.user as { isAdmin?: boolean })?.isAdmin
  const showLabels = isMobile || !collapsed

  return (
    <motion.aside
      animate={
        isMobile
          ? { x: mobileOpen ? 0 : '-100%', width: 256 }
          : { x: 0, width: collapsed ? 60 : 240 }
      }
      transition={{ type: 'spring', stiffness: 400, damping: 35 }}
      className={cn(
        'fixed left-0 top-0 h-screen z-50 flex flex-col overflow-hidden',
        isMobile && !mobileOpen ? 'pointer-events-none' : ''
      )}
      style={{ background: 'rgba(10,10,14,0.97)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderRight: '1px solid rgba(255,255,255,0.09)' }}
    >
      {/* ── Header ── */}
      <div className="h-14 flex items-center px-3.5 flex-shrink-0 justify-between"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <Link href="/" className="flex items-center gap-2.5 min-w-0" onClick={isMobile ? onMobileClose : undefined}>
          <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.96 }} className="flex-shrink-0">
            <CourtIQLogo className="w-6 h-6" />
          </motion.div>
          <AnimatePresence>
            {showLabels && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.16 }}
                className="text-[16px] font-black text-white whitespace-nowrap overflow-hidden tracking-tight"
              >
                Court<span style={{ color: '#E11D48' }}>IQ</span>
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
        {isMobile && (
          <button onClick={onMobileClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white hover:bg-white/[0.06] transition-colors flex-shrink-0">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* ── Vision featured entry ── */}
      <div className="px-2.5 pt-2.5 pb-1.5">
        <Link href="/vision"
          title={!showLabels ? 'Vision' : undefined}
          onClick={isMobile ? onMobileClose : undefined}
          className={cn(
            'flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-all duration-200 relative overflow-hidden',
            !showLabels && 'justify-center'
          )}
          style={{
            background: path.startsWith('/vision') ? 'rgba(225,29,72,0.09)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${path.startsWith('/vision') ? 'rgba(225,29,72,0.22)' : 'rgba(255,255,255,0.07)'}`,
            boxShadow: path.startsWith('/vision') ? '0 0 16px rgba(225,29,72,0.08)' : 'none',
          }}
        >
          {path.startsWith('/vision') && (
            <motion.div layoutId="vision-active" className="absolute inset-0 rounded-xl"
              style={{ background: 'rgba(225,29,72,0.05)' }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }} />
          )}
          <motion.div
            className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 relative z-10"
            style={{ background: 'rgba(225,29,72,0.12)', border: '1px solid rgba(225,29,72,0.25)' }}
            animate={path.startsWith('/vision') ? { boxShadow: ['0 0 0px rgba(225,29,72,0)', '0 0 10px rgba(225,29,72,0.4)', '0 0 0px rgba(225,29,72,0)'] } : {}}
            transition={{ duration: 2.2, repeat: Infinity }}
          >
            <Eye className="w-3.5 h-3.5 text-rose-400" />
          </motion.div>
          <AnimatePresence>
            {showLabels && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.16 }}
                className="flex-1 min-w-0 overflow-hidden relative z-10 flex items-center justify-between"
              >
                <div>
                  <p className="text-[12px] font-bold text-white leading-none">Vision</p>
                  <p className="text-[9px] text-white/30 mt-0.5">Intelligence Suite</p>
                </div>
                <span className="text-[8px] font-black tracking-wider px-1.5 py-0.5 rounded flex-shrink-0 ml-2"
                  style={{ background: 'rgba(225,29,72,0.12)', border: '1px solid rgba(225,29,72,0.22)', color: '#FF5F6D' }}>
                  NEW
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </Link>
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 overflow-y-auto py-1 px-2.5 scrollbar-hide space-y-0">
        {NAV_GROUPS.map((group, gi) => (
          <div key={group.id}>
            {/* Divider + group label */}
            {gi > 0 && (
              <div className="pt-3 pb-1">
                {showLabels && group.label ? (
                  <p className="px-2 text-[9px] font-bold text-white/35 uppercase tracking-[0.2em] select-none">
                    {group.label}
                  </p>
                ) : (
                  <div className="mx-1" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }} />
                )}
              </div>
            )}

            {group.items.map(({ href, label, icon: Icon }) => {
              const active = path === href || (href !== '/dashboard' && path.startsWith(href + '/'))
              return (
                <Link key={href} href={href}
                  title={!showLabels ? label : undefined}
                  onClick={isMobile ? onMobileClose : undefined}
                  className={cn(
                    'flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[13px] font-medium transition-all duration-100 relative mb-px',
                    !showLabels && 'justify-center',
                    active ? 'text-white' : 'text-white/45 hover:text-white/75 hover:bg-white/[0.05]'
                  )}
                >
                  {active && (
                    <motion.div layoutId="sidebar-pill"
                      className="absolute inset-0 rounded-lg"
                      style={{ background: 'rgba(225,29,72,0.13)', border: '1px solid rgba(225,29,72,0.22)', boxShadow: '0 0 12px rgba(225,29,72,0.1) inset' }}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <Icon className={cn('w-[15px] h-[15px] flex-shrink-0 relative z-10 transition-colors', active ? 'text-rose-400' : '')} />
                  <AnimatePresence>
                    {showLabels && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.14 }}
                        className="relative z-10 whitespace-nowrap overflow-hidden"
                      >
                        {label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              )
            })}
          </div>
        ))}

        {/* Admin */}
        {isAdmin && (
          <div className="pt-3 pb-1">
            <div className="mx-1 mb-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }} />
            <Link href="/admin"
              title={!showLabels ? 'Admin' : undefined}
              onClick={isMobile ? onMobileClose : undefined}
              className={cn(
                'flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[13px] font-medium transition-all duration-100 relative',
                !showLabels && 'justify-center',
                path.startsWith('/admin') ? 'text-amber-300' : 'text-amber-500/40 hover:text-amber-400/70 hover:bg-amber-500/[0.04]'
              )}
            >
              {path.startsWith('/admin') && (
                <motion.div layoutId="sidebar-pill-admin"
                  className="absolute inset-0 rounded-lg"
                  style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <Shield className="w-[15px] h-[15px] flex-shrink-0 relative z-10" />
              <AnimatePresence>
                {showLabels && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.14 }}
                    className="relative z-10 whitespace-nowrap overflow-hidden"
                  >
                    Admin
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          </div>
        )}
      </nav>

      {/* ── Bottom ── */}
      <div className="flex-shrink-0 px-2.5 py-2 space-y-px" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        {session?.user && (
          <Link href="/profile"
            title={!showLabels ? 'Profile' : undefined}
            onClick={isMobile ? onMobileClose : undefined}
            className={cn(
              'flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-colors hover:bg-white/[0.04] w-full',
              !showLabels && 'justify-center',
              path === '/profile' ? 'bg-white/[0.04]' : ''
            )}
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-rose-500 to-violet-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
              {(session.user.name || session.user.email || '?')[0].toUpperCase()}
            </div>
            <AnimatePresence>
              {showLabels && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.14 }}
                  className="overflow-hidden min-w-0 flex-1"
                >
                  <p className="text-[12px] text-white/80 font-semibold truncate leading-none">
                    {session.user.name || session.user.email}
                  </p>
                  <p className="text-[9px] text-white/25 mt-0.5">
                    {isAdmin ? 'Admin' : 'View profile'}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </Link>
        )}

        <button onClick={() => signOut({ callbackUrl: '/' })}
          title={!showLabels ? 'Sign Out' : undefined}
          className={cn(
            'flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[12px] font-medium text-white/25 hover:text-white/50 hover:bg-white/[0.03] transition-colors w-full',
            !showLabels && 'justify-center'
          )}
        >
          <LogOut className="w-3.5 h-3.5 flex-shrink-0" />
          <AnimatePresence>
            {showLabels && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.14 }}
                className="whitespace-nowrap overflow-hidden"
              >
                Sign out
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {!isMobile && (
          <button onClick={() => onCollapse(!collapsed)}
            className="flex items-center justify-center w-full py-1.5 rounded-lg text-white/15 hover:text-white/40 hover:bg-white/[0.03] transition-colors">
            {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>
    </motion.aside>
  )
}
