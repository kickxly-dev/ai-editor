import { useState, useEffect } from 'react'
import { useEditorStore } from '../store/editorStore'

export default function ExportModal(): JSX.Element {
  const [outputPath, setOutputPath] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    videoPath,
    trimStart,
    trimEnd,
    overlays,
    isExporting,
    exportProgress,
    setExporting,
    setShowExport
  } = useEditorStore()

  function close(): void {
    if (isExporting) return
    setShowExport(false)
    setDone(false)
    setError(null)
  }

  async function pickOutput(): Promise<void> {
    const name = videoPath
      ? `${videoPath.split(/[\\/]/).pop()?.replace(/\.[^.]+$/, '')}_edited.mp4`
      : 'export.mp4'
    const p = await window.electronAPI.saveDialog(name)
    if (p) setOutputPath(p)
  }

  async function startExport(): Promise<void> {
    if (!videoPath || !outputPath) return
    setExporting(true, 0)
    setError(null)
    setDone(false)

    const cleanup = window.electronAPI.onExportProgress((pct) => {
      setExporting(true, pct)
    })

    try {
      await window.electronAPI.exportVideo({
        inputPath: videoPath,
        outputPath,
        trimStart,
        trimEnd,
        overlays: overlays.filter((o) => o.type === 'text').map((o) => ({
          text: o.text ?? '',
          startTime: o.startTime,
          endTime: o.endTime,
          x: o.x,
          y: o.y,
          fontSize: o.fontSize ?? 40,
          color: o.color ?? '#ffffff',
          bold: o.bold ?? false,
          shadow: o.shadow ?? true
        }))
      })
      setDone(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      cleanup()
      setExporting(false, 0)
    }
  }

  function fmt(s: number): string {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <div className="modal-backdrop" onClick={close}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Export Video</h2>
          <button className="modal-close" onClick={close}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="modal-body">
          {done ? (
            <div className="export-done">
              <div className="done-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14" stroke="#22c55e" strokeWidth="2" strokeLinecap="round"/>
                  <polyline points="22 4 12 14.01 9 11.01" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p>Export complete!</p>
              <span>{outputPath}</span>
              <button className="btn btn-primary" onClick={close}>Close</button>
            </div>
          ) : (
            <>
              <div className="export-info">
                <div className="export-row">
                  <span>Trim range</span>
                  <strong>{fmt(trimStart)} → {fmt(trimEnd)} ({fmt(trimEnd - trimStart)} total)</strong>
                </div>
                <div className="export-row">
                  <span>Overlays</span>
                  <strong>{overlays.length} overlay{overlays.length !== 1 ? 's' : ''}</strong>
                </div>
                <div className="export-row">
                  <span>Format</span>
                  <strong>MP4 (H.264 + AAC)</strong>
                </div>
              </div>

              <div className="export-output">
                <label>Output file</label>
                <div className="output-row">
                  <span className="output-path">{outputPath ?? 'Not selected'}</span>
                  <button className="btn btn-ghost" onClick={pickOutput}>
                    Browse
                  </button>
                </div>
              </div>

              {error && <div className="export-error">{error}</div>}

              {isExporting && (
                <div className="export-progress-wrap">
                  <div className="export-progress-bar">
                    <div
                      className="export-progress-fill"
                      style={{ width: `${exportProgress}%` }}
                    />
                  </div>
                  <span>{Math.round(exportProgress)}%</span>
                </div>
              )}
            </>
          )}
        </div>

        {!done && (
          <div className="modal-footer">
            <button className="btn btn-ghost" onClick={close} disabled={isExporting}>
              Cancel
            </button>
            <button
              className="btn btn-accent"
              onClick={startExport}
              disabled={isExporting || !outputPath}
            >
              {isExporting ? 'Exporting…' : 'Export'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
