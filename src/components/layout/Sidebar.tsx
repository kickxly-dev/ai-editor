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

const NAV_GROUPS = [
  {
    id: 'core',
    items: [{ href: '/dashboard', label: 'Home', icon: LayoutDashboard }],
  },
  {
    id: 'ai',
    label: 'AI Tools',
    items: [
      { href: '/vision',    label: 'Vision Coach', icon: Eye,       accent: '#E11D48' },
      { href: '/analyze',   label: 'Analyzer',     icon: Zap,       accent: '#E11D48' },
      { href: '/optimize',  label: 'Optimizer',    icon: Wand2,     accent: '#8B5CF6' },
      { href: '/matchup',   label: 'Matchup',      icon: Swords,    accent: '#38BDF8' },
      { href: '/coach',     label: 'AI Coach',     icon: Brain,     accent: '#E11D48' },
      { href: '/jumpshots', label: 'Jumpshots',    icon: Crosshair, accent: '#F59E0B' },
    ],
  },
  {
    id: 'builds',
    label: 'Builds',
    items: [
      { href: '/builds',        label: 'Community Builds', icon: Users },
      { href: '/build-planner', label: 'Build Planner',    icon: ClipboardList },
      { href: '/meta',          label: 'Meta',             icon: TrendingUp },
      { href: '/badges',        label: 'Badges',           icon: Award },
    ],
  },
  {
    id: 'community',
    label: 'Community',
    items: [
      { href: '/squad',       label: 'Squad',       icon: Users2 },
      { href: '/find',        label: 'Find Players', icon: Search },
      { href: '/messages',    label: 'Messages',    icon: MessageSquare },
      { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
      { href: '/tutorials',   label: 'Learn',       icon: BookOpen },
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
  const w = isMobile ? 264 : collapsed ? 58 : 232

  return (
    <motion.aside
      animate={isMobile ? { x: mobileOpen ? 0 : '-100%', width: 264 } : { x: 0, width: w }}
      transition={{ type: 'spring', stiffness: 400, damping: 36 }}
      className={cn(
        'fixed left-0 top-0 h-screen z-50 flex flex-col overflow-hidden',
        isMobile && !mobileOpen && 'pointer-events-none'
      )}
      style={{
        background: '#0A0A14',
        borderRight: '1px solid rgba(255,255,255,0.09)',
        boxShadow: '4px 0 24px rgba(0,0,0,0.5)',
      }}
    >
      {/* Header */}
      <div
        className="h-[58px] flex items-center px-3.5 flex-shrink-0 justify-between"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
      >
        <Link href="/" className="flex items-center gap-2.5 min-w-0" onClick={isMobile ? onMobileClose : undefined}>
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.94 }} className="flex-shrink-0">
            <CourtIQLogo className="w-[26px] h-[26px]" />
          </motion.div>
          <AnimatePresence>
            {showLabels && (
              <motion.span
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.14 }}
                className="text-[17px] font-black text-white tracking-[-0.03em] whitespace-nowrap"
              >
                Court<span style={{ color: '#E11D48' }}>IQ</span>
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
        {isMobile && (
          <button
            onClick={onMobileClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
            style={{ color: 'rgba(255,255,255,0.35)' }}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Vision featured pill */}
      <div className="px-2.5 pt-3 pb-1">
        <Link
          href="/vision"
          onClick={isMobile ? onMobileClose : undefined}
          className={cn('flex items-center rounded-xl overflow-hidden transition-all duration-200 relative', !showLabels && 'justify-center', showLabels ? 'gap-3 px-3 py-2.5' : 'p-2.5')}
          style={{
            background: path.startsWith('/vision') ? 'rgba(225,29,72,0.15)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${path.startsWith('/vision') ? 'rgba(225,29,72,0.35)' : 'rgba(255,255,255,0.09)'}`,
            boxShadow: path.startsWith('/vision') ? '0 0 20px rgba(225,29,72,0.12)' : 'none',
          }}
        >
          <motion.div
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(225,29,72,0.2)', border: '1px solid rgba(225,29,72,0.35)' }}
            animate={path.startsWith('/vision') ? {
              boxShadow: ['0 0 0px rgba(225,29,72,0)', '0 0 12px rgba(225,29,72,0.5)', '0 0 0px rgba(225,29,72,0)'],
            } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Eye className="w-3.5 h-3.5" style={{ color: '#FF5C73' }} />
          </motion.div>
          <AnimatePresence>
            {showLabels && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 min-w-0 flex items-center justify-between"
              >
                <div>
                  <p className="text-[13px] font-bold text-white leading-none">Vision Coach</p>
                  <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>AI · Live · Real-time</p>
                </div>
                <span
                  className="text-[8px] font-black tracking-wider px-1.5 py-0.5 rounded-md ml-2"
                  style={{ background: 'rgba(225,29,72,0.2)', border: '1px solid rgba(225,29,72,0.4)', color: '#FF7087' }}
                >
                  LIVE
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-1 px-2.5 no-scrollbar">
        {NAV_GROUPS.map((group, gi) => (
          <div key={group.id} className={gi > 0 ? 'mt-2' : ''}>
            {gi > 0 && showLabels && group.label && (
              <p
                className="px-2.5 pt-2 pb-1.5 text-[10px] font-bold uppercase tracking-[0.2em] select-none"
                style={{ color: 'rgba(255,255,255,0.28)' }}
              >
                {group.label}
              </p>
            )}
            {gi > 0 && !showLabels && (
              <div className="my-2 mx-1" style={{ height: '1px', background: 'rgba(255,255,255,0.07)' }} />
            )}
            {group.items.map(({ href, label, icon: Icon }) => {
              const active = path === href || (href !== '/dashboard' && path.startsWith(href + '/'))
              return (
                <Link
                  key={href}
                  href={href}
                  title={!showLabels ? label : undefined}
                  onClick={isMobile ? onMobileClose : undefined}
                  className={cn(
                    'relative flex items-center gap-2.5 px-2.5 py-[8px] rounded-xl text-[13px] font-medium transition-all duration-150 mb-0.5',
                    !showLabels && 'justify-center',
                    active ? 'text-white' : 'hover:text-white'
                  )}
                  style={{
                    color: active ? '#fff' : 'rgba(255,255,255,0.45)',
                    background: active ? 'rgba(225,29,72,0.12)' : 'transparent',
                    border: active ? '1px solid rgba(225,29,72,0.22)' : '1px solid transparent',
                  }}
                  onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)' }}
                  onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                >
                  <Icon
                    className="w-[15px] h-[15px] flex-shrink-0 transition-colors"
                    style={{ color: active ? '#FF5C73' : 'inherit' }}
                  />
                  <AnimatePresence>
                    {showLabels && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.12 }}
                        className="whitespace-nowrap overflow-hidden"
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

        {isAdmin && (
          <div className="mt-2">
            <div className="my-2 mx-1" style={{ height: '1px', background: 'rgba(255,255,255,0.07)' }} />
            <Link
              href="/admin"
              title={!showLabels ? 'Admin' : undefined}
              onClick={isMobile ? onMobileClose : undefined}
              className={cn(
                'relative flex items-center gap-2.5 px-2.5 py-[8px] rounded-xl text-[13px] font-medium transition-all duration-150',
                !showLabels && 'justify-center',
              )}
              style={{
                color: path.startsWith('/admin') ? '#FBBF24' : 'rgba(245,158,11,0.5)',
                background: path.startsWith('/admin') ? 'rgba(245,158,11,0.1)' : 'transparent',
                border: path.startsWith('/admin') ? '1px solid rgba(245,158,11,0.22)' : '1px solid transparent',
              }}
            >
              <Shield className="w-[15px] h-[15px] flex-shrink-0" />
              {showLabels && <span>Admin</span>}
            </Link>
          </div>
        )}
      </nav>

      {/* Bottom — user + sign out */}
      <div
        className="flex-shrink-0 px-2.5 py-3 space-y-1"
        style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
      >
        {session?.user && (
          <Link
            href="/profile"
            title={!showLabels ? 'Profile' : undefined}
            onClick={isMobile ? onMobileClose : undefined}
            className={cn(
              'flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-all w-full',
              !showLabels && 'justify-center',
            )}
            style={{
              background: path === '/profile' ? 'rgba(255,255,255,0.07)' : 'transparent',
              border: path === '/profile' ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent',
            }}
            onMouseEnter={e => { if (path !== '/profile') (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)' }}
            onMouseLeave={e => { if (path !== '/profile') (e.currentTarget as HTMLElement).style.background = 'transparent' }}
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #E11D48, #7C3AED)' }}
            >
              {(session.user.name || session.user.email || '?')[0].toUpperCase()}
            </div>
            <AnimatePresence>
              {showLabels && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="overflow-hidden min-w-0 flex-1"
                >
                  <p className="text-[12px] font-semibold text-white/80 truncate leading-none">
                    {session.user.name || session.user.email}
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    {isAdmin ? 'Admin' : 'View profile'}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </Link>
        )}

        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          title={!showLabels ? 'Sign Out' : undefined}
          className={cn(
            'flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-[12px] font-medium transition-colors w-full',
            !showLabels && 'justify-center'
          )}
          style={{ color: 'rgba(255,255,255,0.3)' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.65)'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.3)'; (e.currentTarget as HTMLElement).style.background = 'transparent' }}
        >
          <LogOut className="w-3.5 h-3.5 flex-shrink-0" />
          {showLabels && <span>Sign out</span>}
        </button>

        {!isMobile && (
          <button
            onClick={() => onCollapse(!collapsed)}
            className="flex items-center justify-center w-full py-1.5 rounded-xl transition-colors"
            style={{ color: 'rgba(255,255,255,0.18)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.5)'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.18)'; (e.currentTarget as HTMLElement).style.background = 'transparent' }}
          >
            {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>
    </motion.aside>
  )
}
