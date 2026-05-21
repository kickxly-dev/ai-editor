'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Zap, Brain, TrendingUp, Users, BookOpen, ArrowRight, Activity, Star, Clock, BarChart3 } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'

const ACTIONS = [
  { href:'/analyze',   icon:Zap,        label:'Analyze Build',  desc:'AI breakdown in seconds', color:'rose' },
  { href:'/coach',     icon:Brain,       label:'AI Coach',       desc:'Ask anything',            color:'sky' },
  { href:'/meta',      icon:TrendingUp,  label:'Meta Tracker',   desc:'Current tier lists',      color:'emerald' },
  { href:'/builds',    icon:Users,       label:'Browse Builds',  desc:'Community builds',        color:'amber' },
  { href:'/tutorials', icon:BookOpen,    label:'Tutorials',      desc:'Learn faster',            color:'violet' },
]

const COLORS: Record<string,{ icon:string; bg:string; border:string }> = {
  rose:    { icon:'text-rose-400',    bg:'bg-rose-500/10',    border:'border-rose-500/20' },
  sky:     { icon:'text-sky-400',     bg:'bg-sky-500/10',     border:'border-sky-500/20' },
  emerald: { icon:'text-emerald-400', bg:'bg-emerald-500/10', border:'border-emerald-500/20' },
  amber:   { icon:'text-amber-400',   bg:'bg-amber-500/10',   border:'border-amber-500/20' },
  violet:  { icon:'text-violet-400',  bg:'bg-violet-500/10',  border:'border-violet-500/20' },
}

const ACTIVITY = [
  { icon:Zap,       label:'Build analyzed',      detail:'Shot Creator PG — S-Tier', time:'2h ago',  color:'text-rose-400' },
  { icon:Brain,     label:'AI coaching session',  detail:'8 messages · Groq',        time:'5h ago',  color:'text-sky-400' },
  { icon:Star,      label:'Build saved',          detail:'Park God Guard',           time:'1d ago',  color:'text-amber-400' },
  { icon:TrendingUp,label:'Meta checked',         detail:'Patch 1.08 changes',       time:'2d ago',  color:'text-emerald-400' },
]

function Sparkline({ vals, color }: { vals: number[]; color: string }) {
  const w = 64, h = 24, pad = 2
  const max = Math.max(...vals), min = Math.min(...vals)
  const range = max - min || 1
  const pts = vals.map((v, i) => {
    const x = pad + (i / (vals.length - 1)) * (w - 2 * pad)
    const y = h - pad - ((v - min) / range) * (h - 2 * pad)
    return `${x},${y}`
  }).join(' ')
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polyline fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" points={pts} opacity="0.8" />
    </svg>
  )
}

function cn(...c: (string | undefined | false)[]) { return c.filter(Boolean).join(' ') }

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-bg">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-16">

        {/* Welcome */}
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} className="mb-8">
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="text-white/40 text-sm">Welcome back</span>
            <span className="chip chip-muted">Free Plan</span>
          </div>
          <h1 className="display text-4xl text-white">Your Dashboard</h1>
        </motion.div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label:'Builds Analyzed', value:3,  spark:[1,2,1,3,2,3,3],    color:'#E11D48', icon:BarChart3 },
            { label:'Coach Sessions',  value:7,  spark:[2,3,4,3,5,6,7],    color:'#38BDF8', icon:Brain },
            { label:'Saved Builds',    value:12, spark:[4,6,8,9,10,11,12], color:'#F59E0B', icon:Star },
            { label:'Days Active',     value:14, spark:[1,3,5,7,9,11,14],  color:'#10B981', icon:Activity },
          ].map(({ label, value, spark, color, icon: Icon }, i) => (
            <motion.div key={label} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay: i*0.07 }}
              className="card p-5">
              <div className="flex items-start justify-between mb-3">
                <Icon className="w-4 h-4 text-white/25" />
                <Sparkline vals={spark} color={color} />
              </div>
              <p className="mono text-3xl font-bold text-white mb-0.5">{value}</p>
              <p className="text-white/40 text-xs">{label}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Quick actions */}
          <div className="lg:col-span-2">
            <p className="text-xs font-semibold text-white/25 uppercase tracking-wider mb-4">Quick Actions</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ACTIONS.map(({ href, icon: Icon, label, desc, color }, i) => {
                const c = COLORS[color]
                return (
                  <motion.div key={href} initial={{ opacity:0, x:-12 }} animate={{ opacity:1, x:0 }} transition={{ delay: i*0.06 }}>
                    <Link href={href} className={`card flex items-center gap-4 p-5 border ${c.border} hover:border-opacity-60 transition-all group`}>
                      <div className={`${c.bg} ${c.border} border w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                        <Icon className={`w-5 h-5 ${c.icon}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold text-sm">{label}</p>
                        <p className="text-white/40 text-xs">{desc}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-white/25 group-hover:text-white group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                    </Link>
                  </motion.div>
                )
              })}

              {/* Screenshot CTA */}
              <motion.div initial={{ opacity:0, x:-12 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.32 }}
                className="card p-5 border border-rose-500/20 bg-rose-500/5 sm:col-span-2 lg:col-span-1 flex flex-col">
                <div className="flex-1">
                  <span className="chip chip-crimson mb-3">New</span>
                  <p className="text-white font-bold mb-1">Screenshot Analysis</p>
                  <p className="text-white/35 text-xs">Drop a build screenshot. AI extracts every stat automatically.</p>
                </div>
                <Link href="/analyze" className="btn btn-primary btn-sm mt-4 w-fit gap-1.5">
                  <Zap className="w-3.5 h-3.5" /> Try Now
                </Link>
              </motion.div>
            </div>
          </div>

          {/* Activity + alert */}
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-white/25 uppercase tracking-wider mb-4">Recent Activity</p>
              <div className="card divide-y" style={{ '--tw-divide-opacity': 1 } as React.CSSProperties}>
                {ACTIVITY.map(({ icon: Icon, label, detail, time, color }) => (
                  <div key={label} className="flex items-start gap-3 p-4" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <Icon className={cn('w-3.5 h-3.5', color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium">{label}</p>
                      <p className="text-white/40 text-xs truncate">{detail}</p>
                    </div>
                    <div className="flex items-center gap-1 text-white/25 text-xs flex-shrink-0">
                      <Clock className="w-3 h-3" />{time}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Meta alert */}
            <div className="card p-4 border-amber-400/20 bg-amber-400/5">
              <div className="flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-white font-semibold text-sm">Patch 1.08 Live</p>
                  <p className="text-white/35 text-xs mt-0.5">Limitless Range HOF buffed. Update your badge priority now.</p>
                  <Link href="/meta" className="flex items-center gap-1 text-xs text-amber-400 mt-2 hover:underline">
                    View changes <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Coach CTA */}
            <div className="card p-4 border-sky-500/20 bg-sky-500/5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center flex-shrink-0">
                <Brain className="w-5 h-5 text-sky-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm">AI Coach Online</p>
                <p className="text-white/35 text-xs">Ask about builds, badges, or meta.</p>
              </div>
              <Link href="/coach" className="btn btn-sm flex-shrink-0"
                style={{ background:'rgba(56,189,248,0.15)', color:'#38BDF8', border:'1px solid rgba(56,189,248,0.25)' }}>
                Open
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
