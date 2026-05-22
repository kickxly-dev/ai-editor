'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Zap, Brain, TrendingUp, Users, BookOpen, LayoutDashboard,
  Wand2, Swords, Users2, Search, MessageSquare, LogOut,
  ChevronLeft, ChevronRight, Shield, Calculator, Flame, Award
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { CourtIQLogo } from '@/components/ui/Logo'
import { useSession, signOut } from 'next-auth/react'

const links = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/analyze',   label: 'Analyzer',  icon: Zap },
  { href: '/optimize',  label: 'Optimizer', icon: Wand2 },
  { href: '/matchup',   label: 'Matchup',   icon: Swords },
  { href: '/coach',     label: 'AI Coach',  icon: Brain },
  { href: '/builds',    label: 'Builds',    icon: Users },
  { href: '/meta',      label: 'Meta',      icon: TrendingUp },
  { href: '/tutorials', label: 'Learn',     icon: BookOpen },
  { href: '/squad',     label: 'Squad',     icon: Users2 },
  { href: '/find',      label: 'Find',      icon: Search },
  { href: '/messages',  label: 'Messages',  icon: MessageSquare },
  { href: '/vc-calc',   label: 'VC Calc',   icon: Calculator },
  { href: '/roast',     label: 'Roast',     icon: Flame },
  { href: '/badges',    label: 'Badges',    icon: Award },
]

interface Props {
  collapsed: boolean
  onCollapse: (v: boolean) => void
}

export default function Sidebar({ collapsed, onCollapse }: Props) {
  const path = usePathname()
  const { data: session } = useSession()
  const isAdmin = (session?.user as { isAdmin?: boolean })?.isAdmin

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 220 }}
      transition={{ type: 'spring', stiffness: 400, damping: 35 }}
      className="fixed left-0 top-0 h-screen z-50 flex flex-col overflow-hidden"
      style={{ background: '#0C0C10', borderRight: '1px solid rgba(255,255,255,0.055)' }}
    >
      {/* Header */}
      <div className="h-16 flex items-center px-4 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.045)' }}>
        <Link href="/" className="flex items-center gap-2.5 min-w-0">
          <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.96 }} className="flex-shrink-0">
            <CourtIQLogo className="w-7 h-7" />
          </motion.div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.18 }}
                className="display text-[16px] font-bold text-white whitespace-nowrap overflow-hidden"
              >
                Court<span className="text-rose-400">IQ</span>
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
      </div>

      {/* Nav links */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 scrollbar-hide">
        {links.map(({ href, label, icon: Icon }) => {
          const active = path === href || (href !== '/dashboard' && path.startsWith(href + '/'))
          return (
            <Link key={href} href={href}
              title={collapsed ? label : undefined}
              className={cn(
                'flex items-center gap-3 px-2.5 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150 relative',
                active
                  ? 'text-white'
                  : 'text-white/35 hover:text-white/70 hover:bg-white/04'
              )}
            >
              {active && (
                <motion.div layoutId="sidebar-pill"
                  className="absolute inset-0 rounded-lg"
                  style={{ background: 'rgba(225,29,72,0.12)', border: '1px solid rgba(225,29,72,0.18)' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <Icon className={cn('w-4 h-4 flex-shrink-0 relative z-10', active ? 'text-rose-400' : '')} />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.16 }}
                    className="relative z-10 whitespace-nowrap overflow-hidden"
                  >
                    {label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          )
        })}

        {isAdmin && (
          <>
            <div className="my-2 mx-1" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} />
            <Link href="/admin"
              title={collapsed ? 'Admin' : undefined}
              className={cn(
                'flex items-center gap-3 px-2.5 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150 relative',
                path.startsWith('/admin')
                  ? 'text-amber-300'
                  : 'text-amber-500/50 hover:text-amber-400/80 hover:bg-amber-500/05'
              )}
            >
              {path.startsWith('/admin') && (
                <motion.div layoutId="sidebar-pill"
                  className="absolute inset-0 rounded-lg"
                  style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.16)' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <Shield className="w-4 h-4 flex-shrink-0 relative z-10" />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.16 }}
                    className="relative z-10 whitespace-nowrap overflow-hidden"
                  >
                    Admin
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          </>
        )}
      </nav>

      {/* Bottom — user + collapse */}
      <div className="flex-shrink-0 p-2 space-y-1" style={{ borderTop: '1px solid rgba(255,255,255,0.045)' }}>
        {session?.user && (
          <div className={cn('flex items-center gap-2.5 px-2.5 py-2 rounded-lg', collapsed ? 'justify-center' : '')}>
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-rose-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {(session.user.name || session.user.email || '?')[0].toUpperCase()}
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.16 }}
                  className="overflow-hidden min-w-0"
                >
                  <p className="text-xs text-white/70 font-medium truncate">{session.user.name || session.user.email}</p>
                  {isAdmin && <p className="text-[10px] text-amber-400/70">Admin</p>}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          title={collapsed ? 'Sign Out' : undefined}
          className={cn(
            'flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[12px] font-medium text-white/30 hover:text-white/60 hover:bg-white/04 transition-colors w-full',
            collapsed ? 'justify-center' : ''
          )}
        >
          <LogOut className="w-3.5 h-3.5 flex-shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.16 }}
                className="whitespace-nowrap overflow-hidden"
              >
                Sign Out
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        <button
          onClick={() => onCollapse(!collapsed)}
          className="flex items-center justify-center w-full py-1.5 rounded-lg text-white/20 hover:text-white/50 hover:bg-white/04 transition-colors"
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </div>
    </motion.aside>
  )
}
