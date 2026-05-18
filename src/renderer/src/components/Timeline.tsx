import { useRef, useCallback } from 'react'
import { useEditorStore } from '../store/editorStore'

export default function Timeline(): JSX.Element {
  const trackRef = useRef<HTMLDivElement>(null)
  const dragging = useRef<'start' | 'end' | 'head' | null>(null)

  const {
    videoDuration,
    trimStart,
    trimEnd,
    currentTime,
    overlays,
    setTrim,
    videoPath
  } = useEditorStore()

  function toPercent(t: number): number {
    if (videoDuration <= 0) return 0
    return (t / videoDuration) * 100
  }

  function fromPercent(pct: number): number {
    return Math.max(0, Math.min(videoDuration, (pct / 100) * videoDuration))
  }

  function getTrackX(e: React.MouseEvent | MouseEvent): number {
    const rect = trackRef.current?.getBoundingClientRect()
    if (!rect) return 0
    return Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100))
  }

  const onMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragging.current) return
      const pct = getTrackX(e)
      const t = fromPercent(pct)

      if (dragging.current === 'start') {
        setTrim(Math.min(t, trimEnd - 0.5), trimEnd)
      } else if (dragging.current === 'end') {
        setTrim(trimStart, Math.max(t, trimStart + 0.5))
      } else if (dragging.current === 'head') {
        const v = document.querySelector('video') as HTMLVideoElement
        if (v) v.currentTime = t
        useEditorStore.getState().setCurrentTime(t)
      }
    },
    [trimStart, trimEnd, videoDuration]
  )

  const onMouseUp = useCallback(() => {
    dragging.current = null
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
  }, [onMouseMove])

  function startDrag(type: 'start' | 'end' | 'head'): void {
    dragging.current = type
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  function handleTrackClick(e: React.MouseEvent<HTMLDivElement>): void {
    if (!videoPath) return
    const pct = getTrackX(e)
    const t = fromPercent(pct)
    const v = document.querySelector('video') as HTMLVideoElement
    if (v) v.currentTime = t
    useEditorStore.getState().setCurrentTime(t)
  }

  function fmt(s: number): string {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const trimStartPct = toPercent(trimStart)
  const trimEndPct = toPercent(trimEnd)
  const headPct = toPercent(currentTime)

  // Build ruler ticks
  const ticks: number[] = []
  if (videoDuration > 0) {
    const step = videoDuration < 30 ? 5 : videoDuration < 120 ? 10 : videoDuration < 600 ? 30 : 60
    for (let t = 0; t <= videoDuration; t += step) {
      ticks.push(t)
    }
  }

  return (
    <div className="timeline">
      {/* Ruler */}
      <div className="timeline-ruler">
        {ticks.map((t) => (
          <div
            key={t}
            className="ruler-tick"
            style={{ left: `${toPercent(t)}%` }}
          >
            <span>{fmt(t)}</span>
          </div>
        ))}
      </div>

      {/* Video track */}
      <div className="timeline-track-row">
        <div className="track-label">Video</div>
        <div className="track-area" ref={trackRef} onClick={handleTrackClick}>
          {/* Dimmed out-of-trim regions */}
          <div className="trim-shadow trim-shadow-left" style={{ width: `${trimStartPct}%` }} />
          <div
            className="trim-shadow trim-shadow-right"
            style={{ left: `${trimEndPct}%`, width: `${100 - trimEndPct}%` }}
          />

          {/* Active clip bar */}
          <div
            className="clip-bar"
            style={{ left: `${trimStartPct}%`, width: `${trimEndPct - trimStartPct}%` }}
          >
            <div className="clip-pattern" />
          </div>

          {/* Trim handles */}
          <div
            className="trim-handle trim-handle-left"
            style={{ left: `${trimStartPct}%` }}
            onMouseDown={(e) => { e.stopPropagation(); startDrag('start') }}
            title="Drag to set in-point"
          >
            <div className="handle-bar" />
            <div className="handle-label">{fmt(trimStart)}</div>
          </div>
          <div
            className="trim-handle trim-handle-right"
            style={{ left: `${trimEndPct}%` }}
            onMouseDown={(e) => { e.stopPropagation(); startDrag('end') }}
            title="Drag to set out-point"
          >
            <div className="handle-bar" />
            <div className="handle-label">{fmt(trimEnd)}</div>
          </div>

          {/* Playhead */}
          <div
            className="playhead"
            style={{ left: `${headPct}%` }}
            onMouseDown={(e) => { e.stopPropagation(); startDrag('head') }}
          >
            <div className="playhead-head" />
            <div className="playhead-line" />
          </div>
        </div>
      </div>

      {/* Overlay tracks */}
      {overlays.length > 0 && (
        <div className="timeline-track-row">
          <div className="track-label">Overlays</div>
          <div className="track-area overlay-track">
            {overlays.map((ov) => (
              <div
                key={ov.id}
                className="overlay-chip"
                style={{
                  left: `${toPercent(ov.startTime)}%`,
                  width: `${toPercent(ov.endTime) - toPercent(ov.startTime)}%`,
                  borderColor: ov.type === 'text' ? ov.color : '#6366f1'
                }}
                title={ov.type === 'text' ? ov.text : ov.id}
              >
                <span className="overlay-chip-label">
                  {ov.type === 'text' ? ov.text : 'overlay'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
