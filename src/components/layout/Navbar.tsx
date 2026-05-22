'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Brain, TrendingUp, Users, BookOpen, LayoutDashboard, Menu, X, Wand2, Swords, Users2, Search, MessageSquare, LogOut } from 'lucide-react'
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
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const path = usePathname()
  const { data: session } = useSession()

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' })
  }

  return (
    <>
      <motion.nav
        className={cn('fixed top-0 inset-x-0 z-50 transition-all duration-300')}
        animate={scrolled
          ? { backgroundColor: 'rgba(8,8,10,0.88)', borderBottomColor: 'rgba(255,255,255,0.07)' }
          : { backgroundColor: 'rgba(8,8,10,0)', borderBottomColor: 'rgba(255,255,255,0)' }
        }
        style={{ backdropFilter: scrolled ? 'blur(32px) saturate(160%)' : 'none', borderBottom: '1px solid' }}
      >
        <div className="max-w-7xl mx-auto px-6 h-[60px] flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.96 }}>
              <CourtIQLogo className="w-8 h-8"/>
            </motion.div>
            <span className="display text-[17px] font-bold text-white">
              Court<span className="text-rose-400">IQ</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-0.5">
            {links.map(({ href, label }) => {
              const active = path === href
              return (
                <Link key={href} href={href}
                  className={cn(
                    'relative px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors duration-150 tracking-tight',
                    active ? 'text-white' : 'text-white/35 hover:text-white/75'
                  )}
                >
                  {active && (
                    <motion.div layoutId="nav-pill"
                      className="absolute inset-0 rounded-lg"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative">{label}</span>
                </Link>
              )
            })}
          </div>

          {/* Right — session-aware */}
          <div className="hidden md:flex items-center gap-2">
            {session?.user ? (
              <>
                <Link href="/profile" className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/06 transition-colors">
                  {session.user.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={session.user.image} alt="" className="w-6 h-6 rounded-full" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-rose-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold">
                      {(session.user.name || session.user.email || '?')[0].toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm text-white/70 font-medium">{session.user.name || session.user.email}</span>
                </Link>
                <button onClick={handleSignOut} className="btn btn-ghost btn-sm text-white/40 hover:text-white gap-1.5">
                  <LogOut className="w-3.5 h-3.5" /> Sign Out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="btn btn-ghost btn-sm text-white/40 hover:text-white">Sign In</Link>
                <Link href="/analyze" className="btn btn-primary btn-sm gap-1.5">
                  <Zap className="w-3.5 h-3.5"/> Analyze
                </Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setOpen(!open)}
            className="md:hidden w-9 h-9 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/05 transition-colors"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={open ? 'x' : 'm'}
                initial={{ opacity: 0, rotate: -45 }} animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: 45 }} transition={{ duration: 0.15 }}>
                {open ? <X className="w-5 h-5"/> : <Menu className="w-5 h-5"/>}
              </motion.div>
            </AnimatePresence>
          </motion.button>
        </div>
      </motion.nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-16 inset-x-0 z-40 md:hidden"
            style={{ background: 'rgba(9,9,11,0.96)', backdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(255,255,255,0.055)' }}
          >
            <div className="px-4 py-4 space-y-1">
              {links.map(({ href, label, icon: Icon }, i) => (
                <motion.div key={href}
                  initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}>
                  <Link href={href} onClick={() => setOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all',
                      path === href
                        ? 'text-white bg-white/06 border border-white/08'
                        : 'text-white/40 hover:text-white hover:bg-white/04'
                    )}>
                    <Icon className="w-4 h-4"/> {label}
                  </Link>
                </motion.div>
              ))}
              <div className="pt-3 border-t border-white/08">
                {session?.user ? (
                  <div className="space-y-2">
                    <Link href="/profile" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-white/[0.04] transition-colors">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-rose-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold">
                        {(session.user.name || session.user.email || '?')[0].toUpperCase()}
                      </div>
                      <span className="text-sm text-white/70">{session.user.name || session.user.email}</span>
                    </Link>
                    <button
                      onClick={() => { setOpen(false); handleSignOut() }}
                      className="btn btn-secondary btn-sm w-full justify-center gap-1.5"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Link href="/login" onClick={() => setOpen(false)} className="btn btn-secondary btn-sm flex-1 justify-center">Sign In</Link>
                    <Link href="/analyze" onClick={() => setOpen(false)} className="btn btn-primary btn-sm flex-1 justify-center gap-1.5">
                      <Zap className="w-3.5 h-3.5"/> Analyze
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
