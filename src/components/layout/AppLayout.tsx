'use client'
import { createContext, useContext, useState } from 'react'
import { motion } from 'framer-motion'
import Sidebar from './Sidebar'

const SidebarCtx = createContext({ collapsed: false })
export const useSidebar = () => useContext(SidebarCtx)

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <SidebarCtx.Provider value={{ collapsed }}>
      <div className="flex min-h-screen bg-bg">
        <Sidebar collapsed={collapsed} onCollapse={setCollapsed} />
        <motion.main
          animate={{ marginLeft: collapsed ? 64 : 220 }}
          transition={{ type: 'spring', stiffness: 400, damping: 35 }}
          className="flex-1 min-h-screen min-w-0"
        >
          {children}
        </motion.main>
      </div>
    </SidebarCtx.Provider>
  )
}
