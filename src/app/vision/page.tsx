'use client'
import { useRef, useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Camera, CameraOff, Volume2, VolumeX, Play, Square, Zap,
  ChevronDown, Eye, Wifi,
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
  critical: { bg: 'bg-red-500/15',     border: 'border-red-500/35',     text: 'text-red-400',     dot: 'bg-red-500',     label: 'CRITICAL' },
  tip:      { bg: 'bg-amber-500/15',   border: 'border-amber-500/35',   text: 'text-amber-400',   dot: 'bg-amber-500',   label: 'TIP'      },
  nice:     { bg: 'bg-emerald-500/15', border: 'border-emerald-500/35', text: 'text-emerald-400', dot: 'bg-emerald-500', label: 'INFO'     },
}

const CAT_ICON: Record<Category, string> = {
  offense:     '⚡',
  defense:     '🛡️',
  timing:      '⏱️',
  positioning: '📍',
  takeover:    '🔥',
}

const INTERVALS = [
  { label: '3s', ms: 3000 },
  { label: '5s', ms: 5000 },
  { label: '10s', ms: 10000 },
]

const BUILD_OPTS = [
  '', 'Shot Creator Guard', 'Two-Way Guard', 'Playmaking Wing',
  'Stretch Big', 'Glass Cleaner', 'Pure Lock', 'Slashing SF',
]

export default function VisionPage() {
  const videoRef   = useRef<HTMLVideoElement>(null)
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const streamRef  = useRef<MediaStream | null>(null)
  const timerRef   = useRef<ReturnType<typeof setInterval> | null>(null)

  const [cameraOn,  setCameraOn]  = useState(false)
  const [autoOn,    setAutoOn]    = useState(false)
  const [busy,      setBusy]      = useState(false)
  const [voiceOn,   setVoiceOn]   = useState(false)
  const [interval,  setIntervalMs] = useState(5000)
  const [build,     setBuild]     = useState('')
  const [tips,      setTips]      = useState<CoachTip[]>([])
  const [latest,    setLatest]    = useState<CoachTip | null>(null)
  const [err,       setErr]       = useState<string | null>(null)

  const startCamera = async () => {
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
      setErr(null)
    } catch {
      setErr('Camera access denied — allow camera in your browser settings and try again.')
    }
  }

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setCameraOn(false)
    stopAuto()
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
        const t: CoachTip = { tip: data.tip, category: data.category || 'tip', priority: data.priority || 'tip', timestamp: Date.now() }
        setLatest(t)
        setTips(prev => [t, ...prev.slice(0, 9)])
        if (voiceOn && 'speechSynthesis' in window) {
          window.speechSynthesis.cancel()
          const u = new SpeechSynthesisUtterance(data.tip)
          u.rate = 1.1
          window.speechSynthesis.speak(u)
        }
      }
    } catch { /* silent fail in auto mode */ }
    finally { setBusy(false) }
  }, [busy, build, voiceOn])

  const startAuto = useCallback(() => {
    setAutoOn(true)
    analyze()
    timerRef.current = setInterval(analyze, interval)
  }, [analyze, interval])

  function stopAuto() {
    setAutoOn(false)
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
  }

  // restart timer when interval changes while running
  useEffect(() => {
    if (autoOn) { stopAuto(); startAuto() }
  }, [interval]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => { stopCamera() }, [stopCamera])

  const ps = latest ? PRIORITY[latest.priority] : null

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-32 md:pb-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center">
          <Eye className="w-4 h-4 text-rose-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white leading-none">Vision Coach</h1>
          <p className="text-white/35 text-[11px] mt-0.5">Point phone at your screen for live AI coaching</p>
        </div>
        {autoOn && (
          <div className="ml-auto flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-500/30 rounded-full px-2.5 py-1">
            <Wifi className="w-3 h-3 text-emerald-400" />
            <span className="text-emerald-400 text-[10px] font-bold">LIVE</span>
          </div>
        )}
      </div>

      {/* Camera viewport */}
      <div
        className="relative rounded-2xl overflow-hidden bg-zinc-950 border border-white/[0.07] mb-3"
        style={{ aspectRatio: '16/9' }}
      >
        <video ref={videoRef} playsInline muted className={`w-full h-full object-cover ${cameraOn ? '' : 'hidden'}`} />
        <canvas ref={canvasRef} className="hidden" />

        {!cameraOn && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <motion.div
              className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center"
              animate={{ boxShadow: ['0 0 0px rgba(225,29,72,0)', '0 0 20px rgba(225,29,72,0.3)', '0 0 0px rgba(225,29,72,0)'] }}
              transition={{ duration: 2.5, repeat: Infinity }}
            >
              <Camera className="w-6 h-6 text-rose-400" />
            </motion.div>
            <div className="text-center">
              <p className="text-white/50 text-sm font-medium">Camera off</p>
              <p className="text-white/25 text-xs mt-0.5">Tap Start Camera below</p>
            </div>
            {err && <p className="text-red-400 text-xs text-center px-6 max-w-[280px]">{err}</p>}
          </div>
        )}

        {/* Analyzing pulse */}
        <AnimatePresence>
          {busy && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute top-2.5 right-2.5 flex items-center gap-1.5 bg-black/70 rounded-full px-2.5 py-1 backdrop-blur-sm"
            >
              <motion.div
                className="w-1.5 h-1.5 rounded-full bg-rose-400"
                animate={{ scale: [1, 1.4, 1] }}
                transition={{ repeat: Infinity, duration: 0.7 }}
              />
              <span className="text-white/70 text-[11px] font-medium">Analyzing</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Latest tip card */}
      <AnimatePresence mode="wait">
        {latest && ps ? (
          <motion.div
            key={latest.timestamp}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`rounded-xl border p-4 mb-3 ${ps.bg} ${ps.border}`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm">{CAT_ICON[latest.category]}</span>
              <span className={`text-[9px] font-black tracking-[0.15em] ${ps.text}`}>{ps.label}</span>
              <span className="ml-auto text-white/25 text-[10px]">
                {new Date(latest.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
            <p className="text-white text-sm font-semibold leading-snug">{latest.tip}</p>
          </motion.div>
        ) : (
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 mb-3 text-center">
            <p className="text-white/25 text-xs">Tips will appear here after analysis</p>
          </div>
        )}
      </AnimatePresence>

      {/* Primary controls */}
      <div className="grid grid-cols-2 gap-2.5 mb-2.5">
        <button
          onClick={cameraOn ? stopCamera : startCamera}
          className={`flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold transition-all active:scale-95 ${
            cameraOn ? 'bg-zinc-800 text-white/55 hover:bg-zinc-700' : 'bg-rose-500 text-white hover:bg-rose-400'
          }`}
        >
          {cameraOn ? <CameraOff className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
          {cameraOn ? 'Stop Camera' : 'Start Camera'}
        </button>

        <button
          onClick={autoOn ? stopAuto : startAuto}
          disabled={!cameraOn}
          className={`flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold transition-all active:scale-95 disabled:opacity-35 disabled:cursor-not-allowed ${
            autoOn ? 'bg-emerald-500/20 border border-emerald-500/35 text-emerald-400' : 'bg-zinc-800 text-white/65 hover:bg-zinc-700'
          }`}
        >
          {autoOn ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          {autoOn ? 'Stop Auto' : 'Auto Coach'}
        </button>
      </div>

      {/* Secondary controls */}
      <div className="grid grid-cols-2 gap-2.5 mb-4">
        <button
          onClick={analyze}
          disabled={!cameraOn || busy}
          className="flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium bg-white/[0.05] border border-white/[0.07] text-white/60 hover:text-white hover:bg-white/[0.08] transition-all active:scale-95 disabled:opacity-35 disabled:cursor-not-allowed"
        >
          <Zap className="w-4 h-4" />
          Analyze Now
        </button>

        <button
          onClick={() => setVoiceOn(v => !v)}
          className={`flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium border transition-all active:scale-95 ${
            voiceOn
              ? 'bg-amber-500/15 border-amber-500/35 text-amber-400'
              : 'bg-white/[0.05] border-white/[0.07] text-white/40 hover:text-white/65'
          }`}
        >
          {voiceOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          Voice {voiceOn ? 'On' : 'Off'}
        </button>
      </div>

      {/* Settings */}
      <div className="grid grid-cols-2 gap-2.5 mb-5">
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.07] p-3">
          <p className="text-white/35 text-[9px] font-bold tracking-[0.12em] uppercase mb-2">Frequency</p>
          <div className="flex gap-1.5">
            {INTERVALS.map(({ label, ms }) => (
              <button
                key={ms}
                onClick={() => setIntervalMs(ms)}
                className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                  interval === ms ? 'bg-rose-500 text-white' : 'bg-white/[0.06] text-white/35 hover:text-white/60'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-white/[0.03] border border-white/[0.07] p-3">
          <p className="text-white/35 text-[9px] font-bold tracking-[0.12em] uppercase mb-2">Your Build</p>
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

      {/* Tip history */}
      {tips.length > 1 && (
        <div className="mb-5">
          <p className="text-white/25 text-[9px] font-bold tracking-[0.12em] uppercase mb-2.5">Recent Tips</p>
          <div className="space-y-2">
            {tips.slice(1, 6).map(t => (
              <div key={t.timestamp} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.025] border border-white/[0.055]">
                <span className="text-sm mt-px shrink-0">{CAT_ICON[t.category]}</span>
                <p className="text-white/45 text-xs leading-snug flex-1">{t.tip}</p>
                <span className={`text-[9px] font-black shrink-0 ${PRIORITY[t.priority].text}`}>{PRIORITY[t.priority].label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* How to use — shown when camera is off */}
      {!cameraOn && (
        <div className="rounded-xl bg-white/[0.02] border border-white/[0.055] p-4">
          <p className="text-white/30 text-[9px] font-bold tracking-[0.12em] uppercase mb-3">Setup</p>
          <div className="space-y-2.5">
            {[
              'Open CourtIQ on your phone in a browser',
              'Tap "Start Camera" and allow access',
              'Point your rear camera at your TV or monitor',
              'Tap "Auto Coach" for continuous live tips',
              'Turn on Voice to hear tips without looking away',
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-rose-500/15 text-rose-400 text-[10px] font-black flex items-center justify-center shrink-0">{i + 1}</span>
                <span className="text-white/35 text-xs">{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
