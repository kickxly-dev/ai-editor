'use client'
import { useRef, useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Camera, CameraOff, Mic, MicOff, Send, Volume2, VolumeX,
  ChevronDown, Eye, Smartphone, Monitor, ArrowRight,
  Sparkles, X, Maximize2, Minimize2,
} from 'lucide-react'

interface ChatMsg {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

const BUILD_OPTS = [
  '', 'Shot Creator Guard', 'Two-Way Guard', 'Playmaking Wing',
  'Stretch Big', 'Glass Cleaner', 'Pure Lock', 'Slashing SF',
]

const QUICK_PROMPTS = [
  'What should I do here?',
  'What build is my opponent?',
  'Who should I be guarding?',
  'Best play call right now?',
  'Am I winning this matchup?',
]

// Pick a MediaRecorder mime type the device supports — iOS prefers mp4, others webm
function pickMime(): string {
  if (typeof MediaRecorder === 'undefined') return ''
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/ogg']
  for (const m of candidates) {
    try { if (MediaRecorder.isTypeSupported(m)) return m } catch { /* */ }
  }
  return ''
}

export default function VisionPage() {
  const videoRef       = useRef<HTMLVideoElement>(null)
  const canvasRef      = useRef<HTMLCanvasElement>(null)
  const streamRef      = useRef<MediaStream | null>(null)
  const micStreamRef   = useRef<MediaStream | null>(null)
  const audioCtxRef    = useRef<AudioContext | null>(null)
  const analyserRef    = useRef<AnalyserNode | null>(null)
  const rafRef         = useRef<number | null>(null)
  const recorderRef    = useRef<MediaRecorder | null>(null)
  const chunksRef      = useRef<Blob[]>([])
  const speakingRef    = useRef(false)
  const speechUnlocked = useRef(false)
  const speakQueue     = useRef<string | null>(null)
  const scrollRef      = useRef<HTMLDivElement>(null)

  const [cameraOn,   setCameraOn]   = useState(false)
  const [voiceOn,    setVoiceOn]    = useState(false)
  const [listening,  setListening]  = useState(false) // hands-free mic on
  const [recording,  setRecording]  = useState(false) // VAD detected speech, capturing now
  const [autoWatch,  setAutoWatch]  = useState(false) // proactive coach watches & speaks unprompted
  const [thinking,   setThinking]   = useState(false)
  const [build,      setBuild]      = useState('')
  const [input,      setInput]      = useState('')
  const [messages,   setMessages]   = useState<ChatMsg[]>([])
  const [err,        setErr]        = useState<string | null>(null)
  const [ready,      setReady]      = useState(false)
  const [fullscreen, setFullscreen] = useState(false)

  // ── Camera control ────────────────────────────────────────────────────────────
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
      setErr('Camera access denied — allow camera in your browser settings.')
      setReady(true)
    }
  }

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setCameraOn(false)
    stopListening()
  }, [])

  // ── Hands-free voice via VAD with continuous recorder + pre-roll buffer ────
  // MediaRecorder runs continuously when listening (no spin-up latency).
  // VAD watches RMS, slices the rolling buffer when speech starts/ends.
  const VAD_THRESHOLD     = 0.014    // lower = more sensitive
  const SPEECH_MIN_MS     = 80       // shorter = catches short utterances
  const SILENCE_MS        = 850      // longer = doesn't cut you off mid-thought
  const TIMESLICE_MS      = 250      // recorder chunks every 250ms
  const PREROLL_CHUNKS    = 2        // include ~500ms before speech started

  const startListening = async () => {
    setErr(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      })
      micStreamRef.current = stream

      const Ctx: typeof AudioContext = (window.AudioContext || (window as any).webkitAudioContext)
      const ctx = new Ctx()
      const src = ctx.createMediaStreamSource(stream)
      const an  = ctx.createAnalyser()
      an.fftSize = 1024
      src.connect(an)
      audioCtxRef.current = ctx
      analyserRef.current = an

      // Continuous recorder — runs the entire time mic is on
      const mime = pickMime()
      const rec  = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream)
      const rolling: Blob[] = []
      const MAX_BUFFER = 60 // ~15s of rolling audio
      let captureStartIdx = -1

      rec.ondataavailable = (e: BlobEvent) => {
        if (!e.data || !e.data.size) return
        rolling.push(e.data)
        if (rolling.length > MAX_BUFFER) {
          rolling.shift()
          if (captureStartIdx > 0) captureStartIdx--
          else if (captureStartIdx === 0) captureStartIdx = 0
        }
      }
      rec.start(TIMESLICE_MS)
      recorderRef.current = rec

      const buf = new Uint8Array(an.fftSize)
      let capturing: boolean = false
      let speechStart: number | null  = null
      let silenceStart: number | null = null

      const loop = () => {
        if (!analyserRef.current) return
        an.getByteTimeDomainData(buf)
        let sum = 0
        for (let i = 0; i < buf.length; i++) { const v = (buf[i] - 128) / 128; sum += v * v }
        const rms = Math.sqrt(sum / buf.length)
        const now = performance.now()

        // Barge-in: if user starts talking while TTS is reading, cancel TTS and listen
        if (speakingRef.current) {
          // Slightly higher threshold here so the AI's own voice (leaking past echo
          // cancellation) doesn't trigger barge-in. Real human speech easily clears it.
          if (rms > VAD_THRESHOLD * 1.8) {
            try { window.speechSynthesis.cancel() } catch { /* */ }
            speakingRef.current = false
            // fall through to normal VAD handling this frame
          } else {
            speechStart = null
            silenceStart = null
            rafRef.current = requestAnimationFrame(loop)
            return
          }
        }

        const isSpeech = rms > VAD_THRESHOLD

        if (!capturing) {
          if (isSpeech) {
            if (speechStart === null) speechStart = now
            if (now - speechStart > SPEECH_MIN_MS) {
              // Start capture with pre-roll — include last few chunks of audio
              captureStartIdx = Math.max(0, rolling.length - PREROLL_CHUNKS)
              capturing = true
              setRecording(true)
            }
          } else {
            speechStart = null
          }
        } else {
          if (isSpeech) {
            silenceStart = null
          } else {
            if (silenceStart === null) silenceStart = now
            if (now - silenceStart > SILENCE_MS) {
              // Slice the rolling buffer from captureStartIdx → end, send to Whisper
              const slice = rolling.slice(captureStartIdx)
              capturing = false
              captureStartIdx = -1
              speechStart = null
              silenceStart = null
              setRecording(false)
              if (slice.length > 0) {
                const blob = new Blob(slice, { type: rec.mimeType || 'audio/webm' })
                if (blob.size > 400) transcribeAndSend(blob)
              }
            }
          }
        }

        rafRef.current = requestAnimationFrame(loop)
      }

      rafRef.current = requestAnimationFrame(loop)
      setListening(true)
    } catch {
      setErr('Mic access denied — allow microphone in browser settings.')
      setListening(false)
    }
  }

  const stopListening = () => {
    setListening(false)
    setRecording(false)
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null }
    analyserRef.current = null
    const rec = recorderRef.current
    recorderRef.current = null
    if (rec && rec.state !== 'inactive') {
      try { rec.ondataavailable = null as any; rec.stop() } catch { /* */ }
    }
    audioCtxRef.current?.close().catch(() => {})
    audioCtxRef.current = null
    micStreamRef.current?.getTracks().forEach(t => t.stop())
    micStreamRef.current = null
  }

  const transcribeAndSend = async (blob: Blob) => {
    try {
      const ext  = (blob.type.split('/')[1] || 'webm').split(';')[0]
      const file = new File([blob], `clip.${ext}`, { type: blob.type })
      const form = new FormData()
      form.append('audio', file)
      const res  = await fetch('/api/vision/transcribe', { method: 'POST', body: form })
      const data = await res.json()
      const text: string = (data.text || '').trim()
      if (text && text.length > 1) await sendQuestion(text)
    } catch { /* silent — VAD will pick up next utterance */ }
  }

  // ── Voice output ──────────────────────────────────────────────────────────────
  const toggleVoice = () => {
    const next = !voiceOn
    setVoiceOn(next)
    if (next && 'speechSynthesis' in window) {
      const unlock = new SpeechSynthesisUtterance(' ')
      unlock.volume = 0
      window.speechSynthesis.cancel()
      window.speechSynthesis.speak(unlock)
      speechUnlocked.current = true
    }
  }

  // Drain speak queue when assistant replies — flag speakingRef so VAD ignores TTS
  useEffect(() => {
    const text = speakQueue.current
    if (!text || !voiceOn || !speechUnlocked.current) return
    speakQueue.current = null
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.rate = 1.1
    u.volume = 1
    speakingRef.current = true
    u.onend   = () => { speakingRef.current = false }
    u.onerror = () => { speakingRef.current = false }
    window.speechSynthesis.speak(u)
  }, [messages, voiceOn])

  // Auto-scroll chat
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, thinking])

  // ── Proactive watch loop: AI watches every ~3s, only speaks if it matters ────
  useEffect(() => {
    if (!autoWatch || !cameraOn) return
    let cancelled = false
    let busy = false

    const tick = async () => {
      if (cancelled || busy || thinking || recording) return
      const video  = videoRef.current
      const canvas = canvasRef.current
      if (!video || !canvas) return
      busy = true
      try {
        canvas.width  = video.videoWidth  || 640
        canvas.height = video.videoHeight || 360
        canvas.getContext('2d')?.drawImage(video, 0, 0)
        const image = canvas.toDataURL('image/jpeg', 0.85)
        const recentTips = messages.filter(m => m.role === 'assistant').slice(-4).map(m => m.content)
        const res  = await fetch('/api/vision', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode: 'watch', image, buildContext: build || undefined, recentTips }),
        })
        const data = await res.json()
        if (!cancelled && !data.skip && data.tip) {
          const aiMsg: ChatMsg = { role: 'assistant', content: data.tip, timestamp: Date.now() }
          setMessages(prev => [...prev, aiMsg])
          if (voiceOn) speakQueue.current = data.tip
        }
      } catch { /* silent */ }
      finally { busy = false }
    }

    const id = setInterval(tick, 1000)
    tick()
    return () => { cancelled = true; clearInterval(id) }
  }, [autoWatch, cameraOn, build, voiceOn, thinking, recording, messages])

  useEffect(() => () => { stopCamera() }, [stopCamera])

  // ── Send question to AI ──────────────────────────────────────────────────────
  const sendQuestion = useCallback(async (question: string) => {
    const q = question.trim()
    if (!q || thinking) return

    const video  = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || !cameraOn) {
      setErr('Start the camera first so I can see what you see.')
      return
    }

    canvas.width  = video.videoWidth  || 640
    canvas.height = video.videoHeight || 360
    canvas.getContext('2d')?.drawImage(video, 0, 0)
    const image = canvas.toDataURL('image/jpeg', 0.92)

    const userMsg: ChatMsg = { role: 'user', content: q, timestamp: Date.now() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setThinking(true)
    setErr(null)

    try {
      const history = messages.slice(-6).map(m => ({ role: m.role, content: m.content }))
      const res = await fetch('/api/vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'chat', image, question: q, history, buildContext: build || undefined }),
      })
      const data = await res.json()
      const answer = data.answer || data.error || "I couldn't read the screen — try again."
      const aiMsg: ChatMsg = { role: 'assistant', content: answer, timestamp: Date.now() }
      setMessages(prev => [...prev, aiMsg])
      if (voiceOn) speakQueue.current = answer
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection error — try again.', timestamp: Date.now() }])
    } finally {
      setThinking(false)
    }
  }, [thinking, cameraOn, messages, build, voiceOn])

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim()) sendQuestion(input)
  }

  // ── Setup screen (first visit) ────────────────────────────────────────────────
  if (!ready) {
    return (
      <div className="flex flex-col min-h-[calc(100vh-48px)] px-5 pb-8">
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
            Talk to Your AI Coach
          </h2>
          <p className="text-white/40 text-sm leading-relaxed max-w-[280px]">
            Point your phone at the TV. Ask anything mid-game —<br />
            CourtIQ sees your screen and answers live.
          </p>
        </div>

        <div className="space-y-2.5 mb-8">
          {[
            { icon: <Smartphone className="w-4 h-4 text-rose-400" />, title: 'Open on your phone', desc: "You're already here ✓", accent: 'rgba(225,29,72,0.12)' },
            { icon: <Monitor className="w-4 h-4 text-sky-400" />, title: 'Point rear camera at TV', desc: 'Prop it on something stable', accent: 'rgba(14,165,233,0.10)' },
            { icon: <Mic className="w-4 h-4 text-emerald-400" />, title: 'Tap mic and ask anything', desc: '"What should I do here?" "What build is this guy?"', accent: 'rgba(52,211,153,0.10)' },
            { icon: <Volume2 className="w-4 h-4 text-amber-400" />, title: 'Turn on Voice', desc: 'Hear the answer so you keep your eyes on the game', accent: 'rgba(245,158,11,0.10)' },
          ].map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.07 }}
              className="flex items-center gap-4 p-4 rounded-2xl"
              style={{ background: s.accent, border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(255,255,255,0.06)' }}>
                {s.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold leading-tight">{s.title}</p>
                <p className="text-white/35 text-xs mt-0.5 leading-snug">{s.desc}</p>
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

  // ── Main conversational UI ────────────────────────────────────────────────────
  return (
    <div className={`flex flex-col ${fullscreen ? 'h-[calc(100vh-48px)] overflow-hidden' : 'min-h-[calc(100vh-48px)]'}`}>

      {/* Camera viewport */}
      <div
        className={`relative bg-black overflow-hidden flex-shrink-0 ${fullscreen ? 'flex-1' : ''}`}
        style={{ aspectRatio: fullscreen ? undefined : '16/9' }}
      >
        <video ref={videoRef} playsInline muted className={`w-full h-full object-cover ${cameraOn ? '' : 'hidden'}`} />
        <canvas ref={canvasRef} className="hidden" />

        {!cameraOn && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3" style={{ background: 'rgba(6,6,10,0.97)' }}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(225,29,72,0.08)', border: '1px solid rgba(225,29,72,0.2)' }}>
              <Camera className="w-7 h-7 text-rose-400" />
            </div>
            <p className="text-white/40 text-sm font-medium">Camera off</p>
            {err && (
              <div className="mx-6 px-4 py-3 rounded-xl text-center" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
                <p className="text-red-400 text-xs leading-snug">{err}</p>
              </div>
            )}
          </div>
        )}

        {/* Top-right controls */}
        <div className="absolute top-3 right-3 flex items-center gap-2">
          {thinking && (
            <div className="flex items-center gap-1.5 rounded-full px-2.5 py-1 backdrop-blur-sm"
              style={{ background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <motion.div className="w-1.5 h-1.5 rounded-full bg-rose-400"
                animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 0.7 }} />
              <span className="text-white/70 text-[10px] font-medium">Reading</span>
            </div>
          )}
          {cameraOn && (
            <button onClick={() => setFullscreen(f => !f)}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white/40 hover:text-white active:scale-90 transition-all backdrop-blur-sm"
              style={{ background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.08)' }}>
              {fullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* Conversation thread */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 pt-4 pb-2 space-y-3">
        {messages.length === 0 && cameraOn && (
          <div className="text-center pt-4">
            <p className="text-white/30 text-xs mb-3 font-medium">Ask anything — I see your screen</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {QUICK_PROMPTS.map(p => (
                <button
                  key={p}
                  onClick={() => sendQuestion(p)}
                  className="px-3 py-1.5 rounded-full text-[11px] text-white/55 hover:text-white hover:bg-white/[0.06] transition-all active:scale-95"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map(m => (
            <motion.div
              key={m.timestamp}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-[13px] leading-snug ${
                  m.role === 'user'
                    ? 'bg-rose-500 text-white rounded-br-sm'
                    : 'text-white/85 rounded-bl-sm'
                }`}
                style={m.role === 'assistant'
                  ? { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }
                  : {}}
              >
                {m.role === 'assistant' && (
                  <div className="flex items-center gap-1.5 mb-1">
                    <Sparkles className="w-2.5 h-2.5 text-rose-400" />
                    <span className="text-[9px] font-bold tracking-wider text-rose-400">COURTIQ</span>
                  </div>
                )}
                {m.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {thinking && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="px-4 py-3 rounded-2xl rounded-bl-sm"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center gap-1.5">
                {[0, 0.15, 0.3].map((d, i) => (
                  <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-rose-400"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ repeat: Infinity, duration: 0.9, delay: d }} />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Input bar */}
      <div className="flex-shrink-0 px-3 pt-2 pb-4 space-y-2"
        style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(6,6,10,0.85)' }}>

        {/* Top mini-controls row */}
        <div className="flex items-center gap-2 px-1">
          <button
            onClick={cameraOn ? stopCamera : startCamera}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all active:scale-95 ${
              cameraOn ? 'text-white/40 hover:text-white/65' : 'text-rose-400'
            }`}
            style={{ background: cameraOn ? 'rgba(255,255,255,0.05)' : 'rgba(225,29,72,0.12)', border: `1px solid ${cameraOn ? 'rgba(255,255,255,0.08)' : 'rgba(225,29,72,0.3)'}` }}
          >
            {cameraOn ? <CameraOff className="w-3 h-3" /> : <Camera className="w-3 h-3" />}
            {cameraOn ? 'CAM ON' : 'START CAM'}
          </button>

          <button
            onClick={toggleVoice}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all active:scale-95 ${
              voiceOn ? 'text-amber-400' : 'text-white/40 hover:text-white/65'
            }`}
            style={{ background: voiceOn ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.05)', border: `1px solid ${voiceOn ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.08)'}` }}
          >
            {voiceOn ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
            VOICE {voiceOn ? 'ON' : 'OFF'}
          </button>

          <button
            onClick={() => setAutoWatch(a => !a)}
            disabled={!cameraOn}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed ${
              autoWatch ? 'text-emerald-400' : 'text-white/40 hover:text-white/65'
            }`}
            style={{ background: autoWatch ? 'rgba(52,211,153,0.1)' : 'rgba(255,255,255,0.05)', border: `1px solid ${autoWatch ? 'rgba(52,211,153,0.3)' : 'rgba(255,255,255,0.08)'}` }}
            title="AI watches the screen and speaks up when it sees something important"
          >
            <Sparkles className="w-3 h-3" />
            AUTO {autoWatch ? 'ON' : 'OFF'}
          </button>

          <div className="ml-auto relative flex items-center">
            <select
              value={build}
              onChange={e => setBuild(e.target.value)}
              className="bg-transparent text-white/45 text-[10px] font-bold focus:outline-none cursor-pointer appearance-none pr-3 max-w-[120px] truncate"
            >
              <option value="" className="bg-zinc-900">ANY BUILD</option>
              {BUILD_OPTS.filter(Boolean).map(b => (
                <option key={b} value={b} className="bg-zinc-900">{b.toUpperCase()}</option>
              ))}
            </select>
            <ChevronDown className="w-2.5 h-2.5 text-white/25 absolute right-0 pointer-events-none" />
          </div>

          {messages.length > 0 && (
            <button
              onClick={() => setMessages([])}
              className="w-6 h-6 rounded-md flex items-center justify-center text-white/30 hover:text-white/60 active:scale-90 transition-all"
              style={{ background: 'rgba(255,255,255,0.04)' }}
              title="Clear conversation"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Input row */}
        <form onSubmit={onSubmit} className="flex items-center gap-2">
          <button
            type="button"
            onClick={listening ? stopListening : startListening}
            disabled={!cameraOn}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed relative ${
              recording ? 'bg-rose-500 text-white' :
              listening ? 'text-emerald-400'      :
                          'text-white/55 hover:text-white'
            }`}
            style={recording ? {} : listening
              ? { background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.35)' }
              : { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
            title={listening ? (recording ? 'Recording your question…' : 'Listening — just talk') : 'Tap to enable hands-free mic'}
          >
            {recording ? (
              <motion.div animate={{ scale: [1, 1.18, 1] }} transition={{ repeat: Infinity, duration: 0.6 }}>
                <Mic className="w-5 h-5" />
              </motion.div>
            ) : listening ? (
              <>
                <Mic className="w-5 h-5" />
                <motion.span
                  className="absolute inset-0 rounded-2xl"
                  style={{ border: '1.5px solid rgba(52,211,153,0.5)' }}
                  animate={{ opacity: [0.2, 0.9, 0.2], scale: [1, 1.06, 1] }}
                  transition={{ repeat: Infinity, duration: 1.4 }}
                />
              </>
            ) : (
              <MicOff className="w-5 h-5" />
            )}
          </button>

          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={listening ? 'Listening…' : 'Ask anything…'}
            disabled={thinking || listening}
            className="flex-1 h-12 px-4 rounded-2xl text-sm text-white placeholder-white/30 focus:outline-none focus:border-rose-500/40 transition-colors disabled:opacity-50"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
          />

          <button
            type="submit"
            disabled={!input.trim() || thinking || !cameraOn}
            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 bg-rose-500 text-white hover:bg-rose-400 active:scale-95 disabled:opacity-30 disabled:bg-white/[0.05] disabled:text-white/30 disabled:cursor-not-allowed transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  )
}
