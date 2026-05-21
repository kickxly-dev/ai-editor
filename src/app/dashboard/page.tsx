'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  Zap, Brain, TrendingUp, Users, BookOpen, BarChart3,
  ArrowRight, Activity, Star, Clock, CheckCircle2,
} from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const QUICK_ACTIONS = [
  { href: '/analyze', icon: Zap, label: 'Analyze Build', desc: 'Get AI breakdown', color: 'text-crimson', bg: 'bg-crimson/10', border: 'border-crimson/20' },
  { href: '/coach', icon: Brain, label: 'AI Coach', desc: 'Ask anything', color: 'text-neon-blue', bg: 'bg-neon-blue/10', border: 'border-neon-blue/20' },
  { href: '/meta', icon: TrendingUp, label: 'Meta Tracker', desc: 'Current tier lists', color: 'text-green-400', bg: 'bg-green-400/10', border: 'border-green-400/20' },
  { href: '/builds', icon: Users, label: 'Browse Builds', desc: 'Community builds', color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/20' },
  { href: '/tutorials', icon: BookOpen, label: 'Tutorials', desc: 'Learn faster', color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20' },
]

const RECENT_ACTIVITY = [
  { icon: Zap, label: 'Build analyzed', detail: 'Shot Creator PG — S-Tier', time: '2h ago', color: 'text-crimson' },
  { icon: Brain, label: 'AI coaching session', detail: '8 messages', time: '5h ago', color: 'text-neon-blue' },
  { icon: Star, label: 'Build liked', detail: 'Park God Guard by KingJosiah', time: '1d ago', color: 'text-yellow-400' },
  { icon: CheckCircle2, label: 'Badge guide completed', detail: 'Limitless Range HOF guide', time: '2d ago', color: 'text-green-400' },
]

const STATS = [
  { label: 'Builds Analyzed', value: '3', icon: BarChart3, color: 'text-crimson' },
  { label: 'Coach Sessions', value: '7', icon: Brain, color: 'text-neon-blue' },
  { label: 'Saved Builds', value: '12', icon: Star, color: 'text-yellow-400' },
  { label: 'Days Active', value: '14', icon: Activity, color: 'text-green-400' },
]

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        {/* Welcome header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="flex items-center gap-3 mb-2">
            <span className="text-text-muted text-sm">Welcome back</span>
            <span className="text-xs bg-crimson/10 border border-crimson/20 text-crimson px-2 py-0.5 rounded-full font-medium">Free Plan</span>
          </div>
          <h1 className="text-4xl font-black font-display text-text-primary">Your Dashboard</h1>
          <p className="text-text-secondary mt-1">Here's what's happening with your 2K26 journey.</p>
        </motion.div>

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {STATS.map(({ label, value, icon: Icon, color }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="glass-card p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <p className="text-3xl font-black font-display text-text-primary">{value}</p>
              <p className="text-xs text-text-muted mt-1">{label}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {QUICK_ACTIONS.map(({ href, icon: Icon, label, desc, color, bg, border }, i) => (
                <motion.div
                  key={href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <Link
                    href={href}
                    className={`glass-card p-5 border ${border} flex items-center gap-4 hover:bg-surface/80 transition-all group block`}
                  >
                    <div className={`${bg} ${border} border w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                      <Icon className={`w-5 h-5 ${color}`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-text-primary font-semibold text-sm">{label}</p>
                      <p className="text-text-muted text-xs">{desc}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-text-primary group-hover:translate-x-1 transition-all" />
                  </Link>
                </motion.div>
              ))}

              {/* CTA to analyze */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="glass-card p-5 border border-crimson/30 bg-crimson/5 flex flex-col justify-between sm:col-span-2 lg:col-span-1"
              >
                <div>
                  <Badge variant="default" className="mb-3">New Feature</Badge>
                  <h3 className="text-text-primary font-bold mb-1">Screenshot Analysis</h3>
                  <p className="text-text-muted text-xs">Upload your build screenshot and AI extracts all your stats automatically.</p>
                </div>
                <Link href="/analyze" className="mt-4">
                  <Button size="sm" className="gap-2 w-full">
                    <Zap className="w-3.5 h-3.5" />
                    Try Now
                  </Button>
                </Link>
              </motion.div>
            </div>
          </div>

          {/* Activity Feed */}
          <div>
            <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">Recent Activity</h2>
            <div className="glass-card divide-y divide-border">
              {RECENT_ACTIVITY.map(({ icon: Icon, label, detail, time, color }, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.08 }}
                  className="flex items-start gap-3 p-4"
                >
                  <div className={`w-8 h-8 rounded-xl bg-surface border border-border flex items-center justify-center flex-shrink-0 mt-0.5`}>
                    <Icon className={`w-3.5 h-3.5 ${color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary">{label}</p>
                    <p className="text-xs text-text-muted truncate">{detail}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-text-muted flex-shrink-0">
                    <Clock className="w-3 h-3" />
                    {time}
                  </div>
                </motion.div>
              ))}
              {RECENT_ACTIVITY.length === 0 && (
                <p className="text-center text-text-muted text-sm p-8">No activity yet. Start analyzing!</p>
              )}
            </div>

            {/* Meta alert */}
            <div className="glass-card p-4 mt-4 border border-yellow-400/20 bg-yellow-400/5">
              <div className="flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-text-primary">Meta Update</p>
                  <p className="text-xs text-text-muted mt-0.5">Limitless Range HOF buffed in Patch 1.08. Update your badge priority.</p>
                  <Link href="/meta" className="text-xs text-yellow-400 mt-2 flex items-center gap-1 hover:underline">
                    View Meta Tracker <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Coach CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 glass-card p-6 border border-neon-blue/20 bg-neon-blue/5 flex flex-col sm:flex-row items-start sm:items-center gap-4"
        >
          <div className="w-12 h-12 rounded-2xl bg-neon-blue/10 border border-neon-blue/30 flex items-center justify-center flex-shrink-0">
            <Brain className="w-6 h-6 text-neon-blue" />
          </div>
          <div className="flex-1">
            <h3 className="text-text-primary font-bold">Ready to level up?</h3>
            <p className="text-text-muted text-sm mt-0.5">Your AI coach is online 24/7. Ask about builds, badges, meta, or how to improve your game.</p>
          </div>
          <Link href="/coach">
            <Button variant="neon" className="gap-2 flex-shrink-0">
              <Brain className="w-4 h-4" />
              Open AI Coach
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  )
}
