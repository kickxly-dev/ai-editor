'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Eye, EyeOff, Zap, Brain, Shield, ArrowRight } from 'lucide-react'
import { signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { CourtIQLogo } from '@/components/ui/Logo'

function LoginForm() {
  const params = useSearchParams()
  const callbackUrl = params.get('callbackUrl') || '/dashboard'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await signIn('credentials', {
        email,
        password,
        callbackUrl,
        redirect: false,
      })
      if (result?.error) {
        setError('Invalid email or password.')
      } else if (result?.url) {
        window.location.href = result.url
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden"
      style={{ background: '#08080a' }}>

      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full opacity-30"
          style={{ background: 'radial-gradient(ellipse, #E11D4820 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full opacity-15"
          style={{ background: 'radial-gradient(ellipse, #8B5CF620 0%, transparent 70%)' }} />
      </div>

      {/* Grid */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40" aria-hidden>
        <defs>
          <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(255,255,255,0.025)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 26 }}
        className="relative z-10 w-full max-w-[400px]"
      >
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #E11D48 0%, #7C3AED 100%)' }}>
            <CourtIQLogo className="w-6 h-6 text-white" />
          </div>
          <span className="text-[22px] font-black text-white tracking-tight">
            Court<span style={{ color: '#E11D48' }}>IQ</span>
          </span>
        </Link>

        {/* Card */}
        <div className="rounded-3xl p-8"
          style={{ background: 'rgba(255,255,255,0.032)', border: '1px solid rgba(255,255,255,0.08)' }}>

          <div className="mb-7">
            <h1 className="text-[26px] font-black text-white tracking-tight leading-tight">Welcome back</h1>
            <p className="text-white/45 text-[14px] mt-1.5">Sign in to your CourtIQ account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-[0.16em] text-white/40 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                className="w-full h-11 px-4 rounded-xl text-[14px] text-white placeholder-white/25 outline-none transition-all duration-200"
                style={{
                  background: 'rgba(255,255,255,0.045)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
                onFocus={e => (e.target.style.borderColor = 'rgba(225,29,72,0.5)')}
                onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-[0.16em] text-white/40 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full h-11 px-4 pr-11 rounded-xl text-[14px] text-white placeholder-white/25 outline-none transition-all duration-200"
                  style={{
                    background: 'rgba(255,255,255,0.045)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                  onFocus={e => (e.target.style.borderColor = 'rgba(225,29,72,0.5)')}
                  onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-4 py-3 rounded-xl text-[13px]"
                style={{ background: 'rgba(225,29,72,0.1)', border: '1px solid rgba(225,29,72,0.25)', color: '#f87171' }}
              >
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl text-[14px] font-bold text-white transition-all duration-200 flex items-center justify-center gap-2 mt-2"
              style={{ background: loading ? 'rgba(225,29,72,0.5)' : '#E11D48' }}
            >
              {loading ? (
                <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              ) : (
                <>Sign In <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
            <span className="text-[11px] text-white/25 font-medium">Why CourtIQ?</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
          </div>

          <div className="space-y-2.5">
            {[
              { icon: Zap,    text: 'Unlimited AI build analysis', color: '#E11D48' },
              { icon: Brain,  text: 'Personalized coaching sessions', color: '#8B5CF6' },
              { icon: Shield, text: 'Save and share your builds', color: '#38BDF8' },
            ].map(({ icon: Icon, text, color }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: `${color}14` }}>
                  <Icon className="w-3 h-3" style={{ color }} />
                </div>
                <span className="text-[13px] text-white/45">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-[13px] text-white/30 mt-5">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="font-semibold hover:text-white/60 transition-colors"
            style={{ color: '#E11D48' }}>
            Sign up free
          </Link>
        </p>
      </motion.div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
