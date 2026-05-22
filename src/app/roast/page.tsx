'use client'
import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Flame, Download, Share2, Loader2, Sparkles, RefreshCw } from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'

const POSITIONS = ['PG', 'SG', 'SF', 'PF', 'C']
const BADGES = [
  'Deadeye', 'Set Shot Specialist', 'Shifty Shooter', 'Limitless Range', 'Mini Marksman',
  'Lightning Launch', 'Posterizer', 'Rise Up', 'Aerial Wizard', 'Float Game',
  'Dimer', 'Handles for Days', 'Strong Handle', 'Break Starter', 'Versatile Visionary',
  'Pogo Stick', 'Rebound Chaser', 'Interceptor', 'Challenger', 'On-Ball Menace',
  'Paint Patroller', 'Boxout Beast', 'Brick Wall', 'Immovable Enforcer',
]

interface RoastResult {
  roast: string
  nickname: string
  verdict: string
  rating: string
  fire_level: number
}

export default function RoastPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [position, setPosition] = useState('PG')
  const [height, setHeight] = useState("6'4\"")
  const [threePoint, setThreePoint] = useState(65)
  const [ballHandle, setBallHandle] = useState(85)
  const [defense, setDefense] = useState(40)
  const [drivingDunk, setDrivingDunk] = useState(55)
  const [selectedBadges, setSelectedBadges] = useState<string[]>(['Deadeye'])
  const [buildName, setBuildName] = useState('')
  const [roast, setRoast] = useState<RoastResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [cardGenerated, setCardGenerated] = useState(false)

  const toggleBadge = (b: string) => {
    setSelectedBadges((prev) =>
      prev.includes(b) ? prev.filter((x) => x !== b) : prev.length < 6 ? [...prev, b] : prev
    )
  }

  const getRoast = async () => {
    setLoading(true)
    setError('')
    setCardGenerated(false)
    try {
      const res = await fetch('/api/roast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          position,
          height,
          buildName: buildName || `${position} Build`,
          attributes: {
            three_point: threePoint,
            ball_handle: ballHandle,
            perimeter_defense: defense,
            driving_dunk: drivingDunk,
          },
          badges: selectedBadges,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to roast.')
        return
      }
      setRoast(data)
      setTimeout(() => generateCard(data), 100)
    } finally {
      setLoading(false)
    }
  }

  const generateCard = useCallback((r: RoastResult) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = 800
    const H = 420
    canvas.width = W
    canvas.height = H

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, W, H)
    grad.addColorStop(0, '#0C0C10')
    grad.addColorStop(0.5, '#14101E')
    grad.addColorStop(1, '#0F0A14')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W, H)

    // Accent glow
    const glow = ctx.createRadialGradient(W * 0.15, H * 0.5, 0, W * 0.15, H * 0.5, 220)
    glow.addColorStop(0, 'rgba(225,29,72,0.18)')
    glow.addColorStop(1, 'rgba(225,29,72,0)')
    ctx.fillStyle = glow
    ctx.fillRect(0, 0, W, H)

    // Border
    ctx.strokeStyle = 'rgba(225,29,72,0.35)'
    ctx.lineWidth = 1.5
    roundRect(ctx, 1, 1, W - 2, H - 2, 16)
    ctx.stroke()

    // Logo area
    const logoGrad = ctx.createLinearGradient(32, 32, 64, 64)
    logoGrad.addColorStop(0, '#E11D48')
    logoGrad.addColorStop(1, '#7C3AED')
    ctx.fillStyle = logoGrad
    roundRect(ctx, 32, 32, 36, 36, 9)
    ctx.fill()

    // CourtIQ text
    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 13px system-ui, sans-serif'
    ctx.fillText('CourtIQ', 78, 49)
    ctx.fillStyle = 'rgba(255,255,255,0.4)'
    ctx.font = '11px system-ui, sans-serif'
    ctx.fillText('Build Roast Card', 78, 62)

    // Fire level flames
    const flames = '🔥'.repeat(Math.min(r.fire_level, 5))
    ctx.font = '20px system-ui'
    ctx.fillText(flames, W - 160, 54)

    // Nickname
    ctx.fillStyle = '#FB7185'
    ctx.font = 'bold 13px system-ui, sans-serif'
    ctx.fillText('NICKNAME', 32, 108)
    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 32px system-ui, sans-serif'
    ctx.fillText(`"${r.nickname}"`, 32, 142)

    // Divider
    ctx.strokeStyle = 'rgba(255,255,255,0.08)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(32, 158)
    ctx.lineTo(W - 32, 158)
    ctx.stroke()

    // Roast text (wrapped)
    ctx.fillStyle = 'rgba(255,255,255,0.85)'
    ctx.font = '15px system-ui, sans-serif'
    const roastLines = wrapText(ctx, r.roast, W - 64, 22)
    roastLines.slice(0, 4).forEach((line, i) => {
      ctx.fillText(line, 32, 184 + i * 26)
    })

    // Verdict chip
    const verdictY = 310
    ctx.fillStyle = 'rgba(225,29,72,0.15)'
    roundRect(ctx, 32, verdictY - 18, 140, 28, 8)
    ctx.fill()
    ctx.strokeStyle = 'rgba(225,29,72,0.4)'
    ctx.lineWidth = 1
    ctx.stroke()
    ctx.fillStyle = '#FB7185'
    ctx.font = 'bold 12px system-ui, sans-serif'
    ctx.fillText('VERDICT', 44, verdictY - 2)
    ctx.fillStyle = 'rgba(255,255,255,0.7)'
    ctx.font = '13px system-ui, sans-serif'
    ctx.fillText(r.verdict.slice(0, 60) + (r.verdict.length > 60 ? '…' : ''), 32, verdictY + 20)

    // Rating badge
    const rating = r.rating || 'D-'
    const ratingColors: Record<string, string> = {
      'S': '#FBBF24', 'A': '#34D399', 'B': '#60A5FA',
      'C': '#A78BFA', 'D': '#F87171', 'F': '#EF4444',
    }
    const ratingColor = ratingColors[rating[0]] || '#F87171'
    ctx.fillStyle = ratingColor + '20'
    roundRect(ctx, W - 120, verdictY - 44, 88, 88, 12)
    ctx.fill()
    ctx.strokeStyle = ratingColor + '60'
    ctx.stroke()
    ctx.fillStyle = ratingColor
    ctx.font = 'bold 44px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(rating, W - 76, verdictY + 16)
    ctx.textAlign = 'left'
    ctx.fillStyle = 'rgba(255,255,255,0.4)'
    ctx.font = '11px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('RATING', W - 76, verdictY + 36)
    ctx.textAlign = 'left'

    // Build stats row
    const statsY = H - 48
    ctx.strokeStyle = 'rgba(255,255,255,0.06)'
    ctx.beginPath()
    ctx.moveTo(32, statsY - 16)
    ctx.lineTo(W - 32, statsY - 16)
    ctx.stroke()

    const stats = [
      `${position} · ${height}`,
      `3PT: ${threePoint}`,
      `BH: ${ballHandle}`,
      `DEF: ${defense}`,
      `Badges: ${selectedBadges.slice(0, 3).join(', ')}${selectedBadges.length > 3 ? '…' : ''}`,
    ]
    ctx.fillStyle = 'rgba(255,255,255,0.4)'
    ctx.font = '11px system-ui, sans-serif'
    let xOffset = 32
    stats.forEach((s, i) => {
      ctx.fillText(s, xOffset, statsY + 4)
      if (i < stats.length - 1) {
        xOffset += ctx.measureText(s).width + 16
        ctx.fillStyle = 'rgba(255,255,255,0.15)'
        ctx.fillText('·', xOffset - 8, statsY + 4)
        ctx.fillStyle = 'rgba(255,255,255,0.4)'
      }
    })

    // courtiq.gg watermark
    ctx.fillStyle = 'rgba(255,255,255,0.2)'
    ctx.font = '11px system-ui, sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText('courtiq.gg', W - 32, H - 16)
    ctx.textAlign = 'left'

    setCardGenerated(true)
  }, [position, height, threePoint, ballHandle, defense, drivingDunk, selectedBadges])

  const downloadCard = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.download = 'courtiq-roast.png'
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  const copyCard = async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.toBlob(async (blob) => {
      if (!blob) return
      try {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
      } catch {
        downloadCard()
      }
    })
  }

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 pb-16">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <Flame className="w-5 h-5 text-orange-400" />
            <span className="text-xs font-semibold text-orange-400 uppercase tracking-wider">Roast Card</span>
          </div>
          <h1 className="text-3xl font-bold text-fg">Build Roast Generator</h1>
          <p className="text-fg-muted mt-1">Get your build roasted by AI. Download the card and share it.</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Build input */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <div className="card p-5 space-y-4">
              <h2 className="font-semibold text-fg">Your Build</h2>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-fg-muted mb-1.5 uppercase tracking-wider">Position</label>
                  <select value={position} onChange={(e) => setPosition(e.target.value)} className="input">
                    {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-fg-muted mb-1.5 uppercase tracking-wider">Height</label>
                  <input type="text" value={height} onChange={(e) => setHeight(e.target.value)} className="input" placeholder='6&apos;4"' />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-fg-muted mb-1.5 uppercase tracking-wider">Build Name (optional)</label>
                <input type="text" value={buildName} onChange={(e) => setBuildName(e.target.value)} className="input" placeholder="e.g. Ankle Breaker 5000" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Three-Point', val: threePoint, set: setThreePoint },
                  { label: 'Ball Handle', val: ballHandle, set: setBallHandle },
                  { label: 'Perimeter D', val: defense, set: setDefense },
                  { label: 'Driving Dunk', val: drivingDunk, set: setDrivingDunk },
                ].map(({ label, val, set }) => (
                  <div key={label}>
                    <label className="block text-xs font-semibold text-fg-muted mb-1.5 uppercase tracking-wider">{label}</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min={25}
                        max={99}
                        value={val}
                        onChange={(e) => set(parseInt(e.target.value))}
                        className="flex-1 accent-rose-500"
                      />
                      <span className="text-sm font-bold text-fg w-8 text-right">{val}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs font-semibold text-fg-muted mb-1.5 uppercase tracking-wider">
                  Badges (up to 6) — {selectedBadges.length}/6
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {BADGES.map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => toggleBadge(b)}
                      className={`chip text-xs cursor-pointer transition-all ${
                        selectedBadges.includes(b)
                          ? 'text-orange-400 border-orange-500/40 bg-orange-500/15'
                          : 'hover:border-white/20'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              {error && <p className="text-sm text-rose-400">{error}</p>}

              <button
                onClick={getRoast}
                disabled={loading}
                className="btn btn-primary w-full gap-2"
                style={{ background: 'linear-gradient(135deg, #EA580C, #DC2626)' }}
              >
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Roasting...</>
                  : <><Flame className="w-4 h-4" /> Roast My Build</>
                }
              </button>
            </div>
          </motion.div>

          {/* Roast result + card */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <AnimatePresence mode="wait">
              {!roast && !loading && (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="card p-8 flex flex-col items-center justify-center text-center h-full min-h-[300px]"
                >
                  <Flame className="w-12 h-12 text-orange-400/40 mb-3" />
                  <p className="text-fg-muted">Enter your build and hit Roast to get flamed by AI.</p>
                  <p className="text-xs text-fg-subtle mt-1">Download the card and post it. Pure comedy.</p>
                </motion.div>
              )}

              {loading && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="card p-8 flex flex-col items-center justify-center text-center h-full min-h-[300px]"
                >
                  <motion.div
                    animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }}
                    transition={{ repeat: Infinity, duration: 0.8 }}
                  >
                    <Flame className="w-12 h-12 text-orange-400 mb-3" />
                  </motion.div>
                  <p className="text-fg-muted">AI is reviewing your build...</p>
                  <p className="text-xs text-fg-subtle mt-1">This may sting.</p>
                </motion.div>
              )}

              {roast && !loading && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-4"
                >
                  <div className="card p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-xs font-semibold text-orange-400 uppercase tracking-wider mb-0.5">AI Nickname</p>
                        <p className="text-xl font-bold text-fg">&ldquo;{roast.nickname}&rdquo;</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-fg-muted mb-0.5">Rating</p>
                        <p className="text-3xl font-black" style={{
                          color: { S: '#FBBF24', A: '#34D399', B: '#60A5FA', C: '#A78BFA', D: '#F87171', F: '#EF4444' }[roast.rating?.[0]] || '#F87171'
                        }}>{roast.rating}</p>
                      </div>
                    </div>

                    <p className="text-sm text-fg-muted mb-3">{roast.roast}</p>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {'🔥'.repeat(Math.min(roast.fire_level, 5)).split('').map((f, i) => (
                        <span key={i} className="text-lg">{f}</span>
                      ))}
                      <span className="text-xs text-fg-muted ml-1">{roast.fire_level}/5 fire</span>
                    </div>

                    <div className="h-px bg-white/5 my-3" />
                    <p className="text-xs text-fg-subtle italic">{roast.verdict}</p>
                  </div>

                  {/* Canvas card */}
                  <div className="card overflow-hidden">
                    <canvas
                      ref={canvasRef}
                      className="w-full"
                      style={{ display: cardGenerated ? 'block' : 'none' }}
                    />
                    {!cardGenerated && (
                      <div className="flex items-center justify-center h-32">
                        <Loader2 className="w-5 h-5 animate-spin text-fg-subtle" />
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button onClick={downloadCard} className="btn btn-primary flex-1 gap-1.5">
                      <Download className="w-4 h-4" /> Download Card
                    </button>
                    <button onClick={copyCard} className="btn btn-secondary gap-1.5">
                      <Share2 className="w-4 h-4" /> Copy
                    </button>
                    <button onClick={getRoast} className="btn btn-secondary gap-1.5">
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs text-fg-subtle text-center">
                    <Sparkles className="w-3 h-3 inline mr-1" />
                    Share on Twitter/TikTok — tag @CourtIQ for a feature
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </AppLayout>
  )
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, lineHeight: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    const test = current ? `${current} ${word}` : word
    if (ctx.measureText(test).width > maxWidth) {
      if (current) lines.push(current)
      current = word
    } else {
      current = test
    }
  }
  if (current) lines.push(current)
  return lines
}
