'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Brain, TrendingUp, Users, BookOpen, LayoutDashboard, Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CourtIQLogo } from '@/components/ui/Logo'

const links = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/analyze',   label: 'Analyzer',  icon: Zap },
  { href: '/coach',     label: 'AI Coach',  icon: Brain },
  { href: '/builds',    label: 'Builds',    icon: Users },
  { href: '/meta',      label: 'Meta',      icon: TrendingUp },
  { href: '/tutorials', label: 'Learn',     icon: BookOpen },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const path = usePathname()

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <>
      <motion.nav
        className={cn('fixed top-0 inset-x-0 z-50 transition-all duration-300')}
        animate={scrolled
          ? { backgroundColor: 'rgba(9,9,11,0.85)', borderBottomColor: 'rgba(255,255,255,0.055)' }
          : { backgroundColor: 'rgba(9,9,11,0)', borderBottomColor: 'rgba(255,255,255,0)' }
        }
        style={{ backdropFilter: scrolled ? 'blur(24px)' : 'none', borderBottom: '1px solid' }}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
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
                    'relative px-3.5 py-2 rounded-lg text-sm font-medium transition-colors duration-150',
                    active ? 'text-white' : 'text-white/40 hover:text-white/80'
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

          {/* Right */}
          <div className="hidden md:flex items-center gap-2">
            <Link href="/login" className="btn btn-ghost btn-sm text-white/40 hover:text-white">Sign In</Link>
            <Link href="/analyze" className="btn btn-primary btn-sm gap-1.5">
              <Zap className="w-3.5 h-3.5"/> Analyze
            </Link>
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
              <div className="pt-3 flex gap-2">
                <Link href="/login" onClick={() => setOpen(false)} className="btn btn-secondary btn-sm flex-1 justify-center">Sign In</Link>
                <Link href="/analyze" onClick={() => setOpen(false)} className="btn btn-primary btn-sm flex-1 justify-center gap-1.5">
                  <Zap className="w-3.5 h-3.5"/> Analyze
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
