'use client'
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { Eye, ArrowLeft } from 'lucide-react'

// ─── Entry portal overlay ─────────────────────────────────────────────────────

function EntryPortal({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2200)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: 'easeInOut' }}
      className="fixed inset-0 z-[60] flex items-center justify-center"
      style={{ background: '#04040A' }}
    >
      {/* Scanline texture on entry */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'repeating-linear-gradient(0deg, rgba(225,29,72,0.025) 0px, rgba(225,29,72,0.025) 1px, transparent 1px, transparent 3px)' }} />

      {/* Radial red glow from center */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.4, 0.15] }}
        transition={{ duration: 1.8, times: [0, 0.3, 1] }}
        style={{ background: 'radial-gradient(ellipse at center, rgba(225,29,72,0.12) 0%, transparent 70%)' }}
      />

      <div className="text-center space-y-6 relative z-10">
        {/* Pulsing eye */}
        <motion.div
          className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto relative"
          style={{ background: 'rgba(225,29,72,0.08)', border: '1px solid rgba(225,29,72,0.35)' }}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: 'spring', stiffness: 280, damping: 20 }}
        >
          <motion.div
            className="absolute inset-0 rounded-2xl"
            animate={{ boxShadow: ['0 0 0px rgba(225,29,72,0)', '0 0 48px rgba(225,29,72,0.55)', '0 0 16px rgba(225,29,72,0.2)'] }}
            transition={{ duration: 1, repeat: Infinity, repeatType: 'mirror' }}
          />
          <Eye className="w-9 h-9 text-rose-400 relative z-10" />
        </motion.div>

        {/* Text */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <p className="font-mono text-[9px] tracking-[0.7em] text-rose-400 uppercase mb-4">ENTERING VISION</p>
          <div className="flex items-center justify-center gap-2">
            {[0, 0.18, 0.36].map((d, i) => (
              <motion.span key={i} className="w-1.5 h-1.5 rounded-full"
                style={{ background: '#FF2D55' }}
                animate={{ opacity: [0.15, 1, 0.15], scale: [0.8, 1.2, 0.8] }}
                transition={{ duration: 0.9, repeat: Infinity, delay: d }} />
            ))}
          </div>
        </motion.div>
      </div>

      {/* Corner glitch lines */}
      {[
        { top: 0, left: 0, w: '40%', h: '1px' },
        { top: 0, left: 0, w: '1px', h: '40%' },
        { bottom: 0, right: 0, w: '40%', h: '1px' },
        { bottom: 0, right: 0, w: '1px', h: '40%' },
      ].map((s, i) => (
        <motion.div key={i} className="absolute pointer-events-none"
          style={{ ...s, background: 'rgba(225,29,72,0.4)' }}
          initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0.4] }}
          transition={{ delay: 0.1 * i, duration: 0.6 }} />
      ))}
    </motion.div>
  )
}

// ─── Vision layout ────────────────────────────────────────────────────────────

export default function VisionLayout({ children }: { children: React.ReactNode }) {
  const [entered, setEntered] = useState(false)
  const [tick, setTick] = useState(0)
  const [sessionId] = useState(() => Math.random().toString(16).slice(2, 10).toUpperCase())
  const done = useCallback(() => setEntered(true), [])

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 2200)
    return () => clearInterval(id)
  }, [])
  const latency = ((tick * 7 + 9) % 28) + 8

  return (
    <div className="min-h-screen relative" style={{ background: '#06060A' }}>
      {/* Persistent scanline */}
      <div className="vision-scanline" />

      {/* Entry portal */}
      <AnimatePresence>{!entered && <EntryPortal onDone={done} />}</AnimatePresence>

      {/* Top bar */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: entered ? 1 : 0, y: entered ? 0 : -8 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 right-0 z-40 h-12 flex items-center px-4 gap-4"
        style={{ background: 'rgba(6,6,10,0.97)', borderBottom: '1px solid rgba(225,29,72,0.14)', backdropFilter: 'blur(16px)' }}
      >
        {/* Exit */}
        <Link href="/dashboard"
          className="flex items-center gap-1.5 font-mono text-[10px] text-white/25 hover:text-rose-400 transition-all duration-200 uppercase tracking-widest group">
          <ArrowLeft className="w-3 h-3 group-hover:-translate-x-0.5 transition-transform" />
          <span>Exit</span>
        </Link>

        {/* Center — session info */}
        <div className="hidden sm:flex items-center gap-2 mx-auto font-mono text-[8px]">
          <motion.span className="w-1.5 h-1.5 rounded-full bg-emerald-400"
            animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.4, repeat: Infinity }} />
          <span className="text-white/20">SESSION: <span className="text-white/35">{sessionId}</span></span>
          <span className="text-white/10">|</span>
          <span style={{ color: latency < 20 ? 'rgba(52,211,153,0.5)' : 'rgba(252,211,77,0.5)' }}>{latency}ms</span>
          <span className="text-white/10">|</span>
          <span className="text-white/20">AES-256</span>
        </div>

        {/* Right — Vision logo */}
        <div className="ml-auto flex items-center gap-2">
          <motion.div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(225,29,72,0.1)', border: '1px solid rgba(225,29,72,0.3)' }}
            animate={{ boxShadow: ['0 0 0px rgba(225,29,72,0)', '0 0 10px rgba(225,29,72,0.45)', '0 0 0px rgba(225,29,72,0)'] }}
            transition={{ duration: 2.2, repeat: Infinity }}>
            <Eye className="w-3 h-3 text-rose-400" />
          </motion.div>
          <span className="font-mono text-[11px] font-black tracking-[0.3em] text-rose-400">VISION</span>
        </div>
      </motion.div>

      {/* Page content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: entered ? 1 : 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="pt-12"
      >
        {children}
      </motion.div>
    </div>
  )
}
