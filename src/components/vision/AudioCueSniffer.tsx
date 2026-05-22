'use client'
import { useRef, useState, useCallback, useEffect } from 'react'
import gameData from '@/data/gameData.json'

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase = 'idle' | 'noise-capture' | 'click-capture' | 'ready' | 'listening'

// ─── Constants ────────────────────────────────────────────────────────────────

const FFT_SIZE = 512          // 11.6ms window at 44.1kHz — low-latency
const CALIBRATION_MS = 1500   // ambient noise capture duration
const CLICK_CAPTURE_MS = 3000 // window to press the controller button

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getAudioContext(): AudioContext {
  const Ctx = (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)
  return new Ctx()
}

function getBandEnergy(data: Uint8Array<ArrayBuffer>, sampleRate: number, binCount: number, lo: number, hi: number): number {
  const lowBin  = Math.max(0,         Math.floor(lo / (sampleRate / 2) * binCount))
  const highBin = Math.min(binCount - 1, Math.ceil(hi / (sampleRate / 2) * binCount))
  let sum = 0
  for (let i = lowBin; i <= highBin; i++) sum += data[i]
  return sum / (highBin - lowBin + 1)
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AudioCueSniffer() {
  const [phase, setPhase]         = useState<Phase>('idle')
  const [statusLine, setStatus]   = useState('Tap calibrate to begin.')
  const [countdown, setCountdown] = useState<number | null>(null)

  // Audio pipeline refs — never cause re-renders
  const ctxRef      = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const dataRef     = useRef<Uint8Array<ArrayBuffer> | null>(null)
  const streamRef   = useRef<MediaStream | null>(null)
  const rafRef      = useRef<number>(0)

  // Calibration state refs
  const baselineRef  = useRef(0)   // ambient energy average
  const thresholdRef = useRef(0)   // baseline + spike headroom
  const lastSpikeRef = useRef(0)   // timestamp of last detection (cooldown)

  // Flash DOM ref — mutated directly, zero React overhead in hot path
  const flashRef    = useRef<HTMLDivElement>(null)
  const ctdwnRef    = useRef<HTMLDivElement>(null) // countdown tick display

  // ── Cleanup ────────────────────────────────────────────────────────────────

  const teardown = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
    ctxRef.current?.close()
    ctxRef.current = null
    analyserRef.current = null
    dataRef.current = null
    streamRef.current = null
  }, [])

  useEffect(() => () => teardown(), [teardown])

  // ── Microphone setup ───────────────────────────────────────────────────────

  const initMic = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      })
      streamRef.current = stream

      const ctx = getAudioContext()
      // Safari requires resume on user-gesture context
      if (ctx.state === 'suspended') await ctx.resume()
      ctxRef.current = ctx

      const analyser = ctx.createAnalyser()
      analyser.fftSize = FFT_SIZE
      analyser.smoothingTimeConstant = 0.2  // low smoothing = faster transient detection

      ctx.createMediaStreamSource(stream).connect(analyser)
      analyserRef.current = analyser
      dataRef.current = new Uint8Array(analyser.frequencyBinCount)
      return true
    } catch {
      setStatus('Mic access denied.')
      setPhase('idle')
      return false
    }
  }, [])

  // ── Calibration — phase 1: capture ambient noise ──────────────────────────

  const captureNoise = useCallback(async () => {
    setPhase('noise-capture')
    setStatus('Hold still — capturing ambient noise...')

    const ok = await initMic()
    if (!ok) return

    const samples: number[] = []
    const start = performance.now()

    const collect = () => {
      if (!analyserRef.current || !dataRef.current) return
      if (performance.now() - start > CALIBRATION_MS) {
        // Done — compute baseline
        baselineRef.current = samples.reduce((a, b) => a + b, 0) / samples.length
        captureClick()
        return
      }
      analyserRef.current.getByteFrequencyData(dataRef.current)
      samples.push(getBandEnergy(
        dataRef.current,
        ctxRef.current!.sampleRate,
        analyserRef.current.frequencyBinCount,
        gameData.frequencyBandLow,
        gameData.frequencyBandHigh,
      ))
      rafRef.current = requestAnimationFrame(collect)
    }
    rafRef.current = requestAnimationFrame(collect)
  }, [initMic]) // captureClick defined below with useCallback — forward ref pattern

  // ── Calibration — phase 2: capture controller click ───────────────────────

  const captureClick = useCallback(() => {
    setPhase('click-capture')
    setStatus('Press your controller button now...')

    let maxEnergy = 0
    const start = performance.now()

    const detect = () => {
      if (!analyserRef.current || !dataRef.current) return

      const elapsed = performance.now() - start
      const remaining = Math.ceil((CLICK_CAPTURE_MS - elapsed) / 1000)

      if (ctdwnRef.current) ctdwnRef.current.textContent = String(remaining > 0 ? remaining : '')

      if (elapsed > CLICK_CAPTURE_MS) {
        cancelAnimationFrame(rafRef.current)
        // Set threshold: max spike energy minus baseline, floored at spikeThreshold
        const headroom = Math.max(maxEnergy - baselineRef.current, gameData.spikeThreshold)
        thresholdRef.current = baselineRef.current + headroom * 0.65
        teardown()
        setPhase('ready')
        setStatus(`Calibrated. Threshold: ${thresholdRef.current.toFixed(1)} dB`)
        setCountdown(null)
        return
      }

      analyserRef.current.getByteFrequencyData(dataRef.current)
      const e = getBandEnergy(
        dataRef.current,
        ctxRef.current!.sampleRate,
        analyserRef.current.frequencyBinCount,
        gameData.frequencyBandLow,
        gameData.frequencyBandHigh,
      )
      if (e > maxEnergy) maxEnergy = e

      rafRef.current = requestAnimationFrame(detect)
    }
    rafRef.current = requestAnimationFrame(detect)
  }, [teardown])

  // Wire captureNoise → captureClick via stable ref
  const captureClickRef = useRef(captureClick)
  useEffect(() => { captureClickRef.current = captureClick }, [captureClick])

  // ── Flash — direct DOM, no React render in hot path ───────────────────────

  const triggerFlash = useCallback(() => {
    const el = flashRef.current
    if (!el) return
    // Force GPU layer, set opacity synchronously before rAF
    el.style.opacity = '1'
    requestAnimationFrame(() => {
      setTimeout(() => {
        if (flashRef.current) flashRef.current.style.opacity = '0'
      }, gameData.flashDurationMs)
    })
  }, [])

  // ── Detection loop — zero React state in hot path ─────────────────────────

  const startListening = useCallback(async () => {
    setPhase('listening')
    setStatus('Listening for button click...')

    const ok = await initMic()
    if (!ok) return

    const loop = () => {
      if (!analyserRef.current || !dataRef.current) return
      analyserRef.current.getByteFrequencyData(dataRef.current)

      const energy = getBandEnergy(
        dataRef.current,
        ctxRef.current!.sampleRate,
        analyserRef.current.frequencyBinCount,
        gameData.frequencyBandLow,
        gameData.frequencyBandHigh,
      )

      const now = performance.now()
      if (energy > thresholdRef.current && now - lastSpikeRef.current > gameData.cooldownMs) {
        lastSpikeRef.current = now
        // Schedule flash — pure setTimeout, no React
        setTimeout(triggerFlash, gameData.buttonResponseMs)
      }

      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
  }, [initMic, triggerFlash])

  const stopListening = useCallback(() => {
    teardown()
    setPhase('ready')
    setStatus('Stopped. Tap Activate to resume.')
  }, [teardown])

  const reset = useCallback(() => {
    teardown()
    baselineRef.current = 0
    thresholdRef.current = 0
    setPhase('idle')
    setStatus('Tap calibrate to begin.')
    setCountdown(null)
  }, [teardown])

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/*
        Flash overlay — rendered outside React update cycle.
        GPU-composited via will-change + translateZ. opacity toggled via ref.
        transition: none on Safari avoids Blink/WebKit repaint overhead.
      */}
      <div
        ref={flashRef}
        aria-hidden
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: '#FFFFFF',
          opacity: 0,
          pointerEvents: 'none',
          willChange: 'opacity',
          transform: 'translateZ(0)',
          WebkitTransform: 'translateZ(0)',
          transition: `opacity ${gameData.flashDurationMs}ms linear`,
          WebkitTransition: `opacity ${gameData.flashDurationMs}ms linear`,
        }}
      />

      <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 select-none">
        <div className="w-full max-w-sm space-y-10">

          {/* Status */}
          <div className="text-center space-y-1">
            <p className="font-mono text-[9px] tracking-[0.4em] uppercase text-rose-400">AUDIO CUE SNIFFER</p>
            <p className="font-mono text-xs text-white/35">{statusLine}</p>
          </div>

          {/* Phase indicator */}
          <div className="flex items-center justify-center gap-3">
            {(['noise-capture', 'click-capture', 'ready', 'listening'] as Phase[]).map((p, i) => {
              const done  = ['noise-capture', 'click-capture', 'ready', 'listening'].indexOf(phase) > i
              const active = phase === p
              return (
                <div key={p} className="flex items-center gap-3">
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className="w-2 h-2 rounded-full transition-all duration-300"
                      style={{
                        background: active ? '#FF2D55' : done ? '#34D399' : 'rgba(255,255,255,0.1)',
                        boxShadow: active ? '0 0 8px rgba(255,45,85,0.7)' : 'none',
                      }}
                    />
                  </div>
                  {i < 3 && <div className="w-6 h-px" style={{ background: done ? 'rgba(52,211,153,0.4)' : 'rgba(255,255,255,0.07)' }} />}
                </div>
              )
            })}
          </div>

          {/* Click-capture countdown */}
          {phase === 'click-capture' && (
            <div className="text-center">
              <span ref={ctdwnRef}
                className="font-mono text-5xl font-black text-white/20 tabular-nums" />
            </div>
          )}

          {/* Controls */}
          <div className="space-y-3">
            {phase === 'idle' && (
              <Btn onClick={captureNoise} label="CALIBRATE" />
            )}
            {phase === 'ready' && (
              <>
                <Btn onClick={startListening} label="ACTIVATE" accent />
                <Btn onClick={captureNoise}   label="RECALIBRATE" dim />
              </>
            )}
            {phase === 'listening' && (
              <Btn onClick={stopListening} label="STOP" />
            )}
            {(phase === 'noise-capture' || phase === 'click-capture') && (
              <Btn onClick={reset} label="CANCEL" dim />
            )}
          </div>

          {/* Live countdown display — written by timeout, not state */}
          {countdown !== null && (
            <div className="text-center font-mono text-3xl font-black tabular-nums"
              style={{ color: '#FF2D55' }}>
              {countdown}ms
            </div>
          )}

          {/* Config read-out */}
          <div className="font-mono text-[9px] text-white/15 space-y-1 text-center">
            <p>WINDOW {gameData.buttonResponseMs}ms · FLASH {gameData.flashDurationMs}ms</p>
            <p>BAND {gameData.frequencyBandLow}–{gameData.frequencyBandHigh}Hz · FFT {FFT_SIZE}</p>
            {thresholdRef.current > 0 && (
              <p className="text-white/25">THRESHOLD {thresholdRef.current.toFixed(1)}</p>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

// ─── Minimal button ───────────────────────────────────────────────────────────

function Btn({ onClick, label, accent, dim }: { onClick: () => void; label: string; accent?: boolean; dim?: boolean }) {
  return (
    <button
      onClick={onClick}
      className="w-full py-3.5 rounded-xl font-mono font-black text-sm tracking-[0.25em] uppercase transition-all active:scale-[0.98]"
      style={{
        background: accent ? 'rgba(255,45,85,0.12)' : dim ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)',
        border: `1px solid ${accent ? 'rgba(255,45,85,0.4)' : 'rgba(255,255,255,0.08)'}`,
        color: accent ? '#FF2D55' : dim ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.6)',
      }}
    >
      {label}
    </button>
  )
}
