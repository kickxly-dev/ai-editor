'use client'
import { useRef, useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Camera, CameraOff, Volume2, VolumeX, Play, Square, Zap,
  ChevronDown, Eye, Wifi, Maximize2, Minimize2,
  Smartphone, Monitor, ArrowRight, RotateCcw,
} from 'lucide-react'

type Priority = 'critical' | 'tip' | 'nice'
type Category = 'offense' | 'defense' | 'timing' | 'positioning' | 'takeover'

interface CoachTip {
  tip: string
  category: Category
  priority: Priority
  timestamp: number
}

const PRIORITY = {
  critical: {
    bg: 'rgba(239,68,68,0.18)', border: 'rgba(239,68,68,0.4)',
    text: 'text-red-400', label: 'CRITICAL', bar: '#ef4444',
  },
  tip: {
    bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.38)',
    text: 'text-amber-400', label: 'TIP', bar: '#f59e0b',
  },
  nice: {
    bg: 'rgba(52,211,153,0.13)', border: 'rgba(52,211,153,0.35)',
    text: 'text-emerald-400', label: 'INFO', bar: '#34d399',
  },
}

const CAT_ICON: Record<Category, string> = {
  offense: '⚡', defense: '🛡️', timing: '⏱️', positioning: '📍', takeover: '🔥',
}

const INTERVALS = [{ label: '1s', ms: 1000 }, { label: '2s', ms: 2000 }, { label: '3s', ms: 3000 }]

const BUILD_OPTS = [
  '', 'Shot Creator Guard', 'Two-Way Guard', 'Playmaking Wing',
  'Stretch Big', 'Glass Cleaner', 'Pure Lock', 'Slashing SF',
]

export default function VisionPage() {
  const videoRef       = useRef<HTMLVideoElement>(null)
  const canvasRef      = useRef<HTMLCanvasElement>(null)
  const streamRef      = useRef<MediaStream | null>(null)
  const timerRef       = useRef<ReturnType<typeof setInterval> | null>(null)
  const speechUnlocked = useRef(false)

  const [cameraOn,    setCameraOn]    = useState(false)
  const [autoOn,      setAutoOn]      = useState(false)
  const [busy,        setBusy]        = useState(false)
  const [voiceOn,     setVoiceOn]     = useState(false)
  const [intervalMs,  setIntervalMs]  = useState(2000)
  const [build,       setBuild]       = useState('')
  const [tips,        setTips]        = useState<CoachTip[]>([])
  const [latest,      setLatest]      = useState<CoachTip | null>(null)
  const [err,         setErr]         = useState<string | null>(null)
  const [fullscreen,  setFullscreen]  = useState(false)
  const [ready,       setReady]       = useState(false) // has user tapped Start Camera at least once

  const startCamera = async () => {
    setErr(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setCameraOn(true)
      setReady(true)
    } catch {
      setErr('Camera access denied — allow camera in your browser settings and try again.')
      setReady(true)
    }
  }

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setCameraOn(false)
    setAutoOn(false)
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
  }, [])

  const analyze = useCallback(async () => {
    const video  = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || busy) return
    canvas.width  = video.videoWidth  || 640
    canvas.height = video.videoHeight || 360
    canvas.getContext('2d')?.drawImage(video, 0, 0)
    const image = canvas.toDataURL('image/jpeg', 0.72)
    setBusy(true)
    try {
      const res  = await fetch('/api/vision', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ mode: 'camera', image, buildContext: build || undefined }),
      })
      const data = await res.json()
      if (data.tip) {
        const t: CoachTip = {
          tip: data.tip, category: data.category || 'tip',
          priority: data.priority || 'tip', timestamp: Date.now(),
        }
        setLatest(t)
        setTips(prev => [t, ...prev.slice(0, 9)])
        if (voiceOn && speechUnlocked.current && 'speechSynthesis' in window) {
          window.speechSynthesis.cancel()
          const u = new SpeechSynthesisUtterance(data.tip)
          u.rate = 1.15
          u.volume = 1
          window.speechSynthesis.speak(u)
        }
      }
    } catch { /* silent fail */ }
    finally { setBusy(false) }
  }, [busy, build, voiceOn])

  const startAuto = useCallback(() => {
    setAutoOn(true)
    analyze()
    timerRef.current = setInterval(analyze, intervalMs)
  }, [analyze, intervalMs])

  const stopAuto = useCallback(() => {
    setAutoOn(false)
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
  }, [])

  // restart timer when interval changes while auto is running
  useEffect(() => {
    if (autoOn) { stopAuto(); startAuto() }
  }, [intervalMs]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => { stopCamera() }, [stopCamera])

  const ps = latest ? PRIORITY[latest.priority] : null

  // ── Setup screen (first visit, camera not yet started) ───────────────────────
  if (!ready) {
    return (
      <div className="flex flex-col min-h-[calc(100vh-48px)] px-5 pb-8">
        {/* Hero */}
        <div className="flex flex-col items-center justify-center text-center pt-10 pb-8">
          <motion.div
            className="w-24 h-24 rounded-[28px] flex items-center justify-center mb-6 relative"
            style={{ background: 'rgba(225,29,72,0.07)', border: '1px solid rgba(225,29,72,0.22)' }}
            animate={{ boxShadow: ['0 0 0px rgba(225,29,72,0)', '0 0 48px rgba(225,29,72,0.3)', '0 0 0px rgba(225,29,72,0)'] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Eye className="w-10 h-10 text-rose-400" />
          </motion.div>
          <h2 className="text-[26px] font-black text-white mb-3 leading-tight tracking-tight">
            AI Vision Coach
          </h2>
          <p className="text-white/40 text-sm leading-relaxed max-w-[270px]">
            Point your phone at your TV while you play.<br />
            CourtIQ watches the screen and coaches you live.
          </p>
        </div>

        {/* How it works */}
        <div className="space-y-2.5 mb-8">
          {[
            {
              num: '1',
              icon: <Smartphone className="w-4 h-4 text-rose-400" />,
              title: 'Open on your phone',
              desc: "You're already here ✓",
              accent: 'rgba(225,29,72,0.12)',
            },
            {
              num: '2',
              icon: <Monitor className="w-4 h-4 text-sky-400" />,
              title: 'Point rear camera at your TV',
              desc: 'Prop it on something stable or angle it at the screen',
              accent: 'rgba(14,165,233,0.10)',
            },
            {
              num: '3',
              icon: <Wifi className="w-4 h-4 text-emerald-400" />,
              title: 'Hit Auto Coach',
              desc: 'AI reads your screen every 3–10s and gives real-time tips',
              accent: 'rgba(52,211,153,0.10)',
            },
            {
              num: '4',
              icon: <Volume2 className="w-4 h-4 text-amber-400" />,
              title: 'Turn on Voice',
              desc: 'Hear tips aloud so you never look away from the game',
              accent: 'rgba(245,158,11,0.10)',
            },
          ].map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.07 }}
              className="flex items-center gap-4 p-4 rounded-2xl"
              style={{ background: step.accent, border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(255,255,255,0.06)' }}>
                {step.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold leading-tight">{step.title}</p>
                <p className="text-white/35 text-xs mt-0.5 leading-snug">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.button
          onClick={startCamera}
          className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl text-[15px] font-bold bg-rose-500 text-white hover:bg-rose-400 active:scale-[0.98] transition-all"
          whileTap={{ scale: 0.97 }}
        >
          <Camera className="w-5 h-5" />
          Start Camera
          <ArrowRight className="w-4 h-4 opacity-70" />
        </motion.button>
      </div>
    )
  }

  // ── Main coaching UI ─────────────────────────────────────────────────────────
  return (
    <div className={`flex flex-col ${fullscreen ? 'h-[calc(100vh-48px)] overflow-hidden' : 'min-h-[calc(100vh-48px)]'}`}>

      {/* Camera viewport */}
      <div
        className={`relative bg-black overflow-hidden flex-shrink-0 ${fullscreen ? 'flex-1' : ''}`}
        style={{ aspectRatio: fullscreen ? undefined : '16/9' }}
      >
        <video
          ref={videoRef}
          playsInline
          muted
          className={`w-full h-full object-cover ${cameraOn ? '' : 'hidden'}`}
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Camera-off placeholder */}
        {!cameraOn && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3"
            style={{ background: 'rgba(6,6,10,0.97)' }}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(225,29,72,0.08)', border: '1px solid rgba(225,29,72,0.2)' }}>
              <Camera className="w-7 h-7 text-rose-400" />
            </div>
            <p className="text-white/40 text-sm font-medium">Camera off</p>
            {err && (
              <div className="mx-6 px-4 py-3 rounded-xl text-center"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
                <p className="text-red-400 text-xs leading-snug">{err}</p>
              </div>
            )}
          </div>
        )}

        {/* Status badges — top right */}
        <div className="absolute top-3 right-3 flex items-center gap-2">
          {autoOn && (
            <div className="flex items-center gap-1.5 rounded-full px-2.5 py-1 backdrop-blur-sm"
              style={{ background: 'rgba(52,211,153,0.18)', border: '1px solid rgba(52,211,153,0.35)' }}>
              <motion.div className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 0.7 }} />
              <span className="text-emerald-400 text-[10px] font-bold tracking-wide">LIVE</span>
            </div>
          )}
          {busy && (
            <div className="flex items-center gap-1.5 rounded-full px-2.5 py-1 backdrop-blur-sm"
              style={{ background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <motion.div className="w-1.5 h-1.5 rounded-full bg-rose-400"
                animate={{ scale: [1, 1.4, 1] }} transition={{ repeat: Infinity, duration: 0.65 }} />
              <span className="text-white/60 text-[10px]">Reading</span>
            </div>
          )}
          <button
            onClick={() => setFullscreen(f => !f)}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white/40 hover:text-white active:scale-90 transition-all backdrop-blur-sm"
            style={{ background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            {fullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Tip overlay — bottom of camera */}
        <AnimatePresence mode="wait">
          {latest && ps && (
            <motion.div
              key={latest.timestamp}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="absolute bottom-0 left-0 right-0 p-3 backdrop-blur-md"
              style={{ background: ps.bg, borderTop: `1px solid ${ps.border}` }}
            >
              {/* Priority bar */}
              <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: ps.bar, opacity: 0.7 }} />
              <div className="flex items-start gap-2.5">
                <span className="text-[18px] leading-none mt-0.5 shrink-0">{CAT_ICON[latest.category]}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-[9px] font-black tracking-[0.14em] mb-1 ${ps.text}`}>{ps.label}</p>
                  <p className="text-white text-[13px] font-semibold leading-snug">{latest.tip}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Controls panel — hidden in fullscreen */}
      {!fullscreen && (
        <div className="flex-1 px-4 pt-3 pb-6 space-y-3 overflow-y-auto">

          {/* Settings row */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* Frequency */}
            <div className="rounded-2xl px-3 py-3"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="text-white/25 text-[9px] font-bold tracking-[0.12em] uppercase mb-2">Frequency</p>
              <div className="flex gap-1">
                {INTERVALS.map(({ label, ms }) => (
                  <button key={ms} onClick={() => setIntervalMs(ms)}
                    className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all active:scale-95 ${
                      intervalMs === ms ? 'bg-rose-500 text-white' : 'text-white/30 hover:text-white/60'
                    }`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Build context */}
            <div className="rounded-2xl px-3 py-3"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="text-white/25 text-[9px] font-bold tracking-[0.12em] uppercase mb-2">Your Build</p>
              <div className="relative flex items-center">
                <select
                  value={build}
                  onChange={e => setBuild(e.target.value)}
                  className="w-full bg-transparent text-white/60 text-[11px] font-semibold focus:outline-none cursor-pointer appearance-none pr-4"
                >
                  <option value="" className="bg-zinc-900">Any build</option>
                  {BUILD_OPTS.filter(Boolean).map(b => (
                    <option key={b} value={b} className="bg-zinc-900">{b}</option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 text-white/25 absolute right-0 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Primary buttons */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={cameraOn ? stopCamera : startCamera}
              className={`flex items-center justify-center gap-2 rounded-2xl py-4 text-sm font-bold transition-all active:scale-[0.97] ${
                cameraOn
                  ? 'text-white/50 hover:text-white/70'
                  : 'bg-rose-500 text-white hover:bg-rose-400'
              }`}
              style={cameraOn ? { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' } : {}}
            >
              {cameraOn ? <CameraOff className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
              {cameraOn ? 'Stop' : 'Start Camera'}
            </button>

            <button
              onClick={autoOn ? stopAuto : startAuto}
              disabled={!cameraOn}
              className={`flex items-center justify-center gap-2 rounded-2xl py-4 text-sm font-bold transition-all active:scale-[0.97] disabled:opacity-30 disabled:cursor-not-allowed ${
                autoOn ? 'text-emerald-400' : 'text-white/60 hover:text-white/80'
              }`}
              style={autoOn
                ? { background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.3)' }
                : { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              {autoOn ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {autoOn ? 'Stop Auto' : 'Auto Coach'}
            </button>
          </div>

          {/* Secondary buttons */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={analyze}
              disabled={!cameraOn || busy}
              className="flex items-center justify-center gap-1.5 rounded-xl py-3 text-xs font-semibold text-white/45 hover:text-white/70 transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <Zap className="w-3.5 h-3.5" />
              Snap
            </button>

            <button
              onClick={() => {
                const next = !voiceOn
                setVoiceOn(next)
                if (next && 'speechSynthesis' in window) {
                  // Unlock speech synthesis with a silent utterance on the user gesture
                  const unlock = new SpeechSynthesisUtterance(' ')
                  unlock.volume = 0
                  window.speechSynthesis.cancel()
                  window.speechSynthesis.speak(unlock)
                  speechUnlocked.current = true
                }
              }}
              className={`flex items-center justify-center gap-1.5 rounded-xl py-3 text-xs font-semibold transition-all active:scale-95 ${
                voiceOn ? 'text-amber-400' : 'text-white/40 hover:text-white/65'
              }`}
              style={voiceOn
                ? { background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)' }
                : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              {voiceOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              {voiceOn ? 'Voice On' : 'Voice Off'}
            </button>

            <button
              onClick={() => { setTips([]); setLatest(null) }}
              className="flex items-center justify-center gap-1.5 rounded-xl py-3 text-xs font-semibold text-white/30 hover:text-white/55 transition-all active:scale-95"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Clear
            </button>
          </div>

          {/* Tip history */}
          {tips.length > 1 && (
            <div>
              <p className="text-white/20 text-[9px] font-bold tracking-[0.12em] uppercase mb-2">Session Tips</p>
              <div className="space-y-1.5">
                {tips.slice(1, 6).map(t => {
                  const p = PRIORITY[t.priority]
                  return (
                    <div
                      key={t.timestamp}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                      style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.055)' }}
                    >
                      <span className="text-sm shrink-0">{CAT_ICON[t.category]}</span>
                      <p className="text-white/40 text-xs leading-snug flex-1 line-clamp-2">{t.tip}</p>
                      <span className={`text-[9px] font-black shrink-0 ${p.text}`}>{p.label}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Setup reminder when camera is off after being on */}
          {!cameraOn && ready && !err && (
            <div className="rounded-2xl p-4"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-white/25 text-[9px] font-bold tracking-[0.1em] uppercase mb-2.5">Quick Setup</p>
              <div className="space-y-2">
                {[
                  'Open this page on your phone',
                  'Point rear camera at your TV or monitor',
                  'Tap Start Camera then Auto Coach',
                  'Turn on Voice to hear tips hands-free',
                ].map((s, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-rose-400 shrink-0"
                      style={{ background: 'rgba(225,29,72,0.12)' }}>{i + 1}</span>
                    <span className="text-white/30 text-xs">{s}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
