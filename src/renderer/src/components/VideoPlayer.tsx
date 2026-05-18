import { useEffect, useRef, useCallback } from 'react'
import { useEditorStore } from '../store/editorStore'

export default function VideoPlayer(): JSX.Element {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const {
    videoPath,
    overlays,
    isPlaying,
    trimStart,
    trimEnd,
    currentTime,
    videoDuration,
    setCurrentTime,
    setIsPlaying
  } = useEditorStore()

  // Sync play/pause from store
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    if (isPlaying) {
      v.play().catch(() => setIsPlaying(false))
    } else {
      v.pause()
    }
  }, [isPlaying])

  // Load video when path changes
  useEffect(() => {
    const v = videoRef.current
    if (!v || !videoPath) return
    v.src = `file://${videoPath}`
    v.currentTime = trimStart
  }, [videoPath])

  // Handle time updates — enforce trim bounds
  const handleTimeUpdate = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    const t = v.currentTime
    setCurrentTime(t)

    if (t >= trimEnd) {
      v.pause()
      v.currentTime = trimStart
      setIsPlaying(false)
    }
  }, [trimEnd, trimStart])

  // Canvas overlay render loop
  useEffect(() => {
    const canvas = canvasRef.current
    const video = videoRef.current
    if (!canvas || !video) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const render = (): void => {
      const t = video.currentTime

      // Resize canvas to match video display size
      const container = containerRef.current
      if (container) {
        canvas.width = container.clientWidth
        canvas.height = container.clientHeight
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      for (const ov of overlays) {
        if (t < ov.startTime || t > ov.endTime) continue

        if (ov.type === 'text') {
          const weight = ov.bold ? 'bold' : '400'
          const style = ov.italic ? 'italic' : 'normal'
          ctx.font = `${style} ${weight} ${ov.fontSize}px Inter, sans-serif`

          const x = (ov.x / 100) * canvas.width
          const y = (ov.y / 100) * canvas.height

          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'

          // Shadow
          if (ov.shadow) {
            ctx.shadowColor = 'rgba(0,0,0,0.8)'
            ctx.shadowBlur = 6
            ctx.shadowOffsetX = 2
            ctx.shadowOffsetY = 2
          } else {
            ctx.shadowColor = 'transparent'
            ctx.shadowBlur = 0
            ctx.shadowOffsetX = 0
            ctx.shadowOffsetY = 0
          }

          ctx.fillStyle = ov.color
          ctx.fillText(ov.text, x, y)

          // Reset shadow
          ctx.shadowColor = 'transparent'
          ctx.shadowBlur = 0
        }
      }

      rafRef.current = requestAnimationFrame(render)
    }

    render()
    return () => cancelAnimationFrame(rafRef.current)
  }, [overlays])

  function togglePlay(): void {
    setIsPlaying(!isPlaying)
  }

  function handleSeek(e: React.MouseEvent<HTMLDivElement>): void {
    const v = videoRef.current
    if (!v || !videoPath) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = (e.clientX - rect.left) / rect.width
    const t = trimStart + pct * (trimEnd - trimStart)
    v.currentTime = Math.max(trimStart, Math.min(trimEnd, t))
  }

  const progress = videoDuration > 0 ? ((currentTime - trimStart) / (trimEnd - trimStart)) * 100 : 0

  function fmt(s: number): string {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <div className="video-player">
      <div className="video-container" ref={containerRef}>
        {!videoPath ? (
          <div className="video-empty" onClick={() => window.electronAPI.openVideo().then(async (p) => {
            if (!p) return
            const { setVideoPath } = useEditorStore.getState()
            const meta = await window.electronAPI.getVideoMeta(p)
            setVideoPath(p, meta.duration)
          })}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <polygon points="5 3 19 12 5 21 5 3" stroke="#6366f1" strokeWidth="1.5" strokeLinejoin="round"/>
            </svg>
            <p>Click to open a video</p>
            <span>MP4, MOV, AVI, MKV, WebM</span>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              className="video-el"
              onTimeUpdate={handleTimeUpdate}
              onEnded={() => setIsPlaying(false)}
              playsInline
              muted={false}
            />
            <canvas ref={canvasRef} className="overlay-canvas" />
          </>
        )}
      </div>

      {videoPath && (
        <div className="video-controls">
          <button className="control-btn play-btn" onClick={togglePlay}>
            {isPlaying ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1"/>
                <rect x="14" y="4" width="4" height="16" rx="1"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
            )}
          </button>

          <span className="time-display">{fmt(currentTime)} / {fmt(videoDuration)}</span>

          <div className="progress-bar" onClick={handleSeek}>
            <div className="progress-fill" style={{ width: `${Math.max(0, Math.min(100, progress))}%` }} />
            <div className="progress-head" style={{ left: `${Math.max(0, Math.min(100, progress))}%` }} />
          </div>
        </div>
      )}
    </div>
  )
}
