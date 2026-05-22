'use client'
import { motion } from 'framer-motion'
import { Eye, FlaskConical } from 'lucide-react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'

export default function VisionPage() {
  const { data: session } = useSession()
  const isAdmin = (session?.user as { isAdmin?: boolean })?.isAdmin

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center px-6 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, type: 'spring', stiffness: 260, damping: 24 }}
        className="space-y-6"
      >
        <motion.div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
          style={{ background: 'rgba(225,29,72,0.08)', border: '1px solid rgba(225,29,72,0.25)' }}
          animate={{ boxShadow: ['0 0 0px rgba(225,29,72,0)', '0 0 24px rgba(225,29,72,0.35)', '0 0 0px rgba(225,29,72,0)'] }}
          transition={{ duration: 2.8, repeat: Infinity }}
        >
          <Eye className="w-7 h-7 text-rose-400" />
        </motion.div>

        <div>
          <p className="font-mono text-[10px] font-black tracking-[0.4em] uppercase text-rose-400 mb-3">2K VISION</p>
          <h1 className="font-black text-4xl sm:text-5xl text-white mb-3 tracking-tight">Coming Soon.</h1>
          <p className="font-mono text-[11px] text-white/25 max-w-[260px] mx-auto leading-relaxed">
            Something advanced is being built here.
          </p>
        </div>

        <div className="flex items-center justify-center gap-2">
          {[0, 0.22, 0.44].map((d, i) => (
            <motion.span key={i} className="w-1.5 h-1.5 rounded-full bg-rose-400"
              animate={{ opacity: [0.15, 1, 0.15] }}
              transition={{ duration: 1.3, repeat: Infinity, delay: d }} />
          ))}
        </div>

        {isAdmin && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
            <Link href="/vision/audio-cue"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-mono text-[11px] font-bold uppercase tracking-widest transition-all hover:opacity-80"
              style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', color: 'rgba(245,158,11,0.7)' }}>
              <FlaskConical className="w-3.5 h-3.5" />
              Admin Preview — Audio Cue Sniffer
            </Link>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
