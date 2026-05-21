'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft, Zap, Brain, Shield } from 'lucide-react'

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.205c0-.638-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}

function DiscordIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 71 55" fill="none">
      <path d="M60.1 4.9A58.5 58.5 0 0045.6.8a41 41 0 00-1.8 3.7 54.1 54.1 0 00-16.3 0A40 40 0 0025.7.8 58.8 58.8 0 0011.1 5C1.6 19.4-1 33.5.3 47.4a59 59 0 0018 9.1 42.4 42.4 0 003.6-6 38.4 38.4 0 01-5.7-2.7l1.4-1 .4-.3a42.1 42.1 0 0036.2 0l1.8 1.3a38.4 38.4 0 01-5.7 2.7 42.2 42.2 0 003.6 6 58.8 58.8 0 0018-9.1c1.5-15.6-2.5-29.5-10.8-41.5zM23.7 38.8c-3.5 0-6.4-3.2-6.4-7.2s2.8-7.2 6.4-7.2c3.5 0 6.4 3.2 6.3 7.2 0 4-2.8 7.2-6.3 7.2zm23.5 0c-3.5 0-6.4-3.2-6.4-7.2s2.8-7.2 6.4-7.2c3.5 0 6.4 3.2 6.3 7.2 0 4-2.8 7.2-6.3 7.2z" fill="#5865F2"/>
    </svg>
  )
}

export default function LoginPage() {
  const [loading, setLoading] = useState<'google' | 'discord' | null>(null)

  const signIn = async (provider: 'google' | 'discord') => {
    setLoading(provider)
    window.location.href = `/api/auth/signin/${provider}?callbackUrl=/dashboard`
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4 relative overflow-hidden">
      {/* bg glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-crimson-radial opacity-50" />
      </div>

      {/* Grid */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden>
        <defs>
          <pattern id="g" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#g)" />
      </svg>

      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} className="relative z-10 w-full max-w-sm">
        <Link href="/" className="flex items-center gap-2 text-fg-muted hover:text-fg transition-colors text-sm mb-8">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        <div className="card p-8">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-violet-600 flex items-center justify-center">
                <span className="display text-white font-bold">C</span>
              </div>
              <span className="display text-xl font-bold text-fg">Court<span className="text-rose-400">IQ</span></span>
            </Link>
          </div>

          <h1 className="text-xl font-bold text-fg text-center mb-1.5">Sign in to CourtIQ</h1>
          <p className="text-fg-muted text-sm text-center mb-8">Access your builds, AI coach, and saved analysis.</p>

          <div className="space-y-3">
            <button onClick={() => signIn('google')} disabled={!!loading}
              className="btn btn-secondary w-full h-12 gap-3 justify-center text-sm">
              {loading === 'google' ? <span className="w-4 h-4 rounded-full border-2 border-fg-muted border-t-transparent animate-spin" /> : <GoogleIcon />}
              Continue with Google
            </button>
            <button onClick={() => signIn('discord')} disabled={!!loading}
              className="btn w-full h-12 gap-3 justify-center text-sm" style={{ background:'rgba(88,101,242,0.12)', border:'1px solid rgba(88,101,242,0.25)', color:'#818CF8' }}>
              {loading === 'discord' ? <span className="w-4 h-4 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" /> : <DiscordIcon />}
              Continue with Discord
            </button>
          </div>

          <div className="divider my-6" />

          <div className="space-y-2.5">
            {[
              { icon:Zap,    text:'Unlimited AI build analysis' },
              { icon:Brain,  text:'Personalized coaching sessions' },
              { icon:Shield, text:'Save and share your builds' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2.5 text-xs text-fg-muted">
                <Icon className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />{text}
              </div>
            ))}
          </div>

          <p className="text-fg-subtle text-xs text-center mt-6">
            By signing in you agree to our{' '}
            <span className="text-rose-400 cursor-pointer hover:underline">Terms</span>
            {' '}and{' '}
            <span className="text-rose-400 cursor-pointer hover:underline">Privacy Policy</span>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
