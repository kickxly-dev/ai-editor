'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Brain, TrendingUp, Users, BookOpen, LayoutDashboard, Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'

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
    const fn = () => setScrolled(window.scrollY > 16)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <>
      <nav className={cn(
        'fixed top-0 inset-x-0 z-50 transition-all duration-300',
        scrolled ? 'bg-bg/90 backdrop-blur-xl border-b border-border' : 'bg-transparent'
      )}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-violet-600 flex items-center justify-center">
              <span className="display text-white font-bold text-sm">C</span>
              <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-rose-500 to-violet-600 blur-sm opacity-0 group-hover:opacity-70 transition-opacity -z-10" />
            </div>
            <span className="display text-[17px] font-bold text-fg">Court<span className="text-rose-400">IQ</span></span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-0.5">
            {links.map(({ href, label }) => (
              <Link key={href} href={href} className={cn(
                'px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                path === href
                  ? 'text-fg bg-surface border border-border'
                  : 'text-fg-muted hover:text-fg hover:bg-surface/60'
              )}>
                {label}
              </Link>
            ))}
          </div>

          {/* Right */}
          <div className="hidden md:flex items-center gap-2">
            <Link href="/login" className="btn btn-ghost btn-sm">Sign In</Link>
            <Link href="/analyze" className="btn btn-primary btn-sm gap-1.5">
              <Zap className="w-3.5 h-3.5" /> Analyze
            </Link>
          </div>

          {/* Mobile toggle */}
          <button onClick={() => setOpen(!open)} className="md:hidden btn btn-ghost btn-icon">
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}
            className="fixed top-16 inset-x-0 z-40 bg-bg/95 backdrop-blur-xl border-b border-border md:hidden"
          >
            <div className="px-4 py-4 space-y-1">
              {links.map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href} onClick={() => setOpen(false)} className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                  path === href ? 'bg-surface text-fg border border-border' : 'text-fg-muted hover:text-fg hover:bg-surface/60'
                )}>
                  <Icon className="w-4 h-4" /> {label}
                </Link>
              ))}
              <div className="pt-3 flex gap-2">
                <Link href="/login" className="btn btn-secondary btn-sm flex-1 justify-center">Sign In</Link>
                <Link href="/analyze" className="btn btn-primary btn-sm flex-1 justify-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" /> Analyze
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
