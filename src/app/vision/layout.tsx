'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Eye, ArrowLeft } from 'lucide-react'

export default function VisionLayout({ children }: { children: React.ReactNode }) {
  const [tick, setTick] = useState(0)
  const [sessionId] = useState(() => Math.random().toString(16).slice(2, 10).toUpperCase())

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 2200)
    return () => clearInterval(id)
  }, [])
  const latency = ((tick * 7 + 9) % 28) + 8

  return (
    <div className="min-h-screen relative" style={{ background: '#06060A' }}>
      <div className="vision-scanline" />

      {/* Top bar */}
      <div
        className="fixed top-0 left-0 right-0 z-40 h-12 flex items-center px-4 gap-4"
        style={{ background: 'rgba(6,6,10,0.97)', borderBottom: '1px solid rgba(225,29,72,0.14)', backdropFilter: 'blur(16px)' }}
      >
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 font-mono text-[10px] text-white/25 hover:text-rose-400 transition-all duration-200 uppercase tracking-widest group"
        >
          <ArrowLeft className="w-3 h-3 group-hover:-translate-x-0.5 transition-transform" />
          <span>Exit</span>
        </Link>

        <div className="hidden sm:flex items-center gap-2 mx-auto font-mono text-[8px]">
          <motion.span
            className="w-1.5 h-1.5 rounded-full bg-emerald-400"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.4, repeat: Infinity }}
          />
          <span className="text-white/20">SESSION: <span className="text-white/35">{sessionId}</span></span>
          <span className="text-white/10">|</span>
          <span style={{ color: latency < 20 ? 'rgba(52,211,153,0.5)' : 'rgba(252,211,77,0.5)' }}>{latency}ms</span>
          <span className="text-white/10">|</span>
          <span className="text-white/20">AES-256</span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <motion.div
            className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(225,29,72,0.1)', border: '1px solid rgba(225,29,72,0.3)' }}
            animate={{ boxShadow: ['0 0 0px rgba(225,29,72,0)', '0 0 10px rgba(225,29,72,0.45)', '0 0 0px rgba(225,29,72,0)'] }}
            transition={{ duration: 2.2, repeat: Infinity }}
          >
            <Eye className="w-3 h-3 text-rose-400" />
          </motion.div>
          <span className="font-mono text-[11px] font-black tracking-[0.3em] text-rose-400">VISION</span>
        </div>
      </div>

      {/* Page content — immediately visible, no entry delay */}
      <div className="pt-12">
        {children}
      </div>
    </div>
  )
}
