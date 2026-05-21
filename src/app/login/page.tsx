'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Brain, Chrome, MessageSquare, Zap, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [loading, setLoading] = useState<'google' | 'discord' | null>(null)

  const signIn = async (provider: 'google' | 'discord') => {
    setLoading(provider)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Sign in failed'
      toast.error(message)
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-background hero-bg grid-bg flex items-center justify-center px-4">
      {/* Background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-crimson/8 blur-3xl"
        />
        <motion.div
          animate={{ scale: [1.1, 1, 1.1], opacity: [0.15, 0.3, 0.15] }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-purple-600/8 blur-3xl"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Back link */}
        <Link href="/" className="flex items-center gap-2 text-text-muted hover:text-text-primary transition-colors text-sm mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        {/* Card */}
        <div className="glass-card p-8 border border-crimson/10">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-crimson to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-base">C</span>
              </div>
              <span className="text-2xl font-bold font-display">Court<span className="text-crimson">IQ</span></span>
            </Link>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-black text-text-primary mb-2">Sign in to CourtIQ</h1>
            <p className="text-text-muted text-sm">Access your builds, AI coach, and saved analysis.</p>
          </div>

          {/* OAuth buttons */}
          <div className="space-y-3">
            <Button
              variant="secondary"
              className="w-full gap-3 h-12 text-sm"
              onClick={() => signIn('google')}
              loading={loading === 'google'}
            >
              <Chrome className="w-5 h-5 text-red-400" />
              Continue with Google
            </Button>
            <Button
              variant="secondary"
              className="w-full gap-3 h-12 text-sm border-[#5865F2]/30 hover:border-[#5865F2]/60"
              onClick={() => signIn('discord')}
              loading={loading === 'discord'}
            >
              <div className="w-5 h-5 rounded bg-[#5865F2] flex items-center justify-center">
                <MessageSquare className="w-3 h-3 text-white" />
              </div>
              Continue with Discord
            </Button>
          </div>

          <div className="mt-6 pt-6 border-t border-border">
            <div className="flex flex-col gap-2">
              {[
                { icon: Zap, text: 'Unlimited build analysis with Groq AI' },
                { icon: Brain, text: 'Personal AI coaching sessions' },
                { icon: Brain, text: 'Save and share your builds' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2.5 text-xs text-text-muted">
                  <Icon className="w-3.5 h-3.5 text-crimson flex-shrink-0" />
                  {text}
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-text-muted text-center mt-6">
            By signing in you agree to our{' '}
            <span className="text-crimson cursor-pointer hover:underline">Terms</span>
            {' '}and{' '}
            <span className="text-crimson cursor-pointer hover:underline">Privacy Policy</span>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
