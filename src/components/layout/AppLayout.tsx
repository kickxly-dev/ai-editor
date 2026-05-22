'use client'
import { createContext, useContext, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, Zap, LayoutDashboard, Brain, Wand2, MoreHorizontal } from 'lucide-react'
import Sidebar from './Sidebar'
import { CourtIQLogo } from '@/components/ui/Logo'
import { cn } from '@/lib/utils'

const SidebarCtx = createContext({ collapsed: false })
export const useSidebar = () => useContext(SidebarCtx)

const BOTTOM_TABS = [
  { href: '/dashboard', label: 'Home',     icon: LayoutDashboard },
  { href: '/analyze',   label: 'Analyze',  icon: Zap },
  { href: '/optimize',  label: 'Optimize', icon: Wand2 },
  { href: '/coach',     label: 'Coach',    icon: Brain },
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const path = usePathname()

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
  }, [path])

  return (
    <SidebarCtx.Provider value={{ collapsed }}>
      <div className="flex min-h-screen bg-bg">
        <Sidebar
          collapsed={collapsed}
          onCollapse={setCollapsed}
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
          isMobile={isMobile}
        />

        {/* Mobile backdrop */}
        {mobileOpen && isMobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        <motion.main
          animate={{ marginLeft: isMobile ? 0 : (collapsed ? 64 : 220) }}
          transition={{ type: 'spring', stiffness: 400, damping: 35 }}
          className="flex-1 min-h-screen min-w-0 pb-20 md:pb-0 overflow-x-hidden"
        >
          {/* Mobile top header */}
          <div className="sticky top-0 z-30 md:hidden flex items-center justify-between px-4 h-14"
            style={{ background: 'rgba(8,8,10,0.94)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.055)' }}>
            <button
              onClick={() => setMobileOpen(true)}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Link href="/" className="flex items-center gap-2">
              <CourtIQLogo className="w-6 h-6" />
              <span className="display text-[15px] font-bold text-white">Court<span className="text-rose-400">IQ</span></span>
            </Link>
            <div className="w-9" />
          </div>

          {children}

          {/* Mobile bottom nav */}
          <div className="md:hidden fixed bottom-0 inset-x-0 z-30 flex safe-area-bottom"
            style={{ background: 'rgba(9,9,11,0.97)', backdropFilter: 'blur(24px)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            {BOTTOM_TABS.map(({ href, label, icon: Icon }) => {
              const active = path === href || (href !== '/dashboard' && path.startsWith(href))
              return (
                <Link key={href} href={href}
                  className={cn(
                    'flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-colors',
                    active ? 'text-rose-400' : 'text-white/30 active:text-white/60'
                  )}
                >
                  <Icon className="w-[18px] h-[18px]" />
                  <span className="text-[10px] font-semibold tracking-wide">{label}</span>
                </Link>
              )
            })}
            <button
              onClick={() => setMobileOpen(true)}
              className="flex-1 flex flex-col items-center justify-center gap-1 py-3 text-white/30 active:text-white/60 transition-colors"
            >
              <MoreHorizontal className="w-[18px] h-[18px]" />
              <span className="text-[10px] font-semibold tracking-wide">More</span>
            </button>
          </div>
        </motion.main>
      </div>
    </SidebarCtx.Provider>
  )
}
